import { traffSlag } from '../js/traff.js';
const fel = [];
const k = (n, v) => v || fel.push(n);
k('mark', traffSlag('mark', 1) === 'mark');
k('sand är mark', traffSlag('sand', 0.2) === 'mark');
k('uppåtriktad normal är mark', traffSlag('annat', 0.9) === 'mark');
k('vägg', traffSlag('vagg', 0.1) === 'vagg');
k('metall', traffSlag('metall', 0.2) === 'metall');
k('annat', traffSlag('kropp', 0.1) === 'annat');
if (fel.length) { console.error(fel.join('\n')); process.exit(1); }
console.log('traff-ok');
