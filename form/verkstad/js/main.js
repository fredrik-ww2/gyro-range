import { hamtaBeteende, hamtaEnhet, hamtaIndex } from './data.js';
import { monteraBibliotek } from './bibliotek.js';
import { monteraKort } from './kort.js';
import { monteraStall } from './stall.js';

const app = document.querySelector('#app');
const bibliotekEl = document.createElement('section');
const kortEl = document.createElement('section');
const stallEl = document.createElement('section');
bibliotekEl.dataset.vy = 'bibliotek';
kortEl.dataset.vy = 'kort';
stallEl.dataset.vy = 'stall';
kortEl.hidden = true;
stallEl.hidden = true;
app.append(bibliotekEl, kortEl, stallEl);

let index;
let beteende;
let stallApi;

function oppnaEnhet(id) {
  location.hash = '#enhet/' + encodeURIComponent(id);
}

function oppnaStall() {
  location.hash = '#stall';
}

async function visaFranHash() {
  const hash = location.hash || '#bibliotek';
  if (hash.startsWith('#enhet/')) {
    const id = decodeURIComponent(hash.slice('#enhet/'.length));
    const post = index.enheter.find((enhet) => enhet.id === id);
    if (!post) {
      location.hash = '#bibliotek';
      return;
    }
    const pack = await hamtaEnhet(post.fil);
    if (stallApi) stallApi.visa(false);
    bibliotekEl.hidden = true;
    stallEl.hidden = true;
    kortEl.hidden = false;
    document.body.dataset.vy = 'kort';
    monteraKort(kortEl, {
      ...pack,
      beteende,
      tillbaka() { location.hash = '#bibliotek'; }
    });
    return;
  }
  if (hash === '#stall') {
    bibliotekEl.hidden = true;
    kortEl.hidden = true;
    stallEl.hidden = false;
    document.body.dataset.vy = 'stall';
    if (!stallApi) {
      stallEl.querySelector('.stall-status') || (stallEl.innerHTML = '<p class="ledtext">Öppnar terrängen…</p>');
      stallApi = await monteraStall(stallEl, { index, tillbaka() { location.hash = '#bibliotek'; } });
    }
    stallApi.visa(true);
    return;
  }
  if (stallApi) stallApi.visa(false);
  kortEl.hidden = true;
  stallEl.hidden = true;
  bibliotekEl.hidden = false;
  document.body.dataset.vy = 'bibliotek';
}

async function start() {
  try {
    [index, beteende] = await Promise.all([hamtaIndex(), hamtaBeteende()]);
    monteraBibliotek(bibliotekEl, index, { oppnaEnhet, oppnaStall });
    addEventListener('hashchange', () => { visaFranHash().catch(visaFel); });
    await visaFranHash();
  } catch (fel) {
    visaFel(fel);
  }
}

function visaFel(fel) {
  const rad = document.createElement('p');
  rad.className = 'varning';
  rad.textContent = 'Verkstaden kunde inte öppnas. ' + (fel?.message || '');
  app.prepend(rad);
}

start();
