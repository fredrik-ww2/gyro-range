import * as THREE from 'three';
import { requestMotionPermission } from '../rorelse-test/motion-core.js';
import {
  NYCKEL, standardInstallningar, sammanfoga, skarmVinkel, vinklarFranOrientering, fartUrGyro,
  derivat, nyttAxelTillstand, bearbetaAxel, skapaFart, skapaGester, fartFramAv, sidoFart,
  stegPosition, visaNamn, bytLage, sikteRiktning, skapaJamnhet, skapaBrus, ryckighet,
  skapaSkak, skakSteg, hoppMark, KNAPP_FART
} from './logik.js';
import { skapaHaptik, skakIntervall } from './haptik.js';
import { monteraGubbe } from './gyrobox-adapter.js';
import { provFranEvent, lyssnaSkarm } from '../shared/sensor.js';
import { arOmslag, nyNollRiktning } from '../js/riktning.js';
import { installeraIosLjud, oppnaKontext, tick } from '../shared/ios-ljud.js';

const $ = (id) => document.getElementById(id);
let stegLjud = null;
let stegHalv = 0;
installeraIosLjud({ hamta: () => stegLjud, oppna() { stegLjud = oppnaKontext(stegLjud); } });
const DEG = Math.PI / 180;
const renderer = new THREE.WebGLRenderer({ canvas: $('spel'), antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0xb7c9b4);
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xb7c9b4, 80, 520);
const kamera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.12, 800);
const _mal = new THREE.Vector3();
const _look = new THREE.Vector3();
const sikteKam = new THREE.PerspectiveCamera(20, innerWidth / innerHeight, 0.08, 800);
kamera.position.set(0, 2.2, 5.6);
scene.add(new THREE.HemisphereLight(0xd7e6cc, 0x465538, 1.05));
const sol = new THREE.DirectionalLight(0xfff6e4, 1.2);
sol.position.set(30, 70, 24);
scene.add(sol);

const mark = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshLambertMaterial({ color: 0x6d8450 }));
mark.rotation.x = -Math.PI / 2;
scene.add(mark);
const rut = new THREE.GridHelper(400, 40, 0xd5e4c4, 0x3e5340);
rut.position.y = 0.025;
scene.add(rut);
const fin = new THREE.GridHelper(36, 18, 0xeef6e4, 0x5a734c);
fin.position.y = 0.04;
scene.add(fin);

function stolpe(x, z, hojd = 1.6, farg = 0xc8b48a) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, hojd, 6), new THREE.MeshLambertMaterial({ color: farg }));
  m.position.set(x, hojd / 2, z);
  scene.add(m);
}
function trad(x, z, h) {
  const g = new THREE.Group();
  const stam = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, h * 0.38, 6), new THREE.MeshLambertMaterial({ color: 0x6a4b32 }));
  stam.position.y = h * 0.19;
  const krona = new THREE.Mesh(new THREE.ConeGeometry(h * 0.36, h * 0.72, 7), new THREE.MeshLambertMaterial({ color: 0x2f6a3a }));
  krona.position.y = h * 0.52;
  g.add(stam, krona);
  g.position.set(x, 0, z);
  scene.add(g);
}
for (let i = -4; i <= 4; i++) { stolpe(i * 6, -12); stolpe(i * 8, -26, 1.3, 0xb7a078); }
[[8, -7, 3.4], [-7, -9, 4.2], [15, -18, 5], [-16, -20, 3.6], [3, -34, 6], [-11, -42, 4.4], [24, -16, 3.5], [-24, -10, 5], [20, -50, 6.5], [-4, -58, 4], [32, -32, 5], [-30, -36, 4.2], [6, -70, 7], [-18, -64, 5.5]].forEach((p) => trad(...p));

