import { monteraGyrobox } from '../shared/gyrobox.js';

const GRAD = 180 / Math.PI;

// flyg/config.json: styrning + gyro_zon.
export function monteraFlyg({ styrning, zon, kalibrera }) {
  const sens = styrning.kanslighet ?? 1;
  const box = monteraGyrobox({
    spel: 'flyg',
    axlar: [
      { id: 'tipp', funktion: 'Styr', axel: 'lutning fram/bak' },
      { id: 'roll', funktion: 'Styr', axel: 'roll' },
      { id: 'sidroder', funktion: 'Sidroder', axel: 'vridning' }
    ],
    standard: {
      tipp: {
        invertera: !!styrning.inverteraX, lage: 'noll', kanslighet: sens, kurva: 1,
        dodzon: (styrning.neutral_rad || 0) * GRAD, utjamning: styrning.utjamning_s || 0,
        spann: (styrning.max_pitch || 0.55) * GRAD, gain: 1
      },
      roll: {
        invertera: !!styrning.inverteraZ, lage: 'noll', kanslighet: sens, kurva: zon.expo ?? 1.15,
        dodzon: zon.kurva_dodzon_grader ?? 5, utjamning: zon.rate_utjamning_s ?? 0.06,
        spann: zon.kurva_full_grader ?? 32, gain: Math.PI / 180
      },
      sidroder: {
        invertera: !!styrning.inverteraY, lage: 'noll', kanslighet: sens, kurva: 1,
        dodzon: (styrning.neutral_rad || 0) * GRAD, utjamning: 0,
        spann: (styrning.roder_vinkel_rad || 0.35) * GRAD, gain: 1
      }
    },
    aktiv() {
      const t = Math.abs(box.varde('tipp'));
      const r = Math.abs(box.varde('roll'));
      const s = Math.abs(box.varde('sidroder'));
      if (r >= t && r >= s) return 'roll';
      if (s >= t) return 'sidroder';
      return 'tipp';
    },
    kalibrera,
    tillampa(nu) { zon.rate_utjamning_s = nu.roll.utjamning; }
  });
  return {
    box,
    forma(last, dt) {
      if (!last?.pose) return;
      const p = last.pose;
      const opt = { jamna: false };
      last.pitch = box.koppla('tipp', last.pitch, p.pitch * GRAD, dt, opt);
      last.roder = box.koppla('sidroder', last.roder || 0, p.yaw * GRAD, dt, opt);
      p.roll = box.koppla('roll', p.roll, p.roll * GRAD, dt, opt);
    }
  };
}
