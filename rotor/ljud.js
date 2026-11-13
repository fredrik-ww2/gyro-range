// Flight audio. Samples in ljud.json replace a layer when the file decodes.
// Until then every event is synthesized here. No DOM besides the audio context.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function renderBuffer(ctx, seconds, fill) {
  const rate = ctx.sampleRate;
  const n = Math.max(1, Math.floor(rate * seconds));
  const buf = ctx.createBuffer(1, n, rate);
  const d = buf.getChannelData(0);
  fill(d, rate);
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(d[i]));
  const g = peak > 0.0001 ? 0.92 / peak : 1;
  for (let i = 0; i < n; i++) d[i] = Math.tanh(d[i] * g * 1.15);
  return buf;
}

function noiseBuffer(ctx, seconds) {
  return renderBuffer(ctx, seconds, (d) => {
    let brown = 0;
    for (let i = 0; i < d.length; i++) {
      const white = Math.random() * 2 - 1;
      brown = (brown + 0.02 * white) / 1.02;
      d[i] = white * 0.55 + brown * 2.2;
    }
  });
}

function makeSamples(ctx) {
  const gun = renderBuffer(ctx, 0.11, (d, rate) => {
    let phase = 0;
    for (let i = 0; i < d.length; i++) {
      const t = i / rate;
      const env = Math.exp(-t * 42);
      const freq = 240 * Math.exp(-t * 26) + 48;
      phase += freq / rate;
      const thump = Math.sin(phase * Math.PI * 2);
      const nse = Math.random() * 2 - 1;
      const bolt = t < 0.007 ? Math.sin(t * 9800) * (1 - t / 0.007) : 0;
      const crack = t < 0.003 ? (Math.random() * 2 - 1) * (1 - t / 0.003) : 0;
      d[i] = (nse * 0.72 + thump * 0.9) * env + bolt * 0.55 + crack * 0.65;
    }
  });
  const casing = renderBuffer(ctx, 0.18, (d, rate) => {
    const f1 = 1540 + Math.random() * 280;
    const f2 = 2280 + Math.random() * 360;
    let a = 0, b = 0;
    for (let i = 0; i < d.length; i++) {
      const t = i / rate;
      a += (f1 * (1 - t * 0.15)) / rate;
      b += (f2 * (1 - t * 0.2)) / rate;
      const env = Math.exp(-t * 14) * Math.min(1, t * 500);
      d[i] = (Math.sin(a * Math.PI * 2) * 0.65 + Math.sin(b * Math.PI * 2) * 0.4) * env
        + (Math.random() * 2 - 1) * Math.exp(-t * 55) * 0.25;
    }
  });
  const rocket = renderBuffer(ctx, 0.62, (d, rate) => {
    let low = 0;
    let phase = 0;
    for (let i = 0; i < d.length; i++) {
      const t = i / rate;
      const nse = Math.random() * 2 - 1;
      const follow = 0.15 + 0.8 * Math.exp(-t * 3.4);
      low = low * follow + nse * (1 - follow);
      const freq = 720 * Math.exp(-t * 2.6) + 80;
      phase += freq / rate;
      const tone = Math.sin(phase * Math.PI * 2) * Math.exp(-t * 3.1);
      const env = Math.sin(Math.min(1, t / 0.07) * Math.PI * 0.5) * Math.exp(-Math.max(0, t - 0.05) * 2.1);
      d[i] = (low * 0.85 + tone * 0.45 + nse * Math.exp(-t * 1.6) * 0.18) * env;
    }
  });
  const explosion = renderBuffer(ctx, 0.78, (d, rate) => {
    let phase = 0, low = 0;
    for (let i = 0; i < d.length; i++) {
      const t = i / rate;
      const freq = 110 * Math.exp(-t * 2.8) + 26;
      phase += freq / rate;
      const boom = Math.sin(phase * Math.PI * 2) * Math.exp(-t * 2.6);
      const nse = Math.random() * 2 - 1;
      low = low * 0.9 + nse * 0.1;
      const crack = t < 0.02 ? (Math.random() * 2 - 1) * (1 - t / 0.02) : 0;
      d[i] = boom * 0.95 + low * Math.exp(-t * 1.7) * 0.85 + crack * 0.7;
    }
  });
  const hit = renderBuffer(ctx, 0.28, (d, rate) => {
    let phase = 0, low = 0;
    for (let i = 0; i < d.length; i++) {
      const t = i / rate;
      phase += (160 * Math.exp(-t * 8) + 40) / rate;
      const nse = Math.random() * 2 - 1;
      low = low * 0.8 + nse * 0.2;
      d[i] = Math.sin(phase * Math.PI * 2) * Math.exp(-t * 10) * 0.7 + low * Math.exp(-t * 7) * 0.6
        + (t < 0.008 ? nse * (1 - t / 0.008) : 0) * 0.5;
    }
  });
  const click = renderBuffer(ctx, 0.028, (d, rate) => {
    for (let i = 0; i < d.length; i++) {
      const t = i / rate;
      d[i] = (Math.random() * 2 - 1) * Math.exp(-t * 220) + Math.sin(t * 3400 * Math.PI * 2) * Math.exp(-t * 140) * 0.35;
    }
  });
  const pedal = renderBuffer(ctx, 0.055, (d, rate) => {
    let phase = 0;
    for (let i = 0; i < d.length; i++) {
      const t = i / rate;
      phase += (180 * Math.exp(-t * 30) + 70) / rate;
      d[i] = (Math.sin(phase * Math.PI * 2) * 0.6 + (Math.random() * 2 - 1) * 0.45) * Math.exp(-t * 38);
    }
  });
  return {gun, casing, rocket, explosion, hit, click, pedal};
}

