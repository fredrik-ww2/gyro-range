/* iPhone: tryck på en enhet i biblioteket och läs saknas-listan och stridsvärdena. */
import { mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROT = fileURLToPath(new URL('../../../..', import.meta.url));
const ART = '/opt/cursor/artifacts';
const TYPER = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.wasm': 'application/wasm', '.ktx2': 'application/octet-stream'
};

function server() {
  return new Promise((resolve) => {
    const http = createServer(async (beg, svar) => {
      try {
        let stig = decodeURIComponent(new URL(beg.url, 'http://127.0.0.1').pathname);
        if (stig.endsWith('/')) stig += 'index.html';
        const fil = normalize(join(ROT, stig));
        if (!fil.startsWith(ROT)) { svar.writeHead(403); svar.end(); return; }
        const data = await readFile(fil);
        svar.writeHead(200, { 'content-type': TYPER[extname(fil)] || 'application/octet-stream', 'cache-control': 'no-store' });
        svar.end(data);
      } catch { svar.writeHead(404); svar.end(); }
    });
    http.listen(0, '127.0.0.1', () => resolve(http));
  });
}

async function vanta(sida, fn, ms = 40000) {
  const start = Date.now();
  let senast = '';
  while (Date.now() - start < ms) {
    senast = await sida.evaluate(fn);
    if (senast === true) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Tidsgräns. ' + senast);
}

async function kollaKort(sida) {
  await vanta(sida, () => {
    const kort = document.querySelector('section[data-vy="kort"]');
    if (!kort) return 'kort saknas';
    const saknas = kort.querySelector('[data-saknas-lista]');
    const klart = kort.querySelector('[data-klart-lista]');
    const tabell = kort.querySelector('[data-stridstabell]');
    if (!saknas || !klart || !tabell) return 'listor saknas';
    if (!kort.innerText.includes('Saknas för att bli klar')) return 'rubrik';
    if (!kort.innerText.includes('Redan klart')) return 'klart';
    if (!tabell.querySelector('.uppskattat')) return 'gul saknas';
    if (!tabell.querySelector('.kalla') && !tabell.querySelector('[data-marke="källa"]')) return 'källa saknas';
    return true;
  });
}

const http = await server();
const bas = `http://127.0.0.1:${http.address().port}/gyro-range/form`;
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--disable-dev-shm-usage']
});
const sida = await browser.newPage();
await sida.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

try {
  await mkdir(ART, { recursive: true });
  await sida.goto(bas + '/verkstad/#bibliotek', { waitUntil: 'domcontentloaded' });
  await vanta(sida, () => document.querySelector('[data-enhet="tiger_i"]') ? true : 'tiger', 60000);
  const hojd = await sida.evaluate(() => {
    const rad = document.querySelector('[data-enhet="tiger_i"] .rad');
    return rad ? rad.getBoundingClientRect().height : 0;
  });
  if (hojd < 44) throw new Error('träffytan är för låg: ' + hojd);
  await sida.evaluate(() => document.querySelector('[data-enhet="tiger_i"]').click());
  await kollaKort(sida);
  await sida.evaluate(() => document.querySelector('[data-checklista]')?.scrollIntoView({ block: 'start' }));
  await sida.screenshot({ path: ART + '/bibliotekskort-tiger-saknas.png' });
  await sida.evaluate(() => document.querySelector('[data-stridstabell]')?.scrollIntoView({ block: 'start' }));
  await sida.screenshot({ path: ART + '/bibliotekskort-tiger.png' });
  console.log('tiger');

  await sida.goto(bas + '/verkstad/#enhet/usa_rifleman', { waitUntil: 'domcontentloaded' });
  await kollaKort(sida);
  const namn = await sida.evaluate(() => document.querySelector('section[data-vy="kort"] h1')?.textContent || '');
  if (!/infanterist/i.test(namn)) throw new Error('fel enhet ' + namn);
  await sida.evaluate(() => window.scrollTo(0, 0));
  await sida.screenshot({ path: ART + '/bibliotekskort-infanteri-saknas.png' });
  await sida.evaluate(() => document.querySelector('[data-stridstabell]')?.scrollIntoView({ block: 'start' }));
  await sida.screenshot({ path: ART + '/bibliotekskort-infanteri.png' });
  console.log('infanteri', namn);
  console.log('ok');
} finally {
  await browser.close();
  http.close();
}
