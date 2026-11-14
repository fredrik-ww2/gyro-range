import { beraknaEgenskaper, byggProfil, grupperaExakt, idForProfil, jamforBibliotek, jamforInspelningar } from './analys.js';
import {
  byggEtikett, byggExport, bytNamnFaktor, bytNamnKategori, bytNamnUnderval, bytNamnVal,
  etikettText, giltigtVal, laggTillFaktor, laggTillUnderval, laggTillVal, lasImport,
  nyttId, skapaKategori, skapaLager, slahopImport, taBortFaktor, taBortKategori,
  taBortUnderval, taBortVal
} from './bibliotek.js';
import { byggBand, byggKurvor, byggOversikt, formSek, formTal } from './kurvor.js';
import { arSlutOrd, klippSvans, lasVektor, matHz, rundaSampel, vinkelSkillnad } from './motor.js';
import { arOmslag } from '../js/riktning.js';
import { monteraRorelse } from './gyrobox-adapter.js';
import { installeraIosLjud, oppnaKontext, tick } from '../shared/ios-ljud.js';

const $ = (id) => document.getElementById(id);
let ljudCtx = null;
installeraIosLjud({ hamta: () => ljudCtx, oppna() { ljudCtx = oppnaKontext(ljudCtx); } });
function knack() { ljudCtx = oppnaKontext(ljudCtx); tick(ljudCtx); }
const huvud = $('huvud');

let config;
let gyroLada = null;
let lager;
let kategorier = [];
let inspelningar = [];
let senast = null;
let profiler = [];
let sparadKatId = null;
let sparadSig = null;
let jamforIds = [];
let lage = 'redo';
let utkast = null;
let sparadId = null;
let detaljId = null;
let andra = false;
let redigerar = null;
let bortNyckel = null;
let bortTimer = 0;
let bekrafta = null;
let bekraftaTimer = 0;
let menyOppet = false;
let kurvRitning = null;
let senasteVy = '';
let klar = false;
let startar = false;

let lyssnar = false;
let senaste = { rot: null, acc: null, accG: null, vinkel: null };
let nollage = null;
let foreEuler = null;
let senastRelativ = null;
let antalHandelser = 0;
let rec = null;
let stoppKlocka = 0;

let tal = null;
let talSkaLyssna = false;
let talTillgang = 'okant';
let talOmstart = 0;

let toastTimer = 0;

function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2800);
}

function skarmVinkel() {
  const so = screen.orientation;
  const raw = so && Number.isFinite(so.angle) ? so.angle : window.orientation;
  if (!Number.isFinite(+raw)) return 0;
  return ((+raw % 360) + 360) % 360;
}

function enhetInfo() {
  const ua = navigator.userAgent || '';
  let plattform = 'other';
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) plattform = 'ios';
  else if (/Android/i.test(ua)) plattform = 'android';
  return { userAgent: ua, plattform, sprak: navigator.language || null, skarm: skarmVinkel() };
}

function arBort(typ, id) {
  return bortNyckel === `${typ}:${id}`;
}

function textKnapp(text, gor, id, extra, saker) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'textknapp' + (saker ? ' saker' : '');
  b.dataset.gor = gor;
  b.dataset.id = id;
  if (extra) {
    if (extra.faktor) b.dataset.faktor = extra.faktor;
    if (extra.val) b.dataset.val = extra.val;
  }
  b.textContent = text;
  return b;
}

function chipKnapp(text, vald, gor, id, extra) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip' + (vald ? ' vald' : '');
  b.dataset.gor = gor;
  b.dataset.id = id;
  if (extra) {
    if (extra.faktor) b.dataset.faktor = extra.faktor;
    if (extra.val) b.dataset.val = extra.val;
  }
  b.textContent = text;
  return b;
}

function faltRad(varde, knappText) {
  const rad = document.createElement('div');
  rad.className = 'falt-rad';
  const input = document.createElement('input');
  input.type = 'text';
  input.dataset.roll = 'falt';
  input.value = varde || '';
  input.maxLength = '40';
  input.autocomplete = 'off';
  input.enterKeyHint = 'done';
  input.placeholder = 'Namn';
  input.setAttribute('aria-label', 'Namn');
  const ok = document.createElement('button');
  ok.type = 'button';
  ok.className = 'chip vald';
  ok.dataset.gor = 'bekrafta';
  ok.textContent = knappText;
  const av = document.createElement('button');
  av.type = 'button';
  av.className = 'textknapp';
  av.dataset.gor = 'avbryt-falt';
  av.textContent = 'Avbryt';
  rad.append(input, ok, av);
  queueMicrotask(() => {
    if (!input.isConnected) return;
    input.focus();
    input.select();
  });
  return rad;
}

function listaPoster(rot, opt) {
  const box = document.createElement('div');
  box.className = andra ? 'postlista' : 'chips';
  const extra = opt.extra || null;
  for (const post of opt.poster) {
    if (redigerar && redigerar.typ === opt.bytTyp && redigerar.id === post.id) {
      box.append(faltRad(post.namn, 'Spara namn'));
      continue;
    }
    const vald = post.id === opt.valdId;
    if (!andra) {
      box.append(chipKnapp(post.namn, vald, opt.gorValj, post.id, extra));
      continue;
    }
    const rad = document.createElement('div');
    rad.className = 'postrad';
    rad.append(chipKnapp(post.namn, vald, opt.gorValj, post.id, extra));
    rad.append(textKnapp('Byt namn', opt.gorByt, post.id, extra, false));
    rad.append(textKnapp(arBort(opt.bortTyp, post.id) ? 'Ta bort på riktigt' : 'Ta bort', opt.gorBort, post.id, extra, arBort(opt.bortTyp, post.id)));
    box.append(rad);
  }
  const oppnas = redigerar && redigerar.typ === opt.nyTyp && redigerar.nyckel === opt.nyckel;
  if (oppnas) box.append(faltRad('', opt.laggText || 'Lägg till'));
  else {
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'chip lagg';
    add.dataset.gor = opt.gorNytt;
    if (opt.nyckel) add.dataset.id = opt.nyckel;
    if (extra?.faktor) add.dataset.faktor = extra.faktor;
    if (extra?.val) add.dataset.val = extra.val;
    add.textContent = opt.nyttText;
    box.append(add);
  }
  rot.append(box);
}

function avslutText(orsak) {
  if (orsak === 'slut') return 'Stannade när du sa slut.';
  if (orsak === 'stopp') return 'Stannade med knappen.';
  if (orsak === 'max') return 'Tiden tog slut.';
  return '';
}

function markningText(ins) {
  const kat = kategorier.find((k) => k.id === ins?.kategoriId);
  if (kat) return etikettText(byggEtikett(kat, ins.val));
  if (ins?.etikett) return etikettText(ins.etikett);
  return 'Utan kategori';
}

function radVal(ins) {
  const kat = kategorier.find((k) => k.id === ins.kategoriId);
  if (!kat) return etikettText(ins.etikett);
  const rader = byggEtikett(kat, ins.val).rader.filter((r) => r.val);
  if (!rader.length) return kat.namn;
  return rader.map((r) => (r.underval ? `${r.val} · ${r.underval}` : r.val)).join(' · ');
}

