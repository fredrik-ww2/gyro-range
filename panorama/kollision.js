// Axel-linjiga lådor. Spelaren är en cirkel i markplanet och stoppas bara av lådor som når kroppens höjd.

export function traffLada(ox, oy, oz, dx, dy, dz, box, maxT = 80) {
  let tmin = 0;
  let tmax = maxT;
  const axlar = [
    [ox, dx, box.minX, box.maxX],
    [oy, dy, box.minY, box.maxY],
    [oz, dz, box.minZ, box.maxZ]
  ];
  for (const [o, d, mn, mx] of axlar) {
    if (Math.abs(d) < 1e-8) {
      if (o < mn || o > mx) return null;
      continue;
    }
    let t1 = (mn - o) / d;
    let t2 = (mx - o) / d;
    if (t1 > t2) { const s = t1; t1 = t2; t2 = s; }
    if (t1 > tmin) tmin = t1;
    if (t2 < tmax) tmax = t2;
    if (tmax < tmin) return null;
  }
  if (tmax < 0) return null;
  return tmin;
}

export function forstaTraff(ox, oy, oz, dx, dy, dz, boxar, maxT = 80) {
  let best = null;
  for (const box of boxar) {
    const t = traffLada(ox, oy, oz, dx, dy, dz, box, maxT);
    if (t == null || t > maxT) continue;
    if (!best || t < best.t) best = {t, box};
  }
  return best;
}

function nar(x, z, box, r) {
  const nx = Math.max(box.minX, Math.min(x, box.maxX));
  const nz = Math.max(box.minZ, Math.min(z, box.maxZ));
  const dx = x - nx;
  const dz = z - nz;
  return dx * dx + dz * dz < r * r;
}

export function skapaKollision(boxar) {
  const lista = Array.isArray(boxar) ? boxar : [];

  function blockerar(x, z, r, y0, y1) {
    const radie = Math.max(0.05, r || 0.3);
    const lo = Math.min(y0, y1);
    const hi = Math.max(y0, y1);
    for (const box of lista) {
      if (box.roll === 'golv' || box.roll === 'tak') continue;
      if (box.maxY < lo || box.minY > hi) continue;
      if (nar(x, z, box, radie)) return box;
    }
    return null;
  }

  function flytta(x, z, nx, nz, r, y0, y1) {
    if (!blockerar(nx, nz, r, y0, y1)) return {x: nx, z: nz, stopp: false};
    if (!blockerar(nx, z, r, y0, y1)) return {x: nx, z, stopp: true};
    if (!blockerar(x, nz, r, y0, y1)) return {x, z: nz, stopp: true};
    return {x, z, stopp: true};
  }

  function ga(x, z, nx, nz, r, y0, y1) {
    const dist = Math.hypot(nx - x, nz - z);
    const antal = Math.max(1, Math.ceil(dist / 0.12));
    let cx = x;
    let cz = z;
    let stopp = false;
    for (let i = 1; i <= antal; i++) {
      const tx = x + (nx - x) * (i / antal);
      const tz = z + (nz - z) * (i / antal);
      const steg = flytta(cx, cz, tx, tz, r, y0, y1);
      cx = steg.x;
      cz = steg.z;
      if (steg.stopp) { stopp = true; break; }
    }
    return {x: cx, z: cz, stopp};
  }

  return {blockerar, flytta, ga, get boxar() { return lista; }};
}

export function sjalvtest() {
  const fel = [];
  const krav = (namn, ok) => { if (!ok) fel.push(namn); };
  const vagg = {minX: -1, maxX: 1, minY: 0, maxY: 2, minZ: -0.2, maxZ: 0.2, roll: 'vägg'};
  const k = skapaKollision([vagg]);
  krav('fri mark släpper igenom', !k.blockerar(0, 2, 0.3, 0, 1.7));
  krav('väggen stoppar', !!k.blockerar(0, 0, 0.3, 0, 1.7));
  const glid = k.flytta(0, 1, 0, 0.1, 0.3, 0, 1.7);
  krav('glider inte igenom', glid.z > 0.2 && glid.stopp);
  const tak = {minX: -2, maxX: 2, minY: 3, maxY: 3.4, minZ: -2, maxZ: 2, roll: 'tak'};
  const hog = skapaKollision([tak]);
  krav('tak över huvudet hindrar inte gång', !hog.blockerar(0, 0, 0.3, 0, 1.7));
  const traff = traffLada(0, 0.5, 2, 0, 0, -1, vagg, 10);
  krav('stråle träffar lådan', traff != null && traff > 1 && traff < 2.2);
  const miss = traffLada(0, 2.4, 2, 0, 0, -1, vagg, 10);
  krav('stråle över lådan missar', miss == null);
  return fel;
}
