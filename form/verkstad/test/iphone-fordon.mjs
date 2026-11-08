/* Närbild av varje fordon som har en riktig modell, plus bibliotekets värden. */
import { mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROT = fileURLToPath(new URL('../../../..', import.meta.url));
const ART = '/opt/cursor/artifacts';
const FORDON = [
  'tiger_i', 'panzer_iv_h', 'panther_g', 'panzer_iii_j', 'leichttraktor', 'luchs',
  'pak38', 'pak40',
  'sherman_m4_75', 'm4a1_75', 'm4a3_76w', 'm4a3e8', 'm10_gmc', 'm3_halftrack', 'm1_57mm'
];
const TYPER = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.wasm': 'application/wasm', '.ktx2': 'application/octet-stream'
};
const fel = [];

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

async function vanta(sida, fn, ms = 30000) {
  const start = Date.now();
  let senast = '';
  while (Date.now() - start < ms) {
    senast = await sida.evaluate(fn);
    if (senast === true) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Tidsgräns. ' + senast + ' | ' + fel.slice(0, 4).join(' || '));
}

const http = await server();
const bas = `http://127.0.0.1:${http.address().port}/gyro-range/form`;
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--disable-dev-shm-usage']
});
const sida = await browser.newPage();
sida.on('pageerror', (err) => fel.push(String(err)));
await sida.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

try {
  await mkdir(ART, { recursive: true });
  await sida.goto(bas + '/verkstad/#bibliotek', { waitUntil: 'domcontentloaded' });
  await vanta(sida, () => {
    const rot = document.querySelector('section[data-vy="bibliotek"]');
    if (rot?.dataset.redo !== 'bibliotek') return 'bibliotek';
    const text = rot.innerText;
    if (!text.includes('uppskattat av datorn')) return 'färgförklaring saknas';
    if (!text.includes('KUNSKAP_STARTURVAL')) return 'fokusvarning saknas';
    return true;
  }, 60000);
  await sida.click('[data-vag="nastan"] > summary');
  await sida.click('[data-vag="nastan/Tyskland"] > summary');
  await sida.click('[data-vag="nastan/Tyskland/Stridsvagnar"] > summary');
  await vanta(sida, () => {
    const rad = document.querySelector('[data-enhet="tiger_i"]')?.closest('.enhetsrad');
    if (!rad) return 'tiger rad saknas';
    if (!rad.querySelector('[data-checklista]')) return 'saknaslista saknas';
    if (!rad.querySelector('.uppskattat')) return 'gult värde saknas';
    if (!rad.querySelector('[data-beteende]')?.textContent.includes('IB-40')) return 'beteende saknas';
    return true;
  });
  await sida.evaluate(() => document.querySelector('[data-enhet="tiger_i"]')?.scrollIntoView({ block: 'center' }));
  await sida.screenshot({ path: join(ART, 'bibliotek-tiger-kort.png') });

  for (const id of FORDON) {
    await sida.goto(bas + '/verkstad/#enhet/' + id, { waitUntil: 'domcontentloaded' });
    await sida.waitForSelector('section[data-vy="kort"] canvas', { timeout: 40000 });
    await new Promise((r) => setTimeout(r, 500));
    await sida.evaluate(() => document.querySelector('[data-forhands]')?.scrollIntoView({ block: 'start' }));
    await sida.screenshot({ path: join(ART, 'fordon-' + id + '.png') });
    console.log('kort', id);
  }

  await sida.goto(bas + '/verkstad/#stall', { waitUntil: 'domcontentloaded' });
  await vanta(sida, () => document.querySelector('section[data-vy="stall"]')?.dataset.redo === 'mark' ? true : 'stall', 90000);
  for (const [index, id] of FORDON.entries()) {
    const sidaNamn = index % 2 === 0 ? 'rod' : 'bla';
    await sida.click('[data-valj-enhet]');
    await sida.waitForSelector('[data-sok-enhet]');
    const sok = await sida.$('[data-sok-enhet]');
    await sok.click({ clickCount: 3 });
    await sida.type('[data-sok-enhet]', id);
    await sida.waitForSelector(`[data-ark] [data-enhet="${id}"]`);
    await sida.click(`[data-ark] [data-enhet="${id}"]`);
    const xAndel = 0.22 + (index % 5) * 0.14;
    const yAndel = 0.34 + (index % 3) * 0.14;
    await sida.evaluate((xAndel, yAndel) => {
      const stall = document.querySelector('section[data-vy="stall"]');
      const oppnas = stall.querySelector('[data-ark]');
      if (oppnas && !oppnas.hidden && oppnas.querySelector('[data-avbryt]')) oppnas.querySelector('[data-avbryt]').click();
      stall._kamera.sattVy({ mal: [40, 20], d: 90, lutning: 58, kurs: 30 });
      const duk = stall.querySelector('[data-duk]');
      const r = duk.getBoundingClientRect();
      const opts = {
        clientX: r.left + r.width * xAndel,
        clientY: r.top + r.height * yAndel,
        bubbles: true,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true
      };
      duk.dispatchEvent(new PointerEvent('pointerdown', opts));
      duk.dispatchEvent(new PointerEvent('pointerup', opts));
    }, xAndel, yAndel);
    await sida.waitForSelector(`[data-ark]:not([hidden]) [data-sida="${sidaNamn}"]`, { timeout: 30000 });
    await sida.click(`[data-ark]:not([hidden]) [data-sida="${sidaNamn}"]`);
    await sida.waitForFunction((enhet) => !!document.querySelector(`[data-enhet-id="${enhet}"]`), { timeout: 30000 }, id);
    const near = await sida.evaluate((enhet) => {
      const stall = document.querySelector('section[data-vy="stall"]');
      const rad = stall.querySelector(`[data-enhet-id="${enhet}"]`);
      const terr = stall.querySelector('[data-terrangruta]');
      if (terr) terr.open = false;
      stall._kamera.sattVy({ mal: [Number(rad.dataset.x), Number(rad.dataset.z)], d: 14, lutning: 46, kurs: 150 });
      return stall._kamera.kamera.near;
    }, id);
    await new Promise((r) => setTimeout(r, 700));
    const nearEfter = await sida.evaluate(() => document.querySelector('section[data-vy="stall"]')._kamera.kamera.near);
    if (!(nearEfter < 0.5)) throw new Error(id + ' närplan för stor: ' + nearEfter);
    await sida.screenshot({ path: join(ART, 'stall-' + id + '.png') });
    console.log('stall', id, 'near', nearEfter);
  }
  await sida.evaluate(() => {
    const stall = document.querySelector('section[data-vy="stall"]');
    const rad = stall.querySelector('[data-enhet-id="tiger_i"]');
    stall._kamera.sattVy({ mal: [Number(rad.dataset.x), Number(rad.dataset.z)], d: 80, lutning: 38, kurs: 150 });
  });
  await new Promise((r) => setTimeout(r, 600));
  await sida.screenshot({ path: join(ART, 'stall-tiger_i-langre.png') });
  if (fel.length) throw new Error(fel.join('\n'));
  console.log('ok');
} finally {
  await browser.close();
  http.close();
}