function datum(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function uppdateraFot() {
  const b = $('backa');
  if (bekrafta === 'slang') b.textContent = 'Släng inspelningen';
  else if (bekrafta === 'avbryt') b.textContent = 'Avbryt inspelningen';
  else b.textContent = 'Backa';
}

function vyNyckel() {
  return `${lage}|${sparadKatId || ''}|${sparadSig || ''}|${detaljId || ''}`;
}

function rita() {
  const nyckel = vyNyckel();
  const samma = nyckel === senasteVy;
  const y = document.scrollingElement ? document.scrollingElement.scrollTop : 0;
  kurvRitning = null;
  huvud.dataset.lage = lage;
  huvud.replaceChildren(byggVy());
  senasteVy = nyckel;
  uppdateraFot();
  if (samma && document.scrollingElement) document.scrollingElement.scrollTop = y;
  else window.scrollTo(0, 0);
  if (kurvRitning) {
    const ritning = kurvRitning;
    requestAnimationFrame(() => ritning.rita());
  }
}

function byggVy() {
  if (lage === 'spelar') return vySpelar();
  if (lage === 'oversikt') return vyOversikt(utkast, true);
  if (lage === 'kurvor') return vyKurvor(utkast, true);
  if (lage === 'markning') return vyMarkning();
  if (lage === 'bibliotek') return vyBibliotek();
  if (lage === 'detalj') return vyOversikt(inspelningar.find((r) => r.id === detaljId), false);
  if (lage === 'detaljAxlar') return vyDetaljAxlar();
  if (lage === 'analys') return vyAnalys();
  if (lage === 'sparade') return vySparade();
  if (lage === 'sparadGrupp') return vyGrupp();
  if (lage === 'jamfor') return vyJamfor();
  return vyRedo();
}

function vyRedo() {
  const rot = document.createElement('div');
  rot.className = 'redo';
  const h = document.createElement('h1');
  h.textContent = 'Rörelseinspelare';
  const p = document.createElement('p');
  p.className = 'led';
  p.textContent = 'Håll telefonen som under rörelsen. Tryck Nollställ. Gör rörelsen. Säg slut.';
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'nollstall';
  b.dataset.gor = 'nollstall';
  b.dataset.roll = 'nollstall';
  b.textContent = 'Nollställ';
  const sparade = document.createElement('button');
  sparade.type = 'button';
  sparade.className = 'sparade-knapp';
  sparade.dataset.gor = 'oppna-sparade';
  sparade.dataset.roll = 'sparade';
  sparade.textContent = 'Sparade slag';
  rot.append(h, p, b, sparade);
  return rot;
}

function vySpelar() {
  const rot = document.createElement('div');
  rot.className = 'spelar';
  const status = document.createElement('p');
  status.className = 'rec-status';
  const prick = document.createElement('span');
  prick.className = 'prick';
  prick.setAttribute('aria-hidden', 'true');
  status.append(prick, document.createTextNode('Spelar in'));
  const klocka = document.createElement('p');
  klocka.className = 'klocka';
  klocka.id = 'klocka';
  klocka.textContent = formSek(0);
  const led = document.createElement('p');
  led.className = 'led';
  led.textContent = 'Säg slut när du är klar.';
  const hint = document.createElement('p');
  hint.id = 'tal-hint';
  hint.className = 'led';
  hint.textContent = 'Talet är avstängt. Tryck Stopp när du är klar.';
  const dod = talTillgang === 'saknas' || talTillgang === 'nekat';
  hint.hidden = !dod;
  const stopp = document.createElement('button');
  stopp.type = 'button';
  stopp.id = 'stopp';
  stopp.className = 'stopp' + (dod ? ' stopp-behovs' : '');
  stopp.dataset.gor = 'stopp';
  stopp.dataset.roll = 'stopp';
  stopp.textContent = 'Stopp';
  rot.append(status, klocka, led, hint, stopp);
  return rot;
}

function laggKurvor(rot, ins) {
  const ritning = byggKurvor(ins, config);
  rot.append(ritning.rot);
  kurvRitning = ritning;
}

function vyKurvor(ins, utkastVy) {
  const rot = document.createElement('div');
  rot.dataset.roll = 'kurvor';
  const h = document.createElement('h1');
  h.textContent = 'Rörelsen';
  const sum = document.createElement('p');
  sum.className = 'sammanfattning';
  sum.textContent = `${formSek(ins?.langdSek)} · ${avslutText(ins?.avslut) || ''}`.trim();
  rot.append(h, sum);
  if (ins?.avslut === 'slut' && Number(ins.svansSek) > 0) {
    const p = document.createElement('p');
    p.className = 'led';
    const sek = ins.svansSek.toLocaleString('sv-SE', { maximumFractionDigits: 1 });
    p.textContent = `De sista ${sek} sekunderna före ordet är borttagna.`;
    rot.append(p);
  }
  if (utkastVy) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.gor = 'till-markning';
    b.dataset.roll = 'till-markning';
    const har = !!ins?.kategoriId;
    b.textContent = har ? 'Ändra märkning' : 'Välj kategori';
    b.className = har ? '' : 'chip vald';
    if (!har) b.style.width = '100%';
    rot.append(b);
    if (har) {
      const p = document.createElement('p');
      p.textContent = markningText(ins);
      rot.append(p);
    }
  }
  if (ins) laggKurvor(rot, ins);
  return rot;
}

function vyMarkning() {
  const rot = document.createElement('div');
  rot.dataset.roll = 'markning';
  const h = document.createElement('h1');
  h.textContent = 'Märk rörelsen';
  const led = document.createElement('p');
  led.className = 'led';
  led.textContent = 'Välj kategori och ett val per faktor. Nästa gång ligger samma val kvar.';
  rot.append(h, led);

  const andraKnapp = document.createElement('button');
  andraKnapp.type = 'button';
  andraKnapp.className = 'textknapp';
  andraKnapp.dataset.gor = 'andra';
  andraKnapp.dataset.roll = 'andra';
  andraKnapp.textContent = andra ? 'Klar med ändringar' : 'Ändra namn och val';
  rot.append(andraKnapp);

  const katRub = document.createElement('h2');
  katRub.textContent = 'Kategori';
  rot.append(katRub);

  if (!kategorier.length && !(redigerar && redigerar.typ === 'ny-kategori')) {
    const p = document.createElement('p');
    p.className = 'led';
    p.textContent = 'Döp kategorin. Till exempel Bordtennis.';
    rot.append(p);
  }

  listaPoster(rot, {
    poster: kategorier,
    valdId: utkast?.kategoriId || null,
    gorValj: 'valj-kategori',
    gorByt: 'byt-kategori',
    gorBort: 'bort-kategori',
    bortTyp: 'kategori',
    gorNytt: 'ny-kategori',
    nyTyp: 'ny-kategori',
    bytTyp: 'byt-kategori',
    nyckel: 'kategori',
    nyttText: '+ Ny kategori',
    laggText: 'Skapa'
  });

  const kat = kategorier.find((k) => k.id === utkast?.kategoriId);
  if (kat) {
    for (const faktor of kat.faktorer) rot.append(sektionFaktor(faktor));
    if (redigerar && redigerar.typ === 'ny-faktor') rot.append(faltRad('', 'Lägg till'));
    else {
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'chip lagg';
      add.dataset.gor = 'ny-faktor';
      add.dataset.roll = 'lagg-till-faktor';
      add.textContent = '+ Lägg till faktor';
      rot.append(add);
    }
    if (!kat.faktorer.length && !(redigerar && redigerar.typ === 'ny-faktor')) {
      const p = document.createElement('p');
      p.className = 'led';
      p.textContent = 'Lägg till en faktor. Till exempel Slag, Hårdhet eller Skruv.';
      rot.append(p);
    }
  }

  const till = document.createElement('button');
  till.type = 'button';
  till.dataset.gor = 'till-oversikt';
  till.textContent = 'Visa översikten';
  rot.append(till);
  return rot;
}

function sektionFaktor(faktor) {
  const sec = document.createElement('section');
  sec.className = 'faktor';
  const huvudRad = document.createElement('div');
  huvudRad.className = 'faktor-huvud';
  if (redigerar && redigerar.typ === 'byt-faktor' && redigerar.id === faktor.id) {
    huvudRad.append(faltRad(faktor.namn, 'Spara namn'));
  } else {
    const h = document.createElement('h2');
    h.textContent = faktor.namn;
    huvudRad.append(h);
    if (andra) {
      huvudRad.append(textKnapp('Byt namn', 'byt-faktor', faktor.id, null, false));
      huvudRad.append(textKnapp(arBort('faktor', faktor.id) ? 'Ta bort på riktigt' : 'Ta bort', 'bort-faktor', faktor.id, null, arBort('faktor', faktor.id)));
    }
  }
  sec.append(huvudRad);
  const valdId = utkast.val?.[faktor.id]?.valId || null;
  listaPoster(sec, {
    poster: faktor.val,
    valdId,
    gorValj: 'valj-val',
    gorByt: 'byt-val',
    gorBort: 'bort-val',
    bortTyp: 'val',
    gorNytt: 'ny-val',
    nyTyp: 'ny-val',
    bytTyp: 'byt-val',
    nyckel: faktor.id,
    nyttText: '+ Lägg till val',
    laggText: 'Lägg till',
    extra: { faktor: faktor.id }
  });
  const vald = faktor.val.find((v) => v.id === valdId);
  if (vald && (andra || (vald.underval && vald.underval.length))) {
    const uh = document.createElement('h3');
    uh.textContent = 'Underval';
    sec.append(uh);
    listaPoster(sec, {
      poster: vald.underval || [],
      valdId: utkast.val?.[faktor.id]?.undervalId || null,
      gorValj: 'valj-under',
      gorByt: 'byt-under',
      gorBort: 'bort-under',
      bortTyp: 'under',
      gorNytt: 'ny-under',
      nyTyp: 'ny-under',
      bytTyp: 'byt-under',
      nyckel: vald.id,
      nyttText: '+ Lägg till underval',
      laggText: 'Lägg till',
      extra: { faktor: faktor.id, val: vald.id }
    });
  }
  return sec;
}

