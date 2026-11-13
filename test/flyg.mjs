// Flygprov 07: cockpitknapp, skottljud som tystnar, plus styrningen från Flygprov 06.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ringRadie } from '../flyg/ballistik.js';
import { FlightModel } from '../flyg/flight-model.js';
import { arOmslag, eulerStyrning, fysikVinkel } from '../flyg/orientering.js';
import { layoutFor, layoutKrockar } from '../flyg/layout.js';
import { ljudBehov, tomOmgang, traffPaSpelare, traffPost, FLYG_VERSION, vyEtikett } from '../flyg/omgang.js';
import { skapaKanal } from '../flyg/ljud.js';
import { FlightInput } from '../flyg/flight-controls.js';

const rot = new URL('../', import.meta.url);
const C = JSON.parse(fs.readFileSync(new URL('flyg/config.json', rot), 'utf8'));
const html = fs.readFileSync(new URL('flyg/index.html', rot), 'utf8');
const fel = [];
const k = (namn, villkor) => { if (!villkor) fel.push(namn); };
const DEG = Math.PI / 180;
const nara = (a, b, t = 0.03) => Math.abs(a - b) < t;

const lyssnare = {};
globalThis.screen = { orientation: { angle: 0 } };
globalThis.window = { orientation: 0 };
globalThis.addEventListener = (typ, fn) => { (lyssnare[typ] ??= []).push(fn); };
function nollLyssnare() { for (const k of Object.keys(lyssnare)) delete lyssnare[k]; }
function emit(typ, e) { for (const fn of lyssnare[typ] || []) fn(e); }
function styr(vinkel = 0) {
  nollLyssnare();
  screen.orientation.angle = vinkel;
  const gyro = { drag: { x: 0, y: 0 }, center() { this.drag = { x: 0, y: 0 }; this.antal = (this.antal || 0) + 1; } };
  const inst = new FlightInput(gyro, C.styrning, { kanslighet: 1 });
  inst.active = true;
  let t = 0;
  inst.klocka = () => t;
  return { inst, gyro, tid(n) { t = n; }, skicka(p) { emit('deviceorientation', p); } };
}

k('version i sidan', html.includes('Flygprov 07') && html.includes('id="versionEtikett"'));
k('versionens namn', FLYG_VERSION === 'Flygprov 07');
k('cockpitknapp i sidan', html.includes('id="sight"') && html.includes('class="vyknapp"') && html.includes('>Cockpit</button>'));
k('vyknappens text', vyEtikett(false) === 'Cockpit' && vyEtikett(true) === 'Bakifrån');
k('zippen ligger kvar', fs.existsSync(new URL('flyg/flyg-v05d.zip', rot)) && fs.existsSync(new URL('flyg/flyg-v05.zip', rot)));

{
  const noll = { alpha: 0, beta: 90, gamma: 0 };
  const upp = eulerStyrning({ alpha: 0, beta: 90, gamma: -20 }, noll, 90);
  k('landskap 90 nos upp', nara(upp.pitch, 20 * DEG) && Math.abs(upp.roll) < 1e-6);
  const bank = eulerStyrning({ alpha: 0, beta: 110, gamma: 0 }, noll, 90);
  k('landskap 90 bank', Math.abs(bank.pitch) < 1e-6 && nara(bank.roll, -20 * DEG));
  const portratt = eulerStyrning({ alpha: 0, beta: 110, gamma: 0 }, noll, 0);
  k('porträtt nos upp', nara(portratt.pitch, 20 * DEG) && Math.abs(portratt.roll) < 1e-6);
  const roll0 = eulerStyrning({ alpha: 0, beta: 90, gamma: 20 }, noll, 0);
  k('porträtt högerbank', Math.abs(roll0.pitch) < 1e-6 && nara(roll0.roll, -20 * DEG));
  for (const v of [180, 270]) {
    const u = eulerStyrning(v === 180 ? { alpha: 0, beta: 70, gamma: 0 } : { alpha: 0, beta: 90, gamma: 20 }, noll, v);
    k('nos upp vid ' + v, u.pitch > 0.2 && Math.abs(u.roll) < 0.05);
  }
  const a = { alpha: 0, beta: 30, gamma: 89 }, b = { alpha: 180, beta: 150, gamma: -89 };
  k('fysiskt samma läge', fysikVinkel(a, b) * 180 / Math.PI < 3);
  k('omslag känns igen', arOmslag(a, b));
  k('vanlig rörelse är inget omslag', !arOmslag(noll, { alpha: 0, beta: 110, gamma: 0 }));
  const wrap = eulerStyrning({ alpha: 1, beta: 0, gamma: 0 }, { alpha: 359, beta: 0, gamma: 0 }, 0);
  k('alpha 359 till 1', nara(wrap.yaw, 2 * DEG, 1e-6));
}

