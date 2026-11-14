import { monteraGyrobox } from '../shared/gyrobox.js';
import { STANDARD_STYR } from './blick.js?v=15';
import { STANDARD_LASER } from './laser.js?v=15';

const GRAD = 180 / Math.PI;

// Blickens standard ligger i blick.js. Laserpekarens utjämning och dödzon ligger i laser.js.
// panorama/data/config.json har gångspaken, inte siktet.
export function monteraPanorama({ blick, laser, laserPa, nollstall }) {
  const b = STANDARD_STYR.axlar;
  const bas = (ax, over = {}) => ({
    invertera: false,
    lage: 'noll',
    kanslighet: ax.kanslighet,
    kurva: 1,
    dodzon: STANDARD_LASER.dodzon ?? 0,
    utjamning: ax.utjamning,
    spann: 60,
    gain: Math.PI / 180,
    ...over
  });
  const box = monteraGyrobox({
    spel: 'panorama',
    suffixUtjamning: '',
    axlar: [
      { id: 'vrida', funktion: 'Blick', axel: 'vridning' },
      { id: 'uppner', funktion: 'Blick', axel: 'lutning fram/bak' },
      { id: 'sida', funktion: 'Blick', axel: 'roll' }
    ],
    standard: {
      vrida: bas(b.vrida),
      uppner: bas(b.uppner),
      sida: bas(b.sida, { utjamning: b.sida.utjamning })
    },
    funktion(id) {
      const sikte = laserPa?.();
      if (id === 'uppner') return sikte ? 'Sikte' : 'Blick';
      if (id === 'sida') return sikte ? 'Sikte' : 'Blick';
      return sikte ? 'Sikte' : 'Blick';
    },
    aktiv() {
      const ids = ['vrida', 'uppner', 'sida'];
      return ids.sort((a, b) => Math.abs(box.varde(b)) - Math.abs(box.varde(a)))[0];
    },
    kalibrera() { nollstall?.(); },
    tillampa(nu) {
      for (const id of ['vrida', 'uppner', 'sida']) {
        if (blick.styr?.axlar?.[id]) blick.styr.axlar[id].utjamning = nu[id].utjamning;
      }
      if (laser.install) laser.install.utjamning = nu.vrida.utjamning;
    }
  });
  const opt = { jamna: false };
  const forma = (id, rad, abs, dt) => box.koppla(id, rad, (abs ?? rad) * GRAD, dt, opt);
  blick.setForma((id, rad, abs, dt) => (laserPa?.() ? rad : forma(id, rad, abs, dt)));
  laser.setForma((id, rad, dt) => (laserPa?.() ? forma(id, rad, rad, dt) : rad));
  return box;
}
