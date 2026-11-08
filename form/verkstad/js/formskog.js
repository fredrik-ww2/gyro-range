/* Skog till en sparad FORM-värld.
   Platserna kommer från satellitbyggarens trädkarta (samma frö, täthet och trädtyp).
   Nära kameran står träden i 3D. Längre bort är de impostors.
   Varje ruta är en instansgrupp som frustum-cullas. Tre texturer räcker. */

import {
  BufferAttribute, BufferGeometry, Color, CylinderGeometry, DoubleSide, InstancedMesh,
  LinearFilter, LinearMipmapLinearFilter, MeshBasicMaterial, MeshStandardMaterial,
  Object3D, PlaneGeometry, RepeatWrapping, Texture
} from 'three';
import { hojdPa } from './formvarld.js';
import { o as byggTradkarta } from '../../_next/static/chunks/analysis-CmgwIY0R.js';

const RUTA = 110;
const CELL = 32;
const NARA_MAX = { high: 140, mobile: 75 };
const IMPOSTOR_URL = new URL('../../satellite/forest-impostors-v3.webp', import.meta.url);
const LOV_URL = new URL('../../satellite/foliage-v2.webp', import.meta.url);
const BARK_URL = new URL('../../satellite/bark_albedo.jpg', import.meta.url);

export async function byggFormSkog(post) {
  const karta = byggTradkarta(post.analysis, post.settings);
  const trad = karta.trees.map((postTrad, id) => ({
    id,
    x: postTrad.x,
    z: postTrad.z,
    height: postTrad.height,
    radius: postTrad.radius,
    variant: postTrad.variant,
    rotation: postTrad.rotation,
    farg: postTrad.color || null,
    basY: hojdPa(postTrad.x, postTrad.z, post.settings),
    y: 0,
    centerY: 0,
    art: postTrad.variant < 3 ? 0 : 1,
    index: 0,
    mesh: null,
    dold: false
  }));
  const [impostorBild, lovBild, barkBild] = await Promise.all([
    laddaBild(IMPOSTOR_URL),
    laddaBild(LOV_URL),
    laddaBild(BARK_URL)
  ]);
  const snittFjarr = kronSnitt(impostorBild);
  const snittNara = kronSnitt(lovBild);
  for (const rad of trad) {
    rad.fargFjarr = nyans(rad.farg, snittFjarr[rad.art]);
    rad.fargNara = nyans(rad.farg, snittNara[rad.art]);
  }

  const impostorTex = texturAv(impostorBild);
  const lovTex = texturAv(lovBild);
  const barkTex = texturAv(barkBild, true);
  barkTex.repeat.set(2, 3);
  const matFjarr = new MeshBasicMaterial({
    map: impostorTex,
    alphaTest: 0.4,
    side: DoubleSide,
    toneMapped: false,
    fog: false
  });
  const matLov = new MeshStandardMaterial({
    map: lovTex,
    alphaTest: 0.4,
    side: DoubleSide,
    roughness: 1,
    metalness: 0
  });
  const matBark = new MeshStandardMaterial({
    map: barkTex,
    color: 0x9b9a85,
    roughness: 1,
    metalness: 0
  });
  const geoFjarr = [impostorGeo(true), impostorGeo(false)];
  const geoNara = [naraGeo(true), naraGeo(false)];
  for (const geo of [...geoFjarr, ...geoNara.flat()]) geo.computeBoundingSphere();

  const rutor = byggRutor(trad);
  const meshar = [];
  const mall = new Object3D();
  const farg = new Color();
  for (const ruta of rutor) {
    for (const art of [0, 1]) {
      const lista = art === 0 ? ruta.barr : ruta.lov;
      if (!lista.length) continue;
      const mesh = new InstancedMesh(geoFjarr[art], matFjarr, lista.length);
      mesh.name = art === 0 ? 'Impostor barr' : 'Impostor löv';
      mesh.position.set(ruta.cx, 0, ruta.cz);
      mesh.frustumCulled = true;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.userData.ruta = ruta.nyckel;
      lista.forEach((rad, index) => {
        rad.index = index;
        rad.mesh = mesh;
        farg.fromArray(rad.fargFjarr);
        mesh.setColorAt(index, farg);
      });
      mesh.instanceColor.needsUpdate = true;
      meshar.push(mesh);
    }
  }

  const naraMesh = [0, 1].map((art) => {
    const tak = NARA_MAX.high;
    const stam = new InstancedMesh(geoNara[art][0], matBark, tak);
    const krona = new InstancedMesh(geoNara[art][1], matLov, tak);
    stam.name = art === 0 ? 'Barrstam nära' : 'Lövstam nära';
    krona.name = art === 0 ? 'Barrkrona nära' : 'Lövkrona nära';
    for (const mesh of [stam, krona]) {
      mesh.count = 0;
      mesh.visible = false;
      mesh.frustumCulled = true;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    }
    return { stam, krona };
  });

  const grupp = new Object3D();
  grupp.name = 'FORM-skog';
  grupp.add(...meshar, ...naraMesh.flatMap((par) => [par.stam, par.krona]));

  const celler = new Map();
  for (const rad of trad) {
    const nyckel = Math.floor(rad.x / CELL) + ',' + Math.floor(rad.z / CELL);
    const lista = celler.get(nyckel);
    if (lista) lista.push(rad);
    else celler.set(nyckel, [rad]);
  }
  const naraRadie = Math.max(38, karta.width * 0.12);
  const naraTak = NARA_MAX[post.settings.detail] || NARA_MAX.mobile;
  let senX = Infinity;
  let senY = Infinity;
  let senZ = Infinity;
  let senSign = '';
  let minCenter = Infinity;
  let maxCenter = -Infinity;
  const smuts = new Set();

  function tillampaHojd(faktor, medel) {
    smuts.clear();
    minCenter = Infinity;
    maxCenter = -Infinity;
    for (const rad of trad) {
      rad.y = medel + (rad.basY - medel) * faktor;
      rad.centerY = rad.y + rad.height * 0.65;
      if (rad.centerY < minCenter) minCenter = rad.centerY;
      if (rad.centerY > maxCenter) maxCenter = rad.centerY;
      skrivImpostor(rad, mall);
      smuts.add(rad.mesh);
    }
    for (const mesh of smuts) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
    if (senSign) fyllNara(senSign.split(',').filter(Boolean).map(Number));
  }

  function uppdatera(kamera, tvinga = false) {
    const p = kamera.position;
    const flytt = (p.x - senX) ** 2 + (p.y - senY) ** 2 + (p.z - senZ) ** 2;
    if (!tvinga && flytt < 2.25) return;
    senX = p.x;
    senY = p.y;
    senZ = p.z;
    const valda = narmaste(p);
    const sign = valda.join(',');
    if (!tvinga && sign === senSign) return;
    const förut = new Set(senSign ? senSign.split(',').filter(Boolean).map(Number) : []);
    const nu = new Set(valda);
    smuts.clear();
    for (const id of förut) {
      if (nu.has(id)) continue;
      const rad = trad[id];
      rad.dold = false;
      skrivImpostor(rad, mall);
      smuts.add(rad.mesh);
    }
    for (const id of nu) {
      if (förut.has(id) && !tvinga) continue;
      const rad = trad[id];
      rad.dold = true;
      skrivImpostor(rad, mall);
      smuts.add(rad.mesh);
    }
    for (const mesh of smuts) mesh.instanceMatrix.needsUpdate = true;
    senSign = sign;
    fyllNara(valda);
    api.nara = valda.length;
  }

  function narmaste(p) {
    if (!trad.length || p.y < minCenter - naraRadie || p.y > maxCenter + naraRadie) return [];
    const x0 = Math.floor((p.x - naraRadie) / CELL);
    const x1 = Math.floor((p.x + naraRadie) / CELL);
    const z0 = Math.floor((p.z - naraRadie) / CELL);
    const z1 = Math.floor((p.z + naraRadie) / CELL);
    const traff = [];
    const grans = naraRadie * naraRadie;
    for (let iz = z0; iz <= z1; iz += 1) {
      for (let ix = x0; ix <= x1; ix += 1) {
        const lista = celler.get(ix + ',' + iz);
        if (!lista) continue;
        for (const rad of lista) {
          const d2 = (rad.x - p.x) ** 2 + (rad.z - p.z) ** 2 + (rad.centerY - p.y) ** 2;
          if (d2 < grans) traff.push({ id: rad.id, d2 });
        }
      }
    }
    traff.sort((a, b) => a.d2 - b.d2 || a.id - b.id);
    return traff.slice(0, naraTak).map((postRad) => postRad.id);
  }

  function fyllNara(valda) {
    const perArt = [[], []];
    for (const id of valda) perArt[trad[id].art].push(trad[id]);
    for (const art of [0, 1]) {
      const { stam, krona } = naraMesh[art];
      const lista = perArt[art];
      stam.count = lista.length;
      krona.count = lista.length;
      stam.visible = lista.length > 0;
      krona.visible = lista.length > 0;
      for (let i = 0; i < lista.length; i += 1) {
        const rad = lista[i];
        mall.position.set(rad.x, rad.y, rad.z);
        mall.scale.set(rad.radius / 0.25, rad.height, rad.radius / 0.25);
        mall.rotation.set(0, rad.rotation, 0);
        mall.updateMatrix();
        stam.setMatrixAt(i, mall.matrix);
        krona.setMatrixAt(i, mall.matrix);
        farg.fromArray(rad.fargNara);
        stam.setColorAt(i, farg);
        krona.setColorAt(i, farg);
      }
      if (lista.length) {
        stam.instanceMatrix.needsUpdate = true;
        krona.instanceMatrix.needsUpdate = true;
        stam.instanceColor.needsUpdate = true;
        krona.instanceColor.needsUpdate = true;
        stam.computeBoundingSphere();
        krona.computeBoundingSphere();
      }
    }
  }

  const api = {
    grupp,
    antal: trad.length,
    meshar: meshar.length,
    texturer: 3,
    nara: 0,
    tillampaHojd,
    uppdatera
  };
  tillampaHojd(1, 0);
  return api;
}

