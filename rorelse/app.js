import {
  arStilla, byggExport, behandlaRaa, helaSerien, kannIgen, lasImport, matHz, nyaSlatare, rundaSampel
} from './motor.js';

const $ = (id) => document.getElementById(id);
const NYCKEL = 'ww2-rorelse-installningar';
const AXEL_NAMN = {
  vridning: 'Vridning',
  tippa: 'Tippa fram/bak',
  luta: 'Luta åt sidan',
  accX: 'Acceleration höger',
  accY: 'Acceleration upp',
  accZ: 'Acceleration ut ur skärmen'
};
const AXEL_ORDNING = Object.keys(AXEL_NAMN);
const FARGER = ['#e25b55', '#5cc27a', '#5aa6e8'];

let installningar;
let standard;
let db = null;
let gester = [];
let sensorerPagar = false;
let lage = 'idle';
let syfte = 'ny';
let malGest = null;
let slatare = null;
let ring = [];
let rec = null;
let aktivFlik = 'nu';
let nedTimer = [];
let tal = null;
let audio = null;
let hzTider = [];
let senaste = { rot: null, vinkel: null, acc: null, accG: null, sedd: false, motionTid: 0 };
let valdExempel = new Map();
let byterNamn = null;
let spel = null;
let senasteProv = null;
let senasteKann = null;
let toastTimer = 0;
let stoppTimer = 0;

function talVarde(v) {
  return Number.isFinite(v) ? v : null;
}

function vektor(obj, nycklar) {
  if (!obj) return null;
  const v = nycklar.map((k) => talVarde(obj[k]));
  return v.every((x) => x == null) ? null : v;
}

function skarmVinkel() {
  const so = screen.orientation;
  if (so && Number.isFinite(so.angle)) return so.angle;
  if (Number.isFinite(window.orientation)) return window.orientation;
  return 0;
}

function formSek(s) {
  const n = Number.isFinite(s) ? s : 0;
  return `${n.toLocaleString('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} s`;
}

function formTal(n, decimaler) {
  return Number(n).toLocaleString('sv-SE', { minimumFractionDigits: decimaler, maximumFractionDigits: decimaler });
}

function visaDatum(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function nyttId() {
  return crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
}

function slaIhop(bas, over) {
  if (!over || typeof over !== 'object' || Array.isArray(over)) return structuredClone(bas);
  const ut = structuredClone(bas);
  for (const [k, v] of Object.entries(over)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && ut[k] && typeof ut[k] === 'object' && !Array.isArray(ut[k])) {
      ut[k] = slaIhop(ut[k], v);
    } else ut[k] = v;
  }
  return ut;
}

function sparaInstallningar() {
  localStorage.setItem(NYCKEL, JSON.stringify(installningar));
  slatare = nyaSlatare(installningar.utjamning);
}

function enhetInfo() {
  const ua = navigator.userAgent || '';
  let plattform = 'other';
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) plattform = 'ios';
  else if (/Android/i.test(ua)) plattform = 'android';
  return {
    userAgent: ua,
    plattform,
    sprak: navigator.language || null,
    skarm: {
      bredd: screen.width,
      hojd: screen.height,
      pixelForhallande: window.devicePixelRatio || 1,
      vinkel: skarmVinkel()
    }
  };
}

