// Bowlinghall utan ljudfiler. Modal syntes: trä, uretan mot lack och käglor.
// Högst 12 röster. En mjuk kurva håller toppen under -1 dBTP.
// Inget anrop till navigator.vibrate.

const GOLV = 0.0001;

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
  try { nod.onended = null; } catch { /* frusen */ }
  try { if (typeof nod.stop === 'function') nod.stop(); } catch { /* redan stoppad */ }
  try { nod.disconnect(); } catch { /* redan borta */ }
}

// Samma tysta <audio>-slinga som panorama/ljud.js, så iOS Safari med
// ljudlös-strömbrytaren ändå släpper igenom WebAudio efter en gest.
function lasOppTyst() {
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
    else if (!globalThis.__tystBrytare) {
      const n = 8000;
      const b = new ArrayBuffer(44 + n * 2);
      const v = new DataView(b);
      const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
      w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt ');
      v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
      v.setUint32(24, n, true); v.setUint32(28, n * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
      w(36, 'data'); v.setUint32(40, n * 2, true);
      const a = document.createElement('audio');
      a.setAttribute('playsinline', '');
      a.loop = true;
      a.volume = 0.001;
      a.src = URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
      globalThis.__tystBrytare = a;
      a.play().catch(() => {});
    } else globalThis.__tystBrytare.play().catch(() => {});
  } catch { /* äldre webbläsare */ }
}

