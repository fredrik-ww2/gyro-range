/* Färglägger det svartvita flygfotot med bocagefärger och lägger enkla häckar, träd och tak. */

import {
  BoxGeometry, CanvasTexture, ConeGeometry, CylinderGeometry, DynamicDrawUsage,
  InstancedMesh, Matrix4, MeshStandardMaterial, Object3D, Quaternion, Vector3
} from 'three';

const GRANS = 1000;

export async function laddaMarkyta() {
  const info = await fetch(new URL('../data/varldar/villers_bocage/markbild/markbild.json', import.meta.url)).then((svar) => svar.json());
  const grov = await rita('markbild_512.jpg', 512);
  const textur = new CanvasTexture(grov.canvas);
  textur.colorSpace = 'srgb';
  textur.anisotropy = 4;
  const detalj = rita('markbild_2048.jpg', 1024).then((fin) => {
    textur.image = fin.canvas;
    textur.needsUpdate = true;
    return textur;
  }).catch(() => textur);
  return { info, textur, detalj, proppar: grov.proppar };
}

function rita(fil, sida) {
  const bild = new Image();
  bild.src = new URL('../data/varldar/villers_bocage/markbild/' + fil, import.meta.url).href;
  return bild.decode().then(() => {
    const canvas = document.createElement('canvas');
    canvas.width = sida;
    canvas.height = sida;
    const rit = canvas.getContext('2d', { willReadFrequently: true });
    rit.drawImage(bild, 0, 0, sida, sida);
    const foto = rit.getImageData(0, 0, sida, sida);
    const ut = rit.createImageData(sida, sida);
    const proppar = { hack: [], trad: [], hus: [] };
    const steg = Math.max(8, Math.round(sida / 48));
    for (let y = 0; y < sida; y++) {
      for (let x = 0; x < sida; x++) {
        const i = (y * sida + x) * 4;
        const lum = foto.data[i] / 255;
        const kontrast = x > 1 && y > 1 && x < sida - 2 && y < sida - 2
          ? Math.max(
            Math.abs(lum - foto.data[((y) * sida + (x - 2)) * 4] / 255),
            Math.abs(lum - foto.data[((y - 2) * sida + x) * 4] / 255)
          )
          : 0;
        const varldX = -GRANS + (x + 0.5) / sida * GRANS * 2;
        const varldZ = -GRANS + (y + 0.5) / sida * GRANS * 2;
        const [r, g, b] = farg(varldX, varldZ, lum, kontrast);
        ut.data[i] = r;
        ut.data[i + 1] = g;
        ut.data[i + 2] = b;
        ut.data[i + 3] = 255;
        if (x % steg === 0 && y % steg === 0) samla(proppar, varldX, varldZ, lum, kontrast);
      }
    }
    rit.putImageData(ut, 0, 0);
    return { canvas, proppar };
  });
}

function farg(x, z, lum, kontrast) {
  const falt = brus(x * 0.012, z * 0.012);
  const stor = brus(x * 0.004 + 9, z * 0.004 - 4);
  let r = 86;
  let g = 118;
  let b = 52;
  if (stor > 0.62) { r = 176; g = 154; b = 64; }
  else if (falt > 0.58) { r = 108; g = 132; b = 58; }
  else if (falt < 0.32) { r = 118; g = 92; b = 48; }
  const by = Math.hypot(x + 520, z - 380) < 340;
  const moln = lum > 0.9 && kontrast < 0.045;
  if (!moln && by && lum > 0.62 && kontrast > 0.07) {
    if (lum > 0.74 && kontrast > 0.11) { r = 158; g = 58; b = 40; }
    else { r = 186; g = 164; b = 118; }
  } else if (lum < 0.34) {
    r = 36; g = 58; b = 30;
  } else if (lum > 0.72 && kontrast < 0.05) {
    r = 168; g = 156; b = 112;
  }
  const ljus = moln ? 0.78 + lum * 0.22 : 0.4 + lum * 0.95;
  return [
    Math.max(0, Math.min(255, r * ljus)),
    Math.max(0, Math.min(255, g * ljus)),
    Math.max(0, Math.min(255, b * ljus))
  ];
}

