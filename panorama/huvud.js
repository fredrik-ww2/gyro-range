import * as THREE from 'three';
import {skapaBlick, sjalvtest, normalStyr, STANDARD_STYR} from './blick.js?v=15';
import {byggVarld} from './varld.js?v=17';
import {skapaLaser, sjalvtest as laserTest, normalLaser, STANDARD_LASER, matchaFonsterFov, appliceraForval, effektivFov} from './laser.js?v=15';
import {skapaLjud} from './ljud.js?v=17';
import {skapaKansla, pulsFor, sjalvtest as kanslaTest} from './kansla.js?v=11';
import {skapaBakgrund} from './bakgrund.js?v=11';
import {laddaConfig} from './config.js?v=17';
import {skapaEffekt} from './effekt.js?v=17';
import {SPAK_LAGEN, lageAv, lageFranAndel, framFart, skakLage, sjalvtest as spakTest} from './spak.js?v=17';
import {skapaStallning, fartFaktor, sjalvtest as stallTest} from './stallning.js?v=17';
import {skapaGester, sjalvtest as gestTest} from './gester.js?v=17';
import {gangAmp, accSkak, sjalvtest as skakTest} from './skakkurva.js?v=17';
import {ndcMedSkak, klampaAndel, sjalvtest as siktTest} from './sikt.js?v=17';
import {skapaKollision, sjalvtest as kollTest} from './kollision.js?v=17';
import {skapaSkytt, eldSteg, avstandTillSegment, sjalvtest as eldTest} from './eld.js?v=17';
import {husSpec, sjalvtest as husTest} from './hus.js?v=17';

const config = await laddaConfig();

const NYCKEL = 'panorama_styr_v1';
const LASER_NYCKEL = 'panorama_laser_v1';
const GUIDE_NYCKEL = 'panorama_laser_guide_v1';
const HINT_NYCKEL = 'panorama_laser_hint_v1';
const AXLAR = ['vrida', 'uppner', 'sida'];
const VANLIG_FOV = 68;

const $ = id => document.getElementById(id);
const canvas = $('vy');
const teckenfel = [...sjalvtest(), ...laserTest(), ...kanslaTest(), ...spakTest(), ...stallTest(), ...gestTest(), ...skakTest(), ...siktTest(), ...kollTest(), ...husTest(), ...eldTest()];
if (teckenfel.length) console.error('Blicktecken', teckenfel);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false});
} catch (e) {
  $('startText').textContent = 'WebGL saknas i den här webbläsaren.';
  throw e;
}
renderer.setClearColor(0x000000, 1);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(VANLIG_FOV, 1, 0.08, config.terrang.kameraFar);
camera.position.set(0, 1.7, 0);
const effekt = skapaEffekt(scene, config.blod);
const vapenHand = byggVapen(camera);
scene.add(camera);
const UPP_G = new THREE.Vector3(0, 1, 0);
const GANG_FRAM = new THREE.Vector3();
const GANG_HOGER = new THREE.Vector3();
let markFn = () => 0;
let vapenLyft = 1;
const stall = skapaStallning();
const gester = skapaGester();
let spakLage = 'stilla';
let kollision = skapaKollision([]);
let hinder = [];
let ogaVis = 1.7;
let gangKlass = 'stilla';
let accEnergi = 0;
let skakX = 0;
let skakY = 0;
let sparrTill = 0;
const kal = {siktY: 0.42, ga: 0.5, springa: 1, dodzon: 1.8, exponent: 2.8, gain: 0.01, jerkVikt: 0.08, accPx: 26, fram: 1, vert: 1};
const eldTillstand = new Map();
const eldStat = {skott: 0, salva: 0, nedslag: 0, viner: 0};
const ELD_FRAN = new THREE.Vector3();
const ELD_TILL = new THREE.Vector3();
const ELD_DIR = new THREE.Vector3();
const SPARR_MS = {vanligt: 740, kar98k: 920, springfield: 1040, enfield: 640};
const gangIntent = {fram: 0, sida: 0, svang: 0};
let skakPa = config.skak.pa !== false;

const blick = skapaBlick(canvas);
const laser = skapaLaser();
let sparad = STANDARD_STYR;
try { sparad = normalStyr(JSON.parse(localStorage.getItem(NYCKEL) || 'null') || STANDARD_STYR); } catch { sparad = STANDARD_STYR; }
blick.satt(sparad);
function narmasteVapen(zoom) {
  let best = 'kar98k';
  let d = Infinity;
  for (const v of config.vapen) {
    if (v.sikte !== 'kikare') continue;
    const dd = Math.abs(v.forstoring - Number(zoom));
    if (dd < d) { d = dd; best = v.id; }
  }
  return best;
}
function koplaVapen(install) {
  const kand = config.vapen.some(v => v.id === install.vapen) ? install.vapen : (install.sikte === 'kikare' ? narmasteVapen(install.zoom) : 'vanligt');
  const v = config.vapen.find(x => x.id === kand) || config.vapen[0];
  return normalLaser({...install, vapen: v.id, sikte: v.sikte, zoom: v.forstoring});
}
let laserSparad = normalLaser({...STANDARD_LASER, prick: config.prick.standard, vapen: 'vanligt', sikte: 'prick', zoom: 1});
try {
  const raw = JSON.parse(localStorage.getItem(LASER_NYCKEL) || 'null');
  if (raw) {
    laserSparad = normalLaser(raw);
    if (!raw.vapen) laserSparad.vapen = raw.sikte === 'kikare' ? '' : 'vanligt';
  }
} catch { /* sparad laser saknas */ }
laserSparad = koplaVapen(laserSparad);
laser.satt(laserSparad);
const ljud = skapaLjud();
ljud.sattKaraktar((config.vapen.find(v => v.id === laser.install.vapen) || config.vapen[0]).ljud);
const kansla = skapaKansla();
const bakgrund = skapaBakgrund($('kamerabild'));
const hallQ = new THREE.Quaternion();
let soldatApi = {uppdatera() { return []; }, traffa() { return null; }, siktePunkt() { return null; }, status() { return []; }, resFallna() { return 0; }, fyllPa() { return {nytt: null, resta: 0}; }, get antal() { return 0; }};
let miljoGrupp = null;
let sparadDimma = null;
let hallTill = 0;
let sikteInit = false;
let toastTimer = 0;
let laserPa = false;
let hintTimer = 0;
let nastaPuls = 0;
let senasteNiva = {acc: 0, ryck: 0, linjar: 0, vinkelAcc: 0, omega: null};
let visAcc = 0;
let visRyck = 0;
let skottTid = 0;
let skottAntal = 0;
let traffAntal = 0;
let startad = false;
let bilder = 0;
const aim = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
raycaster.far = config.terrang.raycast;

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

