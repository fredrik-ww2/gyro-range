// Jämförelse av inspelningar. Ingen DOM och ingen lagring.
//
// Gränssnitt för en senare modell:
//   beraknaEgenskaper(inspelning, config) -> { version, namn, vektor, varden }
//   traningsrader(inspelningar, config)   -> [{ id, kategoriId, val, etikett, namn, x }]
//   jamforBibliotek(inspelningar, kategorier, config)
//       -> { identiska, enFaktorSkiljer }
//
// x[i] hör ihop med namn[i]. null betyder att sensorn inte gav något värde.
// En senare modell kan träna på rader där val är lika utom en faktor,
// med den faktorns valId som mål. jamforBibliotek pekar ut vilka egenskaper
// som redan skiljer sådana grupper åt, till exempel toppvärdet för vridning
// när bara skruv skiljer.

import { magnitudSerie, matHz, serieAv, statistik } from './motor.js';

export const ANALYS_VERSION = 1;

const STORHETER = ['rot', 'acc', 'accG', 'vinkel'];

function rubrikFor(config, nyckel) {
  const s = (config.storheter || []).find((x) => x.nyckel === nyckel);
  return s?.rubrik || nyckel;
}

export function definitioner(config) {
  const ut = [{ nyckel: 'langdSek', text: 'Varaktighet', enhet: 's', jamfor: true, hamta: (ins) => ins.langdSek }];
  for (const nyckel of STORHETER) {
    const axlar = config.axlar?.[nyckel] || [];
    const rubrik = rubrikFor(config, nyckel);
    for (let i = 0; i < axlar.length; i++) {
      const axel = axlar[i];
      const bas = `${rubrik}, ${axel.namn}`;
      const p = `${nyckel}.${i}`;
      ut.push({ nyckel: `${p}.topp`, text: `${bas}, topp`, enhet: axel.enhet, jamfor: true, hamta: (_ins, stat) => stat[nyckel][i].topp });
      ut.push({ nyckel: `${p}.medel`, text: `${bas}, medel`, enhet: axel.enhet, jamfor: true, hamta: (_ins, stat) => stat[nyckel][i].medel });
      ut.push({ nyckel: `${p}.min`, text: `${bas}, min`, enhet: axel.enhet, jamfor: false, hamta: (_ins, stat) => stat[nyckel][i].min });
      ut.push({ nyckel: `${p}.max`, text: `${bas}, max`, enhet: axel.enhet, jamfor: false, hamta: (_ins, stat) => stat[nyckel][i].max });
      ut.push({ nyckel: `${p}.tidTillTopp`, text: `${bas}, tid till topp`, enhet: 's', jamfor: false, hamta: (_ins, stat) => stat[nyckel][i].tidTillTopp });
      if (nyckel === 'vinkel') {
        ut.push({ nyckel: `${p}.slut`, text: `${bas}, slutläge`, enhet: axel.enhet, jamfor: true, hamta: (_ins, stat) => stat[nyckel][i].slut });
      } else {
        ut.push({ nyckel: `${p}.total`, text: `${bas}, ${axel.summa}`, enhet: axel.summaEnhet, jamfor: true, hamta: (_ins, stat) => stat[nyckel][i].total });
      }
    }
    const enhet = nyckel === 'rot' ? '°/s' : nyckel === 'vinkel' ? '°' : 'm/s²';
    ut.push({
      nyckel: `${nyckel}.magnitud.topp`,
      text: `${rubrik}, styrka`,
      enhet,
      jamfor: true,
      hamta: (_ins, stat) => stat[nyckel].magnitud.topp
    });
  }
  ut.push({ nyckel: 'hz', text: 'Takt', enhet: 'Hz', jamfor: false, hamta: (ins) => ins.samplingsfrekvensHz });
  return ut;
}

function statistikFor(ins, config) {
  const ut = {};
  for (const nyckel of STORHETER) {
    const axlar = config.axlar?.[nyckel] || [];
    ut[nyckel] = axlar.map((_axel, i) => statistik(serieAv(ins.sampel, nyckel, i)));
    ut[nyckel].magnitud = statistik(magnitudSerie(ins.sampel, nyckel));
  }
  return ut;
}

