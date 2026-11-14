import { monteraGyrobox } from '../shared/gyrobox.js';

const GRAD = 180 / Math.PI;

// Standardvärdena ligger i styr.js (STANDARD.axlar), inte i en egen json.
export function monteraVagn({ axlar, nollstall }) {
  const bas = (a) => ({
    invertera: !!a.invertera,
    lage: 'noll',
    kanslighet: a.kanslighet,
    kurva: 1,
    dodzon: a.dodzon,
    utjamning: a.utjamning,
    spann: a.full,
    gain: Math.PI / 180
  });
  const box = monteraGyrobox({
    spel: 'vagn-test',
    suffixUtjamning: '',
    axlar: [
      { id: 'styra', funktion: 'Styr', axel: 'roll' },
      { id: 'torn', funktion: 'Torn', axel: 'vridning' },
      { id: 'eldror', funktion: 'Eldrör', axel: 'lutning fram/bak' }
    ],
    standard: {
      styra: bas(axlar.styra),
      torn: bas(axlar.torn),
      eldror: bas(axlar.eldror)
    },
    aktiv() {
      const kandidat = [['styra', box.varde('styra')], ['torn', box.varde('torn')], ['eldror', box.varde('eldror')]];
      return kandidat.reduce((a, b) => Math.abs(b[1]) > Math.abs(a[1]) ? b : a)[0];
    },
    las(id) { return (box.varde(id) || 0) * GRAD; },
    kalibrera() { nollstall?.(); },
    tillampa(nu) {
      for (const id of ['styra', 'torn', 'eldror']) axlar[id].utjamning = nu[id].utjamning;
    }
  });
  return {
    box,
    forma(rav, dt) {
      const opt = { jamna: false };
      return {
        roll: box.koppla('styra', rav.roll, rav.roll * GRAD, dt, opt),
        yaw: box.koppla('torn', rav.yaw, rav.yaw * GRAD, dt, opt),
        pitch: box.koppla('eldror', rav.pitch, rav.pitch * GRAD, dt, opt)
      };
    }
  };
}
