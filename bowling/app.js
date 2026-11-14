import * as THREE from '../js/vendor/three.module.js';
import { KONFIG } from './konfig.js';
import { skapaGyro } from './gyro.js';
import { skapaMaskin } from './tillstand.js';
import { skapaFysik } from './fysik.js';
import { skapaLjud } from './ljud.js';
import { skapaBana } from './bana.js';
import { monteraBowling } from './gyrobox-adapter.js';

const $ = id => document.getElementById(id);
const canvas = $('vy');
const konfig = KONFIG;
const gyro = skapaGyro(konfig);
const gyroLada = monteraBowling({ konfig, lage: () => maskin.tillstand });
const maskin = skapaMaskin(konfig);
const fysik = skapaFysik(konfig);
const ljud = skapaLjud(konfig);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: konfig.bild.antialias, powerPreference: 'high-performance', alpha: false });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = konfig.bild.exponering;
const bana = skapaBana(konfig, renderer);

const NOLL_RATE = { alpha: 0, beta: 0, gamma: 0 };
let manuell = false;
let senKonsum = 0;
let stillaSedan = 0;
let fps = 0;
let frames = 0;
let fpsTid = performance.now();
const laddStart = performance.now();
let laddTid = 0;
let forsta = true;
let omstallKlar = false;

function frammeNu() {
  return fysik.ball.aktiv && fysik.ball.z <= -konfig.bana.langd + 0.45;
}

function hantera(r) {
  if (!r?.handelse) return r;
  if (r.handelse === 'bevapnad') ljud.bevapnad();
  if (r.handelse === 'slapp' && r.kast) {
    fysik.starta(r.kast);
    ljud.landning(r.kast.fart);
    omstallKlar = false;
    stillaSedan = 0;
  }
  return r;
}

function ljudAvSteg(res) {
  if (res?.ranna) ljud.ranna();
  if (res?.antalTraffade > 0) {
    const fart = Math.hypot(fysik.ball.vx, fysik.ball.vz) || fysik.kast?.fart || 6;
    ljud.krasch(res.antalTraffade, fart);
  }
  if (fysik.ball.aktiv) ljud.rulla(Math.hypot(fysik.ball.vx, fysik.ball.vz), !fysik.ball.ranna);
  else ljud.tystRull();
}

function mataOchSteg(prov) {
  const f = gyro.mata(prov);
  senKonsum = gyro.senasteSensor;
  const tid = Number.isFinite(prov?.t) ? prov.t : performance.now();
  return hantera(maskin.steg(tid, f, true, frammeNu()));
}

function nollNu() {
  ljud.vack();
  gyro.nollstall();
  const t = performance.now();
  maskin.nollstalld(t);
  senKonsum = gyro.senasteSensor;
  ljud.klick();
  if (!fysik.ball.aktiv) fysik.vilaKlot();
}

function tillat(T) {
  try {
    return typeof T?.requestPermission === 'function' ? T.requestPermission() : Promise.resolve(T ? 'granted' : 'unavailable');
  } catch (e) { return Promise.reject(e); }
}

let tillatelsePagar = false;

async function gestTryck() {
  // Väck ljudet i samma anrop som gesten, före första await.
  ljud.vack();
  if (maskin.tillstand === 'NEED_PERMISSION') {
    if (tillatelsePagar) return;
    tillatelsePagar = true;
    const orientation = tillat(globalThis.DeviceOrientationEvent);
    const motion = tillat(globalThis.DeviceMotionEvent);
    try {
      const [a, b] = await Promise.allSettled([orientation, motion]);
      const orienteringOk = a.status === 'fulfilled' && a.value === 'granted';
      const rorelseOk = b.status === 'fulfilled' && b.value === 'granted';
      const saknas = a.status === 'fulfilled' && a.value === 'unavailable'
        && b.status === 'fulfilled' && b.value === 'unavailable';
      if (orienteringOk || rorelseOk || saknas) {
        gyro.aktiv = true;
        maskin.beviljad();
        ljud.start();
        nollNu();
      } else gyro.aktiv = false;
    } finally {
      tillatelsePagar = false;
    }
    return;
  }
  const t = maskin.tillstand;
  if (t === 'LOOKING' || t === 'CALIBRATED_BACKSWING' || t === 'ARMED_IN_BACKSWING' || t === 'RELEASED_WATCHING') {
    nollNu();
  }
}

