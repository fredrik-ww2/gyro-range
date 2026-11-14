import test from 'node:test';
import assert from 'node:assert/strict';
import config from '../config.json' with { type: 'json' };
import { ControlModule } from '../controls/ControlModule.js';
import { FlightDynamics } from '../controls/FlightDynamics.js';
import { skapa } from '../../shared/styrlage.js';
import { hovringKryss } from '../hovring-hack.js';

test('Standardpreset är configens nuvarande värden', () => {
  for (const [grupp, varden] of Object.entries(config.presets.standard)) {
    for (const [nyckel, varde] of Object.entries(varden)) assert.equal(config[grupp][nyckel], varde);
  }
});

test('Realistisk preset laddar andra värden och styrningen svarar annorlunda', () => {
  const r = config.presets.realistisk;
  assert.equal(r.control.smoothingSeconds, 0.1);
  assert.equal(r.control.cyclicRate, 10);
  assert.equal(r.control.deadzoneDeg, 4);
  assert.equal(r.control.fullScaleDeg, 25);
  assert.equal(r.flight.tiltYaw, 1.6);
  assert.equal(r.flight.transLiftStartKnots, 15);
  assert.equal(r.flight.transLiftEndKnots, 30);
  assert.equal(r.flight.hoverAssist, true);
  assert.equal(r.flight.hovringHack, true);
  assert.ok(r.flight.samordnadGir > 0);

  const utslag = (preset) => {
    const m = new ControlModule({ ...config.control, ...preset, smoothingSeconds: 0, cyclicRate: 0 });
    m.setOrientation({ pitch: 16, roll: 0 });
    m.update(0.05);
    return m.getCyclic().y;
  };
  const std = utslag(config.presets.standard.control);
  const rea = utslag(r.control);
  assert.ok(rea > std && std > 0);

  const p = new FlightDynamics();
  p.configure({ ...r.flight, tiltYaw: 0 });
  p.vz = -(50 / 1.94384);
  const stick = { getCyclic: () => ({ x: 0.55, y: 0 }), getCollective: () => 0.6, getYaw: () => 0 };
  for (let i = 0; i < 20; i++) p.update(0.1, stick);
  const hov = new FlightDynamics();
  hov.configure({ ...r.flight, tiltYaw: 0 });
  for (let i = 0; i < 20; i++) hov.update(0.1, stick);
  assert.ok(Math.abs(p.yawRate) > 0.1);
  assert.ok(Math.abs(hov.yawRate) < 0.02);
});

test('läget kan växlas direkt och en manuell ändring blir Eget', () => {
  const mem = new Map();
  const lagring = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  const control = new ControlModule(config.control);
  const flight = new FlightDynamics(config.flight);
  const mal = { get control() { return control.settings; }, get flight() { return flight.params; } };
  const motor = skapa({
    mal, presets: config.presets, spel: 'rotor', lagring,
    tillampa(patch) {
      if (patch.control) control.configure(patch.control);
      if (patch.flight) flight.configure(patch.flight);
    }
  });
  assert.equal(motor.lage, 'standard');
  motor.valj('realistisk');
  assert.equal(control.settings.fullScaleDeg, 25);
  assert.equal(control.settings.smoothingSeconds, 0.1);
  assert.equal(flight.params.hoverAssist, true);
  assert.equal(flight.params.hovringHack, true);
  assert.equal(flight.assists.hover, true);
  flight.configure({ tiltYaw: 2 });
  assert.equal(motor.kolla(), 'eget');
  assert.equal(motor.etikett(), 'Eget');
  const control2 = new ControlModule(config.control);
  const flight2 = new FlightDynamics(config.flight);
  const mal2 = { get control() { return control2.settings; }, get flight() { return flight2.params; } };
  const igen = skapa({
    mal: mal2, presets: config.presets, spel: 'rotor', lagring,
    tillampa(patch) {
      if (patch.control) control2.configure(patch.control);
      if (patch.flight) flight2.configure(patch.flight);
    }
  });
  assert.equal(igen.lage, 'eget');
  assert.equal(flight2.params.tiltYaw, 2);
  assert.equal(hovringKryss(0.4, 0.6, flight.params.hoverCollective), true);
});
