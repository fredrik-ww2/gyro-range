// WebAudio: klick, beväpningston, rullande klot och kägelkrasch.
// Högst 8 röster. En mjuk kurva håller toppen på eller under -1 dBTP.
// Inget anrop till navigator.vibrate.

function kurva(n, tak) {
  const curve = new Float32Array(n);
  const k = 1.2;
  const norm = Math.tanh(k);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = (Math.tanh(k * x) / norm) * tak;
  }
  return curve;
}

function loss(nod) {
  if (!nod) return;
  try { if (typeof nod.stop === 'function') nod.stop(); } catch { /* redan stoppad */ }
  try { nod.disconnect(); } catch { /* redan borta */ }
  try { nod.onended = null; } catch { /* frusen */ }
}

export function skapaLjud(konfig) {
  let ctx = null;
  let bus = null;
  const roster = [];
  let rull = null;
  const tak = Math.pow(10, konfig.ljud.tak_db / 20);
  const max = konfig.ljud.roster;

  function saker() {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) {
      try { ctx = new AC(); }
      catch { return null; }
      const inn = ctx.createGain();
      inn.gain.value = 0.8;
      const form = ctx.createWaveShaper();
      form.curve = kurva(1024, tak);
      form.oversample = 'none';
      const ut = ctx.createGain();
      ut.gain.value = 1;
      inn.connect(form);
      form.connect(ut);
      ut.connect(ctx.destination);
      bus = inn;
    }
    return ctx;
  }

  function vack() {
    try {
      const c = saker();
      if (c && c.state === 'suspended') c.resume();
    } catch { /* ljud är valfritt */ }
  }

  function rensa(rost) {
    if (!rost || rost.borta) return;
    rost.borta = true;
    if (rost === rull) rull = null;
    for (const n of rost.noder) loss(n);
    const i = roster.indexOf(rost);
    if (i >= 0) roster.splice(i, 1);
  }

  function plats() {
    while (roster.length >= max) rensa(roster[0]);
  }

  function ton(frek, langd, volym, typ) {
    if (!konfig.brytare.ljud) return;
    const c = saker();
    if (!c) return;
    plats();
    const nu = c.currentTime;
    const osc = c.createOscillator();
    osc.type = typ || 'sine';
    osc.frequency.setValueAtTime(frek, nu);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0008, nu);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, volym), nu + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, nu + langd);
    osc.connect(g);
    g.connect(bus);
    const rost = { noder: [osc, g], borta: false };
    osc.onended = () => rensa(rost);
    osc.start(nu);
    osc.stop(nu + langd + 0.02);
    roster.push(rost);
  }

  function klick() {
    ton(1800, 0.045, 0.22, 'triangle');
  }

  function bevapnad() {
    if (!konfig.brytare.ljud) return;
    const c = saker();
    if (!c) return;
    plats();
    const nu = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, nu);
    osc.frequency.exponentialRampToValueAtTime(880, nu + 0.08);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0008, nu);
    g.gain.exponentialRampToValueAtTime(0.28, nu + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0008, nu + 0.22);
    osc.connect(g);
    g.connect(bus);
    const rost = { noder: [osc, g], borta: false };
    osc.onended = () => rensa(rost);
    osc.start(nu);
    osc.stop(nu + 0.24);
    roster.push(rost);
  }

  function brus(sek) {
    const c = saker();
    const len = Math.max(8, Math.floor(c.sampleRate * sek));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    let y = 0;
    for (let i = 0; i < len; i++) {
      const v = Math.random() * 2 - 1;
      y = y * 0.55 + v * 0.45;
      d[i] = y;
    }
    return buf;
  }

  function krasch() {
    if (!konfig.brytare.ljud) return;
    const c = saker();
    if (!c) return;
    plats();
    const nu = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = brus(0.18);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(420, nu);
    bp.Q.value = 0.7;
    const g = c.createGain();
    g.gain.setValueAtTime(0.55, nu);
    g.gain.exponentialRampToValueAtTime(0.0008, nu + 0.16);
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, nu);
    osc.frequency.exponentialRampToValueAtTime(70, nu + 0.12);
    const og = c.createGain();
    og.gain.setValueAtTime(0.35, nu);
    og.gain.exponentialRampToValueAtTime(0.0008, nu + 0.14);
    src.connect(bp);
    bp.connect(g);
    g.connect(bus);
    osc.connect(og);
    og.connect(bus);
    const rost = { noder: [src, bp, g, osc, og], borta: false };
    osc.onended = () => rensa(rost);
    src.start(nu);
    src.stop(nu + 0.18);
    osc.start(nu);
    osc.stop(nu + 0.16);
    roster.push(rost);
  }

  function rulla(fart) {
    if (!konfig.brytare.ljud || !(fart > 0.4)) { tystRull(); return; }
    const c = saker();
    if (!c) return;
    if (!rull) {
      plats();
      const src = c.createBufferSource();
      src.buffer = brus(0.4);
      src.loop = true;
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 380;
      const g = c.createGain();
      g.gain.value = 0.0008;
      src.connect(lp);
      lp.connect(g);
      g.connect(bus);
      src.start();
      rull = { noder: [src, lp, g], borta: false, gain: g };
      roster.push(rull);
    }
    const mal = Math.min(0.18, 0.04 + fart * 0.012);
    rull.gain.gain.setTargetAtTime(mal, c.currentTime, 0.05);
  }

  function tystRull() {
    if (!rull) return;
    rensa(rull);
    rull = null;
  }

  return {
    vack,
    klick,
    bevapnad,
    krasch,
    rulla,
    tystRull,
    get roster() { return roster.length; },
    get tak() { return tak; }
  };
}