function malTextur(text) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#f6f1e6';
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = '#1d2430';
  g.lineWidth = 12;
  g.strokeRect(10, 10, 236, 236);
  g.beginPath();
  g.arc(128, 104, 72, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.arc(128, 104, 26, 0, Math.PI * 2);
  g.fillStyle = '#d4652f';
  g.fill();
  g.fillStyle = '#1d2430';
  g.font = 'bold 44px sans-serif';
  g.textAlign = 'center';
  g.fillText(text, 128, 224);
  const tex = new THREE.CanvasTexture(c);
  if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const malen = [
  [0, -50, 2.2, '50 m'], [16, -100, 2.6, '100 m'], [-20, -150, 3, '150 m'], [28, -220, 3.6, '220 m'], [-10, -300, 4.2, '300 m']
];
for (const [x, z, w, text] of malen) {
  stolpe(x, z, w * 0.7 + 0.4, 0x6b5438);
  const tavla = new THREE.Mesh(new THREE.PlaneGeometry(w, w), new THREE.MeshBasicMaterial({ map: malTextur(text) }));
  tavla.position.set(x, w * 0.55 + 1.1, z);
  scene.add(tavla);
}

function kapsel(rad, len, mat) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, 8), mat));
  const kula = new THREE.SphereGeometry(rad, 8, 6);
  const a = new THREE.Mesh(kula, mat); a.position.y = len / 2;
  const b = new THREE.Mesh(kula, mat); b.position.y = -len / 2;
  g.add(a, b);
  return g;
}
const hud = new THREE.MeshLambertMaterial({ color: 0xd7a27a });
const troja = new THREE.MeshLambertMaterial({ color: 0x3d6ea8 });
const brost = new THREE.MeshLambertMaterial({ color: 0x8ec0ea });
const byxor = new THREE.MeshLambertMaterial({ color: 0x3c342c });
const skor = new THREE.MeshLambertMaterial({ color: 0x221e1a });
const ogon = new THREE.MeshLambertMaterial({ color: 0x1a1c22 });
const kepsFarg = new THREE.MeshLambertMaterial({ color: 0x2a4a6a });
const gubbe = new THREE.Group();
const hoft = new THREE.Group();
hoft.position.y = 0.7;
gubbe.add(hoft);
const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.52, 0.24), troja);
torso.position.y = 0.32;
hoft.add(torso);
const framsida = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.03), brost);
framsida.position.set(0, 0.32, -0.135);
hoft.add(framsida);
const rygg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.03), new THREE.MeshLambertMaterial({ color: 0x1e3a5c }));
rygg.position.set(0, 0.32, 0.135);
hoft.add(rygg);
const huvud = new THREE.Group();
huvud.position.y = 0.72;
hoft.add(huvud);
huvud.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), hud));
const nasa = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.14), hud);
nasa.position.set(0, -0.02, -0.18);
huvud.add(nasa);
const oga = new THREE.Mesh(new THREE.SphereGeometry(0.026, 6, 6), ogon);
oga.position.set(-0.055, 0.03, -0.14);
const ogaH = oga.clone();
ogaH.position.x = 0.055;
huvud.add(oga, ogaH);
const keps = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.22), kepsFarg);
keps.position.y = 0.14;
huvud.add(keps);
const skarm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.2), new THREE.MeshLambertMaterial({ color: 0x14283c }));
skarm.position.set(0, 0.1, -0.22);
huvud.add(skarm);
function lem(mat, len, rad) {
  const pivot = new THREE.Group();
  const del = kapsel(rad, len, mat);
  del.position.y = -(len / 2 + rad * 0.2);
  pivot.add(del);
  return pivot;
}
const armV = lem(troja, 0.34, 0.06); armV.position.set(-0.36, 0.48, 0); hoft.add(armV);
const armH = lem(troja, 0.34, 0.06); armH.position.set(0.36, 0.48, 0); hoft.add(armH);
for (const arm of [armV, armH]) {
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), hud);
  hand.position.y = -0.46;
  arm.add(hand);
}
const benV = lem(byxor, 0.52, 0.075); benV.position.set(-0.12, -0.02, 0); hoft.add(benV);
const benH = lem(byxor, 0.52, 0.075); benH.position.set(0.12, -0.02, 0); hoft.add(benH);
function sko(ben) {
  const s = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.07, 0.22), skor);
  s.position.set(0, -0.58, -0.05);
  ben.add(s);
}
sko(benV); sko(benH);
scene.add(gubbe);

let sparad = null;
try { sparad = JSON.parse(localStorage.getItem(NYCKEL) || 'null'); } catch { sparad = null; }
const installningar = sammanfoga(sparad);
const gyroLada = monteraGubbe({
  installningar,
  lage: () => lage,
  nollstall: () => nollstall()
});
const haptik = skapaHaptik(document, navigator);
haptik.pa = installningar.haptik;
const fartMaskin = skapaFart();
const gester = skapaGester();
const jamnhet = skapaJamnhet(0.4);
const brus = skapaBrus();
const skak = skapaSkak();
const axlar = {
  ga: { vrid: nyttAxelTillstand(), fram: nyttAxelTillstand(), sida: nyttAxelTillstand() },
  sikta: { vrid: nyttAxelTillstand(), fram: nyttAxelTillstand(), sida: nyttAxelTillstand() }
};
const knappar = { fram: false, bak: false, vanster: false, hoger: false };
const drag = { fram: 0, yaw: 0, roll: 0 };
const graf = [];
let lage = 'ga';
let heading = 0;
let basHeading = 0;
let pos = { x: 0, z: 0 };
let y = 0;
let vy = 0;
let ligger = false;
let ligg = 0;
let hoppar = false;
let fas = 0;
let senPace = 0;
let skakKlocka = 0;
let finger = false;
let orient = null;
let foreOrient = null;
let doldHop = false;
let neutral = null;
let rr = { alpha: 0, beta: 0, gamma: 0 };
let harRR = false;
let senasteOrient = 0;
let foreVinkel = null;
let lyssnar = false;
let hudTid = 0;
let senNamn = '';

