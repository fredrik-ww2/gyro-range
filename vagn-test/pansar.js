// Träffzon, anslagsvinkel, rikoschett, overmatch och genomslag.
// Siffrorna kommer från pansar_data.js, som är lyft ur vagn_pansarregler.json.

import {REGLER} from './pansar_data.js?v=5';

export {REGLER};

const KOPPL = {
  tiger_i: {
    mantel: 'mantel',
    torn_front: 'torn_front',
    torn_sida: 'torn_sida',
    torn_bak: 'torn_bak',
    torn_tak: 'torn_tak',
    skrov_tak: 'skrov_tak',
    front: 'skrov_front_overbyggnad',
    glacis: 'skrov_glacis_kort',
    nos: 'skrov_nos',
    skrov_sida: 'skrov_sida_overbyggnad',
    sida_nedre: 'skrov_sida_nedre',
    bak: 'skrov_bak'
  },
  sherman_m4_75: {
    mantel: 'mantel',
    torn_front: 'torn_front',
    torn_sida: 'torn_sida',
    // Underlaget saknar torn_bak. Närmaste dokumenterade plåt är tornsidan.
    torn_bak: 'torn_sida',
    torn_tak: 'tak',
    skrov_tak: 'tak',
    front: 'skrov_front_ovre',
    glacis: 'skrov_front_ovre',
    nos: 'skrov_nos',
    skrov_sida: 'skrov_sida',
    sida_nedre: 'skrov_sida',
    bak: 'skrov_bak'
  },
  sherman_m4a3_76w: {
    mantel: 'mantel',
    torn_front: 'torn_front',
    torn_sida: 'torn_sida',
    torn_bak: 'torn_bak',
    torn_tak: 'torn_tak',
    skrov_tak: 'skrov_tak',
    front: 'skrov_front_ovre',
    glacis: 'skrov_front_ovre',
    nos: 'skrov_nos',
    skrov_sida: 'skrov_sida',
    sida_nedre: 'skrov_sida',
    bak: 'skrov_bak'
  }
};

const ETIKETT = {
  mantel: 'mantel',
  torn_front: 'tornfront',
  torn_sida: 'tornsida',
  torn_bak: 'tornbak',
  torn_tak: 'tak',
  skrov_tak: 'tak',
  front: 'front',
  glacis: 'glacis',
  nos: 'nos',
  skrov_sida: 'sida',
  sida_nedre: 'sida',
  bak: 'bak',
  band: 'band'
};

export const VAGN_LISTA = ['sherman_m4_75', 'sherman_m4a3_76w', 'tiger_i'];

export function standardRegler() {
  return {
    heMotPansar: !!REGLER.strombrytare.he_mot_pansar,
    skadaUtan: !!REGLER.strombrytare.skada_utan_genomslag,
    rikoschett: REGLER.strombrytare.rikoschett !== false
  };
}

export function siktenFor(vagnId) {
  return REGLER.sikten[vagnId] || REGLER.sikten.sherman_m4_75;
}

export function sikteFor(vagnId, sikteId) {
  const lista = siktenFor(vagnId);
  return lista.find(s => s.id === sikteId) || lista[0];
}

// nx/nz är −1..1 från mitten (+z framåt). ny är 0 vid banden och 1 i taket.
export function klassFranLokal(nx, ny, nz) {
  if (ny < 0.2) return 'band';
  if (ny > 0.9) return nz >= 0 ? 'torn_tak' : 'skrov_tak';
  const torn = ny >= 0.56;
  const ax = Math.abs(nx);
  const az = Math.abs(nz);
  if (torn) {
    if (nz > 0.35 && ax < 0.45 && az >= ax) return 'mantel';
    if (az >= ax) return nz > 0 ? 'torn_front' : 'torn_bak';
    return 'torn_sida';
  }
  if (az >= ax) {
    if (nz > 0) {
      if (ny < 0.38) return 'nos';
      if (ny < 0.5) return 'glacis';
      return 'front';
    }
    return 'bak';
  }
  return ny < 0.38 ? 'sida_nedre' : 'skrov_sida';
}

