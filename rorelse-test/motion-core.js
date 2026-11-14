// motion-core.js – MotionCore v0.1.0 (2026-11-07)
// Motoroberoende kärna för gyro, rörelse och haptik i mobilwebben (WW2-projektet).
// Underlag: RESEARCH_GYRO_HAPTIK.md (avsnitt 13 = mönstren, avsnitt 12 = mätlistan).
// Enheter internt: sekunder, rad/s, m/s², meter. Grader bara i rapport/UI-fält som heter ...Deg.
// Ren ES-modul utan beroenden. Allt som rör window/document/navigator ligger i adaptrar
// (createDomSource, requestMotionPermission, createHaptics) och får sina objekt injicerade.

export const VERSION = '0.1.0';
export const G = 9.80665;
export const DEG = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

// ---------- Plattform ----------
export function detectPlatform(nav) {
  if (!nav) return 'other';
  const ua = nav.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}
export function safariMajor(nav) {
  const m = /Version\/(\d+)(?:\.(\d+))?.*Safari/.exec((nav && nav.userAgent) || '');
  return m ? { major: +m[1], minor: +(m[2] || 0) } : null;
}

// ---------- interval: iOS ger sekunder (0,0167), specen ms (16) ----------
export function normalizeIntervalToSeconds(iv) {
  if (iv == null || !Number.isFinite(iv) || iv <= 0) return { s: null, unit: 'saknas' };
  if (iv < 1) return { s: iv, unit: 's' };
  return { s: iv / 1000, unit: 'ms' };
}

// ---------- Normalisering ----------
// Ut: acc/accG i m/s² enligt specen (platt, skärm upp => accG z ≈ +9,81),
// gyro i rad/s [x,y,z] (rotationRate alpha=x, beta=y, gamma=z), i skärmens axlar
// efter rotation med skärmvinkeln. devGyro/devAccG = samma i enhetens axlar.
export function createNormalizer(opts = {}) {
  const o = { platform: 'other', accSign: null, getScreenAngleDeg: () => 0, maxDt: 0.25, ...opts };
  let accSign = o.accSign != null ? (o.accSign < 0 ? -1 : 1) : (o.platform === 'ios' ? -1 : 1);
  let accSignSource = o.accSign != null ? 'inställning' : (o.platform === 'ios' ? 'plattform (iOS-regel)' : 'plattform (spec)');
  let lastT = null, lastKey = null;
  const vec = (v, s) => (v && v.x != null && v.y != null && v.z != null) ? [s * v.x, s * v.y, s * v.z] : null;
  const rate = r => (r && r.alpha != null && r.beta != null && r.gamma != null) ? [r.alpha * DEG, r.beta * DEG, r.gamma * DEG] : null;
  const rotZ = (v, c, s) => v && [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]];
  return {
    get accSign() { return accSign; },
    get accSignSource() { return accSignSource; },
    setAccSign(sign, source = 'kalibrering') { accSign = sign < 0 ? -1 : 1; accSignSource = source; },
    reset() { lastT = null; lastKey = null; },
    fromMotion(e) {
      const t = e.timeStamp;
      const iv = normalizeIntervalToSeconds(e.interval);
      const dtMeasured = lastT == null ? null : (t - lastT) / 1000;
      let dt = dtMeasured;
      if (dt == null || dt <= 0 || dt > o.maxDt) dt = iv.s || 1 / 60;
      lastT = t;
      const a = e.acceleration, ag = e.accelerationIncludingGravity, rr = e.rotationRate;
      const key = JSON.stringify([ag && [ag.x, ag.y, ag.z], rr && [rr.alpha, rr.beta, rr.gamma], a && [a.x, a.y, a.z]]);
      const dup = key === lastKey;
      lastKey = key;
      const devAcc = vec(a, accSign), devAccG = vec(ag, accSign), devGyro = rate(rr);
      const angle = Number(o.getScreenAngleDeg()) || 0;
      const th = angle * DEG, c = Math.cos(th), s = Math.sin(th);
      return {
        t, dt, dtMeasured, dup, screenAngleDeg: angle,
        intervalS: iv.s, intervalUnit: iv.unit, intervalRaw: e.interval ?? null,
        acc: rotZ(devAcc, c, s), accG: rotZ(devAccG, c, s), gyro: rotZ(devGyro, c, s),
        devAcc, devAccG, devGyro,
        raw: { acc: a ? [a.x, a.y, a.z] : null, accG: ag ? [ag.x, ag.y, ag.z] : null, rr: rr ? [rr.alpha, rr.beta, rr.gamma] : null }
      };
    },
    fromOrientation(e) {
      const hasAbs = typeof e.absolute === 'boolean';
      return {
        t: e.timeStamp, alphaDeg: e.alpha, betaDeg: e.beta, gammaDeg: e.gamma,
        absolute: hasAbs ? e.absolute : null,
        compassHeadingDeg: e.webkitCompassHeading ?? null, compassAccuracyDeg: e.webkitCompassAccuracy ?? null,
        quat: (e.alpha != null && e.beta != null && e.gamma != null) ? quatFromEuler(e.alpha, e.beta, e.gamma) : null
      };
    }
  };
}

