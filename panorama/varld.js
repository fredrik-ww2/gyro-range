import * as THREE from 'three';
import {GLTFLoader} from '../js/vendor/loaders/GLTFLoader.js';
import {MeshoptDecoder} from '../js/vendor/loaders/meshopt_decoder.module.js';
import {DRACOLoader} from '../flyg/vendor/loaders/DRACOLoader.js';
import {KTX2Loader} from '../flyg/vendor/loaders/KTX2Loader.js';
import {mergeGeometries} from '../js/vendor/utils/BufferGeometryUtils.js';
import {stallSoldater} from './soldat.js?v=13';
import {medForm} from './mark.js?v=13';

const OGA = 1.7;
const FILER = {
  hack: 'hack_bocage_4m_c.glb',
  horn: 'hack_bocage_horn_90.glb',
  hackTrad: 'hack_bocage_med_trad_a.glb',
  oppning: 'hack_bocage_oppning_a.glb',
  pak: 'pak40_besattning_web.glb',
  radhus: 'radhus_d_L0.glb',
  tysk: 'rifleman_germany.glb',
  usa: 'rifleman_usa.glb',
  sherman: 'sherman_m4_barking_dogo_lod4.glb',
  husA: 'stenhus_a_L0.glb',
  husB: 'stenhus_b_L0.glb',
  tiger: 'tiger_i_heavy_v2_v2_pbr_lod2.glb',
  apple: 'trad_apple_c.glb',
  bok: 'trad_bok_c.glb',
  ek: 'trad_ek_b.glb'
};

// Om höjd eller längd hamnar utanför spannet är modellen fel skala. Då enhetlig skala till målet.
const SKALA = {
  usa: {hojd: [1.5, 2.05], malH: 1.78},
  tysk: {hojd: [1.5, 2.05], malH: 1.78},
  sherman: {langd: [4.6, 7.6], malL: 6.0},
  tiger: {langd: [5.0, 9.5], malL: 6.4, hojd: [2.1, 3.9]},
  pak: {hojd: [1.2, 2.6], malH: 1.75, langd: [3.2, 8.5], malL: 6.0},
  husA: {hojd: [5, 14]},
  husB: {hojd: [5, 13]},
  radhus: {hojd: [6, 14], langd: [12, 28]},
  hack: {hojd: [1.5, 4.5], langd: [3, 7]},
  oppning: {hojd: [1.5, 4.5], langd: [3, 7]},
  horn: {hojd: [1.5, 4.5]},
  hackTrad: {hojd: [6, 14]},
  apple: {hojd: [3, 8]},
  bok: {hojd: [10, 26]},
  ek: {hojd: [8, 20]}
};

function klonaSkinn(source) {
  const clone = source.clone(true);
  const src = [];
  const dst = [];
  source.traverse(n => src.push(n));
  clone.traverse(n => dst.push(n));
  const map = new Map();
  src.forEach((n, i) => map.set(n, dst[i]));
  dst.forEach((node, i) => {
    if (!node.isSkinnedMesh) return;
    const orig = src[i];
    node.skeleton = orig.skeleton.clone();
    node.skeleton.bones = orig.skeleton.bones.map(b => map.get(b) || b);
    node.bind(node.skeleton, orig.bindMatrix);
    node.frustumCulled = false;
  });
  return clone;
}

function frysPose(root, animations, del, tid) {
  const clip = animations.find(a => a.name.includes(del));
  if (!clip) return;
  const mixer = new THREE.AnimationMixer(root);
  mixer.clipAction(clip).play();
  mixer.setTime(tid == null ? Math.min(0.4, clip.duration * 0.25) : tid);
  root.traverse(n => { if (n.isSkinnedMesh) n.skeleton.update(); });
}

function matt(root) {
  root.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(root);
  return {box, size: box.getSize(new THREE.Vector3())};
}

