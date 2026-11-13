import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdir} from 'node:fs/promises';
import puppeteer from '/opt/cursor/tools/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

const rot = fileURLToPath(new URL('..', import.meta.url));
const bilder = '/opt/cursor/artifacts';
const fel = [];
const krav = (namn, ok, extra) => {
  if (!ok) fel.push(extra ? `${namn}: ${extra}` : namn);
};

function kor(cmd, args) {
  return new Promise((resolve) => {
    const barn = spawn(cmd, args, {cwd: rot, stdio: 'inherit'});
    barn.on('exit', (kod) => resolve(kod ?? 1));
  });
}

const js = ['konfig.js', 'fysik.js', 'gyro.js', 'ljud.js', 'brade.js', 'app.js', 'sjalvtest.mjs', 'verifiera.mjs'];
for (const fil of js) {
  const kod = await kor(process.execPath, ['--check', join(rot, 'labyrint', fil)]);
  krav(`node --check ${fil}`, kod === 0);
}
const sjalv = await kor(process.execPath, [join(rot, 'labyrint', 'sjalvtest.mjs')]);
krav('självtest', sjalv === 0);

const typer = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.webmanifest': 'application/manifest+json'};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    let relativ = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    if (!relativ || relativ.endsWith('/')) relativ += 'index.html';
    const fil = normalize(join(rot, relativ));
    if (!fil.startsWith(rot)) {
      res.writeHead(403);
      res.end();
      return;
    }
    const data = await readFile(fil);
    res.writeHead(200, {'content-type': typer[extname(fil)] || 'application/octet-stream', 'cache-control': 'no-store'});
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const adress = `http://127.0.0.1:${port}/labyrint/`;

const konsol = [];
const nat = [];
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--hide-scrollbars'],
});

async function synliga(page) {
  return page.evaluate(() => {
    const ut = [];
    for (const el of document.body.querySelectorAll('body *')) {
      if (el.closest('#menyKnapp') || el.id === 'spel') continue;
      if (el.closest('[hidden]')) continue;
      const stil = getComputedStyle(el);
      if (stil.display === 'none' || stil.visibility === 'hidden') continue;
      const text = (el.innerText || '').trim();
      if (!text || el.children.length) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      ut.push(`${el.id || el.tagName}: ${text.slice(0, 60)}`);
    }
    return ut;
  });
}

