import assert from 'node:assert/strict';
import test from 'node:test';
import { handelse, iAppen } from './ios-brygga.js';

test('utan app händer ingenting', () => {
  delete globalThis.GyroRange;
  delete globalThis.ReactNativeWebView;
  assert.equal(iAppen(), false);
  assert.equal(handelse('vagn-kanon', { niva: 1 }), false);
});

test('appen får händelsen en gång', () => {
  const logg = [];
  globalThis.GyroRange = { handelse(namn, detalj) { logg.push([namn, detalj]); } };
  assert.equal(iAppen(), true);
  assert.equal(handelse('flyg-kulspruta', { niva: 1 }), true);
  assert.deepEqual(logg, [['flyg-kulspruta', { niva: 1 }]]);
  delete globalThis.GyroRange;
});

test('kontinuerlig händelse stryps, avstängning går fram', () => {
  const logg = [];
  globalThis.GyroRange = { handelse(namn, detalj) { logg.push(detalj.pa); } };
  const orig = performance.now.bind(performance);
  let t = 5000;
  performance.now = () => t;
  try {
    handelse('vagn-motor', { kontinuerlig: true, pa: true, niva: 0.2 });
    t += 40;
    handelse('vagn-motor', { kontinuerlig: true, pa: true, niva: 0.9 });
    t += 100;
    handelse('vagn-motor', { kontinuerlig: true, pa: true, niva: 0.5 });
    handelse('vagn-motor', { kontinuerlig: true, pa: false, niva: 0 });
    assert.deepEqual(logg, [true, true, false]);
  } finally {
    performance.now = orig;
    delete globalThis.GyroRange;
  }
});
