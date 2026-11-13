// Mekaniska växellåds- och gashack utan ljudfiler.
// AudioContext skapas först vid en beröring. Högst 8 röster, och varje nod kopplas loss.

import {LJUD} from './konfig.js?v=3';

export {LJUD};

const TAK = 10 ** (LJUD.takDbtp / 20);

export function begransaKurva() {
  const n = 2048;
  const kurva = new Float32Array(n);
  const tak = Math.min(TAK, 10 ** (LJUD.takKurvaDb / 20));
  const form = Math.tanh(2.4);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    const y = Math.tanh(x * 2.4) / form * tak;
    kurva[i] = y > tak ? tak : y < -tak ? -tak : y;
  }
  kurva[0] = -tak;
  kurva[n - 1] = tak;
  return kurva;
}

function kurva(gain, t, topp, dur) {
  const g = gain.gain;
  const toppSaker = Math.max(0.0002, topp);
  const attack = Math.min(0.006, Math.max(0.001, dur * 0.18));
  g.setValueAtTime(0.0001, t);
  g.exponentialRampToValueAtTime(toppSaker, t + attack);
  g.exponentialRampToValueAtTime(0.0001, t + Math.max(attack + 0.004, dur));
}

export function haptikMonster(pulser) {
  const lista = [];
  for (const ms of pulser || []) {
    const n = Math.round(+ms);
    if (n >= 8 && n <= 40) lista.push(n);
    if (lista.length >= LJUD.maxRoster) break;
  }
  if (!lista.length) return null;
  const monster = [];
  for (let i = 0; i < lista.length; i++) {
    monster.push(lista[i]);
    if (i < lista.length - 1) monster.push(8);
  }
  return monster;
}

