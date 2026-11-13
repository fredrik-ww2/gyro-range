// Panorama: spak, ställning, gester, sikte, ljud, hus och fiendeeld.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {extname, join, normalize} from 'node:path';
import {sjalvtest as spakTest} from '../panorama/spak.js';
import {sjalvtest as stallTest} from '../panorama/stallning.js';
import {sjalvtest as gestTest} from '../panorama/gester.js';
import {sjalvtest as skakTest} from '../panorama/skakkurva.js';
import {sjalvtest as siktTest} from '../panorama/sikt.js';
import {sjalvtest as kollTest} from '../panorama/kollision.js';
import {sjalvtest as husTest} from '../panorama/hus.js';
import {sjalvtest as eldTest} from '../panorama/eld.js';

const enhet = [...spakTest(), ...stallTest(), ...gestTest(), ...skakTest(), ...siktTest(), ...kollTest(), ...husTest(), ...eldTest()];
if (enhet.length) {
  console.error(enhet.join('\n'));
  process.exit(1);
}

const puppeteer = createRequire(['/tmp/puppeteer-run/package.json', '/opt/cursor/tools/node_modules/puppeteer-core/package.json'].find(p => existsSync(p)))('puppeteer-core');
const ROT = '/agent/repos/gyro-range';
const TYPER = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.glb': 'model/gltf-binary', '.png': 'image/png', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm'
};
const http = await new Promise(res => {
  const h = createServer(async (q, s) => {
    try {
      let p = decodeURIComponent(new URL(q.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      const f = normalize(join(ROT, p));
      if (!f.startsWith(ROT)) { s.writeHead(403); s.end(); return; }
      s.writeHead(200, {'content-type': TYPER[extname(f)] || 'application/octet-stream', 'cache-control': 'no-store'});
      s.end(await readFile(f));
    } catch { s.writeHead(404); s.end(); }
  });
  h.listen(0, '127.0.0.1', () => res(h));
});
const webblasare = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required']
});
const sida = await webblasare.newPage();
const fel = [];
sida.on('pageerror', e => fel.push('page:' + e.message));
sida.on('console', med => { if (med.type() === 'error') fel.push('konsol:' + med.text()); });
const krav = [];
const sov = ms => new Promise(r => setTimeout(r, ms));

console.log('startar');
await sida.setViewport({width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true});
await sida.goto(`http://127.0.0.1:${http.address().port}/panorama/index.html`, {waitUntil: 'domcontentloaded', timeout: 60000});
await sida.waitForFunction(() => window.__redo === true, {timeout: 90000});
console.log('redo');
await sida.click('#starta');
await sida.waitForFunction(() => window.__pano && window.__pano.ljud && window.__pano.stallning, {timeout: 10000});
await sida.evaluate(() => window.__pano.ljud.ladda());
await sida.waitForFunction(() => {
  const k = window.__pano.ljud.klipp;
  return k && Object.keys(k).length === 6 && Object.values(k).every(Boolean);
}, {timeout: 15000});
await sida.evaluate(() => { window.__frys = true; });
console.log('frusen');

