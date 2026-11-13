// Grindhack för växelspak och kugghack för gas. Ren matematik, inget ljud.

import {BACKGAS, STANDARD, bandMal, ordnaTrosklar, skapaVagn, stegaVagn} from './styr.js?v=4';
import {MEKANIK, VAXLAR} from './konfig.js?v=4';

export {MEKANIK, VAXLAR};

function klamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

export function gasAntal(steg = MEKANIK.gasSteg) {
  return Math.round(1 / steg) + 1;
}

export function gasVarde(index, steg = MEKANIK.gasSteg) {
  const n = Math.round(1 / steg);
  const i = klamp(index | 0, 0, n);
  return i / n;
}

export function vaxelFranId(id) {
  const i = VAXLAR.findIndex(v => v.id === id);
  return i < 0 ? 1 : i;
}

export function vaxelOpt() {
  return {
    antal: VAXLAR.length,
    fjader: MEKANIK.vaxelFjader,
    bryt: MEKANIK.vaxelBryt,
    andstopp: MEKANIK.vaxelAndstopp,
    andstoppFjader: MEKANIK.vaxelAndstoppFjader,
    andstoppKansla: MEKANIK.vaxelAndstoppKansla
  };
}

export function gasOpt() {
  return {
    antal: gasAntal(),
    fjader: MEKANIK.gasFjader,
    bryt: MEKANIK.gasBryt,
    andstopp: MEKANIK.gasAndstopp,
    andstoppFjader: MEKANIK.gasAndstoppFjader,
    andstoppKansla: MEKANIK.gasAndstoppKansla
  };
}

// fingerT är 0 längst ned och 1 högst upp. Värden utanför spåret är tryck mot ändstoppet.
// Spaken följer bara en kort fjäder och hoppar först när fingret passerat brytpunkten.
export function draHack(index, fingerT, opt) {
  const antal = opt.antal | 0;
  if (antal < 2) return {index: 0, visT: 0, passerade: [], andstopp: false, riktning: 0};
  const span = 1 / (antal - 1);
  const t = Number.isFinite(+fingerT) ? +fingerT : 0;
  let i = klamp(index | 0, 0, antal - 1);
  const start = i;
  const passerade = [];
  let andstopp = false;
  for (let guard = 0; guard < antal + 1; guard++) {
    const hem = i * span;
    const delta = t - hem;
    const abs = Math.abs(delta);
    if (abs < 1e-8) break;
    const riktning = delta > 0 ? 1 : -1;
    const nasta = i + riktning;
    const vidKant = nasta < 0 || nasta >= antal;
    const grans = span * (vidKant ? opt.andstopp : opt.bryt);
    if (abs < grans) {
      if (vidKant && abs >= span * opt.andstoppKansla) andstopp = true;
      break;
    }
    if (vidKant) {
      andstopp = true;
      break;
    }
    i = nasta;
    passerade.push(i);
  }
  const hem = i * span;
  const vidAnde = i === 0 || i === antal - 1;
  const fjader = span * (vidAnde ? opt.andstoppFjader : opt.fjader);
  const visT = hem + klamp(t - hem, -fjader, fjader);
  const riktning = passerade.length ? Math.sign(i - start) : 0;
  return {index: i, visT, passerade, andstopp, riktning};
}

export function slappHack(index, antal) {
  const n = antal | 0;
  const i = klamp(index | 0, 0, Math.max(0, n - 1));
  return {index: i, visT: n > 1 ? i / (n - 1) : 0, passerade: [], andstopp: false, riktning: 0};
}

// Gasandel 0..1 gånger växelns kvot. Neutral är alltid stilla.
export function drivKommando(index, gasAndel) {
  const i = klamp(index | 0, 0, VAXLAR.length - 1);
  const g = klamp(Number(gasAndel) || 0, 0, 1);
  return VAXLAR[i].kvot * g;
}