function spara() {
  try { localStorage.setItem(NYCKEL, JSON.stringify(installningar)); } catch { /* privat läge */ }
}
function anvandFinger() {
  return finger || !orient || performance.now() - senasteOrient > 800;
}
function vinklarNu() {
  if (anvandFinger()) return { upp: -drag.fram, fram: drag.fram, yaw: drag.yaw, roll: drag.roll };
  const screen = skarmVinkel();
  if (foreOrient && arOmslag(foreOrient, orient)) {
    const hall = foreVinkel || { upp: 0, yaw: 0, roll: 0 };
    neutral = nyNollRiktning(orient, {
      pitch: (hall.upp || 0) * DEG,
      yaw: (hall.yaw || 0) * DEG,
      roll: (hall.roll || 0) * DEG
    }, screen);
  }
  foreOrient = { alpha: orient.alpha, beta: orient.beta, gamma: orient.gamma };
  return vinklarFranOrientering(orient.alpha, orient.beta, orient.gamma, neutral || orient, screen);
}
function farterNu(vink, dt) {
  if (!anvandFinger() && harRR) return fartUrGyro({ alpha: orient.alpha, beta: orient.beta, gamma: orient.gamma, screen: skarmVinkel() }, rr);
  return derivat(foreVinkel, vink, dt);
}
function bearbeta(id, vink, fart, dt) {
  const block = lage === 'sikta' ? installningar.sikta : installningar.ga;
  const inst = block[id];
  const fartLage = lage === 'ga' && inst.lage === 'fart';
  let raw = 0;
  if (id === 'vrid') raw = fartLage ? fart.yaw : vink.yaw;
  else if (id === 'fram') raw = fartLage ? fart.fram : (lage === 'sikta' ? vink.upp : vink.fram);
  else raw = fartLage ? fart.roll : vink.roll;
  return bearbetaAxel(axlar[lage][id], raw, dt, inst);
}
function nollstall() {
  if (orient) neutral = { alpha: orient.alpha, beta: orient.beta, gamma: orient.gamma };
  foreOrient = orient ? { alpha: orient.alpha, beta: orient.beta, gamma: orient.gamma } : null;
  drag.fram = drag.yaw = drag.roll = 0;
  basHeading = heading;
  foreVinkel = null;
  for (const lag of [axlar.ga, axlar.sikta]) for (const a of Object.values(lag)) a.jamn = 0;
}
function sattLage(nasta) {
  if (nasta === lage) return;
  const b = bytLage(lage);
  lage = b.lage;
  fartMaskin.noll();
  ligger = false;
  senPace = 0;
  y = 0;
  vy = 0;
  hoppar = false;
  document.body.dataset.lage = lage;
  $('kikare').hidden = lage !== 'sikta';
  $('knappGa').setAttribute('aria-pressed', String(lage === 'ga'));
  $('knappSikta').setAttribute('aria-pressed', String(lage === 'sikta'));
  haptik.tick();
}
function lyssna() {
  if (lyssnar) return;
  lyssnar = true;
  addEventListener('deviceorientation', (e) => {
    if (document.hidden) { doldHop = true; return; }
    const prov = provFranEvent(e);
    if (!prov) return;
    orient = prov;
    senasteOrient = performance.now();
    if (doldHop) { doldHop = false; neutral = { ...orient }; foreOrient = { ...orient }; foreVinkel = null; }
    if (!neutral) neutral = { ...orient };
  }, { passive: true });
  addEventListener('devicemotion', (e) => {
    if (document.hidden) return;
    const r = e.rotationRate;
    if (!r) return;
    rr = {
      alpha: Number.isFinite(r.alpha) ? r.alpha : 0,
      beta: Number.isFinite(r.beta) ? r.beta : 0,
      gamma: Number.isFinite(r.gamma) ? r.gamma : 0
    };
    harRR = true;
  }, { passive: true });
}
function startaGyro() {
  finger = false;
  $('startPanel').hidden = true;
  lyssna();
}
function startaFinger() {
  finger = true;
  neutral = { alpha: 0, beta: 90, gamma: 0 };
  $('startPanel').hidden = true;
}

