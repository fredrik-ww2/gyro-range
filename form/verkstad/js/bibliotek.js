import { MAPP_NAMN, NIVA_NAMN, esc, statusNamn } from './data.js';

const RUBRIK = {
  'enheter/klara': 'Enheter',
  'enheter/under_utveckling/1_nastan_klar': 'Under utveckling'
};

export function monteraBibliotek(el, index, { oppnaEnhet, oppnaStall }) {
  const mappar = index.mappar.map(ritaMapp).join('');
  el.innerHTML = `
    <header class="topp">
      <a class="tillbaka" href="../">FORM</a>
      <div>
        <p class="ogat">Spelverkstad</p>
        <h1>Bibliotek</h1>
      </div>
      <a class="knapp primar" href="#stall">Ställ ut</a>
    </header>
    <p class="ledtext">Inga enheter är klara i det här paketet. En 3D-modell betyder inte att enheten är färdig. Status kommer från datan.</p>
    <label class="sokfalt">Sök enhet
      <input id="sok" type="search" placeholder="Namn, nation eller typ" autocomplete="off">
    </label>
    <div class="trad">${mappar}</div>
  `;

  function ritaMapp(mapp) {
    const namn = MAPP_NAMN[mapp.id] || mapp.id;
    const rubrik = RUBRIK[mapp.id] ? `<h2 class="grupprubrik">${RUBRIK[mapp.id]}</h2>` : '';
    const oppen = mapp.id === 'enheter/klara' || mapp.id === 'varldar' ? 'open' : '';
    const innehall = mapp.id === 'varldar'
      ? ritaVarldar(mapp)
      : mapp.poster.length
        ? mapp.poster.map(ritaPost).join('')
        : '<p class="tom">Tom mapp. Inget ligger här ännu.</p>';
    return `${rubrik}<details class="mapp" data-mapp="${esc(mapp.id)}" data-tom="${mapp.tom ? 'true' : 'false'}" ${oppen}>
      <summary><span>${esc(namn)}</span><small>${mapp.tom ? 'tom' : mapp.poster.length}</small></summary>
      <div class="mapp-innehall">${innehall}</div>
    </details>`;
  }

  function ritaVarldar(mapp) {
    if (!mapp.poster.length) return '<p class="tom">Tom mapp. Inget ligger här ännu.</p>';
    return mapp.poster.map((post) => `
      <button type="button" class="rad" data-varld="${esc(post.id)}">
        <span>
          <strong>Villers-Bocage</strong>
          <small>2×2 km höjdterräng. Inte spelklar.</small>
        </span>
        <em>Ställ ut</em>
      </button>
    `).join('');
  }

  function ritaPost(post) {
    const niva = NIVA_NAMN[post.utvecklingsniva] || '';
    const saknas = (post.saknas || []).slice(0, 2).join(' · ');
    const fler = (post.saknas || []).length > 2 ? ` · +${post.saknas.length - 2}` : '';
    const sok = `${post.namn} ${post.nation} ${post.typ} ${post.id}`.toLowerCase();
    return `
      <button type="button" class="rad" data-enhet="${esc(post.id)}" data-status="${esc(post.status)}" data-sok="${esc(sok)}">
        <span>
          <strong>${esc(post.namn)}</strong>
          <small>${esc(post.nation)} · ${esc(post.typ)}</small>
          ${post.status !== 'klar' ? `<small class="saknasrad">${esc(saknas + fler)}</small>` : ''}
        </span>
        <em class="chip ${post.status === 'klar' ? 'chip-klar' : 'chip-arbete'}">${esc(statusNamn(post.status))}${niva ? ' · ' + esc(niva) : ''}</em>
      </button>
    `;
  }

  el.querySelector('#sok').addEventListener('input', () => {
    const fraga = el.querySelector('#sok').value.trim().toLowerCase();
    el.querySelectorAll('[data-enhet]').forEach((knapp) => {
      knapp.hidden = Boolean(fraga) && !knapp.dataset.sok.includes(fraga);
    });
    el.querySelectorAll('details[data-mapp]').forEach((mapp) => {
      const knappar = [...mapp.querySelectorAll('[data-enhet]')];
      if (!knappar.length) return;
      const traff = knappar.some((knapp) => !knapp.hidden);
      mapp.querySelector('.ingen-traff')?.remove();
      if (fraga && !traff) {
        const p = document.createElement('p');
        p.className = 'tom ingen-traff';
        p.textContent = 'Ingen träff i den här mappen.';
        mapp.querySelector('.mapp-innehall').append(p);
        mapp.open = true;
      } else if (fraga && traff) mapp.open = true;
    });
  });

  el.addEventListener('click', (handelse) => {
    const enhet = handelse.target.closest('[data-enhet]');
    if (enhet) oppnaEnhet(enhet.dataset.enhet);
    const varld = handelse.target.closest('[data-varld]');
    if (varld) oppnaStall();
  });
}
