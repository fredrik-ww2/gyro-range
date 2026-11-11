import * as THREE from 'three';
import {sjalvtest as gyroTest, skapaRorelse} from './gyro.js';
import {sjalvtest as styrTest, STANDARD, normalStyr, ordnaTrosklar, skapaJamning, behandlaAxel, bandMal, skapaVagn, stegaVagn, stegaTorn, stegaEldror, BACKGAS} from './styr.js';
import {sjalvtest as banTest, banTabell, skapaGranat, stegGranat, delTid, V0} from './ballistik.js';
import {byggVarld, stegaMal} from './varld.js';

const NYCKEL = 'vagn_test_v1';
const GAS_ZON = 0.18;
const OMLADD = 7;
const SIKTE_FOV = 16;

const $ = id => document.getElementById(id);
const tal = (n, d = 0) => n.toFixed(d).replace('.', ',');
const canvas = $('vy');
const teckenfel = [...gyroTest(), ...styrTest(), ...banTest()];
if (teckenfel.length) console.error('Vagntest', teckenfel);

const rorelse = skapaRorelse(canvas);
let install = STANDARD;
try { install = normalStyr(JSON.parse(localStorage.getItem(NYCKEL) || 'null') || STANDARD); }
catch { install = STANDARD; }
const jamn = skapaJamning();
const vagn = skapaVagn();
let gas = 0;
let ladd = 0;
let igang = false;
let granat = null;
let traffor = 0;
let skott = 0;
let beskedTid = 0;
let blixtTid = 0;
let ljusTid = 0;
const tangenter = new Set();
let tvang = null;

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
const camera = new THREE.PerspectiveCamera(SIKTE_FOV, 1, 0.35, 2200);
camera.position.set(0, 2.1, 5);

const tabell = banTabell();
const sikte = $('sikte');
for (const rad of tabell) {
  const el = document.createElement('div');
  el.className = 'streck';
  el.dataset.vinkel = String(rad.vinkel);
  const s = document.createElement('span');
  s.textContent = String(rad.R);
  el.append(s);
  sikte.append(el);
}

function passaSikte() {
  const halva = Math.tan((camera.fov * Math.PI / 180) / 2);
  const h = Math.max(1, innerHeight);
  for (const el of sikte.querySelectorAll('.streck')) {
    const px = Math.tan(Number(el.dataset.vinkel)) / halva * (h / 2);
    el.style.top = `calc(50% + ${px.toFixed(1)}px)`;
  }
}

function passa() {
  const w = innerWidth;
  const h = Math.max(1, innerHeight);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  passaSikte();
}
passa();
addEventListener('resize', passa);
visualViewport?.addEventListener('resize', passa);
addEventListener('orientationchange', () => { rorelse.nollstall(); jamn.styra = jamn.torn = jamn.eldror = 0; setTimeout(passa, 200); });

const kartCanvas = $('karta');
const kartCtx = kartCanvas.getContext('2d');
const dir = new THREE.Vector3();
const mun = new THREE.Vector3();
const lokal = new THREE.Vector3();
const punkt = new THREE.Vector3();
const fore = new THREE.Vector3();
const inv = new THREE.Matrix4();
let varld = null;
let sol = null;
const traffLjus = new THREE.PointLight(0xffc078, 0, 22, 2);
scene.add(traffLjus);
const blossTex = blossTextur();
const sparMaterial = new THREE.SpriteMaterial({map: blossTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending});
const spar = new THREE.Sprite(sparMaterial);
spar.visible = false;
spar.frustumCulled = false;
scene.add(spar);
const mynningLjus = new THREE.PointLight(0xffe0a0, 0, 16, 2);
scene.add(mynningLjus);

function blossTextur() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,236,1)');
  grd.addColorStop(0.35, 'rgba(255,196,70,.9)');
  grd.addColorStop(1, 'rgba(255,110,20,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function spara() {
  try { localStorage.setItem(NYCKEL, JSON.stringify(install)); } catch { /* privat läge */ }
}

