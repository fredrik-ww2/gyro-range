import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROT = path.resolve(new URL('../../..', import.meta.url).pathname);
const PORT = 8765;
const BAS = `http://127.0.0.1:${PORT}/gyro-range/form`;
const ART = '/opt/cursor/artifacts';
fs.mkdirSync(ART, { recursive: true });

const TYPER = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.glb': 'model/gltf-binary',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.webp': 'image/webp'
};

function server() {
  return new Promise((resolve) => {
    const srv = http.createServer((beg, svar) => {
      let url = decodeURIComponent(beg.url.split('?')[0]);
      if (url.startsWith('/gyro-range/')) url = url.slice('/gyro-range'.length);
      if (url.endsWith('/')) url += 'index.html';
      const fil = path.normalize(path.join(ROT, url));
      if (!fil.startsWith(ROT) || !fs.existsSync(fil) || fs.statSync(fil).isDirectory()) {
        svar.writeHead(404); svar.end('saknas'); return;
      }
      svar.writeHead(200, { 'content-type': TYPER[path.extname(fil)] || 'application/octet-stream', 'cache-control': 'no-store' });
      fs.createReadStream(fil).pipe(svar);
    });
    srv.listen(PORT, '127.0.0.1', () => resolve(srv));
  });
}

function harmlos(text) {
  return /cdn-cgi|favicon\.ico/.test(text);
}

const fel = [];
let raknaFel = true;
function bevaka(page, namn) {
  page.on('pageerror', (error) => {
    if (!raknaFel) return;
    const rad = namn + ' pageerror: ' + error.message;
    fel.push(rad);
    console.error(rad);
  });
  page.on('console', (msg) => {
    if (!raknaFel || msg.type() !== 'error') return;
    const text = msg.text();
    if (harmlos(text)) return;
    const rad = namn + ' console: ' + text;
    fel.push(rad);
    console.error(rad);
  });
}

async function bild(page, namn) {
  await page.screenshot({ path: path.join(ART, namn + '.png'), fullPage: false });
}

const srv = await server();
const browser = await chromium.launch({
  headless: true,
  channel: 'chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
});
const page = await context.newPage();
bevaka(page, 'verkstad');

