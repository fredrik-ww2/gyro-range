/* Tolkar en satellitbild till markklasser, träd, vägar och byggnader.
   Den gamla FORM-regeln (mörk luma, grön kontrast, eller bara kontrast)
   finns kvar som legacyTrad så före/efter kan jämföras.
   Den nya regeln kräver mörker OCH lokal textur, sedan öppning/stängning
   och en minsta dunge, så jämna ljusa åkrar stannar gräs.
   Allt är i meter, Y upp. */

export const KLASS = { gras: 0, trad: 1, jord: 2, vag: 3, byggnad: 4, vatten: 5 };

export const STANDARD = {
  breddMeter: 180,
  relief: 1.2,
  tathet: 1,
  fro: 42,
  hojdFro: 42,
  detalj: 'mobil'
};

const ART_GRAN = 'gran';
const ART_EK = 'ek';
const ART_BOK = 'bok';
const ART_APEL = 'apel';

export const ARTER = {
  gran: {
    id: ART_GRAN,
    namn: 'Gran',
    barr: true,
    modell: null,
    textur: 'barr'
  },
  ek: {
    id: ART_EK,
    namn: 'Ek',
    barr: false,
    modell: '../panorama/modeller/trad_ek_b.glb'
  },
  bok: {
    id: ART_BOK,
    namn: 'Bok',
    barr: false,
    modell: '../panorama/modeller/trad_bok_c.glb'
  },
  apel: {
    id: ART_APEL,
    namn: 'Äppelträd',
    barr: false,
    modell: '../panorama/modeller/trad_apple_c.glb'
  }
};

/* Fingeravtryck för den medföljande provbilden (långa sidan 320 px, FNV av RGBA).
   Räknas om i testet om jpeg-komprimeringen ändras. */
export const PROV_AVTRYCK = [];

export function boxMedel(src, w, h, r) {
  const ii = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let rad = 0;
    const radBas = y * w;
    const iiBas = (y + 1) * (w + 1);
    const iiFore = y * (w + 1);
    for (let x = 0; x < w; x++) {
      rad += src[radBas + x];
      ii[iiBas + x + 1] = ii[iiFore + x + 1] + rad;
    }
  }
  const ut = new Float32Array(w * h);
  const steg = w + 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r);
      const y0 = Math.max(0, y - r);
      const x1 = Math.min(w, x + r + 1);
      const y1 = Math.min(h, y + r + 1);
      const summa = ii[y1 * steg + x1] - ii[y0 * steg + x1] - ii[y1 * steg + x0] + ii[y0 * steg + x0];
      ut[y * w + x] = summa / ((x1 - x0) * (y1 - y0));
    }
  }
  return ut;
}

function komponenter(mask, w, h) {
  const sedd = new Uint8Array(w * h);
  const alla = [];
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i] || sedd[i]) continue;
    const ko = [i];
    sedd[i] = 1;
    for (let k = 0; k < ko.length; k++) {
      const p = ko[k];
      const x = p % w;
      const y = (p / w) | 0;
      const grannar = [
        x > 0 ? p - 1 : -1,
        x < w - 1 ? p + 1 : -1,
        y > 0 ? p - w : -1,
        y < h - 1 ? p + w : -1
      ];
      for (const g of grannar) {
        if (g >= 0 && mask[g] && !sedd[g]) {
          sedd[g] = 1;
          ko.push(g);
        }
      }
    }
    alla.push(ko);
  }
  return alla;
}

function dilatera(mask, w, h, r) {
  const m = boxMedel(mask, w, h, r);
  const ut = new Uint8Array(mask.length);
  for (let i = 0; i < ut.length; i++) ut[i] = m[i] > 0 ? 1 : 0;
  return ut;
}

function erodera(mask, w, h, r) {
  const m = boxMedel(mask, w, h, r);
  const ut = new Uint8Array(mask.length);
  for (let i = 0; i < ut.length; i++) ut[i] = m[i] > 0.99 ? 1 : 0;
  return ut;
}

function oppna(mask, w, h, r) {
  return dilatera(erodera(mask, w, h, r), w, h, r);
}

function stang(mask, w, h, r) {
  return erodera(dilatera(mask, w, h, r), w, h, r);
}

function slump(fro) {
  let t = fro >>> 0;
  return () => {
    t = (t + 1831565813) >>> 0;
    let e = Math.imul(t ^ (t >>> 15), 1 | t);
    e = (e + Math.imul(e ^ (e >>> 7), 61 | e)) >>> 0;
    return ((e ^ (e >>> 14)) >>> 0) / 4294967296;
  };
}

function klamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function percentil(sorterad, p) {
  return sorterad[Math.min(sorterad.length - 1, Math.max(0, Math.floor(sorterad.length * p)))];
}

function avtryckAv(data) {
  let v = 2166136261;
  for (let i = 0; i < data.length; i += 4) {
    v = Math.imul(v ^ data[i], 16777619) >>> 0;
    v = Math.imul(v ^ data[i + 1], 16777619) >>> 0;
    v = Math.imul(v ^ data[i + 2], 16777619) >>> 0;
  }
  return v >>> 0;
}

/* Samma höjdformel som FORM-studion, i meter. */
export function hojdPa(x, z, installningar) {
  const n = installningar || STANDARD;
  const r = (n.hojdFro ?? n.fro) * 0.37;
  const i = n.breddMeter;
  return n.relief * (
    Math.sin(x / (i * 0.3) + r) * 0.35 +
    Math.cos(z / (i * 0.27) - r) * 0.32 +
    Math.sin((x + z) / (i * 0.11) + r) * 0.13 +
    Math.sin(x * 0.43 + Math.cos(z * 0.35)) * Math.cos(z * 0.39) * 0.045
  );
}

