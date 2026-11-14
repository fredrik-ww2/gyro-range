import {lasKonfig} from './konfig.js';
import {malOvergang, skapaSim} from './fysik.js';
import {skapaGyro, mjukLutning} from './gyro.js';
import {skapaLjud} from './ljud.js';
import {skapaBrade} from './brade.js';
import {monteraLabyrint} from './gyrobox-adapter.js';
import {lyssnaSkarm} from '../shared/sensor.js';

const $ = (id) => document.getElementById(id);
const RAD = Math.PI / 180;

function klamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function tal(v, en) {
  return `${v.toFixed(1).replace('.', ',')}${en || ''}`;
}

const konfig = await lasKonfig();
const texter = konfig.texter;
document.title = texter.titel || document.title;

const install = lasInstall();
const gyro = skapaGyro($('spel'), konfig);
const gyroLada = monteraLabyrint({gyro, gyroKonfig: konfig.gyro});
const ljud = skapaLjud(konfig);
const brade = skapaBrade($('spel'), konfig);
let banaIndex = klamp(install.bana | 0, 0, konfig.banor.length - 1);
let sim = skapaSim(konfig, konfig.banor[banaIndex]);
let igang = false;
let frys = false;
let malSedan = null;
let visLut = {fram: 0, sida: 0};
let fps = 0;
let fpsTid = 0;
let fpsAntal = 0;
let laddSek = 0;
let ritad = false;
const navStart = performance.now();

function lasInstall() {
  const bas = {
    kanslighet: konfig.gyro.kanslighet,
    dodzon: konfig.gyro.dodzon,
    ljud: konfig.strombrytare.ljud !== false,
    hjalp: konfig.strombrytare.hjalpbanor !== false,
    bana: 0,
  };
  try {
    const sparad = JSON.parse(localStorage.getItem('labyrint-install') || 'null');
    if (!sparad || typeof sparad !== 'object') return bas;
    if (Number.isFinite(+sparad.kanslighet)) bas.kanslighet = +sparad.kanslighet;
    if (Number.isFinite(+sparad.dodzon)) bas.dodzon = +sparad.dodzon;
    if (typeof sparad.ljud === 'boolean') bas.ljud = sparad.ljud;
    if (typeof sparad.hjalp === 'boolean') bas.hjalp = sparad.hjalp;
    if (Number.isFinite(+sparad.bana)) bas.bana = +sparad.bana | 0;
  } catch { /* läget kan vara privat */ }
  return bas;
}

function sparaInstall() {
  try { localStorage.setItem('labyrint-install', JSON.stringify(install)); } catch { /* privat läge */ }
}

function fyllText() {
  $('menyOrd').textContent = texter.meny || 'Meny';
  $('menyRubrik').textContent = texter.meny || 'Meny';
  $('stang').textContent = texter.stang || 'Stäng';
  $('hjalpText').textContent = texter.hjalpText || '';
  $('banaRubrik').textContent = texter.bana || 'Nivå';
  $('kanslaRubrik').textContent = texter.kansla || 'Känsla';
  $('startGyro').textContent = texter.startGyro || 'Starta gyro';
  $('startFinger').textContent = texter.startFinger || 'Finger';
  $('kanslighetNamn').textContent = texter.kanslighet || 'Känslighet';
  $('dodzonNamn').textContent = texter.dodzon || 'Dödzon';
  $('ljudNamn').textContent = texter.ljud || 'Ljud';
  $('hjalpNamn').textContent = texter.hjalp || 'Hjälpbanor';
  $('nollstall').textContent = texter.nollstall || 'Nollställ / Platta ut';
  $('prestandaRubrik').textContent = texter.prestanda || 'Prestanda';
  $('allaLankar').textContent = texter.allaLankar || 'Alla länkar';
  $('igen').textContent = texter.igen || 'Igen';
  $('nasta').textContent = texter.nasta || 'Nästa bana';
  $('firandeOm').textContent = texter.borjaOm || 'Från början';
  $('version').textContent = konfig.version || '';
}

function ritaBanor() {
  const rot = $('banor');
  rot.replaceChildren();
  konfig.banor.forEach((bana, i) => {
    const knapp = document.createElement('button');
    knapp.type = 'button';
    knapp.textContent = String(bana.nummer);
    knapp.setAttribute('aria-label', `Nivå ${bana.nummer} ${bana.namn}`);
    knapp.setAttribute('aria-pressed', String(i === banaIndex));
    knapp.addEventListener('click', () => bytBana(i));
    rot.append(knapp);
  });
  const vald = konfig.banor[banaIndex];
  $('banaNamn').textContent = `Nivå ${vald.nummer} · ${vald.namn}`;
}

function ritaKansla() {
  const rot = $('kansla');
  rot.replaceChildren();
  for (const steg of konfig.gyro.kansla || []) {
    const knapp = document.createElement('button');
    knapp.type = 'button';
    knapp.textContent = steg.namn;
    knapp.setAttribute('aria-pressed', String(Math.abs(install.kanslighet - steg.tal) < 0.03));
    knapp.addEventListener('click', () => {
      install.kanslighet = steg.tal;
      $('kanslighet').value = String(steg.tal);
      $('kanslighetTal').textContent = tal(install.kanslighet);
      sparaInstall();
      ritaKansla();
    });
    rot.append(knapp);
  }
}