function oppnaDb() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open('ww2-rorelse', 1);
    r.onupgradeneeded = () => {
      if (!r.result.objectStoreNames.contains('gester')) r.result.createObjectStore('gester', { keyPath: 'id' });
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

function idbAlla() {
  return new Promise((resolve, reject) => {
    const q = db.transaction('gester', 'readonly').objectStore('gester').getAll();
    q.onsuccess = () => resolve(q.result || []);
    q.onerror = () => reject(q.error);
  });
}

async function sparaGest(gest) {
  if (db) {
    await new Promise((resolve, reject) => {
      const q = db.transaction('gester', 'readwrite').objectStore('gester').put(gest);
      q.onsuccess = () => resolve();
      q.onerror = () => reject(q.error);
    });
    return;
  }
  const alla = JSON.parse(localStorage.getItem('ww2-rorelse-gester') || '[]');
  const i = alla.findIndex((g) => g.id === gest.id);
  if (i >= 0) alla[i] = gest;
  else alla.push(gest);
  localStorage.setItem('ww2-rorelse-gester', JSON.stringify(alla));
}

async function taBortGest(id) {
  if (db) {
    await new Promise((resolve, reject) => {
      const q = db.transaction('gester', 'readwrite').objectStore('gester').delete(id);
      q.onsuccess = () => resolve();
      q.onerror = () => reject(q.error);
    });
    return;
  }
  const alla = JSON.parse(localStorage.getItem('ww2-rorelse-gester') || '[]').filter((g) => g.id !== id);
  localStorage.setItem('ww2-rorelse-gester', JSON.stringify(alla));
}

function sortera() {
  gester.sort((a, b) => String(b.uppdaterad || b.skapad || '').localeCompare(String(a.uppdaterad || a.skapad || '')));
}

function behorighet() {
  const DME = window.DeviceMotionEvent;
  const DOE = window.DeviceOrientationEvent;
  if (!window.isSecureContext) return Promise.resolve('insecure');
  const pm = DME && typeof DME.requestPermission === 'function' ? DME.requestPermission() : Promise.resolve('granted');
  const po = DOE && typeof DOE.requestPermission === 'function' ? DOE.requestPermission() : Promise.resolve('granted');
  return Promise.all([pm, po]).then(([a, b]) => {
    const ok = (v) => v === 'granted' || v === 'unavailable';
    return ok(a) && ok(b) ? 'granted' : 'denied';
  }).catch((err) => (err && err.name === 'NotAllowedError' ? 'needs-gesture' : 'error'));
}

function lyssna() {
  if (sensorerPagar) return;
  sensorerPagar = true;
  addEventListener('devicemotion', onMotion, { passive: true });
  addEventListener('deviceorientation', onOrient, { passive: true });
  $('startText').hidden = true;
  uppdateraKnappar();
}

async function startaSensorer() {
  const utfall = await behorighet();
  if (utfall === 'granted') {
    lyssna();
    $('status').textContent = 'Sensorer på · väntar';
    return true;
  }
  if (utfall === 'insecure') $('status').textContent = 'Öppna sidan med https för att läsa rörelse.';
  else $('status').textContent = 'Sensorerna är spärrade. Öppna sidan igen och tryck Tillåt.';
  return false;
}

function onMotion(e) {
  const rot = vektor(e.rotationRate, ['alpha', 'beta', 'gamma']);
  const acc = vektor(e.acceleration, ['x', 'y', 'z']);
  const accG = vektor(e.accelerationIncludingGravity, ['x', 'y', 'z']);
  if (rot) senaste.rot = rot;
  if (acc) senaste.acc = acc;
  if (accG) senaste.accG = accG;
  senaste.sedd = true;
  senaste.motionTid = performance.now();
  const nu = performance.now() / 1000;
  hzTider.push(nu);
  const grans = nu - 1;
  while (hzTider.length && hzTider[0] < grans) hzTider.shift();
}

function onOrient(e) {
  const v = [talVarde(e.alpha), talVarde(e.beta), talVarde(e.gamma)];
  if (v.some((x) => x != null)) senaste.vinkel = v;
  senaste.sedd = true;
}

function nuRaw(t) {
  const färsk = performance.now() - senaste.motionTid < 250;
  return {
    t,
    rot: färsk && senaste.rot ? senaste.rot.slice() : null,
    vinkel: senaste.vinkel ? senaste.vinkel.slice() : null,
    acc: färsk && senaste.acc ? senaste.acc.slice() : null,
    accG: färsk && senaste.accG ? senaste.accG.slice() : null,
    skarm: skarmVinkel()
  };
}

function laggRing(beh) {
  ring.push(beh);
  const grans = beh.t - (installningar.fonsterSek || 3) - 0.25;
  while (ring.length && ring[0].t < grans) ring.shift();
}

let sistProv = 0;
function tick() {
  const nuMs = performance.now();
  const nu = nuMs / 1000;
  if (sensorerPagar && slatare) {
    const raw = nuRaw(nu);
    const beh = behandlaRaa(raw, installningar, slatare);
    beh.t = nu;
    laggRing(beh);
    if (rec?.aktiv) {
      const minDt = 1000 / (installningar.malHz || 60);
      if (nuMs - sistProv >= minDt * 0.9) {
        sistProv = nuMs;
        const t = (nuMs - rec.start) / 1000;
        rec.sampel.push(rundaSampel({ ...raw, t }));
        rec.senastRaw = raw;
      }
    }
    const hz = hzTider.length;
    $('status').textContent = senaste.sedd ? `Sensorer på · ${hz} Hz` : 'Sensorer på · väntar';
  }
  if (aktivFlik === 'nu') ritaLive();
  if (spel) ritaSpel();
  requestAnimationFrame(tick);
}

function storlek(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || 320;
  const h = canvas.clientHeight || 64;
  const bw = Math.max(1, Math.floor(w * dpr));
  const bh = Math.max(1, Math.floor(h * dpr));
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  const c = canvas.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { c, w, h };
}

function ritaSerie(canvas, punkter, t0, t1, nyckel, skala, mitten, huvud) {
  if (!canvas) return;
  const { c, w, h } = storlek(canvas);
  c.clearRect(0, 0, w, h);
  c.strokeStyle = '#2c343c';
  c.beginPath();
  c.moveTo(0, h / 2);
  c.lineTo(w, h / 2);
  c.stroke();
  const span = Math.max(0.001, t1 - t0);
  for (let k = 0; k < 3; k++) {
    c.beginPath();
    c.strokeStyle = FARGER[k];
    c.lineWidth = 1.7;
    let flytt = true;
    for (const p of punkter) {
      if (p.t < t0 || p.t > t1) continue;
      const v = p[nyckel]?.[k];
      if (v == null || !Number.isFinite(v)) { flytt = true; continue; }
      const x = ((p.t - t0) / span) * (w - 2) + 1;
      const mitt = mitten ? mitten[k] : 0;
      const y = h / 2 - ((v - mitt) / skala) * (h / 2 - 3);
      const yy = Math.max(2, Math.min(h - 2, y));
      if (flytt) { c.moveTo(x, yy); flytt = false; }
      else c.lineTo(x, yy);
    }
    c.stroke();
  }
  if (huvud != null) {
    const x = Math.max(1, Math.min(w - 1, ((huvud - t0) / span) * (w - 2) + 1));
    c.strokeStyle = '#f4f1e6';
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, h);
    c.stroke();
  }
}

