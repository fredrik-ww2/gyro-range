import * as THREE from 'three';
import {sjalvtest as gyroTest, skapaRorelse} from './gyro.js?v=8';
import {sjalvtest as styrTest, STANDARD, normalStyr, ordnaTrosklar, skapaJamning, behandlaAxel, bandMal, skapaVagn, stegaVagn, stegaTorn, stegaEldror, ELD_MIN, ELD_MAX, TORN_UPP, ELD_UPP} from './styr.js?v=8';
import {sjalvtest as banTest, banTabell, skapaGranat, stegGranat, delTid, V0} from './ballistik.js?v=7';
import {byggVarld, stegaMal} from './varld.js?v=20';
import {sjalvtest as mekTest, MEKANIK, VAXLAR, gasAntal, gasVarde, gasOpt, vaxelOpt, vaxelFranId, draHack, slappHack, drivKommando} from './mekanik.js?v=7';
import {sjalvtest as ljudTest, skapaMekanikLjud, kansla} from './ljud.js?v=7';
import {sjalvtest as effektTest, stegFjader, vridMot, nastaSalva, tigerUtslagen, nedslagMotSpelare} from './effekt.js?v=7';
import {sjalvtest as hojdTest, skrovLutning} from './hojd.js?v=7';
import {sjalvtest as pansarTest, REGLER, VAGN_LISTA, standardRegler, siktenFor, sikteFor, klassFranLokal, bedomTraff} from './pansar.js?v=7';
import {monteraVagn} from './gyrobox-adapter.js';
import {lyssnaSkarm} from '../shared/sensor.js';
import config from './config.json' with { type: 'json' };

const NYCKEL = 'vagn_test_v1';
const REGEL_NYCKEL = 'vagn_test_regler_v5';
const OMLADD = 7;

const $ = id => document.getElementById(id);
const tal = (n, d = 0) => n.toFixed(d).replace('.', ',');
const canvas = $('vy');
const teckenfel = [...gyroTest(), ...styrTest(), ...banTest(), ...mekTest(), ...ljudTest(), ...effektTest(), ...hojdTest(), ...pansarTest()];
if (teckenfel.length) console.error('Vagntest', teckenfel);

const rorelse = skapaRorelse(canvas);
let install = STANDARD;
try { install = normalStyr(JSON.parse(localStorage.getItem(NYCKEL) || 'null') || STANDARD); }
catch { install = STANDARD; }
const gyroLada = monteraVagn({axlar: install.axlar, nollstall: () => rorelse.nollstall()});
const jamn = skapaJamning();
const vagn = skapaVagn();
let tornFart = 0;
let eldFart = 0;
const ljudMotor = skapaMekanikLjud();
let vaxelIndex = vaxelFranId('N');
let gasIndex = 0;
let gas = 0;
let gasStopp = false;
let vaxelStopp = false;
const GRANATER = {
  sprang: {id: 'sprang', namn: 'Spränggranat', kort: 'Spräng'},
  pansar: {id: 'pansar', namn: 'Pansargranat', kort: 'Pansar'}
};
let vagnId = 'sherman_m4_75';
let sikteId = 'm70f';
let kamera = 'sikte';
let spelRegler = standardRegler();
try {
  const sparad = JSON.parse(localStorage.getItem(REGEL_NYCKEL) || 'null');
  if (sparad) spelRegler = {...standardRegler(), ...sparad, rikoschett: sparad.rikoschett !== false};
} catch { /* privat läge */ }
let granatTyp = 'sprang';
let skottTyp = granatTyp;
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
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(sikteFor(vagnId, sikteId).synfalt, 1, config.kamera?.nearSikte || 0.06, config.kamera?.far || 7000);
camera.position.set(0, 2.1, 5);

const tabell = banTabell();
const sikte = $('sikte');
const STRECK_BREDD = {200: 36, 400: 26, 600: 18, 800: 13};
for (const rad of tabell) {
  if (rad.R > 800) continue;
  const el = document.createElement('div');
  el.className = 'streck';
  el.dataset.vinkel = String(rad.vinkel);
  el.dataset.m = String(rad.R);
  const b = STRECK_BREDD[rad.R] || 14;
  el.style.width = b + 'px';
  el.style.marginLeft = (-b / 2) + 'px';
  const s = document.createElement('span');
  s.textContent = String(rad.R);
  el.append(s);
  sikte.append(el);
}
byggNitar();

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
lyssnaSkarm(() => { rorelse.nollstall(); jamn.styra = jamn.torn = jamn.eldror = 0; setTimeout(passa, 200); });

const kartCanvas = $('karta');
const kartCtx = kartCanvas.getContext('2d');
const dir = new THREE.Vector3();
const mun = new THREE.Vector3();
const lokal = new THREE.Vector3();
const punkt = new THREE.Vector3();
const fore = new THREE.Vector3();
const inv = new THREE.Matrix4();
const titt = new THREE.Vector3();
const vel = new THREE.Vector3();
const rel = new THREE.Vector3();
const ramH = new THREE.Vector3();
const upp = new THREE.Vector3(0, 1, 0);
const qInv = new THREE.Quaternion();
let varld = null;
let sol = null;
const traffLjus = new THREE.PointLight(0xffc078, 0, 22, 2);
scene.add(traffLjus);
const fiendeLjus = new THREE.PointLight(0xffc070, 0, 24, 2);
scene.add(fiendeLjus);
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

const eldTex = mjukTextur([[0, 'rgba(255,255,240,1)'], [0.35, 'rgba(255,176,48,.85)'], [1, 'rgba(255,80,10,0)']]);
const rokTex = mjukTextur([[0, 'rgba(255,255,255,.75)'], [0.45, 'rgba(210,206,198,.35)'], [1, 'rgba(180,176,168,0)']]);
const eldPool = skapaPool(56, eldTex, THREE.AdditiveBlending, false);
const rokPool = skapaPool(72, rokTex, THREE.NormalBlending, true);
let rekylX = 0;
let rekylV = 0;
let skak = 0;
let skakTid = 0;
let fartNal = 0;
let eldNal = 0;
let senRpm = 500;

