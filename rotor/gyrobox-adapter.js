import { monteraGyrobox } from '../shared/gyrobox.js';

// rotor/config.json → control. Vid standardvärden är koppla identitet,
// så ControlModule behåller dödzon, känslighet och mjukhet tills någon drar.
export function monteraRotor({ control, kalibrera }) {
  const c = control.settings;
  const flyg = (spann) => ({
    invertera: false,
    lage: 'noll',
    kanslighet: c.sensitivity,
    kurva: 1,
    dodzon: c.deadzoneDeg,
    utjamning: c.smoothingSeconds,
    spann,
    gain: 1
  });
  const sikte = (spann) => ({
    invertera: false,
    lage: 'noll',
    kanslighet: c.aimSensitivity,
    kurva: 1,
    dodzon: c.aimDeadzoneDeg,
    utjamning: c.aimSmoothingSeconds,
    spann,
    gain: 1
  });
  let sen = { pitch: 0, roll: 0, yaw: 0 };
  const box = monteraGyrobox({
    spel: 'rotor',
    axlar: [
      { id: 'tipp', funktion: 'Styr', axel: 'fram/bak' },
      { id: 'roll', funktion: 'Styr', axel: 'sida' },
      { id: 'gir', funktion: 'Gir', axel: 'vridning' },
      { id: 'siktePitch', funktion: 'Sikte', axel: 'upp/ner' },
      { id: 'sikteYaw', funktion: 'Sikte', axel: 'sidled' }
    ],
    standard: {
      tipp: flyg(c.fullScaleDeg),
      roll: flyg(c.fullScaleDeg),
      gir: flyg(c.yawFullScaleDeg),
      siktePitch: sikte(c.aimPitchLimitDeg),
      sikteYaw: sikte(c.aimYawLimitDeg)
    },
    aktiv() {
      const mode = control.settings.controlMode;
      if (mode === 'gyro-aim') {
        return Math.abs(box.varde('sikteYaw')) >= Math.abs(box.varde('siktePitch')) ? 'sikteYaw' : 'siktePitch';
      }
      const r = Math.abs(box.varde('roll'));
      const p = Math.abs(box.varde('tipp'));
      const y = Math.abs(box.varde('gir'));
      if (control.settings.yawMode === 'orientation' && y >= r && y >= p) return 'gir';
      return r >= p ? 'roll' : 'tipp';
    },
    las(id) {
      if (id === 'tipp' || id === 'siktePitch') return sen.pitch;
      if (id === 'roll' || id === 'sikteYaw') return sen.roll;
      return sen.yaw;
    },
    kalibrera,
    tillampa(nu) {
      const patch = {};
      if (nu.tipp) patch.smoothingSeconds = nu.tipp.utjamning;
      if (nu.siktePitch) patch.aimSmoothingSeconds = nu.siktePitch.utjamning;
      control.configure(patch);
    }
  });
  return {
    box,
    forma(sample, dt) {
      sen = {
        pitch: Number.isFinite(sample?.pitch) ? sample.pitch : 0,
        roll: Number.isFinite(sample?.roll) ? sample.roll : 0,
        yaw: Number.isFinite(sample?.yaw) ? sample.yaw : 0
      };
      const opt = { jamna: false };
      const mode = control.settings.controlMode;
      if (mode === 'gyro-aim') {
        return {
          pitch: box.koppla('siktePitch', sen.pitch, sen.pitch, dt, opt),
          roll: box.koppla('sikteYaw', sen.roll, sen.roll, dt, opt),
          yaw: box.koppla('gir', sen.yaw, sen.yaw, dt, opt)
        };
      }
      return {
        pitch: box.koppla('tipp', sen.pitch, sen.pitch, dt, opt),
        roll: box.koppla('roll', sen.roll, sen.roll, dt, opt),
        yaw: box.koppla('gir', sen.yaw, sen.yaw, dt, opt)
      };
    }
  };
}
