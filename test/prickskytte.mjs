// Prickskytte från På armen till träff. Ska fallera på v30: enbart pointerdown
// höjer inte vapnet, body är position:fixed, och axelknappen ligger 16 px från
// nederkanten i landskap så iOS-trycket inte landar.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';
const puppeteer = createRequire(['/tmp/puppeteer-run/package.json'].find((p) => existsSync(p)))('puppeteer-core');
const ROT = '/agent/repos/gyro-range';
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
async function starta(w, h) {
  await sida.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await sida.goto(`http://127.0.0.1:${http.address().port}/?v=31`, { waitUntil: 'domcontentloaded' });
  await sida.waitForFunction(() => window.gyroGest, { timeout: 30000 });
  await sida.evaluate(() => {
    window.__vib = [];
    navigator.vibrate = (p) => { window.__vib.push(p); return true; };
    document.getElementById('manual').click();
  });
  await sida.waitForFunction(() => !document.getElementById('neutralPanel').hidden);
  await sida.evaluate(() => { const g = window.gyroGest; g.lagg(0, 90, 0); g.bekraftaNeutral(); g.satt('stallning.grans_dps', 5000); g.vy('forsta'); g.sikte('kikare'); });
  await sov(250);
}
async function traff(id) {
  return sida.evaluate((id) => {
    const el = document.getElementById(id);
    if (!el || el.hidden || el.closest('[hidden]')) return { id, saknas: true };
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + Math.min(r.height / 2, 24);
    const topp = document.elementFromPoint(x, y);
    return { id, traff: topp === el || el.contains(topp), topp: topp?.id || topp?.tagName, left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: innerWidth, h: innerHeight, kant: innerHeight - r.bottom };
  }, id);
}
async function nedtryck(id) {
  const t = await traff(id);
  if (!t.traff) return t;
  await sida.evaluate((id) => {
    const el = document.getElementById(id);
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 8, pointerType: 'touch', button: 0 }));
  }, id);
  await sov(80);
  return t;
}

await starta(390, 844);
const fast = await sida.evaluate(() => getComputedStyle(document.body).position);
if (fast === 'fixed') krav.push('body är fixed och tappar tryck på iOS');
const zoom = await sida.evaluate(() => document.querySelector('meta[name=viewport]').content);
if (!zoom.includes('user-scalable=no')) krav.push('zoom olåst');

const foreAxel = await sida.evaluate(() => window.gyroGest.läge().pose);
const endastNer = await sida.evaluate(() => {
  const el = document.getElementById('vapenSteg');
  const r = el.getBoundingClientRect();
  el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, changedTouches: [new Touch({ identifier: 1, target: el, clientX: r.left + 10, clientY: r.top + 10 })] }));
  return { pose: window.gyroGest.läge().pose, text: el.textContent };
});
if (endastNer.pose !== 2 || endastNer.text !== 'I axeln') krav.push('ett tryck till axeln ' + JSON.stringify(endastNer));
await sida.evaluate(() => window.gyroGest.vapen(0));
await sov(600);
const ett = await nedtryck('vapenSteg');
const tva = ett;
let axel = await sida.evaluate(() => window.gyroGest.läge());
for (let i = 0; i < 24 && axel.siktar !== 'ja'; i++) { await sov(200); axel = await sida.evaluate(() => window.gyroGest.läge()); }
if (!ett.traff || !tva.traff) krav.push('axelknapp täcks ' + JSON.stringify({ ett, tva }));
if (axel.pose !== 2 || axel.namn !== 'Stående') krav.push('inte i axeln ' + JSON.stringify({ pose: axel.pose, namn: axel.namn, text: tva }));
if (axel.siktar !== 'ja' || axel.vapenSynlig !== false) krav.push('kikare ' + JSON.stringify({ siktar: axel.siktar, vapen: axel.vapenSynlig, align: axel.align, fov: axel.fov }));