function laggOversikt(rot, ins) {
  const ritning = byggOversikt(ins, config);
  rot.append(ritning.rot);
  kurvRitning = ritning;
}

function knappVarjeAxel() {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'helknapp';
  b.dataset.gor = 'till-axlar';
  b.dataset.roll = 'till-axlar';
  b.textContent = 'Visa varje axel';
  return b;
}

function vyOversikt(ins, utkastVy) {
  const rot = document.createElement('div');
  if (!ins) {
    const p = document.createElement('p');
    p.textContent = 'Inspelningen finns inte kvar.';
    rot.append(p);
    return rot;
  }
  const h = document.createElement('h1');
  h.textContent = utkastVy ? 'Rörelsen' : markningText(ins);
  const sum = document.createElement('p');
  sum.className = 'sammanfattning';
  if (utkastVy) sum.textContent = `${formSek(ins.langdSek)} · ${avslutText(ins.avslut) || ''}`.trim();
  else sum.textContent = `${datum(ins.skapad)} · ${formSek(ins.langdSek)}`.replace(/^ · /, '');
  rot.append(h, sum);
  if (utkastVy && ins.avslut === 'slut' && Number(ins.svansSek) > 0) {
    const p = document.createElement('p');
    p.className = 'led';
    const sek = ins.svansSek.toLocaleString('sv-SE', { maximumFractionDigits: 1 });
    p.textContent = `De sista ${sek} sekunderna före ordet är borttagna.`;
    rot.append(p);
  }
  if (utkastVy) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.gor = 'till-markning';
    b.dataset.roll = 'till-markning';
    const har = !!ins.kategoriId;
    b.textContent = har ? 'Ändra märkning' : 'Välj kategori';
    b.className = har ? '' : 'chip vald';
    if (!har) b.style.width = '100%';
    rot.append(b);
    if (har) {
      const p = document.createElement('p');
      p.textContent = markningText(ins);
      rot.append(p);
    }
  }
  laggOversikt(rot, ins);
  rot.append(knappVarjeAxel());
  if (!utkastVy) {
    const bort = document.createElement('button');
    bort.type = 'button';
    bort.className = arBort('inspelning', ins.id) ? 'farlig' : '';
    bort.dataset.gor = 'bort-inspelning';
    bort.dataset.id = ins.id;
    bort.textContent = arBort('inspelning', ins.id) ? 'Ta bort på riktigt' : 'Ta bort';
    rot.append(bort);
  }
  return rot;
}

function vyDetaljAxlar() {
  const ins = inspelningar.find((r) => r.id === detaljId);
  const rot = document.createElement('div');
  if (!ins) {
    const p = document.createElement('p');
    p.textContent = 'Inspelningen finns inte kvar.';
    rot.append(p);
    return rot;
  }
  const h = document.createElement('h1');
  h.textContent = markningText(ins);
  const p = document.createElement('p');
  p.className = 'led';
  p.textContent = `${datum(ins.skapad)} · ${formSek(ins.langdSek)}`;
  rot.append(h, p);
  laggKurvor(rot, ins);
  return rot;
}

function vySparade() {
  if (sparadKatId) {
    const kat = kategorier.find((k) => k.id === sparadKatId);
    if (kat) return vyGrupper(kat);
    sparadKatId = null;
  }
  return vyKategoriVal();
}

function vyKategoriVal() {
  const rot = document.createElement('div');
  rot.dataset.roll = 'sparade-kategori';
  const h = document.createElement('h1');
  h.textContent = 'Sparade slag';
  const led = document.createElement('p');
  led.className = 'led';
  led.textContent = 'Välj kategori.';
  rot.append(h, led);
  const med = kategorier.filter((k) => inspelningar.some((ins) => ins.kategoriId === k.id));
  if (!med.length) {
    const p = document.createElement('p');
    p.textContent = 'Inga sparade slag än. Spela in en rörelse och välj kategori.';
    rot.append(p);
    return rot;
  }
  for (const kat of med) {
    const antal = inspelningar.filter((ins) => ins.kategoriId === kat.id).length;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'bibliotek-rad';
    b.dataset.gor = 'valj-sparad-kat';
    b.dataset.roll = 'kategori';
    b.dataset.id = kat.id;
    const stark = document.createElement('strong');
    stark.textContent = kat.namn;
    const liten = document.createElement('small');
    liten.textContent = `${antal} st`;
    b.append(stark, liten);
    rot.append(b);
  }
  return rot;
}

function vyGrupper(kat) {
  const rot = document.createElement('div');
  rot.dataset.roll = 'sparade-grupper';
  const h = document.createElement('h1');
  h.textContent = kat.namn;
  const led = document.createElement('p');
  led.className = 'led';
  led.textContent = 'Varje rad är slag med exakt samma val.';
  rot.append(h, led);
  const grupper = grupperaExakt(inspelningar, kat);
  if (!grupper.length) {
    const p = document.createElement('p');
    p.textContent = 'Inga slag i den här kategorin.';
    rot.append(p);
    return rot;
  }
  for (const g of grupper) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'bibliotek-rad';
    b.dataset.gor = 'oppna-grupp';
    b.dataset.roll = 'grupp';
    b.dataset.signatur = g.signatur;
    const stark = document.createElement('strong');
    stark.textContent = g.text;
    const liten = document.createElement('small');
    liten.textContent = `(${g.antal} st)`;
    b.append(stark, liten);
    rot.append(b);
  }
  return rot;
}

function gruppNu() {
  const kat = kategorier.find((k) => k.id === sparadKatId);
  if (!kat) return null;
  return grupperaExakt(inspelningar, kat).find((g) => g.signatur === sparadSig) || null;
}

function allaValda(grupp) {
  return !!grupp && grupp.ids.length > 0 && grupp.ids.every((id) => jamforIds.includes(id));
}

function jamforText() {
  const n = jamforIds.length;
  return n ? `Jämför ${n} slag` : 'Jämför';
}

function vyGrupp() {
  const rot = document.createElement('div');
  rot.dataset.roll = 'sparad-grupp';
  const kat = kategorier.find((k) => k.id === sparadKatId);
  const grupp = gruppNu();
  const h = document.createElement('h1');
  h.textContent = kat?.namn || 'Sparade slag';
  rot.append(h);
  if (!grupp) {
    const p = document.createElement('p');
    p.textContent = 'Gruppen finns inte kvar.';
    rot.append(p);
    return rot;
  }
  const rub = document.createElement('p');
  rub.className = 'sammanfattning';
  rub.textContent = `${grupp.text} (${grupp.antal} st)`;
  const led = document.createElement('p');
  led.className = 'led';
  led.textContent = 'Bocka i de slag du vill jämföra.';
  rot.append(rub, led);
  const alla = document.createElement('button');
  alla.type = 'button';
  alla.className = 'textknapp';
  alla.dataset.gor = 'alla-slag';
  alla.dataset.roll = 'alla';
  alla.textContent = allaValda(grupp) ? 'Rensa' : 'Välj alla';
  rot.append(alla);
  grupp.ids.forEach((id, i) => {
    const ins = inspelningar.find((r) => r.id === id);
    if (!ins) return;
    const lab = document.createElement('label');
    lab.className = 'bock';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.dataset.gor = 'bock';
    box.dataset.id = id;
    box.checked = jamforIds.includes(id);
    const text = document.createElement('span');
    const stark = document.createElement('strong');
    stark.textContent = datum(ins.skapad) || `Slag ${i + 1}`;
    const liten = document.createElement('small');
    liten.textContent = formSek(ins.langdSek);
    text.append(stark, liten);
    lab.append(box, text);
    rot.append(lab);
  });
  const jam = document.createElement('button');
  jam.type = 'button';
  jam.className = 'helknapp' + (jamforIds.length ? ' gul' : '');
  jam.dataset.gor = 'jamfor-valda';
  jam.dataset.roll = 'jamfor';
  jam.textContent = jamforText();
  rot.append(jam);
  return rot;
}

function formProcent(cv) {
  if (!Number.isFinite(cv)) return '–';
  const p = cv * 100;
  const dec = p >= 10 ? 0 : 1;
  return `${p.toLocaleString('sv-SE', { maximumFractionDigits: dec, minimumFractionDigits: 0 })} %`;
}

