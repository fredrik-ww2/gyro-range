// Högst en nod per kanal. Ett skott får inte loopa, och släpps avtryckaren
// ska noden tystna och kopplas bort genast. Samma hjälp håller motorn till en nod
// så att ett nytt skott inte startar en motor till.

export function tystNod(nod) {
  if (!nod) return;
  nod.aktiv = false;
  const source = nod.source;
  const gain = nod.gain;
  try { if (source) source.loop = false; } catch { /* redan stängd */ }
  try {
    const g = gain && gain.gain;
    if (g) {
      try { g.cancelScheduledValues(0); } catch { /* saknar tidslinje */ }
      g.value = 0;
    }
  } catch { /* gain saknas */ }
  try { if (source && source.stop) source.stop(); } catch { /* redan stoppad */ }
  try { if (source && source.disconnect) source.disconnect(); } catch { /* redan bortkopplad */ }
  try { if (gain && gain.disconnect) gain.disconnect(); } catch { /* redan bortkopplad */ }
  try { if (source) source.onended = null; } catch { /* frusen nod */ }
}

export function skapaKanal() {
  let nod = null;
  return {
    antal() { return nod && nod.aktiv ? 1 : 0; },
    spelar() { return !!(nod && nod.aktiv); },
    spela(audio, buffer, val = {}) {
      if (!audio || !buffer) return null;
      const loop = !!val.loop;
      if (loop && nod && nod.aktiv && nod.source && nod.source.buffer === buffer) return nod;
      const fore = nod;
      nod = null;
      tystNod(fore);
      const source = audio.createBufferSource();
      const gain = audio.createGain();
      source.buffer = buffer;
      source.loop = loop;
      if (loop && val.loopEnd > 0) {
        const dur = Number(buffer.duration) || val.loopEnd;
        source.loopEnd = Math.min(val.loopEnd, dur);
      }
      const volym = Number.isFinite(val.volym) ? val.volym : 1;
      gain.gain.value = volym;
      source.connect(gain);
      gain.connect(audio.destination);
      const n = { source, gain, aktiv: true, loop, senRate: null, senVol: null };
      source.onended = () => {
        if (nod !== n) return;
        n.aktiv = false;
        try { source.disconnect(); } catch { /* redan borta */ }
        try { gain.disconnect(); } catch { /* redan borta */ }
        nod = null;
      };
      nod = n;
      const nu = Number(audio.currentTime) || 0;
      const maxSek = Number(val.maxSek);
      try {
        if (!loop && maxSek > 0) source.start(nu, 0, maxSek);
        else source.start(nu);
      } catch {
        try { source.start(); } catch { /* kontexten tog inte emot */ }
      }
      return n;
    },
    tyst() {
      const n = nod;
      nod = null;
      tystNod(n);
    },
    volym(v, tid) {
      if (!nod || !nod.aktiv) return;
      if (nod.senVol != null && Math.abs(nod.senVol - v) < 0.02) return;
      nod.senVol = v;
      const t = tid || 0;
      try {
        const g = nod.gain.gain;
        g.cancelScheduledValues(t);
        g.setValueAtTime(g.value, t);
        g.setTargetAtTime(v, t, 0.12);
      } catch {
        try { nod.gain.gain.value = v; } catch { /* ingen förstärkare */ }
      }
    },
    takt(rate, tid) {
      if (!nod || !nod.aktiv) return;
      if (nod.senRate != null && Math.abs(nod.senRate - rate) < 0.02) return;
      nod.senRate = rate;
      const t = tid || 0;
      try {
        const p = nod.source.playbackRate;
        p.cancelScheduledValues(t);
        p.setValueAtTime(p.value, t);
        p.setTargetAtTime(rate, t, 0.12);
      } catch {
        try { nod.source.playbackRate.value = rate; } catch { /* ingen hastighet */ }
      }
    }
  };
}