function skrivImpostor(rad, mall) {
  const ruta = rad.mesh;
  mall.position.set(rad.x - ruta.position.x, rad.y, rad.z - ruta.position.z);
  if (rad.dold) mall.scale.set(0, 0, 0);
  else mall.scale.set(rad.radius / 0.25, rad.height, rad.radius / 0.25);
  mall.rotation.set(0, rad.rotation, 0);
  mall.updateMatrix();
  ruta.setMatrixAt(rad.index, mall.matrix);
}

function byggRutor(trad) {
  const rutor = new Map();
  for (const rad of trad) {
    const ix = Math.floor(rad.x / RUTA);
    const iz = Math.floor(rad.z / RUTA);
    const nyckel = ix + ':' + iz;
    let ruta = rutor.get(nyckel);
    if (!ruta) {
      ruta = { nyckel, cx: (ix + 0.5) * RUTA, cz: (iz + 0.5) * RUTA, barr: [], lov: [] };
      rutor.set(nyckel, ruta);
    }
    (rad.art === 0 ? ruta.barr : ruta.lov).push(rad);
  }
  return [...rutor.values()];
}

function impostorGeo(barr) {
  const u0 = barr ? 0.002 : 0.502;
  const bredd = barr ? 0.88 : 0.68;
  const delar = [
    sida(bredd, 0, u0),
    sida(bredd, Math.PI / 2, u0),
    krona(barr)
  ];
  return slåIhop(delar);
}

