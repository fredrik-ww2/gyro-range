import * as THREE from '../js/vendor/three.module.js';
import { kaglaPositioner } from './fysik.js';

function tra(breddPx, langdPx) {
  const c = document.createElement('canvas');
  c.width = breddPx;
  c.height = langdPx;
  const g = c.getContext('2d');
  const plankor = 8;
  const w = breddPx / plankor;
  for (let i = 0; i < plankor; i++) {
    const nyans = 118 + ((i * 37) % 5) * 8;
    const r = nyans + 40;
    const gr = Math.floor(nyans * 0.62);
    const b = Math.floor(nyans * 0.32);
    g.fillStyle = `rgb(${r},${gr},${b})`;
    g.fillRect(i * w, 0, w + 1, langdPx);
    for (let y = 0; y < langdPx; y += 2) {
      const n = ((i * 13 + y * 7) % 17) - 8;
      g.fillStyle = `rgba(60,30,10,${0.04 + (n > 0 ? 0.03 : 0)})`;
      g.fillRect(i * w, y, w, 1);
    }
    g.fillStyle = 'rgba(40,18,8,0.55)';
    g.fillRect(i * w, 0, 2, langdPx);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function kaglaYta() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#f4f1ea';
  g.fillRect(0, 0, 64, 128);
  g.fillStyle = '#d01218';
  g.fillRect(0, 78, 64, 9);
  g.fillRect(0, 96, 64, 7);
  g.fillStyle = '#efeae2';
  g.fillRect(0, 8, 64, 6);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function kaglaForm() {
  const p = [
    [0.015, 0],
    [0.034, 0.02],
    [0.052, 0.07],
    [0.0605, 0.13],
    [0.056, 0.19],
    [0.038, 0.25],
    [0.026, 0.3],
    [0.034, 0.345],
    [0.02, 0.381]
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(p, 14);
}

export function skapaBana(konfig, renderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x100e0c);
  const camera = new THREE.PerspectiveCamera(konfig.bild.fov, 1, 0.08, 80);
  const basPos = new THREE.Vector3(0, konfig.bild.ogon_hojd, konfig.bild.ogon_z);
  const basQuat = new THREE.Quaternion();
  camera.position.copy(basPos);
  camera.lookAt(0, konfig.bild.sikte_y, konfig.bild.sikte_z);
  basQuat.copy(camera.quaternion);

  const env = new THREE.Scene();
  env.background = new THREE.Color(0xd9c7a4);
  env.add(new THREE.HemisphereLight(0xfff6e4, 0x4a3428, 1.2));
  const sol = new THREE.DirectionalLight(0xfff3dd, 2.2);
  sol.position.set(1.2, 6, 2);
  env.add(sol);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(env, 0.02).texture;
  scene.environment = envMap;
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xfff4e2, 0x2a221c, 0.55));
  const ljus = new THREE.DirectionalLight(0xfff7ea, 1.55);
  ljus.position.set(0.4, 6.5, 3.2);
  scene.add(ljus);
  const fill = new THREE.DirectionalLight(0xc9d4e6, 0.28);
  fill.position.set(-2.2, 3, -6);
  scene.add(fill);

  const langd = konfig.bana.langd + konfig.bana.dack;
  const bredd = konfig.bana.bredd;
  const traTex = tra(256, 64);
  traTex.repeat.set(1, 22);
  const golvMat = new THREE.MeshPhysicalMaterial({
    map: traTex,
    roughness: 0.34,
    metalness: 0.06,
    clearcoat: 0.78,
    clearcoatRoughness: 0.22,
    envMapIntensity: 1
  });
  const bana = new THREE.Mesh(new THREE.PlaneGeometry(bredd, langd), golvMat);
  bana.rotation.x = -Math.PI / 2;
  bana.position.set(0, 0, -langd / 2);
  scene.add(bana);

  const ansatsTex = tra(256, 64);
  ansatsTex.repeat.set(1, 6);
  const ansats = new THREE.Mesh(
    new THREE.PlaneGeometry(bredd + 0.5, konfig.bana.ansats),
    new THREE.MeshPhysicalMaterial({
      map: ansatsTex,
      roughness: 0.48,
      metalness: 0.03,
      clearcoat: 0.35,
      clearcoatRoughness: 0.4
    })
  );
  ansats.rotation.x = -Math.PI / 2;
  ansats.position.set(0, -0.004, konfig.bana.ansats / 2);
  scene.add(ansats);

  const rannaMat = new THREE.MeshStandardMaterial({ color: 0x241e1a, roughness: 0.78, metalness: 0.08 });
  const rannaGeo = new THREE.BoxGeometry(konfig.bana.ranna_bredd, konfig.bana.ranna_djup, langd + konfig.bana.ansats);
  for (const tecken of [-1, 1]) {
    const r = new THREE.Mesh(rannaGeo, rannaMat);
    r.position.set(tecken * (bredd / 2 + konfig.bana.ranna_bredd / 2), -konfig.bana.ranna_djup / 2, -langd / 2 + 0.4);
    scene.add(r);
  }

  const fals = new THREE.Mesh(
    new THREE.BoxGeometry(bredd, 0.008, 0.035),
    new THREE.MeshStandardMaterial({ color: 0x1a120e, roughness: 0.6 })
  );
  fals.position.set(0, 0.004, 0);
  scene.add(fals);

  const vaggMat = new THREE.MeshStandardMaterial({ color: 0x171410, roughness: 0.9 });
  const sidla = langd + konfig.bana.ansats;
  for (const tecken of [-1, 1]) {
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, sidla), vaggMat);
    v.position.set(tecken * (bredd / 2 + konfig.bana.ranna_bredd + 0.06), 0.22, -langd / 2 + 0.3);
    scene.add(v);
  }
  const gavel = new THREE.Mesh(new THREE.BoxGeometry(bredd + 1.2, 1.1, 0.08), new THREE.MeshStandardMaterial({ color: 0x2a1818, roughness: 0.86 }));
  gavel.position.set(0, 0.5, -langd - 0.2);
  scene.add(gavel);

  const prickGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.006, 10);
  const prickar = new THREE.InstancedMesh(prickGeo, new THREE.MeshStandardMaterial({ color: 0x3a2718, roughness: 0.7 }), 9);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const platser = [
    [-0.18, -4.6], [0.18, -4.6],
    [-0.34, -9.2], [0, -9.2], [0.34, -9.2],
    [-0.16, -13.5], [0.16, -13.5],
    [-0.22, -16.2], [0.22, -16.2]
  ];
  platser.forEach((p, i) => {
    m.compose(new THREE.Vector3(p[0], 0.004, p[1]), q, new THREE.Vector3(1, 1, 1));
    prickar.setMatrixAt(i, m);
  });
  scene.add(prickar);

  const pinGeo = kaglaForm();
  const pinMat = new THREE.MeshStandardMaterial({ map: kaglaYta(), roughness: 0.4, metalness: 0.02, color: 0xffffff });
  const pinMesh = kaglaPositioner(konfig).map(p => {
    const mesh = new THREE.Mesh(pinGeo, pinMat);
    mesh.position.set(p.x, 0, p.z);
    scene.add(mesh);
    return mesh;
  });

  const klotGeo = new THREE.SphereGeometry(konfig.klot.radie, 28, 18);
  const klotMat = new THREE.MeshPhysicalMaterial({
    color: 0x8a1a28,
    roughness: 0.18,
    metalness: 0.62,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12
  });
  const klot = new THREE.Group();
  klot.add(new THREE.Mesh(klotGeo, klotMat));
  const halMat = new THREE.MeshStandardMaterial({ color: 0x0c0608, roughness: 0.45 });
  const radie = konfig.klot.radie;
  const hal = [
    [0, 0.22, 0.016],
    [-0.26, -0.05, 0.012],
    [0.26, -0.05, 0.012]
  ];
  for (const [nx, ny, r] of hal) {
    const h = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.85, 0.034, 12), halMat);
    const rikt = new THREE.Vector3(nx, ny, 0.92).normalize();
    h.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), rikt);
    h.position.copy(rikt).multiplyScalar(radie - 0.01);
    klot.add(h);
  }
  scene.add(klot);

  const relQ = new THREE.Quaternion();

  function kamera(q, folj) {
    camera.position.copy(basPos);
    if (folj && q) {
      relQ.set(q[0], q[1], q[2], q[3]);
      camera.quaternion.copy(relQ).multiply(basQuat);
    } else camera.quaternion.copy(basQuat);
  }

  function rita(fysik) {
    const b = fysik.ball;
    klot.position.set(b.x, Math.max(b.radie * 0.35, b.y), b.z);
    klot.rotation.x = -b.spin;
    fysik.pins.forEach((p, i) => {
      const mesh = pinMesh[i];
      mesh.position.set(p.x, 0, p.z);
      const v = p.fall || 0;
      mesh.rotation.x = Math.sin(p.riktning) * v * 1.25;
      mesh.rotation.z = -Math.cos(p.riktning) * v * 1.25;
      mesh.position.y = (1 - Math.cos(v * 1.15)) * -0.02;
    });
  }

  function storlek(w, h) {
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  }

  return { scene, camera, kamera, rita, storlek, envMap };
}
