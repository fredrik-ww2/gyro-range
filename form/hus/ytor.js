// Klassar husytor och räknar UV i meter, utan att blanda vägg och tak.

const KEEP = new Set([`glass`, `window_photo`, `window`, `shutter`, `trim`, `wood`, `metal`, `foundation`, `solar`, `house`]);

export function baseName(name) {
  return String(name || ``).replace(/_LOD[0-2]$/, ``);
}

export function classifyName(name) {
  const base = baseName(name);
  if (!base || base.startsWith(`collision`)) return `keep`;
  if (KEEP.has(base) || /fönster|fonster|dörr|dorr|karm|lucka/.test(base)) return `keep`;
  if (base === `roof` || base.startsWith(`roof`)) return `roof`;
  if (base === `wall` || base.startsWith(`surface_`) || base === `photo` || base.startsWith(`facade_`)) return `wall`;
  return null;
}

export function classifyGeometry(positions, normals) {
  const count = positions.length / 3;
  if (!count) return `keep`;
  let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  let ax = 0, ay = 0, az = 0;
  for (let i = 0; i < count; i++) {
    const x = positions[i * 3], y = positions[i * 3 + 1], z = positions[i * 3 + 2];
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    ax += Math.abs(normals?.[i * 3] || 0);
    ay += Math.abs(normals?.[i * 3 + 1] || 0);
    az += Math.abs(normals?.[i * 3 + 2] || 0);
  }
  ax /= count; ay /= count; az /= count;
  const sizeX = maxX - minX, sizeY = maxY - minY, sizeZ = maxZ - minZ;
  const thin = Math.min(sizeX, sizeY, sizeZ) < 0.22 && Math.max(sizeX, sizeZ) < 3.2 && sizeY < 2.6 && sizeY > 0.25;
  if (thin) return `keep`;
  if (ay >= ax && ay >= az && ay > 0.45) return `roof`;
  if ((ax > 0.55 || az > 0.55) && sizeY > 0.6) return `wall`;
  return `keep`;
}

export function classifySurface(name, positions, normals) {
  return classifyName(name) ?? (positions ? classifyGeometry(positions, normals) : `keep`);
}

export function worldUv(positions, normals, meters) {
  const scale = meters > 0 ? meters : 2;
  const uvs = new Float32Array(positions.length / 3 * 2);
  for (let i = 0; i < positions.length / 3; i++) {
    const x = positions[i * 3], y = positions[i * 3 + 1], z = positions[i * 3 + 2];
    const nx = Math.abs(normals?.[i * 3] || 0);
    const ny = Math.abs(normals?.[i * 3 + 1] || 0);
    const nz = Math.abs(normals?.[i * 3 + 2] || 0);
    const u = ny >= nx && ny >= nz ? x : nx >= nz ? z : x;
    const v = ny >= nx && ny >= nz ? z : y;
    uvs[i * 2] = u / scale;
    uvs[i * 2 + 1] = v / scale;
  }
  return uvs;
}
