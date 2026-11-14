// Landning: mjuk sättning, studs, haveri, och avstängd utmaning som förr.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { KvantFlyg } from '../flyg/kvaternion.js';
import {
  sattning, verkstall, nyStuds, nastaKlaff, klaffIndex, KLAFF_STEG, kulaLage,
  stallFart, stallLyft
} from '../flyg/landning.js';

const rot = new URL('../', import.meta.url);
const C = JSON.parse(fs.readFileSync(new URL('flyg/config.json', rot), 'utf8'));
const main = fs.readFileSync(new URL('flyg/main.js', rot), 'utf8');
const html = fs.readFileSync(new URL('flyg/index.html', rot), 'utf8');
const A = C.modeller.typhoon.aero;
const U = C.landningsutmaning;
const L = C.landning;
const fel = [];
const k = (namn, villkor) => { if (!villkor) fel.push(namn); };

function val(over = {}) {
  return {
    utmaning: true,
    studs: true,
    markskydd: false,
    krasch: true,
    L,
    kontakt_m: C.krasch.kontakt_m,
    G: U,
    studsAntal: 0,
    ...over
  };
}
function matt(over = {}) {
  return { agl: 1.0, vs: -1, fart: 45, bank: 0, beta: 0, gear: 1, ...over };
}
function dom(overMatt, overVal) {
  return sattning(matt(overMatt), val(overVal));
}
function planFran(vs) {
  return { y: 1, vy: vs, vs, V: 45, markY: 0, paMarken: false, crashed: false };
}

k('gränserna ligger i config', U && U.mjuk_vs_ms < 0 && U.haveri_vs_ms < U.mjuk_vs_ms && U.mjuk_fart_ms < U.haveri_fart_ms && U.haveri_fart_ms === L.max_fart_ms && U.mjuk_beta_rad > 0 && U.haveri_beta_rad > U.mjuk_beta_rad && U.klaff.cl_max_extra > 0 && U.klaff.cd_extra > 0 && U.klaff.cm_nos < 0 && U.sidglid.cn_skev_extra > 0 && U.studs_max >= 2);
k('brytarna finns', C.brytare.landning === true && C.brytare.klaffeffekt === true && C.brytare.koordinerad === true && C.brytare.studs === true);
k('menyn har brytarna', main.includes("landning:'Landningsutmaning'") && main.includes("klaffeffekt:'Klaffeffekt'") && main.includes("koordinerad:'Kräver koordinerad sväng'") && main.includes("studs:'Studs och haveri'"));
k('kulan och klaffläget syns', html.includes('id="flyglapp"') && html.includes('id="kulaRuta"') && html.includes('id="klaff"') && html.includes('Landning'));
k('klaffsteg', klaffIndex(0) === 0 && nastaKlaff(0).varde === 0.45 && nastaKlaff(0.45).varde === 1 && nastaKlaff(1).varde === 0 && KLAFF_STEG[2].namn === 'Landning');
k('kulan följer sidglidningen', kulaLage(0, 0.15) === 0 && kulaLage(0.15, 0.15) === 1 && kulaLage(-0.075, 0.15) < 0);

