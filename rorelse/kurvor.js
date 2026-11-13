// Ritning av en inspelning: en kurva per axel, och en tabell under varje axel.

import { magnitudSerie, serieAv, statistik } from './motor.js';

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

export { formTal, formSek };