function behov(size, regel) {
  if (!regel) return 1;
  const H = size.y;
  const L = Math.max(size.x, size.z);
  if (regel.hojd && regel.malH && (H < regel.hojd[0] || H > regel.hojd[1])) return regel.malH / H;
  if (regel.langd && regel.malL && (L < regel.langd[0] || L > regel.langd[1])) return regel.malL / L;
  return 1;
}

function bakaSynlig(root) {
  root.updateWorldMatrix(true, true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const ut = new THREE.Group();
  const v = new THREE.Vector3();
  root.traverse(n => {
    if (!n.isMesh || n.visible === false) return;
    const g = n.geometry.clone();
    const pos = g.getAttribute('position');
    if (n.isSkinnedMesh && g.getAttribute('skinIndex')) {
      n.skeleton.update();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        n.applyBoneTransform(i, v);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      g.deleteAttribute('skinIndex');
      g.deleteAttribute('skinWeight');
    }
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, n.matrixWorld));
    const mesh = new THREE.Mesh(g, n.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    ut.add(mesh);
  });
  return ut;
}

function stallPaMark(grupp) {
  grupp.updateWorldMatrix(true, true);
  grupp.traverse(n => {
    if (!n.isMesh) return;
    n.geometry.applyMatrix4(n.matrixWorld);
    n.position.set(0, 0, 0);
    n.quaternion.identity();
    n.scale.set(1, 1, 1);
    n.updateMatrix();
  });
  grupp.position.set(0, 0, 0);
  grupp.rotation.set(0, 0, 0);
  grupp.scale.set(1, 1, 1);
  grupp.updateWorldMatrix(true, true);
}

function attributSignatur(g) {
  const namn = Object.keys(g.attributes).sort().join('|');
  const morph = Object.keys(g.morphAttributes || {}).sort().join('|');
  return [
    g.index ? 'i' : 'n',
    namn,
    morph,
    g.morphTargetsRelative ? '1' : '0'
  ].join(';');
}

function kanMerga(geoms) {
  if (geoms.length < 2) return true;
  const bas = geoms[0];
  const sign = attributSignatur(bas);
  for (const g of geoms) {
    if (attributSignatur(g) !== sign) return false;
    for (const nyckel of Object.keys(bas.attributes)) {
      const a = bas.attributes[nyckel];
      const b = g.attributes[nyckel];
      if (!b || a.itemSize !== b.itemSize || a.normalized !== b.normalized) return false;
      if (a.array.constructor !== b.array.constructor) return false;
      if (a.isInterleavedBufferAttribute || b.isInterleavedBufferAttribute) return false;
    }
  }
  return true;
}

