import { monteraGyrobox } from '../shared/gyrobox.js';

const GRAD = 180 / Math.PI;

// Standarderna sitter i sidans JSON-block, fältet sikte.
export function monteraRorelseTest({ sikte, flik, orient }) {
  const sens = sikte.sensYaw ?? 1;
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
      if (flik?.() === 'sikte') return Math.abs(box.varde('tipp')) > Math.abs(box.varde('vrid')) ? 'tipp' : 'vrid';
      return Math.abs(box.varde('tipp')) > Math.abs(box.varde('vrid')) ? 'tipp' : 'vrid';
    },
    funktion() { return flik?.() === 'live' ? 'Mät' : 'Sikte'; },
    kalibrera() { orient?.noll?.(); }
  });
  return {
    box,
    forma(ut, dt) {
      const o = orient?.nu?.() || {};
      const yawDeg = Number.isFinite(o.gammaDeg) ? o.gammaDeg : 0;
      const pitchDeg = Number.isFinite(o.betaDeg) ? o.betaDeg - 90 : 0;
      return {
        ...ut,
        yaw: box.koppla('vrid', ut.yaw, yawDeg, dt),
        pitch: box.koppla('tipp', ut.pitch, pitchDeg, dt)
      };
    }
  };
}
