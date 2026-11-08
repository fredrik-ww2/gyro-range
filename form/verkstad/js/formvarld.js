/* Satellitvärldar som gamla FORM sparar i IndexedDB (form-landscapes-v1).
   Höjden räknas med samma formel som satellitbyggaren. Markbilden är den sparade bilden. */

import {
  BoxGeometry, CanvasTexture, LinearFilter, LinearMipmapLinearFilter, Mesh, MeshStandardMaterial, PlaneGeometry
} from 'three';

const DB = 'form-landscapes-v1';
const VERSION = 1;
const BUTIK = 'projects';
const MAX_SIDA = 2048;
const SEGMENT = 80;

export function scenNyckel(id) {
  return 'form:' + id;
}

export function hojdPa(x, z, installningar) {
  const fas = (installningar.heightSeed ?? installningar.seed) * 0.37;
  const bredd = installningar.widthMeters;
  return installningar.relief * (
    Math.sin(x / (bredd * 0.3) + fas) * 0.35
    + Math.cos(z / (bredd * 0.27) - fas) * 0.32
    + Math.sin((x + z) / (bredd * 0.11) + fas) * 0.13
    + Math.sin(x * 0.43 + Math.cos(z * 0.35)) * Math.cos(z * 0.39) * 0.045
  );
}

export function mattLandskap(post) {
  const bredd = post.settings.widthMeters;
  const djup = bredd * post.analysis.height / post.analysis.width;
  return { bredd, djup };
}

export function godkann(post) {
  if (!post || post.version !== 1) return false;
  if (typeof post.id !== 'string' || post.id.length < 1 || post.id.length > 80) return false;
  if (typeof post.name !== 'string' || !post.name.trim() || post.name.length > 160) return false;
  if (typeof post.image !== 'string' || post.image.length > 6e6) return false;
  if (!/^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(post.image)) return false;
  const karta = post.analysis;
  const installningar = post.settings;
  if (!karta || karta.version !== 1) return false;
  if (!Number.isInteger(karta.width) || !Number.isInteger(karta.height)) return false;
  if (!inom(karta.width, 16, 512) || !inom(karta.height, 16, 512)) return false;
  const antal = karta.width * karta.height;
  if (!Array.isArray(karta.labels) || karta.labels.length !== antal) return false;
  if (!karta.labels.every((varde) => Number.isInteger(varde) && varde >= 0 && varde <= 5)) return false;
  if (!Array.isArray(karta.confidence) || karta.confidence.length !== antal) return false;
  if (!karta.confidence.every((varde) => inom(varde, 0, 1))) return false;
  if (!Array.isArray(karta.coverage) || karta.coverage.length !== 6) return false;
  if (!karta.coverage.every((varde) => inom(varde, 0, 1))) return false;
  if (!inom(karta.fingerprint, 0, 4294967295)) return false;
  if (!Array.isArray(karta.warnings) || !karta.warnings.every((rad) => typeof rad === 'string' && rad.length < 400)) return false;
  if (karta.colorGrid && !godkannFarg(karta.colorGrid)) return false;
  if (!installningar) return false;
  if (!inom(installningar.widthMeters, 30, 1200) || !inom(installningar.relief, 0, 15)) return false;
  if (!inom(installningar.density, 0.2, 2) || !inom(installningar.seed, 0, 4294967295)) return false;
  if (!['mobile', 'high'].includes(installningar.detail)) return false;
  if (!['mixed', 'conifer', 'broadleaf'].includes(installningar.treeType)) return false;
  if (installningar.appearance !== undefined && !['reference', 'nature'].includes(installningar.appearance)) return false;
  if (installningar.heightSeed !== undefined && !inom(installningar.heightSeed, 0, 4294967295)) return false;
  if (!Array.isArray(karta.buildings) || karta.buildings.length > 300) return false;
  return karta.buildings.every(godkannHus);
}

export async function lasLandskap() {
  const db = await oppna();
  if (!db) return [];
  try {
    const poster = await allt(db);
    return poster.filter(godkann).sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  } finally {
    db.close();
  }
}

export async function hamtaLandskap(id) {
  const db = await oppna();
  if (!db) return null;
  try {
    const post = await en(db, id);
    return godkann(post) ? post : null;
  } finally {
    db.close();
  }
}

