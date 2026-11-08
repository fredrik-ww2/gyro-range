import {
  MAPP_NAMN, NATION_ORDNING, NIVA_NAMN, TRUPP_ORDNING, checklista, esc, nationVisning, ritaChecklista, statusNamn, truppVisning
} from './data.js';
import { lasLandskap, mattLandskap, scenNyckel } from './formvarld.js';

const RUBRIK = {
  'enheter/klara': 'Enheter',
  'enheter/under_utveckling/1_nastan_klar': 'Under utveckling'
};

const NIVAMAPP = {
  klar: 'enheter/klara',
  '1_nastan_klar': 'enheter/under_utveckling/1_nastan_klar',
  '2_halvvags': 'enheter/under_utveckling/2_halvvags',
  '3_tidigt_skede': 'enheter/under_utveckling/3_tidigt_skede'
};

export function monteraBibliotek(el, index, katalog, { oppnaEnhet, oppnaStall }) {
  const grupper = new Map();
  for (const niva of Object.keys(NIVAMAPP)) grupper.set(niva, []);
  for (const rad of katalog) {
    const check = rad.check || checklista(rad.enhet);
    const nyckel = check.niva === 'klar' ? 'klar' : check.niva;
    if (!grupper.has(nyckel)) grupper.set(nyckel, []);
    grupper.get(nyckel).push({ ...rad, check });
  }

  const mappar = index.mappar.map((mapp) => {
    if (mapp.id.startsWith('enheter/')) return ritaEnhetsmapp(mapp, grupper);
    return ritaOvrig(mapp);
  }).join('');

  const klara = grupper.get('klar')?.length || 0;
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

  el.querySelector('#sok').addEventListener('input', () => {
    const fraga = el.querySelector('#sok').value.trim().toLowerCase();
    el.querySelectorAll('[data-enhet]').forEach((knapp) => {
      knapp.hidden = Boolean(fraga) && !knapp.dataset.sok.includes(fraga);
    });
    el.querySelectorAll('details').forEach((mapp) => {
      const knappar = [...mapp.querySelectorAll(':scope [data-enhet]')];
      if (!knappar.length) return;
      const traff = knappar.some((knapp) => !knapp.hidden);
      if (fraga && traff) mapp.open = true;
    });
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

function ritaEnhetsmapp(mapp, grupper) {
  const niva = Object.entries(NIVAMAPP).find(([, id]) => id === mapp.id)?.[0];
  if (!niva) return '';
  const rader = grupper.get(niva) || [];
  const namn = MAPP_NAMN[mapp.id] || mapp.id;
  const rubrik = RUBRIK[mapp.id] ? `<h2 class="grupprubrik">${RUBRIK[mapp.id]}</h2>` : '';
  const oppen = niva === 'klar' || niva === '1_nastan_klar' ? 'open' : '';
  const innehall = rader.length ? ritaNationer(rader) : '<p class="tom">Tom mapp. Inget ligger här ännu.</p>';
  return `${rubrik}<details class="mapp" data-mapp="${esc(mapp.id)}" data-tom="${rader.length ? 'false' : 'true'}" data-antal="${rader.length}" ${oppen}>
    <summary><span>${esc(namn)}</span><small>${rader.length ? rader.length : 'tom'}</small></summary>
    <div class="mapp-innehall">${innehall}</div>
  </details>`;
}

function ritaNationer(rader) {
  const hinkar = new Map();
  for (const rad of rader) {
    const nation = nationVisning(rad.enhet.nation);
    if (!hinkar.has(nation)) hinkar.set(nation, []);
    hinkar.get(nation).push(rad);
  }
  const namn = [...hinkar.keys()].sort((a, b) => ordning(a, NATION_ORDNING) - ordning(b, NATION_ORDNING) || a.localeCompare(b, 'sv'));
  return namn.map((nation) => {
    const poster = hinkar.get(nation);
    return `<details class="mapp underniva" data-nation="${esc(nation)}">
      <summary><span>${esc(nation)}</span><small>${poster.length}</small></summary>
      <div class="mapp-innehall">${ritaTrupper(poster)}</div>
    </details>`;
  }).join('');
}

function ritaTrupper(rader) {
  const hinkar = new Map();
  for (const rad of rader) {
    const trupp = truppVisning(rad.enhet);
    if (!hinkar.has(trupp)) hinkar.set(trupp, []);
    hinkar.get(trupp).push(rad);
  }
  const namn = [...hinkar.keys()].sort((a, b) => ordning(a, TRUPP_ORDNING) - ordning(b, TRUPP_ORDNING));
  return namn.map((trupp) => {
    const poster = hinkar.get(trupp).slice().sort((a, b) => a.enhet.namn.localeCompare(b.enhet.namn, 'sv'));
    return `<details class="mapp trupp" data-trupp="${esc(trupp)}">
      <summary><span>${esc(trupp)}</span><small>${poster.length}</small></summary>
      <div class="mapp-innehall">${poster.map(ritaPost).join('')}</div>
    </details>`;
  }).join('');
}

function ritaPost(rad) {
  const enhet = rad.enhet;
  const check = rad.check;
  const niva = NIVA_NAMN[check.niva] || (check.niva === 'klar' ? 'Klar' : '');
  const sok = `${enhet.namn} ${nationVisning(enhet.nation)} ${truppVisning(enhet)} ${enhet.id}`.toLowerCase();
  return `
    <article class="enhetsrad">
      <button type="button" class="rad" data-enhet="${esc(enhet.id)}" data-status="${esc(check.status)}" data-niva="${esc(check.niva)}" data-sok="${esc(sok)}">
        <span>
          <strong>${esc(enhet.namn)}</strong>
          <small>${esc(nationVisning(enhet.nation))} · ${esc(truppVisning(enhet))}</small>
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

function ordning(namn, lista) {
  const index = lista.indexOf(namn);
  return index === -1 ? lista.length + 1 : index;
}