function effektiv() {
  return ordnaTrosklar(install.trosklar, install.axlar.styra.full);
}

const AXEL_TEXT = {
  styra: ['Styra', 'Luta telefonen som en ratt. Lite lutning bromsar. Mer: ena bandet står stilla. Ännu mer: det bandet backar.'],
  torn: ['Torn', 'Vrid telefonen som en dörr. Tornet vrider sig så länge telefonen är vriden, och stannar när den är rak.'],
  eldror: ['Eldrör', 'Tippa ovansidan upp så höjs eldröret. Det blir kvar när du rätar upp telefonen.']
};
const REGLAGE = [
  ['dodzon', 'Dödzon', 0, 15, 0.5, v => tal(v, 1) + '°'],
  ['kanslighet', 'Känslighet', 0.4, 2.5, 0.05, v => tal(v, 2) + '×'],
  ['full', 'Full effekt vid', 8, 70, 1, v => Math.round(v) + '°'],
  ['utjamning', 'Utjämning', 0, 1, 0.05, v => v < 0.05 ? 'ingen' : v > 0.75 ? 'stark' : 'medel']
];

function byggPanel() {
  const rot = $('axelLista');
  rot.replaceChildren();
  for (const id of ['styra', 'torn', 'eldror']) {
    const det = document.createElement('details');
    det.dataset.axel = id;
    const sum = document.createElement('summary');
    sum.textContent = AXEL_TEXT[id][0];
    const led = document.createElement('p');
    led.className = 'led';
    led.textContent = AXEL_TEXT[id][1];
    det.append(sum, led);
    for (const [nyckel, namn, min, max, steg, vis] of REGLAGE) {
      const label = document.createElement('label');
      label.className = 'reglage';
      const span = document.createElement('span');
      const input = document.createElement('input');
      input.type = 'range';
      input.min = String(min);
      input.max = String(max);
      input.step = String(steg);
      input.dataset.axel = id;
      input.dataset.nyckel = nyckel;
      label.append(namn, ' ', span, input);
      det.append(label);
      input.addEventListener('input', () => {
        install = normalStyr(install);
        install.axlar[id][nyckel] = Number(input.value);
        if (id === 'styra' && nyckel === 'full') {
          const o = effektiv();
          install.axlar.styra.full = o.full;
        }
        install = normalStyr(install);
        spara();
        fyllPanel();
      });
    }
    const check = document.createElement('label');
    check.className = 'check';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.dataset.axel = id;
    box.dataset.nyckel = 'invertera';
    check.append(box, 'Invertera');
    det.append(check);
    box.addEventListener('change', () => {
      install = normalStyr(install);
      install.axlar[id].invertera = box.checked;
      spara();
    });
    rot.append(det);
  }
  for (const input of document.querySelectorAll('[data-troskel]')) {
    input.addEventListener('input', () => {
      install = normalStyr(install);
      install.trosklar[input.dataset.troskel] = Number(input.value);
      const o = effektiv();
      install.trosklar.broms = o.broms;
      install.trosklar.ettBand = o.ettBand;
      install.trosklar.backBand = o.backBand;
      install.axlar.styra.full = Math.max(install.axlar.styra.full, o.full);
      install = normalStyr(install);
      spara();
      fyllPanel();
    });
  }
}
function fyllPanel() {
  install = normalStyr(install);
  for (const input of document.querySelectorAll('#axelLista input[type=range]')) {
    const ax = install.axlar[input.dataset.axel];
    input.value = String(ax[input.dataset.nyckel]);
    const spec = REGLAGE.find(r => r[0] === input.dataset.nyckel);
    input.parentElement.querySelector('span').textContent = spec[5](ax[input.dataset.nyckel]);
  }
  for (const box of document.querySelectorAll('#axelLista input[type=checkbox]')) {
    box.checked = !!install.axlar[box.dataset.axel].invertera;
  }
  const o = effektiv();
  for (const input of document.querySelectorAll('[data-troskel]')) {
    input.value = String(install.trosklar[input.dataset.troskel]);
    document.querySelector(`[data-vis="${input.dataset.troskel}"]`).textContent = Math.round(o[input.dataset.troskel]) + '°';
  }
  $('visaMat').checked = !!install.visaMat;
  $('mat').hidden = !install.visaMat;
}
byggPanel();
fyllPanel();

