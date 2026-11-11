// Enkel bandstyrning i meter. Positiv roll svänger höger oavsett om gasen är fram eller back.
// Positivt u på torn vrider tornet åt höger. Positivt u på eldröret höjer.

export const VMAX = 40 / 3.6;
export const BACKGAS = 0.22;
export const BAND = 2.2;
export const WMAX = 1.1;
export const ACCEL = 7;
export const INBROMS = 12;
export const TORN_VARV_S = 15;
export const TORN_MAX = (Math.PI * 2) / TORN_VARV_S;
export const ELD_FART = 12 * Math.PI / 180;
export const ELD_MIN = -10 * Math.PI / 180;
export const ELD_MAX = 25 * Math.PI / 180;

const AXLAR = ['styra', 'torn', 'eldror'];

export const STANDARD = {
  visaMat: false,
  axlar: {
    styra: {dodzon: 2.5, kanslighet: 1, full: 36, utjamning: 0.22, invertera: false},
    torn: {dodzon: 3, kanslighet: 1, full: 30, utjamning: 0.16, invertera: false},
    eldror: {dodzon: 3, kanslighet: 1, full: 26, utjamning: 0.16, invertera: false}
  },
  trosklar: {broms: 6, ettBand: 15, backBand: 26}
};

function klamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

function normalAxel(raw, bas) {
  return {
    dodzon: klamp(Number.isFinite(+raw?.dodzon) ? +raw.dodzon : bas.dodzon, 0, 20),
    kanslighet: klamp(Number.isFinite(+raw?.kanslighet) ? +raw.kanslighet : bas.kanslighet, 0.3, 3),
    full: klamp(Number.isFinite(+raw?.full) ? +raw.full : bas.full, 5, 75),
    utjamning: klamp(Number.isFinite(+raw?.utjamning) ? +raw.utjamning : bas.utjamning, 0, 1),
    invertera: !!(raw?.invertera ?? bas.invertera)
  };
}

export function normalStyr(raw) {
  const axlar = {};
  for (const id of AXLAR) axlar[id] = normalAxel(raw?.axlar?.[id], STANDARD.axlar[id]);
  const t = raw?.trosklar || {};
  return {
    visaMat: !!(raw?.visaMat),
    axlar,
    trosklar: {
      broms: klamp(Number.isFinite(+t.broms) ? +t.broms : STANDARD.trosklar.broms, 1, 40),
      ettBand: klamp(Number.isFinite(+t.ettBand) ? +t.ettBand : STANDARD.trosklar.ettBand, 2, 55),
      backBand: klamp(Number.isFinite(+t.backBand) ? +t.backBand : STANDARD.trosklar.backBand, 4, 70)
    }
  };
}

export function ordnaTrosklar(t, full) {
  const broms = klamp(t.broms, 1, 40);
  const ettBand = klamp(Math.max(t.ettBand, broms + 2), 2, 55);
  const backBand = klamp(Math.max(t.backBand, ettBand + 2), 4, 70);
  return {broms, ettBand, backBand, full: klamp(Math.max(full, backBand + 3), 5, 80)};
}

export function jamna(visad, mal, dt, utjamning) {
  const tau = Math.max(0, utjamning) * 0.35;
  if (!(tau > 0) || !(dt > 0)) return mal;
  return visad + (mal - visad) * (1 - Math.exp(-dt / tau));
}

export function skapaJamning() {
  return {styra: 0, torn: 0, eldror: 0};
}

export function behandlaAxel(rad, ax, dt, jamn, nyckel) {
  let a = rad;
  if (ax.invertera) a = -a;
  const dz = ax.dodzon * Math.PI / 180;
  const m = Math.abs(a);
  if (m <= dz) a = 0;
  else a = Math.sign(a) * (m - dz);
  a *= ax.kanslighet;
  const nasta = jamna(jamn[nyckel], a, dt, ax.utjamning);
  jamn[nyckel] = nasta;
  const full = Math.max(0.05, ax.full * Math.PI / 180);
  const u = klamp(nasta / full, -1, 1);
  return {rad: nasta, grader: nasta * 180 / Math.PI, u};
}

function narma(cur, mal, dt) {
  const d = mal - cur;
  const bromsar = Math.abs(mal) < Math.abs(cur) - 1e-6 || mal * cur < 0;
  const steg = (bromsar ? INBROMS : ACCEL) * dt;
  if (Math.abs(d) <= steg) return mal;
  return cur + Math.sign(d) * steg;
}

// rollGrader är behandlad lutning. Positivt = höger.
// Framåt: vänster band driver, höger bromsas. Back: samma sväng, banden byter roll.
export function bandMal(gas, rollGrader, tro) {
  const fram = klamp(gas, -BACKGAS, 1) * VMAX;
  const mag = Math.abs(rollGrader);
  const sign = Math.sign(rollGrader);
  let inner = 1;
  if (mag <= tro.broms) inner = 1;
  else if (mag < tro.ettBand) inner = 1 - (mag - tro.broms) / (tro.ettBand - tro.broms);
  else if (mag < tro.backBand) inner = 0;
  else inner = -Math.min(1, (mag - tro.backBand) / Math.max(0.5, tro.full - tro.backBand));
  const outer = fram;
  const innerV = fram * inner;
  let vanster = fram;
  let hoger = fram;
  if (sign !== 0) {
    const hogerArInner = fram >= 0 ? sign > 0 : sign < 0;
    if (hogerArInner) { vanster = outer; hoger = innerV; }
    else { hoger = outer; vanster = innerV; }
  }
  let w = (hoger - vanster) / BAND;
  if (Math.abs(w) > WMAX) {
    const s = WMAX / Math.abs(w);
    vanster *= s;
    hoger *= s;
    w = (hoger - vanster) / BAND;
  }
  return {vanster, hoger, w};
}