function doljFirande() {
  $('firande').hidden = true;
  $('firandeOm').hidden = true;
}

function visaMal(sista) {
  const el = $('firande');
  if (!el.hidden) return;
  const nasta = konfig.banor[banaIndex + 1];
  $('firandeRubrik').textContent = sista ? (texter.allaKlara || 'Alla nivåer klara') : (texter.mal || 'Mål');
  $('firandeText').textContent = sista
    ? (texter.allaKlaraText || 'Du klarade hela labyrinten.')
    : `${texter.nasta || 'Nästa nivå'}: ${nasta.nummer} ${nasta.namn}`;
  $('firandeOm').hidden = !sista;
  el.hidden = false;
}

function bytBana(i) {
  malSedan = null;
  doljFirande();
  banaIndex = klamp(i, 0, konfig.banor.length - 1);
  install.bana = banaIndex;
  sparaInstall();
  sim = skapaSim(konfig, konfig.banor[banaIndex]);
  brade.bygg(konfig.banor[banaIndex]);
  brade.hjalp(install.hjalp);
  $('menyKnapp').dataset.mal = '0';
  $('malKnappar').hidden = true;
  $('lageText').textContent = '';
  ritaBanor();
}

function visaMeny(oppna) {
  $('meny').hidden = !oppna;
  $('menyKnapp').setAttribute('aria-expanded', String(!!oppna));
  if (oppna) ritaPrestanda();
}

const lutZon = {fram: {pa: false}, sida: {pa: false}};
function aktuellLutning(dt) {
  const ra = gyro.grader();
  if (ra.kalla === 'tvingad') return ra;
  const gyroKurva = {...konfig.gyro, dodzon: install.dodzon};
  const formad = gyroLada.forma(
    mjukLutning(ra.fram, install.kanslighet, gyroKurva, lutZon.fram),
    mjukLutning(ra.sida, install.kanslighet, gyroKurva, lutZon.sida),
    ra.fram,
    ra.sida,
    dt
  );
  return {fram: formad.fram, sida: formad.sida, kalla: ra.kalla};
}

function jamna(dt, lut) {
  if (lut.kalla === 'tvingad') {
    visLut.fram = lut.fram;
    visLut.sida = lut.sida;
    return;
  }
  const k = (tau) => 1 - Math.exp(-Math.max(0, dt) / Math.max(0.02, tau));
  visLut.fram += (lut.fram - visLut.fram) * k(konfig.gyro.utjamningFram ?? konfig.gyro.utjamningSek);
  visLut.sida += (lut.sida - visLut.sida) * k(konfig.gyro.utjamningSida ?? konfig.gyro.utjamningSek);
}

function hanteraLage(dt) {
  const lage = sim.lage;
  if (lage === 'mal') {
    if (malSedan == null) malSedan = 0;
    malSedan += dt;
    const sista = banaIndex >= konfig.banor.length - 1;
    const steg = malOvergang(malSedan, banaIndex, konfig.banor.length, konfig.spel.malPaus);
    $('lageText').textContent = sista ? (texter.allaKlara || 'Alla nivåer klara') : (texter.mal || 'Mål');
    $('menyKnapp').dataset.mal = '1';
    $('malKnappar').hidden = false;
    visaMal(sista);
    if (steg.byt) bytBana(steg.index);
    return;
  }
  malSedan = null;
  if (lage === 'faller' || lage === 'paus') {
    doljFirande();
    $('lageText').textContent = texter.hal || 'Hål';
  } else if ($('lageText').textContent === (texter.hal || 'Hål') || $('lageText').textContent === (texter.mal || 'Mål') || $('lageText').textContent === (texter.allaKlara || 'Alla nivåer klara')) {
    $('lageText').textContent = '';
  }
}

function stegEn(dt) {
  const lut = aktuellLutning(dt);
  jamna(dt, lut);
  if (igang) {
    sim.steg(dt, {fram: Math.sin(visLut.fram * RAD), sida: Math.sin(visLut.sida * RAD)});
    ljud.fran(sim.state);
    hanteraLage(dt);
  }
  gyro.slack(dt);
  brade.luta(dt, visLut.fram * RAD, visLut.sida * RAD);
  brade.boll(sim.state, dt);
}

function ritaPrestanda() {
  $('fps').textContent = fps ? String(Math.round(fps)) : '–';
  const mat = brade.prestanda();
  $('ritningar').textContent = String(mat.ritningar);
  $('trianglar').textContent = String(mat.trianglar);
  $('ladd').textContent = laddSek ? `${laddSek.toFixed(2).replace('.', ',')} s` : '–';
  const heap = performance.memory?.usedJSHeapSize;
  $('minne').textContent = heap ? `${Math.round(heap / 1048576)} MB` : '–';
}