function sida(bredd, rotY, u0) {
  const geo = new PlaneGeometry(bredd, 1);
  geo.translate(0, 0.5, 0);
  geo.rotateY(rotY);
  stämpla(geo, u0, 0.496, 0.502, 0.496);
  return geo;
}

function krona(barr) {
  const u0 = barr ? 0 : 0.5;
  const topp = barr ? 0.98 : 0.91;
  const ring = barr ? 0.43 : 0.64;
  const pos = [];
  const uv = [];
  const norm = [];
  const steg = 8;
  for (let i = 0; i < steg; i += 1) {
    const a0 = (i / steg) * Math.PI * 2;
    const a1 = ((i + 1) / steg) * Math.PI * 2;
    const r = 0.24;
    pos.push(0, topp, 0, Math.cos(a1) * r, ring, Math.sin(a1) * r, Math.cos(a0) * r, ring, Math.sin(a0) * r);
    uv.push(
      u0 + 0.25, 0.25,
      u0 + 0.25 + Math.cos(a1) * 0.246, 0.25 - Math.sin(a1) * 0.246,
      u0 + 0.25 + Math.cos(a0) * 0.246, 0.25 - Math.sin(a0) * 0.246
    );
    norm.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  geo.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
  geo.setAttribute('normal', new BufferAttribute(new Float32Array(norm), 3));
  return geo;
}

function naraGeo(barr) {
  const stamH = barr ? 0.36 : 0.5;
  const stam = new CylinderGeometry(barr ? 0.012 : 0.015, barr ? 0.024 : 0.02, stamH, 5, 1, true);
  stam.translate(0, stamH / 2, 0);
  const u0 = barr ? 0.006 : 0.506;
  const nivaer = barr
    ? [[0.28, 0.5, 0.28], [0.48, 0.36, 0.26], [0.66, 0.24, 0.22], [0.82, 0.14, 0.18]]
    : [[0.46, 0.52, 0.36], [0.62, 0.4, 0.32], [0.76, 0.26, 0.24]];
  const kort = [];
  for (const [y, bredd, hojd] of nivaer) {
    const vinklar = barr ? [0, Math.PI / 2] : [0, Math.PI / 3, (Math.PI * 2) / 3];
    for (const vinkel of vinklar) {
      const geo = new PlaneGeometry(bredd, hojd);
      geo.translate(0, y + hojd * 0.35, 0);
      geo.rotateY(vinkel);
      stämpla(geo, u0, 0.488, 0.02, 0.96);
      kort.push(geo);
    }
  }
  return [stam, slåIhop(kort)];
}

function stämpla(geo, u0, uSkala, v0, vSkala) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i += 1) uv.setXY(i, u0 + uv.getX(i) * uSkala, v0 + uv.getY(i) * vSkala);
}

