// Landningsutmaning: klaffsteg, sidglidning och betyg vid sättning.
// Avstängd utmaning (eller avstängd studs) lämnar sättningen som den var.
// Talen ligger i flyg/config.json under landningsutmaning.

export const KLAFF_STEG = [
  { varde: 0, namn: 'Inne', kort: 'Inne' },
  { varde: 0.45, namn: 'Start', kort: 'Start' },
  { varde: 1, namn: 'Landning', kort: 'Land' }
];

const GRUND = {
  mjuk_vs_ms: -2.4,
  haveri_vs_ms: -7,
  mjuk_fart_ms: 50,
  haveri_fart_ms: 62,
  mjuk_bank_rad: 0.12,
  haveri_bank_rad: 0.3,
  mjuk_beta_rad: 0.06,
  haveri_beta_rad: 0.2,
  kula_full_rad: 0.15,
  sitt_m: 1.35,
  studs_las_s: 0.35,
  studs_ater_andel: 0.42,
  studs_lyft_m: 1.15,
  studs_fart_andel: 0.93,
  studs_nos_rad: 0.06,
  studs_max: 3
};

export function nyStuds() {
  return { antal: 0, las: 0 };
}

export function klaffIndex(v) {
  const x = +v || 0;
  if (x > 0.7) return 2;
  if (x > 0.2) return 1;
  return 0;
}

export function nastaKlaff(v) {
  return KLAFF_STEG[(klaffIndex(v) + 1) % KLAFF_STEG.length];
}

// Positiv kula = kulan till höger. Då behövs höger sidroder.
export function kulaLage(beta, fullRad) {
  const n = fullRad > 0 ? fullRad : GRUND.kula_full_rad;
  const x = (beta || 0) / n;
  return Math.max(-1, Math.min(1, x));
}

function granser(G) {
  return { ...GRUND, ...(G || {}) };
}

// Högsta lyft vid stallgränsen. Klaffeffekt höjer taket så stallfarten sjunker.
export function stallLyft(A, flaps, effekt, tal) {
  const f = Math.max(0, Math.min(1, +flaps || 0));
  const raw = A.cl_alfa_per_rad * (A.alfa_kritisk_rad - A.alfa_noll_rad) + f * (A.klaff_cl || 0);
  const extra = effekt && tal ? f * (tal.cl_max_extra || 0) : 0;
  return Math.min(raw, A.cl_max + extra);
}

export function stallFart(A, flaps, effekt, tal, rho = 1.225) {
  const cl = Math.max(0.2, stallLyft(A, flaps, effekt, tal));
  return Math.sqrt((2 * A.massa_kg * A.g_ms2) / (rho * A.vingyta_m2 * cl));
}

// Sidglidning tar lyft. Av = samma tal tillbaka.
export function lyftSkala(cl, beta, S) {
  if (!S || !S.koordinerad || !S.glidTal) return cl;
  const b2 = (beta || 0) * (beta || 0);
  return cl * Math.max(0.5, 1 - (S.glidTal.lyft_beta || 0) * b2);
}

export function motstandExtra(cd, flaps, beta, S) {
  if (!S || (!S.klaffEffekt && !S.koordinerad)) return cd;
  let ut = cd;
  if (S.klaffEffekt && S.klaffTal) ut += (flaps || 0) * (S.klaffTal.cd_extra || 0);
  if (S.koordinerad && S.glidTal) ut += (S.glidTal.cd_beta || 0) * (beta || 0) * (beta || 0);
  return ut;
}

// Klaff ger nos ned. Skevning utan sidroder ger negativ girning, starkare i låg fart.
export function roderMoment(Cm, Cn, p) {
  const S = p.S || {};
  if (!S.klaffEffekt && !S.koordinerad) return { Cm, Cn };
  if (S.klaffEffekt && S.klaffTal) Cm += (p.flaps || 0) * (S.klaffTal.cm_nos || 0);
  if (S.koordinerad && S.glidTal) {
    const G = S.glidTal;
    const Vref = Math.max(1, p.Vref || 1);
    const lag = Math.min(G.lag_tak ?? 2.2, (G.lagfart_ms || 55) / Vref);
    Cn -= (G.cn_skev_extra || 0) * lag * (p.da || 0);
  }
  return { Cm, Cn };
}

// Extra sjunk när planet glider på låg höjd och låg fart. 0 när funktionen är av.
export function sjunkKraft(y, markY, V, beta, massa, S) {
  if (!S || !S.koordinerad || !S.glidTal) return 0;
  const G = S.glidTal;
  const hojd = (y || 0) - (Number.isFinite(markY) ? markY : 0);
  const grans = G.sjunk_beta_rad || 0.08;
  const avvik = Math.abs(beta || 0);
  if (!(hojd < (G.sjunk_hojd_m || 90) && (V || 0) < (G.sjunk_fart_ms || 72) && avvik > grans)) return 0;
  const over = Math.min(1, (avvik - grans) / (G.sjunk_spann_rad || 0.18));
  return -(massa || 0) * (G.sjunk_ms2 || 0) * over;
}

