import assert from "node:assert/strict";
import test from "node:test";
import { activeGroup, clampTone, lookActive, menuForSurface, neutralLook, normalizeLook, toneRgb, toneRole } from "./farg.js";
import { captureBases } from "./texturval.js";

test(`menyn visar bara texturer för den valda ytan`, () => {
  const walls = menuForSurface(`wall`);
  const roofs = menuForSurface(`roof`);
  assert.deepEqual(walls.map(group => group.label), [`Puts`, `Tegel`, `Sten`, `Trä`, `Betong`]);
  assert.deepEqual(roofs.map(group => group.id), [`skiffer`, `tegelpannor`, `halm`]);
  assert.equal(menuForSurface(`detail`).length, 0);
  assert.ok(walls.every(group => group.textures.every(item => item.role === `wall` && item.preview.endsWith(`forhands.webp`))));
  assert.equal(activeGroup(`roof`, `halm`).label, `Halm`);
  assert.equal(activeGroup(`wall`, `finns-inte`).id, `puts`);
});

test(`färgton och färgstyrka håller sig inom reglagen`, () => {
  assert.deepEqual(clampTone({ hue: 400, saturation: 9 }), { hue: 180, saturation: 2 });
  assert.deepEqual(clampTone({}), { hue: 0, saturation: 1 });
  const gray = toneRgb(180, 100, 100, 0, 0);
  assert.ok(Math.abs(gray[0] - gray[1]) <= 1 && Math.abs(gray[1] - gray[2]) <= 1);
  const red = toneRgb(200, 40, 40, 0, 1);
  const turned = toneRgb(200, 40, 40, 120, 1);
  assert.ok(turned[1] > red[1]);
  const look = normalizeLook({ wall: { textureId: `rott-tegel`, hue: 12, saturation: 0.4 }, bases: { meshes: [{ role: `wall`, color: `#aabbcc` }] } });
  assert.equal(look.wall.textureId, `rott-tegel`);
  assert.equal(look.roof.saturation, 1);
  assert.equal(look.bases.meshes[0].color, `#aabbcc`);
  assert.equal(lookActive(neutralLook()), false);
  assert.equal(lookActive(look), true);
});

test(`glas, fönster och dörr får ingen färgton`, () => {
  const wall = new Float32Array([0, 0, 0, 4, 0, 0, 4, 3, 0, 0, 3, 0]);
  const wallN = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
  assert.equal(toneRole(`glass`, wall, wallN), null);
  assert.equal(toneRole(`window_photo`), null);
  assert.equal(toneRole(`fönster`), null);
  assert.equal(toneRole(`dörr`), null);
  assert.equal(toneRole(`trim`), `detail`);
  assert.equal(toneRole(`shutter`), `detail`);
  assert.equal(toneRole(`wood`), `detail`);
  assert.equal(toneRole(`wall`), `wall`);
  assert.equal(toneRole(`roof`), `roof`);
  const root = {
    traverse(fn) {
      fn({ isMesh: true, name: `glass`, material: { color: { getHexString: () => `ffffff` } }, userData: {} });
      fn({ isMesh: true, name: `trim`, material: { color: { getHexString: () => `e9e3d5` } }, userData: {} });
      fn({ isMesh: true, name: `wall`, material: { color: { getHexString: () => `d3c7b1` } }, userData: {} });
    },
  };
  assert.deepEqual(captureBases(root).meshes.map(item => item.role), [`wall`, `detail`]);
});