function samla(proppar, x, z, lum, kontrast) {
  const by = Math.hypot(x + 520, z - 380) < 320;
  if (lum < 0.32 && proppar.hack.length < 260) {
    const gx = brus(x * 0.05, z * 0.02) - 0.5;
    const gz = brus(z * 0.05, x * 0.02) - 0.5;
    proppar.hack.push({ x, z, yaw: Math.atan2(gz, gx) + Math.PI / 2, langd: 10 + brus(x, z) * 8 });
  } else if (lum < 0.27 && !by && proppar.trad.length < 80 && brus(x * 0.08, z * 0.08) > 0.55) {
    proppar.trad.push({ x, z, skala: 0.8 + brus(x + 3, z) * 0.7 });
  }
  if (by && lum > 0.66 && kontrast > 0.09 && proppar.hus.length < 28 && brus(x * 0.2, z * 0.2) > 0.42) {
    proppar.hus.push({ x, z, yaw: (brus(x, z + 2) - 0.5) * 0.8, sida: 6 + brus(x + 1, z) * 5 });
  }
}

function brus(x, z) {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const fx = x - x0;
  const fz = z - z0;
  const sx = fx * fx * (3 - 2 * fx);
  const sz = fz * fz * (3 - 2 * fz);
  const a = hash(x0, z0);
  const b = hash(x0 + 1, z0);
  const c = hash(x0, z0 + 1);
  const d = hash(x0 + 1, z0 + 1);
  return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz;
}

function hash(x, z) {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export function markMaterial(textur) {
  return new MeshStandardMaterial({ map: textur, roughness: 1, metalness: 0 });
}

const _matris = new Matrix4();
const _pos = new Vector3();
const _kvat = new Quaternion();
const _skala = new Vector3();
const _euler = new Object3D();

export function byggLandskap(proppar, hojd) {
  const rot = new Object3D();
  rot.add(instanser(proppar.hack, () => new BoxGeometry(1, 1, 1), 0x2a4a28, (post, i, mesh) => {
    const y = hojd(post.x, post.z);
    _euler.rotation.set(0, post.yaw, 0);
    _kvat.setFromEuler(_euler.rotation);
    _pos.set(post.x, y + 1.3, post.z);
    _skala.set(post.langd, 2.6, 2.2);
    mesh.setMatrixAt(i, _matris.compose(_pos, _kvat, _skala));
  }));
  rot.add(instanser(proppar.trad, () => new ConeGeometry(2.2, 7, 5), 0x234826, (post, i, mesh) => {
    const y = hojd(post.x, post.z);
    _kvat.identity();
    _pos.set(post.x, y + 3.5 * post.skala, post.z);
    _skala.set(post.skala, post.skala, post.skala);
    mesh.setMatrixAt(i, _matris.compose(_pos, _kvat, _skala));
  }));
  rot.add(instanser(proppar.trad, () => new CylinderGeometry(0.35, 0.45, 2.4, 5), 0x5a4632, (post, i, mesh) => {
    const y = hojd(post.x, post.z);
    _kvat.identity();
    _pos.set(post.x, y + 1.2 * post.skala, post.z);
    _skala.set(post.skala, post.skala, post.skala);
    mesh.setMatrixAt(i, _matris.compose(_pos, _kvat, _skala));
  }));
  rot.add(instanser(proppar.hus, () => new BoxGeometry(1, 1, 1), 0xc4b498, (post, i, mesh) => {
    const y = hojd(post.x, post.z);
    _euler.rotation.set(0, post.yaw, 0);
    _kvat.setFromEuler(_euler.rotation);
    _pos.set(post.x, y + 2.2, post.z);
    _skala.set(post.sida, 4.2, post.sida * 0.75);
    mesh.setMatrixAt(i, _matris.compose(_pos, _kvat, _skala));
  }));
  rot.add(instanser(proppar.hus, () => new ConeGeometry(1, 1, 4), 0x9a3b32, (post, i, mesh) => {
    const y = hojd(post.x, post.z);
    _euler.rotation.set(0, post.yaw + Math.PI / 4, 0);
    _kvat.setFromEuler(_euler.rotation);
    _pos.set(post.x, y + 4.8, post.z);
    _skala.set(post.sida * 0.72, 2.2, post.sida * 0.72);
    mesh.setMatrixAt(i, _matris.compose(_pos, _kvat, _skala));
  }));
  return rot;
}

function instanser(lista, geometri, farg, fyll) {
  const mesh = new InstancedMesh(geometri(), new MeshStandardMaterial({ color: farg, roughness: 1, metalness: 0 }), Math.max(1, lista.length));
  mesh.count = lista.length;
  mesh.frustumCulled = false;
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  lista.forEach((post, i) => fyll(post, i, mesh));
  mesh.instanceMatrix.needsUpdate = true;
  if (!lista.length) mesh.visible = false;
  return mesh;
}
