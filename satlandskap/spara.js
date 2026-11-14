/* Sparar landskapet motoroberoende: glTF/GLB och JSON, meter, Y upp.
   GLB:n är mobilvarianten: grov mark, enkel trädform en gång per art,
   instanser som noder, väg och kollision. De riktiga trädarterna
   pekas ut i JSON så ett spel kan byta in bibliotekets modeller. */

const NYCKEL = 'satlandskap-bibliotek';

export function formateraStorlek(byte) {
  if (!Number.isFinite(byte) || byte < 0) return '–';
  if (byte < 900) return `${Math.round(byte)} B`;
  if (byte < 900 * 1024) {
    const kb = byte / 1024;
    const tal = kb < 10 ? kb.toFixed(1) : String(Math.round(kb));
    return `${tal.replace('.', ',')} kB`;
  }
  const mb = byte / (1024 * 1024);
  const tal = mb < 10 ? mb.toFixed(1) : String(Math.round(mb));
  return `${tal.replace('.', ',')} MB`;
}

function runda(v, n = 2) {
  const f = 10 ** n;
  return Math.round(v * f) / f;
}

function hojdfalt(t, steg) {
  const kolumner = Math.max(2, Math.round(t.breddMeter / steg) + 1);
  const rader = Math.max(2, Math.round(t.djupMeter / steg) + 1);
  const hojder = [];
  for (let iz = 0; iz < rader; iz++) {
    const z = -t.djupMeter / 2 + (iz / (rader - 1)) * t.djupMeter;
    for (let ix = 0; ix < kolumner; ix++) {
      const x = -t.breddMeter / 2 + (ix / (kolumner - 1)) * t.breddMeter;
      hojder.push(runda(hojdAv(t, x, z), 2));
    }
  }
  return { stegMeter: steg, kolumner, rader, hojder };
}

function hojdAv(t, x, z) {
  const n = t.installningar;
  const r = (n.hojdFro ?? n.fro) * 0.37;
  const i = n.breddMeter;
  return n.relief * (
    Math.sin(x / (i * 0.3) + r) * 0.35 +
    Math.cos(z / (i * 0.27) - r) * 0.32 +
    Math.sin((x + z) / (i * 0.11) + r) * 0.13 +
    Math.sin(x * 0.43 + Math.cos(z * 0.35)) * Math.cos(z * 0.39) * 0.045
  );
}

export function byggJson(t, val) {
  const falt = hojdfalt(t, 4);
  return {
    version: 1,
    format: 'satlandskap',
    enhet: 'meter',
    axel: 'Y-upp',
    namn: val.namn,
    mapp: val.mapp,
    skapad: new Date().toISOString(),
    bild: {
      breddMeter: runda(t.breddMeter, 1),
      djupMeter: runda(t.djupMeter, 1),
      avtryck: t.avtryck
    },
    vagtextur: val.vagtextur,
    trad: t.trad.map((trad) => ({
      art: trad.art,
      x: runda(trad.x, 2),
      y: runda(trad.y, 2),
      z: runda(trad.z, 2),
      hojd: runda(trad.hojd * trad.skala, 2),
      radie: runda(trad.radie, 2),
      rotation: runda(trad.rotation, 3),
      modell: modellSokvag(trad.art)
    })),
    vagar: t.vagar.map((vag) => ({
      slag: vag.slag,
      breddMeter: vag.breddMeter,
      punkter: vag.punkter.map((p) => [runda(p.x, 2), runda(p.y, 2), runda(p.z, 2)])
    })),
    byggnader: t.byggnader.map((hus) => ({
      x: runda(hus.x, 2),
      y: runda(hojdAv(t, hus.x, hus.z), 2),
      z: runda(hus.z, 2),
      breddMeter: runda(hus.breddMeter, 2),
      djupMeter: runda(hus.djupMeter, 2),
      hojdMeter: hus.hojdMeter,
      vinkel: runda(hus.vinkel, 3),
      tak: hus.tak
    })),
    kollision: {
      mark: falt,
      trad: t.trad.map((trad) => ({
        x: runda(trad.x, 2),
        y: runda(trad.y, 2),
        z: runda(trad.z, 2),
        radie: runda(Math.max(0.28, trad.stamp || 0.35), 2),
        hojd: runda(trad.hojd * trad.skala, 2)
      })),
      byggnader: t.byggnader.map((hus) => ({
        x: runda(hus.x, 2),
        y: runda(hojdAv(t, hus.x, hus.z), 2),
        z: runda(hus.z, 2),
        breddMeter: runda(hus.breddMeter, 2),
        djupMeter: runda(hus.djupMeter, 2),
        hojdMeter: hus.hojdMeter,
        vinkel: runda(hus.vinkel, 3)
      }))
    },
    modeller: {
      gran: 'form/satellite/forest-impostors-v3.webp',
      ek: 'panorama/modeller/trad_ek_b.glb',
      bok: 'panorama/modeller/trad_bok_c.glb',
      apel: 'panorama/modeller/trad_apple_c.glb'
    }
  };
}

