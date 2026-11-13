// Alla tal och strömbrytare för bowlingtestet. Inget tröskelvärde ligger i övrig kod.
// Läst: RUTIN_TESTBRADE_v1_3.md, RUTIN_PRESTANDA_MOBIL_v1_1.md.

export const KONFIG = {
  bana: {
    langd: 18.288,
    bredd: 1.067,
    ranna_bredd: 0.241,
    ranna_djup: 0.09,
    ansats: 4.57,
    dack: 1.05
  },
  klot: {
    radie: 0.1085,
    massa: 6.4,
    start_z: 0.22
  },
  kagla: {
    hojd: 0.381,
    radie: 0.0605,
    massa: 1.53,
    avstand: 0.3048,
    fall_fart: 0.9,
    restitution: 0.4,
    pin_restitution: 0.45
  },
  arm: { langd: 0.65 },
  kanslighet: 1,
  gravitation: 9.81,
  // |θ| inom så här många grader från full bakåtsving, och telefonen ligger platt.
  bak: { grader: 30, platthet: 0.5, hall_ms: 100 },
  sving: {
    omega: 100,
    acc: 4.5,
    platthet: 0.35,
    titt: 0.75,
    slapp_vinkel: 110,
    broms_andel: 0.85,
    broms_vinkel: 90,
    min_ms: 120,
    timeout_ms: 1200,
    lucka_ms: 450
  },
  lyft: {
    omega: 25,
    stilla_ms: 250,
    titt_delta: 0.08,
    plat_delta: 0.06,
    minne_ms: 1000
  },
  efter: { ms: 1500 },
  fart: {
    min: 4,
    max: 11,
    vikter: { omega: 0.5, acc: 0.25, centripetal: 0.25 },
    acc_golv: 0.5
  },
  krok: {
    omedelbar_grader: 1.2,
    start_andel: 0.55,
    max_ingang_grader: 8
  },
  brytare: {
    ljud: true,
    debug: false,
    framat_ar_toppen: true,
    invertera_fram: false,
    invertera_hook: false,
    krok: true,
    ranna: true,
    poang: true
  },
  bild: {
    antialias: true,
    max_pixelkvot: 1.5,
    fov: 42,
    exponering: 1.08,
    ogon_hojd: 1.28,
    ogon_z: 3.15,
    sikte_y: 0.28,
    sikte_z: -6.5
  },
  fysik: {
    friktion: 0.28,
    styrning: 9,
    dt_max: 0.033,
    omstallning_ms: 2400,
    pass_antal: 4,
    efter_spel_s: 1.1
  },
  ljud: { tak_db: -1, roster: 12 }
};
