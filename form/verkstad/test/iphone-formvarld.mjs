/* Headless Chrome, iPhone-vy: FORM-värld i Världar, utställning som finns kvar efter omladdning. */
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROT = fileURLToPath(new URL('../../../..', import.meta.url));
const ART = '/opt/cursor/artifacts';
const ID = '11111111-2222-4333-8444-555555555555';
const NAMN = 'Testängen';
const TYPER = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.ktx2': 'application/octet-stream',
  '.wasm': 'application/wasm'
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
        if (!fil.startsWith(ROT)) {
          svar.writeHead(403);
          svar.end();
          return;
        }
        const data = await readFile(fil);
        svar.writeHead(200, { 'content-type': TYPER[extname(fil)] || 'application/octet-stream', 'cache-control': 'no-store' });
        svar.end(data);
      } catch {
        svar.writeHead(404);
        svar.end();
      }
    });
    http.listen(0, '127.0.0.1', () => resolve(http));
  });
}

async function vanta(sida, fn, ms = 20000) {
  const start = Date.now();
  let senast = '';
  while (Date.now() - start < ms) {
    senast = await sida.evaluate(fn);
    if (senast === true || senast === 'ok') return;
    await new Promise((r) => setTimeout(r, 200));
  }
  const extra = await sida.evaluate(() => ({
    text: document.body?.innerText?.slice(0, 800) || '',
    redo: document.querySelector('[data-vy="bibliotek"]')?.dataset?.formVarldar ?? null,
    vy: document.body?.dataset?.vy || ''
  })).catch((err) => String(err));
  throw new Error('Tidsgräns. Senaste: ' + senast + ' | ' + JSON.stringify(extra) + ' | fel: ' + fel.slice(0, 8).join(' || '));
}

async function laggInVarld(sida) {
  await sida.evaluate(async (id, namn) => {
    const duk = document.createElement('canvas');
    duk.width = 256;
    duk.height = 192;
    const rit = duk.getContext('2d');
    rit.fillStyle = '#3d7a45';
    rit.fillRect(0, 0, 256, 192);
    rit.fillStyle = '#c4a15a';
    rit.fillRect(0, 80, 256, 28);
    rit.fillStyle = '#6ea0b8';
    rit.beginPath();
    rit.arc(200, 40, 28, 0, Math.PI * 2);
    rit.fill();
    const bild = duk.toDataURL('image/jpeg', 0.85);
    const sidaRutor = 32;
    const labels = new Array(sidaRutor * sidaRutor).fill(0);
    const confidence = new Array(sidaRutor * sidaRutor).fill(0.8);
    labels[10 * sidaRutor + 8] = 1;
    const rgb = [];
    for (let i = 0; i < 8 * 8; i += 1) rgb.push(70, 120, 60);
    const post = {
      version: 1,
      id,
      name: namn,
      image: bild,
      analysis: {
        version: 1,
        width: sidaRutor,
        height: sidaRutor,
        labels,
        confidence,
        coverage: [0.9, 0.1, 0, 0, 0, 0],
        fingerprint: 123456,
        warnings: [],
        colorGrid: { width: 8, height: 8, rgb },
        buildings: [{
          u: 0.22, v: 0.28, w: 0.06, d: 0.08, angle: 0.2,
          color: [0.55, 0.32, 0.22], roof: 'pitched', confidence: 0.8
        }]
      },
      settings: {
        widthMeters: 180,
        relief: 4,
        density: 1,
        seed: 42,
        detail: 'mobile',
        treeType: 'mixed',
        appearance: 'nature',
        heightSeed: 42
      },
      updatedAt: '2026-11-08T12:00:00.000Z'
    };
    await new Promise((resolve, reject) => {
      const beg = indexedDB.open('form-landscapes-v1', 1);
      beg.onupgradeneeded = () => {
        if (!beg.result.objectStoreNames.contains('projects')) {
          beg.result.createObjectStore('projects', { keyPath: 'id' });
        }
      };
      beg.onerror = () => reject(beg.error);
      beg.onsuccess = () => {
        const db = beg.result;
        const tx = db.transaction('projects', 'readwrite');
        tx.objectStore('projects').put(post);
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
    });
  }, ID, NAMN);
}

const http = await server();
const port = http.address().port;
const bas = `http://127.0.0.1:${port}/gyro-range/form`;
const webblasare = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: [
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--disable-gpu-sandbox',
    '--no-sandbox',
    '--disable-dev-shm-usage'
  ]
});
const sida = await webblasare.newPage();
sida.on('console', (meddelande) => {
  if (meddelande.type() === 'error') fel.push(meddelande.text());
});
sida.on('pageerror', (err) => fel.push(String(err)));
await sida.emulate({
  viewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
});

