// Husverkstad 8. Automatic finish, facade swap, mobile LODs and clones.
// Metres, Y up. Ambient occlusion is baked into vertex colors (no extra texture).

export const STUDIO_VERSION = `HUSVERKSTAD · 8`;

export const FACADES = [`stone`, `wood`, `brick`, `plaster`];

const ROUGHNESS = {
  wall: 0.92,
  roofTiles: 0.8,
  roofMetal: 0.62,
  wood: 0.92,
  trim: 0.76,
  glass: 0.2,
  metal: 0.45,
  foundation: 0.98,
  shutter: 0.78,
  solar: 0.16,
  photo: 0.9,
};

export function cycleFacade(current) {
  const index = FACADES.indexOf(current);
  return FACADES[(index + 1) % FACADES.length];
}

export function expectedRoughness(meshName) {
  const name = String(meshName || ``).replace(/_LOD[0-2]$/, ``);
  if (name === `roof`) return ROUGHNESS.roofTiles;
  if (name === `glass`) return ROUGHNESS.glass;
  if (name === `metal` || name === `solar`) return name === `solar` ? ROUGHNESS.solar : ROUGHNESS.metal;
  if (name === `trim`) return ROUGHNESS.trim;
  if (name === `foundation`) return ROUGHNESS.foundation;
  if (name === `shutter`) return ROUGHNESS.shutter;
  if (name === `wood`) return ROUGHNESS.wood;
  if (name.startsWith(`photo`) || name.startsWith(`facade_`) || name.startsWith(`window_photo`) || name.startsWith(`surface_`)) return ROUGHNESS.photo;
  return ROUGHNESS.wall;
}

// Leaves a sensible roughness untouched. Repairs only missing or impossible values.
export function ensureRoughness(material, meshName) {
  if (!material || typeof material.roughness !== `number`) return `unlit`;
  if (Number.isFinite(material.roughness) && material.roughness >= 0.04 && material.roughness <= 1) return `ok`;
  material.roughness = expectedRoughness(meshName);
  if (typeof material.metalness === `number` && !Number.isFinite(material.metalness)) material.metalness = 0;
  return `repaired`;
}

export function applyFinishToRoot(root, api) {
  let meshes = 0;
  root.traverse(object => {
    if (!api.isMesh(object) || !object.geometry) return;
    const geometry = object.geometry;
    const position = geometry.getAttribute(`position`);
    if (!position) return;
    const normal = geometry.getAttribute(`normal`);
    const index = geometry.getIndex?.() ?? geometry.index;
    const colors = bakeAoColors(position.array, index ? index.array : null, normal ? normal.array : null);
    geometry.setAttribute(`color`, api.createAttribute(colors, 3));
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material) continue;
      material.vertexColors = true;
      ensureRoughness(material, object.name);
    }
    meshes += 1;
  });
  return { meshes, ambientOcclusion: `vertex-colors` };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function hexToRgb(hex) {
  const value = String(hex || ``).replace(`#`, ``);
  return [0, 1, 2].map(index => parseInt(value.slice(index * 2, index * 2 + 2), 16));
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const light = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: light };
  const delta = max - min;
  const sat = light > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;
  if (max === r) hue = (g - b) / delta + (g < b ? 6 : 0);
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  return { h: hue * 60, s: sat, l: light };
}

function hueToRgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslToHex(h, s, l) {
  const hue = ((h % 360) + 360) % 360 / 360;
  let r;
  let g;
  let b;
  if (s === 0) r = g = b = l;
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgb(p, q, hue + 1 / 3);
    g = hueToRgb(p, q, hue);
    b = hueToRgb(p, q, hue - 1 / 3);
  }
  return `#` + [r, g, b].map(channel => Math.round(clamp(channel, 0, 1) * 255).toString(16).padStart(2, `0`)).join(``);
}

function shiftPalette(hex, lightDelta, hueDelta) {
  const [r, g, b] = hexToRgb(hex);
  if ([r, g, b].some(channel => !Number.isFinite(channel))) return hex;
  const hsl = rgbToHsl(r, g, b);
  return hslToHex(hsl.h + hueDelta, hsl.s, clamp(hsl.l + lightDelta, 0.14, 0.86));
}