export function platNormal(klass, lutningDeg, sida = 1) {
  const b = (lutningDeg || 0) * Math.PI / 180;
  const s = Math.sin(b);
  const c = Math.cos(b);
  const ho = sida >= 0 ? 1 : -1;
  if (klass === 'torn_bak' || klass === 'bak') return {x: 0, y: s, z: -c};
  if (klass === 'torn_sida' || klass === 'skrov_sida' || klass === 'sida_nedre') return {x: ho * c, y: s, z: 0};
  if (klass === 'torn_tak' || klass === 'skrov_tak') return {x: 0, y: 1, z: 0};
  return {x: 0, y: s, z: c};
}

export function anslagsVinkel(skott, normal) {
  const dot = -((skott?.x || 0) * normal.x + (skott?.y || 0) * normal.y + (skott?.z || 0) * normal.z);
  const c = Math.min(1, Math.max(0, dot));
  return Math.acos(c) * 180 / Math.PI;
}

export function interpolera(kurva, avstand) {
  const keys = Object.keys(kurva).map(Number).sort((a, b) => a - b);
  if (!keys.length) return 0;
  const d = Math.max(0, +avstand || 0);
  if (d <= keys[0]) return kurva[keys[0]];
  const sist = keys[keys.length - 1];
  if (d >= sist) return kurva[sist];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (d >= a && d <= b) {
      const t = (d - a) / (b - a);
      return kurva[a] * (1 - t) + kurva[b] * t;
    }
  }
  return kurva[sist];
}

export function faktor(familj, vinkel) {
  const tab = REGLER.faktorer[familj] || REGLER.faktorer.APCBC;
  const keys = Object.keys(tab).map(Number).sort((a, b) => a - b);
  const v = Math.max(0, +vinkel || 0);
  if (v <= keys[0]) return tab[keys[0]];
  const sist = keys[keys.length - 1];
  if (v >= sist) return tab[sist];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (v >= a && v <= b) {
      const t = (v - a) / (b - a);
      return tab[a] * (1 - t) + tab[b] * t;
    }
  }
  return tab[sist];
}

export function effektivFaktor(familj, vinkel, kaliber, mm) {
  const f = faktor(familj, vinkel);
  const om = REGLER.overmatch;
  if (mm > 0 && kaliber / mm >= om.kvot && vinkel > om.vinkel) {
    return Math.max(f, om.konstant * Math.cos(vinkel * Math.PI / 180));
  }
  return f;
}

function zonPost(mal, klass) {
  const kop = KOPPL[mal] || KOPPL.tiger_i;
  const nyckel = kop[klass];
  if (!nyckel) return null;
  const z = REGLER.vagnar[mal]?.zoner?.[nyckel];
  if (!z) return null;
  return {nyckel, mm: z.mm, lutning: z.lutning};
}

function textFor(slag, klass, avstand) {
  const m = Math.max(0, Math.round(avstand));
  const namn = ETIKETT[klass] || klass;
  if (klass === 'band') return 'Bandträff';
  if (slag === 'genomslag') return 'Genomslag ' + namn + ' · ' + m + ' m';
  if (slag === 'rikoschett') return 'Rikoschett mot ' + namn + ' · ' + m + ' m';
  if (slag === 'spricka') return 'Spricka ' + namn + ' · ' + m + ' m';
  if (slag === 'sprang') return 'Spräng mot ' + namn + ' · ' + m + ' m';
  return 'Ingen genomslag · ' + namn + ' · ' + m + ' m';
}