function uppdateraJamforKnappar() {
  const grupp = gruppNu();
  const knapp = document.querySelector('[data-roll=jamfor]');
  if (knapp) {
    knapp.textContent = jamforText();
    knapp.classList.toggle('gul', jamforIds.length > 0);
  }
  const alla = document.querySelector('[data-roll=alla]');
  if (alla) alla.textContent = allaValda(grupp) ? 'Rensa' : 'Välj alla';
}

function sattBock(id, pa) {
  if (pa) {
    if (!jamforIds.includes(id)) jamforIds.push(id);
  } else jamforIds = jamforIds.filter((x) => x !== id);
  uppdateraJamforKnappar();
}

function valdaInspelningar() {
  return jamforIds.map((id) => inspelningar.find((ins) => ins.id === id)).filter(Boolean);
}

function rangRad(s, maxCv, stabil) {
  const rad = document.createElement('div');
  rad.className = 'rang-rad' + (stabil ? ' stabil' : '');
  rad.dataset.nyckel = s.nyckel;
  if (Number.isFinite(s.medel)) rad.dataset.medel = String(s.medel);
  if (Number.isFinite(s.spridning)) rad.dataset.spridning = String(s.spridning);
  const text = document.createElement('div');
  text.className = 'rang-text';
  const namn = document.createElement('span');
  namn.textContent = s.text;
  const tal = document.createElement('small');
  const sprid = Number.isFinite(s.spridning) ? ` ± ${formTal(s.spridning, s.enhet)}` : '';
  tal.textContent = `${formTal(s.medel, s.enhet)}${sprid} · ${formProcent(s.variationskoefficient)}`;
  text.append(namn, tal);
  const spar = document.createElement('div');
  spar.className = 'rang-spar';
  const fyll = document.createElement('div');
  fyll.className = 'rang-fyll';
  const bredd = maxCv > 0 && Number.isFinite(s.variationskoefficient) ? (s.variationskoefficient / maxCv) * 100 : 0;
  fyll.style.width = `${bredd}%`;
  spar.append(fyll);
  rad.append(text, spar);
  return rad;
}

function vyJamfor() {
  const rot = document.createElement('div');
  rot.dataset.roll = 'jamforelse';
  const kat = kategorier.find((k) => k.id === sparadKatId);
  const grupp = gruppNu();
  const h = document.createElement('h1');
  h.textContent = 'Jämför';
  rot.append(h);
  const valda = valdaInspelningar();
  if (!valda.length) {
    const p = document.createElement('p');
    p.textContent = 'Inga slag är valda.';
    rot.append(p);
    return rot;
  }
  const rub = document.createElement('p');
  rub.className = 'sammanfattning';
  rub.textContent = grupp?.text || markningText(valda[0]);
  const synkStart = config.monster?.synk === 'start';
  const intro = document.createElement('p');
  intro.className = 'led';
  const lageText = synkStart ? 'rörelsens start' : 'toppen';
  intro.textContent = `${valda.length} slag. De är utsträckta till samma längd och lagda på varandra vid ${lageText}. Tunna linjer är varje slag. Bandet är medelvärdet plus och minus en standardavvikelse.`;
  rot.append(rub, intro);
  if (valda.length < 2) {
    const p = document.createElement('p');
    p.className = 'led';
    p.textContent = 'Spridning syns när minst två slag är valda.';
    rot.append(p);
  }
  const jam = jamforInspelningar(valda, config);
  const band = byggBand(jam, config);
  rot.append(band.rot);
  kurvRitning = band;

  const rang = document.createElement('section');
  rang.dataset.roll = 'rang';
  const h2 = document.createElement('h2');
  h2.textContent = 'Vad som kännetecknar';
  const forkl = document.createElement('p');
  forkl.className = 'led';
  forkl.textContent = 'Spridning är standardavvikelsen. Hög variation betyder att slagen skiljer sig där. Låg variation betyder att det är likadant varje gång.';
  rang.append(h2, forkl);
  const maxCv = Math.max(
    0.001,
    ...jam.rang.varierar.map((s) => s.variationskoefficient),
    ...jam.rang.stabila.map((s) => s.variationskoefficient)
  );
  const hVar = document.createElement('h3');
  hVar.textContent = 'Varierar mest';
  rang.append(hVar);
  if (!jam.rang.varierar.length) {
    const p = document.createElement('p');
    p.textContent = 'Det finns för få slag för att se vad som varierar.';
    rang.append(p);
  } else for (const s of jam.rang.varierar) rang.append(rangRad(s, maxCv, false));
  const hStab = document.createElement('h3');
  hStab.textContent = 'Mest stabilt';
  rang.append(hStab);
  if (!jam.rang.stabila.length) {
    const p = document.createElement('p');
    p.textContent = 'Inget mätvärde går att jämföra än.';
    rang.append(p);
  } else for (const s of jam.rang.stabila) rang.append(rangRad(s, maxCv, true));
  rot.append(rang);

  const det = document.createElement('details');
  const sum = document.createElement('summary');
  sum.textContent = 'Alla mätvärden';
  const table = document.createElement('table');
  table.className = 'jam-tabell';
  const head = document.createElement('tr');
  for (const rubrik of ['Mätvärde', 'Medel', 'Spridning', 'Variation']) {
    const th = document.createElement('th');
    th.textContent = rubrik;
    head.append(th);
  }
  table.append(head);
  const ordnad = [...jam.skalara].sort((a, b) => {
    const av = Number.isFinite(a.variationskoefficient) ? a.variationskoefficient : -1;
    const bv = Number.isFinite(b.variationskoefficient) ? b.variationskoefficient : -1;
    return bv - av;
  });
  for (const s of ordnad) {
    const tr = document.createElement('tr');
    tr.dataset.roll = 'stat';
    tr.dataset.nyckel = s.nyckel;
    if (Number.isFinite(s.medel)) tr.dataset.medel = String(s.medel);
    if (Number.isFinite(s.spridning)) tr.dataset.spridning = String(s.spridning);
    const namn = document.createElement('td');
    namn.textContent = s.text;
    const medel = document.createElement('td');
    medel.textContent = formTal(s.medel, s.enhet);
    const spr = document.createElement('td');
    spr.textContent = formTal(s.spridning, s.enhet);
    const cv = document.createElement('td');
    cv.textContent = formProcent(s.variationskoefficient);
    tr.append(namn, medel, spr, cv);
    table.append(tr);
  }
  det.append(sum, table);
  rot.append(det);

  const spara = document.createElement('button');
  spara.type = 'button';
  spara.className = 'helknapp gul';
  spara.dataset.gor = 'spara-monster';
  spara.dataset.roll = 'spara-monster';
  const profilId = kat && grupp ? idForProfil(kat.id, grupp.signatur) : '';
  const finns = profilId && profiler.some((p) => p.id === profilId);
  spara.textContent = finns ? 'Uppdatera mönster' : 'Spara mönster';
  const om = document.createElement('p');
  om.className = 'led';
  om.textContent = finns
    ? 'Ett mönster är sparat för den här kombinationen. Appen kan senare använda det för att känna igen slaget.'
    : 'Spara medel och spridning för den här kombinationen av val. Appen kan senare använda mönstret för att känna igen slaget.';
  rot.append(spara, om);
  return rot;
}

function vyBibliotek() {
  const rot = document.createElement('div');
  rot.dataset.roll = 'bibliotek';
  const h = document.createElement('h1');
  h.textContent = 'Bibliotek';
  rot.append(h);
  if (!inspelningar.length) {
    const p = document.createElement('p');
    p.className = 'led';
    p.textContent = 'Inga inspelningar än. Gå tillbaka och tryck Nollställ.';
    rot.append(p);
    return rot;
  }
  const grupper = new Map();
  for (const ins of inspelningar) {
    const nyckel = ins.kategoriId && kategorier.some((k) => k.id === ins.kategoriId) ? ins.kategoriId : '';
    if (!grupper.has(nyckel)) grupper.set(nyckel, []);
    grupper.get(nyckel).push(ins);
  }
  const ordning = [...kategorier.map((k) => k.id).filter((id) => grupper.has(id)), ...(grupper.has('') ? [''] : [])];
  for (const id of ordning) {
    const h2 = document.createElement('h2');
    h2.textContent = id ? kategorier.find((k) => k.id === id).namn : 'Utan kategori';
    rot.append(h2);
    for (const ins of grupper.get(id)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'bibliotek-rad';
      b.dataset.gor = 'oppna';
      b.dataset.id = ins.id;
      const stark = document.createElement('strong');
      stark.textContent = radVal(ins);
      const liten = document.createElement('small');
      liten.textContent = `${datum(ins.skapad)} · ${formSek(ins.langdSek)}`;
      b.append(stark, liten);
      rot.append(b);
    }
  }
  return rot;
}