export class Ljud {
  constructor(manifest) {
    this.manifest = manifest;
    this.enabled = true;
    this.ducked = false;
    this.ctx = null;
    this.master = null;
    this.built = false;
    this.samples = null;
    this.fileBuffers = {};
    this.fileLoops = {};
    this.warnAt = 0;
    this.state = {collective: 0.6, knots: 0, playing: false, low: false, boundary: false};
  }
  event(name) { return this.manifest.events?.[name] || {file: '', volume: 0.4, loop: false}; }
  unlock() {
    const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Ctx) return;
    if (!this.ctx) {
      try { this.ctx = new Ctx(); } catch { return; }
      this.build();
      this.loadFiles();
    }
    const resume = this.ctx.resume?.();
    if (resume && typeof resume.catch === 'function') resume.catch(() => {});
  }
  build() {
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 18;
    comp.ratio.value = 3.2;
    comp.attack.value = 0.004;
    comp.release.value = 0.22;
    this.master.connect(comp);
    comp.connect(ctx.destination);
    this.samples = makeSamples(ctx);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx, 2);
    noise.loop = true;
    noise.start();
    const vol = (name) => this.event(name).volume;
    this.washGain = ctx.createGain();
    this.washGain.gain.value = 0;
    const washFilter = ctx.createBiquadFilter();
    washFilter.type = 'lowpass';
    washFilter.frequency.value = 420;
    washFilter.Q.value = 0.6;
    noise.connect(washFilter);
    washFilter.connect(this.washGain);
    this.washGain.connect(this.master);
    this.washFilter = washFilter;

    this.slapGain = ctx.createGain();
    this.slapGain.gain.value = 0;
    const slapFilter = ctx.createBiquadFilter();
    slapFilter.type = 'bandpass';
    slapFilter.frequency.value = 640;
    slapFilter.Q.value = 1.35;
    noise.connect(slapFilter);
    slapFilter.connect(this.slapGain);
    this.slapGain.connect(this.master);
    this.slapFilter = slapFilter;
    this.blade = ctx.createOscillator();
    this.blade.type = 'sawtooth';
    this.blade.frequency.value = 20;
    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = i / 255 * 2 - 1;
      curve[i] = Math.pow(Math.max(0, x), 10);
    }
    shaper.curve = curve;
    const bladeDepth = ctx.createGain();
    bladeDepth.gain.value = 0.55;
    this.blade.connect(shaper);
    shaper.connect(bladeDepth);
    bladeDepth.connect(this.slapGain.gain);
    this.blade.start();
    this.bladeDepth = bladeDepth;

    this.thump = ctx.createOscillator();
    this.thump.type = 'sine';
    this.thump.frequency.value = 5.2;
    this.thumpGain = ctx.createGain();
    this.thumpGain.gain.value = 0;
    this.thump.connect(this.thumpGain);
    this.thumpGain.connect(this.master);
    this.thump.start();

    this.turbine = ctx.createOscillator();
    this.turbine.type = 'sawtooth';
    this.turbine.frequency.value = 190;
    this.turbineB = ctx.createOscillator();
    this.turbineB.type = 'sine';
    this.turbineB.frequency.value = 192;
    const turbineFilter = ctx.createBiquadFilter();
    turbineFilter.type = 'bandpass';
    turbineFilter.frequency.value = 900;
    turbineFilter.Q.value = 0.8;
    this.turbineGain = ctx.createGain();
    this.turbineGain.gain.value = 0;
    this.turbine.connect(turbineFilter);
    this.turbineB.connect(turbineFilter);
    turbineFilter.connect(this.turbineGain);
    this.turbineGain.connect(this.master);
    this.turbine.start();
    this.turbineB.start();
    this.turbineFilter = turbineFilter;

    const windNoise = ctx.createBufferSource();
    windNoise.buffer = noise.buffer;
    windNoise.loop = true;
    windNoise.start();
    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 500;
    this.windFilter.Q.value = 0.45;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0;
    windNoise.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.master);
    this.gust = ctx.createOscillator();
    this.gust.frequency.value = 0.17;
    this.gustGain = ctx.createGain();
    this.gustGain.gain.value = 0.04;
    this.gust.connect(this.gustGain);
    this.gustGain.connect(this.windGain.gain);
    this.gust.start();

    this.loopGains = {
      rotorSlap: this.slapGain,
      rotorWash: this.washGain,
      rotorThump: this.thumpGain,
      turbine: this.turbineGain,
      wind: this.windGain
    };
    this.synthMax = {
      rotorSlap: vol('rotorSlap'),
      rotorWash: vol('rotorWash'),
      rotorThump: vol('rotorThump'),
      turbine: vol('turbine'),
      wind: vol('wind')
    };
    this.built = true;
    this.applyGain();
  }
  async loadFiles() {
    const events = this.manifest.events || {};
    for (const [name, ev] of Object.entries(events)) {
      if (!ev.file) continue;
      try {
        const res = await fetch(ev.file);
        if (!res.ok) continue;
        const copy = (await res.arrayBuffer()).slice(0);
        const buf = await this.ctx.decodeAudioData(copy);
        this.fileBuffers[name] = buf;
        if (ev.loop) this.startFileLoop(name, ev, buf);
      } catch { /* keep the synth layer */ }
    }
  }
  startFileLoop(name, ev, buf) {
    if (!this.ctx || this.fileLoops[name]) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    src.connect(gain);
    gain.connect(this.master);
    src.start();
    this.fileLoops[name] = {src, gain, volume: ev.volume};
    if (this.loopGains[name]) this.loopGains[name].gain.value = 0;
  }
  applyGain() {
    if (!this.master || !this.ctx) return;
    const m = this.manifest.masterVolume ?? 0.8;
    const target = this.enabled && !this.ducked ? m : 0;
    this.master.gain.setTargetAtTime(Math.max(0.0001, target), this.ctx.currentTime, 0.04);
    if (target === 0) this.master.gain.setTargetAtTime(0, this.ctx.currentTime + 0.05, 0.02);
  }
  setEnabled(on) {
    this.enabled = !!on;
    if (on) this.unlock();
    this.applyGain();
  }
  setDucked(on) { this.ducked = !!on; this.applyGain(); }
  update(dt, state) {
    this.state = state;
    if (!this.built) return;
    this.modulate();
    this.warnings(dt);
  }
  modulate() {
    const ctx = this.ctx, t = ctx.currentTime;
    const col = clamp(this.state.collective ?? 0.6, 0, 1);
    const knots = Math.max(0, this.state.knots || 0);
    const run = this.state.playing ? 1 : 0;
    const rpm = 0.9 + col * 0.16 + Math.min(0.08, knots / 900);
    const bladeHz = (300 / 60) * 4 * rpm;
    const advance = clamp(knots / 95, 0, 1);
    const slap = run * (0.28 + col * 0.42 + advance * 0.5);
    const wash = run * (0.35 + col * 0.65);
    const thump = run * (0.25 + col * 0.5) * (1 - advance * 0.35);
    const turb = run * (0.45 + col * 0.55);
    const wind = run * Math.pow(clamp(knots / 110, 0, 1), 1.25);
    this.blade.frequency.setTargetAtTime(bladeHz, t, 0.12);
    this.bladeDepth.gain.setTargetAtTime(0.35 + advance * 0.5, t, 0.15);
    this.slapFilter.frequency.setTargetAtTime(520 + col * 180 + advance * 260, t, 0.15);
    this.thump.frequency.setTargetAtTime(bladeHz / 4, t, 0.12);
    this.turbine.frequency.setTargetAtTime(168 + col * 96 + knots * 0.45, t, 0.18);
    this.turbineB.frequency.setTargetAtTime(172 + col * 98 + knots * 0.45, t, 0.18);
    this.turbineFilter.frequency.setTargetAtTime(700 + col * 500, t, 0.2);
    this.washFilter.frequency.setTargetAtTime(280 + col * 220 + knots * 1.5, t, 0.2);
    this.windFilter.frequency.setTargetAtTime(320 + knots * 16, t, 0.25);
    this.gustGain.gain.setTargetAtTime(wind * 0.08, t, 0.3);
    const set = (name, level) => {
      const file = this.fileLoops[name];
      if (file) {
        file.gain.gain.setTargetAtTime(file.volume * clamp(level, 0, 1.4), t, 0.12);
        if (file.src.playbackRate) file.src.playbackRate.setTargetAtTime(0.9 + col * 0.2 + knots / 700, t, 0.2);
        return;
      }
      const node = this.loopGains[name];
      if (node) node.gain.setTargetAtTime((this.synthMax[name] || 0.2) * clamp(level, 0, 1.4), t, 0.1);
    };
    set('rotorSlap', slap);
    set('rotorWash', wash);
    set('rotorThump', thump);
    set('turbine', turb);
    set('wind', wind);
  }
  fadeWarn() {
    if (!this.ctx) return;
    for (const name of ['warnLow', 'warnBoundary']) {
      const file = this.fileLoops[name];
      if (file) file.gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08);
    }
  }
  warnings(dt) {
    if (!this.enabled || this.ducked || !this.state.playing) { this.fadeWarn(); this.warnAt = 0; return; }
    this.warnAt += dt;
    const low = !!this.state.low, edge = !!this.state.boundary;
    if (!low && !edge) { this.fadeWarn(); return; }
    const file = low ? this.fileLoops.warnLow : this.fileLoops.warnBoundary;
    if (file) {
      const other = this.fileLoops[low ? 'warnBoundary' : 'warnLow'];
      if (other) other.gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08);
      const ev = this.event(low ? 'warnLow' : 'warnBoundary');
      file.gain.gain.setTargetAtTime(ev.volume, this.ctx.currentTime, 0.1);
      return;
    }
    if (this.fileLoops.warnLow) this.fileLoops.warnLow.gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.1);
    if (this.fileLoops.warnBoundary) this.fileLoops.warnBoundary.gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.1);
    const gap = low ? 0.85 : 1.15;
    if (this.warnAt < gap) return;
    this.warnAt = 0;
    if (low) {
      const v = this.event('warnLow').volume;
      this.tone(880, 0.11, v, 0);
      this.tone(660, 0.14, v * 0.85, 0.14);
    } else {
      this.tone(146, 0.22, this.event('warnBoundary').volume, 0);
    }
  }
  tone(freq, dur, level, delay) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + (delay || 0);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = freq < 200 ? 'sine' : 'triangle';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, level), t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  play(name, opts = {}) {
    if (!this.built || !this.enabled || this.ducked) return;
    if (name === 'gun') this.play('casing', {delay: 0.065 + Math.random() * 0.04, distance: opts.distance || 0});
    const ev = this.event(name);
    const buf = this.fileBuffers[name] || this.samples[name];
    if (!buf || ev.loop) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const rate = 0.94 + Math.random() * 0.12;
    src.playbackRate.value = name === 'explosion' ? rate * 0.9 : rate;
    const distance = Math.max(0, opts.distance || 0);
    const ref = ev.refDistance || this.manifest.refDistance || 150;
    const att = 1 / (1 + distance / ref);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = distance < 8 ? 17000 : Math.max(240, 13000 / (1 + distance / (ref * 0.7)));
    const g = ctx.createGain();
    const when = ctx.currentTime + (opts.delay || 0);
    g.gain.setValueAtTime((opts.volume ?? ev.volume) * att, when);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(when);
  }
}
