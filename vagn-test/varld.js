import * as THREE from 'three';
import {GLTFLoader} from '../js/vendor/loaders/GLTFLoader.js';
import {MeshoptDecoder} from '../js/vendor/loaders/meshopt_decoder.module.js';
import {DRACOLoader} from '../flyg/vendor/loaders/DRACOLoader.js';
import {KTX2Loader} from '../flyg/vendor/loaders/KTX2Loader.js';
import {mergeGeometries} from '../js/vendor/utils/BufferGeometryUtils.js';
import {hojdY} from './hojd.js?v=5';

const BAS = '../panorama/modeller/';
const TERR = './terrang/';

function ljusOchMark(scene) {
  scene.fog = new THREE.Fog(0xd5dece, 80, 1900);
  scene.add(new THREE.HemisphereLight(0xcfe0ea, 0x3e4a30, 0.95));
  const sol = new THREE.DirectionalLight(0xfff1d4, 1.85);
  sol.position.set(-40, 80, 28);
  sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024);
  sol.shadow.camera.near = 8;
  sol.shadow.camera.far = 180;
  sol.shadow.camera.left = -55;
  sol.shadow.camera.right = 55;
  sol.shadow.camera.top = 55;
  sol.shadow.camera.bottom = -55;
  sol.shadow.bias = -0.0004;
  sol.shadow.normalBias = 0.06;
  scene.add(sol, sol.target);

  const sky = new THREE.Mesh(new THREE.SphereGeometry(1800, 28, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top: {value: new THREE.Color(0x7eadd8)},
      horisont: {value: new THREE.Color(0xd5dece)},
      botten: {value: new THREE.Color(0xb4c09a)}
    },
    vertexShader: 'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'varying vec3 vP;uniform vec3 top,horisont,botten;void main(){float h=normalize(vP).y;vec3 c=mix(botten,horisont,smoothstep(-0.22,0.04,h));c=mix(c,top,smoothstep(0.02,0.5,h));gl_FragColor=vec4(c,1.0);}'
  }));
  sky.name = 'himmel';
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  return {sol, sky};
}

function markMaterial(texturer) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      gras: {value: texturer.gras},
      aker: {value: texturer.aker},
      grus: {value: texturer.grus},
      lera: {value: texturer.lera},
      skog: {value: texturer.skog},
      sol: {value: new THREE.Vector3(-0.45, 0.82, 0.32).normalize()},
      topp: {value: new THREE.Color(0xfff1d4)},
      jord: {value: new THREE.Color(0x3a4630)},
      himmel: {value: new THREE.Color(0xc5d6e4)}
    },
    vertexShader: 'varying vec3 vW;varying vec3 vN;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader: 'uniform sampler2D gras,aker,grus,lera,skog;uniform vec3 sol,topp,jord,himmel;varying vec3 vW;varying vec3 vN;vec3 lin(vec3 c){return mix(pow(c*0.9478672986+vec3(0.0521327014),vec3(2.4)),c*0.0773993808,vec3(lessThanEqual(c,vec3(0.04045))));}void main(){float sl=clamp(1.0-vN.y,0.0,1.0);vec3 g=lin(texture2D(gras,vW.xz/6.0).rgb);vec3 a=lin(texture2D(aker,vW.xz/9.0).rgb);vec3 r=lin(texture2D(grus,vW.xz/3.5).rgb);vec3 m=lin(texture2D(lera,vW.xz/4.0).rgb);vec3 s=lin(texture2D(skog,vW.xz/5.0).rgb);float n=fract(sin(dot(floor(vW.xz*0.04),vec2(127.1,311.7)))*43758.5453);vec3 c=mix(g,a,smoothstep(0.58,0.84,n)*(1.0-smoothstep(0.2,0.48,sl)));c=mix(c,s,smoothstep(0.3,0.52,n)*smoothstep(0.04,0.22,sl));c=mix(c,m,smoothstep(0.18,0.42,sl));c=mix(c,r,smoothstep(0.45,0.75,sl));float nd=clamp(dot(normalize(vN),sol),0.0,1.0);gl_FragColor=vec4(c*(himmel*0.42+jord*0.28+topp*nd*0.9),1.0);}'
  });
}

function textur(url, loader) {
  return new Promise((ok, nej) => {
    loader.load(url, t => {
      t.colorSpace = THREE.NoColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 4;
      ok(t);
    }, undefined, nej);
  });
}

