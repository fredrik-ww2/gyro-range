import { monteraGyrobox } from '../shared/gyrobox.js';
import { standardInstallningar } from './logik.js';

function axel(block, id) {
  const a = block[id];
  return {
    invertera: false,
    lage: 'noll',
    kanslighet: a.kanslighet,
    kurva: 1 + (a.forstarkning || 0),
    dodzon: a.dodzon,
    utjamning: a.utjamning,
    spann: 40,
    gain: 1
  };
}

// Standarderna kommer från logik.js standardInstallningar(), samma tal som spelet startar med.
export function monteraGubbe({ installningar, lage, nollstall }) {
  const std = standardInstallningar();
  const box = monteraGyrobox({
    spel: 'gubbe-test',
    suffixUtjamning: '',
    axlar: [
      { id: 'gaVrid', funktion: 'Gång', axel: 'vridning' },
      { id: 'gaFram', funktion: 'Gång', axel: 'lutning fram/bak' },
      { id: 'gaSida', funktion: 'Gång', axel: 'roll' },
      { id: 'sikVrid', funktion: 'Sikte', axel: 'vridning' },
      { id: 'sikFram', funktion: 'Sikte', axel: 'lutning fram/bak' },
      { id: 'sikSida', funktion: 'Sikte', axel: 'roll' }
    ],
    standard: {
      gaVrid: axel(std.ga, 'vrid'),
      gaFram: axel(std.ga, 'fram'),
      gaSida: axel(std.ga, 'sida'),
      sikVrid: axel(std.sikta, 'vrid'),
      sikFram: axel(std.sikta, 'fram'),
      sikSida: axel(std.sikta, 'sida')
    },
    aktiv() {
      const gar = lage() !== 'sikta';
      const ids = gar ? ['gaVrid', 'gaFram', 'gaSida'] : ['sikVrid', 'sikFram', 'sikSida'];
      return ids.sort((a, b) => Math.abs(box.varde(b)) - Math.abs(box.varde(a)))[0];
    },
    kalibrera() { nollstall?.(); },
    tillampa(nu) {
      const par = [['ga', 'vrid', 'gaVrid'], ['ga', 'fram', 'gaFram'], ['ga', 'sida', 'gaSida'], ['sikta', 'vrid', 'sikVrid'], ['sikta', 'fram', 'sikFram'], ['sikta', 'sida', 'sikSida']];
      for (const [block, id, nyckel] of par) {
        if (installningar[block]?.[id]) installningar[block][id].utjamning = nu[nyckel].utjamning;
      }
    }
  });
  return {
    box,
    forma(id, spelUt, rawDeg, dt) {
      return box.koppla(id, spelUt, rawDeg, dt, { jamna: false });
    }
  };
}