function basFov() {
  if (laserPa) return laser.install.matcha ? matchaFonsterFov() : laser.install.fov;
  return VANLIG_FOV;
}
function aktuellFov() {
  return effektivFov(basFov(), laser.install);
}
function latSikte(mal, dt) {
  const zoom = laser.install.sikte === 'kikare' ? laser.install.zoom : 1;
  if (!(zoom > 1.15)) {
    sikteInit = false;
    camera.quaternion.copy(mal);
    return;
  }
  if (!sikteInit) {
    sikteInit = true;
    camera.quaternion.copy(mal);
    return;
  }
  const tau = 0.042 * (zoom - 1);
  const a = 1 - Math.exp(-Math.max(dt, 0.001) / tau);
  camera.quaternion.slerp(mal, Math.min(1, a));
}
function sattFov() {
  camera.fov = Math.min(100, Math.max(config.fovMin, aktuellFov()));
  camera.updateProjectionMatrix();
}
function vapenNu() {
  return config.vapen.find(v => v.id === laser.install.vapen) || config.vapen[0];
}
function ritaVapenKnappar() {
  const html = config.vapen.map(v => `<button type="button" data-vapen="${v.id}" aria-pressed="false"><b>${v.namn}</b><small>${v.under}</small></button>`).join('');
  const rad = $('vapenRad');
  const meny = $('vapenVal');
  if (rad) rad.innerHTML = html;
  if (meny) meny.innerHTML = html;
}
function markeraVapen() {
  const id = laser.install.vapen;
  document.querySelectorAll('[data-vapen]').forEach(knapp => {
    const pa = knapp.dataset.vapen === id;
    knapp.classList.toggle('pa', pa);
    knapp.setAttribute('aria-pressed', pa ? 'true' : 'false');
  });
}
function visaRetikel() {
  const inst = laser.install;
  const kik = inst.sikte === 'kikare';
  const rot = $('kikare');
  if (rot) {
    rot.hidden = !kik;
    rot.classList.toggle('doljMitt', laserPa);
    const ret = vapenNu().retikel;
    rot.querySelectorAll('[data-retikel]').forEach(el => { el.hidden = el.dataset.retikel !== ret; });
  }
  const prick = $('siktPrick');
  if (prick) prick.hidden = !(startad && !kik && !laserPa);
}
ritaVapenKnappar();
const storlekInput = $('laserStorlek');
if (storlekInput) {
  storlekInput.min = String(config.prick.min);
  storlekInput.max = String(config.prick.max);
}
function lyft() {
  const el = $('skjut');
  if (!el || el.hidden) return;
  const botten = parseFloat(getComputedStyle(el).bottom) || 0;
  document.documentElement.style.setProperty('--ovan-kontroll', (botten + el.offsetHeight + 12) + 'px');
}
function passa() {
  const w = innerWidth, h = Math.max(1, innerHeight);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  sattFov();
  if (laser.install.matcha) {
    const fovHeltal = Math.round(Math.min(100, Math.max(8, matchaFonsterFov())));
    $('laserFov').value = String(fovHeltal);
    $('laserFovVis').textContent = fovHeltal + '° · fönster';
  }
  visaZoomText();
  lyft();
}
passa();
addEventListener('resize', passa);
visualViewport?.addEventListener('resize', passa);
addEventListener('orientationchange', () => setTimeout(passa, 200));

