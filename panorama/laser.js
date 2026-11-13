import * as THREE from 'three';
import {enhetsKvaternion, kvaternionFranVinklar, skarmVinkel, vinklarFranKvaternion} from './blick.js?v=8';

const RAD = Math.PI / 180;
const GRAD = 180 / Math.PI;
const FARG = /^#[0-9a-fA-F]{6}$/;
const AXEL_ID = ['vrida', 'uppner', 'sida'];
const LAGEN = ['position', 'fart', 'rorelse', 'av'];
// Utslag som ger full joystickfart vid känslighet 1.
const FULL_UTSLAG = 35 * RAD;
// Extra vinkel (rad) per rad/s² och enhet på accelerationsreglaget.
const ACCEL_K = 0.005;
const ACCEL_TAK = 0.35;
const MATARE_FULL = 25;
const SKAK_K = 0.02;
const SKAK_TAK = 16;

// Förstärkning 1 betyder att telefonens vridning och vyns vridning är samma vinkel.
const STANDARD_AXEL = {
  lage: 'position',
  kanslighet: 1,
  maxfart: 90,
  kurva: 'kvadrat',
  slapp: false,
  fartgrans: 40,
  accel: 0,
  skak: 0
};

export const STANDARD_LASER = {
  pa: false,
  matcha: true,
  fov: 50,
  utjamning: 0.15,
  dodzon: 0.3,
  lasRoll: true,
  prick: 9,
  farg: '#ff1a1a',
  strale: false,
  sikte: 'prick',
  zoom: 2,
  ljud: true,
  volym: 0.85,
  vibrera: true,
  vibrStyrka: 0.7,
  vibrKansl: 1,
  klick: true
};

function klamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

function normalAxel(raw, fallbackK) {
  const bas = STANDARD_AXEL;
  const lage = LAGEN.includes(raw?.lage) ? raw.lage : bas.lage;
  const kandidat = Number.isFinite(+raw?.kanslighet) ? +raw.kanslighet : fallbackK;
  return {
    lage,
    kanslighet: klamp(Number.isFinite(kandidat) ? kandidat : bas.kanslighet, 0.1, 6),
    maxfart: klamp(Number.isFinite(+raw?.maxfart) ? +raw.maxfart : bas.maxfart, 10, 240),
    kurva: raw?.kurva === 'linjar' ? 'linjar' : 'kvadrat',
    slapp: raw?.slapp === true,
    fartgrans: klamp(Number.isFinite(+raw?.fartgrans) ? +raw.fartgrans : bas.fartgrans, 5, 180),
    accel: klamp(Number.isFinite(+raw?.accel) ? +raw.accel : bas.accel, 0, 3),
    skak: klamp(Number.isFinite(+raw?.skak) ? +raw.skak : bas.skak, 0, 3)
  };
}

export function normalLaser(raw) {
  const bas = STANDARD_LASER;
  const farg = typeof raw?.farg === 'string' && FARG.test(raw.farg) ? raw.farg.toLowerCase() : bas.farg;
  const harAxlar = !!raw?.axlar && typeof raw.axlar === 'object';
  // Äldre sparningar har en gemensam förstärkning, 0,5–3. Den blir känslighet på alla axlar.
  const arv = Number.isFinite(+raw?.forstarkning) ? klamp(+raw.forstarkning, 0.1, 6) : 1;
  const fallback = harAxlar ? 1 : arv;
  const axlar = {};
  for (const id of AXEL_ID) axlar[id] = normalAxel(raw?.axlar?.[id], fallback);
  return {
    pa: raw?.pa === true,
    matcha: raw?.matcha !== false,
    fov: klamp(Number.isFinite(+raw?.fov) ? +raw.fov : bas.fov, 8, 100),
    utjamning: klamp(Number.isFinite(+raw?.utjamning) ? +raw.utjamning : bas.utjamning, 0, 1),
    dodzon: klamp(Number.isFinite(+raw?.dodzon) ? +raw.dodzon : bas.dodzon, 0, 3),
    lasRoll: raw?.lasRoll !== false,
    prick: prickVarde(raw, bas),
    farg,
    strale: raw?.strale === true,
    sikte: raw?.sikte === 'kikare' ? 'kikare' : 'prick',
    zoom: klamp(Number.isFinite(+raw?.zoom) ? +raw.zoom : bas.zoom, 1, 6),
    ljud: raw?.ljud !== false,
    volym: klamp(Number.isFinite(+raw?.volym) ? +raw.volym : bas.volym, 0, 1),
    vibrera: raw?.vibrera !== false,
    vibrStyrka: klamp(Number.isFinite(+raw?.vibrStyrka) ? +raw.vibrStyrka : bas.vibrStyrka, 0.15, 1),
    vibrKansl: klamp(Number.isFinite(+raw?.vibrKansl) ? +raw.vibrKansl : bas.vibrKansl, 0.4, 2.5),
    klick: raw?.klick !== false,
    axlar
  };
}

// Äldre sparning utan siktesval hade 22 px som standard. Den blir den lilla pricken en gång.
function prickVarde(raw, bas) {
  const angiven = Number.isFinite(+raw?.prick) ? Math.round(+raw.prick) : null;
  const gammalStandard = raw?.sikte == null && angiven === 22;
  const vald = gammalStandard ? bas.prick : (angiven == null ? bas.prick : angiven);
  return klamp(vald, 6, 56);
}

