// Skjutbana 33: sväng, kulspruta, karbin, ställningsknappar, träffar.
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
  await sida.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await sida.evaluate(() => localStorage.clear()).catch(() => {});
  await sida.goto(`http://127.0.0.1:${http.address().port}/?v=33`, { waitUntil: 'domcontentloaded' });
  await sida.waitForFunction(() => window.gyroGest, { timeout: 30000 });
  await sida.evaluate(() => document.getElementById('manual').click());
  await sida.waitForFunction(() => !document.getElementById('neutralPanel').hidden);
  await sida.evaluate(() => { const g = window.gyroGest; g.lagg(0, 90, 0); g.bekraftaNeutral(); g.satt('stallning.grans_dps', 4000); g.vy('forsta'); g.vapen(2); });
  await sov(250);
}
await starta(844, 390);
const etikett = await sida.evaluate(() => document.getElementById('version').textContent);
if (!etikett.includes('Skjutbana 33')) krav.push('version ' + etikett);

const stall = await sida.evaluate(async () => {
  const sov = (ms) => new Promise((r) => setTimeout(r, ms));
  const synlig = (id) => { const el = document.getElementById(id); const r = el.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + Math.min(r.height / 2, 18); const topp = document.elementFromPoint(x, y); return { id, traff: topp === el || el.contains(topp), text: el.textContent, w: r.width, h: r.height, left: r.left, top: r.top, right: r.right, bottom: r.bottom, iw: innerWidth, ih: innerHeight }; };
  const knappar = ['knappSta', 'knappHuk', 'knappLigg'].map(synlig);
  document.getElementById('knappHuk').click();
  await sov(200);
  const huk = window.gyroGest.läge().stallning;
  document.getElementById('knappLigg').click();
  await sov(200);
  const ligg = window.gyroGest.läge().stallning;
  document.getElementById('knappSta').click();
  await sov(200);
  const sta = window.gyroGest.läge().stallning;
  return { knappar, huk, ligg, sta };
});
if (stall.huk !== 'knastående' && stall.huk !== 'hukande') krav.push('huka ' + stall.huk);
if (stall.ligg !== 'liggande') krav.push('ligg ' + stall.ligg);
if (stall.sta !== 'staende') krav.push('stå ' + stall.sta);
for (const k of stall.knappar) {
  if (!k.traff) krav.push('ställningsknapp täcks ' + JSON.stringify(k));
  if (k.left < -1 || k.top < -1 || k.right > k.iw + 1 || k.bottom > k.ih + 1) krav.push('ställningsknapp utanför ' + JSON.stringify(k));
}

const svang = await sida.evaluate(async () => {
  const g = window.gyroGest;
  const sov = (ms) => new Promise((r) => setTimeout(r, ms));
  g.vy('forsta'); g.vapen(2); g.lagg(0, 90, 0); g.vinkel(0);
  await sov(200);
  const finFore = g.läge().kropp;
  g.lagg(0, 90, 12);
  await sov(500);
  const fin = g.läge().kropp;
  g.lagg(0, 90, 0);
  await sov(200);
  g.vy('bakifran'); g.vapen(2); g.lagg(0, 90, 0);
  await sov(200);
  const bakFore = g.läge().kropp;
  g.lagg(0, 90, 22);
  await sov(700);
  const bak = g.läge();
  g.lagg(0, 90, 0);
  return { fin: Math.abs(fin - finFore), bak: Math.abs(bak.kropp - bakFore), grepp: bak.grepp, pip: bak.pip };
});
if (svang.fin > 8) krav.push('finriktning snurrar ' + JSON.stringify(svang));
if (!(svang.bak > 12)) krav.push('bakifrån svänger inte ' + JSON.stringify(svang));
if (!(svang.grepp < 0.45)) krav.push('vapen sitter inte i handen ' + JSON.stringify(svang));

const ksp = await sida.evaluate(async () => {
  const g = window.gyroGest;
  g.vy('forsta'); g.vapen(2); g.valj('kulspruta'); g.lagg(0, 90, 0);
  await new Promise((r) => setTimeout(r, 200));
  const el = document.getElementById('trigger');
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const fore = g.läge();
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: y, pointerId: 3, pointerType: 'touch' }));
  await new Promise((s) => setTimeout(s, 450));
  const mitt = g.läge();
  el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: x, clientY: y, pointerId: 3, pointerType: 'touch' }));
  await new Promise((s) => setTimeout(s, 200));
  const efter = g.läge();
  return { fore: fore.skott, mitt: mitt.skott, efter: efter.skott, pip: efter.pip, text: document.getElementById('fireLabel').textContent, namn: document.getElementById('weapon').textContent };
});
if (!(ksp.mitt >= ksp.fore + 2)) krav.push('ksp håller inte inne ' + JSON.stringify(ksp));
if (ksp.efter > ksp.mitt + 1) krav.push('ksp slutar inte ' + JSON.stringify(ksp));
if (ksp.text !== 'HÅLL') krav.push('ksp text ' + ksp.text);
if (!(ksp.pip < 12)) krav.push('ksp pekar snett ' + ksp.pip);

