import * as THREE from 'three';
import {GLTFLoader} from '../js/vendor/loaders/GLTFLoader.js';
import {MeshoptDecoder} from '../js/vendor/loaders/meshopt_decoder.module.js';
import {DRACOLoader} from '../flyg/vendor/loaders/DRACOLoader.js';
import {KTX2Loader} from '../flyg/vendor/loaders/KTX2Loader.js';
import {mergeGeometries} from '../js/vendor/utils/BufferGeometryUtils.js';

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

function tona(root, hex, styrka) {
  const mal = new THREE.Color(hex);
  root.traverse(n => {
    if (!n.isMesh) return;
    const lista = Array.isArray(n.material) ? n.material : [n.material];
    const nya = lista.map(m => {
      const c = m.clone();
      if (/skin|eye|eyebrow|moustache/i.test(c.name || '')) return c;
      c.color.lerp(mal, styrka);
      return c;
    });
    n.material = Array.isArray(n.material) ? nya : nya[0];
  });
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
    if (geoms.length > 1) {
      const samma = geoms.every(g => !!g.index === !!geoms[0].index);
      geom = samma ? mergeGeometries(geoms, false) : null;
    }
    if (!geom) { for (const g of geoms) grupp.add(new THREE.Mesh(g, material)); continue; }
    geom.computeBoundingSphere();
    const mesh = new THREE.Mesh(geom, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    grupp.add(mesh);
  }
  return grupp;
}

function skugga(root) {
  root.traverse(n => {
    if (/^muzzle/i.test(n.name || '')) n.visible = false;
    if (!n.isMesh || !n.visible) return;
    n.castShadow = true;
    n.receiveShadow = true;
  });
}

function mur(x0, z0, x1, z1, luckaFran, luckaTill) {
  const dx = x1 - x0, dz = z1 - z0;
  const len = Math.hypot(dx, dz);
  const yaw = Math.atan2(-dz, dx);
  const steg = 4;
  const ut = [];
  let oppningSatt = false;
  for (let d = 0; d + steg <= len + 0.05; d += steg) {
    const mitt = d + steg / 2;
    const x = x0 + dx * (d / len);
    const z = z0 + dz * (d / len);
    if (mitt >= luckaFran && mitt < luckaTill) {
      if (!oppningSatt) { ut.push({x, z, yaw, typ: 'oppning'}); oppningSatt = true; }
      continue;
    }
    ut.push({x, z, yaw, typ: Math.round(d / steg) % 6 === 3 ? 'trad' : 'rak'});
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
  t.repeat.set(48, 48);
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
  t.repeat.set(8, 28);
  return t;
}

function ljusOchMark(scene) {
  scene.background = null;
  scene.fog = new THREE.Fog(0xd5dece, 48, 175);
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

  const sky = new THREE.Mesh(new THREE.SphereGeometry(340, 24, 14), new THREE.ShaderMaterial({
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
  scene.add(sky);

  const mark = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), new THREE.MeshStandardMaterial({map: grastyg(), roughness: 0.94, metalness: 0}));
  mark.rotation.x = -Math.PI / 2;
  mark.receiveShadow = true;
  scene.add(mark);
  const vag = (w, h, x, z, yaw) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({map: jordtyg(), roughness: 0.92, metalness: 0}));
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = yaw;
    m.position.set(x, 0.02, z);
    m.receiveShadow = true;
    scene.add(m);
  };
  vag(3.4, 210, 0, 0, 0);
  vag(150, 2.8, 0, 0, Math.PI / 2);
}