$('visaMat').addEventListener('change', () => {
  install.visaMat = $('visaMat').checked;
  spara();
  $('mat').hidden = !install.visaMat;
});
$('standard').addEventListener('click', () => {
  install = normalStyr(STANDARD);
  jamn.styra = jamn.torn = jamn.eldror = 0;
  spara();
  fyllPanel();
});
function visaInstall(oppna) {
  $('installningar').hidden = !oppna;
  $('installKnapp').setAttribute('aria-expanded', oppna ? 'true' : 'false');
}
$('installKnapp').addEventListener('click', () => visaInstall($('installningar').hidden));
$('stang').addEventListener('click', () => visaInstall(false));
$('noll').addEventListener('click', () => {
  rorelse.nollstall();
  jamn.styra = jamn.torn = jamn.eldror = 0;
});

function tFranVarde(v) {
  if (v < 0) return GAS_ZON * (1 + v / BACKGAS);
  return GAS_ZON + (1 - GAS_ZON) * v;
}
function vardeFranT(t) {
  const u = Math.max(0, Math.min(1, t));
  if (u <= GAS_ZON) return -BACKGAS * (1 - u / GAS_ZON);
  return (u - GAS_ZON) / (1 - GAS_ZON);
}
function ritaGas() {
  const t = tFranVarde(gas);
  const sparH = $('gasSpar');
  $('gasKnopp').style.bottom = (t * 100) + '%';
  $('gasNoll').style.bottom = (GAS_ZON * 100) + '%';
  const fyll = $('gasFyll');
  if (gas >= 0) {
    fyll.style.bottom = (GAS_ZON * 100) + '%';
    fyll.style.height = ((t - GAS_ZON) * 100) + '%';
    fyll.className = 'fram';
  } else {
    fyll.style.bottom = (t * 100) + '%';
    fyll.style.height = ((GAS_ZON - t) * 100) + '%';
    fyll.className = 'back';
  }
  $('gasText').textContent = gas < -0.01 ? 'Back ' + Math.round(-gas / BACKGAS * 100) + '%' : Math.round(gas * 100) + '%';
  sparH.dataset.gas = String(gas);
}
function sattGas(v) {
  gas = Math.max(-BACKGAS, Math.min(1, v));
  if (Math.abs(gas) < 0.03) gas = 0;
  ritaGas();
}
ritaGas();
const gasSpar = $('gasSpar');
function gasFranY(clientY) {
  const r = gasSpar.getBoundingClientRect();
  const t = 1 - (clientY - r.top) / Math.max(1, r.height);
  let v = vardeFranT(t);
  if (Math.abs(v) < 0.03) v = 0;
  return v;
}
gasSpar.addEventListener('pointerdown', e => {
  gasSpar.setPointerCapture(e.pointerId);
  sattGas(gasFranY(e.clientY));
});
gasSpar.addEventListener('pointermove', e => {
  if (!gasSpar.hasPointerCapture(e.pointerId)) return;
  sattGas(gasFranY(e.clientY));
});

function lasVinklar() {
  if (tvang) return tvang;
  const v = rorelse.vinklar();
  if (!rorelse.harGyro && $('installningar').hidden) {
    if (tangenter.has('KeyA')) v.roll = -0.9;
    if (tangenter.has('KeyD')) v.roll = 0.9;
    if (tangenter.has('ArrowLeft')) v.yaw = -0.8;
    if (tangenter.has('ArrowRight')) v.yaw = 0.8;
    if (tangenter.has('ArrowUp')) v.pitch = 0.75;
    if (tangenter.has('ArrowDown')) v.pitch = -0.75;
  }
  return v;
}