function steg(dt) {
  dt = Math.max(0.001, Math.min(0.05, dt));
  const tid = performance.now() / 1000;
  const vink = vinklarNu();
  const fart = farterNu(vink, dt);
  foreVinkel = vink;
  const prefix = lage === 'sikta' ? 'sik' : 'ga';
  const utVrid = gyroLada.forma(prefix + 'Vrid', bearbeta('vrid', vink, fart, dt), vink.yaw, dt);
  const utFram = gyroLada.forma(prefix + 'Fram', bearbeta('fram', vink, fart, dt), lage === 'sikta' ? vink.upp : vink.fram, dt);
  const utSida = gyroLada.forma(prefix + 'Sida', bearbeta('sida', vink, fart, dt), vink.roll, dt);
  let framFart = 0;
  let sida = 0;
  if (lage === 'ga') {
    const gest = gester.steg(tid, fart.upp, installningar.ga.nerDps, installningar.ga.hoppDps);
    if (gest === 'ner') {
      if (!ligger) { ligger = true; haptik.tick(); }
      fartMaskin.noll();
      senPace = 0;
    } else if (gest === 'hopp' && !ligger && y <= 0.08) {
      vy = 4.6;
      hoppar = true;
    } else {
      fartMaskin.steg(tid, utFram);
      if (ligger && (fartMaskin.pace > 0 || knappar.fram)) ligger = false;
    }
    if (fartMaskin.pace !== senPace) { haptik.tick(); senPace = fartMaskin.pace; }
    if (!ligger && installningar.ga.vrid.lage === 'fart') {
      heading += utVrid * DEG * dt;
      basHeading = heading - vink.yaw * DEG;
    } else if (!ligger) heading = basHeading + utVrid * DEG;
    framFart = fartFramAv({ pace: fartMaskin.pace, knappFram: knappar.fram, knappBak: knappar.bak, ligger });
    const knappSida = (knappar.hoger ? 1 : 0) - (knappar.vanster ? 1 : 0);
    sida = ligger ? 0 : sidoFart(utSida) + knappSida * KNAPP_FART;
    if (!ligger) pos = stegPosition(pos, heading, dt, framFart, sida);
  }
  const hopp = hoppMark(y, vy, dt);
  if (hopp.land && hoppar) { haptik.tick(); hoppar = false; }
  y = lage === 'sikta' ? 0 : hopp.y;
  vy = lage === 'sikta' ? 0 : hopp.vy;
  if (y > 0.08) hoppar = true;
  jamnhet.lagg(tid, { vrid: fart.yaw, fram: fart.fram, sida: fart.roll });
  const mat = jamnhet.las();
  brus.lagg(mat);
  const golv = brus.las();
  const oj = Math.max(
    Math.max(0, (mat.vrid?.std || 0) - (golv.vrid || 0)),
    Math.max(0, (mat.fram?.std || 0) - (golv.fram || 0))
  );
  const sk = skakSteg(skak, tid, dt, oj, {
    kanslighet: installningar.sikta.skakKanslighet,
    maxSkak: installningar.sikta.maxSkak,
    maxLugning: installningar.sikta.maxLugning
  });
  if (lage === 'sikta') {
    const iv = skakIntervall(sk.niva, installningar.sikta.maxSkak);
    if (iv > 0) {
      skakKlocka += dt;
      if (skakKlocka >= iv) { skakKlocka = 0; haptik.tick(); }
    } else skakKlocka = 0;
  }
  const malLigg = ligger ? 1 : 0;
  ligg += (malLigg - ligg) * (1 - Math.exp(-dt / 0.12));
  gubbe.position.set(pos.x, y, pos.z);
  gubbe.rotation.y = -heading;
  hoft.rotation.x = -ligg * 1.25;
  hoft.position.y = 0.7 - ligg * 0.62;
  const hor = Math.hypot(framFart, sida);
  fas += dt * (2.2 + hor * 2.5) * (1 - ligg);
  if (hor > 0.45 && ligg < 0.5) {
    const halv = Math.floor(fas / Math.PI);
    if (halv !== stegHalv) { stegHalv = halv; tick(stegLjud); }
  }
  const amp = Math.min(0.95, hor * 0.38) * (1 - ligg);
  benV.rotation.x = Math.sin(fas) * amp;
  benH.rotation.x = Math.sin(fas + Math.PI) * amp;
  armV.rotation.x = Math.sin(fas + Math.PI) * amp * 0.75;
  armH.rotation.x = Math.sin(fas) * amp * 0.75;
  torso.rotation.x = hor > 3.2 ? 0.28 : hor * 0.05;
  if (graf.length === 0 || tid - graf[graf.length - 1].t > 0.05) {
    graf.push({ t: tid, vrid: fart.yaw, fram: fart.fram, sida: fart.roll });
    while (graf.length && tid - graf[0].t > 2) graf.shift();
  }
  if (lage === 'sikta') {
    const rikt = sikteRiktning(utVrid, utFram, installningar.sikta.sida.pa ? utSida : 0, sk);
    const yaw = basHeading + rikt.yaw;
    const eyeY = 1.62;
    _look.set(Math.sin(yaw) * Math.cos(rikt.pitch), Math.sin(rikt.pitch), -Math.cos(yaw) * Math.cos(rikt.pitch));
    sikteKam.position.set(pos.x, eyeY, pos.z);
    sikteKam.up.set(0, 1, 0);
    sikteKam.lookAt(pos.x + _look.x, eyeY + _look.y, pos.z + _look.z);
    if (installningar.sikta.sida.pa) sikteKam.rotateZ(-rikt.roll);
    renderer.render(scene, sikteKam);
  } else {
    const bak = 3.4;
    const sido = 3.6;
    _mal.set(
      pos.x - Math.sin(heading) * bak + Math.cos(heading) * sido,
      y + 2.2 + ligg * 0.35,
      pos.z + Math.cos(heading) * bak + Math.sin(heading) * sido
    );
    kamera.position.lerp(_mal, 1 - Math.exp(-dt / 0.16));
    kamera.lookAt(pos.x, y + 1.2 - ligg * 0.45, pos.z);
    renderer.render(scene, kamera);
  }
  if (tid - hudTid > 0.1) { hudTid = tid; ritaHud(vink, fart, mat, golv, framFart, sida); }
}

