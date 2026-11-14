// Sidroder och rollzon ska släppa när telefonen hålls still.
// Simulerar Safari (deviceorientation) och Expo (ww2-native-gyro).
import fs from 'node:fs';
import { FlightInput } from '../flyg/flight-controls.js';
import { nyZon, nollZon, styrKommando } from '../flyg/gyro-zon.js';
import { KvantFlyg } from '../flyg/kvaternion.js';

const rot = new URL('../', import.meta.url);
const C = JSON.parse(fs.readFileSync(new URL('flyg/config.json', rot), 'utf8'));
const Z = C.gyro_zon;
const main = fs.readFileSync(new URL('flyg/main.js', rot), 'utf8');
const html = fs.readFileSync(new URL('flyg/index.html', rot), 'utf8');
const fel = [];
const k = (namn, villkor) => { if (!villkor) fel.push(namn); };
const DEG = Math.PI / 180;

function diff(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

function rigg(vinkel = 0, native = false) {
  const lys = {};
  globalThis.screen = { orientation: { angle: vinkel } };
  globalThis.window = native ? { orientation: 0, ReactNativeWebView: {} } : { orientation: 0 };
  globalThis.addEventListener = (typ, fn) => { (lys[typ] ??= []).push(fn); };
  let t = 0;
  let nt = 0;
  const gyro = { drag: { x: 0, y: 0 }, center() { this.antal = (this.antal || 0) + 1; this.drag = { x: 0, y: 0 }; } };
  const inst = new FlightInput(gyro, C.styrning, { kanslighet: 1, brytare: { sidroder: true } });
  inst.active = true;
  inst.klocka = () => t;
  const fm = new KvantFlyg(C.modeller.typhoon.aero);
  fm.tillampaNivellering(true);
  fm.reset(0, 500, 0, 130);
  const zon = nyZon();
  const emit = (typ, e) => { for (const fn of lys[typ] || []) fn(e); };
  const steg = (dt) => {
    const last = inst.read();
    const komm = styrKommando(zon, {
      roll: last.pose.roll, rollRate: last.rollHast, pitch: last.pitch
    }, dt, Z, fm.A, { kanslighet: 1, nivellering: true, troskel: Z.roll_troskel_grader });
    const sid = inst.settings.brytare?.sidroder !== false;
    const roder = Math.max(-1, Math.min(1, (sid ? (last.roder || 0) : 0) + (komm.roderHjalp || 0)));
    fm.step(dt, komm.input, 0.85, undefined, { motorPa: true, gear: 0, flaps: 0, roder, paMarken: false });
    return { last, komm, roder, bank: fm.bank(), psi: fm.psi, rollRate: fm.rollRate, yawRate: fm.yawRate };
  };
  return {
    inst, gyro, fm, zon,
    webb(p, dt = 0.02, fart) {
      t += dt * 1000;
      emit('deviceorientation', p);
      if (fart) emit('devicemotion', { rotationRate: fart });
      return steg(dt);
    },
    native(d, dt = 0.02) {
      t += dt * 1000;
      nt += dt;
      emit('ww2-native-gyro', { detail: { x: 0, y: 0, z: 0, ...d, t: nt } });
      return steg(dt);
    }
  };
}

const opts = { kanslighet: 1, nivellering: true, troskel: 38 };
const aero = C.modeller.typhoon.aero;

k('vridningens tal ligger i config', C.styrning.yaw_folj_s > 0 && C.styrning.roder_dodzon_rad >= 0.05 && C.styrning.gyro_bias_tid_s > 0 && C.brytare.sidroder === true);
k('zonens släpp ligger i config', Z.slapp_tvang_grader > 0 && Z.slapp_tvang_grader < Z.roll_troskel_grader && Z.stilla_rad_s > 0 && Z.slapp_tid_s > 0);
k('menyn har sidroder via vridning', main.includes("sidroder:'Sidroder via vridning'") && html.includes('id="settingsButton"') && html.includes('id="toggles"'));
k('nollställning tar zon och roder', /function center\(\)\{input\.center\(\);nollZon\(zonTillstand\)/.test(main) && /roder=0/.test(main));
k('gyrolådan använder samma nollställning', /kalibrera\(\)\{center\(\);\}/.test(main));

{
  const st = nyZon();
  let u;
  for (let a = 0; a <= 50; a += 2) u = styrKommando(st, { roll: a * DEG, pitch: 0, rollRate: 2 }, 0.04, Z, aero, opts);
  k('brant lutning är zon 2', u.lage === 2);
  for (let a = 50; a >= 0; a -= 2) u = styrKommando(st, { roll: a * DEG, pitch: 0, rollRate: 2.5 }, 0.04, Z, aero, opts);
  for (let i = 0; i < 20; i++) u = styrKommando(st, { roll: 0, pitch: 0, rollRate: 2.5 }, 0.05, Z, aero, opts);
  k('plant läge släpper rollen trots hög fart', u.lage === 1 && Math.abs(st.rollRate) < 0.2);
  const hall = nyZon();
  for (let i = 0; i < 40; i++) u = styrKommando(hall, { roll: 45 * DEG, pitch: 0, rollRate: 0.05 }, 0.05, Z, aero, opts);
  k('hållen brant lutning får fortsätta rolla', u.lage === 2);
}

{
  const g = rigg();
  const noll = { alpha: 12, beta: 38, gamma: 4 };
  g.webb(noll, 0.05);
  const start = g.fm.psi;
  let maxRoder = 0;
  let maxYaw = 0;
  for (let i = 0; i < 240; i++) {
    const u = g.webb({ ...noll, alpha: noll.alpha + 0.4 * (i + 1) * 0.05 }, 0.05);
    if (i > 20) {
      maxRoder = Math.max(maxRoder, Math.abs(u.roder));
      maxYaw = Math.max(maxYaw, Math.abs(u.last.pose.yaw));
    }
  }
  k('liten drift ger inget sidroder ' + maxRoder.toFixed(3), maxRoder < 0.05 && maxYaw < 0.08);
  k('liten drift vrider inte kursen', Math.abs(diff(start, g.fm.psi)) < 5 * DEG && Math.abs(g.fm.bank()) < 6 * DEG && g.zon.lage === 1);
}

{
  const g = rigg();
  const noll = { alpha: 0, beta: 40, gamma: 0 };
  g.webb(noll, 0.05);
  let topp = 0;
  for (let i = 1; i <= 16; i++) {
    const u = g.webb({ alpha: 35 * i / 16, beta: 40, gamma: 0 }, 0.025);
    topp = Math.max(topp, Math.abs(u.roder));
  }
  k('kroppsvridning ger sidroder under vridningen ' + topp.toFixed(2), topp > 0.3);
  let sist;
  const kurs = [];
  for (let i = 0; i < 160; i++) {
    sist = g.webb({ alpha: 35, beta: 40, gamma: 0 }, 0.05);
    if (i > 100) kurs.push(g.fm.psi);
  }
  const vandring = Math.abs(diff(kurs[0], kurs[kurs.length - 1]));
  k('hållen kroppsvridning släpper rodret ' + sist.roder.toFixed(3), Math.abs(sist.roder) < 0.05 && Math.abs(sist.last.pose.yaw) < 0.09);
  k('kursen slutar vandra ' + (vandring / DEG).toFixed(2), vandring < 6 * DEG && Math.abs(g.fm.bank()) < 12 * DEG && Math.abs(g.fm.rollRate) < 0.3 && g.zon.lage === 1);
}

{
  const g = rigg();
  g.webb({ alpha: 0, beta: 25, gamma: 0 }, 0.05);
  for (let i = 1; i <= 15; i++) g.webb({ alpha: 0, beta: 25, gamma: 55 * i / 15 }, 0.02);
  k('snabb roll går till zon 2', g.zon.lage === 2);
  for (let i = 0; i < 20; i++) g.webb({ alpha: 0, beta: 25, gamma: 55 }, 0.02);
  k('rollen hålls medan telefonen är brant', g.zon.lage === 2);
  const fart = { beta: 0, gamma: 200 };
  for (let i = 1; i <= 15; i++) g.webb({ alpha: 0, beta: 25, gamma: 55 * (1 - i / 15) }, 0.02, fart);
  let u;
  for (let i = 0; i < 25; i++) u = g.webb({ alpha: 0, beta: 25, gamma: 0 }, 0.02, fart);
  k('tillbaka i neutralt släpper zon 2', u.komm.lage === 1 && Math.abs(u.roder) < 0.08);
  for (let i = 0; i < 140; i++) u = g.webb({ alpha: 0, beta: 25, gamma: 0 }, 0.05, fart);
  k('planet slutar rolla ' + (g.fm.bank() / DEG).toFixed(1) + ' ' + g.fm.rollRate.toFixed(3),
    g.zon.lage === 1 && Math.abs(g.fm.bank()) < 12 * DEG && Math.abs(g.fm.rollRate) < 0.35 && g.fm.upp().y > 0.9);
}

{
  const g = rigg(0, true);
  g.native({ x: 0, y: 0, z: 0 }, 0.02);
  const start = g.fm.psi;
  let maxRoder = 0;
  let sist;
  for (let i = 0; i < 600; i++) {
    sist = g.native({ x: 0.02, y: 0.05, z: 0.04 }, 0.02);
    if (i > 100) maxRoder = Math.max(maxRoder, Math.abs(sist.roder));
  }
  const p = sist.last.pose;
  k('native drift ger inget roder ' + maxRoder.toFixed(3), maxRoder < 0.08);
  k('native vinklar stannar ' + p.yaw.toFixed(3) + ' ' + p.roll.toFixed(3), Math.abs(p.yaw) < 0.1 && Math.abs(p.roll) < 0.12 && Math.abs(p.pitch) < 0.1);
  k('native planet snurrar inte', Math.abs(diff(start, g.fm.psi)) < 8 * DEG && Math.abs(g.fm.bank()) < 10 * DEG && g.zon.lage === 1);
}

{
  const g = rigg();
  g.webb({ alpha: 0, beta: 30, gamma: 0 }, 0.05);
  for (let i = 1; i <= 12; i++) g.webb({ alpha: 20 * i / 12, beta: 30, gamma: 48 * i / 12 }, 0.03);
  k('före nollställning är det en roll', g.zon.lage === 2);
  g.inst.center();
  nollZon(g.zon);
  k('centreraren anropas', g.gyro.antal === 1);
  let u = g.webb({ alpha: 20, beta: 30, gamma: 48 }, 0.05);
  k('nollställning tar roder och zon', Math.abs(u.roder) < 0.02 && Math.abs(u.last.pose.yaw) < 0.02 && Math.abs(u.last.pose.roll) < 0.02 && g.zon.lage === 1);
  for (let i = 0; i < 40; i++) u = g.webb({ alpha: 20, beta: 30, gamma: 48 }, 0.05);
  k('samma läge efter nollställning driver inte', Math.abs(u.roder) < 0.05 && g.zon.lage === 1 && Math.abs(u.last.pose.yaw) < 0.08);
}

{
  const g = rigg();
  g.inst.settings.brytare.sidroder = false;
  g.webb({ alpha: 0, beta: 40, gamma: 0 }, 0.05);
  let topp = 0;
  let nos = 0;
  for (let i = 1; i <= 12; i++) {
    const u = g.webb({ alpha: 40 * i / 12, beta: 55, gamma: 0 }, 0.025);
    topp = Math.max(topp, Math.abs(u.last.roder));
    nos = Math.max(nos, u.last.pitch);
  }
  k('avstängt sidroder styr inte', topp < 0.02);
  k('avstängt sidroder lämnar nos och bank', nos > 0.15);
  for (let i = 0; i < 20; i++) g.webb({ alpha: 0, beta: 40, gamma: 18 }, 0.05);
  k('bankzonen lever utan sidroder', g.zon.lage === 1 && Math.abs(g.fm.bank()) > 8 * DEG && Math.abs(g.fm.bank()) < 55 * DEG);
}

{
  const g = rigg();
  g.webb({ alpha: 5, beta: 30, gamma: 0 }, 0.05);
  let u;
  for (let i = 0; i < 40; i++) u = g.webb({ alpha: 5, beta: 52, gamma: 0 }, 0.05);
  k('nos upp läcker inte bort', u.last.pitch > 0.2 && Math.abs(u.last.pose.yaw) < 0.05 && g.zon.lage === 1);
}

if (fel.length) {
  console.error(fel.join('\n'));
  process.exit(1);
}
console.log('flyg-snurr-ok');