// ---------- Kvaternioner [x,y,z,w] ----------
export function quatFromEuler(alphaDeg, betaDeg, gammaDeg) {
  const z = alphaDeg * DEG / 2, x = betaDeg * DEG / 2, y = gammaDeg * DEG / 2;
  const cX = Math.cos(x), cY = Math.cos(y), cZ = Math.cos(z), sX = Math.sin(x), sY = Math.sin(y), sZ = Math.sin(z);
  return [sX * cY * cZ - cX * sY * sZ, cX * sY * cZ + sX * cY * sZ, cX * cY * sZ + sX * sY * cZ, cX * cY * cZ - sX * sY * sZ];
}
export function quatMul(a, b) {
  const [ax, ay, az, aw] = a, [bx, by, bz, bw] = b;
  return [ax * bw + aw * bx + ay * bz - az * by, ay * bw + aw * by + az * bx - ax * bz,
    az * bw + aw * bz + ax * by - ay * bx, aw * bw - ax * bx - ay * by - az * bz];
}
export const quatInv = a => [-a[0], -a[1], -a[2], a[3]];
export function quatFromAxisAngle(axis, ang) { const s = Math.sin(ang / 2); return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(ang / 2)]; }
export function quatAngleRad(a, b) { const d = Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]); return 2 * Math.acos(Math.min(1, d)); }
// Om-centrering: rel = inv(ref) * now
export const quatRelative = (ref, now) => quatMul(quatInv(ref), now);

// ---------- Filter ----------
export function createOneEuro({ minCutoff = 1.0, beta = 0.0, dCutoff = 1.0 } = {}) {
  const al = (cutoff, dt) => { const r = 2 * Math.PI * cutoff * dt; return r / (r + 1); };
  let xPrev = null, dxPrev = 0;
  const f = (x, dt) => {
    if (xPrev === null || !(dt > 0)) { xPrev = x; return x; }
    const dx = (x - xPrev) / dt;
    const ad = al(f.dCutoff, dt); dxPrev = ad * dx + (1 - ad) * dxPrev;
    const a = al(f.minCutoff + f.beta * Math.abs(dxPrev), dt);
    xPrev = a * x + (1 - a) * xPrev; return xPrev;
  };
  f.minCutoff = minCutoff; f.beta = beta; f.dCutoff = dCutoff;
  f.reset = (x = null) => { xPrev = x; dxPrev = 0; };
  return f;
}
export function tighten(v, threshold) {
  if (!(threshold > 0)) return v;
  const m = Math.abs(v); return m < threshold ? v * (m / threshold) : v;
}

// ---------- Gravitation ----------
export function gravityFromSample(s) {
  if (!s.accG || !s.acc) return null;
  return [s.accG[0] - s.acc[0], s.accG[1] - s.acc[1], s.accG[2] - s.acc[2]];
}
// Komplementärfilter: gEst = enhetsvektor "upp" (samma riktning som accG i vila, spec-tecken).
export function updateGravity(gEst, gyro, accG, dt, k = 0.02) {
  if (!gEst) { const n = Math.hypot(...accG) || 1; return accG.map(v => v / n); }
  const [wx, wy, wz] = gyro.map(v => -v * dt);
  let g = [gEst[0] + (wy * gEst[2] - wz * gEst[1]), gEst[1] + (wz * gEst[0] - wx * gEst[2]), gEst[2] + (wx * gEst[1] - wy * gEst[0])];
  const n = Math.hypot(...accG) || 1, m = accG.map(v => v / n);
  g = g.map((v, i) => v + (m[i] - v) * k);
  const gn = Math.hypot(...g) || 1; return g.map(v => v / gn);
}

