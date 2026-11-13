const FORM = {flat: 24, mjuk: 70, vag: 22, a: 8.5, b: 3.6, c: 10, d: 4.5};

function slat(e0, e1, x) {
  const t = Math.min(1, Math.max(0, (x - e0) / Math.max(1e-4, e1 - e0)));
  return t * t * (3 - 2 * t);
}

function tal(v, bas) {
  const n = Number(v);
  return Number.isFinite(n) ? n : bas;
}

export function formAv(raw) {
  const f = raw && typeof raw === 'object' ? raw : {};
  return {
    flat: tal(f.flat, FORM.flat),
    mjuk: tal(f.mjuk, FORM.mjuk),
    vag: tal(f.vag, FORM.vag),
    a: tal(f.a, FORM.a),
    b: tal(f.b, FORM.b),
    c: tal(f.c, FORM.c),
    d: tal(f.d, FORM.d)
  };
}

function hojdVid(x, z, f) {
  const r = Math.hypot(x, z);
  const t = slat(f.flat, f.mjuk, r);
  const s = Math.max(8, f.vag);
  const dal = Math.min(1, Math.exp(-(x * x) / (2 * s * s)) + Math.exp(-(z * z) / (2 * s * s)));
  const kullar =
    Math.sin(x * 0.012 + 0.7) * Math.cos(z * 0.0105 - 0.4) * f.a +
    Math.sin(x * 0.023 - z * 0.018) * f.b +
    Math.cos(z * 0.0075 + x * 0.0045 + 1.1) * f.c +
    Math.sin((x + z * 0.6) * 0.0055) * f.d;
  // Vägarna längs axlarna hålls nästan plana så långhållssiktet inte skärs av en ås.
  return t * kullar * (1 - dal * 0.985);
}

export function markHojd(x, z) {
  return hojdVid(x, z, FORM);
}

export function medForm(raw) {
  const f = formAv(raw);
  return (x, z) => hojdVid(x, z, f);
}
