import * as THREE from 'three';
import {skapaBlick, sjalvtest, normalStyr, STANDARD_STYR} from './blick.js?v=8';
import {byggVarld} from './varld.js?v=8';
import {skapaLaser, sjalvtest as laserTest, normalLaser, STANDARD_LASER, matchaFonsterFov} from './laser.js?v=8';

const NYCKEL = 'panorama_styr_v1';
const LASER_NYCKEL = 'panorama_laser_v1';
const GUIDE_NYCKEL = 'panorama_laser_guide_v1';
const HINT_NYCKEL = 'panorama_laser_hint_v1';
const AXLAR = ['vrida', 'uppner', 'sida'];
const VANLIG_FOV = 68;

const $ = id => document.getElementById(id);
const canvas = $('vy');
const teckenfel = [...sjalvtest(), ...laserTest()];
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
const camera = new THREE.PerspectiveCamera(VANLIG_FOV, 1, 0.12, 420);
camera.position.set(0, 1.7, 0);

const blick = skapaBlick(canvas);
const laser = skapaLaser();
let sparad = STANDARD_STYR;
try { sparad = normalStyr(JSON.parse(localStorage.getItem(NYCKEL) || 'null') || STANDARD_STYR); } catch { sparad = STANDARD_STYR; }
blick.satt(sparad);
let laserSparad = STANDARD_LASER;
try { laserSparad = normalLaser(JSON.parse(localStorage.getItem(LASER_NYCKEL) || 'null') || STANDARD_LASER); } catch { laserSparad = STANDARD_LASER; }
laser.satt(laserSparad);
let laserPa = false;
let hintTimer = 0;

function spara() {
  try { localStorage.setItem(NYCKEL, JSON.stringify(blick.styr)); } catch { /* privat läge */ }
}
function sparaLaser() {
  try { localStorage.setItem(LASER_NYCKEL, JSON.stringify(laser.install)); } catch { /* privat läge */ }
}
function sedd(nyckel) {
  try { return localStorage.getItem(nyckel) === '1'; } catch { return false; }
}
function markera(nyckel) {
  try { localStorage.setItem(nyckel, '1'); } catch { /* privat läge */ }
}
function kom(v, n = 1) { return v.toFixed(n).replace('.', ','); }

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

function aktuellFov() {
  if (!laserPa) return VANLIG_FOV;
  return laser.install.matcha ? matchaFonsterFov() : laser.install.fov;
}
function sattFov() {
  camera.fov = Math.min(100, Math.max(8, aktuellFov()));
  camera.updateProjectionMatrix();
}
function lyft() {
  const el = $('kontroller');
  if (!el || el.hidden) return;
  const botten = parseFloat(getComputedStyle(el).bottom) || 0;
  document.documentElement.style.setProperty('--ovan-kontroll', (botten + el.offsetHeight + 8) + 'px');
}
function passa() {
  const w = innerWidth, h = Math.max(1, innerHeight);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  sattFov();
  if (laser.install.matcha && !$('laserPanel').hidden) {
    const fovHeltal = Math.round(Math.min(100, Math.max(8, matchaFonsterFov())));
    $('laserFov').value = String(fovHeltal);
    $('laserFovVis').textContent = fovHeltal + '° · fönster';
  }
  lyft();
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
  const vanlig = blick.uppdatera(dt);
  camera.quaternion.copy(laserPa && blick.harGyro ? laser.uppdatera(dt) : vanlig);
  renderer.render(scene, camera);
  if (window.__pano) window.__pano.ritningar = renderer.info.render.calls;
}
requestAnimationFrame(loop);

const start = $('starta');
const horisont = $('horisont');
const hint = $('hint');
const styrPanel = $('styrPanel');
const styrKnapp = $('styrKnapp');
const laserPanel = $('laserPanel');
const laserKnapp = $('laserKnapp');
const laserInstall = $('laserInstall');

