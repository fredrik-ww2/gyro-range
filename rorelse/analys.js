// Jämförelse av inspelningar. Ingen DOM och ingen lagring.
//
// Gränssnitt:
//   beraknaEgenskaper(inspelning, config) -> { version, namn, vektor, varden }
//   traningsrader(inspelningar, config)   -> [{ id, kategoriId, val, etikett, namn, x }]
//   jamforBibliotek(inspelningar, kategorier, config)
//       -> { identiska, enFaktorSkiljer }
//   grupperaExakt(inspelningar, kategori)
//       -> [{ signatur, text, antal, ids }]
//   jamforInspelningar(inspelningar, config)
//       -> { antal, synk, synkLage, u0, u1, skalara, rang, kurvor, ids }
//   byggProfil(inspelningar, kategori, config)
//       -> profil med medel och spridning per egenskap, för en kategori och
//          en exakt kombination av val
//   avstandTillProfil(inspelning, profil, config)
//       -> { avstand, antal, perEgenskap }
//   narmasteProfil(inspelning, profiler, config)
//       -> { profilId, text, avstand } eller null
//
// x[i] hör ihop med namn[i]. null betyder att sensorn inte gav något värde.
// Spridning är stickprovsstandardavvikelse (delat med n−1).
// En profil är mönstret för en kategori och en exakt val-kombination.
// avstandTillProfil och narmasteProfil är till för att senare känna igen
// vilket slag en ny inspelning liknar, inom den kategorin.
// jamforBibliotek pekar ut vilka egenskaper som redan skiljer grupper åt
// när bara en faktor skiljer, till exempel toppvärdet för vridning.

import { magnitudSerie, matHz, medelOchSpridning, serieAv, statistik, vardeVid } from './motor.js';

export const ANALYS_VERSION = 1;
export const PROFIL_VERSION = 1;

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

function valText(ins, kategori) {
  const faktorer = kategori?.faktorer || [];
  if (!faktorer.length) return 'Utan val';
  const delar = [];
  for (const f of faktorer) {
    const v = ins?.val?.[f.id];
    const vald = (f.val || []).find((x) => x.id === v?.valId);
    if (!vald) { delar.push('Ej valt'); continue; }
    const under = v?.undervalId ? (vald.underval || []).find((u) => u.id === v.undervalId) : null;
    delar.push(under ? `${vald.namn} · ${under.namn}` : vald.namn);
  }
  if (delar.every((d) => d === 'Ej valt')) return 'Utan val';
  return delar.join(' · ');
}

export function idForProfil(kategoriId, signatur) {
  return `${kategoriId || ''}|${signatur || ''}`;
}

// Bara inspelningar med exakt samma val på alla faktorer hamnar i samma grupp.
export function grupperaExakt(inspelningar, kategori) {
  const faktorer = kategori?.faktorer || [];
  const hinkar = new Map();
  for (const ins of inspelningar || []) {
    if (!ins || ins.kategoriId !== kategori?.id) continue;
    if (!ins.sampel?.length && !(ins.antal > 0)) continue;
    const sig = signatur(ins, faktorer, null);
    if (!hinkar.has(sig)) hinkar.set(sig, []);
    hinkar.get(sig).push(ins);
  }
  const ut = [];
  for (const [sig, medlemmar] of hinkar) {
    ut.push({
      signatur: sig,
      text: valText(medlemmar[0], kategori),
      antal: medlemmar.length,
      ids: medlemmar.map((ins) => ins.id)
    });
  }
  ut.sort((a, b) => b.antal - a.antal || a.text.localeCompare(b.text, 'sv'));
  return ut;
}

function spannTid(sampel) {
  let t0 = Infinity;
  let t1 = -Infinity;
  for (const s of sampel || []) {
    if (!Number.isFinite(s?.t)) continue;
    if (s.t < t0) t0 = s.t;
    if (s.t > t1) t1 = s.t;
  }
  if (!Number.isFinite(t0)) return { t0: 0, t1: 0 };
  return { t0, t1 };
}