function runda(v) {
  if (!Number.isFinite(v)) return null;
  return Math.round(v * 1000) / 1000;
}

export function beraknaEgenskaper(inspelning, config) {
  const def = definitioner(config || {});
  const stat = statistikFor(inspelning || {}, config || {});
  const namn = [];
  const vektor = [];
  const varden = {};
  for (const d of def) {
    const varde = runda(d.hamta(inspelning || {}, stat));
    namn.push(d.nyckel);
    vektor.push(varde);
    varden[d.nyckel] = { text: d.text, enhet: d.enhet, varde, jamfor: d.jamfor };
  }
  if (!Number.isFinite(inspelning?.samplingsfrekvensHz) && inspelning?.sampel?.length) {
    const hz = runda(matHz(inspelning.sampel));
    const i = namn.indexOf('hz');
    if (i >= 0) { vektor[i] = hz; varden.hz.varde = hz; }
  }
  return { version: ANALYS_VERSION, namn, vektor, varden };
}

export function traningsrader(inspelningar, config) {
  return (inspelningar || []).filter((ins) => ins?.sampel?.length).map((ins) => {
    const eg = ins.egenskaper?.vektor?.length ? ins.egenskaper : beraknaEgenskaper(ins, config);
    return {
      id: ins.id,
      kategoriId: ins.kategoriId || null,
      val: ins.val || {},
      etikett: ins.etikett || null,
      namn: eg.namn,
      x: eg.vektor
    };
  });
}

function signatur(ins, faktorer, utomId) {
  const delar = [];
  for (const f of faktorer) {
    if (f.id === utomId) continue;
    const v = ins.val?.[f.id];
    delar.push(`${f.id}:${v?.valId || ''}:${v?.undervalId || ''}`);
  }
  return delar.join('|');
}

function vardeNyckel(ins, faktorId) {
  const v = ins.val?.[faktorId];
  if (!v?.valId) return '';
  return `${v.valId}:${v.undervalId || ''}`;
}

function medelAv(rader, nycklar) {
  const ut = {};
  for (const nyckel of nycklar) {
    const vals = [];
    for (const rad of rader) {
      const v = rad.egenskaper.varden[nyckel]?.varde;
      if (Number.isFinite(v)) vals.push(v);
    }
    ut[nyckel] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }
  return ut;
}

function vardeText(faktor, nyckel) {
  const [valId, underId] = nyckel.split(':');
  const vald = (faktor.val || []).find((v) => v.id === valId);
  if (!vald) return 'okänt val';
  const under = underId ? (vald.underval || []).find((u) => u.id === underId) : null;
  return under ? `${vald.namn} · ${under.namn}` : vald.namn;
}

function likaText(ins, faktorer, utomId) {
  const delar = [];
  for (const f of faktorer) {
    if (f.id === utomId) continue;
    const v = ins.val?.[f.id];
    const vald = (f.val || []).find((x) => x.id === v?.valId);
    if (!vald) continue;
    const under = v?.undervalId ? (vald.underval || []).find((u) => u.id === v.undervalId) : null;
    delar.push(`${f.namn}: ${under ? `${vald.namn} · ${under.namn}` : vald.namn}`);
  }
  return delar.join(', ');
}

function minAbs(enhet, config) {
  const tab = config.analys?.minAbsolut || {};
  if (enhet && Object.prototype.hasOwnProperty.call(tab, enhet)) return Number(tab[enhet]);
  return Number(tab.default ?? 0.2);
}

function jamforNycklar(eg) {
  return Object.entries(eg.varden || {}).filter(([, v]) => v?.jamfor).map(([nyckel]) => nyckel);
}

