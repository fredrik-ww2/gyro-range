import * as THREE from 'three';
import {skapaBlick, sjalvtest, normalStyr, STANDARD_STYR} from './blick.js?v=8';
import {byggVarld} from './varld.js?v=10';
import {skapaLaser, sjalvtest as laserTest, normalLaser, STANDARD_LASER, matchaFonsterFov, appliceraForval, effektivFov} from './laser.js?v=10';
import {skapaLjud} from './ljud.js?v=10';
import {skapaKansla, pulsFor, sjalvtest as kanslaTest} from './kansla.js?v=10';

const NYCKEL = 'panorama_styr_v1';
const LASER_NYCKEL = 'panorama_laser_v1';
const GUIDE_NYCKEL = 'panorama_laser_guide_v1';
const HINT_NYCKEL = 'panorama_laser_hint_v1';
const AXLAR = ['vrida', 'uppner', 'sida'];
const VANLIG_FOV = 68;

const $ = id => document.getElementById(id);
const canvas = $('vy');
const teckenfel = [...sjalvtest(), ...laserTest(), ...kanslaTest()];
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
const ljud = skapaLjud();
const kansla = skapaKansla();
let laserPa = false;
let hintTimer = 0;
let nastaPuls = 0;
let senasteNiva = {acc: 0, ryck: 0, linjar: 0, vinkelAcc: 0, omega: null};
let visAcc = 0;
let visRyck = 0;
let skottTid = 0;
let skottAntal = 0;
let traffAntal = 0;
const MITT = new THREE.Vector2(0, 0);
const raycaster = new THREE.Raycaster();
const puffar = [];
let puffTex = null;

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
function komFin(v) {
  const två = Number(v).toFixed(2);
  return (två.endsWith('0') ? Number(v).toFixed(1) : två).replace('.', ',');
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

function aktuellFov() {
  if (!laserPa) return VANLIG_FOV;
  const bas = laser.install.matcha ? matchaFonsterFov() : laser.install.fov;
  return effektivFov(bas, laser.install);
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
    const bas = matchaFonsterFov();
    $('laserZoomVis').textContent = kom(laser.install.zoom) + '× · ' + Math.round(effektivFov(bas, laser.install)) + '°';
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
  ritaLaser(nu);
  tickPuff(dt);
  svalna(dt);
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
  $('kikare').hidden = !(laserPa && inst.sikte === 'kikare');
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
const AXEL_TEXT = {
  vrida: ['Vridning', 'vänster/höger'],
  uppner: ['Lutning', 'fram/bak'],
  sida: ['Sida', 'sidolutning']
};
const matareEl = {};
function byggLaserAxlar() {
  const mall = document.createElement('template');
  mall.innerHTML = `<div class="axelRad"><div class="axelLinje"><span class="axelNamn"><b></b><small></small></span><select data-nyckel="lage"><option value="position">Position</option><option value="fart">Fart</option><option value="rorelse">Mus</option><option value="av">Av</option></select><label class="kansRad">Känslighet <span></span><input data-nyckel="kanslighet" type="range" min="0.1" max="6" step="0.05"></label></div><div class="matare" aria-hidden="true"><span data-matare></span></div><details class="mer"><summary>Mer</summary><div data-vis="fart"><label>Maxfart <span></span><input data-nyckel="maxfart" type="range" min="10" max="240" step="5"></label><div class="val"><button type="button" data-kurva="linjar">Linjär</button><button type="button" data-kurva="kvadrat">Kvadratisk</button></div><p class="forklaring">Större utslag från noll ger högre fart. Tillbaka till noll stannar vyn.</p></div><div data-vis="rorelse"><button type="button" class="omkopplare" data-nyckel="slapp">Släpp vid retur</button><label>Fartgräns <span></span><input data-nyckel="fartgrans" type="range" min="5" max="180" step="5"></label><p class="forklaring">Rörelse mot noll långsammare än gränsen räknas inte, så du kan ta nytt tag.</p></div><div data-vis="styr"><label>Acceleration <span></span><input data-nyckel="accel" type="range" min="0" max="3" step="0.1"></label><p class="forklaring">Snabb fartökning ger extra utslag. 0 är av.</p><label>Skak i siktet <span></span><input data-nyckel="skak" type="range" min="0" max="3" step="0.1"></label><p class="forklaring">Pricken skakar till vid ett ryck. 0 är av.</p></div><p class="forklaring" data-vis="av">Den här axeln styr inte.</p></details></div>`;
  const rot = $('laserAxlar');
  for (const id of AXLAR) {
    const rad = mall.content.firstElementChild.cloneNode(true);
    rad.dataset.axel = id;
    const [namn, under] = AXEL_TEXT[id];
    rad.querySelector('.axelNamn b').textContent = namn;
    rad.querySelector('.axelNamn small').textContent = under;
    rad.querySelector('select').setAttribute('aria-label', 'Läge för ' + namn.toLowerCase());
    rad.querySelector('[data-nyckel="kanslighet"]').setAttribute('aria-label', 'Känslighet för ' + namn.toLowerCase());
    rot.appendChild(rad);
    matareEl[id] = rad.querySelector('[data-matare]');
  }
}
byggLaserAxlar();
function forvalArAktiv(id) {
  const nu = laser.install;
  const prov = appliceraForval(nu, id);
  return JSON.stringify(nu.axlar) === JSON.stringify(prov.axlar) && nu.matcha === prov.matcha && nu.dodzon === prov.dodzon && Math.abs(nu.utjamning - prov.utjamning) < 0.001;
}
function fyllLaserAxlar() {
  const inst = laser.install;
  for (const id of AXLAR) {
    const rad = document.querySelector(`.axelRad[data-axel="${id}"]`);
    const lag = inst.axlar[id];
    rad.classList.toggle('arAv', lag.lage === 'av');
    rad.querySelector('select[data-nyckel="lage"]').value = lag.lage;
    const kans = rad.querySelector('[data-nyckel="kanslighet"]');
    kans.value = String(lag.kanslighet);
    kans.parentElement.querySelector('span').textContent = komFin(lag.kanslighet) + '×';
    const maxfart = rad.querySelector('[data-nyckel="maxfart"]');
    maxfart.value = String(lag.maxfart);
    maxfart.parentElement.querySelector('span').textContent = Math.round(lag.maxfart) + '°/s';
    rad.querySelectorAll('[data-kurva]').forEach(knapp => {
      const pa = knapp.dataset.kurva === lag.kurva;
      knapp.classList.toggle('pa', pa);
      knapp.setAttribute('aria-pressed', pa ? 'true' : 'false');
    });
    const slapp = rad.querySelector('[data-nyckel="slapp"]');
    slapp.classList.toggle('pa', lag.slapp);
    slapp.setAttribute('aria-pressed', lag.slapp ? 'true' : 'false');
    const grans = rad.querySelector('[data-nyckel="fartgrans"]');
    grans.value = String(lag.fartgrans);
    grans.parentElement.querySelector('span').textContent = Math.round(lag.fartgrans) + '°/s';
    const accel = rad.querySelector('[data-nyckel="accel"]');
    accel.value = String(lag.accel);
    accel.parentElement.querySelector('span').textContent = lag.accel < 0.05 ? 'av' : kom(lag.accel);
    const skak = rad.querySelector('[data-nyckel="skak"]');
    skak.value = String(lag.skak);
    skak.parentElement.querySelector('span').textContent = lag.skak < 0.05 ? 'av' : kom(lag.skak);
    rad.querySelectorAll('[data-vis]').forEach(el => {
      const visa = el.dataset.vis === 'styr' ? lag.lage !== 'av' : el.dataset.vis === lag.lage;
      el.hidden = !visa;
    });
  }
  document.querySelectorAll('#laserForval button').forEach(knapp => {
    const pa = forvalArAktiv(knapp.dataset.forval);
    knapp.classList.toggle('pa', pa);
    knapp.setAttribute('aria-pressed', pa ? 'true' : 'false');
  });
  const notis = $('laserLasNotis');
  if (notis) notis.hidden = !inst.lasRoll;
}
function fyllLaser() {
  const inst = laser.install;
  fyllLaserAxlar();
  const fov = inst.matcha ? matchaFonsterFov() : inst.fov;
  const fovHeltal = Math.round(Math.min(100, Math.max(8, fov)));
  $('laserFov').value = String(fovHeltal);
  $('laserFovVis').textContent = inst.matcha ? fovHeltal + '° · fönster' : fovHeltal + '°';
  const matcha = $('laserMatcha');
  matcha.classList.toggle('pa', inst.matcha);
  matcha.setAttribute('aria-pressed', inst.matcha ? 'true' : 'false');
  $('laserUtj').value = String(inst.utjamning);
  const utjOrd = inst.utjamning < 0.02 ? 'rå' : inst.utjamning < 0.35 ? 'lätt' : inst.utjamning < 0.7 ? 'medel' : 'mjuk';
  $('laserUtjVis').textContent = inst.utjamning < 0.02 ? 'rå' : utjOrd + ' ' + komFin(inst.utjamning);
  $('laserDod').value = String(inst.dodzon);
  $('laserDodVis').textContent = inst.dodzon < 0.05 ? 'av' : kom(inst.dodzon) + '°';
  $('laserStorlek').value = String(inst.prick);
  $('laserStorlekVis').textContent = inst.prick + ' px';
  $('laserZoom').value = String(inst.zoom);
  const basFov = inst.matcha ? matchaFonsterFov() : inst.fov;
  $('laserZoomVis').textContent = kom(inst.zoom) + '× · ' + Math.round(effektivFov(basFov, inst)) + '°';
  $('zoomRad').hidden = inst.sikte !== 'kikare';
  document.querySelectorAll('#sikteVal button').forEach(knapp => {
    const pa = knapp.dataset.sikte === inst.sikte;
    knapp.classList.toggle('pa', pa);
    knapp.setAttribute('aria-pressed', pa ? 'true' : 'false');
  });
  $('ljudVol').value = String(inst.volym);
  $('ljudVolVis').textContent = Math.round(inst.volym * 100) + ' %';
  const ljudPa = $('ljudPa');
  ljudPa.classList.toggle('pa', inst.ljud);
  ljudPa.setAttribute('aria-pressed', inst.ljud ? 'true' : 'false');
  ljudPa.textContent = inst.ljud ? 'Ljud på' : 'Ljud av';
  const vibrera = $('vibrera');
  vibrera.classList.toggle('pa', inst.vibrera);
  vibrera.setAttribute('aria-pressed', inst.vibrera ? 'true' : 'false');
  $('vibrStyrka').value = String(inst.vibrStyrka);
  $('vibrStyrkaVis').textContent = Math.round(inst.vibrStyrka * 100) + ' %';
  $('vibrKansl').value = String(inst.vibrKansl);
  $('vibrKanslVis').textContent = kom(inst.vibrKansl) + '×';
  const klick = $('vibrKlick');
  klick.classList.toggle('pa', inst.klick);
  klick.setAttribute('aria-pressed', inst.klick ? 'true' : 'false');
  synkaLjud();
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
function andraAxel(id, del) {
  const axlar = {};
  for (const nyckel of AXLAR) axlar[nyckel] = {...laser.install.axlar[nyckel]};
  axlar[id] = {...axlar[id], ...del};
  andraLaser({axlar});
}
function ritaLaser(nu) {
  const prick = $('laserPrick');
  const linje = $('laserLinje');
  if (!laserPa) {
    if (prick.style.transform) prick.style.transform = '';
    if (linje.style.transform) linje.style.transform = '';
    return;
  }
  const px = laser.skakPx();
  if (px < 0.4) {
    prick.style.transform = '';
    linje.style.transform = '';
  } else {
    const x = Math.sin(nu * 0.045) * px;
    const y = Math.cos(nu * 0.037) * px * 0.7;
    prick.style.transform = `translate(calc(-50% + ${x.toFixed(2)}px), calc(-50% + ${y.toFixed(2)}px))`;
    linje.style.transform = `translateX(calc(-50% + ${x.toFixed(2)}px))`;
  }
  if (laserPanel.hidden) return;
  const m = laser.matare();
  for (const id of AXLAR) matareEl[id].style.width = Math.round(m[id] * 100) + '%';
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
$('laserAxlar').addEventListener('change', e => {
  const sel = e.target.closest('select[data-nyckel="lage"]');
  if (!sel) return;
  andraAxel(sel.closest('.axelRad').dataset.axel, {lage: sel.value});
});
$('laserAxlar').addEventListener('input', e => {
  const input = e.target.closest('input[data-nyckel]');
  if (!input) return;
  const nyckel = input.dataset.nyckel;
  const varde = nyckel === 'maxfart' || nyckel === 'fartgrans' ? Math.round(Number(input.value)) : Number(input.value);
  andraAxel(input.closest('.axelRad').dataset.axel, {[nyckel]: varde});
});
$('laserAxlar').addEventListener('click', e => {
  const kurva = e.target.closest('[data-kurva]');
  if (kurva) {
    andraAxel(kurva.closest('.axelRad').dataset.axel, {kurva: kurva.dataset.kurva});
    return;
  }
  const slapp = e.target.closest('[data-nyckel="slapp"]');
  if (!slapp) return;
  const id = slapp.closest('.axelRad').dataset.axel;
  andraAxel(id, {slapp: !laser.install.axlar[id].slapp});
});
$('laserForval').addEventListener('click', e => {
  const knapp = e.target.closest('[data-forval]');
  if (!knapp) return;
  laser.satt(appliceraForval({...laser.install, pa: laserPa}, knapp.dataset.forval));
  sparaLaser();
  fyllLaser();
  visaLaserUtseende();
  sattFov();
});
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
$('sikteVal').addEventListener('click', e => {
  const knapp = e.target.closest('[data-sikte]');
  if (!knapp) return;
  andraLaser({sikte: knapp.dataset.sikte});
});
$('laserZoom').addEventListener('input', e => andraLaser({zoom: Number(e.target.value)}));
$('ljudPa').addEventListener('click', () => {
  ljud.oppna();
  andraLaser({ljud: !laser.install.ljud});
});
$('ljudKnapp').addEventListener('click', () => {
  ljud.oppna();
  andraLaser({ljud: !laser.install.ljud});
});
$('ljudVol').addEventListener('input', e => andraLaser({volym: Number(e.target.value)}));
$('vibrera').addEventListener('click', () => andraLaser({vibrera: !laser.install.vibrera}));
$('vibrKlick').addEventListener('click', () => {
  ljud.oppna();
  andraLaser({klick: !laser.install.klick});
});
$('vibrStyrka').addEventListener('input', e => andraLaser({vibrStyrka: Number(e.target.value)}));
$('vibrKansl').addEventListener('input', e => andraLaser({vibrKansl: Number(e.target.value)}));
$('skjut').addEventListener('click', () => {
  ljud.oppna();
  avfyra();
});

function synkaLjud() {
  ljud.satt(laser.install.ljud, laser.install.volym);
  const knapp = $('ljudKnapp');
  knapp.classList.toggle('pa', laser.install.ljud);
  knapp.setAttribute('aria-pressed', laser.install.ljud ? 'true' : 'false');
  knapp.textContent = laser.install.ljud ? 'Ljud på' : 'Ljud av';
}
function ritaNiva() {
  const accP = Math.max(0, Math.min(1, visAcc / 8));
  const ryckP = Math.max(0, Math.min(1, visRyck / 40));
  $('accStapel').style.width = Math.round(accP * 100) + '%';
  $('ryckStapel').style.width = Math.round(ryckP * 100) + '%';
  $('accVis').textContent = kom(visAcc);
  $('ryckVis').textContent = kom(visRyck);
  $('ryckMatare').classList.toggle('puls', visRyck > 12);
}
function svalna(dt) {
  visAcc *= Math.exp(-dt * 1.6);
  visRyck *= Math.exp(-dt * 1.3);
  if (visAcc < 0.05) visAcc = 0;
  if (visRyck < 0.05) visRyck = 0;
  ritaNiva();
}
function taNiva(prov, tid) {
  const niva = kansla.mata(prov, tid);
  senasteNiva = niva;
  visAcc = Math.max(visAcc, niva.acc);
  visRyck = Math.max(visRyck, niva.ryck);
  ritaNiva();
  const inst = laser.install;
  const nu = performance.now();
  if (nu < nastaPuls) return niva;
  const puls = pulsFor(niva.acc, niva.ryck, {styrka: inst.vibrStyrka, kanslighet: inst.vibrKansl});
  if (!puls || (!inst.vibrera && !inst.klick)) return niva;
  nastaPuls = nu + puls.paus;
  if (inst.vibrera && typeof navigator.vibrate === 'function') {
    try { navigator.vibrate(puls.monster); } catch { /* Safari saknar vibrate */ }
  }
  if (inst.klick) ljud.klick(puls.styrka);
  if (window.__pano) window.__pano.senastePuls = puls;
  return niva;
}
function mataRorelse(prov, tid) {
  const t = Number.isFinite(tid) ? tid : performance.now() / 1000;
  return taNiva(prov, t);
}
function storlekVektor(v) {
  if (!v) return null;
  const x = +v.x, y = +v.y, z = +v.z;
  if (![x, y, z].every(Number.isFinite)) return null;
  return Math.hypot(x, y, z);
}
addEventListener('devicemotion', e => {
  const linjar = storlekVektor(e.acceleration);
  const rr = e.rotationRate;
  const omega = rr ? storlekVektor({x: rr.alpha, y: rr.beta, z: rr.gamma}) : null;
  if (linjar == null && omega == null) return;
  const tid = (Number.isFinite(e.timeStamp) ? e.timeStamp : performance.now()) / 1000;
  taNiva({linjar, omega}, tid);
}, {passive: true});

function puffTextur() {
  if (puffTex) return puffTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  r.addColorStop(0, 'rgba(255,246,220,.95)');
  r.addColorStop(0.22, 'rgba(232,196,140,.75)');
  r.addColorStop(0.55, 'rgba(140,116,86,.3)');
  r.addColorStop(1, 'rgba(90,74,52,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  puffTex = new THREE.CanvasTexture(c);
  puffTex.colorSpace = THREE.SRGBColorSpace;
  return puffTex;
}
function arHimmel(obj) {
  for (let n = obj; n; n = n.parent) if (n.userData && n.userData.himlen) return true;
  return false;
}
function laggPuff(punkt, normal) {
  const mat = new THREE.SpriteMaterial({map: puffTextur(), transparent: true, depthWrite: false, color: 0xe6d2b4});
  const s = new THREE.Sprite(mat);
  s.raycast = () => {};
  s.position.copy(punkt);
  if (normal) s.position.addScaledVector(normal, 0.07);
  s.scale.setScalar(0.08);
  s.userData = {t: 0, liv: 0.45};
  scene.add(s);
  puffar.push(s);
  while (puffar.length > 14) {
    const gammal = puffar.shift();
    scene.remove(gammal);
    gammal.material.dispose();
  }
}
function tickPuff(dt) {
  for (let i = puffar.length - 1; i >= 0; i--) {
    const s = puffar[i];
    s.userData.t += dt;
    const u = s.userData.t / s.userData.liv;
    if (u >= 1) {
      scene.remove(s);
      s.material.dispose();
      puffar.splice(i, 1);
      continue;
    }
    s.scale.setScalar(0.08 + u * 0.62);
    s.material.opacity = 1 - u * u;
    s.position.y += dt * 0.28;
  }
}
function hittaTraff() {
  try {
    raycaster.setFromCamera(MITT, camera);
    const lista = raycaster.intersectObjects(scene.children, true);
    for (const h of lista) {
      if (!(h.distance > 0.4) || h.distance > 220) continue;
      if (arHimmel(h.object)) continue;
      return h;
    }
  } catch { /* en modell kan sakna träffyta */ }
  return null;
}
function blixt() {
  const el = $('traffBlixt');
  el.classList.remove('pa');
  void el.offsetWidth;
  el.classList.add('pa');
}
function avfyra() {
  const nu = performance.now();
  if (nu - skottTid < 280) return false;
  skottTid = nu;
  skottAntal++;
  ljud.skott();
  blixt();
  $('skjut').classList.add('eld');
  setTimeout(() => $('skjut').classList.remove('eld'), 140);
  const traff = hittaTraff();
  if (traff) {
    traffAntal++;
    let normal = null;
    if (traff.face) normal = traff.face.normal.clone().transformDirection(traff.object.matrixWorld).normalize();
    laggPuff(traff.point, normal);
    ljud.traff();
  }
  return true;
}

const vibrHar = $('vibrHar');
vibrHar.textContent = typeof navigator.vibrate === 'function'
  ? 'Den här webbläsaren har navigator.vibrate. Pulsen blir starkare och tätare när rörelsen är ojämn.'
  : 'Den här webbläsaren saknar navigator.vibrate, samma som Safari på iPhone. Mätarna och klickljudet används i stället.';

start.addEventListener('click', async () => {
  ljud.oppna();
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
  window.__pano = {
    kamera: camera, blick, laser, laserPa, rapport: varld.rapport, teckenfel, renderer, scene,
    hackAntal: varld.hackAntal, matchFov: matchaFonsterFov, ljud, mataRorelse, skjut: avfyra,
    get niva() { return {acc: visAcc, ryck: visRyck, senaste: senasteNiva}; },
    get skott() { return skottAntal; },
    get traffar() { return traffAntal; }
  };
  window.__redo = teckenfel.length === 0;
  start.disabled = false;
  start.textContent = 'Starta';
} catch (e) {
  console.error(e);
  start.textContent = 'Kunde inte ladda';
  $('startText').textContent = String(e.message || e);
}
