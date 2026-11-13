import * as THREE from '../js/vendor/three.module.js';

// Samma kedja som vagn-test/gyro.js, js/gyro.js och flyg/orientering.js:
// YXZ euler(beta, alpha, -gamma), sedan -90° runt X, sedan skärmvinkeln runt Z.
// Nollställning: q_rel = q0⁻¹ q.

const RAD = Math.PI / 180;
const FIX = new THREE.Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2);
const Z_AXEL = new THREE.Vector3(0, 0, 1);

export function skarmVinkel() {
  const v = globalThis.screen?.orientation?.angle ?? globalThis.window?.orientation ?? 0;
  return Number.isFinite(+v) ? +v : 0;
}

export function enhetsKvaternion(alpha, beta, gamma, skarmGrader, q, euler, skarmQ) {
  euler.set(beta * RAD, alpha * RAD, -gamma * RAD, 'YXZ');
  q.setFromEuler(euler).multiply(FIX);
  if (skarmGrader) q.multiply(skarmQ.setFromAxisAngle(Z_AXEL, -skarmGrader * RAD));
  return q;
}

const _top = new THREE.Vector3();
const _look = new THREE.Vector3();
const _screen = new THREE.Vector3();
const _right = new THREE.Vector3();
const _ref = new THREE.Vector3();
const _side = new THREE.Vector3();
const _s = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _lane = new THREE.Vector3(0, 0, -1);

// θ ökar när armen går från full bakåt, ned genom botten och fram mot käglorna.
// 0° = toppen pekar bakåt, 90° = armen hänger, 180° = toppen pekar mot käglorna.
export function svingVinkel(top) {
  let deg = Math.atan2(-top.y, top.z) / RAD;
  // Framåt platt ligger på grengränsen ±180. För svingen nedifrån är det +180.
  if (deg < -90) deg += 360;
  return deg;
}

// 0° när skärmen ligger så plant mot himlen som greppet tillåter.
// +90° när högerkanten är ned (på högkant). Runt underarmen, inte världens yaw.
export function krokRoll(top, screen) {
  _ref.copy(_up).addScaledVector(top, -_up.dot(top));
  // Rakt upp eller ned: skruven är inte mätbar mot himlen.
  if (_ref.lengthSq() < 1e-4) return 0;
  _ref.normalize();
  _side.crossVectors(top, _ref);
  _s.copy(screen).addScaledVector(top, -screen.dot(top));
  if (_s.lengthSq() < 1e-6) return 0;
  _s.normalize();
  return Math.atan2(-_s.dot(_side), _s.dot(_ref));
}

