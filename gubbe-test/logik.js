// Styrning för gubbe-test. Tecken är samma som js/riktning.js (inte spegelvänt):
// yaw > 0 höger, pitch/upp > 0 är toppen mot dig (blick upp), roll > 0 är högerkant ned.
// fram > 0 är toppen bort (gång framåt). Fartläget använder rotationRate, inte acceleration.
import { tolkaOrientering } from '../js/riktning.js';

export const VERSION = 'Gubbtest 01';
export const NYCKEL = 'gubbe-test-01';
const DEG = Math.PI / 180;

export const PACE = [
  { namn: 'Står', fart: 0 },
  { namn: 'Går', fart: 1.35 },
  { namn: 'Går fort', fart: 2.35 },
  { namn: 'Springer', fart: 4.2 }
];
export const KNAPP_FART = 1.35;
export const FLICK_SPAR = 0.6;
// Sekunder per (°/s ojämnhet × skakkänslighet). 40 °/s träffar 2 s, som är standardtaket.
export const K_LUGN = 0.05;
const PACE_FRAM = [8, 16, 28];

function axel(over = {}) {
  return { lage: 'lage', kanslighet: 1, forstarkning: 0, utjamning: 0.15, dodzon: 4, pa: true, ...over };
}

export function standardInstallningar() {
  return {
    haptik: true,
    jamnKanslighet: 1,
    ga: {
      vrid: axel({ dodzon: 4 }),
      fram: axel({ dodzon: 3 }),
      sida: axel({ pa: false, dodzon: 5 }),
      nerDps: 320,
      hoppDps: 320
    },
    sikta: {
      vrid: axel({ dodzon: 0.3, utjamning: 0.05 }),
      fram: axel({ dodzon: 0.3, utjamning: 0.05 }),
      sida: axel({ pa: false, dodzon: 1, utjamning: 0.05 }),
      skakKanslighet: 1,
      maxSkak: 1.2,
      maxLugning: 2
    }
  };
}

const AXEL_NYCKLAR = ['lage', 'kanslighet', 'forstarkning', 'utjamning', 'dodzon', 'pa'];

function klamp(v, min, max, reserv) {
  const n = Number(v);
  if (!Number.isFinite(n)) return reserv;
  return Math.min(max, Math.max(min, n));
}

function lasAxel(bas, sparad) {
  const ut = { ...bas };
  if (!sparad || typeof sparad !== 'object') return ut;
  if (sparad.lage === 'lage' || sparad.lage === 'fart') ut.lage = sparad.lage;
  ut.kanslighet = klamp(sparad.kanslighet, 0.5, 3, bas.kanslighet);
  ut.forstarkning = klamp(sparad.forstarkning, 0, 3, bas.forstarkning);
  ut.utjamning = klamp(sparad.utjamning, 0, 1, bas.utjamning);
  ut.dodzon = klamp(sparad.dodzon, 0, 20, bas.dodzon);
  if (typeof sparad.pa === 'boolean') ut.pa = sparad.pa;
  return ut;
}

export function sammanfoga(sparad) {
  const bas = standardInstallningar();
  if (!sparad || typeof sparad !== 'object') return bas;
  bas.haptik = sparad.haptik !== false;
  bas.jamnKanslighet = klamp(sparad.jamnKanslighet, 0.5, 3, 1);
  for (const id of ['vrid', 'fram', 'sida']) {
    bas.ga[id] = lasAxel(bas.ga[id], sparad.ga?.[id]);
    const sik = lasAxel(bas.sikta[id], sparad.sikta?.[id]);
    delete sik.lage;
    bas.sikta[id] = sik;
  }
  bas.ga.nerDps = klamp(sparad.ga?.nerDps, 120, 700, bas.ga.nerDps);
  bas.ga.hoppDps = klamp(sparad.ga?.hoppDps, 120, 700, bas.ga.hoppDps);
  bas.sikta.skakKanslighet = klamp(sparad.sikta?.skakKanslighet, 0.5, 3, 1);
  bas.sikta.maxSkak = klamp(sparad.sikta?.maxSkak, 0, 3, 1.2);
  bas.sikta.maxLugning = klamp(sparad.sikta?.maxLugning, 0.2, 2, 2);
  return bas;
}

