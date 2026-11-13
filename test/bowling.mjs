import assert from 'node:assert/strict';
import { KONFIG } from '../bowling/konfig.js';
import { skapaGyro, sjalvtest } from '../bowling/gyro.js';
import { skapaMaskin } from '../bowling/tillstand.js';
import { skapaFysik } from '../bowling/fysik.js';

const fel = [];
const k = (namn, ok) => { if (!ok) fel.push(namn); };
const nara = (a, b, t) => Math.abs(a - b) <= t;
const NOLL = { alpha: 0, beta: 0, gamma: 0 };

const kedja = sjalvtest();
k('gyrokedja ' + kedja.join(', '), kedja.length === 0);

function ny() {
  const gyro = skapaGyro(KONFIG, {});
  const maskin = skapaMaskin(KONFIG);
  const fysik = skapaFysik(KONFIG);
  maskin.beviljad();
  const mata = prov => {
    const f = gyro.mata(prov);
    const r = maskin.steg(prov.t, f, true, false);
    if (r.handelse === 'slapp' && r.kast) fysik.starta(r.kast);
    return { f, r };
  };
  return { gyro, maskin, fysik, mata };
}

function kalibrera(s, t0 = 0) {
  s.mata({ t: t0, alpha: 0, beta: 90, gamma: 0, rotationRate: NOLL, skarm: 0 });
  s.gyro.nollstall();
  s.maskin.nollstalld(t0);
}

{
  const s = ny();
  kalibrera(s, 0);
  const look = s.mata({ t: 20, alpha: 0, beta: 90, gamma: 0, rotationRate: NOLL, skarm: 0 }).f;
  k('titt i siktläge', look.titt > 0.8 && look.plat < 0.05);
  k('sikt är inte bakzon', Math.abs(look.theta) > KONFIG.bak.grader);

  const hook = s.mata({ t: 40, alpha: 0, beta: 0, gamma: -60, rotationRate: NOLL, skarm: 0 }).f;
  k('roll +60', nara(hook.roll * 180 / Math.PI, 60, 8));
  k('krok-aim nära noll', Math.abs(hook.aimYaw) < 0.12);
  k('släppvinkel nås platt', hook.theta >= KONFIG.sving.slapp_vinkel && hook.plat >= 0.35 && hook.titt < 0.75);

  s.mata({ t: 60, alpha: 0, beta: 0, gamma: -60, rotationRate: NOLL, skarm: 0 });
  const rate = s.gyro.rateFranOmega(720);
  const med = s.mata({ t: 80, alpha: 0, beta: 0, gamma: -60, rotationRate: rate, skarm: 0 }).f;
  k('omega framåt', nara(med.omega, 720, 8));
}

function lyft(s) {
  kalibrera(s, 0);
  s.mata({ t: 40, alpha: 0, beta: 70, gamma: 0, rotationRate: NOLL, skarm: 0 });
  s.mata({ t: 90, alpha: 0, beta: 80, gamma: 0, rotationRate: NOLL, skarm: 0 });
  s.mata({ t: 150, alpha: 0, beta: 90, gamma: 0, rotationRate: NOLL, skarm: 0 });
  s.mata({ t: 280, alpha: 0, beta: 90, gamma: 0, rotationRate: NOLL, skarm: 0 });
  const slut = s.mata({ t: 460, alpha: 0, beta: 90, gamma: 0, rotationRate: NOLL, skarm: 0 });
  return slut;
}

{
  const s = ny();
  const slut = lyft(s);
  k('a lyft ger LOOKING', slut.r.tillstand === 'LOOKING');
  k('a inget kast', s.maskin.kast == null);
  k('a klotet ligger', s.fysik.ball.aktiv === false);
}

function kasta(rollGamma) {
  const s = ny();
  kalibrera(s, 0);
  for (let i = 1; i <= 8; i++) {
    s.mata({ t: i * 20, alpha: 0, beta: 180, gamma: 180, rotationRate: NOLL, skarm: 0 });
  }
  const beva = s.maskin.tillstand;
  s.mata({ t: 200, alpha: 0, beta: 0, gamma: rollGamma, rotationRate: NOLL, skarm: 0 });
  const rate = s.gyro.rateFranOmega(720);
  let slapp = null;
  for (let i = 1; i <= 12; i++) {
    const r = s.mata({ t: 200 + i * 20, alpha: 0, beta: 0, gamma: rollGamma, rotationRate: rate, skarm: 0 });
    if (r.r.handelse === 'slapp') slapp = r.r.kast;
  }
  return { s, beva, slapp };
}