export function bedomPlat(opts) {
  const klass = opts.klass || 'front';
  const mm = +opts.mm || 0;
  const lutning = +opts.lutning || 0;
  const avstand = Math.max(0, +opts.avstand || 0);
  const kaliber = +opts.kaliber || 0;
  const familj = opts.familj || 'APCBC';
  const he = !!opts.he;
  const regler = opts.regler || standardRegler();
  if (klass === 'band') {
    return {klass, text: 'Bandträff', genomslag: false, rikoschett: false, skada: 0, mm: 0, vinkel: 0, pen: 0, tEff: 0};
  }
  const normal = platNormal(klass, lutning, opts.sida ?? 1);
  const skott = opts.skott || {x: 0, y: 0, z: -1};
  const vinkel = anslagsVinkel(skott, normal);
  const cos = Math.cos(vinkel * Math.PI / 180);
  const tEff = mm / Math.max(0.087, cos);
  if (he) {
    const tunn = kaliber / 4;
    const genomslag = !!regler.heMotPansar && mm <= tunn && vinkel < 80;
    return {
      klass, mm, lutning, vinkel, tEff, pen: tunn, f: 1, pe: tunn,
      genomslag, rikoschett: false, skada: genomslag ? 1 : 0,
      text: textFor(genomslag ? 'genomslag' : 'sprang', klass, avstand)
    };
  }
  const pen = interpolera(opts.kurva || {}, avstand);
  const f = effektivFaktor(familj, vinkel, kaliber, mm);
  const pe = pen * f;
  const genomslag = pe >= mm && mm > 0;
  const grans = REGLER.rikoschett[familj] ?? REGLER.rikoschett.APCBC;
  let rikoschett = false;
  let skada = 0;
  let slag = 'stopp';
  if (genomslag) {
    slag = 'genomslag';
    skada = 2;
  } else if (regler.rikoschett && vinkel >= grans) {
    rikoschett = true;
    slag = 'rikoschett';
  } else if (regler.skadaUtan && pe >= 0.9 * mm) {
    slag = 'spricka';
    skada = 1;
  }
  return {klass, mm, lutning, vinkel, tEff, pen, f, pe, genomslag, rikoschett, skada, text: textFor(slag, klass, avstand)};
}

export function bedomTraff(opts) {
  const mal = opts.mal || 'tiger_i';
  const klass = opts.klass || 'torn_front';
  if (klass === 'band') return bedomPlat({...opts, klass: 'band', mm: 0});
  const zon = zonPost(mal, klass);
  const kanon = REGLER.kanoner[opts.vapen] || REGLER.kanoner.m3_75;
  const he = opts.granat === 'sprang';
  const granat = he ? kanon.he : kanon.ap;
  return bedomPlat({
    ...opts,
    klass,
    mm: zon ? zon.mm : 0,
    lutning: zon ? zon.lutning : 0,
    kaliber: kanon.kaliber,
    familj: granat?.familj || (he ? 'HE' : 'APCBC'),
    kurva: granat?.kurva || {},
    he
  });
}

