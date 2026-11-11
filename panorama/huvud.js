import * as THREE from 'three';
import {skapaBlick, sjalvtest, normalStyr, STANDARD_STYR} from './blick.js';
import {byggVarld} from './varld.js';

const NYCKEL = 'panorama_styr_v1';
const AXLAR = ['vrida', 'uppner', 'sida'];

const $ = id => document.getElementById(id);
const canvas = $('vy');
const teckenfel = sjalvtest();
if (teckenfel.length) console.error('Blicktecken', teckenfel);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({canvas, antialias: true, powerPreference: 'high-performance', stencil: false});
} catch (e) {
  $('startText').textContent = 'WebGL saknas i den här webbläsaren.';
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(68, 1, 0.12, 420);
camera.position.set(0, 1.7, 0);

const blick = skapaBlick(canvas);
let sparad = STANDARD_STYR;
try { sparad = normalStyr(JSON.parse(localStorage.getItem(NYCKEL) || 'null') || STANDARD_STYR); } catch { sparad = STANDARD_STYR; }
blick.satt(sparad);

function spara() {
  try { localStorage.setItem(NYCKEL, JSON.stringify(blick.styr)); } catch { /* privat läge */ }
}
function fyllAxel(root, axel) {
  const lag = blick.styr.axlar[axel];
  root.querySelectorAll('.val button').forEach(knapp => {
    const pa = knapp.dataset.lage === lag.lage;
    knapp.classList.toggle('pa', pa);
    knapp.setAttribute('aria-pressed', pa ? 'true' : 'false');
  });
  const text = lag.lage === 'rorelse'
    ? 'Bara när den rör sig: vyn ändras av snurrhastigheten och stannar när telefonen är stilla.'
    : 'Följer läget: vyn följer vinkeln. Tillbaka till startläget ger samma vy.';
  root.querySelector('.forklaring').textContent = text;
  for (const [nyckel, vis] of [['kanslighet', v => v.toFixed(1).replace('.', ',') + '×'], ['fart', v => v.toFixed(1).replace('.', ',')], ['utjamning', v => v < 0.02 ? 'ingen' : v > 0.8 ? 'stark' : 'medel']]) {
    const input = root.querySelector(`[data-nyckel="${nyckel}"]`);
    input.value = String(lag[nyckel]);
    input.parentElement.querySelector('span').textContent = vis(lag[nyckel]);
  }
}
function byggPanel() {
  const mall = document.createElement('template');
  mall.innerHTML = `<div class="val"><button type="button" data-lage="foljer">Följer läget</button><button type="button" data-lage="rorelse">Bara när den rör sig</button></div><p class="forklaring"></p><label>Känslighet <span></span><input data-nyckel="kanslighet" type="range" min="0.5" max="3" step="0.05"></label><label>Fartförstärkning <span></span><input data-nyckel="fart" type="range" min="0" max="3" step="0.1"></label><label>Utjämning <span></span><input data-nyckel="utjamning" type="range" min="0" max="1" step="0.05"></label>`;
  for (const axel of AXLAR) {
    const box = document.querySelector(`details[data-axel="${axel}"] .axelInre`);
    box.replaceChildren(mall.content.cloneNode(true));
    box.addEventListener('click', e => {
      const knapp = e.target.closest('button[data-lage]');
      if (!knapp) return;
      const nasta = normalStyr(blick.styr);
      nasta.axlar[axel].lage = knapp.dataset.lage;
      blick.satt(nasta);
      spara();
      fyllAxel(box, axel);
    });
    box.addEventListener('input', e => {
      const input = e.target.closest('input[data-nyckel]');
      if (!input) return;
      const nasta = normalStyr(blick.styr);
      nasta.axlar[axel][input.dataset.nyckel] = Number(input.value);
      blick.satt(nasta);
      spara();
      fyllAxel(box, axel);
    });
    fyllAxel(box, axel);
  }
}
byggPanel();

function passa() {
  const w = innerWidth, h = Math.max(1, innerHeight);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
passa();
addEventListener('resize', passa);
visualViewport?.addEventListener('resize', passa);
addEventListener('orientationchange', () => setTimeout(passa, 200));

let senast = performance.now();
function loop(nu) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, Math.max(0, (nu - senast) / 1000));
  senast = nu;
  if (document.hidden) return;
  camera.quaternion.copy(blick.uppdatera(dt));
  renderer.render(scene, camera);
  if (window.__pano) window.__pano.ritningar = renderer.info.render.calls;
}
requestAnimationFrame(loop);

const start = $('starta');
const horisont = $('horisont');
const hint = $('hint');
const styrPanel = $('styrPanel');
const styrKnapp = $('styrKnapp');
function visaHorisont() {
  const pa = blick.rak;
  horisont.classList.toggle('pa', pa);
  horisont.setAttribute('aria-pressed', pa ? 'true' : 'false');
}
visaHorisont();
horisont.addEventListener('click', () => {
  blick.rak = !blick.rak;
  spara();
  visaHorisont();
});
function visaStyr(oppna) {
  styrPanel.hidden = !oppna;
  styrKnapp.classList.toggle('pa', oppna);
  styrKnapp.setAttribute('aria-expanded', oppna ? 'true' : 'false');
}
styrKnapp.addEventListener('click', () => visaStyr(styrPanel.hidden));
$('styrStang').addEventListener('click', () => visaStyr(false));
$('standard').addEventListener('click', () => {
  blick.satt(STANDARD_STYR);
  spara();
  visaHorisont();
  for (const axel of AXLAR) fyllAxel(document.querySelector(`details[data-axel="${axel}"] .axelInre`), axel);
});
$('noll').addEventListener('click', () => blick.nollstall());
start.addEventListener('click', async () => {
  start.disabled = true;
  try { await blick.start(); }
  catch (e) { hint.textContent = 'Sensorerna kunde inte starta. Dra med fingret.'; }
  $('startKort').hidden = true;
  $('kontroller').hidden = false;
  setTimeout(() => { if (!blick.harGyro) hint.hidden = false; }, 1200);
});

try {
  const varld = await byggVarld(scene, renderer);
  window.__pano = {kamera: camera, blick, rapport: varld.rapport, teckenfel, renderer, scene, hackAntal: varld.hackAntal};
  window.__redo = teckenfel.length === 0;
  start.disabled = false;
  start.textContent = 'Starta';
} catch (e) {
  console.error(e);
  start.textContent = 'Kunde inte ladda';
  $('startText').textContent = String(e.message || e);
}