function banaX(fysik, malZ) {
  let x = fysik.ball.x;
  let spar = [];
  for (let i = 0; i < 400 && fysik.ball.aktiv && fysik.ball.z > malZ; i++) {
    fysik.steg(1 / 60);
    spar.push({ x: fysik.ball.x, z: fysik.ball.z, ranna: fysik.ball.ranna });
    x = fysik.ball.x;
  }
  return { x, z: fysik.ball.z, ranna: fysik.ball.ranna, spar };
}

{
  const rakt = kasta(0);
  k('b beväpnad före sving', rakt.beva === 'ARMED_IN_BACKSWING');
  k('b släpp finns', !!rakt.slapp);
  k('b krok nära noll', rakt.slapp && Math.abs(rakt.slapp.hook) < 0.08);
  k('b aim inte mjukklampad bort', rakt.slapp && Math.abs(rakt.slapp.aimYaw) < 0.12);
  k('b fart i spann', rakt.slapp && rakt.slapp.fart >= 4 && rakt.slapp.fart <= 11);
  const vag = banaX(rakt.s.fysik, -15);
  const avvik = Math.max(...vag.spar.filter(p => p.z > -16).map(p => Math.abs(p.x)), 0);
  k('b rakt klot ' + avvik.toFixed(3), avvik < 0.06);

  const krok = kasta(-60);
  k('c släpp finns', !!krok.slapp);
  k('c hook tydlig', krok.slapp && krok.slapp.hook > 0.75);
  const kvag = banaX(krok.s.fysik, -16);
  const kmax = Math.max(...kvag.spar.filter(p => p.z > -17.5).map(p => Math.abs(p.x)), 0);
  k('c krok i sidled ' + kmax.toFixed(3) + ' mot ' + avvik.toFixed(3), kmax > 0.2 && kmax > avvik * 4);

  const fore = { ...krok.slapp };
  const punkt = { x: krok.s.fysik.ball.x, z: krok.s.fysik.ball.z };
  krok.s.mata({ t: 900, alpha: 140, beta: 20, gamma: 80, rotationRate: { alpha: 400, beta: -200, gamma: 250 }, skarm: 90 });
  krok.s.fysik.steg(1 / 30);
  const efter = krok.s.maskin.kast;
  k('d fart låst', efter && nara(efter.fart, fore.fart, 1e-9));
  k('d aim låst', efter && nara(efter.aimYaw, fore.aimYaw, 1e-9));
  k('d hook låst', efter && nara(efter.hook, fore.hook, 1e-9));
  k('d klotet följer låsningen', Math.abs(krok.s.fysik.ball.x - punkt.x) < 0.5);
  k('d efterlyft bytte inte riktning', Math.sign(krok.s.fysik.ball.x - punkt.x) === Math.sign(fore.hook) || Math.abs(krok.s.fysik.ball.x - punkt.x) < 0.02);
}

{
  const f = skapaFysik(KONFIG);
  f.starta({ fart: 8, aimYaw: 0.2, hook: 0, roll: 0 });
  let ranna = 0;
  let traff = 0;
  for (let i = 0; i < 600; i++) {
    const res = f.steg(1 / 60);
    if (res.ranna) ranna += 1;
    traff += res.antalTraffade || 0;
  }
  k('ränna en gång', ranna === 1 && f.ball.ranna === true);
  k('rännan tar inga käglor', traff === 0 && f.poang.senast === 0);
}

{
  const f = skapaFysik(KONFIG);
  f.starta({ fart: 8, aimYaw: 0, hook: 0, roll: 0 });
  let sum = 0;
  let ranna = 0;
  for (let i = 0; i < 900 && !f.poang.raknad; i++) {
    const res = f.steg(1 / 60);
    sum += res.antalTraffade || 0;
    if (res.ranna) ranna += 1;
  }
  k('träffar rapporteras', sum > 0 && f.poang.senast > 0 && f.poang.raknad);
  k('rakt klot lämnar banan', ranna === 0 && f.ball.ranna === false);
}

if (fel.length) {
  console.error(fel.join('\n'));
  process.exit(1);
}
console.log('bowling-ok');
