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

  const KAR = {
    vanligt: {hp: 900, kropp: 1800, kroppSlut: 420, hammare: 310, snart: 2400, bas: 190, basSlut: 42, mekanik: [[0.3, 2100, 0.022, 0.2], [0.46, 1280, 0.034, 0.16]]},
    kar98k: {hp: 720, kropp: 1280, kroppSlut: 280, hammare: 240, snart: 1900, bas: 140, basSlut: 36, mekanik: [[0.42, 1600, 0.028, 0.18], [0.62, 980, 0.04, 0.15]]},
    springfield: {hp: 1100, kropp: 2300, kroppSlut: 560, hammare: 390, snart: 2800, bas: 220, basSlut: 58, mekanik: [[0.22, 2400, 0.018, 0.16], [0.36, 1500, 0.026, 0.13]]},
    enfield: {hp: 640, kropp: 980, kroppSlut: 240, hammare: 200, snart: 1600, bas: 110, basSlut: 32, mekanik: [[0.36, 1400, 0.03, 0.2], [0.56, 860, 0.046, 0.16]]}
  };
  let karaktar = 'vanligt';

  function sattKaraktar(id) {
    if (KAR[id]) karaktar = id;
  }

  function skott() {
    if (!pa) return false;
    try {
      if (!seTill() || !brus || !master) return false;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      skottAntal++;
      const k = KAR[karaktar] || KAR.vanligt;
      const t = ctx.currentTime;
      const bus = ctx.createGain();
      bus.gain.value = 0.9;
      bus.connect(master);

      const knall = ctx.createBufferSource();
      knall.buffer = brus;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = k.hp;
      const hg = ctx.createGain();
      kurva(hg, t, 1.35, 0.09);
      knall.connect(hp); hp.connect(hg); hg.connect(bus);
      knall.start(t); knall.stop(t + 0.11);

      const kropp = ctx.createBufferSource();
      kropp.buffer = brus;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(k.kropp, t);
      bp.frequency.exponentialRampToValueAtTime(k.kroppSlut, t + 0.12);
      bp.Q.value = 0.7;
      const bg = ctx.createGain();
      kurva(bg, t, 1.05, karaktar === 'enfield' ? 0.3 : 0.24);
      kropp.connect(bp); bp.connect(bg); bg.connect(bus);
      kropp.start(t); kropp.stop(t + 0.32);

      const hammare = ctx.createOscillator();
      hammare.type = 'square';
      hammare.frequency.setValueAtTime(k.hammare, t);
      hammare.frequency.exponentialRampToValueAtTime(Math.max(70, k.hammare * 0.29), t + 0.012);
      const hg2 = ctx.createGain();
      kurva(hg2, t, 0.22, 0.018);
      hammare.connect(hg2); hg2.connect(bus);
      hammare.start(t); hammare.stop(t + 0.02);

      const snart = ctx.createOscillator();
      snart.type = 'triangle';
      snart.frequency.setValueAtTime(k.snart, t);
      snart.frequency.exponentialRampToValueAtTime(Math.max(280, k.snart * 0.22), t + 0.05);
      const sg = ctx.createGain();
      kurva(sg, t, 0.22, 0.055);
      snart.connect(sg); sg.connect(bus);
      snart.start(t); snart.stop(t + 0.06);

      const bas = ctx.createOscillator();
      bas.type = 'sine';
      bas.frequency.setValueAtTime(k.bas, t);
      bas.frequency.exponentialRampToValueAtTime(k.basSlut, t + 0.16);
      const dg = ctx.createGain();
      kurva(dg, t, karaktar === 'enfield' ? 0.86 : 0.72, karaktar === 'kar98k' ? 0.24 : 0.2);
      bas.connect(dg); dg.connect(bus);
      bas.start(t); bas.stop(t + 0.26);

      const skottNoder = [knall, hp, hg, kropp, bp, bg, hammare, hg2, snart, sg, bas, dg, bus];
      const mekanik = [];
      for (const [forsening, frek, langd, topp] of k.mekanik) {
        const tid = t + forsening;
        const klickBrus = ctx.createBufferSource();
        klickBrus.buffer = brus;
        klickBrus.playbackRate.value = 1.7;
        const klickTon = ctx.createOscillator();
        klickTon.type = 'triangle';
        klickTon.frequency.setValueAtTime(frek, tid);
        klickTon.frequency.exponentialRampToValueAtTime(Math.max(180, frek * 0.45), tid + langd);
        const band = ctx.createBiquadFilter();
        band.type = 'bandpass';
        band.frequency.value = frek;
        band.Q.value = 3.2;
        const kg = ctx.createGain();
        kurva(kg, tid, topp, langd);
        klickBrus.connect(band);
        klickTon.connect(band);
        band.connect(kg);
        kg.connect(master);
        klickBrus.start(tid); klickBrus.stop(tid + langd + 0.02);
        klickTon.start(tid); klickTon.stop(tid + langd + 0.02);
        mekanik.push(klickBrus, klickTon, band, kg);
      }
      const kopplaLoss = lista => {
        for (const n of lista) {
          try { n.disconnect(); } catch { /* redan borta */ }
        }
      };
      knall.onended = () => kopplaLoss(skottNoder);
      mekanik[5].onended = () => kopplaLoss(mekanik);
      return true;
    } catch {
      return false;
    }
  }

  function traff(avstand) {
    if (!pa) return false;
    try {
      if (!seTill() || !brus || !master) return false;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      traffAntal++;
      const t = ctx.currentTime + 0.02;
      const d = Number.isFinite(+avstand) ? Math.max(1, +avstand) : 12;
      const ekoTid = Math.min(0.42, Math.max(0.045, d / 340));
      const ekoVol = Math.max(0.08, 0.62 * Math.exp(-d / 38));
      const tick = ctx.createBufferSource();
      tick.buffer = brus;
      tick.playbackRate.value = 1.15;
      const hp = ctx.createBiquadFilter();
      hp.type = 'bandpass';
      hp.frequency.value = 280;
      hp.Q.value = 0.7;
      const g = ctx.createGain();
      kurva(g, t, 0.85, 0.09);
      const ton = ctx.createOscillator();
      ton.type = 'sine';
      ton.frequency.setValueAtTime(210, t);
      ton.frequency.exponentialRampToValueAtTime(62, t + 0.08);
      const tg = ctx.createGain();
      kurva(tg, t, 0.55, 0.1);
      const bekraft = ctx.createOscillator();
      bekraft.type = 'triangle';
      const bt = t + 0.055;
      bekraft.frequency.setValueAtTime(2400, bt);
      bekraft.frequency.exponentialRampToValueAtTime(1600, bt + 0.04);
      const bg = ctx.createGain();
      kurva(bg, bt, 0.14, 0.045);
      const eko = ctx.createDelay(0.5);
      eko.delayTime.value = ekoTid;
      const ekoFilter = ctx.createBiquadFilter();
      ekoFilter.type = 'lowpass';
      ekoFilter.frequency.value = 900;
      const eg = ctx.createGain();
      eg.gain.value = ekoVol;
      tick.connect(hp); hp.connect(g); g.connect(master);
      ton.connect(tg); tg.connect(master);
      g.connect(eko); tg.connect(eko);
      eko.connect(ekoFilter); ekoFilter.connect(eg); eg.connect(master);
      bekraft.connect(bg); bg.connect(master);
      tick.start(t); tick.stop(t + 0.12);
      ton.start(t); ton.stop(t + 0.12);
      bekraft.start(bt); bekraft.stop(bt + 0.06);
      const slut = t + ekoTid + 0.2;
      tick.onended = () => {
        const rensa = () => {
          for (const n of [tick, hp, g, ton, tg, bekraft, bg, eko, ekoFilter, eg]) {
            try { n.disconnect(); } catch { /* redan borta */ }
          }
        };
        const vanta = Math.max(0, (slut - ctx.currentTime) * 1000);
        if (vanta < 20) rensa();
        else setTimeout(rensa, vanta);
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
    oppna, satt, sattKaraktar, skott, traff, klick,
    get karaktar() { return karaktar; },
    get pa() { return pa; },
    get volym() { return volym; },
    get skottAntal() { return skottAntal; },
    get traffAntal() { return traffAntal; },
    get klickAntal() { return klickAntal; },
    get kontext() { return ctx; },
    get redo() { return !!ctx && ctx.state === 'running'; }
  };
}
