import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';
const kravPaket = ['/tmp/puppeteer-run/package.json', new URL('../package.json', import.meta.url).pathname].find((p) => existsSync(p));
const puppeteer = createRequire(kravPaket)('puppeteer-core');

const ROT = '/agent/repos/gyro-range';
const ART = '/opt/cursor/artifacts';
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
sida.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
const krav = [];
const sov = (ms) => new Promise((r) => setTimeout(r, ms));
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

async function starta(w, h) {
  await sida.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await sida.evaluate(() => localStorage.removeItem('gyro_styrlabb_v1')).catch(() => {});
  await sida.goto(`http://127.0.0.1:${http.address().port}/?prov=29`, { waitUntil: 'domcontentloaded' });
  await sida.waitForFunction(() => window.gyroGest, { timeout: 30000 });
  await sida.evaluate(() => {
    window.__vib = [];
    navigator.vibrate = (p) => { window.__vib.push(p); return true; };
    document.getElementById('manual').click();
  });
  await sida.waitForFunction(() => !document.getElementById('neutralPanel').hidden);
  await sida.evaluate(() => { const g = window.gyroGest; g.lagg(0, 90, 0); g.bekraftaNeutral(); g.vapen(2); g.satt('sikte.satt', 'roll_kropp'); g.satt('stallning.grans_dps', 2000); });
  await sov(300);
}
async function traff(id) {
  return sida.evaluate((id) => {
    const el = document.getElementById(id);
    if (!el || el.hidden || el.closest('[hidden]')) return { id, saknas: true };
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + Math.min(r.height / 2, 22);
    const topp = document.elementFromPoint(x, y);
    const ok = topp === el || el.contains(topp);
    return { id, traff: ok, topp: topp?.id || topp?.tagName, x, y, w: Math.round(r.width), h: Math.round(r.height) };
  }, id);
}
async function tryck(id) {
  const t = await traff(id);
  if (t.traff) await sida.touchscreen.tap(t.x, t.y);
  return t;
}

await starta(390, 844);
const forstaTraff = await sida.evaluate(async () => {
  const g = window.gyroGest;
  g.vapen(2);
  await new Promise((s) => setTimeout(s, 600));
  const el = document.getElementById('trigger');
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: y, pointerId: 4, pointerType: 'touch' }));
  el.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: x, clientY: y + 50, pointerId: 4, pointerType: 'touch' }));
  await new Promise((s) => setTimeout(s, 500));
  el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: x, clientY: y + 50, pointerId: 4, pointerType: 'touch' }));
  return g.läge();
});
if (!(forstaTraff.skott > 0 && forstaTraff.traffar > 0)) krav.push('träff rakt fram ' + JSON.stringify({ skott: forstaTraff.skott, traffar: forstaTraff.traffar, look: [forstaTraff.lookX, forstaTraff.lookY, forstaTraff.lookZ], mun: [forstaTraff.munX, forstaTraff.munY, forstaTraff.munZ], fiendeZ: forstaTraff.fiendeZ, align: forstaTraff.align }));
const rikt = await sida.evaluate(async () => {
  const g = window.gyroGest;
  const sov = (ms) => new Promise((r) => setTimeout(r, ms));
  g.vinkel(0);
  g.lagg(0, 90, 0);
  await sov(200);
  const vila = g.läge();
  g.lagg(-20, 90, 0);
  await sov(2200);
  const hoger = g.läge();
  const efterHoger = g.läge();
  g.lagg(20, 90, 0);
  await sov(2500);
  const vanster = g.läge();
  g.lagg(0, 90, 0);
  await sov(1200);
  const still = g.läge();
  g.lagg(0, 110, 0);
  await sov(1200);
  const upp = g.läge();
  g.lagg(0, 70, 0);
  await sov(1200);
  const ner = g.läge();
  g.lagg(0, 90, 20);
  await sov(1200);
  const roll = g.läge();
  g.vinkel(90);
  g.lagg(0, 90, 0);
  document.getElementById('nyttNoll').click();
  await sov(1200);
  const landFore = g.läge();
  g.lagg(0, 90, -20);
  await sov(1200);
  const landUpp = g.läge();
  g.lagg(0, 90, 0);
  await sov(800);
  const landMitten = g.läge();
  g.lagg(-20, 90, 0);
  await sov(2500);
  const landHoger = g.läge();
  return { vila, hoger, efterHoger, vanster, still, upp, ner, roll, landFore, landUpp, landMitten, landHoger };
});
const par = (a, b) => Math.abs(wrap((b.gunYaw - b.camYaw) - (a.gunYaw - a.camYaw)));
if (!(rikt.hoger.lookX > 0.06 && rikt.hoger.py < -0.02)) krav.push('höger ' + JSON.stringify({ x: rikt.hoger.lookX, k: rikt.hoger.kropp, py: rikt.hoger.py, yaw: rikt.hoger.yaw }));
if (par(rikt.vila, rikt.hoger) > 0.35) krav.push('gevär följer inte höger ' + par(rikt.vila, rikt.hoger).toFixed(3));
if (!(rikt.vanster.lookX < rikt.efterHoger.lookX - 0.08)) krav.push('vänster ' + JSON.stringify({ x: rikt.vanster.lookX, hx: rikt.efterHoger.lookX }));
if (par(rikt.hoger, rikt.vanster) > 0.35) krav.push('gevär följer inte vänster');
if (Math.abs(rikt.still.kropp - rikt.vanster.kropp) > 2) krav.push('stanna vid noll ' + JSON.stringify({ a: rikt.vanster.kropp, b: rikt.still.kropp }));
if (!(rikt.upp.lookY > 0.12)) krav.push('upp ' + rikt.upp.lookY);
if (!(rikt.ner.lookY < rikt.upp.lookY - 0.15)) krav.push('ner ' + JSON.stringify({ upp: rikt.upp.lookY, ner: rikt.ner.lookY }));
if (!(rikt.roll.lookX > 0.02)) krav.push('sidlut höger ' + rikt.roll.lookX);
if (!(rikt.landUpp.lookY > rikt.landFore.lookY + 0.08)) krav.push('landskap upp ' + JSON.stringify({ a: rikt.landFore.lookY, b: rikt.landUpp.lookY }));
if (!(rikt.landHoger.lookX > rikt.landMitten.lookX + 0.08)) krav.push('landskap höger ' + JSON.stringify({ a: rikt.landMitten.lookX, b: rikt.landHoger.lookX }));
if (!rikt.hoger.info.includes('höger')) krav.push('statusruta ' + rikt.hoger.info);