function seTillStart() {
  if (maskin.tillstand !== 'NEED_PERMISSION') return true;
  if (typeof DeviceOrientationEvent?.requestPermission === 'function') return false;
  maskin.beviljad();
  gyro.aktiv = true;
  return true;
}

function simulerat(rollGamma) {
  if (!seTillStart()) return;
  const t0 = performance.now();
  mataOchSteg({ t: t0, alpha: 0, beta: 90, gamma: 0, rotationRate: NOLL_RATE, skarm: 0 });
  gyro.nollstall();
  maskin.nollstalld(t0);
  for (let i = 1; i <= 8; i++) {
    mataOchSteg({ t: t0 + i * 20, alpha: 0, beta: 180, gamma: 180, rotationRate: NOLL_RATE, skarm: 0 });
  }
  const tRel = t0 + 200;
  mataOchSteg({ t: tRel, alpha: 0, beta: 0, gamma: rollGamma, rotationRate: NOLL_RATE, skarm: 0 });
  const rate = gyro.rateFranOmega(720);
  for (let i = 1; i <= 10; i++) {
    mataOchSteg({ t: tRel + i * 20, alpha: 0, beta: 0, gamma: rollGamma, rotationRate: rate, skarm: 0 });
  }
}

const BRYTARE = [
  ['framat_ar_toppen', 'Framåt är toppen'],
  ['invertera_fram', 'Invertera framåt'],
  ['invertera_hook', 'Invertera krok'],
  ['krok', 'Krok'],
  ['ranna', 'Ränna'],
  ['poang', 'Poäng'],
  ['ljud', 'Ljud'],
  ['debug', 'Debug']
];

function byggBrytare() {
  const rot = $('brytare');
  for (const [nyckel, text] of BRYTARE) {
    const label = document.createElement('label');
    label.className = 'rad';
    const span = document.createElement('span');
    span.textContent = text;
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!konfig.brytare[nyckel];
    input.addEventListener('change', () => {
      konfig.brytare[nyckel] = input.checked;
      if (nyckel === 'debug') $('debug').hidden = !input.checked;
      if (nyckel === 'ljud' && !input.checked) ljud.tystRull();
    });
    label.append(span, input);
    rot.append(label);
  }
}

function visaMeny(oppna) {
  $('meny').hidden = !oppna;
  $('menyKnapp').setAttribute('aria-expanded', oppna ? 'true' : 'false');
  uppdateraMeny();
}

function uppdateraMeny() {
  $('kans').value = String(konfig.kanslighet);
  $('kansTal').textContent = konfig.kanslighet.toFixed(2);
  $('arm').value = String(konfig.arm.langd);
  $('armTal').textContent = `${konfig.arm.langd.toFixed(2)} m`;
  const info = renderer.info;
  const minne = performance.memory ? `${Math.round(performance.memory.usedJSHeapSize / 1048576)} MB` : '–';
  $('mat').textContent = `${fps} fps · ${info.render.calls} anrop · ${Math.round(info.render.triangles / 1000)}k tris · ladd ${laddTid.toFixed(2)} s · ${minne}`;
  const p = fysik.poang;
  $('poang').textContent = p.kast ? `Senaste ${p.senast}${p.senast === 10 ? ' strike' : ''} · ${p.strike} strikes på ${p.kast} kast` : 'Inget kast ännu';
  if (konfig.brytare.debug) {
    const f = gyro.nu;
    const fart = maskin.kast ? maskin.kast.fart : 0;
    $('debug').hidden = false;
    $('debug').textContent = [
      maskin.tillstand,
      `θ ${f.theta.toFixed(0)}°`,
      `ω ${f.omega.toFixed(0)} °/s`,
      `fart ${fart.toFixed(1)} m/s`,
      `roll ${(f.roll * 180 / Math.PI).toFixed(0)}°`
    ].join('\n');
  } else $('debug').hidden = true;
}

function kanskeOmstall(now) {
  if (fysik.ball.aktiv || !fysik.poang.raknad || omstallKlar) { if (fysik.ball.aktiv) stillaSedan = 0; return; }
  if (maskin.tillstand !== 'LOOKING') return;
  if (!stillaSedan) stillaSedan = now;
  if (now - stillaSedan >= konfig.fysik.omstallning_ms) {
    fysik.aterstallPin();
    fysik.vilaKlot();
    omstallKlar = true;
    stillaSedan = 0;
  }
}

