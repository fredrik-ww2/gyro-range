/* 3D-vy. Marken är satellitbilden i meter. Träden är bibliotekets
   ek, bok och äppelträd, plus gran från FORM:s skogs-impostor.
   Vägen är en remsa som byter textur live. */

import * as THREE from 'three';
import { GLTFLoader } from '../js/vendor/loaders/GLTFLoader.js';

export const VAGAR = [
  { id: 'grus', namn: 'Grus', sokvag: '../form/satellite/ground-gravel.webp' },
  { id: 'sten', namn: 'Sten', sokvag: '../form/satellite/ground-rock.webp' },
  { id: 'lera', namn: 'Lera', sokvag: '../vagn-test/terrang/texturer/brown_mud_farg.jpg' },
  { id: 'grovt', namn: 'Grovt grus', sokvag: '../vagn-test/terrang/texturer/Gravel022_farg.jpg' },
  { id: 'lov', namn: 'Löv och jord', sokvag: '../form/satellite/ground-litter.webp' }
];

const MODELL = {
  ek: '../panorama/modeller/trad_ek_b.glb',
  bok: '../panorama/modeller/trad_bok_c.glb',
  apel: '../panorama/modeller/trad_apple_c.glb'
};

const IMPOSTOR = '../form/satellite/forest-impostors-v3.webp';
const BARK = '../form/satellite/bark_albedo.jpg';