export function kansla(pulser) {
  try {
    const monster = haptikMonster(pulser);
    if (!monster || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false;
    return navigator.vibrate(monster) !== false;
  } catch {
    return false;
  }
}

export function skapaMekanikLjud() {
  let ctx = null;
  let master = null;
  let form = null;
  let brus = null;
  let pa = true;
  let upplast = false;
  let tystLovande = null;
  let skapade = 0;
  let slappta = 0;
  let vaxelAntal = 0;
  let hackAntal = 0;
  let stoppAntal = 0;
  let klickAntal = 0;
  let laddAntal = 0;
  const aktiva = [];
  const handelser = [];

  function brusBuffer() {
    if (brus) return brus;
    const n = Math.floor(ctx.sampleRate * 0.45);
    brus = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = brus.getChannelData(0);
    let s = 0x6d2b79f5;
    for (let i = 0; i < n; i++) {
      s = Math.imul(s ^ (s >>> 15), s | 1);
      s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
      d[i] = ((((s ^ (s >>> 14)) >>> 0) / 4294967296) * 2 - 1);
    }
    return brus;
  }

  function seTill() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx || ctx.state === 'closed') {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = pa ? LJUD.master : 0;
      const komp = ctx.createDynamicsCompressor();
      komp.threshold.value = -10;
      komp.knee.value = 4;
      komp.ratio.value = 12;
      komp.attack.value = 0.002;
      komp.release.value = 0.06;
      form = ctx.createWaveShaper();
      form.curve = begransaKurva();
      form.oversample = '4x';
      master.connect(komp);
      komp.connect(form);
      form.connect(ctx.destination);
      brus = null;
    }
    return ctx;
  }

  function lasUppMobil() {
    if (tystLovande || !ctx) return;
    tystLovande = true;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; }
    catch { /* äldre webbläsare */ }
    try {
      const buf = ctx.createBuffer(1, 8, ctx.sampleRate);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g = ctx.createGain();
      g.gain.value = 0.0001;
      let borta = false;
      const rensa = () => {
        if (borta) return;
        borta = true;
        try { src.disconnect(); } catch { /* redan borta */ }
        try { g.disconnect(); } catch { /* redan borta */ }
      };
      src.connect(g);
      g.connect(ctx.destination);
      src.onended = rensa;
      setTimeout(rensa, 80);
      src.start();
    } catch { /* kontexten tog inte emot tystnaden */ }
  }

  function oppna() {
    upplast = true;
    try {
      if (!seTill()) return Promise.resolve(false);
      lasUppMobil();
      if (ctx.state === 'suspended') return ctx.resume().then(() => true).catch(() => false);
      return Promise.resolve(true);
    } catch {
      return Promise.resolve(false);
    }
  }

  function satt(nasta) {
    pa = !!nasta;
    if (master) master.gain.value = pa ? LJUD.master : 0;
  }

  function notera(typ, n) {
    if (typ === 'vaxel') vaxelAntal += n;
    else if (typ === 'hack') hackAntal += n;
    else if (typ === 'stopp') stoppAntal += n;
    else if (typ === 'klick') klickAntal += n;
    else if (typ === 'ladd') laddAntal += n;
    else if (typ === 'granat') {
      klickAntal += 1;
      laddAntal += 1;
      const tid = typeof performance !== 'undefined' ? performance.now() : 0;
      handelser.push({typ: 'klick', n: 1, t: tid}, {typ: 'ladd', n: 1, t: tid});
      if (handelser.length > 32) handelser.splice(0, handelser.length - 32);
      return;
    }
    handelser.push({typ, n, t: typeof performance !== 'undefined' ? performance.now() : 0});
    if (handelser.length > 32) handelser.shift();
  }

  function spela(typ, antal, bygg) {
    if (!upplast || !pa) return false;
    let post;
    try {
      if (!seTill() || !master) return false;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      while (aktiva.length >= LJUD.maxRoster) aktiva[0].slapp();
      const noder = [];
      let slappt = false;
      let timer = 0;
      post = {
        slapp() {
          if (slappt) return;
          slappt = true;
          if (timer) clearTimeout(timer);
          timer = 0;
          for (const n of noder) {
            try { if (typeof n.stop === 'function') n.stop(); } catch { /* redan stoppad */ }
            try { n.disconnect(); } catch { /* redan borta */ }
            slappta += 1;
          }
          noder.length = 0;
          const ix = aktiva.indexOf(post);
          if (ix >= 0) aktiva.splice(ix, 1);
        }
      };
      const api = {
        ctx,
        dest: master,
        nod(n) { noder.push(n); skapade += 1; return n; }
      };
      const sek = bygg(api);
      timer = setTimeout(() => post.slapp(), Math.max(0.05, sek) * 1000 + 60);
      aktiva.push(post);
      notera(typ, antal);
      return true;
    } catch {
      try { post?.slapp(); } catch { /* redan städad */ }
      return false;
    }
  }

  function ton(api, t, typ, f0, f1, dur, topp) {
    const o = api.nod(api.ctx.createOscillator());
    o.type = typ;
    o.frequency.setValueAtTime(Math.max(28, f0), t);
    if (f1 > 0) o.frequency.exponentialRampToValueAtTime(Math.max(28, f1), t + dur);
    const g = api.nod(api.ctx.createGain());
    kurva(g, t, topp, dur);
    o.connect(g);
    g.connect(api.dest);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  function brusBit(api, t, dur, frek, q, topp, rate, frek2) {
    const src = api.nod(api.ctx.createBufferSource());
    src.buffer = brusBuffer();
    src.playbackRate.value = rate || 1;
    const f = api.nod(api.ctx.createBiquadFilter());
    f.type = 'bandpass';
    f.frequency.setValueAtTime(Math.max(40, frek), t);
    if (frek2 > 0) f.frequency.exponentialRampToValueAtTime(Math.max(40, frek2), t + dur);
    f.Q.value = q;
    const g = api.nod(api.ctx.createGain());
    kurva(g, t, topp, dur);
    src.connect(f);
    f.connect(g);
    g.connect(api.dest);
    src.start(t);
    src.stop(t + dur + 0.03);
  }

  function klang(api, t, f0, f1, dur, topp) {
    const o = api.nod(api.ctx.createOscillator());
    o.type = 'square';
    o.frequency.setValueAtTime(Math.max(40, f0), t);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    const f = api.nod(api.ctx.createBiquadFilter());
    f.type = 'lowpass';
    f.frequency.value = 380;
    f.Q.value = 0.6;
    const g = api.nod(api.ctx.createGain());
    kurva(g, t, topp, dur);
    o.connect(f);
    f.connect(g);
    g.connect(api.dest);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  function vaxla(antal) {
    const n = Math.max(1, Math.min(6, antal | 0));
    return spela('vaxel', n, api => {
      const k = LJUD.vaxel;
      for (let i = 0; i < n; i++) {
        const t0 = api.ctx.currentTime + 0.008 + i * 0.052;
        brusBit(api, t0, 0.042, 1680, 1.05, 0.16 * k, 1.3);
        ton(api, t0, 'triangle', 2050, 620, 0.026, 0.11 * k);
        const ti = t0 + 0.034;
        ton(api, ti, 'sine', 90, 34, 0.18, 0.52 * k);
        ton(api, ti, 'triangle', 230, 72, 0.09, 0.22 * k);
        klang(api, ti, 146, 52, 0.07, 0.18 * k);
        brusBit(api, ti + 0.01, 0.055, 2300, 2.2, 0.12 * k, 1.55);
        ton(api, ti + 0.008, 'sine', 640, 210, 0.04, 0.07 * k);
      }
      return 0.008 + n * 0.052 + 0.22;
    });
  }

  function hack(indexLista) {
    const lista = (Array.isArray(indexLista) && indexLista.length ? indexLista : [0]).slice(0, 14);
    return spela('hack', lista.length, api => {
      const k = LJUD.hack;
      lista.forEach((index, i) => {
        const form = 0.94 + (Math.abs(index | 0) % 5) * 0.03;
        const t = api.ctx.currentTime + 0.004 + i * 0.02;
        ton(api, t, 'triangle', 2680 * form, 1480 * form, 0.012, 0.15 * k);
        ton(api, t + 0.01, 'triangle', 690 * form, 205, 0.028, 0.26 * k);
        brusBit(api, t, 0.013, 3300, 3.1, 0.08 * k, 1.75);
      });
      return 0.02 * lista.length + 0.05;
    });
  }

  function valjGranat() {
    const ok = spela('granat', 1, api => {
      const t = api.ctx.currentTime + 0.004;
      const ck = LJUD.klick;
      const ld = LJUD.ladd;
      ton(api, t, 'triangle', 2680, 920, 0.018, 0.28 * ck);
      brusBit(api, t, 0.014, 3400, 3.4, 0.12 * ck, 1.7);
      const ram = t + 0.07;
      brusBit(api, ram, 0.28, 1500, 0.65, 0.22 * ld, 0.8, 380);
      ton(api, ram, 'sine', 86, 46, 0.26, 0.14 * ld);
      const lucka = t + 0.38;
      ton(api, lucka, 'sine', 76, 30, 0.18, 0.58 * ld);
      ton(api, lucka, 'triangle', 220, 62, 0.08, 0.24 * ld);
      klang(api, lucka, 128, 44, 0.06, 0.18 * ld);
      ton(api, lucka + 0.012, 'sine', 860, 230, 0.04, 0.08 * ld);
      return 0.62;
    });
    return ok;
  }

  function stopp() {
    return spela('stopp', 1, api => {
      const k = LJUD.stopp;
      const t = api.ctx.currentTime + 0.004;
      ton(api, t, 'sine', 72, 30, 0.16, 0.6 * k);
      ton(api, t, 'triangle', 186, 54, 0.05, 0.24 * k);
      klang(api, t, 108, 46, 0.045, 0.16 * k);
      brusBit(api, t, 0.028, 480, 0.7, 0.09 * k, 0.65);
      return 0.2;
    });
  }

  function provTopp() {
    const AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!AC) return Promise.resolve(null);
    const offline = new AC(1, 4096, 44100);
    const buf = offline.createBuffer(1, 4096, 44100);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = i % 2 ? 1 : -1;
    const src = offline.createBufferSource();
    src.buffer = buf;
    const sh = offline.createWaveShaper();
    sh.curve = begransaKurva();
    sh.oversample = '4x';
    const g = offline.createGain();
    g.gain.value = 4;
    src.connect(g);
    g.connect(sh);
    sh.connect(offline.destination);
    src.start(0);
    return offline.startRendering().then(ut => {
      const kanal = ut.getChannelData(0);
      let m = 0;
      for (let i = 0; i < kanal.length; i++) m = Math.max(m, Math.abs(kanal[i]));
      try { src.disconnect(); } catch { /* redan borta */ }
      try { g.disconnect(); } catch { /* redan borta */ }
      try { sh.disconnect(); } catch { /* redan borta */ }
      return 20 * Math.log10(Math.max(m, 1e-9));
    });
  }

  return {
    oppna, satt, vaxla, hack, stopp, valjGranat, provTopp, kansla,
    get pa() { return pa; },
    get upplast() { return upplast; },
    get roster() { return aktiva.length; },
    get skapade() { return skapade; },
    get slappta() { return slappta; },
    get vaxelAntal() { return vaxelAntal; },
    get hackAntal() { return hackAntal; },
    get stoppAntal() { return stoppAntal; },
    get klickAntal() { return klickAntal; },
    get laddAntal() { return laddAntal; },
    get handelser() { return handelser.slice(); }
  };
}

