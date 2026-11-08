/* Lat laddning av lättaste LOD. Varje WebGL-yta får en egen kopia. */

import { Box3 } from 'three';
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

export { lattasteModell };