function slåIhop(grupp) {
  const poster = new Map();
  const meshar = [];
  grupp.traverse(n => { if (n.isMesh) meshar.push(n); });
  for (const n of meshar) {
    const material = Array.isArray(n.material) ? null : n.material;
    if (!material) continue;
    if (!poster.has(material.uuid)) poster.set(material.uuid, {material, geoms: []});
    poster.get(material.uuid).geoms.push(n.geometry);
    n.parent.remove(n);
  }
  for (const {material, geoms} of poster.values()) {
    let geom = geoms[0];
    if (geoms.length > 1) geom = kanMerga(geoms) ? mergeGeometries(geoms, false) : null;
    if (!geom) { for (const g of geoms) grupp.add(new THREE.Mesh(g, material)); continue; }
    geom.computeBoundingSphere();
    const mesh = new THREE.Mesh(geom, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    grupp.add(mesh);
  }
  return grupp;
}

function skugga(root, skuggaPa = true) {
  root.traverse(n => {
    if (/^muzzle/i.test(n.name || '')) n.visible = false;
    if (!n.isMesh || !n.visible) return;
    n.castShadow = skuggaPa;
    n.receiveShadow = true;
  });
}

function murOppna(x0, z0, x1, z1, oppen, markHojd) {
  const dx = x1 - x0, dz = z1 - z0;
  const len = Math.hypot(dx, dz);
  const yaw = Math.atan2(-dz, dx);
  const steg = 4;
  const ut = [];
  for (let d = 0; d + steg <= len + 0.05; d += steg) {
    const mitt = d + steg / 2;
    const x = x0 + dx * (mitt / len);
    const z = z0 + dz * (mitt / len);
    if (oppen && oppen(x, z)) continue;
    const n = Math.round(d / steg);
    const typ = n % 11 === 2 ? 'oppning' : n % 7 === 4 ? 'trad' : 'rak';
    ut.push({x, z, yaw, typ, y: markHojd(x, z)});
  }
  return ut;
}

function grastyg() {
  const s = 256, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const img = g.createImageData(s, s);
  const hsh = (x, y) => {
    let n = (x * 374761393 + y * 668265263 + 19) | 0;
    n = (n ^ (n >>> 13)) * 1274126177;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  };
  const vn = (x, y) => {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = hsh(ix, iy), b = hsh(ix + 1, iy), c0 = hsh(ix, iy + 1), d = hsh(ix + 1, iy + 1);
    return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c0 * (1 - ux) * uy + d * ux * uy;
  };
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const n = vn(x / 22, y / 22) * 0.6 + vn(x / 6, y / 6) * 0.4;
    const k = 0.78 + n * 0.4;
    const i = (y * s + x) * 4;
    img.data[i] = 62 * k;
    img.data[i + 1] = 78 * k;
    img.data[i + 2] = 38 * k;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  t.repeat.set(72, 72);
  return t;
}

function jordtyg() {
  const s = 128, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const img = g.createImageData(s, s);
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const n = ((x * 17 + y * 53) % 97) / 97;
    const i = (y * s + x) * 4;
    img.data[i] = 92 + n * 40;
    img.data[i + 1] = 78 + n * 28;
    img.data[i + 2] = 52 + n * 18;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 40);
  return t;
}

function ljusOchMark(scene, miljo, markHojd, terrang) {
  scene.background = null;
  const dimFjarr = Math.max(terrang.dimmaFjarr, terrang.dimmaNara + 40);
  scene.fog = new THREE.Fog(0xd5dece, terrang.dimmaNara, dimFjarr);
  scene.add(new THREE.HemisphereLight(0xcfe0ea, 0x3e4a30, 0.95));
  const sol = new THREE.DirectionalLight(0xfff1d4, 1.85);
  sol.position.set(-36, 52, 24);
  sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024);
  sol.shadow.camera.near = 2;
  sol.shadow.camera.far = 160;
  sol.shadow.camera.left = -70;
  sol.shadow.camera.right = 70;
  sol.shadow.camera.top = 70;
  sol.shadow.camera.bottom = -70;
  sol.shadow.bias = -0.0004;
  sol.shadow.normalBias = 0.05;
  sol.target.position.set(0, 0, -8);
  scene.add(sol, sol.target);

  const himmelR = Math.max(420, terrang.kameraFar - 40);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(himmelR, 24, 14), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top: {value: new THREE.Color(0x7eadd8)},
      horisont: {value: new THREE.Color(0xd5dece)},
      botten: {value: new THREE.Color(0xb4c09a)}
    },
    vertexShader: 'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'varying vec3 vP;uniform vec3 top,horisont,botten;void main(){float h=normalize(vP).y;vec3 c=mix(botten,horisont,smoothstep(-0.22,0.04,h));c=mix(c,top,smoothstep(0.02,0.5,h));gl_FragColor=vec4(c,1.0);}'
  }));
  sky.userData.himlen = true;
  miljo.add(sky);

  const geo = new THREE.PlaneGeometry(terrang.mark, terrang.mark, terrang.segment, terrang.segment);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, markHojd(pos.getX(i), pos.getZ(i)));
  geo.computeVertexNormals();
  const mark = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({map: grastyg(), roughness: 0.94, metalness: 0}));
  mark.receiveShadow = true;
  miljo.add(mark);

  const jord = new THREE.MeshStandardMaterial({map: jordtyg(), roughness: 0.92, metalness: 0, polygonOffset: true, polygonOffsetFactor: -1});
  const vag = (bredd, langd, langsX) => {
    const seg = Math.max(8, Math.round(langd / 6));
    const g = new THREE.PlaneGeometry(langsX ? langd : bredd, langsX ? bredd : langd, langsX ? seg : 1, langsX ? 1 : seg);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, markHojd(p.getX(i), p.getZ(i)) + 0.045);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, jord);
    m.receiveShadow = true;
    miljo.add(m);
  };
  vag(3.2, 640, false);
  vag(3.2, 640, true);
}

