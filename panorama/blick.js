import * as THREE from 'three';
import { provFranEvent, skarmGrader } from '../shared/sensor.js';

const RAD = Math.PI / 180;
const FIX = new THREE.Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2);
const Z_AXEL = new THREE.Vector3(0, 0, 1);
const AXLAR = ['vrida', 'uppner', 'sida'];
// Fartförstärkning: gain = känslighet * (1 + k * |vinkelhastighet|^p), v i rad/s.
const FART_P = 1;

export const STANDARD_STYR = {
  horisont: true,
  axlar: {
    vrida: {lage: 'foljer', kanslighet: 1, fart: 0, utjamning: 0.2},
    uppner: {lage: 'foljer', kanslighet: 1, fart: 0, utjamning: 0.2},
    sida: {lage: 'foljer', kanslighet: 1, fart: 0, utjamning: 0.2}
  }
};

function klamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

export function normalAxel(raw) {
  const lage = raw?.lage === 'rorelse' ? 'rorelse' : 'foljer';
  return {
    lage,
    kanslighet: klamp(Number(raw?.kanslighet) || 1, 0.5, 3),
    fart: klamp(Number(raw?.fart) || 0, 0, 3),
    utjamning: klamp(Number(raw?.utjamning) || 0, 0, 1)
  };
}

export function normalStyr(raw) {
  const axlar = {};
  for (const id of AXLAR) axlar[id] = normalAxel(raw?.axlar?.[id]);
  return {horisont: raw?.horisont !== false, axlar};
}

// Samma kedja som GyroAim.lasOrientering: YXZ, kameran längs -Z, -90° runt X, skärmvinkel runt Z.
// Höger vridning (alpha minskar) tittar åt höger. Inte spegelvänt.
export function skarmVinkel() {
  return skarmGrader(globalThis);
}

export function enhetsKvaternion(alpha, beta, gamma, skarmGrader, q, euler, skarmQ) {
  euler.set(beta * RAD, alpha * RAD, -gamma * RAD, 'YXZ');
  q.setFromEuler(euler).multiply(FIX);
  if (skarmGrader) q.multiply(skarmQ.setFromAxisAngle(Z_AXEL, -skarmGrader * RAD));
  return q;
}

// upp = blick upp, hoger = blick höger, sida = högerkant ned. Radianer.
export function vinklarFranKvaternion(q, euler) {
  euler.setFromQuaternion(q, 'YXZ');
  return {uppner: euler.x, vrida: -euler.y, sida: euler.z};
}

export function kvaternionFranVinklar(v, euler, q) {
  return q.setFromEuler(euler.set(v.uppner || 0, -(v.vrida || 0), v.sida || 0, 'YXZ'));
}

// rotationRate är grader/s. alpha/beta/gamma = x/y/z, samma som skjutbanans gyro.
// Efter skärmens vinkel: upp mot himlen, höger vrider vyn åt höger. Ingen linjär acceleration.
export function hastighetFranRotation(alphaDps, betaDps, gammaDps, skarmGrader) {
  const x = alphaDps * RAD, y = betaDps * RAD, z = gammaDps * RAD;
  const a = (skarmGrader || 0) * RAD, c = Math.cos(a), s = Math.sin(a);
  return {
    uppner: x * c - y * s,
    vrida: x * s + y * c,
    sida: -z
  };
}

export function forstarkning(kanslighet, fartK, rateRadS) {
  const w = Math.abs(rateRadS);
  return kanslighet * (1 + Math.max(0, fartK) * Math.pow(w, FART_P));
}

export function stegaRorelse(vinkel, rateRadS, dt, kanslighet, fartK) {
  if (!(dt > 0) || !Number.isFinite(rateRadS)) return vinkel;
  return vinkel + rateRadS * dt * forstarkning(kanslighet, fartK, rateRadS);
}

export function jamna(visad, mal, dt, utjamning) {
  const tau = Math.max(0, utjamning) * 0.4;
  if (!(tau > 0) || !(dt > 0)) return mal;
  return visad + (mal - visad) * (1 - Math.exp(-dt / tau));
}

function tomVinkel() { return {vrida: 0, uppner: 0, sida: 0}; }

