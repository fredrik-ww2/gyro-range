import { readFileSync } from 'node:fs';
import {
  avstandTillProfil, beraknaEgenskaper, byggProfil, grupperaExakt, jamforBibliotek,
  jamforInspelningar, narmasteProfil, traningsrader
} from './analys.js';
import {
  byggExport, bytNamnFaktor, bytNamnKategori, bytNamnUnderval, bytNamnVal,
  giltigtVal, laggTillFaktor, laggTillUnderval, laggTillVal, lasImport,
  skapaKategori, slahopImport, taBortFaktor, taBortKategori, taBortUnderval, taBortVal
} from './bibliotek.js';
import { arSlutOrd, klippSvans, medelOchSpridning, vardeVid, vinkelSkillnad } from './motor.js';

const config = JSON.parse(readFileSync(new URL('./config.json', import.meta.url), 'utf8'));
const fel = [];
const krav = (namn, ok, extra) => {
  if (!ok) fel.push(extra ? `${namn} (${extra})` : namn);
  console.log(`${ok ? 'ok ' : 'FEL'} ${namn}${extra && !ok ? ' ' + extra : ''}`);
};

krav('svans i config', config.svansSek === 0.4);
krav('ordet slut', arSlutOrd('Nu är det slut.', 'slut'));
krav('inte slutet', !arSlutOrd('slutet var långt', 'slut'));
krav('inte avslut', !arSlutOrd('avslut', 'slut'));
const klippt = klippSvans([{ t: 0, rot: [1] }, { t: 0.5 }, { t: 1.0 }], 1, 0.4);
krav('klipper svansen', klippt.length === 2 && klippt.at(-1).t === 0.5, String(klippt.map((s) => s.t)));
const hopp = vinkelSkillnad([10, 0, 0], [350, 0, 0]);
krav('vinkel över noll', Math.abs(hopp[0] - 20) < 0.001, String(hopp[0]));

const kategorier = [];
const inspelningar = [];
krav('tomt namn', !skapaKategori(kategorier, '  ').ok);
const bord = skapaKategori(kategorier, 'Bordtennis');
krav('kategori', bord.ok);
krav('dublett', skapaKategori(kategorier, 'bordtennis').fel === 'finns');
krav('byt kategori', bytNamnKategori(kategorier, bord.kategori.id, 'Pingis').ok);
const extra = laggTillFaktor(kategorier, bord.kategori.id, 'Extra');
krav('faktor', extra.ok);
krav('byt faktor', bytNamnFaktor(kategorier, bord.kategori.id, extra.faktor.id, 'Övrigt').ok);
krav('ta bort faktor', taBortFaktor(kategorier, inspelningar, bord.kategori.id, extra.faktor.id).ok);
const slag = laggTillFaktor(kategorier, bord.kategori.id, 'Slag');
const fore = laggTillVal(kategorier, bord.kategori.id, slag.faktor.id, 'Forehand');
krav('byt val', bytNamnVal(kategorier, bord.kategori.id, slag.faktor.id, fore.val.id, 'Forehand gammal').ok);
krav('ta bort val', taBortVal(kategorier, inspelningar, bord.kategori.id, slag.faktor.id, fore.val.id).ok);
const back = laggTillVal(kategorier, bord.kategori.id, slag.faktor.id, 'Backhand');
const skruv = laggTillFaktor(kategorier, bord.kategori.id, 'Skruv');
const slice = laggTillVal(kategorier, bord.kategori.id, skruv.faktor.id, 'Slice');
const ingen = laggTillVal(kategorier, bord.kategori.id, skruv.faktor.id, 'Ingen');
const under = laggTillUnderval(kategorier, bord.kategori.id, skruv.faktor.id, slice.val.id, 'Lätt');
krav('underval', under.ok);
krav('byt underval', bytNamnUnderval(kategorier, bord.kategori.id, skruv.faktor.id, slice.val.id, under.under.id, 'Liten').ok);
krav('ta bort underval', taBortUnderval(kategorier, inspelningar, bord.kategori.id, skruv.faktor.id, slice.val.id, under.under.id).ok);
krav('inga underval kvar', slice.val.underval.length === 0);

const bort = skapaKategori(kategorier, 'Bort');
krav('ta bort kategori', taBortKategori(kategorier, inspelningar, bort.kategori.id).ok);
krav('en kategori kvar', kategorier.length === 1 && kategorier[0].namn === 'Pingis');