function instans(geom, material, platser, skuggaPa) {
  if (!platser.length) return null;
  const mesh = new THREE.InstancedMesh(geom, material, platser.length);
  const d = new THREE.Object3D();
  let radie = 30;
  platser.forEach((p, i) => {
    d.position.set(p.x, p.y || 0, p.z);
    d.rotation.set(0, p.yaw || 0, 0);
    d.scale.setScalar(p.skala || 1);
    d.updateMatrix();
    mesh.setMatrixAt(i, d.matrix);
    radie = Math.max(radie, Math.hypot(p.x, p.z) + 40);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = !!skuggaPa;
  mesh.receiveShadow = !!skuggaPa;
  mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radie);
  return mesh;
}

function geometriFran(root, faktor) {
  let mesh = null;
  root.traverse(n => { if (!mesh && n.isMesh) mesh = n; });
  const g = mesh.geometry.clone();
  mesh.updateWorldMatrix(true, false);
  g.applyMatrix4(mesh.matrixWorld);
  if (faktor !== 1) g.scale(faktor, faktor, faktor);
  g.computeBoundingBox();
  g.translate(0, -g.boundingBox.min.y, 0);
  return {geometry: g, material: mesh.material};
}

function bakaStaty(rot, farg) {
  rot.updateWorldMatrix(true, true);
  const inv = new THREE.Matrix4().copy(rot.matrixWorld).invert();
  const geoms = [];
  const v = new THREE.Vector3();
  rot.traverse(n => {
    if (!n.isMesh || n.visible === false) return;
    const g = n.geometry.clone();
    const posAttr = g.getAttribute('position');
    if (!posAttr) return;
    if (n.isSkinnedMesh && g.getAttribute('skinIndex')) {
      n.skeleton.update();
      for (let i = 0; i < posAttr.count; i++) {
        v.fromBufferAttribute(posAttr, i);
        n.applyBoneTransform(i, v);
        posAttr.setXYZ(i, v.x, v.y, v.z);
      }
      g.deleteAttribute('skinIndex');
      g.deleteAttribute('skinWeight');
    }
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, n.matrixWorld));
    const flat = g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(flat.attributes)) {
      if (k !== 'position' && k !== 'normal') flat.deleteAttribute(k);
    }
    if (!flat.getAttribute('normal')) flat.computeVertexNormals();
    geoms.push(flat);
  });
  if (!geoms.length) return null;
  let geom = geoms[0];
  if (geoms.length > 1) {
    geom = kanMerga(geoms) ? mergeGeometries(geoms, false) : null;
    if (!geom) return null;
  }
  geom.computeBoundingBox();
  geom.translate(0, -geom.boundingBox.min.y, 0);
  const material = new THREE.MeshStandardMaterial({color: farg, roughness: 0.9, metalness: 0.04});
  return {geometry: geom, material};
}