function ritaLive() {
  const nu = performance.now() / 1000;
  const fonster = installningar.fonsterSek || 3;
  const t0 = nu - fonster;
  const skala = installningar.skala || {};
  ritaSerie($('cRot'), ring, t0, nu, 'rot', skala.rot || 250, null, null);
  ritaSerie($('cVinkel'), ring, t0, nu, 'vinkel', skala.vinkel || 180, [180, 0, 0], null);
  ritaSerie($('cAcc'), ring, t0, nu, 'acc', skala.acc || 20, null, null);
  ritaSerie($('cAccG'), ring, t0, nu, 'accG', skala.accG || 20, null, null);
}

function forberedLjud() {
  if (!installningar.ljud) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (!audio) audio = new AC();
  if (audio.state === 'suspended') void audio.resume();
}

function pip(frek, ms) {
  if (!audio || !installningar.ljud) return;
  const t = audio.currentTime;
  const o = audio.createOscillator();
  const g = audio.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(frek, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.2, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
  o.connect(g);
  g.connect(audio.destination);
  o.start(t);
  o.stop(t + ms / 1000 + 0.02);
}

function skaka(ms) {
  if (!installningar.vibration) return;
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* telefonen kan sakna vibration */ }
}

function visaFlik(namn) {
  aktivFlik = namn;
  $('flik-nu').hidden = namn !== 'nu';
  $('flik-sparade').hidden = namn !== 'sparade';
  $('flik-kann').hidden = namn !== 'kann';
  for (const knapp of document.querySelectorAll('nav button')) {
    knapp.classList.toggle('aktiv', knapp.dataset.flik === namn);
  }
  uppdateraKnappar();
}

function uppdateraKnappar() {
  const spelar = lage === 'spelar';
  $('primar').hidden = !(aktivFlik === 'nu' || spelar);
  $('primar').classList.toggle('stopp', spelar);
  if (spelar) {
    /* texten sätts av klockan */
  } else if (!sensorerPagar) $('primar').textContent = 'Starta sensorer';
  else $('primar').textContent = 'Ny inmatning';
  $('kannKnapp').hidden = aktivFlik !== 'kann' || spelar || lage === 'ned' || lage === 'namn';
  $('primar').disabled = lage === 'ned' || lage === 'namn';
}

function avbrytNed() {
  nedTimer.forEach(clearTimeout);
  nedTimer = [];
  lage = 'idle';
  $('lager').hidden = true;
  $('vyNed').hidden = false;
  $('vyNamn').hidden = true;
  uppdateraKnappar();
}

function startaNed(nastaSyfte, gestId) {
  if (lage === 'spelar' || lage === 'ned' || lage === 'namn') return;
  syfte = nastaSyfte;
  malGest = gestId || null;
  lage = 'ned';
  $('vyNamn').hidden = true;
  $('vyNed').hidden = false;
  $('lager').hidden = false;
  uppdateraKnappar();
  const talen = [];
  const n = Math.max(1, Math.round(Number(installningar.nedrakningSek) || 3));
  for (let i = n; i >= 1; i--) talen.push(i);
  const toner = [523, 659, 784, 988];
  talen.forEach((talSteg, i) => {
    nedTimer.push(setTimeout(() => {
      $('nedTal').textContent = String(talSteg);
      $('nedText').textContent = 'Håll telefonen redo';
      pip(toner[Math.min(i, toner.length - 1)], 120);
      skaka(35);
    }, i * 1000));
  });
  nedTimer.push(setTimeout(() => {
    $('nedTal').textContent = 'Kör';
    $('nedText').textContent = 'Gör rörelsen';
    pip(988, 180);
    skaka(70);
  }, talen.length * 1000));
  nedTimer.push(setTimeout(() => {
    nedTimer = [];
    $('lager').hidden = true;
    borjaInspelning();
  }, talen.length * 1000 + 350));
}

