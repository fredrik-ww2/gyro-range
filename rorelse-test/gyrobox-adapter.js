import { monteraGyrobox } from '../shared/gyrobox.js';
import { lyssnaSkarm, skarmGrader } from '../shared/sensor.js';
import { arOmslag, nyNollRiktning, tolkaOrientering } from '../js/riktning.js';

const GRAD = 180 / Math.PI;

// Standarderna sitter i sidans JSON-block, fältet sikte.
// Råvinkeln till lådan är telefonens lutning mot senast noll, i skärmens axlar.
// Standardläget är fortsätt-vrida, så siktet integrerar tills någon byter.
export function monteraRorelseTest({ sikte, flik, orient }) {
  const sens = sikte.sensYaw ?? 1;
  let noll = null;
  let fore = null;
  const box = monteraGyrobox({
    spel: 'rorelse-test',
    axlar: [
      { id: 'vrid', funktion: 'Sikte', axel: 'sidvridning' },
      { id: 'tipp', funktion: 'Sikte', axel: 'lutning fram/bak' }
    ],
    standard: {
      vrid: {
        invertera: false, lage: 'vrid', kanslighet: sens, kurva: 1, dodzon: sikte.tightenDegS ?? 0,
        utjamning: 0, spann: 80, gain: Math.PI / 180
      },
      tipp: {
        invertera: !!sikte.invertPitch, lage: 'vrid', kanslighet: sikte.sensPitch ?? sens, kurva: 1,
        dodzon: sikte.tightenDegS ?? 0, utjamning: 0, spann: sikte.maxPitchDeg ?? 85, gain: Math.PI / 180
      }
    },
    aktiv() {
      return Math.abs(box.varde('tipp')) > Math.abs(box.varde('vrid')) ? 'tipp' : 'vrid';
    },
    funktion() { return flik?.() === 'live' ? 'Mät' : 'Sikte'; },
    kalibrera() {
      noll = null;
      fore = null;
      orient?.noll?.();
    }
  });
  if (typeof lyssnaSkarm === 'function') {
    lyssnaSkarm(() => {
      noll = null;
      fore = null;
      orient?.noll?.();
    });
  }
  function lutning() {
    const o = orient?.nu?.() || {};
    if (![o.alphaDeg, o.betaDeg, o.gammaDeg].every(Number.isFinite)) return { yaw: 0, pitch: 0 };
    const nu = { alpha: o.alphaDeg, beta: o.betaDeg, gamma: o.gammaDeg };
    const skarm = skarmGrader(globalThis);
    if (!noll) noll = { ...nu };
    else if (fore && arOmslag(fore, nu)) noll = nyNollRiktning(nu, {
      pitch: (box.varde('tipp') || 0) * Math.PI / 180,
      yaw: (box.varde('vrid') || 0) * Math.PI / 180,
      roll: 0
    }, skarm);
    fore = nu;
    const v = tolkaOrientering(nu.alpha, nu.beta, nu.gamma, noll, skarm);
    return { yaw: v.yaw * GRAD, pitch: v.pitch * GRAD };
  }
  return {
    box,
    forma(ut, dt) {
      const raw = lutning();
      return {
        ...ut,
        yaw: box.koppla('vrid', ut.yaw, raw.yaw, dt),
        pitch: box.koppla('tipp', ut.pitch, raw.pitch, dt)
      };
    }
  };
}