export function skapaGyro(konfig, mal = globalThis) {
  const raw = new THREE.Quaternion();
  const origin = new THREE.Quaternion();
  const relativ = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const skarmQ = new THREE.Quaternion();
  const qInv = new THREE.Quaternion();
  const wDev = new THREE.Vector3();
  const wVarld = new THREE.Vector3();
  const accDev = new THREE.Vector3();
  const accVarld = new THREE.Vector3();
  const gDev = new THREE.Vector3();

  let aktiv = false;
  let fick = false;
  let harNoll = false;
  let vantarNoll = false;
  let tvingadSkarm = null;
  let kalla = 'ingen';
  let senasteSensor = 0;
  let foreTheta = null;
  let foreTid = null;
  let rateGiven = false;

  const nu = tom();

  function tom() {
    return {
      theta: 0, plat: 0, titt: 0, roll: 0, aimYaw: 0, omega: 0,
      accFram: 0, accCent: 0, harOrientering: false, harRate: false,
      q: [0, 0, 0, 1]
    };
  }

  function las(alpha, beta, gamma) {
    const skarm = tvingadSkarm == null ? skarmVinkel() : tvingadSkarm;
    enhetsKvaternion(alpha, beta, gamma, skarm, raw, euler, skarmQ);
    fick = true;
    if (vantarNoll) nollstall();
    else rakna(performance.now());
  }

  function nollstall() {
    if (!fick) { vantarNoll = true; return; }
    origin.copy(raw).invert();
    harNoll = true;
    vantarNoll = false;
    foreTheta = null;
    rakna(performance.now());
  }

  function rakna(tid) {
    if (!fick) return;
    relativ.multiplyQuaternions(origin, raw);
    _top.set(0, 1, 0).applyQuaternion(relativ);
    _look.set(0, 0, -1).applyQuaternion(relativ);
    _screen.set(0, 0, 1).applyQuaternion(relativ);
    _right.set(1, 0, 0).applyQuaternion(relativ);

    const plat = Math.max(0, Math.min(1, _screen.y));
    const lookLane = Math.max(-1, Math.min(1, _look.dot(_lane)));
    const titt = Math.max(0, Math.min(1, lookLane)) * (1 - plat);
    const theta = svingVinkel(_top);
    const roll = krokRoll(_top, _screen);

    const fram = konfig.brytare.framat_ar_toppen ? _top : _look;
    const hx = Math.hypot(fram.x, fram.z);
    let aim = hx < 0.18 ? 0 : Math.atan2(fram.x, -fram.z);
    const kans = Number.isFinite(+konfig.kanslighet) ? +konfig.kanslighet : 1;
    if (konfig.brytare.invertera_fram) aim = -aim;
    aim *= kans;

    let omega = 0;
    if (rateGiven) {
      wVarld.copy(wDev).applyQuaternion(relativ);
      omega = wVarld.x;
    } else if (foreTheta != null && tid > foreTid) {
      let d = theta - foreTheta;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      omega = d / ((tid - foreTid) / 1000);
    }
    foreTheta = theta;
    foreTid = tid;

    let accFram = 0;
    let accCent = 0;
    if (nu.harAcc) {
      accFram = -accVarld.z;
      const radial = Math.abs(accVarld.dot(_top));
      accCent = radial >= konfig.fart.acc_golv ? radial : 0;
    }

    Object.assign(nu, {
      theta, plat, titt, roll, aimYaw: aim, omega, accFram, accCent,
      harOrientering: true,
      q: [relativ.x, relativ.y, relativ.z, relativ.w],
      top: [_top.x, _top.y, _top.z],
      look: [_look.x, _look.y, _look.z]
    });
  }

  function laggAcc(acc, accG) {
    const hel = v => v && Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
    if (hel(acc)) {
      accDev.set(acc.x, acc.y, acc.z);
    } else if (hel(accG) && fick) {
      qInv.copy(relativ).invert();
      gDev.set(0, -konfig.gravitation, 0).applyQuaternion(qInv);
      accDev.set(accG.x - gDev.x, accG.y - gDev.y, accG.z - gDev.z);
    } else {
      nu.harAcc = false;
      nu.accFram = 0;
      nu.accCent = 0;
      return;
    }
    accVarld.copy(accDev).applyQuaternion(relativ);
    nu.harAcc = true;
    rakna(performance.now());
  }

  function laggRate(rate) {
    if (rate && Number.isFinite(rate.alpha) && Number.isFinite(rate.beta) && Number.isFinite(rate.gamma)) {
      wDev.set(rate.beta, rate.gamma, rate.alpha);
      rateGiven = true;
      nu.harRate = true;
    } else {
      rateGiven = false;
      nu.harRate = false;
    }
    rakna(performance.now());
  }

  const pa = (typ, fn) => {
    if (typeof mal?.addEventListener === 'function') mal.addEventListener(typ, fn, { passive: true });
  };
  pa('deviceorientation', e => {
    if (![e.alpha, e.beta, e.gamma].every(Number.isFinite)) return;
    kalla = 'sensor';
    senasteSensor = performance.now();
    las(e.alpha, e.beta, e.gamma);
  });
  pa('devicemotion', e => {
    kalla = 'sensor';
    senasteSensor = performance.now();
    const rr = e.rotationRate || {};
    laggRate({
      alpha: Number.isFinite(rr.alpha) ? rr.alpha : 0,
      beta: Number.isFinite(rr.beta) ? rr.beta : 0,
      gamma: Number.isFinite(rr.gamma) ? rr.gamma : 0
    });
    laggAcc(e.acceleration, e.accelerationIncludingGravity);
  });

  function mata(prov) {
    aktiv = true;
    kalla = 'mata';
    const tid = Number.isFinite(prov?.t) ? prov.t : performance.now();
    senasteSensor = tid;
    if (Number.isFinite(prov?.skarm)) tvingadSkarm = prov.skarm;
    if ([prov?.alpha, prov?.beta, prov?.gamma].every(Number.isFinite)) {
      enhetsKvaternion(prov.alpha, prov.beta, prov.gamma, tvingadSkarm == null ? skarmVinkel() : tvingadSkarm, raw, euler, skarmQ);
      fick = true;
      if (vantarNoll) {
        origin.copy(raw).invert();
        harNoll = true;
        vantarNoll = false;
        foreTheta = null;
      }
    }
    tvingadSkarm = null;
    if (prov && Object.prototype.hasOwnProperty.call(prov, 'rotationRate')) laggRate(prov.rotationRate || { alpha: 0, beta: 0, gamma: 0 });
    else { rateGiven = false; nu.harRate = false; }
    if (prov && (prov.acceleration || prov.accelerationIncludingGravity)) laggAcc(prov.acceleration, prov.accelerationIncludingGravity);
    else if (!prov?.acceleration && !prov?.accelerationIncludingGravity) {
      nu.harAcc = false;
      nu.accFram = 0;
      nu.accCent = 0;
    }
    rakna(tid);
    return { ...nu, tid, senasteSensor };
  }

  // ω i svingplanet (grader/s, positiv framåt) uttryckt som devicemotion.rotationRate.
  function rateFranOmega(omegaDeg) {
    qInv.copy(relativ).invert();
    const v = new THREE.Vector3(omegaDeg, 0, 0).applyQuaternion(qInv);
    return { beta: v.x, gamma: v.y, alpha: v.z };
  }

  async function start() {
    const tillat = T => {
      try {
        return typeof T?.requestPermission === 'function' ? T.requestPermission() : Promise.resolve(T ? 'granted' : 'unavailable');
      } catch (e) { return Promise.reject(e); }
    };
    const orientering = tillat(mal.DeviceOrientationEvent);
    const rorelse = tillat(mal.DeviceMotionEvent);
    const [a, b] = await Promise.allSettled([orientering, rorelse]);
    aktiv = a.status === 'fulfilled' && (a.value === 'granted' || a.value === 'unavailable' || (b.status === 'fulfilled' && (b.value === 'granted' || b.value === 'unavailable')));
    return {
      orientation: a.status === 'fulfilled' ? a.value : 'denied',
      motion: b.status === 'fulfilled' ? b.value : 'denied'
    };
  }

  return {
    start,
    nollstall,
    mata,
    rateFranOmega,
    las,
    get nu() { return nu; },
    get harNoll() { return harNoll; },
    get fick() { return fick; },
    get aktiv() { return aktiv; },
    set aktiv(v) { aktiv = v; },
    get kalla() { return kalla; },
    get senasteSensor() { return senasteSensor; },
    relativ,
    rakna
  };
}

