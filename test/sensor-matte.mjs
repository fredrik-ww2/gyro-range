import { arDold, skarmGrader } from '../shared/sensor.js';
import { arOmslag, tolkaOrientering } from '../js/riktning.js';

const fel = [];
const k = (n, v) => v || fel.push(n);
const noll = { alpha: 0, beta: 90, gamma: 0 };

k('skärm 0', skarmGrader({ screen: { orientation: { angle: 0 } }, orientation: -90 }) === 0);
k('window.orientation −90 är 270', skarmGrader({ orientation: -90 }) === 270);
k('angle 270', skarmGrader({ screen: { orientation: { angle: 270 } }, orientation: -90 }) === 270);
k('angle 90', skarmGrader({ screen: { orientation: { angle: 90 } } }) === 90);
k('angle 180', skarmGrader({ screen: { orientation: { angle: 180 } } }) === 180);
k('ogiltig vinkel', skarmGrader({ orientation: NaN }) === 0);
k('dold flik', arDold({ document: { hidden: true } }) === true);
k('synlig flik', arDold({ document: { hidden: false } }) === false);

for (const v of [0, 90, 180, 270]) {
  const hoger = tolkaOrientering(-20, 90, 0, noll, v);
  const upp = v === 0 || v === 180
    ? tolkaOrientering(0, v === 180 ? 70 : 110, 0, noll, v)
    : tolkaOrientering(0, 90, v === 90 ? -20 : 20, noll, v);
  const roll = v === 0 ? tolkaOrientering(0, 90, 20, noll, 0)
    : v === 90 ? tolkaOrientering(0, 110, 0, noll, 90)
    : v === 180 ? tolkaOrientering(0, 90, -20, noll, 180)
    : tolkaOrientering(0, 70, 0, noll, 270);
  k('yaw höger ' + v, hoger.yaw > 0.2 && Math.abs(hoger.pitch) < 0.05);
  k('upp ' + v, upp.pitch > 0.2);
  k('roll ' + v, roll.roll > 0.2 && Math.abs(roll.yaw) < 0.05);
}

const hopp = tolkaOrientering(1, 90, 0, { alpha: 359, beta: 90, gamma: 0 }, 0);
k('359 till 1', Math.abs(Math.abs(hopp.yaw) * 180 / Math.PI - 2) < 0.05);
k('gamma-karta är omslag', arOmslag({ alpha: 0, beta: 45, gamma: 89 }, { alpha: 180, beta: 135, gamma: -90 }));
k('beta över kanten', Math.abs(tolkaOrientering(0, -170, 0, { alpha: 0, beta: 170, gamma: 0 }, 0).pitch * 180 / Math.PI - 20) < 0.2);

if (fel.length) {
  console.error(fel.join('\n'));
  process.exit(1);
}
console.log('sensor-matte ok', 4);