function fargRutnat(data, w, h) {
  const H = Math.min(64, w);
  const U = Math.max(1, Math.round(h * H / w));
  const rgb = [];
  for (let y = 0; y < U; y++) {
    for (let x = 0; x < H; x++) {
      let a = 0;
      let o = 0;
      let s = 0;
      let c = 0;
      const y0 = Math.floor(y * h / U);
      const y1 = Math.max(y0 + 1, Math.floor((y + 1) * h / U));
      const x0 = Math.floor(x * w / H);
      const x1 = Math.max(x0 + 1, Math.floor((x + 1) * w / H));
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const t = (yy * w + xx) * 4;
          a += data[t];
          o += data[t + 1];
          s += data[t + 2];
          c++;
        }
      }
      rgb.push(Math.round(a / c), Math.round(o / c), Math.round(s / c));
    }
  }
  return { width: H, height: U, rgb };
}

function kanaler(data, w, h) {
  const n = w * h;
  const r = new Float32Array(n);
  const g = new Float32Array(n);
  const b = new Float32Array(n);
  const luma = new Float32Array(n);
  const luma2 = new Float32Array(n);
  const gron = new Float32Array(n);
  const etikett = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const t = data[i * 4] / 255;
    const u = data[i * 4 + 1] / 255;
    const v = data[i * 4 + 2] / 255;
    r[i] = t;
    g[i] = u;
    b[i] = v;
    const L = t * 0.25 + u * 0.55 + v * 0.2;
    luma[i] = L;
    luma2[i] = L * L;
    gron[i] = u - (t + v) * 0.5;
    const kroma = Math.max(t, u, v) - Math.min(t, u, v);
    const blaText = v > 0.45 && v > t * 1.35 && v > u * 1.25;
    const ljus = Math.min(t, u, v) > 0.78;
    etikett[i] = (ljus || blaText) ? 1 : 0;
  }
  return { r, g, b, luma, luma2, gron, etikett };
}

/* Fyll karttext och väderwidget med grannarnas färg så de inte blir träd. */
function fyllEtiketter(src, etikett, w, h) {
  const ut = new Float32Array(src.length);
  ut.set(src);
  const radie = 6;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!etikett[i]) continue;
      let s = 0;
      let c = 0;
      for (let dy = -radie; dy <= radie; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -radie; dx <= radie; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          const j = yy * w + xx;
          if (etikett[j]) continue;
          s += src[j];
          c++;
        }
      }
      if (c) ut[i] = s / c;
    }
  }
  return ut;
}

function legacyKlass(pix, w, h) {
  const n = w * h;
  const yMedel = boxMedel(pix.r, w, h, 2);
  const gMedel = boxMedel(pix.g, w, h, 2);
  const bMedel = boxMedel(pix.b, w, h, 2);
  const sMedel = boxMedel(pix.luma, w, h, 3);
  const cMedel = boxMedel(pix.luma2, w, h, 3);
  const gronMedel = boxMedel(pix.gron, w, h, 5);
  const sorterad = Array.from(pix.luma).sort((a, b) => a - b);
  const median = sorterad[Math.floor(n * 0.5)];
  const p70 = sorterad[Math.floor(n * 0.7)];
  const T = new Uint8Array(n);
  const tak = new Uint8Array(n);
  const plant = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const rr = yMedel[i];
    const gg = gMedel[i];
    const bb = bMedel[i];
    const a = sMedel[i];
    const o = Math.sqrt(Math.max(0, cMedel[i] - a * a));
    const gronDom = gg - rr * 0.94 > 0 && gg - bb * 0.94 > 0 && gronMedel[i] > 0.012;
    let c = KLASS.gras;
    if (a < Math.max(0.1, median * 0.58)) c = KLASS.trad;
    else if (gronDom) {
      const trad = (o > 0.025 && a < p70 * 1.15) || a < median * 0.96;
      c = trad ? KLASS.trad : KLASS.gras;
    } else if (rr > bb * 1.09 && a > median * 0.9) c = KLASS.jord;
    else if (a > p70 * 0.9 && Math.abs(rr - gg) < 0.12 && Math.abs(gg - bb) < 0.13) c = KLASS.jord;
    else if (bb > gg * 1.3 && bb > rr * 1.12 && a > 0.18 && o < 0.025) c = KLASS.vatten;
    else c = o > 0.03 ? KLASS.trad : KLASS.gras;
    if (a > 0.135 && a < 0.43 && bb - gg > 0.018 && gg - rr < 0.036 && o < 0.06) tak[i] = 1;
    if (a > Math.max(0.27, p70 * 0.93) && rr > gg * 0.98 && rr > bb * 1.045 && Math.abs(rr - gg) < 0.14 && o < 0.075) plant[i] = 1;
    T[i] = c;
  }
  return { T, tak, plant, yMedel, gMedel, bMedel, median, p70 };
}

