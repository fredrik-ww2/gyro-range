import * as THREE from 'three';
import {GLTFLoader} from '../js/vendor/loaders/GLTFLoader.js';
import {MeshoptDecoder} from '../js/vendor/loaders/meshopt_decoder.module.js';
import {DRACOLoader} from '../flyg/vendor/loaders/DRACOLoader.js';
import {KTX2Loader} from '../flyg/vendor/loaders/KTX2Loader.js';
import {mergeGeometries} from '../js/vendor/utils/BufferGeometryUtils.js';

const BAS = '../panorama/modeller/';

function grastyg() {
  const s = 256;
  const c = document.createElement('canvas');
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
  t.repeat.set(70, 70);
  return t;
}

function jordtyg() {
  const s = 128;
  const c = document.createElement('canvas');
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
  t.repeat.set(2, 40);
  return t;
}

function ljusOchMark(scene) {
  scene.fog = new THREE.Fog(0xd5dece, 70, 1050);
  scene.add(new THREE.HemisphereLight(0xcfe0ea, 0x3e4a30, 0.95));
  const sol = new THREE.DirectionalLight(0xfff1d4, 1.9);
  sol.position.set(-40, 70, 28);
  sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024);
  sol.shadow.camera.near = 8;
  sol.shadow.camera.far = 140;
  sol.shadow.camera.left = -48;
  sol.shadow.camera.right = 48;
  sol.shadow.camera.top = 48;
  sol.shadow.camera.bottom = -48;
  sol.shadow.bias = -0.00035;
  sol.shadow.normalBias = 0.04;
  scene.add(sol, sol.target);

  const sky = new THREE.Mesh(new THREE.SphereGeometry(1700, 24, 14), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top: {value: new THREE.Color(0x7eadd8)},
      horisont: {value: new THREE.Color(0xd5dece)},
      botten: {value: new THREE.Color(0xb4c09a)}
    },
    vertexShader: 'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'varying vec3 vP;uniform vec3 top,horisont,botten;void main(){float h=normalize(vP).y;vec3 c=mix(botten,horisont,smoothstep(-0.22,0.04,h));c=mix(c,top,smoothstep(0.02,0.5,h));gl_FragColor=vec4(c,1.0);}'
  }));
  scene.add(sky);

  const mark = new THREE.Mesh(new THREE.PlaneGeometry(2600, 2600), new THREE.MeshStandardMaterial({map: grastyg(), roughness: 0.94, metalness: 0}));
  mark.rotation.x = -Math.PI / 2;
  mark.receiveShadow = true;
  scene.add(mark);
  const vag = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1100), new THREE.MeshStandardMaterial({map: jordtyg(), roughness: 0.92, metalness: 0}));
  vag.rotation.x = -Math.PI / 2;
  vag.position.set(0, 0.03, -470);
  vag.receiveShadow = true;
  scene.add(vag);
  return sol;
}

function geometriFran(gltf) {
  let mesh = null;
  gltf.scene.traverse(n => { if (!mesh && n.isMesh) mesh = n; });
  const g = mesh.geometry.clone();
  mesh.updateWorldMatrix(true, false);
  g.applyMatrix4(mesh.matrixWorld);
  g.computeBoundingBox();
  return {geometry: g, material: mesh.material};
}