function roundHalf(value) {
  return Math.round(value * 2) / 2;
}

export function cloneName(name) {
  const clean = String(name || `Hus`).trim() || `Hus`;
  const next = /\s· kopia(?: \d+)?$/.test(clean) ? `${clean} 2` : `${clean} · kopia`;
  return next.slice(0, 100).trim();
}

export function cloneHouseSpec(spec, random = Math.random) {
  let seed = Math.floor(random() * 1e9);
  if (seed === spec.seed) seed = (seed + 17) % 1e9;
  const rng = mulberry32(seed || 1);
  const next = { ...spec, seed };
  let width = roundHalf(clamp(spec.width * (0.94 + rng() * 0.12), 4, 40));
  let depth = roundHalf(clamp(spec.depth * (0.94 + rng() * 0.12), 4, 30));
  if (width === spec.width) width = roundHalf(clamp(spec.width + (rng() < 0.5 ? -0.5 : 0.5), 4, 40));
  if (depth === spec.depth) depth = roundHalf(clamp(spec.depth + (rng() < 0.5 ? -0.5 : 0.5), 4, 30));
  next.width = width;
  next.depth = depth;
  const windowDelta = rng() < 0.5 ? -1 : 1;
  next.windows = clamp(Math.round(spec.windows) + windowDelta, 1, 10);
  next.windowPhase = clamp((rng() - 0.5) * 0.5, -0.35, 0.35);
  if (Math.abs(next.windowPhase) < 0.08) next.windowPhase = next.windowPhase < 0 ? -0.12 : 0.12;
  const span = Math.max(0.4, Math.min(1.6, next.width * 0.12));
  next.doorShift = clamp((rng() - 0.5) * span * 2, -2, 2);
  if (Math.abs(next.doorShift) < 0.3) next.doorShift = next.doorShift < 0 ? -0.45 : 0.45;
  let wallLight = (rng() - 0.5) * 0.1;
  if (Math.abs(wallLight) < 0.04) wallLight = wallLight < 0 ? -0.05 : 0.05;
  let roofLight = (rng() - 0.5) * 0.12;
  if (Math.abs(roofLight) < 0.04) roofLight = roofLight < 0 ? -0.05 : 0.05;
  next.wallColor = shiftPalette(spec.wallColor, wallLight, (rng() - 0.5) * 8);
  next.roofColor = shiftPalette(spec.roofColor, roofLight, (rng() - 0.5) * 10);
  return next;
}

function triIndex(indices, triangle, corner, vertexCount) {
  return indices ? indices[triangle * 3 + corner] : triangle * 3 + corner;
}

