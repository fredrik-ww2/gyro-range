// Ritning av en inspelning: en kurva per axel, och en tabell under varje axel.

import { magnitudSerie, serieAv, statistik, vardeVid } from './motor.js';

function formTal(n, enhet) {
  if (!Number.isFinite(n)) return '–';
  const dec = Math.abs(n) >= 100 ? 0 : Math.abs(n) >= 10 ? 1 : 2;
  const text = n.toLocaleString('sv-SE', { maximumFractionDigits: dec, minimumFractionDigits: 0 });
  return enhet ? `${text} ${enhet}` : text;
}

function formSek(n) {
  if (!Number.isFinite(n)) return '–';
  return `${n.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} s`;
}

function skalaFor(punkter, minst) {
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of punkter) {
    if (!Number.isFinite(p.v)) continue;
    if (p.v < lo) lo = p.v;
    if (p.v > hi) hi = p.v;
  }
  const golv = Number(minst) > 0 ? Number(minst) : 1;
  if (!Number.isFinite(lo)) return { lo: -golv / 2, hi: golv / 2 };
  if (hi - lo < golv) {
    const mitt = (hi + lo) / 2;
    lo = mitt - golv / 2;
    hi = mitt + golv / 2;
  }
  const pad = (hi - lo) * 0.14;
  return { lo: lo - pad, hi: hi + pad };
}

