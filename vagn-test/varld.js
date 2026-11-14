import * as THREE from 'three';
import {GLTFLoader} from '../js/vendor/loaders/GLTFLoader.js';
import {MeshoptDecoder} from '../js/vendor/loaders/meshopt_decoder.module.js';
import {DRACOLoader} from '../flyg/vendor/loaders/DRACOLoader.js';
import {KTX2Loader} from '../flyg/vendor/loaders/KTX2Loader.js';
import {mergeGeometries} from '../js/vendor/utils/BufferGeometryUtils.js';
import {hojdY} from './hojd.js?v=7';
import config from './config.json' with { type: 'json' };

const BAS = '../panorama/modeller/';
const TERR = './terrang/';

function ljusOchMark(scene) {
  scene.fog = new THREE.Fog(0xd5dece, 80, 1900);
  scene.add(new THREE.HemisphereLight(0xcfe0ea, 0x3e4a30, 0.95));
  const sol = new THREE.DirectionalLight(0xfff1d4, 1.85);
  sol.position.set(-40, 80, 28);
  sol.castShadow = true;
  const sk = config.skugga || {};
  const vidd = sk.vidd || 24;
  sol.shadow.mapSize.set(sk.karta || 1024, sk.karta || 1024);
  sol.shadow.camera.near = sk.near || 1.5;
  sol.shadow.camera.far = sk.far || 70;
  sol.shadow.camera.left = -vidd;
  sol.shadow.camera.right = vidd;
  sol.shadow.camera.top = vidd;
  sol.shadow.camera.bottom = -vidd;
  sol.shadow.bias = sk.bias ?? -0.00025;
  sol.shadow.normalBias = sk.normalBias ?? 0.03;
  sol.shadow.radius = 2;
  scene.add(sol, sol.target);

  const sky = new THREE.Mesh(new THREE.SphereGeometry(1800, 28, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top: {value: new THREE.Color(0x7eadd8)},
      horisont: {value: new THREE.Color(0xd5dece)},
      botten: {value: new THREE.Color(0xb4c09a)}
    },
    vertexShader: 'varying vec3 vDir;void main(){vDir=mat3(modelMatrix)*position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'varying vec3 vDir;uniform vec3 top,horisont,botten;void main(){float h=normalize(vDir).y;vec3 c=mix(botten,horisont,smoothstep(-0.28,0.0,h));c=mix(c,top,smoothstep(0.0,0.16,h));gl_FragColor=vec4(c,1.0);}'
  }));
  sky.name = 'himmel';
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  return {sol, sky};
}

