import * as THREE from '../js/vendor/three.module.js';

// Samma kedja som panorama/blick.js: YXZ, kamera längs -Z, -90° runt X, skärmvinkel runt Z.
// Höger vridning (alpha minskar) är positiv yaw. Toppen upp är positiv pitch.
// Högerkant ned är positiv roll. Inte spegelvänt, varken stående eller i landskap.

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

// upp = toppen upp, hoger = vridning åt höger, sida = högerkant ned. Radianer.
export function vinklarFranKvaternion(q, euler) {
  euler.setFromQuaternion(q, 'YXZ');
  return {pitch: euler.x, yaw: -euler.y, roll: euler.z};
}

function jamforPose(noll, nu, q, euler, skarmQ, rel) {
  const o = enhetsKvaternion(noll[0], noll[1], noll[2], noll[3], q, euler, skarmQ).clone();
  o.invert();
  const n = enhetsKvaternion(nu[0], nu[1], nu[2], nu[3], q, euler, skarmQ);
  return vinklarFranKvaternion(rel.multiplyQuaternions(o, n), euler);
}

export function sjalvtest() {
  const q = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const skarmQ = new THREE.Quaternion();
  const rel = new THREE.Quaternion();
  const fel = [];
  const krav = (namn, ok) => { if (!ok) fel.push(namn); };
  const jamfor = (a, b) => jamforPose(a, b, q, euler, skarmQ, rel);
  const staende = [0, 90, 0, 0];
  const hoger = jamfor(staende, [-30, 90, 0, 0]);
  const tillbaka = jamfor(staende, [0, 90, 0, 0]);
  const ned = jamfor(staende, [0, 50, 0, 0]);
  const upp = jamfor(staende, [0, 130, 0, 0]);
  const rull = jamfor(staende, [90, 70, -90, 0]);
  krav('höger stannar höger', hoger.yaw > 0.4 && Math.abs(hoger.pitch) < 0.08);
  krav('tillbaka till start', Math.abs(tillbaka.yaw) < 0.02 && Math.abs(tillbaka.pitch) < 0.02);
  krav('toppen ned', ned.pitch < -0.5);
  krav('toppen upp', upp.pitch > 0.5);
  krav('sidlutning', rull.roll > 0.2);

  const land = [90, 0, -90, 90];
  const landJamfor = jamfor(staende, land);
  const landHoger = jamfor(land, [60, 0, -90, 90]);
  krav('landskap samma fönster', Math.abs(landJamfor.yaw) < 0.08 && Math.abs(landJamfor.pitch) < 0.08);
  krav('landskap höger är höger', landHoger.yaw > 0.4 && Math.abs(landHoger.pitch) < 0.2);
  return fel;
}

export function skapaRorelse(canvas) {
  const raw = new THREE.Quaternion();
  const origin = new THREE.Quaternion();
  const relativ = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const skarmQ = new THREE.Quaternion();
  let aktiv = false;
  let fick = false;
  let vantarNoll = true;
  let tvingadSkarm = null;
  const pek = {roll: 0, yaw: 0, pitch: 0, nere: false};

  function las(alpha, beta, gamma) {
    const skarm = tvingadSkarm == null ? skarmVinkel() : tvingadSkarm;
    enhetsKvaternion(alpha, beta, gamma, skarm, raw, euler, skarmQ);
    fick = true;
    if (vantarNoll) nollstall();
  }

  const pa = (mal, typ, fn, opt) => {
    if (typeof mal?.addEventListener === 'function') mal.addEventListener(typ, fn, opt);
  };
  pa(globalThis, 'deviceorientation', e => {
    if (![e.alpha, e.beta, e.gamma].every(Number.isFinite)) return;
    las(e.alpha, e.beta, e.gamma);
  }, {passive: true});

  let pekare = null;
  let ned = null;
  if (canvas) {
    canvas.addEventListener('pointerdown', e => {
      if (e.target !== canvas || harGyro()) return;
      pekare = e.pointerId;
      ned = [e.clientX, e.clientY];
      pek.nere = true;
      try { canvas.setPointerCapture(pekare); } catch { /* pekaren kan hinna släppas */ }
    });
    canvas.addEventListener('pointermove', e => {
      if (e.pointerId !== pekare || !ned || harGyro()) return;
      const dx = e.clientX - ned[0];
      const dy = e.clientY - ned[1];
      pek.yaw = Math.max(-1.15, Math.min(1.15, dx / 150 * 0.7));
      pek.pitch = Math.max(-1.15, Math.min(1.15, -dy / 150 * 0.7));
    });
    const slut = e => {
      if (e && e.pointerId !== pekare) return;
      pekare = null;
      ned = null;
      pek.nere = false;
      pek.yaw = 0;
      pek.pitch = 0;
    };
    canvas.addEventListener('pointerup', slut);
    canvas.addEventListener('pointercancel', slut);
  }

  function harGyro() { return aktiv && fick; }

  function gyroVinklar() {
    if (!fick) return {roll: 0, yaw: 0, pitch: 0};
    return vinklarFranKvaternion(relativ.multiplyQuaternions(origin, raw), euler);
  }

  function vinklar() {
    if (harGyro()) return gyroVinklar();
    return {roll: pek.roll, yaw: pek.yaw, pitch: pek.pitch};
  }

  function nollstall() {
    if (fick) {
      origin.copy(raw).invert();
      vantarNoll = false;
    } else vantarNoll = true;
    pek.roll = 0;
    pek.yaw = 0;
    pek.pitch = 0;
  }

  async function start() {
    const tillat = T => {
      try {
        return typeof T?.requestPermission === 'function' ? T.requestPermission() : Promise.resolve(T ? 'granted' : 'unavailable');
      } catch (e) { return Promise.reject(e); }
    };
    const orientering = tillat(globalThis.DeviceOrientationEvent);
    const rorelse = tillat(globalThis.DeviceMotionEvent);
    const [a, b] = await Promise.allSettled([orientering, rorelse]);
    aktiv = a.status === 'fulfilled' && (a.value === 'granted' || (b.status === 'fulfilled' && b.value === 'granted'));
    nollstall();
    return {
      orientation: a.status === 'fulfilled' ? a.value : 'denied',
      motion: b.status === 'fulfilled' ? b.value : 'denied'
    };
  }

  return {
    start,
    nollstall,
    vinklar,
    get harGyro() { return harGyro(); },
    mata(alpha, beta, gamma, skarm) {
      aktiv = true;
      tvingadSkarm = skarm;
      las(alpha, beta, gamma);
      tvingadSkarm = null;
    },
    sattPek(roll, yaw, pitch) {
      if (roll != null) pek.roll = roll;
      if (yaw != null) pek.yaw = yaw;
      if (pitch != null) pek.pitch = pitch;
    }
  };
}
