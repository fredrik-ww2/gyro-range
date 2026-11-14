import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
    assert.equal(box.gauges.vertical, undefined);
    for (const id of ['altitude', 'speed', 'attitude', 'radar']) {
      assert.ok(box.gauges[id] && box.gauges[id].cy > box.windshieldEnd, id);
    }
    assert.ok(box.panel && box.panel.height > 0 && box.panel.height < 0.28);
  }
  assert.equal(config.weapons.doubleTapMs, undefined);
  assert.ok(config.weapons.gunInterval > 0 && config.weapons.gunInterval < 0.2);
  assert.equal(config.weapons.rocketAmmo, 12);
  assert.ok(config.layout.gun.size >= 0.1 && config.layout.gun.size <= 0.22);
  assert.ok(config.cockpit.stick.gripY < 0.9);
  assert.ok(config.cockpit.lookDownDeg < 16);
});

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function layoutRects(box, W, H, inset = { top: 0, right: 0, bottom: 0, left: 0 }) {
  const placeBox = (b) => {
    let left = b.left * W, top = b.top * H, w = b.width * W, h = b.height * H;
    left = Math.max(left, inset.left);
    if (top + h > H - inset.bottom) top = Math.max(inset.top, H - inset.bottom - h);
    return { l: left, t: top, r: left + w, b: top + h };
  };
  const placeCenter = (p, size) => {
    const s = size * W;
    const cx = clamp(p.cx * W, inset.left + s / 2 + 4, W - inset.right - s / 2 - 4);
    const cy = clamp(p.cy * H, inset.top + s / 2 + 4, H - inset.bottom - s / 2 - 4);
    return { l: cx - s / 2, t: cy - s / 2, r: cx + s / 2, b: cy + s / 2 };
  };
  const sGun = config.layout.gun.size * Math.min(W, H);
  const collective = placeBox(box.collective);
  let x = box.fire.cx * W - sGun / 2, y = box.fire.cy * H - sGun / 2;
  x = clamp(x, inset.left, W - inset.right - sGun);
  y = clamp(y, inset.top, H - inset.bottom - sGun);
  if (collective.b - collective.t > 20 && y + sGun > collective.t - 8) y = Math.max(inset.top, collective.t - sGun - 8);
  const rects = {
    gun: { l: x, t: y, r: x + sGun, b: y + sGun },
    collective,
    cyclic: placeBox(box.cyclic),
    pedalLeft: placeBox(box.pedalLeft),
    pedalRight: placeBox(box.pedalRight),
    aim: placeCenter(box.aimPad, box.aimPad.size),
    rocket: placeCenter(box.rocket, box.rocket.size)
  };
  for (const [id, pos] of Object.entries(box.gauges)) rects[id] = placeCenter(pos, box.gaugeSize);
  return rects;
}

function overlaps(a, b, gap = 4) {
  return a.l < b.r - gap && a.r > b.l + gap && a.t < b.b - gap && a.b > b.t + gap;
}

test('phone layouts keep the panel, sticks and buttons apart', () => {
  const names = ['gun', 'collective', 'cyclic', 'pedalLeft', 'pedalRight', 'aim', 'rocket', 'altitude', 'speed', 'attitude', 'radar'];
  const cases = [
    ['portrait', 390, 844, { top: 0, right: 0, bottom: 0, left: 0 }],
    ['portrait', 390, 844, { top: 47, right: 0, bottom: 34, left: 0 }],
    ['landscape', 844, 390, { top: 0, right: 0, bottom: 0, left: 0 }]
  ];
  for (const [mode, W, H, inset] of cases) {
    const rects = layoutRects(config.layout[mode], W, H, inset);
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        assert.equal(overlaps(rects[names[i]], rects[names[j]]), false, `${mode} ${W}x${H} inset ${inset.bottom}: ${names[i]} overlaps ${names[j]}`);
      }
    }
    for (const id of ['altitude', 'attitude', 'speed', 'radar']) {
      const g = rects[id];
      assert.ok(g.r - g.l >= 58, `${mode} ${id} readable`);
      assert.ok(g.t > 90, `${mode} ${id} below the top buttons`);
    }
  }
  const phone = layoutRects(config.layout.portrait, 390, 844);
  assert.ok(phone.collective.b - phone.collective.t >= 170);
  assert.ok(phone.cyclic.r - phone.cyclic.l >= 90 && phone.cyclic.b - phone.cyclic.t >= 80);
  const panel = config.layout.portrait.panel;
  const panelRect = {
    l: panel.left * 390,
    t: panel.top * 844,
    r: (panel.left + panel.width) * 390,
    b: (panel.top + panel.height) * 844
  };
  for (const id of ['altitude', 'attitude', 'speed', 'radar']) {
    const g = phone[id];
    assert.ok(panelRect.l <= g.l + 2 && panelRect.t <= g.t + 2 && panelRect.r >= g.r - 2 && panelRect.b >= g.b - 2, id);
  }
});

test('radar gauge still plots targets inside 700 m with course and armor', () => {
  const src = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
  assert.match(src, /function drawRadarGauge/);
  assert.match(src, /\/700\*R/);
  assert.match(src, /PANSAR/);
  assert.match(src, /letters=\['N','O','S','V'\]/);
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