await sida.evaluate(() => { window.gyroGest.vinkel(0); window.gyroGest.lagg(0, 90, 0); window.gyroGest.vapen(2); window.gyroGest.satt('stallning.grans_dps', 2000); });
await sov(200);
const forePose = await sida.evaluate(() => window.gyroGest.läge().pose);
const axel = await tryck('vapenSteg');
await sov(200);
const efterAxel = await sida.evaluate(() => ({ pose: window.gyroGest.läge().pose, text: document.getElementById('vapenSteg').textContent }));
if (!axel.traff) krav.push('axelknapp täcks ' + JSON.stringify(axel));
if (efterAxel.pose === forePose) krav.push('axelknapp bytte inte ' + JSON.stringify({ forePose, efterAxel }));
if (!['På armen', 'Båda händer', 'I axeln'].includes(efterAxel.text)) krav.push('axeltext ' + efterAxel.text);

await sida.evaluate(() => window.gyroGest.vapen(2));
await sov(200);
const knappar = [];
for (const id of ['menuButton', 'trigger', 'vapenSteg']) knappar.push(await traff(id));
const meny = await tryck('menuButton');
await sov(150);
const menyOppet = await sida.evaluate(() => !document.getElementById('menu').hidden);
if (!menyOppet) krav.push('meny ' + JSON.stringify(meny));
for (const id of ['settingsButton', 'center', 'standUp', 'flightButton', 'nyttNoll']) knappar.push(await traff(id));
await sida.evaluate(() => document.querySelector('#menyFlikar button[data-flik=vapen]').click());
for (const id of ['siktVal', 'weapon']) knappar.push(await traff(id));
const install = await tryck('settingsButton');
await sov(200);
const labb = await sida.evaluate(() => {
  const panel = document.getElementById('settings');
  const inp = panel.querySelector('#labb input[type=range]');
  if (!inp || panel.hidden) return { saknas: true, dold: panel.hidden };
  const r = inp.getBoundingClientRect();
  const ut = inp.parentElement.querySelector('output')?.textContent;
  inp.value = inp.max;
  inp.dispatchEvent(new Event('input', { bubbles: true }));
  return { ut, nu: inp.parentElement.querySelector('output')?.textContent, dold: panel.hidden, y: r.top };
});
if (labb.saknas || labb.dold) krav.push('laborera ' + JSON.stringify(labb));
else if (labb.ut === labb.nu) krav.push('reglage ändrades inte ' + JSON.stringify(labb));
await sida.evaluate(() => [...document.querySelectorAll('#labb button')].find((b) => b.textContent.includes('Återställ'))?.click());
await sida.evaluate(() => document.getElementById('closeSettings').click());
await sida.touchscreen.tap(20, 400);
await sov(100);

const noll = await sida.evaluate(async () => {
  const g = window.gyroGest;
  const sov = (ms) => new Promise((r) => setTimeout(r, ms));
  g.vapen(2); g.vinkel(0); g.lagg(0, 90, 0); document.getElementById('nyttNoll').click();
  await sov(200);
  g.lagg(-25, 90, 0);
  await sov(1500);
  const a = g.läge();
  document.getElementById('nyttNoll').click();
  await sov(900);
  const b = g.läge();
  return { a: a.kropp, b: b.kropp, yaw: b.yaw };
});
if (Math.abs(noll.b - noll.a) > 2 || Math.abs(noll.yaw) > 2) krav.push('nollställning ' + JSON.stringify(noll));