async function oppna(page, bredd, hojd) {
  const pageFel = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') pageFel.push(msg.text());
  });
  page.on('pageerror', (err) => pageFel.push(String(err)));
  page.on('requestfailed', (req) => {
    const u = req.url();
    if (u.startsWith('chrome-extension') || u.startsWith('data:')) return;
    pageFel.push(`nät ${u} ${req.failure()?.errorText || ''}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 400) pageFel.push(`status ${res.status()} ${res.url()}`);
  });
  await page.setViewport({width: bredd, height: hojd, deviceScaleFactor: 2, isMobile: true, hasTouch: true});
  await page.goto(adress, {waitUntil: 'networkidle0', timeout: 20000});
  await page.waitForFunction(() => window.__labyrint?.ritad, {timeout: 8000});
  await new Promise((r) => setTimeout(r, 250));
  return pageFel;
}

try {
  await mkdir(bilder, {recursive: true});
  const sida = await browser.newPage();
  const startFel = await oppna(sida, 390, 844);
  konsol.push(...startFel);

  await sida.evaluate(() => {
    window.__tillat = 0;
    const DOE = window.DeviceOrientationEvent || function DeviceOrientationEvent() {};
    window.DeviceOrientationEvent = DOE;
    DOE.requestPermission = () => {
      window.__tillat += 1;
      return Promise.resolve('granted');
    };
    const DME = window.DeviceMotionEvent || function DeviceMotionEvent() {};
    window.DeviceMotionEvent = DME;
    if (typeof DME.requestPermission !== 'function') DME.requestPermission = () => Promise.resolve('granted');
  });
  await sida.click('#startGyro');
  await sida.waitForFunction(() => window.__tillat >= 1 && window.__labyrint.igang, {timeout: 4000});
  const efterStart = await sida.evaluate(() => ({
    igang: window.__labyrint.igang,
    startDold: document.querySelector('#startKnappar').hidden,
    menyDold: document.querySelector('#meny').hidden,
  }));
  krav('iOS-tillstånd anropas från startknappen', true);
  krav('spelet är igång', efterStart.igang);
  krav('startknapparna är borta', efterStart.startDold);
  krav('menyn är stängd', efterStart.menyDold);
  const rent = await synliga(sida);
  krav('stående bräde utan textrutor', rent.length === 0, rent.join(' | '));
  await sida.screenshot({path: join(bilder, 'labyrint-staende.png')});

  await sida.click('#menyKnapp');
  await sida.waitForSelector('#meny:not([hidden])');
  const menyText = await sida.$eval('#meny', (el) => el.innerText);
  const nivaKnappar = await sida.$$eval('#banor button', (els) => els.map((el) => el.textContent.trim()));
  krav('tio nivåknappar', nivaKnappar.join(',') === '1,2,3,4,5,6,7,8,9,10', nivaKnappar.join(','));
  krav('menyn visar vald nivå', /Nivå 1/.test(menyText) && /Första/.test(menyText));
  krav('menyn har känsla', /Lugn/.test(menyText) && /Kvick/.test(menyText));
  krav('menyn har ljud och hjälpbanor', /Ljud/.test(menyText) && /Hjälpbanor/.test(menyText));
  krav('menyn har nollställning', /Nollställ/.test(menyText));
  krav('menyn har prestanda', /Bilder\/s/.test(menyText));
  krav('menyn länkar till alla länkar', /Alla länkar/.test(menyText));
  await sida.screenshot({path: join(bilder, 'labyrint-meny.png')});
  await sida.click('#stang');
  await sida.waitForSelector('#meny[hidden]');

  const banor = await sida.evaluate(() => {
    const api = window.__labyrint;
    const ut = [];
    for (let i = 0; i < api.antal(); i++) {
      api.bana(i);
      const b = api.boll();
      const data = api.banaData();
      ut.push({nummer: data.nummer, namn: data.namn, lage: b.lage, x: b.x, z: b.z});
    }
    api.bana(0);
    api.sattLutning(18, 14);
    api.steg(48, 1 / 60);
    return {ut, glipa: api.provGlipa()};
  });
  krav('alla tio nivåer laddar', banor.ut.length === 10 && banor.ut.every((b, i) => b.nummer === i + 1 && b.lage === 'rullar'), JSON.stringify(banor.ut));
  await sida.screenshot({path: join(bilder, 'labyrint-lutning.png')});
  krav('ingen svart glipa vid lutning', banor.glipa.bjork > 2000 && banor.glipa.glipa < 40, JSON.stringify(banor.glipa));
  const andra = await sida.evaluate(() => {
    const api = window.__labyrint;
    api.bana(9);
    api.sattLutning(-16, 12);
    api.steg(36, 1 / 60);
    return api.provGlipa();
  });
  await sida.screenshot({path: join(bilder, 'labyrint-niva10.png')});
  krav('ingen svart glipa på nivå 10', andra.bjork > 2000 && andra.glipa < 40, JSON.stringify(andra));
  await sida.evaluate(() => {
    window.__labyrint.slappLutning();
    window.__labyrint.bana(0);
  });

  const liggande = await browser.newPage();
  const liggFel = await oppna(liggande, 844, 390);
  konsol.push(...liggFel);
  await liggande.click('#startFinger');
  await liggande.waitForFunction(() => window.__labyrint.igang);
  const rentLigg = await synliga(liggande);
  krav('liggande bräde utan textrutor', rentLigg.length === 0, rentLigg.join(' | '));
  await new Promise((r) => setTimeout(r, 200));
  await liggande.screenshot({path: join(bilder, 'labyrint-liggande.png')});
  await liggande.close();

  const spel = await sida.evaluate(() => {
    const api = window.__labyrint;
    api.frys(true);
    api.bana(0);
    api.slappLutning();
    const start = api.boll();
    window.dispatchEvent(new KeyboardEvent('keydown', {code: 'ArrowUp', key: 'ArrowUp', bubbles: true}));
    api.steg(45, 1 / 60);
    const efterFram = api.boll();
    window.dispatchEvent(new KeyboardEvent('keyup', {code: 'ArrowUp', key: 'ArrowUp', bubbles: true}));
    const foreHoger = api.boll();
    window.dispatchEvent(new KeyboardEvent('keydown', {code: 'ArrowRight', key: 'ArrowRight', bubbles: true}));
    api.steg(40, 1 / 60);
    const efterHoger = api.boll();
    window.dispatchEvent(new KeyboardEvent('keyup', {code: 'ArrowRight', key: 'ArrowRight', bubbles: true}));

    const bana = api.banaData();
    const r = api.radie();
    const v = bana.vaggar[0];
    api.sattLutning(0, 0);
    api.placera(v.x, v.z + v.d / 2 + r + 0.004, 0, -0.45);
    let minZ = api.boll().z;
    let vande = false;
    let studs = false;
    for (let i = 0; i < 20; i++) {
      api.steg(1, 1 / 120);
      const b = api.boll();
      minZ = Math.min(minZ, b.z);
      if (b.vz > 0.05) vande = true;
    }
    studs = vande;
    const kant = v.z + v.d / 2 + r - 0.003;

    const h = bana.hal[0];
    api.sattLutning(0, 0);
    api.placera(h.x + (h.radie - 0.005), h.z, -0.05, 0);
    let foll = false;
    let minY = 1;
    for (let i = 0; i < 70; i++) {
      api.steg(1, 1 / 60);
      const b = api.boll();
      minY = Math.min(minY, b.y);
      if (b.lage === 'faller' || b.lage === 'paus') foll = true;
      if (b.lage === 'paus') break;
    }

    api.placera(bana.mal.x, bana.mal.z, 0, 0);
    api.sattLutning(0, 0);
    let vann = false;
    for (let i = 0; i < 50; i++) {
      api.steg(1, 1 / 60);
      if (api.boll().lage === 'mal') { vann = true; break; }
    }
    api.slappLutning();
    api.frys(false);
    return {
      fram: efterFram.z < start.z - 0.01,
      hoger: efterHoger.x > foreHoger.x + 0.008,
      studs: studs && minZ >= kant,
      hal: foll && minY < 0,
      mal: vann,
      z: [start.z, efterFram.z],
      x: [foreHoger.x, efterHoger.x],
      minZ, minY,
    };
  });
  krav('pil framåt rullar kulan framåt', spel.fram, JSON.stringify(spel.z));
  krav('pil höger rullar kulan åt höger', spel.hoger, JSON.stringify(spel.x));
  krav('väggstuds i webbläsaren', spel.studs, String(spel.minZ));
  krav('hålfall i webbläsaren', spel.hal, String(spel.minY));
  krav('mål i webbläsaren', spel.mal);

  await new Promise((r) => setTimeout(r, 400));
  const prestanda = await sida.evaluate(() => window.__labyrint.prestanda());
  krav('något ritas', prestanda.ritningar > 5, String(prestanda.ritningar));
  krav('bildfrekvensen tickar', prestanda.fps > 8, String(prestanda.fps));
  nat.push(...konsol);
  krav('0 konsolfel och nätverksfel', konsol.length === 0, konsol.join(' | '));
  console.log(JSON.stringify({prestanda, port, bilder: ['labyrint-staende.png', 'labyrint-lutning.png', 'labyrint-meny.png', 'labyrint-niva10.png', 'labyrint-liggande.png']}, null, 2));
} catch (e) {
  fel.push(e?.stack || String(e));
} finally {
  await browser.close();
  server.close();
}

if (fel.length) {
  console.error(fel.join('\n'));
  process.exit(1);
}
console.log('verifiering ok');
