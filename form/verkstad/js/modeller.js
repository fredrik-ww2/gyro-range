/* Lat laddning av lättaste LOD. Varje WebGL-yta får en egen kopia. */

import {
  Box3, CompressedTexture, LinearFilter, LinearMipmapLinearFilter, UnsignedByteType
} from 'three';
import { ZSTDDecoder } from '../../../flyg/vendor/libs/zstddec.module.js';
import { lattasteModell, modellAdress } from './data.js';

const buffertar = new Map();
const perYta = new WeakMap();
let laddare;
let laddareLov;
let parseKo = Promise.resolve();

export function forberedLaddare(renderer) {
  if (!laddareLov) laddareLov = bygg(renderer);
  return laddareLov;
}

async function bygg(renderer) {
  const { GLTFLoader } = await import('../../../js/vendor/loaders/GLTFLoader.js');
  const { DRACOLoader } = await import('../../../flyg/vendor/loaders/DRACOLoader.js');
  const { KTX2Loader } = await import('../../../flyg/vendor/loaders/KTX2Loader.js');
  const { MeshoptDecoder } = await import('../vendor/meshopt_decoder.module.js');
  await MeshoptDecoder.ready;
  const gltf = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath(new URL('../../../flyg/vendor/libs/draco/', import.meta.url).href);
  gltf.setDRACOLoader(draco);
  const ktx2 = new KTX2Loader();
  ktx2.setTranscoderPath(new URL('../../../flyg/vendor/libs/basis/', import.meta.url).href);
  ktx2.detectSupport(renderer);
  const skapa = ktx2._createTexture.bind(ktx2);
  ktx2._createTexture = async (buffer, config) => {
    try {
      return await skapa(buffer, config);
    } catch (fel) {
      if (!/Unsupported vkFormat/.test(fel && fel.message || '')) throw fel;
      return astcTextur(buffer);
    }
  };
  gltf.setKTX2Loader(ktx2);
  gltf.setMeshoptDecoder(MeshoptDecoder);
  laddare = gltf;
  return gltf;
}

function hamtaBuffer(url) {
  if (!buffertar.has(url)) {
    buffertar.set(url, fetch(url).then((svar) => {
      if (!svar.ok) throw new Error('Kunde inte läsa modellen');
      return svar.arrayBuffer();
    }));
  }
  return buffertar.get(url);
}

function tolka(buffer, path) {
  const uppgift = parseKo.then(() => new Promise((resolve, reject) => {
    laddare.parse(buffer.slice(0), path, resolve, (fel) => reject(fel instanceof Error ? fel : new Error('Modellen gick inte att läsa')));
  }));
  parseKo = uppgift.then(() => {}, () => {});
  return uppgift;
}

export async function laddaObjekt(renderer, url) {
  await forberedLaddare(renderer);
  let tabell = perYta.get(renderer);
  if (!tabell) {
    tabell = new Map();
    perYta.set(renderer, tabell);
  }
  if (!tabell.has(url)) {
    tabell.set(url, hamtaBuffer(url).then((buffer) => tolka(buffer, new URL('./', url).href).then((gltf) => {
      const rot = gltf.scene || gltf.scenes?.[0];
      rot.traverse((nod) => {
        const namn = (nod.name || '').toLowerCase();
        if (/effekt|muzzle|mynnings|smoke|flame|gascloud|swastika|hakkors|sigrune|ssrune/.test(namn)) nod.visible = false;
        if (nod.isMesh) {
          nod.frustumCulled = true;
          nod.castShadow = false;
          nod.receiveShadow = false;
          const material = Array.isArray(nod.material) ? nod.material : [nod.material];
          for (const mat of material) if (mat) mat.side = 2;
        }
      });
      return rot;
    })));
  }
  return tabell.get(url);
}

export async function laddaMall(renderer, enhetFil, modell) {
  const url = modellAdress(enhetFil, modell.fil).href;
  return laddaObjekt(renderer, url);
}

export function klonaMall(mall) {
  const kopia = mall.clone(true);
  kopia.traverse((nod) => {
    if (nod.isMesh) nod.frustumCulled = true;
  });
  const box = new Box3().setFromObject(kopia);
  if (Number.isFinite(box.min.y)) kopia.position.y -= box.min.y;
  return kopia;
}

const ASTC = {
  157: [37808, false], 158: [37808, true],
  159: [37809, false], 160: [37809, true],
  161: [37810, false], 162: [37810, true],
  163: [37811, false], 164: [37811, true],
  165: [37812, false], 166: [37812, true],
  167: [37813, false], 168: [37813, true],
  169: [37814, false], 170: [37814, true],
  171: [37815, false], 172: [37815, true],
  173: [37816, false], 174: [37816, true],
  175: [37817, false], 176: [37817, true],
  177: [37818, false], 178: [37818, true],
  179: [37819, false], 180: [37819, true],
  181: [37820, false], 182: [37820, true],
  183: [37821, false], 184: [37821, true]
};

let zstdLov;

function lasU64(vy, offset) {
  return vy.getUint32(offset, true) + vy.getUint32(offset + 4, true) * 4294967296;
}

async function astcTextur(buffer) {
  const vy = new DataView(buffer);
  const signatur = String.fromCharCode(...new Uint8Array(buffer, 0, 4));
  if (signatur !== '«KTX' && vy.getUint8(0) !== 0xab) throw new Error('Inte en KTX2-textur');
  const vk = vy.getUint32(12, true);
  const astc = ASTC[vk];
  if (!astc) throw new Error('Okänt texturformat ' + vk);
  const bredd = vy.getUint32(20, true);
  const hojd = vy.getUint32(24, true);
  const nivaer = vy.getUint32(40, true);
  const packning = vy.getUint32(44, true);
  if (!zstdLov) {
    zstdLov = (async () => {
      const avkodare = new ZSTDDecoder();
      await avkodare.init();
      return avkodare;
    })();
  }
  const zstd = packning === 2 ? await zstdLov : null;
  const mipmaps = [];
  for (let niva = 0; niva < nivaer; niva++) {
    const bas = 80 + niva * 24;
    const start = lasU64(vy, bas);
    const langd = lasU64(vy, bas + 8);
    const okomprimerad = lasU64(vy, bas + 16);
    const komprimerad = new Uint8Array(buffer, start, langd);
    const data = packning === 2 ? zstd.decode(komprimerad, okomprimerad) : komprimerad;
    mipmaps.push({
      data,
      width: Math.max(1, bredd >> niva),
      height: Math.max(1, hojd >> niva)
    });
  }
  const textur = new CompressedTexture(mipmaps, bredd, hojd, astc[0], UnsignedByteType);
  textur.needsUpdate = true;
  textur.generateMipmaps = false;
  textur.minFilter = nivaer > 1 ? LinearMipmapLinearFilter : LinearFilter;
  textur.magFilter = LinearFilter;
  textur.colorSpace = astc[1] ? 'srgb' : 'srgb-linear';
  textur.flipY = false;
  return textur;
}

export { lattasteModell };