function passform(pixlar, w, h) {
  if (pixlar.length < Math.max(16, w * h * 8e-4)) return null;
  let cx = 0;
  let cy = 0;
  for (const p of pixlar) {
    cx += p % w;
    cy += (p / w) | 0;
  }
  cx /= pixlar.length;
  cy /= pixlar.length;
  let xx = 0;
  let yy = 0;
  let xy = 0;
  for (const p of pixlar) {
    const dx = (p % w) - cx;
    const dy = ((p / w) | 0) - cy;
    xx += dx * dx;
    yy += dy * dy;
    xy += dx * dy;
  }
  const vinkel = 0.5 * Math.atan2(2 * xy, xx - yy);
  const co = Math.cos(vinkel);
  const si = Math.sin(vinkel);
  let minU = Infinity;
  let maxU = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;
  for (const p of pixlar) {
    const dx = (p % w) - cx;
    const dy = ((p / w) | 0) - cy;
    const u = dx * co + dy * si;
    const v = -dx * si + dy * co;
    if (u < minU) minU = u;
    if (u > maxU) maxU = u;
    if (v < minV) minV = v;
    if (v > maxV) maxV = v;
  }
  const langd = maxU - minU + 1;
  const bredd = maxV - minV + 1;
  const fyll = pixlar.length / (langd * bredd);
  const aspekt = Math.max(langd, bredd) / Math.min(langd, bredd);
  if (fyll < 0.3 || aspekt > 6 || langd < 4 || bredd < 4 || langd * bredd > w * h * 0.3) return null;
  const mu = (minU + maxU) / 2;
  const mv = (minV + maxV) / 2;
  return {
    u: (cx + mu * co - mv * si + 0.5) / w,
    v: (cy + mu * si + mv * co + 0.5) / h,
    w: langd / w,
    d: bredd / h,
    angle: vinkel,
    color: [0.28, 0.28, 0.26],
    roof: 'pitched',
    confidence: klamp(fyll * 0.8, 0.25, 0.78),
    langd,
    bredd,
    aspekt
  };
}

function pca(pixlar, w) {
  let cx = 0;
  let cy = 0;
  for (const p of pixlar) {
    cx += p % w;
    cy += (p / w) | 0;
  }
  cx /= pixlar.length;
  cy /= pixlar.length;
  let xx = 0;
  let yy = 0;
  let xy = 0;
  for (const p of pixlar) {
    const dx = (p % w) - cx;
    const dy = ((p / w) | 0) - cy;
    xx += dx * dx;
    yy += dy * dy;
    xy += dx * dy;
  }
  const vinkel = 0.5 * Math.atan2(2 * xy, xx - yy);
  const co = Math.cos(vinkel);
  const si = Math.sin(vinkel);
  let minU = Infinity;
  let maxU = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;
  for (const p of pixlar) {
    const dx = (p % w) - cx;
    const dy = ((p / w) | 0) - cy;
    const u = dx * co + dy * si;
    const v = -dx * si + dy * co;
    if (u < minU) minU = u;
    if (u > maxU) maxU = u;
    if (v < minV) minV = v;
    if (v > maxV) maxV = v;
  }
  return {
    cx, cy, vinkel, co, si,
    langd: maxU - minU + 1,
    bredd: maxV - minV + 1
  };
}

/* Zhang-Suen, 8-grannar. Masken ändras på plats och är 0/1. */
function tunna(mask, w, h) {
  const s = new Uint8Array(mask);
  const vid = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : s[y * w + x];
  let andrad = true;
  while (andrad) {
    andrad = false;
    for (let steg = 0; steg < 2; steg++) {
      const bort = [];
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          if (!s[y * w + x]) continue;
          const p2 = vid(x, y - 1);
          const p3 = vid(x + 1, y - 1);
          const p4 = vid(x + 1, y);
          const p5 = vid(x + 1, y + 1);
          const p6 = vid(x, y + 1);
          const p7 = vid(x - 1, y + 1);
          const p8 = vid(x - 1, y);
          const p9 = vid(x - 1, y - 1);
          const ring = [p2, p3, p4, p5, p6, p7, p8, p9];
          let antal = 0;
          for (const v of ring) antal += v;
          if (antal < 2 || antal > 6) continue;
          let over = 0;
          for (let k = 0; k < 8; k++) if (!ring[k] && ring[(k + 1) % 8]) over++;
          if (over !== 1) continue;
          if (steg === 0) {
            if (p2 * p4 * p6 !== 0) continue;
            if (p4 * p6 * p8 !== 0) continue;
          } else {
            if (p2 * p4 * p8 !== 0) continue;
            if (p2 * p6 * p8 !== 0) continue;
          }
          bort.push(y * w + x);
        }
      }
      if (bort.length) {
        andrad = true;
        for (const i of bort) s[i] = 0;
      }
    }
  }
  return s;
}

function foljLinje(skel, w, h) {
  const grad = new Int16Array(w * h);
  const grann = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!skel[i]) continue;
      let c = 0;
      for (const [dx, dy] of grann) {
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < w && yy < h && skel[yy * w + xx]) c++;
      }
      grad[i] = c;
    }
  }
  const sedd = new Uint8Array(w * h);
  const linjer = [];
  function ga(start) {
    const vag = [];
    let cur = start;
    sedd[cur] = 1;
    while (cur >= 0) {
      vag.push(cur);
      const x = cur % w;
      const y = (cur / w) | 0;
      let nasta = -1;
      for (const [dx, dy] of grann) {
        const xx = x + dx;
        const yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const j = yy * w + xx;
        if (skel[j] && !sedd[j]) {
          nasta = j;
          break;
        }
      }
      if (nasta < 0) break;
      sedd[nasta] = 1;
      cur = nasta;
    }
    return vag;
  }
  for (let i = 0; i < skel.length; i++) {
    if (skel[i] && grad[i] === 1 && !sedd[i]) {
      const vag = ga(i);
      if (vag.length > 4) linjer.push(vag);
    }
  }
  for (let i = 0; i < skel.length; i++) {
    if (skel[i] && !sedd[i]) {
      const vag = ga(i);
      if (vag.length > 4) linjer.push(vag);
    }
  }
  return linjer;
}