function ritaEn(post) {
  const { canvas, punkter, farg, skala } = post;
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || 320;
  const h = canvas.clientHeight || 112;
  const bw = Math.max(1, Math.floor(w * dpr));
  const bh = Math.max(1, Math.floor(h * dpr));
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  const c = canvas.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, w, h);
  c.fillStyle = '#0b0d0f';
  c.fillRect(0, 0, w, h);
  const { lo, hi } = skala;
  const spann = hi - lo || 1;
  const t1 = Math.max(0.2, punkter.length ? punkter[punkter.length - 1].t : 1);
  const y = (v) => 8 + ((hi - v) / spann) * (h - 16);
  if (lo < 0 && hi > 0) {
    c.strokeStyle = '#3a444e';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0, y(0));
    c.lineTo(w, y(0));
    c.stroke();
  }
  c.beginPath();
  c.strokeStyle = farg;
  c.lineWidth = 2.4;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  let flytt = true;
  let fore = null;
  let peak = null;
  for (const p of punkter) {
    if (fore && p.t - fore > 0.25) flytt = true;
    const x = (p.t / t1) * (w - 8) + 4;
    const yy = y(p.v);
    if (flytt) c.moveTo(x, yy);
    else c.lineTo(x, yy);
    flytt = false;
    fore = p.t;
    if (!peak || Math.abs(p.v) > Math.abs(peak.v)) peak = { x, y: yy, v: p.v };
  }
  c.stroke();
  if (peak) {
    c.fillStyle = farg;
    c.beginPath();
    c.arc(peak.x, peak.y, 4, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = '#9aa6b0';
  c.font = '12px -apple-system, system-ui, sans-serif';
  c.textAlign = 'left';
  c.fillText(formTal(hi), 6, 14);
  c.fillText(formTal(lo), 6, h - 6);
}

function tabell(namn, rader) {
  const table = document.createElement('table');
  table.setAttribute('aria-label', namn);
  for (const [etikett, varde] of rader) {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = etikett;
    const td = document.createElement('td');
    td.textContent = varde;
    tr.append(th, td);
    table.append(tr);
  }
  return table;
}

export function byggKurvor(inspelning, config) {
  const rot = document.createElement('div');
  rot.className = 'kurvor';
  const farger = config.farger || ['#e25b55', '#5cc27a', '#5aa6e8'];
  const legend = document.createElement('p');
  legend.className = 'legend';
  const axelnamn = (config.axlar?.rot || []).map((a) => a.namn);
  axelnamn.forEach((namn, i) => {
    const bit = document.createElement('span');
    const prick = document.createElement('i');
    prick.style.background = farger[i] || '#fff';
    bit.append(prick, document.createTextNode(namn || `Axel ${i + 1}`));
    legend.append(bit);
  });
  const led = document.createElement('span');
  led.className = 'legend-rest';
  led.textContent = 'Samma färger på alla kurvor. Pricken är toppen.';
  legend.append(led);
  rot.append(legend);

  const attRita = [];
  const hojd = Number(config.grafHojd) || 112;
  for (const storhet of config.storheter || []) {
    const axlar = config.axlar?.[storhet.nyckel] || [];
    const sektion = document.createElement('section');
    sektion.className = 'storhet';
    const h = document.createElement('h2');
    h.textContent = storhet.rubrik;
    const p = document.createElement('p');
    p.className = 'forklaring';
    p.textContent = storhet.text || '';
    sektion.append(h, p);
    axlar.forEach((axel, i) => {
      const farg = farger[i] || '#fff';
      const block = document.createElement('div');
      block.className = 'axel';
      const rub = document.createElement('p');
      rub.className = 'axel-namn';
      rub.style.color = farg;
      rub.textContent = axel.namn;
      const canvas = document.createElement('canvas');
      canvas.height = hojd;
      canvas.style.height = `${hojd}px`;
      canvas.setAttribute('aria-label', `${storhet.rubrik}, ${axel.namn}`);
      const punkter = serieAv(inspelning.sampel, storhet.nyckel, i);
      const stat = statistik(punkter);
      const skala = skalaFor(punkter, config.skalaMinst?.[storhet.nyckel]);
      attRita.push({ canvas, punkter, farg, skala });
      const rader = [
        ['Topp', formTal(stat.topp, axel.enhet)],
        ['Min', formTal(stat.min, axel.enhet)],
        ['Tid till topp', formSek(stat.tidTillTopp)]
      ];
      if (storhet.nyckel === 'vinkel') {
        rader.push(['Slutläge', formTal(stat.slut, axel.enhet)]);
        rader.push(['Från min till max', formTal(stat.spann, axel.enhet)]);
      } else {
        rader.push([axel.summa || 'Summa', formTal(stat.total, axel.summaEnhet || '')]);
      }
      block.append(rub, canvas, tabell(axel.namn, rader));
      sektion.append(block);
    });
    if (storhet.nyckel === 'rot' || storhet.nyckel === 'acc') {
      const mag = statistik(magnitudSerie(inspelning.sampel, storhet.nyckel));
      const rad = document.createElement('p');
      rad.className = 'styrka';
      const enhet = storhet.nyckel === 'rot' ? '°/s' : 'm/s²';
      rad.textContent = `Styrka som topp: ${formTal(mag.topp, enhet)} vid ${formSek(mag.tidTillTopp)}.`;
      sektion.append(rad);
    }
    rot.append(sektion);
  }

  return {
    rot,
    rita() {
      for (const post of attRita) ritaEn(post);
    }
  };
}

function storhetsOrdning(config) {
  const alla = config.storheter || [];
  const fore = ['rot', 'acc', 'vinkel'];
  const ut = [];
  for (const nyckel of fore) {
    const s = alla.find((x) => x.nyckel === nyckel);
    if (s) ut.push(s);
  }
  for (const s of alla) if (!ut.includes(s)) ut.push(s);
  return ut;
}

function tidSpann(sampel) {
  let t0 = Infinity;
  let t1 = -Infinity;
  for (const s of sampel || []) {
    if (!Number.isFinite(s?.t)) continue;
    if (s.t < t0) t0 = s.t;
    if (s.t > t1) t1 = s.t;
  }
  if (!Number.isFinite(t0)) return { t0: 0, t1: 1 };
  if (!(t1 > t0)) return { t0, t1: t0 + 1e-3 };
  return { t0, t1 };
}

function toppAndel(ins) {
  const { t0, t1 } = tidSpann(ins?.sampel);
  const mag = magnitudSerie(ins?.sampel, 'rot');
  const serie = mag.length ? mag : magnitudSerie(ins?.sampel, 'acc');
  if (!serie.length) return 0.5;
  let best = serie[0];
  for (const p of serie) if (p.v > best.v) best = p;
  return Math.min(1, Math.max(0, (best.t - t0) / (t1 - t0)));
}

function medAlpha(hex, a) {
  const n = String(hex || '#ffffff').replace('#', '');
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  if (![r, g, b].every((x) => Number.isFinite(x))) return hex || '#fff';
  return `rgba(${r},${g},${b},${a})`;
}

function forbered(canvas) {
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || 320;
  const h = canvas.clientHeight || 84;
  const bw = Math.max(1, Math.floor(w * dpr));
  const bh = Math.max(1, Math.floor(h * dpr));
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  const c = canvas.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, w, h);
  c.fillStyle = '#0b0d0f';
  c.fillRect(0, 0, w, h);
  return { c, w, h };
}

function yAv(v, skala, h) {
  const spann = (skala.hi - skala.lo) || 1;
  return 8 + ((skala.hi - v) / spann) * (h - 16);
}

function nollLinje(c, skala, w, h) {
  if (!(skala.lo < 0 && skala.hi > 0)) return;
  const y = yAv(0, skala, h);
  c.strokeStyle = '#3a444e';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(0, y);
  c.lineTo(w, y);
  c.stroke();
}