export function skapaScen(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  const scen = new THREE.Scene();
  scen.background = new THREE.Color('#b7c4ae');
  const kamera = new THREE.PerspectiveCamera(38, 1, 0.15, 4000);
  const hemi = new THREE.HemisphereLight('#f4f7f1', '#8a7d62', 0.55);
  const sol = new THREE.DirectionalLight('#fff6e4', 0.85);
  sol.position.set(80, 140, 40);
  scen.add(hemi, sol);

  const rot = new THREE.Group();
  rot.name = 'landskap';
  scen.add(rot);
  const kollision = new THREE.Group();
  kollision.name = 'Kollision';
  kollision.visible = false;
  rot.add(kollision);

  const laddare = new GLTFLoader();
  const texturLaddare = new THREE.TextureLoader();
  const mal = new THREE.Vector3();
  const tillstand = { tolkning: null, bild: null, vagId: 'grus', vagMaterial: null, kollisionSkapad: false };

  function storlek() {
    const w = canvas.clientWidth || 390;
    const h = canvas.clientHeight || 844;
    renderer.setSize(w, h, false);
    kamera.aspect = w / Math.max(1, h);
    kamera.updateProjectionMatrix();
  }
  storlek();
  window.addEventListener('resize', storlek);

  function textur(url, upprepa) {
    const tex = texturLaddare.load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    if (upprepa) {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
    }
    return tex;
  }

  function markMesh(t, bild) {
    const kol = 48;
    const rad = Math.max(12, Math.round(kol * t.djupMeter / t.breddMeter));
    const geo = new THREE.PlaneGeometry(t.breddMeter, t.djupMeter, kol, rad);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, hojd(t, x, z));
    }
    geo.computeVertexNormals();
    const bw = bild.naturalWidth || bild.width;
    const bh = bild.naturalHeight || bild.height;
    const maxSida = 1024;
    const skala = maxSida / Math.max(bw, bh);
    const c = document.createElement('canvas');
    c.width = Math.max(2, Math.round(bw * Math.min(1, skala)));
    c.height = Math.max(2, Math.round(bh * Math.min(1, skala)));
    c.getContext('2d').drawImage(bild, 0, 0, c.width, c.height);
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    const mat = new THREE.MeshBasicMaterial({ map, toneMapped: false, fog: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'Mark';
    return mesh;
  }

  function vagMesh(t) {
    const pos = [];
    const uv = [];
    const idx = [];
    for (const vag of t.vagar) {
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
        const y = p.y + 0.7;
        pos.push(p.x - dz * halv, y, p.z + dx * halv, p.x + dz * halv, y, p.z - dx * halv);
        uv.push(0, vand / 8, 1, vand / 8);
      }
      for (let i = 0; i < punkter.length - 1; i++) {
        const k = bas + i * 2;
        idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
      }
    }
    if (!idx.length) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const map = textur(VAGAR[0].sokvag, true);
    const mat = new THREE.MeshBasicMaterial({
      map,
      color: '#6e6558',
      toneMapped: false,
      fog: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });
    tillstand.vagMaterial = mat;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'Vag';
    mesh.renderOrder = 2;
    return mesh;
  }

  function impostorGran() {
    const geoLista = [];
    const stam = new THREE.CylinderGeometry(0.035, 0.055, 0.32, 6);
    stam.translate(0, 0.16, 0);
    const lager = [
      [0.34, 0.22, 0.42],
      [0.5, 0.2, 0.36],
      [0.66, 0.16, 0.3],
      [0.82, 0.11, 0.24]
    ];
    for (const [y, hojd, bredd] of lager) {
      for (const vinkel of [0, Math.PI / 2]) {
        const plan = new THREE.PlaneGeometry(bredd, hojd);
        plan.translate(0, y, 0);
        plan.rotateY(vinkel);
        stampla(plan, 0.02, 0.52, 0.48, 0.98);
        geoLista.push(plan);
      }
    }
    const topp = new THREE.PlaneGeometry(0.4, 0.4);
    topp.rotateX(-Math.PI / 2);
    topp.translate(0, 0.62, 0);
    stampla(topp, 0.02, 0.02, 0.48, 0.48);
    geoLista.push(topp);
    const krona = slåIhop(geoLista);
    return { stam, krona };
  }

  function laggTrad(t, impostor, bark) {
    const perArt = { gran: [], ek: [], bok: [], apel: [] };
    for (const trad of t.trad) (perArt[trad.art] || perArt.ek).push(trad);
    const grupp = new THREE.Group();
    grupp.name = 'Trad';
    const matBarr = new THREE.MeshStandardMaterial({
      map: impostor,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      roughness: 1,
      metalness: 0
    });
    const matBark = new THREE.MeshStandardMaterial({ map: bark, roughness: 1, metalness: 0, color: '#8d7b58' });
    const granGeo = impostorGran();
    if (perArt.gran.length) {
      grupp.add(instanser(granGeo.stam, matBark, perArt.gran, false));
      grupp.add(instanser(granGeo.krona, matBarr, perArt.gran, true));
    }
    return laddaModeller().then((bibliotek) => {
      for (const art of ['ek', 'bok', 'apel']) {
        const lista = perArt[art];
        if (!lista.length) continue;
        const delar = bibliotek[art] || lovFallback(art, impostor);
        for (const del of delar) grupp.add(instanser(del.geo, del.mat, lista, true));
      }
      return grupp;
    });
  }

  function laddaModeller() {
    const ut = {};
    return Promise.all(Object.entries(MODELL).map(([art, url]) => new Promise((klar) => {
      laddare.load(url, (gltf) => {
        ut[art] = normalisera(gltf.scene);
        klar();
      }, undefined, () => klar());
    }))).then(() => ut);
  }

  function lovFallback(art, impostor) {
    const geo = new THREE.PlaneGeometry(0.55, 0.7);
    geo.translate(0, 0.55, 0);
    const kors = geo.clone();
    kors.rotateY(Math.PI / 2);
    stampla(geo, 0.52, 0.52, 0.98, 0.98);
    stampla(kors, 0.52, 0.52, 0.98, 0.98);
    const topp = new THREE.PlaneGeometry(0.6, 0.6);
    topp.rotateX(-Math.PI / 2);
    topp.translate(0, 0.7, 0);
    stampla(topp, 0.52, 0.02, 0.98, 0.48);
    const material = new THREE.MeshStandardMaterial({
      map: impostor,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      roughness: 1,
      metalness: 0
    });
    return [{ geo: slåIhop([geo, kors, topp]), mat: material }];
  }

  function normalisera(root) {
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const hojd = Math.max(0.001, size.y);
    const cx = (box.min.x + box.max.x) / 2;
    const cz = (box.min.z + box.max.z) / 2;
    const delar = [];
    root.traverse((nod) => {
      if (!nod.isMesh || !nod.geometry) return;
      const geo = nod.geometry.clone();
      geo.applyMatrix4(nod.matrixWorld);
      geo.translate(-cx, -box.min.y, -cz);
      geo.scale(1 / hojd, 1 / hojd, 1 / hojd);
      const mat = nod.material;
      if (mat) {
        mat.side = THREE.DoubleSide;
        if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
      }
      delar.push({ geo, mat });
    });
    return delar.length ? delar : null;
  }

  function instanser(geo, mat, lista, faerga) {
    const mesh = new THREE.InstancedMesh(geo, mat, lista.length);
    mesh.name = 'Trad';
    const mall = new THREE.Object3D();
    const farg = new THREE.Color();
    lista.forEach((trad, i) => {
      const s = trad.hojd * trad.skala;
      mall.position.set(trad.x, trad.y, trad.z);
      mall.rotation.set(0, trad.rotation, 0);
      mall.scale.set(s, s, s);
      mall.updateMatrix();
      mesh.setMatrixAt(i, mall.matrix);
      if (faerga) {
        const r = trad.farg?.[0] ?? 0.3;
        const g = trad.farg?.[1] ?? 0.4;
        const b = trad.farg?.[2] ?? 0.2;
        farg.setRGB(
          klamp(r / 0.28, 0.55, 1.35),
          klamp(g / 0.36, 0.55, 1.35),
          klamp(b / 0.22, 0.55, 1.35)
        );
        mesh.setColorAt(i, farg);
      }
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return mesh;
  }

  function byggKollision(t) {
    while (kollision.children.length) kollision.remove(kollision.children[0]);
    const mark = markMesh(t, tillstand.bild);
    mark.material = new THREE.MeshBasicMaterial({
      color: '#2f8fbe',
      transparent: true,
      opacity: 0.28,
      wireframe: true,
      depthWrite: false
    });
    mark.position.y = 0.2;
    mark.name = 'KollisionMark';
    kollision.add(mark);
    if (t.trad.length) {
      const geo = new THREE.CylinderGeometry(1, 1, 1, 8);
      geo.translate(0, 0.5, 0);
      const mat = new THREE.MeshBasicMaterial({
        color: '#f2c14e',
        transparent: true,
        opacity: 0.45,
        depthWrite: false
      });
      const mesh = new THREE.InstancedMesh(geo, mat, t.trad.length);
      mesh.name = 'KollisionTrad';
      const mall = new THREE.Object3D();
      t.trad.forEach((trad, i) => {
        const hojd = trad.hojd * trad.skala;
        const radie = Math.max(0.28, trad.stamp || 0.35);
        mall.position.set(trad.x, trad.y, trad.z);
        mall.scale.set(radie, hojd, radie);
        mall.rotation.set(0, 0, 0);
        mall.updateMatrix();
        mesh.setMatrixAt(i, mall.matrix);
      });
      kollision.add(mesh);
    }
    for (const hus of t.byggnader) {
      const geo = new THREE.BoxGeometry(hus.breddMeter, hus.hojdMeter, hus.djupMeter);
      geo.translate(0, hus.hojdMeter / 2, 0);
      const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        color: '#e07a4c',
        transparent: true,
        opacity: 0.4,
        depthWrite: false
      }));
      mesh.position.set(hus.x, hojd(t, hus.x, hus.z), hus.z);
      mesh.rotation.y = hus.vinkel;
      mesh.name = 'KollisionHus';
      kollision.add(mesh);
    }
    tillstand.kollisionSkapad = true;
  }

  function fokus(t) {
    const nara = t.trad.filter((trad) => trad.v > 0.12 && trad.v < 0.36);
    const lista = nara.length ? nara : t.trad;
    if (!lista.length) return { x: 0, y: 2, z: 0 };
    let bast = lista[0];
    let bastN = -1;
    for (const trad of lista) {
      let n = 0;
      for (const annan of lista) {
        if ((annan.x - trad.x) ** 2 + (annan.z - trad.z) ** 2 < 18 * 18) n++;
      }
      if (n > bastN) {
        bastN = n;
        bast = trad;
      }
    }
    return { x: bast.x, y: bast.y, z: bast.z };
  }

  function titta(x, y, z, tx, ty, tz) {
    kamera.position.set(x, y, z);
    mal.set(tx, ty, tz);
    kamera.lookAt(mal);
  }

  function visaVy(namn) {
    const t = tillstand.tolkning;
    if (!t) return;
    const f = fokus(t);
    if (namn === 'nara') {
      titta(f.x - 22, f.y + 7, f.z + 28, f.x, f.y + 3, f.z);
    } else if (namn === 'mark') {
      titta(f.x + 6, f.y + 1.7, f.z + 14, f.x, f.y + 2.2, f.z - 16);
    } else if (namn === 'sned') {
      titta(t.breddMeter * 0.62, t.djupMeter * 0.62, t.djupMeter * 0.78, 0, 0, 0);
    } else {
      titta(0, t.djupMeter * 1.95, t.djupMeter * 0.02, 0, 0, 0);
    }
  }

  let senaste = 0;
  function visa(t, bild) {
    const generation = ++senaste;
    tillstand.tolkning = t;
    tillstand.bild = bild;
    tillstand.kollisionSkapad = false;
    for (const barn of [...rot.children]) {
      if (barn !== kollision) rot.remove(barn);
    }
    while (kollision.children.length) kollision.remove(kollision.children[0]);
    kollision.visible = false;
    rot.add(markMesh(t, bild));
    const vag = vagMesh(t);
    if (vag) rot.add(vag);
    bytVag(tillstand.vagId);
    visaVy('oversikt');
    const impostor = textur(IMPOSTOR, false);
    const bark = textur(BARK, true);
    return laggTrad(t, impostor, bark).then((grupp) => {
      if (generation !== senaste) return;
      rot.add(grupp);
    });
  }

  function bytVag(id) {
    tillstand.vagId = id;
    const post = VAGAR.find((v) => v.id === id) || VAGAR[0];
    if (!tillstand.vagMaterial) return;
    const map = textur(post.sokvag, true);
    tillstand.vagMaterial.map = map;
    tillstand.vagMaterial.needsUpdate = true;
  }

  function visaKollision(synlig) {
    if (!tillstand.tolkning) return false;
    if (!tillstand.kollisionSkapad) byggKollision(tillstand.tolkning);
    kollision.visible = synlig;
    return true;
  }

  const pek = new Map();
  let avstand = 0;
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    pek.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pek.size === 2) avstand = fingerAvstand();
  });
  canvas.addEventListener('pointerup', (e) => pek.delete(e.pointerId));
  canvas.addEventListener('pointercancel', (e) => pek.delete(e.pointerId));
  canvas.addEventListener('pointermove', (e) => {
    const fore = pek.get(e.pointerId);
    if (!fore) return;
    const dx = e.clientX - fore.x;
    const dy = e.clientY - fore.y;
    fore.x = e.clientX;
    fore.y = e.clientY;
    if (pek.size >= 2) {
      const nu = fingerAvstand();
      if (avstand > 0) zooma(avstand / nu);
      avstand = nu;
      return;
    }
    bana(dx, dy);
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    zooma(e.deltaY > 0 ? 1.08 : 0.92);
  }, { passive: false });

  function fingerAvstand() {
    const [a, b] = [...pek.values()];
    return Math.hypot(a.x - b.x, a.y - b.y) || 1;
  }
  function bana(dx, dy) {
    const offset = kamera.position.clone().sub(mal);
    const sfär = new THREE.Spherical().setFromVector3(offset);
    sfär.theta -= dx * 0.008;
    sfär.phi = klamp(sfär.phi - dy * 0.006, 0.18, 1.35);
    offset.setFromSpherical(sfär);
    kamera.position.copy(mal).add(offset);
    kamera.lookAt(mal);
  }
  function zooma(faktor) {
    const offset = kamera.position.clone().sub(mal);
    const langd = klamp(offset.length() * faktor, 6, 900);
    offset.setLength(langd);
    kamera.position.copy(mal).add(offset);
  }

  renderer.setAnimationLoop(() => renderer.render(scen, kamera));

  return { visa, visaVy, bytVag, visaKollision, storlek, kamera };
}

function hojd(t, x, z) {
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

function stampla(geo, u0, v0, u1, v1) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
  }
}

function slåIhop(lista) {
  const delar = lista.map((geo) => (geo.index ? geo.toNonIndexed() : geo));
  let antal = 0;
  for (const geo of delar) antal += geo.attributes.position.count;
  const pos = new Float32Array(antal * 3);
  const uv = new Float32Array(antal * 2);
  const norm = new Float32Array(antal * 3);
  let offset = 0;
  for (const geo of delar) {
    const p = geo.attributes.position;
    pos.set(p.array.subarray(0, p.count * 3), offset * 3);
    const u = geo.attributes.uv;
    uv.set(u.array.subarray(0, u.count * 2), offset * 2);
    const n = geo.attributes.normal;
    if (n) norm.set(n.array.subarray(0, n.count * 3), offset * 3);
    offset += p.count;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('normal', new THREE.BufferAttribute(norm, 3));
  return geo;
}

function klamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