// Spärrsteg längs gasreglaget. 5,5 % ligger mellan 5 och 6 %.
// Ett slag till 0 % eller 100 % är stoppklacken, inte ett vanligt hack.
export const GAS_STEG = 0.055;

export function gasSlag(fore, nu, steg = GAS_STEG) {
  const a = Math.round(Math.max(0, Math.min(1, +fore || 0)) / steg);
  const b = Math.round(Math.max(0, Math.min(1, +nu || 0)) / steg);
  const stopp = nu <= 0.002 || nu >= 0.998;
  const varStopp = fore <= 0.002 || fore >= 0.998;
  if (stopp && !varStopp) return { typ: 'stopp', antal: 1 };
  const n = Math.abs(b - a);
  if (!n) return null;
  return { typ: 'hack', antal: Math.min(3, n) };
}

// Samplarnas topp ligger under -1 dBTP. Kurvan mjuknar och kan inte nå taket.
const MEKANIK_TAK = Math.pow(10, -1.5 / 20);

export function mekanikKurva(n = 1024, tak = MEKANIK_TAK) {
  const curve = new Float32Array(n);
  const k = 1.25;
  const norm = Math.tanh(k);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = (Math.tanh(k * x) / norm) * tak;
  }
  return curve;
}

function loss(nod) {
  if (!nod) return;
  try {
    if (typeof nod.stop === 'function') {
      const t = nod.context && Number(nod.context.currentTime);
      if (Number.isFinite(t)) nod.stop(Math.max(t, nod.__slut || t));
      else nod.stop();
    }
  } catch { /* redan stoppad eller inte startad */ }
  try { if (typeof nod.disconnect === 'function') nod.disconnect(); } catch { /* redan borta */ }
  try { nod.onended = null; } catch { /* frusen nod */ }
}

