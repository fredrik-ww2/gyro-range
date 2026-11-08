/* Läser datapaketet och lägger användarens sparade ändringar ovanpå. */

import { lasOverrid } from './spara.js';

const DATA = new URL('../data/', import.meta.url);

export const MAPP_NAMN = {
  varldar: 'Världar',
  stilar: 'Stilar',
  'enheter/klara': 'Klara',
  'enheter/under_utveckling/1_nastan_klar': 'Nästan klar',
  'enheter/under_utveckling/2_halvvags': 'Halvvägs',
  'enheter/under_utveckling/3_tidigt_skede': 'Tidigt skede',
  forband: 'Förband',
  intelligens: 'Intelligens',
  regler: 'Regler',
  scenarier: 'Scenarier',
  resultat: 'Resultat'
};

export const NIVA_NAMN = {
  '1_nastan_klar': 'Nästan klar',
  '2_halvvags': 'Halvvägs',
  '3_tidigt_skede': 'Tidigt skede'
};

export const TERRANG = [
  ['vag', 'väg'],
  ['falt', 'fält'],
  ['skog', 'skog'],
  ['by', 'by']
];

const cache = new Map();

async function json(url) {
  const svar = await fetch(url);
  if (!svar.ok) throw new Error('Kunde inte läsa ' + url.pathname);
  return svar.json();
}

export function hamtaIndex() {
  if (!cache.has('index')) cache.set('index', json(new URL('index.json', DATA)));
  return cache.get('index');
}

export function hamtaBeteende() {
  if (!cache.has('beteende')) cache.set('beteende', json(new URL('beteende/standard.json', DATA)));
  return cache.get('beteende');
}

export function enhetAdress(fil) {
  return new URL(fil, DATA);
}

export async function hamtaEnhet(fil) {
  if (!cache.has(fil)) cache.set(fil, json(enhetAdress(fil)));
  const original = await cache.get(fil);
  const overrid = await lasOverrid(original.id).catch(() => null);
  return { original, overrid: overrid || tomOverrid(original.id), visning: tillämpa(original, overrid) };
}

export function tomOverrid(id) {
  return { schema: 'form.verkstad.overrid.v1', enhet: id, spelvarden: {}, beteende: {} };
}

export function tillämpa(original, overrid) {
  const kopia = structuredClone(original);
  const spel = overrid?.spelvarden || {};
  for (const [sokvag, patch] of Object.entries(spel)) {
    const nod = hamta(kopia.spelvarden, sokvag);
    if (!nod || patch?.varde == null) continue;
    nod.varde = patch.varde;
    nod.ursprung = patch.ursprung || nod.ursprung;
    if (patch.andringshistorik) nod.andringshistorik = patch.andringshistorik;
  }
  return kopia;
}

export function hamta(obj, sokvag) {
  return sokvag.split('.').reduce((nu, del) => nu?.[del], obj);
}

export function lattasteModell(modeller) {
  const lista = (modeller || []).filter((modell) => modell?.fil);
  if (!lista.length) return null;
  return lista.slice().sort((a, b) => (a.trianglar ?? 1e12) - (b.trianglar ?? 1e12) || (a.bytes || 0) - (b.bytes || 0))[0];
}

export function modellAdress(enhetFil, modellFil) {
  return new URL(modellFil, enhetAdress(enhetFil));
}

export function tal(varde, decimaler) {
  const nummer = Number(varde);
  if (!Number.isFinite(nummer)) return '–';
  const max = decimaler ?? (Math.abs(nummer) >= 100 || Number.isInteger(nummer) ? 0 : 1);
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: max, minimumFractionDigits: 0 }).format(nummer);
}

export function fartSammanfattning(fart) {
  const rader = TERRANG.map(([nyckel, namn]) => ({
    nyckel,
    namn,
    varde: Number(fart?.[nyckel]?.varde) || 0
  }));
  const snabb = rader.slice().sort((a, b) => b.varde - a.varde)[0];
  const langsam = rader.slice().sort((a, b) => a.varde - b.varde)[0];
  if (!snabb || snabb.varde <= 0) return 'Ingen fart angiven';
  if (snabb.varde === langsam.varde) return `Samma fart överallt, ${tal(snabb.varde)} km/h`;
  if (snabb.nyckel === 'vag' && langsam.varde <= snabb.varde * 0.55) {
    const plats = langsam.nyckel === 'by' ? 'bebyggelse' : langsam.namn;
    return `Snabb på väg, långsam i ${plats}`;
  }
  const snabbOrd = snabb.nyckel === 'vag' ? 'på väg' : `i ${snabb.namn}`;
  const langsamOrd = langsam.nyckel === 'vag' ? 'på väg' : `i ${langsam.namn}`;
  return `Snabbast ${snabbOrd}, långsammast ${langsamOrd}`;
}

