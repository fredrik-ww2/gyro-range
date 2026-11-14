// Presets Standard och Realistisk: rätt värden, och styrningen beter sig olika.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { FlightInput } from '../flyg/flight-controls.js';
import { hojdExpo, jamnaSteg, roderKommando } from '../flyg/styrlage.js';
import { skapa, samma } from '../shared/styrlage.js';
import { hovringKryss, knackHovring } from '../rotor/hovring-hack.js';
import { ControlModule } from '../rotor/controls/ControlModule.js';
import { FlightDynamics } from '../rotor/controls/FlightDynamics.js';

const rot = new URL('../', import.meta.url);
const flyg = JSON.parse(fs.readFileSync(new URL('flyg/config.json', rot), 'utf8'));
const rotor = JSON.parse(fs.readFileSync(new URL('rotor/config.json', rot), 'utf8'));
const DEG = Math.PI / 180;

test('flyg Standard är exakt de värden som redan styr', () => {
  for (const [grupp, varden] of Object.entries(flyg.presets.standard)) {
    for (const [nyckel, varde] of Object.entries(varden)) {
      assert.equal(flyg[grupp][nyckel], varde, grupp + '.' + nyckel);
    }
  }
  assert.equal(flyg.presets.standard.gyro_zon.kurva_full_grader, 32);
  assert.equal(flyg.presets.standard.styrning.bank_forstarkning, 1.4);
  assert.equal(flyg.presets.standard.styrning.utjamning_s, 0);
  assert.equal(flyg.presets.standard.styrning.hojd_expo, 1);
  assert.equal(flyg.presets.standard.styrning.sidroder_vrid, true);
  assert.equal(flyg.presets.standard.styrning.samordnad_svang, false);
});

test('flyg Realistisk har den lugnare kurvan och samordnad sväng', () => {
  const s = flyg.presets.realistisk.styrning;
  const z = flyg.presets.realistisk.gyro_zon;
  assert.ok(Math.abs(s.dodzon * 180 / Math.PI - 3) < 0.08);
  assert.ok(Math.abs(s.dodzon_mjuk * 180 / Math.PI - 2) < 0.08);
  assert.equal(s.dodzon, 0.052);
  assert.equal(s.dodzon_mjuk, 0.035);
  assert.equal(s.utjamning_s, 0.1);
  assert.equal(s.bank_forstarkning, 1.2);
  assert.ok(s.hojd_expo > 1);
  assert.equal(s.sidroder_vrid, false);
  assert.equal(s.samordnad_svang, true);
  assert.equal(z.kurva_full_grader, 28);
  assert.notEqual(s.dodzon, flyg.presets.standard.styrning.dodzon);
});

test('höjdrodrets expo gör små lutningar finare och fullt utslag lika', () => {
  assert.equal(hojdExpo(0.2, 0.55, 1), 0.2);
  const fin = hojdExpo(0.2, 0.55, flyg.presets.realistisk.styrning.hojd_expo);
  assert.ok(fin > 0 && fin < 0.2);
  assert.equal(hojdExpo(0.55, 0.55, 1.8), 0.55);
  assert.equal(hojdExpo(-0.55, 0.55, 1.8), -0.55);
});

test('utjämning 0 släpper igenom, 0,10 s släpar efter', () => {
  assert.equal(jamnaSteg(0, 0.4, 0.05, 0), 0.4);
  const seg = jamnaSteg(0, 0.4, 0.05, 0.1);
  assert.ok(seg > 0 && seg < 0.4);
});

function styr(over) {
  globalThis.addEventListener = () => {};
  globalThis.screen = { orientation: { angle: 0 } };
  globalThis.window = { orientation: 0 };
  const cfg = { ...flyg.styrning, ...over };
  const inst = new FlightInput({ drag: { x: 0, y: 0 } }, cfg, { kanslighet: 1 });
  inst.active = true;
  inst.pending = false;
  inst.web = { alpha: 0, beta: 90, gamma: 0 };
  let t = 1000;
  inst.klocka = () => t;
  inst.webAt = t;
  inst.pose = { pitch: 0, roll: 0, yaw: 0 };
  return { inst, tid(n) { t = n; inst.webAt = n; } };
}