function bygg(id, alpha, val) {
  const sampel = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    sampel.push({
      t,
      rot: [alpha, 5, -2],
      acc: [alpha / 100, 0.1, 0],
      accG: [0.1, 0.2, -9.8],
      vinkel: [t * 10, 2, -1],
      skarm: 0
    });
  }
  return {
    id,
    kategoriId: bord.kategori.id,
    val,
    sampel,
    langdSek: 1,
    avslut: 'slut'
  };
}

const valSlice = {
  [slag.faktor.id]: { valId: back.val.id, undervalId: null },
  [skruv.faktor.id]: { valId: slice.val.id, undervalId: null }
};
const valIngen = {
  [slag.faktor.id]: { valId: back.val.id, undervalId: null },
  [skruv.faktor.id]: { valId: ingen.val.id, undervalId: null }
};
const alla = [
  bygg('a', 300, valSlice),
  bygg('b', 300, valSlice),
  bygg('c', 20, valIngen)
];
for (const ins of alla) ins.egenskaper = beraknaEgenskaper(ins, config);
const svar = jamforBibliotek(alla, kategorier, config);
krav('lika märkta', svar.identiska.length === 1 && svar.identiska[0].antal === 2);
krav('en faktor', svar.enFaktorSkiljer.length === 1, String(svar.enFaktorSkiljer.length));
const fynd = svar.enFaktorSkiljer[0];
krav('faktorn är skruv', fynd?.faktorNamn === 'Skruv');
krav('skillnad finns', (fynd?.skillnader.length || 0) > 0);
krav('vridning skiljer mest', !!fynd?.skillnader[0]?.nyckel?.startsWith('rot.'), fynd?.skillnader[0]?.nyckel);
const rader = traningsrader(alla, config);
krav('träningsrader', rader.length === 3 && rader[0].x.length === rader[0].namn.length);

const giltigt = giltigtVal(kategorier[0], { ...valSlice, saknas: { valId: 'borta', undervalId: null } });
krav('ogiltigt val faller bort', !giltigt.saknas && giltigt[slag.faktor.id].valId === back.val.id);

const fil = byggExport({ kategorier, inspelningar: alla, senast: { kategoriId: bord.kategori.id, val: valSlice }, tid: '2026-11-13T00:00:00.000Z' });
const inlast = lasImport(JSON.parse(JSON.stringify(fil)));
krav('export läses', inlast.inspelningar.length === 3 && inlast.kategorier[0].namn === 'Pingis');
const hop = slahopImport({ kategorier: [], inspelningar: [], senast: null }, inlast);
krav('import slås ihop', hop.nyaIns === 3 && hop.nyaKat === 1);

const v1 = lasImport({
  format: 'ww2-rorelse',
  version: 1,
  gester: [{ id: 'g1', namn: 'backhand', exempel: [{ id: 'e1', sampel: [{ t: 0, rot: [1, 0, 0], acc: [0, 0, 0], accG: [0, 0, -9], vinkel: [1, 2, 3] }] }] }]
});
krav('version 1', v1.kategorier[0].namn === 'Tidigare rörelser' && v1.inspelningar.length === 1);
let kast = false;
try { lasImport({ format: 'annat' }); } catch (e) { kast = e.kod === 'format'; }
krav('fel format', kast);

// Toppvärden 10, 20, 30, 40 och 50.
// Medel = 150/5 = 30.
// Avvikelser −20, −10, 0, 10, 20. Kvadratsumma 400+100+0+100+400 = 1000.
// Stickprovets standardavvikelse = sqrt(1000 / 4) = sqrt(250).
const handMedel = 30;
const handSpridning = Math.sqrt(250);
const handStat = medelOchSpridning([10, 20, 30, 40, 50]);
krav('handräknat medel', handStat.medel === handMedel, String(handStat.medel));
krav('handräknad spridning', Math.abs(handStat.spridning - handSpridning) < 1e-12, String(handStat.spridning));
krav('inte delat med n', Math.abs(handStat.spridning - Math.sqrt(200)) > 1);
krav('ett värde saknar spridning', medelOchSpridning([4]).spridning === null && medelOchSpridning([4]).medel === 4);
krav('interpolera mitt', vardeVid([{ t: 0, v: 0 }, { t: 1, v: 10 }], 0.5) === 5);
krav('interpolera utanför', vardeVid([{ t: 0, v: 0 }, { t: 1, v: 10 }], 1.5) === null);

