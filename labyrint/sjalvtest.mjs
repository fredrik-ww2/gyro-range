import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import * as THREE from '../js/vendor/three.module.js';
import {avstandTillVagg, skapaSim} from './fysik.js';
import {enhetsKvaternion, gravitationSkarm, lutningFranGrav, mjukLutning} from './gyro.js';

const konfig = JSON.parse(readFileSync(new URL('./konfig.json', import.meta.url), 'utf8'));
const fel = [];
const krav = (namn, ok, extra) => {
  if (!ok) fel.push(extra ? `${namn} (${extra})` : namn);
};

function grav(alpha, beta, gamma, skarm = 0) {
  const q = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const skarmQ = new THREE.Quaternion();
  const ut = new THREE.Vector3();
  const inv = new THREE.Quaternion();
  enhetsKvaternion(alpha, beta, gamma, skarm, q, euler, skarmQ);
  return gravitationSkarm(q, ut, inv).clone();
}

const platt = grav(0, 0, 0, 0);
krav('plant bräde ger ingen sidkraft', Math.hypot(platt.x, platt.y) < 0.02);
const fram = grav(0, -20, 0, 0);
krav('toppen ned drar mot skärmens överkant', fram.y > 0.25 && Math.abs(fram.x) < 0.05, fram.y.toFixed(3));
const hoger = grav(0, 0, 20, 0);
krav('högerkant ned drar åt höger', hoger.x > 0.25 && Math.abs(hoger.y) < 0.05, hoger.x.toFixed(3));
const land = grav(0, 0, 20, 90);
krav('landskap vrider enhetens sida till skärmens höjd', Math.abs(land.y) > 0.25 && Math.abs(land.x) < 0.05);
const nollv = {
  fram: Math.asin(Math.max(-1, Math.min(1, fram.y))) * 180 / Math.PI,
  sida: Math.asin(Math.max(-1, Math.min(1, fram.x))) * 180 / Math.PI,
};
const noll = lutningFranGrav(fram, nollv, konfig);
krav('nollställning tar bort den kalibrerade lutningen', Math.abs(noll.fram) < 0.05 && Math.abs(noll.sida) < 0.05, `${noll.fram.toFixed(3)} ${noll.sida.toFixed(3)}`);

function sinGrader(g) { return Math.sin(g * Math.PI / 180); }

const mitt = skapaSim(konfig, konfig.banor[0]);
mitt.steg(0.4, {fram: 0, sida: 0});
krav('kulan vilar plant', Math.hypot(mitt.x - konfig.banor[0].start.x, mitt.z - konfig.banor[0].start.z) < 0.004);

const upp = skapaSim(konfig, konfig.banor[0]);
upp.placera(0.09, 0.09, 0, 0);
for (let i = 0; i < 40; i++) upp.steg(1 / 60, {fram: sinGrader(8), sida: 0});
krav('framåt rullar mot målet', upp.z < 0.06, upp.z.toFixed(3));
const hogerRull = skapaSim(konfig, konfig.banor[0]);
hogerRull.placera(-0.02, 0.09);
for (let i = 0; i < 40; i++) hogerRull.steg(1 / 60, {fram: 0, sida: sinGrader(8)});
krav('höger rullar åt höger', hogerRull.x > 0.03, hogerRull.x.toFixed(3));

const utanG = structuredClone(konfig);
utanG.fysik = {...konfig.fysik, g: 0};
const still = skapaSim(utanG, utanG.banor[0]);
still.placera(0, 0);
still.steg(0.5, {fram: sinGrader(20), sida: sinGrader(20)});
krav('gravitationen kommer från konfig', Math.hypot(still.x, still.z) < 0.002);

