/* Flygfotot är detaljen. Färgen är en mjuk, lågfrekvent ton, inte ett rutmönster. */

import {
  CanvasTexture, LinearFilter, LinearMipmapLinearFilter, MeshStandardMaterial
} from 'three';

const CELL = 40;

export async function laddaMarkyta() {
  await fetch(new URL('../data/varldar/villers_bocage/markbild/markbild.json', import.meta.url)).then((svar) => svar.json());
  const grov = await rita('markbild_512.jpg');
  const textur = new CanvasTexture(grov);
  stallFilter(textur, null);
  const detalj = rita('markbild_2048.jpg').then((fin) => {
    textur.image = fin;
    textur.needsUpdate = true;
    stallFilter(textur, null);
    return textur;
  });
  return { textur, detalj, proppar: { hack: [], trad: [], hus: [] } };
}

export function stallFilter(textur, renderer) {
  textur.magFilter = LinearFilter;
  textur.minFilter = LinearMipmapLinearFilter;
  textur.generateMipmaps = true;
  textur.anisotropy = renderer?.capabilities?.getMaxAnisotropy?.() || 16;
  textur.colorSpace = 'srgb';
  textur.needsUpdate = true;
}

export function markMaterial(textur) {
  return new MeshStandardMaterial({ map: textur, roughness: 1, metalness: 0 });
}

function rita(fil) {
  const bild = new Image();
  bild.src = new URL('../data/varldar/villers_bocage/markbild/' + fil, import.meta.url).href;
  return bild.decode().then(() => {
    const sida = bild.naturalWidth;
    const canvas = document.createElement('canvas');
    canvas.width = sida;
    canvas.height = sida;
    const rit = canvas.getContext('2d', { willReadFrequently: true });
    rit.drawImage(bild, 0, 0, sida, sida);
    const foto = rit.getImageData(0, 0, sida, sida);
    const ljus = medelljus(foto.data, sida, CELL);
    const ut = rit.createImageData(sida, sida);
    for (let y = 0; y < sida; y++) {
      const v = (y + 0.5) / sida;
      const z = -1000 + v * 2000;
      for (let x = 0; x < sida; x++) {
        const u = (x + 0.5) / sida;
        const varldX = -1000 + u * 2000;
        const i = (y * sida + x) * 4;
        const pix = foto.data[i] / 255;
        const mjuk = prov(ljus, u, v);
        const ton = tonFranLjus(mjuk, byMask(varldX, z));
        const styrka = 0.22 + pix * 0.9;
        const fargadR = ton[0] * styrka;
        const fargadG = ton[1] * styrka;
        const fargadB = ton[2] * styrka;
        const grå = pix * 255;
        const bland = 0.74;
        ut.data[i] = grå * (1 - bland) + fargadR * bland;
        ut.data[i + 1] = grå * (1 - bland) + fargadG * bland;
        ut.data[i + 2] = grå * (1 - bland) + fargadB * bland;
        ut.data[i + 3] = 255;
      }
    }
    rit.putImageData(ut, 0, 0);
    return canvas;
  });
}

function medelljus(data, sida, cell) {
  const grid = new Float32Array(cell * cell);
  for (let gy = 0; gy < cell; gy++) {
    const y0 = Math.floor(gy * sida / cell);
    const y1 = Math.floor((gy + 1) * sida / cell);
    for (let gx = 0; gx < cell; gx++) {
      const x0 = Math.floor(gx * sida / cell);
      const x1 = Math.floor((gx + 1) * sida / cell);
      let summa = 0;
      let antal = 0;
      for (let y = y0; y < y1; y += 2) {
        for (let x = x0; x < x1; x += 2) {
          summa += data[(y * sida + x) * 4];
          antal += 1;
        }
      }
      grid[gy * cell + gx] = antal ? summa / antal / 255 : 0.5;
    }
  }
  return grid;
}

function prov(grid, u, v) {
  const n = CELL;
  const x = Math.min(n - 1.001, Math.max(0, u * (n - 1)));
  const y = Math.min(n - 1.001, Math.max(0, v * (n - 1)));
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const a = grid[y0 * n + x0];
  const b = grid[y0 * n + x0 + 1];
  const c = grid[(y0 + 1) * n + x0];
  const d = grid[(y0 + 1) * n + x0 + 1];
  return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
}

function tonFranLjus(ljus, by) {
  const mork = [34, 86, 36];
  const gron = [78, 132, 48];
  const ljusFalt = [186, 164, 72];
  const t = mjuk(0.28, 0.82, ljus);
  const bas = lerp(lerp(mork, gron, mjuk(0.2, 0.55, ljus)), ljusFalt, t);
  const varm = [168, 112, 70];
  return lerp(bas, varm, by * 0.28);
}

function byMask(x, z) {
  const dx = (x + 500) / 260;
  const dz = (z - 430) / 230;
  return mjuk(1, 0.25, dx * dx + dz * dz);
}

function mjuk(kant0, kant1, varde) {
  const t = Math.max(0, Math.min(1, (varde - kant0) / (kant1 - kant0)));
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function byggLandskap() {
  return null;
}