export function svarAndel(meter) {
  return Math.max(0, Math.min(1, 1 - (Number(meter) || 0) / 2000));
}

export function stapelAndel(sokvag, varde, max) {
  const nummer = Math.max(0, Number(varde) || 0);
  const tak = max || 1;
  if (String(sokvag).includes('eldhastighet')) return Math.log1p(nummer) / Math.log1p(tak);
  return Math.max(0, Math.min(1, nummer / tak));
}

export function reglageTak(sokvag, varde) {
  const nummer = Number(varde) || 0;
  if (sokvag.startsWith('fart_per_terrang')) return Math.max(120, nummer);
  if (sokvag.includes('kaliber')) return Math.max(400, nummer);
  if (sokvag.includes('eldhastighet')) return Math.max(1500, nummer);
  if (sokvag.startsWith('pansar')) return Math.max(200, nummer);
  if (sokvag === 'rackvidd') return Math.max(4000, nummer);
  if (sokvag === 'upptackbarhet') return Math.max(3000, nummer);
  if (sokvag.startsWith('traffchans_per_avstand')) return 1;
  return Math.max(nummer, 1);
}

export function reglageSteg(enhet) {
  if (enhet === 'andel') return 0.01;
  if (enhet === 'skott/min' || enhet === 'val') return 1;
  if (enhet === 'm') return 1;
  return 0.1;
}

export const NATION_ORDNING = [
  'USA', 'Storbritannien', 'Kanada', 'Tyskland', 'Sovjetunionen', 'Polen', 'Frankrike', 'Japan', 'Italien'
];

export const TRUPP_ORDNING = [
  'Infanteri', 'Stridsvagn', 'Pansarvärn', 'Artilleri', 'Luftvärn', 'Fordon', 'Rekognosering', 'Flyg', 'Utrustning', 'Övrigt'
];

const NATION_VISNING = {
  Sovjet: 'Sovjetunionen',
  USSR: 'Sovjetunionen',
  gemensam: 'Gemensam'
};

export function nationVisning(nation) {
  return NATION_VISNING[nation] || nation || 'Okänd';
}

export function truppVisning(enhet) {
  const kategori = enhet?.kategori || '';
  if (/Stridsvagn/i.test(kategori)) return 'Stridsvagn';
  if (/Infanteri/i.test(kategori)) return 'Infanteri';
  if (/Pansarvärn/i.test(kategori)) return 'Pansarvärn';
  if (/Artilleri|granatkast/i.test(kategori)) return 'Artilleri';
  if (/Luftvärn/i.test(kategori)) return 'Luftvärn';
  if (/Transport|halvband/i.test(kategori)) return 'Fordon';
  if (/Rekog/i.test(kategori)) return 'Rekognosering';
  if (/Flyg/i.test(kategori)) return 'Flyg';
  if (/Utrustning/i.test(kategori)) return 'Utrustning';
  if (enhet?.typ === 'soldat') return 'Infanteri';
  if (enhet?.typ === 'fordon') return 'Fordon';
  return 'Övrigt';
}

const HUVUDVARDEN = [
  'fart_per_terrang.vag', 'fart_per_terrang.falt', 'fart_per_terrang.skog', 'fart_per_terrang.by',
  'eldkraft.kaliber_mm', 'eldkraft.eldhastighet_skott_min',
  'pansar.fram', 'pansar.sida', 'pansar.bak', 'pansar.topp',
  'rackvidd', 'upptackbarhet',
  'traffchans_per_avstand.100', 'traffchans_per_avstand.250', 'traffchans_per_avstand.500',
  'traffchans_per_avstand.1000', 'traffchans_per_avstand.1500', 'traffchans_per_avstand.2000'
];

function harText(saknas, monster) {
  return (saknas || []).some((rad) => monster.test(rad));
}

function harModell(enhet) {
  return (enhet.modeller || []).some((modell) => modell?.fil);
}

function harLod(enhet) {
  if (harText(enhet.saknas, /LOD-kedja/i)) return false;
  const modeller = enhet.modeller || [];
  if (modeller.length < 2) return false;
  const lod = modeller.some((modell) => modell.lod != null);
  const nivaer = new Set(modeller.map((modell) => modell.trianglar)).size;
  return lod || nivaer >= 2;
}

function harMobil(enhet) {
  return (enhet.modeller || []).some((modell) => {
    const namn = modell.fil || '';
    const latt = (modell.trianglar || 1e9) <= 12000 && (modell.bytes || 1e9) < 3000000;
    return latt || /ios|mobil|_m_/i.test(namn);
  });
}

function antalUppskattade(enhet) {
  return HUVUDVARDEN.filter((sokvag) => hamta(enhet.spelvarden || {}, sokvag)?.ursprung === 'uppskattat').length;
}