function mjukTextur(stopp) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  for (const [p, f] of stopp) grd.addColorStop(p, f);
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function skapaPool(max, tex, blending, ton) {
  const lista = [];
  for (let i = 0; i < max; i++) {
    const mat = new THREE.SpriteMaterial({map: tex, transparent: true, depthWrite: false, blending, toneMapped: ton});
    const s = new THREE.Sprite(mat);
    s.visible = false;
    s.frustumCulled = false;
    s.renderOrder = 3;
    scene.add(s);
    lista.push({s, liv: 0, max: 1, vx: 0, vy: 0, vz: 0, g: 0, bas: 1, vax: 0, op: 1});
  }
  return {
    skjut(o) {
      let rec = null;
      let bast = Infinity;
      for (const r of lista) {
        if (r.liv <= 0) { rec = r; break; }
        if (r.liv < bast) { bast = r.liv; rec = r; }
      }
      rec.liv = o.liv;
      rec.max = o.liv;
      rec.vx = o.vx || 0;
      rec.vy = o.vy || 0;
      rec.vz = o.vz || 0;
      rec.g = o.g || 0;
      rec.bas = o.size || 1;
      rec.vax = o.vax || 0;
      rec.op = o.op ?? 0.9;
      rec.s.position.set(o.x, o.y, o.z);
      rec.s.material.color.setRGB(o.r ?? 1, o.gc ?? 1, o.b ?? 1);
      rec.s.material.opacity = rec.op;
      rec.s.scale.setScalar(rec.bas);
      rec.s.visible = true;
    },
    steg(dt) {
      for (const rec of lista) {
        if (rec.liv <= 0) continue;
        rec.liv -= dt;
        if (rec.liv <= 0) { rec.s.visible = false; continue; }
        rec.vy += rec.g * dt;
        rec.s.position.x += rec.vx * dt;
        rec.s.position.y += rec.vy * dt;
        rec.s.position.z += rec.vz * dt;
        const u = Math.max(0, rec.liv / rec.max);
        rec.s.material.opacity = rec.op * u;
        rec.s.scale.setScalar(Math.max(0.05, rec.bas * (1 + rec.vax * (1 - u))));
      }
    }
  };
}

function riktning(fart) {
  const a = Math.random() * Math.PI * 2;
  const y = 0.25 + Math.random() * 0.75;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  return {vx: Math.cos(a) * r * fart, vy: y * fart, vz: Math.sin(a) * r * fart};
}

function puff(pool, n, bas, fart) {
  for (let i = 0; i < n; i++) {
    const v = riktning(fart);
    pool.skjut({
      x: bas.x + (Math.random() - 0.5) * bas.sprid,
      y: bas.y + Math.random() * bas.sprid * 0.35,
      z: bas.z + (Math.random() - 0.5) * bas.sprid,
      vx: v.vx, vy: v.vy, vz: v.vz,
      g: bas.g, liv: bas.liv * (0.65 + Math.random() * 0.7),
      size: bas.size * (0.65 + Math.random() * 0.7),
      vax: bas.vax || 0, op: bas.op,
      r: bas.r, gc: bas.gc, b: bas.b
    });
  }
}

function salvaMynning(pos, dir) {
  puff(eldPool, 10, {x: pos.x, y: pos.y, z: pos.z, sprid: 0.35, g: 0.2, liv: 0.18, size: 1.6, vax: 1.3, op: 0.95, r: 1, gc: 0.82, b: 0.4}, 4);
  for (let i = 0; i < 8; i++) {
    rokPool.skjut({
      x: pos.x - dir.x * 0.3, y: pos.y, z: pos.z - dir.z * 0.3,
      vx: -dir.x * (0.5 + Math.random() * 1.2) + (Math.random() - 0.5) * 0.6,
      vy: 0.35 + Math.random() * 0.9,
      vz: -dir.z * (0.5 + Math.random() * 1.2) + (Math.random() - 0.5) * 0.6,
      g: 0.1, liv: 0.85 + Math.random() * 0.6,
      size: 0.9, vax: 2.6, op: 0.38,
      r: 0.72, gc: 0.7, b: 0.64
    });
  }
}

function salvaNedslag(p, art) {
  const traff = art === 'traff' || art === 'pansar';
  const x = p.x;
  const y = Math.max(0.15, p.y);
  const z = p.z;
  puff(eldPool, traff ? 12 : 9, {x, y, z, sprid: 0.9, g: -0.6, liv: 0.24, size: traff ? 2.4 : 1.9, vax: 1.5, op: 0.95, r: 1, gc: 0.68, b: 0.22}, traff ? 8 : 5);
  puff(eldPool, art === 'pansar' ? 16 : 8, {x, y, z, sprid: 0.5, g: -7, liv: 0.4, size: 0.42, vax: 0.2, op: 1, r: 1, gc: 0.88, b: 0.45}, 16);
  if (!traff) puff(rokPool, 14, {x, y: 0.25, z, sprid: 1.4, g: -11, liv: 0.75, size: 0.6, vax: 0.5, op: 0.88, r: 0.45, gc: 0.32, b: 0.16}, 9);
  puff(rokPool, traff ? 11 : 8, {x, y, z, sprid: 0.7, g: 0.35, liv: 1.6, size: 2, vax: 2.4, op: 0.48, r: 0.32, gc: 0.3, b: 0.28}, 2.4);
}

function salvaBrand(x, y, z, kraft) {
  eldPool.skjut({
    x, y, z,
    vx: (Math.random() - 0.5) * 0.7, vy: 0.7 + Math.random() * 1.1, vz: (Math.random() - 0.5) * 0.7,
    g: 0.35, liv: 0.32 + Math.random() * 0.2, size: 0.7 + kraft, vax: 1.1, op: 0.8,
    r: 1, gc: 0.42, b: 0.08
  });
  rokPool.skjut({
    x, y: y + 0.3, z,
    vx: (Math.random() - 0.5) * 0.5, vy: 1.1 + Math.random(), vz: (Math.random() - 0.5) * 0.5,
    g: 0.15, liv: 1.2 + Math.random() * 0.4, size: 1.1 + kraft, vax: 1.8, op: 0.42,
    r: 0.24, gc: 0.22, b: 0.2
  });
}

function stegaPartiklar(dt) {
  eldPool.steg(dt);
  rokPool.steg(dt);
}

function varna(text) {
  const el = $('varning');
  el.classList.remove('pa');
  void el.offsetWidth;
  el.classList.add('pa');
  const b = $('besked');
  b.hidden = false;
  b.textContent = text;
  b.classList.remove('traff');
  b.classList.add('varning');
  beskedTid = 2.6;
}

function rustaTigrar() {
  if (!varld) return;
  const n = varld.tigrar.length;
  varld.tigrar.forEach((t, i) => {
    t.skada = 0;
    t.utslagen = false;
    t.rekyl = 0;
    t.rekylV = 0;
    t.rekylFore = 0;
    t.rekylYaw = t.mesh.rotation.y;
    t.nasta = nastaSalva((i + 0.2) / Math.max(1, n));
    t.rokTid = 0.5 + i * 0.15;
    t.skott = null;
    t.spar = new THREE.Sprite(sparMaterial.clone());
    t.spar.material.color.setHex(0xffe2a8);
    t.spar.material.toneMapped = false;
    t.spar.visible = false;
    t.spar.frustumCulled = false;
    t.spar.renderOrder = 4;
    scene.add(t.spar);
    if (t.mesh.material?.color) t.basFarg = t.mesh.material.color.clone();
  });
}

function tonaTiger(t) {
  const mat = t.mesh.material;
  if (!mat?.color || !t.basFarg) return;
  const u = t.utslagen ? 0.32 : Math.max(0.55, 1 - t.skada * 0.16);
  mat.color.copy(t.basFarg).multiplyScalar(u);
}

