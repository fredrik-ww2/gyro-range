// Styrning: axlar, gång med lutning, gester, skakning och menyn i en huvudlös webbläsare.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';
import {
  STANDARD_AXEL, skapaGyroMeny, behandlaAxel, skapaLager, skapaKryssning, skapaGester, skapaOjämnhet, graderPerSekund, haptikMetod, haptikText
} from '../js/gyroMeny.js';

const fel = [];
const k = (namn, villkor) => { if (!villkor) fel.push(namn); };
const nära = (a, b, t = 1e-6) => Math.abs(a - b) < t;
const D = Math.PI / 180;
const minne = () => ({ lage: 'foljer', integral: 0, jamnad: 0 });
const axel = (over) => ({ ...STANDARD_AXEL, ...over });

k('standardaxel är exakt', behandlaAxel(axel({}), 0.37, 80, 0.02, minne()) === 0.37);
k('känslighet 2', nära(behandlaAxel(axel({ kanslighet: 2 }), 0.2, 0, 0.016, minne()), 0.4, 1e-9));
k('känslighet 0,5', nära(behandlaAxel(axel({ kanslighet: 0.5 }), 0.2, 0, 0.016, minne()), 0.1, 1e-9));
k('dödzon nollar liten vinkel', behandlaAxel(axel({ dodzon: 5 }), 2 * D, 0, 0.016, minne()) === 0);
k('dödzon utan hopp', nära(behandlaAxel(axel({ dodzon: 5 }), 5.2 * D, 0, 0.016, minne()), 0.2 * D, 1e-6));
k('dödzon lämnar resten', nära(behandlaAxel(axel({ dodzon: 5 }), 12 * D, 0, 0.016, minne()), 7 * D, 1e-6));
{
  const lugn = behandlaAxel(axel({ fart: 3 }), 0.4, 15, 0.016, minne());
  const snabb = behandlaAxel(axel({ fart: 3 }), 0.4, 180, 0.016, minne());
  const linje = behandlaAxel(axel({ fart: 0 }), 0.4, 180, 0.016, minne());
  k('fart 0 är linjär', linje === 0.4);
  k('snabb rörelse ger mer', Math.abs(snabb) > Math.abs(lugn) * 2 && Math.abs(lugn) > 0.4);
}
{
  const m = minne();
  const a = axel({ utjamning: 1 });
  const ett = behandlaAxel(a, 1, 0, 0.016, m);
  k('utjämning börjar mjukt', ett > 0 && ett < 0.25);
  let v = ett;
  for (let i = 0; i < 400; i++) v = behandlaAxel(a, 1, 0, 0.016, m);
  k('utjämning når målet', nära(v, 1, 0.02));
}
{
  const m = minne();
  const a = axel({ lage: 'rorelse' });
  let y = behandlaAxel(a, 0, 90, 0.2, m);
  y = behandlaAxel(a, 0, 90, 0.2, m);
  const hall = y;
  y = behandlaAxel(a, 0.8, 0, 0.3, m);
  k('rate integrerar', hall > 0.5);
  k('rate driver inte tillbaka', y === hall);
  const tyst = behandlaAxel(axel({ lage: 'rorelse', dodzon: 10 }), 0.2, 4, 0.5, minne());
  k('dödzon på fart', nära(tyst, 0.2, 1e-9));
}
k('roll av', behandlaAxel(axel({ pa: false }), 0.5, 40, 0.016, minne()) === 0);
{
  const lager = skapaLager();
  const inst = skapaGyroMeny({ getItem: () => null, setItem() {} }).varden;
  const abs = { pitch: 0.2, yaw: -0.3, roll: 0.1 };
  k('standard lager rör inte', lager.vinklar('sikta', abs, { pitch: 10, yaw: 10, roll: 10 }, 0.016, inst) === null);
  inst.sikta.yaw.kanslighet = 2;
  const ut = lager.vinklar('sikta', abs, { pitch: 0, yaw: 0, roll: 0 }, 0.016, inst);
  k('bara ändrad axel', ut && ut.pitch === abs.pitch && ut.roll === abs.roll && nära(ut.yaw, abs.yaw * 2, 1e-9));
}
{
  const r = graderPerSekund({ alpha: -30, beta: 0, gamma: 0 }, 0);
  k('höger är positiv yaw', r.yaw === 30 && r.pitch === 0);
  const sid = graderPerSekund({ alpha: 0, beta: 10, gamma: 0 }, 90);
  k('liggande skärm flyttar beta till roll', nära(sid.pitch, 0, 1e-9) && nära(sid.roll, 10, 1e-6));
}
{
  const g = skapaKryssning();
  let s = g.steg(0, 0);
  k('kryss stilla', s.fart === 0 && s.pace === 0);
  s = g.steg(-8 * D, -15);
  k('lite framåt startar gång', s.pace === 1 && s.fart > 0.8 && s.fart < 3);
  s = g.steg(0, 0);
  k('noll håller gång', s.pace === 1 && nära(s.fart, 1.05, 0.02));
  s = g.steg(-22 * D, -140);
  k('hårdare är snabbare', s.pace === 2 && s.fart > 4.1);
  s = g.steg(0, 0);
  k('noll håller spring', s.pace === 2 && nära(s.fart, 4.1, 0.05));
  s = g.steg(12 * D, 40);
  k('bakåt ett steg', s.pace === 1 && s.andra);
  s = g.steg(0, 0);
  s = g.steg(12 * D, 40);
  k('bakåt till stopp', s.pace === 0 && s.fart === 0);
}
{
  const inst = { gestNer: true, gestUpp: true, gestNerTroskel: 480, gestUppTroskel: 480 };
  const g = skapaGester();
  k('vanlig lutning ingen gest', g.steg(140, 1, inst) === null && g.steg(-160, 1.2, inst) === null);
  k('snabb ned', g.steg(700, 1.4, inst) === 'ner');
  k('cooldown', g.steg(900, 1.6, inst) === null && g.steg(-900, 1.9, inst) === null);
  k('hopp efter cooldown', g.steg(-700, 2.5, inst) === 'upp');
  k('gester av', skapaGester().steg(900, 1, { ...inst, gestNer: false, gestUpp: false }) === null);
  k('bara hopp', skapaGester().steg(900, 1, { ...inst, gestNer: false }) === null);
}
{
  const jamn = skapaOjämnhet();
  const inst = { skak: true, skakKanslighet: 1, skakMax: 0.02, skakMaxTid: 2 };
  let sen = { amp: 0 };
  for (let i = 0; i < 40; i++) sen = jamn.steg(1.2, 0.016, inst);
  k('jämn rörelse skakar inte', sen.amp === 0);
  const hård = skapaOjämnhet();
  let topp = 0;
  for (let i = 0; i < 24; i++) topp = hård.steg(i % 2 ? 8 : 0, 0.016, inst);
  k('ryckig skakar', topp.amp > 0.015 && topp.tid > 1.5 && topp.tid <= 2);
  const mjuk = skapaOjämnhet();
  let mjukt = { tid: 0, amp: 0 };
  for (let i = 0; i < 24; i++) mjukt = mjuk.steg(i % 2 ? 0.35 : 0, 0.016, inst);
  k('mjukare lugnar fortare', mjukt.amp > 0 && mjukt.tid < topp.tid && mjukt.tid < 1.4);
  let tid = 0;
  let amp = mjukt.amp;
  while (amp > 0 && tid < 3) { tid += 0.05; amp = mjuk.steg(0.35, 0.05, inst).amp; }
  k('skakningen klingar av', amp === 0 && tid < 2);
  const tak = skapaOjämnhet();
  let kort = { tid: 0 };
  const takInst = { ...inst, skakMaxTid: 9 };
  for (let i = 0; i < 20; i++) kort = tak.steg(i % 2 ? 8 : 0, 0.016, takInst);
  k('max två sekunder', kort.tid <= 2);
  k('av ger ingen skak', skapaOjämnhet().steg(8, 0.016, { ...inst, skak: false }).amp === 0);
}
{
  const store = { v: null, getItem() { return this.v; }, setItem(_k, v) { this.v = v; } };
  const m = skapaGyroMeny(store);
  k('standard från start', m.arStandard() && m.varden.haptik === true && m.varden.gangLutning === false && m.varden.matvarden === false);
  m.varden.ga.pitch.kanslighet = 2.5;
  m.satt();
  k('sparad avvikelse', !m.arStandard());
  const igen = skapaGyroMeny(store);
  k('localStorage', igen.varden.ga.pitch.kanslighet === 2.5 && !igen.arStandard());
  igen.aterstall();
  k('standardknapp', igen.arStandard() && igen.varden.ga.pitch.kanslighet === 1);
  k('standard ligger kvar', skapaGyroMeny(store).arStandard());
}
k('haptikmetod', ['vibrate', 'ios-brytare'].includes(haptikMetod()) && haptikText(haptikMetod()).length > 8);
if (fel.length) { console.error(fel.join('\n')); process.exit(1); }
console.log('styrning-enhet-ok');