function storlek() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const kvot = Math.min(window.devicePixelRatio || 1, konfig.bild.max_pixelkvot);
  renderer.setPixelRatio(kvot);
  renderer.setSize(w, h, false);
  bana.storlek(w, h);
}

function foljKamera() {
  // Under svingen är kameran låst nedför banan. Efter släpp följer den
  // bara när telefonen lyfts till titt, så klotet syns tills dess.
  const titt = gyro.harNoll && gyro.nu.titt > 0.62 && gyro.nu.plat < 0.4;
  const folj = gyro.harNoll && (maskin.tillstand === 'LOOKING' || (maskin.tillstand === 'RELEASED_WATCHING' && titt));
  bana.kamera(gyro.nu.q, folj);
}

function tick(dt) {
  const res = fysik.steg(dt);
  ljudAvSteg(res);
  bana.rita(fysik);
  foljKamera();
  renderer.render(bana.scene, bana.camera);
  return { traff: res.traff.length, antalTraffade: res.antalTraffade, ranna: res.ranna, framme: res.framme };
}

let forra = performance.now();
function loop(now) {
  const dt = Math.min(konfig.fysik.dt_max, Math.max(0, (now - forra) / 1000));
  forra = now;
  if (document.hidden) {
    maskin.frysKlocka(now);
    requestAnimationFrame(loop);
    return;
  }
  if (!manuell) {
    const nytt = gyro.senasteSensor > senKonsum;
    if (nytt) senKonsum = gyro.senasteSensor;
    hantera(maskin.steg(now, gyroLada.forma(gyro.nu, dt), nytt, frammeNu()));
    ljudAvSteg(fysik.steg(dt));
    kanskeOmstall(now);
  }
  bana.rita(fysik);
  foljKamera();
  renderer.render(bana.scene, bana.camera);
  if (forsta) {
    forsta = false;
    laddTid = (performance.now() - laddStart) / 1000;
    window.bowling.redo = true;
  }
  frames++;
  if (now - fpsTid > 500) {
    fps = Math.round(frames * 1000 / (now - fpsTid));
    frames = 0;
    fpsTid = now;
    if (!$('meny').hidden) uppdateraMeny();
  }
  requestAnimationFrame(loop);
}

byggBrytare();
$('kans').addEventListener('input', () => { konfig.kanslighet = Number($('kans').value); $('kansTal').textContent = konfig.kanslighet.toFixed(2); });
$('arm').addEventListener('input', () => { konfig.arm.langd = Number($('arm').value); $('armTal').textContent = `${konfig.arm.langd.toFixed(2)} m`; });
$('menyKnapp').addEventListener('click', e => { e.stopPropagation(); visaMeny($('meny').hidden); });
$('stang').addEventListener('click', e => { e.stopPropagation(); visaMeny(false); });
$('noll').addEventListener('click', e => {
  e.stopPropagation();
  if (maskin.tillstand === 'NEED_PERMISSION') gestTryck();
  else nollNu();
});

let pek = null;
let saPekare = false;

function spelYta(e) {
  const mal = e.target;
  if (!mal || typeof mal.closest !== 'function') return true;
  return !(mal.closest('#meny') || mal.closest('#menyKnapp'));
}

function klart(x, y, avbruten) {
  if (!pek || pek.klar) return;
  pek.klar = true;
  const start = pek;
  pek = null;
  const ux = Number.isFinite(x) ? x : start.x;
  const uy = Number.isFinite(y) ? y : start.y;
  const anvandX = avbruten && ux === 0 && uy === 0 ? start.x : ux;
  const anvandY = avbruten && ux === 0 && uy === 0 ? start.y : uy;
  const moved = Math.hypot(anvandX - start.sx, anvandY - start.sy);
  const upp = start.sy - anvandY;
  const dt = Math.max(1, performance.now() - start.t);
  if (!avbruten && start.cocked && upp > 50 && upp / dt > 0.35 && gyro.kalla !== 'sensor') {
    const roll = Math.max(-70, Math.min(70, (anvandX - start.sx) * 0.2));
    simulerat(roll < 0 ? -60 : roll > 25 ? -60 : 0);
    return;
  }
  if (moved < 55) gestTryck();
}

