// Förenklad 75 mm-bana: mynningsfart, luftmotstånd och tyngd.
// Siktesstrecken räknas ur samma steg som granaten.

export const G = 9.81;
export const V0 = 340;
export const RHO = 1.2;
export const K = 0.000045;
export const MARKEN = [200, 400, 600, 800, 1000];

function bromsa(vx, vy, vz, h) {
  const sp = Math.hypot(vx, vy, vz);
  const drag = K * RHO * sp;
  return [vx - vx * drag * h, vy - vy * drag * h - G * h, vz - vz * drag * h, sp];
}

export function hojdVid(avstand, vinkel) {
  let x = 0;
  let y = 0;
  let vx = Math.cos(vinkel) * V0;
  let vy = Math.sin(vinkel) * V0;
  let t = 0;
  while (t < 8 && x < avstand) {
    const sp = Math.hypot(vx, vy);
    const h = Math.min(0.012, sp > 40 ? 1.2 / sp : 0.012);
    const drag = K * RHO * sp;
    vx -= vx * drag * h;
    vy -= vy * drag * h + G * h;
    x += vx * h;
    y += vy * h;
    t += h;
    if (y < -80 && vy < 0) break;
  }
  return {y, t, x};
}

export function hojdvinkel(avstand) {
  let lo = 0;
  let hi = 12 * Math.PI / 180;
  for (let i = 0; i < 20; i++) {
    const m = (lo + hi) / 2;
    if (hojdVid(avstand, m).y > 0) hi = m;
    else lo = m;
  }
  return (lo + hi) / 2;
}

export function banTabell(avstand = MARKEN) {
  return avstand.map(R => {
    const vinkel = hojdvinkel(R);
    const bana = hojdVid(R, vinkel);
    return {R, vinkel, tid: bana.t};
  });
}

export function skapaGranat(x, y, z, vx, vy, vz) {
  return {x, y, z, vx, vy, vz, tid: 0, foreX: x, foreY: y, foreZ: z, klar: false};
}

export function stegGranat(p, h) {
  p.foreX = p.x;
  p.foreY = p.y;
  p.foreZ = p.z;
  const [vx, vy, vz] = bromsa(p.vx, p.vy, p.vz, h);
  p.vx = vx;
  p.vy = vy;
  p.vz = vz;
  p.x += p.vx * h;
  p.y += p.vy * h;
  p.z += p.vz * h;
  p.tid += h;
  return p;
}

export function delTid(p, tak) {
  const sp = Math.hypot(p.vx, p.vy, p.vz);
  return Math.min(tak, sp > 40 ? 1.2 / sp : tak);
}

export function sjalvtest() {
  const fel = [];
  const krav = (n, ok) => { if (!ok) fel.push(n); };
  const tabell = banTabell();
  krav('fem avstånd', tabell.length === 5);
  for (let i = 1; i < tabell.length; i++) {
    krav('strecken stiger ' + tabell[i].R, tabell[i].vinkel > tabell[i - 1].vinkel + 0.001);
    krav('längre flygtid ' + tabell[i].R, tabell[i].tid > tabell[i - 1].tid);
  }
  const nara = tabell[0];
  const langt = tabell[3];
  krav('200 m är en kort bana', nara.tid > 0.4 && nara.tid < 1.2 && nara.vinkel > 0.002 && nara.vinkel < 0.04);
  krav('800 m faller synligt', langt.tid > 1.8 && langt.tid < 5 && langt.vinkel > 0.02 && langt.vinkel < 0.12);
  const traff = hojdVid(400, tabell[1].vinkel);
  krav('siktet träffar mynningshöjd', Math.abs(traff.y) < 0.4);
  const plan = hojdVid(600, 0);
  krav('plant skott faller', plan.y < -2);
  const g = skapaGranat(0, 2, 0, V0, 0, 0);
  let mark = false;
  for (let i = 0; i < 400 && !mark; i++) {
    stegGranat(g, delTid(g, 0.02));
    if (g.y <= 0) mark = true;
  }
  krav('granaten når marken', mark && g.x > 100 && g.tid > 0.3);
  return fel;
}
