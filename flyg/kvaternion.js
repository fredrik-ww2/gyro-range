// Kvaternionflygning för jaktplan som ska kunna loopa och rolla.
// Orienteringen är en kvaternion, inte tre euler-vinklar, så nosen kan gå
// genom lodrätt utan att roll och gir byter plats (gimbal lock).
// Lyft, motstånd och roder växer med dynamiskt tryck. Alla tal ligger i planets aero-objekt.
import { luftdensitet } from './flight-model.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function qmul(a, b) {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z
  };
}

export function qnorm(q) {
  const n = Math.hypot(q.x, q.y, q.z, q.w);
  if (!(n > 0)) return { x: 0, y: 0, z: 0, w: 1 };
  return { x: q.x / n, y: q.y / n, z: q.z / n, w: q.w / n };
}

// Vinkel i radianer kring en axel. Används både för nos och för att jämföra euler.
export function qaxel(x, y, z, vinkel) {
  const L = Math.hypot(x, y, z);
  if (!(L > 0) || !Number.isFinite(vinkel)) return { x: 0, y: 0, z: 0, w: 1 };
  const h = vinkel * 0.5;
  const s = Math.sin(h) / L;
  return { x: x * s, y: y * s, z: z * s, w: Math.cos(h) };
}

export function qrot(q, v) {
  const { x, y, z, w } = q;
  const tx = 2 * (y * v.z - z * v.y);
  const ty = 2 * (z * v.x - x * v.z);
  const tz = 2 * (x * v.y - y * v.x);
  return {
    x: v.x + w * tx + (y * tz - z * ty),
    y: v.y + w * ty + (z * tx - x * tz),
    z: v.z + w * tz + (x * ty - y * tx)
  };
}

export function qvinkel(a, b) {
  const d = Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w);
  return 2 * Math.acos(Math.min(1, d));
}

// Samma YXZ som three.js och som aircraft.rotation.set(pitch, yaw, roll, 'YXZ').
export function eulerYXZ(x, y, z) {
  const c1 = Math.cos(x / 2), c2 = Math.cos(y / 2), c3 = Math.cos(z / 2);
  const s1 = Math.sin(x / 2), s2 = Math.sin(y / 2), s3 = Math.sin(z / 2);
  return {
    x: s1 * c2 * c3 + c1 * s2 * s3,
    y: c1 * s2 * c3 - s1 * c2 * s3,
    z: c1 * c2 * s3 - s1 * s2 * c3,
    w: c1 * c2 * c3 + s1 * s2 * s3
  };
}

function prik(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }

// Vid exakt lodrätt sammanfaller euler-gir och euler-roll. En gir-vinkel
// vrider då vingarna men nosen stannar rakt upp. Kroppens gir kring
// kvaternionens uppräta axel vrider nosen vidare, så loopen kan fortsätta.
export function gimbalProv() {
  const lod = qnorm(qaxel(1, 0, 0, Math.PI / 2));
  const kvat = qnorm(qmul(lod, qaxel(0, 1, 0, 0.8)));
  const euler = eulerYXZ(Math.PI / 2, 0.8, 0);
  const fk = qrot(kvat, { x: 0, y: 0, z: -1 });
  const fe = qrot(euler, { x: 0, y: 0, z: -1 });
  let q = { x: 0, y: 0, z: 0, w: 1 };
  let fore = qrot(q, { x: 0, y: 0, z: -1 });
  let hopp = 0;
  let sagLod = false;
  let sagRygg = false;
  const w = 1.2;
  for (let i = 0; i < 600; i++) {
    q = qnorm(qmul(q, qaxel(w, 0, 0, w * 0.01)));
    const f = qrot(q, { x: 0, y: 0, z: -1 });
    const u = qrot(q, { x: 0, y: 1, z: 0 });
    hopp = Math.max(hopp, Math.acos(clamp(prik(fore, f), -1, 1)));
    if (f.y > 0.98) sagLod = true;
    if (u.y < -0.98) sagRygg = true;
    fore = f;
  }
  return {
    kvatNosY: fk.y,
    eulerNosY: fe.y,
    loopHopp: hopp,
    sagLod,
    sagRygg,
    norm: Math.hypot(q.x, q.y, q.z, q.w)
  };
}