function avfyraTiger(t) {
  if (t.utslagen || t.skott) return;
  const yaw = t.mesh.rotation.y;
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  const x = t.mesh.position.x + fx * 3.5;
  const y = t.mesh.position.y + 1.85;
  const z = t.mesh.position.z + fz * 3.5;
  const traffForsok = Math.random() < 0.3;
  const rad = traffForsok ? 1.2 + Math.random() * 4.2 : 9 + Math.random() * 16;
  const ang = Math.random() * Math.PI * 2;
  const lead = 0.35;
  const tx = vagn.x - Math.sin(vagn.yaw) * vagn.fart * lead + Math.cos(ang) * rad;
  const tz = vagn.z - Math.cos(vagn.yaw) * vagn.fart * lead + Math.sin(ang) * rad;
  const ty = (t.yVid ? t.yVid(vagn.x, vagn.z) : t.mesh.position.y) + 1.5;
  const dist = Math.hypot(tx - x, ty - y, tz - z);
  t.skott = {x, y, z, tx, ty, tz, flyg: Math.max(0.28, dist / 780), tid: 0};
  t.spar.visible = true;
  t.spar.position.set(x, y, z);
  t.rekylV += 11;
  fiendeLjus.position.set(x, y, z);
  fiendeLjus.intensity = 26;
  puff(eldPool, 8, {x, y, z, sprid: 0.4, g: 0.1, liv: 0.16, size: 1.8 + Math.sqrt(dist) * 0.08, vax: 1.2, op: 0.95, r: 1, gc: 0.75, b: 0.35}, 3);
  rokPool.skjut({x, y, z, vx: fx * 1.5, vy: 0.6, vz: fz * 1.5, g: 0.2, liv: 0.8, size: 1.2, vax: 1.6, op: 0.4, r: 0.6, gc: 0.58, b: 0.52});
  ljudMotor.fiendeSkott(Math.hypot(vagn.x - t.mesh.position.x, vagn.z - t.mesh.position.z));
}

function stegaTigerSkott(t, dt) {
  const g = t.skott;
  if (!g) return;
  g.tid += dt;
  const u = Math.min(1, g.tid / g.flyg);
  const x = g.x + (g.tx - g.x) * u;
  const z = g.z + (g.tz - g.z) * u;
  const y = g.y + (g.ty - g.y) * u + Math.sin((1 - u) * Math.PI) * 0.35;
  t.spar.position.set(x, y, z);
  const d = Math.max(1, camera.position.distanceTo(t.spar.position));
  const s = 1.15 + Math.sqrt(d) * 0.16;
  t.spar.scale.set(s, s, 1);
  if (u < 1 && g.tid % 0.04 < dt) {
    eldPool.skjut({x, y, z, vx: 0, vy: 0.15, vz: 0, liv: 0.1, size: 0.4, op: 0.65, r: 1, gc: 0.78, b: 0.35});
  }
  if (u < 1) return;
  t.skott = null;
  t.spar.visible = false;
  const avst = Math.hypot(g.tx - vagn.x, g.tz - vagn.z);
  salvaNedslag({x: g.tx, y: 0.3, z: g.tz}, 'mark');
  const sort = nedslagMotSpelare(avst);
  ljudMotor.nedslag(Math.max(8, avst));
  if (sort === 'traff') {
    skak = Math.max(skak, 1);
    ljudMotor.traff(Math.max(6, avst));
    varna('Träff mot vagnen');
  } else if (sort === 'nara') {
    skak = Math.max(skak, 0.48);
    varna('Nedslag nära');
  }
}

function stegaTiger(t, dt) {
  if (t.rekylFore) {
    t.mesh.position.x += Math.sin(t.rekylYaw || 0) * t.rekylFore;
    t.mesh.position.z += Math.cos(t.rekylYaw || 0) * t.rekylFore;
  }
  if (!t.utslagen) {
    if (t.fart > 0) stegaMal(t, dt);
    const mal = Math.atan2(vagn.x - t.mesh.position.x, vagn.z - t.mesh.position.z);
    t.mesh.rotation.y = vridMot(t.mesh.rotation.y, mal, dt, 0.9);
    t.nasta -= dt;
    if (t.nasta <= 0) {
      t.nasta = nastaSalva(Math.random());
      avfyraTiger(t);
    }
  }
  const fj = stegFjader(t.rekyl || 0, t.rekylV || 0, dt, 70, 12);
  t.rekyl = fj.x;
  t.rekylV = fj.v;
  const yaw = t.mesh.rotation.y;
  t.mesh.position.x -= Math.sin(yaw) * t.rekyl;
  t.mesh.position.z -= Math.cos(yaw) * t.rekyl;
  const markK = config.mark || {};
  const lut = varld?.hf ? skrovLutning(t.mesh.position.x, t.mesh.position.z, yaw + Math.PI, varld.hf, markK.wb, markK.spar) : null;
  if (lut) t.mesh.position.y = lut.y;
  else if (t.yVid) t.mesh.position.y = t.yVid(t.mesh.position.x, t.mesh.position.z);
  t.mesh.rotation.order = 'YXZ';
  t.mesh.rotation.z = lut ? lut.roll : 0;
  t.mesh.rotation.x = (lut ? -lut.pitch : 0) - Math.max(0, t.rekyl) * 0.05;
  t.rekylFore = t.rekyl;
  t.rekylYaw = yaw;
  if (t.mesh.userData.blixt > 0) {
    t.mesh.userData.blixt = Math.max(0, t.mesh.userData.blixt - dt);
    const k = t.mesh.userData.blixt / 0.45;
    t.mesh.material.emissive?.setRGB(1 * k, 0.42 * k, 0.16 * k);
  } else if (t.utslagen) t.mesh.material.emissive?.setRGB(0.42, 0.1, 0.02);
  else if (t.skada > 0) t.mesh.material.emissive?.setRGB(0.05 * t.skada, 0.015, 0.008);
  else t.mesh.material.emissive?.setRGB(0, 0, 0);
  if (t.skada > 0) {
    t.rokTid -= dt;
    if (t.rokTid <= 0) {
      t.rokTid = t.utslagen ? 0.08 : 0.26;
      salvaBrand(t.mesh.position.x, t.utslagen ? 1.3 : 1.7, t.mesh.position.z, t.utslagen ? 1.5 : 0.35);
    }
  }
  stegaTigerSkott(t, dt);
}

