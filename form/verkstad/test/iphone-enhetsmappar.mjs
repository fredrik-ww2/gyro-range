/* Headless Chrome, iPhone-vy: mappar i biblioteket och i Välj enhet. */
import { mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROT = fileURLToPath(new URL('../../../..', import.meta.url));
const ART = '/opt/cursor/artifacts';
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
const port = http.address().port;
const bas = `http://127.0.0.1:${port}/gyro-range/form`;
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
  await sida.goto(bas + '/verkstad/#bibliotek', { waitUntil: 'domcontentloaded' });
  await vanta(sida, () => {
    const rot = document.querySelector('section[data-vy="bibliotek"]');
    if (!rot || rot.dataset.redo !== 'bibliotek') return 'bibliotek ' + rot?.dataset.redo;
    const vag = [...rot.querySelectorAll('[data-enhetstrad] > details')].map((nod) => nod.dataset.vag);
    if (vag.join(',') !== 'fardiga,nastan,utveckling') return 'ordning ' + vag.join(',');
    const fardiga = rot.querySelector('[data-vag="fardiga"]');
    if (fardiga.dataset.tom !== 'true' || fardiga.dataset.antal !== '0') return 'färdiga ' + fardiga.dataset.antal;
    const nastan = Number(rot.querySelector('[data-vag="nastan"]').dataset.antal);
    const utveckling = Number(rot.querySelector('[data-vag="utveckling"]').dataset.antal);
    if (nastan < 1 || utveckling < 1) return `antal nästan=${nastan} utveckling=${utveckling}`;
    const kulsprutor = rot.querySelectorAll('[data-vapen="Kulsprutor"]').length;
    const ovriga = rot.querySelectorAll('[data-land="Övriga"]').length;
    if (kulsprutor < 1) return 'kulsprutor saknas';
    if (ovriga < 1) return 'övriga saknas';
    const tomLand = [...rot.querySelectorAll('[data-land]')].filter((nod) => nod.dataset.antal === '0');
    if (tomLand.length) return 'tomt land visas';
    const hojd = rot.querySelector('[data-vag="utveckling"] summary').getBoundingClientRect().height;
    if (hojd < 52) return 'för låg träffyta ' + hojd;
    return true;
  }, 60000);
  await sida.screenshot({ path: join(ART, 'enhetsmappar-stangda.png') });

  await sida.click('[data-vag="nastan"] > summary');
  await sida.click('[data-vag="nastan/Tyskland"] > summary');
  await sida.click('[data-vag="nastan/Tyskland/Stridsvagnar"] > summary');
  await sida.evaluate(() => {
    document.querySelector('[data-vag="nastan"] > summary')?.scrollIntoView({ block: 'start' });
  });
  await vanta(sida, () => {
    const vapen = document.querySelector('[data-vag="nastan/Tyskland/Stridsvagnar"]');
    if (!vapen?.open) return 'stridsvagnar stängd';
    if (!vapen.querySelector('[data-enhet="tiger_i"]')) return 'tiger saknas';
    const sparad = localStorage.getItem('form-verkstad-senaste-mapp');
    if (sparad !== 'nastan/Tyskland/Stridsvagnar') return 'minne ' + sparad;
    const landAntal = Number(document.querySelector('[data-vag="nastan/Tyskland"]').dataset.antal);
    const vapenAntal = Number(vapen.dataset.antal);
    if (vapenAntal < 1 || vapenAntal > landAntal) return `antal vapen=${vapenAntal} land=${landAntal}`;
    return true;
  });
  await sida.screenshot({ path: join(ART, 'enhetsmappar-tyskland-stridsvagnar.png') });

  await sida.reload({ waitUntil: 'domcontentloaded' });
  await vanta(sida, () => {
    const rot = document.querySelector('section[data-vy="bibliotek"]');
    if (rot?.dataset.redo !== 'bibliotek') return 'inte redo';
    const vapen = document.querySelector('[data-vag="nastan/Tyskland/Stridsvagnar"]');
    if (!vapen?.open) return 'minnet öppnade inte mappen';
    if (!document.querySelector('[data-vag="nastan"]')?.open) return 'förälder stängd';
    return true;
  }, 60000);
  await sida.screenshot({ path: join(ART, 'enhetsmappar-ihagkommen.png') });

  await sida.goto(bas + '/verkstad/#stall', { waitUntil: 'domcontentloaded' });
  await vanta(sida, () => {
    const stall = document.querySelector('section[data-vy="stall"]');
    if (!stall || stall.dataset.redo !== 'mark') return 'stall ' + stall?.dataset.redo;
    return true;
  }, 90000);
  await sida.click('[data-valj-enhet]');
  await vanta(sida, () => {
    const ark = document.querySelector('[data-ark]');
    if (!ark || ark.hidden) return 'ark dolt';
    const vag = [...ark.querySelectorAll('[data-enhetstrad] > details')].map((nod) => nod.dataset.vag);
    if (vag.join(',') !== 'fardiga,nastan,utveckling') return 'välj-ordning ' + vag.join(',');
    const oppen = ark.querySelector('[data-vag="nastan/Tyskland/Stridsvagnar"]');
    if (!oppen?.open) return 'väljaren minns inte';
    return true;
  });
  await sida.screenshot({ path: join(ART, 'enhetsmappar-valj-enhet.png') });

  await sida.type('[data-sok-enhet]', 'Tiger');
  await vanta(sida, () => {
    const tiger = document.querySelector('[data-ark] [data-enhet="tiger_i"]');
    if (!tiger || tiger.hidden) return 'tiger dold i sök';
    const mapp = tiger.closest('details');
    if (!mapp?.open) return 'sök öppnade inte mappen';
    return true;
  });
  await sida.screenshot({ path: join(ART, 'enhetsmappar-sok-tiger.png') });

  const unika = [...new Set(fel)];
  if (unika.length) throw new Error('Konsolfel:\n' + unika.join('\n'));
  console.log('ok');
} finally {
  await webblasare.close();
  http.close();
}
