// Två zoner: stadig kurva, 360-roll och utplaning för Typhoon, Mustang och Bf 109.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { KvantFlyg, qaxel, qnorm } from '../flyg/kvaternion.js';
import { nyZon, nollZon, styrKommando } from '../flyg/gyro-zon.js';

const C = JSON.parse(fs.readFileSync(new URL('../flyg/config.json', import.meta.url), 'utf8'));
const Z = C.gyro_zon;
const DEG = Math.PI / 180;
const fel = [];
const k = (namn, villkor) => { if (!villkor) fel.push(namn); };
const sys = { motorPa: true, gear: 0, flaps: 0, paMarken: false };

function steg(st, roll, dt, rate) {
  return styrKommando(st, { roll, pitch: 0, rollRate: rate }, dt, Z, C.modeller.bf109.aero, {
    kanslighet: 1, nivellering: true, troskel: Z.roll_troskel_grader
  });
}

{
  const st = nyZon();
  let prev = 0;
  const vill = [[0, 1], [20, 1], [40, 2], [32, 2], [20, 1]];
  for (const [deg, lage] of vill) {
    for (let a = prev; Math.abs(a - deg) > 0.4; a += Math.sign(deg - prev || deg) * 1.5) {
      steg(st, a * DEG, 0.04);
      if (Math.sign(deg - a) !== Math.sign(deg - prev) && a !== prev) break;
    }
    // Gå i små steg så ett hopp inte ser ut som ett vrid utåt.
    const rikt = Math.sign(deg - prev) || 1;
    if (prev !== deg) {
      for (let a = prev; rikt > 0 ? a < deg : a > deg; a += rikt * 2) steg(st, a * DEG, 0.04);
    }
    const ut = steg(st, deg * DEG, 0.05);
    k('zon ' + deg + ' är ' + lage + ' fick ' + ut.lage, ut.lage === lage);
    prev = deg;
  }
  nollZon(st);
  let flick = 1;
  for (let i = 0; i < 6; i++) flick = steg(st, (10 + i * 3) * DEG, 0.02, 4.2).lage;
  k('snabbt vrid utåt går till roll', flick === 2);
  nollZon(st);
  const inat = steg(st, 15 * DEG, 0.02, -4).lage;
  k('vrid mot mitten startar inte roll', inat === 1);
}

function kor(namn, sek, roll, fart, extra = {}) {
  const fm = new KvantFlyg(C.modeller[namn].aero);
  fm.tillampaNivellering(extra.niva !== false);
  fm.reset(0, extra.hojd || 500, 0, fart);
  const st = nyZon();
  const dt = 0.02;
  let phase = 0;
  let tRoll = null;
  let maxRate = 0;
  let bankSum = 0;
  let bankN = 0;
  const startPsi = fm.psi;
  for (let i = 0; i < Math.round(sek / dt); i++) {
    const k = styrKommando(st, { roll, pitch: extra.pitch || 0, rollRate: extra.rate }, dt, Z, fm.A, {
      kanslighet: 1, nivellering: extra.niva !== false, troskel: Z.roll_troskel_grader
    });
    fm.step(dt, k.input, extra.gas ?? 0.85, undefined, { ...sys, roder: k.roderHjalp || 0 });
    const u = fm.upp();
    const r = fm.hoger();
    if (k.lage === 2) {
      if (phase === 0 && r.y > 0.75) phase = 1;
      if (phase === 1 && u.y < -0.75) phase = 2;
      if (phase === 2 && r.y < -0.75) phase = 3;
      if (phase === 3 && u.y > 0.75) {
        phase = 4;
        if (tRoll == null) tRoll = i * dt;
      }
    }
    if (i * dt > 1.5) {
      maxRate = Math.max(maxRate, Math.abs(fm.rollRate));
      bankSum += fm.bank();
      bankN++;
    }
  }
  let heading = fm.psi - startPsi;
  while (heading > Math.PI) heading -= 2 * Math.PI;
  while (heading < -Math.PI) heading += 2 * Math.PI;
  return { fm, st, phase, tRoll, maxRate, bank: bankN ? bankSum / bankN : fm.bank(), heading };
}