function vyAnalys() {
  const rot = document.createElement('div');
  rot.dataset.roll = 'analys';
  const h = document.createElement('h1');
  h.textContent = 'Jämför';
  const intro = document.createElement('p');
  intro.className = 'led';
  intro.textContent = 'Här syns inspelningar som är märkta likadant, och inspelningar där allt är lika utom en faktor. Det förbereder att appen senare kan känna igen till exempel mer eller mindre skruv.';
  const tips = document.createElement('p');
  tips.className = 'led';
  tips.textContent = 'Vill du lägga valda slag på varandra, gå tillbaka och tryck Sparade slag.';
  rot.append(h, intro, tips);
  const svar = jamforBibliotek(inspelningar, kategorier, config);
  rot.dataset.fynd = String(svar.enFaktorSkiljer.length);
  if (!svar.identiska.length && !svar.enFaktorSkiljer.length) {
    const p = document.createElement('p');
    p.textContent = 'Det finns inte tillräckligt att jämföra än. Spela in två rörelser i samma kategori där allt är lika utom en sak, till exempel bara skruven.';
    rot.append(p);
    return rot;
  }
  if (svar.identiska.length) {
    const h2 = document.createElement('h2');
    h2.textContent = 'Lika märkta';
    rot.append(h2);
    for (const g of svar.identiska) {
      const art = document.createElement('article');
      art.className = 'kort';
      const t = document.createElement('p');
      t.textContent = `${g.antal} inspelningar. ${g.kategoriNamn}. ${g.text}.`;
      art.append(t);
      const topp = g.medel['rot.0.topp'];
      if (Number.isFinite(topp)) {
        const rad = document.createElement('p');
        rad.textContent = `Medel för vridningens topp: ${formTal(topp, '°/s')}.`;
        art.append(rad);
      }
      rot.append(art);
    }
  }
  if (svar.enFaktorSkiljer.length) {
    const h2 = document.createElement('h2');
    h2.textContent = 'Bara en sak skiljer';
    rot.append(h2);
    for (const g of svar.enFaktorSkiljer) {
      const art = document.createElement('article');
      art.className = 'kort';
      art.dataset.roll = 'fynd';
      art.dataset.faktor = g.faktorNamn;
      const t = document.createElement('h3');
      t.textContent = `${g.kategoriNamn}. Allt är lika utom ${g.faktorNamn}.`;
      art.append(t);
      if (g.lika) {
        const lika = document.createElement('p');
        lika.textContent = `Det som är lika: ${g.lika}.`;
        art.append(lika);
      }
      const rader = document.createElement('p');
      rader.textContent = `${g.grupper.map((x) => `${x.text}: ${x.antal} ${x.antal === 1 ? 'inspelning' : 'inspelningar'}`).join('. ')}.`;
      art.append(rader);
      if (!g.skillnader.length) {
        const tom = document.createElement('p');
        tom.textContent = 'Inga mätvärden skiljer sig tydligt.';
        art.append(tom);
      } else {
        const rub = document.createElement('p');
        rub.textContent = 'Det som skiljer mest:';
        const ul = document.createElement('ul');
        for (const s of g.skillnader) {
          const li = document.createElement('li');
          li.textContent = `${s.text}: ${s.hog.text} ${formTal(s.hog.varde, s.enhet)} mot ${s.lag.text} ${formTal(s.lag.varde, s.enhet)}.`;
          ul.append(li);
        }
        art.append(rub, ul);
      }
      rot.append(art);
    }
  }
  return rot;
}

function lyssna() {
  if (lyssnar) return;
  lyssnar = true;
  addEventListener('devicemotion', onMotion, { passive: true });
  addEventListener('deviceorientation', onOrient, { passive: true });
}

function onMotion(e) {
  if (document.hidden) return;
  antalHandelser += 1;
  const rot = lasVektor(e.rotationRate, ['alpha', 'beta', 'gamma']);
  const acc = lasVektor(e.acceleration, ['x', 'y', 'z']);
  const accG = lasVektor(e.accelerationIncludingGravity, ['x', 'y', 'z']);
  if (rot) senaste.rot = rot;
  if (acc) senaste.acc = acc;
  if (accG) senaste.accG = accG;
  kanskeProv();
}

function onOrient(e) {
  if (document.hidden) return;
  let alpha = Number.isFinite(e.alpha) ? e.alpha : null;
  if (alpha == null && Number.isFinite(+e.webkitCompassHeading)) alpha = (360 - +e.webkitCompassHeading) % 360;
  const beta = Number.isFinite(e.beta) ? e.beta : null;
  const gamma = Number.isFinite(e.gamma) ? e.gamma : null;
  if (beta == null || gamma == null) return;
  senaste.vinkel = [alpha == null ? 0 : alpha, beta, gamma];
  kanskeProv();
}

function kanskeProv() {
  if (!rec?.aktiv) return;
  if (!senaste.rot && !senaste.acc && !senaste.accG && !senaste.vinkel) return;
  const t = (performance.now() - rec.start) / 1000;
  const minDt = 1 / (Number(config.malHz) || 50);
  if (rec.senastProv != null && t - rec.senastProv < minDt * 0.85) return;
  const dtProv = rec.senastProv == null ? 1 / (Number(config.malHz) || 50) : t - rec.senastProv;
  rec.senastProv = t;
  let relativ = null;
  if (senaste.vinkel) {
    const nu = { alpha: senaste.vinkel[0], beta: senaste.vinkel[1], gamma: senaste.vinkel[2] };
    if (!nollage) nollage = senaste.vinkel.slice();
    if (foreEuler && senastRelativ && arOmslag(foreEuler, nu)) {
      nollage = senaste.vinkel.map((v, i) => v - (senastRelativ[i] || 0));
      relativ = senastRelativ.slice();
    } else {
      relativ = vinkelSkillnad(senaste.vinkel, nollage);
      senastRelativ = relativ ? relativ.slice() : null;
    }
    foreEuler = nu;
  }
  const rotFormad = gyroLada && senaste.rot ? gyroLada.forma(senaste.rot, dtProv) : senaste.rot;
  rec.sampel.push(rundaSampel({
    t,
    rot: rotFormad,
    acc: senaste.acc,
    accG: senaste.accG,
    vinkel: relativ,
    skarm: skarmVinkel()
  }));
}

function sakertLofte(anrop) {
  try {
    const v = anrop();
    return Promise.resolve(v).catch((err) => (err && err.name === 'NotAllowedError' ? 'denied' : 'error'));
  } catch (e) {
    return Promise.resolve('error');
  }
}

function beOmTillstand() {
  const DME = window.DeviceMotionEvent;
  const DOE = window.DeviceOrientationEvent;
  const rorelse = (DME && typeof DME.requestPermission === 'function')
    ? sakertLofte(() => DME.requestPermission())
    : Promise.resolve('granted');
  const orient = (DOE && typeof DOE.requestPermission === 'function')
    ? sakertLofte(() => DOE.requestPermission())
    : Promise.resolve('granted');
  let mik = Promise.resolve('granted');
  try {
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      mik = navigator.mediaDevices.getUserMedia({ audio: true }).then((strom) => {
        for (const sp of strom.getTracks()) {
          try { sp.stop(); } catch (e) { /* spåret är redan stoppat */ }
        }
        return 'granted';
      }).catch(() => 'denied');
    }
  } catch (e) {
    mik = Promise.resolve('denied');
  }
  return Promise.all([rorelse, orient, mik]);
}

function textAvTal(ev) {
  let s = '';
  const start = Number.isFinite(ev?.resultIndex) ? ev.resultIndex : 0;
  const resultat = ev?.results;
  if (!resultat) return '';
  for (let i = start; i < resultat.length; i++) s += ` ${resultat[i][0]?.transcript || ''}`;
  return s;
}

function uppdateraTalHint() {
  const el = document.getElementById('tal-hint');
  const dod = talTillgang === 'saknas' || talTillgang === 'nekat';
  if (el) el.hidden = !dod;
  const stopp = document.getElementById('stopp');
  if (stopp) stopp.classList.toggle('stopp-behovs', dod);
}

function stoppaTal() {
  talSkaLyssna = false;
  clearTimeout(talOmstart);
  const r = tal;
  tal = null;
  if (!r) return;
  try { r.onend = null; r.onresult = null; r.stop(); } catch (e) { /* redan stoppad */ }
}

