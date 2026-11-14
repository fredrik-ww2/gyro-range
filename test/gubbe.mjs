import {
  VERSION, standardInstallningar, sammanfoga, vinklarFranOrientering, fartUrGyro, derivat,
  bearbetaAxel, nyttAxelTillstand, forstarka, skapaFart, skapaGester, fartFramAv,
  sidoFart, stegPosition, visaNamn, bytLage, sikteRiktning, skapaJamnhet, skapaBrus,
  ryckighet, skapaSkak, skakSteg, hoppMark, K_LUGN, PACE
} from '../gubbe-test/logik.js';
import { beskrivMetod, skapaHaptik, skakIntervall } from '../gubbe-test/haptik.js';
import { readFileSync } from 'node:fs';

const fel = [];
const k = (n, v) => v || fel.push(n);
const noll = { alpha: 0, beta: 90, gamma: 0 };
const uppratt = { alpha: 0, beta: 90, gamma: 0, screen: 0 };

k('version', VERSION === 'Gubbtest 01');

const toppBort = vinklarFranOrientering(0, 70, 0, noll, 0);
const toppMot = vinklarFranOrientering(0, 110, 0, noll, 0);
k('topp bort är fram', toppBort.fram > 10 && toppBort.upp < -10);
k('topp mot är bak', toppMot.fram < -10 && toppMot.upp > 10);
k('höger är plus', vinklarFranOrientering(-20, 90, 0, noll, 0).yaw > 10);
k('vänster är minus', vinklarFranOrientering(20, 90, 0, noll, 0).yaw < -10);
for (const v of [0, 90, 180, 270]) {
  k('yaw höger ' + v, vinklarFranOrientering(-20, 90, 0, noll, v).yaw > 10);
  k('yaw vänster ' + v, vinklarFranOrientering(20, 90, 0, noll, v).yaw < -10);
}
k('landskap upp', vinklarFranOrientering(0, 90, -20, noll, 90).upp > 10);
k('högerkant ned', vinklarFranOrientering(0, 90, 20, noll, 0).roll > 10);

const ratt = fartUrGyro(uppratt, { alpha: 0, beta: 0, gamma: -30 });
const vanster = fartUrGyro(uppratt, { alpha: 0, beta: 0, gamma: 30 });
k('gyro höger', ratt.yaw > 20);
k('gyro vänster', vanster.yaw < -20);
k('gyro inte spegel', ratt.yaw > 0 && vanster.yaw < 0 && Math.sign(ratt.yaw) !== Math.sign(vanster.yaw));
k('gyro topp bort', fartUrGyro(uppratt, { beta: -25 }).fram > 15);
k('gyro topp mot', fartUrGyro(uppratt, { beta: 25 }).upp > 15 && fartUrGyro(uppratt, { beta: 25 }).fram < -15);
k('gyro roll', fartUrGyro(uppratt, { alpha: -20 }).roll > 10);
k('pitch och yaw blandas inte', Math.abs(fartUrGyro(uppratt, { beta: 30 }).yaw) < 5);
k('landskap fart upp', fartUrGyro({ ...uppratt, screen: 90 }, { gamma: -30 }).upp > 15);
const yawHopp = derivat({ upp: 0, fram: 0, yaw: 179, roll: 0 }, { upp: 0, fram: 0, yaw: -179, roll: 0 }, 0.1);
k('yaw-wrap runt noll', yawHopp.yaw > 10 && yawHopp.yaw < 40);

const lin = forstarka(10, 1, 0);
const starkLiten = forstarka(10, 1, 2);
const starkStor = forstarka(25, 1, 2);
k('linjär', Math.abs(lin - 10) < 1e-6);
k('stark slår hårdare på stor rörelse', starkStor / 25 > starkLiten / 10 * 1.5);

const st = nyttAxelTillstand();
const bas = { kanslighet: 1, forstarkning: 0, utjamning: 0, dodzon: 4, pa: true };
k('dödzon', bearbetaAxel(st, 3, 0.016, bas) === 0);
k('dödzon kvar', Math.abs(bearbetaAxel(st, 10, 0.016, bas) - 6) < 1e-6);
const mjuk = nyttAxelTillstand();
k('utjämning', Math.abs(bearbetaAxel(mjuk, 20, 0.016, { ...bas, dodzon: 0, utjamning: 1 })) < 8);
k('sida av', bearbetaAxel(nyttAxelTillstand(), 30, 0.016, { ...bas, pa: false, dodzon: 0 }) === 0);