function koppla() {
  $('kanslighet').min = konfig.gyro.kanslighetMin;
  $('kanslighet').max = konfig.gyro.kanslighetMax;
  $('kanslighet').value = String(install.kanslighet);
  $('dodzon').min = konfig.gyro.dodzonMin;
  $('dodzon').max = konfig.gyro.dodzonMax;
  $('dodzon').value = String(install.dodzon);
  $('ljud').checked = install.ljud;
  $('hjalp').checked = install.hjalp;
  ljud.satt(install.ljud);
  const visaTal = () => {
    $('kanslighetTal').textContent = tal(install.kanslighet);
    $('dodzonTal').textContent = tal(install.dodzon, '°');
  };
  visaTal();
  $('kanslighet').addEventListener('input', () => {
    install.kanslighet = +$('kanslighet').value;
    visaTal();
    sparaInstall();
    ritaKansla();
  });
  $('dodzon').addEventListener('input', () => {
    install.dodzon = +$('dodzon').value;
    visaTal();
    sparaInstall();
  });
  $('ljud').addEventListener('change', () => {
    install.ljud = $('ljud').checked;
    ljud.satt(install.ljud);
    sparaInstall();
  });
  $('hjalp').addEventListener('change', () => {
    install.hjalp = $('hjalp').checked;
    brade.hjalp(install.hjalp);
    sparaInstall();
  });
  $('nollstall').addEventListener('click', () => gyro.plattaUt());
  $('menyKnapp').addEventListener('click', () => visaMeny($('meny').hidden));
  $('stang').addEventListener('click', () => visaMeny(false));
  $('spel').addEventListener('pointerdown', () => { if (!$('meny').hidden) visaMeny(false); });
  $('firandeOm').addEventListener('click', () => bytBana(0));
  $('igen').addEventListener('click', () => bytBana(banaIndex));
  $('nasta').addEventListener('click', () => bytBana((banaIndex + 1) % konfig.banor.length));
  addEventListener('pointerdown', () => ljud.starta(), {capture: true, passive: true});
  $('startGyro').addEventListener('click', async () => {
    ljud.starta();
    const svar = await gyro.starta();
    if (!svar.ok) {
      $('lageText').textContent = texter.nekad || '';
      visaMeny(true);
      return;
    }
    borja();
    if (!gyro.harGyro) $('lageText').textContent = texter.ingenSensor || '';
    else $('lageText').textContent = texter.gyroPa || '';
  });
  $('startFinger').addEventListener('click', () => {
    ljud.starta();
    borja();
  });
  gyro.setBlockerad(() => !$('meny').hidden);
  addEventListener('resize', () => brade.passa());
  lyssnaSkarm(() => { gyro.plattaUt(); brade.passa(); });
}

function borja() {
  igang = true;
  $('startKnappar').hidden = true;
}

fyllText();
ritaKansla();
koppla();
brade.bygg(konfig.banor[banaIndex]);
brade.hjalp(install.hjalp);
ritaBanor();
brade.boll(sim.state, 0);
brade.rita();

let sen = performance.now();
function ram(nu) {
  requestAnimationFrame(ram);
  const dt = Math.min(konfig.fysik.dtMax, Math.max(0, (nu - sen) / 1000));
  sen = nu;
  if (document.hidden) return;
  if (!frys) stegEn(dt);
  else {
    brade.luta(dt, visLut.fram * RAD, visLut.sida * RAD);
    brade.boll(sim.state, dt);
  }
  brade.rita();
  if (!ritad) {
    ritad = true;
    laddSek = (performance.now() - navStart) / 1000;
  }
  fpsAntal++;
  fpsTid += dt;
  if (fpsTid >= 0.25) {
    fps = fpsAntal / fpsTid;
    fpsAntal = 0;
    fpsTid = 0;
    if (!$('meny').hidden) ritaPrestanda();
  }
}
requestAnimationFrame(ram);

window.__labyrint = {
  get redo() { return true; },
  get ritad() { return ritad; },
  get igang() { return igang; },
  boll() {
    return {x: sim.x, y: sim.y, z: sim.z, vx: sim.vx, vy: sim.vy, vz: sim.vz, lage: sim.lage, fart: sim.fart};
  },
  placera(x, z, vx, vz) { sim.placera(x, z, vx || 0, vz || 0); },
  sattLutning(fram, sida) { gyro.sattTvingad(fram, sida || 0); },
  slappLutning() { gyro.sattTvingad(null); },
  frys(v) { frys = !!v; },
  steg(n, dt) { for (let i = 0; i < n; i++) stegEn(dt); brade.rita(); },
  bana(i) { bytBana(i); },
  banaData() { return konfig.banor[banaIndex]; },
  antal() { return konfig.banor.length; },
  malPaus() { return konfig.spel.malPaus; },
  radie() { return konfig.fysik.kulaRadie; },
  provGlipa() { return brade.provGlipa(); },
  meny(oppna) { visaMeny(!!oppna); },
  prestanda() { return {fps, laddSek, ...brade.prestanda()}; },
  borja() { borja(); },
};