function klippKjol(geom, hojd) {
  const src = geom.index ? geom.toNonIndexed() : geom;
  const pos = src.getAttribute('position');
  const normal = src.getAttribute('normal');
  const halla = [];
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    let kjol = false;
    for (let k = 0; k < 3; k++) {
      v.fromBufferAttribute(pos, i + k);
      if (v.y < hojd(v.x, v.z) - 1.25) kjol = true;
    }
    if (!kjol) halla.push(i, i + 1, i + 2);
  }
  const ut = new THREE.BufferGeometry();
  const p = new Float32Array(halla.length * 3);
  const n = normal ? new Float32Array(halla.length * 3) : null;
  const uv = new Float32Array(halla.length * 2);
  for (let i = 0; i < halla.length; i++) {
    const vi = halla[i];
    p[i * 3] = pos.getX(vi);
    p[i * 3 + 1] = pos.getY(vi);
    p[i * 3 + 2] = pos.getZ(vi);
    uv[i * 2] = p[i * 3] / 6;
    uv[i * 2 + 1] = p[i * 3 + 2] / 6;
    if (n) {
      n[i * 3] = normal.getX(vi);
      n[i * 3 + 1] = normal.getY(vi);
      n[i * 3 + 2] = normal.getZ(vi);
    }
  }
  ut.setAttribute('position', new THREE.BufferAttribute(p, 3));
  ut.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  if (n) ut.setAttribute('normal', new THREE.BufferAttribute(n, 3));
  else ut.computeVertexNormals();
  ut.computeBoundingSphere();
  return ut;
}

async function laddMark(loader, scene, hojd, material) {
  const filer = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const id = 'r' + String(r).padStart(2, '0') + '_' + String(c).padStart(2, '0');
    const detalj = r >= 1 && r <= 6 && c >= 1 && c <= 6;
    filer.push({id, lod: detalj ? 'lod_10m' : 'lod_50m', detalj});
  }
  let klara = 0;
  const grupp = new THREE.Group();
  grupp.name = 'mark';
  const ett = async fil => {
    const gltf = await loader.loadAsync(new URL(TERR + 'mark/' + fil.lod + '/' + fil.id + '.glb', import.meta.url).href);
    let mesh = null;
    gltf.scene.traverse(n => { if (!mesh && n.isMesh) mesh = n; });
    if (!mesh) throw new Error(fil.id + ' saknar mark');
    const geom = klippKjol(mesh.geometry, hojd);
    const antal = geom.getAttribute('position').count;
    if (antal >= 9) {
      const yta = new THREE.Mesh(geom, material);
      yta.name = fil.id;
      yta.receiveShadow = false;
      yta.castShadow = false;
      grupp.add(yta);
      klara++;
    } else fil.tom = true;
  };
  const ko = filer.slice();
  const arbetare = Array.from({length: 6}, async () => {
    while (ko.length) await ett(ko.pop());
  });
  await Promise.all(arbetare);
  scene.add(grupp);
  return {rutor: klara, detalj: filer.filter(f => f.detalj).length, tomma: filer.filter(f => f.tom).length};
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

