// Tre klicklägen ovanför Stilla. Fart är m/s innan ställningen dämpar den.

export const SPAK_LAGEN = [
  {id: 'stilla', namn: 'Stilla', fart: 0, skak: 0},
  {id: 'forsiktigt', namn: 'Gå försiktigt', fart: 0.72, skak: 0},
  {id: 'ga', namn: 'Gå', fart: 1.55, skak: 0.5},
  {id: 'springa', namn: 'Springa', fart: 4.35, skak: 1}
];

const INDEX = Object.fromEntries(SPAK_LAGEN.map((l, i) => [l.id, i]));

export function lageAv(id) {
  return SPAK_LAGEN[INDEX[id]] || SPAK_LAGEN[0];
}

export function andelFranLage(id) {
  const i = INDEX[id];
  return (i == null ? 0 : i) / (SPAK_LAGEN.length - 1);
}

export function lageFranAndel(andel) {
  const t = Math.min(1, Math.max(0, Number(andel) || 0));
  const i = Math.round(t * (SPAK_LAGEN.length - 1));
  return SPAK_LAGEN[i];
}

export function framFart(lage, tangent) {
  const bas = lageAv(lage).fart;
  const t = Math.max(-1, Math.min(1, Number(tangent) || 0));
  if (t < 0) return -(bas > 0 ? bas : lageAv('ga').fart);
  if (bas > 0) return bas;
  if (t > 0) return lageAv('ga').fart;
  return 0;
}

// Stilla och Gå försiktigt ger ingen gångskak. W medan spaken står på Stilla räknas som Gå.
export function skakLage(lage, tangentFram) {
  const id = lageAv(lage).id;
  if (id === 'ga' || id === 'springa' || id === 'forsiktigt') return id;
  return tangentFram ? 'ga' : 'stilla';
}

export function sjalvtest() {
  const fel = [];
  const krav = (namn, ok) => { if (!ok) fel.push(namn); };
  krav('fyra lägen', SPAK_LAGEN.length === 4 && SPAK_LAGEN[0].id === 'stilla' && SPAK_LAGEN[3].id === 'springa');
  krav('stilla står still', framFart('stilla', 0) === 0 && skakLage('stilla', false) === 'stilla');
  krav('försiktigt utan skak', framFart('forsiktigt', 0) > 0.4 && framFart('forsiktigt', 0) < 1 && lageAv('forsiktigt').skak === 0 && skakLage('forsiktigt', true) === 'forsiktigt');
  krav('springa är klart snabbare', framFart('springa', 0) > framFart('ga', 0) * 2);
  krav('tangent i stilla blir gång', framFart('stilla', 1) === lageAv('ga').fart && skakLage('stilla', true) === 'ga');
  krav('spaken snäpper', lageFranAndel(0).id === 'stilla' && lageFranAndel(0.34).id === 'forsiktigt' && lageFranAndel(1).id === 'springa');
  krav('andel tillbaka', Math.abs(andelFranLage('ga') - 2 / 3) < 1e-6);
  return fel;
}