function startaTal() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { talTillgang = 'saknas'; return false; }
  const rGammal = tal;
  tal = null;
  if (rGammal) {
    try { rGammal.onend = null; rGammal.stop(); } catch (e) { /* redan stoppad */ }
  }
  let r;
  try { r = new SR(); } catch (e) { talTillgang = 'saknas'; return false; }
  r.lang = config.tal?.sprak || 'sv-SE';
  r.continuous = true;
  r.interimResults = true;
  r.onresult = (ev) => {
    if (lage !== 'spelar') return;
    if (arSlutOrd(textAvTal(ev), config.tal?.ord || 'slut')) avsluta('slut');
  };
  r.onerror = (ev) => {
    const kod = ev?.error || '';
    if (kod === 'not-allowed' || kod === 'service-not-allowed') {
      talTillgang = 'nekat';
      talSkaLyssna = false;
      clearTimeout(talOmstart);
      uppdateraTalHint();
    }
  };
  r.onend = () => {
    if (tal !== r) return;
    tal = null;
    if (!talSkaLyssna || talTillgang === 'nekat') return;
    const vantan = Number(config.tal?.startaOmMs);
    clearTimeout(talOmstart);
    talOmstart = setTimeout(() => { if (talSkaLyssna) startaTal(); }, Number.isFinite(vantan) ? vantan : 300);
  };
  tal = r;
  try {
    r.start();
    if (talTillgang !== 'nekat') talTillgang = 'ok';
    return true;
  } catch (e) {
    tal = null;
    talTillgang = 'saknas';
    return false;
  }
}

function borjaInspelning() {
  knack();
  nollage = senaste.vinkel ? senaste.vinkel.slice() : null;
  foreEuler = senaste.vinkel ? { alpha: senaste.vinkel[0], beta: senaste.vinkel[1], gamma: senaste.vinkel[2] } : null;
  senastRelativ = null;
  rec = { aktiv: true, start: performance.now(), sampel: [], senastProv: null };
  sparadId = null;
  utkast = null;
  andra = false;
  redigerar = null;
  lage = 'spelar';
  rita();
  clearInterval(stoppKlocka);
  stoppKlocka = setInterval(() => {
    if (!rec?.aktiv) return;
    const t = (performance.now() - rec.start) / 1000;
    if (t >= (Number(config.maxSek) || 30)) avsluta('max');
  }, 200);
}

function tryckNollstall() {
  if (lage !== 'redo' || startar) return;
  startar = true;
  if (!window.isSecureContext) toast('Öppna sidan med https så att telefonen får mäta rörelse.');
  const lov = beOmTillstand();
  talSkaLyssna = true;
  talTillgang = 'okant';
  if (!startaTal() && talTillgang !== 'nekat') talTillgang = 'saknas';
  lov.then(([rorelse, orient, mik]) => {
    const ok = (v) => v === 'granted' || v === 'unavailable';
    if (!ok(rorelse) || !ok(orient)) {
      stoppaTal();
      toast('Rörelsen är avstängd. Stäng sidan, öppna den igen och tryck Tillåt.');
      return;
    }
    if (mik !== 'granted') talTillgang = 'nekat';
    lyssna();
    borjaInspelning();
  }).catch(() => {
    stoppaTal();
    toast('Det gick inte att fråga om rörelse. Försök igen.');
  }).finally(() => { startar = false; });
}

function avbrytInspelning() {
  if (rec) rec.aktiv = false;
  clearInterval(stoppKlocka);
  stoppaTal();
  rec = null;
  utkast = null;
  lage = 'redo';
  rita();
}

function avsluta(orsak) {
  if (!rec?.aktiv) return;
  knack();
  rec.aktiv = false;
  clearInterval(stoppKlocka);
  const nu = (performance.now() - rec.start) / 1000;
  stoppaTal();
  let sampel = rec.sampel.slice();
  let svans = 0;
  if (orsak === 'slut' || orsak === 'stopp') {
    svans = Number(config.svansSek) || 0;
    sampel = klippSvans(sampel, nu, svans);
  }
  rec = null;
  if (!sampel.length) {
    lage = 'redo';
    rita();
    toast('Ingen rörelse blev kvar. Gör rörelsen och säg slut efteråt.');
    return;
  }
  const langd = sampel[sampel.length - 1].t;
  const hz = matHz(sampel);
  const kat = kategorier.find((k) => k.id === senast?.kategoriId) || null;
  const val = kat ? giltigtVal(kat, senast?.val) : {};
  utkast = {
    id: nyttId(),
    skapad: new Date().toISOString(),
    kategoriId: kat?.id || null,
    val,
    etikett: byggEtikett(kat, val),
    langdSek: Math.round((langd || 0) * 1000) / 1000,
    antal: sampel.length,
    samplingsfrekvensHz: hz == null ? null : Math.round(hz * 10) / 10,
    avslut: orsak,
    svansSek: svans,
    nollage: nollage ? nollage.slice() : null,
    sampel,
    enhet: enhetInfo()
  };
  utkast.egenskaper = beraknaEgenskaper(utkast, config);
  sparadId = null;
  lage = 'oversikt';
  andra = false;
  redigerar = null;
  rita();
}

async function sparaTax() {
  try {
    await lager.sparaTaxonomi(kategorier, senast);
  } catch (e) {
    toast('Kunde inte spara på telefonen.');
  }
}

async function sparaAndradeInspelningar() {
  try {
    for (const ins of inspelningar) await lager.sparaInspelning(ins);
  } catch (e) {
    toast('Kunde inte spara på telefonen.');
  }
}

async function sparaPagaende() {
  if (!utkast || sparadId === utkast.id) return;
  const kat = kategorier.find((k) => k.id === utkast.kategoriId) || null;
  utkast.etikett = byggEtikett(kat, utkast.val);
  utkast.egenskaper = beraknaEgenskaper(utkast, config);
  const kopia = structuredClone(utkast);
  await lager.sparaInspelning(kopia);
  const finns = inspelningar.find((r) => r.id === kopia.id);
  if (finns) Object.assign(finns, kopia);
  else inspelningar.unshift(kopia);
  if (kat) senast = { kategoriId: kat.id, val: structuredClone(utkast.val || {}) };
  await lager.sparaTaxonomi(kategorier, senast);
  sparadId = utkast.id;
}

function felNamn(res) {
  toast(res.fel === 'finns' ? 'Det namnet finns redan.' : 'Skriv ett namn.');
}

async function bekraftaFalt() {
  if (!redigerar) return;
  const namn = (document.querySelector('[data-roll=falt]')?.value) || '';
  const r = redigerar;
  const katId = utkast?.kategoriId;
  let res = { ok: false, fel: 'tomt' };
  if (r.typ === 'ny-kategori') res = skapaKategori(kategorier, namn);
  else if (r.typ === 'byt-kategori') res = bytNamnKategori(kategorier, r.id, namn);
  else if (r.typ === 'ny-faktor') res = laggTillFaktor(kategorier, katId, namn);
  else if (r.typ === 'byt-faktor') res = bytNamnFaktor(kategorier, katId, r.id, namn);
  else if (r.typ === 'ny-val') res = laggTillVal(kategorier, katId, r.faktorId, namn);
  else if (r.typ === 'byt-val') res = bytNamnVal(kategorier, katId, r.faktorId, r.id, namn);
  else if (r.typ === 'ny-under') res = laggTillUnderval(kategorier, katId, r.faktorId, r.valId, namn);
  else if (r.typ === 'byt-under') res = bytNamnUnderval(kategorier, katId, r.faktorId, r.valId, r.id, namn);
  if (!res.ok) { felNamn(res); return; }
  if (r.typ === 'ny-kategori' && utkast) {
    utkast.kategoriId = res.kategori.id;
    utkast.val = {};
  }
  redigerar = null;
  await sparaTax();
  rita();
}

async function gorBort(typ, id, data) {
  const nyckel = `${typ}:${id}`;
  if (bortNyckel !== nyckel) {
    bortNyckel = nyckel;
    clearTimeout(bortTimer);
    bortTimer = setTimeout(() => {
      if (bortNyckel === nyckel) { bortNyckel = null; rita(); }
    }, 4000);
    rita();
    return;
  }
  bortNyckel = null;
  if (typ === 'kategori') {
    taBortKategori(kategorier, inspelningar, id);
    if (utkast?.kategoriId === id) { utkast.kategoriId = null; utkast.val = {}; }
    if (senast?.kategoriId === id) senast = null;
    await sparaAndradeInspelningar();
  } else if (typ === 'faktor') {
    taBortFaktor(kategorier, inspelningar, utkast.kategoriId, id);
    if (utkast?.val) delete utkast.val[id];
    await sparaAndradeInspelningar();
  } else if (typ === 'val') {
    taBortVal(kategorier, inspelningar, utkast.kategoriId, data.faktor, id);
    await sparaAndradeInspelningar();
  } else if (typ === 'under') {
    taBortUnderval(kategorier, inspelningar, utkast.kategoriId, data.faktor, data.val, id);
    await sparaAndradeInspelningar();
  } else if (typ === 'inspelning') {
    try { await lager.taBortInspelning(id); }
    catch (e) { toast('Kunde inte ta bort.'); return; }
    inspelningar = inspelningar.filter((r) => r.id !== id);
    lage = 'bibliotek';
    detaljId = null;
    await sparaTax();
    rita();
    toast('Tog bort inspelningen.');
    return;
  }
  await sparaTax();
  rita();
}

