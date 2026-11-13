const IDS = ['vanligt', 'kar98k', 'springfield', 'enfield'];

export const FALLBACK = {
  prick: {standard: 6, min: 3, max: 56},
  zoomMax: 12,
  fovMin: 4,
  traff: {kroppsskott: 3, huvudSkottDodar: true, huvudRadie: 0.15},
  blod: {pool: 180, kropp: 16, huvud: 42, sar: 40},
  terrang: {
    dimmaNara: 160,
    dimmaFjarr: 540,
    kameraFar: 700,
    raycast: 560,
    mark: 920,
    segment: 128,
    form: {flat: 24, mjuk: 70, vag: 22, a: 8.5, b: 3.6, c: 10, d: 4.5}
  },
  vapen: [
    {id: 'vanligt', namn: 'Vanligt', under: '1×', forstoring: 1, sikte: 'prick', retikel: 'prick', ljud: 'vanligt'},
    {id: 'kar98k', namn: 'Kar 98k', under: '4×', forstoring: 4, sikte: 'kikare', retikel: 'zf39', ljud: 'kar98k'},
    {id: 'springfield', namn: 'Springfield', under: '6×', forstoring: 6, sikte: 'kikare', retikel: 'm1903', ljud: 'springfield'},
    {id: 'enfield', namn: 'Enfield', under: '10×', forstoring: 10, sikte: 'kikare', retikel: 'mil', ljud: 'enfield'}
  ],
  gang: {fart: 1.55, dodzon: 0.1, kanslighet: 2.4, svang: 1, svangFart: 1.15, grans: 400},
  soldater: {
    zoner: {nara: [15, 35], medel: [55, 120], langt: [150, 320]},
    platser: [
      {namn: 'usa', x: -8, z: -22, yaw: 0.35, beteende: 'vakt', zon: 'nara'},
      {namn: 'tysk', x: 14, z: -24, yaw: 2.4, beteende: 'patrull', zon: 'nara'},
      {namn: 'usa', x: -16, z: 20, yaw: 1.2, beteende: 'kik', zon: 'nara'},
      {namn: 'tysk', x: 5, z: -82, yaw: 0.15, beteende: 'vakt', zon: 'medel'},
      {namn: 'usa', x: -72, z: 4, yaw: 1.6, beteende: 'patrull', zon: 'medel'},
      {namn: 'tysk', x: 6, z: 96, yaw: -2.9, beteende: 'kik', zon: 'medel'},
      {namn: 'usa', x: 0, z: -210, yaw: 0.05, beteende: 'vakt', zon: 'langt'},
      {namn: 'tysk', x: 0, z: 236, yaw: 3.1, beteende: 'patrull', zon: 'langt'},
      {namn: 'usa', x: -196, z: 0, yaw: 1.57, beteende: 'kik', zon: 'langt'}
    ],
    extra: [
      {namn: 'tysk', x: 20, z: 14, yaw: -0.8, beteende: 'patrull', zon: 'nara'},
      {namn: 'usa', x: -4, z: 78, yaw: 2.7, beteende: 'vakt', zon: 'medel'},
      {namn: 'tysk', x: 8, z: 268, yaw: 3.0, beteende: 'kik', zon: 'langt'}
    ]
  }
};

function tal(v, bas, lo, hi) {
  const n = Number(v);
  if (!Number.isFinite(n)) return bas;
  return Math.min(hi, Math.max(lo, n));
}

function text(v, bas) {
  return typeof v === 'string' && v.trim() ? v.trim() : bas;
}

function normalVapen(lista) {
  const ut = [];
  for (const id of IDS) {
    const bas = FALLBACK.vapen.find(v => v.id === id);
    const raw = Array.isArray(lista) ? lista.find(v => v && v.id === id) : null;
    const kalla = raw || bas;
    ut.push({
      id,
      namn: text(kalla.namn, bas.namn),
      under: text(kalla.under, bas.under),
      forstoring: id === 'vanligt' ? 1 : tal(kalla.forstoring, bas.forstoring, 1, 12),
      sikte: id === 'vanligt' ? 'prick' : 'kikare',
      retikel: id === 'vanligt' ? 'prick' : text(kalla.retikel, bas.retikel),
      ljud: text(kalla.ljud, bas.ljud)
    });
  }
  return ut;
}

function normalPlats(raw) {
  if (!raw || (raw.namn !== 'usa' && raw.namn !== 'tysk')) return null;
  const beteende = raw.beteende === 'patrull' || raw.beteende === 'kik' ? raw.beteende : 'vakt';
  const zon = raw.zon === 'nara' || raw.zon === 'medel' || raw.zon === 'langt' ? raw.zon : 'nara';
  return {
    namn: raw.namn,
    x: tal(raw.x, 0, -400, 400),
    z: tal(raw.z, -20, -400, 400),
    yaw: Number.isFinite(+raw.yaw) ? +raw.yaw : 0,
    beteende,
    zon
  };
}