// ---------- Musliknande gyrosikte med 1€-filter ----------
// yaw = rotation runt skärmens y, pitch = runt skärmens x. Tecken är inställbara (verifieras på enhet).
export function createAimMouse(opts = {}) {
  const o = {
    sensYaw: 1, sensPitch: 1, yawSign: 1, pitchSign: 1, invertPitch: false,
    tightenDegS: 1.5, maxPitchDeg: 85, useOneEuro: true,
    oneEuro: { minCutoff: 1.0, beta: 0.02, dCutoff: 1.0 }, ...opts
  };
  const fy = createOneEuro(o.oneEuro), fp = createOneEuro(o.oneEuro);
  let bias = [0, 0, 0], rawYaw = 0, rawPitch = 0, yaw = 0, pitch = 0, enabled = true;
  const clampP = v => Math.max(-o.maxPitchDeg * DEG, Math.min(o.maxPitchDeg * DEG, v));
  return {
    options: o,
    get bias() { return bias.slice(); },
    setBias(b) { bias = b.slice(); },
    setEnabled(b) { enabled = !!b; },
    get enabled() { return enabled; },
    setOneEuro(p) { Object.assign(o.oneEuro, p); for (const f of [fy, fp]) Object.assign(f, o.oneEuro); },
    recenter() { rawYaw = rawPitch = yaw = pitch = 0; fy.reset(0); fp.reset(0); },
    update(s) {
      // Dubbletter integreras: tiden mellan händelserna är verklig och hastigheten är bästa skattningen.
      if (!s.gyro || !enabled) return { yaw, pitch, dYaw: 0, dPitch: 0 };
      const th = o.tightenDegS * DEG;
      const yr = o.yawSign * tighten(s.gyro[1] - bias[1], th);
      const pr = (o.invertPitch ? -1 : 1) * o.pitchSign * tighten(s.gyro[0] - bias[0], th);
      rawYaw += yr * o.sensYaw * s.dt;
      rawPitch = clampP(rawPitch + pr * o.sensPitch * s.dt);
      const ny = o.useOneEuro ? fy(rawYaw, s.dt) : rawYaw, np = o.useOneEuro ? fp(rawPitch, s.dt) : rawPitch;
      const out = { yaw: ny, pitch: np, dYaw: ny - yaw, dPitch: np - pitch, rawYaw, rawPitch };
      yaw = ny; pitch = np; return out;
    }
  };
}
// Medelvärde av gyro i vila => bias (rad/s)
export function meanVec(list) {
  const m = [0, 0, 0]; let n = 0;
  for (const v of list) if (v) { m[0] += v[0]; m[1] += v[1]; m[2] += v[2]; n++; }
  return n ? m.map(x => x / n) : m;
}

// ---------- Mätare ----------
function quantile(sorted, q) { if (!sorted.length) return null; const i = (sorted.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i); return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo); }

// Frekvens, jitter, dubbletter, luckor
export function createRateMeter() {
  let dts = [], dups = 0, n = 0, first = null, last = null, intervalRaw = null, intervalUnit = null;
  return {
    reset() { dts = []; dups = 0; n = 0; first = last = null; intervalRaw = intervalUnit = null; },
    add(s) {
      n++; if (first == null) first = s.t; last = s.t;
      if (s.dup) dups++;
      if (s.dtMeasured != null) dts.push(s.dtMeasured * 1000);
      if (s.intervalRaw != null) { intervalRaw = s.intervalRaw; intervalUnit = s.intervalUnit; }
    },
    summary() {
      const sorted = dts.slice().sort((a, b) => a - b);
      const mean = sorted.length ? sorted.reduce((a, b) => a + b, 0) / sorted.length : null;
      const sd = mean == null ? null : Math.sqrt(sorted.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, sorted.length - 1));
      const med = quantile(sorted, 0.5);
      const durS = first == null ? 0 : (last - first) / 1000;
      const hist = {};
      for (const d of sorted) { const b = Math.round(d); hist[b] = (hist[b] || 0) + 1; }
      return {
        antal: n, varaktighetS: durS,
        hzMedel: durS > 0 ? (n - 1) / durS : null,
        hzFranMedianDt: med ? 1000 / med : null,
        dtMs: { medel: mean, median: med, p5: quantile(sorted, 0.05), p95: quantile(sorted, 0.95), min: sorted[0] ?? null, max: sorted.at(-1) ?? null },
        jitterMsSd: sd,
        dubbletter: dups, dubblettAndel: n ? dups / n : 0,
        dtNollEllerNegativ: sorted.filter(d => d <= 0.0001).length,
        luckor: med ? sorted.filter(d => d > 1.8 * med).length : 0,
        intervalRa: intervalRaw, intervalEnhet: intervalUnit,
        dtHistogramMs: hist
      };
    }
  };
}