function armBekrafta() {
  clearTimeout(bekraftaTimer);
  const vad = bekrafta;
  bekraftaTimer = setTimeout(() => {
    if (bekrafta === vad) { bekrafta = null; uppdateraFot(); }
  }, 4000);
}

function backa() {
  if (lage === 'jamfor') { lage = 'sparadGrupp'; rita(); return; }
  if (lage === 'sparadGrupp') { sparadSig = null; jamforIds = []; lage = 'sparade'; rita(); return; }
  if (lage === 'sparade') {
    if (sparadKatId) { sparadKatId = null; rita(); return; }
    lage = 'redo';
    rita();
    return;
  }
  if (lage === 'detaljAxlar') { lage = 'detalj'; rita(); return; }
  if (lage === 'markning') { lage = 'oversikt'; rita(); return; }
  if (lage === 'kurvor') { lage = 'oversikt'; rita(); return; }
  if (lage === 'spelar') {
    if (bekrafta !== 'avbryt') { bekrafta = 'avbryt'; armBekrafta(); uppdateraFot(); return; }
    bekrafta = null;
    avbrytInspelning();
    return;
  }
  if (lage === 'oversikt') {
    if (bekrafta !== 'slang') { bekrafta = 'slang'; armBekrafta(); uppdateraFot(); return; }
    bekrafta = null;
    utkast = null;
    sparadId = null;
    lage = 'redo';
    rita();
    return;
  }
  if (lage === 'detalj') { lage = 'bibliotek'; rita(); return; }
  if (lage === 'bibliotek' || lage === 'analys') { lage = 'redo'; rita(); return; }
  location.href = '../lankar/';
}

async function sparaNasta() {
  bekrafta = null;
  if (lage === 'spelar') { avsluta('stopp'); return; }
  if ((lage === 'kurvor' || lage === 'oversikt') && utkast && !utkast.kategoriId && sparadId !== utkast.id) {
    lage = 'markning';
    rita();
    toast('Välj kategori. Tryck sen på spara igen.');
    return;
  }
  if ((lage === 'kurvor' || lage === 'oversikt' || lage === 'markning') && utkast && sparadId !== utkast.id) {
    try { await sparaPagaende(); }
    catch (e) { toast('Kunde inte spara.'); return; }
    toast(utkast.kategoriId ? 'Sparat. Tryck Nollställ för nästa.' : 'Sparat utan kategori. Tryck Nollställ för nästa.');
  } else if (lage === 'redo') {
    toast('Tryck den gula knappen Nollställ.');
    return;
  }
  andra = false;
  redigerar = null;
  lage = 'redo';
  rita();
}

async function sparaOchStang() {
  try {
    if (lage === 'spelar') avsluta('stopp');
    if ((lage === 'kurvor' || lage === 'oversikt' || lage === 'markning') && utkast && sparadId !== utkast.id) await sparaPagaende();
  } catch (e) {
    toast('Kunde inte spara.');
    return;
  }
  location.href = '../lankar/';
}

function oppnaMeny(oppnas) {
  menyOppet = oppnas;
  $('meny').hidden = !oppnas;
  $('menyDold').hidden = !oppnas;
  $('menyKnapp').setAttribute('aria-expanded', oppnas ? 'true' : 'false');
}

