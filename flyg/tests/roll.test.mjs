import test from 'node:test';
import assert from 'node:assert/strict';
import { eulerStyrning } from '../orientering.js';
import { nyZon, styrKommando } from '../gyro-zon.js';

const noll = { alpha: 0, beta: 90, gamma: 0 };
const Z = {
  kurva_dodzon_grader: 5,
  kurva_full_grader: 32,
  kurva_max_bank_grader: 60,
  expo: 1.15,
  roll_troskel_grader: 38,
  hysteres_grader: 10,
  snabb_vrid_rad_s: 3,
  snabb_slapp_rad_s: 0.85,
  rate_utjamning_s: 0,
  min_tecken_rad: 0.05,
  samordning: 0.42,
  bank_kp: 2.2,
  bank_kd: 0.9,
  da_max: 0.65
};

test('höger och vänster lutning ger motsatt bank', () => {
  const vanster = eulerStyrning({ alpha: 0, beta: 90, gamma: -25 }, noll, 0);
  const hoger = eulerStyrning({ alpha: 0, beta: 90, gamma: 25 }, noll, 0);
  assert.ok(vanster.roll > 0.3, vanster.roll);
  assert.ok(hoger.roll < -0.3, hoger.roll);
  assert.ok(Math.abs(vanster.roll + hoger.roll) < 1e-6);
});

test('zon 2 ger fullt skevroder åt höger när telefonen lutas åt höger', () => {
  const k = styrKommando(nyZon(), { roll: -0.9, rollRate: -1.2, pitch: 0 }, 0.016, Z, { spak_max_roll: 1 }, {});
  assert.equal(k.lage, 2);
  assert.ok(k.input.roll < 0);
  assert.equal(k.input.da, -1);
});