export function bakeAoColors(positions, indices, normals) {
  const vertexCount = positions.length / 3;
  const colors = new Float32Array(vertexCount * 3);
  if (!vertexCount) return colors;
  const triangleCount = indices ? indices.length / 3 : Math.floor(vertexCount / 3);
  const triangles = [];
  for (let triangle = 0; triangle < triangleCount; triangle++) {
    const a = triIndex(indices, triangle, 0, vertexCount);
    const b = triIndex(indices, triangle, 1, vertexCount);
    const c = triIndex(indices, triangle, 2, vertexCount);
    if (a === b || b === c || a === c) continue;
    const ax = positions[a * 3], ay = positions[a * 3 + 1], az = positions[a * 3 + 2];
    const bx = positions[b * 3], by = positions[b * 3 + 1], bz = positions[b * 3 + 2];
    const cx = positions[c * 3], cy = positions[c * 3 + 1], cz = positions[c * 3 + 2];
    const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
    const e2x = cx - ax, e2y = cy - ay, e2z = cz - az;
    let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
    const length = Math.hypot(nx, ny, nz);
    if (length < 1e-8) continue;
    nx /= length;
    ny /= length;
    nz /= length;
    triangles.push({
      ax, ay, az, bx, by, bz, cx, cy, cz, e1x, e1y, e1z, e2x, e2y, e2z,
      minX: Math.min(ax, bx, cx), minY: Math.min(ay, by, cy), minZ: Math.min(az, bz, cz),
      maxX: Math.max(ax, bx, cx), maxY: Math.max(ay, by, cy), maxZ: Math.max(az, bz, cz),
    });
  }
  const cell = 0.7;
  const grid = new Map();
  const key = (x, y, z) => `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
  triangles.forEach((triangle, index) => {
    const x0 = Math.floor(triangle.minX / cell), x1 = Math.floor(triangle.maxX / cell);
    const y0 = Math.floor(triangle.minY / cell), y1 = Math.floor(triangle.maxY / cell);
    const z0 = Math.floor(triangle.minZ / cell), z1 = Math.floor(triangle.maxZ / cell);
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
      const id = `${x},${y},${z}`;
      const list = grid.get(id);
      if (list) list.push(index);
      else grid.set(id, [index]);
    }
  });
  const useRays = vertexCount <= 40000 && triangles.length > 0;
  const samples = [[0, 1, 0], [0.55, 0.72, 0.22], [-0.42, 0.74, 0.36], [0.16, 0.62, -0.68], [-0.48, 0.58, -0.38]];
  for (let vertex = 0; vertex < vertexCount; vertex++) {
    const x = positions[vertex * 3], y = positions[vertex * 3 + 1], z = positions[vertex * 3 + 2];
    let nx = normals ? normals[vertex * 3] : 0;
    let ny = normals ? normals[vertex * 3 + 1] : 1;
    let nz = normals ? normals[vertex * 3 + 2] : 0;
    const normalLength = Math.hypot(nx, ny, nz) || 1;
    nx /= normalLength;
    ny /= normalLength;
    nz /= normalLength;
    let hits = 0;
    if (useRays) {
      const tangent = Math.abs(ny) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      let tx = tangent[1] * nz - tangent[2] * ny;
      let ty = tangent[2] * nx - tangent[0] * nz;
      let tz = tangent[0] * ny - tangent[1] * nx;
      const tLength = Math.hypot(tx, ty, tz) || 1;
      tx /= tLength;
      ty /= tLength;
      tz /= tLength;
      const bx = ny * tz - nz * ty, by = nz * tx - nx * tz, bz = nx * ty - ny * tx;
      const gx = Math.floor(x / cell), gy = Math.floor(y / cell), gz = Math.floor(z / cell);
      const nearby = [];
      for (let ix = gx - 1; ix <= gx + 1; ix++) for (let iy = gy - 1; iy <= gy + 1; iy++) for (let iz = gz - 1; iz <= gz + 1; iz++) {
        const list = grid.get(`${ix},${iy},${iz}`);
        if (list) nearby.push(...list);
      }
      const unique = nearby.length > 64 ? nearby.slice(0, 64) : nearby;
      for (const sample of samples) {
        let dx = tx * sample[0] + nx * sample[1] + bx * sample[2];
        let dy = ty * sample[0] + ny * sample[1] + by * sample[2];
        let dz = tz * sample[0] + nz * sample[1] + bz * sample[2];
        const length = Math.hypot(dx, dy, dz) || 1;
        dx /= length;
        dy /= length;
        dz /= length;
        const ox = x + nx * 0.05, oy = y + ny * 0.05, oz = z + nz * 0.05;
        for (const triangleIndex of unique) {
          if (rayHit(ox, oy, oz, dx, dy, dz, 1.15, triangles[triangleIndex])) {
            hits += 1;
            break;
          }
        }
      }
    }
    const occlusion = hits / samples.length * 0.62;
    const ground = y < 0.4 ? (0.4 - y) / 0.4 * 0.28 : 0;
    const underside = ny < 0 ? -ny * 0.22 : 0;
    const ao = clamp(1 - occlusion - ground - underside, 0.45, 1);
    colors[vertex * 3] = colors[vertex * 3 + 1] = colors[vertex * 3 + 2] = ao;
  }
  return colors;
}

function rayHit(ox, oy, oz, dx, dy, dz, maxDistance, triangle) {
  const px = dy * triangle.e2z - dz * triangle.e2y;
  const py = dz * triangle.e2x - dx * triangle.e2z;
  const pz = dx * triangle.e2y - dy * triangle.e2x;
  const det = triangle.e1x * px + triangle.e1y * py + triangle.e1z * pz;
  if (Math.abs(det) < 1e-7) return false;
  const inv = 1 / det;
  const tx = ox - triangle.ax, ty = oy - triangle.ay, tz = oz - triangle.az;
  const u = (tx * px + ty * py + tz * pz) * inv;
  if (u < 0 || u > 1) return false;
  const qx = ty * triangle.e1z - tz * triangle.e1y;
  const qy = tz * triangle.e1x - tx * triangle.e1z;
  const qz = tx * triangle.e1y - ty * triangle.e1x;
  const v = (dx * qx + dy * qy + dz * qz) * inv;
  if (v < 0 || u + v > 1) return false;
  const distance = (triangle.e2x * qx + triangle.e2y * qy + triangle.e2z * qz) * inv;
  return distance > 0.03 && distance < maxDistance;
}

function indexed(mesh) {
  const positions = mesh.positions;
  const vertexCount = positions.length / 3;
  let indices = mesh.indices;
  if (!indices) {
    indices = new Uint32Array(vertexCount);
    for (let i = 0; i < vertexCount; i++) indices[i] = i;
  }
  return { ...mesh, indices };
}

function flatNormals(positions, indices) {
  const normals = new Float32Array(positions.length);
  for (let triangle = 0; triangle < indices.length; triangle += 3) {
    const a = indices[triangle], b = indices[triangle + 1], c = indices[triangle + 2];
    const ax = positions[a * 3], ay = positions[a * 3 + 1], az = positions[a * 3 + 2];
    const e1x = positions[b * 3] - ax, e1y = positions[b * 3 + 1] - ay, e1z = positions[b * 3 + 2] - az;
    const e2x = positions[c * 3] - ax, e2y = positions[c * 3 + 1] - ay, e2z = positions[c * 3 + 2] - az;
    let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
    const length = Math.hypot(nx, ny, nz) || 1;
    nx /= length;
    ny /= length;
    nz /= length;
    for (const vertex of [a, b, c]) {
      normals[vertex * 3] += nx;
      normals[vertex * 3 + 1] += ny;
      normals[vertex * 3 + 2] += nz;
    }
  }
  for (let vertex = 0; vertex < normals.length; vertex += 3) {
    const length = Math.hypot(normals[vertex], normals[vertex + 1], normals[vertex + 2]) || 1;
    normals[vertex] /= length;
    normals[vertex + 1] /= length;
    normals[vertex + 2] /= length;
  }
  return normals;
}

function withNormals(mesh) {
  const part = indexed(mesh);
  if (part.normals && part.normals.length === part.positions.length) return part;
  return { ...part, normals: flatNormals(part.positions, part.indices) };
}

function mergeParts(parts) {
  const ready = parts.map(withNormals);
  let vertexTotal = 0;
  let indexTotal = 0;
  for (const part of ready) {
    vertexTotal += part.positions.length / 3;
    indexTotal += part.indices.length;
  }
  const positions = new Float32Array(vertexTotal * 3);
  const normals = new Float32Array(vertexTotal * 3);
  const uvs = new Float32Array(vertexTotal * 2);
  const indices = new Uint32Array(indexTotal);
  let vertexOffset = 0;
  let indexOffset = 0;
  for (const part of ready) {
    positions.set(part.positions, vertexOffset * 3);
    normals.set(part.normals, vertexOffset * 3);
    const count = part.positions.length / 3;
    if (part.uvs && part.uvs.length === count * 2) uvs.set(part.uvs, vertexOffset * 2);
    for (let i = 0; i < part.indices.length; i++) indices[indexOffset + i] = part.indices[i] + vertexOffset;
    vertexOffset += count;
    indexOffset += part.indices.length;
  }
  return { positions, normals, uvs, indices };
}

function clusterPart(part, cell) {
  const map = new Map();
  const positions = [];
  const normals = [];
  const uvs = [];
  const colors = [];
  const remap = new Int32Array(part.positions.length / 3);
  for (let vertex = 0; vertex < remap.length; vertex++) {
    const x = part.positions[vertex * 3], y = part.positions[vertex * 3 + 1], z = part.positions[vertex * 3 + 2];
    const nx = part.normals[vertex * 3], ny = part.normals[vertex * 3 + 1], nz = part.normals[vertex * 3 + 2];
    const bucket = (value, limit) => value > limit ? 1 : value < -limit ? -1 : 0;
    const id = `${Math.round(x / cell)},${Math.round(y / cell)},${Math.round(z / cell)},${bucket(nx, 0.35)},${bucket(ny, 0.35)},${bucket(nz, 0.35)}`;
    let slot = map.get(id);
    if (slot === undefined) {
      slot = positions.length / 3;
      map.set(id, slot);
      positions.push(x, y, z);
      normals.push(nx, ny, nz);
      uvs.push(part.uvs[vertex * 2] || 0, part.uvs[vertex * 2 + 1] || 0);
      colors.push(part.colors[vertex * 3] || 1, part.colors[vertex * 3 + 1] || 1, part.colors[vertex * 3 + 2] || 1);
    } else {
      positions[slot * 3] += x;
      positions[slot * 3 + 1] += y;
      positions[slot * 3 + 2] += z;
      normals[slot * 3] += nx;
      normals[slot * 3 + 1] += ny;
      normals[slot * 3 + 2] += nz;
      uvs[slot * 2] += part.uvs[vertex * 2] || 0;
      uvs[slot * 2 + 1] += part.uvs[vertex * 2 + 1] || 0;
      colors[slot * 3] += part.colors[vertex * 3] || 1;
      colors[slot * 3 + 1] += part.colors[vertex * 3 + 1] || 1;
      colors[slot * 3 + 2] += part.colors[vertex * 3 + 2] || 1;
    }
    remap[vertex] = slot;
  }
  const counts = new Float32Array(positions.length / 3);
  for (const slot of remap) counts[slot] += 1;
  for (let slot = 0; slot < counts.length; slot++) {
    const count = counts[slot] || 1;
    positions[slot * 3] /= count;
    positions[slot * 3 + 1] /= count;
    positions[slot * 3 + 2] /= count;
    const length = Math.hypot(normals[slot * 3], normals[slot * 3 + 1], normals[slot * 3 + 2]) || 1;
    normals[slot * 3] /= length;
    normals[slot * 3 + 1] /= length;
    normals[slot * 3 + 2] /= length;
    uvs[slot * 2] /= count;
    uvs[slot * 2 + 1] /= count;
    colors[slot * 3] /= count;
    colors[slot * 3 + 1] /= count;
    colors[slot * 3 + 2] /= count;
  }
  const indexList = [];
  for (let triangle = 0; triangle < part.indices.length; triangle += 3) {
    const a = remap[part.indices[triangle]];
    const b = remap[part.indices[triangle + 1]];
    const c = remap[part.indices[triangle + 2]];
    if (a !== b && b !== c && a !== c) indexList.push(a, b, c);
  }
  return {
    positions: Float32Array.from(positions),
    normals: Float32Array.from(normals),
    uvs: Float32Array.from(uvs),
    colors: Float32Array.from(colors),
    indices: Uint32Array.from(indexList),
  };
}

export function boxGeometry(min, max, color = 0.86) {
  let [x0, y0, z0] = min;
  let [x1, y1, z1] = max;
  if (x1 - x0 < 0.05) { x0 -= 0.05; x1 += 0.05; }
  if (y1 - y0 < 0.05) { y0 -= 0.05; y1 += 0.05; }
  if (z1 - z0 < 0.05) { z0 -= 0.05; z1 += 0.05; }
  const faces = [
    [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]],
    [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]],
    [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]],
    [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]],
    [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0]],
    [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]],
  ];
  const positions = new Float32Array(6 * 4 * 3);
  const normals = new Float32Array(6 * 4 * 3);
  const uvs = new Float32Array(6 * 4 * 2);
  const colors = new Float32Array(6 * 4 * 3);
  const indices = new Uint32Array(6 * 6);
  faces.forEach((face, faceIndex) => {
    const normal = face[4];
    for (let corner = 0; corner < 4; corner++) {
      const vertex = faceIndex * 4 + corner;
      positions.set(face[corner], vertex * 3);
      normals.set(normal, vertex * 3);
      uvs[vertex * 2] = corner === 1 || corner === 2 ? 1 : 0;
      uvs[vertex * 2 + 1] = corner > 1 ? 1 : 0;
      colors[vertex * 3] = colors[vertex * 3 + 1] = colors[vertex * 3 + 2] = color;
    }
    const start = faceIndex * 4;
    indices.set([start, start + 1, start + 2, start, start + 2, start + 3], faceIndex * 6);
  });
  return { positions, normals, uvs, colors, indices };
}

function boundsOf(parts) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const part of parts) {
    for (let i = 0; i < part.positions.length; i += 3) {
      for (let axis = 0; axis < 3; axis++) {
        min[axis] = Math.min(min[axis], part.positions[i + axis]);
        max[axis] = Math.max(max[axis], part.positions[i + axis]);
      }
    }
  }
  return { min, max };
}

function triangleCount(part) {
  return part.indices.length / 3;
}

function collisionPart(collider) {
  if (collider.shape === `box`) {
    const [cx, cy, cz] = collider.center;
    const [hx, hy, hz] = collider.halfExtents;
    const box = boxGeometry([cx - hx, cy - hy, cz - hz], [cx + hx, cy + hy, cz + hz], 1);
    delete box.colors;
    return { name: `collision_${collider.id}`, ...box };
  }
  const positions = Float32Array.from(collider.vertices);
  const indices = Uint32Array.from(collider.indices);
  const normals = flatNormals(positions, indices);
  const uvs = new Float32Array(positions.length / 3 * 2);
  return { name: `collision_${collider.id}`, positions, normals, uvs, indices };
}

export function buildMobilePlan(meshes, gameAsset) {
  const groups = new Map();
  for (const mesh of meshes) {
    const name = String(mesh.name || `del`).replace(/_LOD[0-2]$/, ``);
    if (name.startsWith(`collision_`)) continue;
    const list = groups.get(name) || [];
    list.push(mesh);
    groups.set(name, list);
  }
  if (!groups.size) throw new Error(`Huset har ingen geometri att förbereda.`);
  const lod0 = [];
  for (const [name, list] of groups) {
    const merged = mergeParts(list);
    const colors = bakeAoColors(merged.positions, merged.indices, merged.normals);
    lod0.push({ name: `${name}_LOD0`, materialName: name, ...merged, colors });
  }
  const lod1 = lod0.map(part => {
    let simplified = clusterPart(part, 0.35);
    if (triangleCount(simplified) > triangleCount(part) * 0.85) simplified = clusterPart(part, 0.6);
    if (simplified.indices.length < 3) simplified = { ...boxGeometry(...Object.values(boundsOf([part])), 0.8), name: part.name };
    return { ...simplified, name: part.name.replace(/_LOD0$/, `_LOD1`), materialName: part.materialName };
  });
  const box = boxGeometry(...Object.values(boundsOf(lod0)), 0.84);
  const lod2 = [{ name: `house_LOD2`, materialName: `house`, ...box }];
  const collision = Array.isArray(gameAsset?.colliders) ? gameAsset.colliders.map(collisionPart) : [];
  if (!collision.length) throw new Error(`Kollisionen saknas.`);
  return {
    lod0,
    lod1,
    lod2,
    collision,
    drawCalls: lod0.length,
    lodTriangles: [lod0, lod1, lod2].map(level => level.reduce((sum, part) => sum + triangleCount(part), 0)),
  };
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${Math.round(bytes).toLocaleString(`sv-SE`)} byte`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toLocaleString(`sv-SE`, { maximumFractionDigits: 1, minimumFractionDigits: 1 })} kB`;
  return `${(bytes / (1024 * 1024)).toLocaleString(`sv-SE`, { maximumFractionDigits: 1, minimumFractionDigits: 1 })} MB`;
}

export function formatMobileReport({ lodTriangles, drawCalls, fileBytes }) {
  const triangles = value => Math.round(value).toLocaleString(`sv-SE`);
  return {
    lines: [
      `Klart för mobilen.`,
      `LOD0: ${triangles(lodTriangles[0])} trianglar`,
      `LOD1: ${triangles(lodTriangles[1])} trianglar`,
      `LOD2: ${triangles(lodTriangles[2])} trianglar`,
      `Ritade anrop: ${triangles(drawCalls)}`,
      `Filstorlek: ${formatBytes(fileBytes)}`,
      `Kollision ingår.`,
    ],
  };
}