// Drift och hopp i alpha (vridning åt sidorna)
export function createDriftMeter({ jumpDeg = 5 } = {}) {
  let pts = [], prev = null, unwrapped = 0, jumps = [], marks = [];
  return {
    reset() { pts = []; prev = null; unwrapped = 0; jumps = []; marks = []; },
    mark(t, label) { marks.push({ t, label, alphaDeg: pts.length ? pts.at(-1)[1] : null }); },
    add(t, alphaDeg) {
      if (alphaDeg == null) return;
      if (prev != null) {
        let d = alphaDeg - prev; if (d > 180) d -= 360; if (d < -180) d += 360;
        if (Math.abs(d) >= jumpDeg) jumps.push({ t, stegDeg: d });
        unwrapped += d;
      } else unwrapped = alphaDeg;
      prev = alphaDeg; pts.push([t, unwrapped]);
    },
    summary() {
      if (pts.length < 2) return { antal: pts.length };
      const t0 = pts[0][0]; let sx = 0, sy = 0, sxx = 0, sxy = 0; const n = pts.length;
      for (const [t, a] of pts) { const x = (t - t0) / 60000; sx += x; sy += a; sxx += x * x; sxy += x * a; }
      const slope = (n * sxy - sx * sy) / ((n * sxx - sx * sx) || 1);
      let min = Infinity, max = -Infinity; for (const [, a] of pts) { min = Math.min(min, a); max = Math.max(max, a); }
      return { antal: n, varaktighetS: (pts.at(-1)[0] - t0) / 1000, driftDegPerMin: slope, spannDeg: max - min, totalDeg: pts.at(-1)[1] - pts[0][1], hopp: jumps, markeringar: marks };
    }
  };
}

// Stillhet: |ω| under tröskel
export const isStill = (s, thrDegS = 3) => !!s.gyro && Math.hypot(...s.gyro) < thrDegS * DEG;

// Tecken för acceleration: telefonen platt med skärmen UPPÅT. Specen: accG z = +9,81.
export function createAccSignCheck() {
  let zs = [], norms = [];
  return {
    reset() { zs = []; norms = []; },
    add(s) { if (s.raw.accG) { zs.push(s.raw.accG[2]); norms.push(Math.hypot(...s.raw.accG)); } },
    result() {
      if (zs.length < 5) return { ok: false, orsak: 'för få sampel' };
      const z = zs.reduce((a, b) => a + b, 0) / zs.length, nrm = norms.reduce((a, b) => a + b, 0) / norms.length;
      const flat = Math.abs(Math.abs(z) - nrm) < 0.6 && Math.abs(nrm - G) < 1.0;
      return { ok: flat, raZMedel: z, normMedel: nrm, platt: flat, teckenFaktor: z >= 0 ? 1 : -1, foljerSpec: z >= 0, orsak: flat ? null : 'telefonen låg inte platt och stilla' };
    }
  };
}

// Tecken för gyro: integrera rotationRate (enhetens axlar, grader) under en styrd rörelse.
export function createGyroSignCheck() {
  let ang = [0, 0, 0], n = 0;
  return {
    reset() { ang = [0, 0, 0]; n = 0; },
    add(s) { if (s.devGyro) { for (let i = 0; i < 3; i++) ang[i] += s.devGyro[i] * s.dt * RAD2DEG; n++; } },
    result(expect /* {axel:'x'|'y'|'z', tecken:1|-1} */) {
      const ax = ['x', 'y', 'z'], abs = ang.map(Math.abs), i = abs.indexOf(Math.max(...abs));
      const res = { antal: n, vinkelDeg: { x: ang[0], y: ang[1], z: ang[2] }, dominantAxel: ax[i], tecken: Math.sign(ang[i]) };
      if (expect) { res.forvantat = expect; res.matcharSpec = res.dominantAxel === expect.axel && res.tecken === expect.tecken; }
      if (abs[i] < 30) res.varning = 'för liten rörelse (<30°)';
      return res;
    }
  };
}