function framAxel(geom) {
  const pos = geom.getAttribute('position');
  const b = geom.boundingBox;
  const sizeX = b.max.x - b.min.x;
  const sizeZ = b.max.z - b.min.z;
  const langdX = sizeX >= sizeZ;
  const span = Math.max(0.001, langdX ? sizeX : sizeZ);
  const min = langdX ? b.min.x : b.min.z;
  let r0 = 0, n0 = 0, r1 = 0, n1 = 0;
  const v = new THREE.Vector3();
  const steg = Math.max(1, Math.floor(pos.count / 4000));
  for (let i = 0; i < pos.count; i += steg) {
    v.fromBufferAttribute(pos, i);
    const t = ((langdX ? v.x : v.z) - min) / span;
    const rad = langdX ? Math.hypot(v.z, v.y) : Math.hypot(v.x, v.y);
    if (t < 0.16) { r0 += rad; n0++; }
    else if (t > 0.84) { r1 += rad; n1++; }
  }
  const a0 = n0 ? r0 / n0 : 1;
  const a1 = n1 ? r1 / n1 : 1;
  const sign = a1 < a0 ? 1 : -1;
  const fram = new THREE.Vector3(langdX ? sign : 0, 0, langdX ? 0 : sign);
  const hoger = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), fram).normalize();
  return {fram, hoger};
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
    const box = new THREE.Box3().setFromBufferAttribute(g.getAttribute('position'));
    if (box.getSize(new THREE.Vector3()).lengthSq() < 1e-4) return;
    geoms.push(rent(g));
  });
  const merged = mergeGeometries(geoms, false);
  if (!merged) throw new Error('Tiger-geometrin gick inte att slå ihop');
  merged.computeBoundingBox();
  const size = merged.boundingBox.getSize(new THREE.Vector3());
  const langd = Math.max(size.x, size.z);
  const skala = langd > 12 || langd < 5.2 ? 8.2 / langd : 1;
  if (skala !== 1) merged.scale(skala, skala, skala);
  merged.computeBoundingBox();
  merged.translate(0, -merged.boundingBox.min.y, 0);
  merged.computeBoundingBox();
  const c = merged.boundingBox.getCenter(new THREE.Vector3());
  merged.translate(-c.x, 0, -c.z);
  merged.computeBoundingBox();
  merged.computeBoundingSphere();
  const axel = framAxel(merged);
  const mesh = new THREE.Mesh(merged, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return {mesh, skala, storlek: merged.boundingBox.getSize(new THREE.Vector3()), ...axel};
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

function geomFranTri(tris) {
  const p = new Float32Array(tris.length * 9);
  const n = new Float32Array(tris.length * 9);
  const uv = new Float32Array(tris.length * 6);
  let harN = false;
  let harUv = false;
  tris.forEach((tri, i) => {
    for (let k = 0; k < 3; k++) {
      p[(i * 3 + k) * 3] = tri.p[k].x;
      p[(i * 3 + k) * 3 + 1] = tri.p[k].y;
      p[(i * 3 + k) * 3 + 2] = tri.p[k].z;
      if (tri.n) {
        harN = true;
        n[(i * 3 + k) * 3] = tri.n[k].x;
        n[(i * 3 + k) * 3 + 1] = tri.n[k].y;
        n[(i * 3 + k) * 3 + 2] = tri.n[k].z;
      }
      if (tri.uv) {
        harUv = true;
        uv[(i * 3 + k) * 2] = tri.uv[k][0];
        uv[(i * 3 + k) * 2 + 1] = tri.uv[k][1];
      }
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  if (harN) g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
  else g.computeVertexNormals();
  if (harUv) g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.computeBoundingSphere();
  return g;
}

function trianglar(geom, matris) {
  const src = geom.index ? geom.toNonIndexed() : geom;
  const pos = src.getAttribute('position');
  const normal = src.getAttribute('normal');
  const uv = src.getAttribute('uv');
  const rot = new THREE.Matrix3().setFromMatrix4(matris);
  const v = new THREE.Vector3();
  const nrm = new THREE.Vector3();
  const ut = [];
  for (let i = 0; i < pos.count; i += 3) {
    const tri = {p: [], n: normal ? [] : null, uv: uv ? [] : null};
    for (let k = 0; k < 3; k++) {
      v.fromBufferAttribute(pos, i + k).applyMatrix4(matris);
      tri.p.push(v.clone());
      if (normal) {
        nrm.fromBufferAttribute(normal, i + k).applyMatrix3(rot).normalize();
        tri.n.push(nrm.clone());
      }
      if (uv) tri.uv.push([uv.getX(i + k), uv.getY(i + k)]);
    }
    ut.push(tri);
  }
  return ut;
}

function snittZ(tris) {
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const tri of tris) for (const p of tri.p) {
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  }
  const span = Math.max(0.001, maxZ - minZ);
  return minZ + span * 0.36;
}

function spetsAv(tris) {
  let minZ = Infinity;
  for (const tri of tris) for (const p of tri.p) if (p.z < minZ) minZ = p.z;
  let x = 0, y = 0, n = 0;
  for (const tri of tris) for (const p of tri.p) {
    if (p.z < minZ + 0.2) { x += p.x; y += p.y; n++; }
  }
  return new THREE.Vector3(n ? x / n : 0, n ? y / n : 0.2, minZ);
}

function laggPipa(eldror, material, eldTri, reserv) {
  const pipa = new THREE.Group();
  pipa.name = 'pipa';
  eldror.add(pipa);
  let tri = eldTri;
  if (!tri || tri.length < 12) tri = null;
  let mesh;
  if (tri) {
    mesh = new THREE.Mesh(geomFranTri(tri), material);
  } else {
    mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, reserv.langd, 10), material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(reserv.mitt);
    tri = [];
  }
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  pipa.add(mesh);
  const mynning = new THREE.Object3D();
  mynning.name = 'mynning';
  if (eldTri && eldTri.length >= 12) mynning.position.copy(spetsAv(eldTri));
  else mynning.position.set(reserv.mitt.x, reserv.mitt.y, reserv.mitt.z - reserv.langd / 2);
  pipa.add(mynning);
  return {pipa, mynning, tri: tri.length};
}

function lyftPipa(spelare) {
  const {torn, eldror} = spelare;
  const meshar = [];
  torn.traverse(n => {
    if (!n.isMesh) return;
    let p = n;
    let under = false;
    while (p) {
      if (p === eldror) under = true;
      p = p.parent;
    }
    if (!under) meshar.push(n);
  });
  const pipa = new THREE.Group();
  pipa.name = 'pipa';
  eldror.add(pipa);
  let tri = 0;
  const storst = meshar.sort((a, b) => {
    const sa = new THREE.Box3().setFromObject(a).getSize(new THREE.Vector3());
    const sb = new THREE.Box3().setFromObject(b).getSize(new THREE.Vector3());
    return sb.x * sb.y * sb.z - sa.x * sa.y * sa.z;
  })[0];
  if (storst) {
    torn.updateWorldMatrix(true, false);
    storst.updateWorldMatrix(true, false);
    const matris = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().copy(torn.matrixWorld).invert(), storst.matrixWorld);
    const alla = trianglar(storst.geometry, matris);
    const cut = snittZ(alla);
    const eld = [];
    const kropp = [];
    for (const t of alla) {
      const z = (t.p[0].z + t.p[1].z + t.p[2].z) / 3;
      if (z < cut) eld.push(t);
      else kropp.push(t);
    }
    if (eld.length >= 40 && kropp.length >= 40) {
      const kroppMesh = new THREE.Mesh(geomFranTri(kropp), storst.material);
      kroppMesh.castShadow = true;
      kroppMesh.receiveShadow = true;
      torn.add(kroppMesh);
      const eldMesh = new THREE.Mesh(geomFranTri(eld), storst.material);
      eldMesh.castShadow = true;
      eldMesh.receiveShadow = true;
      pipa.add(eldMesh);
      storst.removeFromParent();
      tri = eld.length;
      spelare.rapport.snitt = +cut.toFixed(2);
    } else {
      for (const m of meshar) pipa.attach(m);
    }
  }
  pipa.updateWorldMatrix(true, false);
  const box = new THREE.Box3().setFromObject(pipa);
  const mynning = new THREE.Object3D();
  mynning.name = 'mynning';
  const nos = new THREE.Vector3((box.min.x + box.max.x) / 2, box.min.y + (box.max.y - box.min.y) * 0.45, box.min.z - 0.05);
  pipa.worldToLocal(nos);
  mynning.position.copy(nos);
  pipa.add(mynning);
  spelare.pipa = pipa;
  spelare.mynning = mynning;
  spelare.rapport.pipa = tri;
}

function synligBotten(rot) {
  rot.updateWorldMatrix(true, false);
  const b = new THREE.Box3();
  const tmp = new THREE.Box3();
  let n = 0;
  rot.traverse(o => {
    if (!o.isMesh || !o.visible) return;
    tmp.setFromObject(o);
    if (tmp.isEmpty()) return;
    b.union(tmp);
    n++;
  });
  return n ? b : null;
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
  rigg.rotation.order = 'YXZ';
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
  const spelare = {id: 'sherman', rigg, skrov, torn, eldror, sikte, rapport: {skala: +s.toFixed(3), hojd: +storlek.y.toFixed(2), langd: +Math.max(storlek.x, storlek.z).toFixed(2), sikteZ: +sikte.z.toFixed(2), tornY: +torn.position.y.toFixed(2)}};
  lyftPipa(spelare);
  const botten = synligBotten(rigg);
  if (botten && botten.min.y > 0.02) skrov.position.y -= botten.min.y;
  return spelare;
}

function bakaSkinn(n, v) {
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
  return g;
}

function klassNod(n) {
  let p = n;
  while (p) {
    const namn = p.name || '';
    if (namn === 'Gun' || namn === 'MG_Coax') return 'eldror';
    if (namn === 'Turret') return 'torn';
    p = p.parent;
  }
  return 'skrov';
}

function byggTigerSpelare(gltf) {
  const root = gltf.scene;
  root.updateMatrixWorld(true);
  const v = new THREE.Vector3();
  const hink = {skrov: [], torn: [], eldror: []};
  root.traverse(n => {
    if (!n.isMesh || /muzzle|^fire_/i.test(n.name || '')) return;
    const g = bakaSkinn(n, v);
    g.computeBoundingBox();
    if (g.boundingBox.getSize(new THREE.Vector3()).lengthSq() < 1e-3) return;
    hink[klassNod(n)].push(new THREE.Mesh(g, n.material));
  });
  if (!hink.eldror.length || !hink.torn.length || !hink.skrov.length) {
    throw new Error('Tigern saknar skrov, torn eller eldrör');
  }
  const mitt = lista => {
    const b = new THREE.Box3();
    for (const m of lista) b.union(m.geometry.boundingBox);
    return b.getCenter(new THREE.Vector3());
  };
  const rikt = mitt(hink.eldror).sub(mitt(hink.skrov));
  rikt.y = 0;
  if (rikt.lengthSq() < 1e-4) rikt.set(0, 0, 1);
  rikt.normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(rikt, new THREE.Vector3(0, 0, -1));
  const rot = new THREE.Matrix4().makeRotationFromQuaternion(q);
  const alla = [...hink.skrov, ...hink.torn, ...hink.eldror];
  for (const m of alla) {
    m.geometry.applyMatrix4(rot);
    m.geometry.computeBoundingBox();
  }
  const hel = new THREE.Box3();
  for (const m of alla) hel.union(m.geometry.boundingBox);
  const stor = hel.getSize(new THREE.Vector3());
  const langd = Math.max(stor.x, stor.z);
  const skala = langd > 14 || langd < 5 ? 8.4 / langd : 1;
  if (skala !== 1) for (const m of alla) m.geometry.scale(skala, skala, skala);
  const jord = new THREE.Box3();
  for (const m of alla) {
    m.geometry.computeBoundingBox();
    jord.union(m.geometry.boundingBox);
  }
  const flytt = new THREE.Matrix4().makeTranslation(-(jord.min.x + jord.max.x) / 2, -jord.min.y, -(jord.min.z + jord.max.z) / 2);
  for (const m of alla) m.geometry.applyMatrix4(flytt);
  const tornBox = new THREE.Box3();
  for (const m of hink.torn) {
    m.geometry.computeBoundingBox();
    tornBox.union(m.geometry.boundingBox);
  }
  const pivot = tornBox.getCenter(new THREE.Vector3());
  const drag = new THREE.Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z);
  for (const m of [...hink.torn, ...hink.eldror]) m.geometry.applyMatrix4(drag);

  const rigg = new THREE.Group();
  const skrov = new THREE.Group();
  const torn = new THREE.Group();
  const eldror = new THREE.Group();
  rigg.name = 'tiger';
  rigg.rotation.order = 'YXZ';
  rigg.add(skrov);
  skrov.add(torn);
  torn.add(eldror);
  torn.position.copy(pivot);
  for (const m of hink.skrov) { m.castShadow = true; m.receiveShadow = true; skrov.add(m); }
  for (const m of hink.torn) { m.castShadow = true; m.receiveShadow = true; torn.add(m); }
  const eldTri = [];
  let eldMat = hink.eldror[0].material;
  for (const m of hink.eldror) eldTri.push(...trianglar(m.geometry, new THREE.Matrix4()));
  const pip = laggPipa(eldror, eldMat, eldTri, {langd: 3.2, mitt: new THREE.Vector3(0, 0.1, -1.2)});
  const sikteBox = new THREE.Box3();
  for (const m of hink.torn) sikteBox.union(new THREE.Box3().setFromBufferAttribute(m.geometry.getAttribute('position')));
  const sikte = new THREE.Vector3(0.15, Math.max(0.2, sikteBox.max.y * 0.42), Math.min(-0.3, sikteBox.min.z * 0.35));
  const hojd = jord.getSize(new THREE.Vector3()).y * skala;
  return {
    id: 'tiger', rigg, skrov, torn, eldror, pipa: pip.pipa, mynning: pip.mynning, sikte,
    rapport: {skala: +skala.toFixed(3), hojd: +hojd.toFixed(2), langd: +(langd * (skala === 1 ? 1 : skala)).toFixed(2), pipa: pip.tri, sikteZ: +sikte.z.toFixed(2)}
  };
}