{
  const s = styr(90);
  s.skicka({ alpha: 0, beta: 90, gamma: 0 });
  s.skicka({ alpha: 0, beta: 90, gamma: -20 });
  const r = s.inst.read();
  k('landskap ger pitch inte bank', nara(r.pitch, 20 * DEG) && Math.abs(r.roll) < 0.02 && r.source === 'webb');
}
{
  const s = styr(0);
  s.skicka({ alpha: 0, beta: 90, gamma: 0 });
  s.skicka({ alpha: 0, beta: 110, gamma: 0 });
  const r = s.inst.read();
  k('porträtt oförändrat', nara(r.pitch, 20 * DEG) && Math.abs(r.roll) < 0.02);
}
{
  const s = styr(0);
  s.skicka({ alpha: 0, beta: 30, gamma: 89 });
  s.skicka({ alpha: 180, beta: 150, gamma: -89 });
  const r = s.inst.read();
  k('omslag ger inte fullt utslag', Math.abs(r.pitch) < 0.08 && Math.abs(r.roll) < 0.08 && Math.abs(r.roder) < 0.2);
}
{
  const s = styr(0);
  s.skicka({ alpha: 359, beta: 0, gamma: 0 });
  s.skicka({ alpha: 1, beta: 0, gamma: 0 });
  k('enkelt varv', nara(s.inst.read().pose.yaw, 2 * DEG, 1e-6));
}
{
  const s = styr(0);
  s.skicka({ alpha: 0, beta: 0, gamma: 0 });
  s.skicka({ alpha: 0, beta: 20, gamma: 20 });
  s.inst.active = false;
  const r = s.inst.read();
  k('avstängd gyro styr inte', r.pitch === 0 && r.roll === 0 && r.roder === 0 && r.source === 'av');
}
{
  const s = styr(0);
  s.skicka({ alpha: 0, beta: 90, gamma: 0 });
  s.skicka({ alpha: 0, beta: 120, gamma: 0 });
  const fore = s.inst._antal;
  s.inst.center();
  s.skicka({ alpha: 0, beta: 120, gamma: 0 });
  const noll = s.inst.read();
  s.skicka({ alpha: 0, beta: 140, gamma: 0 });
  const efter = s.inst.read();
  k('centrering väntar på nytt prov', Math.abs(noll.pitch) < 0.02 && nara(efter.pitch, 20 * DEG));
  k('centrering lägger inte lyssnare', s.inst._antal === fore && s.gyro.antal === 1);
}
{
  const s = styr(0);
  s.skicka({ alpha: 0, beta: 10, gamma: 0 });
  s.skicka({ alpha: 0, beta: NaN, gamma: 0 });
  k('ogiltigt prov kastas', Number.isFinite(s.inst.read().pitch));
}
{
  const s = styr(0);
  s.skicka({ alpha: 0, beta: 40, gamma: 0 });
  s.tid(5000);
  const r = s.inst.read();
  k('tyst sensor är noll', r.pitch === 0 && r.source === 'tyst');
}
{
  nollLyssnare();
  screen.orientation.angle = 0;
  window.ReactNativeWebView = {};
  const gyro = { drag: { x: 0, y: 0 }, center() {} };
  const inst = new FlightInput(gyro, C.styrning, { kanslighet: 1 });
  inst.active = true;
  let t = 0;
  inst.klocka = () => t;
  emit('ww2-native-gyro', { detail: { x: 0, y: 0, z: 0, t: 0 } });
  emit('ww2-native-gyro', { detail: { x: 2, y: 0, z: 0, t: 0.05 } });
  const staa = inst.read();
  k('native stående x är nos', staa.pitch > 0.05 && Math.abs(staa.pose.yaw) < 1e-6 && staa.source === 'native');
  inst.center();
  screen.orientation.angle = 90;
  emit('orientationchange', {});
  emit('ww2-native-gyro', { detail: { x: 2, y: 0, z: 0, t: 1 } });
  emit('ww2-native-gyro', { detail: { x: 2, y: 0, z: 0, t: 1.05 } });
  const ligg = inst.read();
  k('native landskap blandar inte x till nos', Math.abs(ligg.pitch) < 0.02 && Math.abs(ligg.pose.yaw) > 0.05);
  const antal = inst._antal;
  inst.reset();
  t = 10000;
  emit('deviceorientation', { alpha: 0, beta: 90, gamma: -20 });
  emit('deviceorientation', { alpha: 0, beta: 90, gamma: -40 });
  k('native som tystnat släpper fram webben', inst.read().source === 'webb' && inst._antal === antal);
  window.ReactNativeWebView = undefined;
}

