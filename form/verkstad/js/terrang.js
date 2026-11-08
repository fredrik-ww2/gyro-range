/* Terräng- och hindervärden. Filen är motoroberoende: meter och faktorer.
   Spelet läser samma JSON. Saknade källfiler ger ursprung uppskattat. */

const DATA = new URL('../data/terrang/typer.json', import.meta.url);

const STALLNING = [
  ['staende', 'Stående'],
  ['knaende', 'Knästående'],
  ['liggande', 'Liggande']
];

const VAPEN = [
  ['handeldvapen', 'Handeldvapen'],
  ['splitter', 'Splitter'],
  ['pansarbrytande', 'Pansarbrytande']
];

const GANG = [
  ['fot', 'Fotsoldat'],
  ['hjul', 'Hjul'],
  ['band', 'Band']
];

export const FARG = {
  ang: 0x8aaa62,
  aker: 0xb59a55,
  skog: 0x2f6a3c,
  buskage: 0x4e8a48,
  hack_bocage: 0x3d6b32,
  stenmur: 0x8d8a84,
  trastaket: 0x8a6a3b,
  hus_sten: 0x9a8b78,
  hus_tra: 0x7a5a32,
  ruin: 0x6e675c,
  krater: 0x5c5344,
  dike: 0x6a6248,
  vag: 0xd7c49a,
  grusvag: 0xc2b48a,
  bro: 0x9a8f78,
  vatten: 0x4d88a8,
  sumpmark: 0x5d7348,
  taggtrad: 0x6e6254,
  stridsvagnshinder: 0x4e524c,
  minfalt: 0xa8843a,
  sandsack: 0xc2b48a,
  skyttegrav: 0x5a5344
};

export function laddaTyper() {
  return fetch(DATA).then((svar) => {
    if (!svar.ok) throw new Error('Kunde inte läsa terrängtyperna');
    return svar.json();
  });
}

export function indexera(data) {
  const typer = new Map((data?.typer || []).map((typ) => [typ.id, typ]));
  return { data, typer };
}

export function ganglagAv(enhet) {
  const text = `${enhet?.id || ''} ${enhet?.typ || ''} ${enhet?.kategori || ''}`;
  if (/stridsvagn|halvband|halftrack|bandvagn|weasel|universal_carrier|sdkfz/i.test(text)) return 'band';
  if (enhet?.typ === 'fordon') return 'hjul';
  return 'fot';
}

export function vapenAv(enhet) {
  const text = `${enhet?.kategori || ''} ${enhet?.typ || ''} ${enhet?.id || ''}`;
  if (/artilleri|haubits|granatkast|morsare|mörsare/i.test(text)) return 'splitter';
  if (/pansarv|stridsvagn|kanon|pjas|pjäs/i.test(text)) return 'pansarbrytande';
  return 'handeldvapen';
}

export function markId(data, etikett) {
  if (etikett == null || etikett === '') return data?.tom_mark || 'ang';
  return data?.form_etikett?.[String(etikett)] || data?.tom_mark || 'ang';
}

/* Minsta hinder som täcker punkten vinner över den underliggande marken. */
export function typVid(x, z, hinder, markTyp, typer) {
  let vald = markTyp || null;
  let bast = Infinity;
  for (const post of hinder || []) {
    if (post.forstord) continue;
    const typ = typer.get(post.typ);
    if (!typ) continue;
    const radie = Number(typ.radie_m) || 0;
    if (Math.hypot(post.x - x, post.z - z) > radie) continue;
    if (radie < bast) {
      bast = radie;
      vald = typ;
    }
  }
  return vald;
}

export function fartFaktor(typ, ganglag) {
  const tal = Number(typ?.forflyttning?.[ganglag]);
  if (!Number.isFinite(tal)) return 1;
  return Math.max(0, Math.min(1, tal));
}

export function skyddFaktor(typ, vapen, ganglag) {
  const tabell = typ?.skydd?.[vapen] || typ?.skydd?.handeldvapen;
  if (!tabell) return 0;
  const stallning = ganglag === 'fot' && typ.stallning_spel ? typ.stallning_spel : 'staende';
  const tal = Number(tabell[stallning]);
  if (!Number.isFinite(tal)) return 0;
  return Math.max(0, Math.min(1, tal));
}

export function ofarbar(typ, ganglag) {
  return fartFaktor(typ, ganglag) <= 0;
}