addEventListener('keydown', e => {
  if (e.repeat) return;
  if (e.code === 'Space' && igang && $('installningar').hidden && (e.target === document.body || e.target === canvas)) {
    e.preventDefault();
    $('eld').click();
    return;
  }
  if (e.target && e.target.closest && e.target.closest('input,textarea')) return;
  tangenter.add(e.code);
});
addEventListener('keyup', e => tangenter.delete(e.code));
addEventListener('blur', () => tangenter.clear());

function lasFast() {
  if (!varld) return;
  varld.rigg.position.set(vagn.x, 0, vagn.z);
  varld.rigg.rotation.y = vagn.yaw;
  varld.torn.rotation.y = -vagn.torn;
  varld.eldror.rotation.x = vagn.eld;
  varld.rigg.updateMatrixWorld(true);
}

function iMal(mesh, box, punkt) {
  const marg = 0.7;
  inv.copy(mesh.matrixWorld).invert();
  lokal.copy(punkt).applyMatrix4(inv);
  return lokal.x >= box.min.x - marg && lokal.x <= box.max.x + marg
    && lokal.y >= box.min.y - marg && lokal.y <= box.max.y + marg
    && lokal.z >= box.min.z - marg && lokal.z <= box.max.z + marg;
}

function visaBesked(text, traff) {
  const el = $('besked');
  el.hidden = false;
  el.textContent = text;
  el.classList.toggle('traff', !!traff);
  beskedTid = 3.2;
}

function traffa(punkt, tiger) {
  if (tiger) traffor += 1;
  granat = null;
  spar.visible = false;
  if (tiger) {
    tiger.mesh.userData.blixt = 0.45;
    tiger.mesh.material.emissive?.setHex(0xff7a3a);
  }
  traffLjus.position.copy(punkt);
  ljusTid = 0.28;
  blixt();
  const avstand = Math.hypot(punkt.x - mun.x, punkt.z - mun.z);
  const tid = granatTid;
  visaBesked((tiger ? 'Träff' : 'Nedslag') + ' ' + Math.round(avstand) + ' m · ' + tal(tid, 1) + ' s', !!tiger);
}
let granatTid = 0;
let senSkott = null;

function avfyra() {
  if (!igang || ladd > 0 || granat || !varld) return;
  lasFast();
  camera.getWorldPosition(mun);
  camera.getWorldDirection(dir);
  const start = mun.clone().addScaledVector(dir, 1.6);
  granat = skapaGranat(start.x, start.y, start.z, dir.x * V0, dir.y * V0, dir.z * V0);
  granatTid = 0;
  senSkott = {y: +start.y.toFixed(2), dirY: +dir.y.toFixed(4), eld: +vagn.eld.toFixed(4), camY: +mun.y.toFixed(2)};
  ladd = OMLADD;
  skott += 1;
  spar.visible = true;
  spar.position.copy(start);
  mynningLjus.position.copy(start);
  mynningLjus.intensity = 6;
  blixt();
}
function blixt() {
  const el = $('blixt');
  el.classList.remove('pa');
  void el.offsetWidth;
  el.classList.add('pa');
  blixtTid = 0.14;
}

$('eld').addEventListener('click', e => {
  if (!igang || ladd > 0) { e.preventDefault(); return; }
  try { navigator.vibrate?.(28); } catch { /* Safari utan vibrate */ }
  avfyra();
});