const tider = {};
for (const namn of ['typhoon', 'p51', 'bf109']) {
  const kurva = kor(namn, 5, 18 * DEG, 130);
  const mal = 18;
  k(namn + ' kurva ligger kvar i zon 1', kurva.st.lage === 1);
  k(namn + ' bank är stadig ' + (kurva.bank * 180 / Math.PI).toFixed(1), kurva.bank > 20 * DEG && kurva.bank < 50 * DEG && kurva.maxRate < 0.35);
  k(namn + ' kurvan svänger', Math.abs(kurva.heading) > 8 * DEG);
  k(namn + ' kurvan dyker inte ' + kurva.fm.y.toFixed(0), kurva.fm.y > 430);
  const plan = kor(namn, 4, 0, Math.max(80, kurva.fm.V), { hojd: Math.max(200, kurva.fm.y) });
  // Egen utplaning från samma fart, med noll lutning från början av en redan bankad... görs som nytt flyg som först bankar.
  const st = nyZon();
  const fm = new KvantFlyg(C.modeller[namn].aero);
  fm.tillampaNivellering(true);
  fm.reset(0, 500, 0, 130);
  const dt = 0.02;
  for (let i = 0; i < 250; i++) {
    const roll = i < 120 ? 18 * DEG : 0;
    const cmd = styrKommando(st, { roll, pitch: 0 }, dt, Z, fm.A, { kanslighet: 1, nivellering: true, troskel: 38 });
    fm.step(dt, cmd.input, 0.85, undefined, { ...sys, roder: cmd.roderHjalp || 0 });
  }
  k(namn + ' planar ut ' + (fm.bank() * 180 / Math.PI).toFixed(1), Math.abs(fm.bank()) < 8 * DEG && fm.upp().y > 0.95 && st.lage === 1);

  const fort = kor(namn, 8, 45 * DEG, 140);
  const sakta = kor(namn, 6, 45 * DEG, 45);
  k(namn + ' rollar ett varv', fort.phase === 4 && fort.tRoll > 0.4);
  k(namn + ' låg fart rollar långsammare', sakta.phase < 4 || (sakta.tRoll && fort.tRoll && sakta.tRoll > fort.tRoll + 0.4));
  tider[namn] = fort.tRoll;
  const efter = new KvantFlyg(C.modeller[namn].aero);
  efter.tillampaNivellering(true);
  efter.reset(0, 600, 0, 140);
  const zs = nyZon();
  let fas = 0;
  for (let i = 0; i < 700; i++) {
    const roll = fas < 4 ? 45 * DEG : 0;
    const cmd = styrKommando(zs, { roll, pitch: 0 }, dt, Z, efter.A, { kanslighet: 1, nivellering: true, troskel: 38 });
    efter.step(dt, cmd.input, 0.85, undefined, { ...sys, roder: cmd.roderHjalp || 0 });
    const u = efter.upp();
    const r = efter.hoger();
    if (cmd.lage === 2) {
      if (fas === 0 && r.y > 0.75) fas = 1;
      if (fas === 1 && u.y < -0.75) fas = 2;
      if (fas === 2 && r.y < -0.75) fas = 3;
      if (fas === 3 && u.y > 0.75) fas = 4;
    }
  }
  k(namn + ' släpper rollen och planar ' + fas + ' ' + (efter.bank() * 180 / Math.PI).toFixed(1), fas === 4 && Math.abs(efter.bank()) < 12 * DEG && efter.upp().y > 0.9 && zs.lage === 1);
  void mal;
  void plan;
}

