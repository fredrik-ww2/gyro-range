// Egen ljudbuss. Toppen ligger under taket i konfig, och fler än max röster startas inte.

import { forberedTystLage, installeraIosLjud, vakna } from '../shared/ios-ljud.js';

function kurva(db) {
  const tak = Math.pow(10, db / 20);
  const n = 1024;
  const data = new Float32Array(n);
  const form = Math.tanh(1.35);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    data[i] = (Math.tanh(x * 1.35) / form) * tak;
  }
  return data;
}

function klamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function mjukBrus(sek, rate) {
  const antal = Math.max(1, Math.floor(rate * sek));
  const buf = new Float32Array(antal);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < antal; i++) {
    const vit = Math.random() * 2 - 1;
    b0 = 0.997 * b0 + vit * 0.02;
    b1 = 0.97 * b1 + vit * 0.045;
    b2 = 0.85 * b2 + vit * 0.06;
    buf[i] = b0 * 1.4 + b1 * 0.45 + b2 * 0.12 + vit * 0.02;
  }
  return buf;
}

function traffBuffer(ctx, kraft) {
  const k = klamp(kraft, 0, 1);
  const sek = 0.04 + k * 0.1;
  const rate = ctx.sampleRate;
  const n = Math.max(1, Math.floor(rate * sek));
  const buf = ctx.createBuffer(1, n, rate);
  const d = buf.getChannelData(0);
  const fTick = 1560 - k * 980;
  const fKropp = 188 + k * 86;
  const fDunk = 92 + k * 30;
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const brus = (Math.random() * 2 - 1) * Math.exp(-t * (260 - k * 110));
    const tick = Math.sin(2 * Math.PI * fTick * t) * Math.exp(-t * (78 - k * 30));
    const kropp = Math.sin(2 * Math.PI * fKropp * t) * Math.exp(-t * (16 + (1 - k) * 14));
    const over = Math.sin(2 * Math.PI * fKropp * 2.31 * t) * Math.exp(-t * (22 + (1 - k) * 12)) * 0.32;
    const dunk = Math.sin(2 * Math.PI * fDunk * t) * Math.exp(-t * (9 + (1 - k) * 7)) * k;
    const s = brus * (0.14 + 0.22 * k) + tick * (0.2 - 0.08 * k) + kropp * (0.32 + 0.48 * k) + over + dunk * 0.62;
    d[i] = Math.max(-1, Math.min(1, s));
  }
  return buf;
}

function halBuffer(ctx) {
  const rate = ctx.sampleRate;
  const n = Math.floor(rate * 0.46);
  const buf = ctx.createBuffer(1, n, rate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const kant = (Math.random() * 2 - 1) * Math.exp(-t * 46) + Math.sin(2 * Math.PI * 640 * t) * Math.exp(-t * 38) * 0.35;
    const efter = t > 0.055 ? Math.exp(-(t - 0.055) * 7.5) : 0;
    const duns = Math.sin(2 * Math.PI * 128 * t) * efter * 0.72 + Math.sin(2 * Math.PI * 74 * t) * efter * 0.55;
    const tra = Math.sin(2 * Math.PI * 246 * t) * efter * 0.28;
    d[i] = Math.max(-1, Math.min(1, kant * 0.55 + duns + tra));
  }
  return buf;
}

function malBuffer(ctx) {
  const rate = ctx.sampleRate;
  const n = Math.floor(rate * 0.55);
  const buf = ctx.createBuffer(1, n, rate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const knack = (Math.random() * 2 - 1) * Math.exp(-t * 50) * 0.18;
    const a = Math.sin(2 * Math.PI * 392 * t) * Math.exp(-t * 3.4) * 0.46;
    const b = Math.sin(2 * Math.PI * 523.25 * t) * Math.exp(-t * 4.2) * 0.3;
    const c = Math.sin(2 * Math.PI * 784 * t) * Math.exp(-t * 6.5) * 0.08;
    d[i] = Math.max(-1, Math.min(1, knack + a + b + c));
  }
  return buf;
}

