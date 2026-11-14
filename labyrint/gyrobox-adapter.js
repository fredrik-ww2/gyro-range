import { monteraGyrobox } from '../shared/gyrobox.js';

// labyrint/konfig.json → gyro.
export function monteraLabyrint({ gyro, gyroKonfig }) {
  const g = gyroKonfig;
  const bas = (invert) => ({
    invertera: !!invert,
    lage: 'noll',
    kanslighet: g.kanslighet ?? 1,
    kurva: g.expo ?? 1.7,
    dodzon: g.dodzon ?? 0,
    utjamning: g.utjamningSek ?? 0.08,
    spann: g.maxGrader ?? 11,
    gain: 1
  });
  const box = monteraGyrobox({
    spel: 'labyrint',
    axlar: [
      { id: 'fram', funktion: 'Styr', axel: 'lutning fram/bak' },
      { id: 'sida', funktion: 'Styr', axel: 'roll' }
    ],
    standard: {
      fram: bas(g.invertFram),
      sida: bas(g.invertSida)
    },
    aktiv() {
      return Math.abs(box.varde('sida')) > Math.abs(box.varde('fram')) ? 'sida' : 'fram';
    },
    las(id) { return box.varde(id) || 0; },
    kalibrera() { gyro.plattaUt(); },
    tillampa(nu) {
      gyroKonfig.utjamningSek = nu.fram.utjamning;
      gyroKonfig.utjamningFram = nu.fram.utjamning;
      gyroKonfig.utjamningSida = nu.sida.utjamning;
    }
  });
  return {
    box,
    forma(fram, sida, rawFram, rawSida, dt) {
      const opt = { jamna: false };
      return {
        fram: box.koppla('fram', fram, rawFram, dt, opt),
        sida: box.koppla('sida', sida, rawSida, dt, opt)
      };
    }
  };
}