const karbin = await sida.evaluate(async () => {
  const g = window.gyroGest;
  g.valj('karbin'); g.vapen(2); g.vy('forsta'); g.lagg(0, 90, 0);
  await new Promise((r) => setTimeout(r, 400));
  const uppe = g.läge();
  const peep = getComputedStyle(document.getElementById('peep')).display;
  g.vapen(0);
  await new Promise((r) => setTimeout(r, 200));
  const nere = getComputedStyle(document.getElementById('peep')).display;
  return { id: uppe.vapenId, karbin: uppe.karbin, peep, nere, namn: document.getElementById('weapon').textContent };
});
if (karbin.id !== 'karbin' || karbin.karbin !== 'ja' || karbin.peep === 'none') krav.push('karbin sikte ' + JSON.stringify(karbin));
if (karbin.nere !== 'none') krav.push('karbin sikte kvar ' + karbin.nere);
if (!karbin.namn.includes('Karbin')) krav.push('karbin namn ' + karbin.namn);

const stilla = await sida.evaluate(async () => {
  const g = window.gyroGest;
  g.valj('gevar'); g.vapen(2); g.lagg(0, 90, 0);
  await new Promise((r) => setTimeout(r, 300));
  const fore = g.läge().skak;
  const el = document.getElementById('trigger');
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + 20;
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: y, pointerId: 11, pointerType: 'touch' }));
  for (let i = 1; i <= 6; i++) {
    await new Promise((s) => setTimeout(s, 40));
    el.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: x, clientY: y + i * 3, pointerId: 11, pointerType: 'touch' }));
  }
  await new Promise((s) => setTimeout(s, 80));
  const mitt = g.läge();
  el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: x, clientY: y + 18, pointerId: 11, pointerType: 'touch' }));
  return { fore, skak: mitt.skak, stilla: mitt.stilla, stadga: mitt.stadga };
});
if (!(stilla.fore > 0)) krav.push('ingen skak före ' + JSON.stringify(stilla));
if (!(stilla.stilla && stilla.skak === 0)) krav.push('inte stilla vid drag ' + JSON.stringify(stilla));

const traff = await sida.evaluate(async () => {
  const g = window.gyroGest;
  g.valj('karbin'); g.vapen(2); g.lagg(0, 70, 0);
  await new Promise((r) => setTimeout(r, 250));
  const el = document.getElementById('trigger');
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + 12;
  const foreHal = g.läge().hal;
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: y, pointerId: 12, pointerType: 'touch' }));
  el.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: x, clientY: y + 40, pointerId: 12, pointerType: 'touch' }));
  await new Promise((s) => setTimeout(s, 500));
  const efter = g.läge();
  el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: x, clientY: y + 40, pointerId: 12, pointerType: 'touch' }));
  return { foreHal, hal: efter.hal, yta: efter.yta, skott: efter.skott, hinder: efter.hinder };
});
if (!(traff.hinder >= 8)) krav.push('hinder ' + traff.hinder);
if (!(traff.skott > 0)) krav.push('inget skott ' + JSON.stringify(traff));
if (!(traff.hal > traff.foreHal) || traff.yta !== 'mark') krav.push('markträff ' + JSON.stringify(traff));

await sida.evaluate(() => { const g = window.gyroGest; g.valj('kulspruta'); g.vapen(2); g.vy('bakifran'); g.sätt('staende'); g.lagg(0, 90, 0); });
await sov(600);
await sida.screenshot({ path: '/opt/cursor/artifacts/skjutbana33-ksp-bakifran.png' });
await sida.evaluate(() => { const g = window.gyroGest; g.valj('karbin'); g.vy('forsta'); g.vapen(2); g.lagg(0, 90, 0); });
await sov(500);
await sida.screenshot({ path: '/opt/cursor/artifacts/skjutbana33-karbin-sikte.png' });
await sida.evaluate(() => { window.gyroGest.lagg(0, 75, 0); });
await sov(300);
await sida.screenshot({ path: '/opt/cursor/artifacts/skjutbana33-mark.png' });
if (errs.length) krav.push('konsol ' + errs.slice(0, 2).join(' | '));
console.log(JSON.stringify({ krav, etikett, stall: { huk: stall.huk, ligg: stall.ligg }, svang, ksp: { mitt: ksp.mitt - ksp.fore, pip: ksp.pip }, karbin, stilla, traff, errs: errs.slice(0, 2) }, null, 2));
await webblasare.close();
http.close();
if (krav.length) process.exit(1);
console.log('skjutbana33-ok');