const SVGNS = 'http://www.w3.org/2000/svg';
function svgEl(namn, attr) {
  const e = document.createElementNS(SVGNS, namn);
  for (const [k, v] of Object.entries(attr)) e.setAttribute(k, String(v));
  return e;
}
function pol(deg, r) {
  const a = deg * Math.PI / 180;
  return [50 + Math.sin(a) * r, 50 - Math.cos(a) * r];
}
function bage(a0, a1, r) {
  const p0 = pol(a0, r);
  const p1 = pol(a1, r);
  const stor = a1 - a0 > 180 ? 1 : 0;
  return `M ${p0[0].toFixed(2)} ${p0[1].toFixed(2)} A ${r} ${r} 0 ${stor} 1 ${p1[0].toFixed(2)} ${p1[1].toFixed(2)}`;
}
function byggEnMatare(spec) {
  const svg = svgEl('svg', {viewBox: '0 0 100 100', id: spec.id, class: 'matare', role: 'img', 'aria-label': spec.aria});
  svg.append(svgEl('circle', {cx: 50, cy: 50, r: 48, fill: '#1c1e22', stroke: '#8d887c', 'stroke-width': 3.2}));
  svg.append(svgEl('circle', {cx: 50, cy: 50, r: 43.5, fill: '#241e16', stroke: '#0a0908', 'stroke-width': 1.6}));
  svg.append(svgEl('circle', {cx: 50, cy: 50, r: 39.5, fill: '#e8e1d2'}));
  for (const b of spec.bagar || []) svg.append(svgEl('path', {d: bage(b.a0, b.a1, 33.5), fill: 'none', stroke: b.farg, 'stroke-width': 3.4, 'stroke-linecap': 'butt'}));
  const ticks = svgEl('g', {stroke: '#1c1914', 'stroke-linecap': 'round'});
  for (let i = 0; i <= spec.streck; i++) {
    const a = -120 + (240 * i) / spec.streck;
    const yttre = pol(a, 36);
    const lang = i % spec.lang === 0;
    const inre = pol(a, lang ? 27.5 : 31.5);
    ticks.append(svgEl('line', {x1: inre[0].toFixed(2), y1: inre[1].toFixed(2), x2: yttre[0].toFixed(2), y2: yttre[1].toFixed(2), 'stroke-width': lang ? 2.1 : 1.15}));
  }
  svg.append(ticks);
  const nal = svgEl('g', {id: spec.nal});
  nal.append(svgEl('polygon', {points: '50,17 47.2,52 52.8,52', fill: '#1a140e'}));
  nal.setAttribute('transform', 'rotate(-120 50 50)');
  svg.append(nal);
  svg.append(svgEl('circle', {cx: 50, cy: 50, r: 4.4, fill: '#3a342c', stroke: '#d5cec0', 'stroke-width': 1.1}));
  const varde = svgEl('text', {id: spec.varde, x: 50, y: 64, 'text-anchor': 'middle', fill: '#1a1814', 'font-size': 11, 'font-weight': 700, 'font-family': 'ui-sans-serif,system-ui,sans-serif'});
  varde.textContent = spec.start;
  svg.append(varde);
  const enhet = svgEl('text', {x: 50, y: 75, 'text-anchor': 'middle', fill: '#3a342c', 'font-size': 7.2, 'font-weight': 700, 'font-family': 'ui-sans-serif,system-ui,sans-serif'});
  enhet.textContent = spec.enhet;
  svg.append(enhet);
  svg.append(svgEl('ellipse', {cx: 37, cy: 31, rx: 13, ry: 7, fill: 'rgba(255,255,255,.34)', transform: 'rotate(-30 37 31)'}));
  $('instrument').append(svg);
}
function byggMatare() {
  const rot = $('instrument');
  if (!rot || rot.childElementCount) return;
  byggEnMatare({
    id: 'matFart', aria: 'Hastighet i kilometer i timmen', nal: 'nalFart', varde: 'vardeFart', enhet: 'km/h', start: '0', streck: 10, lang: 2,
    bagar: [{a0: -120, a1: 24, farg: '#2f8a4a'}, {a0: 24, a1: 82, farg: '#d2a03a'}, {a0: 82, a1: 120, farg: '#c24532'}]
  });
  byggEnMatare({
    id: 'matVarv', aria: 'Motorvarv', nal: 'nalVarv', varde: 'vardeVarv', enhet: 'rpm', start: '500', streck: 8, lang: 2,
    bagar: [{a0: -120, a1: 70, farg: '#3d6f46'}, {a0: 82, a1: 120, farg: '#c24532'}]
  });
  byggEnMatare({
    id: 'matEld', aria: 'Eldrörets lutning i grader', nal: 'nalEld', varde: 'vardeEld', enhet: 'lutn °', start: '+0', streck: 7, lang: 1,
    bagar: [{a0: -120, a1: 120, farg: '#6d7c86'}]
  });
  sattNal('nalEld', 10 / 35);
}
byggMatare();
function byggNitar() {
  const rot = $('optikNitar');
  if (!rot) return;
  const nit = (x, y) => {
    const e = document.createElement('i');
    e.className = 'nit';
    e.style.left = x;
    e.style.top = y;
    rot.append(e);
  };
  for (let i = 0; i < 9; i++) {
    const p = (6 + i * 10) + '%';
    nit(p, '4px');
    nit(p, 'calc(100% - 12px)');
  }
  for (const y of ['18%', '34%', '50%', '66%', '82%']) {
    nit('4px', y);
    nit('calc(100% - 12px)', y);
  }
}
function sattNal(id, u) {
  const el = $(id);
  if (!el) return;
  const a = -120 + Math.max(0, Math.min(1, u)) * 240;
  el.setAttribute('transform', `rotate(${a.toFixed(2)} 50 50)`);
}
function sattSvgText(id, text) {
  const el = $(id);
  if (el && el.textContent !== text) el.textContent = text;
}
function ritaInstrument(rpm, dt) {
  senRpm = rpm;
  const kmh = Math.abs(vagn.fart) * 3.6;
  const k = 1 - Math.exp(-Math.max(0, dt) * 9);
  fartNal += (kmh - fartNal) * k;
  const grader = vagn.eld * 180 / Math.PI;
  eldNal += (grader - eldNal) * k;
  sattNal('nalFart', fartNal / 50);
  sattNal('nalVarv', (rpm - 500) / 1900);
  sattNal('nalEld', (eldNal + 10) / 35);
  sattSvgText('vardeFart', String(Math.round(fartNal)));
  sattSvgText('vardeVarv', String(Math.round(rpm)));
  sattSvgText('vardeEld', (eldNal >= 0 ? '+' : '') + eldNal.toFixed(0));
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
  $('ljudPa').checked = install.ljud !== false;
  $('hePansar').checked = !!spelRegler.heMotPansar;
  $('skadaUtan').checked = !!spelRegler.skadaUtan;
  $('rikoschettPa').checked = spelRegler.rikoschett !== false;
  $('mat').hidden = !install.visaMat;
  ljudMotor.satt(install.ljud !== false);
  fyllSikte();
}
byggPanel();
fyllPanel();

