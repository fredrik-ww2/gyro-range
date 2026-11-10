// Headless bilder av cockpitens sikte mot instrument, plus omgång och skada i sidan.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';

const puppeteer = createRequire('/tmp/puppeteer-run/package.json')('puppeteer-core');
const ROT = '/agent/repos/gyro-range';
const ART = '/opt/cursor/artifacts';
const TYPER = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.m4a': 'audio/mp4', '.wasm': 'application/wasm', '.ktx2': 'image/ktx2' };
mkdirSync(ART, { recursive: true });

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
const webblasare = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const fel = [];
const storlekar = [[844, 390], [932, 430], [667, 375], [390, 844]];

try {
  const sida = await webblasare.newPage();
  const konsol = [];
  sida.on('pageerror', (e) => konsol.push('page:' + e.message));
  sida.on('console', (m) => { if (m.type() === 'error') konsol.push(m.text()); });
  await sida.setViewport({ width: 844, height: 390, deviceScaleFactor: 1 });
  await sida.goto(`http://127.0.0.1:${port}/flyg/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sida.waitForFunction(() => document.getElementById('start') && !document.getElementById('start').disabled, { timeout: 60000 });
  await sida.click('#start');
  await sida.waitForFunction(() => window.flygTest && window.flygTest.state().running, { timeout: 10000 });
  const spel = await sida.evaluate(() => {
    const t = window.flygTest;
    const hp = t.state().spelareHp;
    t.settings.brytare.skada = false;
    t.traffa({ id: 'spelare' });
    const utan = t.state();
    t.settings.brytare.skada = true;
    t.traffa({ id: 'spelare' });
    const med = t.state();
    t.traffa({ id: 'ballong', ref: t.targets[0] });
    const traff = t.state().hits;
    const nere = !t.targets[0].mesh.visible;
    t.settings.brytare.nivellering = false;
    t.kor(0.15);
    const av = t.state().niva;
    t.settings.brytare.nivellering = true;
    t.kor(0.15);
    const pa = t.state().niva;
    const bas = t.state().nivaBas;
    const lyss = t.state().lyssnare;
    t.flyAgain();
    const igen = t.state();
    window.dispatchEvent(new Event('pagehide'));
    const efterStang = t.ljud();
    window.dispatchEvent(new Event('pageshow'));
    return { hp, utanHp: utan.spelareHp, utanKraschen: utan.crashed, medHp: med.spelareHp, traff, nere, av, pa, bas, lyss, igenLyss: igen.lyssnare, hits: igen.hits, pedal: igen.pedalRoder, synlig: t.targets[0].mesh.visible, efterStang, version: t.version };
  });
  if (spel.utanHp !== spel.hp || spel.utanKraschen) fel.push('skada av ändrade liv: ' + JSON.stringify(spel));
  if (!(spel.medHp < spel.hp)) fel.push('skada på sänkte inte liv');
  if (spel.traff !== 1 || !spel.nere) fel.push('ballongträff syntes inte');
  if (spel.av !== 0 || spel.pa !== spel.bas) fel.push('nivellering fastnade ' + spel.av + ' ' + spel.pa + ' ' + spel.bas);
  if (spel.hits !== 0 || spel.pedal !== 0 || !spel.synlig) fel.push('Flyg igen lämnade tillstånd ' + JSON.stringify(spel));
  if (spel.igenLyss !== spel.lyss) fel.push('lyssnare ökade');
  if (spel.efterStang !== 'skapa') fel.push('ljud efter pagehide: ' + spel.efterStang);
  if (spel.version !== 'Flygprov 06') fel.push('version ' + spel.version);

  for (const [w, h] of storlekar) {
    await sida.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await sida.evaluate(() => { window.flygTest.setSight(true); window.flygTest.flyAgain(); window.flygTest.setSight(true); });
    await sida.waitForFunction((bredd, hojd) => {
      const t = document.getElementById('reticleGlow')?.getAttribute('transform') || '';
      const m = /translate\(\s*([-\d.]+)[ ,]([-\d.]+)\s*\)/.exec(t);
      if (!m) return false;
      return Math.hypot(+m[1] - bredd / 2, +m[2] - hojd / 2) < Math.min(bredd, hojd) * 0.35;
    }, { timeout: 5000 }, w, h);
    const mat = await sida.evaluate(() => {
      const box = (el) => {
        if (!el) return null;
        const s = getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden') return null;
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return null;
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      };
      const krockar = (a, b) => !!(a && b && a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y);
      const g = document.getElementById('reticleGlow');
      const m = /translate\(\s*([-\d.]+)[ ,]([-\d.]+)\s*\)/.exec(g?.getAttribute('transform') || '');
      const rad = parseFloat(document.getElementById('ringB')?.getAttribute('r') || '0');
      const ring = m ? { x: +m[1] - rad, y: +m[2] - rad, w: rad * 2, h: rad * 2 } : null;
      const namn = {
        panel: '#panel', hud: '#flightHud', metrics: '#metrics', version: '#versionEtikett',
        gas: '#gasreglage', system: '#system', pedaler: '#pedaler', fire: '#fire',
        center: '#center', sight: '#sight', bomb: '#bombsikte', hus: '#cockpit .sikhuset'
      };
      const krock = [];
      for (const [n, sel] of Object.entries(namn)) if (krockar(ring, box(document.querySelector(sel)))) krock.push(n);
      return { ring, krock, version: document.getElementById('versionEtikett')?.textContent || '' };
    });
    if (!mat.version.includes('Flygprov 06')) fel.push(w + 'x' + h + ' saknar versionstext');
    if (mat.krock.length) fel.push(w + 'x' + h + ' överlappar: ' + mat.krock.join(', ') + ' ring=' + JSON.stringify(mat.ring));
    const fil = join(ART, `flyg_${w}x${h}.png`);
    await sida.screenshot({ path: fil });
    console.log('bild', fil, 'krock', mat.krock.join(',') || 'ingen');
  }
  if (konsol.length) fel.push('konsol: ' + konsol.slice(0, 8).join(' | '));
} finally {
  await webblasare.close();
  http.close();
}

if (fel.length) {
  console.error(fel.join('\n'));
  process.exit(1);
}
console.log('flyg-skarm-ok');