function modellSokvag(art) {
  if (art === 'ek') return 'panorama/modeller/trad_ek_b.glb';
  if (art === 'bok') return 'panorama/modeller/trad_bok_c.glb';
  if (art === 'apel') return 'panorama/modeller/trad_apple_c.glb';
  return 'form/satellite/forest-impostors-v3.webp';
}

function markRutnat(t) {
  const kol = 40;
  const rad = Math.max(8, Math.round(kol * t.djupMeter / t.breddMeter));
  const pos = [];
  const uv = [];
  const norm = [];
  const idx = [];
  const hojd = (ix, iz) => {
    const x = -t.breddMeter / 2 + (ix / kol) * t.breddMeter;
    const z = -t.djupMeter / 2 + (iz / rad) * t.djupMeter;
    return { x, y: hojdAv(t, x, z), z };
  };
  for (let iz = 0; iz <= rad; iz++) {
    for (let ix = 0; ix <= kol; ix++) {
      const p = hojd(ix, iz);
      pos.push(p.x, p.y, p.z);
      uv.push(ix / kol, 1 - iz / rad);
      const vx = hojd(Math.min(kol, ix + 1), iz);
      const vz = hojd(ix, Math.min(rad, iz + 1));
      let nx = (p.y - vx.y);
      let nz = (p.y - vz.y);
      const ny = (t.breddMeter / kol);
      const len = Math.hypot(nx, ny, nz) || 1;
      norm.push(nx / len, ny / len, nz / len);
    }
  }
  const steg = kol + 1;
  for (let iz = 0; iz < rad; iz++) {
    for (let ix = 0; ix < kol; ix++) {
      const a = iz * steg + ix;
      idx.push(a, a + steg, a + 1, a + 1, a + steg, a + steg + 1);
    }
  }
  return { pos, norm, uv, idx };
}

function cylinder() {
  const n = 7;
  const pos = [];
  const norm = [];
  const idx = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = Math.cos(a);
    const z = Math.sin(a);
    pos.push(x, 0, z, x, 1, z);
    norm.push(x, 0, z, x, 0, z);
  }
  for (let i = 0; i < n; i++) {
    const i0 = i * 2;
    const j0 = ((i + 1) % n) * 2;
    idx.push(i0, j0, i0 + 1, i0 + 1, j0, j0 + 1);
  }
  return { pos, norm, idx };
}

function krona(barr) {
  const pos = [];
  const norm = [];
  const idx = [];
  const n = barr ? 6 : 7;
  const radie = barr ? 0.22 : 0.34;
  const topp = 1;
  const bas = barr ? 0.28 : 0.38;
  pos.push(0, topp, 0);
  norm.push(0, 1, 0);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pos.push(Math.cos(a) * radie, bas, Math.sin(a) * radie);
    norm.push(Math.cos(a), 0.25, Math.sin(a));
  }
  for (let i = 0; i < n; i++) idx.push(0, 1 + ((i + 1) % n), 1 + i);
  if (!barr) {
    const mitt = pos.length / 3;
    pos.push(0, bas * 0.85, 0);
    norm.push(0, -1, 0);
    for (let i = 0; i < n; i++) idx.push(mitt, 1 + i, 1 + ((i + 1) % n));
  }
  return { pos, norm, idx };
}

function vagRemsa(vagar) {
  const pos = [];
  const norm = [];
  const uv = [];
  const idx = [];
  for (const vag of vagar) {
    const punkter = [];
    for (const p of vag.punkter) {
      const sist = punkter[punkter.length - 1];
      if (sist && Math.hypot(p.x - sist.x, p.z - sist.z) < 0.8) continue;
      punkter.push(p);
    }
    if (punkter.length < 2) continue;
    const bas = pos.length / 3;
    let vand = 0;
    const halv = vag.breddMeter / 2;
    for (let i = 0; i < punkter.length; i++) {
      const p = punkter[i];
      const a = punkter[Math.max(0, i - 1)];
      const b = punkter[Math.min(punkter.length - 1, i + 1)];
      let dx = b.x - a.x;
      let dz = b.z - a.z;
      const len = Math.hypot(dx, dz) || 1;
      dx /= len;
      dz /= len;
      if (i) vand += Math.hypot(p.x - punkter[i - 1].x, p.z - punkter[i - 1].z);
      pos.push(p.x - dz * halv, p.y + 0.08, p.z + dx * halv);
      pos.push(p.x + dz * halv, p.y + 0.08, p.z - dx * halv);
      norm.push(0, 1, 0, 0, 1, 0);
      uv.push(0, vand / 8, 1, vand / 8);
    }
    const antal = punkter.length;
    for (let i = 0; i < antal - 1; i++) {
      const k = bas + i * 2;
      idx.push(k, k + 1, k + 2, k + 2, k + 1, k + 3);
    }
  }
  return { pos, norm, uv, idx };
}