$('visaMat').addEventListener('change', () => {
  install.visaMat = $('visaMat').checked;
  spara();
  $('mat').hidden = !install.visaMat;
});
$('ljudPa').addEventListener('change', () => {
  install.ljud = $('ljudPa').checked;
  ljudMotor.satt(install.ljud);
  spara();
});
$('standard').addEventListener('click', () => {
  install = normalStyr(STANDARD);
  spelRegler = standardRegler();
  sparaRegler();
  jamn.styra = jamn.torn = jamn.eldror = 0;
  spara();
  fyllPanel();
});
function visaInstall(oppna) {
  $('installningar').hidden = !oppna;
  $('installKnapp').setAttribute('aria-expanded', oppna ? 'true' : 'false');
}
function visaMeny(oppna) {
  $('meny').hidden = !oppna;
  $('menyKnapp').setAttribute('aria-expanded', oppna ? 'true' : 'false');
}
$('menyKnapp').addEventListener('click', e => {
  e.stopPropagation();
  visaMeny($('meny').hidden);
});
$('installKnapp').addEventListener('click', () => {
  visaMeny(false);
  visaInstall(true);
});
$('stang').addEventListener('click', () => visaInstall(false));
$('noll').addEventListener('click', () => {
  rorelse.nollstall();
  jamn.styra = jamn.torn = jamn.eldror = 0;
  visaMeny(false);
});
$('kameraKnapp').addEventListener('click', () => sattKamera(kamera === 'bak' ? 'sikte' : 'bak'));
$('kameraIkon').addEventListener('click', () => sattKamera(kamera === 'bak' ? 'sikte' : 'bak'));
$('vagnKnapp').addEventListener('click', () => {
  const i = VAGN_LISTA.indexOf(vagnId);
  sattVagn(VAGN_LISTA[(i + 1) % VAGN_LISTA.length]);
});
$('sikteVal').addEventListener('change', () => {
  sikteId = $('sikteVal').value;
  sattFov(true);
});
for (const [id, nyckel] of [['hePansar', 'heMotPansar'], ['skadaUtan', 'skadaUtan'], ['rikoschettPa', 'rikoschett']]) {
  $(id).addEventListener('change', () => {
    spelRegler = {...spelRegler, [nyckel]: $(id).checked};
    sparaRegler();
  });
}
addEventListener('pointerdown', e => {
  if ($('meny').hidden) return;
  if (e.target.closest('#meny') || e.target.closest('#menyKnapp')) return;
  visaMeny(false);
});

const GAS_KNOPP = 20;
const VAXEL_KNOPP = 16;
function inom(visT) {
  return Math.max(0, Math.min(1, Number(visT) || 0));
}
function knoppLäge(visT, slag) {
  const u = inom(visT);
  return `calc(${(u * 100).toFixed(3)}% - ${(u * slag).toFixed(2)}px)`;
}
function mittLäge(visT, slag) {
  const u = inom(visT);
  return `calc(${(slag / 2).toFixed(1)}px + ${(u * 100).toFixed(3)}% - ${(u * slag).toFixed(2)}px)`;
}
function byggMarken(rot, antal) {
  rot.replaceChildren();
  for (let i = 0; i < antal; i++) {
    const m = document.createElement('i');
    m.style.bottom = mittLäge(antal > 1 ? i / (antal - 1) : 0, rot.id === 'gasHack' ? GAS_KNOPP : VAXEL_KNOPP);
    if (i === 0 || i === antal - 1) m.classList.add('ande');
    rot.append(m);
  }
}
function byggNamn(rot, namn) {
  rot.replaceChildren();
  const n = namn.length;
  for (let i = 0; i < n; i++) {
    const b = document.createElement('b');
    b.textContent = namn[i];
    b.style.bottom = mittLäge(n > 1 ? i / (n - 1) : 0, VAXEL_KNOPP);
    rot.append(b);
  }
}
function markera(rot, index) {
  if (!rot) return;
  const barn = rot.children;
  for (let i = 0; i < barn.length; i++) barn[i].classList.toggle('nu', i === index);
}
const vaxelHack = document.createElement('div');
vaxelHack.id = 'vaxelHack';
$('vaxelSpar').append(vaxelHack);
byggMarken(vaxelHack, VAXLAR.length);
byggNamn($('vaxelNamn'), VAXLAR.map(v => v.namn));
byggMarken($('gasHack'), gasAntal());
const vaxelKnopp = document.createElement('div');
vaxelKnopp.id = 'vaxelKnopp';
$('vaxelSpar').append(vaxelKnopp);

function skaka(el, kick) {
  el.style.setProperty('--kick', kick + 'px');
  el.classList.remove('hack');
  void el.offsetWidth;
  el.classList.add('hack');
}
function ritaVaxel(visT) {
  vaxelKnopp.style.bottom = knoppLäge(visT, VAXEL_KNOPP);
  const lage = VAXLAR[vaxelIndex];
  $('vaxelLage').textContent = lage.namn;
  $('vaxelText').textContent = lage.text;
  const spar = $('vaxelSpar');
  spar.dataset.index = String(vaxelIndex);
  spar.dataset.lage = lage.id;
  spar.dataset.vis = Number(visT).toFixed(4);
  spar.setAttribute('aria-valuenow', String(vaxelIndex));
  spar.setAttribute('aria-valuetext', lage.text);
  spar.classList.toggle('tryck', vaxelStopp);
  markera(vaxelHack, vaxelIndex);
  markera($('vaxelNamn'), vaxelIndex);
}
function ritaGas(visT) {
  $('gasKnopp').style.bottom = knoppLäge(visT, GAS_KNOPP);
  const fyll = $('gasFyll');
  fyll.style.bottom = '0%';
  fyll.style.height = (gas * 100) + '%';
  const kvot = VAXLAR[vaxelIndex].kvot;
  fyll.className = kvot < 0 ? 'back' : kvot > 0 ? 'fram' : 'tom';
  const pct = Math.round(gas * 100);
  $('gasText').textContent = pct + '%';
  const spar = $('gasSpar');
  spar.dataset.gas = String(gas);
  spar.dataset.index = String(gasIndex);
  spar.dataset.vis = Number(visT).toFixed(4);
  spar.setAttribute('aria-valuenow', String(pct));
  spar.setAttribute('aria-valuetext', pct + '%');
  spar.classList.toggle('tryck', gasStopp);
  markera($('gasHack'), gasIndex);
}
function sattVaxel(id) {
  vaxelIndex = vaxelFranId(id);
  vaxelStopp = false;
  ritaVaxel(vaxelIndex / (VAXLAR.length - 1));
  ritaGas(gasIndex / (gasAntal() - 1));
}
function sattGas(v) {
  const n = gasAntal() - 1;
  gasIndex = Math.max(0, Math.min(n, Math.round(Math.max(0, Math.min(1, Number(v) || 0)) * n)));
  gas = gasVarde(gasIndex);
  gasStopp = false;
  ritaGas(gas);
}
function draVaxel(fingerT) {
  const r = draHack(vaxelIndex, fingerT, vaxelOpt());
  vaxelIndex = r.index;
  const pulser = [];
  if (r.passerade.length) {
    ljudMotor.vaxla(r.passerade.length);
    for (let i = 0; i < r.passerade.length; i++) pulser.push(MEKANIK.vaxelPulsMs);
    skaka(vaxelKnopp, r.riktning > 0 ? -6 : 6);
  }
  if (r.andstopp && !vaxelStopp) {
    ljudMotor.stopp();
    pulser.push(MEKANIK.andstoppPulsMs);
    skaka(vaxelKnopp, vaxelIndex === 0 ? -5 : 6);
  }
  vaxelStopp = r.andstopp;
  if (pulser.length) kansla(pulser);
  ritaVaxel(r.visT);
  ritaGas(gasIndex / (gasAntal() - 1));
}
function draGas(fingerT) {
  const r = draHack(gasIndex, fingerT, gasOpt());
  gasIndex = r.index;
  gas = gasVarde(gasIndex);
  const pulser = [];
  if (r.passerade.length) {
    ljudMotor.hack(r.passerade);
    for (let i = 0; i < r.passerade.length; i++) pulser.push(MEKANIK.hackPulsMs);
    skaka($('gasKnopp'), r.riktning > 0 ? -3 : 3);
  }
  if (r.andstopp && !gasStopp) {
    ljudMotor.stopp();
    pulser.push(MEKANIK.andstoppPulsMs);
    skaka($('gasKnopp'), gasIndex === 0 ? -4 : 4);
  }
  gasStopp = r.andstopp;
  if (pulser.length) kansla(pulser);
  ritaGas(r.visT);
}
function slappVaxel() {
  vaxelStopp = false;
  ritaVaxel(slappHack(vaxelIndex, VAXLAR.length).visT);
}
function slappGas() {
  gasStopp = false;
  ritaGas(slappHack(gasIndex, gasAntal()).visT);
}
ritaVaxel(vaxelIndex / (VAXLAR.length - 1));
ritaGas(0);