export function byggOversikt(inspelning, config) {
  const rot = document.createElement('div');
  rot.className = 'oversikt';
  rot.dataset.roll = 'oversikt';
  const sampel = inspelning?.sampel || [];
  if (!sampel.length) {
    const p = document.createElement('p');
    p.textContent = 'Ingen kurva att visa.';
    rot.append(p);
    return { rot, rita() {} };
  }
  const { t0, t1 } = tidSpann(sampel);
  const farger = config.farger || ['#e25b55', '#5cc27a', '#5aa6e8'];
  const hojd = Number(config.oversikt?.hojd) || 84;
  let andel = toppAndel(inspelning);

  const tidRad = document.createElement('div');
  tidRad.className = 'tid-rad';
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0';
  slider.max = '1000';
  slider.value = String(Math.round(andel * 1000));
  slider.dataset.roll = 'tid';
  slider.setAttribute('aria-label', 'Tidpunkt i rörelsen');
  const tidText = document.createElement('span');
  tidText.dataset.roll = 'tid-text';
  tidRad.append(slider, tidText);

  const hint = document.createElement('p');
  hint.className = 'led';
  hint.textContent = 'Dra reglaget. Linjen visar samma ögonblick i alla kurvor.';
  rot.append(hint, tidRad);

  const rutor = [];
  for (const storhet of storhetsOrdning(config)) {
    const axlar = config.axlar?.[storhet.nyckel] || [];
    if (!axlar.length) continue;
    const sektion = document.createElement('section');
    sektion.className = 'storhet';
    const h = document.createElement('h2');
    h.textContent = storhet.rubrik;
    const canvas = document.createElement('canvas');
    canvas.height = hojd;
    canvas.style.height = `${hojd}px`;
    canvas.setAttribute('aria-label', storhet.rubrik);
    const serier = axlar.map((axel, i) => ({
      namn: axel.namn,
      enhet: axel.enhet,
      farg: farger[i] || '#fff',
      punkter: serieAv(sampel, storhet.nyckel, i)
    }));
    const alla = [];
    for (const s of serier) for (const p of s.punkter) alla.push(p);
    const skala = skalaFor(alla, config.skalaMinst?.[storhet.nyckel]);
    const avl = document.createElement('p');
    avl.className = 'avlasning';
    avl.dataset.roll = 'avlasning';
    sektion.append(h, canvas, avl);
    rot.append(sektion);
    rutor.push({ canvas, serier, skala, avl });
  }

  function tidNu() {
    return t0 + andel * (t1 - t0);
  }

  function uppdateraText() {
    tidText.textContent = formSek(tidNu());
    for (const ruta of rutor) {
      ruta.avl.replaceChildren();
      for (const serie of ruta.serier) {
        const bit = document.createElement('span');
        bit.style.color = serie.farg;
        const v = vardeVid(serie.punkter, tidNu());
        bit.textContent = `${serie.namn} ${formTal(v, serie.enhet)}`;
        ruta.avl.append(bit);
      }
    }
  }

  function ritaRuta(ruta) {
    const { c, w, h } = forbered(ruta.canvas);
    nollLinje(c, ruta.skala, w, h);
    const xAv = (t) => 4 + ((t - t0) / (t1 - t0)) * (w - 8);
    for (const serie of ruta.serier) {
      c.beginPath();
      c.strokeStyle = serie.farg;
      c.lineWidth = 2.2;
      c.lineJoin = 'round';
      c.lineCap = 'round';
      let flytt = true;
      let fore = null;
      for (const p of serie.punkter) {
        if (fore != null && p.t - fore > 0.25) flytt = true;
        const x = xAv(p.t);
        const y = yAv(p.v, ruta.skala, h);
        if (flytt) c.moveTo(x, y);
        else c.lineTo(x, y);
        flytt = false;
        fore = p.t;
      }
      c.stroke();
      const v = vardeVid(serie.punkter, tidNu());
      if (Number.isFinite(v)) {
        c.fillStyle = serie.farg;
        c.beginPath();
        c.arc(xAv(tidNu()), yAv(v, ruta.skala, h), 4, 0, Math.PI * 2);
        c.fill();
      }
    }
    const x = xAv(tidNu());
    c.strokeStyle = '#d9a441';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(x, 4);
    c.lineTo(x, h - 4);
    c.stroke();
  }

  function rita() {
    for (const ruta of rutor) ritaRuta(ruta);
    uppdateraText();
  }

  function satt(u) {
    andel = Math.min(1, Math.max(0, u));
    slider.value = String(Math.round(andel * 1000));
    rita();
  }

  slider.addEventListener('input', () => satt(Number(slider.value) / 1000));
  for (const ruta of rutor) {
    const canvas = ruta.canvas;
    let drar = false;
    const fran = (ev) => {
      const r = canvas.getBoundingClientRect();
      const x = ev.clientX - r.left;
      return (x - 4) / ((r.width || 1) - 8);
    };
    canvas.addEventListener('pointerdown', (ev) => {
      drar = true;
      try { canvas.setPointerCapture(ev.pointerId); } catch (e) { /* pekaren är redan fångad */ }
      satt(fran(ev));
    });
    canvas.addEventListener('pointermove', (ev) => { if (drar) satt(fran(ev)); });
    canvas.addEventListener('pointerup', () => { drar = false; });
    canvas.addEventListener('pointercancel', () => { drar = false; });
  }
  uppdateraText();
  return { rot, rita };
}