try {
  await page.goto(BAS + '/verkstad/#bibliotek', { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-mapp="enheter/klara"][data-tom="true"]');
  const tom = await page.locator('[data-mapp="enheter/klara"]').innerText();
  if (!tom.includes('Tom mapp')) throw new Error('Klara-mappen saknar tomtext: ' + tom);
  for (const id of ['stilar', 'forband', 'intelligens', 'regler', 'scenarier', 'resultat', 'enheter/under_utveckling/1_nastan_klar']) {
    await page.waitForSelector(`[data-mapp="${id}"][data-tom="true"]`);
  }
  await bild(page, '01-bibliotek');

  await page.locator('[data-mapp="enheter/under_utveckling/3_tidigt_skede"] summary').click();
  await page.locator('[data-enhet="tiger_ii"]').click();
  await page.waitForSelector('.statusrad[data-status="under_utveckling"]');
  const tidig = await page.locator('[data-saknas]').innerText();
  if (!/modell/i.test(tidig)) throw new Error('Tiger II saknar inte modelltext: ' + tidig);
  if (await page.locator('[data-status="klar"]').count()) throw new Error('En enhet visades som klar');
  await bild(page, '02-under-utveckling');

  await page.goto(BAS + '/verkstad/#enhet/sherman_m4_75', { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-falt="fart_per_terrang.vag"]');
  await page.waitForSelector('canvas', { timeout: 20000 });
  const status = await page.locator('.statusrad').innerText();
  if (/Klar/.test(status) && !/Under utveckling/.test(status)) throw new Error('Sherman visades som klar: ' + status);
  await page.locator('[data-falt="traffchans_per_avstand.100"]').scrollIntoViewIfNeeded();
  await bild(page, '03-grafer');
  await page.locator('[data-fordjupa]').click();
  await page.waitForSelector('[data-falt="fart_per_terrang.skog"]');
  const samman = await page.locator('[data-sammanfattning]').innerText();
  if (!/väg/i.test(samman)) throw new Error('Fartsammanfattning saknas: ' + samman);
  await page.locator('[data-sammanfattning]').scrollIntoViewIfNeeded();
  await bild(page, '04-fordjupa');
  await page.locator('[data-tab="beteende"]').click();
  await page.waitForSelector('[data-reglage="skyddssokning"]');
  const regler = await page.locator('.regler').innerText();
  if (!regler.includes('IB-40')) throw new Error('IB-40 saknas');
  await bild(page, '05-beteende');

  await page.locator('[data-tab="varden"]').click();
  const fore = await page.locator('[data-falt="fart_per_terrang.vag"] [data-varde]').innerText();
  await page.locator('input[data-sokvag="fart_per_terrang.vag"]').evaluate((input) => {
    input.value = '44';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForFunction(() => document.querySelector('section[data-vy="kort"]')?.dataset.sparad);
  const efter = await page.locator('[data-falt="fart_per_terrang.vag"] [data-varde]').innerText();
  if (!efter.includes('44')) throw new Error('Fart ändrades inte: ' + efter + ' från ' + fore);
  const marke = await page.locator('[data-falt="fart_per_terrang.vag"] [data-marke]').innerText();
  if (marke !== 'bestämd av dig') throw new Error('Fel märke efter ändring: ' + marke);

  await page.locator('[data-godkann="rackvidd"]').click();
  await page.waitForFunction(() => {
    const m = document.querySelector('[data-falt="rackvidd"] [data-marke]');
    return m && m.textContent === 'bestämd av dig';
  });
  const rackKlass = await page.locator('[data-falt="rackvidd"] [data-marke]').getAttribute('class');
  if (rackKlass.includes('uppskattat') || rackKlass.includes('kalla')) throw new Error('Godkänn såg ut som uppskattning eller källa: ' + rackKlass);

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('[data-falt="fart_per_terrang.vag"]');
  const igen = await page.locator('[data-falt="fart_per_terrang.vag"] [data-varde]').innerText();
  if (!igen.includes('44')) throw new Error('Farten försvann vid omladdning: ' + igen);
  const rackIgen = await page.locator('[data-falt="rackvidd"] [data-marke]').innerText();
  if (rackIgen !== 'bestämd av dig') throw new Error('Godkännandet försvann: ' + rackIgen);
  await bild(page, '06-sparat-varde');

  await page.goto(BAS + '/verkstad/#stall', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-redo="mark"]', { timeout: 90000 });
  await page.waitForFunction(() => Number(document.querySelector('section[data-vy="stall"]').getAttribute('data-trianglar')) > 0);
  await page.locator('[data-valj-enhet]').click();
  await page.locator('[data-ark] [data-enhet="sherman_m4_75"]').click();
  const duk = page.locator('section[data-vy="stall"] canvas');
  const box = await duk.boundingBox();
  const punkter = [[0.32, 0.42], [0.62, 0.38], [0.48, 0.62], [0.7, 0.58], [0.38, 0.68], [0.58, 0.48]];
  for (let i = 0; i < punkter.length; i++) {
    const [px, py] = punkter[i];
    await page.mouse.click(box.x + box.width * px, box.y + box.height * py);
    await page.locator(`[data-ark] [data-sida="${i < 3 ? 'bla' : 'rod'}"]`).click();
    await page.waitForFunction((antal) => Number(document.querySelector('section[data-vy="stall"]').getAttribute('data-placeringar')) === antal, i + 1);
  }
  if (await page.locator('section[data-vy="stall"]').getAttribute('data-bla') !== '3') throw new Error('Inte 3 blå');
  if (await page.locator('section[data-vy="stall"]').getAttribute('data-rod') !== '3') throw new Error('Inte 3 röda');
  const tri = Number(await page.locator('section[data-vy="stall"]').getAttribute('data-trianglar'));
  if (tri > 50000) throw new Error('För många trianglar: ' + tri);
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.45);
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, -500);
  await page.waitForTimeout(700);
  await bild(page, '07-stall-ut');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-redo="mark"]', { timeout: 90000 });
  await page.waitForFunction(() => document.querySelector('section[data-vy="stall"]').getAttribute('data-placeringar') === '6');
  if (await page.locator('section[data-vy="stall"]').getAttribute('data-bla') !== '3') throw new Error('Blå försvann');
  if (await page.locator('section[data-vy="stall"]').getAttribute('data-rod') !== '3') throw new Error('Röd försvann');
  await page.locator('[data-lista] [data-handling="flytta"]').first().click();
  const box2 = await duk.boundingBox();
  await page.mouse.click(box2.x + box2.width * 0.5, box2.y + box2.height * 0.3);
  await page.waitForFunction(() => document.querySelector('section[data-vy="stall"]').getAttribute('data-sparad'));
  await page.locator('[data-lista] [data-handling="tabort"]').first().click();
  await page.waitForFunction(() => document.querySelector('section[data-vy="stall"]').getAttribute('data-placeringar') === '5');
  await bild(page, '08-efter-flytt');

  raknaFel = false;
  const sidor = ['/', '/hus/', '/satellit/', '/omrade/', '/omrade/anslutning/', '/omrade/exempel/', '/metod/', '/optimera/', '/bygginstruktion/'];
  for (const sida of sidor) {
    const svar = await page.goto(BAS + sida, { waitUntil: 'domcontentloaded' });
    if (!svar || !svar.ok()) throw new Error('Sidan laddade inte: ' + sida + ' ' + svar?.status());
    const text = await page.locator('body').innerText();
    if (text.length < 40) throw new Error('Tom sida: ' + sida);
    await page.waitForSelector('#verkstad-ingang-host', { timeout: 8000 });
  }
  await page.goto(BAS + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#verkstad-ingang-host');
  await bild(page, '09-form-ingang');
  const verkstad = page.locator('#verkstad-ingang-host');
  await verkstad.locator('a').click();
  await page.waitForSelector('[data-vy="bibliotek"]');

  if (fel.length) {
    console.error(fel.join('\n'));
    throw new Error(fel.length + ' konsolfel');
  }
  console.log('ALLT_OK');
} finally {
  await browser.close();
  srv.close();
}