function tFranSpar(spar, clientY) {
  const r = spar.getBoundingClientRect();
  return 1 - (clientY - r.top) / Math.max(1, r.height);
}
function bindSpak(spar, dra, slapp) {
  const pek = {id: null};
  spar.addEventListener('pointerdown', e => {
    if (e.cancelable) e.preventDefault();
    pek.id = e.pointerId;
    try { spar.setPointerCapture(e.pointerId); } catch { /* syntetisk pekare */ }
    ljudMotor.oppna();
    dra(tFranSpar(spar, e.clientY));
  });
  const flytta = e => {
    if (pek.id !== e.pointerId) return;
    dra(tFranSpar(spar, e.clientY));
  };
  const upp = e => {
    if (pek.id !== e.pointerId) return;
    pek.id = null;
    try { spar.releasePointerCapture(e.pointerId); } catch { /* ingen fångst */ }
    slapp();
  };
  addEventListener('pointermove', flytta);
  addEventListener('pointerup', upp);
  addEventListener('pointercancel', upp);
}
bindSpak($('vaxelSpar'), draVaxel, slappVaxel);
bindSpak($('gasSpar'), draGas, slappGas);

function ritaGranat() {
  const vald = GRANATER[granatTyp];
  $('granatKort').textContent = vald.kort;
  $('granatKnapp').setAttribute('aria-label', vald.namn);
  for (const el of document.querySelectorAll('[data-mini]')) el.hidden = el.dataset.mini !== granatTyp;
  for (const el of document.querySelectorAll('.granatVal')) {
    const pa = el.dataset.granat === granatTyp;
    el.classList.toggle('vald', pa);
    el.setAttribute('aria-pressed', pa ? 'true' : 'false');
  }
}
function visaGranatMeny(oppna) {
  $('granatMeny').hidden = !oppna;
  $('granatKnapp').setAttribute('aria-expanded', oppna ? 'true' : 'false');
}
function valjGranatTyp(id) {
  if (!GRANATER[id]) return;
  granatTyp = id;
  ritaGranat();
  visaGranatMeny(false);
  ljudMotor.oppna();
  ljudMotor.valjGranat();
}
ritaGranat();
$('granatKnapp').addEventListener('click', () => {
  ljudMotor.oppna();
  visaGranatMeny($('granatMeny').hidden);
});
for (const knapp of document.querySelectorAll('.granatVal')) {
  knapp.addEventListener('click', e => {
    e.stopPropagation();
    valjGranatTyp(knapp.dataset.granat);
  });
}
$('granatMeny').addEventListener('click', e => {
  if (e.target.closest('.granatVal') || e.target.closest('#granatYta')) return;
  visaGranatMeny(false);
});
addEventListener('pointerdown', () => { ljudMotor.oppna(); }, {passive: true});

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

function aktiv() {
  return varld?.riggar?.[vagnId] || null;
}

function sparaRegler() {
  try { localStorage.setItem(REGEL_NYCKEL, JSON.stringify(spelRegler)); } catch { /* privat läge */ }
}

function sattFov(tvinga) {
  const mal = kamera === 'bak' ? (config.kamera?.bak?.fov || 46) : sikteFor(vagnId, sikteId).synfalt;
  if (!tvinga && Math.abs(camera.fov - mal) < 0.02) return;
  camera.fov = mal;
  camera.updateProjectionMatrix();
  if (kamera === 'sikte') passaSikte();
}

function visaOptik() {
  const fp = kamera === 'sikte' && igang;
  $('sikte').hidden = !fp;
  $('optik').hidden = !fp;
  $('kameraKnapp').textContent = kamera === 'bak' ? 'Tredjeperson' : 'Siktesvy';
  $('kameraIkon').setAttribute('aria-pressed', kamera === 'bak' ? 'true' : 'false');
  $('kameraIkon').setAttribute('aria-label', kamera === 'bak' ? 'Byt till siktesvy' : 'Byt till tredjeperson');
}

function sattKamera(lage) {
  kamera = lage === 'bak' ? 'bak' : 'sikte';
  document.body.dataset.kamera = kamera;
  visaOptik();
  sattFov(true);
  lasFast();
}

function fyllSikte() {
  const sel = $('sikteVal');
  const lista = siktenFor(vagnId);
  sel.replaceChildren();
  for (const s of lista) {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.text;
    sel.append(opt);
  }
  if (!lista.some(s => s.id === sikteId)) sikteId = lista[0].id;
  sel.value = sikteId;
  sel.disabled = lista.length < 2;
}

function sattVagn(id) {
  if (!REGLER.vagnar[id] || !varld) return;
  vagnId = id;
  const visning = {sherman_m4_75: 'Panzer IV H', sherman_m4a3_76w: 'Panzer IV H'};
  $('vagnKnapp').textContent = visning[id] || REGLER.vagnar[id].kort;
  fyllSikte();
  const a = aktiv();
  for (const r of new Set(Object.values(varld.riggar))) r.rigg.visible = r === a;
  sattFov(true);
  lasFast();
}

function hallKamera(x, y, z, lx, ly, lz, marg) {
  const hojd = varld?.hojd;
  if (!hojd) return {x, y, z};
  let cx = x;
  let cy = y;
  let cz = z;
  for (let i = 0; i < 5; i++) {
    const mark = hojd(cx, cz);
    if (cy >= mark + marg) break;
    cx += (lx - cx) * 0.22;
    cz += (lz - cz) * 0.22;
    cy = mark + marg;
  }
  return {x: cx, y: Math.max(cy, hojd(cx, cz) + marg), z: cz};
}