function skyddEllerHaveri(val, orsak) {
  if (val.markskydd || !val.krasch) return { typ: 'skydd', betyg: '', status: '', ljud: '', orsak: '' };
  return {
    typ: 'haveri',
    betyg: 'Haveri',
    status: 'Haveri',
    ljud: 'haveri',
    orsak: orsak || ''
  };
}

function gammalInomFonster(matt, val) {
  const L = val.L;
  const ok = matt.fart < L.max_fart_ms && Math.abs(matt.bank || 0) < L.max_bank_rad && matt.vs > L.hard_vs_ms;
  if (!ok) {
    if (matt.agl < val.kontakt_m) return skyddEllerHaveri(val);
    return { typ: 'luft' };
  }
  if (matt.vs > L.mjuk_vs_ms) {
    const betyg = matt.vs > -1.2 ? 'Mjuk landning' : 'Landade';
    return { typ: 'satter', betyg, status: betyg, ljud: 'sattning', gammal: true };
  }
  return {
    typ: 'studs',
    betyg: 'Hård landning – studs',
    status: 'Hård landning! Håll nosen uppe och sätt ner mjukare.',
    ljud: 'studs',
    ater: 0.35,
    lyft: 0.85,
    gammal: true
  };
}

function grad(matt, G) {
  const bank = Math.abs(matt.bank || 0);
  const beta = Math.abs(matt.beta || 0);
  if (matt.vs < G.haveri_vs_ms || matt.fart > G.haveri_fart_ms || bank > G.haveri_bank_rad || beta > G.haveri_beta_rad) return 'haveri';
  if (matt.vs >= G.mjuk_vs_ms && matt.fart <= G.mjuk_fart_ms && bank <= G.mjuk_bank_rad && beta <= G.mjuk_beta_rad) return 'mjuk';
  return 'studs';
}

// matt: agl, vs, fart, bank, beta, gear. val: utmaning, studs, markskydd, krasch, L, kontakt_m, G, studsAntal.
export function sattning(matt, val) {
  const agl = matt.agl;
  if (!(matt.gear > 0.85 && agl < 1.8)) {
    if (agl < val.kontakt_m) return skyddEllerHaveri(val);
    return { typ: 'luft' };
  }
  if (!(val.utmaning && val.studs)) return gammalInomFonster(matt, val);
  const G = granser(val.G);
  let dom = grad(matt, G);
  if ((val.studsAntal || 0) >= (G.studs_max || 3) && dom !== 'mjuk') dom = 'haveri';
  if (dom === 'mjuk') {
    return { typ: 'satter', betyg: 'Mjuk landning', status: 'Mjuk landning', ljud: 'sattning', gammal: false };
  }
  if (dom === 'studs') {
    return {
      typ: 'studs',
      betyg: 'Hård landning',
      status: 'Hård landning. Håll nosen uppe och sätt ner mjukare.',
      ljud: 'studs',
      ater: G.studs_ater_andel,
      lyft: G.studs_lyft_m,
      gammal: false
    };
  }
  return skyddEllerHaveri(val, 'Sättningen var för hård. Sjunk, fart, lutning eller sidglidning gick över gränsen.');
}

// plan: y, vy, vs, V, markY. studs-tillståndet räknas upp bara för den nya studsen.
export function verkstall(plan, beslut, studs, tal) {
  const T = granser(tal);
  const ut = {
    y: plan.y,
    vy: plan.vy,
    vs: plan.vs,
    V: plan.V,
    paMarken: !!plan.paMarken,
    crashed: !!plan.crashed,
    typ: beslut.typ,
    betyg: beslut.betyg || '',
    ljud: beslut.ljud || '',
    gammal: !!beslut.gammal,
    nos: 0
  };
  if (beslut.typ === 'satter') {
    ut.y = plan.markY + (T.sitt_m ?? 1.35);
    ut.vy = 0;
    ut.vs = 0;
    ut.paMarken = true;
    ut.crashed = false;
    return ut;
  }
  if (beslut.typ === 'studs') {
    const ater = beslut.ater ?? (beslut.gammal ? 0.35 : T.studs_ater_andel);
    ut.vy = -plan.vs * ater;
    ut.vs = ut.vy;
    ut.y = beslut.gammal ? plan.markY + 2.2 : plan.markY + (T.sitt_m ?? 1.35) + (beslut.lyft ?? T.studs_lyft_m);
    ut.paMarken = false;
    ut.crashed = false;
    ut.nos = beslut.gammal ? 0 : (T.studs_nos_rad || 0);
    if (!beslut.gammal && studs) {
      studs.antal = (studs.antal || 0) + 1;
      studs.las = T.studs_las_s ?? 0.35;
    }
    return ut;
  }
  if (beslut.typ === 'skydd') {
    const golv = plan.markY + (tal && tal.kontakt_m != null ? tal.kontakt_m : 1.2);
    ut.y = Math.max(plan.y, golv);
    ut.vy = Math.max(0, plan.vy || 0);
    ut.vs = Math.max(0, plan.vs || 0);
    ut.paMarken = false;
    ut.crashed = false;
    return ut;
  }
  if (beslut.typ === 'haveri') {
    ut.crashed = true;
    ut.paMarken = false;
    return ut;
  }
  return ut;
}