export function sjalvtest() {
  const fel = [];
  const krav = (namn, ok) => { if (!ok) fel.push(namn); };
  const procent = MEKANIK.gasSteg * 100;
  krav('gashacket ligger mellan 6 och 8 procent', procent > 6 && procent < 8);
  krav('tomgång och full gas är egna steg', gasVarde(0) === 0 && Math.abs(gasVarde(gasAntal() - 1) - 1) < 1e-9);
  krav('hackpulsen är 8–18 ms', MEKANIK.hackPulsMs >= 8 && MEKANIK.hackPulsMs <= 18);
  krav('växelpulsen är 25–35 ms', MEKANIK.vaxelPulsMs >= 25 && MEKANIK.vaxelPulsMs <= 35);
  krav('ändstoppet är 25–35 ms', MEKANIK.andstoppPulsMs >= 25 && MEKANIK.andstoppPulsMs <= 35);

  const hem = 0.2;
  const span = 0.2;
  const fast = draHack(1, hem + span * 0.5, vaxelOpt());
  krav('växelspaken tar emot före spärren', fast.index === 1 && fast.passerade.length === 0);
  krav('spaken fjädrar bara en bit', Math.abs(fast.visT - (hem + span * MEKANIK.vaxelFjader)) < 1e-6 && fast.visT < hem + span * 0.5 - 0.01);
  const hall = draHack(1, 0.33, vaxelOpt());
  const genom = draHack(1, 0.36, vaxelOpt());
  krav('spärren håller under brytpunkten', hall.index === 1 && hall.passerade.length === 0);
  krav('spärren släpper in i nästa växel', genom.index === 2 && genom.passerade.join() === '2' && genom.riktning === 1);
  const grind = draHack(1, 1, vaxelOpt());
  krav('ett svep passerar grindarna i ordning', grind.passerade.join() === '2,3,4,5' && grind.andstopp === false);
  const backKant = draHack(0, -0.3, vaxelOpt());
  krav('R är ett ändläge', backKant.index === 0 && backKant.passerade.length === 0 && backKant.andstopp);
  const slapp = slappHack(genom.index, VAXLAR.length);
  krav('släpp snäpper in i läget', slapp.visT === slapp.index / (VAXLAR.length - 1));

  const gas = gasOpt();
  const tander = draHack(0, 1, gas);
  krav('gassvep passerar varje tand', tander.passerade.length === gasAntal() - 1 && tander.passerade.every((v, i) => v === i + 1) && tander.andstopp === false);
  const tidig = draHack(0, MEKANIK.gasSteg * MEKANIK.gasBryt * 0.9, gas);
  krav('gastanden håller', tidig.index === 0 && tidig.passerade.length === 0);
  const klick = draHack(0, MEKANIK.gasSteg * MEKANIK.gasBryt + 0.002, gas);
  krav('gastanden släpper till nästa steg', klick.index === 1 && klick.passerade.join() === '1');
  const v = gasVarde(klick.index);
  krav('gasen ligger på ett hack', Math.abs(v / MEKANIK.gasSteg - Math.round(v / MEKANIK.gasSteg)) < 1e-6);
  const full = draHack(gasAntal() - 1, 1 + MEKANIK.gasSteg * MEKANIK.gasAndstoppKansla + 0.01, gas);
  krav('full gas är ett tyngre stopp', full.index === gasAntal() - 1 && full.passerade.length === 0 && full.andstopp);
  const tom = draHack(0, -(MEKANIK.gasSteg * MEKANIK.gasAndstoppKansla + 0.01), gas);
  krav('tomgång är ett tyngre stopp', tom.index === 0 && tom.andstopp);

  krav('backkvoten följer backgasen', VAXLAR[vaxelFranId('R')].kvot === -BACKGAS);
  krav('neutral ger ingen drivning', drivKommando(vaxelFranId('N'), 1) === 0);
  const fyran = drivKommando(vaxelFranId('4'), 1);
  const halvfart = drivKommando(vaxelFranId('4'), 0.5);
  const ettan = drivKommando(vaxelFranId('1'), 1);
  krav('fyran är toppfart och gasen skalar', fyran === 1 && Math.abs(halvfart - 0.5) < 1e-9);
  krav('ettan är långsammare än fyran', ettan > 0 && ettan < fyran);
  const tro = ordnaTrosklar(STANDARD.trosklar, STANDARD.axlar.styra.full);
  const fram = bandMal(fyran, 0, tro);
  const lag = bandMal(ettan, 0, tro);
  const still = bandMal(drivKommando(vaxelFranId('N'), 1), 0, tro);
  const back = bandMal(drivKommando(vaxelFranId('R'), 1), 0, tro);
  krav('växeln ändrar bandens mål', fram.vanster > lag.vanster && lag.vanster > 0 && Math.abs(still.vanster) < 1e-6 && back.vanster < 0);
  const vagn = skapaVagn();
  for (let i = 0; i < 40; i++) stegaVagn(vagn, lag, 0.05);
  const efterEttan = vagn.fart;
  for (let i = 0; i < 40; i++) stegaVagn(vagn, fram, 0.05);
  krav('högre växel ökar farten', efterEttan > 1 && vagn.fart > efterEttan + 1 && vagn.z < -1);
  return fel;
}
