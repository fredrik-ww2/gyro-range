import assert from "node:assert/strict";
import test from "node:test";
import { HOUSE_TEXTURES } from "./texturer/katalog.js";
import { classifyGeometry, classifyName, classifySurface, worldUv } from "./ytor.js";

test(`vägg och tak är skilda val med förhandsbild`, () => {
  const walls = HOUSE_TEXTURES.filter(item => item.role === `wall`);
  const roofs = HOUSE_TEXTURES.filter(item => item.role === `roof`);
  assert.ok(walls.length >= 8);
  assert.deepEqual([...new Set(walls.map(item => item.group))].sort(), [`betong`, `puts`, `sten`, `tegel`, `trä`].sort());
  assert.deepEqual(roofs.map(item => item.group).sort(), [`halm`, `skiffer`, `tegelpannor`]);
  for (const item of HOUSE_TEXTURES) {
    assert.match(item.preview, /forhands\.webp$/);
    assert.ok(item.meters >= 1 && item.meters <= 3);
    assert.match(item.color, /farg\.webp$/);
    assert.match(item.normal, /normal\.webp$/);
    assert.match(item.surfaceMap, /yta\.webp$/);
  }
});

test(`fönster, dörr, glas, karm och lucka får inte väggtextur`, () => {
  for (const name of [`glass`, `window_photo`, `shutter`, `trim`, `wood`, `metal`, `foundation`, `glass_LOD0`, `collision_roof`, `house_LOD2`]) {
    assert.equal(classifyName(name), `keep`);
  }
  assert.equal(classifyName(`wall`), `wall`);
  assert.equal(classifyName(`surface_front`), `wall`);
  assert.equal(classifyName(`facade_left`), `wall`);
  assert.equal(classifyName(`roof`), `roof`);
  assert.equal(classifyName(`roof_LOD1`), `roof`);
  assert.equal(classifySurface(`glass`, new Float32Array(9), new Float32Array(9)), `keep`);
});

test(`okänd yta klassas efter normal och öppning`, () => {
  const wall = new Float32Array([0, 0, 0, 4, 0, 0, 4, 3, 0, 0, 3, 0]);
  const wallN = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
  assert.equal(classifyGeometry(wall, wallN), `wall`);
  const roof = new Float32Array([0, 3, 0, 4, 3, 0, 4, 4, 2, 0, 4, 2]);
  const roofN = new Float32Array([0, 0.8, 0.6, 0, 0.8, 0.6, 0, 0.8, 0.6, 0, 0.8, 0.6]);
  assert.equal(classifyGeometry(roof, roofN), `roof`);
  const window = new Float32Array([0, 1, 0, 0.8, 1, 0, 0.8, 2, 0.05, 0, 2, 0.05]);
  const windowN = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
  assert.equal(classifyGeometry(window, windowN), `keep`);
});

test(`UV följer meter så mönstret inte sträcks`, () => {
  const positions = new Float32Array([0, 0, 0, 4, 0, 0, 4, 2, 0]);
  const normals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]);
  const uvs = worldUv(positions, normals, 2);
  assert.equal(uvs[0], 0);
  assert.equal(uvs[2], 2);
  assert.equal(uvs[5], 1);
  const tall = worldUv(new Float32Array([0, 0, 0, 0, 4, 0, 2, 4, 0]), new Float32Array([1, 0, 0, 1, 0, 0, 1, 0, 0]), 2);
  assert.equal(uvs[2], tall[3]);
});
