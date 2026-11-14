import test from 'node:test';
import assert from 'node:assert/strict';
import { arIos, forberedTystLage, vakna, hallKoll, installeraIosLjud } from './ios-ljud.js';

test('tyst läge går att förbereda utan att kasta', () => {
  assert.equal(typeof arIos(), 'boolean');
  assert.doesNotThrow(() => forberedTystLage());
});

test('avbruten kontext väcks när fliken syns igen', async () => {
  const calls = [];
  const ctx = {
    state: 'interrupted',
    resume() { calls.push(this.state); this.state = 'running'; return Promise.resolve(); },
    addEventListener() {}
  };
  globalThis.document = { hidden: true, addEventListener() {}, createElement() { return { setAttribute() {}, play() { return Promise.resolve(); } }; } };
  hallKoll(ctx);
  assert.equal(await vakna(ctx), true);
  assert.equal(ctx.state, 'running');
  assert.equal(calls.length, 1);
});

test('första pointerup öppnar ljudet', () => {
  const lyssnare = {};
  globalThis.document = { hidden: false, addEventListener() {}, createElement() { return null; } };
  globalThis.addEventListener = (namn, fn) => { (lyssnare[namn] ||= []).push(fn); };
  let oppnat = 0;
  const ctx = { state: 'suspended', resume() { this.state = 'running'; return Promise.resolve(); }, addEventListener() {} };
  installeraIosLjud({ hamta: () => ctx, oppna: () => { oppnat++; } });
  assert.equal(typeof lyssnare.pointerup?.[0], 'function');
  assert.equal(typeof lyssnare.touchend?.[0], 'function');
  lyssnare.pointerup[0]();
  assert.equal(oppnat, 1);
  assert.equal(ctx.state, 'running');
});