{
  const mjuk = dom({ vs: -1 });
  const ut = verkstall(planFran(-1), mjuk, nyStuds(), U);
  k('mjuk landning är sättning ' + mjuk.typ + ' ' + mjuk.betyg, mjuk.typ === 'satter' && mjuk.betyg === 'Mjuk landning' && ut.paMarken && ut.vy === 0 && !ut.crashed);
}
{
  const hard = dom({ vs: -4.5 });
  const studs = nyStuds();
  const ut = verkstall(planFran(-4.5), hard, studs, U);
  k('för brant ger studs ' + hard.typ + ' ' + hard.betyg, hard.typ === 'studs' && hard.betyg === 'Hård landning' && ut.vy > 0.5 && ut.y > 1.8 && !ut.crashed && !ut.paMarken && studs.antal === 1);
  const sen = dom({ vs: -1.2 });
  k('studsen kan följas av en mjuk sättning', sen.typ === 'satter');
  const igen = dom({ vs: -9 });
  k('en ny hård sättning kan haverera', igen.typ === 'haveri');
}
{
  const rav = dom({ vs: -9 });
  const ut = verkstall(planFran(-9), rav, nyStuds(), U);
  k('mycket för brant ger haveri ' + rav.typ, rav.typ === 'haveri' && rav.betyg === 'Haveri' && ut.crashed && rav.orsak.includes('för hård'));
}
{
  const upprepad = dom({ vs: -4.5 }, { studsAntal: U.studs_max });
  k('för många studsar blir haveri', upprepad.typ === 'haveri');
}
{
  const av = dom({ vs: -3 }, { utmaning: false });
  const pa = dom({ vs: -3 });
  const avMjuk = dom({ vs: -1 }, { utmaning: false });
  const avHard = dom({ vs: -4.5 }, { utmaning: false });
  const avKras = dom({ vs: -9 }, { utmaning: false });
  const avUt = verkstall(planFran(-4.5), avHard, nyStuds(), U);
  k('avstängd utmaning sätter det gamla mjuka', av.typ === 'satter' && av.betyg === 'Landade' && av.gammal === true);
  k('påslagen utmaning studsar där den gamla satte', pa.typ === 'studs' && pa.betyg === 'Hård landning');
  k('avstängd mjuk landning som förr', avMjuk.typ === 'satter' && avMjuk.betyg === 'Mjuk landning');
  k('avstängd studs använder gamla 0,35 och 2,2 m ' + avUt.vy.toFixed(2) + ' ' + avUt.y.toFixed(2), avHard.typ === 'studs' && avHard.gammal === true && Math.abs(avUt.vy - 4.5 * 0.35) < 1e-9 && avUt.y === 2.2 && avUt.nos === 0);
  k('avstängd mycket brant havererar som förr', avKras.typ === 'haveri' && !avKras.orsak);
}
{
  const glid = dom({ vs: -1, beta: 0.25 });
  const glidAv = dom({ vs: -1, beta: 0.25 }, { utmaning: false });
  k('sidglidning över gränsen havererar', glid.typ === 'haveri');
  k('avstängd utmaning struntar i sidglidningen', glidAv.typ === 'satter');
  const hal = dom({ vs: -1, beta: 0.12 });
  k('måttlig sidglidning studsar', hal.typ === 'studs');
  const fort = dom({ vs: -1, fart: 55 });
  const forFort = dom({ vs: -1, fart: 70 });
  k('för fort studsar', fort.typ === 'studs');
  k('mycket för fort havererar', forFort.typ === 'haveri');
  const bank = dom({ vs: -1, bank: 0.2 });
  const bankKras = dom({ vs: -1, bank: 0.4 });
  k('bank studsar', bank.typ === 'studs');
  k('för mycket bank havererar', bankKras.typ === 'haveri');
}
{
  const skydd = dom({ vs: -9 }, { markskydd: true });
  const utanKras = dom({ vs: -9 }, { krasch: false });
  const gammalSkydd = dom({ vs: -9 }, { utmaning: false, markskydd: true });
  const gammalUtan = dom({ vs: -9 }, { utmaning: false, krasch: false });
  const buk = dom({ vs: -1, gear: 0 });
  k('mjukt markskydd stoppar haveri', skydd.typ === 'skydd' && !verkstall(planFran(-9), skydd, nyStuds(), { ...U, kontakt_m: C.krasch.kontakt_m }).crashed);
  k('krasch av stoppar haveri', utanKras.typ === 'skydd');
  k('markskydd gäller även utan utmaning', gammalSkydd.typ === 'skydd');
  k('krasch av gäller även utan utmaning', gammalUtan.typ === 'skydd');
  k('utan hjul havererar', buk.typ === 'haveri');
  const studsAv = dom({ vs: -3 }, { studs: false });
  k('avstängd studs ger gamla sättningen', studsAv.typ === 'satter' && studsAv.gammal === true);
  k('högt upp är fortfarande luft', dom({ agl: 30, vs: -12 }).typ === 'luft');
}

{
  const utan = stallFart(A, 1, false, U.klaff);
  const med = stallFart(A, 1, true, U.klaff);
  const ren = stallFart(A, 0, true, U.klaff);
  k('klaff utan effekt höjer inte stall-lyftet ' + stallLyft(A, 1, false, U.klaff).toFixed(2), Math.abs(stallLyft(A, 1, false, U.klaff) - stallLyft(A, 0, false, U.klaff)) < 1e-9);
  k('klaffeffekt sänker stallfarten ' + utan.toFixed(1) + ' → ' + med.toFixed(1), med < utan - 3 && med < ren - 3);
}