function borjaInspelning() {
  lage = 'spelar';
  sistProv = 0;
  rec = {
    aktiv: true,
    start: performance.now(),
    sampel: [],
    senastRaw: null,
    stillaFran: null,
    syfte,
    gestId: malGest
  };
  visaFlik('nu');
  clearInterval(stoppTimer);
  stoppTimer = setInterval(kollaStopp, 100);
  uppdateraKnappar();
  kollaStopp();
}

function kollaStopp() {
  if (!rec?.aktiv) return;
  const t = (performance.now() - rec.start) / 1000;
  $('primar').textContent = `Stopp · ${formSek(t)}`;
  if (t >= (Number(installningar.maxSek) || 10)) {
    avsluta('max');
    return;
  }
  const still = !rec.senastRaw || arStilla(rec.senastRaw, installningar);
  if (!still) {
    rec.stillaFran = null;
    return;
  }
  if (rec.stillaFran == null) rec.stillaFran = performance.now();
  const stillTid = (performance.now() - rec.stillaFran) / 1000;
  if (t >= (Number(installningar.minSek) || 0) && stillTid >= (Number(installningar.stillaSek) || 3)) avsluta('stilla');
}

function avsluta(orsak) {
  if (!rec?.aktiv) return;
  rec.aktiv = false;
  clearInterval(stoppTimer);
  const sampel = rec.sampel.slice();
  const langd = sampel.length ? sampel[sampel.length - 1].t : (performance.now() - rec.start) / 1000;
  const hz = matHz(sampel);
  const tagning = {
    id: nyttId(),
    skapad: new Date().toISOString(),
    langdSek: Math.round(langd * 1000) / 1000,
    samplingsfrekvensHz: hz == null ? null : Math.round(hz * 10) / 10,
    antal: sampel.length,
    avslut: orsak,
    sampel
  };
  const gjort = rec.syfte;
  const gestId = rec.gestId;
  rec = null;
  lage = 'idle';
  pip(440, 90);
  skaka(40);
  uppdateraKnappar();
  if (!sampel.length) {
    toast('Ingen rörelse kom in. Starta sensorerna och försök igen.');
    return;
  }
  senasteProv = { tagning, gestId, syfte: gjort };
  if (gjort === 'exempel') {
    void laggExempel(gestId, tagning);
    return;
  }
  if (gjort === 'kann') {
    visaKann(tagning);
    return;
  }
  oppnaNamn();
}

function oppnaNamn() {
  lage = 'namn';
  $('namnFalt').value = '';
  $('tolkad').textContent = '';
  $('talStatus').textContent = '';
  $('bSpara').disabled = true;
  $('vyNed').hidden = true;
  $('vyNamn').hidden = false;
  $('lager').hidden = false;
  uppdateraKnappar();
  if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) {
    $('talStatus').textContent = 'Taligenkänning saknas här. Skriv namnet. På iPhone finns en mikrofon på tangentbordet.';
    $('mik').hidden = true;
  } else $('mik').hidden = false;
}

function stangNamn() {
  stoppaTal();
  lage = 'idle';
  $('lager').hidden = true;
  $('vyNamn').hidden = true;
  $('vyNed').hidden = false;
  uppdateraKnappar();
}

function stoppaTal() {
  if (!tal) return;
  try { tal.onend = null; tal.stop(); } catch (e) { /* redan stoppad */ }
  tal = null;
}

function startaTal(falt) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    $('talStatus').textContent = 'Taligenkänning saknas här. Skriv namnet.';
    falt.focus();
    return;
  }
  stoppaTal();
  tal = new SR();
  tal.lang = 'sv-SE';
  tal.interimResults = true;
  tal.continuous = false;
  tal.maxAlternatives = 1;
  if ($('talStatus')) $('talStatus').textContent = 'Lyssnar… säg till exempel backhand i tennis.';
  tal.onresult = (ev) => {
    let text = '';
    for (let i = 0; i < ev.results.length; i++) text += ev.results[i][0].transcript;
    text = text.replace(/\s+/g, ' ').trim();
    if (!text) return;
    falt.value = text;
    if (falt === $('namnFalt')) {
      $('tolkad').textContent = text;
      $('bSpara').disabled = false;
    }
  };
  tal.onerror = (ev) => {
    const texter = {
      'not-allowed': 'Mikrofonen är avstängd. Skriv namnet, eller slå på diktering i Inställningar.',
      'service-not-allowed': 'Siri eller diktering är av. Skriv namnet. Tangentbordets mikrofon fungerar ändå.',
      'no-speech': 'Hörde inget. Försök igen eller skriv.',
      'audio-capture': 'Ingen mikrofon hittades. Skriv namnet.',
      network: 'Talet behöver nät. Skriv namnet om det inte går.'
    };
    if (ev.error === 'aborted') return;
    const text = texter[ev.error] || 'Kunde inte höra. Skriv namnet.';
    if (falt === $('namnFalt')) $('talStatus').textContent = text;
    else toast(text);
  };
  tal.onend = () => {
    if (falt === $('namnFalt') && falt.value.trim()) $('talStatus').textContent = 'Hörde det här. Tryck Spara, eller försök igen.';
  };
  try { tal.start(); }
  catch (e) {
    if (falt === $('namnFalt')) $('talStatus').textContent = 'Kunde inte starta mikrofonen. Skriv namnet.';
  }
}