const fart = skapaFart();
fart.steg(0, 10);
k('liten lut startar gång', fart.steg(0.1, 10) === 1 && PACE[1].namn === 'Går');
k('neutral behåller', fart.steg(0.3, 0) === 1);
fart.steg(0.4, 40);
k('hårdare blir spring', fart.steg(0.5, 40) === 3);
k('fortfarande spring i neutral', fart.steg(0.7, 1) === 3);
k('en broms', fart.steg(0.8, -12) === 2);
k('hållen broms tar inte två', fart.steg(0.9, -12) === 2);
fart.steg(1.1, 0);
k('andra bromsen', fart.steg(1.2, -12) === 1);
fart.steg(1.4, 0);
k('tredje bromsen står', fart.steg(1.5, -12) === 0);
k('långsam lut blir inte gest', (() => { const g = skapaGester(); return g.steg(0, 40, 320, 320) === null && g.steg(1, -40, 320, 320) === null; })());
const g = skapaGester();
k('knyck ner', g.steg(0, 400, 320, 320) === 'ner');
k('cooldown', g.steg(0.2, -400, 320, 320) === null);
k('knyck upp', g.steg(0.7, -400, 320, 320) === 'hopp');

k('ligger står still', fartFramAv({ pace: 2, knappFram: false, knappBak: false, ligger: true }) === 0);
k('knapp fram', fartFramAv({ pace: 0, knappFram: true, knappBak: false, ligger: false }) === 1.35);
k('bak vinner', fartFramAv({ pace: 3, knappFram: false, knappBak: true, ligger: false }) < 0);
k('sida noll', sidoFart(0) === 0);
k('sida höger', sidoFart(25) > 0 && sidoFart(-25) < 0);
const rakt = stegPosition({ x: 0, z: 0 }, 0, 1, 2, 0);
k('framåt minskar z', rakt.z < -1 && Math.abs(rakt.x) < 1e-6);
const hoger = stegPosition({ x: 0, z: 0 }, Math.PI / 2, 1, 2, 0);
k('sväng höger går åt +x', hoger.x > 1);
k('namn', visaNamn({ ligger: false, hoppar: false, fram: 1, pace: 2, sida: 0 }) === 'Går fort');
k('namn ligger', visaNamn({ ligger: true, hoppar: false, fram: 0, pace: 0, sida: 0 }) === 'Ligger');
const tillSikte = bytLage('ga');
k('till sikte stannar', tillSikte.lage === 'sikta' && tillSikte.pace === 0 && tillSikte.ligger === false);
k('tillbaka står', bytLage('sikta').lage === 'ga' && bytLage('sikta').pace === 0);

const a1 = sikteRiktning(12, -8, 0, { x: 0, y: 0 });
const a2 = sikteRiktning(12, -8, 0, { x: 0, y: 0 });
k('sikte absolut', a1.yaw === a2.yaw && a1.pitch === a2.pitch && a1.pitch < 0 && a1.yaw > 0);
k('sikte skak adderas', Math.abs(sikteRiktning(0, 0, 0, { x: 0.01, y: -0.02 }).pitch + 0.02) < 1e-9);

const jamn = skapaJamnhet(0.4);
for (let i = 0; i < 20; i++) jamn.lagg(i * 0.02, { vrid: 80, fram: 0, sida: 0 });
const stadig = jamn.las();
k('jämn fart har låg spridning', stadig.vrid.std < 0.01 && Math.abs(stadig.vrid.medel - 80) < 1e-6);
const ryck = skapaJamnhet(0.4);
for (let i = 0; i < 20; i++) ryck.lagg(i * 0.02, { vrid: i % 2 ? 40 : -40, fram: 0, sida: 0 });
k('ryckig fart har hög spridning', ryck.las().vrid.std > 30);
k('känslighet tar med mindre skillnad', ryckighet(6, 1, 3) > ryckighet(6, 1, 0.5));
k('under brus är jämn', ryckighet(1, 1.2, 3) === 0);

const brus = skapaBrus();
const matt = { vrid: { std: 1.5, n: 10 }, fram: { std: 1.5, n: 10 }, sida: { std: 1.5, n: 10 } };
for (let i = 0; i < 8; i++) brus.lagg(matt);
k('brus mäts', brus.tystast() != null && brus.tystast() < 2);
const tyst = { vrid: { std: 0.4, n: 10 }, fram: { std: 0.4, n: 10 }, sida: { std: 0.4, n: 10 } };
for (let i = 0; i < 6; i++) brus.lagg(tyst);
k('tystare sänker golvet', brus.tystast() < 0.8);

