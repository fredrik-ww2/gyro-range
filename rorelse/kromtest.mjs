// Headless Chrome: simulerad rörelse och simulerat "slut".
// Kör: node rorelse/kromtest.mjs
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const debugPort = 9334;
const profile = `/tmp/rorelse-chrome-${process.pid}`;
const art = '/opt/cursor/artifacts';
const fel = [];
const konsol = [];

function krav(namn, ok, extra) {
  console.log(`${ok ? 'ok ' : 'FEL'} ${namn}${!ok && extra ? ' — ' + extra : ''}`);
  if (!ok) fel.push(extra ? `${namn}: ${extra}` : namn);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function startaServer() {
  const typer = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8'
  };
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url, 'http://127.0.0.1');
        let path = decodeURIComponent(url.pathname);
        if (path.endsWith('/')) path += 'index.html';
        const full = normalize(join(root, path));
        if (!full.startsWith(normalize(root))) { res.writeHead(403); res.end(); return; }
        const data = await readFile(full);
        res.writeHead(200, { 'content-type': typer[extname(full)] || 'application/octet-stream', 'cache-control': 'no-store' });
        res.end(data);
      } catch (e) {
        res.writeHead(404);
        res.end('saknas');
      }
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function hamta(url) {
  return new Promise((resolve, reject) => {
    const req = globalThis.fetch(url).then((r) => r.text()).then(resolve, reject);
    void req;
  });
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.nasta = 1;
    this.vant = new Map();
    this.lyss = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.vant.has(msg.id)) {
        const { resolve, reject } = this.vant.get(msg.id);
        this.vant.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result || {});
      } else if (msg.method) {
        for (const fn of this.lyss.get(msg.method) || []) fn(msg.params || {});
      }
    });
  }
  send(method, params = {}) {
    const id = this.nasta++;
    const p = new Promise((resolve, reject) => this.vant.set(id, { resolve, reject }));
    this.ws.send(JSON.stringify({ id, method, params }));
    return p;
  }
  on(method, fn) {
    const arr = this.lyss.get(method) || [];
    arr.push(fn);
    this.lyss.set(method, arr);
  }
}

const MOCK = `
window.__antalTal = 0;
window.__fakeTal = null;
class FakeTal {
  constructor() {
    window.__antalTal += 1;
    this.lang = '';
    this.continuous = false;
    this.interimResults = false;
    window.__fakeTal = this;
  }
  start() {}
  stop() {}
  abort() {}
}
window.SpeechRecognition = FakeTal;
window.webkitSpeechRecognition = FakeTal;
try {
  const svar = () => Promise.resolve({ getTracks: () => [{ stop() {} }] });
  if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = svar;
  else Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: svar } });
} catch (e) { window.__mockFel = String(e); }
try { if (window.DeviceMotionEvent) window.DeviceMotionEvent.requestPermission = () => Promise.resolve('granted'); } catch (e) {}
try { if (window.DeviceOrientationEvent) window.DeviceOrientationEvent.requestPermission = () => Promise.resolve('granted'); } catch (e) {}
`;