function forenkla(punkter, epsilon) {
  if (punkter.length < 3) return punkter;
  let maxD = 0;
  let index = 0;
  const a = punkter[0];
  const b = punkter[punkter.length - 1];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < punkter.length - 1; i++) {
    const p = punkter[i];
    const d = Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / len;
    if (d > maxD) {
      maxD = d;
      index = i;
    }
  }
  if (maxD > epsilon) {
    const vanster = forenkla(punkter.slice(0, index + 1), epsilon);
    const hoger = forenkla(punkter.slice(index), epsilon);
    return vanster.slice(0, -1).concat(hoger);
  }
  return [a, b];
}

function vagMask(pix, w, h) {
  const n = w * h;
  const kroma = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    kroma[i] = Math.max(pix.r[i], pix.g[i], pix.b[i]) - Math.min(pix.r[i], pix.g[i], pix.b[i]);
  }
  /* Vägen är gråare och mindre grön än åkern runt omkring, i ett litet fönster. */
  const kMedel = boxMedel(kroma, w, h, 5);
  const gMedel = boxMedel(pix.gron, w, h, 5);
  const grå = new Uint8Array(n);
  const brun = new Uint8Array(n);
  const takY = Math.round(h * 0.075);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (pix.etikett[i] || y < takY) continue;
      const L = pix.luma[i];
      const gron = pix.gron[i];
      const k = kroma[i];
      const gråare = k < kMedel[i] * 0.78 && gron < gMedel[i] * 0.82;
      if (gråare && k < 0.115 && L > 0.46 && L < 0.84 && gron < 0.045) grå[i] = 1;
      const brunare = pix.r[i] + 0.015 > pix.g[i] && pix.g[i] + 0.005 > pix.b[i] &&
        (pix.r[i] - pix.b[i]) > 0.045 && (pix.r[i] - pix.b[i]) < 0.2 &&
        gron < 0.012 && k < kMedel[i] * 0.9 && L > 0.4 && L < 0.72 && k > 0.03;
      if (brunare && !grå[i]) brun[i] = 1;
    }
  }
  /* Vidga lite så avbrutna vägbitar möts. En öppning skulle radera den smala vägen. */
  return { grå: dilatera(grå, w, h, 1), brun: dilatera(brun, w, h, 1) };
}