try {
  await sida.goto(bas + '/verkstad/', { waitUntil: 'domcontentloaded' });
  await laggInVarld(sida);

  await sida.goto(bas + '/satellit/', { waitUntil: 'domcontentloaded' });
  await sida.waitForSelector('#verkstad-ingang-host', { timeout: 8000 });
  await laggInVarld(sida);
  const knapp = await sida.evaluate(() => {
    const host = document.getElementById('verkstad-ingang-host');
    const lank = host?.shadowRoot?.querySelector('a');
    return { text: lank?.textContent || '', href: lank?.href || '' };
  });
  if (!knapp.text.includes('Ställ ut den här världen')) throw new Error('Knappen saknar text: ' + knapp.text);
  if (!knapp.href.includes('#stall/form/' + encodeURIComponent(ID))) throw new Error('Knappen pekar fel: ' + knapp.href);

  fel.length = 0;
  await sida.goto(bas + '/verkstad/#bibliotek', { waitUntil: 'domcontentloaded' });
  await vanta(sida, () => {
    const rot = document.querySelector('section[data-vy="bibliotek"]');
    if (!rot) return 'biblioteket saknas';
    const namn = [...document.querySelectorAll('[data-form-namn]')].map((n) => n.getAttribute('data-form-namn'));
    if (!namn.length && rot.innerText.includes('Läser världar')) return 'läser FORM';
    const villers = !!document.querySelector('[data-varld="villers_bocage"]');
    if (!villers) return 'Villers-Bocage saknas';
    if (!namn.includes('Testängen')) return 'Testängen saknas: ' + namn.join(',');
    const liten = document.querySelector('[data-form-namn="Testängen"] small')?.textContent || '';
    if (!liten.includes('180')) return 'storlek saknas: ' + liten;
    return true;
  }, 40000);
  await mkdir(ART, { recursive: true });
  const varldKnapp = await sida.$('[data-form-namn="Testängen"]');
  await varldKnapp.evaluate((nod) => nod.scrollIntoView({ block: 'center' }));
  await sida.screenshot({ path: join(ART, 'varldar-form-varld.png') });

  await varldKnapp.click();
  await vanta(sida, () => {
    const stall = document.querySelector('section[data-vy="stall"]');
    if (!stall || stall.hidden) return 'stall dolt';
    if (stall.dataset.redo !== 'mark') return 'redo=' + stall.dataset.redo;
    if (stall.dataset.varld !== 'form:11111111-2222-4333-8444-555555555555') return 'varld=' + stall.dataset.varld;
    const sidaPx = Number(stall.dataset.textur || 0);
    if (!sidaPx || sidaPx > 2048) return 'textur=' + stall.dataset.textur;
    return true;
  }, 30000);

  await sida.click('[data-valj-enhet]');
  await sida.waitForSelector('[data-sok-enhet]');
  await sida.type('[data-sok-enhet]', 'Tiger');
  await sida.waitForSelector('[data-ark] [data-enhet="tiger_i"]');
  await sida.click('[data-ark] [data-enhet="tiger_i"]');
  const duk = await sida.$('[data-duk]');
  const ruta = await duk.boundingBox();
  await sida.mouse.click(ruta.x + ruta.width * 0.38, ruta.y + ruta.height * 0.55);
  await sida.waitForSelector('[data-ark]:not([hidden]) [data-sida="bla"]', { visible: true, timeout: 30000 });
  await sida.click('[data-ark]:not([hidden]) [data-sida="bla"]');
  await vanta(sida, () => document.querySelector('section[data-vy="stall"]')?.dataset.bla === '1' ? true : 'bla=' + document.querySelector('section[data-vy="stall"]')?.dataset.bla);

  await sida.mouse.click(ruta.x + ruta.width * 0.68, ruta.y + ruta.height * 0.42);
  await sida.waitForSelector('[data-ark]:not([hidden]) [data-sida="rod"]', { visible: true, timeout: 30000 });
  await sida.click('[data-ark]:not([hidden]) [data-sida="rod"]');
  await vanta(sida, () => {
    const stall = document.querySelector('section[data-vy="stall"]');
    return stall?.dataset.bla === '1' && stall?.dataset.rod === '1' ? true : `bla=${stall?.dataset.bla} rod=${stall?.dataset.rod}`;
  });
  await new Promise((r) => setTimeout(r, 600));
  await sida.screenshot({ path: join(ART, 'utstallda-enheter-form-varld.png') });

  await sida.reload({ waitUntil: 'domcontentloaded' });
  await vanta(sida, () => {
    const stall = document.querySelector('section[data-vy="stall"]');
    if (!stall || stall.dataset.redo !== 'mark') return 'inte redo';
    const sidor = [...stall.querySelectorAll('[data-placering]')].map((n) => n.dataset.sida).sort();
    if (sidor.join(',') !== 'bla,rod') return 'sidor=' + sidor.join(',');
    return true;
  }, 30000);

  await sida.goto(bas + '/verkstad/#stall', { waitUntil: 'domcontentloaded' });
  await vanta(sida, () => {
    const stall = document.querySelector('section[data-vy="stall"]');
    if (!stall || stall.dataset.redo !== 'mark') return 'villers inte redo ' + stall?.dataset.redo;
    if (stall.dataset.varld !== 'villers_bocage') return 'fel värld ' + stall.dataset.varld;
    if (stall.dataset.placeringar !== '0') return 'villers har utställningar ' + stall.dataset.placeringar;
    return true;
  }, 60000);

  const unika = [...new Set(fel)];
  if (unika.length) throw new Error('Konsolfel:\n' + unika.join('\n'));
  console.log('ok');
} finally {
  await webblasare.close();
  http.close();
}
