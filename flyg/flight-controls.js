// Flygspecifik axelmappning. Skjutbanans gyro.js rörs inte.
// Webb: skärmens vinkel vrider nos upp och bank. Små rörelser nära ett
// vinkelomslag (samma läge, andra siffror) får inte bli fullt roder.
// Expo skickar vinkelhastighet. Första provet efter centrering är nolläget.
import { arOmslag, eulerStyrning, nyNoll, skarmDelta } from './orientering.js';
import { provFranEvent, skarmGrader } from '../shared/sensor.js';

const STALE_MS = 450;

export class FlightInput {
  constructor(gyro, config, settings) {
    this.gyro = gyro;
    this.c = config;
    this.settings = settings;
    this.active = false;
    this.native = false;
    this.web = null;
    this.origin = null;
    this.pose = { pitch: 0, roll: 0, yaw: 0 };
    this.t = null;
    this.senaste = null;
    this.webAt = 0;
    this.nativeAt = 0;
    this.pending = true;
    this.klocka = null;
    this.rollHast = 0;
    this.rollHastAt = 0;
    this._antal = 0;
    this._skarmSen = this.skarm();
    const pa = (typ, fn, opt) => { addEventListener(typ, fn, opt); this._antal++; };
    pa('ww2-native-gyro', (e) => this._native(e));
    pa('deviceorientation', (e) => this._webb(e), { passive: true });
    pa('devicemotion', (e) => this._rorelse(e), { passive: true });
    pa('orientationchange', () => this._skarmByte());
    const orient = globalThis.screen?.orientation;
    if (orient?.addEventListener) { orient.addEventListener('change', () => this._skarmByte()); this._antal++; }
  }
  nu() { return this.klocka ? this.klocka() : (globalThis.performance?.now?.() ?? Date.now()); }
  skarm() {
    return skarmGrader(globalThis);
  }
  _skarmByte() {
    const n = this.skarm();
    if (n === this._skarmSen) return;
    this._skarmSen = n;
    this.pending = true;
    this.pose = { pitch: 0, roll: 0, yaw: 0 };
    this.senaste = null;
  }
  _nativeFarsk() { return this.native && (this.nu() - this.nativeAt) < STALE_MS; }
  _webbFarsk() { return !!(this.web && (this.nu() - this.webAt) < STALE_MS); }
  _native(e) {
    if (!this.active || !globalThis.window?.ReactNativeWebView) return;
    const d = e.detail;
    if (!d || ![d.x, d.y, d.z, d.t].every(Number.isFinite)) return;
    this.native = true;
    this.nativeAt = this.nu();
    if (this.pending) {
      this.t = d.t;
      this.pending = false;
      this.pose = { pitch: 0, roll: 0, yaw: 0 };
      return;
    }
    if (this.t !== null) {
      const dt = Math.min(.05, Math.max(0, d.t - this.t));
      const a = this.skarm() * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a);
      const clean = (v) => Math.abs(v) < this.c.gyro_brus_rad_s ? 0 : v;
      this.pose.pitch += clean(d.x * cs - d.y * sn) * dt;
      this.pose.yaw += clean(d.x * sn + d.y * cs) * dt;
      this.pose.roll -= clean(d.z) * dt;
    }
    this.rollHast = -d.z;
    this.rollHastAt = this.nu();
    this.t = d.t;
  }
  // Webbens rotationRate är grader/s. Samma skärmbyte som vinklarna, så ett snabbt
  // vrid i liggande läge inte blir en loop kring fel axel.
  _rorelse(e) {
    if (!this.active || this._nativeFarsk()) return;
    const rr = e.rotationRate;
    if (!rr) return;
    const b = Number.isFinite(rr.beta) ? rr.beta : 0;
    const g = Number.isFinite(rr.gamma) ? rr.gamma : 0;
    const s = skarmDelta(b, g, this.skarm());
    if (!Number.isFinite(s.rollDeg)) return;
    this.rollHast = s.rollDeg * Math.PI / 180;
    this.rollHastAt = this.nu();
  }
  _webb(e) {
    if (!this.active || this._nativeFarsk()) return;
    const prov = provFranEvent(e);
    if (!prov) return;
    const ang = this.skarm();
    if (ang !== this._skarmSen) this._skarmByte();
    if (this.pending || !this.origin) {
      this.origin = { ...prov };
      this.pending = false;
      this.pose = { pitch: 0, roll: 0, yaw: 0 };
    } else if (arOmslag(this.senaste, prov)) {
      this.origin = nyNoll(prov, this.pose, ang);
    } else {
      this.pose = eulerStyrning(prov, this.origin, ang);
    }
    this.senaste = prov;
    this.web = prov;
    this.webAt = this.nu();
  }
  reset() {
    this.t = null;
    this.pose = { pitch: 0, roll: 0, yaw: 0 };
    this.pending = true;
    this.senaste = null;
    this.origin = null;
    if (this.native) this.nativeAt = this.nu();
  }
  center() { this.reset(); this.gyro?.center?.(); }
  read() {
    const freshNative = this._nativeFarsk();
    const freshWeb = !freshNative && this._webbFarsk() && !this.pending;
    const sensor = this.active && !this.pending && (freshNative || freshWeb);
    const p = sensor ? this.pose : { pitch: 0, roll: 0, yaw: 0 };
    const fin = (v) => Number.isFinite(v) ? v : 0;
    const z = Math.max(this.c.neutral_rad || 0, this.c.dodzon || 0);
    const knee = this.c.dodzon_mjuk || 0;
    const dead = (x) => {
      const a = Math.abs(x);
      if (!(z > 0)) return x;
      if (a <= z) return 0;
      const sign = Math.sign(x);
      if (!(knee > 0)) return sign * (a - z);
      if (a >= z + knee) return x;
      // Mjuk knä: 0 vid dödzonen, samma värde och lutning som råvinkeln när knäet tar slut.
      const u = (a - z) / knee;
      const h01 = -2 * u * u * u + 3 * u * u;
      const h11 = u * u * u - u * u;
      return sign * ((z + knee) * h01 + knee * h11);
    };
    const clamp = (x, m) => Math.max(-m, Math.min(m, x));
    const gain = this.settings.kanslighet;
    const rv = this.c.roder_vinkel_rad || 0.35;
    const drag = this.gyro?.drag || { x: 0, y: 0 };
    const roder = sensor ? clamp(dead(fin(p.yaw)) / rv, 1) : 0;
    let source = 'finger';
    if (!this.active) source = 'av';
    else if (freshNative) source = 'native';
    else if (freshWeb) source = 'webb';
    else if (this.native || this.web) source = 'tyst';
    return {
      pitch: clamp(dead(fin(p.pitch) + fin(drag.y)) * gain, this.c.max_pitch),
      roll: clamp(dead(fin(p.roll) + (this.c.yaw_andel || 0) * fin(p.yaw) + fin(drag.x)) * gain * this.c.bank_forstarkning, this.c.max_roll),
      roder,
      pose: { pitch: fin(p.pitch), roll: fin(p.roll), yaw: fin(p.yaw) },
      rollHast: (this.nu() - this.rollHastAt) < 250 && Number.isFinite(this.rollHast) ? this.rollHast : null,
      source
    };
  }
}

export function dampCritical(state, target, dt, omega) {
  const x = state.x - target, j = state.v + omega * x, e = Math.exp(-omega * dt);
  state.x = target + (x + j * dt) * e;
  state.v = (state.v - omega * j * dt) * e;
  if (target === 0 && Math.abs(state.x) < .001 && Math.abs(state.v) < .01) state.x = state.v = 0;
  return state.x;
}
