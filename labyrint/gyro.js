import * as THREE from '../js/vendor/three.module.js';
import { provFranEvent, skarmGrader } from '../shared/sensor.js';

const RAD = Math.PI / 180;
const GRAD = 180 / Math.PI;
const FIX = new THREE.Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2);
const Z_AXEL = new THREE.Vector3(0, 0, 1);
const TANGENTER = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];

function klamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function skarmVinkel() {
  return skarmGrader(globalThis);
}

export function enhetsKvaternion(alpha, beta, gamma, skarmGrader, q, euler, skarmQ) {
  euler.set(beta * RAD, alpha * RAD, -gamma * RAD, 'YXZ');
  q.setFromEuler(euler).multiply(FIX);
  if (skarmGrader) q.multiply(skarmQ.setFromAxisAngle(Z_AXEL, -skarmGrader * RAD));
  return q;
}

export function gravitationSkarm(q, ut, inv) {
  inv.copy(q).invert();
  ut.set(0, -1, 0).applyQuaternion(inv);
  return ut;
}

export function mjukLutning(grader, kanslighet, gyro, minne) {
  const d = Math.max(0, gyro.dodzon || 0);
  const maxG = Math.max(0.001, gyro.maxGrader || 1);
  const expo = gyro.expo ?? 1.7;
  const kryp = gyro.kryp ?? 0.06;
  const a = Math.abs(grader) * Math.max(0, kanslighet);
  const s = Math.sign(grader);
  if (a < 1e-5) {
    if (minne) minne.pa = false;
    return 0;
  }
  const hyst = Math.min(0.8, Math.max(0, gyro.hysteres || 0));
  const exit = d * (1 - hyst);
  let inne = d > 0 && a <= d;
  if (minne && hyst > 0 && d > 0) {
    if (minne.pa) {
      if (a <= exit) minne.pa = false;
    } else if (a > d) minne.pa = true;
    inne = !minne.pa && a <= d;
  }
  let norm;
  if (inne) {
    const u = a / d;
    norm = kryp * u * u * u;
  } else {
    const u = Math.min(1, Math.max(0, (a - d) / Math.max(0.001, maxG - d)));
    const bas = d > 0 ? kryp : 0;
    norm = bas + (1 - bas) * Math.pow(u, expo);
  }
  return s * Math.min(maxG, norm * maxG);
}

export function lutningFranGrav(grav, noll, konfig) {
  const g = konfig.gyro;
  let fram = Math.asin(klamp(grav.y, -1, 1)) * GRAD - (noll?.fram || 0);
  let sida = Math.asin(klamp(grav.x, -1, 1)) * GRAD - (noll?.sida || 0);
  if (g.invertFram) fram = -fram;
  if (g.invertSida) sida = -sida;
  return {fram, sida};
}