export function skapaLjud(konfig) {
  let ctx = null;
  let torr = null;
  let rum = null;
  const roster = [];
  let rull = null;
  const cache = new Map();
  const tak = Math.pow(10, konfig.ljud.tak_db / 20);
  const max = Math.max(8, Math.min(12, konfig.ljud.roster || 12));

  function saker() {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) {
      try { ctx = new AC(); }
      catch { return null; }
      torr = ctx.createGain();
      torr.gain.value = 0.92;
      const form = ctx.createWaveShaper();
      form.curve = kurva(1024, tak);
      form.oversample = '2x';
      torr.connect(form);
      form.connect(ctx.destination);
      rum = ctx.createGain();
      rum.gain.value = 1;
      const spegling = [
        [0.017, 0.2, 3400],
        [0.031, 0.13, 2600],
        [0.053, 0.07, 1800]
      ];
      for (const [tid, volym, frek] of spegling) {
        const d = ctx.createDelay(0.08);
        d.delayTime.value = tid;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = frek;
        const g = ctx.createGain();
        g.gain.value = volym;
        rum.connect(d);
        d.connect(lp);
        lp.connect(g);
        g.connect(torr);
      }
    }
    return ctx;
  }

  function vack() {
    lasOppTyst();
    try {
      const c = saker();
      if (c && c.state === 'suspended') c.resume();
    } catch { /* ljud är valfritt */ }
  }

  function rensa(rost) {
    if (!rost || rost.borta) return;
    rost.borta = true;
    if (rost === rull) rull = null;
    const i = roster.indexOf(rost);
    if (i >= 0) roster.splice(i, 1);
    for (const n of rost.noder) loss(n);
  }

  function plats() {
    while (roster.length >= max) {
      const offer = roster.find(r => r !== rull);
      if (!offer) break;
      rensa(offer);
    }
  }

  function buffer(slag, sek) {
    const key = `${ctx.sampleRate}:${slag}:${sek}`;
    const finns = cache.get(key);
    if (finns) return finns;
    const rate = ctx.sampleRate;
    const len = Math.max(8, Math.floor(rate * sek));
    const buf = ctx.createBuffer(1, len, rate);
    const d = buf.getChannelData(0);
    let brun = 0;
    let s = slag === 'knack' ? 0x51f1e2b : 0x6d2b79f5;
    for (let i = 0; i < len; i++) {
      s = Math.imul(s ^ (s >>> 15), s | 1);
      s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
      const vit = ((s ^ (s >>> 14)) >>> 0) / 4294967296 * 2 - 1;
      if (slag === 'brun') {
        brun = (brun + vit * 0.02) / 1.02;
        d[i] = brun * 3.4;
      } else if (slag === 'knack') {
        d[i] = vit * Math.exp(-(i / rate) / 0.007);
      } else d[i] = vit * 0.55;
    }
    if (slag === 'brun') {
      const fade = Math.min(len >> 2, Math.floor(rate * 0.04));
      for (let i = 0; i < fade; i++) {
        const w = i / fade;
        d[i] *= w;
        d[len - 1 - i] *= w;
      }
    }
    cache.set(key, buf);
    return buf;
  }

  function folj(param, mal, sek) {
    const nu = ctx.currentTime;
    const start = Number.isFinite(param.value) ? param.value : mal;
    param.cancelScheduledValues(nu);
    param.setValueAtTime(start, nu);
    const till = mal;
    if (!(sek > 0.001)) param.setValueAtTime(till, nu);
    else param.linearRampToValueAtTime(till, nu + sek);
  }

  function kurvaGain(gain, t, topp, attack, slut) {
    const a = Math.max(0.002, attack);
    const s = Math.max(slut, a + 0.008);
    gain.setValueAtTime(GOLV, t);
    gain.exponentialRampToValueAtTime(Math.max(GOLV * 2, topp), t + a);
    gain.exponentialRampToValueAtTime(GOLV, t + s);
    return s;
  }

  function nyRost(rumAndel) {
    plats();
    const ut = ctx.createGain();
    ut.gain.value = 1;
    ut.connect(torr);
    const noder = [ut];
    if (rumAndel > 0) {
      const s = ctx.createGain();
      s.gain.value = rumAndel;
      ut.connect(s);
      s.connect(rum);
      noder.push(s);
    }
    const kallor = [];
    return { ut, noder, kallor };
  }

  function stang(rost) {
    if (!rost.kallor.length) return;
    const post = { noder: rost.noder, borta: false };
    let kvar = rost.kallor.length;
    const slut = () => {
      kvar -= 1;
      if (kvar <= 0) rensa(post);
    };
    for (const k of rost.kallor) k.onended = slut;
    roster.push(post);
  }

  function spela(nod, t, langd) {
    nod.start(t);
    nod.stop(t + langd);
  }

  function modal(rost, t, frek, decay, amp, q) {
    const src = ctx.createBufferSource();
    src.buffer = buffer('knack', 0.08);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(Math.max(40, frek), t);
    bp.Q.setValueAtTime(q, t);
    const g = ctx.createGain();
    const s = kurvaGain(g.gain, t, amp, 0.003, decay);
    src.connect(bp);
    bp.connect(g);
    g.connect(rost.ut);
    spela(src, t, s + 0.02);
    rost.noder.push(src, bp, g);
    rost.kallor.push(src);
  }

  function duns(rost, t, frek, decay, amp) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const f0 = Math.max(36, frek);
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(32, f0 * 0.62), t + decay);
    const g = ctx.createGain();
    const s = kurvaGain(g.gain, t, amp, 0.006, decay);
    osc.connect(g);
    g.connect(rost.ut);
    spela(osc, t, s + 0.02);
    rost.noder.push(osc, g);
    rost.kallor.push(osc);
  }

  function knack(rost, t, amp, hpFrek) {
    const src = ctx.createBufferSource();
    src.buffer = buffer('knack', 0.05);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(hpFrek, t);
    const g = ctx.createGain();
    const s = kurvaGain(g.gain, t, amp, 0.002, 0.028);
    src.connect(hp);
    hp.connect(g);
    g.connect(rost.ut);
    spela(src, t, s + 0.02);
    rost.noder.push(src, hp, g);
    rost.kallor.push(src);
  }

  function klocka(frek, forsening, langd, amp, rumAndel) {
    const c = saker();
    if (!c) return;
    const t0 = c.currentTime + forsening;
    const rost = nyRost(rumAndel);
    const partialer = [
      [1, 1],
      [2.01, 0.28],
      [2.76, 0.14],
      [3.42, 0.06]
    ];
    for (const [mult, del] of partialer) {
      const osc = c.createOscillator();
      osc.type = mult < 2 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(frek * mult, t0);
      const g = c.createGain();
      const s = kurvaGain(g.gain, t0, amp * del, 0.012, langd * (mult < 2 ? 1 : 0.62));
      osc.connect(g);
      g.connect(rost.ut);
      spela(osc, t0, s + 0.02);
      rost.noder.push(osc, g);
      rost.kallor.push(osc);
    }
    stang(rost);
  }

  function pa() {
    return !!konfig.brytare.ljud && !!saker();
  }

  function klick() {
    if (!pa()) return;
    const t = ctx.currentTime;
    const rost = nyRost(0);
    knack(rost, t, 0.55, 2200);
    modal(rost, t, 2450, 0.02, 0.34, 6);
    modal(rost, t + 0.008, 1680, 0.028, 0.22, 4);
    duns(rost, t, 720, 0.03, 0.12);
    stang(rost);
  }

  function start() {
    vack();
    if (!pa()) return;
    klocka(740, 0.045, 0.13, 0.34, 0.08);
    klocka(988, 0.14, 0.16, 0.3, 0.08);
  }

  function bevapnad() {
    if (!pa()) return;
    klocka(523.25, 0, 0.32, 0.3, 0.16);
    klocka(659.25, 0.11, 0.36, 0.28, 0.16);
  }

  function landning(fart) {
    if (!pa()) return;
    const s = Math.max(0.48, Math.min(1, ((Number(fart) || 6) - 2.5) / 8));
    const t = ctx.currentTime;
    const rost = nyRost(0.42);
    duns(rost, t, 86, 0.11, 0.5 * s);
    duns(rost, t, 54, 0.16, 0.28 * s);
    const src = ctx.createBufferSource();
    src.buffer = buffer('vit', 0.12);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(240, t);
    lp.frequency.exponentialRampToValueAtTime(90, t + 0.08);
    const g = ctx.createGain();
    const langd = kurvaGain(g.gain, t, 0.42 * s, 0.004, 0.07);
    src.connect(lp);
    lp.connect(g);
    g.connect(rost.ut);
    spela(src, t, langd + 0.02);
    rost.noder.push(src, lp, g);
    rost.kallor.push(src);
    modal(rost, t, 118, 0.26, 0.16 * s, 3.2);
    modal(rost, t + 0.01, 168, 0.18, 0.08 * s, 2.4);
    stang(rost);
  }

  function seRull() {
    if (rull && !rull.borta && !rull.tystnar) return rull;
    if (rull && rull.tystnar) rull = null;
    plats();
    const src = ctx.createBufferSource();
    src.buffer = buffer('brun', 2.4);
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 260;
    lp.Q.value = 0.65;
    const rummel = ctx.createGain();
    rummel.gain.value = GOLV;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 480;
    bp.Q.value = 0.5;
    const fras = ctx.createGain();
    fras.gain.value = GOLV;
    const oscA = ctx.createOscillator();
    oscA.type = 'sine';
    oscA.frequency.value = 92;
    const gA = ctx.createGain();
    gA.gain.value = GOLV;
    const oscB = ctx.createOscillator();
    oscB.type = 'sine';
    oscB.frequency.value = 128;
    const gB = ctx.createGain();
    gB.gain.value = GOLV;
    const ut = ctx.createGain();
    ut.gain.value = 1;
    ut.connect(torr);
    const send = ctx.createGain();
    send.gain.value = 0.38;
    ut.connect(send);
    send.connect(rum);
    src.connect(lp);
    lp.connect(rummel);
    rummel.connect(ut);
    src.connect(bp);
    bp.connect(fras);
    fras.connect(ut);
    oscA.connect(gA);
    gA.connect(ut);
    oscB.connect(gB);
    gB.connect(ut);
    src.start();
    oscA.start();
    oscB.start();
    const rost = {
      noder: [src, lp, rummel, bp, fras, oscA, gA, oscB, gB, ut, send],
      borta: false,
      tystnar: false,
      ut, lp, rummel, fras, oscA, gA, oscB, gB
    };
    let kvar = 3;
    const slut = () => {
      kvar -= 1;
      if (kvar <= 0) rensa(rost);
    };
    src.onended = slut;
    oscA.onended = slut;
    oscB.onended = slut;
    roster.push(rost);
    rull = rost;
    return rost;
  }

  function rulla(fart, paBana = true) {
    if (!konfig.brytare.ljud) { tystRull(); return; }
    if (!saker()) return;
    const f = Number.isFinite(+fart) ? Math.max(0, +fart) : 0;
    const tyst = !(f > 0.35) || !paBana;
    if (tyst) {
      if (!rull || rull.borta || rull.tystnar) return;
    } else if (rull && rull.tystnar) rull = null;
    const rost = seRull();
    if (!rost) return;
    const n = Math.max(0, Math.min(1, (f - 0.35) / 8.5));
    const golv = tyst ? GOLV : 0.02 + n * 0.14;
    const frasVol = tyst ? GOLV : 0.008 + n * 0.045;
    const ton = tyst ? GOLV : 0.012 + n * 0.055;
    const frek = 75 + n * 65;
    folj(rost.rummel.gain, golv, tyst ? 0.14 : 0.08);
    folj(rost.fras.gain, frasVol, 0.1);
    folj(rost.gA.gain, ton, 0.09);
    folj(rost.gB.gain, ton * 0.55, 0.09);
    folj(rost.lp.frequency, tyst ? 180 : 220 + n * 380, 0.1);
    folj(rost.oscA.frequency, Math.max(75, Math.min(140, frek)), 0.12);
    folj(rost.oscB.frequency, Math.max(75, Math.min(140, frek * 1.33)), 0.12);
  }

  function tystRull() {
    if (!rull || rull.borta || rull.tystnar) return;
    rull.tystnar = true;
    if (!ctx) { rensa(rull); return; }
    const nu = ctx.currentTime;
    try {
      folj(rull.ut.gain, GOLV, 0.08);
      for (const n of rull.noder) {
        if (typeof n.stop === 'function') n.stop(nu + 0.1);
      }
    } catch { rensa(rull); }
  }

  function ranna() {
    if (!pa()) return;
    const t0 = ctx.currentTime;
    const rost = nyRost(0.48);
    duns(rost, t0, 68, 0.12, 0.34);
    const slag = [
      [0, 980, 0.07, 0.22],
      [0.028, 1540, 0.05, 0.16],
      [0.061, 1320, 0.06, 0.14],
      [0.098, 2100, 0.04, 0.12],
      [0.142, 1760, 0.045, 0.1]
    ];
    for (const [dt, frek, decay, amp] of slag) {
      modal(rost, t0 + dt, frek, decay, amp, 7.5);
      knack(rost, t0 + dt, amp * 0.45, 1400);
    }
    stang(rost);
  }

  function krasch(antal, fart) {
    if (!pa()) return;
    const n = Math.max(1, Math.min(10, Math.round(Number(antal) || 1)));
    const styrka = Math.max(0.55, Math.min(1, ((Number(fart) > 0 ? Number(fart) : 6) / 9)));
    const traffar = n === 1 ? 1 : Math.min(12, n + Math.floor((n - 1) * 0.45));
    const span = n <= 1 ? 0.006 : Math.min(0.4, 0.04 + (n - 1) * 0.04);
    const moder = [580, 1080, 1950, 3100];
    const t0 = ctx.currentTime;
    const rost = nyRost(0.36);
    for (let i = 0; i < traffar; i++) {
      const u = traffar === 1 ? 0 : i / (traffar - 1);
      const jitter = i === 0 ? 0 : ((i * 47 + n * 13) % 11) / 11 * 0.014;
      const t = t0 + Math.min(0.4, u * span + jitter);
      const frek = moder[i % moder.length];
      const decay = frek > 2000 ? 0.032 : frek > 1200 ? 0.05 : frek > 700 ? 0.07 : 0.095;
      const bas = frek > 2000 ? 0.1 : frek > 1200 ? 0.14 : frek > 700 ? 0.18 : 0.26;
      const form = 0.72 + 0.28 * (1 - u);
      modal(rost, t, frek, decay, bas * styrka * form, frek > 1800 ? 9 : 7);
      if (n === 1) modal(rost, t + 0.004, 1080, 0.05, 0.12 * styrka, 8);
      else if (n >= 6 && i % 3 === 0) modal(rost, t + 0.005, moder[(i + 2) % 4], decay * 0.8, bas * 0.45 * styrka, 8);
      if (i % 2 === 0) {
        knack(rost, t, 0.16 * styrka * form, 1700);
        duns(rost, t, 124 + (i % 5) * 12, 0.07, 0.16 * styrka * form);
      }
    }
    stang(rost);
  }

  return {
    vack,
    klick,
    start,
    bevapnad,
    landning,
    krasch,
    rulla,
    ranna,
    tystRull,
    get roster() { return roster.length; },
    get tak() { return tak; }
  };
}
