// Mekaniska växellåds- och gashack, plus avkodade kanon-, motor- och bandklipp.
// AudioContext skapas först vid en beröring. Högst 8 engångsröster, och varje nod kopplas loss.
// Loopar (motor, band, torn, eldrör) är en egen liten grupp som städas när de tystnar.

import {LJUD} from './konfig.js?v=4';

export {LJUD};

const TAK = 10 ** (LJUD.takDbtp / 20);
const BAS = new URL('./ljud/', import.meta.url);

export const KLIPP = [
  'uppladdad_skott_serie.mp3',
  'uppladdad_explosion_stor.mp3',
  'uppladdad_explosion_b.mp3',
  'uppladdad_kanon_eko.mp3',
  'uppladdad_kanon_eko_b.mp3',
  'uppladdad_traff_kort.mp3',
  'uppladdad_mekanik_kort.mp3',
  'uppladdad_torn_surr.mp3',
  'uppladdad_eldror_surr.mp3',
  'uppladdad_band_surr.mp3',
  'uppladdad_motor_loop.mp3',
  'ww2_kanon_75.mp3',
  'ww2_kanon_88.mp3',
  'ww2_kanon_fjarran.mp3',
  'ww2_explosion_mark.mp3',
  'ww2_explosion_traff.mp3',
  'ww2_motor_tomgang.mp3',
  'ww2_motor_marsch.mp3',
  'ww2_band_hog.mp3',
  'ww2_band_gnissel.mp3'
];

const KLANG = {
  'uppladdad_torn_surr.mp3': {type: 'lowpass', q: 0.8, hz: 700},
  'uppladdad_eldror_surr.mp3': {type: 'bandpass', q: 1.8, hz: 2200},
  'uppladdad_motor_loop.mp3': {type: 'lowpass', q: 0.65, hz: 900},
  'ww2_motor_tomgang.mp3': {type: 'lowpass', q: 0.5, hz: 800},
  'ww2_motor_marsch.mp3': {type: 'lowpass', q: 0.6, hz: 1100},
  'uppladdad_band_surr.mp3': {type: 'lowpass', q: 0.75, hz: 1400},
  'ww2_band_hog.mp3': {type: 'bandpass', q: 0.7, hz: 1800},
  'ww2_band_gnissel.mp3': {type: 'bandpass', q: 2.1, hz: 2200}
};

export function klangFor(fil) {
  return KLANG[fil] || {type: 'lowpass', q: 0.7, hz: 1400};
}

// 30 m full styrka, 250 m märkbart svagare, 700 m dovt dån.
export function avstandDamp(meter) {
  const m = Number(meter);
  const d = Number.isFinite(m) ? Math.max(0, m) : 0;
  if (d <= 30) return {gain: 1, hz: 12000};
  const t = Math.min(1.6, Math.log(d / 30) / Math.log(700 / 30));
  const gain = Math.max(0.05, Math.pow(0.2, t));
  const hz = Math.max(240, 12000 * Math.pow(0.03, t));
  return {gain, hz};
}

// Tomgång 500, topp 2400. Neutral rusar fritt. Låg växel ger högre varv vid samma gas.
export function motorVarv(gas, kvot, fartMs) {
  const g = Math.min(1, Math.max(0, +gas || 0));
  const k = Math.min(1, Math.max(0, Math.abs(+kvot || 0)));
  const v = Math.min(20, Math.max(0, Math.abs(+fartMs || 0)));
  const TOM = 500;
  const TOPP = 2400;
  if (k < 0.04) return TOM + g * 1000;
  const last = Math.min(1, v / (12 * k));
  const bas = last * (0.25 + 0.55 * g) + g * (0.42 + 0.38 * (1 - k));
  return Math.min(TOPP, Math.max(TOM, TOM + (TOPP - TOM) * Math.min(1, bas)));
}

