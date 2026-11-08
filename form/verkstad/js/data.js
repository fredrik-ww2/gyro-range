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

export function statusNamn(status) {
  if (status === 'klar') return 'Klar';
  return 'Under utveckling';
}

export function markeText(ursprung) {
  if (ursprung === 'kalla') return 'källa';
  if (ursprung === 'anvandarbestamd') return 'bestämd av dig';
  return 'uppskattat';
}

export function esc(text) {
  return String(text ?? '').replace(/[&<>"']/g, (tecken) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[tecken]));
}