function markMaterial(texturer) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    lights: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.lights, {
      gras: {value: texturer.gras},
      aker: {value: texturer.aker},
      grus: {value: texturer.grus},
      lera: {value: texturer.lera},
      skog: {value: texturer.skog},
      sol: {value: new THREE.Vector3(-0.45, 0.82, 0.32).normalize()},
      topp: {value: new THREE.Color(0xfff1d4)},
      jord: {value: new THREE.Color(0x3a4630)},
      himmel: {value: new THREE.Color(0xc5d6e4)}
    }]),
    vertexShader: [
      '#include <common>',
      '#include <shadowmap_pars_vertex>',
      'varying vec3 vW;varying vec3 vN;',
      'void main(){',
      '  vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);',
      '  #include <beginnormal_vertex>',
      '  #include <defaultnormal_vertex>',
      '  #include <begin_vertex>',
      '  #include <worldpos_vertex>',
      '  #include <project_vertex>',
      '  #include <shadowmap_vertex>',
      '}'
    ].join('\n'),
    fragmentShader: [
      '#include <common>',
      '#include <packing>',
      '#include <lights_pars_begin>',
      '#include <shadowmap_pars_fragment>',
      '#include <shadowmask_pars_fragment>',
      'uniform sampler2D gras,aker,grus,lera,skog;uniform vec3 sol,topp,jord,himmel;varying vec3 vW;varying vec3 vN;',
      'vec3 lin(vec3 c){return mix(pow(c*0.9478672986+vec3(0.0521327014),vec3(2.4)),c*0.0773993808,vec3(lessThanEqual(c,vec3(0.04045))));}',
      'void main(){',
      '  float sl=clamp(1.0-vN.y,0.0,1.0);',
      '  vec3 g=lin(texture2D(gras,vW.xz/6.0).rgb);vec3 a=lin(texture2D(aker,vW.xz/9.0).rgb);vec3 r=lin(texture2D(grus,vW.xz/3.5).rgb);vec3 m=lin(texture2D(lera,vW.xz/4.0).rgb);vec3 s=lin(texture2D(skog,vW.xz/5.0).rgb);',
      '  float n=fract(sin(dot(floor(vW.xz*0.04),vec2(127.1,311.7)))*43758.5453);',
      '  vec3 c=mix(g,a,smoothstep(0.58,0.84,n)*(1.0-smoothstep(0.2,0.48,sl)));',
      '  c=mix(c,s,smoothstep(0.3,0.52,n)*smoothstep(0.04,0.22,sl));',
      '  c=mix(c,m,smoothstep(0.18,0.42,sl));c=mix(c,r,smoothstep(0.45,0.75,sl));',
      '  float nd=clamp(dot(normalize(vN),sol),0.0,1.0);',
      '  float skugga=getShadowMask();',
      '  gl_FragColor=vec4(c*(himmel*0.42+jord*0.28+topp*nd*0.9)*mix(0.58,1.0,skugga),1.0);',
      '}'
    ].join('\n')
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
    filer.push({id, lod: config.mark?.lod || 'lod_10m', detalj: true});
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
      yta.receiveShadow = true;
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
  const pos = geom.getAttribute('position');
  const normal = geom.getAttribute('normal');
  const uv = geom.getAttribute('uv');
  const index = geom.getIndex();
  const rot = new THREE.Matrix3().setFromMatrix4(matris);
  const v = new THREE.Vector3();
  const nrm = new THREE.Vector3();
  const ut = [];
  const count = index ? index.count : pos.count;
  const vid = i => index ? index.getX(i) : i;
  for (let i = 0; i < count; i += 3) {
    const tri = {p: [], n: normal ? [] : null, uv: uv ? [] : null};
    for (let k = 0; k < 3; k++) {
      const ix = vid(i + k);
      v.fromBufferAttribute(pos, ix).applyMatrix4(matris);
      tri.p.push(v.clone());
      if (normal) {
        nrm.fromBufferAttribute(normal, ix).applyMatrix3(rot).normalize();
        tri.n.push(nrm.clone());
      }
      if (uv) tri.uv.push([uv.getX(ix), uv.getY(ix)]);
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

function tonaPansar(mesh) {
  const lista = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  for (const m of lista) {
    if (!m) continue;
    m.side = THREE.DoubleSide;
    m.aoMap = null;
    m.lightMap = null;
    m.metalness = 0.05;
    m.metalnessMap = null;
    m.roughness = 0.86;
    m.roughnessMap = null;
    m.envMapIntensity = 0.25;
    if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
  }
}

function sprucken(mesh) {
  const pos = mesh.geometry?.getAttribute?.('position');
  if (!pos || pos.count < 24) return false;
  mesh.updateWorldMatrix(true, false);
  const matris = mesh.matrixWorld;
  const index = mesh.geometry.index;
  const tri = index ? Math.floor(index.count / 3) : Math.floor(pos.count / 3);
  const steg = Math.max(1, Math.floor(tri / 700));
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const vid = i => index ? index.getX(i) : i;
  let lang = 0;
  let n = 0;
  for (let t = 0; t < tri; t += steg) {
    a.fromBufferAttribute(pos, vid(t * 3)).applyMatrix4(matris);
    b.fromBufferAttribute(pos, vid(t * 3 + 1)).applyMatrix4(matris);
    c.fromBufferAttribute(pos, vid(t * 3 + 2)).applyMatrix4(matris);
    if (Math.max(a.distanceTo(b), b.distanceTo(c), c.distanceTo(a)) > 12) lang++;
    n++;
  }
  return n > 8 && lang / n > 0.2;
}

function delaLangsPipa(tris) {
  if (!tris || tris.length < 40) return null;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const t of tris) for (const p of t.p) {
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  }
  const span = maxZ - minZ;
  if (span < 0.5) return null;
  const bins = 16;
  const bredd = new Array(bins).fill(0);
  const lo = new Array(bins).fill(Infinity);
  const hi = new Array(bins).fill(-Infinity);
  for (const t of tris) {
    let z = 0;
    for (const p of t.p) z += p.z;
    const b = Math.max(0, Math.min(bins - 1, Math.floor(((z / 3) - minZ) / span * (bins - 0.001))));
    for (const p of t.p) {
      if (p.x < lo[b]) lo[b] = p.x;
      if (p.x > hi[b]) hi[b] = p.x;
    }
  }
  for (let i = 0; i < bins; i++) bredd[i] = Number.isFinite(lo[i]) ? hi[i] - lo[i] : 0;
  const vid = Math.max(...bredd);
  let mantlet = -1;
  for (let i = 0; i < bins; i++) if (bredd[i] > vid * 0.42) { mantlet = i; break; }
  if (mantlet < 2) {
    const cut2 = minZ + span * 0.46;
    const eld = [];
    const kropp = [];
    for (const t of tris) {
      const z = (t.p[0].z + t.p[1].z + t.p[2].z) / 3;
      if (z < cut2) eld.push(t);
      else kropp.push(t);
    }
    if (eld.length < 8 || kropp.length < 8) return null;
    let x = 0, y = 0, n = 0;
    for (const t of eld) for (const p of t.p) {
      if (p.z > cut2 - span * 0.08) { x += p.x; y += p.y; n++; }
    }
    return {eld, kropp, trunnion: new THREE.Vector3(n ? x / n : 0, n ? y / n : 0, cut2)};
  }
  const cut = minZ + (mantlet / bins) * span;
  const eld = [];
  const kropp = [];
  for (const t of tris) {
    const z = (t.p[0].z + t.p[1].z + t.p[2].z) / 3;
    if (z < cut) eld.push(t);
    else kropp.push(t);
  }
  let x = 0, y = 0, n = 0;
  if (eld.length < 80 || kropp.length < 40) {
    const cut2 = minZ + span * 0.46;
    eld.length = 0;
    kropp.length = 0;
    for (const t of tris) {
      const z = (t.p[0].z + t.p[1].z + t.p[2].z) / 3;
      if (z < cut2) eld.push(t);
      else kropp.push(t);
    }
    if (eld.length < 8 || kropp.length < 8) return null;
    for (const t of eld) for (const p of t.p) {
      if (p.z > cut2 - span * 0.08) { x += p.x; y += p.y; n++; }
    }
    return {eld, kropp, trunnion: new THREE.Vector3(n ? x / n : 0, n ? y / n : 0, cut2)};
  }
  for (const t of eld) for (const p of t.p) {
    if (p.z > cut - span * 0.07) { x += p.x; y += p.y; n++; }
  }
  return {eld, kropp, trunnion: new THREE.Vector3(n ? x / n : 0, n ? y / n : 0, cut)};
}

function laggDrivband(skrov, box) {
  const bandMat = new THREE.MeshStandardMaterial({color: 0x2c3128, roughness: 0.92, metalness: 0.08});
  const hjulMat = new THREE.MeshStandardMaterial({color: 0x3e4636, roughness: 0.8, metalness: 0.18});
  const langd = Math.max(0.5, box.max.z - box.min.z);
  const bredd = Math.max(0.5, box.max.x - box.min.x);
  const botten = box.min.y;
  const x = bredd * 0.42;
  const z0 = box.min.z + langd * 0.12;
  const z1 = box.max.z - langd * 0.1;
  const rad = Math.min(0.34, langd * 0.055);
  const spar = botten - 0.02;
  const mittZ = (z0 + z1) / 2;
  const span = Math.max(0.4, z1 - z0);
  for (const sida of [-1, 1]) {
    const n = 6;
    for (let i = 0; i < n; i++) {
      const hjul = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, 0.16, 14), hjulMat);
      hjul.rotation.z = Math.PI / 2;
      hjul.position.set(sida * x, spar + rad, z0 + span * (i / (n - 1)));
      hjul.castShadow = true;
      hjul.receiveShadow = true;
      skrov.add(hjul);
    }
    for (const [z, r, namn] of [[z0 - rad * 0.2, rad * 1.15], [z1 + rad * 0.15, rad * 1.05]]) {
      const drev = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.2, 12), hjulMat);
      drev.rotation.z = Math.PI / 2;
      drev.position.set(sida * x, spar + r * 0.92, z);
      drev.castShadow = true;
      drev.name = namn || '';
      skrov.add(drev);
    }
    const nedre = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.1, span + rad * 2.2), bandMat);
    nedre.position.set(sida * x, spar + 0.05, mittZ);
    nedre.castShadow = true;
    nedre.receiveShadow = true;
    skrov.add(nedre);
    const ovre = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, span), bandMat);
    ovre.position.set(sida * x, spar + rad * 2.05, mittZ);
    ovre.castShadow = true;
    skrov.add(ovre);
  }
}

