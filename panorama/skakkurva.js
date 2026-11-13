// Gångskak följer spakläget. Telefonens acceleration går genom dödzon och en brant exponent.

export function gangAmp(lage, niva = {}) {
  const ga = Number.isFinite(+niva.ga) ? +niva.ga : 0.5;
  const springa = Number.isFinite(+niva.springa) ? +niva.springa : 1;
  if (lage === 'ga') return Math.max(0, ga);
  if (lage === 'springa') return Math.max(0, springa);
  return 0;
}

export function accSkak(acc, jerk, opt = {}) {
  const dod = Number.isFinite(+opt.dodzon) ? +opt.dodzon : 1.8;
  const exp = Number.isFinite(+opt.exponent) ? +opt.exponent : 2.8;
  const gain = Number.isFinite(+opt.gain) ? +opt.gain : 0.01;
  const vikt = Number.isFinite(+opt.jerkVikt) ? +opt.jerkVikt : 0.08;
  const a = Math.max(0, (Number(acc) || 0) - Math.max(0, dod));
  const j = Math.max(0, (Number(jerk) || 0) - Math.max(0, dod) * 8);
  const ra = a + j * Math.max(0, vikt);
  if (!(ra > 0) || !(exp > 0)) return 0;
  const kurva = Math.pow(ra, exp) * Math.max(0, gain);
  if (!Number.isFinite(kurva)) return 1;
  return Math.min(1, Math.max(0, kurva));
}

export function sjalvtest() {
  const fel = [];
  const krav = (namn, ok) => { if (!ok) fel.push(namn); };
  krav('stilla och försiktigt är noll', gangAmp('stilla') === 0 && gangAmp('forsiktigt') === 0);
  krav('gång är måttlig', gangAmp('ga', {ga: 0.5, springa: 1}) === 0.5);
  krav('spring är kraftigare', gangAmp('springa', {ga: 0.5, springa: 1}) > gangAmp('ga', {ga: 0.5, springa: 1}) * 1.5);
  const svag = accSkak(1.2, 4, {dodzon: 1.8, exponent: 2.8, gain: 0.01});
  const forsiktig = accSkak(2.3, 6, {dodzon: 1.8, exponent: 2.8, gain: 0.01});
  const ryck = accSkak(9, 40, {dodzon: 1.8, exponent: 2.8, gain: 0.01});
  krav('under dödzonen är tyst', svag === 0);
  krav('försiktig acceleration är nästan stilla', forsiktig < 0.02);
  krav('kraftigt ryck är stort', ryck > 0.75);
  krav('kurvan är brant', ryck > forsiktig * 25);
  const flat = accSkak(4, 0, {dodzon: 1.8, exponent: 1.1, gain: 0.08});
  const brant = accSkak(4, 0, {dodzon: 1.8, exponent: 3.4, gain: 0.08});
  krav('högre exponent skiljer mer från ett svagt utslag', brant > flat);
  return fel;
}
