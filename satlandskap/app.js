import { tolka } from './klass.js';
import { skapaScen, VAGAR } from './scen.js';
import {
  byggGlb, byggJson, filnamn, formateraStorlek, lasBibliotek, sparaIBibliotek
} from './spara.js';

const kropp = document.body;
const statusEl = document.getElementById('status');
const mobilEl = document.getElementById('mobil');
const meny = document.getElementById('meny');
const dialog = document.getElementById('sparaDialog');
const jamforelse = document.getElementById('jamforelse');
const scen = skapaScen(document.getElementById('yta'));

let raster = null;
let tolkning = null;
let bildNamn = 'Markimvägen provbild';
let vagId = 'grus';
let kollisionSynlig = false;
let senastBlob = null;

const vagVal = document.getElementById('vagVal');
for (const vag of VAGAR) {
  const knapp = document.createElement('button');
  knapp.type = 'button';
  knapp.dataset.vag = vag.id;
  knapp.setAttribute('role', 'option');
  knapp.setAttribute('aria-pressed', vag.id === vagId ? 'true' : 'false');
  const img = document.createElement('img');
  img.src = vag.sokvag;
  img.alt = '';
  knapp.append(img, document.createTextNode(vag.namn));
  knapp.addEventListener('click', () => {
    vagId = vag.id;
    scen.bytVag(vagId);
    for (const annan of vagVal.querySelectorAll('button')) {
      annan.setAttribute('aria-pressed', annan === knapp ? 'true' : 'false');
    }
    uppdateraStorlek();
  });
  vagVal.append(knapp);
}

document.getElementById('menyKnapp').addEventListener('click', () => oppnaMeny(true));
document.getElementById('menyStang').addEventListener('click', () => oppnaMeny(false));

function oppnaMeny(oppna) {
  meny.hidden = !oppna;
  document.getElementById('menyKnapp').setAttribute('aria-expanded', oppna ? 'true' : 'false');
}

document.getElementById('provKnapp').addEventListener('click', () => {
  bildNamn = 'Markimvägen provbild';
  laddaUrl('./prov.jpg', bildNamn);
});
document.getElementById('laddaKnapp').addEventListener('click', () => {
  document.getElementById('fil').click();
});
document.getElementById('fil').addEventListener('change', () => {
  const fil = document.getElementById('fil').files[0];
  if (!fil) return;
  bildNamn = fil.name.replace(/\.[^.]+$/, '');
  const url = URL.createObjectURL(fil);
  laddaUrl(url, bildNamn).finally(() => URL.revokeObjectURL(url));
});
document.getElementById('bredd').addEventListener('change', () => {
  if (raster) tolkaOm();
});
document.getElementById('vyOversikt').addEventListener('click', () => { scen.visaVy('oversikt'); oppnaMeny(false); });
document.getElementById('vyNara').addEventListener('click', () => { scen.visaVy('nara'); oppnaMeny(false); });
document.getElementById('vyMark').addEventListener('click', () => { scen.visaVy('mark'); oppnaMeny(false); });

const kollisionKnapp = document.getElementById('kollisionKnapp');
kollisionKnapp.addEventListener('click', () => {
  kollisionSynlig = !kollisionSynlig;
  scen.visaKollision(kollisionSynlig);
  kollisionKnapp.textContent = kollisionSynlig ? 'Dölj kollisionsytor' : 'Visa kollisionsytor';
  if (kollisionSynlig) oppnaMeny(false);
});

document.getElementById('oppnaSpara').addEventListener('click', () => oppnaSpara());
document.getElementById('sparaStang').addEventListener('click', () => { dialog.hidden = true; });
document.getElementById('sparaForm').addEventListener('submit', (e) => {
  e.preventDefault();
  sparaBibliotek();
});
document.getElementById('nerGlb').addEventListener('click', () => hamta('glb'));
document.getElementById('nerJson').addEventListener('click', () => hamta('json'));

function laddaUrl(url, namn) {
  statusEl.textContent = 'Läser bilden…';
  kropp.dataset.redo = 'nej';
  return new Promise((klar, fel) => {
    const bild = new Image();
    bild.onload = () => klar(bild);
    bild.onerror = () => fel(new Error('Bilden gick inte att läsa.'));
    bild.src = url;
  }).then((bild) => {
    raster = ritaRaster(bild);
    bildNamn = namn;
    return tolkaOm();
  }).catch((fel) => {
    statusEl.textContent = fel.message || 'Bilden gick inte att läsa.';
  });
}

function ritaRaster(bild) {
  const skala = 320 / Math.max(bild.naturalWidth, bild.naturalHeight);
  const bredd = Math.max(16, Math.round(bild.naturalWidth * skala));
  const hojd = Math.max(16, Math.round(bild.naturalHeight * skala));
  const duk = document.createElement('canvas');
  duk.width = bredd;
  duk.height = hojd;
  const rit = duk.getContext('2d', { willReadFrequently: true });
  rit.drawImage(bild, 0, 0, bredd, hojd);
  return { width: bredd, height: hojd, data: rit.getImageData(0, 0, bredd, hojd).data, bild };
}