// ---------- Svingdetektor (golf) ----------
export function createSwingDetector(opts = {}) {
  const c = {
    startDegS: 120, restDegS: 25, restMs: 250, armWindowMs: 1500, endMs: 300, refractoryMs: 800, minDurationMs: 120,
    radiusM: 1.6, clipMinDegS: 1800, clipFlatTolDegS: 3, sensorMaxDegS: 2000, ...opts
  };
  let st = 'VILA', restSince = null, armed = false, leftRest = null, buf = [], quietSince = null, lastEnd = -1e12;
  function analyse() {
    const w = buf.map(b => Math.hypot(...b.g));
    let ip = 0; for (let i = 1; i < w.length; i++) if (w[i] > w[ip]) ip = i;
    const pk = buf[ip], pu = pk.g.map(v => v / (w[ip] || 1));
    // topp = sista sampel före toppen där projektionen på toppriktningen var <= 0 (baksving -> nedsving)
    let top = -1; for (let i = ip; i >= 0; i--) { const d = buf[i].g[0] * pu[0] + buf[i].g[1] * pu[1] + buf[i].g[2] * pu[2]; if (d <= 0) { top = i; break; } }
    // subsampel-topp (parabel)
    let tPeak = pk.t, wPeak = w[ip];
    if (ip > 0 && ip < w.length - 1) {
      const a = w[ip - 1], b = w[ip], d = w[ip + 1], den = a - 2 * b + d;
      if (den < 0) { const off = 0.5 * (a - d) / den; tPeak = pk.t + off * ((buf[ip + 1].t - buf[ip - 1].t) / 2); wPeak = b - 0.25 * (a - d) * off; }
    }
    // klippning: >=2 sampel i rad på samma axel, |komponent| >= clipMin och nästan lika
    let clipped = false, maxComp = 0;
    for (let i = 0; i < buf.length; i++) for (let k = 0; k < 3; k++) {
      const v = Math.abs(buf[i].g[k]) * RAD2DEG; maxComp = Math.max(maxComp, v);
      if (i > 0) { const p = Math.abs(buf[i - 1].g[k]) * RAD2DEG; if (v >= c.clipMinDegS && p >= c.clipMinDegS && Math.abs(v - p) <= c.clipFlatTolDegS) clipped = true; }
    }
    if (maxComp >= 0.98 * c.sensorMaxDegS) clipped = true;
    let aPk = 0, taPk = null; for (const b of buf) if (b.a) { const m = Math.hypot(...b.a); if (m > aPk) { aPk = m; taPk = b.t; } }
    const omega = clipped ? w[ip] : Math.max(wPeak, w[ip]);   // klippt: ingen interpolation över taket
    const v = omega * c.radiusM;
    const dts = []; for (let i = 1; i < buf.length; i++) dts.push(buf[i].t - buf[i - 1].t);
    return {
      tStart: buf[0].t, tSlut: buf.at(-1).t, varaktighetMs: buf.at(-1).t - buf[0].t,
      tTopp: top >= 0 ? buf[top].t : null, harBaksving: top > 0,
      baksvingMs: top > 0 ? buf[top].t - buf[0].t : null, nedsvingMs: top >= 0 ? tPeak - buf[top].t : null,
      tMaxOmega: tPeak, omegaMaxRadS: omega, omegaMaxDegS: omega * RAD2DEG, maxAxelDegS: maxComp,
      samplesINedsving: top >= 0 ? ip - top : null, antalSampel: buf.length,
      klippt: clipped, radieM: c.radiusM,
      klubbfartMS: v, klubbfartKmH: v * 3.6, fartArMinst: clipped,
      accToppMS2: aPk, tAccTopp: taPk, dtMedelMs: dts.length ? dts.reduce((x, y) => x + y, 0) / dts.length : null
    };
  }
  const det = (s, emit) => {
    if (!s.gyro) return;
    const w = Math.hypot(...s.gyro) * RAD2DEG, t = s.t;
    if (st === 'VILA') {
      if (w < c.restDegS) {
        if (restSince == null) restSince = t;
        if (t - restSince >= c.restMs) { armed = true; leftRest = null; }
      } else {
        restSince = null;
        if (armed && leftRest == null) leftRest = t;
        if (armed && t - leftRest > c.armWindowMs) armed = false;   // för lång långsam rörelse: inte en sving
        if (armed && w > c.startDegS && t - lastEnd >= c.refractoryMs) {
          st = 'AKTIV'; armed = false; leftRest = null;
          buf = [{ t, g: s.gyro.slice(), a: s.acc && s.acc.slice() }]; quietSince = null; emit && emit('swingStart', { t });
        }
      }
    } else {
      buf.push({ t, g: s.gyro.slice(), a: s.acc && s.acc.slice() });
      if (w < c.restDegS) { if (quietSince == null) quietSince = t; } else quietSince = null;
      if ((quietSince != null && t - quietSince >= c.endMs) || buf.length > 600) {
        const dur = buf.at(-1).t - buf[0].t;
        st = 'VILA'; lastEnd = t; restSince = null;
        if (dur >= c.minDurationMs) emit && emit('swing', analyse()); else emit && emit('swingAvbruten', { t, varaktighetMs: dur });
        buf = [];
      }
    }
  };
  det.options = c; det.reset = () => { st = 'VILA'; restSince = null; armed = false; leftRest = null; buf = []; lastEnd = -1e12; };
  Object.defineProperty(det, 'state', { get: () => st });
  return det;
}