export function skapaVagn() {
  return {x: 0, z: 0, yaw: 0, vL: 0, vR: 0, torn: 0, eld: 0, fart: 0};
}

export function stegaVagn(s, mal, dt) {
  s.vL = narma(s.vL, mal.vanster, dt);
  s.vR = narma(s.vR, mal.hoger, dt);
  const v = (s.vL + s.vR) / 2;
  const w = (s.vR - s.vL) / BAND;
  s.yaw += w * dt;
  s.x += -Math.sin(s.yaw) * v * dt;
  s.z += -Math.cos(s.yaw) * v * dt;
  s.fart = v;
  return s;
}

export function stegaTorn(torn, u, dt) {
  return torn + u * TORN_MAX * dt;
}

export function stegaEldror(eld, u, dt) {
  return klamp(eld + u * ELD_FART * dt, ELD_MIN, ELD_MAX);
}

export function sjalvtest() {
  const fel = [];
  const krav = (n, ok) => { if (!ok) fel.push(n); };
  const tro = ordnaTrosklar(STANDARD.trosklar, STANDARD.axlar.styra.full);
  const rak = bandMal(1, 0, tro);
  krav('rakt ger lika band', Math.abs(rak.vanster - rak.hoger) < 1e-6 && rak.vanster > 10 && Math.abs(rak.w) < 1e-6);
  const broms = bandMal(1, 9, tro);
  krav('broms sänker innerbandet', broms.vanster > broms.hoger && broms.hoger > 0 && broms.w < 0);
  const pivot = bandMal(1, 18, tro);
  krav('ett band står stilla åt höger', pivot.hoger === 0 && pivot.vanster > 0 && pivot.w < 0);
  const spinn = bandMal(1, 40, tro);
  krav('backande band åt höger', spinn.vanster > 0 && spinn.hoger < 0 && spinn.w < 0);
  krav('giren har ett tak', Math.abs(spinn.w) <= WMAX + 1e-6 && Math.abs(pivot.w) <= WMAX + 1e-6);
  const vanster = bandMal(1, -18, tro);
  krav('vänster spegel', vanster.vanster === 0 && vanster.hoger > 0 && vanster.w > 0);
  const back = bandMal(-BACKGAS, 18, tro);
  krav('back svänger också höger', back.w < 0 && back.hoger < back.vanster);
  const jam = skapaJamning();
  const ax = STANDARD.axlar.torn;
  const tyst = behandlaAxel(1 * Math.PI / 180, ax, 0.05, jam, 'torn');
  krav('dödzon är tyst', tyst.u === 0);
  jam.torn = 0;
  const halv = behandlaAxel((ax.dodzon + ax.full * 0.5) * Math.PI / 180, ax, 0, jam, 'torn');
  krav('halv vinkel är ungefär halv fart', Math.abs(halv.u - 0.5) < 0.08);
  jam.torn = 0;
  const full = behandlaAxel((ax.dodzon + ax.full + 10) * Math.PI / 180, ax, 0, jam, 'torn');
  krav('förbi full effekt är taket', full.u === 1);
  const inv = behandlaAxel(0.8, {...ax, invertera: true, dodzon: 0, kanslighet: 1, utjamning: 0}, 0, skapaJamning(), 'styra');
  krav('invertera byter tecken', inv.rad < 0);
  let torn = 0;
  for (let i = 0; i < 150; i++) torn = stegaTorn(torn, 1, 0.1);
  krav('ett varv tar 15 sekunder', Math.abs(torn - Math.PI * 2) < 0.05);
  let eld = 0;
  for (let i = 0; i < 80; i++) eld = stegaEldror(eld, 1, 0.05);
  krav('eldröret stannar vid +25°', Math.abs(eld - ELD_MAX) < 1e-6);
  eld = 0;
  for (let i = 0; i < 80; i++) eld = stegaEldror(eld, -1, 0.05);
  krav('eldröret stannar vid -10°', Math.abs(eld - ELD_MIN) < 1e-6);
  const v = skapaVagn();
  const mal = bandMal(1, 0, tro);
  for (let i = 0; i < 50; i++) stegaVagn(v, mal, 0.05);
  krav('rakt går framåt', v.z < -1 && Math.abs(v.x) < 0.2 && v.fart > 1);
  const h = skapaVagn();
  h.vL = pivot.vanster;
  h.vR = pivot.hoger;
  stegaVagn(h, pivot, 0.2);
  krav('högersväng bär åt höger', h.x > 0 && h.yaw < 0);
  krav('känslighet kläms', normalAxel({kanslighet: 9}, STANDARD.axlar.styra).kanslighet === 3);
  return fel;
}