const skott = await sida.evaluate(async () => {
  const g = window.gyroGest;
  window.gyroGest.vapen(2);
  const el = document.getElementById('trigger');
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const fore = g.läge();
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: y, pointerId: 7, pointerType: 'touch' }));
  el.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: x, clientY: y + 46, pointerId: 7, pointerType: 'touch' }));
  await new Promise((s) => setTimeout(s, 800));
  const efter = g.läge();
  el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: x, clientY: y + 46, pointerId: 7, pointerType: 'touch' }));
  return { fore: fore.lookY, efter: efter.lookY, skott: efter.skott, vib: window.__vib.length, traffar: efter.traffar };
});
if (!(skott.skott > forstaTraff.skott)) krav.push('skott ' + JSON.stringify(skott));
if (!(skott.efter > skott.fore + 0.002)) krav.push('rekyl upp ' + JSON.stringify(skott));
if (!(skott.vib > 0)) krav.push('haptik ' + JSON.stringify(skott));

const gang = await sida.evaluate(async () => {
  const g = window.gyroGest;
  const sov = (ms) => new Promise((r) => setTimeout(r, ms));
  g.vapen(0); g.satt('gang.satt', 'lutning'); g.lagg(0, 90, 0);
  await sov(200);
  const z0 = g.läge().z;
  g.lagg(0, 60, 0);
  await sov(1200);
  const z1 = g.läge().z;
  g.lagg(0, 115, 0);
  await sov(800);
  const z2 = g.läge().z;
  g.lagg(0, 90, 0);
  await sov(400);
  g.nollstall();
  g.satt('gang.satt', 'knyck'); g.satt('gang.knyck_dps', 120); g.satt('stallning.grans_dps', 2000); g.sätt('staende'); g.vapen(0);
  const zk = g.läge().z;
  g.kö([{ ms: 220, tipp: 220, vrid: 0 }]);
  await sov(600);
  return { z0, z1, z2, zk, z3: g.läge().z, stall: g.läge().stallning };
});
if (!(gang.z1 < gang.z0 - 0.25)) krav.push('gång framåt ' + JSON.stringify(gang));
if (gang.z2 < gang.z1 - 0.2) krav.push('blick upp går framåt ' + JSON.stringify(gang));
if (!(gang.z3 < gang.zk - 0.4)) krav.push('knyck ' + JSON.stringify(gang));

await sida.evaluate(() => { window.gyroGest.satt('stallning.satt', 'knappar'); window.gyroGest.vapen(2); });
await sov(150);
const nerKnapp = await tryck('knappNer');
await sov(200);
const ligg = await sida.evaluate(() => window.gyroGest.läge().stallning);
if (!nerKnapp.traff) krav.push('ner-knapp ' + JSON.stringify(nerKnapp));
if (ligg !== 'liggande') krav.push('ner ställning ' + ligg);
const res = await sida.evaluate(() => { document.getElementById('menuButton').click(); document.getElementById('standUp').click(); return window.gyroGest.läge().stallning; });
if (res === 'liggande') krav.push('res dig');

await sida.screenshot({ path: join(ART, 'iphone-portratt.png') });
const dold = knappar.filter((k) => k.traff === false);
if (dold.length) krav.push('täcks porträtt ' + JSON.stringify(dold));

await starta(844, 390);
const landKnappar = [];
for (const id of ['menuButton', 'trigger', 'vapenSteg']) landKnappar.push(await traff(id));
const axelLand = await tryck('vapenSteg');
await sov(150);
const poseLand = await sida.evaluate(() => window.gyroGest.läge().pose);
if (!axelLand.traff) krav.push('axel landskap ' + JSON.stringify(axelLand));
if (poseLand === 2) krav.push('axel landskap bytte inte');
const doldLand = landKnappar.filter((k) => k.traff === false);
if (doldLand.length) krav.push('täcks landskap ' + JSON.stringify(doldLand));
await sida.evaluate(() => { window.gyroGest.satt('stallning.satt', 'knappar'); window.gyroGest.vapen(2); });
await sov(200);
const knapparLand = [];
for (const id of ['knappNer', 'knappKna', 'vapenSteg', 'trigger']) knapparLand.push(await traff(id));
const doltKnappar = knapparLand.filter((k) => k.traff === false);
if (doltKnappar.length) krav.push('ställningsknappar landskap ' + JSON.stringify(doltKnappar));
const fps = await sida.evaluate(() => window.gyroGest.läge().fps);
if (!(fps > 0)) krav.push('fps ' + fps);
await sida.screenshot({ path: join(ART, 'iphone-landskap.png') });
if (errs.length) krav.push('konsol ' + errs.slice(0, 3).join(' | '));

console.log(JSON.stringify({
  krav,
  hoger: { x: rikt.hoger.lookX, k: rikt.hoger.kropp },
  vanster: rikt.vanster.lookX,
  upp: rikt.upp.lookY,
  ner: rikt.ner.lookY,
  roll: rikt.roll.lookX,
  land: { upp: rikt.landUpp.lookY, hoger: rikt.landHoger.lookX },
  axel: { forePose, efterAxel, axel },
  skott, gang, noll, fps, knappar, landKnappar, errs: errs.slice(0, 4)
}, null, 2));
await webblasare.close();
http.close();
if (krav.length) process.exit(1);
console.log('iphone-bana-ok');