function tolkaOm() {
  const bredd = Math.max(30, Math.min(1200, Number(document.getElementById('bredd').value) || 180));
  document.getElementById('bredd').value = String(bredd);
  statusEl.textContent = 'Tolkar bilden…';
  kollisionSynlig = false;
  kollisionKnapp.textContent = 'Skapa kollisionsytor';
  tolkning = tolka(raster, { breddMeter: bredd, tathet: 1, fro: 42, detalj: 'mobil' }, { namn: bildNamn });
  const vagMeter = Math.round(tolkning.vagar.reduce((s, v) => s + v.langdMeter, 0));
  statusEl.textContent = `${tolkning.tradNu} träd · ${Math.round(tolkning.breddMeter)}×${Math.round(tolkning.djupMeter)} m`;
  jamforelse.textContent = `Den gamla regeln satte träd även på släta åkrar: ${grupp(tolkning.tradFore)} träd. Nu ${grupp(tolkning.tradNu)}, bara i mörka dungar med textur. Vägar: ${vagMeter} m.`;
  kropp.dataset.tradFore = String(tolkning.tradFore);
  kropp.dataset.tradNu = String(tolkning.tradNu);
  kropp.dataset.faltTrad = String(tolkning.faltTrad);
  kropp.dataset.vagar = String(tolkning.vagar.length);
  return scen.visa(tolkning, raster.bild).then(() => uppdateraStorlek()).then(() => {
    kropp.dataset.redo = 'ja';
  });
}

function uppdateraStorlek() {
  if (!tolkning) return Promise.resolve();
  return jpegAv(raster.bild).then((jpeg) => {
    senastBlob = { jpeg };
    const glb = byggGlb(tolkning, jpeg);
    const json = JSON.stringify(byggJson(tolkning, valAv()));
    const totalt = glb.byteLength + new TextEncoder().encode(json).length;
    senastBlob.glb = glb;
    senastBlob.json = json;
    senastBlob.totalt = totalt;
    mobilEl.textContent = `Mobil ${formateraStorlek(totalt)}`;
    kropp.dataset.mobilByte = String(totalt);
    const storlekEl = document.getElementById('sparaStorlek');
    if (storlekEl) {
      storlekEl.textContent = `Mobilfil ${formateraStorlek(glb.byteLength)} GLB + ${formateraStorlek(json.length)} JSON`;
    }
  });
}

function jpegAv(bild) {
  const maxSida = 512;
  const skala = Math.min(1, maxSida / Math.max(bild.naturalWidth, bild.naturalHeight));
  const duk = document.createElement('canvas');
  duk.width = Math.max(2, Math.round(bild.naturalWidth * skala));
  duk.height = Math.max(2, Math.round(bild.naturalHeight * skala));
  duk.getContext('2d').drawImage(bild, 0, 0, duk.width, duk.height);
  return new Promise((klar) => {
    duk.toBlob((blob) => {
      blob.arrayBuffer().then((buf) => klar(new Uint8Array(buf)));
    }, 'image/jpeg', 0.72);
  });
}

function valAv() {
  return {
    namn: document.getElementById('sparaNamn').value.trim() || tolkning?.forslag.namn || 'Landskap',
    mapp: document.getElementById('sparaMapp').value.trim() || tolkning?.forslag.mapp || 'Landskap',
    vagtextur: vagId
  };
}

function oppnaSpara() {
  if (!tolkning) return;
  document.getElementById('sparaNamn').value = tolkning.forslag.namn;
  document.getElementById('sparaMapp').value = tolkning.forslag.mapp;
  document.getElementById('sparaAnledning').textContent = tolkning.forslag.anledning;
  document.getElementById('sparaMeddelande').textContent = '';
  ritaBibliotek();
  dialog.hidden = false;
  meny.hidden = true;
  uppdateraStorlek();
}

function sparaBibliotek() {
  const val = valAv();
  const post = {
    id: `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
    namn: val.namn,
    mapp: val.mapp,
    skapad: new Date().toISOString(),
    storlek: senastBlob?.totalt || 0,
    scen: byggJson(tolkning, val)
  };
  try {
    sparaIBibliotek(post);
    document.getElementById('sparaMeddelande').textContent = `Sparad i biblioteket: ${val.mapp} / ${val.namn}.`;
    ritaBibliotek();
  } catch {
    document.getElementById('sparaMeddelande').textContent = 'Biblioteket på telefonen är fullt. Ladda ner GLB eller JSON i stället.';
  }
}

function hamta(slag) {
  if (!senastBlob) return;
  const val = valAv();
  if (slag === 'glb') {
    laddaNer(new Blob([senastBlob.glb], { type: 'model/gltf-binary' }), filnamn(val.namn, '.glb'));
  } else {
    const json = JSON.stringify(byggJson(tolkning, val), null, 2);
    laddaNer(new Blob([json], { type: 'application/json' }), filnamn(val.namn, '.json'));
  }
}

function laddaNer(blob, namn) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = namn;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function ritaBibliotek() {
  const lista = document.getElementById('bibliotek');
  const poster = lasBibliotek();
  lista.replaceChildren();
  if (!poster.length) {
    const li = document.createElement('li');
    li.textContent = 'Inget sparat ännu.';
    lista.append(li);
    return;
  }
  for (const post of poster) {
    const li = document.createElement('li');
    const b = document.createElement('b');
    b.textContent = post.namn;
    const span = document.createElement('span');
    span.textContent = `${post.mapp} · ${formateraStorlek(post.storlek || 0)}`;
    li.append(b, span);
    lista.append(li);
  }
}

function grupp(tal) {
  return String(tal).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

window.addEventListener('error', (e) => {
  kropp.dataset.fel = e.message || 'fel';
});
window.addEventListener('unhandledrejection', (e) => {
  kropp.dataset.fel = (e.reason && e.reason.message) || 'fel';
});

laddaUrl('./prov.jpg', bildNamn);
