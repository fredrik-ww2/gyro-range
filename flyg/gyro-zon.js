// Två zoner på telefonens sidlutning. Zon 1 håller en bank. Zon 2 ger fullt skevroder
// så planet rollar runt med sin egen tröghet. Spelaren behöver inte vrida telefonen ett varv.
// Alla trösklar kommer från config.gyro_zon.

const DEG = Math.PI / 180;

export function nyZon() {
  return { lage: 1, rollFore: 0, harFore: false, rollRate: 0, tecken: 1 };
}

export function nollZon(s) {
  s.lage = 1;
  s.rollFore = 0;
  s.harFore = false;
  s.rollRate = 0;
  return s;
}

function vink(r) {
  let x = r;
  while (x > Math.PI) x -= 2 * Math.PI;
  while (x < -Math.PI) x += 2 * Math.PI;
  return x;
}

function tal(v, f) {
  return Number.isFinite(v) ? v : f;
}

// pose.roll är sidlutning i radianer, samma tecken som bank (positiv = vänster).
// pose.rollRate är rad/s från rotationRate om den finns. Saknas den används ändringen i lutning.
export function uppdateraZon(state, pose, dt, Z, opts) {
  const sens = Math.max(0.2, tal(opts && opts.kanslighet, 1));
  const roll = tal(pose && pose.roll, 0);
  const dtS = Math.max(0, tal(dt, 0));
  const matad = Number.isFinite(pose && pose.rollRate) ? pose.rollRate : null;
  let der = 0;
  if (state.harFore && dtS > 1e-4) der = vink(roll - state.rollFore) / dtS;
  state.rollFore = roll;
  state.harFore = true;
  const raw = matad == null ? der : (Math.abs(matad) > Math.abs(der) ? matad : der);
  const tau = tal(Z.rate_utjamning_s, 0.06);
  const a = dtS <= 0 ? 0 : (tau <= 0 ? 1 : 1 - Math.exp(-dtS / tau));
  state.rollRate += (raw - state.rollRate) * a;

  const enter = tal(opts && opts.troskel, Z.roll_troskel_grader) * DEG;
  const hyst = tal(Z.hysteres_grader, 10) * DEG;
  const dod = tal(Z.kurva_dodzon_grader, 5) * DEG;
  const slapp = Math.max(dod + 2 * DEG, Math.min(enter - 2 * DEG, enter - hyst));
  const snabb = tal(Z.snabb_vrid_rad_s, 3);
  const snabbSlapp = tal(Z.snabb_slapp_rad_s, 0.8);
  const minTecken = tal(Z.min_tecken_rad, 0.05);
  const abs = Math.abs(roll);
  const absRate = Math.abs(state.rollRate);
  const teckenRoll = abs >= minTecken ? Math.sign(roll) : 0;
  // Ett snabbt vrid räknas bara utåt, bort från mitten. Att räta upp telefonen
  // får inte starta en roll.
  const utat = teckenRoll !== 0 && Math.sign(state.rollRate) === teckenRoll;
  const motMitten = teckenRoll !== 0 && Math.sign(state.rollRate) === -teckenRoll;

  if (state.lage !== 2) {
    if (abs >= enter || (absRate >= snabb && utat)) {
      state.lage = 2;
      state.tecken = teckenRoll || Math.sign(state.rollRate) || state.tecken || 1;
    }
  } else if (abs < slapp && (absRate < snabbSlapp || motMitten)) {
    state.lage = 1;
  } else if (teckenRoll) {
    state.tecken = teckenRoll;
  }

  const fullBas = tal(Z.kurva_full_grader, 32) * DEG / sens;
  const full = Math.min(Math.max(dod + 4 * DEG, fullBas), Math.max(dod + 4 * DEG, slapp - 2 * DEG));
  const maxBank = tal(Z.kurva_max_bank_grader, 60) * DEG;
  const expo = tal(Z.expo, 1.15);
  let bankMal = 0;
  if (abs > dod) {
    const x = Math.min(1, (abs - dod) / Math.max(1e-4, full - dod));
    bankMal = Math.sign(roll) * Math.pow(x, expo) * maxBank;
  }
  const roderHjalp = state.lage === 1 ? Math.sin(bankMal) * tal(Z.samordning, 0.4) : 0;
  return { lage: state.lage, bankMal, tecken: state.tecken || 1, roderHjalp, enter, slapp, rollRate: state.rollRate };
}

// pitch i pose är redan spakutslag i radianer (samma som FlightInput.read().pitch).
export function styrKommando(state, pose, dt, Z, aero, opts) {
  const z = uppdateraZon(state, pose, dt, Z, opts);
  const pitch = tal(pose && pose.pitch, 0);
  if (z.lage === 2) {
    const da = z.tecken >= 0 ? 1 : -1;
    const maxRoll = (aero && aero.spak_max_roll) || 1;
    return {
      lage: 2,
      bankMal: z.bankMal,
      roderHjalp: 0,
      input: { pitch, roll: da * maxRoll, fullSkev: true, da }
    };
  }
  const niva = !opts || opts.nivellering !== false;
  const hall = niva || Math.abs(z.bankMal) > 1e-4;
  return {
    lage: 1,
    bankMal: z.bankMal,
    roderHjalp: niva ? z.roderHjalp : 0,
    input: {
      pitch,
      roll: 0,
      hall,
      bankMal: z.bankMal,
      bankKp: Z.bank_kp,
      bankKd: Z.bank_kd,
      daMax: Z.da_max
    }
  };
}