async function main() {
  await rm(profile, { recursive: true, force: true });
  await mkdir(art, { recursive: true });
  const server = await startaServer();
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}/rorelse/`;
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--no-first-run',
    '--disable-extensions',
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profile}`,
    '--window-size=390,844',
    'about:blank'
  ], { stdio: 'ignore' });

  let cdp;
  try {
    let version = null;
    for (let i = 0; i < 50 && !version; i++) {
      try { version = await (await fetch(`http://127.0.0.1:${debugPort}/json/version`)).json(); }
      catch (e) { await sleep(100); }
    }
    if (!version) throw new Error('Chrome startade inte');
    const list = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
    const page = list.find((t) => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.addEventListener('open', resolve); ws.addEventListener('error', reject); });
    cdp = new Cdp(ws);
    cdp.on('Runtime.consoleAPICalled', (p) => {
      if (p.type !== 'error') return;
      const text = (p.args || []).map((a) => a.value ?? a.description ?? '').join(' ');
      if (/favicon/i.test(text)) return;
      konsol.push(text);
    });
    cdp.on('Runtime.exceptionThrown', (p) => {
      konsol.push(p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || 'exception');
    });
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: MOCK });
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await cdp.send('Page.navigate', { url });

    async function js(expression) {
      const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) {
        throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text || 'eval');
      }
      return r.result?.value;
    }
    async function vanta(uttryck, ms = 4000) {
      const start = Date.now();
      let senaste = null;
      while (Date.now() - start < ms) {
        try {
          const v = await js(uttryck);
          senaste = v;
          if (v) return v;
        } catch (e) { senaste = e.message; }
        await sleep(40);
      }
      throw new Error(`timeout: ${uttryck} (${senaste})`);
    }
    async function klick(sel) {
      const ok = await js(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; el.click(); return true; })()`);
      if (!ok) throw new Error('hittade inte ' + sel);
    }
    async function fyll(text) {
      const ok = await js(`(() => { const el = document.querySelector('[data-roll=falt]'); if (!el) return false; el.focus(); el.value = ${JSON.stringify(text)}; el.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
      if (!ok) throw new Error('inget fält för ' + text);
    }
    async function syns(namn) {
      return js(`([...document.querySelectorAll('button,h1,h2,h3')].some(el => el.textContent.trim() === ${JSON.stringify(namn)}))`);
    }
    async function vantaNamn(namn) {
      await vanta(`([...document.querySelectorAll('button,h1,h2,h3')].some(el => el.textContent.trim() === ${JSON.stringify(namn)}))`);
    }
    async function vantaBorta(namn) {
      await vanta(`!([...document.querySelectorAll('button,h1,h2,h3')].some(el => el.textContent.trim() === ${JSON.stringify(namn)}))`);
    }
    async function sparaNamn(namn) {
      await fyll(namn);
      await klick('[data-gor=bekrafta]');
      await vantaNamn(namn);
    }
    async function andraLage(pa) {
      const text = await js(`document.querySelector('[data-roll=andra]')?.textContent || ''`);
      const arPa = text.includes('Klar');
      if (arPa !== pa) await klick('[data-roll=andra]');
      await sleep(30);
    }
    async function mata(i, steg, styrka) {
      const t = steg <= 1 ? 0 : i / (steg - 1);
      const svang = Math.sin(t * Math.PI);
      const paket = {
        rotRate: {
          alpha: styrka * svang,
          beta: styrka * 0.22 * Math.sin(t * Math.PI * 2),
          gamma: styrka * -0.12 * svang
        },
        acc: { x: (styrka / 45) * svang, y: 0.3 * Math.sin(t * Math.PI), z: 0.1 },
        accG: { x: (styrka / 45) * svang, y: 0.4, z: -9.7 },
        vinkel: [svang * 30, 6 * Math.sin(t * Math.PI), -3]
      };
      await js(`window.__rorelse.mata(${JSON.stringify(paket)})`);
    }
    async function rorelse(styrka, ms, vid) {
      const steg = Math.max(8, Math.round(ms / 28));
      for (let i = 0; i < steg; i++) {
        if (vid) await vid(i, steg);
        await mata(i, steg, styrka);
        await sleep(28);
      }
    }
    async function skarm(namn, uppe = true) {
      await js(`(() => { const t = document.getElementById('toast'); if (t) t.hidden = true; })()`);
      if (uppe) await js('window.scrollTo(0,0)');
      await js('dispatchEvent(new Event("resize"))');
      await sleep(250);
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
      await writeFile(join(art, namn), Buffer.from(data, 'base64'));
      console.log('bild', namn);
    }
    async function bib() {
      return js('window.__rorelse.bibliotek()');
    }

    await vanta('window.__rorelse && window.__rorelse.redo === true');
    const handelse = await js(`(() => {
      const innan = window.__rorelse.antalHandelser;
      try {
        window.dispatchEvent(new DeviceMotionEvent('devicemotion', {
          acceleration: { x: 0.2, y: 0.1, z: 0 },
          accelerationIncludingGravity: { x: 0.2, y: 0.1, z: -9.8 },
          rotationRate: { alpha: 3, beta: 1, gamma: -1 },
          interval: 16
        }));
        window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: 90, beta: 5, gamma: 1 }));
      } catch (e) { return 'fel:' + e.message; }
      return window.__rorelse.antalHandelser > innan ? 'ok' : 'tyst';
    })()`);
    krav('rörelsehändelse når sidan', handelse === 'ok', handelse);
    await js('window.__rorelse.mata({ vinkel: [0, 0, -3] })');

    await klick('[data-roll=nollstall]');
    await vanta(`window.__rorelse.lage === 'spelar'`);
    const tal = await js('window.__rorelse.talLage()');
    krav('tal sv-SE', tal?.lang === 'sv-SE', JSON.stringify(tal));
    krav('tal continuous', tal?.continuous === true);
    krav('tal interim', tal?.interimResults === true);
    const antalFore = await js('window.__antalTal');
    const t0 = Date.now();
    let omstart = false;
    await rorelse(280, 1100, async (i) => {
      if (i === 8 && !omstart) {
        omstart = true;
        await js('window.__fakeTal && window.__fakeTal.onend && window.__fakeTal.onend()');
      }
    });
    const antalEfter = await js('window.__antalTal');
    krav('talet startar om', antalEfter > antalFore, `${antalFore} -> ${antalEfter}`);
    const horde = await js('window.__rorelse.horde("det var slut")');
    krav('hörde slut', horde === true);
    await vanta(`window.__rorelse.lage === 'oversikt'`);
    const utkast = await js('window.__rorelse.utkastLage()');
    const tog = (Date.now() - t0) / 1000;
    krav('avslut på ordet', utkast?.avslut === 'slut', JSON.stringify(utkast));
    krav('svansen är klippt', utkast && utkast.svansSek === 0.4 && utkast.langdSek < tog - 0.2, `langd ${utkast?.langdSek} av ${tog}`);
    krav('sampel finns', (utkast?.antal || 0) > 4, String(utkast?.antal));
    const dukarOv = await js(`document.querySelectorAll('[data-roll=oversikt] canvas').length`);
    krav('översikt med alla kurvor', dukarOv >= 4, String(dukarOv));
    await skarm('rorelse_oversikt.png');
    const foreMarkor = await js(`document.querySelector('[data-roll=avlasning]')?.innerText || ''`);
    const efterMarkor = await js(`(() => {
      const s = document.querySelector('[data-roll=tid]');
      if (!s) return '';
      s.value = '0';
      s.dispatchEvent(new Event('input', { bubbles: true }));
      return document.querySelector('[data-roll=avlasning]')?.innerText || '';
    })()`);
    krav('tidmarkör ändrar värden', !!foreMarkor && foreMarkor !== efterMarkor, `${foreMarkor} -> ${efterMarkor}`);
    await klick('[data-roll=till-axlar]');
    await vanta(`window.__rorelse.lage === 'kurvor'`);
    const textKurva = await js('document.body.innerText');
    krav('tabell topp', textKurva.includes('Topp') && textKurva.includes('Total vridning'));
    const dukar = await js('document.querySelectorAll("canvas").length');
    krav('en kurva per axel', dukar >= 12, String(dukar));
    await skarm('rorelse_grafvy.png');

    await klick('[data-roll=till-markning]');
    await vanta(`window.__rorelse.lage === 'markning'`);
    await klick('[data-gor=ny-kategori]');
    await sparaNamn('Bort');
    await andraLage(true);
    let data = await bib();
    let bort = data.kategorier.find((k) => k.namn === 'Bort');
    await klick(`[data-gor="bort-kategori"][data-id="${bort.id}"]`);
    await klick(`[data-gor="bort-kategori"][data-id="${bort.id}"]`);
    await vantaBorta('Bort');

    await klick('[data-gor=ny-kategori]');
    await sparaNamn('Bordtennis');
    data = await bib();
    let kat = data.kategorier.find((k) => k.namn === 'Bordtennis');
    await andraLage(true);
    await klick(`[data-gor="byt-kategori"][data-id="${kat.id}"]`);
    await sparaNamn('Pingis');

    await klick('[data-roll=lagg-till-faktor]');
    await sparaNamn('Extra');
    data = await bib();
    kat = data.kategorier.find((k) => k.namn === 'Pingis');
    const extra = kat.faktorer.find((f) => f.namn === 'Extra');
    await klick(`[data-gor="bort-faktor"][data-id="${extra.id}"]`);
    await klick(`[data-gor="bort-faktor"][data-id="${extra.id}"]`);
    await vantaBorta('Extra');

    await klick('[data-roll=lagg-till-faktor]');
    await sparaNamn('Slag');
    data = await bib();
    kat = data.kategorier.find((k) => k.namn === 'Pingis');
    const slag = kat.faktorer.find((f) => f.namn === 'Slag');
    await klick(`[data-gor="ny-val"][data-id="${slag.id}"]`);
    await sparaNamn('Forehand');
    data = await bib();
    kat = data.kategorier.find((k) => k.namn === 'Pingis');
    const fore = kat.faktorer.find((f) => f.namn === 'Slag').val.find((v) => v.namn === 'Forehand');
    await andraLage(true);
    await klick(`[data-gor="byt-val"][data-id="${fore.id}"]`);
    await sparaNamn('Forehand gammal');
    data = await bib();
    const foreId = data.kategorier.find((k) => k.namn === 'Pingis').faktorer.find((f) => f.namn === 'Slag').val.find((v) => v.namn === 'Forehand gammal').id;
    await klick(`[data-gor="bort-val"][data-id="${foreId}"]`);
    await klick(`[data-gor="bort-val"][data-id="${foreId}"]`);
    await vantaBorta('Forehand gammal');

    data = await bib();
    const slagId = data.kategorier.find((k) => k.namn === 'Pingis').faktorer.find((f) => f.namn === 'Slag').id;
    await klick(`[data-gor="ny-val"][data-id="${slagId}"]`);
    await sparaNamn('Backhand');

    await klick('[data-roll=lagg-till-faktor]');
    await sparaNamn('Skruv');
    data = await bib();
    const skruv = data.kategorier.find((k) => k.namn === 'Pingis').faktorer.find((f) => f.namn === 'Skruv');
    await klick(`[data-gor="ny-val"][data-id="${skruv.id}"]`);
    await sparaNamn('Slice');
    await klick(`[data-gor="ny-val"][data-id="${skruv.id}"]`);
    await sparaNamn('Ingen');

    await js(`(() => { const b = [...document.querySelectorAll('[data-gor=valj-val]')].find(x => x.textContent.trim() === 'Slice'); b.click(); return true; })()`);
    await sleep(40);
    await andraLage(true);
    data = await bib();
    const slice = data.kategorier.find((k) => k.namn === 'Pingis').faktorer.find((f) => f.namn === 'Skruv').val.find((v) => v.namn === 'Slice');
    await js(`(() => { const b = document.querySelector('[data-gor="ny-under"][data-val="${slice.id}"]'); if (!b) return false; b.click(); return true; })()`);
    await sparaNamn('Lätt');
    data = await bib();
    const under = data.kategorier.find((k) => k.namn === 'Pingis').faktorer.find((f) => f.namn === 'Skruv').val.find((v) => v.namn === 'Slice').underval.find((u) => u.namn === 'Lätt');
    await klick(`[data-gor="byt-under"][data-id="${under.id}"]`);
    await sparaNamn('Liten');
    data = await bib();
    const liten = data.kategorier.find((k) => k.namn === 'Pingis').faktorer.find((f) => f.namn === 'Skruv').val.find((v) => v.namn === 'Slice').underval.find((u) => u.namn === 'Liten');
    await klick(`[data-gor="bort-under"][data-id="${liten.id}"]`);
    await klick(`[data-gor="bort-under"][data-id="${liten.id}"]`);
    await vantaBorta('Liten');

    await js(`(() => { const b = [...document.querySelectorAll('[data-gor=valj-val]')].find(x => x.textContent.trim() === 'Backhand'); b.click(); return true; })()`);
    await js(`(() => { const b = [...document.querySelectorAll('[data-gor=valj-val]')].find(x => x.textContent.trim() === 'Slice'); if (b && !b.classList.contains('vald')) b.click(); return true; })()`);
    await andraLage(false);
    await sleep(50);
    const valda = await js(`[...document.querySelectorAll('.chip.vald')].map(b => b.textContent.trim())`);
    krav('valda chips', valda.includes('Pingis') && valda.includes('Backhand') && valda.includes('Slice'), JSON.stringify(valda));
    await skarm('rorelse_kategorivy.png');

    await klick('#sparaNasta');
    await vanta(`window.__rorelse.lage === 'redo'`);
    data = await bib();
    krav('första inspelningen sparad', data.antal === 1, String(data.antal));

    await js('window.__rorelse.mata({ vinkel: [0, 0, -3] })');
    await klick('[data-roll=nollstall]');
    await vanta(`window.__rorelse.lage === 'spelar'`);
    await rorelse(24, 900);
    await js('window.__rorelse.horde("slut")');
    await vanta(`window.__rorelse.lage === 'oversikt'`);
    const forval = await js('document.body.innerText');
    krav('förval syns', forval.includes('Pingis') && forval.includes('Ändra märkning'), forval.slice(0, 180));
    await klick('[data-roll=till-markning]');
    await vanta(`window.__rorelse.lage === 'markning'`);
    const bytte = await js(`(() => { const b = [...document.querySelectorAll('[data-gor=valj-val]')].find(x => x.textContent.trim() === 'Ingen'); if (!b) return false; b.click(); return true; })()`);
    krav('kan byta skruv', bytte === true);
    await klick('#sparaNasta');
    await vanta(`window.__rorelse.lage === 'redo'`);
    data = await bib();
    krav('två inspelningar', data.antal === 2);
    const skruvF = data.kategorier.find((k) => k.namn === 'Pingis').faktorer.find((f) => f.namn === 'Skruv');
    const sliceId = skruvF.val.find((v) => v.namn === 'Slice').id;
    const ingenId = skruvF.val.find((v) => v.namn === 'Ingen').id;
    const valdaSkruv = data.inspelningar.map((ins) => ins.val?.[skruvF.id]?.valId).sort();
    krav('olika skruv', valdaSkruv.includes(sliceId) && valdaSkruv.includes(ingenId), JSON.stringify(valdaSkruv));

    await klick('#menyKnapp');
    await klick('[data-meny=analys]');
    await vanta(`window.__rorelse.lage === 'analys'`);
    const fynd = await js(`(() => { const el = document.querySelector('[data-roll=fynd]'); return el ? el.innerText : ''; })()`);
    krav('analys hittar en faktor', fynd.includes('Skruv') && fynd.includes('lika utom'), fynd.slice(0, 240));
    krav('analys visar skillnad', /topp/i.test(fynd) && fynd.includes('Slice') && fynd.includes('Ingen'));
    await skarm('rorelse_analys.png');

    await cdp.send('Page.reload', { ignoreCache: true });
    await vanta('window.__rorelse && window.__rorelse.redo === true', 6000);
    data = await js('window.__rorelse.bibliotek()');
    krav('kvar efter omladdning', data.antal === 2 && data.kategorier.some((k) => k.namn === 'Pingis'));
    const efter = data.kategorier.find((k) => k.namn === 'Pingis');
    krav('borttagen kategori borta', !data.kategorier.some((k) => k.namn === 'Bort' || k.namn === 'Bordtennis'));
    krav('borttagen faktor borta', !efter.faktorer.some((f) => f.namn === 'Extra'));
    krav('borttaget val borta', !efter.faktorer.some((f) => f.val.some((v) => v.namn.includes('Forehand') || v.underval?.some((u) => u.namn === 'Liten'))));
    krav('sparade val kvar', efter.faktorer.some((f) => f.namn === 'Slag' && f.val.some((v) => v.namn === 'Backhand')) && efter.faktorer.some((f) => f.namn === 'Skruv'));

    await klick('#menyKnapp');
    await klick('[data-meny=bibliotek]');
    await vanta(`window.__rorelse.lage === 'bibliotek'`);
    const bibText = await js('document.body.innerText');
    krav('biblioteket visar pingis', bibText.includes('Pingis') && bibText.includes('Backhand'));
    await klick('.bibliotek-rad');
    await vanta(`window.__rorelse.lage === 'detalj'`);
    await klick('[data-roll=till-axlar]');
    await vanta(`window.__rorelse.lage === 'detaljAxlar'`);
    const dukar2 = await js('document.querySelectorAll("canvas").length');
    krav('sparad inspelning har kurvor', dukar2 >= 12, String(dukar2));

    const foreSeed = await bib();
    const katSeed = foreSeed.kategorier.find((k) => k.namn === 'Pingis');
    const slagF = katSeed.faktorer.find((f) => f.namn === 'Slag');
    const skruvKat = katSeed.faktorer.find((f) => f.namn === 'Skruv');
    const backId = slagF.val.find((v) => v.namn === 'Backhand').id;
    skruvKat.val.push({ id: 'val-kross', namn: 'Kross', underval: [] });
    skruvKat.val.push({ id: 'val-driv', namn: 'Driv', underval: [] });
    const sliceIns = foreSeed.inspelningar.find((ins) => ins.val?.[skruvKat.id]?.valId === skruvKat.val.find((v) => v.namn === 'Slice').id);
    function triangel(id, topp, valId, minut) {
      const sampel = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const f = i <= 10 ? i / 10 : (20 - i) / 10;
        sampel.push({
          t,
          rot: [topp * f, 2 * f, -f],
          acc: [0.4 * f, 0.1 * f, 0],
          accG: [0.2 * f, 0.2, -9.8],
          vinkel: [8 * f, f, -0.5 * f],
          skarm: 0
        });
      }
      return {
        id,
        skapad: new Date(Date.UTC(2026, 10, 13, 18, minut)).toISOString(),
        kategoriId: katSeed.id,
        val: {
          [slagF.id]: { valId: backId, undervalId: null },
          [skruvKat.id]: { valId, undervalId: null }
        },
        etikett: { kategori: 'Pingis', rader: [] },
        langdSek: 1,
        antal: sampel.length,
        avslut: 'slut',
        svansSek: 0,
        nollage: [0, 0, 0],
        sampel
      };
    }
    const simulerade = [
      ...[10, 20, 30, 40, 50].map((topp, i) => triangel(`kross-${i}`, topp, 'val-kross', i)),
      ...[8, 12, 16, 20].map((topp, i) => triangel(`driv-${i}`, topp, 'val-driv', 10 + i))
    ];
    const tillagt = await js(`window.__rorelse.laggIn(${JSON.stringify({
      kategorier: [katSeed],
      inspelningar: simulerade,
      senast: foreSeed.senast,
      profiler: []
    })})`);
    krav('simulerade slag inne', tillagt?.antal >= 11, String(tillagt?.antal));
    await klick('#backa');
    await klick('#backa');
    await klick('#backa');
    await vanta(`window.__rorelse.lage === 'redo'`);
    await klick('[data-roll=sparade]');
    await vanta(`window.__rorelse.lage === 'sparade'`);
    const valdeKat = await js(`(() => { const b = [...document.querySelectorAll('[data-roll=kategori]')].find((el) => el.textContent.includes('Pingis')); if (!b) return false; b.click(); return true; })()`);
    krav('kan välja kategori', valdeKat === true);
    await vanta(`!!document.querySelector('[data-roll=grupp]')`);
    const gruppText = await js(`[...document.querySelectorAll('[data-roll=grupp]')].map((el) => el.textContent.replace(/\\s+/g, ' ').trim())`);
    krav('grupp med fem kross', gruppText.some((t) => t.includes('Kross') && t.includes('(5 st)')), JSON.stringify(gruppText));
    krav('grupp med fyra driv', gruppText.some((t) => t.includes('Driv') && t.includes('(4 st)')), JSON.stringify(gruppText));
    const grupper = await js(`window.__rorelse.grupper(${JSON.stringify(katSeed.id)})`);
    const fem = grupper.find((g) => g.antal === 5);
    const fyra = grupper.find((g) => g.antal === 4);
    krav('exakt fem och fyra', !!fem && !!fyra && fem.ids.every((id) => id.startsWith('kross-')) && fyra.ids.every((id) => id.startsWith('driv-')), JSON.stringify(grupper.map((g) => [g.antal, g.text])));
    krav('slice är ett eget slag', !!sliceIns?.id);
    krav('slice ligger inte i kross', !!fem && !fem.ids.includes(sliceIns?.id));
    await skarm('rorelse_sparade.png');
    const oppna = await js(`(() => { const b = [...document.querySelectorAll('[data-roll=grupp]')].find((el) => el.textContent.includes('Kross') && el.textContent.includes('(5 st)')); if (!b) return false; b.click(); return true; })()`);
    krav('öppnar krossgruppen', oppna === true);
    await vanta(`window.__rorelse.lage === 'sparadGrupp'`);
    const ibockade = await js(`document.querySelectorAll('[data-gor=bock]:checked').length`);
    krav('alla fem är ibockade', ibockade === 5, String(ibockade));
    await js(`(() => { const b = document.querySelector('[data-gor=bock]'); b.checked = false; b.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
    const avbockad = await js(`document.querySelectorAll('[data-gor=bock]:checked').length`);
    krav('kan bocka av ett slag', avbockad === 4, String(avbockad));
    await klick('[data-roll=alla]');
    const allaIgen = await js(`document.querySelectorAll('[data-gor=bock]:checked').length`);
    krav('välj alla igen', allaIgen === 5, String(allaIgen));
    await klick('[data-roll=jamfor]');
    await vanta(`window.__rorelse.lage === 'jamfor'`);
    const bandAntal = await js(`document.querySelectorAll('[data-roll=band] canvas').length`);
    krav('band för varje axel', bandAntal >= 9, String(bandAntal));
    // Toppvärden 10, 20, 30, 40, 50. Medel 30. Spridning sqrt(1000/4) = sqrt(250).
    const handSpridning = Math.sqrt(250);
    const jamTal = await js(`window.__rorelse.jamforTal(${JSON.stringify(fem.ids)}, 'rot.0.topp')`);
    krav('medel i jämförelsen', jamTal?.medel === 30, JSON.stringify(jamTal));
    krav('spridning mot handräkning', Math.abs(Number(jamTal?.spridning) - handSpridning) < 1e-6, String(jamTal?.spridning));
    krav('bandets spridning', Math.abs(Number(jamTal?.bandSpridning) - handSpridning) < 1e-6, String(jamTal?.bandSpridning));
    krav('längden stabilare än toppen', jamTal?.langdVariation === 0 && jamTal.variation > 0, JSON.stringify(jamTal));
    await js(`document.querySelector('details').open = true`);
    const synlig = await js(`document.querySelector('[data-roll=stat][data-nyckel="rot.0.topp"]')?.innerText || ''`);
    const sprAttr = Number(await js(`document.querySelector('[data-roll=stat][data-nyckel="rot.0.topp"]')?.dataset.spridning`));
    krav('tabellen visar spridningen', Math.abs(sprAttr - handSpridning) < 1e-6 && /15[,.]8/.test(synlig), `${sprAttr} ${synlig}`);
    await js('window.scrollTo(0,0)');
    await skarm('rorelse_jamforelse.png');
    await js(`(() => {
      const el = document.querySelector('[data-roll=rang]');
      if (!el) return 0;
      const y = el.getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo(0, Math.max(0, y));
      return window.scrollY;
    })()`);
    await skarm('rorelse_variation.png', false);
    await klick('[data-roll=spara-monster]');
    await vanta(`(window.__rorelse.bibliotek().profiler || []).length === 1`);
    const monster = await js(`window.__rorelse.bibliotek().profiler[0]`);
    krav('mönster för kross', monster?.antal === 5 && String(monster.text).includes('Kross'), JSON.stringify(monster));

    await cdp.send('Page.reload', { ignoreCache: true });
    await vanta('window.__rorelse && window.__rorelse.redo === true', 6000);
    const efterMonster = await js('window.__rorelse.bibliotek()');
    krav('mönster kvar efter omladdning', (efterMonster.profiler || []).some((p) => String(p.text).includes('Kross') && p.antal === 5));
    const grupperKvar = await js(`window.__rorelse.grupper(${JSON.stringify(katSeed.id)})`);
    krav('grupper kvar', grupperKvar.some((g) => g.antal === 5) && grupperKvar.some((g) => g.antal === 4));

    krav('inga konsolfel', konsol.length === 0, konsol.join(' | ').slice(0, 500));
  } finally {
    try { chrome.kill('SIGKILL'); } catch (e) { /* redan stoppad */ }
    server.close();
    await rm(profile, { recursive: true, force: true });
  }

  if (fel.length) {
    console.error(`\n${fel.length} fel`);
    process.exit(1);
  }
  console.log('\nalla kromtester gröna');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