function skalaBand(kurva, minst) {
  const punkter = [];
  for (const p of kurva.punkter || []) {
    if (!Number.isFinite(p.medel)) continue;
    const s = Number.isFinite(p.spridning) ? p.spridning : 0;
    punkter.push({ v: p.medel + s }, { v: p.medel - s });
  }
  for (const linje of kurva.linjer || []) for (const p of linje) punkter.push(p);
  return skalaFor(punkter, minst);
}

function ritaBand(post, jam) {
  const { canvas, kurva, skala, farg } = post;
  const { c, w, h } = forbered(canvas);
  const u0 = jam.u0;
  const u1 = jam.u1;
  const span = (u1 - u0) || 1;
  const xAv = (u) => 4 + ((u - u0) / span) * (w - 8);
  nollLinje(c, skala, w, h);
  const band = (kurva.punkter || []).filter((p) => Number.isFinite(p.medel) && Number.isFinite(p.spridning));
  if (band.length >= 2) {
    c.beginPath();
    c.moveTo(xAv(band[0].u), yAv(band[0].medel + band[0].spridning, skala, h));
    for (let i = 1; i < band.length; i++) c.lineTo(xAv(band[i].u), yAv(band[i].medel + band[i].spridning, skala, h));
    for (let i = band.length - 1; i >= 0; i--) c.lineTo(xAv(band[i].u), yAv(band[i].medel - band[i].spridning, skala, h));
    c.closePath();
    c.fillStyle = medAlpha(farg, 0.28);
    c.fill();
  }
  for (const linje of kurva.linjer || []) {
    c.beginPath();
    c.strokeStyle = 'rgba(214,222,230,0.72)';
    c.lineWidth = 1.15;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    let flytt = true;
    let fore = null;
    for (const p of linje) {
      if (fore != null && p.u - fore > span / 6) flytt = true;
      const x = xAv(p.u);
      const y = yAv(p.v, skala, h);
      if (flytt) c.moveTo(x, y);
      else c.lineTo(x, y);
      flytt = false;
      fore = p.u;
    }
    c.stroke();
  }
  c.beginPath();
  c.strokeStyle = farg;
  c.lineWidth = 2.4;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  let flytt = true;
  for (const p of kurva.punkter || []) {
    if (!Number.isFinite(p.medel)) { flytt = true; continue; }
    const x = xAv(p.u);
    const y = yAv(p.medel, skala, h);
    if (flytt) c.moveTo(x, y);
    else c.lineTo(x, y);
    flytt = false;
  }
  c.stroke();
  if (Number.isFinite(jam.synkLage)) {
    c.save();
    c.setLineDash([3, 4]);
    c.strokeStyle = '#d9a441';
    c.lineWidth = 1.5;
    c.beginPath();
    const x = xAv(jam.synkLage);
    c.moveTo(x, 4);
    c.lineTo(x, h - 4);
    c.stroke();
    c.restore();
  }
}

export function byggBand(jam, config) {
  const rot = document.createElement('div');
  rot.dataset.roll = 'band';
  const hojd = Number(config.monster?.hojd) || 72;
  const farger = config.farger || ['#e25b55', '#5cc27a', '#5aa6e8'];
  const poster = [];
  for (const storhet of storhetsOrdning(config)) {
    const kurvor = (jam?.kurvor || []).filter((k) => k.storhet === storhet.nyckel);
    if (!kurvor.length) continue;
    const sektion = document.createElement('section');
    sektion.className = 'storhet';
    const h = document.createElement('h2');
    h.textContent = storhet.rubrik;
    sektion.append(h);
    const axlar = config.axlar?.[storhet.nyckel] || [];
    for (const kurva of kurvor) {
      const axel = axlar[kurva.axel];
      const farg = farger[kurva.axel] || '#fff';
      const namn = document.createElement('p');
      namn.className = 'axel-namn';
      namn.style.color = farg;
      namn.textContent = axel?.namn || kurva.text;
      const canvas = document.createElement('canvas');
      canvas.height = hojd;
      canvas.style.height = `${hojd}px`;
      canvas.setAttribute('aria-label', kurva.text);
      const skala = skalaBand(kurva, config.skalaMinst?.[storhet.nyckel]);
      poster.push({ canvas, kurva, skala, farg });
      sektion.append(namn, canvas);
    }
    rot.append(sektion);
  }
  return {
    rot,
    rita() {
      for (const post of poster) ritaBand(post, jam);
    }
  };
}

export { formTal, formSek };