function tal(n) {
  const v = Number.isFinite(n) ? n : 0;
  return (v >= 0 ? '+' : '') + v.toFixed(1).replace('.', ',');
}
function ritaHud(vink, fart, mat, golv, framFart, sida) {
  $('vinklar').textContent = `Vrid ${tal(vink.yaw)}°  ${tal(fart.yaw)} °/s\nFram ${tal(vink.fram)}°  ${tal(fart.fram)} °/s\nSida ${tal(vink.roll)}°  ${tal(fart.roll)} °/s`;
  const par = [['Vrid', 'vrid'], ['Fram', 'fram'], ['Sida', 'sida']];
  for (const [namn, id] of par) {
    const std = mat[id]?.std || 0;
    const r = ryckighet(std, golv[id] || 0, installningar.jamnKanslighet);
    $('bar' + namn).style.setProperty('--n', String(r));
    $('bar' + namn + 'Tal').textContent = std.toFixed(1).replace('.', ',') + ' °/s';
  }
  const tyst = brus.tystast();
  const nu = Math.max(mat.vrid?.std || 0, mat.fram?.std || 0, mat.sida?.std || 0);
  $('brusRad').textContent = tyst == null ? 'Brus: mäter…' : `Brus nu ${nu.toFixed(1).replace('.', ',')} °/s · tystast ${tyst.toFixed(1).replace('.', ',')} °/s`;
  const namn = lage === 'sikta' ? 'Siktar' : visaNamn({ ligger, hoppar, fram: framFart, pace: fartMaskin.pace, sida });
  if (namn !== senNamn) { senNamn = namn; $('fartNamn').textContent = namn; }
  $('sensorLage').textContent = anvandFinger() ? (finger ? 'Finger' : 'Inget gyro') : (harRR ? 'Gyro' : 'Vinkel');
  $('res').hidden = lage !== 'ga' || !ligger;
  ritaGraf();
}
function ritaGraf() {
  const c = $('graf');
  const w = c.clientWidth || 280;
  const h = c.clientHeight || 64;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  if (c.width !== Math.floor(w * dpr)) { c.width = Math.floor(w * dpr); c.height = Math.floor(h * dpr); }
  const g = c.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  g.strokeStyle = '#ffffff22';
  g.beginPath();
  g.moveTo(0, h / 2);
  g.lineTo(w, h / 2);
  g.stroke();
  if (graf.length < 2) return;
  let topp = 8;
  for (const p of graf) topp = Math.max(topp, Math.abs(p.vrid), Math.abs(p.fram), Math.abs(p.sida));
  const t0 = graf[0].t, t1 = graf[graf.length - 1].t || t0 + 0.01;
  const linje = (nyckel, farg) => {
    g.beginPath();
    g.strokeStyle = farg;
    g.lineWidth = 1.4;
    graf.forEach((p, i) => {
      const x = ((p.t - t0) / Math.max(0.001, t1 - t0)) * w;
      const yv = h / 2 - (p[nyckel] / topp) * (h / 2 - 2);
      if (i === 0) g.moveTo(x, yv); else g.lineTo(x, yv);
    });
    g.stroke();
  };
  linje('vrid', '#e0f1a4');
  linje('fram', '#8ec8ff');
  linje('sida', '#f0b48a');
}

