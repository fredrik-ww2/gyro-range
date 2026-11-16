import test from 'node:test';
import assert from 'node:assert/strict';
import { siktePaSkarm } from '../sikte.js';
import { FlightDynamics } from '../controls/FlightDynamics.js';
import { anglesBetween } from '../controls/GyroAdapter.js';

test('siktet står stilla i mitten och flyttar sig när ringen dras', () => {
  const still = siktePaSkarm({ width: 390, height: 844 });
  assert.ok(Math.abs(still.x - 195) < 1);
  assert.ok(Math.abs(still.y - 337.6) < 1);
  const dragen = siktePaSkarm({ yaw: 0.3, pitch: 0.2, maxYaw: 0.6, maxPitch: 0.4, width: 390, height: 844 });
  assert.ok(dragen.x > still.x);
  assert.ok(dragen.y < still.y);
  assert.ok(dragen.x < 390 && dragen.y > 0);
});

test('högre lyft lyfter, framåtlutning ger nos ned och fart framåt', () => {
  const mark = -1000;
  const lyft = new FlightDynamics();
  const plan = new FlightDynamics();
  for (let i = 0; i < 240; i++) {
    lyft.update(1 / 120, { getCyclic: () => ({ x: 0, y: 0 }), getCollective: () => 0.85, getYaw: () => 0 }, mark);
    plan.update(1 / 120, { getCyclic: () => ({ x: 0, y: 0.7 }), getCollective: () => 0.9, getYaw: () => 0 }, mark);
  }
  assert.ok(lyft.y > 64, lyft.y);
  assert.ok(plan.pitch > 0.05, plan.pitch);
  assert.ok(plan.vz < -1, plan.vz);
  const fram = anglesBetween({ alpha: 0, beta: 90, gamma: 0, screen: 0 }, { alpha: 0, beta: 50, gamma: 0, screen: 0 });
  const bak = anglesBetween({ alpha: 0, beta: 90, gamma: 0, screen: 0 }, { alpha: 0, beta: 120, gamma: 0, screen: 0 });
  assert.ok(fram.pitch > 20 && bak.pitch < -20);
});
