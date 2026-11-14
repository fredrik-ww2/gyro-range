/* Tar bort kartöverlägg: skalstock och väderplupp högst upp,
   samt textskyltar (vit eller blå text på mörk platta).
   Hålen fylls med marken bredvid, så åkern och vägen fortsätter. */

export function rensaOverlagg(data, w, h) {
  const n = w * h;
  const glyf = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const mn = Math.min(r, g, b);
    const bla = b > 155 && b > r + 12 && b > g + 6 && g > 120;
    if (mn > 220 || bla) glyf[i] = 1;
  }
  const uiY = Math.min(96, Math.round(h * 0.075));
  const hall = filtrera(glyf, w, h, (c) => c.n >= 8 && c.n < 6000 && c.h >= 8 && c.h <= 40 && c.w <= 520);
  let rutor = [];
  for (const c of hall.rutor) {
    if (c.y < uiY) continue;
    const platta = textPlatta(data, w, h, c);
    if (platta) rutor.push(platta);
  }

  const topp = uiY;
  const mork = new Uint8Array(n);
  for (let y = 0; y < topp; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      const l = (r + g + b) / 3;
      const k = Math.max(r, g, b) - Math.min(r, g, b);
      if (l < 88 && k < 55) mork[i] = 1;
    }
  }
  const stapel = filtrera(mork, w, h, (c) => c.w > w * 0.16 && c.h >= 3 && c.h < 36 && c.w / Math.max(1, c.h) > 6);
  for (const c of stapel.rutor) {
    rutor.push({ x: c.x - 24, y: Math.max(0, c.y - 34), w: c.w + 110, h: Math.min(uiY + 8, c.y + c.h + 10) - Math.max(0, c.y - 34) });
  }

  const vanster = Math.round(w * 0.45);
  const ljus = new Uint8Array(n);
  for (let y = 0; y < topp; y++) {
    for (let x = 0; x < vanster; x++) {
      const i = y * w + x;
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      const l = (r + g + b) / 3;
      const k = Math.max(r, g, b) - Math.min(r, g, b);
      if (l > 160 && k < 50 && Math.min(r, g, b) > 135) ljus[i] = 1;
    }
  }
  const plupp = filtrera(stang(ljus, w, h, 3), w, h, (c) => c.n > 80 && c.n < 8000 && c.w < 260 && c.h < 80 && c.y < uiY);
  for (const c of plupp.rutor) {
    rutor.push({ x: c.x - 6, y: Math.max(0, c.y - 4), w: c.w + 12, h: Math.min(uiY + 4, c.y + c.h + 8) - Math.max(0, c.y - 4) });
  }

  rutor = slåIhop(rutor.map((c) => ({
    x: Math.max(0, c.x),
    y: Math.max(0, c.y),
    w: c.w,
    h: c.h
  })));
  return fyllRutor(data, rutor, w, h);
}

