// Mobilvy 390×844: sidan, menyn, Alla länkar, och att Bf 109 loopar utan gimbal lock.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';

const puppeteer = createRequire('/tmp/puppeteer-run/package.json')('puppeteer-core');
const ROT = '/agent/repos/gyro-range';
const TYPER = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.m4a': 'audio/mp4', '.wasm': 'application/wasm', '.ktx2': 'image/ktx2', '.webp': 'image/webp' };

const http = await new Promise((res) => {
  const h = createServer(async (q, s) => {
    try {
      let p = decodeURIComponent(new URL(q.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      const f = normalize(join(ROT, p));
      if (!f.startsWith(ROT)) { s.writeHead(403); s.end(); return; }
      s.writeHead(200, { 'content-type': TYPER[extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
      s.end(await readFile(f));
    } catch { s.writeHead(404); s.end(); }
  });
  h.listen(0, '127.0.0.1', () => res(h));
});
const port = http.address().port;
const fel = [];
const webblasare = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

try {
  const sida = await webblasare.newPage();
  const konsol = [];
  const trasiga = [];
  sida.on('pageerror', (e) => konsol.push('page:' + e.message));
  sida.on('console', (m) => { if (m.type() === 'error') konsol.push(m.text()); });
  sida.on('requestfailed', (r) => trasiga.push(r.url() + ' ' + (r.failure()?.errorText || '')));
  sida.on('response', (r) => { if (r.status() >= 400) trasiga.push(r.status() + ' ' + r.url()); });
  await sida.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const svar = await sida.goto(`http://127.0.0.1:${port}/flyg/`, { waitUntil: 'networkidle0', timeout: 90000 });
  if (!svar || svar.status() !== 200) fel.push('sidan svarade ' + (svar && svar.status()));
  await sida.waitForFunction(() => document.getElementById('start') && !document.getElementById('start').disabled, { timeout: 90000 });

  const start = await sida.evaluate(() => {
    const lankar = document.querySelector('[data-alla-lankar]');
    const knappar = [...document.querySelectorAll('#planMeny button')].map((b) => ({ plan: b.dataset.plan, text: b.innerText, vald: b.classList.contains('vald') }));
    const flyg = [...document.querySelectorAll('#planMenyFlyg button')].map((b) => b.dataset.plan);
    const rect = lankar ? lankar.getBoundingClientRect() : null;
    return {
      href: lankar ? lankar.href : '',
      text: lankar ? lankar.textContent : '',
      synlig: !!(rect && rect.width > 20 && rect.height > 8),
      iKortet: !!(lankar && lankar.closest('#startPanel')),
      knappar,
      flyg,
      namn: document.getElementById('aircraftName').textContent
    };
  });
  if (!start.href.endsWith('/lankar/') || start.text !== 'Alla länkar' || !start.synlig || !start.iKortet) fel.push('alla länkar ' + JSON.stringify(start));
  if (start.knappar.length < 3 || !start.knappar.some((b) => b.plan === 'bf109') || !start.knappar.some((b) => b.plan === 'typhoon' && b.vald)) fel.push('menyn ' + JSON.stringify(start.knappar));
  if (start.flyg.join() !== start.knappar.map((b) => b.plan).join()) fel.push('flygmenyn skiljer sig');
  if (!/Typhoon/.test(start.namn)) fel.push('startnamn ' + start.namn);
  if (!start.knappar.every((b) => /km\/h|sväng|Sväng|Loop|loop|lodrätt|fart/i.test(b.text))) fel.push('egenskaper saknas ' + JSON.stringify(start.knappar));

  await sida.click('#planMeny button[data-plan="bf109"]');
  await sida.waitForFunction(() => /109/.test(document.getElementById('aircraftName').textContent), { timeout: 90000 });
  const efter = await sida.evaluate(() => ({
    namn: document.getElementById('aircraftName').textContent,
    lagrad: localStorage.getItem('gyro-flyg-valt-plan'),
    vald: document.querySelector('#planMeny button.vald')?.dataset.plan,
    valdFlyg: document.querySelector('#planMenyFlyg button.vald')?.dataset.plan,
    select: document.getElementById('modelSelect').value,
    kvat: !!window.flygTest.fm.kvaternion
  }));
  if (!/109/.test(efter.namn) || efter.lagrad !== 'bf109' || efter.vald !== 'bf109' || efter.valdFlyg !== 'bf109' || efter.select !== 'bf109' || !efter.kvat) fel.push('byte till 109 ' + JSON.stringify(efter));

  const sim = await sida.evaluate(() => {
    const fm = window.flygTest.fm;
    const A = fm.A;
    const sys = { motorPa: true, gear: 0, flaps: 0, roder: 0, paMarken: false };
    fm.tillampaNivellering(true);
    fm.reset(0, 500, 0, 140);
    let phase = 0, minUy = 1, worst = 0, stall = 0, vTopp = fm.V;
    let prev = fm.fram();
    const startV = fm.V;
    let vEfter = null;
    for (let i = 0; i < 800; i++) {
      fm.step(0.02, { pitch: A.spak_max_pitch, roll: 0 }, 1, undefined, sys);
      const f = fm.fram(), u = fm.upp();
      const d = Math.acos(Math.max(-1, Math.min(1, prev.x * f.x + prev.y * f.y + prev.z * f.z)));
      if (d > worst) worst = d;
      prev = f;
      if (u.y < minUy) { minUy = u.y; vTopp = fm.V; }
      if (fm.stalled) stall++;
      if (phase === 0 && f.y > 0.85) phase = 1;
      if (phase === 1 && u.y < -0.65 && f.z > 0.45) phase = 2;
      if (phase === 2 && f.y < -0.75) phase = 3;
      if (phase === 3 && u.y > 0.65 && f.z < -0.45) { phase = 4; vEfter = fm.V; }
    }
    fm.tillampaNivellering(false);
    fm.reset(0, 500, 0, 120);
    let rollFas = 0;
    for (let i = 0; i < 300; i++) {
      fm.step(0.02, { pitch: 0, roll: A.spak_max_roll }, 1, undefined, sys);
      const u = fm.upp(), r = fm.hoger();
      if (rollFas === 0 && r.y > 0.8) rollFas = 1;
      if (rollFas === 1 && u.y < -0.8) rollFas = 2;
      if (rollFas === 2 && r.y < -0.8) rollFas = 3;
      if (rollFas === 3 && u.y > 0.8) rollFas = 4;
    }
    const norm = Math.hypot(fm.ori.x, fm.ori.y, fm.ori.z, fm.ori.w);
    return { phase, minUy, worst, stall: stall * 0.02, vTopp, startV, vEfter, rollFas, norm, gimbal: window.flygTest.gimbal() };
  });
  if (sim.phase !== 4) fel.push('loopen blev inte klar ' + JSON.stringify(sim));
  if (!(sim.vTopp < sim.startV - 20 && sim.vEfter > sim.vTopp + 10)) fel.push('energin i loopen ' + JSON.stringify(sim));
  if (sim.worst > 0.25 || Math.abs(sim.norm - 1) > 1e-3) fel.push('kvaternion hoppade ' + JSON.stringify(sim));
  if (sim.rollFas !== 4) fel.push('rollen blev inte klar ' + sim.rollFas);
  if (!(sim.gimbal.kvatNosY < 0.85 && sim.gimbal.eulerNosY > 0.98 && sim.gimbal.sagLod && sim.gimbal.sagRygg)) fel.push('gimbal ' + JSON.stringify(sim.gimbal));
  if (fel.length) throw new Error(fel.join('\n'));

  await sida.click('#settingsButton');
  await sida.waitForSelector('#planMenyFlyg button[data-plan="typhoon"]');
  await sida.click('#planMenyFlyg button[data-plan="typhoon"]');
  await sida.waitForFunction(() => /Typhoon/.test(document.getElementById('aircraftName').textContent), { timeout: 30000 });
  const tillbaka = await sida.evaluate(() => ({
    namn: document.getElementById('aircraftName').textContent,
    lagrad: localStorage.getItem('gyro-flyg-valt-plan'),
    kvat: !!window.flygTest.fm.kvaternion,
    tips: document.getElementById('fartTips').textContent
  }));
  if (!/Typhoon/.test(tillbaka.namn) || tillbaka.lagrad !== 'typhoon' || tillbaka.kvat) fel.push('tillbaka till typhoon ' + JSON.stringify(tillbaka));
  await sida.click('#closeSettings');

  await sida.click('#start');
  await sida.waitForSelector('#vanster:not([hidden])');
  const instrument = await sida.evaluate(() => {
    const box = (id) => {
      const el = document.getElementById(id);
      const r = el.getBoundingClientRect();
      return { w: r.width, h: r.height, text: el.textContent };
    };
    return { fart: box('fartTal'), hojd: box('hojdTal'), gas: !document.getElementById('gasreglage').hidden, spak: box('spak') };
  });
  if (!(instrument.fart.w > 8 && instrument.hojd.w > 8 && instrument.gas && instrument.spak.w > 40)) fel.push('instrument ' + JSON.stringify(instrument));

  if (konsol.length) fel.push('konsol: ' + konsol.slice(0, 6).join(' | '));
  if (trasiga.length) fel.push('trasiga resurser: ' + trasiga.slice(0, 8).join(' | '));
} finally {
  await webblasare.close();
  http.close();
}

if (fel.length) {
  console.error(fel.join('\n'));
  process.exit(1);
}
console.log('flyg-plan-ok');
