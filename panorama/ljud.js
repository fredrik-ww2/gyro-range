// Skott, träff och taktilt klick utan ljudfiler. AudioContext skapas först i en användargest.

function klamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

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
      a.src = URL.createObjectURL(new Blob([b], {type: 'audio/wav'}));
      globalThis.__tystBrytare = a;
      a.play().catch(() => {});
    } else globalThis.__tystBrytare.play().catch(() => {});
  } catch { /* äldre webbläsare */ }
}

function brusBuffer(ctx) {
  const n = Math.floor(ctx.sampleRate * 0.45);
  const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buffer.getChannelData(0);
  let s = 0x6d2b79f5;
  for (let i = 0; i < n; i++) {
    s = Math.imul(s ^ (s >>> 15), s | 1);
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
    const vit = ((s ^ (s >>> 14)) >>> 0) / 4294967296 * 2 - 1;
    d[i] = vit * Math.exp(-i / (ctx.sampleRate * 0.055));
  }
  return buffer;
}

function kurva(gain, t, topp, slut) {
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, topp), t + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + slut);
}

export function skapaLjud() {
  let ctx = null;
  let master = null;
  let brus = null;
  let pa = true;
  let volym = 0.85;
  let skottAntal = 0;
  let traffAntal = 0;
  let klickAntal = 0;
  let oppnaLovande = null;

  function seTill() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx || ctx.state === 'closed') {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = pa ? volym : 0;
      const komp = ctx.createDynamicsCompressor();
      komp.threshold.value = -14;
      komp.knee.value = 8;
      komp.ratio.value = 3.2;
      komp.attack.value = 0.002;
      komp.release.value = 0.18;
      const delay = ctx.createDelay(0.6);
      delay.delayTime.value = 0.12;
      const damp = ctx.createBiquadFilter();
      damp.type = 'lowpass';
      damp.frequency.value = 2400;
      const fb = ctx.createGain();
      fb.gain.value = 0.34;
      const delay2 = ctx.createDelay(0.7);
      delay2.delayTime.value = 0.26;
      const fb2 = ctx.createGain();
      fb2.gain.value = 0.2;
      const eko = ctx.createGain();
      eko.gain.value = 0.5;
      master.connect(komp);
      komp.connect(ctx.destination);
      komp.connect(delay);
      delay.connect(damp);
      damp.connect(fb);
      fb.connect(delay);
      fb.connect(eko);
      komp.connect(delay2);
      delay2.connect(fb2);
      fb2.connect(eko);
      eko.connect(ctx.destination);
      brus = brusBuffer(ctx);
    }
    return ctx;
  }

  function oppna() {
    lasOppTyst();
    try {
      if (!seTill()) return Promise.resolve(false);
      if (ctx.state === 'suspended') {
        oppnaLovande = ctx.resume().then(() => true).catch(() => false);
        return oppnaLovande;
      }
      return Promise.resolve(true);
    } catch {
      return Promise.resolve(false);
    }
  }

  function satt(nastaPa, nastaVolym) {
    pa = !!nastaPa;
    volym = klamp(Number.isFinite(+nastaVolym) ? +nastaVolym : volym, 0, 1);
    if (master) master.gain.value = pa ? volym : 0;
  }

  function skott() {
    if (!pa) return false;
    try {
      if (!seTill() || !brus || !master) return false;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      skottAntal++;
      const t = ctx.currentTime;
      const bus = ctx.createGain();
      bus.gain.value = 0.9;
      bus.connect(master);

      const knall = ctx.createBufferSource();
      knall.buffer = brus;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1400;
      const hg = ctx.createGain();
      kurva(hg, t, 1.15, 0.07);
      knall.connect(hp); hp.connect(hg); hg.connect(bus);
      knall.start(t); knall.stop(t + 0.09);

      const kropp = ctx.createBufferSource();
      kropp.buffer = brus;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 980;
      bp.Q.value = 0.65;
      const bg = ctx.createGain();
      kurva(bg, t, 0.85, 0.2);
      kropp.connect(bp); bp.connect(bg); bg.connect(bus);
      kropp.start(t); kropp.stop(t + 0.22);

      const snart = ctx.createOscillator();
      snart.type = 'triangle';
      snart.frequency.setValueAtTime(2400, t);
      snart.frequency.exponentialRampToValueAtTime(680, t + 0.045);
      const sg = ctx.createGain();
      kurva(sg, t, 0.28, 0.05);
      snart.connect(sg); sg.connect(bus);
      snart.start(t); snart.stop(t + 0.06);

      const bas = ctx.createOscillator();
      bas.type = 'sine';
      bas.frequency.setValueAtTime(170, t);
      bas.frequency.exponentialRampToValueAtTime(48, t + 0.11);
      const dg = ctx.createGain();
      kurva(dg, t, 0.55, 0.14);
      bas.connect(dg); dg.connect(bus);
      bas.start(t); bas.stop(t + 0.16);
      knall.onended = () => {
        for (const n of [knall, hp, hg, kropp, bp, bg, snart, sg, bas, dg, bus]) {
          try { n.disconnect(); } catch { /* redan borta */ }
        }
      };
      return true;
    } catch {
      return false;
    }
  }

  function traff() {
    if (!pa) return false;
    try {
      if (!seTill() || !brus || !master) return false;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      traffAntal++;
      const t = ctx.currentTime + 0.028;
      const tick = ctx.createBufferSource();
      tick.buffer = brus;
      tick.playbackRate.value = 1.4;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1800;
      const g = ctx.createGain();
      kurva(g, t, 0.34, 0.04);
      const ton = ctx.createOscillator();
      ton.type = 'triangle';
      ton.frequency.setValueAtTime(1500, t);
      ton.frequency.exponentialRampToValueAtTime(420, t + 0.04);
      const tg = ctx.createGain();
      kurva(tg, t, 0.16, 0.045);
      tick.connect(hp); hp.connect(g); g.connect(master);
      ton.connect(tg); tg.connect(master);
      tick.start(t); tick.stop(t + 0.05);
      ton.start(t); ton.stop(t + 0.05);
      tick.onended = () => {
        for (const n of [tick, hp, g, ton, tg]) {
          try { n.disconnect(); } catch { /* redan borta */ }
        }
      };
      return true;
    } catch {
      return false;
    }
  }

  function klick(kraft) {
    if (!pa) return false;
    try {
      if (!seTill() || !brus || !master) return false;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      klickAntal++;
      const t = ctx.currentTime;
      const k = klamp(Number(kraft) || 0.4, 0.15, 1);
      const src = ctx.createBufferSource();
      src.buffer = brus;
      src.playbackRate.value = 1.8;
      const hp = ctx.createBiquadFilter();
      hp.type = 'bandpass';
      hp.frequency.value = 2100;
      hp.Q.value = 2.4;
      const g = ctx.createGain();
      kurva(g, t, 0.07 + k * 0.1, 0.018 + k * 0.012);
      src.connect(hp); hp.connect(g); g.connect(master);
      src.start(t); src.stop(t + 0.04);
      src.onended = () => {
        for (const n of [src, hp, g]) { try { n.disconnect(); } catch { /* redan borta */ } }
      };
      return true;
    } catch {
      return false;
    }
  }

  return {
    oppna, satt, skott, traff, klick,
    get pa() { return pa; },
    get volym() { return volym; },
    get skottAntal() { return skottAntal; },
    get traffAntal() { return traffAntal; },
    get klickAntal() { return klickAntal; },
    get kontext() { return ctx; },
    get redo() { return !!ctx && ctx.state === 'running'; }
  };
}