export function jamforBibliotek(inspelningar, kategorier, config) {
  const cfg = config || {};
  const rader = (inspelningar || []).filter((ins) => ins?.sampel?.length).map((ins) => ({
    ins,
    egenskaper: beraknaEgenskaper(ins, cfg)
  }));
  const identiska = [];
  const enFaktorSkiljer = [];
  const minRel = Number(cfg.analys?.minRelativSkillnad ?? 0.15);
  const tak = Math.max(1, Number(cfg.analys?.antalSkillnader ?? 5));

  for (const kat of kategorier || []) {
    const iKat = rader.filter((r) => r.ins.kategoriId === kat.id);
    if (iKat.length < 2) continue;
    const faktorer = kat.faktorer || [];

    const hela = new Map();
    for (const rad of iKat) {
      const sig = signatur(rad.ins, faktorer, null);
      if (!hela.has(sig)) hela.set(sig, []);
      hela.get(sig).push(rad);
    }
    for (const grupp of hela.values()) {
      if (grupp.length < 2) continue;
      const nycklar = jamforNycklar(grupp[0].egenskaper);
      identiska.push({
        kategoriId: kat.id,
        kategoriNamn: kat.namn,
        antal: grupp.length,
        text: likaText(grupp[0].ins, faktorer, null) || kat.namn,
        medel: medelAv(grupp, nycklar),
        ids: grupp.map((r) => r.ins.id)
      });
    }

    for (const faktor of faktorer) {
      const hinkar = new Map();
      for (const rad of iKat) {
        const sig = signatur(rad.ins, faktorer, faktor.id);
        const varde = vardeNyckel(rad.ins, faktor.id);
        if (!varde) continue;
        if (!hinkar.has(sig)) hinkar.set(sig, new Map());
        const perVarde = hinkar.get(sig);
        if (!perVarde.has(varde)) perVarde.set(varde, []);
        perVarde.get(varde).push(rad);
      }
      for (const [sig, perVarde] of hinkar) {
        if (perVarde.size < 2) continue;
        const nycklar = jamforNycklar(iKat[0].egenskaper);
        const grupper = [...perVarde.entries()].map(([nyckel, medlemmar]) => ({
          nyckel,
          text: vardeText(faktor, nyckel),
          antal: medlemmar.length,
          medel: medelAv(medlemmar, nycklar),
          ids: medlemmar.map((r) => r.ins.id)
        }));
        const beskriv = grupper[0] && iKat.find((r) => r.ins.id === grupper[0].ids[0]);
        const skillnader = [];
        for (const nyckel of nycklar) {
          const info = iKat[0].egenskaper.varden[nyckel];
          let lag = null;
          let hog = null;
          for (const g of grupper) {
            const v = g.medel[nyckel];
            if (!Number.isFinite(v)) continue;
            if (!lag || v < lag.varde) lag = { text: g.text, varde: v };
            if (!hog || v > hog.varde) hog = { text: g.text, varde: v };
          }
          if (!lag || !hog || lag.text === hog.text) continue;
          const skillnad = hog.varde - lag.varde;
          const relativ = skillnad / Math.max(Math.abs(hog.varde), Math.abs(lag.varde), 1e-6);
          if (relativ < minRel) continue;
          if (skillnad < minAbs(info?.enhet, cfg)) continue;
          const tab = cfg.analys?.skalaJamforelse || {};
          const skala = info?.enhet && tab[info.enhet] != null ? Number(tab[info.enhet]) : Number(tab.default ?? 1);
          const poang = skillnad / (skala > 0 ? skala : 1);
          skillnader.push({
            nyckel,
            text: info?.text || nyckel,
            enhet: info?.enhet || '',
            lag: { text: lag.text, varde: runda(lag.varde) },
            hog: { text: hog.text, varde: runda(hog.varde) },
            skillnad: runda(skillnad),
            relativ: runda(relativ),
            poang: runda(poang)
          });
        }
        skillnader.sort((a, b) => b.poang - a.poang || b.skillnad - a.skillnad);
        enFaktorSkiljer.push({
          kategoriId: kat.id,
          kategoriNamn: kat.namn,
          faktorId: faktor.id,
          faktorNamn: faktor.namn,
          lika: beskriv ? likaText(beskriv.ins, faktorer, faktor.id) : '',
          signatur: sig,
          grupper,
          skillnader: skillnader.slice(0, tak)
        });
      }
    }
  }

  enFaktorSkiljer.sort((a, b) => (b.skillnader[0]?.poang || 0) - (a.skillnader[0]?.poang || 0));
  return { identiska, enFaktorSkiljer };
}