function visaHorisont() {
  const pa = laserPa ? laser.install.lasRoll : blick.rak;
  horisont.classList.toggle('pa', pa);
  horisont.setAttribute('aria-pressed', pa ? 'true' : 'false');
  const roll = $('laserRoll');
  if (roll) {
    roll.classList.toggle('pa', laser.install.lasRoll);
    roll.setAttribute('aria-pressed', laser.install.lasRoll ? 'true' : 'false');
  }
}
function visaLaserUtseende() {
  const inst = laser.install;
  const rot = document.documentElement.style;
  rot.setProperty('--laser', inst.farg);
  rot.setProperty('--prick', inst.prick + 'px');
  $('laserPrick').hidden = !laserPa;
  $('laserLinje').hidden = !(laserPa && inst.strale);
  laserKnapp.classList.toggle('pa', laserPa);
  laserKnapp.setAttribute('aria-pressed', laserPa ? 'true' : 'false');
  laserKnapp.textContent = laserPa ? 'Laserpekare på' : 'Laserpekare';
  laserInstall.hidden = !laserPa;
  if (!laserPa) {
    laserPanel.hidden = true;
    laserInstall.classList.remove('pa');
    laserInstall.setAttribute('aria-expanded', 'false');
    $('laserHint').hidden = true;
  }
  lyft();
}
function fyllLaser() {
  const inst = laser.install;
  const forst = $('laserForst');
  forst.value = String(inst.forstarkning);
  $('laserForstVis').textContent = Math.abs(inst.forstarkning - 1) < 0.021 ? kom(inst.forstarkning) + '× · 1:1' : kom(inst.forstarkning) + '×';
  const fov = inst.matcha ? matchaFonsterFov() : inst.fov;
  const fovHeltal = Math.round(Math.min(100, Math.max(8, fov)));
  $('laserFov').value = String(fovHeltal);
  $('laserFovVis').textContent = inst.matcha ? fovHeltal + '° · fönster' : fovHeltal + '°';
  const matcha = $('laserMatcha');
  matcha.classList.toggle('pa', inst.matcha);
  matcha.setAttribute('aria-pressed', inst.matcha ? 'true' : 'false');
  $('laserUtj').value = String(inst.utjamning);
  $('laserUtjVis').textContent = inst.utjamning < 0.02 ? 'rå' : inst.utjamning < 0.35 ? 'lätt' : inst.utjamning < 0.7 ? 'medel' : 'mjuk';
  $('laserDod').value = String(inst.dodzon);
  $('laserDodVis').textContent = inst.dodzon < 0.05 ? 'av' : kom(inst.dodzon) + '°';
  $('laserStorlek').value = String(inst.prick);
  $('laserStorlekVis').textContent = inst.prick + ' px';
  $('laserFarg').value = inst.farg;
  document.querySelectorAll('.fargVal button').forEach(knapp => {
    const pa = knapp.dataset.farg === inst.farg;
    knapp.classList.toggle('pa', pa);
    knapp.setAttribute('aria-pressed', pa ? 'true' : 'false');
  });
  const strale = $('laserStrale');
  strale.classList.toggle('pa', inst.strale);
  strale.setAttribute('aria-pressed', inst.strale ? 'true' : 'false');
  visaHorisont();
}
function andraLaser(del) {
  laser.satt(normalLaser({...laser.install, ...del, pa: laserPa}));
  sparaLaser();
  fyllLaser();
  visaLaserUtseende();
  sattFov();
}
function visaLaserHint() {
  if (sedd(HINT_NYCKEL)) return;
  markera(HINT_NYCKEL);
  const el = $('laserHint');
  el.hidden = false;
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => { el.hidden = true; }, 8000);
}
function sattLaser(pa) {
  if (pa === laserPa) return;
  if (pa) laser.behall(camera.quaternion);
  else if (blick.harGyro) blick.taEmot(camera.quaternion);
  laserPa = pa;
  laser.satt(normalLaser({...laser.install, pa}));
  sparaLaser();
  visaLaserUtseende();
  fyllLaser();
  sattFov();
  if (pa) visaLaserHint();
  if (window.__pano) window.__pano.laserPa = laserPa;
}
function visaStyr(oppna) {
  styrPanel.hidden = !oppna;
  styrKnapp.classList.toggle('pa', oppna);
  styrKnapp.setAttribute('aria-expanded', oppna ? 'true' : 'false');
  if (oppna) {
    laserPanel.hidden = true;
    laserInstall.classList.remove('pa');
    laserInstall.setAttribute('aria-expanded', 'false');
  }
}
function visaLaserPanel(oppna) {
  if (oppna && !laserPa) sattLaser(true);
  laserPanel.hidden = !oppna;
  laserInstall.classList.toggle('pa', oppna);
  laserInstall.setAttribute('aria-expanded', oppna ? 'true' : 'false');
  if (oppna) {
    visaStyr(false);
    fyllLaser();
  }
  lyft();
}
function nollstallAllt() {
  blick.nollstall();
  laser.nollstall();
}