// Kikarsiktet delar basens synfält med zoom. Prickläget lämnar synfältet orört.
export function effektivFov(bas, install) {
  const b = Number.isFinite(+bas) ? +bas : 68;
  const z = install?.sikte === 'kikare' ? klamp(Number(install.zoom) || 1, 1, 6) : 1;
  return klamp(b / z, 4, 100);
}

function sammaKanslighet(install) {
  const k = install.axlar.vrida.kanslighet;
  return AXEL_ID.every(id => {
    const ax = install.axlar[id];
    return ax.lage === 'position' && !(ax.accel > 0) && Math.abs(ax.kanslighet - k) < 1e-4;
  });
}

export function appliceraForval(raw, id) {
  const n = normalLaser(raw);
  const alla = del => {
    for (const nyckel of AXEL_ID) n.axlar[nyckel] = normalAxel({...n.axlar[nyckel], ...del}, 1);
  };
  if (id === 'fonster') {
    alla({lage: 'position', kanslighet: 1, accel: 0, skak: 0, slapp: false});
    n.matcha = true;
  } else if (id === 'joystick') {
    alla({lage: 'fart', kanslighet: 1, maxfart: 90, kurva: 'kvadrat', accel: 0, skak: 0});
  } else if (id === 'mus') {
    alla({lage: 'rorelse', kanslighet: 1, slapp: true, fartgrans: 40, accel: 0, skak: 0});
  } else if (id === 'fin') {
    alla({lage: 'position', kanslighet: 2.5, accel: 0, skak: 0, slapp: false});
    n.dodzon = 0;
    n.utjamning = 0.05;
  }
  return n;
}

function lagg(fore, mal, dt, tau) {
  if (!(dt > 0)) return mal;
  const a = 1 - Math.exp(-dt / tau);
  return fore + (mal - fore) * a;
}

function tomKin() {
  return {har: false, fore: 0, bas: 0, omega: 0, accel: 0, jerk: 0, extra: 0};
}

function nollKin(s) {
  s.har = false;
  s.fore = 0;
  s.bas = 0;
  s.omega = 0;
  s.accel = 0;
  s.jerk = 0;
  s.extra = 0;
}

// Uppdaterar fart, acceleration och ryck. Första provet och luckor ger ingen stegdifferens.
function stegaKinematik(s, inRad, dt) {
  if (!s.har || !(dt > 0) || dt >= 0.25) {
    s.har = true;
    s.fore = inRad;
    s.omega = 0;
    s.accel = 0;
    s.jerk = 0;
    return 0;
  }
  let d = inRad - s.fore;
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  const omegaNy = lagg(s.omega, d / dt, dt, 0.04);
  const accelNy = lagg(s.accel, (omegaNy - s.omega) / dt, dt, 0.045);
  const jerkNy = lagg(s.jerk, (accelNy - s.accel) / dt, dt, 0.05);
  s.fore = inRad;
  s.omega = omegaNy;
  s.accel = accelNy;
  s.jerk = jerkNy;
  return d;
}

// Extra utslag bara medan farten ökar. Det klingar av när accelerationen tar slut.
function raknaExtra(s, ax, dt) {
  const dtS = dt > 0 && dt < 0.25 ? dt : 0.016;
  let mal = 0;
  if (ax.lage !== 'av' && ax.accel > 0 && s.accel * s.omega > 0) {
    mal = klamp(ax.accel * s.accel * ACCEL_K, -ACCEL_TAK, ACCEL_TAK);
  }
  s.extra = lagg(s.extra, mal, dtS, 0.08);
  return s.extra;
}

// Position: vinkeln är vyn. Fart: utslag ger fortsatt fart. Mus: bara ändringen räknas.
function stegaAxel(s, inRad, dt, ax, dodzonRad) {
  const fore = s.har ? s.fore : inRad;
  const d = stegaKinematik(s, inRad, dt);
  const extra = raknaExtra(s, ax, dt);
  if (ax.lage === 'av') {
    s.bas = 0;
    return 0;
  }
  if (ax.lage === 'position') {
    s.bas = inRad * ax.kanslighet;
    return s.bas + extra;
  }
  const dtS = dt > 0 && dt < 0.25 ? dt : 0;
  if (ax.lage === 'fart') {
    const v = Math.abs(inRad) < dodzonRad ? 0 : inRad * ax.kanslighet;
    let x = klamp(v / FULL_UTSLAG, -1, 1);
    if (ax.kurva !== 'linjar') x = Math.sign(x) * x * x;
    if (dtS) s.bas += x * ax.maxfart * RAD * dtS;
    return s.bas + extra;
  }
  if (d) {
    const fart = dtS ? Math.abs(d) / dtS : Infinity;
    const motNoll = Math.abs(inRad) + 1e-5 < Math.abs(fore);
    const glitch = Math.abs(d) > 2.2;
    const slapp = ax.slapp && motNoll && fart <= ax.fartgrans * RAD;
    if (!glitch && !slapp) s.bas += d * ax.kanslighet;
  }
  return s.bas + extra;
}