export function skarmVinkel(win = globalThis) {
  const so = win.screen && win.screen.orientation;
  if (so && typeof so.angle === 'number') return so.angle;
  if (typeof win.orientation === 'number') return ((win.orientation % 360) + 360) % 360;
  return 0;
}

export function vinklarFranOrientering(alpha, beta, gamma, noll, screen = 0) {
  const tom = { upp: 0, fram: 0, yaw: 0, roll: 0 };
  if (!noll || ![alpha, beta, gamma, noll.alpha, noll.beta, noll.gamma].every(Number.isFinite)) return tom;
  const v = tolkaOrientering(alpha, beta, gamma, noll, screen || 0);
  const d = 180 / Math.PI;
  const upp = v.pitch * d;
  return { upp, fram: -upp, yaw: v.yaw * d, roll: v.roll * d };
}

function axelVinkel(x, y, z, v) {
  const h = v / 2, s = Math.sin(h);
  return { x: x * s, y: y * s, z: z * s, w: Math.cos(h) };
}
function mul(a, b) {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z
  };
}
function invq(a) { return { x: -a.x, y: -a.y, z: -a.z, w: a.w }; }
function eulerYXZ(x, y, z) {
  const c1 = Math.cos(x / 2), c2 = Math.cos(y / 2), c3 = Math.cos(z / 2);
  const s1 = Math.sin(x / 2), s2 = Math.sin(y / 2), s3 = Math.sin(z / 2);
  return {
    x: s1 * c2 * c3 + c1 * s2 * s3,
    y: c1 * s2 * c3 - s1 * c2 * s3,
    z: c1 * c2 * s3 - s1 * s2 * c3,
    w: c1 * c2 * c3 + s1 * s2 * s3
  };
}
function rotq(q, v) {
  const t = mul(mul(q, { x: v.x, y: v.y, z: v.z, w: 0 }), invq(q));
  return { x: t.x, y: t.y, z: t.z };
}

// Samma kedja som GyroAim: YXZ, -90° runt X, skärmen runt Z.
export function kameraQuat(alpha, beta, gamma, screen) {
  const e = eulerYXZ((beta || 0) * DEG, (alpha || 0) * DEG, -(gamma || 0) * DEG);
  return mul(mul(e, axelVinkel(1, 0, 0, -Math.PI / 2)), axelVinkel(0, 0, 1, -(screen || 0) * DEG));
}

// rotationRate är grader/s i enhetens axlar (W3C): beta runt X, gamma runt Y, alpha runt Z.
// Skärmen vrider X/Y. Yaw är lodlinjen, så en dörrsväng inte blir en nick i landskap.
export function fartUrGyro(pose, rr) {
  const r = rr || {};
  const x = Number.isFinite(+r.beta) ? +r.beta : 0;
  const y = Number.isFinite(+r.gamma) ? +r.gamma : 0;
  const z = Number.isFinite(+r.alpha) ? +r.alpha : 0;
  const a = (pose?.screen || 0) * DEG, c = Math.cos(a), s = Math.sin(a);
  const wc = { x: x * c - y * s, y: x * s + y * c, z };
  const q = kameraQuat(pose?.alpha, pose?.beta, pose?.gamma, pose?.screen);
  const up = rotq(invq(q), { x: 0, y: 1, z: 0 });
  const upp = wc.x;
  const yaw = -(wc.x * up.x + wc.y * up.y + wc.z * up.z);
  const roll = -wc.z;
  return { upp, fram: -upp, yaw, roll };
}

export function derivat(fore, nu, dt) {
  const tom = { upp: 0, fram: 0, yaw: 0, roll: 0 };
  if (!fore || !nu || !(dt > 0) || dt > 0.25) return tom;
  return {
    upp: (nu.upp - fore.upp) / dt,
    fram: (nu.fram - fore.fram) / dt,
    yaw: (nu.yaw - fore.yaw) / dt,
    roll: (nu.roll - fore.roll) / dt
  };
}

export function nyttAxelTillstand() { return { jamn: 0 }; }

export function dodzon(x, z) {
  const a = Math.abs(x);
  if (!(z > 0) || a > z) return a > (z || 0) ? Math.sign(x) * (a - (z || 0)) : x;
  return 0;
}