{
  const fm = new FlightModel(C.aero);
  const bas = C.aero.niva_k;
  k('nivellering av', fm.tillampaNivellering(false) === 0 && C.aero.niva_k === bas);
  k('nivellering på igen', fm.tillampaNivellering(true) === bas && fm.A.niva_k === bas);
  k('config orörd', C.aero.niva_k === bas);
}
{
  k('skada av dödar inte', traffPaSpelare(1, false).hp === 1 && traffPaSpelare(1, false).ned === false);
  const dod = traffPaSpelare(1, true);
  k('skada på kan skjuta ner', dod.hp === 0 && dod.ned === true);
}
{
  const t = tomOmgang({ spelareHp: 24, bomber: 4 });
  k('omgång nollställs', t.pedalRoder === 0 && t.hits === 0 && t.shots === 0 && t.landInfo === '' && t.bomberKvar === 4 && t.spelareHp === 24);
  k('stängt ljud skapas om', ljudBehov({ state: 'closed' }, true) === 'skapa');
  k('pausat ljud väcks', ljudBehov({ state: 'suspended' }, true) === 'vakna');
  k('tyst läge pausar', ljudBehov({ state: 'running' }, false) === 'paus');
}
{
  const post = traffPost({ id: 'ballong', ref: { id: 7 } }, { x: 1 }, 'spelare');
  k('ballongträff behåller målet', post.ref && post.ref.id === 7 && post.id === 'ballong');
}

function fejkLjud() {
  const log = [];
  function gainNod() {
    const gain = {
      value: 1,
      cancelScheduledValues() { log.push('avbryt'); },
      setValueAtTime(v) { log.push(['nu', v]); this.value = v; },
      setTargetAtTime(v) { log.push(['mal', v]); }
    };
    return {
      gain,
      connect(n) { log.push('koppla-gain'); return n; },
      disconnect() { log.push('loss-gain'); this.borta = true; }
    };
  }
  return {
    log,
    currentTime: 1.5,
    destination: { id: 'ut' },
    createBufferSource() {
      const s = {
        buffer: null,
        loop: false,
        loopEnd: 0,
        playbackRate: { value: 1, cancelScheduledValues() {}, setValueAtTime() {}, setTargetAtTime() {} },
        connect(n) { log.push('koppla-kalla'); return n; },
        start(...a) { log.push(['start', ...a]); s.startad = a; },
        stop() { log.push('stopp'); s.stoppad = true; },
        disconnect() { log.push('loss-kalla'); s.borta = true; },
        onended: null
      };
      return s;
    },
    createGain: gainNod
  };
}

{
  const audio = fejkLjud();
  const skott = skapaKanal();
  const motor = skapaKanal();
  const bang = { duration: 1.4 };
  const tomgang = { duration: 3.99 };
  let loopade = 0;
  for (let i = 0; i < 12; i++) {
    const n = skott.spela(audio, bang, { volym: 0.4, loop: false, maxSek: 0.12 });
    if (n.source.loop) loopade++;
  }
  const senaste = skott.spelar();
  k('ett skott åt gången', skott.antal() === 1 && senaste);
  k('tidigare skott stoppas', audio.log.filter((x) => x === 'stopp').length === 11);
  k('skott loopar inte', loopade === 0);
  const kalla = skott.spela(audio, bang, { volym: 0.4, maxSek: 0.12 });
  k('sista skottet är kort', kalla.source.loop === false && kalla.source.startad[2] === 0.12 && kalla.source.startad[2] < bang.duration);
  skott.tyst();
  k('släppt avtryckare är tyst', skott.antal() === 0 && !skott.spelar() && kalla.gain.gain.value === 0 && kalla.source.stoppad && kalla.source.borta && kalla.gain.borta && kalla.source.loop === false);
  skott.tyst();
  k('tyst två gånger är ofarligt', skott.antal() === 0);
  const foreMotor = audio.log.filter((x) => Array.isArray(x) && x[0] === 'start').length;
  const nod = motor.spela(audio, tomgang, { volym: 0.2, loop: true, loopEnd: 9 });
  motor.spela(audio, tomgang, { volym: 0.2, loop: true, loopEnd: 9 });
  const efterMotor = audio.log.filter((x) => Array.isArray(x) && x[0] === 'start').length;
  k('motorn staplas inte', motor.antal() === 1 && efterMotor === foreMotor + 1 && nod.source.loop === true && nod.source.loopEnd <= tomgang.duration);
  skott.tyst();
  k('kanonen tystar inte motorn', motor.antal() === 1 && motor.spelar());
  const bruten = skapaKanal();
  const a2 = fejkLjud();
  a2.createBufferSource = () => {
    const s = fejkLjud().createBufferSource();
    s.stop = () => { throw Error('stop'); };
    return s;
  };
  const n = bruten.spela(a2, bang, { maxSek: 0.12 });
  bruten.tyst();
  k('bortkopplad även om stop kastar', bruten.antal() === 0 && n.source.borta && n.gain.gain.value === 0 && n.source.loop === false);
}

const R = ringRadie(1.225);
for (const [w, h] of [[844, 390], [932, 430], [667, 375], [390, 844], [430, 932], [375, 667]]) {
  const L = layoutFor(w, h, R, C.cockpit.fov_grader, C.jaktpanel);
  const krock = layoutKrockar(L);
  k('ingen överlapp ' + w + 'x' + h, krock.length === 0);
  k('stor vyknapp ' + w + 'x' + h, L.vy && L.vy.w >= 160 && L.vy.h >= 60 && L.vy.x > w * 0.4 && L.vy.y < h * 0.45);
}

if (fel.length) {
  console.error(fel.join('\n'));
  process.exit(1);
}
console.log('flyg-ok');
