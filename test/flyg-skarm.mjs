// Headless bilder av cockpitens sikte mot instrument, plus omgång och skada i sidan.
import { jaktHorisont, panelHorisont } from '../flyg/panel.js';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';

const puppeteer = createRequire('/tmp/puppeteer-run/package.json')('puppeteer-core');
const JAKT = JSON.parse(readFileSync(new URL('../flyg/config.json', import.meta.url), 'utf8')).jaktpanel;
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
  const trasiga = [];
  sida.on('pageerror', (e) => konsol.push('page:' + e.message));
  sida.on('console', (m) => { if (m.type() === 'error') konsol.push(m.text()); });
  sida.on('requestfailed', (r) => trasiga.push(r.url() + ' ' + (r.failure()?.errorText || '')));
  sida.on('response', (r) => { if (r.status() >= 400) trasiga.push(r.status() + ' ' + r.url()); });
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
  if (spel.version !== 'Flygprov 08') fel.push('version ' + spel.version);

  const motorKlar = await sida.waitForFunction(() => window.flygTest.motorAntal() === 1, { timeout: 10000 }).then(() => true).catch(() => false);
  if (!motorKlar) fel.push('motorn startade inte');
  const ljud = await sida.evaluate(() => {
    const t = window.flygTest;
    const under = [];
    for (let i = 0; i < 8; i++) under.push(t.hallAvtryckare());
    const efterSlapp = t.slappAvtryckare();
    return { under, efterSlapp, motor: t.motorAntal() };
  });
  if (ljud.under.some((n) => n !== 1) || ljud.efterSlapp !== 0) fel.push('skottnoder ' + JSON.stringify(ljud));
  if (ljud.motor !== 1) fel.push('motorn ändrades av skott ' + ljud.motor);
  await new Promise((r) => setTimeout(r, 450));
  const kvar = await sida.evaluate(() => window.flygTest.skottAntal());
  if (kvar !== 0) fel.push('ljud kvar efter släpp ' + kvar);
  const knappTryck = await sida.evaluate(() => {
    const fire = document.getElementById('fire');
    const fore = window.flygTest.state().shots;
    fire.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 7, clientX: 12, clientY: 12 }));
    return fore;
  });
  await sida.waitForFunction((fore) => window.flygTest.state().shots > fore, { timeout: 3000 }, knappTryck).catch(() => fel.push('avtryckaren sköt inte'));
  await sida.evaluate(() => {
    document.getElementById('fire').dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerId: 7, clientX: 12, clientY: 12 }));
  });
  await new Promise((r) => setTimeout(r, 400));
  const efterKnapp = await sida.evaluate(() => window.flygTest.skottAntal());
  if (efterKnapp !== 0) fel.push('knappen lämnade skottljud ' + efterKnapp);

  const gyro = await sida.evaluate(() => {
    const t = window.flygTest;
    t.input.center();
    const skicka = (beta) => window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: 0, beta, gamma: 0 }));
    skicka(90);
    skicka(110);
    const bakom = t.input.read();
    const lyss = t.state().lyssnare;
    const foreKnapp = document.getElementById('jaktHorisont').getAttribute('aria-label');
    document.getElementById('jaktHorisont').click();
    const iCockpit = t.input.read();
    const ram = document.querySelector('#cockpit .vaggar')?.getBoundingClientRect();
    const huv = document.querySelector('#cockpit .huv')?.getBoundingClientRect();
    const panel = document.getElementById('panel').getBoundingClientRect();
    const cockpit = {
      sight: t.state().sight,
      text: document.getElementById('panelHorisont').getAttribute('aria-label'),
      dold: document.getElementById('cockpit').hidden,
      sikteDolt: document.getElementById('reticle').hasAttribute('hidden'),
      ram: ram ? ram.width : 0,
      huv: huv ? huv.width : 0,
      panel: panel.height
    };
    skicka(130);
    const mer = t.input.read();
    document.getElementById('panelHorisont').click();
    const tillbaka = t.input.read();
    return {
      bakom, iCockpit, mer, tillbaka, lyss, lyssEfter: t.state().lyssnare,
      aktiv: t.input.active, foreKnapp, cockpit, sightEfter: t.state().sight,
      textEfter: document.getElementById('jaktHorisont').getAttribute('aria-label')
    };
  });
  const nara = (a, b) => Math.abs(a - b) < 0.02;
  if (gyro.foreKnapp !== 'Byt till cockpit') fel.push('knapp före ' + gyro.foreKnapp);
  if (!(gyro.bakom.source === 'webb' && gyro.bakom.pitch > 0.05)) fel.push('gyro bakom ' + JSON.stringify(gyro.bakom));
  if (!nara(gyro.iCockpit.pitch, gyro.bakom.pitch) || gyro.iCockpit.source !== 'webb') fel.push('gyro bytte med vyn ' + JSON.stringify(gyro.iCockpit));
  if (!(gyro.cockpit.sight && gyro.cockpit.text === 'Byt till vyn bakifrån' && gyro.cockpit.dold === false && gyro.cockpit.sikteDolt === false && gyro.cockpit.ram > 100 && gyro.cockpit.huv > 100 && gyro.cockpit.panel > 30)) fel.push('cockpit ' + JSON.stringify(gyro.cockpit));
  if (!(gyro.mer.pitch > gyro.iCockpit.pitch + 0.05 && gyro.mer.source === 'webb')) fel.push('gyro i cockpit ' + JSON.stringify(gyro.mer));
  if (!nara(gyro.tillbaka.pitch, gyro.mer.pitch) || gyro.sightEfter || gyro.textEfter !== 'Byt till cockpit' || !gyro.aktiv || gyro.lyssEfter !== gyro.lyss) fel.push('tillbaka ' + JSON.stringify({ sight: gyro.sightEfter, text: gyro.textEfter, pitch: gyro.tillbaka.pitch, aktiv: gyro.aktiv, lyss: gyro.lyssEfter }));
  await sida.screenshot({ path: join(ART, 'flyg_bakifran_844x390.png') });
  await sida.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await sida.evaluate(() => window.flygTest.setSight(false));
  await sida.waitForFunction(() => {
    const el = document.getElementById('jaktHorisont');
    const r = el.getBoundingClientRect();
    return !el.hidden && r.width >= 44 && r.height >= 44;
  });
  await sida.screenshot({ path: join(ART, 'flyg_staende_meny_stangd_390x844.png') });
  await sida.click('#settingsButton');
  await sida.waitForSelector('#settings:not([hidden])');
  const meny = await sida.evaluate(() => {
    const inne = (id) => !!document.getElementById(id)?.closest('#settings');
    const st = window.flygTest.state();
    return {
      version: document.getElementById('versionEtikett').textContent,
      namn: document.getElementById('aircraftName').textContent,
      status: document.getElementById('status').textContent,
      metrics: document.getElementById('metrics').textContent,
      hud: document.getElementById('flightHud').textContent,
      back: document.getElementById('back').textContent,
      lank: document.getElementById('allaLankarMeny').textContent,
      sens: !!document.getElementById('sensitivity'),
      roll: !!document.getElementById('rollTroskel'),
      toggles: document.querySelectorAll('#toggles input').length,
      inne: ['status', 'metrics', 'flightHud', 'aircraftName', 'back', 'settings'].every(inne),
      fps: st.fps, anrop: st.drawCalls, tris: st.triangles
    };
  });
  if (!meny.inne || !/Flygprov 08/.test(meny.version) || !/Typhoon/.test(meny.namn) || !meny.sens || !meny.roll || meny.toggles < 8) fel.push('meny ' + JSON.stringify(meny));
  if (meny.back !== 'Skjutbana' || meny.lank !== 'Alla länkar') fel.push('länkar ' + meny.back + ' ' + meny.lank);
  if (!/FPS/.test(meny.metrics) || !/km\/h/.test(meny.hud)) fel.push('telemetri ' + meny.metrics + ' | ' + meny.hud);
  console.log('telemetri', meny.fps.toFixed(0) + ' FPS', meny.anrop + ' anrop', Math.round(meny.tris / 1000) + 'k tris');
  await sida.screenshot({ path: join(ART, 'flyg_staende_meny_oppen_390x844.png') });
  await sida.click('#closeSettings');
  await sida.click('#jaktHorisont');
  await sida.waitForFunction(() => window.flygTest.state().sight === true && !document.getElementById('panelHorisont').hidden);
  const cockpitLage = await sida.evaluate(() => {
    const panel = document.getElementById('panel').getBoundingClientRect();
    const knapp = document.getElementById('panelHorisont').getBoundingClientRect();
    return { pw: panel.width, ph: panel.height, px: panel.x, py: panel.y, kx: knapp.x + knapp.width / 2, ky: knapp.y + knapp.height / 2 };
  });
  const hor = panelHorisont(cockpitLage.pw, cockpitLage.ph);
  if (Math.hypot(cockpitLage.kx - (cockpitLage.px + hor.x), cockpitLage.ky - (cockpitLage.py + hor.y)) > 3) fel.push('cockpithorisont ur läge ' + JSON.stringify({ cockpitLage, hor }));
  await sida.screenshot({ path: join(ART, 'flyg_staende_cockpit_horisont_390x844.png') });
  await sida.click('#panelHorisont');
  await sida.waitForFunction(() => window.flygTest.state().sight === false);
  const gasFore = await sida.evaluate(() => {
    const el = document.getElementById('gasreglage').getBoundingClientRect();
    const bana = document.getElementById('gasBana').getBoundingClientRect();
    const jakt = document.getElementById('jaktpanel').getBoundingClientRect();
    const center = document.getElementById('center').getBoundingClientRect();
    const over = (a, b) => a.x < b.x + b.width - 1 && a.x + a.width > b.x + 1 && a.y < b.y + b.height - 1 && a.y + a.height > b.y + 1;
    return {
      h: el.height, fore: window.flygTest.gasKlick(), jakt: over(el, jakt), center: over(el, center),
      x: bana.left + bana.width / 2, y1: bana.top + 6, y2: bana.bottom - 6
    };
  });
  await sida.mouse.move(gasFore.x, gasFore.y1);
  await sida.mouse.down();
  await sida.mouse.move(gasFore.x, gasFore.y2, { steps: 10 });
  await sida.mouse.up();
  const gas = await sida.evaluate((fore) => ({
    h: document.getElementById('gasreglage').getBoundingClientRect().height,
    klick: window.flygTest.gasKlick() - fore.fore,
    gas: window.flygTest.state().gas,
    jakt: fore.jakt,
    center: fore.center,
    roster: window.flygTest.mekanikAntal()
  }), gasFore);
  if (gas.h < 134 || gas.h > 142) fel.push('gas höjd ' + gas.h);
  if (gas.klick < 1) fel.push('gas utan ljudsteg ' + JSON.stringify(gas));
  if (gas.jakt || gas.center) fel.push('gas krockar ' + JSON.stringify(gas));
  await new Promise((r) => setTimeout(r, 400));
  const kvarRoster = await sida.evaluate(() => window.flygTest.mekanikAntal());
  if (kvarRoster !== 0) fel.push('gasljud läckte ' + kvarRoster);
  const topp = await sida.evaluate(() => window.flygTest.mekanikTopp());
  if (!(topp > 0.02 && topp < 10 ** (-1 / 20))) fel.push('mekanik topp ' + topp);
  await sida.setViewport({ width: 844, height: 390, deviceScaleFactor: 1 });
  await sida.evaluate(() => { window.flygTest.setGas(0.85); window.flygTest.setSight(false); });
  await sida.waitForFunction(() => !document.getElementById('jaktHorisont').hidden);
  const passning = await sida.evaluate(() => {
    const jakt = document.getElementById('jaktpanel').getBoundingClientRect();
    const knapp = document.getElementById('jaktHorisont').getBoundingClientRect();
    return { jw: jakt.width, jh: jakt.height, jx: jakt.x, jy: jakt.y, kx: knapp.x + knapp.width / 2, ky: knapp.y + knapp.height / 2 };
  });
  const vantad = jaktHorisont(passning.jw, passning.jh, JAKT);
  if (Math.hypot(passning.kx - (passning.jx + vantad.x), passning.ky - (passning.jy + vantad.y)) > 3) fel.push('horisont ur läge ' + JSON.stringify({ passning, vantad }));
  await sida.screenshot({ path: join(ART, 'flyg_liggande_meny_stangd_844x390.png') });
  await sida.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });

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
        center: '#center', bomb: '#bombsikte', hus: '#cockpit .sikhuset', meny: '#settingsButton'
      };
      const krock = [];
      for (const [n, sel] of Object.entries(namn)) if (krockar(ring, box(document.querySelector(sel)))) krock.push(n);
      return { ring, krock, version: document.getElementById('versionEtikett')?.textContent || '' };
    });
    if (!mat.version.includes('Flygprov 08')) fel.push(w + 'x' + h + ' saknar versionstext');
    if (mat.krock.length) fel.push(w + 'x' + h + ' överlappar: ' + mat.krock.join(', ') + ' ring=' + JSON.stringify(mat.ring));
    const knapp = await sida.evaluate(() => {
      const cock = [...document.querySelectorAll('button')].filter((b) => b.textContent.includes('Cockpit') && b.getBoundingClientRect().width > 1);
      const el = document.getElementById('panelHorisont');
      const r = el.getBoundingClientRect();
      return { w: r.width, h: r.height, cock: cock.length, label: el.getAttribute('aria-label'), sight: window.flygTest.state().sight };
    });
    if (knapp.cock) fel.push(w + 'x' + h + ' cockpitknapp syns');
    if (!knapp.sight || knapp.label !== 'Byt till vyn bakifrån') fel.push(w + 'x' + h + ' horisont ' + JSON.stringify(knapp));
    if (knapp.w < 44 || knapp.h < 44) fel.push(w + 'x' + h + ' liten horisont ' + JSON.stringify(knapp));
    const fil = join(ART, `flyg_${w}x${h}.png`);
    await sida.screenshot({ path: fil });
    console.log('bild', fil, 'krock', mat.krock.join(',') || 'ingen');
  }
  if (konsol.length) fel.push('konsol: ' + konsol.slice(0, 8).join(' | '));
  if (trasiga.length) fel.push('trasiga: ' + [...new Set(trasiga)].slice(0, 8).join(' | '));
} finally {
  await webblasare.close();
  http.close();
}

if (fel.length) {
  console.error(fel.join('\n'));
  process.exit(1);
}
console.log('flyg-skarm-ok');