function synkAv(sampel, config) {
  const { t0, t1 } = spannTid(sampel);
  const mag = magnitudSerie(sampel, 'rot');
  const serie = mag.length >= 2 ? mag : magnitudSerie(sampel, 'acc');
  const typ = config?.monster?.synk === 'start' ? 'start' : 'topp';
  if (!serie.length) return { t: t0, t0, t1, typ };
  let topp = serie[0];
  for (const p of serie) if (p.v > topp.v) topp = p;
  const andel = Number(config?.monster?.startTroskel);
  const troskel = topp.v * (Number.isFinite(andel) ? andel : 0.12);
  let start = serie[0];
  for (const p of serie) {
    if (p.t > topp.t) break;
    if (p.v >= troskel) { start = p; break; }
  }
  return { t: typ === 'start' ? start.t : topp.t, t0, t1, typ };
}

function synkLageAv(config, typ) {
  const angiven = Number(config?.monster?.synkLage);
  if (Number.isFinite(angiven)) return angiven;
  return typ === 'start' ? 0.08 : 0.4;
}

function rutnat(uMin, uMax, n, synkU) {
  const antal = Math.max(2, n);
  const ut = [];
  const steg = (uMax - uMin) / (antal - 1);
  for (let i = 0; i < antal; i++) ut.push(uMin + steg * i);
  if (synkU >= uMin && synkU <= uMax) {
    let bast = 0;
    for (let i = 1; i < ut.length; i++) {
      if (Math.abs(ut[i] - synkU) < Math.abs(ut[bast] - synkU)) bast = i;
    }
    ut[bast] = synkU;
  }
  return ut;
}

function cvAv(medel, spridning, enhet, config) {
  if (!Number.isFinite(medel) || !Number.isFinite(spridning)) return null;
  const andel = Number(config?.monster?.cvGolvAndel);
  const faktor = Number.isFinite(andel) ? andel : 0.5;
  const golv = Math.abs(minAbs(enhet, config)) * faktor;
  if (Math.abs(medel) < Math.max(golv, 1e-9)) return null;
  return spridning / Math.abs(medel);
}

function storhetsNycklar(config) {
  const franConfig = (config?.storheter || []).map((s) => s.nyckel).filter((k) => STORHETER.includes(k));
  return franConfig.length ? franConfig : STORHETER.slice();
}

export function jamforInspelningar(inspelningar, config) {
  const cfg = config || {};
  const lista = (inspelningar || []).filter((ins) => ins?.sampel?.length);
  const synkTyp = cfg.monster?.synk === 'start' ? 'start' : 'topp';
  const synkLage = synkLageAv(cfg, synkTyp);
  const tom = {
    antal: lista.length,
    synk: synkTyp,
    synkLage,
    u0: 0,
    u1: 1,
    skalara: [],
    rang: { varierar: [], stabila: [] },
    kurvor: [],
    ids: lista.map((ins) => ins.id)
  };
  if (!lista.length) return tom;

  const rader = lista.map((ins) => beraknaEgenskaper(ins, cfg));
  const skalara = [];
  for (const d of definitioner(cfg)) {
    if (d.nyckel === 'hz') continue;
    const stat = medelOchSpridning(rader.map((eg) => eg.varden[d.nyckel]?.varde));
    if (!stat.antal) continue;
    skalara.push({
      nyckel: d.nyckel,
      text: d.text,
      enhet: d.enhet,
      medel: stat.medel,
      spridning: stat.spridning,
      variationskoefficient: cvAv(stat.medel, stat.spridning, d.enhet, cfg)
    });
  }
  const medCv = skalara.filter((s) => Number.isFinite(s.variationskoefficient));
  const fallande = [...medCv].sort((a, b) => b.variationskoefficient - a.variationskoefficient || a.text.localeCompare(b.text, 'sv'));
  const nRang = Math.max(1, Number(cfg.monster?.antalRang) || 4);
  const rang = {
    varierar: fallande.slice(0, nRang),
    stabila: [...fallande].reverse().slice(0, nRang)
  };

  const synkar = lista.map((ins) => synkAv(ins.sampel, cfg));
  let uMin = Infinity;
  let uMax = -Infinity;
  for (const syn of synkar) {
    const d = Math.max(1e-6, syn.t1 - syn.t0);
    const a = synkLage + (syn.t0 - syn.t) / d;
    const b = synkLage + (syn.t1 - syn.t) / d;
    if (a < uMin) uMin = a;
    if (b > uMax) uMax = b;
  }
  if (!Number.isFinite(uMin) || !(uMax > uMin)) { uMin = 0; uMax = 1; }
  const antalPunkter = Math.max(8, Number(cfg.monster?.antalPunkter) || 40);
  const grid = rutnat(uMin, uMax, antalPunkter, synkLage);

  const kurvor = [];
  for (const nyckel of storhetsNycklar(cfg)) {
    const axlar = cfg.axlar?.[nyckel] || [];
    const rubrik = rubrikFor(cfg, nyckel);
    for (let axel = 0; axel < axlar.length; axel++) {
      const hinkar = grid.map(() => []);
      const linjer = [];
      const vid = [];
      lista.forEach((ins, i) => {
        const syn = synkar[i];
        const d = Math.max(1e-6, syn.t1 - syn.t0);
        const serie = serieAv(ins.sampel, nyckel, axel);
        const linje = [];
        grid.forEach((u, gi) => {
          const t = syn.t + (u - synkLage) * d;
          const v = vardeVid(serie, t);
          if (!Number.isFinite(v)) return;
          hinkar[gi].push(v);
          linje.push({ u, v });
        });
        linjer.push(linje);
        const vSynk = vardeVid(serie, syn.t);
        if (Number.isFinite(vSynk)) vid.push(vSynk);
      });
      const vidStat = medelOchSpridning(vid);
      kurvor.push({
        nyckel: `${nyckel}.${axel}`,
        storhet: nyckel,
        axel,
        text: `${rubrik}, ${axlar[axel].namn}`,
        enhet: axlar[axel].enhet || '',
        linjer,
        vidSynk: { medel: vidStat.medel, spridning: vidStat.spridning },
        punkter: grid.map((u, gi) => {
          const stat = medelOchSpridning(hinkar[gi]);
          return { u, medel: stat.medel, spridning: stat.spridning };
        })
      });
    }
  }

  return {
    antal: lista.length,
    synk: synkTyp,
    synkLage,
    u0: uMin,
    u1: uMax,
    skalara,
    rang,
    kurvor,
    ids: lista.map((ins) => ins.id)
  };
}