function instans(geom, material, platser) {
  if (!platser.length) return null;
  const mesh = new THREE.InstancedMesh(geom, material, platser.length);
  const d = new THREE.Object3D();
  platser.forEach((p, i) => {
    d.position.set(p.x, p.y || 0, p.z);
    d.rotation.set(0, p.yaw || 0, 0);
    d.scale.set(1, 1, 1);
    d.updateMatrix();
    mesh.setMatrixAt(i, d.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 200);
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

export async function byggVarld(scene, renderer) {
  ljusOchMark(scene);
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
    skugga(rot);
  }

  const hackPlatser = [
    ...mur(-36, -36, 36, -36, 32, 40),
    ...mur(-36, 36, 36, 36, 32, 40),
    ...mur(36, -36, 36, 36, 32, 40),
    ...mur(-36, 36, -36, -36, 32, 40),
    ...mur(-16, -78, 28, -78, 18, 26),
    ...mur(-20, 96, 24, 96, 16, 24)
  ];
  const hornPlatser = [
    {x: -36, z: 36, yaw: 0, y: 0.03},
    {x: 36, z: 36, yaw: -Math.PI / 2, y: 0.03},
    {x: 36, z: -36, yaw: Math.PI, y: 0.03},
    {x: -36, z: -36, yaw: Math.PI / 2, y: 0.03}
  ];
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
  const avTyp = typ => hackPlatser.filter(p => p.typ === typ).map(p => ({...p, y: 0.03}));
  const hackMesh = instans(modell.hack.scene.userData.del.geometry, modell.hack.scene.userData.del.material, avTyp('rak'));
  const oppnMesh = instans(modell.oppning.scene.userData.del.geometry, modell.oppning.scene.userData.del.material, avTyp('oppning'));
  const tradHack = instans(modell.hackTrad.scene.userData.del.geometry, modell.hackTrad.scene.userData.del.material, avTyp('trad'));
  const hornMesh = instans(modell.horn.scene.userData.del.geometry, modell.horn.scene.userData.del.material, hornPlatser);
  for (const m of [hackMesh, oppnMesh, tradHack, hornMesh]) if (m) scene.add(m);

  const trad = [
    {k: 'ek', x: -24, z: -16}, {k: 'ek', x: 24, z: 22}, {k: 'ek', x: -22, z: 30}, {k: 'ek', x: 48, z: -52}, {k: 'ek', x: -50, z: 40},
    {k: 'bok', x: -12, z: -48}, {k: 'bok', x: 34, z: -30}, {k: 'bok', x: -46, z: -18}, {k: 'bok', x: 50, z: 36},
    {k: 'apple', x: 16, z: -30}, {k: 'apple', x: -16, z: 10}, {k: 'apple', x: 9, z: 20}, {k: 'apple', x: -8, z: -28}
  ];
  for (const k of ['ek', 'bok', 'apple']) {
    const del = modell[k].scene.userData.del;
    const mesh = instans(del.geometry, del.material, trad.filter(t => t.k === k));
    if (mesh) scene.add(mesh);
  }

  function placera(namn, x, z, yaw, pose) {
    const kalla = modell[namn];
    const rot = klonaSkinn(kalla.scene);
    if (pose) frysPose(rot, kalla.animations, pose, 0.6);
    const wrap = new THREE.Group();
    wrap.add(rot);
    stallGrupp(namn, rot);
    wrap.position.set(x, 0, z);
    wrap.rotation.y = yaw;
    scene.add(wrap);
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
    skugga(rot);
    const wrap = new THREE.Group();
    wrap.add(rot);
    wrap.position.set(-8, 0, -55);
    wrap.rotation.y = 2.2;
    scene.add(wrap);
  }
  placera('tiger', 11, 66, Math.PI - 0.45);
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
    wrap.position.set(38, 0, 0);
    wrap.rotation.y = -Math.PI / 2;
    scene.add(wrap);
    rapportRad('pak', fore, matt(pak).size, s);
  }
  placera('husA', 20, -52, 0.15);
  placera('husB', -58, 6, Math.PI / 2);
  placera('radhus', -16, 78, 0.05);

  const grupper = [
    {namn: 'usa', farg: 0x6a5a34, pose: 'Idle_Gun', platser: [[-5, -16, 0.4], [7, -22, -0.5], [-15, -8, 1.0], [3, -30, 0.15]]},
    {namn: 'tysk', farg: 0x3c4838, pose: 'Idle_Gun', platser: [[16, -4, 2.6], [14, 14, -2.3], [-5, 20, 2.8], [21, 18, -1.7]]}
  ];
  for (const grupp of grupper) {
    const rot = klonaSkinn(modell[grupp.namn].scene);
    frysPose(rot, modell[grupp.namn].animations, grupp.pose, 0.45);
    tona(rot, grupp.farg, 0.38);
    let huvud = null;
    rot.traverse(n => { if (!huvud && n.name === 'Head') huvud = n; });
    rot.updateWorldMatrix(true, true);
    const huvudLokal = new THREE.Vector3();
    if (huvud) huvud.getWorldPosition(huvudLokal).applyMatrix4(new THREE.Matrix4().copy(rot.matrixWorld).invert());
    const bak = bakaSynlig(rot);
    const centrum = matt(bak).box.getCenter(new THREE.Vector3());
    const motHuvud = huvudLokal.sub(centrum);
    if (motHuvud.lengthSq() > 1e-6) bak.quaternion.setFromUnitVectors(motHuvud.normalize(), new THREE.Vector3(0, 1, 0));
    // Huvudbenet pekar mot fötterna i den här exporten, så figuren annars står på huvudet.
    bak.rotateX(Math.PI);
    const fore = matt(bak).size.clone();
    const s = fore.y > 0.2 ? 1.78 / fore.y : 1;
    if (Math.abs(s - 1) > 0.04) bak.scale.multiplyScalar(s);
    bak.position.y -= matt(bak).box.min.y;
    stallPaMark(bak);
    slåIhop(bak);
    rapportRad(grupp.namn, fore, matt(bak).size, s);
    const meshar = [];
    bak.traverse(n => { if (n.isMesh) meshar.push(n); });
    for (const mesh of meshar) {
      const im = new THREE.InstancedMesh(mesh.geometry, mesh.material, grupp.platser.length);
      const d = new THREE.Object3D();
      grupp.platser.forEach((p, i) => {
        d.position.set(p[0], 0, p[1]);
        d.rotation.set(0, p[2], 0);
        d.scale.set(1, 1, 1);
        d.updateMatrix();
        im.setMatrixAt(i, d.matrix);
      });
      im.castShadow = true;
      im.receiveShadow = true;
      im.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 90);
      scene.add(im);
    }
  }

  draco.dispose();
  ktx2.dispose();
  return {rapport, oga: OGA, hackAntal: hackPlatser.length};
}
