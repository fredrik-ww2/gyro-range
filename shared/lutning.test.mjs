import test from 'node:test';
import assert from 'node:assert/strict';
import { tolkaOrientering } from '../js/riktning.js';
import { vinklarFranOrientering } from '../gubbe-test/logik.js';
import { eulerStyrning } from '../flyg/orientering.js';
import { lutningFranGrav } from '../labyrint/gyro.js';
import { vinkelSkillnad } from '../rorelse/motor.js';
import { createAimMouse } from '../rorelse-test/motion-core.js';
import { anglesBetween } from '../rotor/controls/GyroAdapter.js';
import { svingVinkel } from '../bowling/gyro.js';
import * as THREE from '../js/vendor/three.module.js';
import { enhetsKvaternion, vinklarFranKvaternion } from '../vagn-test/gyro.js';

const noll = { alpha: 0, beta: 90, gamma: 0 };
function par(namn, vanster, hoger, nyckel) {
  test(namn + ' är symmetrisk', () => {
    const a = vanster[nyckel];
    const b = hoger[nyckel];
    assert.ok(Math.abs(a) > 0.05, `${namn} ${a}`);
    assert.ok(a * b < 0, `${namn} ${a} och ${b}`);
    assert.ok(Math.abs(Math.abs(a) - Math.abs(b)) < Math.max(0.05, Math.abs(a) * 0.08), `${a} + ${b}`);
  });
}

par('skjutbana', tolkaOrientering(0, 90, -20, noll, 0), tolkaOrientering(0, 90, 20, noll, 0), 'roll');
par('gubbe', vinklarFranOrientering(0, 90, -20, noll, 0), vinklarFranOrientering(0, 90, 20, noll, 0), 'roll');
const gYawV = vinklarFranOrientering(-20, 90, 0, noll, 0);
const gYawH = vinklarFranOrientering(20, 90, 0, noll, 0);
par('gubbe vridning', { roll: gYawV.yaw }, { roll: gYawH.yaw }, 'roll');

par('flyg', eulerStyrning({ alpha: 0, beta: 90, gamma: -20 }, noll, 0), eulerStyrning({ alpha: 0, beta: 90, gamma: 20 }, noll, 0), 'roll');

function panoramaSida(gammaDps) {
  return -gammaDps * Math.PI / 180;
}
par('panorama', { roll: panoramaSida(20) }, { roll: panoramaSida(-20) }, 'roll');

const lab = { gyro: { invertFram: false, invertSida: false } };
par('labyrint', lutningFranGrav({ x: -0.4, y: 0, z: 0 }, { fram: 0, sida: 0 }, lab), lutningFranGrav({ x: 0.4, y: 0, z: 0 }, { fram: 0, sida: 0 }, lab), 'sida');

const skill = vinkelSkillnad([10, -15, 20], [0, 0, 0]);
const skillOm = vinkelSkillnad([-10, 15, -20], [0, 0, 0]);
par('rörelse', { roll: skill[2] }, { roll: skillOm[2] }, 'roll');

test('rörelsetest integrerar vänster och höger lika', () => {
  const steg = (tecken) => {
    const aim = createAimMouse({ useOneEuro: false, tightenDegS: 0, sensYaw: 1 });
    let ut = { yaw: 0 };
    for (let i = 0; i < 10; i++) ut = aim.update({ gyro: [0, tecken, 0], dt: 0.05 });
    return ut.yaw;
  };
  const v = steg(1);
  const h = steg(-1);
  assert.ok(v > 0 && h < 0);
  assert.ok(Math.abs(v + h) < 1e-6);
});

const rv = anglesBetween({ alpha: 0, beta: 90, gamma: 0, screen: 0 }, { alpha: 0, beta: 90, gamma: -25, screen: 0 });
const rh = anglesBetween({ alpha: 0, beta: 90, gamma: 0, screen: 0 }, { alpha: 0, beta: 90, gamma: 25, screen: 0 });
par('rotor gamma', { roll: rv.yaw }, { roll: rh.yaw }, 'roll');
const rrV = anglesBetween({ alpha: 0, beta: 90, gamma: 0, screen: 0 }, { alpha: 90, beta: 70, gamma: -90, screen: 0 });
const rrH = anglesBetween({ alpha: 0, beta: 90, gamma: 0, screen: 0 }, { alpha: -90, beta: 70, gamma: 90, screen: 0 });
par('rotor roll', rrV, rrH, 'roll');

test('bowling sving går lika långt fram och tillbaka från häng', () => {
  const hang = svingVinkel({ x: 0, y: -1, z: 0 });
  const fram = svingVinkel({ x: 0, y: 0, z: -1 });
  const bak = svingVinkel({ x: 0, y: 0, z: 1 });
  assert.ok(fram > hang && bak < hang);
});

test('vagntest rullar åt båda håll', () => {
  const q = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const skarm = new THREE.Quaternion();
  const rel = new THREE.Quaternion();
  const jamfor = (gamma) => {
    const o = enhetsKvaternion(0, 90, 0, 0, q, euler, skarm).clone();
    o.invert();
    const n = enhetsKvaternion(0, 90, gamma, 0, q, euler, skarm);
    return vinklarFranKvaternion(rel.multiplyQuaternions(o, n).normalize(), euler);
  };
  const v = jamfor(-25);
  const h = jamfor(25);
  assert.ok(v.roll * h.roll < 0, `${v.roll} ${h.roll}`);
  assert.ok(Math.abs(Math.abs(v.roll) - Math.abs(h.roll)) < 0.05);
});
