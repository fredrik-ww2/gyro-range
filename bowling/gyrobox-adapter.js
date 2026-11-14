import { monteraGyrobox } from '../shared/gyrobox.js';

const GRAD = 180 / Math.PI;

// bowling/konfig.js. Svingen är redan ett fartläge, siktet följer vinkeln.
export function monteraBowling({ konfig, lage }) {
  const sens = konfig.kanslighet ?? 1;
  const box = monteraGyrobox({
    spel: 'bowling',
    axlar: [
      { id: 'sikt', funktion: 'Sikte', axel: 'sidvridning' },
      { id: 'krok', funktion: 'Krok', axel: 'roll' },
      { id: 'sving', funktion: 'Sving', axel: 'fart', enhet: '°/s' }
    ],
    standard: {
      sikt: {
        invertera: !!konfig.brytare?.invertera_fram, lage: 'noll', kanslighet: sens, kurva: 1,
        dodzon: 0, utjamning: 0, spann: 40, gain: Math.PI / 180
      },
      krok: {
        invertera: !!konfig.brytare?.invertera_hook, lage: 'noll', kanslighet: sens, kurva: 1,
        dodzon: 0, utjamning: 0, spann: 90, gain: 1
      },
      sving: {
        invertera: false, lage: 'vrid', kanslighet: sens, kurva: 1,
        dodzon: 0, utjamning: 0, spann: konfig.sving?.omega || 100, gain: 1
      }
    },
    aktiv() {
      const namn = lage?.() || '';
      if (namn === 'SWINGING_FORWARD' || namn === 'ARMED_IN_BACKSWING' || namn === 'CALIBRATED_BACKSWING') return 'sving';
      if (namn === 'LOOKING') return 'sikt';
      return 'krok';
    },
    funktion(id) {
      if (id === 'sikt') return 'Sikte';
      if (id === 'sving') return 'Sving';
      return 'Krok';
    }
  });
  return {
    box,
    // Svingens trösklar läser omega. Känslighet där ska inte dubbleras,
    // så fartaxeln bara formar när läget inte är standard.
    forma(f, dt) {
      const opt = { jamna: true };
      return {
        ...f,
        aimYaw: box.koppla('sikt', f.aimYaw, f.aimYaw * GRAD, dt, opt),
        roll: box.koppla('krok', f.roll, f.roll * GRAD, dt, opt),
        omega: box.koppla('sving', f.omega, f.omega, dt, opt)
      };
    }
  };
}