function artFarg(art) {
  if (art === 'gran') return [0.16, 0.32, 0.16, 1];
  if (art === 'bok') return [0.3, 0.42, 0.16, 1];
  if (art === 'apel') return [0.34, 0.4, 0.18, 1];
  return [0.22, 0.38, 0.14, 1];
}

function minMax(arr, steg) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < arr.length; i += steg) {
    for (let k = 0; k < steg; k++) {
      const v = arr[i + k];
      if (v < min[k]) min[k] = v;
      if (v > max[k]) max[k] = v;
    }
  }
  return { min, max };
}

export function byggGlb(t, jpeg) {
  const mark = markRutnat(t);
  const vag = vagRemsa(t.vagar);
  const stam = cylinder();
  const arter = ['gran', 'ek', 'bok', 'apel'];
  const kronor = Object.fromEntries(arter.map((art) => [art, krona(art === 'gran')]));
  const delar = [];
  function lagg(arr, typ) {
    const bytes = typ === 'u16'
      ? new Uint8Array(new Uint16Array(arr).buffer)
      : new Uint8Array(new Float32Array(arr).buffer);
    const offset = delar.reduce((s, d) => s + d.bytes.byteLength, 0);
    const padded = (bytes.byteLength + 3) & ~3;
    const ut = new Uint8Array(padded);
    ut.set(bytes);
    delar.push({ bytes: ut, offset, length: bytes.byteLength, typ });
    return delar.length - 1;
  }
  const id = {
    markP: lagg(mark.pos, 'f32'),
    markN: lagg(mark.norm, 'f32'),
    markU: lagg(mark.uv, 'f32'),
    markI: lagg(mark.idx, 'u16'),
    stamP: lagg(stam.pos, 'f32'),
    stamN: lagg(stam.norm, 'f32'),
    stamI: lagg(stam.idx, 'u16')
  };
  for (const art of arter) {
    id[art + 'P'] = lagg(kronor[art].pos, 'f32');
    id[art + 'N'] = lagg(kronor[art].norm, 'f32');
    id[art + 'I'] = lagg(kronor[art].idx, 'u16');
  }
  let vagId = null;
  if (vag.idx.length) {
    vagId = {
      p: lagg(vag.pos, 'f32'),
      n: lagg(vag.norm, 'f32'),
      u: lagg(vag.uv, 'f32'),
      i: lagg(vag.idx, 'u16')
    };
  }
  const jpegStart = delar.reduce((s, d) => s + d.bytes.byteLength, 0);
  const jpegPad = new Uint8Array((jpeg.byteLength + 3) & ~3);
  jpegPad.set(jpeg);
  const binLength = jpegStart + jpegPad.byteLength;
  const bin = new Uint8Array(binLength);
  let skriv = 0;
  for (const del of delar) {
    bin.set(del.bytes, skriv);
    skriv += del.bytes.byteLength;
  }
  bin.set(jpegPad, skriv);

  const bufferViews = delar.map((del) => ({
    buffer: 0,
    byteOffset: del.offset,
    byteLength: del.length,
    target: del.typ === 'u16' ? 34963 : 34962
  }));
  bufferViews.push({
    buffer: 0,
    byteOffset: jpegStart,
    byteLength: jpeg.byteLength
  });
  const jpegView = bufferViews.length - 1;

  function accPos(delIndex, count) {
    const arr = delIndex === id.markP ? mark.pos
      : delIndex === id.stamP ? stam.pos
        : delIndex === id.granP ? kronor.gran.pos
          : delIndex === id.ekP ? kronor.ek.pos
            : delIndex === id.bokP ? kronor.bok.pos
              : delIndex === id.apelP ? kronor.apel.pos
                : vag.pos;
    const mm = minMax(arr, 3);
    return {
      bufferView: delIndex,
      componentType: 5126,
      count,
      type: 'VEC3',
      min: mm.min,
      max: mm.max
    };
  }
  function accNorm(delIndex, count) {
    return { bufferView: delIndex, componentType: 5126, count, type: 'VEC3' };
  }
  function accUv(delIndex, count) {
    return { bufferView: delIndex, componentType: 5126, count, type: 'VEC2' };
  }
  function accIdx(delIndex, count) {
    return { bufferView: delIndex, componentType: 5123, count, type: 'SCALAR' };
  }

  const accessors = [];
  function push(a) {
    accessors.push(a);
    return accessors.length - 1;
  }
  const aMarkP = push(accPos(id.markP, mark.pos.length / 3));
  const aMarkN = push(accNorm(id.markN, mark.norm.length / 3));
  const aMarkU = push(accUv(id.markU, mark.uv.length / 2));
  const aMarkI = push(accIdx(id.markI, mark.idx.length));
  const aStamP = push(accPos(id.stamP, stam.pos.length / 3));
  const aStamN = push(accNorm(id.stamN, stam.norm.length / 3));
  const aStamI = push(accIdx(id.stamI, stam.idx.length));
  const aKrona = {};
  for (const art of arter) {
    aKrona[art] = {
      p: push(accPos(id[art + 'P'], kronor[art].pos.length / 3)),
      n: push(accNorm(id[art + 'N'], kronor[art].norm.length / 3)),
      i: push(accIdx(id[art + 'I'], kronor[art].idx.length))
    };
  }
  let aVag = null;
  if (vagId) {
    aVag = {
      p: push(accPos(vagId.p, vag.pos.length / 3)),
      n: push(accNorm(vagId.n, vag.norm.length / 3)),
      u: push(accUv(vagId.u, vag.uv.length / 2)),
      i: push(accIdx(vagId.i, vag.idx.length))
    };
  }

  const materials = [
    { name: 'Mark', pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicFactor: 0, roughnessFactor: 1 } },
    { name: 'Stam', pbrMetallicRoughness: { baseColorFactor: [0.36, 0.26, 0.16, 1], metallicFactor: 0, roughnessFactor: 1 } },
    { name: 'Vag', pbrMetallicRoughness: { baseColorFactor: [0.45, 0.42, 0.38, 1], metallicFactor: 0, roughnessFactor: 1 } }
  ];
  for (const art of arter) {
    materials.push({
      name: art,
      pbrMetallicRoughness: { baseColorFactor: artFarg(art), metallicFactor: 0, roughnessFactor: 1 },
      doubleSided: true
    });
  }
  const matKoll = materials.length;
  materials.push({
    name: 'Kollision',
    pbrMetallicRoughness: { baseColorFactor: [0.2, 0.65, 0.85, 0.35], metallicFactor: 0, roughnessFactor: 1 },
    alphaMode: 'BLEND',
    doubleSided: true
  });

  const meshes = [
    {
      name: 'Mark',
      primitives: [{
        attributes: { POSITION: aMarkP, NORMAL: aMarkN, TEXCOORD_0: aMarkU },
        indices: aMarkI,
        material: 0
      }]
    }
  ];
  const meshArt = {};
  for (const art of arter) {
    meshArt[art] = meshes.length;
    meshes.push({
      name: art,
      primitives: [
        { attributes: { POSITION: aStamP, NORMAL: aStamN }, indices: aStamI, material: 1 },
        { attributes: { POSITION: aKrona[art].p, NORMAL: aKrona[art].n }, indices: aKrona[art].i, material: 3 + arter.indexOf(art) }
      ]
    });
  }
  let meshVag = null;
  if (aVag) {
    meshVag = meshes.length;
    meshes.push({
      name: 'Vag',
      primitives: [{
        attributes: { POSITION: aVag.p, NORMAL: aVag.n, TEXCOORD_0: aVag.u },
        indices: aVag.i,
        material: 2
      }]
    });
  }
  const meshKollMark = meshes.length;
  meshes.push({
    name: 'KollisionMark',
    primitives: [{
      attributes: { POSITION: aMarkP, NORMAL: aMarkN },
      indices: aMarkI,
      material: matKoll
    }]
  });
  const meshKollTrad = meshes.length;
  meshes.push({
    name: 'KollisionTrad',
    primitives: [{
      attributes: { POSITION: aStamP, NORMAL: aStamN },
      indices: aStamI,
      material: matKoll
    }]
  });

  const nodes = [{ name: 'Mark', mesh: 0 }];
  if (meshVag != null) nodes.push({ name: 'Vag', mesh: meshVag });
  for (const trad of t.trad) {
    const s = trad.hojd * trad.skala;
    const halv = trad.rotation / 2;
    nodes.push({
      name: trad.art,
      mesh: meshArt[trad.art],
      translation: [runda(trad.x, 3), runda(trad.y, 3), runda(trad.z, 3)],
      rotation: [0, runda(Math.sin(halv), 5), 0, runda(Math.cos(halv), 5)],
      scale: [runda(s, 3), runda(s, 3), runda(s, 3)]
    });
  }
  const kollBarn = [nodes.length];
  nodes.push({ name: 'KollisionMark', mesh: meshKollMark, extras: { kollision: 'mark' } });
  for (const trad of t.trad) {
    const hojd = trad.hojd * trad.skala;
    const radie = Math.max(0.28, trad.stamp || 0.35);
    kollBarn.push(nodes.length);
    nodes.push({
      name: 'KollisionTrad',
      mesh: meshKollTrad,
      extras: { kollision: 'trad' },
      translation: [runda(trad.x, 3), runda(trad.y, 3), runda(trad.z, 3)],
      scale: [runda(radie, 3), runda(hojd, 3), runda(radie, 3)]
    });
  }
  for (const hus of t.byggnader) {
    kollBarn.push(nodes.length);
    nodes.push({
      name: 'KollisionHus',
      mesh: meshKollTrad,
      extras: { kollision: 'byggnad' },
      translation: [runda(hus.x, 3), runda(hojdAv(t, hus.x, hus.z), 3), runda(hus.z, 3)],
      rotation: [0, runda(Math.sin(hus.vinkel / 2), 5), 0, runda(Math.cos(hus.vinkel / 2), 5)],
      scale: [runda(hus.breddMeter / 2, 3), hus.hojdMeter, runda(hus.djupMeter / 2, 3)]
    });
  }
  const kollRot = nodes.length;
  nodes.push({ name: 'Kollision', children: kollBarn, extras: { kollision: true } });

  const gltf = {
    asset: { version: '2.0', generator: 'satlandskap' },
    scene: 0,
    scenes: [{ name: valNamn(t), nodes: nodes.map((_, i) => i).filter((i) => i < kollRot && nodes[i].name !== 'KollisionTrad' && nodes[i].name !== 'KollisionMark' && nodes[i].name !== 'KollisionHus').concat([kollRot]) }],
    nodes,
    meshes,
    materials,
    accessors,
    bufferViews,
    buffers: [{ byteLength: binLength }],
    textures: [{ sampler: 0, source: 0 }],
    images: [{ bufferView: jpegView, mimeType: 'image/jpeg' }],
    samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }]
  };
  /* Scenens nodlista blev krånglig. Bygg den rent. */
  const synliga = [];
  nodes.forEach((nod, i) => {
    if (nod.name === 'Kollision' || nod.name.startsWith('Kollision')) return;
    synliga.push(i);
  });
  synliga.push(kollRot);
  gltf.scenes[0].nodes = synliga;
  gltf.scenes[0].name = 'landskap';

  const jsonText = JSON.stringify(gltf);
  const jsonBytes = new TextEncoder().encode(jsonText);
  const jsonPad = (4 - (jsonBytes.length % 4)) % 4;
  const jsonChunk = new Uint8Array(jsonBytes.length + jsonPad);
  jsonChunk.set(jsonBytes);
  jsonChunk.fill(0x20, jsonBytes.length);
  const total = 12 + 8 + jsonChunk.length + 8 + bin.length;
  const ut = new Uint8Array(total);
  const dv = new DataView(ut.buffer);
  dv.setUint32(0, 0x46546c67, true);
  dv.setUint32(4, 2, true);
  dv.setUint32(8, total, true);
  dv.setUint32(12, jsonChunk.length, true);
  dv.setUint32(16, 0x4e4f534a, true);
  ut.set(jsonChunk, 20);
  const binAt = 20 + jsonChunk.length;
  dv.setUint32(binAt, bin.length, true);
  dv.setUint32(binAt + 4, 0x004e4942, true);
  ut.set(bin, binAt + 8);
  return ut;
}

function valNamn() {
  return 'landskap';
}

export function lasBibliotek() {
  try {
    const lista = JSON.parse(localStorage.getItem(NYCKEL) || '[]');
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

export function sparaIBibliotek(post) {
  const lista = lasBibliotek();
  lista.unshift(post);
  const kapad = lista.slice(0, 12);
  localStorage.setItem(NYCKEL, JSON.stringify(kapad));
  return kapad;
}

export function filnamn(namn, ext) {
  const rent = (namn || 'landskap').replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim() || 'landskap';
  return `${rent}${ext}`;
}