const puppeteer = createRequire(['/tmp/puppeteer-run/package.json'].find((p) => existsSync(p)))('puppeteer-core');
const ROT = '/agent/repos/gyro-range';
const BILD = '/opt/cursor/artifacts';
mkdirSync(BILD, { recursive: true });
const TYPER = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.m4a': 'audio/mp4', '.wasm': 'application/wasm' };
const http = await new Promise((res) => {
  const h = createServer(async (q, s) => {
    try {
      let p = decodeURIComponent(new URL(q.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      const f = normalize(join(ROT, p));
      s.writeHead(200, { 'content-type': TYPER[extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
      s.end(await readFile(f));
    } catch { s.writeHead(404); s.end(); }
  });
  h.listen(0, '127.0.0.1', () => res(h));
});
const webblasare = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const sida = await webblasare.newPage();
const errs = [];
sida.on('pageerror', (e) => errs.push(String(e)));
const krav = [];
const sov = (ms) => new Promise((r) => setTimeout(r, ms));
const port = http.address().port;

async function ratt() {
  await sida.evaluate(() => {
    window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: 0, beta: 90, gamma: 0, absolute: true }));
  });
  await sov(80);
  await sida.evaluate(() => document.getElementById('styrNoll').click());
  await sov(80);
}
await sida.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await sida.goto(`http://127.0.0.1:${port}/?v=34`, { waitUntil: 'domcontentloaded' });
await sida.evaluate(() => localStorage.clear());
await sida.reload({ waitUntil: 'domcontentloaded' });
await sida.waitForFunction(() => window.gyroGest && window.gyroStyr, { timeout: 30000 });
await sida.evaluate(() => document.getElementById('start').click());
await sida.waitForFunction(() => !document.getElementById('neutralPanel').hidden);
await sida.evaluate(() => {
  window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: 0, beta: 90, gamma: 0, absolute: true }));
});
await sov(120);
await sida.evaluate(() => document.getElementById('neutralKlar').click());
await sov(200);

