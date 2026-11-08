/* Tre nivåer: färdighet, land, vapenslag. Samma träd i biblioteket och i Ställ ut. */

import {
  LAND_ORDNING, STATUS_MAPPAR, VAPEN_ORDNING, esc, landMapp, statusMappId, vapenslag
} from './data.js';

const MINNE = 'form-verkstad-senaste-mapp';

export function lasSenasteMapp() {
  try {
    return localStorage.getItem(MINNE) || '';
  } catch {
    return '';
  }
}

export function sparaSenasteMapp(vag) {
  try {
    if (vag) localStorage.setItem(MINNE, vag);
    else localStorage.removeItem(MINNE);
  } catch { /* privat läge kan neka */ }
}

export function ritaEnhetstrad(rader, ritaEnhet) {
  const hinkar = new Map(STATUS_MAPPAR.map((mapp) => [mapp.id, []]));
  for (const rad of rader) {
    const id = statusMappId(rad.check?.niva);
    if (!hinkar.has(id)) hinkar.set(id, []);
    hinkar.get(id).push(rad);
  }
  const trad = STATUS_MAPPAR.map((mapp) => {
    const poster = hinkar.get(mapp.id) || [];
    const tom = poster.length === 0;
    const inne = tom ? '<p class="tom">Inget i den här mappen.</p>' : ritaLand(poster, mapp.id, ritaEnhet);
    return mappHtml({
      vag: mapp.id,
      namn: mapp.namn,
      antal: poster.length,
      tom,
      klass: 'mapp',
      extra: `data-mapp="${esc(mapp.id)}"`,
      inne
    });
  }).join('');
  return `<div data-enhetstrad>${trad}</div>`;
}

export function kopplaMappminne(rot) {
  const trad = rot.querySelector('[data-enhetstrad]') || rot;
  trad.addEventListener('toggle', (handelse) => {
    const mapp = handelse.target;
    if (!(mapp instanceof HTMLDetailsElement) || !mapp.dataset.vag) return;
    if (trad.dataset.sokPagar === 'ja') return;
    if (mapp.open) {
      sparaSenasteMapp(mapp.dataset.vag);
      return;
    }
    if (lasSenasteMapp() !== mapp.dataset.vag) return;
    const foralder = mapp.parentElement?.closest('details[data-vag]');
    sparaSenasteMapp(foralder?.open ? foralder.dataset.vag : '');
  }, true);
  oppnaSparad(trad);
}

export function filtreraMappar(rot, fraga) {
  const trad = rot.querySelector('[data-enhetstrad]');
  if (!trad) return;
  const q = fraga.trim().toLowerCase();
  trad.dataset.sokPagar = 'ja';
  trad.querySelectorAll('[data-enhet]').forEach((knapp) => {
    const sok = (knapp.dataset.sok || knapp.textContent || '').toLowerCase();
    const dold = Boolean(q) && !sok.includes(q);
    knapp.hidden = dold;
    const rad = knapp.closest('.enhetsrad');
    if (rad) rad.hidden = dold;
  });
  const mappar = [...trad.querySelectorAll('details[data-vag]')].reverse();
  if (!q) {
    for (const mapp of mappar) {
      mapp.hidden = false;
      mapp.open = false;
    }
    trad.dataset.sokPagar = '';
    oppnaSparad(trad);
    return;
  }
  for (const mapp of mappar) {
    const synlig = [...mapp.querySelectorAll('[data-enhet]')].some((knapp) => !knapp.hidden);
    mapp.hidden = !synlig;
    mapp.open = synlig;
  }
  trad.dataset.sokPagar = '';
}

function ritaLand(poster, prefix, ritaEnhet) {
  const hinkar = new Map();
  for (const rad of poster) {
    const land = landMapp(rad.enhet.nation);
    if (!hinkar.has(land)) hinkar.set(land, []);
    hinkar.get(land).push(rad);
  }
  return LAND_ORDNING.filter((land) => hinkar.get(land)?.length).map((land) => {
    const lista = hinkar.get(land);
    const vag = prefix + '/' + land;
    return mappHtml({
      vag,
      namn: land,
      antal: lista.length,
      tom: false,
      klass: 'mapp underniva',
      extra: `data-land="${esc(land)}"`,
      inne: ritaVapen(lista, vag, ritaEnhet)
    });
  }).join('');
}

function ritaVapen(poster, prefix, ritaEnhet) {
  const hinkar = new Map();
  for (const rad of poster) {
    const vapen = vapenslag(rad.enhet);
    if (!hinkar.has(vapen)) hinkar.set(vapen, []);
    hinkar.get(vapen).push(rad);
  }
  return VAPEN_ORDNING.filter((vapen) => hinkar.get(vapen)?.length).map((vapen) => {
    const lista = hinkar.get(vapen).slice().sort((a, b) => a.enhet.namn.localeCompare(b.enhet.namn, 'sv'));
    const vag = prefix + '/' + vapen;
    return mappHtml({
      vag,
      namn: vapen,
      antal: lista.length,
      tom: false,
      klass: 'mapp vapen',
      extra: `data-vapen="${esc(vapen)}"`,
      inne: lista.map(ritaEnhet).join('')
    });
  }).join('');
}

function mappHtml({ vag, namn, antal, tom, klass, extra, inne }) {
  return `<details class="${klass}" data-vag="${esc(vag)}" data-tom="${tom ? 'true' : 'false'}" data-antal="${antal}" ${extra}>
    <summary><span>${esc(namn)}</span><small>${antal}</small></summary>
    <div class="mapp-innehall">${inne}</div>
  </details>`;
}

function oppnaSparad(trad) {
  const vag = lasSenasteMapp();
  if (!vag) return;
  const delar = vag.split('/');
  let acc = '';
  for (const del of delar) {
    acc = acc ? acc + '/' + del : del;
    const nod = trad.querySelector(`details[data-vag="${css(acc)}"]`);
    if (nod) nod.open = true;
  }
}

function css(varde) {
  if (window.CSS?.escape) return CSS.escape(varde);
  return varde.replace(/["\\]/g, '\\$&');
}