export function sjalvtest() {
  const q = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const skarmQ = new THREE.Quaternion();
  const rel = new THREE.Quaternion();
  const fel = [];
  const krav = (namn, ok) => { if (!ok) fel.push(namn); };
  const jamfor = (a, b) => {
    const o = enhetsKvaternion(a[0], a[1], a[2], a[3], q, euler, skarmQ).clone();
    o.invert();
    const n = enhetsKvaternion(b[0], b[1], b[2], b[3], q, euler, skarmQ);
    euler.setFromQuaternion(rel.multiplyQuaternions(o, n), 'YXZ');
    return { pitch: euler.x, yaw: -euler.y, roll: euler.z };
  };
  const staende = [0, 90, 0, 0];
  const hoger = jamfor(staende, [-30, 90, 0, 0]);
  const tillbaka = jamfor(staende, [0, 90, 0, 0]);
  const ned = jamfor(staende, [0, 50, 0, 0]);
  const upp = jamfor(staende, [0, 130, 0, 0]);
  krav('höger stannar höger', hoger.yaw > 0.4 && Math.abs(hoger.pitch) < 0.15);
  krav('tillbaka till start', Math.abs(tillbaka.yaw) < 0.02 && Math.abs(tillbaka.pitch) < 0.02);
  krav('toppen ned', ned.pitch < -0.5);
  krav('toppen upp', upp.pitch > 0.5);
  return fel;
}
