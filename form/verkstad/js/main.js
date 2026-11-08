import { byggKatalog, hamtaBeteende, hamtaEnhet, hamtaIndex } from './data.js';
import { monteraBibliotek } from './bibliotek.js';
import { monteraKort } from './kort.js';
import { monteraStall } from './stall.js';
import { hamtaLandskap } from './formvarld.js';

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
let stallNyckel = '';

function oppnaEnhet(id) {
  location.hash = '#enhet/' + encodeURIComponent(id);
}

function oppnaStall(id) {
  if (!id || id === 'villers_bocage') {
    location.hash = '#stall';
    return;
  }
  if (id.startsWith('form:')) {
    location.hash = '#stall/form/' + encodeURIComponent(id.slice(5));
    return;
  }
  location.hash = '#stall';
}

function lasStall() {
  const hash = location.hash || '';
  if (hash === '#stall' || hash === '#stall/villers_bocage') {
    return { nyckel: 'villers_bocage', varld: { typ: 'villers', id: 'villers_bocage', namn: 'Villers-Bocage' } };
  }
  if (hash.startsWith('#stall/form/')) {
    const id = decodeURIComponent(hash.slice('#stall/form/'.length));
    if (id) return { nyckel: 'form:' + id, varld: { typ: 'form', id, namn: '' } };
  }
  return null;
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
  const stall = lasStall();
  if (stall) {
    bibliotekEl.hidden = true;
    kortEl.hidden = true;
    stallEl.hidden = false;
    document.body.dataset.vy = 'stall';
    if (!stallApi || stallNyckel !== stall.nyckel) {
      if (stallApi) stallApi.stang();
      stallApi = null;
      stallNyckel = stall.nyckel;
      const varld = { ...stall.varld };
      if (varld.typ === 'form') {
        const post = await hamtaLandskap(varld.id);
        varld.namn = post?.name || 'FORM-värld';
        varld.post = post;
      }
      stallEl.innerHTML = '<p class="ledtext">Öppnar terrängen…</p>';
      stallApi = await monteraStall(stallEl, { index, varld, tillbaka() { location.hash = '#bibliotek'; } });
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
    bibliotekEl.innerHTML = '<p class="ledtext">Läser enheterna…</p>';
    const katalog = await byggKatalog(index);
    monteraBibliotek(bibliotekEl, index, katalog, { oppnaEnhet, oppnaStall });
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