k('Typhoon rollar långsammare än Bf 109', tider.typhoon > tider.bf109 + 0.4);
k('Typhoon rollar långsammare än Mustang', tider.typhoon > tider.p51 + 0.3);
k('alla tre har egen tröghet', C.modeller.typhoon.aero.troget_roll > C.modeller.p51.aero.troget_roll && C.modeller.p51.aero.troget_roll > C.modeller.bf109.aero.troget_roll);

for (const namn of ['typhoon', 'bf109']) {
  const fm = new KvantFlyg(C.modeller[namn].aero);
  fm.tillampaNivellering(false);
  fm.reset(0, 800, 0, 120);
  fm.ori = qnorm(qaxel(0, 0, 1, Math.PI));
  const startNos = fm.fram().y;
  for (let i = 0; i < 120; i++) fm.step(0.02, { pitch: 0, roll: 0 }, 0.4, undefined, sys);
  k(namn + ' i ryggläge tappar nosen', fm.fram().y < startNos - 0.05 && fm.vy < -8);
}

k('spak finns inte i config', !C.spak && !/spaken till vänster/i.test(C.meny.hjalp || ''));
k('trösklar ligger i config', Z.roll_troskel_grader === 38 && Z.hysteres_grader === 10 && Z.kurva_dodzon_grader === 5 && Z.kurva_full_grader === 32);
k('jaktpanel är metrisk', C.jaktpanel.fart_max_kmh > 0 && C.jaktpanel.hojd_varv_m === 1000 && C.jaktpanel.farger.sarg);

if (fel.length) {
  console.error(fel.join('\n'));
  process.exit(1);
}
console.log('flyg-zon-ok', tider);

// Sidan i Chrome: inga konsolfel, tavlorna längst ner, cockpit och zonerna via spelets egen loop.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';

