import { readFileSync } from 'node:fs';
import { beraknaEgenskaper, jamforBibliotek, traningsrader } from './analys.js';
import {
  byggExport, bytNamnFaktor, bytNamnKategori, bytNamnUnderval, bytNamnVal,
  giltigtVal, laggTillFaktor, laggTillUnderval, laggTillVal, lasImport,
  skapaKategori, slahopImport, taBortFaktor, taBortKategori, taBortUnderval, taBortVal
} from './bibliotek.js';
import { arSlutOrd, klippSvans, vinkelSkillnad } from './motor.js';

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

if (fel.length) {
  console.error(`\n${fel.length} fel: ${fel.join('; ')}`);
  process.exit(1);
}
console.log('\nalla självt tester gröna');
