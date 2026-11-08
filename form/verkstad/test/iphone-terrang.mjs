/* iPhone: ställ ut en stenmur och läs de gula värdena. */
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
  await sida.goto(bas + '/verkstad/#stall', { waitUntil: 'domcontentloaded' });
  await vanta(sida, () => document.querySelector('section[data-vy="stall"]')?.dataset.redo === 'mark' ? true : 'stall', 90000);
  await sida.click('[data-hinder]');
  await sida.waitForSelector('[data-hinder-typ="stenmur"]');
  await sida.click('[data-hinder-typ="stenmur"]');
  await sida.evaluate(() => {
    const stall = document.querySelector('section[data-vy="stall"]');
    stall._kamera.sattVy({ mal: [0, 0], d: 80, lutning: 55, kurs: 20 });
    const duk = stall.querySelector('[data-duk]');
    const r = duk.getBoundingClientRect();
    const opts = {
      clientX: r.left + r.width * 0.5,
      clientY: r.top + r.height * 0.45,
      bubbles: true,
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true
    };
    duk.dispatchEvent(new PointerEvent('pointerdown', opts));
    duk.dispatchEvent(new PointerEvent('pointerup', opts));
  });
  await vanta(sida, () => {
    const kort = document.querySelector('[data-terrangkort]');
    if (!kort) return 'kort saknas';
    if (kort.dataset.typ !== 'stenmur') return kort.dataset.typ;
    if (kort.dataset.ursprung !== 'uppskattat') return 'ursprung';
    if (!kort.innerText.includes('ofarbar')) return 'ofarbar saknas';
    if (!kort.querySelector('.uppskattat')) return 'gul saknas';
    return true;
  });
  await sida.evaluate(() => document.querySelector('[data-terrangkort]')?.scrollIntoView({ block: 'center' }));
  await sida.screenshot({ path: ART + '/terrang-stenmur.png' });
  const antal = await sida.evaluate(() => document.querySelector('section[data-vy="stall"]').dataset.hinder);
  if (antal !== '1') throw new Error('hinder ' + antal);
  console.log('ok');
} finally {
  await browser.close();
  http.close();
}
