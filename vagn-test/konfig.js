// Finjustera hack, spärrar och ljudnivåer här.
// Andelar är av avståndet mellan två lägen om inget annat står.

import {BACKGAS} from './styr.js?v=4';

export const MEKANIK = {
  // Växelspak, R–N–1–2–3–4. Högre bryt = trögare att lämna läget.
  vaxelFjader: 0.30,
  vaxelBryt: 0.72,
  vaxelAndstoppFjader: 0.18,
  vaxelAndstoppKansla: 0.55,
  vaxelAndstopp: 2,
  // Gas. 1/14 ≈ 7,1 % mellan hacken, och både 0 % och 100 % är egna steg.
  gasSteg: 1 / 14,
  gasFjader: 0.34,
  gasBryt: 0.78,
  gasAndstoppFjader: 0.16,
  gasAndstoppKansla: 0.70,
  gasAndstopp: 2,
  // Haptik i millisekunder. Kort puls per gashack, längre vid växel och ändstopp.
  hackPulsMs: 12,
  vaxelPulsMs: 30,
  andstoppPulsMs: 32
};

export const LJUD = {
  maxRoster: 8,
  takDbtp: -1,
  takKurvaDb: -2.2,
  master: 0.9,
  vaxel: 0.92,
  hack: 0.64,
  stopp: 0.9,
  klick: 0.7,
  ladd: 0.88
};

// Kvot är andel av toppfarten. Back använder samma tak som den gamla backgasen.
export const VAXLAR = [
  {id: 'R', namn: 'R', text: 'Back', kvot: -BACKGAS},
  {id: 'N', namn: 'N', text: 'Neutral', kvot: 0},
  {id: '1', namn: '1', text: '1:a', kvot: 0.28},
  {id: '2', namn: '2', text: '2:a', kvot: 0.48},
  {id: '3', namn: '3', text: '3:e', kvot: 0.72},
  {id: '4', namn: '4', text: '4:e', kvot: 1}
];