const sk = skapaSkak();
const stilla = skakSteg(sk, 0, 0.016, 0, { kanslighet: 1, maxSkak: 1.2, maxLugning: 2 });
k('stilla skakar inte', stilla.niva === 0 && stilla.x === 0);
const hog = skapaSkak();
const spik = skakSteg(hog, 0, 0.016, 40, { kanslighet: 1, maxSkak: 1.2, maxLugning: 2 });
k('ryck skakar', spik.niva > 0.5);
k('mycket ryck tar max tid', Math.abs(spik.lugn - 2) < 1e-6);
const liten = skapaSkak();
const milt = skakSteg(liten, 0, 0.016, 8, { kanslighet: 1, maxSkak: 1.2, maxLugning: 2 });
k('milt går över fortare', milt.lugn < 0.6 && Math.abs(milt.lugn - K_LUGN * 8) < 1e-6);
k('taket respekteras', skakSteg(skapaSkak(), 0, 0.016, 200, { kanslighet: 1, maxSkak: 1.2, maxLugning: 1 }).lugn <= 1);
let niva = spik.niva;
const senare = skakSteg(hog, 1, 0.016, 0, { kanslighet: 1, maxSkak: 1.2, maxLugning: 2 });
k('skak klingar av', senare.niva < niva * 0.7 && senare.niva > 0);
k('skak slut', skakSteg(hog, 2.05, 0.016, 0, { kanslighet: 1, maxSkak: 1.2, maxLugning: 2 }).niva === 0);
k('jämn fart efteråt är tyst', skakSteg(skapaSkak(), 1, 0.016, 0, { kanslighet: 3, maxSkak: 2, maxLugning: 2 }).niva === 0);

const land = hoppMark(0.05, -2, 0.05);
k('landning', land.land && land.y === 0 && land.vy === 0);
k('står inte landar', hoppMark(0, 0, 0.016).land === false);

k('iphone metod', beskrivMetod({ userAgent: 'iPhone', vibrate: () => true }).id === 'brytare');
k('android metod', beskrivMetod({ userAgent: 'Android', vibrate(n) { return n === 0; } }).id === 'vibrate');
let klick = 0, vib = 0;
const h = skapaHaptik(
  { querySelector: () => ({ click() { klick++; } }) },
  { userAgent: 'iPhone' },
  () => klick + vib
);
k('iphone klickar brytare', h.tick() && klick === 1);
h.pa = false;
k('haptik av', h.tick() === false);
const ha = skapaHaptik(
  { querySelector: () => ({ click() {} }) },
  { userAgent: 'Android', vibrate(n) { if (n > 0) vib++; return true; } },
  (() => { let n = 0; return () => ++n * 100; })()
);
k('android vibrerar', ha.tick() && vib === 1);
k('intervall', skakIntervall(0, 1) === 0 && skakIntervall(1, 1) < skakIntervall(0.2, 1));

const html = readFileSync(new URL('../gubbe-test/index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../gubbe-test/stil.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../gubbe-test/main.js', import.meta.url), 'utf8');
for (const s of ['Gubbtest 01', 'Starta', 'Nollställ', 'Gå', 'Sikta', 'Res dig', 'Följer läget', 'Bara när den rör sig', 'Känslighet', 'Fartförstärkning', 'Utjämning', 'Dödzon', 'Kasta sig ner', 'Hoppa', 'Skakkänslighet', 'Max skakning', 'Max lugningstid', 'Haptik', 'Standard', 'Jämn', 'Ryckig']) {
  k('text ' + s, (html + main).includes(s));
}
k('ingen hakkors', !/卐|卍|swastika/i.test(html + css + main));
k('behörighet återanvänds', main.includes('requestMotionPermission'));
k('rotationRate', main.includes('rotationRate'));
k('två lägen', main.includes("lage === 'sikta'") || main.includes("lage==='sikta'"));
const sparad = sammanfoga({ ga: { vrid: { kanslighet: 9, lage: 'fart', dodzon: -3 }, nerDps: 10 }, haptik: false, jamnKanslighet: 2.5 });
k('sparade värden kläms', sparad.ga.vrid.kanslighet === 3 && sparad.ga.vrid.lage === 'fart' && sparad.ga.vrid.dodzon === 0 && sparad.ga.nerDps === 120 && sparad.haptik === false && sparad.jamnKanslighet === 2.5);
k('standard har sidled av', standardInstallningar().ga.sida.pa === false && standardInstallningar().sikta.maxLugning === 2);

if (fel.length) { console.error(fel.join('\n')); process.exit(1); }
console.log('gubbe-ok');
