// Rekyl, skada och fiendens eldtakt. Ren matematik, inget ljud och ingen scen.

export const TIGER_HP = 3;
export const SPELARE_TRAFF = 6.5;
export const SPELARE_NARA = 22;

export function granatSkada(typ) {
  return typ === 'pansar' ? 2 : 1;
}

export function tigerUtslagen(skada) {
  return (+skada || 0) >= TIGER_HP;
}

export function nedslagMotSpelare(avstand) {
  const d = Math.max(0, +avstand || 0);
  if (d <= SPELARE_TRAFF) return 'traff';
  if (d <= SPELARE_NARA) return 'nara';
  return 'miss';
}

// 7–11 sekunder. slump är 0..1.
export function nastaSalva(slump) {
  const u = Math.min(1, Math.max(0, Number(slump) || 0));
  return 7 + u * 4;
}

// Kortaste vägen mot mal, högst maxFart radianer per sekund.
export function vridMot(yaw, mal, dt, maxFart = 0.9) {
  let d = mal - yaw;
  const varv = Math.PI * 2;
  while (d > Math.PI) d -= varv;
  while (d < -Math.PI) d += varv;
  const grans = Math.max(0, maxFart) * Math.max(0, +dt || 0);
  if (Math.abs(d) <= grans) return mal;
  return yaw + Math.sign(d) * grans;
}

// Dämpad fjäder. x är utslaget, v är farten. Tillbaka mot noll.
export function stegFjader(x, v, dt, k = 230, c = 18) {
  const h = Math.max(0, Math.min(0.05, +dt || 0));
  const xx0 = +x || 0;
  const vv0 = +v || 0;
  const vv = vv0 + (-k * xx0 - c * vv0) * h;
  const xx = xx0 + vv * h;
  if (Math.abs(xx) < 0.0004 && Math.abs(vv) < 0.006) return {x: 0, v: 0};
  return {x: xx, v: vv};
}

export function sjalvtest() {
  const fel = [];
  const krav = (namn, ok) => { if (!ok) fel.push(namn); };
  krav('spräng gör en skada', granatSkada('sprang') === 1 && granatSkada('annat') === 1);
  krav('pansar gör två skador', granatSkada('pansar') === 2);
  krav('två pansarträffar slår ut', !tigerUtslagen(granatSkada('pansar')) && tigerUtslagen(granatSkada('pansar') * 2));
  krav('tre sprängträffar slår ut', !tigerUtslagen(2) && tigerUtslagen(3));
  krav('träff och nära är olika', nedslagMotSpelare(3) === 'traff' && nedslagMotSpelare(14) === 'nara' && nedslagMotSpelare(40) === 'miss');
  krav('eldtakten ligger mellan 7 och 11 s', nastaSalva(0) === 7 && nastaSalva(1) === 11 && nastaSalva(0.5) === 9);
  krav('vridningen når inte förbi målet', Math.abs(vridMot(0, 0.05, 0.2, 0.9) - 0.05) < 1e-9);
  krav('vridningen har ett tak', Math.abs(vridMot(0, 1, 0.1, 0.9) - 0.09) < 1e-9);
  krav('vridningen tar kortaste vägen', vridMot(3, -3, 0.05, 1) > 3);

  let x = 0;
  let v = 8.5;
  let topp = 0;
  let vid = 0;
  for (let i = 0; i < 25; i++) {
    const n = stegFjader(x, v, 0.016, 230, 18);
    x = n.x;
    v = n.v;
    if (x > topp) topp = x;
    vid = x;
  }
  krav('egen rekyl slår ut och vänder inom 0,4 s', topp > 0.12 && vid < topp * 0.7 && vid > -0.05);

  x = 0;
  v = 11;
  topp = 0;
  let tid = 0;
  let tidTopp = 0;
  for (let i = 0; i < 40; i++) {
    const n = stegFjader(x, v, 0.016, 70, 12);
    x = n.x;
    v = n.v;
    tid += 0.016;
    if (x > topp) { topp = x; tidTopp = tid; }
  }
  krav('fiendens rekyl syns och hinner vända', topp > 0.45 && tidTopp < 0.28 && x < topp);
  return fel;
}