const ogat = await sida.evaluate(() => { document.getElementById('siktVal').click(); return true; });
await sov(400);
const utan = await sida.evaluate(() => window.gyroGest.läge());
if (utan.sikt !== 'ogat' || utan.siktar === 'ja') krav.push('ögat ' + JSON.stringify({ sikt: utan.sikt, siktar: utan.siktar }));
await sida.evaluate(() => document.getElementById('siktVal').click());
await sov(500);
const igen = await sida.evaluate(() => window.gyroGest.läge());
if (igen.siktar !== 'ja') krav.push('kikare tillbaka ' + igen.siktar);

const vrid = await sida.evaluate(async () => {
  const g = window.gyroGest;
  const sov = (ms) => new Promise((r) => setTimeout(r, ms));
  g.lagg(0, 90, 0);
  await sov(400);
  const fore = g.läge();
  g.lagg(0, 90, 16);
  await sov(700);
  const efter = g.läge();
  g.lagg(0, 90, 0);
  await sov(400);
  return { fore: fore.kropp, efter: efter.kropp, look: efter.lookX - fore.lookX };
});
if (Math.abs(vrid.efter - vrid.fore) > 2) krav.push('fötterna vrids ' + JSON.stringify(vrid));
if (!(vrid.look > 0.05)) krav.push('över kropp ' + JSON.stringify(vrid));

const skott = await sida.evaluate(async () => {
  const g = window.gyroGest;
  window.__vib = [];
  const sov = (ms) => new Promise((r) => setTimeout(r, ms));
  g.lagg(0, 90, 0);
  await sov(2200);
  const fore = g.läge();
  const el = document.getElementById('trigger');
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + 16;
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: y, pointerId: 9, pointerType: 'touch' }));
  for (let i = 1; i <= 8; i++) {
    await sov(60);
    el.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: x, clientY: y + i * 4, pointerId: 9, pointerType: 'touch' }));
  }
  await sov(150);
  const mitt = g.läge();
  el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: x, clientY: y + 32, pointerId: 9, pointerType: 'touch' }));
  await sov(1600);
  const slut = g.läge();
  return { stadga: mitt.stadga, skott: slut.skott - fore.skott, traff: slut.traffar - fore.traffar, fore: fore.lookY, mitt: mitt.lookY, slut: slut.lookY, lookX: fore.lookX, pose: fore.pose, siktar: fore.siktar, vib: window.__vib.length, fps: slut.fps };
});
if (!(skott.stadga > 0.8)) krav.push('kram ' + JSON.stringify(skott));
if (!(skott.skott > 0 && skott.traff > 0)) krav.push('träff ' + JSON.stringify(skott));
if (Math.abs(skott.slut - skott.fore) > 0.02) krav.push('rekyl tillbaka ' + JSON.stringify(skott));
if (!(skott.vib > 0)) krav.push('haptik');

await nedtryck('vapenSteg');
await sov(400);
const nere = await sida.evaluate(() => window.gyroGest.läge());
if (nere.pose !== 0 || nere.namn !== 'Stående') krav.push('sänk ' + JSON.stringify({ pose: nere.pose, namn: nere.namn }));

const noll = await sida.evaluate(async () => {
  const g = window.gyroGest;
  const sov = (ms) => new Promise((r) => setTimeout(r, ms));
  g.lagg(-22, 90, 0);
  await sov(900);
  const a = g.läge();
  document.getElementById('nyttNoll').click();
  await sov(400);
  const b = g.läge();
  return { a: a.kropp, b: b.kropp, yaw: b.yaw };
});
if (Math.abs(noll.yaw) > 2 || Math.abs(noll.b - noll.a) > 3) krav.push('noll ' + JSON.stringify(noll));

const sparad = await sida.evaluate(async () => {
  window.gyroGest.satt('gang.svang_mjuk', 1.7);
  return JSON.parse(localStorage.getItem('gyro_styrlabb_v1')).gang.svang_mjuk;
});
await sida.reload({ waitUntil: 'domcontentloaded' });
await sida.waitForFunction(() => window.gyroGest, { timeout: 30000 });
const efterSpar = await sida.evaluate(() => JSON.parse(localStorage.getItem('gyro_styrlabb_v1')).gang.svang_mjuk);
if (sparad !== 1.7 || efterSpar !== 1.7) krav.push('reglage ' + JSON.stringify({ sparad, efterSpar }));
await sida.evaluate(() => { localStorage.removeItem('gyro_styrlabb_v1'); document.getElementById('manual').click(); });
await sida.waitForFunction(() => !document.getElementById('neutralPanel').hidden);
await sida.evaluate(() => { const g = window.gyroGest; g.lagg(0, 90, 0); g.bekraftaNeutral(); });