addEventListener('pointerdown', e => {
  saPekare = true;
  if (pek && !pek.klar) return;
  if (!spelYta(e)) return;
  if (e.cancelable) e.preventDefault();
  pek = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), cocked: false, klar: false, touch: false };
}, { capture: true, passive: false });

addEventListener('pointermove', e => {
  if (!pek || pek.klar || pek.touch || e.pointerId !== pek.id) return;
  pek.x = e.clientX;
  pek.y = e.clientY;
  if (gyro.kalla === 'sensor') return;
  if (e.clientY - pek.sy > 80) pek.cocked = true;
}, { capture: true });

addEventListener('pointerup', e => {
  if (!pek || pek.klar || pek.touch || e.pointerId !== pek.id) return;
  klart(e.clientX, e.clientY, false);
}, { capture: true });

addEventListener('pointercancel', e => {
  if (!pek || pek.klar || pek.touch || e.pointerId !== pek.id) return;
  const x = Number.isFinite(e.clientX) ? e.clientX : pek.x;
  const y = Number.isFinite(e.clientY) ? e.clientY : pek.y;
  klart(x, y, true);
}, { capture: true });

addEventListener('touchstart', e => {
  if (saPekare || (pek && !pek.klar)) return;
  if (!spelYta(e)) return;
  const t = e.changedTouches && e.changedTouches[0];
  if (!t) return;
  if (e.cancelable) e.preventDefault();
  pek = { id: t.identifier, x: t.clientX, y: t.clientY, sx: t.clientX, sy: t.clientY, t: performance.now(), cocked: false, klar: false, touch: true };
}, { capture: true, passive: false });

addEventListener('touchmove', e => {
  if (!pek || !pek.touch || pek.klar) return;
  const t = [...e.changedTouches].find(p => p.identifier === pek.id);
  if (!t) return;
  pek.x = t.clientX;
  pek.y = t.clientY;
  if (e.cancelable) e.preventDefault();
  if (gyro.kalla !== 'sensor' && t.clientY - pek.sy > 80) pek.cocked = true;
}, { capture: true, passive: false });

addEventListener('touchend', e => {
  if (!pek || !pek.touch || pek.klar) return;
  const t = [...e.changedTouches].find(p => p.identifier === pek.id);
  if (!t) return;
  klart(t.clientX, t.clientY, false);
}, { capture: true });

addEventListener('touchcancel', e => {
  if (!pek || !pek.touch || pek.klar) return;
  const t = [...e.changedTouches].find(p => p.identifier === pek.id);
  klart(t ? t.clientX : pek.x, t ? t.clientY : pek.y, true);
}, { capture: true });

addEventListener('keydown', e => {
  if (e.repeat || e.target.closest('input, textarea')) return;
  if (e.code === 'Space') { e.preventDefault(); simulerat(0); }
  else if (e.code === 'KeyH') simulerat(-60);
  else if (e.code === 'KeyN') { if (seTillStart()) nollNu(); }
});

addEventListener('resize', storlek);
storlek();
uppdateraMeny();

window.bowling = {
  konfig,
  mata: mataOchSteg,
  manuell(pa) { manuell = !!pa; },
  tick,
  nollstall: nollNu,
  simulerat,
  oppnaMeny: visaMeny,
  tillstand: () => maskin.tillstand,
  lage: () => ({ ...gyro.nu }),
  kast: () => maskin.kast ? { ...maskin.kast } : null,
  klot: () => ({ x: fysik.ball.x, y: fysik.ball.y, z: fysik.ball.z, vx: fysik.ball.vx, vz: fysik.ball.vz, aktiv: fysik.ball.aktiv, ranna: fysik.ball.ranna }),
  kaglor: () => fysik.pins.map(p => ({ x: p.x, z: p.z, fallen: p.fallen })),
  poang: () => ({ ...fysik.poang }),
  rateFranOmega: omega => gyro.rateFranOmega(omega),
  aterstall() { fysik.aterstallPin(); fysik.vilaKlot(); },
  redo: false,
  get fps() { return fps; }
};

requestAnimationFrame(loop);