// ---------- Skak/stöt ----------
export function createShakeDetector({ thresholdMS2 = 15, refractoryMs = 250 } = {}) {
  let last = -1e12;
  return (s, emit) => {
    if (!s.acc || s.dup) return;
    const m = Math.hypot(...s.acc);
    if (m >= thresholdMS2 && s.t - last >= refractoryMs) { last = s.t; emit && emit('shake', { t: s.t, accMS2: m }); }
  };
}

// ---------- Inspelning (JSON, SI-enheter) ----------
const r4 = v => v == null ? null : Math.round(v * 1e4) / 1e4;
const r4v = a => a ? a.map(r4) : null;
export function createRecorder({ maxSamples = 30000 } = {}) {
  let rec = null;
  return {
    start(device = {}) {
      rec = { format: 'motioncore-rec', version: 1, coreVersion: VERSION, skapad: new Date().toISOString(), device,
        units: { t: 'ms (event.timeStamp)', dt: 's', gyro: 'rad/s', acc: 'm/s2', vinklar: 'grader', langd: 'm' },
        samples: [], orientation: [], marks: [], results: {}, avkortad: false };
      return rec;
    },
    get active() { return !!rec; },
    addSample(s) {
      if (!rec) return; if (rec.samples.length >= maxSamples) { rec.avkortad = true; return; }
      rec.samples.push({ t: r4(s.t), dt: r4(s.dt), dup: s.dup || undefined, acc: r4v(s.acc), accG: r4v(s.accG), gyro: r4v(s.gyro),
        sv: s.screenAngleDeg || undefined, raw: { accG: r4v(s.raw.accG), rr: r4v(s.raw.rr), iv: s.intervalRaw } });
    },
    addOrientation(o) { if (rec && rec.orientation.length < maxSamples) rec.orientation.push([r4(o.t), r4(o.alphaDeg), r4(o.betaDeg), r4(o.gammaDeg), o.compassHeadingDeg == null ? null : r4(o.compassHeadingDeg)]); },
    mark(t, label, data) { if (rec) rec.marks.push({ t, label, ...(data ? { data } : {}) }); },
    result(name, obj) { if (rec) (rec.results[name] ||= []).push({ tid: new Date().toISOString(), ...obj }); },
    toJSON() { return rec; },
    clear() { rec = null; }
  };
}

// ================= Adaptrar (DOM injiceras) =================

// Behörighet: anropas DIREKT i en click/pointerup, utan await före.
export function requestMotionPermission(win = globalThis) {
  const DME = win.DeviceMotionEvent, DOE = win.DeviceOrientationEvent;
  if (!win.isSecureContext) return Promise.resolve('insecure');
  if (!DME && !DOE) return Promise.resolve('unsupported');
  const needM = typeof DME?.requestPermission === 'function';
  const needO = typeof DOE?.requestPermission === 'function';
  if (!needM && !needO) return Promise.resolve('granted');
  let pm, po;
  try {
    pm = needM ? DME.requestPermission() : Promise.resolve('granted');
    po = needO ? DOE.requestPermission() : Promise.resolve('granted');
  } catch (e) { return Promise.resolve('error'); }
  return Promise.all([pm, po]).then(([a, b]) => (a === 'granted' && b === 'granted') ? 'granted' : 'denied')
    .catch(err => (err && err.name === 'NotAllowedError') ? 'needs-gesture' : 'error');
}

