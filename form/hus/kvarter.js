// Ett kvarter: flera hus på tomter längs en gata, från en bild med vyer.

const FACADE_ORDER = [`front`, `right`, `back`, `left`];

function center(quad) {
  const x = quad.reduce((sum, point) => sum + point[0], 0) / quad.length;
  const y = quad.reduce((sum, point) => sum + point[1], 0) / quad.length;
  return { x, y };
}

export function clusterRows(regions) {
  const cells = regions.map((quad, index) => ({ index, quad, ...center(quad) }));
  const rows = [];
  for (const cell of [...cells].sort((a, b) => a.y - b.y || a.x - b.x)) {
    const row = rows.find(item => Math.abs(item.y - cell.y) < 0.12);
    if (row) {
      row.cells.push(cell);
      row.y = row.cells.reduce((sum, item) => sum + item.y, 0) / row.cells.length;
    } else rows.push({ y: cell.y, cells: [cell] });
  }
  for (const row of rows) row.cells.sort((a, b) => a.x - b.x);
  return rows.map(row => row.cells);
}

export function assignHouses(regions, mode = `auto`) {
  const rows = clusterRows(regions || []);
  const resolved = mode === `auto`
    ? (rows.length >= 2 && rows.every(row => row.length >= 2) ? `rad` : `ruta`)
    : mode === `rad` ? `rad` : `ruta`;
  if (resolved === `rad`) {
    return {
      mode: resolved,
      houses: rows.map((row, index) => ({
        name: `Hus ${index + 1}`,
        views: row.map((cell, view) => ({
          role: view < FACADE_ORDER.length ? FACADE_ORDER[view] : `skip`,
          quad: cell.quad,
          index: cell.index,
        })),
      })),
    };
  }
  const cells = rows.flat();
  return {
    mode: resolved,
    houses: cells.map((cell, index) => ({
      name: `Hus ${index + 1}`,
      views: [{ role: `front`, quad: cell.quad, index: cell.index }],
    })),
  };
}

function round(value) {
  return Math.round(value * 10) / 10;
}

export function placeAlongStreet(houses) {
  const gap = 5;
  let cursor = 0;
  const placed = (houses || []).map((house, index) => {
    const bredd = Math.max(6, Number(house.bredd || house.width) || 12);
    const djup = Math.max(6, Number(house.djup || house.depth) || 8);
    const tomtBredd = bredd + 4;
    const tomtDjup = djup + 6;
    const tomt = {
      index: index + 1,
      x: round(cursor + tomtBredd / 2),
      z: round(tomtDjup / 2 + 4),
      bredd: round(tomtBredd),
      djup: round(tomtDjup),
      rotation: 0,
    };
    cursor += tomtBredd + gap;
    return {
      id: house.id,
      namn: house.namn || house.name || `Hus ${index + 1}`,
      bredd: round(bredd),
      djup: round(djup),
      tomt,
    };
  });
  return {
    version: 1,
    gata: { namn: `Gatan`, langd: round(Math.max(0, cursor - (placed.length ? gap : 0))), bredd: 8 },
    hus: placed,
  };
}

export function kvarterModel({ id, name, folder, layout, glb }) {
  return {
    id: id || crypto.randomUUID(),
    name: name || `Kvarteret`,
    folder: folder || `Mina hus`,
    date: new Date().toISOString(),
    source: `kvarter`,
    stage: `complete`,
    glb: glb || new Uint8Array(),
    triangles: 0,
    recipe: { prompt: `Kvarter längs gatan`, quality: `balanced`, motion: `none`, motionPrompt: ``, effect: `none`, sound: `none`, seed: 1 },
    kvarter: layout,
  };
}