// gain = sens * (1 + k * |x/25|^2). k = 0 är linjärt. Stor rörelse förstärks mer än liten.
export function forstarka(x, sens, k) {
  const ax = Math.abs(x);
  if (!(ax > 0)) return 0;
  const s = Number.isFinite(sens) ? sens : 1;
  const kk = Math.max(0, Number.isFinite(k) ? k : 0);
  const norm = ax / 25;
  return Math.sign(x) * ax * s * (1 + kk * norm * norm);
}

export function bearbetaAxel(tillstand, input, dt, inst) {
  const x = Number.isFinite(input) ? input : 0;
  const styrka = inst?.utjamning || 0;
  let jamn = x;
  if (styrka > 0 && dt > 0) {
    const tau = 0.04 + styrka * 0.5;
    const a = 1 - Math.exp(-Math.min(0.1, dt) / tau);
    jamn = tillstand.jamn + (x - tillstand.jamn) * a;
  }
  tillstand.jamn = jamn;
  if (inst?.pa === false) return 0;
  return forstarka(dodzon(jamn, inst?.dodzon || 0), inst?.kanslighet ?? 1, inst?.forstarkning || 0);
}

export function paceFranFram(fram) {
  if (!(fram >= PACE_FRAM[0])) return 0;
  if (fram < PACE_FRAM[1]) return 1;
  if (fram < PACE_FRAM[2]) return 2;
  return 3;
}

export function skapaFart() {
  let pace = 0, bromsRedo = true, framSedan = null;
  return {
    get pace() { return pace; },
    noll() { pace = 0; bromsRedo = true; framSedan = null; },
    steg(t, fram) {
      if (fram > 6) {
        if (framSedan == null) framSedan = t;
        if (t - framSedan >= 0.08) {
          const ons = paceFranFram(fram);
          if (ons > pace) pace = ons;
        }
        bromsRedo = true;
      } else {
        framSedan = null;
        if (fram < -8) {
          if (bromsRedo) { pace = Math.max(0, pace - 1); bromsRedo = false; }
        } else bromsRedo = true;
      }
      return pace;
    }
  };
}

export function skapaGester(spar = FLICK_SPAR) {
  let till = -1e9;
  return {
    steg(t, pitchUpp, ner, hopp) {
      if (t < till) return null;
      if (pitchUpp >= ner) { till = t + spar; return 'ner'; }
      if (-pitchUpp >= hopp) { till = t + spar; return 'hopp'; }
      return null;
    }
  };
}

export function fartFramAv({ pace, knappFram, knappBak, ligger }) {
  if (ligger && !knappFram) return 0;
  if (knappBak) return -KNAPP_FART;
  const cruise = PACE[Math.max(0, Math.min(3, pace | 0))].fart;
  if (knappFram) return Math.max(cruise, KNAPP_FART);
  return cruise;
}

export function sidoFart(rollUt) {
  if (!Number.isFinite(rollUt) || rollUt === 0) return 0;
  const m = Math.min(1.8, Math.abs(rollUt) / 25 * 1.5);
  return Math.sign(rollUt) * m;
}

// heading i radianer, 0 tittar mot -Z. Positiv heading är höger.
export function stegPosition(pos, heading, dt, fram, sida) {
  const fx = Math.sin(heading), fz = -Math.cos(heading);
  const rx = Math.cos(heading), rz = Math.sin(heading);
  return {
    x: pos.x + (fx * fram + rx * sida) * dt,
    z: pos.z + (fz * fram + rz * sida) * dt
  };
}

export function visaNamn({ ligger, hoppar, fram, pace, sida }) {
  if (ligger) return 'Ligger';
  if (hoppar) return 'Hoppar';
  if (fram < -0.2) return 'Backar';
  if (pace > 0) return PACE[pace].namn;
  if (Math.abs(sida) > 0.15) return 'Sidled';
  return 'Står';
}

export function bytLage(nu) {
  return nu === 'sikta'
    ? { lage: 'ga', pace: 0, ligger: false, hoppar: false }
    : { lage: 'sikta', pace: 0, ligger: false, hoppar: false };
}