// Håller integreringen i fas med 1:1-vägen, så ett lägesbyte inte hoppar.
function foljBara(s, inRad, dt, kanslighet) {
  stegaKinematik(s, inRad, dt);
  s.bas = inRad * kanslighet;
  s.extra = 0;
}

// CSS-pixlar gånger ungefärlig punkttäthet. Nutida iPhone ligger på 460, äldre på 326.
export function uppskattaPpi(cssKort, cssLang, dpr) {
  const d = Number(dpr) || 1;
  const kort = Number(cssKort) || 0;
  if (d >= 2 && kort >= 700) return 264;
  if (d >= 2.5 && kort >= 300 && kort <= 560) return 460;
  if (d >= 1.8 && d <= 2.2 && kort >= 300 && kort <= 450) return 326;
  return Math.max(120, Math.round(160 * d));
}

// Vertikalt synfält så skärmen täcker samma vinkel som ett fönster på avstandM.
export function matchaFonsterFov(opts = {}) {
  const avstand = Number(opts.avstandM) > 0 ? Number(opts.avstandM) : 0.35;
  const harFonster = typeof globalThis.innerWidth === 'number' && globalThis.innerWidth > 0;
  const cssBredd = Number.isFinite(opts.cssBredd) ? opts.cssBredd : (harFonster ? globalThis.innerWidth : 390);
  const cssHojd = Number.isFinite(opts.cssHojd) ? opts.cssHojd : (harFonster ? globalThis.innerHeight : 844);
  const dpr = Number.isFinite(opts.dpr) ? opts.dpr : (typeof globalThis.devicePixelRatio === 'number' ? globalThis.devicePixelRatio : 3);
  const kort = Number.isFinite(opts.cssKort) ? opts.cssKort : Math.min(cssBredd, cssHojd);
  const ppi = Number.isFinite(opts.ppi) ? opts.ppi : uppskattaPpi(kort, Math.max(cssBredd, cssHojd), dpr);
  const meterPerCss = (dpr / Math.max(1, ppi)) * 0.0254;
  const vertikalM = Math.max(0.01, cssHojd) * meterPerCss;
  return 2 * Math.atan((vertikalM / 2) / avstand) * GRAD;
}

const _axel = new THREE.Vector3();

// Skala rotationsvinkeln kring samma axel. Gain 1 lämnar kvaternionen orörd.
export function skalaRotation(q, gain, ut) {
  if (!(gain > 0)) return ut.identity();
  if (Math.abs(gain - 1) < 1e-6) return ut.copy(q);
  let w = q.w;
  let x = q.x, y = q.y, z = q.z;
  if (w < 0) { w = -w; x = -x; y = -y; z = -z; }
  w = Math.min(1, w);
  const vinkel = 2 * Math.acos(w);
  if (vinkel < 1e-7) return ut.identity();
  _axel.set(x, y, z);
  const len = _axel.length();
  if (len < 1e-8) return ut.identity();
  _axel.multiplyScalar(1 / len);
  return ut.setFromAxisAngle(_axel, vinkel * gain);
}

const _fram = new THREE.Vector3();
const _bak = new THREE.Vector3();
const _hoger = new THREE.Vector3();
const _upp = new THREE.Vector3();
const _mat = new THREE.Matrix4();
const _varldUpp = new THREE.Vector3(0, 1, 0);

// Ta bort vridning runt siktlinjen så horisonten ligger kvar. Pekriktningen behålls.
// minne är en Vector3 som bär senaste stabila högerledet genom zenit.
export function utanRoll(q, ut, minne) {
  _fram.set(0, 0, -1).applyQuaternion(q);
  if (_fram.lengthSq() < 1e-12) _fram.set(0, 0, -1);
  _fram.normalize();
  _bak.copy(_fram).negate();
  _hoger.crossVectors(_varldUpp, _bak);
  if (_hoger.lengthSq() < 1e-6) {
    _hoger.copy(minne || _axel.set(1, 0, 0));
    _hoger.y = 0;
    if (_hoger.lengthSq() < 1e-6) _hoger.set(1, 0, 0);
  }
  _hoger.normalize();
  if (minne) minne.copy(_hoger);
  _upp.crossVectors(_bak, _hoger).normalize();
  _hoger.crossVectors(_upp, _bak).normalize();
  _mat.makeBasis(_hoger, _upp, _bak);
  return ut.setFromRotationMatrix(_mat);
}

function euroAlfa(cutoff, dt) {
  const tau = 1 / (2 * Math.PI * Math.max(0.05, cutoff));
  return 1 / (1 + tau / Math.max(dt, 1e-4));
}

// One Euro på kvaternion. u = 0 används inte: anroparen hoppar över filtret.
export function skapaEuro() {
  const prev = new THREE.Quaternion();
  let har = false;
  let fart = 0;
  function noll() { har = false; fart = 0; }
  function filtrera(mal, dt, u, ut) {
    if (!(u > 0) || !har || !(dt > 0)) {
      har = true;
      prev.copy(mal);
      fart = 0;
      return ut.copy(mal);
    }
    const t = Math.min(1, Math.max(0, u));
    const minCutoff = 7 - t * 6.6;
    const beta = 0.3 + t * 1.2;
    const rate = prev.angleTo(mal) / dt;
    const aD = euroAlfa(1, dt);
    fart = aD * rate + (1 - aD) * fart;
    const a = Math.min(1, euroAlfa(minCutoff + beta * fart, dt));
    prev.slerp(mal, a);
    return ut.copy(prev);
  }
  return {noll, filtrera};
}