export function byggProfil(inspelningar, kategori, config) {
  const lista = (inspelningar || []).filter((ins) => ins?.sampel?.length);
  const jam = jamforInspelningar(lista, config || {});
  const signaturText = lista.length ? signatur(lista[0], kategori?.faktorer || [], null) : '';
  return {
    version: PROFIL_VERSION,
    id: idForProfil(kategori?.id, signaturText),
    kategoriId: kategori?.id || null,
    signatur: signaturText,
    text: lista.length ? valText(lista[0], kategori) : 'Utan val',
    antal: jam.antal,
    synk: jam.synk,
    synkLage: jam.synkLage,
    skalara: jam.skalara.map((s) => ({
      nyckel: s.nyckel,
      text: s.text,
      enhet: s.enhet,
      medel: runda(s.medel),
      spridning: runda(s.spridning),
      variationskoefficient: runda(s.variationskoefficient)
    })),
    kurvor: jam.kurvor.map((k) => ({
      nyckel: k.nyckel,
      storhet: k.storhet,
      text: k.text,
      enhet: k.enhet,
      punkter: k.punkter.map((p) => ({
        u: runda(p.u),
        medel: runda(p.medel),
        spridning: runda(p.spridning)
      }))
    }))
  };
}

export function avstandTillProfil(inspelning, profil, config) {
  const cfg = config || {};
  const eg = beraknaEgenskaper(inspelning || {}, cfg);
  const per = [];
  for (const rad of profil?.skalara || []) {
    const v = eg.varden[rad.nyckel]?.varde;
    if (!Number.isFinite(v) || !Number.isFinite(rad.medel)) continue;
    const spr = Number.isFinite(rad.spridning) && rad.spridning > 1e-6 ? rad.spridning : minAbs(rad.enhet, cfg);
    const golv = spr > 1e-6 ? spr : 1;
    per.push({ nyckel: rad.nyckel, z: Math.abs(v - rad.medel) / golv });
  }
  if (!per.length) return { avstand: null, antal: 0, perEgenskap: [] };
  const avstand = per.reduce((sum, rad) => sum + rad.z, 0) / per.length;
  return { avstand, antal: per.length, perEgenskap: per };
}

export function narmasteProfil(inspelning, profiler, config) {
  const kandidater = (profiler || []).filter((p) => !inspelning?.kategoriId || p.kategoriId === inspelning.kategoriId);
  let bast = null;
  for (const p of kandidater) {
    const s = avstandTillProfil(inspelning, p, config);
    if (!Number.isFinite(s.avstand)) continue;
    if (!bast || s.avstand < bast.avstand) bast = { profilId: p.id, text: p.text || '', avstand: s.avstand };
  }
  return bast;
}