export function skapaGyro(canvas, konfig) {
  const q = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const skarmQ = new THREE.Quaternion();
  const ut = new THREE.Vector3();
  const inv = new THREE.Quaternion();
  const knappar = new Set();
  const pek = {fram: 0, sida: 0, id: null, haller: false};
  let senaste = null;
  let noll = {fram: 0, sida: 0};
  let gyroPa = false;
  let fick = false;
  let vantarNoll = false;
  let tvingad = null;
  let blockerad = () => false;

  function las(alpha, beta, gamma) {
    enhetsKvaternion(alpha, beta, gamma, skarmVinkel(), q, euler, skarmQ);
    if (!senaste) senaste = new THREE.Vector3();
    gravitationSkarm(q, senaste, inv);
    fick = true;
    if (vantarNoll) {
      vantarNoll = false;
      plattaUt();
    }
  }

  function grader() {
    if (tvingad) return {fram: tvingad.fram, sida: tvingad.sida, kalla: 'tvingad'};
    let fram = 0;
    let sida = 0;
    let kalla = 'finger';
    if (gyroPa && fick && senaste) {
      const lut = lutningFranGrav(senaste, noll, konfig);
      fram = lut.fram;
      sida = lut.sida;
      kalla = 'gyro';
    } else {
      fram = pek.fram;
      sida = pek.sida;
    }
    const t = konfig.gyro.tangentGrader;
    if (knappar.has('ArrowUp') || knappar.has('KeyW')) fram += t;
    if (knappar.has('ArrowDown') || knappar.has('KeyS')) fram -= t;
    if (knappar.has('ArrowRight') || knappar.has('KeyD')) sida += t;
    if (knappar.has('ArrowLeft') || knappar.has('KeyA')) sida -= t;
    return {fram, sida, kalla};
  }

  function plattaUt() {
    if (senaste) {
      noll = {
        fram: Math.asin(klamp(senaste.y, -1, 1)) * GRAD,
        sida: Math.asin(klamp(senaste.x, -1, 1)) * GRAD,
      };
    }
    pek.fram = 0;
    pek.sida = 0;
    pek.haller = false;
    pek.id = null;
  }

  function slack(dt) {
    if (pek.haller || tvingad) return;
    const k = 1 - Math.exp(-dt / Math.max(0.04, konfig.gyro.pekAtergangSek));
    pek.fram += (0 - pek.fram) * k;
    pek.sida += (0 - pek.sida) * k;
    if (Math.hypot(pek.fram, pek.sida) < 0.05) {
      pek.fram = 0;
      pek.sida = 0;
    }
  }

  async function starta() {
    const DOE = globalThis.DeviceOrientationEvent;
    const DME = globalThis.DeviceMotionEvent;
    const be = (T) => {
      try {
        if (T && typeof T.requestPermission === 'function') return Promise.resolve(T.requestPermission()).catch(() => 'nekad');
        return Promise.resolve(T ? 'granted' : 'saknas');
      } catch (e) {
        return Promise.resolve('nekad');
      }
    };
    const orientP = be(DOE);
    const rorelseP = be(DME);
    const [orientering, rorelse] = await Promise.all([orientP, rorelseP]);
    const ok = orientering === 'granted' || orientering === 'saknas';
    gyroPa = ok;
    vantarNoll = ok;
    if (ok && senaste) plattaUt();
    return {orientering, rorelse, ok};
  }

  const pa = (mal, typ, fn, opt) => {
    if (typeof mal?.addEventListener === 'function') mal.addEventListener(typ, fn, opt);
  };

  pa(globalThis, 'deviceorientation', (e) => {
    const prov = provFranEvent(e);
    if (!prov) return;
    las(prov.alpha, prov.beta, prov.gamma);
  }, {passive: true});

  function tangent(e, nere) {
    if (blockerad()) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target?.closest?.('input, select, textarea')) return;
    if (!TANGENTER.includes(e.code)) return;
    if (nere) knappar.add(e.code);
    else knappar.delete(e.code);
    e.preventDefault();
  }
  pa(globalThis, 'keydown', (e) => tangent(e, true));
  pa(globalThis, 'keyup', (e) => tangent(e, false));
  pa(globalThis, 'blur', () => knappar.clear());

  if (canvas) {
    const max = konfig.gyro.maxGrader;
    const px = konfig.gyro.pekGraderPerPixel;
    canvas.addEventListener('pointerdown', (e) => {
      if (e.target !== canvas || (gyroPa && fick)) return;
      if (e.button != null && e.button !== 0) return;
      pek.id = e.pointerId;
      pek.x = e.clientX;
      pek.y = e.clientY;
      pek.haller = true;
      try { canvas.setPointerCapture(e.pointerId); } catch { /* pekaren kan hinna släppas */ }
    });
    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerId !== pek.id || !pek.haller) return;
      const dx = e.clientX - pek.x;
      const dy = e.clientY - pek.y;
      pek.fram = klamp(-dy * px, -max, max);
      pek.sida = klamp(dx * px, -max, max);
    });
    const slut = (e) => {
      if (e && pek.id != null && e.pointerId !== pek.id) return;
      pek.id = null;
      pek.haller = false;
    };
    canvas.addEventListener('pointerup', slut);
    canvas.addEventListener('pointercancel', slut);
  }

  return {
    starta,
    plattaUt,
    grader,
    slack,
    get harGyro() { return gyroPa && fick; },
    get vantarSensor() { return gyroPa && !fick; },
    sattTvingad(fram, sida) {
      if (fram == null) tvingad = null;
      else tvingad = {fram, sida: sida || 0};
    },
    mata(alpha, beta, gamma) {
      gyroPa = true;
      las(alpha, beta, gamma);
    },
    setBlockerad(fn) { blockerad = typeof fn === 'function' ? fn : () => false; },
  };
}
