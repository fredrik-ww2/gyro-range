import {
  MAPP_NAMN, NIVA_NAMN, checklista, esc, nationVisning, statusNamn, stridsrader, vapenslag
} from './data.js';
import { filtreraMappar, kopplaMappminne, ritaEnhetstrad } from './enhetsmappar.js';
import { fokusSammanfattning } from './fokus.js';
import { lasLandskap, mattLandskap, scenNyckel } from './formvarld.js';

let gemensamtBeteende = null;

export function monteraBibliotek(el, index, katalog, { oppnaEnhet, oppnaStall, beteende, fokus }) {
  gemensamtBeteende = beteende || null;
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
    <p class="ledtext">${klara ? `${klara} enheter är klara.` : 'Ingen enhet är klar. Nästan klar betyder att modell, LOD-kedja och mobilfil finns, och att animation inte saknas.'}</p>
    <p class="fargforklaring">Gul markering betyder att värdet är uppskattat av datorn. Det är inte hämtat ur källdata.</p>
    ${fokusText(fokus)}
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

function fokusText(fokus) {
  const summa = fokusSammanfattning(fokus);
  if (summa.typer !== 51) {
    return '<p class="varning">Fokuslistan KUNSKAP_STARTURVAL_ENHETER har inte 51 typer. Inget har gissats.</p>';
  }
  const saknas = summa.saknas.map((typ) => typ.namn).join(', ');
  const oklart = summa.flertydig.map((typ) => `${typ.namn} (${(typ.kandidater || []).join(', ')})`).join('; ');
  return `<p class="ledtext" data-fokus="ja">Starturvalet KUNSKAP_STARTURVAL_ENHETER visar ${summa.enheter} enheter för ${summa.matchade.length} av 51 typer. Övriga enheter ligger kvar i datan men syns inte här.</p>
    <p class="varning" data-fokus-saknas>Saknas i datan: ${esc(saknas || 'inga')}.</p>
    <p class="varning" data-fokus-flertydig>Inte visade, flera kandidater: ${esc(oklart || 'inga')}.</p>`;
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

const VARDEN_NAMN = {
  'fart_per_terrang.vag': 'Väg',
  'fart_per_terrang.falt': 'Fält',
  'fart_per_terrang.skog': 'Skog',
  'fart_per_terrang.by': 'By',
  'eldkraft.kaliber_mm': 'Kaliber',
  'eldkraft.eldhastighet_skott_min': 'Eldhastighet',
  'pansar.fram': 'Pansar fram',
  'pansar.sida': 'Pansar sida',
  'pansar.bak': 'Pansar bak',
  'pansar.topp': 'Pansar topp',
  'rackvidd': 'Räckvidd',
  'upptackbarhet': 'Upptäckt',
  'traffchans_per_avstand.100': 'Träff 100 m',
  'traffchans_per_avstand.250': 'Träff 250 m',
  'traffchans_per_avstand.500': 'Träff 500 m',
  'traffchans_per_avstand.1000': 'Träff 1 000 m',
  'traffchans_per_avstand.1500': 'Träff 1 500 m',
  'traffchans_per_avstand.2000': 'Träff 2 000 m'
};

function ritaPost(rad) {
  const enhet = rad.enhet;
  const check = rad.check;
  const niva = NIVA_NAMN[check.niva] || (check.niva === 'klar' ? 'Klar' : '');
  const sok = `${enhet.namn} ${nationVisning(enhet.nation)} ${vapenslag(enhet)} ${enhet.id}`.toLowerCase();
  const djup = check.niva === '1_nastan_klar' || check.niva === '2_halvvags';
  const saknas = check.punkter.filter((punkt) => !punkt.ok);
  return `
    <article class="enhetsrad">
      <button type="button" class="rad" data-enhet="${esc(enhet.id)}" data-status="${esc(check.status)}" data-niva="${esc(check.niva)}" data-sok="${esc(sok)}">
        <span>
          <strong>${esc(enhet.namn)}</strong>
          <small>${esc(nationVisning(enhet.nation))} · ${esc(vapenslag(enhet))}</small>
        </span>
        <em class="chip ${check.status === 'klar' ? 'chip-klar' : 'chip-arbete'}">${esc(statusNamn(check.status))}${niva && check.status !== 'klar' ? ' · ' + esc(niva) : ''}</em>
      </button>
      ${vardenKort(enhet)}
      ${beteendeKort()}
      ${djup ? saknasKort(saknas) : ''}
    </article>`;
}

function vardenKort(enhet) {
  const rader = stridsrader(enhet).filter((rad) => VARDEN_NAMN[rad.stig]);
  if (!rader.length) return '';
  return `<p class="varden-kort">${rader.map((rad) => `<span class="${rad.farg === 'gul' ? 'uppskattat' : rad.farg === 'rod' ? 'saknasvarde' : 'kalla'}">${esc(VARDEN_NAMN[rad.stig])} ${esc(rad.text)}</span>`).join('')}</p>`;
}

function saknasKort(saknas) {
  const rader = saknas.map((punkt) => ({ id: punkt.id, text: punkt.text }));
  if (gemensamtBeteende && gemensamtBeteende.status !== 'inkopplad') {
    rader.push({ id: 'beteende', text: 'Beteende i koden' });
  }
  if (!rader.length) return '<p class="fin">Inget saknas på checklistan.</p>';
  return `<ul class="saknas-kort" data-checklista>${rader.map((rad) => `<li data-punkt="${esc(rad.id)}" data-ok="false">${esc(rad.text)}</li>`).join('')}</ul>`;
}

function beteendeKort() {
  const regler = gemensamtBeteende?.regler || [];
  if (!regler.length) return '<p class="fin" data-beteende>Ingen individregel finns i verkstadens data.</p>';
  const finns = regler.filter((regel) => regel.status !== 'integration återstår');
  const vantar = regler.filter((regel) => regel.status === 'integration återstår');
  return `<p class="beteende-kort" data-beteende>I regeldatan, inte i körande kod: ${esc(finns.map((regel) => regel.id).join(', ') || 'inga')}. ${vantar.length ? 'Saknas även som inkopplad regel: ' + esc(vantar.map((regel) => regel.id).join(', ')) + '. ' : ''}Ingen egen regel per enhet. ${esc(gemensamtBeteende.motorintegration || '')}</p>`;
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
