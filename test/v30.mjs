import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';
const puppeteer = createRequire(['/tmp/puppeteer-run/package.json'].find((p) => existsSync(p)))('puppeteer-core');
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
const krav = [];
const sov = (ms) => new Promise((r) => setTimeout(r, ms));
async function starta(w, h) {
  await sida.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await sida.goto(`http://127.0.0.1:${http.address().port}/?v=30`, { waitUntil: 'domcontentloaded' });
  await sida.waitForFunction(() => window.gyroGest, { timeout: 30000 });
  await sida.evaluate(() => document.getElementById('manual').click());
  await sida.waitForFunction(() => !document.getElementById('neutralPanel').hidden);
  await sida.evaluate(() => { const g = window.gyroGest; g.lagg(0, 90, 0); g.bekraftaNeutral(); g.satt('stallning.grans_dps', 2000); g.vy('forsta'); });
  await sov(300);
}
function inne(r, w, h) { return r.left >= -1 && r.top >= -1 && r.right <= w + 1 && r.bottom <= h + 1 && r.right - r.left > 8 && r.bottom - r.top > 8; }
await starta(390, 844);
const zoom = await sida.evaluate(() => document.querySelector('meta[name=viewport]').content);
if (!zoom.includes('user-scalable=no') || !zoom.includes('maximum-scale=1')) krav.push('viewport ' + zoom);
const kikare = await sida.evaluate(async () => {
  const g = window.gyroGest;
  g.vapen(2); g.sikte('kikare'); g.lagg(0, 90, 0);
  for (let i = 0; i < 20; i++) { await new Promise((r) => setTimeout(r, 100)); if (g.läge().siktar === 'ja') break; }
  return g.läge();
});
if (kikare.siktar !== 'ja') krav.push('kikare syns inte ' + JSON.stringify({ siktar: kikare.siktar, align: kikare.align, pose: kikare.pose }));
if (kikare.vapenSynlig !== false) krav.push('vapen syns i kikaren');
const cirkel = await sida.evaluate(() => {
  const svg = document.querySelector('#scope svg');
  const r = svg.getBoundingClientRect();
  const stil = getComputedStyle(document.getElementById('scope'));
  return { visad: stil.display !== 'none', left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: innerWidth, h: innerHeight };
});
if (!cirkel.visad) krav.push('siktesring dold');
if (!inne(cirkel, cirkel.w, cirkel.h)) krav.push('siktesring utanför ' + JSON.stringify(cirkel));
await sida.screenshot({ path: join(ART, 'v30-kikare.png') });

const styr = await sida.evaluate(async () => {
  const g = window.gyroGest;
  const sov = (ms) => new Promise((r) => setTimeout(r, ms));
  g.vapen(0); g.lagg(0, 90, 0); g.vinkel(0);
  await sov(300);
  const fore = g.läge().kropp;
  g.lagg(0, 90, 28);
  await sov(1600);
  const roll = g.läge().kropp;
  g.lagg(0, 90, 0);
  await sov(400);
  g.vapen(2);
  const mitt = g.läge().kropp;
  g.lagg(0, 90, 28);
  await sov(1200);
  const sikte = g.läge();
  return { fore, roll, mitt, efter: sikte.kropp, look: sikte.lookX };
});
if (!(styr.roll < styr.fore - 4)) krav.push('sidlutning svänger inte ' + JSON.stringify(styr));
if (!(Math.abs(styr.efter - styr.mitt) > 25)) krav.push('stor sidlutning svänger inte i siktet ' + JSON.stringify(styr));
if (!(styr.look > 0.05)) krav.push('över kropp siktar inte ' + JSON.stringify(styr));

const stall = await sida.evaluate(async () => {
  const g = window.gyroGest;
  g.satt('stallning.satt', 'knyck'); g.satt('stallning.ner_dps', 200); g.satt('stallning.upp_dps', 180);
  g.vapen(0); g.sätt('staende');
  g.kö([{ ms: 280, tipp: 420, vrid: 0 }]);
  await new Promise((r) => setTimeout(r, 700));
  const nere = g.läge().stallning;
  g.nollstall();
  g.kö([{ ms: 280, tipp: -420, vrid: 0 }]);
  await new Promise((r) => setTimeout(r, 700));
  const upp = g.läge().stallning;
  g.sätt('staende');
  document.getElementById('knappHuka').click();
  await new Promise((r) => setTimeout(r, 200));
  const huka = g.läge();
  g.vapen(2);
  await new Promise((r) => setTimeout(r, 200));
  const kna = g.läge();
  return { nere, upp, huka: huka.stallning, namnHuka: huka.namn, kna: kna.stallning, namn: kna.namn, info: kna.info, hukaSynlig: !document.getElementById('knappHuka').hidden };
});
if (stall.nere !== 'liggande') krav.push('knyck ner ' + JSON.stringify(stall));
if (stall.upp !== 'hukande') krav.push('knyck upp ' + JSON.stringify(stall));
if (stall.huka !== 'hukande') krav.push('huka ' + JSON.stringify(stall));
if (stall.kna !== 'knastående' || !stall.namn.includes('Knästående')) krav.push('knä ' + JSON.stringify(stall));
if (!stall.info.includes('Ställningsstyrning')) krav.push('chip ' + stall.info);
if (!stall.hukaSynlig) krav.push('huka-knapp dold');