export function sjalvtest() {
  const fel = [];
  const krav = (namn, ok) => { if (!ok) fel.push(namn); };
  const kurva = begransaKurva();
  let topp = 0;
  for (let i = 0; i < kurva.length; i++) topp = Math.max(topp, Math.abs(kurva[i]));
  krav('begränsaren stannar på eller under −1 dBTP', topp <= TAK + 1e-5);
  krav('högst åtta röster', LJUD.maxRoster === 8);
  krav('ljudnivåerna går att sänka', LJUD.master > 0 && LJUD.master <= 1 && LJUD.vaxel > 0 && LJUD.hack > 0 && LJUD.stopp > LJUD.hack && LJUD.klick > 0 && LJUD.ladd > 0);
  const motor = skapaMekanikLjud();
  let kast = false;
  try {
    const tyst = motor.hack([0]) === false && motor.vaxla(1) === false && motor.stopp() === false && motor.valjGranat() === false;
    krav('tyst innan första beröring', tyst && motor.roster === 0 && motor.skapade === 0 && motor.hackAntal === 0 && motor.klickAntal === 0 && motor.laddAntal === 0);
  } catch {
    kast = true;
  }
  krav('tyst motor kastar inte', kast === false);
  const monster = haptikMonster([12, 30, 4, 80]);
  krav('haptikmönstret är korta pulser', !!monster && monster[0] === 12 && monster[1] === 8 && monster[2] === 30 && monster.length === 3);
  return fel;
}