function reglage(parent, obj, nyckel, namn, min, max, steg, enhet) {
  const lab = document.createElement('label');
  lab.className = 'reg';
  const rad = document.createElement('span');
  rad.className = 'reg-rad';
  const ut = document.createElement('output');
  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(steg);
  input.value = String(obj[nyckel]);
  const visa = () => {
    const dec = String(steg).includes('.') ? String(steg).split('.')[1].length : 0;
    ut.textContent = Number(input.value).toFixed(dec).replace('.', ',') + (enhet ? ' ' + enhet : '');
  };
  input.addEventListener('input', () => { obj[nyckel] = +input.value; visa(); spara(); });
  visa();
  rad.append(namn, ut);
  lab.append(rad, input);
  parent.append(lab);
}
function byggAxel(parent, block, id, namn, hint, medLage) {
  const det = document.createElement('details');
  const sum = document.createElement('summary');
  sum.textContent = namn;
  det.append(sum);
  const p = document.createElement('p');
  p.className = 'hint';
  p.textContent = hint;
  det.append(p);
  if (id === 'sida') {
    const lab = document.createElement('label');
    lab.className = 'kryss';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = block.sida.pa;
    cb.addEventListener('change', () => { block.sida.pa = cb.checked; spara(); });
    lab.append(cb, document.createTextNode(medLage ? ' Sidled på' : ' Luta siktet'));
    det.append(lab);
  }
  if (medLage) {
    const sel = document.createElement('select');
    for (const [val, text] of [['lage', 'Följer läget'], ['fart', 'Bara när den rör sig']]) {
      const o = document.createElement('option');
      o.value = val;
      o.textContent = text;
      if (block[id].lage === val) o.selected = true;
      sel.append(o);
    }
    sel.addEventListener('change', () => { block[id].lage = sel.value; spara(); });
    const lab = document.createElement('label');
    lab.className = 'reg';
    lab.append('Läge', sel);
    det.append(lab);
    const h = document.createElement('p');
    h.className = 'hint';
    h.textContent = id === 'vrid'
      ? 'Följer läget: han pekar dit telefonen är vriden. Bara när den rör sig: vridningen stannar kvar när du stannar.'
      : 'Följer läget använder vinkeln från noll. Bara när den rör sig använder gyrots rotationRate, inte skak i sidled.';
    det.append(h);
  }
  reglage(det, block[id], 'kanslighet', 'Känslighet', 0.5, 3, 0.05, '×');
  reglage(det, block[id], 'forstarkning', 'Fartförstärkning', 0, 3, 0.1, '');
  reglage(det, block[id], 'utjamning', 'Utjämning', 0, 1, 0.05, '');
  reglage(det, block[id], 'dodzon', 'Dödzon', 0, 20, 0.5, medLage ? '' : '°');
  const f = document.createElement('p');
  f.className = 'hint';
  f.textContent = 'Fartförstärkning 0 är rakt på. Högre gör att en snabb rörelse ger oproportionerligt mer. Utjämning 0 är av.';
  det.append(f);
  parent.append(det);
}
function byggPanel() {
  const rot = $('falt');
  rot.replaceChildren();
  const hap = document.createElement('details');
  const hs = document.createElement('summary');
  hs.textContent = 'Haptik';
  hap.append(hs);
  const kr = document.createElement('label');
  kr.className = 'kryss';
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = installningar.haptik;
  cb.addEventListener('change', () => { installningar.haptik = cb.checked; haptik.pa = cb.checked; spara(); });
  kr.append(cb, document.createTextNode(' Haptik på'));
  const mt = document.createElement('p');
  mt.className = 'hint';
  mt.textContent = 'Den här telefonen: ' + haptik.metod.text + ' Knack vid fartsteg, när han kastar sig ner, när han landar, och när du byter läge. I siktet knackar det tätare ju mer det skakar.';
  hap.append(kr, mt);
  rot.append(hap);
  const ja = document.createElement('details');
  const js = document.createElement('summary');
  js.textContent = 'Jämnhet';
  ja.append(js);
  const jh = document.createElement('p');
  jh.className = 'hint';
  jh.textContent = 'Mätaren tittar på om gyrots fart är stadig. Stilla och jämn fart ligger åt Jämn. Ryckig betyder att farten ändras. Känslighet avgör hur liten skillnad som räknas. Tystast är bruset telefonen visar just nu, inklusive darr i handen. En iPhone som ligger helt still ligger ofta kring en grad per sekund. I handen är det mer. Siffran här är mätt på den här telefonen.';
  ja.append(jh);
  reglage(ja, installningar, 'jamnKanslighet', 'Känslighet', 0.5, 3, 0.05, '×');
  rot.append(ja);
  const gh = document.createElement('h3');
  gh.textContent = 'Gång';
  rot.append(gh);
  byggAxel(rot, installningar.ga, 'vrid', 'Vrida', 'Vrid telefonen som en dörr. Plus är höger.', true);
  byggAxel(rot, installningar.ga, 'fram', 'Luta fram/bak', 'Luta toppen bort så går han. Tillbaka till noll så fortsätter han. Luta lite bakåt så bromsar han ett steg: Springer, Går fort, Går, Står. Mer lutning eller en snabbare lutning ger högre fart.', true);
  byggAxel(rot, installningar.ga, 'sida', 'Luta åt sidan', 'Av som standard. På: han stegar åt sidan. Plus är högerkanten ned.', true);
  const kn = document.createElement('details');
  const ks = document.createElement('summary');
  ks.textContent = 'Knyckar';
  kn.append(ks);
  const kh = document.createElement('p');
  kh.className = 'hint';
  kh.textContent = 'En mycket snabb knyck, inte en vanlig lutning. Kasta sig ner: toppen snabbt mot dig. Hoppa: toppen snabbt bort. Det är tyst i 0,6 s efteråt.';
  kn.append(kh);
  reglage(kn, installningar.ga, 'nerDps', 'Kasta sig ner', 120, 700, 10, '°/s');
  reglage(kn, installningar.ga, 'hoppDps', 'Hoppa', 120, 700, 10, '°/s');
  rot.append(kn);
  const sh = document.createElement('h3');
  sh.textContent = 'Sikte';
  rot.append(sh);
  const sp = document.createElement('p');
  sp.className = 'hint';
  sp.textContent = 'Siktet följer alltid läget. Det glider inte tillbaka. Nollställ sätter noll. Skakningen kommer av ojämn fart, inte av själva farten.';
  rot.append(sp);
  byggAxel(rot, installningar.sikta, 'vrid', 'Vrida', 'Höger är höger. Vänster är vänster.', false);
  byggAxel(rot, installningar.sikta, 'fram', 'Luta fram/bak', 'Toppen bort eller ned siktar ned. Toppen mot dig siktar upp.', false);
  byggAxel(rot, installningar.sikta, 'sida', 'Luta åt sidan', 'Av som standard. På: siktet lutar med telefonen.', false);
  const sk = document.createElement('details');
  const ss = document.createElement('summary');
  ss.textContent = 'Skakning i siktet';
  sk.append(ss);
  reglage(sk, installningar.sikta, 'skakKanslighet', 'Skakkänslighet', 0.5, 3, 0.05, '×');
  reglage(sk, installningar.sikta, 'maxSkak', 'Max skakning', 0, 3, 0.1, '°');
  reglage(sk, installningar.sikta, 'maxLugning', 'Max lugningstid', 0.2, 2, 0.1, 's');
  const sf = document.createElement('p');
  sf.className = 'hint';
  sf.textContent = 'En kraftig ryck kan skaka i upp till max lugningstid (standard 2 s). En liten ryck lägger sig fortare. Jämn fart och stilla ger ingen skak.';
  sk.append(sf);
  rot.append(sk);
}

