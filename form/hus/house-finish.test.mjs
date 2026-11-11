import assert from "node:assert/strict";
import test from "node:test";
import {
  FACADES,
  STUDIO_VERSION,
  bakeAoColors,
  buildMobilePlan,
  cloneHouseSpec,
  cloneName,
  cycleFacade,
  ensureRoughness,
  expectedRoughness,
  formatMobileReport,
} from "./house-finish.js";

const spec = {
  version: 1,
  style: `swedish`,
  width: 12,
  depth: 8,
  floors: 2,
  floorHeight: 2.8,
  roof: `gable`,
  roofRise: 3,
  roofOverhang: 0.42,
  facade: `wood`,
  wallColor: `#863e32`,
  roofColor: `#564b43`,
  trimColor: `#e9e3d5`,
  roofMaterial: `tiles`,
  windows: 4,
  shutters: false,
  chimney: true,
  balcony: false,
  terrace: false,
  garage: false,
  solar: false,
  dormers: false,
  seed: 19,
  detail: `mobile`,
};

test(`studio version is visible text`, () => {
  assert.equal(STUDIO_VERSION, `HUSVERKSTAD · 8`);
  assert.deepEqual(FACADES, [`stone`, `wood`, `brick`, `plaster`]);
});

test(`facade cycle keeps the four styles and returns to the start`, () => {
  let facade = `stone`;
  const seen = [];
  for (let step = 0; step < 4; step++) {
    facade = cycleFacade(facade);
    seen.push(facade);
  }
  assert.deepEqual(seen, [`wood`, `brick`, `plaster`, `stone`]);
  assert.equal(cycleFacade(`unknown`), `stone`);
});

test(`clone changes seed, size, windows, door and shades without touching the original`, () => {
  const frozen = Object.freeze({ ...spec });
  const copy = cloneHouseSpec(frozen, () => 0.42);
  assert.equal(frozen.seed, 19);
  assert.equal(frozen.width, 12);
  assert.equal(frozen.wallColor, `#863e32`);
  assert.notEqual(copy.seed, frozen.seed);
  assert.equal(copy.style, frozen.style);
  assert.equal(copy.facade, frozen.facade);
  assert.equal(copy.roof, frozen.roof);
  assert.equal(copy.roofMaterial, frozen.roofMaterial);
  assert.equal(copy.floors, frozen.floors);
  assert.ok(copy.width >= 4 && copy.width <= 40);
  assert.ok(copy.depth >= 4 && copy.depth <= 30);
  assert.ok(copy.width !== frozen.width || copy.depth !== frozen.depth);
  assert.notEqual(copy.windows, frozen.windows);
  assert.notEqual(copy.doorShift, 0);
  assert.ok(Math.abs(copy.doorShift) <= 2);
  assert.ok(Math.abs(copy.windowPhase) <= 0.35 && copy.windowPhase !== 0);
  assert.notEqual(copy.wallColor, frozen.wallColor);
  assert.notEqual(copy.roofColor, frozen.roofColor);
  assert.match(copy.wallColor, /^#[0-9a-f]{6}$/);
  assert.match(copy.roofColor, /^#[0-9a-f]{6}$/);
  assert.equal(cloneName(`Villa Strömsö`), `Villa Strömsö · kopia`);
  assert.equal(cloneName(`Villa Strömsö · kopia`), `Villa Strömsö · kopia 2`);
});

test(`roughness already on a material is kept`, () => {
  const wall = { roughness: 0.92, metalness: 0 };
  assert.equal(ensureRoughness(wall, `wall`), `ok`);
  assert.equal(wall.roughness, 0.92);
  const glass = { roughness: 0.2, metalness: 0.12 };
  assert.equal(ensureRoughness(glass, `glass`), `ok`);
  assert.equal(expectedRoughness(`roof`), 0.8);
  const broken = { roughness: Number.NaN, metalness: Number.NaN };
  assert.equal(ensureRoughness(broken, `glass`), `repaired`);
  assert.equal(broken.roughness, 0.2);
  assert.equal(broken.metalness, 0);
  assert.equal(ensureRoughness({ color: `#fff` }, `wall`), `unlit`);
});

test(`vertex ambient occlusion darkens the ground and covered vertices`, () => {
  const open = new Float32Array([0, 5, 0, 0.2, 5, 0, 0, 5, 0.2]);
  const openNormals = new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0]);
  const openColors = bakeAoColors(open, null, openNormals);
  const ground = new Float32Array([0, 0, 0, 0.2, 0, 0, 0, 0, 0.2]);
  const groundColors = bakeAoColors(ground, null, openNormals);
  assert.ok(groundColors[0] < openColors[0]);

  const positions = new Float32Array([
    0, 1, 0, 0.1, 1, 0, 0, 1, 0.1,
    -2, 1.5, -2, 2, 1.5, -2, 0, 1.5, 2,
  ]);
  const indices = new Uint32Array([0, 1, 2, 3, 4, 5]);
  const normals = new Float32Array([
    0, 1, 0, 0, 1, 0, 0, 1, 0,
    0, -1, 0, 0, -1, 0, 0, -1, 0,
  ]);
  const covered = bakeAoColors(positions, indices, normals);
  assert.ok(covered[0] < 1);
  assert.ok(covered[0] < openColors[0]);
});

test(`mobile plan merges materials, builds three LODs and keeps collision`, () => {
  const triangle = (x, name) => ({
    name,
    positions: new Float32Array([x, 0, 0, x + 1, 0, 0, x, 1, 0, x, 0, 1]),
    normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0]),
    uvs: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0]),
    indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
  });
  const plan = buildMobilePlan(
    [triangle(0, `wall`), triangle(3, `wall`), triangle(0, `roof`)],
    { colliders: [{ id: `main-body`, shape: `box`, center: [1, 1, 0], halfExtents: [2, 1, 1] }] },
  );
  assert.equal(plan.lod0.length, 2);
  assert.equal(plan.drawCalls, 2);
  assert.deepEqual(plan.lod0.map(part => part.name).sort(), [`roof_LOD0`, `wall_LOD0`]);
  assert.ok(plan.lod0.every(part => part.colors && part.colors.length === part.positions.length));
  assert.equal(plan.lod1.length, 2);
  assert.ok(plan.lod1.every(part => part.name.endsWith(`_LOD1`)));
  assert.equal(plan.lod2.length, 1);
  assert.equal(plan.lod2[0].name, `house_LOD2`);
  assert.equal(plan.lodTriangles[2], 12);
  assert.ok(plan.lodTriangles[1] <= plan.lodTriangles[0]);
  assert.equal(plan.collision.length, 1);
  assert.equal(plan.collision[0].name, `collision_main-body`);
  assert.ok(plan.collision[0].indices.length >= 3);
  const report = formatMobileReport({ lodTriangles: plan.lodTriangles, drawCalls: plan.drawCalls, fileBytes: 1536 });
  assert.match(report.lines[0], /Klart för mobilen/);
  assert.match(report.lines[1], /LOD0: .+ trianglar/);
  assert.match(report.lines[2], /LOD1: .+ trianglar/);
  assert.match(report.lines[3], /LOD2: 12 trianglar/);
  assert.match(report.lines[4], /Ritade anrop: 2/);
  assert.match(report.lines[5], /Filstorlek:/);
  assert.match(report.lines[6], /Kollision ingår/);
});

test(`mobile plan refuses a house without collision`, () => {
  assert.throws(
    () => buildMobilePlan([{
      name: `wall`,
      positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
      indices: new Uint32Array([0, 1, 2]),
    }], { colliders: [] }),
    /Kollisionen saknas/,
  );
});
