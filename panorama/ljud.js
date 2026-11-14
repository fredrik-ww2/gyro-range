// Skott, träff och taktilt klick utan ljudfiler. AudioContext skapas först i en användargest.

import { forberedTystLage, installeraIosLjud, vakna } from '../shared/ios-ljud.js';

function klamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

function lasOppTyst() { forberedTystLage(); }

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
      const klar = (ctx.state === 'suspended' || ctx.state === 'interrupted')
        ? ctx.resume().then(() => true).catch(() => false)
        : Promise.resolve(true);
      oppnaLovande = klar.then(ok => laddaKlipp().then(() => ok).catch(() => ok));
      return oppnaLovande;
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
  let nastaSkott = 0;
  let bultAntal = 0;
  let salvaAntal = 0;
  let vinerAntal = 0;
  const klipp = {};
  const klippStatus = {};
  let laddLofte = null;
  const KLIPP_NAMN = ['kar98k_skott', 'kar98k_bult', 'bult_cykel', 'springfield_skott', 'enfield_skott', 'mg42_salva'];
  const PLAN = {
    vanligt: {skott: '', rate: 1, bult: 'kar98k_bult', bultRate: 1.12, bultEfter: 0.16, minSparr: 0.72},
    kar98k: {skott: 'kar98k_skott', rate: 1, bult: 'kar98k_bult', bultRate: 1, bultEfter: 0.22, minSparr: 0.86},
    springfield: {skott: 'springfield_skott', rate: 1, bult: 'bult_cykel', bultRate: 0.98, bultEfter: 0.26, minSparr: 0.98},
    enfield: {skott: 'enfield_skott', rate: 1.04, bult: 'bult_cykel', bultRate: 1.42, bultEfter: 0.12, minSparr: 0.58}
  };

  function sattKaraktar(id) {
    if (KAR[id]) karaktar = id;
  }

  function kanSkjuta() {
    if (!ctx) return true;
    return ctx.currentTime + 0.012 >= nastaSkott;
  }

  function lasSparr(plan, skottLangd, bultLangd) {
    const bult = Math.min(Math.max(0, bultLangd || 0), 0.75);
    const cykl = (plan.bultEfter || 0) + bult * 0.85 + Math.min(skottLangd || 0, 0.4) * 0.15;
    return Math.min(1.15, Math.max(plan.minSparr || 0.6, cykl));
  }

  function spelaKlipp(namn, nar, opt = {}) {
    const buffer = klipp[namn];
    if (!buffer || !ctx || !master) return 0;
    const rate = Math.max(0.5, Math.min(2, Number(opt.rate) || 1));
    const d = Math.max(0, Number(opt.avstand) || 0);
    const damp = d > 0 ? Math.max(0.07, Math.min(1, 26 / (d + 10))) : 1;
    const vol = Math.max(0, Math.min(1.4, Number(opt.vol) || 1)) * damp;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = vol;
    const extra = [];
    if (d > 14) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = Math.max(650, 7200 - d * 28);
      src.connect(lp);
      lp.connect(g);
      extra.push(lp);
    } else src.connect(g);
    g.connect(master);
    const t = Number.isFinite(+nar) ? +nar : ctx.currentTime;
    const langd = buffer.duration / rate;
    src.start(t);
    src.stop(t + langd + 0.03);
    src.onended = () => {
      try { src.disconnect(); g.disconnect(); for (const n of extra) n.disconnect(); } catch { /* redan borta */ }
    };
    return langd;
  }

  function laddaKlipp() {
    if (laddLofte) return laddLofte;
    laddLofte = (async () => {
      if (!seTill()) {
        for (const namn of KLIPP_NAMN) klippStatus[namn] = false;
        return klippStatus;
      }
      await Promise.all(KLIPP_NAMN.map(async namn => {
        try {
          const url = new URL('./ljud/' + namn + '.mp3', import.meta.url);
          const res = await fetch(url);
          if (!res.ok) throw new Error(String(res.status));
          const raw = await res.arrayBuffer();
          klipp[namn] = await ctx.decodeAudioData(raw.slice(0));
          klippStatus[namn] = !!klipp[namn];
        } catch {
          klippStatus[namn] = false;
        }
      }));
      return klippStatus;
    })();
    return laddLofte;
  }

  function skott() {
    if (!pa) return false;
    try {
      if (!seTill() || !brus || !master) return false;
      if (!kanSkjuta()) return false;
      if ((ctx.state === 'suspended' || ctx.state === 'interrupted')) ctx.resume().catch(() => {});
      const plan = PLAN[karaktar] || PLAN.vanligt;
      const harSkott = !!(plan.skott && klipp[plan.skott]);
      const harBult = !!(plan.bult && klipp[plan.bult]);
      const t0 = ctx.currentTime;
      if (harSkott) {
        const skottLangd = spelaKlipp(plan.skott, t0, {rate: plan.rate, vol: 1});
        const bultLangd = harBult ? spelaKlipp(plan.bult, t0 + plan.bultEfter, {rate: plan.bultRate, vol: 1}) : 0;
        if (harBult) bultAntal++;
        nastaSkott = t0 + lasSparr(plan, skottLangd, bultLangd);
        skottAntal++;
        return true;
      }
      skottAntal++;
      const k = KAR[karaktar] || KAR.vanligt;
      const t = t0;
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
      const medMekanik = !harBult;
      if (harBult) {
        const bultLangd = spelaKlipp(plan.bult, t + plan.bultEfter, {rate: plan.bultRate, vol: 1});
        bultAntal++;
        nastaSkott = t + lasSparr(plan, 0.2, bultLangd);
      } else nastaSkott = t + plan.minSparr;
      if (medMekanik) for (const [forsening, frek, langd, topp] of k.mekanik) {
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
      if (mekanik[5]) mekanik[5].onended = () => kopplaLoss(mekanik);
      return true;
    } catch {
      return false;
    }
  }

  function traff(avstand) {
    if (!pa) return false;
    try {
      if (!seTill() || !brus || !master) return false;
      if ((ctx.state === 'suspended' || ctx.state === 'interrupted')) ctx.resume().catch(() => {});
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
      if ((ctx.state === 'suspended' || ctx.state === 'interrupted')) ctx.resume().catch(() => {});
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

  function salva(avstand) {
    if (!pa) return false;
    try {
      if (!seTill() || !master) return false;
      if ((ctx.state === 'suspended' || ctx.state === 'interrupted')) ctx.resume().catch(() => {});
      salvaAntal++;
      if (klipp.mg42_salva) {
        spelaKlipp('mg42_salva', ctx.currentTime, {vol: 1, avstand, rate: 1});
        return true;
      }
      if (!brus) return false;
      const t = ctx.currentTime;
      for (let i = 0; i < 6; i++) {
        const tid = t + i * 0.045;
        const src = ctx.createBufferSource();
        src.buffer = brus;
        src.playbackRate.value = 1.15;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 700;
        const g = ctx.createGain();
        const d = Math.max(1, Number(avstand) || 20);
        kurva(g, tid, Math.max(0.08, 0.4 * Math.exp(-d / 80)), 0.04);
        src.connect(hp); hp.connect(g); g.connect(master);
        src.start(tid); src.stop(tid + 0.05);
      }
      return true;
    } catch {
      return false;
    }
  }

  function viner(avstand) {
    if (!pa) return false;
    try {
      if (!seTill() || !brus || !master) return false;
      if ((ctx.state === 'suspended' || ctx.state === 'interrupted')) ctx.resume().catch(() => {});
      vinerAntal++;
      const t = ctx.currentTime;
      const d = Math.max(1, Number(avstand) || 12);
      const topp = Math.max(0.08, Math.min(0.55, 0.7 * Math.exp(-d / 70)));
      const src = ctx.createBufferSource();
      src.buffer = brus;
      src.playbackRate.value = 1.9;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(2800, t);
      hp.frequency.exponentialRampToValueAtTime(900, t + 0.06);
      const g = ctx.createGain();
      kurva(g, t, topp, 0.055);
      const ton = ctx.createOscillator();
      ton.type = 'sine';
      ton.frequency.setValueAtTime(2400, t);
      ton.frequency.exponentialRampToValueAtTime(700, t + 0.05);
      const tg = ctx.createGain();
      kurva(tg, t, topp * 0.35, 0.04);
      src.connect(hp); hp.connect(g); g.connect(master);
      ton.connect(tg); tg.connect(master);
      src.start(t); src.stop(t + 0.07);
      ton.start(t); ton.stop(t + 0.06);
      src.onended = () => {
        for (const n of [src, hp, g, ton, tg]) { try { n.disconnect(); } catch { /* redan borta */ } }
      };
      return true;
    } catch {
      return false;
    }
  }

  function duns(avstand) {
    if (!pa) return false;
    try {
      if (!seTill() || !brus || !master) return false;
      if ((ctx.state === 'suspended' || ctx.state === 'interrupted')) ctx.resume().catch(() => {});
      const t = ctx.currentTime;
      const d = Number.isFinite(+avstand) ? Math.max(1, +avstand) : 40;
      const topp = Math.max(0.12, 0.55 * Math.exp(-d / 90));
      const src = ctx.createBufferSource();
      src.buffer = brus;
      src.playbackRate.value = 0.55;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 420;
      const g = ctx.createGain();
      kurva(g, t, topp, 0.12);
      src.connect(lp); lp.connect(g); g.connect(master);
      src.start(t); src.stop(t + 0.14);
      src.onended = () => { for (const n of [src, lp, g]) { try { n.disconnect(); } catch { /* redan borta */ } } };
      return true;
    } catch {
      return false;
    }
  }

  installeraIosLjud({ hamta: () => ctx, oppna: () => oppna() });
  return {
    oppna, satt, sattKaraktar, skott, traff, duns, klick, salva, viner, kanSkjuta, ladda: laddaKlipp,
    get karaktar() { return karaktar; },
    get pa() { return pa; },
    get volym() { return volym; },
    get skottAntal() { return skottAntal; },
    get traffAntal() { return traffAntal; },
    get klickAntal() { return klickAntal; },
    get bultAntal() { return bultAntal; },
    get salvaAntal() { return salvaAntal; },
    get vinerAntal() { return vinerAntal; },
    get klipp() { return {...klippStatus}; },
    get kontext() { return ctx; },
    get redo() { return !!ctx && ctx.state === 'running'; }
  };
}
