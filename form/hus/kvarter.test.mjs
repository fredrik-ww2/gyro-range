import assert from "node:assert/strict";
import test from "node:test";
import { assignHouses, clusterRows, kvarterModel, placeAlongStreet } from "./kvarter.js";

function grid(columns, rows) {
  const regions = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      regions.push([
        [x / columns, y / rows],
        [(x + 1) / columns, y / rows],
        [(x + 1) / columns, (y + 1) / rows],
        [x / columns, (y + 1) / rows],
      ]);
    }
  }
  return regions;
}

test(`rader blir hus och rutor blir fasader`, () => {
  const plan = assignHouses(grid(3, 3), `auto`);
  assert.equal(plan.mode, `rad`);
  assert.equal(plan.houses.length, 3);
  assert.deepEqual(plan.houses[0].views.map(view => view.role), [`front`, `right`, `back`]);
  assert.equal(plan.houses[2].name, `Hus 3`);
});

test(`en enda rad blir ett hus per ruta längs gatan`, () => {
  const plan = assignHouses(grid(4, 1), `auto`);
  assert.equal(plan.mode, `ruta`);
  assert.equal(plan.houses.length, 4);
  assert.ok(plan.houses.every(house => house.views.length === 1 && house.views[0].role === `front`));
  assert.equal(assignHouses(grid(4, 1), `rad`).houses.length, 1);
  assert.equal(clusterRows(grid(2, 2)).length, 2);
});

test(`husen får egna tomter utan att stå på varandra`, () => {
  const layout = placeAlongStreet([
    { id: `a`, name: `Hus 1`, width: 10, depth: 8 },
    { id: `b`, name: `Hus 2`, width: 12, depth: 9 },
  ]);
  assert.equal(layout.hus.length, 2);
  assert.ok(layout.hus[1].tomt.x > layout.hus[0].tomt.x + layout.hus[0].tomt.bredd / 2);
  assert.equal(layout.gata.namn, `Gatan`);
  assert.ok(layout.gata.langd > layout.hus[1].tomt.x);
  const model = kvarterModel({ name: `Kvarteret`, folder: `Mina hus`, layout });
  assert.equal(model.source, `kvarter`);
  assert.equal(model.kvarter.hus[0].id, `a`);
  assert.equal(model.house, undefined);
});