// Siktet är absolut: samma vinkel ger samma riktning. Ingen integrering.
export function sikteRiktning(yawDeg, uppDeg, rollDeg, skak) {
  return {
    yaw: (yawDeg || 0) * DEG + (skak?.x || 0),
    pitch: (uppDeg || 0) * DEG + (skak?.y || 0),
    roll: (rollDeg || 0) * DEG
  };
}

export function skapaJamnhet(fonster = 0.4) {
  const ax = { vrid: [], fram: [], sida: [] };
  return {
    lagg(t, fart) {
      for (const k of Object.keys(ax)) {
        const v = Number.isFinite(fart?.[k]) ? fart[k] : 0;
        ax[k].push({ t, v });
        const gr = t - fonster;
        while (ax[k].length && ax[k][0].t < gr) ax[k].shift();
      }
    },
    las() {
      const ut = {};
      for (const k of Object.keys(ax)) {
        const s = ax[k];
        if (s.length < 2) { ut[k] = { std: 0, medel: 0, n: s.length }; continue; }
        let sum = 0;
        for (const p of s) sum += p.v;
        const medel = sum / s.length;
        let v = 0;
        for (const p of s) { const d = p.v - medel; v += d * d; }
        ut[k] = { std: Math.sqrt(v / s.length), medel, n: s.length };
      }
      return ut;
    },
    tom() { for (const k of Object.keys(ax)) ax[k].length = 0; }
  };
}

export function skapaBrus() {
  const golv = { vrid: null, fram: null, sida: null };
  return {
    lagg(mat) {
      for (const k of Object.keys(golv)) {
        const std = mat?.[k]?.std;
        if (!Number.isFinite(std) || (mat[k].n || 0) < 6) continue;
        if (golv[k] == null) golv[k] = std;
        else golv[k] += (std - golv[k]) * (std < golv[k] ? 0.2 : 0.004);
      }
    },
    las() { return { ...golv }; },
    tystast() {
      const v = Object.values(golv).filter(n => n != null);
      if (!v.length) return null;
      return Math.min(...v);
    },
    noll() { golv.vrid = golv.fram = golv.sida = null; }
  };
}

// 0 = jämn (stilla eller stadig fart), 1 = tydligt ryckig. Högre känslighet tar med mindre skillnad.
export function ryckighet(std, golv, kanslighet) {
  const over = Math.max(0, (std || 0) - (golv || 0));
  const ref = 12 / Math.max(0.25, kanslighet || 1);
  return Math.max(0, Math.min(1, over / ref));
}

export function skapaSkak() {
  return { amp: 0, start: 0, slut: 0, fas: 0 };
}

export function skakSteg(st, t, dt, ojamn, cfg) {
  const vikt = Math.max(0, ojamn || 0) * (cfg.kanslighet || 1);
  const forslag = Math.min(cfg.maxLugning, K_LUGN * vikt);
  const ampNu = Math.min(cfg.maxSkak, (vikt / 20) * cfg.maxSkak);
  const andel = t < st.slut && st.slut > st.start ? (st.slut - t) / (st.slut - st.start) : 0;
  if (ampNu > st.amp * Math.max(0, andel) + 1e-6) {
    st.amp = ampNu;
    st.start = t;
    st.slut = t + (ampNu > 0 ? Math.max(0.05, forslag) : 0);
  }
  let niva = 0;
  if (t < st.slut && st.slut > st.start) niva = st.amp * (st.slut - t) / (st.slut - st.start);
  niva = Math.max(niva, ampNu);
  st.fas += (dt || 0) * (2.2 + niva * 4);
  const rad = niva * DEG;
  return {
    niva,
    x: rad * Math.sin(st.fas * 1.7),
    y: rad * Math.cos(st.fas * 1.3),
    kvar: Math.max(0, st.slut - t),
    lugn: st.slut > st.start ? st.slut - st.start : 0
  };
}

export function hoppMark(y, vy, dt, grav = 14) {
  let ny = vy - grav * dt;
  let y2 = y + ny * dt;
  let land = false;
  if (y2 <= 0 && ny < 0) { y2 = 0; ny = 0; land = y > 0.02 || vy > 0; }
  if (y2 < 0) y2 = 0;
  return { y: y2, vy: ny, land };
}

export { AXEL_NYCKLAR };