function linjerFranMask(mask, w, h, meterPerPixel, slag) {
  const linjer = [];
  for (const komp of komponenter(mask, w, h)) {
    if (komp.length < 10) continue;
    const form = pca(komp, w);
    const aspekt = form.langd / Math.max(1, form.bredd);
    const langdM = form.langd * meterPerPixel;
    const breddM = form.bredd * meterPerPixel;
    /* Korta bitar får leva. De som ligger i linje fogas ihop senare. */
    if (aspekt < 2.8 || langdM < 7 || breddM > 14) continue;
    let minX = w;
    let minY = h;
    let maxX = 0;
    let maxY = 0;
    const lokal = new Uint8Array(w * h);
    for (const p of komp) {
      lokal[p] = 1;
      const x = p % w;
      const y = (p / w) | 0;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    const bw = maxX - minX + 3;
    const bh = maxY - minY + 3;
    const crop = new Uint8Array(bw * bh);
    for (const p of komp) {
      const x = (p % w) - minX + 1;
      const y = ((p / w) | 0) - minY + 1;
      crop[y * bw + x] = 1;
    }
    const skel = tunna(crop, bw, bh);
    const spar = foljLinje(skel, bw, bh);
    for (const vag of spar) {
      const rå = vag.map((p) => ({
        x: (p % bw) + minX - 1,
        y: ((p / bw) | 0) + minY - 1
      }));
      const enkel = forenkla(rå, 0.8);
      if (enkel.length < 2) continue;
      let langd = 0;
      for (let i = 1; i < enkel.length; i++) {
        langd += Math.hypot(enkel[i].x - enkel[i - 1].x, enkel[i].y - enkel[i - 1].y);
      }
      const langdMeter = langd * meterPerPixel;
      if (langdMeter < 7) continue;
      const breddUppskatt = slag === 'gra' ? 6.5 : klamp((komp.length * meterPerPixel * meterPerPixel) / langdMeter, 3.4, 6);
      linjer.push({
        punkter: enkel,
        langdMeter,
        breddMeter: breddUppskatt,
        slag,
        aspekt
      });
    }
    if (!spar.length && langdM > 28) {
      /* Fallback: rak mittlinje längs huvudaxeln. */
      const steg = Math.max(2, Math.round(form.langd / 12));
      const punkter = [];
      for (let u = -form.langd / 2; u <= form.langd / 2; u += steg) {
        punkter.push({
          x: form.cx + u * form.co,
          y: form.cy + u * form.si
        });
      }
      linjer.push({
        punkter,
        langdMeter: langdM,
        breddMeter: klamp(breddM, 3.2, 9.5),
        slag,
        aspekt
      });
    }
  }
  return linjer;
}

function kopplaLinjer(linjer, maxGap) {
  const kvar = linjer.map((l) => ({
    ...l,
    punkter: l.punkter.map((p) => ({ x: p.x, y: p.y }))
  }));
  let slog = true;
  while (slog) {
    slog = false;
    yttre: for (let i = 0; i < kvar.length; i++) {
      for (let j = i + 1; j < kvar.length; j++) {
        const a = kvar[i];
        const b = kvar[j];
        if (a.slag !== b.slag) continue;
        const a0 = a.punkter[0];
        const a1 = a.punkter[a.punkter.length - 1];
        const b0 = b.punkter[0];
        const b1 = b.punkter[b.punkter.length - 1];
        const par = [
          [a1, b0, false, false],
          [a1, b1, false, true],
          [a0, b0, true, false],
          [a0, b1, true, true]
        ];
        for (const [p, q, vandaA, vandaB] of par) {
          if (Math.hypot(p.x - q.x, p.y - q.y) > maxGap) continue;
          const pa = vandaA ? a.punkter.slice().reverse() : a.punkter.slice();
          const pb = vandaB ? b.punkter.slice().reverse() : b.punkter.slice();
          const rikA = { x: pa[pa.length - 1].x - pa[Math.max(0, pa.length - 2)].x, y: pa[pa.length - 1].y - pa[Math.max(0, pa.length - 2)].y };
          const rikB = { x: pb[1].x - pb[0].x, y: pb[1].y - pb[0].y };
          const na = Math.hypot(rikA.x, rikA.y) || 1;
          const nb = Math.hypot(rikB.x, rikB.y) || 1;
          const cos = (rikA.x * rikB.x + rikA.y * rikB.y) / (na * nb);
          if (cos < 0.45) continue;
          kvar[i] = {
            punkter: pa.concat(pb.slice(1)),
            langdMeter: a.langdMeter + b.langdMeter + Math.hypot(p.x - q.x, p.y - q.y),
            breddMeter: (a.breddMeter + b.breddMeter) / 2,
            slag: a.slag,
            aspekt: Math.max(a.aspekt, b.aspekt)
          };
          kvar.splice(j, 1);
          slog = true;
          break yttre;
        }
      }
    }
  }
  return kvar;
}

function avstandTillKant(trad, w, h, meterPerPixel) {
  const dist = new Float32Array(w * h);
  dist.fill(1e6);
  for (let i = 0; i < trad.length; i++) if (!trad[i]) dist[i] = 0;
  const steg = meterPerPixel;
  const diag = steg * Math.SQRT2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (x) dist[i] = Math.min(dist[i], dist[i - 1] + steg);
      if (y) dist[i] = Math.min(dist[i], dist[i - w] + steg);
      if (x && y) dist[i] = Math.min(dist[i], dist[i - w - 1] + diag);
      if (x < w - 1 && y) dist[i] = Math.min(dist[i], dist[i - w + 1] + diag);
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      if (x < w - 1) dist[i] = Math.min(dist[i], dist[i + 1] + steg);
      if (y < h - 1) dist[i] = Math.min(dist[i], dist[i + w] + steg);
      if (x < w - 1 && y < h - 1) dist[i] = Math.min(dist[i], dist[i + w + 1] + diag);
      if (x && y < h - 1) dist[i] = Math.min(dist[i], dist[i + w - 1] + diag);
    }
  }
  return dist;
}

function artAv(r, g, b, L, kantMeter, rnd) {
  const gul = r - b;
  const morkBarr = L < 0.34 && g + 0.01 >= r && gul < 0.045;
  if (morkBarr && rnd() < 0.72) return ART_GRAN;
  if (kantMeter < 7 && rnd() < 0.55) return ART_APEL;
  if (gul > 0.035) return rnd() < 0.6 ? ART_BOK : ART_EK;
  if (L < 0.32 && rnd() < 0.45) return ART_GRAN;
  return rnd() < 0.5 ? ART_EK : ART_BOK;
}

function hojdForArt(art, rnd) {
  if (art === ART_GRAN) return 9 + rnd() * 7;
  if (art === ART_BOK) return 11 + rnd() * 7;
  if (art === ART_APEL) return 4.2 + rnd() * 2.4;
  return 8 + rnd() * 6;
}

function placeraMedFro(tradMask, pix, dist, w, h, installningar, breddM, djupM, avtryck) {
  const rnd = slump((avtryck ^ installningar.fro) >>> 0);
  const tak = installningar.detalj === 'hog' ? 18000 : 12000;
  const tathet = klamp(installningar.tathet, 0.2, 2);
  const minAvstand = Math.max(4.6, Math.sqrt((breddM * djupM) / tak) * 0.62) / Math.sqrt(tathet);
  const cell = minAvstand / Math.SQRT2;
  const kolumner = Math.ceil(breddM / cell);
  const rutor = new Map();
  const trad = [];
  const forsok = Math.min(tak * 30, Math.ceil(breddM * djupM * 0.75 / (minAvstand * minAvstand) * 40));
  const meterPerX = breddM / w;
  for (let n = 0; n < forsok && trad.length < tak; n++) {
    const u = rnd();
    const v = rnd();
    const xPix = Math.min(w - 1, Math.floor(u * w));
    const yPix = Math.min(h - 1, Math.floor(v * h));
    const i = yPix * w + xPix;
    if (!tradMask[i]) continue;
    const kant = dist[i];
    if (kant < 2.2) continue;
    const x = (u - 0.5) * breddM;
    const z = (v - 0.5) * djupM;
    const cx = Math.floor((u * breddM) / cell);
    const cz = Math.floor((v * djupM) / cell);
    let upptagen = false;
    for (let dz = -2; dz <= 2 && !upptagen; dz++) {
      for (let dx = -2; dx <= 2 && !upptagen; dx++) {
        const lista = rutor.get((cz + dz) * kolumner + (cx + dx));
        if (!lista) continue;
        for (const t of lista) {
          if ((t.x - x) ** 2 + (t.z - z) ** 2 < minAvstand * minAvstand) {
            upptagen = true;
            break;
          }
        }
      }
    }
    if (upptagen) continue;
    const art = artAv(pix.r[i], pix.g[i], pix.b[i], pix.luma[i], kant, rnd);
    const hojd = hojdForArt(art, rnd) * (0.9 + 0.12 * tathet);
    const krona = Math.min(hojd * (art === ART_GRAN ? 0.16 : art === ART_APEL ? 0.28 : 0.22) + 0.4, kant * 0.9);
    const skala = 0.82 + rnd() * 0.36;
    const post = {
      u, v, x, z,
      hojd,
      radie: krona,
      art,
      rotation: rnd() * Math.PI * 2,
      skala,
      stamp: art === ART_GRAN ? 0.28 : 0.4,
      farg: [pix.r[i], pix.g[i], pix.b[i]]
    };
    trad.push(post);
    const nyckel = cz * kolumner + cx;
    const lista = rutor.get(nyckel);
    if (lista) lista.push(post);
    else rutor.set(nyckel, [post]);
    void meterPerX;
  }
  return { trad, minAvstand };
}