function instans(geom, material, platser) {
  if (!platser.length) return null;
  const mesh = new THREE.InstancedMesh(geom, material, platser.length);
  const d = new THREE.Object3D();
  platser.forEach((p, i) => {
    d.position.set(p.x, p.y || 0, p.z);
    d.rotation.set(0, p.yaw || 0, 0);
    d.scale.setScalar(p.skala || 1);
    d.updateMatrix();
    mesh.setMatrixAt(i, d.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  return mesh;
}

function mur(x0, z0, x1, z1, lucka, trad) {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const len = Math.hypot(dx, dz);
  const yaw = Math.atan2(-dz / len, dx / len);
  const ut = [];
  let n = 0;
  for (let d = 0; d + 3.95 <= len; d += 4) {
    const mitt = d + 2;
    if (lucka && mitt >= lucka[0] && mitt <= lucka[1]) continue;
    ut.push({x: x0 + dx * (d / len), z: z0 + dz * (d / len), yaw, y: 0, trad: !!(trad && n % 5 === 2)});
    n++;
  }
  return ut;
}

function rent(g) {
  const src = g.getIndex() ? g.toNonIndexed() : g;
  const ut = new THREE.BufferGeometry();
  const pos = src.getAttribute('position');
  ut.setAttribute('position', pos.clone());
  const normal = src.getAttribute('normal');
  if (normal) ut.setAttribute('normal', normal.clone());
  else ut.computeVertexNormals();
  const uv = src.getAttribute('uv');
  if (uv) ut.setAttribute('uv', uv.clone());
  else ut.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(pos.count * 2), 2));
  return ut;
}

function bakaTiger(gltf) {
  const root = gltf.scene;
  root.updateMatrixWorld(true);
  let material = null;
  const geoms = [];
  const v = new THREE.Vector3();
  root.traverse(n => {
    if (!n.isMesh || /muzzle/i.test(n.name || '')) return;
    const mat = Array.isArray(n.material) ? n.material[0] : n.material;
    if (mat && /muzzle/i.test(mat.name || '')) return;
    if (!material && mat) material = mat;
    const g = n.geometry.clone();
    if (n.isSkinnedMesh && n.geometry.getAttribute('skinIndex')) {
      n.skeleton.update();
      const pos = g.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        n.applyBoneTransform(i, v);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      g.deleteAttribute('skinIndex');
      g.deleteAttribute('skinWeight');
    }
    n.updateWorldMatrix(true, false);
    g.applyMatrix4(n.matrixWorld);
    geoms.push(rent(g));
  });
  const merged = mergeGeometries(geoms, false);
  if (!merged) throw new Error('Tiger-geometrin gick inte att slå ihop');
  merged.computeBoundingBox();
  const size = merged.boundingBox.getSize(new THREE.Vector3());
  const langd = Math.max(size.x, size.z);
  const skala = langd > 9.2 || langd < 5.2 ? 6.4 / langd : 1;
  if (skala !== 1) merged.scale(skala, skala, skala);
  merged.computeBoundingBox();
  merged.translate(0, -merged.boundingBox.min.y, 0);
  merged.computeBoundingBox();
  const c = merged.boundingBox.getCenter(new THREE.Vector3());
  merged.translate(-c.x, 0, -c.z);
  merged.computeBoundingBox();
  merged.computeBoundingSphere();
  const mesh = new THREE.Mesh(merged, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return {mesh, skala, storlek: merged.boundingBox.getSize(new THREE.Vector3())};
}

function framAt(box, centrum) {
  let bast = 0;
  let dx = 0;
  let dz = 1;
  for (const x of [box.min.x, box.max.x]) for (const z of [box.min.z, box.max.z]) {
    const ox = x - centrum.x;
    const oz = z - centrum.z;
    const d = ox * ox + oz * oz;
    if (d > bast) { bast = d; dx = ox; dz = oz; }
  }
  return new THREE.Vector3(dx, 0, dz).normalize();
}

function byggSherman(gltf) {
  const src = gltf.scene;
  src.traverse(n => {
    if (!n.isMesh) return;
    n.scale.set(1, 1, 1);
    if (n.name === 'Object_34') n.quaternion.identity();
    if (n.name === 'Object_6' || n.name === 'Object_163' || n.name === 'Object_353' || n.name === 'Object_362') n.visible = false;
  });
  src.updateMatrixWorld(true);
  const fore = new THREE.Box3().setFromObject(src);
  const foreSize = fore.getSize(new THREE.Vector3());
  const s = foreSize.y < 2.2 ? 2.7 / foreSize.y : 1;
  src.scale.multiplyScalar(s);
  src.updateMatrixWorld(true);
  const efter = new THREE.Box3().setFromObject(src);
  src.position.y -= efter.min.y;
  const mitt = new THREE.Vector3((efter.min.x + efter.max.x) / 2, 0, (efter.min.z + efter.max.z) / 2);
  src.position.sub(mitt);
  src.updateMatrixWorld(true);

  const hull = src.getObjectByName('Object_36');
  const tornMesh = src.getObjectByName('Object_34');
  if (!hull || !tornMesh) throw new Error('Sherman saknar skrov eller torn');
  const hc = new THREE.Box3().setFromObject(hull).getCenter(new THREE.Vector3());
  const tb = new THREE.Box3().setFromObject(tornMesh);
  const fram = framAt(tb, hc);
  const q = new THREE.Quaternion().setFromUnitVectors(fram, new THREE.Vector3(0, 0, -1));
  const rotM = new THREE.Matrix4().makeRotationFromQuaternion(q);

  const rigg = new THREE.Group();
  const skrov = new THREE.Group();
  const torn = new THREE.Group();
  const eldror = new THREE.Group();
  rigg.name = 'sherman';
  rigg.add(skrov);
  skrov.add(torn);
  torn.add(eldror);

  const pivot = tb.getCenter(new THREE.Vector3()).applyMatrix4(rotM);
  torn.position.copy(pivot);
  rigg.updateMatrixWorld(true);
  const tornInv = new THREE.Matrix4().copy(torn.matrixWorld).invert();
  const extra = [];
  src.traverse(n => { if (n.isMesh && n.visible && n !== tornMesh) extra.push(n); });

  const flytta = (mesh, parent, parentInv) => {
    mesh.updateWorldMatrix(true, false);
    const world = new THREE.Matrix4().multiplyMatrices(rotM, mesh.matrixWorld);
    const local = new THREE.Matrix4().multiplyMatrices(parentInv, world);
    local.decompose(mesh.position, mesh.quaternion, mesh.scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const lista = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of lista) if (m) m.side = THREE.FrontSide;
    parent.add(mesh);
  };
  const id = new THREE.Matrix4();
  for (const mesh of extra) flytta(mesh, skrov, id);
  flytta(tornMesh, torn, tornInv);
  rigg.updateMatrixWorld(true);
  const front = new THREE.Box3().setFromObject(tornMesh);
  const minZ = front.min.z - torn.position.z;
  const sikte = new THREE.Vector3(0.06, 0.08, (Number.isFinite(minZ) ? minZ : -1) - 0.35);
  const storlek = new THREE.Box3().setFromObject(rigg).getSize(new THREE.Vector3());
  return {rigg, skrov, torn, eldror, sikte, rapport: {skala: +s.toFixed(3), hojd: +storlek.y.toFixed(2), langd: +Math.max(storlek.x, storlek.z).toFixed(2), sikteZ: +sikte.z.toFixed(2), tornY: +torn.position.y.toFixed(2)}};
}

function klonaMal(mall) {
  const mesh = mall.clone();
  mesh.material = mall.material.clone();
  if (mesh.material.emissive == null) mesh.material.emissive = new THREE.Color(0, 0, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export async function byggVarld(scene, renderer) {
  const sol = ljusOchMark(scene);
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(8, 10, 6), new THREE.MeshBasicMaterial({color: 0xc5d4c4, side: THREE.BackSide})));
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(env, 0.04).texture;
  pmrem.dispose();

  const draco = new DRACOLoader().setDecoderPath(new URL('../flyg/vendor/libs/draco/', import.meta.url).href).setDecoderConfig({type: 'wasm'}).setWorkerLimit(2);
  const ktx2 = new KTX2Loader().setTranscoderPath(new URL('../flyg/vendor/libs/basis/', import.meta.url).href).detectSupport(renderer);
  await MeshoptDecoder.ready;
  const loader = new GLTFLoader().setDRACOLoader(draco).setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder);
  const glb = async fil => {
    try { return await loader.loadAsync(new URL(BAS + fil, import.meta.url).href); }
    catch (e) { throw new Error(fil + ': ' + (e.message || e)); }
  };

  const [shermanGlb, tigerGlb, hackGlb, hackTradGlb, ekGlb, bokGlb, husA, husB, radhus] = await Promise.all([
    glb('sherman_m4_barking_dogo_lod4.glb'),
    glb('tiger_i_heavy_v2_v2_pbr_lod2.glb'),
    glb('hack_bocage_4m_c.glb'),
    glb('hack_bocage_med_trad_a.glb'),
    glb('trad_ek_b.glb'),
    glb('trad_bok_c.glb'),
    glb('stenhus_a_L0.glb'),
    glb('stenhus_b_L0.glb'),
    glb('radhus_d_L0.glb')
  ]);

  const spelare = byggSherman(shermanGlb);
  scene.add(spelare.rigg);

  const tigerMall = bakaTiger(tigerGlb);
  const box = tigerMall.mesh.geometry.boundingBox.clone();
  const mal = [
    {x0: -26, z0: -220, amp: 0, fart: 0},
    {x0: 36, z0: -430, amp: 34, fart: 2.2, fas: 0.4},
    {x0: -48, z0: -640, amp: 0, fart: 0},
    {x0: 18, z0: -800, amp: 42, fart: 1.5, fas: 1.7}
  ];
  const tigrar = mal.map(m => {
    const mesh = klonaMal(tigerMall.mesh);
    const dx = -m.x0;
    const dz = -m.z0;
    mesh.position.set(m.x0, 0, m.z0);
    mesh.rotation.y = Math.atan2(dx, dz);
    mesh.userData.blixt = 0;
    scene.add(mesh);
    return {mesh, box, ...m, fas: m.fas || 0};
  });

  const hack = geometriFran(hackGlb);
  const hackTrad = geometriFran(hackTradGlb);
  const linjer = [
    ...mur(-40, 36, 40, 36, null, true),
    ...mur(-40, -36, 40, -36, [32, 48], true),
    ...mur(40, -36, 40, 36, null, true),
    ...mur(-40, 36, -40, -36, null, true),
    ...mur(-90, -150, 100, -150, [70, 120], false)
  ];
  const rak = instans(hack.geometry, hack.material, linjer.filter(p => !p.trad));
  const medTrad = instans(hackTrad.geometry, hackTrad.material, linjer.filter(p => p.trad));
  if (rak) scene.add(rak);
  if (medTrad) scene.add(medTrad);

  const ek = geometriFran(ekGlb);
  const bok = geometriFran(bokGlb);
  const ekPlatser = [
    {x: -34, z: 22, yaw: 0.4}, {x: 32, z: 16, yaw: 1.2}, {x: 22, z: -70, yaw: 0.2},
    {x: -18, z: -78, yaw: 2.1}, {x: 48, z: -210, yaw: 0.6}, {x: -55, z: -250, yaw: 1.4}
  ];
  const bokPlatser = [
    {x: -22, z: 8, yaw: 0.8}, {x: 14, z: -48, yaw: 2.4}, {x: -36, z: -110, yaw: 0.3}, {x: 40, z: -120, yaw: 1.1}
  ];
  const ekMesh = instans(ek.geometry, ek.material, ekPlatser);
  const bokMesh = instans(bok.geometry, bok.material, bokPlatser);
  if (ekMesh) scene.add(ekMesh);
  if (bokMesh) scene.add(bokMesh);

  const hus = (gltf, x, z, yaw) => {
    const g = gltf.scene.clone(true);
    g.position.set(x, 0.12, z);
    g.rotation.y = yaw;
    g.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
    scene.add(g);
  };
  hus(husA, 24, -58, -0.4);
  hus(husB, -46, 12, 1.1);
  hus(radhus, -8, 78, 0.08);

  draco.dispose();
  ktx2.dispose();
  return {
    sol,
    ...spelare,
    tigrar,
    rapport: {
      sherman: spelare.rapport,
      tiger: {skala: +tigerMall.skala.toFixed(3), storlek: tigerMall.storlek.toArray().map(v => +v.toFixed(2))},
      hack: linjer.length
    }
  };
}

export function stegaMal(m, dt) {
  if (!(m.fart > 0)) return;
  const foreX = m.mesh.position.x;
  const foreZ = m.mesh.position.z;
  m.fas += dt * m.fart / Math.max(8, m.amp);
  const x = m.x0 + Math.sin(m.fas) * m.amp;
  const z = m.z0;
  const dx = x - foreX;
  const dz = z - foreZ;
  if (dx * dx + dz * dz > 1e-8) m.mesh.rotation.y = Math.atan2(dx, dz);
  m.mesh.position.set(x, 0, z);
}