const bana = konfig.banor[0];
const vagg = bana.vaggar[0];
const r = konfig.fysik.kulaRadie;
const studs = skapaSim(konfig, bana);
const zUtanfor = vagg.z + vagg.d / 2 + r + 0.004;
studs.placera(vagg.x, zUtanfor, 0, -0.45);
let minZ = studs.z;
let vande = false;
let hordeStuds = false;
for (let i = 0; i < 20; i++) {
  studs.steg(1 / 120, {fram: 0, sida: 0});
  minZ = Math.min(minZ, studs.z);
  if (studs.vz > 0.05) vande = true;
  if (studs.handelser.some((h) => h.typ === 'studs')) hordeStuds = true;
}
const kant = vagg.z + vagg.d / 2 + r - 0.001;
krav('kulan går inte genom väggen', minZ >= kant - 0.002, minZ.toFixed(4));
krav('trästuds vänder farten', vande && hordeStuds);

const hal = bana.hal[0];
const ytter = skapaSim(konfig, bana);
ytter.placera(hal.x + hal.radie + 0.003, hal.z);
ytter.steg(0.35, {fram: 0, sida: 0});
krav('kulan stannar på kanten utanför hålet', ytter.lage === 'rullar');
const inner = skapaSim(konfig, bana);
inner.placera(hal.x + (hal.radie - 0.005), hal.z, -0.05, 0);
let foll = false;
let minY = inner.y;
for (let i = 0; i < 90; i++) {
  inner.steg(1 / 60, {fram: 0, sida: 0});
  minY = Math.min(minY, inner.y);
  if (inner.lage === 'faller' || inner.lage === 'paus') foll = true;
  if (inner.lage === 'paus') break;
}
krav('kulan tippar över hålkanten och faller', foll && minY < 0, `${inner.lage} y=${minY.toFixed(3)}`);
for (let i = 0; i < 80 && inner.lage !== 'rullar'; i++) inner.steg(1 / 60, {fram: 0, sida: 0});
krav('kulan kommer tillbaka efter hålet', inner.lage === 'rullar' && inner.y > 0, inner.lage);

const mal = skapaSim(konfig, bana);
mal.placera(bana.mal.x, bana.mal.z);
for (let i = 0; i < 90 && mal.lage !== 'mal'; i++) mal.steg(1 / 60, {fram: 0, sida: 0});
krav('målet fångar en stilla kula', mal.lage === 'mal');

const liten = Math.abs(mjukLutning(2.2, 1, konfig.gyro));
const medel = Math.abs(mjukLutning(8, 1, konfig.gyro));
krav('två grader är nästan plant', liten < 1.3, liten.toFixed(2));
krav('åtta grader ger en måttlig lutning', medel > 4.5 && medel < 8, medel.toFixed(2));
const vilaLut = skapaSim(konfig, konfig.banor[0]);
vilaLut.placera(0.02, 0.02);
for (let i = 0; i < 90; i++) vilaLut.steg(1 / 60, {fram: sinGrader(liten), sida: 0});
krav('kulan vilar vid liten lutning', Math.abs(vilaLut.z - 0.02) < 0.006, vilaLut.z.toFixed(4));
const rull = skapaSim(konfig, konfig.banor[0]);
rull.placera(0.02, 0.03);
for (let i = 0; i < 50; i++) rull.steg(1 / 60, {fram: sinGrader(medel), sida: 0});
krav('tydligare lutning sätter fart', rull.z < 0.012, rull.z.toFixed(4));

const kantX = konfig.brade.halvBredd - r;
const motVagg = skapaSim(konfig, konfig.banor[0]);
motVagg.placera(kantX, 0.02, 0, 0);
let vilaljud = 0;
for (let i = 0; i < 70; i++) {
  motVagg.steg(1 / 60, {fram: 0, sida: sinGrader(8)});
  vilaljud += motVagg.handelser.filter((h) => h.typ === 'studs').length;
}
krav('vila mot sargen är tyst', vilaljud === 0, String(vilaljud));

const tva = {x: 0, z: 0, b: 0.16, d: 0.01, vinkel: 90};
krav('vriden vägg följer samma rotation som lådan', Math.abs(avstandTillVagg(0.02, 0, tva) - 0.015) < 0.001, avstandTillVagg(0.02, 0, tva).toFixed(4));
const rak = {x: 0, z: 0, b: 0.16, d: 0.01, vinkel: 0};
krav('oroterad vägg mäter tjockleken på djupet', Math.abs(avstandTillVagg(0, 0.02, rak) - 0.015) < 0.001);