function lasFast() {
  if (!varld) return;
  const a = aktiv();
  if (!a) return;
  const markK = config.mark || {};
  const lut = skrovLutning(vagn.x, vagn.z, vagn.yaw, varld.hf, markK.wb, markK.spar);
  const back = Math.max(0, rekylX);
  const jitter = skak * 0.045;
  const rek = config.rekyl || {};
  a.rigg.position.set(
    vagn.x + Math.sin(vagn.yaw) * back * (rek.skrov ?? 0.1),
    lut.y,
    vagn.z + Math.cos(vagn.yaw) * back * (rek.skrov ?? 0.1)
  );
  a.rigg.rotation.order = 'YXZ';
  a.rigg.rotation.set(lut.pitch, vagn.yaw, -lut.roll);
  a.torn.rotation.y = -vagn.torn;
  a.eldror.rotation.x = vagn.eld + back * (rek.nick ?? 0.22);
  if (a.pipa) a.pipa.position.z = back * (rek.pipa ?? 2.6);
  const near = kamera === 'bak' ? (config.kamera?.nearBak || 0.22) : (config.kamera?.nearSikte || 0.06);
  if (Math.abs(camera.near - near) > 1e-4) {
    camera.near = near;
    camera.updateProjectionMatrix();
  }
  if (kamera === 'bak') {
    if (camera.parent !== scene) scene.add(camera);
    const k = config.kamera?.bak || {};
    const dist = k.dist ?? 7.4;
    const hoj = k.hojd ?? 2.7;
    const sida = k.sida ?? 0.28;
    const fx = -Math.sin(vagn.yaw);
    const fz = -Math.cos(vagn.yaw);
    const rx = Math.cos(vagn.yaw);
    const rz = -Math.sin(vagn.yaw);
    const lx = vagn.x + fx * (k.lookFram ?? 0.2);
    const ly = lut.y + (k.lookHojd ?? 1.15);
    const lz = vagn.z + fz * (k.lookFram ?? 0.2);
    const lyft = hallKamera(
      vagn.x - fx * dist + rx * sida,
      lut.y + hoj,
      vagn.z - fz * dist + rz * sida,
      lx, ly, lz,
      k.markMarg ?? 0.9
    );
    camera.up.set(0, 1, 0);
    camera.position.set(lyft.x, lyft.y, lyft.z);
    titt.set(lx, ly, lz);
    camera.lookAt(titt);
  } else {
    if (camera.parent !== a.eldror) a.eldror.add(camera);
    const bas = a.sikte;
    camera.position.set(
      bas.x + Math.sin(skakTid * 57) * jitter,
      bas.y + back * 0.14 + Math.cos(skakTid * 43) * jitter * 0.7,
      bas.z + back * 0.5
    );
    const sikteNick = config.kamera?.sikteNick ?? 0.1;
    camera.rotation.set(
      -sikteNick - back * 0.12 + Math.sin(skakTid * 51) * jitter * 0.7,
      Math.cos(skakTid * 37) * jitter * 0.45,
      back * 0.015 + Math.sin(skakTid * 33) * jitter * 0.3
    );
  }
  sattFov(false);
  a.rigg.updateMatrixWorld(true);
}

function ramFor(tiger) {
  if (tiger.ram) return tiger.ram;
  const box = tiger.box;
  const c = box.getCenter(new THREE.Vector3());
  let minF = Infinity, maxF = -Infinity, minH = Infinity, maxH = -Infinity;
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
    ramH.set(x - c.x, y - c.y, z - c.z);
    const f = ramH.dot(tiger.fram);
    const h = ramH.dot(tiger.hoger);
    if (f < minF) minF = f;
    if (f > maxF) maxF = f;
    if (h < minH) minH = h;
    if (h > maxH) maxH = h;
  }
  tiger.ram = {c, minF, maxF, minH, maxH, minY: box.min.y, maxY: box.max.y};
  return tiger.ram;
}

function traffPaTiger(tiger, traffPunkt, traffFore) {
  const mesh = tiger.mesh;
  mesh.updateMatrixWorld(true);
  inv.copy(mesh.matrixWorld).invert();
  lokal.copy(traffPunkt).applyMatrix4(inv);
  mesh.getWorldQuaternion(qInv).invert();
  vel.subVectors(traffPunkt, traffFore);
  if (vel.lengthSq() < 1e-8) vel.set(0, -0.15, -1);
  vel.applyQuaternion(qInv).normalize();
  const ram = ramFor(tiger);
  rel.copy(lokal).sub(ram.c);
  const f = rel.dot(tiger.fram);
  const h = rel.dot(tiger.hoger);
  const nz = (f - (ram.minF + ram.maxF) / 2) / Math.max(0.01, (ram.maxF - ram.minF) / 2);
  const nx = (h - (ram.minH + ram.maxH) / 2) / Math.max(0.01, (ram.maxH - ram.minH) / 2);
  const ny = (lokal.y - ram.minY) / Math.max(0.01, ram.maxY - ram.minY);
  return {
    klass: klassFranLokal(nx, ny, nz),
    sida: h >= 0 ? 1 : -1,
    skott: {x: vel.dot(tiger.hoger), y: vel.dot(upp), z: vel.dot(tiger.fram)}
  };
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
  el.classList.remove('varning');
  beskedTid = 3.2;
}

function traffa(traffPunkt, tiger) {
  if (tiger) traffor += 1;
  granat = null;
  spar.visible = false;
  const avstand = Math.hypot(traffPunkt.x - vagn.x, traffPunkt.z - vagn.z);
  let text = 'Nedslag · ' + Math.round(avstand) + ' m';
  let traff = false;
  if (tiger) {
    const det = traffPaTiger(tiger, traffPunkt, fore);
    const bed = bedomTraff({
      mal: 'tiger_i',
      vapen: REGLER.vagnar[vagnId].vapen,
      granat: skottTyp,
      avstand,
      klass: det.klass,
      skott: det.skott,
      sida: det.sida,
      regler: spelRegler
    });
    senTraff = bed;
    tiger.skada = (tiger.skada || 0) + bed.skada;
    const blev = tigerUtslagen(tiger.skada) && !tiger.utslagen;
    if (tigerUtslagen(tiger.skada)) tiger.utslagen = true;
    tiger.mesh.userData.blixt = bed.genomslag ? 0.45 : 0.2;
    tiger.mesh.material.emissive?.setHex(bed.genomslag ? 0xff7a3a : 0x8a6a3a);
    tonaTiger(tiger);
    ljudMotor.traff(avstand);
    if (blev) ljudMotor.forstord(avstand);
    salvaNedslag(traffPunkt, bed.genomslag ? 'pansar' : skottTyp === 'pansar' ? 'pansar' : 'traff');
    text = bed.text + (blev ? ' · utslagen' : '');
    traff = bed.genomslag;
  } else {
    ljudMotor.nedslag(avstand);
    salvaNedslag(traffPunkt, 'mark');
    senTraff = {text, genomslag: false, klass: 'mark'};
  }
  traffLjus.position.copy(traffPunkt);
  ljusTid = 0.28;
  blixt();
  visaBesked(text, traff);
}
let granatTid = 0;
let senSkott = null;
let senTraff = null;

