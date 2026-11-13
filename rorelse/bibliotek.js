// Kategorier, faktorer, val och underval. Rent data, plus lagring längst ner.
// En kategori äger sina faktorer. En faktor äger sina val. Ett val kan ha underval, ett steg.

export const FORMAT = 'ww2-rorelse';
export const VERSION = 2;
const NAMN_MAX = 40;

export function nyttId() {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function tomtBibliotek() {
  return { kategorier: [], inspelningar: [], senast: null, profiler: [] };
}

function rentNamn(namn) {
  const t = String(namn ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return null;
  return t.slice(0, NAMN_MAX);
}

function upptaget(lista, namn, utomId) {
  const n = namn.toLocaleLowerCase('sv');
  return (lista || []).some((x) => x.id !== utomId && String(x.namn).toLocaleLowerCase('sv') === n);
}

function nej(fel) {
  return { ok: false, fel };
}

export function skapaKategori(kategorier, namn) {
  const rent = rentNamn(namn);
  if (!rent) return nej('tomt');
  if (upptaget(kategorier, rent)) return nej('finns');
  const kategori = { id: nyttId(), namn: rent, faktorer: [] };
  kategorier.push(kategori);
  return { ok: true, kategori };
}

export function bytNamnKategori(kategorier, id, namn) {
  const kat = kategorier.find((k) => k.id === id);
  if (!kat) return nej('saknas');
  const rent = rentNamn(namn);
  if (!rent) return nej('tomt');
  if (upptaget(kategorier, rent, id)) return nej('finns');
  kat.namn = rent;
  return { ok: true, kategori: kat };
}

export function taBortKategori(kategorier, inspelningar, id) {
  const i = kategorier.findIndex((k) => k.id === id);
  if (i < 0) return nej('saknas');
  kategorier.splice(i, 1);
  for (const ins of inspelningar || []) {
    if (ins.kategoriId === id) {
      ins.kategoriId = null;
      ins.val = {};
    }
  }
  return { ok: true };
}

export function laggTillFaktor(kategorier, kategoriId, namn) {
  const kat = kategorier.find((k) => k.id === kategoriId);
  if (!kat) return nej('saknas');
  const rent = rentNamn(namn);
  if (!rent) return nej('tomt');
  if (upptaget(kat.faktorer, rent)) return nej('finns');
  const faktor = { id: nyttId(), namn: rent, val: [] };
  kat.faktorer.push(faktor);
  return { ok: true, faktor };
}

export function bytNamnFaktor(kategorier, kategoriId, faktorId, namn) {
  const kat = kategorier.find((k) => k.id === kategoriId);
  const faktor = kat?.faktorer.find((f) => f.id === faktorId);
  if (!faktor) return nej('saknas');
  const rent = rentNamn(namn);
  if (!rent) return nej('tomt');
  if (upptaget(kat.faktorer, rent, faktorId)) return nej('finns');
  faktor.namn = rent;
  return { ok: true, faktor };
}

export function taBortFaktor(kategorier, inspelningar, kategoriId, faktorId) {
  const kat = kategorier.find((k) => k.id === kategoriId);
  if (!kat) return nej('saknas');
  const i = kat.faktorer.findIndex((f) => f.id === faktorId);
  if (i < 0) return nej('saknas');
  kat.faktorer.splice(i, 1);
  for (const ins of inspelningar || []) {
    if (ins.kategoriId === kategoriId && ins.val) delete ins.val[faktorId];
  }
  return { ok: true };
}

export function laggTillVal(kategorier, kategoriId, faktorId, namn) {
  const faktor = kategorier.find((k) => k.id === kategoriId)?.faktorer.find((f) => f.id === faktorId);
  if (!faktor) return nej('saknas');
  const rent = rentNamn(namn);
  if (!rent) return nej('tomt');
  if (upptaget(faktor.val, rent)) return nej('finns');
  const val = { id: nyttId(), namn: rent, underval: [] };
  faktor.val.push(val);
  return { ok: true, val };
}

export function bytNamnVal(kategorier, kategoriId, faktorId, valId, namn) {
  const faktor = kategorier.find((k) => k.id === kategoriId)?.faktorer.find((f) => f.id === faktorId);
  const val = faktor?.val.find((v) => v.id === valId);
  if (!val) return nej('saknas');
  const rent = rentNamn(namn);
  if (!rent) return nej('tomt');
  if (upptaget(faktor.val, rent, valId)) return nej('finns');
  val.namn = rent;
  return { ok: true, val };
}

export function taBortVal(kategorier, inspelningar, kategoriId, faktorId, valId) {
  const faktor = kategorier.find((k) => k.id === kategoriId)?.faktorer.find((f) => f.id === faktorId);
  if (!faktor) return nej('saknas');
  const i = faktor.val.findIndex((v) => v.id === valId);
  if (i < 0) return nej('saknas');
  faktor.val.splice(i, 1);
  for (const ins of inspelningar || []) {
    if (ins.kategoriId === kategoriId && ins.val?.[faktorId]?.valId === valId) delete ins.val[faktorId];
  }
  return { ok: true };
}

export function laggTillUnderval(kategorier, kategoriId, faktorId, valId, namn) {
  const val = kategorier.find((k) => k.id === kategoriId)?.faktorer.find((f) => f.id === faktorId)?.val.find((v) => v.id === valId);
  if (!val) return nej('saknas');
  if (!Array.isArray(val.underval)) val.underval = [];
  const rent = rentNamn(namn);
  if (!rent) return nej('tomt');
  if (upptaget(val.underval, rent)) return nej('finns');
  const under = { id: nyttId(), namn: rent };
  val.underval.push(under);
  return { ok: true, under };
}

export function bytNamnUnderval(kategorier, kategoriId, faktorId, valId, underId, namn) {
  const val = kategorier.find((k) => k.id === kategoriId)?.faktorer.find((f) => f.id === faktorId)?.val.find((v) => v.id === valId);
  const under = val?.underval?.find((u) => u.id === underId);
  if (!under) return nej('saknas');
  const rent = rentNamn(namn);
  if (!rent) return nej('tomt');
  if (upptaget(val.underval, rent, underId)) return nej('finns');
  under.namn = rent;
  return { ok: true, under };
}

export function taBortUnderval(kategorier, inspelningar, kategoriId, faktorId, valId, underId) {
  const val = kategorier.find((k) => k.id === kategoriId)?.faktorer.find((f) => f.id === faktorId)?.val.find((v) => v.id === valId);
  if (!val?.underval) return nej('saknas');
  const i = val.underval.findIndex((u) => u.id === underId);
  if (i < 0) return nej('saknas');
  val.underval.splice(i, 1);
  for (const ins of inspelningar || []) {
    const v = ins.val?.[faktorId];
    if (ins.kategoriId === kategoriId && v?.undervalId === underId) v.undervalId = null;
  }
  return { ok: true };
}

export function giltigtVal(kategori, val) {
  const ut = {};
  if (!kategori || !val) return ut;
  for (const f of kategori.faktorer || []) {
    const v = val[f.id];
    if (!v?.valId) continue;
    const vald = (f.val || []).find((x) => x.id === v.valId);
    if (!vald) continue;
    const underFinns = v.undervalId && (vald.underval || []).some((u) => u.id === v.undervalId);
    ut[f.id] = { valId: vald.id, undervalId: underFinns ? v.undervalId : null };
  }
  return ut;
}

export function byggEtikett(kategori, val) {
  if (!kategori) return { kategori: null, kategoriId: null, rader: [] };
  const rader = [];
  for (const f of kategori.faktorer || []) {
    const v = val?.[f.id];
    const vald = (f.val || []).find((x) => x.id === v?.valId) || null;
    const under = vald && v?.undervalId ? (vald.underval || []).find((u) => u.id === v.undervalId) || null : null;
    rader.push({
      faktorId: f.id,
      faktor: f.namn,
      valId: vald?.id || null,
      val: vald?.namn || null,
      undervalId: under?.id || null,
      underval: under?.namn || null
    });
  }
  return { kategori: kategori.namn, kategoriId: kategori.id, rader };
}

export function etikettText(etikett) {
  if (!etikett?.kategori && !etikett?.rader?.length) return 'Utan kategori';
  const delar = [];
  if (etikett.kategori) delar.push(etikett.kategori);
  for (const rad of etikett.rader || []) {
    if (!rad.val) continue;
    delar.push(rad.underval ? `${rad.val} · ${rad.underval}` : rad.val);
  }
  return delar.join(' · ') || 'Utan kategori';
}

function textEller(v, annars) {
  return typeof v === 'string' && v.trim() ? v.trim() : annars;
}

function normaliseraSampel(lista) {
  if (!Array.isArray(lista)) return [];
  return lista.filter((s) => s && Number.isFinite(s.t)).map((s) => ({
    t: s.t,
    rot: Array.isArray(s.rot) ? s.rot : null,
    acc: Array.isArray(s.acc) ? s.acc : null,
    accG: Array.isArray(s.accG) ? s.accG : null,
    vinkel: Array.isArray(s.vinkel) ? s.vinkel : null,
    skarm: Number.isFinite(s.skarm) ? s.skarm : null
  }));
}

function normaliseraKategori(k, i) {
  if (!k || typeof k !== 'object') return null;
  const faktorer = (Array.isArray(k.faktorer) ? k.faktorer : []).map((f, fi) => {
    if (!f || typeof f !== 'object') return null;
    const val = (Array.isArray(f.val) ? f.val : []).map((v, vi) => {
      if (!v || typeof v !== 'object') return null;
      const underval = (Array.isArray(v.underval) ? v.underval : []).map((u, ui) => {
        if (!u || typeof u !== 'object') return null;
        return { id: textEller(u.id, `under-${i}-${fi}-${vi}-${ui}`), namn: textEller(u.namn, 'Namnlöst') };
      }).filter(Boolean);
      return { id: textEller(v.id, `val-${i}-${fi}-${vi}`), namn: textEller(v.namn, 'Namnlöst'), underval };
    }).filter(Boolean);
    return { id: textEller(f.id, `faktor-${i}-${fi}`), namn: textEller(f.namn, 'Namnlös'), val };
  }).filter(Boolean);
  return { id: textEller(k.id, `kat-${i}`), namn: textEller(k.namn, 'Namnlös'), faktorer };
}

function normaliseraProfil(p) {
  if (!p || typeof p !== 'object' || typeof p.id !== 'string') return null;
  const skalara = (Array.isArray(p.skalara) ? p.skalara : []).filter((s) => s && typeof s.nyckel === 'string').map((s) => ({
    nyckel: s.nyckel,
    text: textEller(s.text, s.nyckel),
    enhet: typeof s.enhet === 'string' ? s.enhet : '',
    medel: Number.isFinite(s.medel) ? s.medel : null,
    spridning: Number.isFinite(s.spridning) ? s.spridning : null,
    variationskoefficient: Number.isFinite(s.variationskoefficient) ? s.variationskoefficient : null
  }));
  const kurvor = (Array.isArray(p.kurvor) ? p.kurvor : []).filter((k) => k && typeof k.nyckel === 'string').map((k) => ({
    nyckel: k.nyckel,
    storhet: typeof k.storhet === 'string' ? k.storhet : '',
    text: textEller(k.text, k.nyckel),
    enhet: typeof k.enhet === 'string' ? k.enhet : '',
    punkter: (Array.isArray(k.punkter) ? k.punkter : []).filter((pt) => pt && Number.isFinite(pt.u)).map((pt) => ({
      u: pt.u,
      medel: Number.isFinite(pt.medel) ? pt.medel : null,
      spridning: Number.isFinite(pt.spridning) ? pt.spridning : null
    }))
  }));
  return {
    id: p.id,
    version: Number.isFinite(p.version) ? p.version : 1,
    kategoriId: typeof p.kategoriId === 'string' ? p.kategoriId : null,
    signatur: typeof p.signatur === 'string' ? p.signatur : '',
    text: typeof p.text === 'string' ? p.text : '',
    antal: Number.isFinite(p.antal) ? p.antal : 0,
    sparad: typeof p.sparad === 'string' ? p.sparad : null,
    synk: p.synk === 'start' ? 'start' : 'topp',
    synkLage: Number.isFinite(p.synkLage) ? p.synkLage : null,
    skalara,
    kurvor
  };
}

function normaliseraInspelning(ins, i) {
  if (!ins || typeof ins !== 'object') return null;
  const sampel = normaliseraSampel(ins.sampel);
  if (!sampel.length) return null;
  const val = {};
  if (ins.val && typeof ins.val === 'object') {
    for (const [fid, v] of Object.entries(ins.val)) {
      if (v && typeof v.valId === 'string') val[fid] = { valId: v.valId, undervalId: typeof v.undervalId === 'string' ? v.undervalId : null };
    }
  }
  return {
    id: textEller(ins.id, `ins-${i}`),
    skapad: typeof ins.skapad === 'string' ? ins.skapad : null,
    kategoriId: typeof ins.kategoriId === 'string' ? ins.kategoriId : null,
    val,
    etikett: ins.etikett && typeof ins.etikett === 'object' ? ins.etikett : { kategori: null, rader: [] },
    langdSek: Number.isFinite(ins.langdSek) ? ins.langdSek : (sampel.at(-1)?.t ?? 0),
    antal: sampel.length,
    samplingsfrekvensHz: Number.isFinite(ins.samplingsfrekvensHz) ? ins.samplingsfrekvensHz : null,
    avslut: typeof ins.avslut === 'string' ? ins.avslut : null,
    svansSek: Number.isFinite(ins.svansSek) ? ins.svansSek : null,
    nollage: Array.isArray(ins.nollage) ? ins.nollage : null,
    sampel,
    egenskaper: ins.egenskaper && Array.isArray(ins.egenskaper.vektor) ? ins.egenskaper : null,
    enhet: ins.enhet && typeof ins.enhet === 'object' ? ins.enhet : null
  };
}

function franV1(obj) {
  const kat = { id: 'v1-kategori', namn: 'Tidigare rörelser', faktorer: [{ id: 'v1-namn', namn: 'Namn', val: [] }] };
  const inspelningar = [];
  for (const g of obj.gester || []) {
    const val = { id: textEller(g?.id, nyttId()), namn: textEller(g?.namn, 'Namnlös rörelse'), underval: [] };
    kat.faktorer[0].val.push(val);
    for (const ex of g?.exempel || []) {
      const sampel = normaliseraSampel(ex?.sampel);
      if (!sampel.length) continue;
      inspelningar.push({
        id: textEller(ex.id, nyttId()),
        skapad: typeof ex.skapad === 'string' ? ex.skapad : null,
        kategoriId: kat.id,
        val: { [kat.faktorer[0].id]: { valId: val.id, undervalId: null } },
        etikett: {
          kategori: kat.namn,
          kategoriId: kat.id,
          rader: [{ faktorId: kat.faktorer[0].id, faktor: 'Namn', valId: val.id, val: val.namn, undervalId: null, underval: null }]
        },
        langdSek: Number.isFinite(ex.langdSek) ? ex.langdSek : (sampel.at(-1)?.t ?? 0),
        antal: sampel.length,
        samplingsfrekvensHz: Number.isFinite(ex.samplingsfrekvensHz) ? ex.samplingsfrekvensHz : null,
        avslut: typeof ex.avslut === 'string' ? ex.avslut : null,
        svansSek: null,
        nollage: null,
        sampel,
        egenskaper: null,
        enhet: null
      });
    }
  }
  return {
    kategorier: kat.faktorer[0].val.length ? [kat] : [],
    inspelningar,
    senast: null,
    profiler: []
  };
}

export function lasImport(obj) {
  if (!obj || obj.format !== FORMAT) {
    const fel = new Error('format');
    fel.kod = 'format';
    throw fel;
  }
  if (obj.version === 1 && Array.isArray(obj.gester)) return franV1(obj);
  if (obj.version !== VERSION) {
    const fel = new Error('version');
    fel.kod = 'version';
    throw fel;
  }
  const kategorier = (Array.isArray(obj.kategorier) ? obj.kategorier : []).map(normaliseraKategori).filter(Boolean);
  const inspelningar = (Array.isArray(obj.inspelningar) ? obj.inspelningar : []).map(normaliseraInspelning).filter(Boolean);
  const profiler = (Array.isArray(obj.profiler) ? obj.profiler : []).map(normaliseraProfil).filter(Boolean);
  let senast = null;
  if (obj.senast && typeof obj.senast === 'object' && typeof obj.senast.kategoriId === 'string') {
    senast = { kategoriId: obj.senast.kategoriId, val: giltigtVal(kategorier.find((k) => k.id === obj.senast.kategoriId), obj.senast.val) };
  }
  return { kategorier, inspelningar, senast, profiler };
}

export function slahopImport(lokal, inkommande) {
  const kategorier = (lokal.kategorier || []).map((k) => structuredClone(k));
  const inspelningar = (lokal.inspelningar || []).map((r) => structuredClone(r));
  const profiler = (lokal.profiler || []).map((p) => structuredClone(p));
  let nyaKat = 0;
  let uppdKat = 0;
  let nyaIns = 0;
  let uppdIns = 0;
  let nyaProfil = 0;
  let uppdProfil = 0;
  for (const kat of inkommande.kategorier || []) {
    const i = kategorier.findIndex((k) => k.id === kat.id);
    if (i >= 0) { kategorier[i] = kat; uppdKat++; }
    else { kategorier.push(kat); nyaKat++; }
  }
  for (const ins of inkommande.inspelningar || []) {
    const i = inspelningar.findIndex((r) => r.id === ins.id);
    if (i >= 0) { inspelningar[i] = ins; uppdIns++; }
    else { inspelningar.push(ins); nyaIns++; }
  }
  for (const p of inkommande.profiler || []) {
    if (!p?.id) continue;
    const i = profiler.findIndex((r) => r.id === p.id);
    if (i >= 0) { profiler[i] = p; uppdProfil++; }
    else { profiler.push(p); nyaProfil++; }
  }
  let senast = lokal.senast || null;
  if (!senast?.kategoriId && inkommande.senast?.kategoriId) senast = inkommande.senast;
  const kat = kategorier.find((k) => k.id === senast?.kategoriId);
  if (senast && !kat) senast = null;
  else if (senast && kat) senast = { kategoriId: kat.id, val: giltigtVal(kat, senast.val) };
  return { kategorier, inspelningar, senast, profiler, nyaKat, uppdKat, nyaIns, uppdIns, nyaProfil, uppdProfil };
}

export function byggExport({ kategorier, inspelningar, senast, profiler, enhet, tid }) {
  return {
    format: FORMAT,
    version: VERSION,
    app: 'rorelse',
    exporterad: tid,
    nycklar: {
      t: 'sekunder från inspelningens start',
      rot: '[alfa, beta, gamma] grader per sekund. alfa vridning, beta tippa, gamma luta',
      acc: '[x, y, z] m/s² utan gravitation. x höger, y upp, z ut ur skärmen',
      accG: '[x, y, z] m/s² med gravitation',
      vinkel: '[alfa, beta, gamma] grader relativt nollställningen, −180 till 180',
      skarm: 'skärmens vinkel i grader'
    },
    enhet: enhet || null,
    kategorier: kategorier || [],
    inspelningar: inspelningar || [],
    senast: senast || null,
    profiler: profiler || []
  };
}

const LS_NYCKEL = 'ww2-rorelse-v2';
const DB_NAMN = 'ww2-rorelse';
const DB_VERSION = 2;

export function skapaLager() {
  let db = null;
  let fallback = false;

  function lsLas() {
    try {
      const data = JSON.parse(localStorage.getItem(LS_NYCKEL) || 'null');
      if (!data || typeof data !== 'object') return tomtBibliotek();
      return {
        kategorier: Array.isArray(data.kategorier) ? data.kategorier : [],
        inspelningar: Array.isArray(data.inspelningar) ? data.inspelningar : [],
        senast: data.senast || null,
        profiler: Array.isArray(data.profiler) ? data.profiler : []
      };
    } catch (e) {
      return tomtBibliotek();
    }
  }

  function lsSkriv(data) {
    localStorage.setItem(LS_NYCKEL, JSON.stringify({
      kategorier: data.kategorier || [],
      inspelningar: data.inspelningar || [],
      senast: data.senast || null,
      profiler: data.profiler || []
    }));
  }

  async function oppna() {
    if (!globalThis.indexedDB) { fallback = true; return; }
    try {
      db = await new Promise((resolve, reject) => {
        const r = indexedDB.open(DB_NAMN, DB_VERSION);
        r.onupgradeneeded = () => {
          const d = r.result;
          if (!d.objectStoreNames.contains('inspelningar')) d.createObjectStore('inspelningar', { keyPath: 'id' });
          if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta');
        };
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
    } catch (e) {
      db = null;
      fallback = true;
    }
  }

  async function las() {
    if (fallback || !db) return lsLas();
    const ut = tomtBibliotek();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(['meta', 'inspelningar'], 'readonly');
      const mk = tx.objectStore('meta').get('kategorier');
      const ms = tx.objectStore('meta').get('senast');
      const mp = tx.objectStore('meta').get('profiler');
      const ia = tx.objectStore('inspelningar').getAll();
      mk.onsuccess = () => { ut.kategorier = mk.result || []; };
      ms.onsuccess = () => { ut.senast = ms.result || null; };
      mp.onsuccess = () => { ut.profiler = Array.isArray(mp.result) ? mp.result : []; };
      ia.onsuccess = () => { ut.inspelningar = ia.result || []; };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    ut.inspelningar.sort((a, b) => String(b.skapad || '').localeCompare(String(a.skapad || '')));
    return ut;
  }

  async function sparaTaxonomi(kategorier, senast) {
    if (fallback || !db) {
      const data = lsLas();
      data.kategorier = kategorier;
      data.senast = senast;
      lsSkriv(data);
      return;
    }
    await new Promise((resolve, reject) => {
      const tx = db.transaction('meta', 'readwrite');
      const store = tx.objectStore('meta');
      store.put(kategorier, 'kategorier');
      if (senast) store.put(senast, 'senast');
      else store.delete('senast');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function sparaInspelning(ins) {
    if (fallback || !db) {
      const data = lsLas();
      const i = data.inspelningar.findIndex((r) => r.id === ins.id);
      if (i >= 0) data.inspelningar[i] = ins;
      else data.inspelningar.unshift(ins);
      lsSkriv(data);
      return;
    }
    await new Promise((resolve, reject) => {
      const tx = db.transaction('inspelningar', 'readwrite');
      tx.objectStore('inspelningar').put(ins);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function taBortInspelning(id) {
    if (fallback || !db) {
      const data = lsLas();
      data.inspelningar = data.inspelningar.filter((r) => r.id !== id);
      lsSkriv(data);
      return;
    }
    await new Promise((resolve, reject) => {
      const tx = db.transaction('inspelningar', 'readwrite');
      tx.objectStore('inspelningar').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function sparaProfiler(profiler) {
    if (fallback || !db) {
      const data = lsLas();
      data.profiler = profiler || [];
      lsSkriv(data);
      return;
    }
    await new Promise((resolve, reject) => {
      const tx = db.transaction('meta', 'readwrite');
      tx.objectStore('meta').put(profiler || [], 'profiler');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function skrivAllt(data) {
    if (fallback || !db) { lsSkriv(data); return; }
    await new Promise((resolve, reject) => {
      const tx = db.transaction(['inspelningar', 'meta'], 'readwrite');
      const ins = tx.objectStore('inspelningar');
      ins.clear();
      for (const rad of data.inspelningar || []) ins.put(rad);
      const meta = tx.objectStore('meta');
      meta.put(data.kategorier || [], 'kategorier');
      meta.put(data.profiler || [], 'profiler');
      if (data.senast) meta.put(data.senast, 'senast');
      else meta.delete('senast');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  return {
    oppna,
    las,
    sparaTaxonomi,
    sparaInspelning,
    taBortInspelning,
    sparaProfiler,
    skrivAllt,
    get fallback() { return fallback; }
  };
}