export function sjalvtest() {
  const q = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const skarmQ = new THREE.Quaternion();
  const rel = new THREE.Quaternion();
  const fel = [];
  const krav = (namn, ok) => { if (!ok) fel.push(namn); };
  const kv = (a, b, g, s) => enhetsKvaternion(a, b, g, s, q, euler, skarmQ).clone();
  const jamfor = (noll, nu) => {
    const o = kv(...noll);
    o.invert();
    return vinklarFranKvaternion(rel.multiplyQuaternions(o, kv(...nu)), euler);
  };
  const staende = [0, 90, 0, 0];
  const hoger = jamfor(staende, [-30, 90, 0, 0]);
  const tillbaka = jamfor(staende, [0, 90, 0, 0]);
  const ned = jamfor(staende, [0, 50, 0, 0]);
  const upp = jamfor(staende, [0, 130, 0, 0]);
  const rull = jamfor(staende, [90, 70, -90, 0]);
  krav('följer: höger stannar höger', hoger.vrida > 0.4 && Math.abs(hoger.uppner) < 0.08);
  krav('följer: tillbaka till start', Math.abs(tillbaka.vrida) < 0.02 && Math.abs(tillbaka.uppner) < 0.02);
  krav('följer: toppen ned', ned.uppner < -0.5);
  krav('följer: toppen upp', upp.uppner > 0.5);
  krav('följer: sidlutning', rull.sida > 0.2);

  const land = [90, 0, -90, 90];
  const landJamfor = jamfor(staende, land);
  krav('landskap samma fönster', Math.abs(landJamfor.vrida) < 0.08 && Math.abs(landJamfor.uppner) < 0.08);
  krav('landskap höger', jamfor(land, [60, 0, -90, 90]).vrida > 0.4);

  let yaw = 0;
  const rate = hastighetFranRotation(0, 90, 0, 0).vrida;
  for (let i = 0; i < 10; i++) yaw = stegaRorelse(yaw, rate, 0.05, 1, 0);
  const efterRorelse = yaw;
  for (let i = 0; i < 40; i++) yaw = stegaRorelse(yaw, 0, 0.05, 1, 0);
  krav('fart: integration rör vyn', efterRorelse > 0.3);
  krav('fart: stilla driver inte tillbaka', Math.abs(yaw - efterRorelse) < 1e-6);

  const langsam = stegaRorelse(0, 0.4, 0.5, 1, 0);
  const snabbLinje = stegaRorelse(0, 2, 0.5, 1, 0);
  const snabbKurva = stegaRorelse(0, 2, 0.5, 1, 1.5);
  krav('fartförstärkning lämnar långsam rörelse nästan linjär', Math.abs(stegaRorelse(0, 0.4, 0.5, 1, 1.5) / langsam - (1 + 1.5 * 0.4)) < 0.05);
  krav('fartförstärkning ger mer vid snabb vridning', snabbKurva > snabbLinje * 1.5);

  const bland = normalStyr({axlar: {vrida: {lage: 'rorelse', kanslighet: 2, fart: 0, utjamning: 0}, uppner: {lage: 'foljer', kanslighet: 1}}});
  krav('lägen är skilda per axel', bland.axlar.vrida.lage === 'rorelse' && bland.axlar.uppner.lage === 'foljer' && bland.axlar.sida.lage === 'foljer');
  krav('känslighet kläms', normalAxel({kanslighet: 9}).kanslighet === 3);

  const duk = {addEventListener() {}};
  const blick = skapaBlick(duk, {lyssna: false});
  const nollUtj = normalStyr(STANDARD_STYR);
  for (const id of AXLAR) nollUtj.axlar[id].utjamning = 0;
  blick.satt(nollUtj);
  blick.mata(0, 90, 0);
  blick.uppdatera(0.05);
  const malVy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.45);
  blick.taEmot(malVy);
  const efterEmot = blick.uppdatera(0.05).clone();
  krav('ta emot vyn utan hopp', efterEmot.angleTo(malVy) < 0.03);
  blick.mata(-10, 90, 0);
  const efterTio = blick.uppdatera(0.05).clone();
  const steg = efterEmot.angleTo(efterTio);
  krav('ta emot följer sedan 10°', steg > 0.14 && steg < 0.22);
  return fel;
}

