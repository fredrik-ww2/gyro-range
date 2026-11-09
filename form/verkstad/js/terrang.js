/* Terräng- och hindervärden. Filen är motoroberoende: meter och faktorer.
   Spelet läser samma JSON. Saknade källfiler ger ursprung uppskattat. */

const DATA = new URL('../data/terrang/typer.json', import.meta.url);

const HOT = [
  ['gevar', 'Gevär'],
  ['kulspruta', 'Kulspruta'],
  ['prickskytt', 'Prickskytt'],
  ['splitter_granat', 'Splitter, granat'],
  ['splitter_artilleri', 'Splitter, artilleri'],
  ['artilleri_ovanifran', 'Artilleri ovanifrån'],
  ['pansarbrytande', 'Pansarbrytande']
];

const TAGG_TEXT = {
  forskningsdata: 'forskningsdata, förslag ej infört',
  uppskattning: 'uppskattning',
  citerat_i_harledning: 'citerat i en härledning',
  lucka: 'saknas',
  kalla_text: 'källans text'
};

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
  hack: 0x5d8a45,
  bocagevall: 0x3d6b32,
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
  if (!typer.has('hack_bocage') && typer.has('bocagevall')) typer.set('hack_bocage', typer.get('bocagevall'));
  return { data, typer };
}

/* Källans tal är kvarvarande verkan. Lägre är bättre. Reduktion är 1 minus det talet. */
export function reduktionFranKvarvarande(kvarvarande) {
  const tal = Number(kvarvarande);
  if (!Number.isFinite(tal)) return null;
  return 1 - tal;
}

export function hotForVapen(vapen) {
  if (vapen === 'splitter') return 'splitter_artilleri';
  if (vapen === 'pansarbrytande') return 'pansarbrytande';
  if (vapen === 'gevar' || vapen === 'kulspruta' || vapen === 'prickskytt' || vapen === 'splitter_granat' || vapen === 'splitter_artilleri' || vapen === 'artilleri_ovanifran') return vapen;
  return 'gevar';
}

export function kvarvarandeVarde(typ, vapen) {
  const hot = hotForVapen(vapen);
  const post = typ?.kvarvarande?.[hot];
  if (!post || post.varde == null || !Number.isFinite(Number(post.varde))) return 1;
  return Number(post.varde);
}

export function skadaAv(grund, typ, vapen) {
  return grund * kvarvarandeVarde(typ, vapen);
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

export function skyddFaktor(typ, vapen) {
  return kvarvarandeVarde(typ, vapen);
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
  const skydd = HOT.map(([nyckel, namn]) => {
    const post = typ.kvarvarande?.[nyckel];
    const klass = markeKlass(post?.tagg);
    const kvar = post?.varde;
    const reduktion = reduktionFranKvarvarande(kvar);
    const text = kvar == null
      ? 'saknas'
      : `kvarvarande ${procent(kvar)} · reduktion ${procent(reduktion)} · ${TAGG_TEXT[post.tagg] || post.tagg}`;
    return `<p data-hot="${esc(nyckel)}" data-tagg="${esc(post?.tagg || 'lucka')}"><span>${esc(namn)}</span> <strong class="${klass}">${esc(text)}</strong></p>`;
  }).join('');
  const fart = GANG.map(([nyckel, namn]) => {
    const faktor = fartFaktor(typ, nyckel);
    const text = faktor <= 0 ? 'ofarbar' : procent(faktor);
    return `<span class="uppskattat">${esc(namn)} ${esc(text)}</span>`;
  }).join('');
  const mina = typ.skada_vid_intrad?.varde > 0
    ? '<p class="uppskattat">Minfältets skada är uppskattad och inte en historiskt verifierad regel.</p>'
    : '';
  return `
    <section class="terrangkort" data-terrangkort data-typ="${esc(typ.id)}" data-ursprung="${esc(typ.kalltyp || 'lucka')}" data-kulskydd="${typ.riktigt_kulskydd ? 'ja' : 'nej'}">
      <h2>${esc(typ.namn)}</h2>
      <p class="fargforklaring">Gult är uppskattat. Kvarvarande verkan är källans tal, lägre är bättre. Reduktion är 1 minus det talet. Forskningsdata är ett förslag och inte en införd regel.</p>
      ${typ.notering ? `<p class="fin">${esc(typ.notering)}</p>` : ''}
      ${tomKarta ? '<p class="fin">Den här kartan har ingen marktypskarta. Tom mark räknas som äng.</p>' : ''}
      <p class="fin">${typ.riktigt_kulskydd ? 'Riktigt kulskydd enligt den kopierade gevärsraden.' : 'Inte riktigt kulskydd. Vegetation som bara döljer stoppar inte skottet.'}</p>
      <h3>Skydd</h3>
      ${skydd}
      <h3>Sikt</h3>
      <p class="varden-kort">
        <span class="${markeKlass(typ.insyn?.tagg)}">Insyn ${esc(procent(typ.insyn?.varde))}</span>
        <span class="${markeKlass(typ.dold_position?.tagg)}">Dold position ${typ.dold_position?.varde ? 'ja' : 'nej'}</span>
      </p>
      <h3>Förflyttning</h3>
      <p class="fin">Fart och ofarbar mark är uppskattade. De är inte en historiskt verifierad regel.</p>
      <p class="varden-kort">${fart}</p>
      ${mina}
      <p class="varden-kort">
        <span class="uppskattat">Höjd ${esc(meter(typ.hojd_m))}</span>
        <span class="uppskattat">Radie ${esc(meter(typ.radie_m))}</span>
        <span class="uppskattat">Kan förstöras ${typ.kan_forstoras?.varde ? 'ja' : 'nej'}</span>
      </p>
    </section>`;
}

function markeKlass(tagg) {
  if (tagg === 'forskningsdata' || tagg === 'kalla_text') return 'kalla';
  if (tagg === 'lucka') return 'saknasvarde';
  return 'uppskattat';
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