visaHorisont();
fyllLaser();
visaLaserUtseende();
if (!sedd(GUIDE_NYCKEL)) $('laserGuide').hidden = false;

horisont.addEventListener('click', () => {
  if (laserPa) andraLaser({lasRoll: !laser.install.lasRoll});
  else {
    blick.rak = !blick.rak;
    spara();
    visaHorisont();
  }
});
styrKnapp.addEventListener('click', () => visaStyr(styrPanel.hidden));
$('styrStang').addEventListener('click', () => visaStyr(false));
$('standard').addEventListener('click', () => {
  blick.satt(STANDARD_STYR);
  spara();
  visaHorisont();
  for (const axel of AXLAR) fyllAxel(document.querySelector(`details[data-axel="${axel}"] .axelInre`), axel);
});
$('noll').addEventListener('click', nollstallAllt);
laserKnapp.addEventListener('click', () => sattLaser(!laserPa));
laserInstall.addEventListener('click', () => visaLaserPanel(laserPanel.hidden));
$('laserStang').addEventListener('click', () => visaLaserPanel(false));
$('laserForst').addEventListener('input', e => andraLaser({forstarkning: Number(e.target.value)}));
$('laserMatcha').addEventListener('click', () => {
  if (laser.install.matcha) andraLaser({matcha: false, fov: Math.round(matchaFonsterFov())});
  else andraLaser({matcha: true});
});
$('laserFov').addEventListener('input', e => andraLaser({matcha: false, fov: Number(e.target.value)}));
$('laserUtj').addEventListener('input', e => andraLaser({utjamning: Number(e.target.value)}));
$('laserDod').addEventListener('input', e => andraLaser({dodzon: Number(e.target.value)}));
$('laserStorlek').addEventListener('input', e => andraLaser({prick: Number(e.target.value)}));
$('laserFarg').addEventListener('input', e => andraLaser({farg: e.target.value}));
document.querySelector('.fargVal').addEventListener('click', e => {
  const knapp = e.target.closest('button[data-farg]');
  if (!knapp) return;
  andraLaser({farg: knapp.dataset.farg});
});
$('laserRoll').addEventListener('click', () => andraLaser({lasRoll: !laser.install.lasRoll}));
$('laserStrale').addEventListener('click', () => andraLaser({strale: !laser.install.strale}));
$('laserNoll').addEventListener('click', nollstallAllt);
$('laserStandard').addEventListener('click', () => {
  laser.satt(normalLaser({...STANDARD_LASER, pa: laserPa}));
  sparaLaser();
  fyllLaser();
  visaLaserUtseende();
  sattFov();
});

start.addEventListener('click', async () => {
  start.disabled = true;
  markera(GUIDE_NYCKEL);
  try { await blick.start(); }
  catch (e) { hint.textContent = 'Sensorerna kunde inte starta. Dra med fingret.'; }
  $('startKort').hidden = true;
  $('kontroller').hidden = false;
  if (laser.install.pa) sattLaser(true);
  else lyft();
  requestAnimationFrame(lyft);
  setTimeout(() => { if (!blick.harGyro) hint.hidden = false; }, 1200);
});

try {
  const varld = await byggVarld(scene, renderer);
  window.__pano = {kamera: camera, blick, laser, laserPa, rapport: varld.rapport, teckenfel, renderer, scene, hackAntal: varld.hackAntal, matchFov: matchaFonsterFov};
  window.__redo = teckenfel.length === 0;
  start.disabled = false;
  start.textContent = 'Starta';
} catch (e) {
  console.error(e);
  start.textContent = 'Kunde inte ladda';
  $('startText').textContent = String(e.message || e);
}