const etikett = await sida.evaluate(() => document.getElementById('version').textContent);
if (!etikett.includes('Skjutbana 34')) krav.push('version ' + etikett);

const meny = await sida.evaluate(() => {
  const knapp = document.getElementById('styrKnapp');
  knapp.click();
  const panel = document.getElementById('styrPanel');
  const detaljer = [...panel.querySelectorAll('details')];
  const rubriker = detaljer.map((d) => d.querySelector('summary').textContent);
  const yaw = panel.querySelector('[data-axel="ga.yaw"]');
  const kans = yaw.querySelector('input[type=range]');
  const lage = [...yaw.querySelectorAll('.valj button')].map((b) => b.textContent);
  const roll = panel.querySelector('[data-axel="ga.roll"] input[type=checkbox]');
  const ios = document.getElementById('styrHaptic');
  const standard = document.getElementById('styrStandard');
  const noll = document.getElementById('styrNoll');
  const stil = getComputedStyle(standard);
  const reglage = getComputedStyle(kans);
  return {
    dold: panel.hidden,
    oppna: detaljer.filter((d) => d.open).length,
    antal: detaljer.length,
    rubriker,
    min: kans.min,
    max: kans.max,
    lage,
    roll: !!roll,
    switchAttr: ios?.hasAttribute('switch') && ios.type === 'checkbox',
    metod: document.getElementById('styrHaptikMetod')?.textContent || '',
    standard: standard?.textContent,
    noll: noll?.textContent,
    knappH: standard.getBoundingClientRect().height,
    sliderH: parseFloat(reglage.height),
    vikt: stil.fontWeight,
    haptik: document.getElementById('styrHaptikPa')?.checked,
    gang: document.getElementById('styrGang')?.checked,
    mat: document.getElementById('styrMat')?.checked
  };
});
if (meny.dold) krav.push('panelen dold');
if (meny.oppna !== 0) krav.push('grupper öppna ' + meny.oppna);
for (const namn of ['Gå', 'Sikta', 'Vrida', 'Luta fram/bak', 'Luta åt sidan', 'Gång', 'Skakning', 'Haptik', 'Mätvärden']) {
  if (!meny.rubriker.includes(namn)) krav.push('saknar ' + namn);
}
if (meny.min !== '0.5' || meny.max !== '3') krav.push('känslighet ' + meny.min + '-' + meny.max);
if (!meny.lage.includes('Följer läget') || !meny.lage.includes('Bara när den rör sig')) krav.push('läge ' + meny.lage.join(','));
if (!meny.roll) krav.push('roll saknar av');
if (!meny.switchAttr) krav.push('ios-switch saknas');
if (!/navigator\.vibrate|iOS-brytare/.test(meny.metod)) krav.push('metod ' + meny.metod);
if (meny.standard !== 'Standard' || meny.noll !== 'Nollställ') krav.push('knappar ' + meny.standard + meny.noll);
if (!(meny.knappH >= 48)) krav.push('liten knapp ' + meny.knappH);
if (!(meny.sliderH >= 36)) krav.push('litet reglage ' + meny.sliderH);
if (meny.haptik !== true || meny.gang !== false || meny.mat !== false) krav.push('standardbrytare ' + JSON.stringify(meny));
await sida.screenshot({ path: join(BILD, 'styrning-meny.png') });
await sida.evaluate(() => {
  const ga = [...document.querySelectorAll('#styrPanel > details, #styrRot > details')].find((d) => d.querySelector('summary')?.textContent === 'Gå') || document.querySelector('#styrRot details');
  ga.open = true;
  ga.querySelector('[data-axel="ga.yaw"]').open = true;
});
await sov(50);
await sida.screenshot({ path: join(BILD, 'styrning-axel.png') });
await sida.evaluate(() => document.getElementById('styrStang').click());
await sov(50);