export function skapaLjud(konfig) {
  const maxRoster = konfig.ljud.roster;
  let ctx = null;
  let buss = null;
  let master = null;
  let roll = null;
  let rollFilter = null;
  let aktiva = 0;
  let pa = konfig.strombrytare.ljud !== false && konfig.ljud.pa !== false;
  let buffrar = null;
  let senStuds = -1;
  let senStudsVolym = 0;

  function starta() {
    forberedTystLage();
    if (ctx) {
      if (ctx.state === 'suspended' || ctx.state === 'interrupted') vakna(ctx);
      return ctx;
    }
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      return null;
    }
    buss = ctx.createGain();
    master = ctx.createGain();
    master.gain.value = konfig.ljud.master;
    const form = ctx.createWaveShaper();
    form.curve = kurva(konfig.ljud.takDbtp);
    form.oversample = '2x';
    buss.connect(master);
    master.connect(form);
    form.connect(ctx.destination);

    const rate = ctx.sampleRate;
    const rullBuf = ctx.createBuffer(1, Math.floor(rate * 2), rate);
    rullBuf.copyToChannel(mjukBrus(2, rate), 0);
    const kalla = ctx.createBufferSource();
    kalla.buffer = rullBuf;
    kalla.loop = true;
    rollFilter = ctx.createBiquadFilter();
    rollFilter.type = 'lowpass';
    rollFilter.frequency.value = 640;
    rollFilter.Q.value = 0.55;
    const kropp = ctx.createBiquadFilter();
    kropp.type = 'peaking';
    kropp.frequency.value = 260;
    kropp.Q.value = 0.9;
    kropp.gain.value = 3.5;
    roll = ctx.createGain();
    roll.gain.value = 0;
    kalla.connect(rollFilter);
    rollFilter.connect(kropp);
    kropp.connect(roll);
    roll.connect(buss);
    try { kalla.start(); } catch { /* kontexten tog inte emot */ }
    aktiva = 1;
    buffrar = {
      latt: traffBuffer(ctx, 0.18),
      medel: traffBuffer(ctx, 0.45),
      hard: traffBuffer(ctx, 0.72),
      tung: traffBuffer(ctx, 1),
      hal: halBuffer(ctx),
      mal: malBuffer(ctx),
    };
    if (ctx.state === 'suspended' || ctx.state === 'interrupted') vakna(ctx);
    return ctx;
  }

  function studsBuffer(kraft) {
    if (kraft < 0.32) return buffrar.latt;
    if (kraft < 0.58) return buffrar.medel;
    if (kraft < 0.82) return buffrar.hard;
    return buffrar.tung;
  }

  function knack(namn, volym, kraft) {
    if (!pa || !ctx || !buffrar || aktiva >= maxRoster) return;
    const nu = ctx.currentTime;
    if (namn === 'studs') {
      if (nu - senStuds < 0.032 && volym <= senStudsVolym * 1.08) return;
      senStuds = nu;
      senStudsVolym = volym;
    }
    const buf = namn === 'studs' ? studsBuffer(kraft ?? volym) : buffrar[namn];
    if (!buf) return;
    aktiva++;
    const kalla = ctx.createBufferSource();
    const gain = ctx.createGain();
    kalla.buffer = buf;
    gain.gain.value = volym;
    if (namn === 'studs') kalla.playbackRate.value = 0.94 + Math.random() * 0.12;
    kalla.connect(gain);
    gain.connect(buss);
    kalla.onended = () => {
      aktiva = Math.max(1, aktiva - 1);
      try { kalla.disconnect(); } catch { /* redan borta */ }
      try { gain.disconnect(); } catch { /* redan borta */ }
    };
    try { kalla.start(); } catch { aktiva = Math.max(1, aktiva - 1); }
  }

  function fran(state) {
    if (!ctx || !roll) return;
    const nu = ctx.currentTime;
    const fart = state.fart || 0;
    const troskel = konfig.ljud.rullTroskel ?? 0.02;
    const rullar = state.lage === 'rullar' || state.lage === 'tippar';
    let mal = 0;
    if (pa && rullar && fart > troskel) {
      const u = Math.min(1, (fart - troskel) / Math.max(0.05, konfig.ljud.rullFart));
      mal = Math.pow(u, 1.3) * konfig.ljud.rullVolym;
    }
    try { roll.gain.setTargetAtTime(mal, nu, 0.07); } catch { /* ingen förstärkare */ }
    if (rollFilter && rullar) {
      try { rollFilter.frequency.setTargetAtTime(480 + Math.min(700, fart * 1600), nu, 0.1); } catch { /* filter saknas */ }
    }
    if (!pa) return;
    for (const h of state.handelser || []) {
      if (h.typ === 'studs') knack('studs', konfig.ljud.studsVolym * (0.28 + 0.72 * (h.kraft || 0.3)), h.kraft || 0.3);
      else if (h.typ === 'hal') knack('hal', konfig.ljud.halVolym, 1);
      else if (h.typ === 'mal') knack('mal', konfig.ljud.malVolym, 1);
    }
  }

  function satt(ny) {
    pa = !!ny;
    if (roll && ctx) {
      try { roll.gain.setTargetAtTime(0, ctx.currentTime, 0.03); } catch { /* tyst redan */ }
    }
  }

  installeraIosLjud({ hamta: () => ctx, oppna: () => starta() });
  return {starta, fran, satt, get pa() { return pa; }};
}
