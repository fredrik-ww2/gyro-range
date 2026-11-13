// Tillstånd: NEED_PERMISSION → LOOKING → CALIBRATED_BACKSWING →
// ARMED_IN_BACKSWING → SWINGING_FORWARD → RELEASED_WATCHING → LOOKING.
// Efter släpp låses fart, riktning och skruv. Ett lyft till titt kastar inte.

const NEED = 'NEED_PERMISSION';
const LOOK = 'LOOKING';
const KAL = 'CALIBRATED_BACKSWING';
const ARM = 'ARMED_IN_BACKSWING';
const SVING = 'SWINGING_FORWARD';
const SLA = 'RELEASED_WATCHING';

export function skapaMaskin(konfig) {
  let tillstand = NEED;
  let bakTid = 0;
  let stillaSedan = null;
  const historik = [];
  let svingStart = 0;
  let senasteProv = 0;
  let fickProv = false;
  let omegaTopp = 0;
  let accInt = 0;
  let centTopp = 0;
  let senTid = null;
  let slappTid = 0;
  let kast = null;
  let klotFramme = false;
  const buffert = [];

  function beviljad() {
    if (tillstand === NEED) tillstand = LOOK;
  }

  function nollstalld(tid) {
    bakTid = 0;
    stillaSedan = null;
    historik.length = 0;
    buffert.length = 0;
    omegaTopp = 0;
    accInt = 0;
    centTopp = 0;
    if (tillstand !== SLA) {
      tillstand = KAL;
      kast = null;
    } else {
      tillstand = KAL;
    }
    senTid = Number.isFinite(tid) ? tid : senTid;
  }

  function kans() {
    const k = Number(konfig.kanslighet);
    return Number.isFinite(k) && k > 0.2 ? k : 1;
  }

  function iBak(f) {
    return Math.abs(f.theta) <= konfig.bak.grader && f.plat >= konfig.bak.platthet;
  }

  function lyftKlar(nu, f) {
    historik.push({ t: nu, titt: f.titt, plat: f.plat });
    const grans = nu - konfig.lyft.minne_ms;
    while (historik.length && historik[0].t < grans) historik.shift();
    const still = Math.abs(f.omega) < konfig.lyft.omega && !iBak(f);
    if (!still) { stillaSedan = null; return false; }
    if (stillaSedan == null) stillaSedan = nu;
    if (nu - stillaSedan < konfig.lyft.stilla_ms) return false;
    const ref = historik[0];
    if (!ref) return false;
    const stig = f.titt > ref.titt + konfig.lyft.titt_delta;
    const sjunk = f.plat < ref.plat - konfig.lyft.plat_delta;
    return stig && sjunk;
  }

  function lasKast(f) {
    const arm = Math.max(0.2, Number(konfig.arm.langd) || 0.65);
    const vOmega = Math.abs(omegaTopp) * Math.PI / 180 * arm;
    const vAcc = Math.abs(accInt);
    const vCent = centTopp > 0 ? Math.sqrt(centTopp * arm) : 0;
    const vikter = konfig.fart.vikter;
    const delar = [
      [vOmega, vikter.omega],
      [vAcc, vikter.acc],
      [vCent, vikter.centripetal]
    ];
    let sum = 0;
    let vikt = 0;
    for (const [v, w] of delar) {
      if (v >= konfig.fart.acc_golv && w > 0) { sum += v * w; vikt += w; }
    }
    let fart = vikt > 0 ? sum / vikt : vOmega;
    fart = Math.min(konfig.fart.max, Math.max(konfig.fart.min, fart));
    const roll = f.roll;
    const begr = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, roll));
    // sin(roll/90° · π/2) = sin(roll i radianer) när |roll| ≤ 90°.
    let hook = Math.sin(begr);
    if (!konfig.brytare.krok) hook = 0;
    if (konfig.brytare.invertera_hook) hook = -hook;
    kast = {
      fart,
      aimYaw: f.aimYaw,
      hook,
      roll,
      theta: f.theta,
      omegaTopp,
      tid: slappTid
    };
  }

  // nuMs är klockan. f är senaste sensorläget. nyttProv är sant när just detta anrop bär ett prov.
  function steg(nuMs, f, nyttProv, framme) {
    let handelse = null;
    const dt = senTid == null ? 0 : Math.max(0, nuMs - senTid);
    senTid = nuMs;
    if (nyttProv) {
      senasteProv = nuMs;
      fickProv = true;
    }
    klotFramme = !!framme;

    if (tillstand === KAL || tillstand === ARM) {
      if (tillstand === KAL && iBak(f)) {
        bakTid += dt;
        if (bakTid >= konfig.bak.hall_ms) {
          tillstand = ARM;
          handelse = 'bevapnad';
          stillaSedan = null;
        }
      } else if (!iBak(f)) bakTid = 0;

      if ((tillstand === KAL || tillstand === ARM) && lyftKlar(nuMs, f)) {
        tillstand = LOOK;
        bakTid = 0;
        stillaSedan = null;
        handelse = 'lyft';
        return { tillstand, handelse, kast };
      }

      const k = kans();
      const signal = f.omega >= konfig.sving.omega / k || (f.accFram >= konfig.sving.acc / k);
      if (tillstand === ARM && signal && f.plat >= konfig.sving.platthet && f.titt < konfig.sving.titt) {
        tillstand = SVING;
        svingStart = nuMs;
        omegaTopp = Math.max(0, f.omega);
        accInt = 0;
        centTopp = 0;
        buffert.length = 0;
        handelse = 'sving';
      }
    }

    if (tillstand === SVING) {
      if (nyttProv) {
        const provDt = buffert.length ? Math.max(0, nuMs - buffert[buffert.length - 1].t) / 1000 : 0;
        omegaTopp = Math.max(omegaTopp, f.omega);
        accInt += f.accFram * provDt;
        centTopp = Math.max(centTopp, f.accCent || 0);
        buffert.push({
          t: nuMs,
          q: f.q.slice(),
          roll: f.roll,
          omega: f.omega,
          accFram: f.accFram
        });
        if (buffert.length > 240) buffert.shift();
      }
      const tid = nuMs - svingStart;
      const lucka = fickProv && nuMs - senasteProv > konfig.sving.lucka_ms;
      const minTid = tid >= konfig.sving.min_ms;
      const timeout = tid >= konfig.sving.timeout_ms;
      const vinkel = f.theta >= konfig.sving.slapp_vinkel;
      const broms = omegaTopp >= konfig.sving.omega / kans()
        && f.omega <= omegaTopp * konfig.sving.broms_andel
        && f.theta >= konfig.sving.broms_vinkel;
      if (timeout || (minTid && (vinkel || broms || lucka))) {
        slappTid = nuMs;
        lasKast(f);
        tillstand = SLA;
        handelse = 'slapp';
      } else if (lucka && !minTid) {
        tillstand = ARM;
        handelse = 'avbruten';
      }
    }

    if (tillstand === SLA) {
      if (nuMs - slappTid >= konfig.efter.ms || klotFramme) {
        tillstand = LOOK;
        handelse = handelse || 'klar';
      }
    }

    return { tillstand, handelse, kast };
  }

  return {
    beviljad,
    nollstalld,
    steg,
    get tillstand() { return tillstand; },
    get kast() { return kast; },
    get buffert() { return buffert; },
    set framme(v) { klotFramme = !!v; }
  };
}
