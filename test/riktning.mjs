import { tolkaOrientering } from '../js/riktning.js';
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
if (fel.length) { console.error(fel.join('\n')); process.exit(1); }
console.log('riktning-ok');