export function skapaBlick(canvas, val = {}) {
  const raw = new THREE.Quaternion();
  const origin = new THREE.Quaternion();
  const relativ = new THREE.Quaternion();
  const malQ = new THREE.Quaternion();
  const visadQ = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const skarmQ = new THREE.Quaternion();
  const dragEuler = new THREE.Euler();
  let styr = normalStyr(STANDARD_STYR);
  let aktiv = false;
  let fickVinkel = false;
  let fickFart = false;
  let vantarNoll = true;
  let snappa = true;
  let senastVinkel = 0;
  let foreFartTid = null;
  let senastSkarm = null;
  const foreRaw = new THREE.Quaternion();
  const integrerad = tomVinkel();
  const visad = tomVinkel();
  const drag = {x: 0, y: 0};
  const RAD_PER_PX = 0.0048;
  let formaFn = null;

  function lasVinkel(alpha, beta, gamma) {
    if (globalThis.document?.hidden) { foreFartTid = null; return; }
    const skarm = skarmVinkel();
    const hade = fickVinkel && !vantarNoll;
    const foreSkarm = senastSkarm;
    const sparad = foreRaw.clone();
    enhetsKvaternion(alpha, beta, gamma, skarm, raw, euler, skarmQ);
    senastVinkel = performance.now();
    fickVinkel = true;
    if (vantarNoll) {
      nollstall();
      senastSkarm = skarm;
      foreRaw.copy(raw);
      return;
    }
    // Skärmbyte ingår i kvaternionen. Behåll vyn, så landskap inte snurrar världen.
    if (hade && foreSkarm != null && skarm !== foreSkarm) {
      relativ.multiplyQuaternions(origin, sparad).normalize();
      origin.copy(relativ).multiply(skarmQ.copy(raw).invert()).normalize();
    }
    senastSkarm = skarm;
    foreRaw.copy(raw);
  }

  function lasFart(alphaDps, betaDps, gammaDps, timeStamp) {
    if (globalThis.document?.hidden) { foreFartTid = null; return; }
    if (![alphaDps, betaDps, gammaDps].every(Number.isFinite)) return;
    const t = Number.isFinite(timeStamp) ? timeStamp : performance.now();
    const dt = foreFartTid == null ? 0 : (t - foreFartTid) / 1000;
    foreFartTid = t;
    fickFart = true;
    if (!(dt > 0) || dt > 0.25) return;
    const h = hastighetFranRotation(alphaDps, betaDps, gammaDps, skarmVinkel());
    for (const id of AXLAR) {
      if (styr.axlar[id].lage !== 'rorelse') continue;
      if (id === 'sida' && styr.horisont) continue;
      const ax = styr.axlar[id];
      integrerad[id] = stegaRorelse(integrerad[id], h[id], dt, ax.kanslighet, ax.fart);
    }
  }

  if (val.lyssna !== false && typeof addEventListener === 'function') {
    addEventListener('deviceorientation', e => {
      const prov = provFranEvent(e);
      if (!prov) return;
      lasVinkel(prov.alpha, prov.beta, prov.gamma);
    }, {passive: true});
    addEventListener('devicemotion', e => {
      const rr = e.rotationRate;
      if (!rr) return;
      lasFart(rr.alpha, rr.beta, rr.gamma, e.timeStamp);
    }, {passive: true});
  }

  let pekare = null;
  let sen = null;
  canvas.addEventListener('pointerdown', e => {
    if (e.target !== canvas) return;
    pekare = e.pointerId;
    sen = [e.clientX, e.clientY];
    try { canvas.setPointerCapture(pekare); } catch (err) { /* pekaren kan hinna släppas */ }
  });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerId !== pekare || !sen || harGyro()) return;
    drag.x -= (e.clientX - sen[0]) * RAD_PER_PX;
    drag.y -= (e.clientY - sen[1]) * RAD_PER_PX;
    drag.y = klamp(drag.y, -1.45, 1.45);
    sen = [e.clientX, e.clientY];
  });
  const slut = e => { if (!e || e.pointerId === pekare) { pekare = null; sen = null; } };
  canvas.addEventListener('pointerup', slut);
  canvas.addEventListener('pointercancel', slut);

  function harGyro() { return aktiv && (fickVinkel || fickFart); }

  function nollstall() {
    if (fickVinkel) {
      origin.copy(raw).invert();
      vantarNoll = false;
    } else vantarNoll = true;
    for (const id of AXLAR) integrerad[id] = visad[id] = 0;
    drag.x = 0;
    drag.y = 0;
    snappa = true;
  }

  // Behåll den vy som redan syns, så ett lägesbyte inte hoppar.
  // Telefonens nästa rörelse räknas från pose som ger qMal just nu.
  function taEmot(qMal) {
    const v = vinklarFranKvaternion(qMal, euler);
    const sida = styr.horisont ? 0 : v.sida;
    const vis = {uppner: v.uppner, vrida: v.vrida, sida};
    for (const id of AXLAR) {
      visad[id] = vis[id];
      integrerad[id] = vis[id];
    }
    if (fickVinkel) {
      const just = {
        uppner: vis.uppner / (styr.axlar.uppner.kanslighet || 1),
        vrida: vis.vrida / (styr.axlar.vrida.kanslighet || 1),
        sida: sida / (styr.axlar.sida.kanslighet || 1)
      };
      kvaternionFranVinklar(just, euler, malQ);
      origin.copy(malQ).multiply(relativ.copy(raw).invert());
      vantarNoll = false;
    }
    if (!harGyro()) {
      drag.y = v.uppner;
      drag.x = -v.vrida;
    }
    snappa = true;
  }

  async function start() {
    const tillat = T => {
      try {
        return typeof T?.requestPermission === 'function' ? T.requestPermission() : Promise.resolve(T ? 'granted' : 'unavailable');
      } catch (e) { return Promise.reject(e); }
    };
    const orientering = tillat(window.DeviceOrientationEvent);
    const rorelse = tillat(window.DeviceMotionEvent);
    const [a, b] = await Promise.allSettled([orientering, rorelse]);
    const ov = a.status === 'fulfilled' ? a.value : 'denied';
    aktiv = ov === 'granted' || ov === 'unavailable';
    nollstall();
    return {
      orientation: a.status === 'fulfilled' ? a.value : 'denied',
      motion: b.status === 'fulfilled' ? b.value : 'denied'
    };
  }

  function malVinklar(dt) {
    const abs = fickVinkel ? vinklarFranKvaternion(relativ.multiplyQuaternions(origin, raw), euler) : tomVinkel();
    const ut = {};
    for (const id of AXLAR) {
      const ax = styr.axlar[id];
      let v = ax.lage === 'rorelse' ? integrerad[id] : abs[id] * ax.kanslighet;
      if (formaFn) v = formaFn(id, v, abs[id], dt || 0);
      ut[id] = v;
    }
    if (styr.horisont) ut.sida = 0;
    return ut;
  }

  function uppdatera(dt) {
    if (!harGyro()) {
      const q = malQ.identity();
      if (drag.x || drag.y) q.setFromEuler(dragEuler.set(drag.y, drag.x, 0, 'YXZ'));
      if (snappa) { visadQ.copy(q); snappa = false; }
      else {
        const tau = 0.08;
        visadQ.slerp(q, 1 - Math.exp(-Math.min(dt, 0.05) / tau));
      }
      return visadQ;
    }
    const mal = malVinklar(dt);
    for (const id of AXLAR) {
      visad[id] = snappa ? mal[id] : jamna(visad[id], mal[id], dt, styr.axlar[id].utjamning);
    }
    snappa = false;
    return kvaternionFranVinklar(visad, euler, visadQ);
  }

  return {
    start, nollstall, uppdatera,
    get styr() { return styr; },
    get rak() { return styr.horisont; },
    set rak(v) { styr = normalStyr({...styr, horisont: !!v}); },
    satt(nasta) { styr = normalStyr(nasta); },
    setForma(fn) { formaFn = typeof fn === 'function' ? fn : null; },
    get harGyro() { return harGyro(); },
    get senast() { return senastVinkel; },
    taEmot,
    mata(alpha, beta, gamma) { aktiv = true; lasVinkel(alpha, beta, gamma); },
    mataFart(alphaDps, betaDps, gammaDps, dt) {
      aktiv = true;
      lasFart(alphaDps, betaDps, gammaDps, (foreFartTid || 0) + dt * 1000);
    },
    vinklar() { return {uppner: visad.uppner, vrida: visad.vrida, sida: visad.sida}; },
    mus() { return {x: drag.x, y: drag.y}; },
    dra(px, py) {
      if (harGyro()) return false;
      drag.x -= (Number(px) || 0) * RAD_PER_PX;
      drag.y = klamp(drag.y - (Number(py) || 0) * RAD_PER_PX, -1.45, 1.45);
      return true;
    }
  };
}
