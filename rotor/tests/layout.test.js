import test from 'node:test';
import assert from 'node:assert/strict';
import config from '../config.json' with { type: 'json' };
import ljud from '../ljud.json' with { type: 'json' };

test('cockpit layout stays in config and below a tunable windshield', () => {
  assert.equal(config.layout.gaugeHoldScale, 3);
  for (const name of ['portrait', 'landscape']) {
    const box = config.layout[name];
    assert.ok(box.windshieldEnd > 0.45 && box.windshieldEnd < 0.75);
    for (const key of ['collective', 'pedalLeft', 'pedalRight', 'cyclic', 'aimFocus']) {
      assert.ok(box[key].top + 0.001 >= box.windshieldEnd - 0.02, key);
    }
    assert.ok(box.rocket.cy > box.windshieldEnd);
    assert.equal(box.gauges.speed, undefined);
    for (const id of ['altitude', 'vertical', 'radar']) {
      assert.ok(box.gauges[id].cy > box.windshieldEnd, id);
    }
  }
  assert.equal(config.weapons.doubleTapMs, undefined);
  assert.ok(config.weapons.gunInterval > 0 && config.weapons.gunInterval < 0.2);
  assert.equal(config.weapons.rocketAmmo, 12);
  assert.ok(config.layout.gun.size >= 0.1 && config.layout.gun.size <= 0.22);
  assert.ok(config.cockpit.stick.gripY < 0.9);
  assert.ok(config.cockpit.lookDownDeg < 16);
});

test('ljud.json maps every event to file, volume and loop', () => {
  assert.equal(typeof ljud.storageKey, 'string');
  assert.ok(ljud.masterVolume > 0 && ljud.masterVolume <= 1);
  const names = ['rotorSlap', 'rotorWash', 'rotorThump', 'turbine', 'wind', 'gun', 'casing', 'rocket', 'explosion', 'hit', 'warnLow', 'warnBoundary', 'click', 'pedal'];
  for (const name of names) {
    const ev = ljud.events[name];
    assert.equal(typeof ev.file, 'string', name);
    assert.equal(typeof ev.loop, 'boolean', name);
    assert.ok(ev.volume > 0 && ev.volume <= 1, name);
  }
});