function textPlatta(data, w, h, c) {
  let minX = c.x;
  let maxX = c.x + c.w;
  let minY = c.y;
  let maxY = c.y + c.h;
  let n = 0;
  const y0 = Math.max(0, c.y - 14);
  const y1 = Math.min(h - 1, c.y + c.h + 14);
  const x0 = Math.max(0, c.x - 14);
  const x1 = Math.min(w - 1, c.x + c.w + 14);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const l = (r + g + b) / 3;
      const k = Math.max(r, g, b) - Math.min(r, g, b);
      if (l < 78 && k < 55) {
        n++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const bw = maxX - minX;
  const bh = maxY - minY;
  if (n < 50 || bh > 78 || bw > 260 || bh < 10) return null;
  return { x: minX - 3, y: minY - 3, w: bw + 6, h: bh + 6 };
}

function slåIhop(rutor) {
  const lista = rutor.map((r) => ({ x: r.x, y: r.y, w: r.w, h: r.h }));
  let andrad = true;
  while (andrad) {
    andrad = false;
    for (let i = 0; i < lista.length; i++) {
      for (let j = i + 1; j < lista.length; j++) {
        const a = lista[i];
        const b = lista[j];
        const gap = 12;
        if (a.x > b.x + b.w + gap || b.x > a.x + a.w + gap || a.y > b.y + b.h + gap || b.y > a.y + a.h + gap) continue;
        const x = Math.min(a.x, b.x);
        const y = Math.min(a.y, b.y);
        const x2 = Math.max(a.x + a.w, b.x + b.w);
        const y2 = Math.max(a.y + a.h, b.y + b.h);
        lista[i] = { x, y, w: x2 - x, h: y2 - y };
        lista.splice(j, 1);
        andrad = true;
        break;
      }
      if (andrad) break;
    }
  }
  return lista;
}

function filtrera(mask, w, h, behall) {
  const ut = new Uint8Array(mask.length);
  const rutor = [];
  const sedd = new Uint8Array(mask.length);
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i] || sedd[i]) continue;
    const q = [i];
    sedd[i] = 1;
    let minX = w;
    let maxX = 0;
    let minY = h;
    let maxY = 0;
    for (let k = 0; k < q.length; k++) {
      const p = q[k];
      const x = p % w;
      const y = (p / w) | 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      const grannar = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
      for (const g of grannar) {
        if (g >= 0 && mask[g] && !sedd[g]) {
          sedd[g] = 1;
          q.push(g);
        }
      }
    }
    const c = { n: q.length, x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
    if (!behall(c)) continue;
    for (const p of q) ut[p] = 1;
    rutor.push(c);
  }
  return { mask: ut, rutor };
}

function vidga(mask, w, h, r) {
  const ut = new Uint8Array(mask.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!mask[y * w + x]) continue;
      const y0 = Math.max(0, y - r);
      const y1 = Math.min(h - 1, y + r);
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(w - 1, x + r);
      for (let yy = y0; yy <= y1; yy++) ut.fill(1, yy * w + x0, yy * w + x1 + 1);
    }
  }
  return ut;
}

function stang(mask, w, h, r) {
  return erodera(vidga(mask, w, h, r), w, h, r);
}

function erodera(mask, w, h, r) {
  const ut = new Uint8Array(mask.length);
  const behov = (r * 2 + 1) * (r * 2 + 1);
  for (let y = r; y < h - r; y++) {
    for (let x = r; x < w - r; x++) {
      let c = 0;
      for (let yy = y - r; yy <= y + r && c < behov; yy++) {
        for (let xx = x - r; xx <= x + r; xx++) c += mask[yy * w + xx];
      }
      if (c === behov) ut[y * w + x] = 1;
    }
  }
  return ut;
}

function arSkylt(data, s) {
  const r = data[s];
  const g = data[s + 1];
  const b = data[s + 2];
  const l = (r + g + b) / 3;
  if (Math.min(r, g, b) > 210) return true;
  if (b > 150 && b > r + 12 && b > g + 4) return true;
  if (l < 35) return true;
  return false;
}

function fyllRutor(data, rutor, w, h) {
  const ut = new Uint8ClampedArray(data);
  const inne = (x, y) => rutor.some((c) => x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h);
  for (const c of rutor) {
    const x0 = Math.max(0, c.x);
    const y0 = Math.max(0, c.y);
    const x1 = Math.min(w - 1, c.x + c.w - 1);
    const y1 = Math.min(h - 1, c.y + c.h - 1);
    const uppe = y0 < h * 0.16;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        let sx = x;
        let sy = y;
        if (uppe) {
          sy = y1 + 4 + (y - y0);
          if (sy >= h || inne(x, sy)) sy = Math.max(0, y0 - 4 - (y - y0));
        } else {
          sx = x0 - 4 - (x - x0);
          if (sx < 0 || inne(sx, y)) sx = Math.min(w - 1, x1 + 4 + (x - x0));
        }
        sx = Math.max(0, Math.min(w - 1, sx));
        sy = Math.max(0, Math.min(h - 1, sy));
        let s = (sy * w + sx) * 4;
        if (arSkylt(data, s)) {
          if (uppe) sy = Math.min(h - 1, sy + 12);
          else sx = Math.max(0, sx - 12);
          s = (sy * w + sx) * 4;
        }
        const i = (y * w + x) * 4;
        ut[i] = data[s];
        ut[i + 1] = data[s + 1];
        ut[i + 2] = data[s + 2];
      }
    }
  }
  return ut;
}
