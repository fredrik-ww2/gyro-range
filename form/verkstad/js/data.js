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

function riktigaModeller(modeller) {
  return (modeller || []).filter((modell) => modell?.fil && modell.roll !== 'impostor' && (modell.trianglar || 0) > 80 && !/_bb\.glb$/i.test(modell.fil));
}

function kvantiserad(modell) {
  return (modell?.extensioner || []).some((namn) => /quantization/i.test(namn));
}

/** Närbild föredrar okvantiserad källfil. Kvantiserad mobil-LOD har förskjutit delar på en del fordon. */
export function placeringsNivaer(modeller) {
  const lista = riktigaModeller(modeller);
  const mobil = lista.find((modell) => modell.anvandning === 'mobil' || /_mobil\.glb$/i.test(modell.fil)) || null;
  const enkel = lista.find((modell) => modell.anvandning === 'enkel' || /_enkel\.glb$/i.test(modell.fil)) || null;
  const kalla = lista
    .filter((modell) => !kvantiserad(modell) && modell !== enkel && (modell.trianglar || 0) <= 20000)
    .sort((a, b) => (b.trianglar || 0) - (a.trianglar || 0))[0] || null;
  const latt = lista
    .filter((modell) => modell !== mobil && modell !== enkel && (modell.trianglar || 0) <= 20000)
    .sort((a, b) => (a.trianglar || 1e12) - (b.trianglar || 1e12))[0] || null;
  const nar = kalla || mobil || latt;
  let fjarr = enkel || mobil || kalla || latt;
  /* En kvantiserad kopia med nästan samma triangelantal är inte en enklare LOD.
     Den har förskjutit delar. Behåll då samma okvantiserade närbild. */
  if (fjarr && nar && fjarr !== nar && kvantiserad(fjarr) && !kvantiserad(nar)) {
    const andel = (fjarr.trianglar || 0) / Math.max(1, nar.trianglar || 1);
    if (andel >= 0.85) fjarr = nar;
  }
  return { mobil: nar, enkel: fjarr };
}