const yta = await sida.evaluate(() => {
  const ruta = id => {
    const el = document.getElementById(id);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {id, hidden: el.hidden, left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: r.width, h: r.height};
  };
  return {
    w: innerWidth,
    h: innerHeight,
    meny: ruta('menyKnapp'),
    spak: ruta('spak'),
    stall: ruta('stallning'),
    ligg: ruta('knappLigg'),
    kna: ruta('knappKna'),
    sta: ruta('knappSta'),
    skjut: ruta('skjut'),
    gang: !!document.getElementById('gang'),
    test: !!document.getElementById('testKnapp'),
    sikt: getComputedStyle(document.documentElement).getPropertyValue('--sikt-y').trim(),
    prick: getComputedStyle(document.getElementById('siktPrick')).width
  };
});
if (yta.gang || yta.test) krav.push('gamla gång- eller testknappar finns kvar');
if (!yta.meny || yta.meny.hidden || yta.meny.right < yta.w - 18 || yta.meny.top > 40) krav.push('meny sitter inte uppe till höger ' + JSON.stringify(yta.meny));
if (!yta.spak || yta.spak.hidden || yta.spak.left > 20) krav.push('spak saknas till vänster ' + JSON.stringify(yta.spak));
if (!yta.stall || yta.ligg.top > yta.sta.top || Math.abs((yta.ligg.left + yta.kna.right) / 2 - yta.w / 2) > 40) krav.push('ställning sitter fel ' + JSON.stringify(yta));
if (Math.abs(parseFloat(yta.sikt) - 42) > 0.2) krav.push('siktets höjd ' + yta.sikt);
if (parseFloat(yta.prick) > 5) krav.push('pricken är för stor ' + yta.prick);

const spel = await sida.evaluate(async () => {
  const p = window.__pano;
  const ut = {};
  p.spak.satt('springa');
  const z0 = p.position.z;
  for (let i = 0; i < 20; i++) p.steg(0.05, performance.now());
  ut.springZ = p.position.z - z0;
  ut.springSkak = p.skak.px;
  p.spak.satt('forsiktigt');
  for (let i = 0; i < 10; i++) p.steg(0.05, performance.now());
  ut.forsiktigSkak = p.skak.px;
  p.spak.satt('stilla');
  for (let i = 0; i < 8; i++) p.steg(0.05, 8000 + i);
  ut.stillaSkak = p.skak.px;
  p.stallning.satt('staende');
  p.gester.prov({az: -12, ay: 0, pitch: 0});
  p.steg(0.05, 10000);
  p.steg(0.05, 10220);
  ut.efterDyk = p.stallning.id;
  p.stallning.satt('staende');
  p.gester.prov({az: -12, ay: 0, pitch: 0});
  p.steg(0.05, 20000);
  p.gester.prov({az: 0, ay: 0, pitch: 0});
  p.steg(0.05, 20500);
  ut.efterEtt = p.stallning.id;
  p.stallning.satt('kna');
  for (let i = 0; i < 24; i++) p.steg(0.05, 25000 + i * 50);
  ut.huka = +p.stallning.oga.toFixed(2);
  p.gester.prov({ay: 10, az: 0, pitch: 0});
  p.steg(0.05, 30000);
  p.steg(0.05, 30500);
  p.gester.prov({ay: 0, az: 0, pitch: 0});
  for (let i = 0; i < 24; i++) p.steg(0.05, 31000 + i * 50);
  ut.kik = +p.oga.toFixed(2);
  p.gester.prov({ay: -10, az: 0, pitch: 0});
  p.steg(0.05, 40000);
  p.gester.prov({ay: 0, az: 0, pitch: 0});
  for (let i = 0; i < 16; i++) p.steg(0.05, 40500 + i * 50);
  ut.ner = +p.oga.toFixed(2);
  p.mataRorelse({linjar: 1.1, omega: 0}, 50);
  p.steg(0.05, 50000);
  ut.svag = p.skak.amp;
  p.mataRorelse({linjar: 11, omega: 0}, 50.05);
  p.steg(0.05, 50050);
  ut.kraftig = p.skak.amp;
  const meny = document.getElementById('meny');
  document.getElementById('menyKnapp').click();
  document.querySelector('#flikRad [data-flik="rorelse"]').click();
  const reglage = ['siktY', 'skakGa', 'skakSpring', 'accDod', 'accExp', 'gestFram', 'gestVert', 'skakPa', 'ljudPa', 'ljudVol'].map(id => {
    const el = document.getElementById(id);
    return {id, finns: !!el && !el.closest('[hidden]') ? meny.contains(el) : !!el && meny.contains(el)};
  });
  const siktInput = document.getElementById('siktY');
  siktInput.value = '0.36';
  siktInput.dispatchEvent(new Event('input', {bubbles: true}));
  ut.sikt = getComputedStyle(document.documentElement).getPropertyValue('--sikt-y').trim();
  ut.ndc = p.sikteNdc();
  ut.reglage = reglage;
  ut.panelDold = document.querySelector('#meny [data-panel="rorelse"]').hidden;
  document.getElementById('menyStang').click();
  return ut;
});
if (!(spel.springZ < -1.5)) krav.push('springar inte framåt ' + spel.springZ);
if (!(spel.springSkak > 8)) krav.push('spring skakar för lite ' + spel.springSkak);
if (spel.forsiktigSkak > 0.8) krav.push('försiktig gång skakar ' + spel.forsiktigSkak);
if (spel.stillaSkak > 0.8) krav.push('stilla skakar ' + spel.stillaSkak);
if (spel.efterDyk !== 'ligg') krav.push('dubbelryck blev ' + spel.efterDyk);
if (spel.efterEtt !== 'kna') krav.push('ett ryck blev ' + spel.efterEtt);
if (Math.abs(spel.huka - 0.78) > 0.05) krav.push('hukhöjd ' + spel.huka);
if (spel.kik < 1.2) krav.push('kikhöjd ' + spel.kik);
if (spel.ner > 0.9) krav.push('ner till skydd ' + spel.ner);
if (!(spel.svag < 0.05 && spel.kraftig > 0.4)) krav.push('acc-kurva ' + spel.svag + ' ' + spel.kraftig);
if (Math.abs(parseFloat(spel.sikt) - 36) > 0.2) krav.push('menyns sikte ' + spel.sikt);
if (!(spel.ndc.y > 0.2)) krav.push('strålen följer inte siktet ' + JSON.stringify(spel.ndc));
if (spel.reglage.some(r => !r.finns) || spel.panelDold) krav.push('reglage saknas i menyn ' + JSON.stringify(spel.reglage));

