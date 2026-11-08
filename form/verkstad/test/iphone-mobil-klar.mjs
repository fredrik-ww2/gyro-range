/* Headless iPhone: hel Tiger, mobilruta, terräng, mätare, fågelperspektiv och Klar. */
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
  '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.ktx2': 'application/octet-stream', '.wasm': 'application/wasm'
};
const fel = [];

function server() {
  return new Promise((resolve) => {
    const http = createServer(async (beg, svar) => {
      try {
        const url = new URL(beg.url, 'http://127.0.0.1');
        let stig = decodeURIComponent(url.pathname);
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
  throw new Error('Tidsgräns. Senaste: ' + senast + ' | fel: ' + fel.slice(0, 6).join(' || '));
}

const http = await server();
const bas = `http://127.0.0.1:${http.address().port}/gyro-range/form`;
const webblasare = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', '--disable-dev-shm-usage']
});
const sida = await webblasare.newPage();
sida.on('console', (meddelande) => {
  if (meddelande.type() !== 'error') return;
  const text = meddelande.text();
  if (text.startsWith('Failed to load resource') && text.includes('404')) return;
  fel.push(text);
});
sida.on('pageerror', (err) => fel.push(String(err)));
await sida.emulate({
  viewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
});

try {
  await mkdir(ART, { recursive: true });
  await sida.goto(bas + '/verkstad/#enhet/tiger_i', { waitUntil: 'domcontentloaded' });
  await vanta(sida, () => {
    const kort = document.querySelector('section[data-vy="kort"]');
    if (!kort) return 'inget kort';
    if (!kort.querySelector('[data-punkt="modell"]')) return 'checklista saknas';
    if (!kort.querySelector('canvas')) return 'ingen förhandsvisning';
    return true;
  }, 40000);
  await new Promise((r) => setTimeout(r, 600));
  await sida.evaluate(() => document.querySelector('[data-forhands]')?.scrollIntoView({ block: 'start' }));
  await sida.screenshot({ path: join(ART, 'tiger-narbild.png') });

  await sida.click('#tab-mobil');
  await vanta(sida, () => {
    const lista = document.querySelector('[data-mobil]');
    if (!lista || lista.closest('[hidden]')) return 'mobil dold';
    const text = lista.innerText;
    if (!text.includes('Närbild') || !text.includes('Skuggproxy') || !text.includes('Komprimering')) return text.slice(0, 180);
    return true;
  });
  await sida.screenshot({ path: join(ART, 'tiger-mobil.png') });

  await sida.click('#tab-saknas');
  await vanta(sida, () => document.querySelector('[data-saknas-panel]') && !document.querySelector('[data-panel="saknas"]').hidden ? true : 'saknas dold');
  await sida.screenshot({ path: join(ART, 'tiger-saknas.png') });

  await sida.click('#tab-varden');
  await vanta(sida, () => document.querySelector('[data-stridstabell] tr') ? true : 'ingen tabell');
  await sida.screenshot({ path: join(ART, 'tiger-stridsvarden.png') });

  await sida.click('#tab-beteende');
  await vanta(sida, () => {
    const rubrik = [...document.querySelectorAll('h2')].some((nod) => nod.textContent.includes('Individbeteende'));
    return rubrik && !document.querySelector('[data-panel="beteende"]').hidden ? true : 'beteende saknas';
  });
  await sida.screenshot({ path: join(ART, 'tiger-beteende.png') });

  await sida.goto(bas + '/verkstad/#stall', { waitUntil: 'domcontentloaded' });
  await vanta(sida, () => {
    const stall = document.querySelector('section[data-vy="stall"]');
    if (!stall || stall.dataset.redo !== 'mark') return 'stall ' + stall?.dataset.redo;
    if (!stall.querySelector('[data-terrangruta]')) return 'terrängruta saknas';
    if (!stall.querySelector('[data-lodmatare]')) return 'mätare saknas';
    if (!stall.querySelector('[data-fagel]')) return 'fågel saknas';
    return true;
  }, 90000);
  await sida.click('[data-terrangruta] > summary');
  await new Promise((r) => setTimeout(r, 400));
  await sida.screenshot({ path: join(ART, 'stall-terrangruta.png') });
  await sida.evaluate(() => document.querySelector('[data-lodmatare]')?.scrollIntoView({ block: 'end' }));
  await sida.screenshot({ path: join(ART, 'stall-lodmatare.png') });

  await sida.click('[data-fagel]');
  await new Promise((r) => setTimeout(r, 900));
  await vanta(sida, () => document.querySelector('[data-fagel]')?.getAttribute('aria-pressed') === 'true' ? true : 'fågel inte på');
  await sida.screenshot({ path: join(ART, 'stall-fagelperspektiv.png') });

  await sida.click('[data-valj-enhet]');
  await sida.waitForSelector('[data-sok-enhet]');
  await sida.type('[data-sok-enhet]', 'Tiger');
  await sida.waitForSelector('[data-ark] [data-enhet="tiger_i"]');
  await sida.click('[data-ark] [data-enhet="tiger_i"]');
  const duk = await sida.$('[data-duk]');
  const ruta = await duk.boundingBox();
  await sida.mouse.click(ruta.x + ruta.width * 0.5, ruta.y + ruta.height * 0.55);
  await sida.waitForSelector('[data-ark]:not([hidden]) [data-sida="bla"]', { timeout: 30000 });
  await sida.click('[data-ark]:not([hidden]) [data-sida="bla"]');
  await vanta(sida, () => document.querySelector('[data-klar]') && !document.querySelector('[data-klar]').hidden ? true : 'klar dold');
  await sida.evaluate(() => {
    const stall = document.querySelector('section[data-vy="stall"]');
    const ruta = stall.querySelector('[data-terrangruta]');
    if (ruta) ruta.open = false;
    const rad = stall.querySelector('[data-placering]');
    stall._kamera.sattVy({ mal: [Number(rad.dataset.x), Number(rad.dataset.z)], d: 14, lutning: 58, kurs: 28 });
  });
  await new Promise((r) => setTimeout(r, 700));
  await sida.screenshot({ path: join(ART, 'tiger-stall-narbild.png') });
  await sida.click('[data-klar]');
  await vanta(sida, () => {
    const ark = document.querySelector('[data-ark]');
    if (!ark || ark.hidden) return 'ark dolt';
    if (!ark.querySelector('[data-testa-grafik]') || !ark.querySelector('[data-spela]')) return 'val saknas';
    return ark.innerText.includes('första version') || ark.innerText.includes('Första version') ? true : ark.innerText.slice(0, 200);
  });
  await sida.screenshot({ path: join(ART, 'stall-klar-val.png') });

  const unika = [...new Set(fel)];
  if (unika.length) throw new Error('Konsolfel:\n' + unika.join('\n'));
  console.log('ok');
} finally {
  await webblasare.close();
  http.close();
}