async function sparaNy(namn) {
  const nu = new Date().toISOString();
  const gest = {
    id: nyttId(),
    namn,
    skapad: nu,
    uppdaterad: nu,
    exempel: [senasteProv.tagning]
  };
  try {
    await sparaGest(gest);
  } catch (e) {
    toast('Kunde inte spara på telefonen.');
    return;
  }
  gester.unshift(gest);
  sortera();
  stangNamn();
  ritaLista();
  visaFlik('sparade');
  toast(`Sparade ${namn}.`);
}

async function laggExempel(gestId, tagning) {
  const gest = gester.find((g) => g.id === gestId);
  if (!gest) {
    toast('Hittade inte rörelsen.');
    return;
  }
  gest.exempel.push(tagning);
  gest.uppdaterad = new Date().toISOString();
  try { await sparaGest(gest); }
  catch (e) { toast('Kunde inte spara exemplet.'); return; }
  valdExempel.set(gest.id, tagning.id);
  ritaLista();
  visaFlik('sparade');
  toast(`Exempel ${gest.exempel.length} på ${gest.namn}.`);
}

function visaKann(tagning) {
  const svar = kannIgen(tagning.sampel, gester, installningar);
  senasteKann = { tagning, svar };
  visaFlik('kann');
  const box = $('kannResultat');
  box.hidden = false;
  if (!svar.ok) {
    $('kannEtikett').textContent = 'Första versionen';
    $('kannSvar').textContent = svar.orsak === 'tom' ? 'Spara en rörelse först.' : 'Tagningen var för kort.';
    $('kannProcent').textContent = '';
    $('kannNasta').textContent = '';
    $('bKannSpara').hidden = true;
    return;
  }
  const osaker = svar.bast.procent < 55;
  $('kannEtikett').textContent = osaker ? 'Osäker träff · första versionen' : 'Bästa träffen · första versionen';
  $('kannSvar').textContent = svar.bast.namn;
  $('kannProcent').textContent = `${svar.bast.procent} %`;
  $('kannNasta').textContent = svar.nasta ? `Näst närmast: ${svar.nasta.namn}` : 'Jämförd med samma rörelse åt andra hållet.';
  $('bKannSpara').hidden = false;
  $('bKannSpara').textContent = `Spara som exempel på ${svar.bast.namn}`;
}

function ritaLista() {
  const rot = $('lista');
  rot.replaceChildren();
  if (!gester.length) {
    const p = document.createElement('p');
    p.className = 'tom';
    p.textContent = 'Inga rörelser än. Tryck Ny inmatning och gör en rörelse.';
    rot.append(p);
    return;
  }
  for (const gest of gester) {
    const senasteEx = gest.exempel[gest.exempel.length - 1];
    const vald = gest.exempel.find((e) => e.id === valdExempel.get(gest.id)) || senasteEx;
    const artikel = document.createElement('article');
    artikel.className = 'kort';
    artikel.dataset.id = gest.id;

    if (byterNamn === gest.id) {
      const falt = document.createElement('input');
      falt.type = 'text';
      falt.value = gest.namn;
      falt.setAttribute('data-namn', '');
      falt.autocomplete = 'off';
      const rad = document.createElement('div');
      rad.className = 'knapprad';
      rad.append(knapp('Spara namn', 'spara-namn'), knapp('Säg namnet', 'tal-namn'), knapp('Avbryt', 'avbryt-namn'));
      artikel.append(falt, rad);
    } else {
      const h = document.createElement('h3');
      h.textContent = gest.namn;
      artikel.append(h);
    }

    const meta = document.createElement('p');
    meta.className = 'meta';
    const langd = vald?.langdSek;
    meta.textContent = `${visaDatum(gest.uppdaterad || gest.skapad)} · ${formSek(langd)} · ${gest.exempel.length} exempel`;
    const mini = document.createElement('canvas');
    mini.className = 'mini';
    mini.height = 36;
    artikel.append(meta, mini);

    if (gest.exempel.length > 1) {
      const rad = document.createElement('div');
      rad.className = 'exempelrad';
      gest.exempel.forEach((ex, i) => {
        const b = knapp(`Exempel ${i + 1}`, 'valj');
        b.dataset.exempel = ex.id;
        if (ex.id === vald?.id) b.classList.add('vald');
        rad.append(b);
      });
      artikel.append(rad);
    }

    const spelarDenna = spel && spel.gestId === gest.id;
    const rad1 = document.createElement('div');
    rad1.className = 'knapprad';
    rad1.append(
      knapp(spelarDenna ? 'Stopp' : 'Spela upp', spelarDenna ? 'stoppa-spel' : 'spela'),
      knapp('Lägg till exempel', 'exempel')
    );
    const rad2 = document.createElement('div');
    rad2.className = 'knapprad';
    const bort = knapp('Ta bort', 'ta-bort');
    rad2.append(knapp('Byt namn', 'byt'), bort);
    artikel.append(rad1, rad2);

    if (spelarDenna) {
      const box = document.createElement('div');
      box.className = 'spel';
      for (const id of ['rot', 'vinkel', 'acc', 'accG']) {
        const c = document.createElement('canvas');
        c.dataset.spel = id;
        c.height = 64;
        box.append(c);
      }
      artikel.append(box);
    }
    rot.append(artikel);
    ritaMini(mini, vald?.sampel || []);
  }
}