const demo = skapaKategori(kategorier, 'Demo');
const demoId = demo.kategori.id;
function faktorMed(namn, valNamn) {
  const f = laggTillFaktor(kategorier, demoId, namn).faktor;
  const val = {};
  for (const n of valNamn) val[n] = laggTillVal(kategorier, demoId, f.id, n).val;
  return { faktor: f, val };
}
const slagF = faktorMed('Slag', ['Backhand']);
const tempoF = faktorMed('Tempo', ['Mjukt slag']);
const hojdF = faktorMed('Höjd', ['Hög']);
const typF = faktorMed('Typ', ['Kross']);
const skruvF = faktorMed('Skruv', ['Kraftig slice']);
const traffF = faktorMed('Träff', ['Ej miss', 'Miss']);
const latt = laggTillUnderval(kategorier, demoId, skruvF.faktor.id, skruvF.val['Kraftig slice'].id, 'Lätt');
function valAv(traffNamn, underId, medTraff = true) {
  const val = {
    [slagF.faktor.id]: { valId: slagF.val.Backhand.id, undervalId: null },
    [tempoF.faktor.id]: { valId: tempoF.val['Mjukt slag'].id, undervalId: null },
    [hojdF.faktor.id]: { valId: hojdF.val.Hög.id, undervalId: null },
    [typF.faktor.id]: { valId: typF.val.Kross.id, undervalId: null },
    [skruvF.faktor.id]: { valId: skruvF.val['Kraftig slice'].id, undervalId: underId || null }
  };
  if (medTraff) val[traffF.faktor.id] = { valId: traffF.val[traffNamn].id, undervalId: null };
  return val;
}
function triangel(id, topp, val, kategoriId) {
  const sampel = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const f = i <= 10 ? i / 10 : (20 - i) / 10;
    sampel.push({
      t,
      rot: [topp * f, 2 * f, -f],
      acc: [0.4 * f, 0.1 * f, 0],
      accG: [0.2 * f, 0.2, -9.8],
      vinkel: [8 * f, f, -0.5 * f],
      skarm: 0
    });
  }
  return { id, kategoriId, val, sampel, langdSek: 1, avslut: 'slut' };
}
const valA = valAv('Ej miss', null);
const valB = valAv('Miss', null);
const toppA = [10, 20, 30, 40, 50];
const gruppA = toppA.map((topp, i) => triangel(`a${i}`, topp, valA, demoId));
const gruppB = [200, 220, 240, 260].map((topp, i) => triangel(`b${i}`, topp, valB, demoId));
const medLatt = triangel('latt', 10, valAv('Ej miss', latt.under.id), demoId);
const utanTraff = triangel('tom', 10, valAv('Ej miss', null, false), demoId);
const annanKat = triangel('annan', 10, valA, 'annan-kategori');
const demoKat = kategorier.find((k) => k.id === demoId);
const grupper = grupperaExakt([...gruppA, ...gruppB, medLatt, utanTraff, annanKat], demoKat);
const textA = 'Backhand · Mjukt slag · Hög · Kross · Kraftig slice · Ej miss';
const gruppFem = grupper.find((g) => g.text === textA);
krav('exakt grupptext', !!gruppFem, grupper.map((g) => `${g.antal}:${g.text}`).join(' | '));
krav('fem i gruppen', gruppFem?.antal === 5);
krav('fyra i den andra', grupper.some((g) => g.antal === 4 && g.text === 'Backhand · Mjukt slag · Hög · Kross · Kraftig slice · Miss'));
krav('underval är egen grupp', grupper.some((g) => g.antal === 1 && g.text === 'Backhand · Mjukt slag · Hög · Kross · Kraftig slice · Lätt · Ej miss'));
krav('saknat val är eget', grupper.some((g) => g.text === 'Backhand · Mjukt slag · Hög · Kross · Kraftig slice · Ej valt'));
krav('annan kategori blandas inte', grupper.length === 4 && !grupper.some((g) => g.ids.includes('annan')));

