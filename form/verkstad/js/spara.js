/* Lokala ändringar ovanpå datapaketet. IndexedDB först, localStorage om den saknas. */

const DB = 'form-verkstad';
const VERSION = 1;
const RESERV = 'form-verkstad-reserv';

function reservLas() {
  try {
    return JSON.parse(localStorage.getItem(RESERV) || '{}');
  } catch {
    return {};
  }
}

function reservSkriv(allt) {
  localStorage.setItem(RESERV, JSON.stringify(allt));
}

let databas;

function oppna() {
  if (databas) return databas;
  if (typeof indexedDB === 'undefined') {
    databas = Promise.resolve(null);
    return databas;
  }
  databas = new Promise((resolve, reject) => {
    const beg = indexedDB.open(DB, VERSION);
    beg.onupgradeneeded = () => {
      const db = beg.result;
      if (!db.objectStoreNames.contains('overrid')) db.createObjectStore('overrid');
      if (!db.objectStoreNames.contains('scen')) db.createObjectStore('scen');
    };
    beg.onsuccess = () => resolve(beg.result);
    beg.onerror = () => reject(beg.error);
  }).catch(() => null);
  return databas;
}

function las(butik, nyckel) {
  return oppna().then(async (db) => {
    const lokal = reservLas()[butik]?.[nyckel] ?? null;
    if (!db) return lokal;
    const idb = await new Promise((resolve, reject) => {
      const tx = db.transaction(butik, 'readonly');
      const beg = tx.objectStore(butik).get(nyckel);
      beg.onsuccess = () => resolve(beg.result ?? null);
      beg.onerror = () => reject(beg.error);
    });
    if (!idb) return lokal;
    if (!lokal) return idb;
    return (lokal.sparad || 0) >= (idb.sparad || 0) ? lokal : idb;
  });
}

function skriv(butik, nyckel, varde) {
  varde.sparad = Date.now();
  const reserv = reservLas();
  reserv[butik] = reserv[butik] || {};
  reserv[butik][nyckel] = varde;
  try { reservSkriv(reserv); } catch { /* privat läge kan neka */ }
  return oppna().then((db) => {
    if (!db) return varde;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(butik, 'readwrite');
      tx.objectStore(butik).put(varde, nyckel);
      tx.oncomplete = () => resolve(varde);
      tx.onerror = () => reject(tx.error);
    });
  });
}

export function lasOverrid(enhetId) {
  return las('overrid', enhetId);
}

export function skrivOverrid(enhetId, overrid) {
  return skriv('overrid', enhetId, overrid);
}

export function lasScen(varldId) {
  return las('scen', varldId);
}

export function skrivScen(varldId, scen) {
  return skriv('scen', varldId, scen);
}