export function motorMix(rpm, gas, fartMs, bandMs) {
  const g = Math.min(1, Math.max(0, +gas || 0));
  const n = Math.min(1, Math.max(0, ((+rpm || 500) - 500) / 1900));
  const v = Math.min(1, Math.max(0, Math.abs(+bandMs || fartMs || 0) / 8));
  return {
    tomgang: 0.46 * (1 - n * 0.9),
    motor: 0.18 + n * 0.28,
    marsch: Math.max(0, n - 0.3) * 0.55,
    band: v * 0.42,
    bandHog: Math.max(0, v - 0.45) * 0.4,
    rate: 0.8 + n * 0.58,
    hz: 380 + n * 2400 + g * 400
  };
}

export function tornLjud(u) {
  return Math.abs(+u || 0) > 0.025;
}

export function eldrorLjud(u, eld, min, max) {
  const x = +u || 0;
  if (!(Math.abs(x) > 0.025)) return false;
  const e = +eld || 0;
  if (e <= (+min || 0) + 0.004 && x < 0) return false;
  if (e >= (+max || 0) - 0.004 && x > 0) return false;
  return true;
}

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

const hamtat = new Map();

function forhamta() {
  for (const fil of KLIPP) {
    if (hamtat.has(fil)) continue;
    hamtat.set(fil, fetch(new URL(fil, BAS)).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null));
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
  let laddLovande = null;
  let skapade = 0;
  let slappta = 0;
  let vaxelAntal = 0;
  let hackAntal = 0;
  let stoppAntal = 0;
  let klickAntal = 0;
  let laddAntal = 0;
  let nedAntal = 0;
  let rpm = 500;
  const aktiva = [];
  const handelser = [];
  const buffertar = new Map();
  const loopar = new Map();

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

  async function laddaAlla() {
    if (!ctx) return 0;
    if (buffertar.size === KLIPP.length) return buffertar.size;
    if (laddLovande) return laddLovande;
    if (!hamtat.size) forhamta();
    laddLovande = (async () => {
      await Promise.all(KLIPP.map(async fil => {
        if (buffertar.has(fil)) return;
        try {
          const raw = await hamtat.get(fil);
          if (!raw) return;
          const buf = await ctx.decodeAudioData(raw.slice(0));
          if (buf) buffertar.set(fil, buf);
        } catch { /* ogiltig eller saknad */ }
      }));
      laddLovande = null;
      return buffertar.size;
    })();
    return laddLovande;
  }

  function oppna() {
    upplast = true;
    try {
      if (!seTill()) return Promise.resolve(false);
      lasUppMobil();
      const resume = ctx.state === 'suspended' ? ctx.resume().catch(() => {}) : Promise.resolve();
      return resume.then(() => laddaAlla()).then(() => true).catch(() => true);
    } catch {
      return Promise.resolve(false);
    }
  }

  function tystAllaLoopar() {
    for (const fil of [...loopar.keys()]) stopLoop(fil);
  }

  function satt(nasta) {
    pa = !!nasta;
    if (master) master.gain.value = pa ? LJUD.master : 0;
    if (!pa) tystAllaLoopar();
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

  function kopplaBuffer(api, fil, tid, volym, rate, hz) {
    const buf = buffertar.get(fil);
    if (!buf || !(volym > 0.001)) return 0;
    const src = api.nod(api.ctx.createBufferSource());
    src.buffer = buf;
    src.playbackRate.value = rate || 1;
    let sist = src;
    if (hz > 0) {
      const f = api.nod(api.ctx.createBiquadFilter());
      f.type = 'lowpass';
      f.frequency.value = Math.max(80, hz);
      f.Q.value = 0.7;
      src.connect(f);
      sist = f;
    }
    const g = api.nod(api.ctx.createGain());
    g.gain.value = Math.min(1, volym);
    sist.connect(g);
    g.connect(api.dest);
    const start = Math.max(tid, api.ctx.currentTime);
    src.start(start);
    const dur = buf.duration / (rate || 1);
    src.stop(start + dur + 0.05);
    return dur;
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
      kopplaBuffer(api, 'uppladdad_mekanik_kort.mp3', lucka, 0.7, 1, 0);
      return 1.15;
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

  function kanon() {
    return spela('kanon', 1, api => {
      const t = api.ctx.currentTime + 0.008;
      kopplaBuffer(api, 'ww2_kanon_75.mp3', t, 0.92, 1, 0);
      kopplaBuffer(api, 'uppladdad_kanon_eko.mp3', t + 0.03, 0.5, 0.98, 4200);
      kopplaBuffer(api, 'uppladdad_mekanik_kort.mp3', t + 0.5, 0.78, 1, 0);
      return 3.7;
    });
  }

  function nedslag(avstand) {
    const damp = avstandDamp(avstand);
    const stor = (nedAntal++ % 2) ? 'uppladdad_explosion_b.mp3' : 'uppladdad_explosion_stor.mp3';
    return spela('nedslag', 1, api => {
      const t = api.ctx.currentTime + 0.005;
      kopplaBuffer(api, 'ww2_explosion_mark.mp3', t, 0.9 * damp.gain, 1, damp.hz);
      kopplaBuffer(api, stor, t + 0.04, 0.72 * damp.gain, 1, Math.max(220, damp.hz * 0.85));
      return 3.8;
    });
  }

  function traff(avstand) {
    const damp = avstandDamp(avstand);
    return spela('traff', 1, api => {
      const t = api.ctx.currentTime + 0.004;
      kopplaBuffer(api, 'uppladdad_traff_kort.mp3', t, 0.95 * damp.gain, 1, damp.hz);
      kopplaBuffer(api, 'ww2_explosion_traff.mp3', t + 0.02, 0.88 * damp.gain, 1, damp.hz);
      return 3.6;
    });
  }

  function fiendeSkott(avstand) {
    const d = Math.max(0, +avstand || 0);
    const damp = avstandDamp(d);
    const fil = d > 380 ? 'ww2_kanon_fjarran.mp3' : 'ww2_kanon_88.mp3';
    return spela('fiende', 1, api => {
      const t = api.ctx.currentTime + 0.004;
      kopplaBuffer(api, fil, t, 0.95 * damp.gain, 1, damp.hz);
      kopplaBuffer(api, 'uppladdad_kanon_eko_b.mp3', t + 0.05, 0.48 * damp.gain, 1, Math.max(200, damp.hz * 0.7));
      if (d > 300) kopplaBuffer(api, 'uppladdad_skott_serie.mp3', t + 0.1, 0.32 * damp.gain, 1, Math.max(180, damp.hz * 0.5));
      return 3.8;
    });
  }

  function forstord(avstand) {
    const damp = avstandDamp(avstand);
    return spela('forstord', 1, api => {
      const t = api.ctx.currentTime + 0.01;
      kopplaBuffer(api, 'uppladdad_skott_serie.mp3', t, 0.78 * damp.gain, 1, damp.hz);
      kopplaBuffer(api, 'uppladdad_explosion_stor.mp3', t + 0.08, 0.8 * damp.gain, 1, damp.hz);
      return 3.4;
    });
  }

  function narma(param, mal) {
    const nu = param.value;
    param.value = nu + (mal - nu) * 0.22;
  }

  function startLoop(fil, buf) {
    const spec = klangFor(fil);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = spec.type;
    filter.frequency.value = spec.hz;
    filter.Q.value = spec.q;
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    try { src.start(); } catch { /* redan startad */ }
    skapade += 3;
    const L = {src, filter, gain, timer: 0};
    loopar.set(fil, L);
    return L;
  }

  function stopLoop(fil) {
    const L = loopar.get(fil);
    if (!L) return;
    if (L.timer) clearTimeout(L.timer);
    loopar.delete(fil);
    try { L.src.stop(); } catch { /* redan stoppad */ }
    try { L.src.disconnect(); } catch { /* redan borta */ }
    try { L.filter.disconnect(); } catch { /* redan borta */ }
    try { L.gain.disconnect(); } catch { /* redan borta */ }
    slappta += 3;
  }

  function hall(fil, volym, rate, hz) {
    if (!ctx || !pa || !upplast) return;
    const buf = buffertar.get(fil);
    if (!buf) return;
    let L = loopar.get(fil);
    if (!L) L = startLoop(fil, buf);
    if (L.timer) { clearTimeout(L.timer); L.timer = 0; }
    narma(L.gain.gain, Math.max(0.0008, Math.min(1, volym)));
    narma(L.src.playbackRate, Math.max(0.4, Math.min(2, rate || 1)));
    narma(L.filter.frequency, Math.max(70, Math.min(16000, hz || 1000)));
  }

  function slapp(fil) {
    const L = loopar.get(fil);
    if (!L || L.timer) return;
    try { narma(L.gain.gain, 0.0001); } catch { /* noden hann stängas */ }
    L.timer = setTimeout(() => stopLoop(fil), 240);
  }

  function drivLoopar(s, rpmNu) {
    const band = Math.max(Math.abs(+s.band || 0), Math.abs(+s.fart || 0));
    const mix = motorMix(rpmNu, s.gas, s.fart, band);
    if (mix.tomgang > 0.03) hall('ww2_motor_tomgang.mp3', mix.tomgang, 0.9 + (mix.rate - 0.8) * 0.4, 820 + mix.hz * 0.15);
    else slapp('ww2_motor_tomgang.mp3');
    hall('uppladdad_motor_loop.mp3', mix.motor, mix.rate, mix.hz);
    if (mix.marsch > 0.03) hall('ww2_motor_marsch.mp3', mix.marsch, 0.86 + (mix.rate - 0.8) * 0.85, 640 + mix.hz * 0.45);
    else slapp('ww2_motor_marsch.mp3');
    if (mix.band > 0.03) hall('uppladdad_band_surr.mp3', mix.band, 0.84 + Math.min(1, band / 8) * 0.5, 1200 + Math.min(1, band / 8) * 900);
    else slapp('uppladdad_band_surr.mp3');
    if (mix.bandHog > 0.03) hall('ww2_band_hog.mp3', mix.bandHog, 0.9 + Math.min(1, band / 8) * 0.45, 1600 + Math.min(1, band / 8) * 800);
    else slapp('ww2_band_hog.mp3');
    const gir = Math.min(1, Math.abs(+s.gir || 0));
    const gniss = gir * Math.min(1, band / 3);
    if (gniss > 0.08) hall('ww2_band_gnissel.mp3', 0.12 + gniss * 0.4, 0.86 + gniss * 0.5, 1500 + gniss * 1600);
    else slapp('ww2_band_gnissel.mp3');
    const tu = Math.min(1, Math.abs(+s.tornU || 0));
    if (tornLjud(s.tornU)) hall('uppladdad_torn_surr.mp3', 0.26 + tu * 0.5, 0.76 + tu * 0.46, 320 + tu * 680);
    else slapp('uppladdad_torn_surr.mp3');
    const eu = Math.min(1, Math.abs(+s.eldU || 0));
    if (eldrorLjud(s.eldU, s.eld, s.eldMin, s.eldMax)) hall('uppladdad_eldror_surr.mp3', 0.32 + eu * 0.52, 1.04 + eu * 0.58, 1680 + eu * 1700);
    else slapp('uppladdad_eldror_surr.mp3');
  }

  function stega(s) {
    const dt = Math.max(0, Math.min(0.05, +s?.dt || 0));
    const mal = motorVarv(s?.gas, s?.kvot, s?.fart);
    if (dt > 0) rpm += (mal - rpm) * (1 - Math.exp(-dt / 0.2));
    if (upplast && pa && ctx) drivLoopar(s || {}, rpm);
    return {rpm};
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
    oppna, satt, vaxla, hack, stopp, valjGranat, provTopp, kansla, stega,
    kanon, nedslag, traff, fiendeSkott, forstord, ladda: laddaAlla,
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
    get handelser() { return handelser.slice(); },
    get klipp() { return buffertar.size; },
    get saknas() { return KLIPP.filter(fil => !buffertar.has(fil)); }
  };
}

if (typeof document !== 'undefined') forhamta();

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
    krav('kanon är tyst innan första beröring', motor.kanon() === false && motor.nedslag(40) === false && motor.traff(80) === false && motor.fiendeSkott(400) === false);
  } catch {
    kast = true;
  }
  krav('tyst motor kastar inte', kast === false);
  const monster = haptikMonster([12, 30, 4, 80]);
  krav('haptikmönstret är korta pulser', !!monster && monster[0] === 12 && monster[1] === 8 && monster[2] === 30 && monster.length === 3);

  const uppladdade = [
    'uppladdad_skott_serie.mp3', 'uppladdad_explosion_stor.mp3', 'uppladdad_explosion_b.mp3',
    'uppladdad_kanon_eko.mp3', 'uppladdad_kanon_eko_b.mp3', 'uppladdad_traff_kort.mp3',
    'uppladdad_mekanik_kort.mp3', 'uppladdad_torn_surr.mp3', 'uppladdad_eldror_surr.mp3',
    'uppladdad_band_surr.mp3', 'uppladdad_motor_loop.mp3'
  ];
  for (const fil of uppladdade) krav('med ' + fil, KLIPP.includes(fil));
  krav('tjugo klipp', KLIPP.length === 20);
  const nara = avstandDamp(30);
  const mitt = avstandDamp(250);
  const langt = avstandDamp(700);
  krav('30 m är full styrka', nara.gain === 1 && nara.hz >= 8000);
  krav('250 m är svagare och dovare', mitt.gain < 0.7 && mitt.gain > 0.15 && mitt.hz < nara.hz * 0.4);
  krav('700 m är ett dovt dån', langt.gain < mitt.gain && langt.hz < 900 && langt.hz < mitt.hz);
  krav('sidled och höjdled har olika klang', klangFor('uppladdad_torn_surr.mp3').type === 'lowpass' && klangFor('uppladdad_eldror_surr.mp3').type === 'bandpass' && klangFor('uppladdad_eldror_surr.mp3').q > klangFor('uppladdad_torn_surr.mp3').q);
  const eldMin = -10 * Math.PI / 180;
  const eldMax = 25 * Math.PI / 180;
  krav('tornet låter först över tröskeln', tornLjud(0.02) === false && tornLjud(0.03) === true && tornLjud(-0.2) === true);
  krav('eldröret tystnar i ändstoppet', eldrorLjud(0.2, 0, eldMin, eldMax) === true && eldrorLjud(0.01, 0, eldMin, eldMax) === false && eldrorLjud(-0.2, eldMin, eldMin, eldMax) === false && eldrorLjud(0.2, eldMin, eldMin, eldMax) === true && eldrorLjud(0.2, eldMax, eldMin, eldMax) === false);
  const tom = motorMix(500, 0, 0, 0);
  const full = motorMix(2400, 1, 11, 11);
  krav('tomgång bär motorn', tom.tomgang > tom.marsch && tom.band === 0);
  krav('marsch och band hörs i fart', full.marsch > tom.marsch && full.band > 0.2 && full.rate > tom.rate);
  krav('varvtal följer gas och växel', motorVarv(0, 0, 0) < motorVarv(1, 0, 0) && motorVarv(1, 0.28, 0) > motorVarv(1, 1, 0) && motorVarv(1, 1, 11) > motorVarv(1, 1, 0) && motorVarv(1, 1, 11) <= 2400);
  const still = motor.stega({dt: 0.05, gas: 0, kvot: 0, fart: 0, band: 0, tornU: 0, eldU: 0, eld: 0, eldMin, eldMax, gir: 0});
  krav('mätaren får ett varvtal utan ljud', still.rpm >= 490 && still.rpm <= 1600 && motor.skapade === 0);
  return fel;
}
