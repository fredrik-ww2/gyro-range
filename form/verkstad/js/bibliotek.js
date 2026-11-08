import {
  MAPP_NAMN, NIVA_NAMN, checklista, esc, nationVisning, ritaChecklista, statusNamn, vapenslag
} from './data.js';
import { filtreraMappar, kopplaMappminne, ritaEnhetstrad } from './enhetsmappar.js';
import { lasLandskap, mattLandskap, scenNyckel } from './formvarld.js';

export function monteraBibliotek(el, index, katalog, { oppnaEnhet, oppnaStall }) {
  const rader = katalog.map((rad) => ({ ...rad, check: rad.check || checklista(rad.enhet) }));
  let enheterRitade = false;
  const mappar = index.mappar.map((mapp) => {
    if (mapp.id.startsWith('enheter/')) {
      if (enheterRitade) return '';
      enheterRitade = true;
      return ritaEnhetstrad(rader, ritaPost);
    }
    return ritaOvrig(mapp);
  }).join('');

  const klara = rader.filter((rad) => rad.check.niva === 'klar').length;
  el.innerHTML = `
    <header class="topp">
      <a class="tillbaka" href="../">FORM</a>
      <div>
        <p class="ogat">Spelverkstad</p>
        <h1>Bibliotek</h1>
      </div>
      <a class="knapp primar" href="#stall">Ställ ut</a>
    </header>
    <p class="ledtext">${klara ? `${klara} enheter är klara.` : 'Ingen enhet är klar. Checklistan visar vad som fattas. Nästan klar betyder att modell, LOD-kedja och mobilfil finns, och att animation inte saknas.'}</p>
    <label class="sokfalt">Sök enhet
      <input id="sok" type="search" placeholder="Namn, nation eller typ" autocomplete="off">
    </label>
    <div class="trad">${mappar}</div>
  `;
  el.dataset.redo = 'bibliotek';

  kopplaMappminne(el);
  el.querySelector('#sok').addEventListener('input', () => {
    filtreraMappar(el, el.querySelector('#sok').value);
  });

  el.addEventListener('click', (handelse) => {
    const enhet = handelse.target.closest('[data-enhet]');
    if (enhet) oppnaEnhet(enhet.dataset.enhet);
    const varld = handelse.target.closest('[data-varld]');
    if (varld) oppnaStall(varld.dataset.varld);
  });
  fyllFormVarldar(el);
}

function ritaOvrig(mapp) {
  const namn = MAPP_NAMN[mapp.id] || mapp.id;
  const oppen = mapp.id === 'varldar' ? 'open' : '';
  const innehall = mapp.id === 'varldar'
    ? ritaVarldar(mapp)
    : '<p class="tom">Tom mapp. Inget ligger här ännu.</p>';
  return `<details class="mapp" data-mapp="${esc(mapp.id)}" data-tom="${mapp.poster?.length ? 'false' : 'true'}" ${oppen}>
    <summary><span>${esc(namn)}</span><small>${mapp.poster?.length ? mapp.poster.length : 'tom'}</small></summary>
    <div class="mapp-innehall">${innehall}</div>
  </details>`;
}

function ritaPost(rad) {
  const enhet = rad.enhet;
  const check = rad.check;
  const niva = NIVA_NAMN[check.niva] || (check.niva === 'klar' ? 'Klar' : '');
  const sok = `${enhet.namn} ${nationVisning(enhet.nation)} ${vapenslag(enhet)} ${enhet.id}`.toLowerCase();
  return `
    <article class="enhetsrad">
      <button type="button" class="rad" data-enhet="${esc(enhet.id)}" data-status="${esc(check.status)}" data-niva="${esc(check.niva)}" data-sok="${esc(sok)}">
        <span>
          <strong>${esc(enhet.namn)}</strong>
          <small>${esc(nationVisning(enhet.nation))} · ${esc(vapenslag(enhet))}</small>
        </span>
        <em class="chip ${check.status === 'klar' ? 'chip-klar' : 'chip-arbete'}">${esc(statusNamn(check.status))}${niva && check.status !== 'klar' ? ' · ' + esc(niva) : ''}</em>
      </button>
      ${ritaChecklista(check, 'mini')}
    </article>`;
}

function ritaVarldar(mapp) {
  const inbyggda = (mapp.poster || []).map((post) => {
    if (post.id === 'villers_bocage') {
      return `
        <button type="button" class="rad" data-varld="villers_bocage">
          <span>
            <strong>Villers-Bocage</strong>
            <small>2×2 km, flygfoto från 1944 färglagt som bocage.</small>
          </span>
          <em>Ställ ut</em>
        </button>`;
    }
    return `
      <button type="button" class="rad" data-varld="${esc(post.id)}">
        <span><strong>${esc(post.id)}</strong></span>
        <em>Ställ ut</em>
      </button>`;
  }).join('');
  return `${inbyggda}
    <div data-form-lista></div>
    <p class="tom form-saknas" data-form-status>Läser världar från FORM satellit…</p>`;
}

async function fyllFormVarldar(el) {
  const lista = el.querySelector('[data-form-lista]');
  const status = el.querySelector('[data-form-status]');
  const antal = el.querySelector('[data-mapp="varldar"] > summary small');
  if (!lista || !status) return;
  let varldar = [];
  try {
    varldar = await lasLandskap();
  } catch {
    varldar = [];
  }
  if (!el.isConnected) return;
  if (!varldar.length) {
    lista.innerHTML = '';
    status.hidden = false;
    status.innerHTML = 'Världar som byggs i FORM satellit dyker upp här. <a href="../satellit/">Öppna satellitbyggaren</a>';
  } else {
    status.hidden = true;
    lista.innerHTML = varldar.map(ritaFormVarld).join('');
  }
  const inbyggda = el.querySelectorAll('[data-mapp="varldar"] > .mapp-innehall > [data-varld]').length;
  if (antal) antal.textContent = String(inbyggda + varldar.length);
  el.dataset.formVarldar = String(varldar.length);
}

function ritaFormVarld(post) {
  const { bredd, djup } = mattLandskap(post);
  const matt = `${avrundad(bredd)} × ${avrundad(djup)} m`;
  return `
    <button type="button" class="rad" data-varld="${esc(scenNyckel(post.id))}" data-form-namn="${esc(post.name)}">
      <span>
        <strong>${esc(post.name)}</strong>
        <small>${matt} · från FORM satellit</small>
      </span>
      <em>Ställ ut</em>
    </button>`;
}

function avrundad(meter) {
  return Math.round(meter).toLocaleString('sv-SE');
}