/** Riktig nätmodell för utplacering. Hoppar över platta billboards om en mesh finns. */
export function placeringsModell(modeller) {
  return placeringsNivaer(modeller).mobil;
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

export const STATUS_MAPPAR = [
  { id: 'fardiga', namn: 'Färdiga', nivaer: ['klar'] },
  { id: 'nastan', namn: 'Nästan färdiga', nivaer: ['1_nastan_klar'] },
  { id: 'utveckling', namn: 'Under utveckling', nivaer: ['2_halvvags', '3_tidigt_skede'] }
];

export const LAND_ORDNING = ['USA', 'Tyskland', 'Övriga'];

export const VAPEN_ORDNING = [
  'Infanteri', 'Kulsprutor', 'Pansarvärn', 'Artilleri', 'Stridsvagnar', 'Fordon', 'Övrigt'
];

export function statusMappId(niva) {
  if (niva === 'klar') return 'fardiga';
  if (niva === '1_nastan_klar') return 'nastan';
  return 'utveckling';
}

export function landMapp(nation) {
  const namn = nationVisning(nation);
  if (namn === 'USA' || namn === 'Tyskland') return namn;
  return 'Övriga';
}

export function vapenslag(enhet) {
  const kategori = enhet?.kategori || '';
  if (/Stridsvagn/i.test(kategori)) return 'Stridsvagnar';
  if (/Pansarvärn/i.test(kategori)) return 'Pansarvärn';
  if (/Artilleri|granatkast/i.test(kategori)) return 'Artilleri';
  if (/Transport|halvband/i.test(kategori)) return 'Fordon';
  if (/Rekog/i.test(kategori) && enhet?.typ === 'fordon') return 'Fordon';
  if (arKulspruta(enhet)) return 'Kulsprutor';
  if (/Infanteri/i.test(kategori) || enhet?.typ === 'soldat') return 'Infanteri';
  if (enhet?.typ === 'fordon') return 'Fordon';
  return 'Övrigt';
}

function arKulspruta(enhet) {
  const namn = enhet?.namn || '';
  if (/kulsprutepistol/i.test(namn)) return false;
  if (/kulspruta/i.test(namn)) return true;
  return /(^|[_-])(mg\d+|lmg|hmg|bren|bar_|maxim|dshk|dp27|dp28|m1917|m1919|m2hb|sg43|vickers|hotchkiss|fm2429|fg42)/i.test(enhet?.id || '');
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

function harTextur(enhet) {
  return (enhet.modeller || []).some((modell) => {
    if ((modell.material || 0) > 0) return true;
    return (modell.extensioner || []).some((namn) => /ktx|basis/i.test(namn));
  });
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

function saknasRader(enhet, monster) {
  return (enhet?.saknas || []).filter((rad) => monster.test(rad));
}

function punkt(id, ok, text) {
  return { id, ok, text };
}

/** Fästpunkt är bara en koordinat. Den säger inget om att effekten finns eller är kopplad. */
function fastpunktStatus(enhet) {
  const poster = Object.entries(enhet.fastpunkter || {}).filter(([, post]) => post?.tillamplig !== false);
  const namn = poster
    .filter(([, post]) => !post.position_m || post.status === 'saknas')
    .map(([id]) => id);
  const rader = saknasRader(enhet, /fastpunkt/i);
  if (!poster.length && !rader.length) return punkt('fastpunkter', false, 'Effektfästpunkter: Ej verifierat');
  if (namn.length || rader.length) {
    const vilka = namn.length ? namn.join(', ') : rader.join('; ');
    return punkt('fastpunkter', false, 'Effektfästpunkter saknas: ' + vilka);
  }
  return punkt('fastpunkter', true, 'Effektfästpunkter finns');
}

function effektStatus(enhet) {
  const effekter = enhet.effekter || null;
  const rader = saknasRader(enhet, /effekt/i).filter((rad) => !/fastpunkt/i.test(rad));
  const lista = []
    .concat(namnUrLista(effekter?.saknas))
    .concat(namnUrLista(effekter?.saknade))
    .concat(rader);
  const status = String(effekter?.status || '');
  const kopplade = namnUrLista(effekter?.kopplade || effekter?.kopplade_effekter);
  if (kopplade.length && /kopplad/i.test(status) && !/inte kopplat|saknas|referens/i.test(status)) {
    return punkt('effekter', true, 'Nödvändiga effekter finns och är kopplade: ' + kopplade.join(', '));
  }
  if (lista.length) return punkt('effekter', false, 'Effekter saknas eller är inte kopplade: ' + [...new Set(lista)].join('; '));
  if (status) return punkt('effekter', false, 'Effekter: ' + status);
  return punkt('effekter', false, 'Effekter: Ej verifierat');
}

function ljudStatus(enhet) {
  const ljud = enhet.ljud || null;
  const rader = saknasRader(enhet, /ljud/i);
  const lista = [].concat(namnUrLista(ljud?.saknas)).concat(namnUrLista(ljud?.saknade)).concat(rader);
  const status = String(ljud?.status || '');
  const kopplade = namnUrLista(ljud?.kopplade || ljud?.filer);
  if (kopplade.length && !lista.length && !/inte kopplat|saknas|referens/i.test(status)) {
    return punkt('ljud', true, 'Nödvändiga ljud finns och är kopplade: ' + kopplade.join(', '));
  }
  if (lista.length) return punkt('ljud', false, 'Ljud saknas eller är inte kopplade: ' + [...new Set(lista)].join('; '));
  if (status) return punkt('ljud', false, 'Ljud: ' + status);
  return punkt('ljud', false, 'Ljud: Ej verifierat');
}

function namnUrLista(lista) {
  if (!Array.isArray(lista)) return [];
  return lista.map((post) => {
    if (typeof post === 'string') return post;
    if (post && typeof post === 'object') return post.namn || post.id || post.fil || '';
    return '';
  }).filter(Boolean);
}

function animationStatus(enhet) {
  const rader = saknasRader(enhet, /animation/i);
  if (rader.length) return punkt('animation', false, 'Animation: ' + rader.join('; '));
  const klipp = (enhet.modeller || []).some((modell) => (modell.animationer || []).length > 0);
  if (klipp) return punkt('animation', true, 'Animationer finns i modellen');
  if (!animationBehovs(enhet)) return punkt('animation', true, 'Animation behövs inte för den här typen');
  return punkt('animation', false, 'Animation: Ej verifierat');
}

function iphoneStatus(enhet) {
  const godkand = enhet.iphone_prov?.riktig === true && enhet.iphone_prov?.godkand === true;
  if (godkand) return punkt('iphone', true, 'Granskad på riktig iPhone');
  const rader = saknasRader(enhet, /iphone/i);
  if (rader.length) return punkt('iphone', false, 'Riktig iPhone: ' + rader.join('; '));
  return punkt('iphone', false, 'Riktig iPhone: Ej verifierat. Simulerad mobil räknas inte.');
}

function provspelStatus(enhet) {
  const godkand = enhet.provspel?.godkand === true && enhet.provspel?.riktig_iphone === true;
  if (godkand) return punkt('provspel', true, 'Provspelad på riktig iPhone');
  const rader = saknasRader(enhet, /provspel/i);
  if (rader.length) return punkt('provspel', false, 'Provspel: ' + rader.join('; '));
  return punkt('provspel', false, 'Provspel på riktig iPhone: Ej verifierat. Simulerad mobil räknas inte.');
}

function vardenStatus(enhet) {
  const uppskattade = antalUppskattade(enhet);
  const saknade = HUVUDVARDEN.filter((sokvag) => {
    const nod = hamta(enhet.spelvarden || {}, sokvag);
    return nod?.varde == null || nod.varde === '';
  });
  if (!uppskattade && !saknade.length) return punkt('varden', true, 'Stridsvärden har källa eller är godkända av dig');
  const delar = [];
  if (saknade.length) delar.push(saknade.length + ' huvudvärden saknas');
  if (uppskattade) delar.push(uppskattade + ' huvudvärden är uppskattade');
  return punkt('varden', false, 'Stridsvärden: ' + delar.join(', '));
}

function skadaStatus(enhet) {
  const funna = [];
  (function ga(nod, stig) {
    if (!nod || typeof nod !== 'object') return;
    if (Object.prototype.hasOwnProperty.call(nod, 'varde')) {
      if (/skada|genomslag|penetration/i.test(stig)) funna.push({ stig, nod });
      return;
    }
    for (const [nyckel, barn] of Object.entries(nod)) {
      if (nyckel === 'andringshistorik') continue;
      ga(barn, stig ? stig + '.' + nyckel : nyckel);
    }
  })(enhet.spelvarden || {}, '');
  if (!funna.length) return punkt('skada', false, 'Skada och genomslag: Ej verifierat');
  const oklara = funna.filter((rad) => rad.nod.varde == null || rad.nod.varde === '' || rad.nod.ursprung === 'uppskattat');
  if (!oklara.length) return punkt('skada', true, 'Skada och genomslag har källa');
  return punkt('skada', false, 'Skada och genomslag: ' + oklara.map((rad) => rad.stig).join(', '));
}

function beteendeStatus(enhet) {
  const kopplad = enhet.beteende?.status === 'kopplad' || enhet.individregler?.status === 'kopplad';
  if (kopplad) return punkt('beteende', true, 'Individregler och beteende är kopplade');
  const profil = enhet.spelvarden?.beteendeprofil?.profil;
  if (profil) return punkt('beteende', false, 'Beteende: profilen ' + profil + ' är inte en inkopplad regel. Ej verifierat i körande kod.');
  return punkt('beteende', false, 'Beteende och individregler: Ej verifierat');
}

/**
 * Tre rubriker. Mappen följer bara rubrik 1 och 2:
 * visuellt och ljudmässigt färdig, och därefter om riktigt iPhone-prov återstår.
 * Rubrik 3 visas men flyttar inte enheten.
 */
export function checklista(enhet) {
  const uppskattade = antalUppskattade(enhet);
  const modell = harModell(enhet);
  const textur = harTextur(enhet);
  const lod = harLod(enhet);
  const mobil = harMobil(enhet);
  const grupper = [
    {
      id: 'visuellt',
      rubrik: '1. Allt visuellt och ljud',
      punkter: [
        punkt('modell', modell, modell ? '3D-modell finns' : '3D-modell saknas'),
        punkt('textur', textur, textur ? 'Texturer finns' : 'Texturer saknas'),
        punkt('lod', lod, lod ? 'LOD-kedja finns' : 'LOD-kedja saknas'),
        punkt('mobil', mobil, mobil ? 'Mobilanpassad fil finns' : 'Mobilanpassad fil saknas'),
        animationStatus(enhet),
        fastpunktStatus(enhet),
        effektStatus(enhet),
        ljudStatus(enhet)
      ]
    },
    {
      id: 'iphone',
      rubrik: '2. Provspel och test på iPhone',
      punkter: [provspelStatus(enhet), iphoneStatus(enhet)]
    },
    {
      id: 'osynligt',
      rubrik: '3. Alla stridsvärden och annat som varken syns eller hörs',
      punkter: [vardenStatus(enhet), skadaStatus(enhet), beteendeStatus(enhet)]
    }
  ];
  const punkter = grupper.flatMap((grupp) => grupp.punkter.map((post) => ({ ...post, grupp: grupp.id })));
  const synligtKlart = grupper[0].punkter.every((post) => post.ok);
  const iphoneKlart = grupper[1].punkter.every((post) => post.ok);
  let niva = '3_tidigt_skede';
  if (synligtKlart && iphoneKlart) niva = 'klar';
  else if (synligtKlart) niva = '1_nastan_klar';
  else if (modell) niva = '2_halvvags';
  const klara = punkter.filter((post) => post.ok).length;
  return {
    grupper,
    punkter,
    niva,
    uppskattade,
    klara,
    totalt: punkter.length,
    status: niva === 'klar' ? 'klar' : 'under_utveckling'
  };
}

const MOBIL_TRI = { nar: [8000, 20000], enkel: [4000, 12000], skylt: [32, 400] };

function fargMotGrans(varde, gron, gul) {
  if (varde == null || !Number.isFinite(varde)) return 'gul';
  if (varde <= gron) return 'gron';
  if (varde <= gul) return 'gul';
  return 'rod';
}

/** Mobilrad för enhetskortet. Gränserna är R62 för en enhet på iPhone, inte hela kartan. */
export function mobilRapport(enhet) {
  const modeller = enhet?.modeller || [];
  const nivaer = placeringsNivaer(modeller);
  const skylt = modeller.find((modell) => modell.roll === 'impostor' || /_bb\.glb$/i.test(modell.fil || '')) || null;
  const kedja = [
    ['Närbild', nivaer.mobil, MOBIL_TRI.nar],
    ['Enkel', nivaer.enkel && nivaer.enkel.fil !== nivaer.mobil?.fil ? nivaer.enkel : null, MOBIL_TRI.enkel],
    ['Skylt', skylt, MOBIL_TRI.skylt]
  ];
  const rader = kedja.map(([namn, modell, grans]) => {
    const tri = modell?.trianglar ?? null;
    return {
      namn,
      text: modell ? tal(tri, 0) + ' trianglar' : 'saknas',
      farg: modell ? fargMotGrans(tri, grans[0], grans[1]) : 'rod',
      fil: modell?.fil || '',
      bytes: modell?.bytes || 0
    };
  });
  const antalNivaer = rader.filter((rad) => rad.text !== 'saknas').length;
  const mobil = nivaer.mobil;
  const material = mobil?.material ?? null;
  const bytes = mobil?.bytes || 0;
  const ext = mobil?.extensioner || [];
  const harMeshopt = ext.some((namn) => /meshopt/i.test(namn));
  const harDraco = ext.some((namn) => /draco/i.test(namn));
  const harKtx = ext.some((namn) => /ktx|basis/i.test(namn));
  const komprimering = [
    harDraco ? 'Draco' : null,
    harMeshopt ? 'meshopt' : null,
    harKtx ? 'KTX2' : null
  ].filter(Boolean).join(', ') || 'ingen';
  return {
    rader,
    antalNivaer,
    nivaFarg: antalNivaer >= 3 ? 'gron' : antalNivaer === 2 ? 'gul' : 'rod',
    material,
    materialFarg: material == null ? 'gul' : fargMotGrans(material, 8, 16),
    texturText: 'Storlek i pixlar står inte i datapaketet. Material: ' + (material ?? 'okänt') + '.',
    texturFarg: material == null ? 'gul' : fargMotGrans(material, 8, 16),
    bytes,
    bytesText: bytes ? (bytes / 1e6).toFixed(1).replace('.', ',') + ' MB' : 'okänd',
    bytesFarg: bytes ? fargMotGrans(bytes, 2e6, 5e6) : 'gul',
    komprimering,
    komprimeringFarg: harDraco || harMeshopt ? (harKtx ? 'gron' : 'gul') : 'rod',
    skuggproxy: 'Ja i Ställ ut, en platt skiva under enheten. Nej i själva modellfilen.',
    skuggFarg: 'gul'
  };
}

export function stridsrader(enhet) {
  const funna = new Map();
  (function ga(nod, stig) {
    if (!nod || typeof nod !== 'object') return;
    if (Object.prototype.hasOwnProperty.call(nod, 'varde')) {
      funna.set(stig, nod);
      return;
    }
    for (const [nyckel, barn] of Object.entries(nod)) {
      if (nyckel === 'andringshistorik') continue;
      ga(barn, stig ? stig + '.' + nyckel : nyckel);
    }
  })(enhet?.spelvarden || {}, '');
  const ordning = [...HUVUDVARDEN];
  for (const stig of funna.keys()) if (!ordning.includes(stig)) ordning.push(stig);
  return ordning.map((stig) => {
    const nod = funna.get(stig);
    if (!nod || nod.varde == null || nod.varde === '') {
      return { stig, text: 'saknas', marke: 'saknas', farg: 'rod' };
    }
    const marke = nod.ursprung === 'kalla' ? 'källa' : nod.ursprung === 'anvandarbestamd' ? 'bestämd av dig' : 'uppskattat';
    return {
      stig,
      text: tal(nod.varde, nod.enhet === 'andel' ? 2 : undefined) + (nod.enhet && nod.enhet !== 'andel' ? ' ' + nod.enhet : ''),
      marke,
      farg: nod.ursprung === 'uppskattat' ? 'gul' : 'gron'
    };
  });
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
  const rad = (post, grupp) => `<li class="${post.ok ? 'ok' : 'saknas'}" data-punkt="${esc(post.id)}" data-grupp="${esc(grupp)}" data-ok="${post.ok}"><span aria-hidden="true">${post.ok ? '✓' : '○'}</span> ${esc(post.text)}</li>`;
  const grupper = (check.grupper || []).map((grupp) => `
    <section data-statusgrupp="${esc(grupp.id)}">
      <h2>${esc(grupp.rubrik)}</h2>
      <ul>${grupp.punkter.map((post) => rad(post, grupp.id)).join('')}</ul>
    </section>`).join('');
  return `<section class="checklista ${extra}" data-saknas data-checklista>
    <p class="fin">Mappen följer det som syns och hörs, och hur nära enheten är ett prov på riktig iPhone. Rubrik 3 visas men flyttar inte enheten. ${check.uppskattade} huvudvärden är uppskattade.</p>
    ${grupper}
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