export class KvantFlyg {
  constructor(A) {
    this.kvaternion = true;
    this.nivaBas = A.niva_k;
    this.A = { ...A };
    this.reset(0, A.start_hojd_m || 75, 0, A.start_fart_ms || 80);
  }
  tillampaNivellering(pa) {
    this.A.niva_k = pa ? this.nivaBas : 0;
    return this.A.niva_k;
  }
  reset(x, y, z, V) {
    const fart = Math.max(0, V || 0);
    this.x = x;
    this.y = y;
    this.z = z;
    this.V = fart;
    this.vx = 0;
    this.vy = 0;
    this.vz = -fart;
    this.ori = { x: 0, y: 0, z: 0, w: 1 };
    this.pitchRate = 0;
    this.rollRate = 0;
    this.yawRate = 0;
    this.alpha = 0;
    this.beta = 0;
    this.gamma = 0;
    this.psi = 0;
    this.phi = 0;
    this.stalled = false;
    this.crashed = false;
    this.vs = 0;
    this.nz = 1;
    this.thrust = 0;
    this.drag = 0;
    this.CL = 0;
    this.lyftAv = false;
    this.de = 0;
    this.da = 0;
    this._bank = 0;
    this._kam = 0;
    this._yawSen = 0;
    this._stallLas = false;
  }
  fram() { return qrot(this.ori, { x: 0, y: 0, z: -1 }); }
  upp() { return qrot(this.ori, { x: 0, y: 1, z: 0 }); }
  hoger() { return qrot(this.ori, { x: 1, y: 0, z: 0 }); }
  powerFactor() {
    const A = this.A;
    return this.y <= A.fullhojd_m ? 1 : Math.exp(-(this.y - A.fullhojd_m) / A.effekt_skalhojd_m);
  }
  // Lyft från marken: liten positiv banvinkel så nosen inte sjunker tillbaka direkt.
  lyft(rad) {
    const g = rad ?? this.A.latta_bana_rad ?? 0.08;
    const V = Math.max(this.V, 1);
    this.vy = Math.sin(g) * V;
    const c = Math.cos(g);
    this.vx = -Math.sin(this.psi) * c * V;
    this.vz = -Math.cos(this.psi) * c * V;
    this.ori = qnorm(qmul(qaxel(0, 1, 0, this.psi), qaxel(1, 0, 0, g)));
    this.pitchRate = 0;
  }
  kritiskAlfa() {
    const A = this.A;
    if (this.V >= A.stall_fart_ms) return A.alfa_kritisk_rad;
    const x = clamp(this.V / Math.max(1, A.stall_fart_ms), 0, 1);
    return A.alfa_kritisk_rad * (A.stall_fart_golv + (1 - A.stall_fart_golv) * x);
  }
  bank() {
    const f = this.fram();
    const u = this.upp();
    const r = this.hoger();
    if (Math.hypot(f.x, f.z) < 0.22) return this._bank;
    this._bank = Math.atan2(r.y, u.y);
    return this._bank;
  }
  kameraKurs(dt) {
    const f = this.fram();
    const h = Math.hypot(f.x, f.z);
    if (h > (this.A.kamera_nos_min || 0.2)) {
      const mal = Math.atan2(-f.x, -f.z);
      let d = mal - this._kam;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      const tau = this.A.kamera_tau_s || 0.4;
      this._kam += d * (1 - Math.exp(-Math.max(0, dt) / tau));
    }
    return this._kam;
  }
  attitude() {
    const f = this.fram();
    const u = this.upp();
    const r = this.hoger();
    const horisont = Math.hypot(f.x, f.z);
    const pitch = Math.atan2(f.y, Math.max(1e-4, horisont));
    let roll = this._bank;
    let yaw = this._yawSen;
    if (horisont >= 0.22) {
      roll = Math.atan2(r.y, u.y);
      yaw = Math.atan2(-f.x, -f.z);
      this._bank = roll;
      this._yawSen = yaw;
    }
    return { pitch, yaw, roll };
  }
  spak(input) {
    const A = this.A;
    const pitch = Number.isFinite(input?.pitch) ? input.pitch : 0;
    const roll = Number.isFinite(input?.roll) ? input.roll : 0;
    this.de = clamp(pitch / A.spak_max_pitch, -1, 1);
    this.da = clamp(roll / A.spak_max_roll, -1, 1);
    return { de: this.de, da: this.da };
  }
  step(dt, input, gas, _rnd, sys) {
    if (this.crashed) return;
    const bit = this.A.substep_s || 0.012;
    const n = Math.max(1, Math.ceil(dt / bit));
    const h = dt / n;
    for (let i = 0; i < n; i++) this._steg(h, input, gas, sys || {});
  }
  _steg(dt, input, gas, S) {
    const A = this.A;
    const g = A.g_ms2;
    const m = A.massa_kg;
    const motorPa = S.motorPa !== false;
    const gear = S.gear == null ? 0 : clamp(S.gear, 0, 1);
    const flaps = S.flaps == null ? 0 : clamp(S.flaps, 0, 1);
    const dr = clamp(S.roder || 0, -1, 1);
    const { de, da } = this.spak(input);
    if (S.paMarken) {
      this._mark(dt, de, dr, gas, motorPa, gear, flaps, S);
      return;
    }
    const f = this.fram();
    const u = this.upp();
    const r = this.hoger();
    const Vnu = Math.hypot(this.vx, this.vy, this.vz);
    const langsam = Vnu < A.langsam_fart_ms;
    const vhat = langsam ? f : { x: this.vx / Vnu, y: this.vy / Vnu, z: this.vz / Vnu };
    const vf = prik(vhat, f);
    const vu = prik(vhat, u);
    const vr = prik(vhat, r);
    const alpha = langsam ? 0 : Math.atan2(-vu, vf);
    const beta = langsam ? 0 : Math.asin(clamp(vr, -1, 1));
    this.alpha = alpha;
    this.beta = beta;
    const rho = luftdensitet(this.y);
    const q = 0.5 * rho * Vnu * Vnu;
    const ak = this.kritiskAlfa();
    const a0 = A.alfa_noll_rad;
    if (alpha > ak) this._stallLas = true;
    if (this._stallLas && (alpha < ak * A.stall_slapp || de < A.stall_slapp_spak)) this._stallLas = false;
    const stalled = this._stallLas || alpha < -ak * A.negativ_stall_andel;
    let cl = A.cl_alfa_per_rad * (alpha - a0);
    if (stalled && alpha > 0) {
      const max = A.cl_alfa_per_rad * (ak - a0);
      const over = alpha - ak;
      cl = Math.max(A.stall_cl_golv, max * Math.max(A.stall_cl_andel, 1 - over * A.stall_cl_fall));
    }
    cl += flaps * A.klaff_cl;
    cl = clamp(cl, -A.cl_max, A.cl_max);
    let cd = A.cd0 + A.k_inducerat * cl * cl + (stalled ? A.stall_cd_extra : 0) + gear * A.hjul_cd + flaps * A.klaff_cd;
    cd = Math.max(A.cd0, cd);
    let lx = u.x - vhat.x * vu;
    let ly = u.y - vhat.y * vu;
    let lz = u.z - vhat.z * vu;
    let ln = Math.hypot(lx, ly, lz);
    if (ln < 1e-4) { lx = u.x; ly = u.y; lz = u.z; ln = Math.hypot(lx, ly, lz) || 1; }
    lx /= ln; ly /= ln; lz /= ln;
    const L = q * A.vingyta_m2 * cl;
    const D = q * A.vingyta_m2 * cd;
    const side = -Math.sin(beta) * q * A.vingyta_m2 * A.cy_beta;
    let T = 0;
    if (motorPa && gas > 0.001) {
      T = Math.min(A.statisk_dragkraft_n, A.motoreffekt_w * A.propellerverkningsgrad * gas * this.powerFactor() / Math.max(A.dragkraft_minfart, Vnu));
    }
    const broms = Vnu > 0.2 ? 1 : 0;
    let Fx = T * f.x + L * lx + side * r.x - broms * D * vhat.x;
    let Fy = T * f.y + L * ly + side * r.y - broms * D * vhat.y - m * g;
    let Fz = T * f.z + L * lz + side * r.z - broms * D * vhat.z;
    this.vx += Fx / m * dt;
    this.vy += Fy / m * dt;
    this.vz += Fz / m * dt;
    const fart = Math.hypot(this.vx, this.vy, this.vz);
    if (fart > A.max_fart_ms) {
      const s = A.max_fart_ms / fart;
      this.vx *= s; this.vy *= s; this.vz *= s;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.z += this.vz * dt;
    const V = Math.max(A.min_fart_ms, Math.hypot(this.vx, this.vy, this.vz));
    const c = A.korda_m;
    const b = A.spann_m;
    const Vref = Math.max(A.min_fart_ms, V);
    const pq = this.pitchRate;
    const pr = this.rollRate;
    const py = this.yawRate;
    const niva = A.niva_k > 0 && Math.abs(de) < A.niva_dodzon && Math.abs(da) < A.niva_dodzon;
    let aRef = a0;
    if (niva) {
      const cl1 = (m * g) / Math.max(1, q * A.vingyta_m2);
      aRef = clamp(a0 + cl1 / A.cl_alfa_per_rad, a0, A.alfa_niva_max);
    }
    let Cm = A.cm_hojd * de - A.cm_alfa * (alpha - aRef) - A.cm_q * pq * c / (2 * Vref);
    if (niva) Cm += A.cm_niva * A.niva_k * (aRef - alpha);
    Cm += A.koppling_roll_tipp * pr * da;
    if (this._stallLas) Cm -= A.cm_stall * (1 + Math.max(0, alpha - ak) * A.stall_nos_faktor);
    let Clm = A.cl_skev * da - A.cl_p * pr * b / (2 * Vref) + A.cl_r * py * b / (2 * Vref) - A.cl_beta * beta;
    let Cn = A.cn_sida * dr - A.cn_beta * beta - A.cn_r * py * b / (2 * Vref) - A.cn_skev * da + A.cn_p * pr * b / (2 * Vref);
    if (niva) Clm += -A.cl_niva * A.niva_k * this.bank();
    const bas = q * A.vingyta_m2;
    this.pitchRate = clamp(pq + bas * c * Cm / A.troget_tipp * dt, -A.max_tipp_rad_s, A.max_tipp_rad_s);
    this.rollRate = clamp(pr + bas * b * Clm / A.troget_roll * dt, -A.max_roll_rad_s, A.max_roll_rad_s);
    this.yawRate = clamp(py + bas * b * Cn / A.troget_gir * dt, -A.max_gir_rad_s, A.max_gir_rad_s);
    const wx = this.pitchRate;
    const wy = this.yawRate;
    const wz = this.rollRate;
    const om = Math.hypot(wx, wy, wz);
    if (om > 1e-8) this.ori = qnorm(qmul(this.ori, qaxel(wx, wy, wz, om * dt)));
    const efter = Math.hypot(this.vx, this.vy, this.vz);
    this.V = efter;
    this.vs = this.vy;
    this.gamma = Math.asin(clamp(this.vy / Math.max(1, efter), -1, 1));
    this.psi = Math.atan2(-this.vx, -this.vz);
    this.phi = this.bank();
    this.stalled = stalled;
    this.nz = (Fx * u.x + (Fy + m * g) * u.y + Fz * u.z) / (m * g);
    this.thrust = T;
    this.drag = D;
    this.CL = cl;
    this.lyftAv = false;
    if (!Number.isFinite(this.ori.w) || !Number.isFinite(this.y)) this.reset(this.x || 0, 200, this.z || 0, 80);
  }
  _mark(dt, de, dr, gas, motorPa, gear, flaps, S) {
    const A = this.A;
    const m = A.massa_kg;
    this.gamma = 0;
    this.pitchRate = 0;
    this.rollRate = 0;
    this.yawRate = 0;
    this.stalled = false;
    this._stallLas = false;
    this.vs = 0;
    this.vy = 0;
    this.nz = 1;
    this.alpha = 0;
    this.beta = 0;
    if (this.V > 0.5) this.psi += dr * dt * (A.mark_gir + A.mark_gir_fart / Math.max(5, this.V));
    this.ori = qaxel(0, 1, 0, this.psi);
    this._yawSen = this.psi;
    this._kam = this.psi;
    const dirx = -Math.sin(this.psi);
    const dirz = -Math.cos(this.psi);
    const q = 0.5 * luftdensitet(this.y) * this.V * this.V;
    const aero = q * A.vingyta_m2 * (A.cd0 + A.mark_cd + gear * A.hjul_cd + flaps * A.klaff_cd);
    const broms = (S.broms || 0) * (gas < 0.03 && this.V > 0.2 ? 1 : 0);
    const rull = A.rullmotstand_n + Math.abs(dr) * A.rull_roder_n + broms;
    let T = 0;
    if (motorPa && gas > 0.001) {
      T = Math.min(A.statisk_dragkraft_n * (1 - A.mark_drag_andel * (1 - gas)), A.motoreffekt_w * A.propellerverkningsgrad * gas / Math.max(A.dragkraft_minfart, this.V));
    }
    this.V = Math.max(0, this.V + ((T - aero - rull) / m) * dt);
    this.vx = dirx * this.V;
    this.vz = dirz * this.V;
    this.x += this.vx * dt;
    this.z += this.vz * dt;
    if (S.markY != null) this.y = S.markY + (S.hjulM ?? A.hjul_hojd_m);
    const aRot = Math.max(0, de) * A.alfa_latta_rad;
    const cl = A.cl_alfa_per_rad * (aRot - A.alfa_noll_rad) + flaps * A.klaff_cl;
    const L = q * A.vingyta_m2 * Math.max(0.2, cl);
    this.lyftAv = L > m * A.g_ms2 * A.latta_lyft_andel && this.V > A.latta_fart_ms && (de > A.latta_spak || gas > A.latta_gas);
    this.thrust = T;
    this.drag = aero + rull;
    this.CL = cl;
    this.phi = 0;
  }
}