const kik = await sida.evaluate(() => {
  const p = window.__pano;
  p.sattSiktY(0.42);
  p.valjVapen('kar98k');
  p.steg(0.05, performance.now());
  const rot = document.getElementById('kikare');
  const linje = rot.querySelector('[data-retikel="zf39"] line');
  const synlig = !!(rot && !rot.hidden);
  const glas = !!rot.querySelector('.kikGlas');
  const topp = getComputedStyle(rot.querySelector('.kikareHal')).top;
  p.valjVapen('springfield');
  const springSyns = !rot.querySelector('[data-retikel="m1903"]').hidden;
  p.valjVapen('enfield');
  const enfSyns = !rot.querySelector('[data-retikel="mil"]').hidden;
  const hal = rot.querySelector('.kikareHal').getBoundingClientRect();
  const mitt = (hal.top + hal.height / 2) / innerHeight;
  p.valjVapen('vanligt');
  return {synlig, glas, bredd: linje ? linje.getAttribute('stroke-width') : '', mitt, springSyns, enfSyns};
});
if (!kik.synlig || !kik.glas || !kik.springSyns || !kik.enfSyns || Number(kik.bredd) > 0.4) krav.push('kikarsikte ' + JSON.stringify(kik));
if (Math.abs(kik.mitt - 0.42) > 0.03) krav.push('kikarsiktets mitt ' + kik.mitt);