await sida.evaluate(() => window.gyroGest.vy('bakifran'));
await sov(400);
const bilder = [];
for (const namn of ['staende', 'hukande', 'knastående', 'liggande']) {
  await sida.evaluate((namn) => { const g = window.gyroGest; if (namn === 'knastående') { g.vapen(2); g.sätt('hukande'); } else { g.vapen(0); g.sätt(namn); } }, namn);
  await sov(500);
  const l = await sida.evaluate(() => window.gyroGest.läge());
  const fil = { staende: 'v30-bak-staende.png', hukande: 'v30-bak-hukande.png', knastående: 'v30-bak-kna.png', liggande: 'v30-bak-liggande.png' }[namn];
  await sida.screenshot({ path: join(ART, fil) });
  const dist = Math.hypot(l.camX - l.x, l.camZ - l.z);
  const ok = l.vy === 'bakifran' && l.jagSynlig && dist > 1.5 && Math.abs(l.jagNdcX) < 0.85 && Math.abs(l.jagNdcY) < 0.9;
  if (!ok) krav.push('bakifrån ' + namn + ' ' + JSON.stringify({ vy: l.vy, synlig: l.jagSynlig, camZ: l.camZ, z: l.z, ndc: [l.jagNdcX, l.jagNdcY], stall: l.stallning, namn: l.namn }));
  bilder.push(fil);
}
await sida.evaluate(() => window.gyroGest.vy('forsta'));
await sida.screenshot({ path: join(ART, 'v30-layout-portratt.png') });
const port = await sida.evaluate(() => {
  const ids = ['menuButton', 'nyttNoll', 'vyKnapp', 'vapenSteg', 'weapon', 'trigger', 'siktVal', 'stallningNamn'];
  return ids.map((id) => { const el = document.getElementById(id); const r = el.getBoundingClientRect(); return { id, left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: innerWidth, h: innerHeight, dold: el.hidden || !!el.closest('[hidden]') }; });
});
for (const k of port) if (!k.dold && !inne(k, k.w, k.h)) krav.push('klippt porträtt ' + JSON.stringify(k));

await starta(844, 390);
await sida.evaluate(() => { window.gyroGest.vapen(2); window.gyroGest.satt('stallning.satt', 'knyck'); });
await sov(400);
await sida.screenshot({ path: join(ART, 'v30-layout-landskap.png') });
const land = await sida.evaluate(() => {
  const ids = ['menuButton', 'nyttNoll', 'vyKnapp', 'vapenSteg', 'weapon', 'trigger', 'siktVal', 'knappHuka', 'stallningNamn'];
  return ids.map((id) => { const el = document.getElementById(id); const r = el.getBoundingClientRect(); return { id, left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: innerWidth, h: innerHeight, dold: el.hidden || !!el.closest('[hidden]') }; });
});
for (const k of land) if (!k.dold && !inne(k, k.w, k.h)) krav.push('klippt landskap ' + JSON.stringify(k));
const ringLand = await sida.evaluate(async () => {
  const g = window.gyroGest; g.vy('forsta'); g.sikte('kikare'); g.vapen(2); g.lagg(0, 90, 0);
  for (let i = 0; i < 15; i++) { await new Promise((r) => setTimeout(r, 80)); if (g.läge().siktar === 'ja') break; }
  const r = document.querySelector('#scope svg').getBoundingClientRect();
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: innerWidth, h: innerHeight, siktar: g.läge().siktar };
});
if (ringLand.siktar === 'ja' && !inne(ringLand, ringLand.w, ringLand.h)) krav.push('siktesring landskap ' + JSON.stringify(ringLand));
if (errs.length) krav.push('konsol ' + errs.slice(0, 2).join(' | '));
console.log(JSON.stringify({ krav, kikare: { siktar: kikare.siktar, vapen: kikare.vapenSynlig }, styr, stall, cirkel, ringLand, errs: errs.slice(0, 2) }, null, 2));
await webblasare.close();
http.close();
if (krav.length) process.exit(1);
console.log('v30-ok');