let senast = performance.now();
function byggVapen(mal) {
  const rot = new THREE.Group();
  rot.name = 'vapen';
  const tra = new THREE.MeshStandardMaterial({color: 0x4a3828, roughness: 0.78, metalness: 0.02});
  const stal = new THREE.MeshStandardMaterial({color: 0x2c3134, roughness: 0.38, metalness: 0.62});
  const kolv = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.09, 0.32), tra);
  kolv.position.set(0, -0.02, 0.08);
  const las = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.07, 0.16), stal);
  las.position.set(0, 0.02, -0.08);
  const pipa = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.016, 0.52), stal);
  pipa.position.set(0, 0.045, -0.38);
  const korn = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.03, 0.008), stal);
  korn.position.set(0, 0.07, -0.62);
  rot.add(kolv, las, pipa, korn);
  rot.scale.setScalar(1.35);
  rot.traverse(n => { if (n.isMesh) { n.castShadow = false; n.receiveShadow = false; n.raycast = () => {}; } });
  mal.add(rot);
  return rot;
}
function laggVapen(dt) {
  const kik = laser.install.sikte === 'kikare';
  const lag = stall.stallning === 'ligg' ? 0.42 : stall.stallning === 'kna' ? 0.74 : 1;
  const mal = kik ? Math.min(lag, 0.3) : lag;
  const a = 1 - Math.exp(-Math.max(dt, 0.001) / 0.16);
  vapenLyft += (mal - vapenLyft) * a;
  const t = vapenLyft;
  const vil = {x: 0.38, y: -0.34, z: -0.9, rx: 0.38, ry: 0.62};
  const redo = kik
    ? {x: 0.36, y: -0.38, z: -0.85, rx: 0.5, ry: 0.4}
    : {x: 0.28, y: -0.18, z: -0.72, rx: 0.1, ry: 0.18};
  vapenHand.position.set(
    vil.x + (redo.x - vil.x) * t,
    vil.y + (redo.y - vil.y) * t,
    vil.z + (redo.z - vil.z) * t
  );
  vapenHand.rotation.set(vil.rx + (redo.rx - vil.rx) * t, vil.ry + (redo.ry - vil.ry) * t, 0);
}
function lasGang() {
  let fram = gangIntent.fram;
  let sida = gangIntent.sida;
  if (tangenter.has('w') || tangenter.has('arrowup')) fram += 1;
  if (tangenter.has('s') || tangenter.has('arrowdown')) fram -= 1;
  if (tangenter.has('a') || tangenter.has('arrowleft')) sida -= 1;
  if (tangenter.has('d') || tangenter.has('arrowright')) sida += 1;
  return {
    fram: Math.max(-1, Math.min(1, fram)),
    sida: Math.max(-1, Math.min(1, sida))
  };
}
function ga(dt) {
  const ratt = lasGang();
  const faktor = fartFaktor(stall.stallning);
  const fart = framFart(spakLage, ratt.fram) * faktor;
  const sidaFart = ratt.sida * lageAv('ga').fart * faktor;
  camera.getWorldDirection(GANG_FRAM);
  GANG_FRAM.y = 0;
  if (GANG_FRAM.lengthSq() < 1e-8) GANG_FRAM.set(0, 0, -1);
  GANG_FRAM.normalize();
  GANG_HOGER.crossVectors(GANG_FRAM, UPP_G).normalize();
  const nx = camera.position.x + (GANG_FRAM.x * fart + GANG_HOGER.x * sidaFart) * dt;
  const nz = camera.position.z + (GANG_FRAM.z * fart + GANG_HOGER.z * sidaFart) * dt;
  const golv = markFn(camera.position.x, camera.position.z);
  const flytt = kollision.ga(camera.position.x, camera.position.z, nx, nz, 0.28, golv, golv + Math.max(0.5, ogaVis));
  const gr = config.gang.grans;
  const x0 = camera.position.x;
  const z0 = camera.position.z;
  camera.position.x = Math.max(-gr, Math.min(gr, flytt.x));
  camera.position.z = Math.max(-gr, Math.min(gr, flytt.z));
  const rorde = dt > 0 ? Math.hypot(camera.position.x - x0, camera.position.z - z0) / dt : 0;
  gangKlass = rorde > 0.18 ? skakLage(spakLage, ratt.fram > 0) : 'stilla';
}
function visaStall() {
  const id = stall.stallning;
  for (const [knapp, namn] of [['knappSta', 'staende'], ['knappKna', 'kna'], ['knappLigg', 'ligg']]) {
    const el = $(knapp);
    if (!el) continue;
    const pa = id === namn;
    el.classList.toggle('pa', pa);
    el.setAttribute('aria-pressed', pa ? 'true' : 'false');
  }
  if ($('spak')) $('spak').hidden = !startad;
  if ($('stallning')) $('stallning').hidden = !startad;
}
function tillampaGest(g) {
  if (!g || !startad) return;
  let andra = false;
  if (g.dubbel) { stall.kastaNer(); andra = true; }
  else if (g.fram) { stall.stegNer(); andra = true; }
  if (stall.stallning === 'kna') {
    if (g.ner) { stall.kikaNer(); andra = true; }
    else if (g.upp) { stall.kikaUpp(); andra = true; }
  }
  if (andra) visaStall();
}
function siktePek() {
  const n = ndcMedSkak(kal.siktY, skakX, skakY, innerWidth, innerHeight);
  aim.set(n.x, n.y);
  return aim;
}
function sattSiktY(v) {
  kal.siktY = klampaAndel(v);
  document.documentElement.style.setProperty('--sikt-y', (kal.siktY * 100).toFixed(1) + '%');
}
sattSiktY(kal.siktY);
const tangenter = new Set();
addEventListener('keydown', e => {
  const nyckel = String(e.key || '').toLowerCase();
  tangenter.add(nyckel);
  if (e.repeat || !startad) return;
  if (nyckel === 'q') stall.stegNer();
  else if (nyckel === 'e') stall.kastaNer();
  else if (nyckel === 'z' && stall.stallning === 'kna') stall.kikaUpp();
  else if (nyckel === 'c' && stall.stallning === 'kna') stall.kikaNer();
  else return;
  visaStall();
});
addEventListener('keyup', e => tangenter.delete(String(e.key || '').toLowerCase()));
function steg(dt, nu) {
  const d = Math.min(0.05, Math.max(0, dt || 0));
  const tid = Number.isFinite(nu) ? nu : performance.now();
  const vanlig = blick.uppdatera(d);
  const mal = laserPa && blick.harGyro ? laser.uppdatera(d) : vanlig;
  if (tid < hallTill) camera.quaternion.copy(hallQ);
  else latSikte(mal, d);
  tillampaGest(gester.mata(null, tid / 1000));
  const malOga = stall.oga();
  const tau = malOga < ogaVis - 0.04 ? 0.07 : 0.16;
  ogaVis += (malOga - ogaVis) * (1 - Math.exp(-Math.max(d, 0.001) / tau));
  if (Math.abs(malOga - ogaVis) < 0.004) ogaVis = malOga;
  ga(d);
  camera.position.y = markFn(camera.position.x, camera.position.z) + ogaVis;
  laggVapen(d);
  soldatApi.uppdatera(d);
  tickEld(d);
  effekt.tick(d);
  mataSkak(d, tid);
  ritaLaser(tid);
  svalna(d);
  visaStall();
  if (!window.__frys) renderer.render(scene, camera);
  bilder++;
  if (window.__pano) window.__pano.ritningar = renderer.info.render.calls;
}
function loop(nu) {
  requestAnimationFrame(loop);
  if (window.__frys) return;
  const dt = Math.min(0.05, Math.max(0, (nu - senast) / 1000));
  senast = nu;
  if (document.hidden) return;
  steg(dt, nu);
}
requestAnimationFrame(loop);