function hall(el, nyckel) {
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.setPointerCapture(e.pointerId); knappar[nyckel] = true; });
  const upp = () => { knappar[nyckel] = false; };
  el.addEventListener('pointerup', upp);
  el.addEventListener('pointercancel', upp);
}
hall($('knappFram'), 'fram');
hall($('knappBak'), 'bak');
hall($('knappVanster'), 'vanster');
hall($('knappHoger'), 'hoger');
$('knappGa').addEventListener('click', () => sattLage('ga'));
$('knappSikta').addEventListener('click', () => sattLage('sikta'));
$('noll').addEventListener('click', nollstall);
$('matKnapp').addEventListener('click', () => {
  const oppna = $('matning').hidden;
  $('matning').hidden = !oppna;
  $('matKnapp').setAttribute('aria-expanded', oppna ? 'true' : 'false');
});
$('res').addEventListener('click', () => { ligger = false; });
$('install').addEventListener('click', () => {
  const oppna = $('panel').hidden;
  $('panel').hidden = !oppna;
  $('install').setAttribute('aria-expanded', String(oppna));
});
$('klar').addEventListener('click', () => { $('panel').hidden = true; $('install').setAttribute('aria-expanded', 'false'); });
$('standard').addEventListener('click', () => {
  const n = standardInstallningar();
  installningar.haptik = n.haptik;
  installningar.jamnKanslighet = n.jamnKanslighet;
  installningar.ga = n.ga;
  installningar.sikta = n.sikta;
  haptik.pa = n.haptik;
  byggPanel();
  spara();
});
const TANG = { ArrowUp: 'fram', KeyW: 'fram', ArrowDown: 'bak', KeyS: 'bak', ArrowLeft: 'vanster', KeyA: 'vanster', ArrowRight: 'hoger', KeyD: 'hoger' };
addEventListener('keydown', (e) => { if (TANG[e.code]) { knappar[TANG[e.code]] = true; e.preventDefault(); } });
addEventListener('keyup', (e) => { if (TANG[e.code]) knappar[TANG[e.code]] = false; });