function knapp(text, gor) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = text;
  b.dataset.gor = gor;
  return b;
}

function ritaMini(canvas, sampel) {
  const punkter = (sampel || []).map((s) => ({ t: s.t, rot: s.rot }));
  let max = 20;
  for (const p of punkter) for (const v of p.rot || []) if (Number.isFinite(v)) max = Math.max(max, Math.abs(v));
  const t1 = punkter.length ? punkter[punkter.length - 1].t : 1;
  ritaSerie(canvas, punkter, 0, Math.max(0.2, t1), 'rot', max, null, null);
}

function startaSpel(gest, ex) {
  const serie = helaSerien(ex.sampel, installningar);
  spel = {
    gestId: gest.id,
    exId: ex.id,
    start: performance.now(),
    langd: Math.max(0.2, ex.langdSek || (serie.length ? serie[serie.length - 1].t : 0.2)),
    serie
  };
  ritaLista();
}

function ritaSpel() {
  if (!spel) return;
  const artikel = document.querySelector(`article[data-id="${CSS.escape(spel.gestId)}"]`);
  if (!artikel) return;
  const t = Math.min(spel.langd, (performance.now() - spel.start) / 1000);
  const skala = installningar.skala || {};
  const kart = {
    rot: ['rot', skala.rot || 250, null],
    vinkel: ['vinkel', skala.vinkel || 180, [180, 0, 0]],
    acc: ['acc', skala.acc || 20, null],
    accG: ['accG', skala.accG || 20, null]
  };
  for (const canvas of artikel.querySelectorAll('canvas[data-spel]')) {
    const [nyckel, skal, mitt] = kart[canvas.dataset.spel];
    ritaSerie(canvas, spel.serie, 0, spel.langd, nyckel, skal, mitt, t);
  }
  if (t >= spel.langd) {
    spel = null;
    ritaLista();
  }
}

function byggReglage() {
  const rot = $('reglage');
  const tider = $('tider');
  rot.replaceChildren();
  tider.replaceChildren();
  const reg = installningar.reglage || {};
  const k = reg.kanslighet || { min: 0.2, max: 5, steg: 0.1 };
  const ordning = [...AXEL_ORDNING, ...Object.keys(installningar.axlar || {}).filter((n) => !AXEL_ORDNING.includes(n))];
  for (const namn of ordning) {
    const axel = installningar.axlar[namn];
    if (!axel) continue;
    const titel = AXEL_NAMN[namn] || namn;
    rot.append(slider(`${titel}, känslighet`, k.min, k.max, k.steg, axel.kanslighet, (v) => { axel.kanslighet = v; }));
    const steg = String(axel.enhet || '').includes('m') ? (reg.dodzonStegAcc || 0.05) : (reg.dodzonStegRot || 0.5);
    rot.append(slider(`${titel}, dödzon ${axel.enhet || ''}`, 0, axel.dodzonMax || 40, steg, axel.dodzon, (v) => { axel.dodzon = v; }));
  }
  const u = reg.utjamning || { min: 0, max: 1, steg: 0.05 };
  rot.append(slider('Utjämning', u.min, u.max, u.steg, installningar.utjamning, (v) => { installningar.utjamning = v; }));
  const falt = [
    ['nedrakningSek', 'Nedräkning', 1, 5, 1],
    ['stillaSek', 'Stopp efter stillhet, sekunder', 0.5, 15, 0.5],
    ['maxSek', 'Längsta inspelning, sekunder', 1, 30, 1],
    ['fonsterSek', 'Kurvorna visar, sekunder', 1, 8, 0.5],
    ['malHz', 'Takt, ungefär', 20, 120, 1],
    ['stillaRotDegS', 'Stillhet under, grader/s', 1, 80, 1],
    ['stillaAcc', 'Stillhet under, m/s²', 0.05, 5, 0.05]
  ];
  for (const [nyckel, text, min, max, steg] of falt) {
    const lab = document.createElement('label');
    lab.className = 'rad';
    const span = document.createElement('span');
    span.textContent = text;
    const input = document.createElement('input');
    input.type = 'number';
    input.min = String(min);
    input.max = String(max);
    input.step = String(steg);
    input.value = String(installningar[nyckel]);
    input.addEventListener('change', () => {
      const v = Number(input.value);
      if (!Number.isFinite(v)) return;
      installningar[nyckel] = Math.min(max, Math.max(min, v));
      input.value = String(installningar[nyckel]);
      sparaInstallningar();
    });
    lab.append(span, input);
    tider.append(lab);
  }
  $('cbLjud').checked = !!installningar.ljud;
  $('cbVibr').checked = !!installningar.vibration;
}