// Håll kvar vyn tills siktet rört sig minst `grader`. Större steg följs exakt.
export function skapaDodzon() {
  const vila = new THREE.Quaternion();
  let har = false;
  function noll() { har = false; }
  function tillampa(mal, grader, ut) {
    if (!(grader > 0)) {
      har = true;
      vila.copy(mal);
      return ut.copy(mal);
    }
    if (!har) {
      har = true;
      vila.copy(mal);
      return ut.copy(mal);
    }
    if (vila.angleTo(mal) < grader * RAD) return ut.copy(vila);
    vila.copy(mal);
    return ut.copy(mal);
  }
  return {noll, tillampa};
}

export function skapaLaser(val = {}) {
  const raw = new THREE.Quaternion();
  const origin = new THREE.Quaternion();
  const relativ = new THREE.Quaternion();
  const skalad = new THREE.Quaternion();
  const filtrerad = new THREE.Quaternion();
  const hallen = new THREE.Quaternion();
  const komb = new THREE.Quaternion();
  const visad = new THREE.Quaternion();
  const bas = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const skarmQ = new THREE.Quaternion();
  const minneHoger = new THREE.Vector3(1, 0, 0);
  const euro = skapaEuro();
  const dod = skapaDodzon();
  const kin = {vrida: tomKin(), uppner: tomKin(), sida: tomKin()};
  let install = normalLaser(STANDARD_LASER);
  let fick = false;
  let vantarNoll = true;
  let behollVy = false;
  let vag = '';

  function las(alpha, beta, gamma, skarm) {
    const vinkel = Number.isFinite(skarm) ? skarm : skarmVinkel();
    enhetsKvaternion(alpha, beta, gamma, vinkel, raw, euler, skarmQ);
    fick = true;
    if (!vantarNoll) return;
    if (behollVy) {
      origin.copy(raw).invert();
      vantarNoll = false;
      return;
    }
    nollstall();
  }

  function nollInre() {
    euro.noll();
    dod.noll();
    vag = '';
    for (const id of AXEL_ID) nollKin(kin[id]);
    minneHoger.set(1, 0, 0);
    visad.identity();
  }

  function nollstall() {
    if (fick) {
      origin.copy(raw).invert();
      vantarNoll = false;
    } else vantarNoll = true;
    bas.identity();
    behollVy = false;
    nollInre();
  }

  // Nuvarande bild blir utgångsläge. Telefonen som den hålls nu ändrar inte vyn förrän den rör sig.
  function behall(vyQ) {
    bas.copy(vyQ);
    behollVy = true;
    if (fick) {
      origin.copy(raw).invert();
      vantarNoll = false;
    } else vantarNoll = true;
    euro.noll();
    dod.noll();
    vag = '';
    for (const id of AXEL_ID) nollKin(kin[id]);
    _hoger.set(1, 0, 0).applyQuaternion(vyQ);
    _hoger.y = 0;
    if (_hoger.lengthSq() > 1e-6) minneHoger.copy(_hoger).normalize();
    else minneHoger.set(1, 0, 0);
    visad.copy(vyQ);
  }

  function byteVag(namn) {
    if (vag === namn) return;
    vag = namn;
    euro.noll();
    dod.noll();
  }

  function lasVinklar(q) {
    const v = vinklarFranKvaternion(q, euler);
    return {vrida: v.vrida, uppner: v.uppner, sida: v.sida};
  }

  function visa(q) {
    komb.copy(q).multiply(bas);
    if (install.lasRoll) utanRoll(komb, visad, minneHoger);
    else visad.copy(komb);
    return visad;
  }

  function uppdatera(dt) {
    const dtS = Math.min(Math.max(dt || 0, 0), 0.05);
    if (!fick || vantarNoll) {
      if (install.lasRoll) return utanRoll(bas, visad, minneHoger);
      return visad.copy(bas);
    }
    relativ.multiplyQuaternions(origin, raw);
    const direkt = lasVinklar(relativ);
    if (sammaKanslighet(install)) {
      byteVag('lika');
      const k = install.axlar.vrida.kanslighet;
      for (const id of AXEL_ID) foljBara(kin[id], direkt[id], dtS, k);
      skalaRotation(relativ, k, skalad);
      if (!(install.utjamning > 0)) {
        euro.noll();
        filtrerad.copy(skalad);
      } else euro.filtrera(skalad, dtS, install.utjamning, filtrerad);
      dod.tillampa(filtrerad, install.dodzon, hallen);
      return visa(hallen);
    }
    byteVag('axlar');
    if (!(install.utjamning > 0)) {
      euro.noll();
      filtrerad.copy(relativ);
    } else euro.filtrera(relativ, dtS, install.utjamning, filtrerad);
    dod.tillampa(filtrerad, install.dodzon, hallen);
    const v = lasVinklar(hallen);
    const ut = {};
    const dodzonRad = install.dodzon * RAD;
    for (const id of AXEL_ID) ut[id] = stegaAxel(kin[id], v[id], dtS, install.axlar[id], dodzonRad);
    kvaternionFranVinklar(ut, euler, skalad);
    return visa(skalad);
  }

  function skakPx() {
    let e = 0;
    for (const id of AXEL_ID) {
      const ax = install.axlar[id];
      if (ax.lage === 'av' || !(ax.skak > 0)) continue;
      e += Math.abs(kin[id].jerk) * ax.skak;
    }
    return Math.min(SKAK_TAK, e * SKAK_K);
  }

  if (val.lyssna !== false && typeof addEventListener === 'function') {
    addEventListener('deviceorientation', e => {
      if (![e.alpha, e.beta, e.gamma].every(Number.isFinite)) return;
      las(e.alpha, e.beta, e.gamma);
    }, {passive: true});
  }

  return {
    nollstall, behall, uppdatera, skakPx,
    mata: las,
    get install() { return install; },
    satt(nasta) { install = normalLaser(nasta); },
    get fick() { return fick; },
    matare() {
      const ut = {};
      for (const id of AXEL_ID) ut[id] = Math.min(1, Math.abs(kin[id].accel) / MATARE_FULL);
      ut.skak = skakPx();
      return ut;
    }
  };
}

