// Bf 109: kvaternion, loop, roll och stall. Talen kommer från flyg/config.json.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { KvantFlyg, gimbalProv } from '../flyg/kvaternion.js';

const C = JSON.parse(fs.readFileSync(new URL('../flyg/config.json', import.meta.url), 'utf8'));
const A = C.modeller.bf109.aero;
const fel = [];
const k = (namn, villkor) => { if (!villkor) fel.push(namn); };
const sys = { motorPa: true, gear: 0, flaps: 0, roder: 0, paMarken: false };

function kor(sek, input, gas, fart, hojd, niva = true) {
  const fm = new KvantFlyg(A);
  fm.tillampaNivellering(niva);
  fm.reset(0, hojd, 0, fart);
  const dt = 0.02;
  let phase = 0;
  let minV = fm.V;
  let vVidTopp = fm.V;
  let minUy = 1;
  let worst = 0;
  let stallTid = 0;
  let kamHopp = 0;
  let kamFore = 0;
  let prev = fm.fram();
  const startV = fm.V;
  let vEfter = null;
  for (let i = 0; i < Math.round(sek / dt); i++) {
    fm.step(dt, input, gas, undefined, sys);
    const f = fm.fram();
    const u = fm.upp();
    const d = Math.acos(Math.max(-1, Math.min(1, prev.x * f.x + prev.y * f.y + prev.z * f.z)));
    if (d > worst) worst = d;
    prev = f;
    if (fm.V < minV) minV = fm.V;
    if (u.y < minUy) { minUy = u.y; vVidTopp = fm.V; }
    if (fm.stalled) stallTid += dt;
    if (phase === 0 && f.y > 0.85) phase = 1;
    if (phase === 1 && u.y < -0.65 && f.z > 0.45) phase = 2;
    if (phase === 2 && f.y < -0.75) phase = 3;
    if (phase === 3 && u.y > 0.65 && f.z < -0.45) { phase = 4; vEfter = fm.V; }
    const kam = fm.kameraKurs(dt);
    let dk = kam - kamFore;
    while (dk > Math.PI) dk -= 2 * Math.PI;
    while (dk < -Math.PI) dk += 2 * Math.PI;
    if (Math.abs(dk) > Math.abs(kamHopp)) kamHopp = dk;
    kamFore = kam;
  }
  return { fm, phase, minV, vVidTopp, minUy, worst, stallTid, kamHopp, startV, vEfter, norm: Math.hypot(fm.ori.x, fm.ori.y, fm.ori.z, fm.ori.w) };
}

function roll(sek, fart) {
  const fm = new KvantFlyg(A);
  fm.tillampaNivellering(false);
  fm.reset(0, 500, 0, fart);
  const dt = 0.02;
  const f0 = fm.fram();
  let phase = 0;
  let maxAbsFy = 0;
  let minDot = 1;
  let worst = 0;
  let prev = f0;
  for (let i = 0; i < Math.round(sek / dt); i++) {
    fm.step(dt, { pitch: 0, roll: A.spak_max_roll }, 0.85, undefined, sys);
    const f = fm.fram();
    const u = fm.upp();
    const r = fm.hoger();
    const d = Math.acos(Math.max(-1, Math.min(1, prev.x * f.x + prev.y * f.y + prev.z * f.z)));
    if (d > worst) worst = d;
    prev = f;
    maxAbsFy = Math.max(maxAbsFy, Math.abs(f.y));
    minDot = Math.min(minDot, f.x * f0.x + f.y * f0.y + f.z * f0.z);
    if (phase === 0 && r.y > 0.8) phase = 1;
    if (phase === 1 && u.y < -0.8) phase = 2;
    if (phase === 2 && r.y < -0.8) phase = 3;
    if (phase === 3 && u.y > 0.8) phase = 4;
  }
  return { phase, maxAbsFy, minDot, worst, norm: Math.hypot(fm.ori.x, fm.ori.y, fm.ori.z, fm.ori.w) };
}

{
  const g = gimbalProv();
  k('kvaternion vrider nosen vid lodrätt', g.kvatNosY < 0.85);
  k('euler fastnar med nosen rakt upp', g.eulerNosY > 0.98);
  k('ren loop är sammanhängande', g.loopHopp < 0.05 && g.sagLod && g.sagRygg && Math.abs(g.norm - 1) < 1e-6);
}

{
  const bas = A.niva_k;
  const fm = new KvantFlyg(A);
  k('nivellering går att stänga', fm.tillampaNivellering(false) === 0 && A.niva_k === bas);
  k('nivellering går att slå på', fm.tillampaNivellering(true) === bas);
}

{
  const fm = new KvantFlyg(A);
  fm.tillampaNivellering(true);
  fm.reset(0, 400, 0, 120);
  for (let i = 0; i < 800; i++) fm.step(0.02, { pitch: 0, roll: 0 }, 1, undefined, sys);
  k('planflykt håller höjden', Math.abs(fm.y - 400) < 40 && fm.V > 100 && fm.V < 180);
}

{
  const loop = kor(16, { pitch: A.spak_max_pitch, roll: 0 }, 1, 140, 500, true);
  k('hel loop', loop.phase === 4);
  k('loopen tappar fart på väg upp', loop.vVidTopp < loop.startV - 25);
  k('loopen tar igen fart på väg ner', loop.vEfter > loop.vVidTopp + 15);
  k('loopen stallar inte bort sig', loop.stallTid < 0.5);
  k('ingen gimbal-flip i loopen', loop.worst < 0.2 && Math.abs(loop.norm - 1) < 1e-3);
  k('kameran hoppar inte i loopen', Math.abs(loop.kamHopp) < 0.6);
}

{
  const sakta = kor(10, { pitch: A.spak_max_pitch, roll: 0 }, 1, 65, 400, true);
  k('för sakta stallar och når inte runt', sakta.stallTid > 1 && sakta.minUy > 0.4 && sakta.phase < 2);
}

{
  const fort = roll(6, 120);
  const sakta = roll(6, 30);
  k('roll ett varv i fart', fort.phase === 4 && fort.minDot > 0.75 && fort.worst < 0.15 && Math.abs(fort.norm - 1) < 1e-3);
  k('roll är trög i låg fart', sakta.phase < 4 && sakta.phase < fort.phase);
}

if (fel.length) {
  console.error(fel.join('\n'));
  process.exit(1);
}
console.log('kvaternion-ok');