// Högst åtta röster. Äldsta rösten kopplas bort innan en ny får börja.
// Bussen går genom en mjuk begränsare så summan inte kan klippa.
export function skapaMekanik() {
  const MAX = 8;
  let roster = [];
  let bus = null;
  let busAudio = null;
  let brus = null;

  function rensa(rost) {
    if (!rost || rost.borta) return;
    rost.borta = true;
    if (rost.timer) clearTimeout(rost.timer);
    for (const n of rost.noder) loss(n);
    const i = roster.indexOf(rost);
    if (i >= 0) roster.splice(i, 1);
  }

  function sakerBus(audio) {
    if (bus && busAudio === audio) return bus;
    tyst();
    if (bus) {
      loss(bus.inGain);
      loss(bus.shaper);
      loss(bus.ut);
      bus = null;
    }
    brus = null;
    const inGain = audio.createGain();
    inGain.gain.value = 0.86;
    const shaper = audio.createWaveShaper();
    shaper.curve = mekanikKurva();
    shaper.oversample = 'none';
    const ut = audio.createGain();
    ut.gain.value = 1;
    inGain.connect(shaper);
    shaper.connect(ut);
    ut.connect(audio.destination);
    bus = { inGain, shaper, ut };
    busAudio = audio;
    return bus;
  }

  function brusBuffer(audio) {
    if (brus && brus.sampleRate === audio.sampleRate) return brus;
    const len = Math.max(8, Math.ceil(audio.sampleRate * 0.09));
    const buf = audio.createBuffer(1, len, audio.sampleRate);
    const d = buf.getChannelData(0);
    let y = 0;
    for (let i = 0; i < len; i++) {
      const v = Math.random() * 2 - 1;
      y = y * 0.62 + v * 0.38;
      d[i] = y * (1 - i / len);
    }
    brus = buf;
    return buf;
  }

  function rost(audio, typ, nar) {
    if (!audio || audio.state === 'closed') return 0;
    while (roster.length >= MAX) rensa(roster[0]);
    const b = sakerBus(audio);
    const nu = Math.max(0, (Number(audio.currentTime) || 0) + (nar || 0));
    const stopp = typ === 'stopp';
    const knapp = typ === 'knapp';
    const noder = [];
    const post = { noder, borta: false, timer: 0 };
    const hall = audio.createGain();
    const topp = stopp ? 0.95 : knapp ? 0.42 : 0.72;
    const langd = stopp ? 0.15 : knapp ? 0.045 : 0.085;
    hall.gain.setValueAtTime(topp, nu);
    hall.gain.exponentialRampToValueAtTime(0.0008, nu + langd);
    hall.connect(b.inGain);
    noder.push(hall);

    const kalla = brusBuffer(audio);
    const tick = audio.createBufferSource();
    tick.buffer = kalla;
    const hp = audio.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(stopp ? 700 : 1500, nu);
    const tickGain = audio.createGain();
    tickGain.gain.setValueAtTime(stopp ? 0.7 : 1, nu);
    tickGain.gain.exponentialRampToValueAtTime(0.0008, nu + (knapp ? 0.008 : 0.016));
    tick.connect(hp);
    hp.connect(tickGain);
    tickGain.connect(hall);
    tick.__slut = nu + 0.03;
    tick.start(nu);
    tick.stop(tick.__slut);
    noder.push(tick, hp, tickGain);

    const partialer = stopp
      ? [1680, 2460, 3620]
      : knapp
        ? [2400, 4300]
        : [1850, 3100, 4400];
    partialer.forEach((f, i) => {
      const src = audio.createBufferSource();
      src.buffer = kalla;
      const bp = audio.createBiquadFilter();
      bp.type = 'bandpass';
      const hz = f * (1 + (Math.random() * 2 - 1) * 0.025);
      bp.frequency.setValueAtTime(hz, nu);
      bp.Q.setValueAtTime(stopp ? 6 + i * 2 : 8 + i * 2.5, nu);
      const g = audio.createGain();
      const decay = stopp ? 0.12 - i * 0.012 : knapp ? 0.035 : 0.07 - i * 0.008;
      g.gain.setValueAtTime(0.62 - i * 0.1, nu);
      g.gain.exponentialRampToValueAtTime(0.0008, nu + Math.max(0.02, decay));
      src.connect(bp);
      bp.connect(g);
      g.connect(hall);
      src.__slut = nu + Math.max(0.03, decay) + 0.02;
      src.start(nu);
      src.stop(src.__slut);
      noder.push(src, bp, g);
    });

    const osc = audio.createOscillator();
    osc.type = 'triangle';
    const f0 = stopp ? 168 : knapp ? 230 : 205 + Math.random() * 28;
    osc.frequency.setValueAtTime(f0 * (stopp ? 1.55 : 1.35), nu);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, f0), nu + 0.014);
    const og = audio.createGain();
    og.gain.setValueAtTime(stopp ? 0.9 : knapp ? 0.22 : 0.4, nu);
    og.gain.exponentialRampToValueAtTime(0.0008, nu + (stopp ? 0.1 : 0.04));
    osc.connect(og);
    og.connect(hall);
    osc.__slut = nu + (stopp ? 0.14 : 0.06);
    osc.start(nu);
    osc.stop(osc.__slut);
    noder.push(osc, og);

    const slut = () => rensa(post);
    osc.onended = slut;
    post.timer = setTimeout(slut, Math.round((langd + 0.08) * 1000));
    roster.push(post);
    return roster.length;
  }

  function tyst() {
    for (const r of roster.slice()) rensa(r);
    roster = [];
  }

  function slapp() {
    tyst();
    if (bus) {
      loss(bus.inGain);
      loss(bus.shaper);
      loss(bus.ut);
    }
    bus = null;
    busAudio = null;
    brus = null;
  }

  return {
    antal() { return roster.length; },
    spela(audio, typ, nar) { return rost(audio, typ || 'hack', nar || 0); },
    tyst,
    slapp
  };
}