let pek = null;
let senPek = null;
$('spel').addEventListener('pointerdown', (e) => {
  if (!$('startPanel').hidden || !$('panel').hidden) return;
  pek = e.pointerId;
  senPek = [e.clientX, e.clientY];
  $('spel').setPointerCapture(e.pointerId);
});
$('spel').addEventListener('pointermove', (e) => {
  if (e.pointerId !== pek || !senPek) return;
  const dx = e.clientX - senPek[0];
  const dy = e.clientY - senPek[1];
  senPek = [e.clientX, e.clientY];
  if (!anvandFinger() && harRR) return;
  drag.yaw = Math.max(-90, Math.min(90, drag.yaw + dx * 0.14));
  drag.fram = Math.max(-70, Math.min(70, drag.fram - dy * 0.16));
});
const slutPek = (e) => { if (e.pointerId === pek) { pek = null; senPek = null; } };
$('spel').addEventListener('pointerup', slutPek);
$('spel').addEventListener('pointercancel', slutPek);

$('start').addEventListener('click', () => {
  const p = requestMotionPermission(window);
  p.then((res) => {
    if (res === 'granted' || res === 'unavailable') { $('startStatus').textContent = ''; startaGyro(); }
    else {
      const text = {
        denied: 'Nekat. Stäng Safari helt, öppna sidan igen och tryck Starta.',
        'needs-gesture': 'Tryck Starta en gång till.',
        insecure: 'Sidan måste öppnas med https.',
        unsupported: 'Webbläsaren har ingen rörelsesensor. Använd fingret.',
        error: 'Det gick inte att fråga. Tryck Starta igen.'
      }[res] || 'Försök igen.';
      $('startStatus').textContent = text;
    }
  });
});
$('finger').addEventListener('click', startaFinger);
lyssnaSkarm(() => { if (orient && !finger) nollstall(); });
byggPanel();

let fore = performance.now();
function ram(nu) {
  if (document.hidden) foreVinkel = null;
  else steg((nu - fore) / 1000);
  fore = nu;
  requestAnimationFrame(ram);
}
requestAnimationFrame(ram);
addEventListener('resize', () => {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  for (const cam of [kamera, sikteKam]) { cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
});
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });

window.gubbeTest = {
  startaFinger, nollstall, sattLage, steg, installningar, haptik,
  get lage() { return lage; },
  mata(o = {}) {
    if (o.orient) { orient = o.orient; senasteOrient = performance.now(); if (!neutral) neutral = { ...orient }; }
    if (o.rr) { rr = o.rr; harRR = true; }
    if (o.drag) Object.assign(drag, o.drag);
    if (o.finger != null) finger = o.finger;
    steg(o.dt || 0.016);
  },
  las() {
    return { lage, pace: fartMaskin.pace, namn: $('fartNamn').textContent, ligger, heading, pos: { ...pos }, y, harRR, finger };
  }
};