const start = $('starta');
const horisont = $('horisont');
const hint = $('hint');
const laserPanel = $('laserPanel');
const laserKnapp = $('laserKnapp');

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
  visaRetikel();
  markeraVapen();
  laserKnapp.classList.toggle('pa', laserPa);
  laserKnapp.setAttribute('aria-pressed', laserPa ? 'true' : 'false');
  laserKnapp.textContent = laserPa ? 'Laserpekare på' : 'Laserpekare';
  if (!laserPa) $('laserHint').hidden = true;
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
  markeraVapen();
  visaZoomText();
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
  const nasta = normalLaser({...laser.install, ...del, pa: laserPa});
  if (del.vapen) {
    const v = config.vapen.find(x => x.id === del.vapen);
    if (v) {
      nasta.vapen = v.id;
      nasta.sikte = v.sikte;
      nasta.zoom = v.forstoring;
    }
  }
  laser.satt(nasta);
  ljud.sattKaraktar(vapenNu().ljud);
  sparaLaser();
  fyllLaser();
  visaLaserUtseende();
  sattFov();
}
function valjVapen(id) {
  sikteInit = false;
  andraLaser({vapen: id});
}
function andraAxel(id, del) {
  const axlar = {};
  for (const nyckel of AXLAR) axlar[nyckel] = {...laser.install.axlar[nyckel]};
  axlar[id] = {...axlar[id], ...del};
  andraLaser({axlar});
}
function mataSkak(dt, nu) {
  const t = Number(nu) || 0;
  const amp = skakPa ? gangAmp(gangKlass, {ga: kal.ga, springa: kal.springa}) : 0;
  const freq = gangKlass === 'springa' ? 0.0145 : 0.0092;
  const basPx = gangKlass === 'springa' ? 24 : 8;
  const px = amp * basPx;
  const gx = Math.sin(t * freq) * px;
  const gy = Math.abs(Math.cos(t * freq * 2)) * px * 0.55;
  const mal = skakPa ? accSkak(senasteNiva.acc, senasteNiva.ryck, kal) : 0;
  const d = Math.max(dt, 0.001);
  if (mal > accEnergi) accEnergi += (mal - accEnergi) * (1 - Math.exp(-d / 0.04));
  else accEnergi *= Math.exp(-d / 0.28);
  if (accEnergi < 0.004) accEnergi = 0;
  const e = accEnergi * kal.accPx;
  skakX = gx + Math.sin(t * 0.037) * e;
  skakY = gy + Math.cos(t * 0.029) * e * 0.8;
}
function ritaLaser(nu) {
  const prick = $('laserPrick');
  const linje = $('laserLinje');
  const sikt = $('siktPrick');
  const kik = $('kikare');
  const zoomNu = laser.install.sikte === 'kikare' ? Math.max(1, laser.install.zoom) : 1;
  const extra = laserPa ? laser.skakPx() / zoomNu : 0;
  const x = skakX + Math.sin(nu * 0.05) * extra;
  const y = skakY + Math.cos(nu * 0.04) * extra;
  const flytt = Math.hypot(x, y) >= 0.35;
  const trans = flytt ? `translate(calc(-50% + ${x.toFixed(2)}px), calc(-50% + ${y.toFixed(2)}px))` : 'translate(-50%, -50%)';
  if (sikt) sikt.style.transform = trans;
  if (kik) kik.style.transform = flytt ? `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)` : '';
  if (prick) prick.style.transform = laserPa && flytt ? trans : '';
  if (linje) linje.style.transform = laserPa && flytt ? `translateX(calc(-50% + ${x.toFixed(2)}px))` : '';
  if (laserPanel.hidden) return;
  const m = laser.matare();
  for (const id of AXLAR) matareEl[id].style.width = Math.round(m[id] * 100) + '%';
}
function visaLaserHint() {
  if ($('laserHint')) $('laserHint').hidden = true;
  markera(HINT_NYCKEL);
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
$('standard').addEventListener('click', () => {
  blick.satt(STANDARD_STYR);
  spara();
  visaHorisont();
  for (const axel of AXLAR) fyllAxel(document.querySelector(`details[data-axel="${axel}"] .axelInre`), axel);
});
$('noll').addEventListener('click', nollstallAllt);
laserKnapp.addEventListener('click', () => sattLaser(!laserPa));
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
  laser.satt(normalLaser({...STANDARD_LASER, pa: laserPa, prick: config.prick.standard}));
  ljud.sattKaraktar('vanligt');
  sparaLaser();
  fyllLaser();
  visaLaserUtseende();
  sattFov();
});
function paVapenKlick(e) {
  const knapp = e.target.closest('[data-vapen]');
  if (!knapp) return;
  valjVapen(knapp.dataset.vapen);
}
$('vapenRad')?.addEventListener('click', paVapenKlick);
$('vapenVal')?.addEventListener('click', paVapenKlick);
$('ljudPa').addEventListener('click', () => {
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
function visaSkak() {
  const knapp = $('skakPa');
  if (!knapp) return;
  knapp.classList.toggle('pa', skakPa);
  knapp.setAttribute('aria-pressed', skakPa ? 'true' : 'false');
  knapp.textContent = skakPa ? 'Rörelseskak på' : 'Rörelseskak';
}
function fyllKalibrering() {
  const rader = [
    ['siktY', kal.siktY, v => Math.round(v * 100) + ' %'],
    ['skakGa', kal.ga, v => komFin(v)],
    ['skakSpring', kal.springa, v => komFin(v)],
    ['accDod', kal.dodzon, v => komFin(v)],
    ['accExp', kal.exponent, v => komFin(v)],
    ['gestFram', kal.fram, v => komFin(v) + '×'],
    ['gestVert', kal.vert, v => komFin(v) + '×']
  ];
  for (const [id, varde, vis] of rader) {
    const input = $(id);
    if (!input) continue;
    input.value = String(varde);
    const span = input.parentElement && input.parentElement.querySelector('span');
    if (span) span.textContent = vis(Number(varde));
  }
  const text = $('skakText');
  if (text) text.textContent = 'Stilla och Gå försiktigt är stilla i siktet. Gå är måttlig. Springa är kraftig.';
  visaSkak();
}
function lasKalibrering(e) {
  const id = e.target && e.target.id;
  const v = Number(e.target && e.target.value);
  if (!Number.isFinite(v)) return;
  if (id === 'siktY') sattSiktY(v);
  else if (id === 'skakGa') kal.ga = v;
  else if (id === 'skakSpring') kal.springa = v;
  else if (id === 'accDod') kal.dodzon = v;
  else if (id === 'accExp') kal.exponent = v;
  else if (id === 'gestFram') { kal.fram = v; gester.satt(kal.fram, kal.vert); }
  else if (id === 'gestVert') { kal.vert = v; gester.satt(kal.fram, kal.vert); }
  else return;
  fyllKalibrering();
}
function ritaSpak() {
  const skana = $('spakSkana');
  if (!skana) return;
  const index = Math.max(0, SPAK_LAGEN.findIndex(l => l.id === spakLage));
  const hack = skana.querySelector('[data-hack="' + index + '"]');
  const hand = $('spakHandtag');
  if (hack && hand) hand.style.top = (hack.offsetTop + hack.offsetHeight / 2 - hand.offsetHeight / 2) + 'px';
  skana.setAttribute('aria-valuenow', String(index));
  skana.setAttribute('aria-valuetext', lageAv(spakLage).namn);
  document.querySelectorAll('#spakNamn span').forEach(el => el.classList.toggle('pa', el.dataset.lage === spakLage));
}
function sattSpak(id) {
  const nasta = lageAv(id).id;
  if (nasta === spakLage) return spakLage;
  spakLage = nasta;
  ritaSpak();
  if (startad) ljud.klick(0.42);
  return spakLage;
}
let spakPek = 0;
function spakFranPek(e) {
  const r = $('spakSkana').getBoundingClientRect();
  const y = Math.min(1, Math.max(0, (e.clientY - r.top) / Math.max(1, r.height)));
  return lageFranAndel(1 - y).id;
}
$('spakSkana')?.addEventListener('pointerdown', e => {
  spakPek = e.pointerId;
  e.currentTarget.setPointerCapture?.(e.pointerId);
  sattSpak(spakFranPek(e));
});
$('spakSkana')?.addEventListener('pointermove', e => {
  if (e.pointerId !== spakPek) return;
  sattSpak(spakFranPek(e));
});
function slappSpak(e) { if (e.pointerId === spakPek) spakPek = 0; }
$('spakSkana')?.addEventListener('pointerup', slappSpak);
$('spakSkana')?.addEventListener('pointercancel', slappSpak);
$('knappSta')?.addEventListener('click', () => { stall.satt('staende'); visaStall(); });
$('knappKna')?.addEventListener('click', () => { stall.satt('kna'); visaStall(); });
$('knappLigg')?.addEventListener('click', () => { stall.kastaNer(); visaStall(); });
$('meny')?.addEventListener('input', lasKalibrering);
$('skakPa')?.addEventListener('click', () => {
  skakPa = !skakPa;
  if (!skakPa) { accEnergi = 0; skakX = 0; skakY = 0; }
  visaSkak();
});
fyllKalibrering();
visaStall();

function synkaLjud() {
  ljud.satt(laser.install.ljud, laser.install.volym);
}
function visaZoomText() {
  const el = $('zoomText');
  if (!el) return;
  const v = vapenNu();
  const grader = Math.round(aktuellFov());
  el.textContent = v.namn + ' · ' + v.under + '. Synfält ' + grader + '°. Träffar i kroppen fäller efter ' + config.traff.kroppsskott + ' skott. Ett skott i huvudet fäller direkt.';
}
function visaTraff() {
  const el = $('traffVis');
  if (el) el.textContent = String(traffAntal);
}
function ritaNiva() {
  const accP = Math.max(0, Math.min(1, visAcc / 8));
  const ryckP = Math.max(0, Math.min(1, visRyck / 40));
  $('accStapel').style.width = Math.round(accP * 100) + '%';
  $('ryckStapel').style.width = Math.round(ryckP * 100) + '%';
  $('accVis').textContent = kom(visAcc);
  $('ryckVis').textContent = kom(visRyck);
  $('ryckMatare').classList.toggle('puls', visRyck > 12);
  const acc2 = $('accStapelLjud');
  if (acc2) acc2.style.width = Math.round(accP * 100) + '%';
  const ryck2 = $('ryckStapelLjud');
  if (ryck2) ryck2.style.width = Math.round(ryckP * 100) + '%';
  if ($('accVisLjud')) $('accVisLjud').textContent = kom(visAcc);
  if ($('ryckVisLjud')) $('ryckVisLjud').textContent = kom(visRyck);
  $('ryckMatareLjud')?.classList.toggle('puls', visRyck > 12);
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
  const acc = e.acceleration;
  gester.prov({
    ax: acc && Number.isFinite(+acc.x) ? +acc.x : 0,
    ay: acc && Number.isFinite(+acc.y) ? +acc.y : 0,
    az: acc && Number.isFinite(+acc.z) ? +acc.z : 0,
    pitch: e.rotationRate && Number.isFinite(+e.rotationRate.beta) ? +e.rotationRate.beta : 0
  });
  const linjar = storlekVektor(e.acceleration);
  const rr = e.rotationRate;
  const omega = rr ? storlekVektor({x: rr.alpha, y: rr.beta, z: rr.gamma}) : null;
  if (linjar == null && omega == null) return;
  const tid = (Number.isFinite(e.timeStamp) ? e.timeStamp : performance.now()) / 1000;
  taNiva({linjar, omega}, tid);
}, {passive: true});

function arSack(obj) {
  for (let n = obj; n; n = n.parent) if (n.userData && n.userData.sack) return true;
  return false;
}
function hoppaOver(obj) {
  for (let n = obj; n; n = n.parent) {
    if (n.name === 'soldat') return true;
    const u = n.userData;
    if (!u) continue;
    if (u.himlen || u.soldat || u.zon || u.ingenTraff || u.sar || u.soldatKropp) return true;
  }
  return false;
}
function hittaTraff() {
  try {
    raycaster.far = config.terrang.raycast;
    raycaster.setFromCamera(siktePek(), camera);
    const lista = raycaster.intersectObjects(scene.children, true);
    for (const h of lista) {
      if (!(h.distance > 0.4) || h.distance > config.terrang.raycast) continue;
      if (hoppaOver(h.object)) continue;
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
function siktaMotPunkt(punkt, hall) {
  if (!punkt) return false;
  camera.lookAt(punkt);
  camera.updateMatrixWorld(true);
  hallQ.copy(camera.quaternion);
  hallTill = performance.now() + (hall == null ? 1600 : hall);
  sikteInit = false;
  return true;
}
function siktaMot(index) {
  return siktaMotPunkt(soldatApi.siktePunkt(index));
}
function siktaHuvud(index) {
  return siktaMotPunkt(soldatApi.sikteHuvud ? soldatApi.sikteHuvud(index) : null);
}
function avfyra() {
  const nu = performance.now();
  if (nu < sparrTill || nu - skottTid < 90) return false;
  if (!ljud.kanSkjuta()) return false;
  skottTid = nu;
  sparrTill = nu + (SPARR_MS[laser.install.vapen] || 800);
  skottAntal++;
  ljud.skott();
  if (laser.install.vibrera && typeof navigator.vibrate === 'function') {
    try { navigator.vibrate(18); } catch { /* Safari vibrerar inte */ }
  }
  blixt();
  $('skjut').classList.add('eld');
  setTimeout(() => $('skjut').classList.remove('eld'), 140);
  camera.updateMatrixWorld(true);
  const markTraff = hittaTraff();
  const fri = markTraff ? Math.max(0.5, markTraff.distance - 0.05) : config.terrang.raycast;
  raycaster.far = Math.min(config.terrang.raycast, fri);
  raycaster.setFromCamera(siktePek(), camera);
  const soldat = soldatApi.traffa(raycaster);
  if (soldat) {
    traffAntal++;
    ljud.traff(soldat.avstand);
    visaTraff();
    return soldat;
  }
  const traff = hittaTraff();
  if (traff) {
    effekt.damm(traff.point);
    if (arSack(traff.object)) {
      ljud.duns(traff.distance);
      return {traff: false, sack: true, avstand: traff.distance, punkt: {x: traff.point.x, y: traff.point.y, z: traff.point.z}};
    }
  }
  return {traff: false, sack: false};
}
function skjutMot(index) {
  if (!siktaMot(index)) return false;
  skottTid = 0;
  sparrTill = 0;
  return avfyra();
}
function skjutHuvud(index) {
  if (!siktaHuvud(index)) return false;
  skottTid = 0;
  sparrTill = 0;
  return avfyra();
}
function skymmer(fran, till) {
  ELD_DIR.copy(till).sub(fran);
  const dist = ELD_DIR.length();
  if (!(dist > 0.8)) return false;
  ELD_DIR.multiplyScalar(1 / dist);
  raycaster.set(fran, ELD_DIR);
  raycaster.far = dist - 0.35;
  let hits = [];
  try { hits = raycaster.intersectObjects(hinder, true); }
  catch { return false; }
  for (const h of hits) {
    if (!(h.distance > 0.3)) continue;
    if (hoppaOver(h.object)) continue;
    return true;
  }
  return false;
}
function avlossa(fran, mal, vapen) {
  const sprid = vapen === 'mg42' ? 0.055 : 0.02;
  ELD_DIR.copy(mal).sub(fran);
  if (ELD_DIR.lengthSq() < 1e-8) return;
  ELD_DIR.normalize();
  ELD_DIR.x += (Math.random() - 0.5) * sprid;
  ELD_DIR.y += (Math.random() - 0.7) * sprid;
  ELD_DIR.z += (Math.random() - 0.5) * sprid;
  ELD_DIR.normalize();
  raycaster.set(fran, ELD_DIR);
  raycaster.far = 160;
  let punkt = null;
  try {
    const hits = raycaster.intersectObjects(hinder, true);
    for (const h of hits) {
      if (!(h.distance > 0.45)) continue;
      if (hoppaOver(h.object)) continue;
      punkt = h.point;
      break;
    }
  } catch { /* en modell kan sakna träffyta */ }
  if (!punkt) {
    const x = mal.x + (Math.random() - 0.5) * 1.6;
    const z = mal.z + (Math.random() - 0.5) * 1.6;
    punkt = ELD_TILL.set(x, markFn(x, z) + 0.04, z);
  }
  effekt.spar(fran, punkt);
  effekt.damm(punkt);
  eldStat.skott++;
  eldStat.nedslag++;
  const nara = avstandTillSegment(fran.x, fran.y, fran.z, punkt.x, punkt.y, punkt.z, mal.x, mal.y, mal.z);
  if (nara < 1.25) {
    eldStat.viner++;
    ljud.viner(fran.distanceTo(mal));
  }
}
function tickEld(dt) {
  if (!startad || typeof soldatApi.skyttar !== 'function') return;
  const mal = camera.position;
  for (const s of soldatApi.skyttar()) {
    let st = eldTillstand.get(s.index);
    if (!st) st = skapaSkytt(s.vapen);
    ELD_FRAN.set(s.x, Math.max(0.4, s.y), s.z);
    const vill = st.salva > 0 ? st.steg <= dt : st.vanta <= dt;
    const synlig = vill && !skymmer(ELD_FRAN, mal);
    const steg = eldSteg(st, dt, synlig);
    eldTillstand.set(s.index, steg.s);
    if (steg.ut.includes('salva')) {
      eldStat.salva++;
      ljud.salva(ELD_FRAN.distanceTo(mal));
    }
    if (steg.ut.includes('skott')) avlossa(ELD_FRAN, mal, s.vapen);
  }
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
  catch (e) { if ($('sensorText')) $('sensorText').textContent = 'Sensorerna kunde inte starta. Dra i vyn för att titta. Texten ligger i Menyn.'; }
  $('startKort').hidden = true;
  $('skjut').hidden = false;
  $('menyKnapp').hidden = false;
  $('vapenRad').hidden = false;
  $('meny').hidden = true;
  startad = true;
  visaStall();
  ritaSpak();
  requestAnimationFrame(ritaSpak);
  visaRetikel();
  if (laser.install.pa) sattLaser(true);
  else lyft();
  requestAnimationFrame(lyft);
  if ($('hint')) $('hint').hidden = true;
  if ($('laserHint')) $('laserHint').hidden = true;
  if ($('kameraToast')) $('kameraToast').hidden = true;
  if ($('meny')) $('meny').hidden = true;
});

function visaFlik(id) {
  document.querySelectorAll('#flikRad button').forEach(knapp => {
    const pa = knapp.dataset.flik === id;
    knapp.classList.toggle('pa', pa);
    knapp.setAttribute('aria-selected', pa ? 'true' : 'false');
  });
  document.querySelectorAll('#meny [data-panel]').forEach(panel => {
    panel.hidden = panel.dataset.panel !== id;
  });
}
function visaMeny(pa) {
  $('meny').hidden = !pa;
  $('menyKnapp').classList.toggle('pa', !!pa);
  $('menyKnapp').setAttribute('aria-expanded', pa ? 'true' : 'false');
  if (pa) {
    fyllLaser();
    fyllKalibrering();
    visaTraff();
    visaBakgrundKnappar();
  }
}
function visaBakgrundKnappar() {
  document.querySelectorAll('#bakgrundVal button').forEach(knapp => {
    const pa = knapp.dataset.bakgrund === bakgrund.lage;
    knapp.classList.toggle('pa', pa);
    knapp.setAttribute('aria-pressed', pa ? 'true' : 'false');
  });
  document.querySelectorAll('#filterVal button').forEach(knapp => {
    const pa = knapp.dataset.filter === bakgrund.filter;
    knapp.classList.toggle('pa', pa);
    knapp.setAttribute('aria-pressed', pa ? 'true' : 'false');
  });
}
function appliceraMiljo() {
  const kamera = bakgrund.lage === 'kamera';
  if (miljoGrupp) miljoGrupp.visible = !kamera;
  scene.fog = kamera ? null : sparadDimma;
  renderer.setClearColor(0x000000, kamera ? 0 : 1);
}
async function valjBakgrund(lage) {
  let res;
  try { res = await bakgrund.sattLage(lage); }
  catch (fel) { res = {ok: false, lage: '3d', text: 'Kameran gick inte att öppna. 3D-miljön visas i stället.'}; }
  appliceraMiljo();
  visaBakgrundKnappar();
  const text = res.text || '';
  const notis = $('kameraMeddelande');
  notis.hidden = !text;
  notis.textContent = text;
  if ($('kameraToast')) $('kameraToast').hidden = true;
  return res;
}
function valjFilter(namn) {
  const vald = bakgrund.sattFilter(namn);
  visaBakgrundKnappar();
  return vald;
}
$('menyKnapp').addEventListener('click', () => visaMeny($('meny').hidden));
$('menyStang').addEventListener('click', () => visaMeny(false));
$('flikRad').addEventListener('click', e => {
  const knapp = e.target.closest('[data-flik]');
  if (knapp) visaFlik(knapp.dataset.flik);
});
$('bakgrundVal').addEventListener('click', e => {
  const knapp = e.target.closest('[data-bakgrund]');
  if (knapp) valjBakgrund(knapp.dataset.bakgrund);
});
$('filterVal').addEventListener('click', e => {
  const knapp = e.target.closest('[data-filter]');
  if (knapp) valjFilter(knapp.dataset.filter);
});
$('resFallna').addEventListener('click', () => soldatApi.resFallna());
$('fyllPa').addEventListener('click', () => soldatApi.fyllPa());
visaFlik('miljo');
visaBakgrundKnappar();

try {
  const varld = await byggVarld(scene, renderer, config, effekt);
  soldatApi = varld.soldater;
  kollision = skapaKollision(varld.kollision || []);
  hinder = varld.hinder || [];
  miljoGrupp = varld.miljo;
  sparadDimma = scene.fog;
  markFn = varld.markHojd;
  camera.far = config.terrang.kameraFar;
  camera.updateProjectionMatrix();
  window.__fel = [];
addEventListener('error', e => window.__fel.push(String(e.message || e.error || 'fel')));
addEventListener('unhandledrejection', e => window.__fel.push(String(e.reason && e.reason.message || e.reason || 'avbrott')));
  window.__pano = {
    kamera: camera, blick, laser, rapport: varld.rapport, teckenfel, renderer, scene,
    hackAntal: varld.hackAntal, matchFov: matchaFonsterFov, ljud, mataRorelse, skjut: avfyra,
    soldater: varld.soldater, siktaMot, siktaHuvud, skjutMot, skjutHuvud, visaMeny, visaFlik, steg,
    titta(x, y, z) {
      camera.lookAt(x, y, z);
      camera.updateMatrixWorld(true);
      hallQ.copy(camera.quaternion);
      hallTill = performance.now() + 3000;
      renderer.render(scene, camera);
    },
    markHojd: varld.markHojd, effekt, config, valjVapen, varn: varld.varn,
    sattKikare(pa) { valjVapen(pa ? 'kar98k' : 'vanligt'); },
    sattZoom(z) {
      const mal = Number(z);
      const v = config.vapen.find(x => x.sikte === 'kikare' && Math.abs(x.forstoring - mal) < 0.2) || config.vapen.find(x => Math.abs(x.forstoring - mal) < 0.2);
      if (v) valjVapen(v.id);
      else { sikteInit = false; andraLaser({sikte: 'kikare', zoom: mal}); }
    },
    sattLaser,
    sattBakgrund: valjBakgrund,
    sattFilter: valjFilter,
    get laserPa() { return laserPa; },
    get niva() { return {acc: visAcc, ryck: visRyck, senaste: senasteNiva}; },
    get skott() { return skottAntal; },
    get traffar() { return traffAntal; },
    get fov() { return camera.fov; },
    get zoom() { return laser.install.zoom; },
    get kikare() { return laser.install.sikte === 'kikare'; },
    get vapen() { return laser.install.vapen; },
    get retikel() { return vapenNu().retikel; },
    get bilder() { return bilder; },
    sank(pa) {
      stall.satt(pa ? 'ligg' : 'staende');
      visaStall();
      return stall.stallning === 'ligg';
    },
    styr(del) {
      if (del && typeof del === 'object') {
        if ('fram' in del) gangIntent.fram = Math.max(-1, Math.min(1, +del.fram || 0));
        if ('sida' in del) gangIntent.sida = Math.max(-1, Math.min(1, +del.sida || 0));
      }
      return {fram: gangIntent.fram, sida: gangIntent.sida, lage: spakLage};
    },
    get sankt() { return stall.stallning === 'ligg'; },
    get vapenLyft() { return vapenLyft; },
    get position() { return {x: camera.position.x, y: camera.position.y, z: camera.position.z}; },
    get oga() { return ogaVis; },
    spak: {
      get lage() { return spakLage; },
      satt(id) { return sattSpak(id); },
      get fart() { return framFart(spakLage, 0); }
    },
    stallning: {
      get id() { return stall.stallning; },
      get kik() { return stall.kik; },
      get oga() { return stall.oga(); },
      satt(id) { const ut = stall.satt(id); visaStall(); return ut; },
      stegNer() { const ut = stall.stegNer(); visaStall(); return ut; },
      kastaNer() { const ut = stall.kastaNer(); visaStall(); return ut; },
      kikaUpp() { const ut = stall.kikaUpp(); visaStall(); return ut; },
      kikaNer() { const ut = stall.kikaNer(); visaStall(); return ut; }
    },
    gester,
    kal,
    sattSiktY,
    sikteNdc() { const n = siktePek(); return {x: n.x, y: n.y}; },
    hus: varld.hus || husSpec(),
    kollision,
    eld: eldStat,
    traffaSikte() { return hittaTraff(); },
    placera(x, z, yaw) {
      camera.position.set(x, markFn(x, z) + ogaVis, z);
      camera.rotation.set(0, yaw || 0, 0);
      hallQ.copy(camera.quaternion);
      hallTill = performance.now() + 600000;
      return {x: camera.position.x, y: camera.position.y, z: camera.position.z};
    },
    skak: {
      get pa() { return skakPa; },
      get niva() { return gangKlass; },
      get amp() { return accEnergi; },
      get px() { return Math.hypot(skakX, skakY); },
      get x() { return skakX; },
      get y() { return skakY; },
      get kraftig() { return gangKlass === 'springa'; },
      sattPa(v) { skakPa = !!v; if (!skakPa) { accEnergi = 0; skakX = 0; skakY = 0; } visaSkak(); },
      sattGang(ga, springa) {
        if (Number.isFinite(+ga)) kal.ga = +ga;
        if (Number.isFinite(+springa)) kal.springa = +springa;
        fyllKalibrering();
      },
      sattKurva(dodzon, exponent) {
        if (Number.isFinite(+dodzon)) kal.dodzon = +dodzon;
        if (Number.isFinite(+exponent)) kal.exponent = +exponent;
        fyllKalibrering();
      }
    }
  };
  window.__redo = teckenfel.length === 0;
  start.disabled = false;
  start.textContent = 'Starta';
} catch (e) {
  console.error(e);
  start.textContent = 'Kunde inte ladda';
  $('startText').textContent = String(e.message || e);
}