const riktning = await sida.evaluate(async () => {
  const sov = (ms) => new Promise((r) => setTimeout(r, ms));
  const skicka = (alpha, beta, gamma) => window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha, beta, gamma, absolute: true }));
  document.getElementById('styrNoll').click();
  skicka(0, 90, 0);
  await sov(150);
  document.getElementById('styrNoll').click();
  await sov(100);
  skicka(-25, 90, 0);
  await sov(200);
  const hoger = window.gyroGest.läge();
  skicka(25, 90, 0);
  await sov(200);
  const vanster = window.gyroGest.läge();
  window.gyroStyr.meny.varden.sikta.pitch.kanslighet = 2;
  window.gyroStyr.meny.satt();
  document.getElementById('styrNoll').click();
  skicka(0, 90, 0);
  await sov(120);
  document.getElementById('styrNoll').click();
  window.gyroGest.vapen(2);
  skicka(0, 70, 0);
  await sov(200);
  const dubbel = window.gyroGest.läge();
  window.gyroStyr.meny.aterstall();
  window.gyroStyr.lager.noll();
  skicka(0, 70, 0);
  await sov(200);
  const enkel = window.gyroGest.läge();
  return { hoger: hoger.yaw, vanster: vanster.yaw, dubbel: dubbel.pitch, enkel: enkel.pitch, standard: window.gyroStyr.meny.arStandard(), sensor: window.gyroGest.sensor() };
});
if (!(riktning.hoger > 15)) krav.push('höger speglas eller saknas ' + JSON.stringify(riktning));
if (!(riktning.vanster < -15)) krav.push('vänster ' + JSON.stringify(riktning));
if (!(Math.abs(riktning.dubbel) > Math.abs(riktning.enkel) * 1.6)) krav.push('känslighet ' + JSON.stringify(riktning));
if (!riktning.standard) krav.push('återställningen tog inte');

