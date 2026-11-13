// Egen ljudbuss. Toppen ligger under taket i konfig, och fler än max röster startas inte.

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

function brus(ctx, sek, fall) {
  const rate = ctx.sampleRate;
  const antal = Math.max(1, Math.floor(rate * sek));
  const buf = ctx.createBuffer(1, antal, rate);
  const d = buf.getChannelData(0);
  let brun = 0;
  for (let i = 0; i < antal; i++) {
    const t = i / rate;
    brun = (brun + (Math.random() * 2 - 1) * 0.04) / 1.04;
    const env = Math.exp(-t * fall);
    d[i] = Math.max(-0.8, Math.min(0.8, brun * 8 * env));
  }
  return buf;
}

function ton(ctx, frek, sek, fall) {
  const rate = ctx.sampleRate;
  const antal = Math.max(1, Math.floor(rate * sek));
  const buf = ctx.createBuffer(1, antal, rate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < antal; i++) {
    const t = i / rate;
    const env = Math.exp(-t * fall);
    const s = Math.sin(2 * Math.PI * frek * t) * 0.65 + Math.sin(2 * Math.PI * frek * 1.5 * t) * 0.22;
    d[i] = Math.max(-0.8, Math.min(0.8, s * env));
  }
  return buf;
}

export function skapaLjud(konfig) {
  const maxRoster = konfig.ljud.roster;
  let ctx = null;
  let buss = null;
  let master = null;
  let roll = null;
  let aktiva = 0;
  let pa = konfig.strombrytare.ljud !== false && konfig.ljud.pa !== false;
  let buffrar = null;

  function starta() {
    if (ctx) {
      ctx.resume().catch(() => {});
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
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 420;
    filter.Q.value = 0.7;
    const forstark = ctx.createGain();
    forstark.gain.value = 0;
    const kalla = ctx.createBufferSource();
    kalla.buffer = brus(ctx, 1.2, 0);
    kalla.loop = true;
    kalla.connect(filter);
    filter.connect(forstark);
    forstark.connect(buss);
    try { kalla.start(); } catch { /* kontexten tog inte emot */ }
    roll = forstark;
    aktiva = 1;
    buffrar = {
      studs: brus(ctx, 0.09, 38),
      hal: brus(ctx, 0.28, 9),
      mal: ton(ctx, 740, 0.45, 4.5),
    };
    const duns = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.16), ctx.sampleRate);
    const d = duns.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const t = i / ctx.sampleRate;
      d[i] = Math.sin(2 * Math.PI * 140 * t) * Math.exp(-t * 22) * 0.7;
    }
    buffrar.halDuns = duns;
    ctx.resume().catch(() => {});
    return ctx;
  }

  function knack(namn, volym) {
    if (!pa || !ctx || !buffrar || aktiva >= maxRoster) return;
    const buf = buffrar[namn];
    if (!buf) return;
    aktiva++;
    const kalla = ctx.createBufferSource();
    const gain = ctx.createGain();
    kalla.buffer = buf;
    gain.gain.value = volym;
    if (namn === 'studs') kalla.playbackRate.value = 0.9 + Math.random() * 0.25;
    kalla.connect(gain);
    gain.connect(buss);
    kalla.onended = () => {
      aktiva = Math.max(1, aktiva - 1);
      try { kalla.disconnect(); } catch { /* redan borta */ }
      try { gain.disconnect(); } catch { /* redan borta */ }
    };
    try { kalla.start(); } catch { aktiva = Math.max(1, aktiva - 1); }
    if (namn === 'hal' && buffrar.halDuns && aktiva < maxRoster) {
      aktiva++;
      const extra = ctx.createBufferSource();
      const eg = ctx.createGain();
      extra.buffer = buffrar.halDuns;
      eg.gain.value = volym * 0.8;
      extra.connect(eg);
      eg.connect(buss);
      extra.onended = () => {
        aktiva = Math.max(1, aktiva - 1);
        try { extra.disconnect(); } catch { /* redan borta */ }
        try { eg.disconnect(); } catch { /* redan borta */ }
      };
      try { extra.start(); } catch { aktiva = Math.max(1, aktiva - 1); }
    }
  }

  function fran(state) {
    if (!ctx || !roll) return;
    const nu = ctx.currentTime;
    const mal = pa ? Math.min(1, (state.fart || 0) / konfig.ljud.rullFart) * konfig.ljud.rullVolym : 0;
    try { roll.gain.setTargetAtTime(state.lage === 'rullar' || state.lage === 'tippar' ? mal : 0, nu, 0.05); } catch { /* ingen förstärkare */ }
    if (!pa) return;
    for (const h of state.handelser || []) {
      if (h.typ === 'studs') knack('studs', konfig.ljud.studsVolym * (0.45 + 0.55 * (h.kraft || 1)));
      else if (h.typ === 'hal') knack('hal', konfig.ljud.halVolym);
      else if (h.typ === 'mal') knack('mal', konfig.ljud.malVolym);
    }
  }

  function satt(ny) {
    pa = !!ny;
    if (roll && ctx) {
      try { roll.gain.setTargetAtTime(0, ctx.currentTime, 0.03); } catch { /* tyst redan */ }
    }
  }

  return {starta, fran, satt, get pa() { return pa; }};
}
