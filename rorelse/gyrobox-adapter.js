import { monteraGyrobox } from '../shared/gyrobox.js';

// rorelse/config.json → axlar.rot. Inspelningen är grader per sekund.
export function monteraRorelse({ config, nollstall }) {
  const namn = (config.axlar?.rot || []).map(a => a.namn);
  const box = monteraGyrobox({
    spel: 'rorelse',
    axlar: [
      { id: 'vrid', funktion: 'Mät', axel: (namn[0] || 'vridning').toLowerCase(), enhet: '°/s' },
      { id: 'tipp', funktion: 'Mät', axel: (namn[1] || 'tippa').toLowerCase(), enhet: '°/s' },
      { id: 'luta', funktion: 'Mät', axel: (namn[2] || 'luta').toLowerCase(), enhet: '°/s' }
    ],
    standard: {
      vrid: { invertera: false, lage: 'noll', kanslighet: 1, kurva: 1, dodzon: 0, utjamning: 0, spann: config.skalaMinst?.rot || 40, gain: 1 },
      tipp: { invertera: false, lage: 'noll', kanslighet: 1, kurva: 1, dodzon: 0, utjamning: 0, spann: config.skalaMinst?.rot || 40, gain: 1 },
      luta: { invertera: false, lage: 'noll', kanslighet: 1, kurva: 1, dodzon: 0, utjamning: 0, spann: config.skalaMinst?.rot || 40, gain: 1 }
    },
    aktiv() {
      const ids = ['vrid', 'tipp', 'luta'];
      return ids.sort((a, b) => Math.abs(box.varde(b)) - Math.abs(box.varde(a)))[0];
    },
    kalibrera() { nollstall?.(); }
  });
  const id = ['vrid', 'tipp', 'luta'];
  return {
    box,
    forma(rot, dt) {
      if (!rot) return rot;
      return rot.map((v, i) => box.koppla(id[i], v, v, dt));
    }
  };
}