function slåIhop(lista) {
  const delar = lista.map((geo) => {
    if (!geo.index) return geo;
    const platt = geo.toNonIndexed();
    geo.dispose();
    return platt;
  });
  let antal = 0;
  for (const geo of delar) antal += geo.attributes.position.count;
  const pos = new Float32Array(antal * 3);
  const uv = new Float32Array(antal * 2);
  const norm = new Float32Array(antal * 3);
  let offset = 0;
  for (const geo of delar) {
    const p = geo.attributes.position;
    pos.set(p.array.subarray(0, p.count * 3), offset * 3);
    uv.set(geo.attributes.uv.array.subarray(0, geo.attributes.uv.count * 2), offset * 2);
    norm.set(geo.attributes.normal.array.subarray(0, geo.attributes.normal.count * 3), offset * 3);
    offset += p.count;
    geo.dispose();
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('uv', new BufferAttribute(uv, 2));
  geo.setAttribute('normal', new BufferAttribute(norm, 3));
  return geo;
}

function nyans(farg, snitt) {
  if (!farg || !snitt) return [0.8, 0.88, 0.78];
  return [0, 1, 2].map((kanal) => klamp(linjar(farg[kanal]) / snitt[kanal], 0.2, 1.7));
}

function kronSnitt(bild) {
  const duk = document.createElement('canvas');
  duk.width = 256;
  duk.height = 256;
  const rit = duk.getContext('2d', { willReadFrequently: true });
  rit.drawImage(bild, 0, 0, 256, 256);
  const data = rit.getImageData(0, 0, 256, 256).data;
  const summa = [[0, 0, 0], [0, 0, 0]];
  const antal = [0, 0];
  for (let y = 0; y < 256; y += 1) {
    for (let x = 0; x < 256; x += 1) {
      const i = (y * 256 + x) * 4;
      if (data[i + 3] < 180) continue;
      const sida = x < 128 ? 0 : 1;
      antal[sida] += 1;
      for (let kanal = 0; kanal < 3; kanal += 1) summa[sida][kanal] += linjar(data[i + kanal] / 255);
    }
  }
  return summa.map((rad, sida) => rad.map((varde) => Math.max(0.008, varde / Math.max(1, antal[sida]))));
}

function linjar(c) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function klamp(tal, min, max) {
  return Math.max(min, Math.min(max, tal));
}

function texturAv(bild, upprepa) {
  const tex = new Texture(bild);
  tex.colorSpace = 'srgb';
  tex.anisotropy = 4;
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  if (upprepa) tex.wrapS = tex.wrapT = RepeatWrapping;
  return tex;
}

function laddaBild(url) {
  const bild = new Image();
  bild.src = url.href;
  return bild.decode().then(() => bild);
}