export async function byggFormMark(post) {
  const { bredd, djup } = mattLandskap(post);
  const textur = await texturFranBild(post.image);
  const segX = bredd >= djup ? SEGMENT : Math.max(12, Math.round(SEGMENT * bredd / djup));
  const segZ = djup >= bredd ? SEGMENT : Math.max(12, Math.round(SEGMENT * djup / bredd));
  const geometri = new PlaneGeometry(bredd, djup, segX, segZ);
  geometri.rotateX(-Math.PI / 2);
  const punkter = geometri.attributes.position;
  for (let i = 0; i < punkter.count; i += 1) {
    punkter.setY(i, hojdPa(punkter.getX(i), punkter.getZ(i), post.settings));
  }
  geometri.computeVertexNormals();
  geometri.computeBoundingSphere();
  const mark = new Mesh(geometri, new MeshStandardMaterial({ map: textur, roughness: 1, metalness: 0 }));
  mark.name = 'Mark från FORM satellit';
  mark.frustumCulled = true;
  mark.receiveShadow = false;
  mark.castShadow = false;
  const hus = post.analysis.buildings.map((husPost, index) => byggHus(husPost, bredd, djup, index));
  return { mark, hus, bredd, djup, texturSida: textur.userData.sida };
}

function byggHus(husPost, bredd, djup, index) {
  const sx = husPost.w * bredd;
  const sz = husPost.d * djup;
  const hojd = Math.max(2.6, Math.min(6, Math.sqrt(sx * sz) * 0.23));
  const rod = Math.round(husPost.color[0] * 255);
  const gron = Math.round(husPost.color[1] * 255);
  const bla = Math.round(husPost.color[2] * 255);
  const mesh = new Mesh(
    new BoxGeometry(Math.max(0.4, sx), hojd, Math.max(0.4, sz)),
    new MeshStandardMaterial({ color: (rod << 16) + (gron << 8) + bla, roughness: 0.9, metalness: 0 })
  );
  mesh.name = 'Hus ' + (index + 1);
  mesh.frustumCulled = true;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.rotation.y = -husPost.angle;
  mesh.userData.markX = (husPost.u - 0.5) * bredd;
  mesh.userData.markZ = (husPost.v - 0.5) * djup;
  mesh.userData.lyft = hojd / 2;
  return mesh;
}

function texturFranBild(url) {
  const bild = new Image();
  bild.src = url;
  return bild.decode().then(() => {
    const skala = Math.min(1, MAX_SIDA / Math.max(bild.naturalWidth, bild.naturalHeight));
    const bredd = Math.max(1, Math.round(bild.naturalWidth * skala));
    const hojd = Math.max(1, Math.round(bild.naturalHeight * skala));
    const duk = document.createElement('canvas');
    duk.width = bredd;
    duk.height = hojd;
    duk.getContext('2d').drawImage(bild, 0, 0, bredd, hojd);
    const textur = new CanvasTexture(duk);
    textur.colorSpace = 'srgb';
    textur.magFilter = LinearFilter;
    textur.minFilter = LinearMipmapLinearFilter;
    textur.generateMipmaps = true;
    textur.anisotropy = 4;
    textur.needsUpdate = true;
    textur.userData.sida = Math.max(bredd, hojd);
    return textur;
  });
}

function godkannFarg(ruta) {
  if (!Number.isInteger(ruta.width) || !Number.isInteger(ruta.height)) return false;
  if (!inom(ruta.width, 1, 64) || !inom(ruta.height, 1, 2048)) return false;
  if (!Array.isArray(ruta.rgb) || ruta.rgb.length !== ruta.width * ruta.height * 3) return false;
  return ruta.rgb.every((varde) => inom(varde, 0, 255));
}

function godkannHus(hus) {
  return !!hus
    && inom(hus.u, 0, 1) && inom(hus.v, 0, 1)
    && inom(hus.w, 0.001, 1.5) && inom(hus.d, 0.001, 1.5)
    && inom(hus.angle, -Math.PI, Math.PI)
    && Array.isArray(hus.color) && hus.color.length === 3 && hus.color.every((varde) => inom(varde, 0, 1))
    && ['flat', 'pitched'].includes(hus.roof)
    && inom(hus.confidence, 0, 1);
}

function inom(tal, min, max) {
  return typeof tal === 'number' && Number.isFinite(tal) && tal >= min && tal <= max;
}

function oppna() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const beg = indexedDB.open(DB, VERSION);
    beg.onupgradeneeded = () => {
      const db = beg.result;
      if (!db.objectStoreNames.contains(BUTIK)) db.createObjectStore(BUTIK, { keyPath: 'id' });
    };
    beg.onsuccess = () => resolve(beg.result);
    beg.onerror = () => reject(beg.error);
  }).catch(() => null);
}

function allt(db) {
  return new Promise((resolve, reject) => {
    const beg = db.transaction(BUTIK).objectStore(BUTIK).getAll();
    beg.onsuccess = () => resolve(beg.result || []);
    beg.onerror = () => reject(beg.error);
  });
}

function en(db, id) {
  return new Promise((resolve, reject) => {
    const beg = db.transaction(BUTIK).objectStore(BUTIK).get(id);
    beg.onsuccess = () => resolve(beg.result || null);
    beg.onerror = () => reject(beg.error);
  });
}
