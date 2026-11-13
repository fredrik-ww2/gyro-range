// Andel från skärmens överkant. 0,42 blir NDC-y 0,16 så strålen går genom pricken, inte genom mitten.

export function klampaAndel(andel) {
  const n = Number(andel);
  if (!Number.isFinite(n)) return 0.42;
  return Math.min(0.62, Math.max(0.28, n));
}

export function ndcFranAndel(andel) {
  const f = klampaAndel(andel);
  return {x: 0, y: 1 - 2 * f};
}

export function ndcMedSkak(andel, skakX, skakY, bredd, hojd) {
  const bas = ndcFranAndel(andel);
  const w = Math.max(1, Number(bredd) || 1);
  const h = Math.max(1, Number(hojd) || 1);
  return {
    x: bas.x + (Number(skakX) || 0) / (w * 0.5),
    y: bas.y - (Number(skakY) || 0) / (h * 0.5)
  };
}

export function sjalvtest() {
  const fel = [];
  const krav = (namn, ok) => { if (!ok) fel.push(namn); };
  const mitt = ndcFranAndel(0.5);
  const hogre = ndcFranAndel(0.42);
  krav('mitten är noll', Math.abs(mitt.x) < 1e-6 && Math.abs(mitt.y) < 1e-6);
  krav('42 procent ligger över mitten', Math.abs(hogre.y - 0.16) < 1e-6 && hogre.y > 0);
  const skak = ndcMedSkak(0.42, 10, 6, 200, 100);
  krav('skak flyttar samma håll som pricken', Math.abs(skak.x - 0.1) < 1e-6 && skak.y < hogre.y);
  krav('andel kläms', klampaAndel(2) === 0.62 && klampaAndel(-1) === 0.28);
  return fel;
}