export function linjeMot(ax, az, bx, bz, hinder, typer, nyckel) {
  const traffar = [];
  for (const post of hinder || []) {
    if (post.forstord) continue;
    const typ = typer.get(post.typ);
    if (!typ || !typ[nyckel]) continue;
    const radie = Number(typ.radie_m) || 0;
    if (avstandTillStracka(post.x, post.z, ax, az, bx, bz) <= radie) traffar.push({ post, typ });
  }
  return traffar;
}

function avstandTillStracka(px, pz, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const langd = dx * dx + dz * dz;
  if (langd <= 0.0001) return Math.hypot(px - ax, pz - az);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / langd));
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}

export function ritaTerrangkort(typ, { tomKarta = false } = {}) {
  if (!typ) return '';
  const gul = typ.ursprung !== 'kalla';
  const klass = gul ? 'uppskattat' : 'kalla';
  const skydd = VAPEN.map(([nyckel, namn]) => {
    const rad = typ.skydd?.[nyckel] || {};
    const celler = STALLNING.map(([stallning, stallNamn]) => `${stallNamn} ${procent(rad[stallning])}`).join(' · ');
    return `<p><span>${esc(namn)}</span> <strong class="${klass}">${esc(celler)}</strong></p>`;
  }).join('');
  const fart = GANG.map(([nyckel, namn]) => {
    const faktor = fartFaktor(typ, nyckel);
    const text = faktor <= 0 ? 'ofarbar' : procent(faktor);
    return `<span class="${klass}">${esc(namn)} ${esc(text)}</span>`;
  }).join('');
  return `
    <section class="terrangkort" data-terrangkort data-typ="${esc(typ.id)}" data-ursprung="${esc(typ.ursprung || 'uppskattat')}">
      <h2>${esc(typ.namn)}</h2>
      <p class="fargforklaring">Gul markering betyder att värdet är uppskattat. Det är inte hämtat ur källfilerna, för de fanns inte bland bilagorna.</p>
      ${tomKarta ? '<p class="fin">Den här kartan har ingen marktypskarta. Tom mark räknas som äng.</p>' : ''}
      <h3>Skydd</h3>
      ${skydd}
      <h3>Sikt</h3>
      <p class="varden-kort">
        <span class="${klass}">Insyn ${esc(procent(typ.insyn))}</span>
        <span class="${klass}">Dold position ${typ.dold_position ? 'ja' : 'nej'}</span>
        <span class="${klass}">Blockerar sikt ${typ.blockerar_sikt ? 'ja' : 'nej'}</span>
        <span class="${klass}">Blockerar skjutlinje ${typ.blockerar_skjutlinje ? 'ja' : 'nej'}</span>
      </p>
      <h3>Förflyttning</h3>
      <p class="varden-kort">${fart}</p>
      <p class="varden-kort">
        <span class="${klass}">Höjd ${esc(meter(typ.hojd_m))}</span>
        <span class="${klass}">Radie ${esc(meter(typ.radie_m))}</span>
        <span class="${klass}">Kan förstöras ${typ.kan_forstoras ? 'ja' : 'nej'}</span>
      </p>
    </section>`;
}

export function ritaHinderlista(typer) {
  const grupper = [
    ['hinder', 'Hinder'],
    ['mark', 'Mark']
  ];
  return grupper.map(([id, namn]) => {
    const rader = typer.filter((typ) => typ.grupp === id).map((typ) => `
      <button type="button" class="rad" data-hinder-typ="${esc(typ.id)}">
        <span><strong>${esc(typ.namn)}</strong><small>${typ.grupp === 'hinder' ? 'Tryck på marken för att ställa ut' : 'En fläck av den här marken'}</small></span>
      </button>`).join('');
    return `<h3>${esc(namn)}</h3>${rader}`;
  }).join('');
}

function procent(tal) {
  const nummer = Number(tal);
  if (!Number.isFinite(nummer)) return '–';
  return Math.round(nummer * 100) + ' %';
}

function meter(tal) {
  const nummer = Number(tal);
  if (!Number.isFinite(nummer)) return '–';
  return (Math.round(nummer * 10) / 10).toLocaleString('sv-SE') + ' m';
}

function esc(text) {
  return String(text ?? '').replace(/[&<>"']/g, (tecken) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[tecken]));
}