const namn = await sida.evaluate(async () => {
  const g = window.gyroGest;
  const ut = { staende: g.läge().namn };
  g.sätt('hukande'); ut.huk = g.läge().namn;
  g.vapen(2); ut.kna = g.läge().namn;
  g.vapen(0); g.sätt('liggande'); ut.ligg = g.läge().namn;
  g.sätt('staende'); g.vapen(0);
  return ut;
});
if (namn.staende !== 'Stående' || namn.huk !== 'Hukande' || !namn.kna.includes('Knästående') || namn.ligg !== 'Liggande') krav.push('ställningstext ' + JSON.stringify(namn));

for (const [lage, vy] of [['gyro', 'forsta'], ['knyck', 'forsta'], ['gyro', 'bakifran'], ['knyck', 'bakifran']]) {
  await sida.evaluate((lage, vy) => { const g = window.gyroGest; g.satt('stallning.satt', lage); g.vy(vy); g.sätt('staende'); g.vapen(0); }, lage, vy);
  await sov(200);
  const a = await nedtryck('vapenSteg');
  await sov(300);
  const l = await sida.evaluate(() => window.gyroGest.läge());
  if (!a.traff || l.pose !== 2) krav.push('höj ' + lage + ' ' + vy + ' ' + JSON.stringify({ a: a.traff, pose: l.pose, topp: a.topp }));
}

const dold = [];
for (const id of ['menuButton', 'vapenSteg', 'trigger']) {
  const t = await traff(id);
  if (t.saknas || !t.traff || t.left < -1 || t.top < -1 || t.right > t.w + 1 || t.bottom > t.h + 1) dold.push(t);
}
if (dold.length) krav.push('porträtt ' + JSON.stringify(dold));
await sida.evaluate(() => document.getElementById('menuButton').click());
const menyKnappar = [];
for (const id of ['nyttNoll', 'settingsButton']) {
  const t = await traff(id);
  if (t.saknas || !t.traff) menyKnappar.push(t);
}
await sida.evaluate(() => document.querySelector('#menyFlikar button[data-flik=vapen]').click());
for (const id of ['vyKnapp', 'weapon', 'siktVal']) {
  const t = await traff(id);
  if (t.saknas || !t.traff) menyKnappar.push(t);
}
if (menyKnappar.length) krav.push('meny ' + JSON.stringify(menyKnappar));
await sida.evaluate(() => document.getElementById('menuButton').click());

await starta(844, 390);
const kant = await traff('vapenSteg');
if (kant.saknas || kant.kant < 24) krav.push('axel för nära kanten ' + JSON.stringify(kant));
await sida.evaluate(() => { window.gyroGest.satt('stallning.satt', 'knyck'); window.gyroGest.vapen(2); });
await sov(300);
const landDold = [];
for (const id of ['menuButton', 'vapenSteg', 'trigger', 'knappHuka']) {
  const t = await traff(id);
  const inne = !t.saknas && t.left >= -1 && t.top >= -1 && t.right <= t.w + 1 && t.bottom <= t.h + 1 && t.traff;
  if (!inne) landDold.push(t);
}
if (landDold.length) krav.push('landskap ' + JSON.stringify(landDold));
const landAxel = await nedtryck('vapenSteg');
await sov(200);
const landPose = await sida.evaluate(() => window.gyroGest.läge().pose);
if (!landAxel.traff || landPose === 2) krav.push('landskap sänk ' + JSON.stringify({ traff: landAxel.traff, pose: landPose }));
if (!(skott.fps > 0)) krav.push('fps ' + skott.fps);
if (errs.length) krav.push('konsol ' + errs[0]);

console.log(JSON.stringify({ krav, axel: { pose: axel.pose, siktar: axel.siktar }, vrid, skott, namn, kant: kant.kant, errs: errs.slice(0, 2) }, null, 2));
await webblasare.close();
http.close();
if (krav.length) process.exit(1);
console.log('prickskytte-ok');