const puppeteer = createRequire('/tmp/puppeteer-run/package.json')('puppeteer-core');
const ROT = '/agent/repos/gyro-range';
const ART = '/opt/cursor/artifacts';
mkdirSync(ART, { recursive: true });
const TYPER = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.m4a': 'audio/mp4', '.wasm': 'application/wasm', '.ktx2': 'image/ktx2' };
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
const sidaFel = [];
const webblasare = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const sida = await webblasare.newPage();
  const konsol = [];
  const trasiga = [];
  sida.on('pageerror', (e) => konsol.push('page:' + e.message));
  sida.on('console', (m) => { if (m.type() === 'error') konsol.push(m.text()); });
  sida.on('requestfailed', (r) => trasiga.push(r.url() + ' ' + (r.failure()?.errorText || '')));
  sida.on('response', (r) => { if (r.status() >= 400) trasiga.push(r.status() + ' ' + r.url()); });
  await sida.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await sida.goto(`http://127.0.0.1:${port}/flyg/`, { waitUntil: 'networkidle0', timeout: 90000 });
  await sida.waitForFunction(() => document.getElementById('manual') && !document.getElementById('manual').disabled, { timeout: 90000 });
  await sida.click('#manual');
  await sida.waitForSelector('#jaktpanel:not([hidden])');
  await sida.evaluate(() => {
    const t = window.flygTest;
    t.fm.reset(0, 220, 0, 130);
    t.kor(0.4);
    t.ritaJakt();
  });
  const ren = await sida.evaluate(() => ({
    spak: !!document.getElementById('spak'),
    instrument: !!document.getElementById('instrument'),
    safe: {
      gas: document.getElementById('gasreglage').style.bottom,
      pedaler: document.getElementById('pedaler').style.bottom,
      jakt: document.getElementById('jaktpanel').style.bottom,
      footer: getComputedStyle(document.querySelector('footer')).paddingBottom
    }
  }));
  if (ren.spak || ren.instrument) sidaFel.push('spak eller textruta finns kvar');
  for (const [namn, v] of Object.entries(ren.safe)) {
    if (!String(v).includes('safe-area-inset-bottom') && namn !== 'footer') sidaFel.push(namn + ' saknar safe-area ' + v);
  }
  if (!String(ren.safe.footer).includes('px')) sidaFel.push('footer ' + ren.safe.footer);

  function krockScript() {
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el || el.hidden) return null;
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') return null;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return null;
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    };
    const over = (a, b) => !!(a && b && a.x < b.x + b.w - 1 && a.x + a.w > b.x + 1 && a.y < b.y + b.h - 1 && a.y + a.h > b.y + 1);
    const jakt = box('#jaktpanel');
    const namn = { gas: '#gasreglage', system: '#system', pedaler: '#pedaler', fire: '#fire', center: '#center' };
    const krock = [];
    for (const [n, sel] of Object.entries(namn)) if (over(jakt, box(sel))) krock.push(n);
    const botten = jakt ? (innerHeight - (jakt.y + jakt.h)) : -1;
    return { jakt, krock, botten, enhet: document.getElementById('jaktpanel').dataset.enhet, g: document.getElementById('jaktpanel').dataset.gSynlig };
  }
  const staende = await sida.evaluate(krockScript);
  if (!staende.jakt || staende.jakt.h < 80 || staende.jakt.w < 300) sidaFel.push('stående tavla ' + JSON.stringify(staende.jakt));
  if (staende.krock.length) sidaFel.push('stående krock ' + staende.krock.join(','));
  if (staende.botten < 24) sidaFel.push('stående för nära nederkant ' + staende.botten);
  if (staende.enhet !== 'km/h,m' || staende.g !== '1') sidaFel.push('stående enhet ' + JSON.stringify(staende));
  await sida.screenshot({ path: join(ART, 'flyg_jakt_390x844.png') });

  await sida.click('#settingsButton');
  await sida.waitForSelector('#settings:not([hidden])');
  await sida.screenshot({ path: join(ART, 'flyg_installningar_390x844.png') });
  const reglage = await sida.evaluate(() => ({
    troskel: document.getElementById('rollTroskel').value,
    text: document.getElementById('rollTal').textContent,
    niva: !!document.querySelector('#toggles input[data-nyckel="nivellering"]'),
    kansla: document.getElementById('sensitivity').value
  }));
  if (reglage.troskel !== '38' || !/38/.test(reglage.text) || !reglage.niva) sidaFel.push('inställningar ' + JSON.stringify(reglage));
  await sida.click('#closeSettings');

  const zon = await sida.evaluate(async () => {
    const t = window.flygTest;
    const DEG = Math.PI / 180;
    const ut = {};
    for (const key of ['typhoon', 'p51', 'bf109']) {
      await t.valjPlan(key);
      t.fm.crashed = false;
      t.fm.reset(0, 800, 0, 140);
      t.sattLutning({ roll: 18 * DEG, pitch: 0 });
      t.kor(4);
      const kurva = { lage: t.zonLage().lage, bank: t.state().roll, y: t.fm.y };
      t.sattLutning({ roll: 0, pitch: 0 });
      t.kor(3.5);
      const plan = { lage: t.zonLage().lage, bank: t.state().roll, uy: t.fm.upp().y };
      t.fm.reset(0, 900, 0, 145);
      t.sattLutning({ roll: 45 * DEG, pitch: 0 });
      let fas = 0;
      for (let i = 0; i < 200 && fas < 4; i++) {
        t.kor(0.05);
        const u = t.fm.upp(), r = t.fm.hoger();
        if (fas === 0 && r.y > 0.75) fas = 1;
        if (fas === 1 && u.y < -0.75) fas = 2;
        if (fas === 2 && r.y < -0.75) fas = 3;
        if (fas === 3 && u.y > 0.75) fas = 4;
      }
      t.sattLutning({ roll: 0, pitch: 0 });
      t.kor(4);
      ut[key] = { kurva, plan, fas, efter: { lage: t.zonLage().lage, bank: t.state().roll, uy: t.fm.upp().y, kvat: !!t.fm.kvaternion } };
    }
    t.sattLutning(null);
    t.fm.reset(0, 400, 0, 120);
    t.gyro.drag.x = 0.32;
    t.kor(2.5);
    ut.finger = { bank: t.state().roll, lage: t.zonLage().lage };
    t.gyro.drag.x = 0;
    t.input.center();
    return ut;
  });
  for (const key of ['typhoon', 'p51', 'bf109']) {
    const z = zon[key];
    if (!(z.kurva.lage === 1 && z.kurva.bank > 0.3 && z.kurva.bank < 1.1 && z.kurva.y > 650)) sidaFel.push(key + ' kurva ' + JSON.stringify(z.kurva));
    if (!(z.plan.lage === 1 && Math.abs(z.plan.bank) < 0.2 && z.plan.uy > 0.94)) sidaFel.push(key + ' utplaning ' + JSON.stringify(z.plan));
    if (!(z.fas === 4 && z.efter.lage === 1 && Math.abs(z.efter.bank) < 0.35 && z.efter.uy > 0.85 && z.efter.kvat)) sidaFel.push(key + ' roll ' + JSON.stringify(z));
  }
  if (!(zon.finger.lage === 1 && zon.finger.bank > 0.25)) sidaFel.push('finger ' + JSON.stringify(zon.finger));

  await sida.evaluate(() => { window.flygTest.sattLutning(null); window.flygTest.fm.reset(0, 180, 0, 120); window.flygTest.setSight(true); window.flygTest.kor(0.2); });
  await sida.waitForFunction(() => window.flygTest.state().sight === true && document.getElementById('jaktpanel').hidden && !document.getElementById('panelHorisont').hidden);
  const cockpit = await sida.evaluate(() => {
    const panel = document.getElementById('panel').getBoundingClientRect();
    const hor = document.getElementById('panelHorisont').getBoundingClientRect();
    return { text: document.getElementById('panelHorisont').getAttribute('aria-label'), panel: panel.height, dold: document.getElementById('jaktpanel').hidden, ordning: document.getElementById('panel').dataset.ordning, hor: Math.min(hor.width, hor.height), sight: window.flygTest.state().sight };
  });
  if (!(cockpit.sight && cockpit.text === 'Byt till vyn bakifrån' && cockpit.panel > 40 && cockpit.dold && cockpit.ordning === 'fart,horisont,stigning,hojd,kurs,svang' && cockpit.hor >= 44)) sidaFel.push('cockpit ' + JSON.stringify(cockpit));
  await sida.screenshot({ path: join(ART, 'flyg_cockpit_390x844.png') });

  await sida.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await sida.evaluate(() => window.flygTest.setSight(false));
  await sida.waitForSelector('#jaktpanel:not([hidden])');
  await sida.evaluate(() => window.flygTest.ritaJakt());
  const ligg = await sida.evaluate(krockScript);
  if (!ligg.jakt || ligg.jakt.h < 48 || ligg.jakt.w < 200) sidaFel.push('liggande tavla ' + JSON.stringify(ligg.jakt));
  if (ligg.krock.length) sidaFel.push('liggande krock ' + ligg.krock.join(','));
  if (ligg.botten < 20) sidaFel.push('liggande för nära nederkant ' + ligg.botten);
  await sida.screenshot({ path: join(ART, 'flyg_jakt_844x390.png') });
  if (konsol.length) sidaFel.push('konsol: ' + konsol.slice(0, 8).join(' | '));
  if (trasiga.length) sidaFel.push('trasiga: ' + [...new Set(trasiga)].slice(0, 8).join(' | '));
} finally {
  await webblasare.close();
  http.close();
}
if (sidaFel.length) {
  console.error(sidaFel.join('\n'));
  process.exit(1);
}
console.log('flyg-zon-chrome-ok');