function legacyPlacera(labels, w, h, installningar, breddM, djupM, avtryck, byggnader) {
  const rnd = slump((avtryck ^ installningar.fro) >>> 0);
  const tak = 12000;
  const tathet = klamp(installningar.tathet, 0.2, 2);
  const minAvstand = Math.max(3.7, Math.sqrt((breddM * djupM) / tak) * 0.52) / Math.sqrt(tathet);
  const cell = minAvstand / Math.SQRT2;
  const kolumner = Math.ceil(breddM / cell);
  const rutor = new Map();
  const trad = [];
  const forsok = Math.min(tak * 30, Math.ceil(breddM * djupM * 0.75 / (minAvstand * minAvstand) * 35));
  const meterX = breddM / w;
  const dist = new Float32Array(w * h);
  dist.fill(1e6);
  for (let i = 0; i < labels.length; i++) if (labels[i] !== KLASS.trad) dist[i] = 0;
  const diag = Math.hypot(meterX, meterX);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (x) dist[i] = Math.min(dist[i], dist[i - 1] + meterX);
      if (y) dist[i] = Math.min(dist[i], dist[i - w] + meterX);
      if (x && y) dist[i] = Math.min(dist[i], dist[i - w - 1] + diag);
      if (x < w - 1 && y) dist[i] = Math.min(dist[i], dist[i - w + 1] + diag);
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      if (x < w - 1) dist[i] = Math.min(dist[i], dist[i + 1] + meterX);
      if (y < h - 1) dist[i] = Math.min(dist[i], dist[i + w] + meterX);
      if (x < w - 1 && y < h - 1) dist[i] = Math.min(dist[i], dist[i + w + 1] + diag);
      if (x && y < h - 1) dist[i] = Math.min(dist[i], dist[i + w - 1] + diag);
    }
  }
  for (let n = 0; n < forsok && trad.length < tak; n++) {
    const u = rnd();
    const v = rnd();
    const xPix = Math.min(w - 1, Math.floor(u * w));
    const yPix = Math.min(h - 1, Math.floor(v * h));
    const i = yPix * w + xPix;
    if (labels[i] !== KLASS.trad) continue;
    if (dist[i] < 1.3) continue;
    const x = (u - 0.5) * breddM;
    const z = (v - 0.5) * djupM;
    let inne = false;
    for (const hus of byggnader) {
      const dx = (u - hus.u) * breddM;
      const dz = (v - hus.v) * djupM;
      const co = Math.cos(hus.angle);
      const si = Math.sin(hus.angle);
      if (Math.abs(dx * co + dz * si) < hus.w * breddM * 0.55 + 1 && Math.abs(-dx * si + dz * co) < hus.d * djupM * 0.55 + 1) {
        inne = true;
        break;
      }
    }
    if (inne) continue;
    const cx = Math.floor((u * breddM) / cell);
    const cz = Math.floor((v * djupM) / cell);
    let upptagen = false;
    for (let dz = -2; dz <= 2 && !upptagen; dz++) {
      for (let dx = -2; dx <= 2 && !upptagen; dx++) {
        const lista = rutor.get((cz + dz) * kolumner + (cx + dx));
        if (!lista) continue;
        for (const t of lista) {
          if ((t.x - x) ** 2 + (t.z - z) ** 2 < minAvstand * minAvstand) {
            upptagen = true;
            break;
          }
        }
      }
    }
    if (upptagen) continue;
    const post = { x, z };
    trad.push(post);
    const nyckel = cz * kolumner + cx;
    const lista = rutor.get(nyckel);
    if (lista) lista.push(post);
    else rutor.set(nyckel, [post]);
  }
  return trad.length;
}