await ratt();
const rate = await sida.evaluate(async () => {
  const sov = (ms) => new Promise((r) => setTimeout(r, ms));
  const m = window.gyroStyr.meny;
  m.varden.ga.yaw.lage = 'rorelse';
  m.varden.sikta.yaw.lage = 'rorelse';
  m.satt();
  window.gyroGest.vapen(0);
  document.getElementById('styrNoll').click();
  const skicka = (rate, acc) => {
    let e;
    try { e = new DeviceMotionEvent('devicemotion', { acceleration: acc, accelerationIncludingGravity: { x: 0, y: 9.8, z: 0 }, rotationRate: rate, interval: 16 }); }
    catch {
      e = new Event('devicemotion');
      Object.defineProperty(e, 'rotationRate', { value: rate });
      Object.defineProperty(e, 'acceleration', { value: acc });
      Object.defineProperty(e, 'interval', { value: 16 });
    }
    window.dispatchEvent(e);
  };
  const nollAcc = { x: 0, y: 0, z: 0 };
  const start = performance.now();
  const prov = [];
  while (performance.now() - start < 900) {
    skicka({ alpha: -50, beta: 0, gamma: 0 }, nollAcc);
    await new Promise((r) => requestAnimationFrame(r));
    const t = performance.now() - start;
    if (prov.length === 0 || t - prov[prov.length - 1].t > 200) prov.push({ t: Math.round(t), yaw: window.gyroGest.läge().yaw, rot: window.gyroGest.sensor().rot });
  }
  const efter = window.gyroGest.läge().yaw;
  const hallStart = performance.now();
  while (performance.now() - hallStart < 250) { skicka({ alpha: 0, beta: 0, gamma: 0 }, nollAcc); await new Promise((r) => requestAnimationFrame(r)); }
  const hall = window.gyroGest.läge().yaw;
  const accStart = performance.now();
  while (performance.now() - accStart < 250) { skicka({ alpha: 0, beta: 0, gamma: 0 }, { x: 9, y: 4, z: -3 }); await new Promise((r) => requestAnimationFrame(r)); }
  const acc = window.gyroGest.läge().yaw;
  m.aterstall();
  window.gyroStyr.lager.noll();
  return { efter, hall, acc, prov };
});
if (!(rate.efter > 12)) krav.push('rate integrerar inte ' + JSON.stringify(rate));
if (Math.abs(rate.hall - rate.efter) > 2) krav.push('rate glider tillbaka ' + JSON.stringify(rate));
if (Math.abs(rate.acc - rate.hall) > 1.5) krav.push('acceleration integreras ' + JSON.stringify(rate));

await ratt();
const gang = await sida.evaluate(async () => {
  const sov = (ms) => new Promise((r) => setTimeout(r, ms));
  const skicka = (beta) => window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: 0, beta, gamma: 0, absolute: true }));
  window.gyroGest.vapen(0);
  window.gyroStyr.meny.varden.gangLutning = true;
  window.gyroStyr.meny.satt();
  document.getElementById('styrNoll').click();
  skicka(90);
  await sov(120);
  const fore = window.gyroGest.läge().z;
  const a = performance.now();
  while (performance.now() - a < 400) { skicka(78); await new Promise((r) => requestAnimationFrame(r)); }
  const mitt = window.gyroGest.läge().z;
  const b = performance.now();
  while (performance.now() - b < 400) { skicka(90); await new Promise((r) => requestAnimationFrame(r)); }
  const efter = window.gyroGest.läge();
  window.gyroStyr.meny.aterstall();
  window.gyroStyr.lager.noll();
  return { fore, mitt, efter: efter.z, pace: efter.pace };
});
if (!(gang.mitt < gang.fore - 0.15)) krav.push('lutning startar inte gång ' + JSON.stringify(gang));
if (!(gang.efter < gang.mitt - 0.15)) krav.push('kryss stannar ' + JSON.stringify(gang));

