import { monteraGyrobox } from '../shared/gyrobox.js';

const GRAD = 180 / Math.PI;

// data/spel.json → styrning. Känslighet och utjämning där är standardläget.
export function monteraSkjutbana({ gyro, settings, styrning, steg }) {
  const bas = (over = {}) => ({
    invertera: false,
    lage: 'noll',
    kanslighet: styrning.kanslighet ?? 1,
    kurva: 1,
    dodzon: 0,
    utjamning: styrning.utjamning_s ?? 0.055,
    spann: 50,
    gain: Math.PI / 180,
    ...over
  });
  const box = monteraGyrobox({
    spel: 'skjutbana',
    axlar: [
      { id: 'pitch', funktion: 'Sikte', axel: 'lutning fram/bak' },
      { id: 'yaw', funktion: 'Styr', axel: 'vridning' },
      { id: 'roll', funktion: 'Sikte', axel: 'roll' }
    ],
    standard: {
      pitch: bas({ invertera: !!styrning.inverteraX }),
      yaw: bas({ invertera: !!styrning.inverteraY }),
      roll: bas({ invertera: !!styrning.inverteraZ, spann: 35 })
    },
    funktion(id) {
      const gar = steg() === 0;
      if (id === 'yaw') return gar ? 'Gång' : 'Sikte';
      return gar ? 'Gång' : 'Sikte';
    },
    aktiv() {
      const g = gyro.vinklar || {};
      const par = [['pitch', g.pitch], ['yaw', g.yaw], ['roll', g.roll]];
      par.sort((a, b) => Math.abs(b[1] || 0) - Math.abs(a[1] || 0));
      return par[0][0];
    },
    las(id) {
      const g = gyro.vinklar || {};
      const v = id === 'pitch' ? g.pitch : id === 'yaw' ? g.yaw : g.roll;
      return (v || 0) * GRAD;
    },
    kalibrera() { gyro.center(); },
    tillampa(nu) { settings.utjamning_s = nu.pitch.utjamning; }
  });
  return {
    box,
    efter(dt) {
      const g = gyro.vinklar;
      const opt = { jamna: false };
      g.pitch = box.koppla('pitch', g.pitch, g.pitch * GRAD, dt, opt);
      g.yaw = box.koppla('yaw', g.yaw, g.yaw * GRAD, dt, opt);
      g.roll = box.koppla('roll', g.roll, g.roll * GRAD, dt, opt);
    }
  };
}