function forslagAv(tradAndel, vagMeter, byggnader, avtryck, bildNamn) {
  const namnKand = (bildNamn || '').toLowerCase();
  const kandProv = PROV_AVTRYCK.includes(avtryck) || /markim|harg|prov/.test(namnKand);
  if (kandProv) {
    return {
      namn: 'Markimvägen vid Hargån',
      mapp: 'Landskap/Sverige/Uppland/Markim',
      anledning: 'Provbilden är Markimvägen och Hargån. Byt namn eller mapp om du vill.'
    };
  }
  let namn = 'Öppen mark';
  let mapp = 'Landskap/Åker';
  if (tradAndel > 0.22) {
    namn = 'Skog';
    mapp = 'Landskap/Skog';
  } else if (tradAndel > 0.06) {
    namn = 'Åker med skogsdungar';
    mapp = 'Landskap/Åker och skog';
  }
  if (vagMeter > 40) namn += ' vid väg';
  if (byggnader > 0) namn += byggnader === 1 ? ' med hus' : ` med ${byggnader} hus`;
  return {
    namn,
    mapp,
    anledning: 'Förslag utifrån skog, väg och hus i bilden. Du kan ändra innan du sparar.'
  };
}

/**
 * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} bild
 * @param {object} installningar
 * @param {{namn?:string}} meta
 */