function slider(text, min, max, steg, varde, satt) {
  const lab = document.createElement('label');
  lab.className = 'rad';
  const namn = document.createElement('span');
  namn.className = 'namn';
  namn.textContent = text;
  const vis = document.createElement('span');
  vis.className = 'varde';
  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(steg);
  input.value = String(varde ?? min);
  const rita = () => { vis.textContent = formTal(input.value, String(steg).includes('.') ? 2 : 0); };
  rita();
  input.addEventListener('input', () => {
    satt(Number(input.value));
    rita();
    sparaInstallningar();
  });
  lab.append(namn, vis, input);
  return lab;
}

function filnamn() {
  const d = new Date();
  const manad = String(d.getMonth() + 1).padStart(2, '0');
  const dag = String(d.getDate()).padStart(2, '0');
  return `rorelser-${d.getFullYear()}-${manad}-${dag}.json`;
}

async function exportera() {
  const data = byggExport({
    gester,
    installningar,
    enhet: enhetInfo(),
    tid: new Date().toISOString()
  });
  const text = JSON.stringify(data);
  const fil = new File([text], filnamn(), { type: 'application/json' });
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [fil] })) {
    try {
      await navigator.share({ files: [fil], title: 'Rörelser från telefonen' });
      toast('Delade filen.');
      return;
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(fil);
  const a = document.createElement('a');
  a.href = url;
  a.download = fil.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast('Filen laddas ner.');
}

async function hamtaInFil(fil) {
  let data;
  try { data = JSON.parse(await fil.text()); }
  catch (e) { toast('Filen är inte JSON.'); return; }
  let lista;
  try { lista = lasImport(data); }
  catch (e) {
    toast(e.kod === 'version' ? 'Filen har en annan version.' : 'Filen är inte en rörelsefil.');
    return;
  }
  let nya = 0;
  let uppd = 0;
  for (const gest of lista) {
    const i = gester.findIndex((g) => g.id === gest.id);
    if (i >= 0) { gester[i] = gest; uppd++; }
    else { gester.push(gest); nya++; }
    try { await sparaGest(gest); }
    catch (err) { toast('Kunde inte spara det som hämtades in.'); return; }
  }
  sortera();
  ritaLista();
  toast(`Lade till ${nya}, uppdaterade ${uppd}.`);
}

function koppla() {
  $('primar').addEventListener('click', () => {
    if (lage === 'spelar') { avsluta('stopp'); return; }
    if (lage !== 'idle') return;
    if (!sensorerPagar) {
      void startaSensorer();
      return;
    }
    forberedLjud();
    startaNed('ny');
  });
  $('kannKnapp').addEventListener('click', () => {
    if (!gester.length) { toast('Spara minst en rörelse först.'); return; }
    if (lage !== 'idle') return;
    forberedLjud();
    const p = sensorerPagar ? Promise.resolve(true) : startaSensorer();
    void p.then((ok) => { if (ok) startaNed('kann'); });
  });
  $('bAvbryt').addEventListener('click', avbrytNed);
  $('mik').addEventListener('click', () => startaTal($('namnFalt')));
  $('bIgen').addEventListener('click', () => startaTal($('namnFalt')));
  $('namnFalt').addEventListener('input', () => { $('bSpara').disabled = !$('namnFalt').value.trim(); });
  $('namnFalt').addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && $('namnFalt').value.trim()) $('bSpara').click();
  });
  $('bSlang').addEventListener('click', () => { senasteProv = null; stangNamn(); toast('Slängde tagningen.'); });
  $('bSpara').addEventListener('click', () => {
    const namn = $('namnFalt').value.trim();
    if (!namn || !senasteProv) return;
    void sparaNy(namn);
  });
  $('bKannSpara').addEventListener('click', () => {
    if (!senasteKann?.svar?.ok) return;
    void laggExempel(senasteKann.svar.bast.id, senasteKann.tagning);
  });
  $('bExport').addEventListener('click', () => { void exportera(); });
  $('bImport').addEventListener('click', () => $('importFil').click());
  $('importFil').addEventListener('change', () => {
    const fil = $('importFil').files && $('importFil').files[0];
    $('importFil').value = '';
    if (fil) void hamtaInFil(fil);
  });
  $('cbLjud').addEventListener('change', () => { installningar.ljud = $('cbLjud').checked; sparaInstallningar(); });
  $('cbVibr').addEventListener('change', () => { installningar.vibration = $('cbVibr').checked; sparaInstallningar(); });
  $('bStandard').addEventListener('click', () => {
    if ($('bStandard').dataset.saker !== '1') {
      $('bStandard').dataset.saker = '1';
      $('bStandard').textContent = 'Återställ på riktigt';
      setTimeout(() => {
        $('bStandard').dataset.saker = '';
        $('bStandard').textContent = 'Standardvärden';
      }, 4000);
      return;
    }
    localStorage.removeItem(NYCKEL);
    installningar = structuredClone(standard);
    slatare = nyaSlatare(installningar.utjamning);
    byggReglage();
    toast('Återställde värdena.');
  });
  document.querySelector('nav').addEventListener('click', (ev) => {
    const knapp = ev.target.closest('button[data-flik]');
    if (!knapp || lage === 'spelar' || lage === 'ned') return;
    visaFlik(knapp.dataset.flik);
    if (knapp.dataset.flik === 'sparade') ritaLista();
  });
  $('lista').addEventListener('click', (ev) => { void listaKlick(ev); });
}