function fram(q, ut) { return ut.set(0, 0, -1).applyQuaternion(q); }

export function sjalvtest() {
  const fel = [];
  const krav = (namn, ok) => { if (!ok) fel.push(namn); };
  const q = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const skarmQ = new THREE.Quaternion();
  const a = new THREE.Quaternion();
  const b = new THREE.Quaternion();
  const enhet = (alpha, beta, gamma, skarm = 0) => enhetsKvaternion(alpha, beta, gamma, skarm, q, euler, skarmQ).clone();
  const id = new THREE.Quaternion();
  const minne = new THREE.Vector3(1, 0, 0);
  const f1 = new THREE.Vector3();
  const f2 = new THREE.Vector3();

  const sta = enhet(0, 90, 0, 0);
  const tio = enhet(-10, 90, 0, 0);
  const rel = sta.clone().invert().multiply(tio);
  skalaRotation(rel, 1, a);
  skalaRotation(rel, 2, b);
  krav('10° med telefonen är 10° i vyn', Math.abs(a.angleTo(id) * GRAD - 10) < 0.05);
  krav('förstärkning 2 ger 20°', Math.abs(b.angleTo(id) * GRAD - 20) < 0.05);
  krav('förstärkning 0,5 ger 5°', Math.abs(skalaRotation(rel, 0.5, q).angleTo(id) * GRAD - 5) < 0.05);
  krav('tillbaka till samma håll är noll', sta.clone().invert().multiply(sta).angleTo(id) < 1e-6);

  const land0 = enhet(90, 0, -90, 90);
  const land1 = enhet(80, 0, -90, 90);
  const landRel = land0.clone().invert().multiply(land1);
  krav('landskap: 10° är 10°', Math.abs(landRel.angleTo(id) * GRAD - 10) < 0.05);

  const upp = sta.clone().invert().multiply(enhet(0, 130, 0, 0));
  krav('toppen upp är 40°', Math.abs(upp.angleTo(id) * GRAD - 40) < 0.05);

  const ren = new THREE.Quaternion();
  const rullad = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 30 * RAD);
  utanRoll(rullad, ren, minne);
  krav('ren sidolutning tas bort', ren.angleTo(id) < 0.01);
  const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 40 * RAD);
  const bland = yaw.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 25 * RAD));
  utanRoll(bland, ren, minne.set(1, 0, 0));
  fram(bland, f1);
  fram(ren, f2);
  const hogerY = new THREE.Vector3(1, 0, 0).applyQuaternion(ren).y;
  krav('lås behåller pekriktningen', f1.angleTo(f2) < 0.01);
  krav('låst horisont har rakt högerled', Math.abs(hogerY) < 0.02);
  krav('lås lämnar girningen', ren.angleTo(yaw) < 0.02);

  const pose = sta.clone().invert().multiply(enhet(90, 70, -90, 0));
  utanRoll(pose, ren, minne.set(1, 0, 0));
  fram(pose, f1);
  fram(ren, f2);
  krav('telefonens lutning låses utan att flytta siktet', f1.angleTo(f2) < 0.01 && Math.abs(new THREE.Vector3(1, 0, 0).applyQuaternion(ren).y) < 0.02);

  const z0 = sta.clone().invert().multiply(enhet(0, 179, 0, 0));
  const z1 = sta.clone().invert().multiply(enhet(0, 181, 0, 0));
  const eulerA = vinklarFranKvaternion(z0, euler);
  const eulerB = vinklarFranKvaternion(z1, euler);
  krav('kvaternion stegar genom zenit', z0.angleTo(z1) * GRAD < 4);
  krav('Euler-yaw hoppar vid samma steg', Math.abs(eulerB.vrida - eulerA.vrida) > 1);

  const dod = skapaDodzon();
  const liten = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.2 * RAD);
  const stor = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 10 * RAD);
  dod.tillampa(id, 0.5, a);
  dod.tillampa(liten, 0.5, a);
  krav('död zon håller små skakningar', a.angleTo(id) < 1e-6);
  dod.tillampa(stor, 0.5, a);
  krav('död zon släpper igenom 10°', Math.abs(a.angleTo(id) * GRAD - 10) < 0.05);
  const dodNoll = skapaDodzon();
  dodNoll.tillampa(stor, 0, a);
  krav('död zon 0 är exakt', Math.abs(a.angleTo(stor)) < 1e-6);

  const euro = skapaEuro();
  const mal30 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 30 * RAD);
  euro.filtrera(id, 1 / 60, 1, a);
  euro.filtrera(mal30, 1 / 60, 1, a);
  const stegEuro = a.angleTo(id) * GRAD;
  krav('hög utjämning följer inte direkt', stegEuro > 0.2 && stegEuro < 20);
  for (let i = 0; i < 240; i++) euro.filtrera(mal30, 1 / 60, 1, a);
  krav('utjämning hinner ifatt', Math.abs(a.angleTo(id) * GRAD - 30) < 1);

  const laser = skapaLaser({lyssna: false});
  laser.satt({...STANDARD_LASER, utjamning: 0, dodzon: 0, lasRoll: true, forstarkning: 1, matcha: false});
  laser.mata(0, 90, 0, 0);
  laser.uppdatera(1 / 60);
  laser.mata(-10, 90, 0, 0);
  const q10 = laser.uppdatera(1 / 60).clone();
  krav('läge 1:1 med låst horisont', Math.abs(q10.angleTo(id) * GRAD - 10) < 0.08);
  laser.mata(0, 90, 0, 0);
  krav('samma håll igen är rakt fram', laser.uppdatera(1 / 60).angleTo(id) * GRAD < 0.08);

  function stallAxlar(las, del, glob = {}) {
    const axlar = {};
    for (const id of AXEL_ID) axlar[id] = {...las.install.axlar[id], lage: 'position', kanslighet: 1, accel: 0, skak: 0, slapp: false, ...del};
    if (glob.axlar) for (const id of AXEL_ID) axlar[id] = {...axlar[id], ...glob.axlar[id]};
    const {axlar: _hoppa, ...rest} = glob;
    las.satt({...las.install, utjamning: 0, dodzon: 0, matcha: false, ...rest, axlar});
  }
  laser.nollstall();
  stallAxlar(laser, {kanslighet: 2}, {lasRoll: false});
  laser.mata(0, 90, 0, 0);
  laser.uppdatera(1 / 60);
  laser.mata(-10, 90, 0, 0);
  krav('lägets förstärkning skalar vinkeln', Math.abs(laser.uppdatera(1 / 60).angleTo(id) * GRAD - 20) < 0.08);

  const vy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.5);
  laser.nollstall();
  stallAxlar(laser, {kanslighet: 1}, {lasRoll: true});
  laser.mata(0, 90, 0, 0);
  laser.behall(vy);
  const kvar = laser.uppdatera(1 / 60).clone();
  krav('påslag behåller vyn', kvar.angleTo(vy) < 0.03);
  laser.mata(-10, 90, 0, 0);
  const efter = laser.uppdatera(1 / 60).clone();
  krav('påslag följer sedan 10°', Math.abs(kvar.angleTo(efter) * GRAD - 10) < 0.4);

  const tidig = skapaLaser({lyssna: false});
  tidig.satt({...STANDARD_LASER, utjamning: 0, dodzon: 0, lasRoll: true, forstarkning: 1, matcha: false});
  const vyTidig = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.35);
  tidig.behall(vyTidig);
  tidig.mata(0, 90, 0, 0);
  const efterForsta = tidig.uppdatera(1 / 60).clone();
  krav('första mätningen behåller vyn', efterForsta.angleTo(vyTidig) < 0.03);
  tidig.mata(-10, 90, 0, 0);
  krav('första mätningen följer sedan 10°', Math.abs(efterForsta.angleTo(tidig.uppdatera(1 / 60)) * GRAD - 10) < 0.4);

  const fov = matchaFonsterFov({cssBredd: 393, cssHojd: 852, dpr: 3, ppi: 460, avstandM: 0.35});
  krav('fönster på 35 cm är cirka 23°', Math.abs(fov - 22.79) < 0.2);
  const fovLand = matchaFonsterFov({cssBredd: 852, cssHojd: 393, dpr: 3, ppi: 460, avstandM: 0.35});
  krav('liggande fönster är smalare', fovLand > 10 && fovLand < 11.5);
  krav('iPhone-täthet', uppskattaPpi(393, 852, 3) === 460 && uppskattaPpi(375, 667, 2) === 326);
  const klamd = normalLaser({forstarkning: 9, utjamning: 0, dodzon: 0, matcha: false, lasRoll: false, strale: true, farg: '#00ff00', pa: true});
  krav('känslighet kläms till 6', klamd.axlar.vrida.kanslighet === 6 && klamd.axlar.uppner.kanslighet === 6 && klamd.axlar.sida.kanslighet === 6);
  krav('känslighet når ned till 0,1', normalLaser({axlar: {vrida: {kanslighet: 0.02}}}).axlar.vrida.kanslighet === 0.1);
  krav('rå utjämning får vara 0', normalLaser({utjamning: 0, dodzon: 0, matcha: false, lasRoll: false}).utjamning === 0);
  krav('fel färg faller tillbaka till rött', normalLaser({farg: 'rod'}).farg === '#ff1a1a');

  const gammal = normalLaser({pa: true, forstarkning: 1.5, matcha: false, fov: 40, utjamning: 0.4, dodzon: 1.2, lasRoll: false, prick: 30, farg: '#00ff00', strale: true});
  krav('gammal förstärkning blir känslighet', AXEL_ID.every(id => gammal.axlar[id].kanslighet === 1.5 && gammal.axlar[id].lage === 'position' && gammal.axlar[id].accel === 0));
  krav('gamla fält behålls', gammal.pa && gammal.matcha === false && gammal.fov === 40 && gammal.utjamning === 0.4 && gammal.dodzon === 1.2 && gammal.lasRoll === false && gammal.prick === 30 && gammal.farg === '#00ff00' && gammal.strale);
  const sparad = normalLaser(JSON.parse(JSON.stringify(gammal)));
  krav('ny sparning behåller axlarna', sparad.axlar.sida.kanslighet === 1.5 && sparad.axlar.vrida.lage === 'position');
  krav('sparade axlar vinner över gammal förstärkning', normalLaser({...sparad, forstarkning: 3}).axlar.vrida.kanslighet === 1.5);

  const fin = appliceraForval({farg: '#ffffff', prick: 40, strale: true, lasRoll: true}, 'fin');
  krav('fin känslighet', fin.axlar.vrida.lage === 'position' && fin.axlar.uppner.kanslighet === 2.5 && fin.axlar.sida.kanslighet === 2.5 && fin.dodzon === 0 && fin.utjamning === 0.05);
  krav('förval rör inte färg och prick', fin.farg === '#ffffff' && fin.prick === 40 && fin.strale && fin.lasRoll);
  const fonster = appliceraForval(fin, 'fonster');
  krav('fönster 1:1 är position', AXEL_ID.every(id => fonster.axlar[id].lage === 'position' && fonster.axlar[id].kanslighet === 1) && fonster.matcha);
  const joy = appliceraForval(fonster, 'joystick');
  krav('joystick är fart', AXEL_ID.every(id => joy.axlar[id].lage === 'fart' && joy.axlar[id].kurva === 'kvadrat' && joy.axlar[id].maxfart === 90));
  const mus = appliceraForval(joy, 'mus');
  krav('mus släpper vid retur', AXEL_ID.every(id => mus.axlar[id].lage === 'rorelse' && mus.axlar[id].slapp && mus.axlar[id].fartgrans === 40));

  function gir(q) { return -new THREE.Euler().setFromQuaternion(q, 'YXZ').y * GRAD; }
  function nick(q) { return new THREE.Euler().setFromQuaternion(q, 'YXZ').x * GRAD; }
  function hall(las, alpha, bilder, dt) {
    las.mata(alpha, 90, 0, 0);
    let q = las.uppdatera(dt);
    for (let i = 1; i < bilder; i++) q = las.uppdatera(dt);
    return q.clone();
  }

  const per = skapaLaser({lyssna: false});
  stallAxlar(per, {kanslighet: 1}, {axlar: {vrida: {kanslighet: 2}, uppner: {kanslighet: 1}, sida: {kanslighet: 1}}, lasRoll: true});
  per.mata(0, 90, 0, 0);
  per.uppdatera(1 / 60);
  per.mata(-10, 90, 0, 0);
  const qPer = per.uppdatera(1 / 60).clone();
  krav('vridning kan vara känsligare än lutning', Math.abs(gir(qPer) - 20) < 1.2 && Math.abs(nick(qPer)) < 1.5);

  const av = skapaLaser({lyssna: false});
  stallAxlar(av, {kanslighet: 1}, {axlar: {vrida: {lage: 'av'}}, lasRoll: true});
  av.mata(0, 90, 0, 0);
  av.uppdatera(1 / 60);
  av.mata(-10, 90, 0, 0);
  krav('avstängd axel rör inte vyn', av.uppdatera(1 / 60).angleTo(id) * GRAD < 0.6);

  const fart = skapaLaser({lyssna: false});
  stallAxlar(fart, {lage: 'fart', kanslighet: 1, maxfart: 90, kurva: 'linjar'}, {lasRoll: true, dodzon: 0});
  fart.mata(0, 90, 0, 0);
  fart.uppdatera(1 / 60);
  const qFart = hall(fart, -35, 30, 1 / 60);
  const girFart = gir(qFart);
  krav('joystick håller farten', girFart > 30);
  const qStopp = hall(fart, 0, 20, 1 / 60);
  const girStopp = gir(qStopp);
  krav('tillbaka till noll stannar vyn', Math.abs(girStopp - girFart) < 2);
  krav('joystick backar inte mot noll', girStopp > girFart - 0.6);
  const foreBak = girStopp;
  const qBak = hall(fart, 35, 20, 1 / 60);
  krav('motsatt utslag vänder', gir(qBak) < foreBak - 8);

  const linje = skapaLaser({lyssna: false});
  const kurva = skapaLaser({lyssna: false});
  stallAxlar(linje, {lage: 'fart', kanslighet: 1, maxfart: 90, kurva: 'linjar'}, {lasRoll: true});
  stallAxlar(kurva, {lage: 'fart', kanslighet: 1, maxfart: 90, kurva: 'kvadrat'}, {lasRoll: true});
  linje.mata(0, 90, 0, 0);
  kurva.mata(0, 90, 0, 0);
  linje.uppdatera(1 / 60);
  kurva.uppdatera(1 / 60);
  const gLinje = Math.abs(gir(hall(linje, -17.5, 30, 1 / 60)));
  const gKurva = Math.abs(gir(hall(kurva, -17.5, 30, 1 / 60)));
  krav('kvadratisk kurva är långsammare på halvt utslag', gKurva < gLinje * 0.7 && gKurva > 2);

  const musLaser = skapaLaser({lyssna: false});
  stallAxlar(musLaser, {lage: 'rorelse', kanslighet: 1, slapp: false}, {lasRoll: true});
  musLaser.mata(0, 90, 0, 0);
  musLaser.uppdatera(1 / 60);
  const qMus = hall(musLaser, -10, 1, 1 / 60);
  krav('mus räknar vinkeländringen', Math.abs(gir(qMus) - 10) < 1.5);
  const qStill = hall(musLaser, -10, 25, 1 / 60);
  krav('mus står stilla när telefonen gör det', Math.abs(gir(qStill) - gir(qMus)) < 0.2);
  const qTillbaka = hall(musLaser, 0, 1, 1 / 60);
  krav('mus utan släpp följer tillbaka', Math.abs(gir(qTillbaka)) < 1.5);

  const slapp = skapaLaser({lyssna: false});
  stallAxlar(slapp, {lage: 'rorelse', kanslighet: 1, slapp: true, fartgrans: 40}, {lasRoll: true});
  slapp.mata(0, 90, 0, 0);
  slapp.uppdatera(1 / 60);
  const qUt = hall(slapp, -20, 1, 1 / 60);
  const girUt = gir(qUt);
  krav('snabb rörelse ut räknas', girUt > 12);
  for (let i = 1; i <= 30; i++) {
    slapp.mata(-20 + (2 * i) / 30, 90, 0, 0);
    slapp.uppdatera(0.5 / 30);
  }
  const girLangsam = gir(slapp.uppdatera(0.5 / 30).clone());
  krav('långsam retur släpps', Math.abs(girLangsam - girUt) < 1.2);
  const qSnabb = hall(slapp, 0, 1, 1 / 60);
  krav('snabb retur räknas', gir(qSnabb) < girLangsam - 8);

  function ramp(boost) {
    const las = skapaLaser({lyssna: false});
    stallAxlar(las, {lage: 'position', kanslighet: 1, accel: boost, skak: boost > 0 ? 2 : 0}, {lasRoll: true, axlar: {uppner: {kanslighet: 1.01}}});
    las.mata(0, 90, 0, 0);
    las.uppdatera(1 / 60);
    let topp = 0;
    let skakTopp = 0;
    let matareTopp = 0;
    let alpha = 0;
    for (let i = 0; i < 8; i++) {
      alpha -= 4;
      las.mata(alpha, 90, 0, 0);
      const q = las.uppdatera(1 / 60);
      topp = Math.max(topp, gir(q));
      skakTopp = Math.max(skakTopp, las.skakPx());
      matareTopp = Math.max(matareTopp, las.matare().vrida);
    }
    for (let i = 0; i < 40; i++) las.uppdatera(1 / 60);
    return {topp, efter: gir(las.uppdatera(1 / 60)), skakTopp, matareTopp};
  }
  const utan = ramp(0);
  const med = ramp(2);
  krav('acceleration ger extra utslag', med.topp > utan.topp + 1);
  krav('accelerationen klingar av', Math.abs(med.efter - utan.efter) < 2);
  krav('skak 0 är tyst', utan.skakTopp === 0);
  krav('ryck skakar siktet', med.skakTopp > 0.5 && med.skakTopp <= 16);
  krav('mätaren rör sig under accelerationen', med.matareTopp > 0.15);
  krav('liten prick är standard', normalLaser({}).prick === 9);
  krav('prick kan vara 8 px', normalLaser({prick: 8}).prick === 8);
  krav('gammal standardprick blir liten', normalLaser({prick: 22}).prick === 9);
  krav('vald prick 22 blir kvar', normalLaser({prick: 22, sikte: 'prick'}).prick === 22);
  krav('sikte är prick eller kikare', normalLaser({sikte: 'kikare'}).sikte === 'kikare' && normalLaser({sikte: 'tub'}).sikte === 'prick');
  krav('kikarsikte zoomar synfältet', effektivFov(40, {sikte: 'kikare', zoom: 2}) === 20);
  krav('prickläge zoomar inte', effektivFov(40, {sikte: 'prick', zoom: 2}) === 40);
  krav('zoom stannar vid 4°', effektivFov(12, {sikte: 'kikare', zoom: 4}) === 4);
  krav('sex gånger zoomar synfältet', effektivFov(66, {sikte: 'kikare', zoom: 6}) === 11);
  krav('zoom kläms', normalLaser({zoom: 9}).zoom === 6 && normalLaser({zoom: 0.2}).zoom === 1);
  krav('förval behåller siktet', appliceraForval({sikte: 'kikare', zoom: 3, prick: 40}, 'fin').sikte === 'kikare' && appliceraForval({sikte: 'kikare', zoom: 3, prick: 40}, 'fin').zoom === 3);
  return fel;
}