export function tolka(bild, installningar = STANDARD, meta = {}) {
  const w = bild.width;
  const h = bild.height;
  if (w < 16 || h < 16 || w > 512 || h > 512) {
    throw new Error('Bilden måste analyseras som 16–512 pixlar per sida.');
  }
  const n = w * h;
  const inst = { ...STANDARD, ...installningar };
  const avtryck = avtryckAv(bild.data);
  inst.avtryck = avtryck;
  const pix = kanaler(bild.data, w, h);
  const legacy = legacyKlass(pix, w, h);
  pix.luma = fyllEtiketter(pix.luma, pix.etikett, w, h);
  pix.luma2 = new Float32Array(n);
  for (let i = 0; i < n; i++) pix.luma2[i] = pix.luma[i] * pix.luma[i];
  pix.r = fyllEtiketter(pix.r, pix.etikett, w, h);
  pix.g = fyllEtiketter(pix.g, pix.etikett, w, h);
  pix.b = fyllEtiketter(pix.b, pix.etikett, w, h);
  pix.gron = new Float32Array(n);
  for (let i = 0; i < n; i++) pix.gron[i] = pix.g[i] - (pix.r[i] + pix.b[i]) * 0.5;
  const sMedel = boxMedel(pix.luma, w, h, 2);
  const cMedel = boxMedel(pix.luma2, w, h, 2);
  const std = new Float32Array(n);
  for (let i = 0; i < n; i++) std[i] = Math.sqrt(Math.max(0, cMedel[i] - sMedel[i] * sMedel[i]));
  const sorterad = Array.from(pix.luma).sort((a, b) => a - b);
  const median = sorterad[Math.floor(n * 0.5)];
  const p40 = percentil(sorterad, 0.4);

  const kandidat = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (pix.etikett[i]) continue;
    const L = sMedel[i];
    const o = std[i];
    const gron = pix.gron[i];
    const mork = L < Math.max(0.2, median * 0.72) && L < p40 * 1.05;
    const textur = o > 0.02;
    const jamnLjus = L > median * 0.9 && o < 0.05;
    const vegetation = gron > 0.004 || L < median * 0.5;
    if (mork && textur && vegetation && !jamnLjus) kandidat[i] = 1;
  }
  let trad = oppna(kandidat, w, h, 1);
  trad = stang(trad, w, h, 2);
  const minDunge = Math.max(70, Math.round(n * 0.0035));
  for (const komp of komponenter(trad, w, h)) {
    if (komp.length < minDunge) {
      for (const p of komp) trad[p] = 0;
      continue;
    }
    let summa = 0;
    let minX = w;
    let maxX = 0;
    let minY = h;
    let maxY = 0;
    for (const p of komp) {
      summa += pix.luma[p];
      const x = p % w;
      const y = (p / w) | 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    const aspekt = Math.max(bw, bh) / Math.min(bw, bh);
    const medel = summa / komp.length;
    /* Hargån och andra långsmala, ljusare gröna band är inte trädkronor. */
    if (aspekt > 3.1 && medel > 0.36) {
      for (const p of komp) trad[p] = 0;
    }
  }

  const breddM = klamp(inst.breddMeter, 30, 1200);
  const djupM = breddM * h / w;
  const meterPerPixel = breddM / w;

  const vagarRå = vagMask(pix, w, h);
  let linjer = linjerFranMask(vagarRå.grå, w, h, meterPerPixel, 'gra');
  linjer = linjer.concat(linjerFranMask(vagarRå.brun, w, h, meterPerPixel, 'brun'));
  linjer = kopplaLinjer(linjer, 36);
  linjer = linjer.filter((linje) => linje.langdMeter >= 28);
  linjer.sort((a, b) => b.langdMeter - a.langdMeter);

  const vagPix = new Uint8Array(n);
  for (const linje of linjer) {
    const halva = (linje.breddMeter / meterPerPixel) * 0.5;
    for (let k = 1; k < linje.punkter.length; k++) {
      const a = linje.punkter[k - 1];
      const b = linje.punkter[k];
      const steg = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
      for (let t = 0; t <= steg; t++) {
        const x = a.x + (b.x - a.x) * (t / steg);
        const y = a.y + (b.y - a.y) * (t / steg);
        const rad = Math.ceil(halva);
        const stamRad = 2.3 / meterPerPixel;
        for (let dy = -rad; dy <= rad; dy++) {
          for (let dx = -rad; dx <= rad; dx++) {
            const d2 = dx * dx + dy * dy;
            if (d2 > halva * halva) continue;
            const xx = Math.round(x + dx);
            const yy = Math.round(y + dy);
            if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
            const i = yy * w + xx;
            if (d2 <= stamRad * stamRad) trad[i] = 0;
            vagPix[i] = 1;
          }
        }
      }
    }
  }
  for (let i = 0; i < n; i++) if (vagPix[i]) trad[i] = 0;

  /* Byggnader med den gamla takregeln, men inte där vi redan satt väg eller där ytan är en åker. */
  const byggnader = [];
  const takStangd = erodera(dilatera(legacy.tak, w, h, 2), w, h, 2);
  const plantStangd = erodera(dilatera(legacy.plant, w, h, 1), w, h, 1);
  for (const [mask, tak] of [[takStangd, 'pitched'], [plantStangd, 'flat']]) {
    for (const komp of komponenter(mask, w, h)) {
      const form = passform(komp, w, h);
      if (!form) continue;
      const area = form.w * form.d;
      if ((tak === 'flat' && area < 0.018) || (tak === 'pitched' && area < 0.009)) continue;
      let sr = 0;
      let sg = 0;
      let sb = 0;
      let paTrad = 0;
      for (const p of komp) {
        sr += pix.r[p];
        sg += pix.g[p];
        sb += pix.b[p];
        if (trad[p]) paTrad++;
      }
      form.color = [sr / komp.length, sg / komp.length, sb / komp.length];
      if (tak === 'flat' && (form.color[0] - form.color[2] > 0.115 || form.color[0] < 0.46 || form.confidence < 0.36)) continue;
      if (paTrad / komp.length > 0.45) continue;
      form.roof = tak;
      byggnader.push(form);
    }
  }

  const labels = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (trad[i]) labels[i] = KLASS.trad;
    else if (vagPix[i]) labels[i] = KLASS.vag;
    else labels[i] = legacy.T[i] === KLASS.vatten ? KLASS.vatten : legacy.T[i] === KLASS.jord ? KLASS.jord : KLASS.gras;
  }
  for (const hus of byggnader) {
    /* Märk en liten ruta runt huset så kollisionen har en yta. */
    const hw = Math.max(2, Math.round(hus.w * w * 0.5));
    const hd = Math.max(2, Math.round(hus.d * h * 0.5));
    const cx = Math.round(hus.u * w);
    const cy = Math.round(hus.v * h);
    for (let y = cy - hd; y <= cy + hd; y++) {
      for (let x = cx - hw; x <= cx + hw; x++) {
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const i = y * w + x;
        if (labels[i] !== KLASS.trad && labels[i] !== KLASS.vag) labels[i] = KLASS.byggnad;
      }
    }
  }

  const legacyLabels = legacy.T;
  const legacyTrad = legacyPlacera(legacyLabels, w, h, inst, breddM, djupM, avtryck, byggnader);

  const dist = avstandTillKant(trad, w, h, meterPerPixel);
  const placerat = placeraMedFro(trad, pix, dist, w, h, inst, breddM, djupM, avtryck);

  let faltTrad = 0;
  for (const t of placerat.trad) {
    const x = Math.min(w - 1, Math.floor(t.u * w));
    const y = Math.min(h - 1, Math.floor(t.v * h));
    const i = y * w + x;
    if (pix.luma[i] > median * 0.92 && std[i] < 0.04) faltTrad++;
  }

  const vagar = linjer.map((linje) => ({
    slag: linje.slag,
    breddMeter: Math.round(linje.breddMeter * 10) / 10,
    langdMeter: Math.round(linje.langdMeter * 10) / 10,
    punkter: linje.punkter.map((p) => {
      const u = klamp(p.x / w, 0, 1);
      const v = klamp(p.y / h, 0, 1);
      const x = (u - 0.5) * breddM;
      const z = (v - 0.5) * djupM;
      return { u, v, x, y: hojdPa(x, z, inst), z };
    })
  })).filter((v) => v.punkter.length >= 2);

  const tackning = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < n; i++) tackning[labels[i]]++;
  const tradAndel = tackning[KLASS.trad] / n;
  const vagMeter = vagar.reduce((s, v) => s + v.langdMeter, 0);
  const forslag = forslagAv(tradAndel, vagMeter, byggnader.length, avtryck, meta.namn);

  const arter = { gran: 0, ek: 0, bok: 0, apel: 0 };
  for (const t of placerat.trad) arter[t.art]++;

  return {
    version: 1,
    enhet: 'meter',
    axel: 'Y-upp',
    bredd: w,
    hojd: h,
    breddMeter: breddM,
    djupMeter: djupM,
    avtryck,
    median,
    labels,
    tradMask: trad,
    farg: fargRutnat(bild.data, w, h),
    trad: placerat.trad.map((t) => ({
      ...t,
      y: hojdPa(t.x, t.z, inst)
    })),
    tradFore: legacyTrad,
    tradNu: placerat.trad.length,
    faltTrad,
    arter,
    vagar,
    byggnader: byggnader.map((hus) => ({
      u: hus.u,
      v: hus.v,
      x: (hus.u - 0.5) * breddM,
      z: (hus.v - 0.5) * djupM,
      breddMeter: hus.w * breddM,
      djupMeter: hus.d * djupM,
      vinkel: hus.angle,
      tak: hus.roof,
      farg: hus.color,
      hojdMeter: hus.roof === 'pitched' ? 6.5 : 4.2
    })),
    tackning: tackning.map((c) => c / n),
    forslag,
    installningar: inst,
    minAvstand: placerat.minAvstand
  };
}

export function rasterSida(langsta = 320) {
  return langsta;
}