async function listaKlick(ev) {
  const artikel = ev.target.closest('article[data-id]');
  if (!artikel) return;
  const gest = gester.find((g) => g.id === artikel.dataset.id);
  if (!gest) return;
  const knapp = ev.target.closest('button[data-gor]');
  if (!knapp) return;
  const gor = knapp.dataset.gor;
  const vald = gest.exempel.find((e) => e.id === valdExempel.get(gest.id)) || gest.exempel[gest.exempel.length - 1];
  if (gor === 'valj') {
    valdExempel.set(gest.id, knapp.dataset.exempel);
    if (spel?.gestId === gest.id) spel = null;
    ritaLista();
    return;
  }
  if (gor === 'spela' && vald) {
    startaSpel(gest, vald);
    return;
  }
  if (gor === 'stoppa-spel') {
    spel = null;
    ritaLista();
    return;
  }
  if (gor === 'exempel') {
    forberedLjud();
    const p = sensorerPagar ? Promise.resolve(true) : startaSensorer();
    void p.then((ok) => { if (ok) startaNed('exempel', gest.id); });
    return;
  }
  if (gor === 'byt') {
    byterNamn = gest.id;
    ritaLista();
    const falt = document.querySelector(`article[data-id="${CSS.escape(gest.id)}"] input[data-namn]`);
    if (falt) falt.focus();
    return;
  }
  if (gor === 'avbryt-namn') {
    byterNamn = null;
    ritaLista();
    return;
  }
  if (gor === 'tal-namn') {
    const falt = artikel.querySelector('input[data-namn]');
    if (falt) startaTal(falt);
    return;
  }
  if (gor === 'spara-namn') {
    const falt = artikel.querySelector('input[data-namn]');
    const namn = falt ? falt.value.trim() : '';
    if (!namn) return;
    gest.namn = namn;
    gest.uppdaterad = new Date().toISOString();
    try { await sparaGest(gest); }
    catch (e) { toast('Kunde inte byta namn.'); return; }
    byterNamn = null;
    ritaLista();
    return;
  }
  if (gor === 'ta-bort') {
    if (knapp.dataset.saker !== '1') {
      knapp.dataset.saker = '1';
      knapp.textContent = 'Ta bort på riktigt';
      knapp.classList.add('saker');
      setTimeout(() => {
        if (knapp.isConnected) {
          knapp.dataset.saker = '';
          knapp.textContent = 'Ta bort';
          knapp.classList.remove('saker');
        }
      }, 4000);
      return;
    }
    try { await taBortGest(gest.id); }
    catch (e) { toast('Kunde inte ta bort.'); return; }
    gester = gester.filter((g) => g.id !== gest.id);
    if (spel?.gestId === gest.id) spel = null;
    ritaLista();
    toast('Tog bort rörelsen.');
  }
}

async function start() {
  const svar = await fetch(new URL('./installningar.json', import.meta.url));
  if (!svar.ok) throw new Error('installningar');
  standard = await svar.json();
  let sparad = null;
  try { sparad = JSON.parse(localStorage.getItem(NYCKEL) || 'null'); } catch (e) { sparad = null; }
  installningar = slaIhop(standard, sparad);
  slatare = nyaSlatare(installningar.utjamning);
  byggReglage();
  try {
    db = await oppnaDb();
    gester = await idbAlla();
  } catch (e) {
    db = null;
    try { gester = JSON.parse(localStorage.getItem('ww2-rorelse-gester') || '[]'); }
    catch (err) { gester = []; }
    toast('Sparar i webbläsaren. IndexedDB gick inte att öppna.');
  }
  sortera();
  ritaLista();
  koppla();
  uppdateraKnappar();
  requestAnimationFrame(tick);
}

start().catch(() => {
  $('status').textContent = 'Kunde inte läsa inställningarna.';
});