function flyg(sek, opt) {
  const fm = new KvantFlyg(A);
  fm.tillampaNivellering(false);
  fm.reset(0, opt.y ?? 400, 0, opt.fart ?? 55);
  const dt = 0.02;
  let spak = 0;
  let stall = 0;
  const n = Math.round(sek / dt);
  for (let i = 0; i < n; i++) {
    const p = fm.attitude().pitch;
    const cmd = Math.max(-0.35, Math.min(0.5, ((opt.malPitch ?? 0.02) - p) * 2.4 - fm.pitchRate * 0.9));
    if (opt.hall !== false) spak += cmd;
    const input = opt.input || { pitch: opt.hall === false ? (opt.pitch || 0) : cmd, roll: opt.roll || 0 };
    fm.step(dt, input, opt.gas ?? 0.45, undefined, {
      motorPa: true, gear: opt.gear ?? 1, flaps: opt.flaps ?? 0, roder: opt.roder ?? 0, paMarken: false,
      markY: opt.markY ?? 0,
      klaffEffekt: !!opt.klaffEffekt, koordinerad: !!opt.koordinerad,
      klaffTal: U.klaff, glidTal: U.sidglid
    });
    if (fm.stalled) stall += dt;
  }
  return { V: fm.V, y: fm.y, vs: fm.vs, pitch: fm.attitude().pitch, beta: fm.beta, yaw: fm.yawRate, stall, spak: spak / n, drag: fm.drag };
}

{
  const av = flyg(6, { flaps: 1, klaffEffekt: false, fart: 55, y: 500 });
  const pa = flyg(6, { flaps: 1, klaffEffekt: true, fart: 55, y: 500 });
  k('klaffeffekt kräver mer nos upp ' + av.spak.toFixed(3) + ' ' + pa.spak.toFixed(3), pa.spak > av.spak + 0.008);
  k('klaffeffekt sänker farten ' + av.V.toFixed(1) + ' ' + pa.V.toFixed(1), pa.V < av.V - 0.6);
  const en = new KvantFlyg(A);
  en.tillampaNivellering(false);
  en.reset(0, 400, 0, 60);
  en.step(0.05, { pitch: 0, roll: 0 }, 0.4, undefined, { motorPa: true, gear: 1, flaps: 1, roder: 0, paMarken: false, klaffEffekt: false, klaffTal: U.klaff });
  const tva = new KvantFlyg(A);
  tva.tillampaNivellering(false);
  tva.reset(0, 400, 0, 60);
  tva.step(0.05, { pitch: 0, roll: 0 }, 0.4, undefined, { motorPa: true, gear: 1, flaps: 1, roder: 0, paMarken: false, klaffEffekt: true, klaffTal: U.klaff });
  k('klaffeffekt ger mer motstånd ' + en.drag.toFixed(0) + ' ' + tva.drag.toFixed(0), tva.drag > en.drag + 200);
}

{
  function maxCL(effekt) {
    const fm = new KvantFlyg(A);
    fm.tillampaNivellering(false);
    fm.reset(0, 400, 0, 41);
    let max = 0;
    for (let i = 0; i < 80; i++) {
      fm.step(0.02, { pitch: 0.48, roll: 0 }, 0.2, undefined, {
        motorPa: true, gear: 1, flaps: 1, roder: 0, paMarken: false,
        klaffEffekt: effekt, klaffTal: U.klaff, markY: 0
      });
      if (fm.CL > max) max = fm.CL;
    }
    return max;
  }
  const av = maxCL(false);
  const pa = maxCL(true);
  k('klaffeffekt höjer lyftet vid samma drag ' + av.toFixed(2) + ' ' + pa.toFixed(2), pa > av + 0.3);
}

{
  const bas = { flaps: 0, gear: 0, fart: 48, y: 50, gas: 0.35, roll: 0.9, hall: false, pitch: 0.05, markY: 0, malPitch: 0 };
  const av = flyg(1.6, { ...bas, koordinerad: false });
  const pa = flyg(1.6, { ...bas, koordinerad: true });
  k('roll utan sidroder ger mer sidglidning ' + av.beta.toFixed(3) + ' ' + pa.beta.toFixed(3), Math.abs(pa.beta) > Math.abs(av.beta) + 0.02);
  k('okoordinerad sväng sjunker mer ' + av.y.toFixed(1) + ' ' + pa.y.toFixed(1), pa.y < av.y - 2);
  const tidig = new KvantFlyg(A);
  tidig.tillampaNivellering(false);
  tidig.reset(0, 200, 0, 50);
  tidig.step(0.4, { pitch: 0, roll: 0.8 }, 0.4, undefined, { motorPa: true, gear: 0, flaps: 0, roder: 0, paMarken: false, koordinerad: true, glidTal: U.sidglid, markY: 0 });
  k('negativ girning mot rollsiden ' + tidig.yawRate.toFixed(3), tidig.yawRate < -0.01);
}

if (fel.length) {
  console.error(fel.join('\n'));
  process.exit(1);
}
console.log('flyg-landning-ok');