function ritaKarta() {
  const g = kartCtx;
  const w = kartCanvas.width;
  const h = kartCanvas.height;
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#142018';
  g.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;
  const skala = (h * 0.46) / 860;
  const c = Math.cos(vagn.yaw);
  const si = Math.sin(vagn.yaw);
  const ratt = (x, z) => {
    const dx = x - vagn.x;
    const dz = z - vagn.z;
    const lx = dx * c - dz * si;
    const lf = dx * (-si) - dz * c;
    return [cx + lx * skala, cy - lf * skala];
  };
  g.strokeStyle = '#345042';
  g.lineWidth = 2;
  for (const r of [400, 800]) {
    g.beginPath();
    g.arc(cx, cy, r * skala, 0, Math.PI * 2);
    g.stroke();
  }
  if (varld) for (const t of varld.tigrar) {
    const [sx, sy] = ratt(t.mesh.position.x, t.mesh.position.z);
    g.fillStyle = '#e07a4a';
    g.fillRect(sx - 5, sy - 5, 10, 10);
  }
  g.fillStyle = '#f4f7ee';
  g.beginPath();
  g.moveTo(cx, cy - 22);
  g.lineTo(cx - 11, cy + 14);
  g.lineTo(cx, cy + 4);
  g.lineTo(cx + 11, cy + 14);
  g.closePath();
  g.fill();
  const a = vagn.torn;
  g.strokeStyle = '#e0f1a4';
  g.lineWidth = 4;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(cx, cy);
  g.lineTo(cx + Math.sin(a) * 36, cy - Math.cos(a) * 36);
  g.stroke();
}

function ritaMat(rav) {
  if (!install.visaMat) return;
  const tro = effektiv();
  const styra = behandlad.styra;
  const torn = behandlad.torn;
  const eld = behandlad.eldror;
  $('mat').textContent = [
    'Telefon  styra ' + tal(rav.roll * 180 / Math.PI, 1) + '°   torn ' + tal(rav.yaw * 180 / Math.PI, 1) + '°   eldrör ' + tal(rav.pitch * 180 / Math.PI, 1) + '°',
    'Efter reglage  ' + tal(styra.grader, 1) + '°   ' + tal(torn.grader, 1) + '°   ' + tal(eld.grader, 1) + '°',
    'Band  V ' + tal(vagn.vL * 3.6, 0) + '   H ' + tal(vagn.vR * 3.6, 0) + ' km/h   tröskel ' + Math.round(tro.broms) + '/' + Math.round(tro.ettBand) + '/' + Math.round(tro.backBand),
    'Torn ' + tal(vagn.torn * 180 / Math.PI, 0) + '°   eldrör ' + tal(vagn.eld * 180 / Math.PI, 1) + '°'
  ].join('\n');
}

let behandlad = {
  styra: {grader: 0, u: 0},
  torn: {grader: 0, u: 0},
  eldror: {grader: 0, u: 0}
};

function stegaGranat(dt) {
  if (!granat || !varld) return;
  let kvar = dt;
  while (kvar > 1e-5 && granat) {
    const h = delTid(granat, kvar);
    stegGranat(granat, h);
    granatTid = granat.tid;
    punkt.set(granat.x, granat.y, granat.z);
    if (granat.tid > 0.04) {
      for (const t of varld.tigrar) {
        t.mesh.updateMatrixWorld(true);
        fore.set(granat.foreX, granat.foreY, granat.foreZ);
        if (iMal(t.mesh, t.box, punkt) || iMal(t.mesh, t.box, fore)) {
          traffa(punkt, t);
          return;
        }
      }
      if (granat.y <= 0.05) {
        punkt.y = 0.08;
        traffa(punkt, null);
        return;
      }
    }
    if (granat.tid > 8 || Math.hypot(granat.x, granat.z) > 1600) {
      granat = null;
      spar.visible = false;
      return;
    }
    kvar -= h;
  }
  if (granat) {
    spar.position.set(granat.x, granat.y, granat.z);
    const d = camera.position.distanceTo(spar.position);
    const s = Math.max(0.45, d * 0.012);
    spar.scale.set(s, s, s);
    $('flygtid').hidden = false;
    $('flygtid').textContent = tal(granat.tid, 1) + ' s';
  }
}