export async function byggVarld(scene, renderer, config, effekt) {
  const terrang = config?.terrang || {dimmaNara: 160, dimmaFjarr: 540, kameraFar: 700, raycast: 560, mark: 920, segment: 128, form: {}};
  const markHojd = medForm(terrang.form);
  const miljo = new THREE.Group();
  miljo.name = 'miljo';
  scene.add(miljo);
  ljusOchMark(scene, miljo, markHojd, terrang);
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(8, 10, 6), new THREE.MeshBasicMaterial({color: 0xc5d4c4, side: THREE.BackSide})));
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(env, 0.04).texture;
  pmrem.dispose();

  const draco = new DRACOLoader().setDecoderPath(new URL('../flyg/vendor/libs/draco/', import.meta.url).href).setDecoderConfig({type: 'wasm'}).setWorkerLimit(2);
  const ktx2 = new KTX2Loader().setTranscoderPath(new URL('../flyg/vendor/libs/basis/', import.meta.url).href).detectSupport(renderer);
  await MeshoptDecoder.ready;
  const loader = new GLTFLoader().setDRACOLoader(draco).setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder);
  const glb = async namn => {
    const url = new URL('./modeller/' + FILER[namn], import.meta.url).href;
    try { return await loader.loadAsync(url); }
    catch (e) { throw new Error(FILER[namn] + ': ' + (e.message || e)); }
  };
  const poster = await Promise.all(Object.keys(FILER).map(async namn => [namn, await glb(namn)]));
  const modell = Object.fromEntries(poster);
  const rapport = [];

  function rapportRad(namn, fore, efter, skala) {
    const r = (v) => [+v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(2)];
    rapport.push({namn, fore: r(fore), efter: r(efter), skala: +skala.toFixed(3)});
  }

  function stallGrupp(namn, rot, skriv) {
    const fore = matt(rot).size.clone();
    const s = behov(fore, SKALA[namn]);
    if (Math.abs(s - 1) > 0.02) rot.scale.multiplyScalar(s);
    rot.position.y -= matt(rot).box.min.y;
    if (skriv !== false) rapportRad(namn, fore, matt(rot).size, Math.abs(s - 1) > 0.02 ? s : 1);
    skugga(rot, true);
  }

  const oppenNS = x => Math.abs(x) < 16;
  const oppenOV = (x, z) => Math.abs(z) < 16;
  const hackPlatser = [
    ...murOppna(-48, -42, 48, -42, oppenNS, markHojd),
    ...murOppna(-48, 42, 48, 42, oppenNS, markHojd),
    ...murOppna(48, -42, 48, 42, oppenOV, markHojd),
    ...murOppna(-48, 42, -48, -42, oppenOV, markHojd),
    ...murOppna(-18, -70, -18, -300, null, markHojd),
    ...murOppna(18, -70, 18, -300, null, markHojd),
    ...murOppna(-18, 70, -18, 300, null, markHojd),
    ...murOppna(18, 70, 18, 300, null, markHojd),
    ...murOppna(-70, -18, -300, -18, null, markHojd),
    ...murOppna(-70, 18, -300, 18, null, markHojd),
    ...murOppna(70, -18, 300, -18, null, markHojd),
    ...murOppna(70, 18, 300, 18, null, markHojd),
    ...murOppna(-80, -140, 80, -140, oppenNS, markHojd),
    ...murOppna(-90, -230, 90, -230, oppenNS, markHojd),
    ...murOppna(-80, 155, 80, 155, oppenNS, markHojd),
    ...murOppna(-90, 255, 90, 255, oppenNS, markHojd),
    ...murOppna(-155, -70, -155, 70, oppenOV, markHojd),
    ...murOppna(165, -70, 165, 70, oppenOV, markHojd),
    ...murOppna(-250, -60, -250, 60, oppenOV, markHojd)
  ];
  const hornPlatser = [
    {x: -48, z: 42, yaw: 0},
    {x: 48, z: 42, yaw: -Math.PI / 2},
    {x: 48, z: -42, yaw: Math.PI},
    {x: -48, z: -42, yaw: Math.PI / 2}
  ].map(p => ({...p, y: markHojd(p.x, p.z)}));
  for (const nyckel of ['hack', 'oppning', 'hackTrad', 'horn', 'apple', 'bok', 'ek']) {
    const rot = modell[nyckel].scene;
    rot.position.set(0, 0, 0);
    rot.rotation.set(0, 0, 0);
    rot.scale.set(1, 1, 1);
    const fore = matt(rot).size;
    const s = behov(fore, SKALA[nyckel]);
    const del = geometriFran(rot, s);
    const efterH = fore.y * s;
    const efterL = Math.max(fore.x, fore.z) * s;
    rapport.push({namn: nyckel, fore: [+fore.x.toFixed(2), +fore.y.toFixed(2), +fore.z.toFixed(2)], efter: [+(fore.x * s).toFixed(2), +efterH.toFixed(2), +(fore.z * s).toFixed(2)], langd: +efterL.toFixed(2), skala: +s.toFixed(3)});
    rot.userData.del = del;
  }
  const avTyp = typ => hackPlatser.filter(p => p.typ === typ);
  const laggPar = (nyckel, platser) => {
    const del = modell[nyckel].scene.userData.del;
    const nara = platser.filter(p => Math.hypot(p.x, p.z) < 85);
    const fjarr = platser.filter(p => Math.hypot(p.x, p.z) >= 85);
    const a = instans(del.geometry, del.material, nara, true);
    const b = instans(del.geometry, del.material, fjarr, false);
    if (a) miljo.add(a);
    if (b) miljo.add(b);
  };
  laggPar('hack', avTyp('rak'));
  laggPar('oppning', avTyp('oppning'));
  laggPar('hackTrad', avTyp('trad'));
  const hornMesh = instans(modell.horn.scene.userData.del.geometry, modell.horn.scene.userData.del.material, hornPlatser, true);
  if (hornMesh) miljo.add(hornMesh);

  const trad = [
    {k: 'ek', x: -28, z: -20}, {k: 'ek', x: 30, z: 26}, {k: 'ek', x: -26, z: 34}, {k: 'ek', x: 34, z: -36},
    {k: 'bok', x: -22, z: -48}, {k: 'bok', x: 36, z: -28}, {k: 'apple', x: 22, z: -34}, {k: 'apple', x: -20, z: 14},
    {k: 'ek', x: -26, z: -120}, {k: 'ek', x: 28, z: -188}, {k: 'ek', x: -30, z: 150}, {k: 'ek', x: 24, z: 210},
    {k: 'bok', x: 32, z: -110}, {k: 'bok', x: -34, z: -200}, {k: 'bok', x: 36, z: 170}, {k: 'bok', x: -28, z: 240},
    {k: 'apple', x: -24, z: -96}, {k: 'apple', x: 26, z: 108}, {k: 'ek', x: -110, z: -26}, {k: 'ek', x: 140, z: 22},
    {k: 'bok', x: -180, z: 28}, {k: 'bok', x: 190, z: -30}, {k: 'apple', x: 90, z: -24}, {k: 'ek', x: -70, z: 30}
  ].map(t => ({...t, y: markHojd(t.x, t.z)}));
  for (const k of ['ek', 'bok', 'apple']) laggPar(k, trad.filter(t => t.k === k));

  function placera(namn, x, z, yaw, pose) {
    const kalla = modell[namn];
    const rot = klonaSkinn(kalla.scene);
    if (pose) frysPose(rot, kalla.animations, pose, 0.6);
    const wrap = new THREE.Group();
    wrap.add(rot);
    stallGrupp(namn, rot);
    wrap.position.set(x, markHojd(x, z), z);
    wrap.rotation.y = yaw;
    miljo.add(wrap);
  }

  {
    // Noden skala 2,03 spränger delarna. Skrov och torn (Object_36, Object_34) sitter
    // ihop när skalan tas bort och tornets extra rotation nollställs. Övriga delar
    // ligger som löst skrot och döljs.
    const rot = klonaSkinn(modell.sherman.scene);
    rot.traverse(n => {
      if (!n.isMesh) return;
      n.scale.set(1, 1, 1);
      if (n.name === 'Object_34') n.quaternion.identity();
      if (n.name === 'Object_6' || n.name === 'Object_163' || n.name === 'Object_353' || n.name === 'Object_362') n.visible = false;
    });
    const fore = matt(rot).size.clone();
    const s = fore.y < 2.2 ? 2.7 / fore.y : 1;
    if (s !== 1) rot.scale.multiplyScalar(s);
    rot.position.y -= matt(rot).box.min.y;
    rapportRad('sherman', fore, matt(rot).size, s);
    skugga(rot, true);
    const wrap = new THREE.Group();
    wrap.add(rot);
    wrap.position.set(-16, markHojd(-16, -58), -58);
    wrap.rotation.y = 2.2;
    miljo.add(wrap);
    const fjarr = bakaStaty(rot, 0x4a5340);
    if (fjarr) {
      const platser = [
        {x: 24, z: -248, yaw: 0.4},
        {x: -236, z: 18, yaw: 1.2},
        {x: 210, z: -22, yaw: -0.6}
      ].map(p => ({...p, y: markHojd(p.x, p.z)}));
      const mesh = instans(fjarr.geometry, fjarr.material, platser, false);
      if (mesh) miljo.add(mesh);
    }
  }
  placera('tiger', 26, 74, Math.PI - 0.45);
  {
    const rot = klonaSkinn(modell.pak.scene);
    frysPose(rot, modell.pak.animations, 'commander_observe', 0.5);
    const pak = bakaSynlig(rot);
    const fore = matt(pak).size.clone();
    const s = fore.y > 2.6 || fore.y < 1.2 ? 1.8 / fore.y : 1;
    if (Math.abs(s - 1) > 0.04) pak.scale.multiplyScalar(s);
    pak.position.y -= matt(pak).box.min.y;
    stallPaMark(pak);
    slåIhop(pak);
    const wrap = new THREE.Group();
    wrap.add(pak);
    wrap.position.set(40, markHojd(40, 24), 24);
    wrap.rotation.y = -Math.PI / 2;
    miljo.add(wrap);
    rapportRad('pak', fore, matt(pak).size, s);
  }
  placera('husA', 28, -56, 0.15);
  placera('husB', -62, 28, Math.PI / 2);
  placera('radhus', -22, 84, 0.05);

  function fjarrHus(namn, farg, platser) {
    const rot = klonaSkinn(modell[namn].scene);
    rot.position.set(0, 0, 0);
    rot.rotation.set(0, 0, 0);
    rot.scale.set(1, 1, 1);
    const fore = matt(rot).size;
    const s = behov(fore, SKALA[namn]);
    if (Math.abs(s - 1) > 0.02) rot.scale.multiplyScalar(s);
    rot.position.y -= matt(rot).box.min.y;
    const baka = bakaStaty(rot, farg);
    if (!baka) return;
    const mesh = instans(baka.geometry, baka.material, platser.map(p => ({...p, y: markHojd(p.x, p.z)})), false);
    if (mesh) miljo.add(mesh);
  }
  fjarrHus('husA', 0x8d8474, [
    {x: 40, z: -176, yaw: 0.2},
    {x: -46, z: 186, yaw: 1.1},
    {x: 36, z: 248, yaw: -0.4}
  ]);
  fjarrHus('husB', 0x6f685c, [
    {x: -168, z: -32, yaw: 0.4},
    {x: 176, z: 34, yaw: 2.2},
    {x: -230, z: 36, yaw: 0.8}
  ]);

  const soldatLista = config?.soldater || {};
  const soldater = stallSoldater(scene, {usa: modell.usa, tysk: modell.tysk}, {
    markHojd,
    effekt,
    traff: config?.traff,
    rayMax: terrang.raycast,
    platser: soldatLista.platser,
    extra: soldatLista.extra
  });
  for (const rad of soldater.status()) {
    rapport.push({namn: rad.sida + '-soldat', fore: [0, 0, 0], efter: [rad.x, rad.y, rad.z], skala: 1, zon: rad.zon, avstand: rad.avstand});
  }

  draco.dispose();
  ktx2.dispose();
  return {rapport, oga: OGA, hackAntal: hackPlatser.length, miljo, soldater, markHojd};
}