function animationBehovs(enhet) {
  if (harText(enhet.saknas, /animation/i)) return true;
  const trupp = truppVisning(enhet);
  return trupp === 'Infanteri' || trupp === 'Stridsvagn' || trupp === 'Fordon' || trupp === 'Rekognosering';
}

function fastpunkterKlara(enhet) {
  const punkter = Object.values(enhet.fastpunkter || {}).filter((punkt) => punkt?.tillamplig !== false);
  if (!punkter.length) return !harText(enhet.saknas, /fastpunkt/i);
  return punkter.every((punkt) => punkt.position_m);
}

/** Checklista för steg 1. Mappen räknas här, inte från indexets hårdkodade nivå. */
export function checklista(enhet) {
  const uppskattade = antalUppskattade(enhet);
  const modell = harModell(enhet);
  const lod = harLod(enhet);
  const mobil = harMobil(enhet);
  const animationSaknas = harText(enhet.saknas, /animation/i);
  const animationRelevant = animationBehovs(enhet);
  const punkter = [
    { id: 'modell', ok: modell, text: '3D-modell finns' },
    { id: 'lod', ok: lod, text: 'LOD-kedja' },
    { id: 'mobil', ok: mobil, text: 'Mobilanpassad' },
    {
      id: 'varden',
      ok: uppskattade === 0,
      text: uppskattade === 0
        ? 'Alla huvudvärden har källa eller är godkända av dig'
        : `Alla huvudvärden har källa eller är godkända av dig (${uppskattade} uppskattade kvar)`
    },
    { id: 'skada', ok: false, text: 'Skada och genomslag' },
    { id: 'ljud', ok: !harText(enhet.saknas, /ljud/i), text: 'Ljud' },
    {
      id: 'fast',
      ok: fastpunkterKlara(enhet),
      text: 'Effektfästpunkter'
    },
    {
      id: 'animation',
      ok: animationRelevant ? !animationSaknas : true,
      text: animationRelevant ? 'Animation' : 'Animation behövs inte för den här typen'
    },
    { id: 'provspel', ok: !harText(enhet.saknas, /provspelad/i), text: 'Provspelad' },
    { id: 'iphone', ok: !harText(enhet.saknas, /iPhone/i), text: 'Granskad på riktig iPhone' }
  ];
  const mjuka = new Set(['varden', 'ljud', 'provspel', 'iphone', 'skada', 'fast']);
  const alla = punkter.every((punkt) => punkt.ok);
  const port = modell && lod && mobil;
  const hartOppet = punkter.some((punkt) => !punkt.ok && !mjuka.has(punkt.id));
  let niva = '3_tidigt_skede';
  if (alla) niva = 'klar';
  else if (port && !hartOppet) niva = '1_nastan_klar';
  else if (modell) niva = '2_halvvags';
  const klara = punkter.filter((punkt) => punkt.ok).length;
  return { punkter, niva, uppskattade, klara, totalt: punkter.length, status: niva === 'klar' ? 'klar' : 'under_utveckling' };
}

export function statusNamn(status) {
  if (status === 'klar') return 'Klar';
  return 'Under utveckling';
}

export function markeText(ursprung) {
  if (ursprung === 'kalla') return 'källa';
  if (ursprung === 'anvandarbestamd') return 'bestämd av dig';
  return 'uppskattat';
}

export function ritaChecklista(check, extra = '') {
  const punkter = check.punkter.map((punkt) => `<li class="${punkt.ok ? 'ok' : 'saknas'}" data-punkt="${punkt.id}" data-ok="${punkt.ok}"><span aria-hidden="true">${punkt.ok ? '✓' : '○'}</span> ${esc(punkt.text)}</li>`).join('');
  return `<section class="checklista ${extra}" data-saknas data-checklista>
    <h2>Saknas för att bli klar</h2>
    <p class="fin">${check.klara} av ${check.totalt}. ${check.uppskattade} huvudvärden är fortfarande uppskattade.</p>
    <ul>${punkter}</ul>
  </section>`;
}

export async function hamtaRaa(fil) {
  if (!cache.has(fil)) cache.set(fil, json(enhetAdress(fil)));
  return cache.get(fil);
}

export async function byggKatalog(index) {
  const rader = new Array(index.enheter.length);
  let pekare = 0;
  async function arbetare() {
    while (pekare < index.enheter.length) {
      const indexRad = pekare;
      pekare += 1;
      const post = index.enheter[indexRad];
      const enhet = await hamtaRaa(post.fil);
      rader[indexRad] = { enhet, check: checklista(enhet) };
    }
  }
  await Promise.all(Array.from({ length: 10 }, arbetare));
  return rader;
}

export function esc(text) {
  return String(text ?? '').replace(/[&<>"']/g, (tecken) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[tecken]));
}
