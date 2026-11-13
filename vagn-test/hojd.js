// Bilinjär höjd ur heightfield_5m.f32 (Villers-Bocage, 401×401, 5 m).
// Rad 0 är norr (z = −1000), kolumn 0 är väster (x = −1000). Ingen raycast mot GLB-kjolen.

export const HF_N = 401;
export const HF_STEG = 5;
export const HF_UT = 1000;

export function hojdY(x, z, hf, n = HF_N, spacing = HF_STEG, extent = HF_UT) {
  if (!hf || hf.length < n * n) return 0;
  const col = (x + extent) / spacing;
  const row = (z + extent) / spacing;
  const c0 = Math.max(0, Math.min(n - 2, Math.floor(col)));
  const r0 = Math.max(0, Math.min(n - 2, Math.floor(row)));
  const tx = Math.min(1, Math.max(0, col - c0));
  const ty = Math.min(1, Math.max(0, row - r0));
  const vid = (r, c) => hf[r * n + c];
  const y00 = vid(r0, c0);
  const y10 = vid(r0, c0 + 1);
  const y01 = vid(r0 + 1, c0);
  const y11 = vid(r0 + 1, c0 + 1);
  return y00 * (1 - tx) * (1 - ty) + y10 * tx * (1 - ty) + y01 * (1 - tx) * ty + y11 * tx * ty;
}

// Normalen lutar mot uppförsbacken. y-komponenten är alltid positiv.
export function hojdNormal(x, z, hf, e = 2.5, n = HF_N, spacing = HF_STEG, extent = HF_UT) {
  const hL = hojdY(x - e, z, hf, n, spacing, extent);
  const hR = hojdY(x + e, z, hf, n, spacing, extent);
  const hN = hojdY(x, z - e, hf, n, spacing, extent);
  const hS = hojdY(x, z + e, hf, n, spacing, extent);
  const dx = (hR - hL) / (2 * e);
  const dz = (hS - hN) / (2 * e);
  const nx = -dx;
  const ny = 1;
  const nz = -dz;
  const len = Math.hypot(nx, ny, nz) || 1;
  return {x: nx / len, y: ny / len, z: nz / len, mark: hojdY(x, z, hf, n, spacing, extent)};
}

// pitch > 0 = nosen upp. roll > 0 = höger sida upp. yaw 0 pekar mot −z.
export function skrovLutning(x, z, yaw, hf, wb = 2.6, spar = 1.35, n = HF_N, spacing = HF_STEG, extent = HF_UT) {
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);
  const y = hojdY(x, z, hf, n, spacing, extent);
  const hF = hojdY(x + fx * wb, z + fz * wb, hf, n, spacing, extent);
  const hB = hojdY(x - fx * wb, z - fz * wb, hf, n, spacing, extent);
  const hR = hojdY(x + rx * spar, z + rz * spar, hf, n, spacing, extent);
  const hL = hojdY(x - rx * spar, z - rz * spar, hf, n, spacing, extent);
  return {
    y,
    pitch: Math.atan2(hF - hB, wb * 2),
    roll: Math.atan2(hR - hL, spar * 2)
  };
}

export async function laddHojd(url) {
  const svar = await fetch(url);
  if (!svar.ok) throw new Error('höjdfält ' + svar.status);
  const hf = new Float32Array(await svar.arrayBuffer());
  if (hf.length !== HF_N * HF_N) throw new Error('höjdfält ' + hf.length);
  return hf;
}

export function sjalvtest() {
  const fel = [];
  const krav = (namn, ok) => { if (!ok) fel.push(namn); };
  const n = 3;
  const steg = 5;
  const ut = 5;
  const hf = new Float32Array([
    0, 0, 0,
    0, 10, 20,
    0, 0, 40
  ]);
  krav('nodträff i mitten', hojdY(0, 0, hf, n, steg, ut) === 10);
  krav('nodträff i hörnet', hojdY(-5, -5, hf, n, steg, ut) === 0);
  krav('bilinjär mitt emellan 10 och 20', Math.abs(hojdY(2.5, 0, hf, n, steg, ut) - 15) < 1e-6);
  krav('bilinjär i rutan', Math.abs(hojdY(2.5, 2.5, hf, n, steg, ut) - 17.5) < 1e-6);
  krav('utanför kartan kläms till kanten', hojdY(80, -80, hf, n, steg, ut) === hojdY(5, -5, hf, n, steg, ut));
  krav('tomt fält ger noll', hojdY(0, 0, null) === 0);

  const backe = new Float32Array(n * n);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) backe[r * n + c] = c * 4;
  const normal = hojdNormal(0, 0, backe, 2.5, n, steg, ut);
  krav('östbacke lutar normalen mot väster', normal.x < -0.2 && normal.y > 0.5 && Math.abs(normal.z) < 1e-6);
  const upp = skrovLutning(0, 0, -Math.PI / 2, backe, 2.5, 1.25, n, steg, ut);
  krav('nosen upp när framåt är uppför', upp.pitch > 0.2 && Math.abs(upp.roll) < 0.05);
  const sid = skrovLutning(0, 0, 0, backe, 2.5, 1.25, n, steg, ut);
  krav('höger sida upp när backen stiger åt höger', sid.roll > 0.2 && Math.abs(sid.pitch) < 0.05);
  return fel;
}