function klonaMal(mall) {
  const mesh = mall.clone();
  mesh.material = mall.material.clone();
  if (mesh.material.emissive == null) mesh.material.emissive = new THREE.Color(0, 0, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function propPack(gltf) {
  gltf.scene.updateMatrixWorld(true);
  const delar = [];
  gltf.scene.traverse(n => {
    if (!n.isMesh) return;
    const g = n.geometry.clone();
    n.updateWorldMatrix(true, false);
    g.applyMatrix4(n.matrixWorld);
    delar.push({geometry: g, material: n.material});
  });
  const box = new THREE.Box3();
  for (const d of delar) {
    d.geometry.computeBoundingBox();
    box.union(d.geometry.boundingBox);
  }
  function centrera(delar) {
  const box = new THREE.Box3();
  for (const d of delar) {
    d.geometry.computeBoundingBox();
    box.union(d.geometry.boundingBox);
  }
  const cx = (box.min.x + box.max.x) / 2;
  const cz = (box.min.z + box.max.z) / 2;
  for (const d of delar) d.geometry.translate(-cx, -box.min.y, -cz);
  return box;
}
  centrera(delar);
  let size = new THREE.Box3();
  for (const d of delar) {
    d.geometry.computeBoundingBox();
    size.union(d.geometry.boundingBox);
  }
  size = size.getSize(new THREE.Vector3());
  if (size.y < Math.min(size.x, size.z) * 0.45) {
    for (const d of delar) d.geometry.rotateX(-Math.PI / 2);
    centrera(delar);
    size = new THREE.Box3();
    for (const d of delar) {
      d.geometry.computeBoundingBox();
      size.union(d.geometry.boundingBox);
    }
    size = size.getSize(new THREE.Vector3());
  }
  return {delar, langd: Math.max(size.x, size.z), hojd: size.y, axel: size.x >= size.z ? 'x' : 'z'};
}

function skalaTillHojd(pack, mal) {
  if (pack.hojd >= mal * 0.7 && pack.hojd <= mal * 1.5) return;
  const s = mal / Math.max(pack.hojd, 0.01);
  for (const d of pack.delar) d.geometry.scale(s, s, s);
  pack.hojd *= s;
  pack.langd *= s;
}

function tonaBocage(mat) {
  const lista = Array.isArray(mat) ? mat : [mat];
  for (const m of lista) {
    if (!m || !m.color) continue;
    m.side = THREE.DoubleSide;
    m.map = null;
    m.color.setHex(0x3f4a2c);
  }
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

function mur(x0, z0, x1, z1, lucka, trad, steg) {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const len = Math.hypot(dx, dz) || 1;
  const ut = [];
  const s = steg || 4;
  for (let d = 0; d + s * 0.9 <= len; d += s) {
    const mitt = d + s * 0.5;
    if (lucka && mitt >= lucka[0] && mitt <= lucka[1]) continue;
    ut.push({x: x0 + dx * (mitt / len), z: z0 + dz * (mitt / len), trad: !!trad, ux: dx / len, uz: dz / len});
  }
  return ut;
}

function yawLangs(axel, ux, uz) {
  if (axel === 'x') return Math.atan2(-uz, ux);
  return Math.atan2(ux, uz);
}

function enLod(rot) {
  const grupper = new Map();
  rot.traverse(n => {
    if (!n.isMesh) return;
    const bas = (n.name || 'mesh').replace(/_lod(?:_\d+)?$/, '');
    if (!grupper.has(bas)) grupper.set(bas, []);
    grupper.get(bas).push(n);
  });
  for (const lista of grupper.values()) {
    if (lista.length < 2) continue;
    lista.sort((a, b) => (b.geometry.getAttribute('position')?.count || 0) - (a.geometry.getAttribute('position')?.count || 0));
    for (let i = 1; i < lista.length; i++) lista[i].visible = false;
  }
}

function stallHus(gltf, x, z, yaw, hojd) {
  const g = gltf.scene.clone(true);
  g.traverse(n => {
    if (/burning|collapsed|damaged|fire|debris|fx_/i.test(n.name || '')) n.visible = false;
  });
  enLod(g);
  g.position.set(x, 0, z);
  g.rotation.y = yaw;
  g.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(g);
  g.position.y += hojd(x, z) - box.min.y;
  g.traverse(n => {
    if (!n.isMesh) return;
    n.castShadow = true;
    n.receiveShadow = true;
  });
  return g;
}

export async function byggVarld(scene, renderer) {
  const {sol, sky} = ljusOchMark(scene);
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
    try {
      const gltf = await loader.loadAsync(new URL(fil, import.meta.url).href);
      gltf.scene.traverse(n => {
        if (!n.material) return;
        const lista = Array.isArray(n.material) ? n.material : [n.material];
        for (const m of lista) if (m) { m.aoMap = null; m.lightMap = null; }
      });
      return gltf;
    }
    catch (e) { throw new Error(fil + ': ' + (e.message || e)); }
  };
  const texLadd = new THREE.TextureLoader();

  const hfUrl = new URL(TERR + 'mark/heightfield_5m.f32', import.meta.url).href;
  const hfSvar = await fetch(hfUrl);
  if (!hfSvar.ok) throw new Error('höjdfält ' + hfSvar.status);
  const hf = new Float32Array(await hfSvar.arrayBuffer());
  if (hf.length !== 401 * 401) throw new Error('höjdfält ' + hf.length);
  const hojd = (x, z) => hojdY(x, z, hf);

  const [gras, aker, grus, lera, skog] = await Promise.all([
    textur(new URL(TERR + 'texturer/Grass004_farg.jpg', import.meta.url).href, texLadd),
    textur(new URL(TERR + 'texturer/farm_furrows_farg.jpg', import.meta.url).href, texLadd),
    textur(new URL(TERR + 'texturer/Gravel022_farg.jpg', import.meta.url).href, texLadd),
    textur(new URL(TERR + 'texturer/brown_mud_farg.jpg', import.meta.url).href, texLadd),
    textur(new URL(TERR + 'texturer/forest_leaves_02_farg.jpg', import.meta.url).href, texLadd)
  ]);
  const mark = await laddMark(loader, scene, hojd, markMaterial({gras, aker, grus, lera, skog}));

  const [shermanGlb, tigerGlb, hackGlb, ekGlb, granGlb, husGlb, ladaGlb] = await Promise.all([
    glb(BAS + 'sherman_m4_barking_dogo_lod4.glb'),
    glb(BAS + 'tiger_i_heavy_v2_v2_pbr_lod2.glb'),
    glb(TERR + 'props/bocage_rak_10m_lod2.glb'),
    glb(TERR + 'props/ek_mellan_lod2.glb'),
    glb(TERR + 'props/gran_mellan_lod2.glb'),
    glb(TERR + 'props/house_d_lod2.glb'),
    glb(TERR + 'props/lada_bessin_sten_lod2.glb')
  ]);

  const sherman = byggSherman(shermanGlb);
  const tigerSpelare = byggTigerSpelare(tigerGlb);
  tigerSpelare.rigg.visible = false;
  scene.add(sherman.rigg, tigerSpelare.rigg);

  const tigerMall = bakaTiger(tigerGlb);
  const box = tigerMall.mesh.geometry.boundingBox.clone();
  const mal = [
    {x0: -16, z0: -230, amp: 0, fart: 0},
    {x0: 42, z0: -410, amp: 26, fart: 1.8, fas: 0.4},
    {x0: -38, z0: -620, amp: 0, fart: 0},
    {x0: 22, z0: -790, amp: 20, fart: 1.3, fas: 1.2}
  ];
  const tigrar = mal.map(m => {
    const mesh = klonaMal(tigerMall.mesh);
    const dx = -m.x0;
    const dz = -m.z0;
    mesh.position.set(m.x0, hojd(m.x0, m.z0), m.z0);
    mesh.rotation.order = 'YXZ';
    mesh.rotation.y = Math.atan2(dx, dz);
    mesh.userData.blixt = 0;
    scene.add(mesh);
    return {mesh, box, fram: tigerMall.fram, hoger: tigerMall.hoger, ...m, fas: m.fas || 0, yVid: hojd};
  });

  const hack = propPack(hackGlb);
  skalaTillHojd(hack, 2.4);
  for (const d of hack.delar) tonaBocage(d.material);
  const linjer = [
    ...mur(-70, -90, 80, -110, [40, 78], true, hack.langd * 0.96),
    ...mur(-20, -250, 110, -270, null, false, hack.langd * 0.96),
    ...mur(50, -340, 55, -470, [30, 70], true, hack.langd * 0.96),
    ...mur(-140, -500, 10, -520, null, false, hack.langd * 0.96),
    ...mur(-90, -180, -95, -40, null, true, hack.langd * 0.96),
    ...mur(130, -160, 170, -340, [40, 90], false, hack.langd * 0.96),
    ...mur(-150, -680, -20, -740, null, true, hack.langd * 0.96),
    ...mur(10, -800, 150, -780, [40, 80], false, hack.langd * 0.96)
  ];
  const medY = lista => lista.map(p => ({...p, y: hojd(p.x, p.z), yaw: yawLangs(hack.axel, p.ux, p.uz)}));
  const rakPlatser = medY(linjer.filter(p => !p.trad));
  const tradPlatser = medY(linjer.filter(p => p.trad));
  for (const d of hack.delar) {
    const mesh = instans(d.geometry, d.material, rakPlatser);
    if (mesh) scene.add(mesh);
  }
  for (const d of hack.delar) {
    const mesh = instans(d.geometry, d.material, tradPlatser);
    if (mesh) scene.add(mesh);
  }

  const ek = propPack(ekGlb);
  const gran = propPack(granGlb);
  skalaTillHojd(ek, 12);
  skalaTillHojd(gran, 14);
  const ekPlatser = [];
  const granPlatser = [];
  linjer.forEach((p, i) => {
    if (i % 3 !== 0) return;
    const sida = i % 2 === 0 ? 1 : -1;
    const x = p.x + p.uz * 7 * sida;
    const z = p.z - p.ux * 7 * sida;
    const plats = {x, z, y: hojd(x, z), yaw: (i * 0.7) % 6.2};
    if (i % 2 === 0) ekPlatser.push(plats);
    else granPlatser.push(plats);
  });
  for (const extra of [
    {x: -24, z: 18}, {x: 28, z: 22}, {x: -48, z: -30}, {x: 36, z: -40}
  ]) ekPlatser.push({...extra, y: hojd(extra.x, extra.z), yaw: extra.x});
  for (const d of ek.delar) {
    const mesh = instans(d.geometry, d.material, ekPlatser);
    if (mesh) scene.add(mesh);
  }
  for (const d of gran.delar) {
    const mesh = instans(d.geometry, d.material, granPlatser);
    if (mesh) scene.add(mesh);
  }

  const husLista = [
    [husGlb, 78, -175, 0.5],
    [husGlb, -120, -280, 1.4],
    [ladaGlb, 36, -455, -0.3],
    [husGlb, -70, -590, 2.2],
    [ladaGlb, 130, -710, 0.8],
    [husGlb, -24, -860, 0.15]
  ];
  for (const [modell, x, z, yaw] of husLista) scene.add(stallHus(modell, x, z, yaw, hojd));

  draco.dispose();
  ktx2.dispose();
  const riggar = {
    sherman_m4_75: sherman,
    sherman_m4a3_76w: sherman,
    tiger_i: tigerSpelare
  };
  return {
    sol, sky, hojd, hf,
    riggar,
    rigg: sherman.rigg,
    skrov: sherman.skrov,
    torn: sherman.torn,
    eldror: sherman.eldror,
    pipa: sherman.pipa,
    mynning: sherman.mynning,
    sikte: sherman.sikte,
    tigrar,
    rapport: {
      sherman: sherman.rapport,
      tigerSpelare: tigerSpelare.rapport,
      tiger: {skala: +tigerMall.skala.toFixed(3), fram: tigerMall.fram.toArray().map(v => +v.toFixed(2))},
      mark,
      hack: linjer.length,
      hackLangd: +hack.langd.toFixed(2),
      hackHojd: +hack.hojd.toFixed(2),
      ekHojd: +ek.hojd.toFixed(2),
      ek: ekPlatser.length,
      gran: granPlatser.length,
      hus: husLista.length,
      hojdOrig: +hojd(0, 0).toFixed(2)
    }
  };
}

export function stegaMal(m, dt) {
  const yVid = m.yVid;
  if (!(m.fart > 0)) {
    if (yVid) m.mesh.position.y = yVid(m.mesh.position.x, m.mesh.position.z);
    return;
  }
  const foreX = m.mesh.position.x;
  const foreZ = m.mesh.position.z;
  m.fas += dt * m.fart / Math.max(8, m.amp);
  const x = m.x0 + Math.sin(m.fas) * m.amp;
  const z = m.z0;
  const dx = x - foreX;
  const dz = z - foreZ;
  if (dx * dx + dz * dz > 1e-8) m.mesh.rotation.y = Math.atan2(dx, dz);
  m.mesh.position.set(x, yVid ? yVid(x, z) : m.mesh.position.y, z);
}