function normalLista(raw, bas) {
  if (!Array.isArray(raw)) return bas.map(p => ({...p}));
  const ut = raw.map(normalPlats).filter(Boolean);
  return ut.length ? ut : bas.map(p => ({...p}));
}

function normalGang(raw) {
  const g = raw && typeof raw === 'object' ? raw : {};
  const bas = FALLBACK.gang;
  return {
    fart: tal(g.fart, bas.fart, 0.3, 6),
    dodzon: tal(g.dodzon, bas.dodzon, 0, 0.6),
    kanslighet: tal(g.kanslighet, bas.kanslighet, 0.2, 8),
    svang: tal(g.svang, bas.svang, 0.2, 4),
    svangFart: tal(g.svangFart, bas.svangFart, 0.2, 4),
    grans: tal(g.grans, bas.grans, 20, 700)
  };
}

function normalZon(raw, bas) {
  if (!Array.isArray(raw) || raw.length < 2) return bas.slice();
  const a = tal(raw[0], bas[0], 1, 400);
  const b = tal(raw[1], bas[1], 1, 400);
  return a <= b ? [a, b] : [b, a];
}

export function normalConfig(raw) {
  const t = raw && typeof raw === 'object' ? raw : {};
  const tr = t.terrang && typeof t.terrang === 'object' ? t.terrang : {};
  const form = tr.form && typeof tr.form === 'object' ? tr.form : {};
  const basForm = FALLBACK.terrang.form;
  const sold = t.soldater && typeof t.soldater === 'object' ? t.soldater : {};
  const zoner = sold.zoner && typeof sold.zoner === 'object' ? sold.zoner : {};
  const traff = t.traff && typeof t.traff === 'object' ? t.traff : {};
  const blod = t.blod && typeof t.blod === 'object' ? t.blod : {};
  const prick = t.prick && typeof t.prick === 'object' ? t.prick : {};
  const prickMin = tal(prick.min, FALLBACK.prick.min, 1, 20);
  const prickMax = Math.max(prickMin, tal(prick.max, FALLBACK.prick.max, prickMin, 80));
  return {
    prick: {
      standard: tal(prick.standard, FALLBACK.prick.standard, prickMin, prickMax),
      min: prickMin,
      max: prickMax
    },
    zoomMax: tal(t.zoomMax, FALLBACK.zoomMax, 6, 16),
    fovMin: tal(t.fovMin, FALLBACK.fovMin, 3, 20),
    traff: {
      kroppsskott: Math.round(tal(traff.kroppsskott, FALLBACK.traff.kroppsskott, 1, 8)),
      huvudSkottDodar: traff.huvudSkottDodar !== false,
      huvudRadie: tal(traff.huvudRadie, FALLBACK.traff.huvudRadie, 0.08, 0.28)
    },
    blod: {
      pool: Math.round(tal(blod.pool, FALLBACK.blod.pool, 24, 400)),
      kropp: Math.round(tal(blod.kropp, FALLBACK.blod.kropp, 4, 80)),
      huvud: Math.round(tal(blod.huvud, FALLBACK.blod.huvud, 8, 120)),
      sar: Math.round(tal(blod.sar, FALLBACK.blod.sar, 4, 80))
    },
    terrang: {
      dimmaNara: tal(tr.dimmaNara, FALLBACK.terrang.dimmaNara, 40, 400),
      dimmaFjarr: tal(tr.dimmaFjarr, FALLBACK.terrang.dimmaFjarr, 200, 1200),
      kameraFar: tal(tr.kameraFar, FALLBACK.terrang.kameraFar, 650, 2000),
      raycast: tal(tr.raycast, FALLBACK.terrang.raycast, 500, 2000),
      mark: tal(tr.mark, FALLBACK.terrang.mark, 400, 1600),
      segment: Math.round(tal(tr.segment, FALLBACK.terrang.segment, 48, 200)),
      form: {
        flat: tal(form.flat, basForm.flat, 0, 80),
        mjuk: tal(form.mjuk, basForm.mjuk, 10, 160),
        vag: tal(form.vag, basForm.vag, 8, 80),
        a: tal(form.a, basForm.a, 0, 30),
        b: tal(form.b, basForm.b, 0, 20),
        c: tal(form.c, basForm.c, 0, 30),
        d: tal(form.d, basForm.d, 0, 20)
      }
    },
    gang: normalGang(t.gang),
    vapen: normalVapen(t.vapen),
    soldater: {
      zoner: {
        nara: normalZon(zoner.nara, FALLBACK.soldater.zoner.nara),
        medel: normalZon(zoner.medel, FALLBACK.soldater.zoner.medel),
        langt: normalZon(zoner.langt, FALLBACK.soldater.zoner.langt)
      },
      platser: normalLista(sold.platser, FALLBACK.soldater.platser),
      extra: normalLista(sold.extra, FALLBACK.soldater.extra)
    }
  };
}

export async function laddaConfig() {
  try {
    const url = new URL('./data/config.json', import.meta.url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    return normalConfig(await res.json());
  } catch {
    return normalConfig(FALLBACK);
  }
}