function avfyra() {
  if (!igang || ladd > 0 || granat || !varld) return;
  lasFast();
  const pipa = kamera === 'bak' ? aktiv()?.mynning : null;
  if (pipa) {
    pipa.getWorldPosition(mun);
    pipa.getWorldDirection(dir);
  } else {
    camera.getWorldPosition(mun);
    camera.getWorldDirection(dir);
  }
  const start = mun.clone().addScaledVector(dir, 1.6);
  granat = skapaGranat(start.x, start.y, start.z, dir.x * V0, dir.y * V0, dir.z * V0);
  granatTid = 0;
  skottTyp = granatTyp;
  senSkott = {y: +start.y.toFixed(2), dirY: +dir.y.toFixed(4), eld: +vagn.eld.toFixed(4), camY: +mun.y.toFixed(2), typ: skottTyp, typNamn: GRANATER[skottTyp].namn};
  ladd = OMLADD;
  skott += 1;
  spar.visible = true;
  spar.position.copy(start);
  mynningLjus.position.copy(start);
  mynningLjus.intensity = 16;
  rekylV += 8.5;
  ljudMotor.kanon();
  salvaMynning(start, dir);
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
    g.fillStyle = t.utslagen ? '#6d655c' : t.skada > 0 ? '#e0b15a' : '#e07a4a';
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
      const markY = varld.hojd ? varld.hojd(granat.x, granat.z) : 0;
      if (granat.y <= markY + 0.2) {
        punkt.y = markY + 0.12;
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

function slepMot(cur, mal, dt, tid) {
  const steg = dt / Math.max(0.05, tid);
  const d = mal - cur;
  if (Math.abs(d) <= steg) return mal;
  return cur + Math.sign(d) * steg;
}

function tick(dt) {
  if (!igang || !varld || !(dt > 0)) return;
  const rav = gyroLada.forma(lasVinklar(), dt);
  behandlad = {
    styra: behandlaAxel(rav.roll, install.axlar.styra, dt, jamn, 'styra'),
    torn: behandlaAxel(rav.yaw, install.axlar.torn, dt, jamn, 'torn'),
    eldror: behandlaAxel(rav.pitch, install.axlar.eldror, dt, jamn, 'eldror')
  };
  const tro = effektiv();
  const mal = bandMal(drivKommando(vaxelIndex, gas), behandlad.styra.grader, tro);
  stegaVagn(vagn, mal, dt);
  vagn.x = Math.max(-980, Math.min(980, vagn.x));
  vagn.z = Math.max(-980, Math.min(980, vagn.z));
  tornFart = slepMot(tornFart, behandlad.torn.u, dt, TORN_UPP);
  eldFart = slepMot(eldFart, behandlad.eldror.u, dt, ELD_UPP);
  vagn.torn = stegaTorn(vagn.torn, tornFart, dt);
  vagn.eld = stegaEldror(vagn.eld, eldFart, dt);
  for (const t of varld.tigrar) stegaTiger(t, dt);
  const fj = stegFjader(rekylX, rekylV, dt, 230, 18);
  rekylX = fj.x;
  rekylV = fj.v;
  skak *= Math.exp(-dt * 5.2);
  if (skak < 0.012) skak = 0;
  skakTid += dt;
  lasFast();
  stegaGranat(dt);
  stegaPartiklar(dt);
  if (ladd > 0) ladd = Math.max(0, ladd - dt);
  const mil = ljudMotor.stega({
    dt, gas, kvot: VAXLAR[vaxelIndex].kvot, fart: vagn.fart,
    band: Math.max(Math.abs(vagn.vL), Math.abs(vagn.vR)),
    tornU: behandlad.torn.u, eldU: behandlad.eldror.u,
    eld: vagn.eld, eldMin: ELD_MIN, eldMax: ELD_MAX,
    gir: behandlad.styra.u
  });
  ritaInstrument(mil.rpm, dt);
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
    const mark = varld.hojd ? varld.hojd(vagn.x, vagn.z) : 0;
    sol.position.set(vagn.x - 36, mark + 80, vagn.z + 24);
    sol.target.position.set(vagn.x, mark, vagn.z);
    sol.target.updateMatrixWorld();
  }
  if (varld.sky && varld.sky.parent !== camera) {
    varld.sky.position.set(0, 0, 0);
    camera.add(varld.sky);
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
  if (mynningLjus.intensity > 0) mynningLjus.intensity = Math.max(0, mynningLjus.intensity - dt * 48);
  if (fiendeLjus.intensity > 0) fiendeLjus.intensity = Math.max(0, fiendeLjus.intensity - dt * 70);
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);

function visaSpel() {
  igang = true;
  $('startKort').hidden = true;
  for (const id of ['spakar', 'menyKnapp', 'kameraIkon', 'karta', 'kartaText', 'granatKnapp', 'eldWrap']) $(id).hidden = false;
  visaOptik();
  if (!rorelse.harGyro) setTimeout(() => { if (!rorelse.harGyro) $('hint').hidden = false; }, 900);
  passa();
}

$('starta').addEventListener('click', async () => {
  const sensorLovande = rorelse.start();
  $('starta').disabled = true;
  const ljudLovande = ljudMotor.oppna();
  try { await sensorLovande; }
  catch { $('hint').hidden = false; }
  try { await Promise.race([ljudLovande, new Promise(r => setTimeout(r, 1500))]); }
  catch { /* ljudet får komma ikapp */ }
  jamn.styra = jamn.torn = jamn.eldror = 0;
  visaSpel();
});

const start = $('starta');
byggVarld(scene, renderer).then(v => {
  varld = v;
  sol = v.sol;
  if (v.sky) camera.add(v.sky);
  v.eldror.add(camera);
  camera.position.copy(v.sikte);
  camera.rotation.set(0, 0, 0);
  rustaTigrar();
  lasFast();
  start.disabled = false;
  start.textContent = 'Starta';
  window.__vagn = {
    vagn, install, tabell, varld: v, camera, scene, renderer, teckenfel,
    get granatTyp() { return granatTyp; },
    get gas() { return gas; },
    get vaxel() { return VAXLAR[vaxelIndex].id; },
    get vaxelIndex() { return vaxelIndex; },
    get driv() { return drivKommando(vaxelIndex, gas); },
    sattGas, sattVaxel, draGas, draVaxel, slappGas, slappVaxel,
    ljud: ljudMotor,
    mata(roll, yaw, pitch) { tvang = {roll, yaw, pitch}; },
    slapp() { tvang = null; },
    eld: avfyra,
    tick,
    get senSkott() { return senSkott; },
    get granat() { return granat; },
    get traffar() { return traffor; },
    get skott() { return skott; },
    get ladd() { return ladd; },
    get rpm() { return senRpm; },
    get tigrar() { return varld.tigrar.map(t => ({skada: t.skada || 0, utslagen: !!t.utslagen, y: +t.mesh.position.y.toFixed(2)})); },
    noll: () => rorelse.nollstall(),
    sattKamera, sattVagn,
    sattSikte(id) { sikteId = id; fyllSikte(); sattFov(true); },
    sattRegler(r) { spelRegler = {...spelRegler, ...r}; fyllPanel(); },
    get kamera() { return kamera; },
    get vagnId() { return vagnId; },
    get sikteId() { return sikteId; },
    get regler() { return spelRegler; },
    get senTraff() { return senTraff; },
    get fov() { return camera.fov; },
    aktiv: () => aktiv(),
    hojd: (x, z) => varld.hojd(x, z),
    lutning: () => skrovLutning(vagn.x, vagn.z, vagn.yaw, varld.hf),
    bedom: bedomTraff
  };
  window.__redo = teckenfel.length === 0;
}).catch(e => {
  console.error(e);
  start.textContent = 'Kunde inte ladda';
  $('startText').textContent = String(e.message || e);
});