export function sjalvtest() {
  const fel = [];
  const krav = (namn, ok) => { if (!ok) fel.push(namn); };
  const pz = REGLER.kanoner.kwk36_l56.ap.kurva;
  const m61 = REGLER.kanoner.m3_75.ap.kurva;
  const m62 = REGLER.kanoner.m1_76.ap.kurva;
  krav('Pzgr. 39 0° följer tabellen', pz[100] === 146 && pz[1000] === 122 && pz[2000] === 102);
  krav('M61 och M62 är rätt granater', REGLER.kanoner.m3_75.ap.id === 'm61' && m61[100] === 88 && REGLER.kanoner.m1_76.ap.id === 'm62' && m62[1000] === 106);
  krav('avstånd interpoleras', Math.abs(interpolera(pz, 750) - 128) < 1e-6 && interpolera(pz, 50) === 146 && interpolera(m61, 2500) === 59);
  krav('vinkelfaktor', faktor('APCBC', 0) === 1 && faktor('APCBC', 30) === 0.82 && Math.abs(faktor('APCBC', 15) - 0.91) < 1e-9);
  krav('zoner ur geometrin', klassFranLokal(0, 0.05, 0) === 'band' && klassFranLokal(0, 0.72, 0.7) === 'mantel' && klassFranLokal(0, 0.3, 0.8) === 'nos' && klassFranLokal(0, 0.45, 0.7) === 'glacis' && klassFranLokal(0.8, 0.45, 0.1) === 'skrov_sida');

  const rak = {x: 0, y: 0, z: -1};
  const front75 = bedomTraff({mal: 'tiger_i', vapen: 'm3_75', granat: 'pansar', avstand: 100, klass: 'front', skott: rak});
  krav('75 mm slår inte igenom Tigerns förarplåt på 100 m', !front75.genomslag && front75.mm === 100 && front75.vinkel > 8 && front75.vinkel < 10);
  const front76 = bedomTraff({mal: 'tiger_i', vapen: 'm1_76', granat: 'pansar', avstand: 100, klass: 'front', skott: rak});
  krav('76 mm slår igenom Tigerns förarplåt på 100 m', front76.genomslag && front76.text.startsWith('Genomslag front'));
  const sida = bedomTraff({mal: 'tiger_i', vapen: 'kwk36_l56', granat: 'pansar', avstand: 100, klass: 'skrov_sida', skott: {x: -1, y: 0, z: 0}, sida: 1});
  krav('88 mm tar Tigerns sida rakt på', sida.genomslag && sida.vinkel < 1 && Math.abs(sida.tEff - 80) < 0.2);

  const glacis = bedomTraff({mal: 'sherman_m4_75', vapen: 'kwk36_l56', granat: 'pansar', avstand: 100, klass: 'glacis', skott: rak});
  const f56 = effektivFaktor('APCBC', glacis.vinkel, 88, 51);
  krav('Sherman-glacis räknar 56° och effektiv tjocklek', Math.abs(glacis.vinkel - 56) < 0.05 && Math.abs(glacis.tEff - 51 / Math.cos(56 * Math.PI / 180)) < 0.05);
  krav('overmatch höjer inte förbi tabellen här', Math.abs(f56 - faktor('APCBC', 56)) < 1e-9);
  krav('genomslag följer pen·f mot mm', glacis.genomslag === (146 * f56 >= 51));

  const riko = bedomTraff({mal: 'tiger_i', vapen: 'kwk36_l56', granat: 'pansar', avstand: 650, klass: 'glacis', skott: rak, regler: standardRegler()});
  krav('flack glacis rikoschetterar', riko.rikoschett && !riko.genomslag && riko.vinkel > 70 && riko.text.startsWith('Rikoschett mot glacis'));
  const utan = bedomTraff({mal: 'tiger_i', vapen: 'kwk36_l56', granat: 'pansar', avstand: 650, klass: 'glacis', skott: rak, regler: {rikoschett: false, heMotPansar: false, skadaUtan: false}});
  krav('rikoschett kan stängas av', !utan.rikoschett && !utan.genomslag);

  const tunn = bedomPlat({klass: 'front', mm: 30, lutning: 70, kaliber: 88, familj: 'APCBC', kurva: pz, avstand: 100, skott: rak});
  krav('overmatch slår igenom 30 mm i 70°', tunn.genomslag && tunn.f > faktor('APCBC', 70));
  const utanOm = 146 * faktor('APCBC', 70);
  krav('utan overmatch stannar samma skott', utanOm < 30);

  const heAv = bedomTraff({mal: 'sherman_m4_75', vapen: 'kwk36_l56', granat: 'sprang', avstand: 200, klass: 'skrov_tak', skott: {x: 0, y: -1, z: 0}, regler: standardRegler()});
  const hePa = bedomTraff({mal: 'sherman_m4_75', vapen: 'kwk36_l56', granat: 'sprang', avstand: 200, klass: 'skrov_tak', skott: {x: 0, y: -1, z: 0}, regler: {...standardRegler(), heMotPansar: true}});
  krav('spräng står still mot pansar tills flaggan slås på', !heAv.genomslag && heAv.skada === 0 && hePa.genomslag && hePa.mm === 19);

  const spricka = bedomTraff({mal: 'tiger_i', vapen: 'm3_75', granat: 'pansar', avstand: 1000, klass: 'skrov_sida', skott: {x: -1, y: 0, z: 0}, regler: {...standardRegler(), skadaUtan: true}});
  const sprickaAv = bedomTraff({mal: 'tiger_i', vapen: 'm3_75', granat: 'pansar', avstand: 1000, klass: 'skrov_sida', skott: {x: -1, y: 0, z: 0}, regler: standardRegler()});
  krav('skada utan genomslag vid 0,9×mm', !spricka.genomslag && spricka.skada === 1 && sprickaAv.skada === 0 && spricka.pen === 73);

  krav('bandträff är egen', bedomTraff({klass: 'band'}).text === 'Bandträff');
  const s75 = sikteFor('sherman_m4_75');
  const s76 = sikteFor('sherman_m4a3_76w');
  const s9b = sikteFor('tiger_i', 'tzf9b');
  const s9c = sikteFor('tiger_i', 'tzf9c5');
  krav('siktesfält', Math.abs(s75.synfalt - (12 + 19 / 60)) < 1e-9 && s76.synfalt === 13 && s9b.synfalt === 25.5 && s9b.forstoring === 2.5 && Math.abs(s9c.synfalt - 12.75) < 1e-9 && s9c.forstoring === 5);
  krav('strömbrytarna har källans av-läge', standardRegler().heMotPansar === false && standardRegler().skadaUtan === false && standardRegler().rikoschett === true);
  return fel;
}