krav('tio nivåer', konfig.banor.length === 10 && konfig.banor.every((b, i) => b.nummer === i + 1));

function prover(spar, steg) {
  const ut = [];
  for (let i = 0; i < spar.length - 1; i++) {
    const a = spar[i];
    const b = spar[i + 1];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    const n = Math.max(1, Math.ceil(len / steg));
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      ut.push({x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t});
    }
  }
  return ut;
}

function avstandLada(x, z, lada) {
  return avstandTillVagg(x, z, lada);
}

function punktFramfor(spar, x, z, avstand) {
  let bast = 0;
  let bastD = Infinity;
  let bastT = 0;
  const seg = [];
  let total = 0;
  for (let i = 0; i < spar.length - 1; i++) {
    const ax = spar[i].x;
    const az = spar[i].z;
    const dx = spar[i + 1].x - ax;
    const dz = spar[i + 1].z - az;
    const len = Math.hypot(dx, dz) || 1e-6;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (len * len)));
    const d = Math.hypot(x - (ax + dx * t), z - (az + dz * t));
    seg.push({ax, az, dx, dz, len, fran: total});
    total += len;
    if (d < bastD) { bastD = d; bast = i; bastT = t; }
  }
  let kvar = seg[bast].fran + bastT * seg[bast].len + avstand;
  if (kvar >= total) return spar[spar.length - 1];
  for (const s of seg) {
    if (kvar <= s.fran + s.len + 1e-6) {
      const u = Math.max(0, Math.min(1, (kvar - s.fran) / s.len));
      return {x: s.ax + s.dx * u, z: s.az + s.dz * u};
    }
  }
  return spar[spar.length - 1];
}

for (const b of konfig.banor) {
  const prov = prover(b.spar, 0.002);
  let smal = Infinity;
  let varfor = '';
  for (const p of prov) {
    if (Math.abs(p.x) > konfig.brade.halvBredd - r - 0.003 || Math.abs(p.z) > konfig.brade.halvDjup - r - 0.003) {
      varfor = `utanför brädet ${p.x.toFixed(3)},${p.z.toFixed(3)}`;
      smal = -1;
      break;
    }
    for (const v of b.vaggar) {
      const d = avstandLada(p.x, p.z, v);
      if (d < smal) { smal = d; varfor = `vägg ${d.toFixed(3)}`; }
    }
    for (const h of b.hal) {
      const d = Math.hypot(p.x - h.x, p.z - h.z) - h.radie;
      if (d < smal) { smal = d; varfor = `hål ${d.toFixed(3)} vid ${h.x},${h.z}`; }
    }
  }
  krav(`${b.namn}: spåret har marginal`, smal >= r + 0.004, varfor);
  const sim = skapaSim(konfig, b);
  const maxSin = Math.sin(b.maxLutning * Math.PI / 180);
  let utfall = 'tid';
  let tid = 0;
  for (let i = 0; i < 60 * 22; i++) {
    const malP = punktFramfor(b.spar, sim.x, sim.z, 0.018);
    const dx = malP.x - sim.x;
    const dz = malP.z - sim.z;
    const d = Math.hypot(dx, dz) || 1;
    const styrka = Math.min(1, Math.max(0.45, d / 0.012));
    sim.steg(1 / 60, {fram: (-dz / d) * maxSin * styrka, sida: (dx / d) * maxSin * styrka});
    tid = (i + 1) / 60;
    if (sim.lage === 'faller' || sim.lage === 'paus') { utfall = `hål ${sim.x.toFixed(3)},${sim.z.toFixed(3)}`; break; }
    if (sim.lage === 'mal') { utfall = 'mal'; break; }
  }
  krav(`${b.namn}: går att köra från start till mål`, utfall === 'mal', `${utfall} efter ${tid.toFixed(1)} s`);
  if (utfall === 'mal') console.log(`${b.namn}: i mål på ${tid.toFixed(1)} s`);
}

if (fel.length) {
  console.error(fel.join('\n'));
  process.exit(1);
}
console.log('sjalvtest ok');
