import { arOmslag, nyNollRiktning, tolkaOrientering, wrapDeg } from '../js/riktning.js';
const noll = { alpha: 0, beta: 90, gamma: 0 };
const fel = [];
const k = (n, v) => v || fel.push(n);
for (const vinkel of [0, 90, 180, 270]) {
  k('höger ' + vinkel, tolkaOrientering(-20, 90, 0, noll, vinkel).yaw > 0.2);
  k('vänster ' + vinkel, tolkaOrientering(20, 90, 0, noll, vinkel).yaw < -0.2);
}
k('upp 0', tolkaOrientering(0, 110, 0, noll, 0).pitch > 0.2);
k('ner 0', tolkaOrientering(0, 70, 0, noll, 0).pitch < -0.2);
k('upp 90', tolkaOrientering(0, 90, -20, noll, 90).pitch > 0.2);
k('ner 90', tolkaOrientering(0, 90, 20, noll, 90).pitch < -0.2);
k('upp 180', tolkaOrientering(0, 70, 0, noll, 180).pitch > 0.2);
k('upp 270', tolkaOrientering(0, 90, 20, noll, 270).pitch > 0.2);
k('roll 0', tolkaOrientering(0, 90, 20, noll, 0).roll > 0.2);
k('roll 90', tolkaOrientering(0, 110, 0, noll, 90).roll > 0.2);
k('roll 180', tolkaOrientering(0, 90, -20, noll, 180).roll > 0.2);
k('roll 270', tolkaOrientering(0, 70, 0, noll, 270).roll > 0.2);
{
  const over = tolkaOrientering(2, 90, 0, { alpha: 358, beta: 90, gamma: 0 }, 0);
  k('alpha 358 till 2 är fyra grader', Math.abs(Math.abs(over.yaw) * 180 / Math.PI - 4) < 0.05 && Math.abs(over.pitch) < 0.02);
  k('beta över ±180', Math.abs(wrapDeg(-170 - 170) - 20) < 1e-6);
  const fore = { alpha: 0, beta: 45, gamma: 89 };
  const alias = { alpha: 180, beta: 135, gamma: -90 };
  const hall = tolkaOrientering(fore.alpha, fore.beta, fore.gamma, noll, 0);
  k('omslag upptäcks', arOmslag(fore, alias));
  k('vanlig rörelse är inget omslag', !arOmslag(noll, { alpha: -20, beta: 90, gamma: 0 }));
  const ny = nyNollRiktning(alias, hall, 0);
  const efter = tolkaOrientering(alias.alpha, alias.beta, alias.gamma, ny, 0);
  k('omslag behåller utslaget', Math.abs(efter.pitch - hall.pitch) < 0.02 && Math.abs(efter.yaw - hall.yaw) < 0.02 && Math.abs(efter.roll - hall.roll) < 0.02);
  for (const v of [0, 90, 180, 270]) {
    const a = tolkaOrientering(-15, 100, 8, noll, v);
    const b = nyNollRiktning({ alpha: -15, beta: 100, gamma: 8 }, a, v);
    const c = tolkaOrientering(-15, 100, 8, b, v);
    k('noll går att återskapa ' + v, Math.abs(c.pitch - a.pitch) < 1e-6 && Math.abs(c.yaw - a.yaw) < 1e-6 && Math.abs(c.roll - a.roll) < 1e-6);
  }
}
if (fel.length) { console.error(fel.join('\n')); process.exit(1); }
console.log('riktning-ok');