function filnamn() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `rorelser-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

async function exportera() {
  const data = byggExport({
    kategorier, inspelningar, senast, profiler, enhet: enhetInfo(), tid: new Date().toISOString()
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
  let inkommande;
  try { inkommande = lasImport(data); }
  catch (e) {
    toast(e.kod === 'version' ? 'Filen har en annan version.' : 'Filen är inte en rörelsefil.');
    return;
  }
  for (const ins of inkommande.inspelningar) {
    if (!ins.egenskaper) ins.egenskaper = beraknaEgenskaper(ins, config);
  }
  const hop = slahopImport({ kategorier, inspelningar, senast, profiler }, inkommande);
  kategorier = hop.kategorier;
  inspelningar = hop.inspelningar;
  senast = hop.senast;
  profiler = hop.profiler || [];
  try { await lager.skrivAllt({ kategorier, inspelningar, senast }); }
  catch (e) { toast('Kunde inte spara det som hämtades in.'); return; }
  const monster = (hop.nyaProfil || 0) + (hop.uppdProfil || 0);
  const extra = monster ? ` Mönster: ${monster}.` : '';
  toast(`Lade till ${hop.nyaIns} inspelningar och ${hop.nyaKat} kategorier.${extra}`);
  if (lage === 'bibliotek' || lage === 'analys' || lage === 'redo' || lage === 'sparade' || lage === 'sparadGrupp' || lage === 'jamfor') rita();
}

async function sparaMonster() {
  const kat = kategorier.find((k) => k.id === sparadKatId);
  const valda = valdaInspelningar();
  if (!kat || !valda.length) { toast('Välj minst ett slag.'); return; }
  const profil = byggProfil(valda, kat, config);
  profil.sparad = new Date().toISOString();
  const i = profiler.findIndex((p) => p.id === profil.id);
  if (i >= 0) profiler[i] = profil;
  else profiler.push(profil);
  try { await lager.sparaProfiler(profiler); }
  catch (e) { toast('Kunde inte spara mönstret.'); return; }
  toast('Mönstret är sparat.');
  rita();
}

function hantera(gor, el) {
  const id = el.dataset.id || '';
  const data = { faktor: el.dataset.faktor || '', val: el.dataset.val || '' };
  if (gor === 'bock') return;
  if (gor === 'nollstall') { tryckNollstall(); return; }
  if (gor === 'stopp') { avsluta('stopp'); return; }
  if (gor === 'oppna-sparade') {
    sparadKatId = null;
    sparadSig = null;
    jamforIds = [];
    lage = 'sparade';
    rita();
    return;
  }
  if (gor === 'valj-sparad-kat') {
    sparadKatId = id;
    sparadSig = null;
    jamforIds = [];
    lage = 'sparade';
    rita();
    return;
  }
  if (gor === 'oppna-grupp') {
    sparadSig = el.dataset.signatur || '';
    const g = gruppNu();
    jamforIds = g ? g.ids.slice() : [];
    lage = 'sparadGrupp';
    rita();
    return;
  }
  if (gor === 'alla-slag') {
    const g = gruppNu();
    jamforIds = g && !allaValda(g) ? g.ids.slice() : [];
    for (const box of document.querySelectorAll('[data-gor=bock]')) box.checked = jamforIds.includes(box.dataset.id);
    uppdateraJamforKnappar();
    return;
  }
  if (gor === 'jamfor-valda') {
    if (!jamforIds.length) { toast('Bocka i minst ett slag.'); return; }
    lage = 'jamfor';
    rita();
    return;
  }
  if (gor === 'spara-monster') { void sparaMonster(); return; }
  if (gor === 'till-axlar') {
    lage = lage === 'detalj' ? 'detaljAxlar' : 'kurvor';
    rita();
    return;
  }
  if (gor === 'till-oversikt') { lage = 'oversikt'; rita(); return; }
  if (gor === 'till-markning') { lage = 'markning'; rita(); return; }
  if (gor === 'till-kurvor') { lage = 'kurvor'; rita(); return; }
  if (gor === 'andra') { andra = !andra; redigerar = null; rita(); return; }
  if (gor === 'avbryt-falt') { redigerar = null; rita(); return; }
  if (gor === 'bekrafta') { void bekraftaFalt(); return; }
  if (gor === 'ny-kategori') { redigerar = { typ: 'ny-kategori', nyckel: 'kategori' }; rita(); return; }
  if (gor === 'byt-kategori') { redigerar = { typ: 'byt-kategori', id, nyckel: 'kategori' }; rita(); return; }
  if (gor === 'bort-kategori') { void gorBort('kategori', id, data); return; }
  if (gor === 'valj-kategori') {
    if (!utkast) return;
    if (utkast.kategoriId !== id) {
      utkast.kategoriId = id;
      const kat = kategorier.find((k) => k.id === id);
      utkast.val = senast?.kategoriId === id ? giltigtVal(kat, senast.val) : {};
    }
    rita();
    return;
  }
  if (gor === 'ny-faktor') { redigerar = { typ: 'ny-faktor', nyckel: 'faktor' }; rita(); return; }
  if (gor === 'byt-faktor') { redigerar = { typ: 'byt-faktor', id }; rita(); return; }
  if (gor === 'bort-faktor') { void gorBort('faktor', id, data); return; }
  if (gor === 'ny-val') { redigerar = { typ: 'ny-val', nyckel: id || data.faktor, faktorId: id || data.faktor }; rita(); return; }
  if (gor === 'byt-val') { redigerar = { typ: 'byt-val', id, faktorId: data.faktor }; rita(); return; }
  if (gor === 'bort-val') { void gorBort('val', id, data); return; }
  if (gor === 'valj-val') {
    if (!utkast.val) utkast.val = {};
    const nu = utkast.val[data.faktor];
    if (nu?.valId === id) delete utkast.val[data.faktor];
    else utkast.val[data.faktor] = { valId: id, undervalId: null };
    rita();
    return;
  }
  if (gor === 'ny-under') { redigerar = { typ: 'ny-under', nyckel: data.val, faktorId: data.faktor, valId: data.val }; rita(); return; }
  if (gor === 'byt-under') { redigerar = { typ: 'byt-under', id, faktorId: data.faktor, valId: data.val }; rita(); return; }
  if (gor === 'bort-under') { void gorBort('under', id, data); return; }
  if (gor === 'valj-under') {
    const nu = utkast.val?.[data.faktor];
    if (!nu) return;
    nu.undervalId = nu.undervalId === id ? null : id;
    rita();
    return;
  }
  if (gor === 'oppna') { detaljId = id; lage = 'detalj'; rita(); return; }
  if (gor === 'bort-inspelning') { void gorBort('inspelning', id, data); return; }
}

function koppla() {
  huvud.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-gor]');
    if (!b || !huvud.contains(b)) return;
    hantera(b.dataset.gor, b);
  });
  huvud.addEventListener('change', (ev) => {
    const box = ev.target;
    if (!box || box.dataset?.gor !== 'bock') return;
    sattBock(box.dataset.id || '', !!box.checked);
  });
  huvud.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter') return;
    if (!ev.target.closest('[data-roll=falt]')) return;
    ev.preventDefault();
    void bekraftaFalt();
  });
  $('backa').addEventListener('click', backa);
  $('sparaNasta').addEventListener('click', () => { void sparaNasta(); });
  $('sparaStang').addEventListener('click', () => { void sparaOchStang(); });
  $('menyKnapp').addEventListener('click', () => oppnaMeny(!menyOppet));
  $('menyDold').addEventListener('click', () => oppnaMeny(false));
  $('meny').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-meny]');
    if (!b) return;
    const vad = b.dataset.meny;
    oppnaMeny(false);
    if (vad === 'bibliotek') { lage = 'bibliotek'; rita(); }
    else if (vad === 'analys') { lage = 'analys'; rita(); }
    else if (vad === 'export') void exportera();
    else if (vad === 'import') $('importFil').click();
  });
  $('importFil').addEventListener('change', () => {
    const fil = $('importFil').files && $('importFil').files[0];
    $('importFil').value = '';
    if (fil) void hamtaInFil(fil);
  });
  addEventListener('resize', () => { if (kurvRitning) kurvRitning.rita(); });
  addEventListener('keydown', (ev) => { if (ev.key === 'Escape') oppnaMeny(false); });
}

function tick() {
  const el = document.getElementById('klocka');
  if (el && rec?.aktiv) {
    const t = (performance.now() - rec.start) / 1000;
    el.textContent = formSek(t);
  }
  requestAnimationFrame(tick);
}

async function start() {
  const svar = await fetch(new URL('./config.json', import.meta.url));
  if (!svar.ok) throw new Error('config');
  config = await svar.json();
  gyroLada = monteraRorelse({
    config,
    nollstall() {
      nollage = senaste.vinkel ? senaste.vinkel.slice() : null;
      foreEuler = senaste.vinkel ? { alpha: senaste.vinkel[0], beta: senaste.vinkel[1], gamma: senaste.vinkel[2] } : null;
      senastRelativ = null;
    }
  });
  lager = skapaLager();
  await lager.oppna();
  const data = await lager.las();
  kategorier = data.kategorier || [];
  inspelningar = data.inspelningar || [];
  senast = data.senast || null;
  profiler = data.profiler || [];
  lyssna();
  koppla();
  rita();
  klar = true;
  window.__rorelse = {
    get redo() { return klar; },
    get lage() { return lage; },
    get talTillgang() { return talTillgang; },
    get antalHandelser() { return antalHandelser; },
    talLage() {
      return tal ? { lang: tal.lang, continuous: !!tal.continuous, interimResults: !!tal.interimResults } : null;
    },
    utkastLage() {
      if (!utkast) return null;
      return {
        langdSek: utkast.langdSek,
        antal: utkast.antal,
        avslut: utkast.avslut,
        svansSek: utkast.svansSek,
        kategoriId: utkast.kategoriId || null
      };
    },
    bibliotek() {
      return {
        kategorier: structuredClone(kategorier),
        antal: inspelningar.length,
        inspelningar: inspelningar.map((ins) => ({
          id: ins.id,
          kategoriId: ins.kategoriId,
          val: ins.val,
          etikett: ins.etikett,
          antal: ins.antal,
          langdSek: ins.langdSek,
          avslut: ins.avslut,
          svansSek: ins.svansSek
        })),
        senast: senast ? structuredClone(senast) : null,
        profiler: profiler.map((p) => ({ id: p.id, text: p.text, antal: p.antal, kategoriId: p.kategoriId }))
      };
    },
    grupper(kategoriId) {
      const kat = kategorier.find((k) => k.id === kategoriId);
      if (!kat) return [];
      return grupperaExakt(inspelningar, kat);
    },
    jamforTal(ids, nyckel) {
      const lista = (ids || []).map((pid) => inspelningar.find((ins) => ins.id === pid)).filter(Boolean);
      const jam = jamforInspelningar(lista, config);
      const s = jam.skalara.find((x) => x.nyckel === nyckel) || null;
      const langd = jam.skalara.find((x) => x.nyckel === 'langdSek') || null;
      const kurva = jam.kurvor.find((x) => x.nyckel === 'rot.0');
      const vid = kurva?.punkter.find((p) => p.u === jam.synkLage) || null;
      return {
        medel: s?.medel ?? null,
        spridning: s?.spridning ?? null,
        variation: s?.variationskoefficient ?? null,
        langdVariation: langd?.variationskoefficient ?? null,
        bandMedel: vid?.medel ?? null,
        bandSpridning: vid?.spridning ?? null,
        synk: jam.synk,
        antal: jam.antal
      };
    },
    async laggIn(paket) {
      const ink = {
        kategorier: paket?.kategorier || [],
        inspelningar: (paket?.inspelningar || []).map((ins) => {
          if (!ins.egenskaper) ins.egenskaper = beraknaEgenskaper(ins, config);
          return ins;
        }),
        senast: paket?.senast || null,
        profiler: paket?.profiler || []
      };
      const hop = slahopImport({ kategorier, inspelningar, senast, profiler }, ink);
      kategorier = hop.kategorier;
      inspelningar = hop.inspelningar;
      senast = hop.senast;
      profiler = hop.profiler || [];
      await lager.skrivAllt({ kategorier, inspelningar, senast, profiler });
      if (['sparade', 'sparadGrupp', 'jamfor', 'bibliotek', 'analys', 'redo'].includes(lage)) rita();
      return { antal: inspelningar.length };
    },
    mata(p) {
      if (!p) return;
      if (p.rotRate || p.acc || p.accG) {
        onMotion({
          rotationRate: p.rotRate || null,
          acceleration: p.acc || null,
          accelerationIncludingGravity: p.accG || null
        });
      }
      if (p.vinkel) onOrient({ alpha: p.vinkel[0], beta: p.vinkel[1], gamma: p.vinkel[2] });
    },
    horde(text) {
      if (!tal || typeof tal.onresult !== 'function') return false;
      tal.onresult({ resultIndex: 0, results: [{ 0: { transcript: text }, isFinal: true, length: 1 }] });
      return true;
    }
  };
  requestAnimationFrame(tick);
}

start().catch(() => {
  huvud.textContent = 'Kunde inte läsa inställningarna.';
});