const ljud = await sida.evaluate(async () => {
  const p = window.__pano;
  const fore = {skott: p.ljud.skottAntal, bult: p.ljud.bultAntal};
  const vapen = {};
  for (const id of ['vanligt', 'kar98k', 'springfield', 'enfield']) {
    p.valjVapen(id);
    const a = p.skjut();
    const b = p.skjut();
    vapen[id] = {a: !!a, b: !!b, kar: p.ljud.karaktar};
    await new Promise(r => setTimeout(r, 1200));
  }
  return {fore, efter: {skott: p.ljud.skottAntal, bult: p.ljud.bultAntal, klipp: p.ljud.klipp}, vapen};
});
if (ljud.efter.skott < ljud.fore.skott + 4) krav.push('alla vapen sköt inte ' + JSON.stringify(ljud));
if (ljud.efter.bult < ljud.fore.bult + 4) krav.push('mantelrörelse saknas ' + JSON.stringify(ljud.efter));
if (Object.values(ljud.vapen).some(v => v.b)) krav.push('skott gick under spärren ' + JSON.stringify(ljud.vapen));

const hus = await sida.evaluate(() => {
  const p = window.__pano;
  p.spak.satt('stilla');
  p.stallning.satt('kna');
  p.stallning.kikaNer();
  p.placera(p.hus.x, p.hus.z, 0);
  for (let i = 0; i < 20; i++) p.steg(0.05, performance.now());
  const under = p.traffaSikte();
  p.stallning.kikaUpp();
  p.stallning.kikaUpp();
  for (let i = 0; i < 24; i++) p.steg(0.05, performance.now());
  const genom = p.traffaSikte();
  const utom = p.placera(p.hus.x, p.hus.maxZ + 1.3, 0);
  p.spak.satt('springa');
  for (let i = 0; i < 30; i++) p.steg(0.05, performance.now());
  const inne = p.position;
  p.spak.satt('stilla');
  p.placera(p.hus.minX - 0.9, p.hus.z, -Math.PI / 2);
  p.spak.satt('springa');
  for (let i = 0; i < 24; i++) p.steg(0.05, performance.now());
  const vagg = p.position;
  p.spak.satt('stilla');
  return {
    ogaUnder: +p.stallning.oga.toFixed(2),
    under: under && {d: +under.distance.toFixed(2), namn: under.object && under.object.name},
    genom: genom && {d: +genom.distance.toFixed(2), namn: genom.object && genom.object.name},
    ogaKik: +p.oga.toFixed(2),
    utom, inne, vagg,
    minX: p.hus.minX
  };
});
if (!hus.under || hus.under.d > 4 || !String(hus.under.namn).includes('bröst')) krav.push('stråle under fönstret ' + JSON.stringify(hus.under));
if (hus.genom && hus.genom.d < 6) krav.push('stråle blockerad i fönstret ' + JSON.stringify(hus.genom));
if (!(hus.inne.z < hus.utom.z - 1.2)) krav.push('kom inte in genom dörren ' + JSON.stringify({utom: hus.utom, inne: hus.inne}));
if (!(hus.vagg.x < hus.minX + 0.2)) krav.push('gick genom väggen ' + JSON.stringify(hus.vagg));

const eld = await sida.evaluate(() => {
  const p = window.__pano;
  p.stallning.satt('staende');
  p.spak.satt('stilla');
  p.placera(14, -2, 0);
  for (let i = 0; i < 40; i++) p.steg(0.05, performance.now());
  for (let i = 0; i < 80; i++) p.steg(0.05, performance.now());
  return {eld: {...p.eld}, effekt: p.effekt.status(), skyttar: p.soldater.skyttar().length};
});
if (eld.skyttar < 5) krav.push('för få skyttar ' + eld.skyttar);
if (eld.eld.skott < 1 || eld.effekt.nedslag < 1) krav.push('fiendeeld utan nedslag ' + JSON.stringify(eld));
if (eld.eld.salva < 1) krav.push('mg42-salva saknas ' + JSON.stringify(eld.eld));

const egna = fel.filter(t => !/WebGL|THREE.warning|gl_error/i.test(t));
if (egna.length) krav.push(egna.slice(0, 4).join(' | '));

await webblasare.close();
http.close();
if (krav.length) {
  console.error(krav.join('\n'));
  process.exit(1);
}
console.log('panorama-spel-ok');