test('styrvägen: expo, utjämning och avstängt sidroder skiljer sig från Standard', () => {
  const rak = styr({ hojd_expo: 1, utjamning_s: 0, sidroder_vrid: true });
  rak.inst.pose = { pitch: 0.22, roll: 0.2, yaw: 0.3 };
  const a = rak.inst.read();
  const mjuk = styr({ hojd_expo: flyg.presets.realistisk.styrning.hojd_expo, utjamning_s: 0, sidroder_vrid: false });
  mjuk.inst.pose = { pitch: 0.22, roll: 0.2, yaw: 0.3 };
  const b = mjuk.inst.read();
  assert.ok(a.pitch > 0.15);
  assert.ok(b.pitch > 0 && b.pitch < a.pitch * 0.75);
  assert.ok(Math.abs(a.roder) > 0.4);
  assert.equal(b.roder, 0);

  const seg = styr({ utjamning_s: 0.1, hojd_expo: 1, sidroder_vrid: true });
  seg.inst.read();
  seg.inst.pose = { pitch: 0.25, roll: 0.3, yaw: 0 };
  seg.tid(1050);
  const efter = seg.inst.read();
  const rak2 = styr({ utjamning_s: 0, hojd_expo: 1 });
  rak2.inst.read();
  rak2.inst.pose = { pitch: 0.25, roll: 0.3, yaw: 0 };
  rak2.tid(1050);
  const direkt = rak2.inst.read();
  assert.ok(efter.pitch > 0 && efter.pitch < direkt.pitch);
  assert.ok(efter.pose.roll > 0 && efter.pose.roll < direkt.pose.roll);
  assert.ok(Math.abs(direkt.pose.roll - 0.3) < 1e-9);
});

test('samordnad sväng följer banken, Standard använder telefonens vridning', () => {
  const last = { roder: 0.8 };
  const komm = { roderHjalp: 0.1 };
  const bank = 25 * DEG;
  const std = roderKommando(0, last, komm, bank, flyg.presets.standard.styrning);
  const rea = roderKommando(0, last, komm, bank, flyg.presets.realistisk.styrning);
  assert.ok(Math.abs(std - 0.9) < 1e-9);
  assert.ok(rea > 0.3 && rea < 0.6);
  assert.notEqual(rea, std);
  assert.equal(roderKommando(1, last, komm, bank, flyg.presets.realistisk.styrning), 1);
  assert.equal(roderKommando(0, last, komm, 0, flyg.presets.realistisk.styrning), 0);
});

test('valt läge sparas och Eget kommer när ett värde ändras', () => {
  const mem = new Map();
  const lagring = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  const mal = { styrning: { ...flyg.styrning }, gyro_zon: { ...flyg.gyro_zon } };
  const motor = skapa({ mal, presets: flyg.presets, spel: 'flyg', lagring });
  assert.equal(motor.lage, 'standard');
  assert.equal(motor.etikett(), 'Standard');
  motor.valj('realistisk');
  assert.equal(mal.styrning.utjamning_s, 0.1);
  assert.equal(mal.gyro_zon.kurva_full_grader, 28);
  assert.equal(motor.etikett(), 'Realistisk');
  mal.styrning.bank_forstarkning = 1;
  assert.equal(motor.kolla(), 'eget');
  assert.equal(motor.etikett(), 'Eget');
  const igen = { styrning: { ...flyg.styrning }, gyro_zon: { ...flyg.gyro_zon } };
  const tillbaka = skapa({ mal: igen, presets: flyg.presets, spel: 'flyg', lagring });
  assert.equal(tillbaka.lage, 'eget');
  assert.equal(igen.styrning.bank_forstarkning, 1);
  assert.equal(igen.styrning.dodzon, 0.052);
  tillbaka.valj('standard');
  assert.ok(samma(igen, flyg.presets.standard));
});