function tick(dt) {
  if (!igang || !varld || !(dt > 0)) return;
  const rav = lasVinklar();
  behandlad = {
    styra: behandlaAxel(rav.roll, install.axlar.styra, dt, jamn, 'styra'),
    torn: behandlaAxel(rav.yaw, install.axlar.torn, dt, jamn, 'torn'),
    eldror: behandlaAxel(rav.pitch, install.axlar.eldror, dt, jamn, 'eldror')
  };
  const tro = effektiv();
  const mal = bandMal(gas, behandlad.styra.grader, tro);
  stegaVagn(vagn, mal, dt);
  vagn.torn = stegaTorn(vagn.torn, behandlad.torn.u, dt);
  vagn.eld = stegaEldror(vagn.eld, behandlad.eldror.u, dt);
  for (const t of varld.tigrar) {
    stegaMal(t, dt);
    if (t.mesh.userData.blixt > 0) {
      t.mesh.userData.blixt = Math.max(0, t.mesh.userData.blixt - dt);
      const k = t.mesh.userData.blixt / 0.45;
      t.mesh.material.emissive?.setRGB(1 * k, 0.42 * k, 0.16 * k);
    }
  }
  lasFast();
  stegaGranat(dt);
  if (ladd > 0) ladd = Math.max(0, ladd - dt);
  $('gasFart').innerHTML = Math.round(Math.abs(vagn.fart) * 3.6) + '<small> km/h</small>';
  $('eldStatus').textContent = ladd > 0.05 ? 'Laddar ' + Math.ceil(ladd) : 'Redo';
  $('eldWrap').classList.toggle('laddar', ladd > 0.05);
  if (!granat) $('flygtid').hidden = true;
  if (beskedTid > 0) {
    beskedTid -= dt;
    if (beskedTid <= 0) $('besked').hidden = true;
  }
  ritaMat(rav);
  ritaKarta();
  if (sol) {
    sol.position.set(vagn.x - 36, 70, vagn.z + 24);
    sol.target.position.set(vagn.x, 0, vagn.z);
    sol.target.updateMatrixWorld();
  }
}

let senast = performance.now();
function loop(nu) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, Math.max(0, (nu - senast) / 1000));
  senast = nu;
  if (document.hidden) return;
  tick(dt);
  if (ljusTid > 0) {
    ljusTid -= dt;
    traffLjus.intensity = Math.max(0, ljusTid / 0.28) * 10;
  } else traffLjus.intensity = 0;
  if (mynningLjus.intensity > 0) mynningLjus.intensity = Math.max(0, mynningLjus.intensity - dt * 40);
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);

function visaSpel() {
  igang = true;
  $('startKort').hidden = true;
  for (const id of ['gas', 'topp', 'karta', 'kartaText', 'eldWrap', 'sikte']) $(id).hidden = false;
  if (!rorelse.harGyro) setTimeout(() => { if (!rorelse.harGyro) $('hint').hidden = false; }, 900);
  passa();
}

$('starta').addEventListener('click', async () => {
  $('starta').disabled = true;
  try { await rorelse.start(); }
  catch { $('hint').hidden = false; }
  jamn.styra = jamn.torn = jamn.eldror = 0;
  visaSpel();
});

const start = $('starta');
byggVarld(scene, renderer).then(v => {
  varld = v;
  sol = v.sol;
  v.eldror.add(camera);
  camera.position.copy(v.sikte);
  camera.rotation.set(0, 0, 0);
  lasFast();
  start.disabled = false;
  start.textContent = 'Starta';
  window.__vagn = {
    vagn, install, tabell, varld: v, camera, scene, renderer, teckenfel,
    get gas() { return gas; },
    sattGas, mata(roll, yaw, pitch) { tvang = {roll, yaw, pitch}; },
    slapp() { tvang = null; },
    eld: avfyra,
    tick,
    get senSkott() { return senSkott; },
    get granat() { return granat; },
    get traffar() { return traffor; },
    get skott() { return skott; },
    get ladd() { return ladd; },
    noll: () => rorelse.nollstall()
  };
  window.__redo = teckenfel.length === 0;
}).catch(e => {
  console.error(e);
  start.textContent = 'Kunde inte ladda';
  $('startText').textContent = String(e.message || e);
});