await ratt();
const gest = await sida.evaluate(async () => {
  const skicka = (beta) => window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: 0, beta, gamma: 0, absolute: true }));
  const g = window.gyroGest;
  g.satt('stallning.grans_dps', 4000);
  g.vapen(0);
  g.sätt('staende');
  const m = window.gyroStyr.meny;
  m.varden.gestNer = true;
  m.varden.gestNerTroskel = 480;
  m.varden.gestUpp = true;
  m.varden.gestUppTroskel = 480;
  m.satt();
  document.getElementById('styrNoll').click();
  let beta = 90;
  for (let i = 0; i < 8; i++) { beta -= 1.2; skicka(beta); await new Promise((r) => requestAnimationFrame(r)); }
  const lugn = g.läge().stallning;
  skicka(beta - 28);
  await new Promise((r) => setTimeout(r, 180));
  const nere = g.läge().stallning;
  g.sätt('staende');
  document.getElementById('styrNoll').click();
  await new Promise((r) => setTimeout(r, 900));
  skicka(90);
  await new Promise((r) => requestAnimationFrame(r));
  skicka(90 + 28);
  await new Promise((r) => setTimeout(r, 180));
  const hopp = g.läge().hopp;
  m.aterstall();
  window.gyroStyr.lager.noll();
  return { lugn, nere, hopp };
});
if (gest.lugn !== 'staende') krav.push('vanlig lutning fällde ' + JSON.stringify(gest));
if (gest.nere !== 'liggande') krav.push('knyck ned ' + JSON.stringify(gest));
if (!(gest.hopp > 0.05)) krav.push('knyck upp ' + JSON.stringify(gest));

const mat = await sida.evaluate(async () => {
  document.getElementById('styrKnapp').click();
  const rot = document.getElementById('styrRot');
  const grupp = [...rot.querySelectorAll('details')].find((d) => d.querySelector(':scope > summary')?.textContent === 'Mätvärden');
  grupp.open = true;
  document.getElementById('styrMat').click();
  window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: -12, beta: 80, gamma: 4, absolute: true }));
  await new Promise((r) => setTimeout(r, 200));
  const el = document.getElementById('matvarden');
  const text = el.textContent;
  document.getElementById('styrStang').click();
  return { dold: el.hidden, text };
});
if (mat.dold || !/pitch -?\d/.test(mat.text) || !/rot α/.test(mat.text)) krav.push('mätvärden ' + JSON.stringify(mat));
await sida.screenshot({ path: join(BILD, 'styrning-mat.png') });

const sparad = await sida.evaluate(() => {
  const m = window.gyroStyr.meny;
  m.varden.ga.yaw.kanslighet = 2;
  m.satt();
  return localStorage.getItem('gyro_styr_meny_v1');
});
if (!sparad || !sparad.includes('"kanslighet":2')) krav.push('sparas inte ' + sparad);
await sida.reload({ waitUntil: 'domcontentloaded' });
await sida.waitForFunction(() => window.gyroStyr, { timeout: 30000 });
const igen = await sida.evaluate(async () => {
  document.getElementById('styrKnapp').click();
  const falt = document.querySelector('[data-axel="ga.yaw"] input[type=range]');
  const fore = window.gyroStyr.meny.varden.ga.yaw.kanslighet;
  document.getElementById('styrStandard').click();
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  return { fore, efter: window.gyroStyr.meny.varden.ga.yaw.kanslighet, standard: window.gyroStyr.meny.arStandard(), falt: falt.value, dold: document.getElementById('matvarden').hidden };
});
if (igen.fore !== 2 || igen.efter !== 1 || !igen.standard || !igen.dold) krav.push('standard ' + JSON.stringify(igen));
if (Math.abs(Number(igen.falt) - 1) > 0.01) krav.push('reglage ' + igen.falt);
await sida.evaluate(() => document.getElementById('styrStang').click());
await sida.evaluate(() => {
  document.getElementById('start').click();
});
await sida.waitForFunction(() => !document.getElementById('neutralPanel').hidden);
await sida.evaluate(() => {
  window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: 0, beta: 90, gamma: 0, absolute: true }));
  document.getElementById('neutralKlar').click();
});
await sov(250);
await sida.screenshot({ path: join(BILD, 'styrning-knapp.png') });

if (errs.length) krav.push('konsol ' + errs.slice(0, 3).join(' | '));
console.log(JSON.stringify({ krav, etikett, meny: { metod: meny.metod, knappH: meny.knappH }, riktning, rate, gang, gest, mat: mat.text, igen }, null, 2));
await webblasare.close();
http.close();
if (krav.length) process.exit(1);
console.log('styrning-ok');