test('rotor Standard matchar config och Realistisk är de nya talen', () => {
  for (const [grupp, varden] of Object.entries(rotor.presets.standard)) {
    for (const [nyckel, varde] of Object.entries(varden)) {
      assert.equal(rotor[grupp][nyckel], varde, grupp + '.' + nyckel);
    }
  }
  const r = rotor.presets.realistisk;
  assert.equal(r.control.smoothingSeconds, 0.1);
  assert.equal(r.control.cyclicRate, 10);
  assert.equal(r.control.deadzoneDeg, 4);
  assert.equal(r.control.fullScaleDeg, 25);
  assert.equal(r.flight.tiltYaw, 1.6);
  assert.ok(r.flight.samordnadGir > 0);
  assert.equal(r.flight.transLiftStartKnots, 15);
  assert.equal(r.flight.transLiftEndKnots, 30);
  assert.equal(r.flight.hoverAssist, true);
  assert.equal(r.flight.hovringHack, true);
});

function spak(x, y, collective = 0.6, yaw = 0) {
  return { getCyclic: () => ({ x, y }), getCollective: () => collective, getYaw: () => yaw };
}

test('samma lutning ger mer spak i Realistisk, och utjämningen är kvickare', () => {
  const vid = (preset) => {
    const m = new ControlModule({ ...rotor.control, ...preset, smoothingSeconds: 0, cyclicRate: 0 });
    m.setOrientation({ pitch: 16, roll: 0 });
    m.update(0.05);
    return m.getCyclic().y;
  };
  const std = vid(rotor.presets.standard.control);
  const rea = vid(rotor.presets.realistisk.control);
  assert.ok(rea > std && std > 0 && rea < 1);

  const mjuk = (tau) => {
    const m = new ControlModule({ smoothingSeconds: tau, cyclicRate: 0, deadzoneDeg: 0, softKneeDeg: 0, fullScaleDeg: 30 });
    m.setOrientation({ pitch: 30, roll: 0 });
    m.update(0.05);
    return m.getCyclic().y;
  };
  assert.ok(mjuk(0.1) > mjuk(0.16));
});

test('samordnad gir är liten i hovring och tydlig i fart', () => {
  const gir = (knots, gain) => {
    const p = new FlightDynamics();
    p.configure({ tiltYaw: 0, samordnadGir: gain, samordnadFartKnop: 45, hoverAssist: false, autoTorque: true });
    p.vz = -(knots / 1.94384);
    const sp = spak(0.55, 0);
    for (let i = 0; i < 20; i++) p.update(0.1, sp);
    return Math.abs(p.yawRate);
  };
  const hovring = gir(0, rotor.presets.realistisk.flight.samordnadGir);
  const fart = gir(50, rotor.presets.realistisk.flight.samordnadGir);
  const utan = gir(50, 0);
  assert.ok(hovring < 0.02);
  assert.ok(fart > 0.1);
  assert.ok(fart > hovring * 4);
  assert.ok(utan < 0.02);
});

test('fartlyft i Realistisk börjar tidigare än i Standard', () => {
  const lyft = (preset) => {
    const p = new FlightDynamics();
    p.configure({ ...preset, hoverAssist: false });
    p.vz = -(20 / 1.94384);
    p.update(1 / 120, spak(0, 0));
    return p.liftFactor;
  };
  const std = lyft(rotor.presets.standard.flight);
  const rea = lyft(rotor.presets.realistisk.flight);
  assert.ok(Math.abs(std - 1) < 1e-6);
  assert.ok(rea > 1.04);
});

test('hovringshacket känner passagen och knackar i brygga och vibrate', () => {
  assert.equal(hovringKryss(0.5, 0.7, 0.6), true);
  assert.equal(hovringKryss(0.61, 0.7, 0.6), false);
  assert.equal(hovringKryss(0.6, 0.6, 0.6), false);
  const anrop = [];
  const ut = knackHovring(
    { vibrate: (n) => anrop.push(['vibrera', n]) },
    { ReactNativeWebView: { postMessage: (s) => anrop.push(['brygga', s]) }, navigator: {} }
  );
  assert.equal(ut.native, true);
  assert.equal(ut.vibrera, true);
  assert.equal(anrop[0][0], 'brygga');
  assert.match(anrop[0][1], /hovring/);
  assert.equal(anrop[1][0], 'vibrera');
  const tom = knackHovring({}, {});
  assert.equal(tom.native, false);
  assert.equal(tom.vibrera, false);
});