export function screenAngleDeg(win = globalThis) {
  const so = win.screen && win.screen.orientation;
  const raw = so && typeof so.angle === 'number' ? so.angle : (typeof win.orientation === 'number' ? win.orientation : 0);
  if (!Number.isFinite(+raw)) return 0;
  return ((+raw % 360) + 360) % 360;
}

// Händelsekälla: kopplar devicemotion/deviceorientation/visibilitychange till callbacks.
export function createDomSource(win, { onMotion, onOrientation, onVisibility } = {}) {
  const doc = win.document;
  const hm = e => onMotion && onMotion(e), ho = e => onOrientation && onOrientation(e), hv = () => onVisibility && onVisibility(doc.visibilityState, performance.now());
  let on = false;
  return {
    start() { if (on) return; on = true; win.addEventListener('devicemotion', hm); win.addEventListener('deviceorientation', ho); doc.addEventListener('visibilitychange', hv); },
    stop() { if (!on) return; on = false; win.removeEventListener('devicemotion', hm); win.removeEventListener('deviceorientation', ho); doc.removeEventListener('visibilitychange', hv); },
    get running() { return on; }
  };
}

// Haptik: ärlig kapabilitetsrapport. iOS: bara ett lätt tick vid riktigt tryck (switch, Safari 18+).
export function createHaptics(win = globalThis) {
  const doc = win.document, nav = win.navigator;
  const platform = detectPlatform(nav), sv = safariMajor(nav);
  const hasVibrate = typeof nav.vibrate === 'function';
  const isFirefox = /Firefox|FxiOS/.test(nav.userAgent || '');
  const switchAttr = !!(win.HTMLInputElement && 'switch' in win.HTMLInputElement.prototype);
  const iosTick = platform === 'ios' && (switchAttr || (sv && sv.major >= 18));
  const caps = {
    plattform: platform, safariVersion: sv ? `${sv.major}.${sv.minor}` : null,
    vibrateApi: hasVibrate,
    vibrateFungerar: !hasVibrate || platform === 'ios' ? 'nej'
      : isFirefox ? 'nej (Firefox: API finns men gör inget)'
      : platform === 'android' ? 'troligen (kräver tidigare tryck)'
      : 'API finns, men en dator har oftast ingen vibrationsmotor',
    monster: hasVibrate && platform !== 'ios' && !isFirefox,
    styrka: false,
    switchElement: switchAttr,
    iosTickVidTryck: iosTick ? 'troligen: ett lätt tick per riktigt tryck, fast styrka; kan inte mätas från JS' : 'nej',
    iosSkriptTrigger: platform === 'ios' ? 'nej (stängt från iOS 26.5)' : 'ej aktuellt',
    beskrivning: platform === 'ios'
      ? 'iOS: ingen vibration. Bara ett lätt tick när användaren själv trycker på en knapp med haptikyta.'
      : (hasVibrate && !isFirefox ? 'navigator.vibrate: längd och paus, ingen styrka. Kräver ett tidigare tryck.' : 'Ingen haptik tillgänglig.')
  };
  return {
    capabilities: () => ({ ...caps }),
    pulse(pattern) {
      if (!caps.monster) return { ok: false, metod: 'ingen' };
      let ok = false; try { ok = nav.vibrate(pattern); } catch (e) { ok = false; }
      return { ok, metod: 'vibrate' };
    },
    attachTapTarget(el, onTick) {
      if (platform !== 'ios' || el.querySelector(':scope > [data-hapt]')) return false;
      const label = doc.createElement('label'); label.setAttribute('data-hapt', ''); label.setAttribute('aria-hidden', 'true');
      Object.assign(label.style, { position: 'absolute', inset: '0', touchAction: 'manipulation' });
      label.style.setProperty('-webkit-tap-highlight-color', 'transparent');
      const sw = doc.createElement('input'); sw.type = 'checkbox'; sw.setAttribute('switch', '');
      Object.assign(sw.style, { position: 'absolute', width: '1px', height: '1px', margin: '0', visibility: 'hidden' });
      sw.addEventListener('click', e => { e.stopPropagation(); onTick && onTick(e); });
      label.append(sw);
      if (win.getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.append(label);
      return true;
    }
  };
}