const jam = jamforInspelningar(gruppA, config);
const topp = jam.skalara.find((s) => s.nyckel === 'rot.0.topp');
krav('jämförelsens medel', Math.abs(topp.medel - handMedel) < 1e-9, String(topp?.medel));
krav('jämförelsens spridning', Math.abs(topp.spridning - handSpridning) < 1e-9, String(topp?.spridning));
const vidTopp = jam.kurvor.find((k) => k.nyckel === 'rot.0')?.punkter.find((p) => p.u === jam.synkLage);
krav('bandets medel vid toppen', Math.abs(vidTopp?.medel - handMedel) < 1e-9, String(vidTopp?.medel));
krav('bandets spridning vid toppen', Math.abs(vidTopp?.spridning - handSpridning) < 1e-9, String(vidTopp?.spridning));
const langd = jam.skalara.find((s) => s.nyckel === 'langdSek');
krav('längden är stabil', langd?.spridning === 0 && langd?.variationskoefficient === 0);
krav('toppen varierar mer än längden', topp.variationskoefficient > langd.variationskoefficient);
krav('rangordning faller', jam.rang.varierar.every((s, i, arr) => i === 0 || arr[i - 1].variationskoefficient >= s.variationskoefficient));
krav('synk på toppen', jam.synk === 'topp');

const cfgStart = {
  ...config,
  monster: { ...config.monster, synk: 'start', synkLage: 0.05, startTroskel: 0.12, antalPunkter: 40 }
};
const jamStart = jamforInspelningar(gruppA, cfgStart);
const startVid = jamStart.kurvor.find((k) => k.nyckel === 'rot.0')?.vidSynk;
// Första sampel där styrkan når 12 % av toppen är t = 0,1 och värdet är 20 % av toppvärdet: 2, 4, 6, 8, 10.
// Medel 6. Spridning sqrt((16+4+0+4+16)/4) = sqrt(10).
krav('start-synk', jamStart.synk === 'start');
krav('startens medel', Math.abs(startVid?.medel - 6) < 1e-6, String(startVid?.medel));
krav('startens spridning', Math.abs(startVid?.spridning - Math.sqrt(10)) < 1e-6, String(startVid?.spridning));

const profil = byggProfil(gruppA, demoKat, config);
const profilTopp = profil.skalara.find((s) => s.nyckel === 'rot.0.topp');
krav('profilens medel', profilTopp?.medel === handMedel);
krav('profilens spridning', Math.abs(profilTopp.spridning - Math.round(handSpridning * 1000) / 1000) < 1e-9, String(profilTopp?.spridning));
krav('samma profil igen', byggProfil(gruppA, demoKat, config).id === profil.id);
const profilKurva = profil.kurvor.find((k) => k.nyckel === 'rot.0');
krav('profilens band', !!profilKurva?.punkter.some((p) => p.medel === handMedel));
const nara = triangel('nara', 30, valA, demoId);
const fjar = triangel('fjar', 400, valA, demoId);
const an = avstandTillProfil(nara, profil, config);
const af = avstandTillProfil(fjar, profil, config);
krav('närmare medelvärdet', Number.isFinite(an.avstand) && an.avstand < af.avstand, `${an.avstand} mot ${af.avstand}`);
const profilB = byggProfil(gruppB, demoKat, config);
krav('närmaste mönster', narmasteProfil(nara, [profilB, profil], config)?.profilId === profil.id);
krav('annan kategori ignoreras', narmasteProfil(nara, [{ ...profil, id: 'annan|x', kategoriId: 'annan' }], config) === null);

const filProfil = byggExport({
  kategorier, inspelningar: gruppA, profiler: [profil], senast: null, tid: '2026-11-13T00:00:00.000Z'
});
const inProfil = lasImport(JSON.parse(JSON.stringify(filProfil)));
krav('profil i filen', inProfil.profiler.length === 1 && inProfil.profiler[0].id === profil.id && inProfil.profiler[0].skalara.length > 0);
krav('gammal fil utan mönster', Array.isArray(inlast.profiler) && inlast.profiler.length === 0);
const hopProfil = slahopImport({ kategorier: [], inspelningar: [], senast: null, profiler: [] }, inProfil);
krav('profil slås ihop', hopProfil.nyaProfil === 1 && hopProfil.profiler[0].text === textA);

if (fel.length) {
  console.error(`\n${fel.length} fel: ${fel.join('; ')}`);
  process.exit(1);
}
console.log('\nalla självt tester gröna');