function byggSherman(gltf) {
  const src = gltf.scene;
  src.updateMatrixWorld(true);
  const dolda = [];
  const meshar = [];
  src.traverse(n => {
    if (!n.isMesh) return;
    meshar.push(n);
    if (n.name === 'Object_6' || n.name === 'Object_4' || n.name === 'Object_362' || n.name === 'Object_353' || n.name === 'Object_163' || sprucken(n)) {
      n.visible = false;
      dolda.push(n.name || 'mesh');
    }
  });
  const synliga = meshar.filter(n => n.visible);
  const tornMesh = src.getObjectByName('Object_34');
  const hull = src.getObjectByName('Object_36');
  if (!tornMesh || !hull || !tornMesh.visible) throw new Error('Sherman saknar skrov eller torn');
  const hc = new THREE.Box3().setFromObject(hull).getCenter(new THREE.Vector3());
  const pos = tornMesh.geometry.getAttribute('position');
  tornMesh.updateWorldMatrix(true, false);
  const v = new THREE.Vector3();
  const prov = [];
  const steg = Math.max(1, Math.floor(pos.count / 2500));
  for (let i = 0; i < pos.count; i += steg) {
    v.fromBufferAttribute(pos, i).applyMatrix4(tornMesh.matrixWorld);
    const dx = v.x - hc.x;
    const dz = v.z - hc.z;
    prov.push({d: dx * dx + dz * dz, x: v.x, z: v.z});
  }
  prov.sort((a, b) => b.d - a.d);
  const topp = prov.slice(0, Math.max(8, Math.floor(prov.length * 0.04)));
  let fx = 0, fz = 0;
  for (const p of topp) { fx += p.x - hc.x; fz += p.z - hc.z; }
  const fram = new THREE.Vector3(fx, 0, fz);
  if (fram.lengthSq() < 1e-4) fram.set(0, 0, 1);
  fram.normalize();
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

  const world = new THREE.Matrix4();
  const till = mesh => {
    mesh.updateWorldMatrix(true, false);
    world.multiplyMatrices(rotM, mesh.matrixWorld);
    const tris = trianglar(mesh.geometry, world);
    tonaPansar(mesh);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return tris;
  };
  const tornTri = till(tornMesh);
  let del = delaLangsPipa(tornTri);
  if (!del && tornTri.length > 60) {
    let minZ = Infinity, maxZ = -Infinity;
    for (const t of tornTri) for (const p of t.p) {
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    }
    const cut2 = minZ + (maxZ - minZ) * 0.42;
    const eld = [], kropp = [];
    for (const t of tornTri) {
      const z = (t.p[0].z + t.p[1].z + t.p[2].z) / 3;
      if (z < cut2) eld.push(t); else kropp.push(t);
    }
    if (eld.length > 8 && kropp.length > 8) {
      let x = 0, y = 0, n = 0;
      for (const t of eld) for (const p of t.p) if (p.z > cut2 - 0.25) { x += p.x; y += p.y; n++; }
      del = {eld, kropp, trunnion: new THREE.Vector3(n ? x / n : 0, n ? y / n : 0, cut2)};
    }
  }
  let trunnion = new THREE.Vector3(0, 1.7, -0.4);
  if (del) {
    const kropp = new THREE.Mesh(geomFranTri(del.kropp), tornMesh.material);
    const pip = new THREE.Mesh(geomFranTri(del.eld), tornMesh.material);
    kropp.castShadow = pip.castShadow = true;
    kropp.receiveShadow = pip.receiveShadow = true;
    const box = new THREE.Box3().setFromBufferAttribute(kropp.geometry.getAttribute('position'));
    const pivot = new THREE.Vector3();
    box.getCenter(pivot);
    pivot.y = box.min.y + (box.max.y - box.min.y) * 0.42;
    const drag = new THREE.Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z);
    kropp.geometry.applyMatrix4(drag);
    pip.geometry.applyMatrix4(drag);
    torn.position.copy(pivot);
    torn.add(kropp);
    trunnion = del.trunnion.clone().sub(pivot);
    const pipa = new THREE.Group();
    pipa.name = 'pipa';
    pipa.position.set(-trunnion.x, -trunnion.y, -trunnion.z);
    pipa.add(pip);
    eldror.position.copy(trunnion);
    eldror.add(pipa);
    const mynning = new THREE.Object3D();
    mynning.name = 'mynning';
    const eldBox = new THREE.Box3().setFromBufferAttribute(pip.geometry.getAttribute('position'));
    mynning.position.set((eldBox.min.x + eldBox.max.x) / 2, (eldBox.min.y + eldBox.max.y) / 2, eldBox.min.z);
    pipa.add(mynning);
    tornMesh.visible = false;
  } else {
    tornMesh.geometry = geomFranTri(tornTri);
    tornMesh.position.set(0, 0, 0);
    tornMesh.quaternion.identity();
    tornMesh.scale.set(1, 1, 1);
    torn.add(tornMesh);
  }

  const tornBox = new THREE.Box3().setFromObject(torn);
  for (const mesh of synliga) {
    if (mesh === tornMesh) continue;
    const tris = till(mesh);
    const g = geomFranTri(tris);
    const b = new THREE.Box3().setFromBufferAttribute(g.getAttribute('position'));
    const c = b.getCenter(new THREE.Vector3());
    const paTorn = c.y > tornBox.min.y + 0.15 && c.x > tornBox.min.x - 0.3 && c.x < tornBox.max.x + 0.3 && c.z > tornBox.min.z - 0.4 && c.z < tornBox.max.z + 0.5 && b.max.y > 2.1;
    const mal = new THREE.Mesh(g, mesh.material);
    mal.name = mesh.name;
    mal.castShadow = true;
    mal.receiveShadow = true;
    if (paTorn) {
      mal.position.set(-torn.position.x, -torn.position.y, -torn.position.z);
      torn.add(mal);
    } else skrov.add(mal);
  }

  const foreBand = synligBotten(rigg);
  if (foreBand) laggDrivband(skrov, foreBand);
  const botten = synligBotten(rigg);
  if (botten) {
    skrov.position.y -= botten.min.y;
    const cx = (botten.min.x + botten.max.x) / 2;
    const cz = (botten.min.z + botten.max.z) / 2;
    skrov.position.x -= cx;
    skrov.position.z -= cz;
  }
  const sikte = new THREE.Vector3(0.18, 0.34, -0.85);
  const storlek = new THREE.Box3().setFromObject(rigg).getSize(new THREE.Vector3());
  const pipaN = del ? del.eld.length : 0;
  return {
    id: 'sherman', rigg, skrov, torn, eldror, sikte,
    pipa: eldror.getObjectByName('pipa') || null,
    mynning: eldror.getObjectByName('mynning') || null,
    rapport: {
      skala: 1,
      hojd: +storlek.y.toFixed(2),
      langd: +Math.max(storlek.x, storlek.z).toFixed(2),
      sikteZ: +sikte.z.toFixed(2),
      tornY: +torn.position.y.toFixed(2),
      pipa: pipaN,
      tri: tornTri.length,
      axel: (() => {
        const s = {minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity};
        for (const t of tornTri) for (const p of t.p) {
          if (p.x < s.minX) s.minX = p.x; if (p.x > s.maxX) s.maxX = p.x;
          if (p.y < s.minY) s.minY = p.y; if (p.y > s.maxY) s.maxY = p.y;
          if (p.z < s.minZ) s.minZ = p.z; if (p.z > s.maxZ) s.maxZ = p.z;
        }
        return {
          x: +((s.maxX - s.minX).toFixed(2)),
          y: +((s.maxY - s.minY).toFixed(2)),
          z: +((s.maxZ - s.minZ).toFixed(2))
        };
      })(),
      dolda,
      fram: fram.toArray().map(n => +n.toFixed(2))
    }
  };
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
  const pipBox = new THREE.Box3().setFromObject(pip.pipa);
  const trunnion = new THREE.Vector3((pipBox.min.x + pipBox.max.x) / 2, (pipBox.min.y + pipBox.max.y) / 2, pipBox.max.z - 0.06);
  eldror.worldToLocal(trunnion);
  eldror.position.copy(trunnion);
  pip.pipa.position.set(-trunnion.x, -trunnion.y, -trunnion.z);
  rigg.updateMatrixWorld(true);
  pip.mynning.updateWorldMatrix(true, false);
  const munVarld = new THREE.Vector3();
  pip.mynning.getWorldPosition(munVarld);
  const sikte = eldror.worldToLocal(munVarld);
  sikte.y += 0.22;
  sikte.z -= 0.2;
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
  g.updateMatrixWorld(true);
  const husDelar = [];
  g.traverse(n => {
    if (!n.isMesh || !n.visible) return;
    const b = new THREE.Box3().setFromObject(n);
    if (!b.isEmpty()) husDelar.push({n, b});
  });
  if (husDelar.length) {
    const bas = Math.min(...husDelar.map(o => o.b.min.y));
    for (const o of husDelar) if (o.b.min.y > bas + 8) o.n.visible = false;
  }
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
  const ktx2 = new KTX2Loader().setTranscoderPath(new URL('../flyg/vendor/libs/basis/', import.meta.url).href);
  await ktx2.detectSupport(renderer);
  await MeshoptDecoder.ready;
  const loader = new GLTFLoader().setDRACOLoader(draco).setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder);
  const glb = async fil => {
    try {
      const gltf = await loader.loadAsync(new URL(fil, import.meta.url).href);
      gltf.scene.traverse(n => {
        if (!n.material) return;
        const lista = Array.isArray(n.material) ? n.material : [n.material];
        for (const m of lista) if (m) {
          m.aoMap = null;
          m.lightMap = null;
          if ((m.metalness ?? 0) > 0.8) {
            m.metalness = 0.1;
            m.roughness = Math.max(m.roughness || 0, 0.84);
          }
          m.envMapIntensity = Math.min(m.envMapIntensity ?? 1, 0.4);
        }
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

  const [spelareGlb, tigerGlb] = await Promise.all([
    glb(config.modell?.spelare || '../form/verkstad/data/enheter/panzer_iv_h/panzer_iv_h_v2b_v2_pbr_lod2.glb'),
    glb(config.modell?.tiger || (BAS + 'tiger_i_heavy_v2_v2_pbr_lod2.glb'))
  ]);

  const [gras, aker, grus, lera, skog] = await Promise.all([
    textur(new URL(TERR + 'texturer/Grass004_farg.jpg', import.meta.url).href, texLadd),
    textur(new URL(TERR + 'texturer/farm_furrows_farg.jpg', import.meta.url).href, texLadd),
    textur(new URL(TERR + 'texturer/Gravel022_farg.jpg', import.meta.url).href, texLadd),
    textur(new URL(TERR + 'texturer/brown_mud_farg.jpg', import.meta.url).href, texLadd),
    textur(new URL(TERR + 'texturer/forest_leaves_02_farg.jpg', import.meta.url).href, texLadd)
  ]);
  const mark = await laddMark(loader, scene, hojd, markMaterial({gras, aker, grus, lera, skog}));

  const [hackGlb, ekGlb, granGlb, husGlb, ladaGlb] = await Promise.all([
    glb(TERR + 'props/bocage_rak_10m_lod2.glb'),
    glb(TERR + 'props/ek_mellan_lod2.glb'),
    glb(TERR + 'props/gran_mellan_lod2.glb'),
    glb(TERR + 'props/house_d_lod2.glb'),
    glb(TERR + 'props/lada_bessin_sten_lod2.glb')
  ]);

  const spelare = byggTigerSpelare(spelareGlb);
  spelare.rigg.name = 'panzer4';
  spelare.rapport.modell = 'panzer_iv_h';
  const tigerSpelare = byggTigerSpelare(tigerGlb);
  tigerSpelare.rigg.visible = false;
  scene.add(spelare.rigg, tigerSpelare.rigg);

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
    sherman_m4_75: spelare,
    sherman_m4a3_76w: spelare,
    tiger_i: tigerSpelare
  };
  return {
    sol, sky, hojd, hf,
    riggar,
    rigg: spelare.rigg,
    skrov: spelare.skrov,
    torn: spelare.torn,
    eldror: spelare.eldror,
    pipa: spelare.pipa,
    mynning: spelare.mynning,
    sikte: spelare.sikte,
    tigrar,
    rapport: {
      sherman: spelare.rapport,
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
