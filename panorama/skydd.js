// Låga värn nära start och kulsprutenästen längre fram. Höjden är meter över marken.

export function skyddLista() {
  return [
    {id: 'sten-lag', x: 2.6, z: -3.5, sx: 2.5, sy: 0.55, sz: 0.46, farg: 0x7d7870},
    {id: 'sten-kna', x: 1.8, z: -7.4, sx: 2.3, sy: 0.96, sz: 0.5, farg: 0x6e6a64},
    {id: 'lada', x: 6.4, z: -6.2, sx: 1.15, sy: 0.9, sz: 0.85, farg: 0x6b5340},
    {id: 'lada-2', x: 7.3, z: -6.7, sx: 0.7, sy: 0.55, sz: 0.7, farg: 0x5c4634},
    {id: 'barrikad', x: 9.2, z: -12.5, sx: 2.6, sy: 1.05, sz: 0.55, farg: 0x5a5348},
    {id: 'mur-fram', x: -1.4, z: -20.5, sx: 3.1, sy: 0.98, sz: 0.48, farg: 0x7a756c},
    {id: 'lag-fram', x: 6.8, z: -18.5, sx: 2.4, sy: 0.52, sz: 0.42, farg: 0x6a6560},
    {id: 'mur-mitt', x: 3.6, z: -26, sx: 3.4, sy: 1.08, sz: 0.5, farg: 0x756f66},
    {id: 'hog-vanster', x: -12.4, z: -9.2, sx: 2.4, sy: 1.02, sz: 0.5, farg: 0x6d675e}
  ];
}

export const NARA_SACK = [
  {x: -1.4, z: -6.1},
  {x: 4.8, z: -8.6},
  {x: -12.6, z: -16.5},
  {x: 1.6, z: -23.5},
  {x: 9.4, z: -29.5},
  {x: -3.2, z: -32.6, mg: true},
  {x: 8.2, z: -36.8, mg: true}
];

export const GEVAR = [
  {namn: 'tysk', x: 0.4, z: -28.5, yaw: 0.05, beteende: 'vakt', zon: 'nara', vapen: 'gevar'},
  {namn: 'tysk', x: -8.2, z: -36.5, yaw: 0.25, beteende: 'kik', zon: 'nara', vapen: 'gevar'},
  {namn: 'usa', x: 5.8, z: -39.5, yaw: -0.1, beteende: 'vakt', zon: 'nara', vapen: 'gevar'}
];

function lada(x, y, z, sx, sy, sz, extra) {
  return {
    ...extra,
    x, y, z, sx, sy, sz,
    minX: x - sx / 2, maxX: x + sx / 2,
    minY: y - sy / 2, maxY: y + sy / 2,
    minZ: z - sz / 2, maxZ: z + sz / 2
  };
}

export function skyddLador(lista, markY = 0) {
  const y0 = Number(markY) || 0;
  return (lista || skyddLista()).map(p => lada(
    p.x, y0 + p.sy / 2, p.z, p.sx, p.sy, p.sz,
    {id: p.id, roll: 'skydd', farg: p.farg}
  ));
}

export function sackLador(platser, markY = 0) {
  const y0 = Number(markY) || 0;
  const hojd = 1.12;
  return (platser || []).map(p => lada(
    p.x, y0 + hojd / 2, p.z, 3.05, hojd, 0.72,
    {id: 'sack', roll: 'skydd', farg: 0x6d5c3e}
  ));
}

export function mgSkyttar(platser) {
  return (platser || []).filter(p => p.mg).map(p => ({
    namn: 'tysk',
    x: p.x,
    z: p.z - 1.55,
    yaw: 0,
    beteende: 'vakt',
    zon: 'nara',
    vapen: 'mg42'
  }));
}
