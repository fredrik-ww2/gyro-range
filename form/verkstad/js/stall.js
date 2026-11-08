import * as THREE from 'three';
import {
  CircleGeometry, Color, CylinderGeometry, DirectionalLight, DoubleSide,
  Group, HemisphereLight, Mesh, MeshBasicMaterial, MeshStandardMaterial,
  MOUSE, Raycaster, RingGeometry, Scene, SphereGeometry, TOUCH, Vector2, Vector3, WebGLRenderer
} from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { skapaAppleKamera } from '../../../flyg/kamera/kamera_apple_zoom_v1.js';
import { KAMERAVARDEN } from './kameravarden.js';
import { klonaMall, laddaMall, laddaObjekt, lattasteModell } from './modeller.js';
import { esc, hamtaEnhet, statusNamn, tal } from './data.js';
import { lasScen, skrivScen } from './spara.js';

const VARLD = 'villers_bocage';
const NAR_M = 250;

export async function monteraStall(el, { index, tillbaka }) {
  const poster = new Map(index.enheter.map((post) => [post.id, post]));
  el.innerHTML = `
    <div class="stall">
      <header class="topp stall-topp">
        <button type="button" class="tillbaka" data-tillbaka>Bibliotek</button>
        <div>
          <p class="ogat">Villers-Bocage</p>
          <h1>Ställ ut</h1>
        </div>
        <p class="trirad"><span data-trianglar>0</span> trianglar</p>
      </header>
      <div class="stall-yta">
        <canvas data-duk aria-label="Villers-Bocage. Ett finger flyttar vyn, nyp för att zooma."></canvas>
        <p class="stall-status" data-status>Läser höjdterrängen…</p>
        <p class="hint stall-hint">Ett finger flyttar · nyp zoomar · två fingrar lutar</p>
      </div>
      <div class="stall-panel">
        <p data-vald>Välj en enhet, tryck på marken och välj sida.</p>
        <div class="radknappar">
          <button type="button" class="knapp primar" data-valj-enhet>Välj enhet</button>
          <button type="button" class="knapp" data-flytta hidden>Flytta</button>
          <button type="button" class="knapp fara" data-tabort hidden>Ta bort</button>
        </div>
        <ul class="placeringar" data-lista></ul>
      </div>
      <div class="ark" data-ark hidden></div>
    </div>
  `;

  const duk = el.querySelector('[data-duk]');
  const status = el.querySelector('[data-status]');
  const renderer = new WebGLRenderer({ canvas: duk, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = 'srgb';
  renderer.setClearColor(new Color('#c5d2c2'), 1);
  renderer.shadowMap.enabled = false;

  const scen = new Scene();
  scen.add(new HemisphereLight(0xf4f7ef, 0x66725c, 1.08));
  const sol = new DirectionalLight(0xfff3df, 1.25);
  sol.position.set(-120, 280, 80);
  scen.add(sol);
  const markGrupp = new Group();
  const enhetsGrupp = new Group();
  scen.add(markGrupp, enhetsGrupp);

  const markMeshar = [];
  const rutor50 = new Map();
  const rutor10 = new Map();
  const pagar10 = new Set();
  const placeringar = [];
  let valdEnhet = null;
  let valdPlacering = null;
  let flyttaId = null;
  let kor = false;
  let ram = 0;
  let senast = 0;

  const hojdRay = new Raycaster();
  const ned = new Vector3(0, -1, 0);
  const ur = new Vector3();
  function hojd(x, z) {
    ur.set(x, 420, z);
    hojdRay.set(ur, ned);
    hojdRay.far = 520;
    const traffar = hojdRay.intersectObjects(markMeshar, false);
    return traffar.length ? traffar[0].point.y : 145;
  }

  const kam = await skapaAppleKamera({
    THREE,
    OrbitControls,
    renderer,
    markHojd: hojd,
    yta: { minX: -1000, maxX: 1000, minZ: -1000, maxZ: 1000 },
    varden: KAMERAVARDEN
  });
  kam.controls.touches.ONE = TOUCH.PAN;
  kam.controls.touches.TWO = TOUCH.DOLLY_ROTATE;
  kam.controls.mouseButtons.LEFT = MOUSE.PAN;
  kam.controls.screenSpacePanning = true;

  const terrang = await fetch(new URL('../data/varldar/villers_bocage/terrain.json', import.meta.url)).then((svar) => svar.json());
  const bas = new URL('../data/varldar/villers_bocage/', import.meta.url);
  const grova = terrang.chunkar.filter((ruta) => ruta.spacing_m === 50);
  const fina = terrang.chunkar.filter((ruta) => ruta.spacing_m === 10);
  await ko(grova, 6, async (ruta) => {
    const objekt = await laddaMark(new URL(ruta.fil, bas).href);
    objekt.visible = true;
    objekt.userData.ruta = ruta.id;
    markGrupp.add(objekt);
    rutor50.set(ruta.id, objekt);
    objekt.traverse((nod) => { if (nod.isMesh) markMeshar.push(nod); });
    status.textContent = `Mark ${rutor50.size} av ${grova.length}`;
  });
  kam.sattVy({ mal: [0, 0], d: KAMERAVARDEN.start.d_m, lutning: KAMERAVARDEN.start.lutning_grader, kurs: KAMERAVARDEN.start.kurs_grader });
  el.dataset.redo = 'mark';
  status.textContent = 'Tryck på marken för att ställa ut. 50 m på håll, 10 m nära kameran.';

  const sparad = await lasScen(VARLD);
  if (sparad?.placeringar) {
    for (const post of sparad.placeringar) {
      if (post.sida !== 'bla' && post.sida !== 'rod') continue;
      await stallUt(post, false);
    }
  }
  ritaLista();

  el.querySelector('[data-tillbaka]').addEventListener('click', tillbaka);
  el.querySelector('[data-valj-enhet]').addEventListener('click', oppnaBibliotek);
  el.querySelector('[data-flytta]').addEventListener('click', () => {
    if (!valdPlacering) return;
    flyttaId = valdPlacering.id;
    status.textContent = 'Tryck på marken dit enheten ska.';
  });
  el.querySelector('[data-tabort]').addEventListener('click', () => {
    if (valdPlacering) taBort(valdPlacering.id);
  });
  el.querySelector('[data-lista]').addEventListener('click', (handelse) => {
    const knapp = handelse.target.closest('[data-id]');
    if (!knapp) return;
    if (knapp.dataset.handling === 'tabort') taBort(knapp.dataset.id);
    else if (knapp.dataset.handling === 'flytta') {
      valj(knapp.dataset.id);
      flyttaId = knapp.dataset.id;
      status.textContent = 'Tryck på marken dit enheten ska.';
    } else valj(knapp.dataset.id);
  });

  const pek = { id: null, x: 0, y: 0 };
  duk.addEventListener('pointerdown', (handelse) => {
    pek.id = handelse.pointerId;
    pek.x = handelse.clientX;
    pek.y = handelse.clientY;
  });
  duk.addEventListener('pointerup', (handelse) => {
    if (handelse.pointerId !== pek.id) return;
    const dx = handelse.clientX - pek.x;
    const dy = handelse.clientY - pek.y;
    pek.id = null;
    if (dx * dx + dy * dy > 16 * 16) return;
    hanteraTryck(handelse.clientX, handelse.clientY);
  });

  function passa() {
    const yta = duk.parentElement;
    const w = yta.clientWidth || 390;
    const h = yta.clientHeight || 420;
    renderer.setSize(w, h, false);
    kam.storlek(w, Math.max(1, h));
  }
  addEventListener('resize', passa);

  const klockaStart = performance.now();
  let senastTid = klockaStart;
  function bild(nu) {
    if (!kor) return;
    ram = requestAnimationFrame(bild);
    if (el.hidden) return;
    const dt = Math.min(0.1, (nu - senastTid) / 1000);
    senastTid = nu;
    kam.uppdatera(dt);
    if (nu - senast > 280) {
      senast = nu;
      synkLod();
      skalaValjare();
    }
    renderer.render(scen, kam.kamera);
    const tri = renderer.info.render.triangles;
    el.dataset.trianglar = String(tri);
    el.querySelector('[data-trianglar]').textContent = tal(tri, 0);
  }

  async function laddaMark(url) {
    const rot = await laddaObjekt(renderer, url);
    const kopia = rot.clone(true);
    kopia.traverse((nod) => {
      if (!nod.isMesh) return;
      nod.frustumCulled = true;
      nod.material = nod.material.clone();
      nod.material.side = DoubleSide;
    });
    return kopia;
  }

  function synkLod() {
    const kamera = kam.kamera.position;
    for (const ruta of fina) {
      const nära = avstandTillRuta(kamera, ruta.bounds) < NAR_M;
      const finns = rutor10.get(ruta.id);
      if (nära && !finns && !pagar10.has(ruta.id)) {
        pagar10.add(ruta.id);
        laddaMark(new URL(ruta.fil, bas).href).then((objekt) => {
          objekt.userData.ruta = ruta.id;
          markGrupp.add(objekt);
          rutor10.set(ruta.id, objekt);
          objekt.traverse((nod) => { if (nod.isMesh) markMeshar.push(nod); });
          el.dataset.nar = String(rutor10.size);
          pagar10.delete(ruta.id);
        }).catch(() => pagar10.delete(ruta.id));
      }
      if (finns) finns.visible = nära;
      const grov = rutor50.get(ruta.id);
      if (grov) grov.visible = !(nära && finns);
    }
  }

  function skalaValjare() {
    const d = kam.lage().d || 100;
    const pin = Math.min(12, Math.max(1, d * 0.018));
    for (const post of placeringar) {
      if (post.pinne) {
        post.pinne.scale.setScalar(pin);
        post.pinne.position.y = 1.4 * pin + 1.2;
      }
      if (post.valjare) post.valjare.scale.set(Math.max(1, pin * 0.7), 1, Math.max(1, pin * 0.7));
    }
  }

  function hanteraTryck(x, y) {
    if (!el.querySelector('[data-ark]').hidden) return;
    const rect = duk.getBoundingClientRect();
    const ndc = new Vector2(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
    const ray = new Raycaster();
    ray.setFromCamera(ndc, kam.kamera);
    const enhetTraff = ray.intersectObjects(enhetsGrupp.children, true)[0];
    const markTraff = ray.intersectObjects(markMeshar, false)[0];
    const traffad = enhetTraff ? placeringId(enhetTraff.object) : null;
    if (flyttaId && markTraff) {
      flytta(flyttaId, markTraff.point);
      flyttaId = null;
      status.textContent = 'Enheten är flyttad och sparad.';
      return;
    }
    if (traffad && !valdEnhet) {
      valj(traffad);
      return;
    }
    if (!markTraff) return;
    if (valdEnhet) stallUt({ enhet: valdEnhet, x: markTraff.point.x, z: markTraff.point.z, yaw: 0 }, true);
    else if (traffad) valj(traffad);
  }

  async function stallUt(post, fragaSida) {
    const id = post.id || 'p' + Math.random().toString(36).slice(2, 8);
    let x = post.x;
    let z = post.z;
    if (fragaSida) {
      let forsok = 0;
      while (placeringar.some((annan) => Math.hypot(annan.x - x, annan.z - z) < 8) && forsok < 8) {
        const vinkel = forsok * 0.9;
        x = post.x + Math.cos(vinkel) * (14 + forsok * 6);
        z = post.z + Math.sin(vinkel) * (14 + forsok * 6);
        forsok += 1;
      }
    }
    const rad = { id, enhet: post.enhet, sida: post.sida || null, x, z, yaw: post.yaw || 0 };
    const grupp = new Group();
    grupp.userData.placering = id;
    grupp.position.set(x, hojd(x, z), z);
    const farg = rad.sida === 'rod' ? 0xb42323 : rad.sida === 'bla' ? 0x2458c9 : 0x8a8474;
    const ring = new Mesh(new RingGeometry(1.5, 2.15, 18), new MeshBasicMaterial({ color: farg, side: DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.35;
    const skugga = new Mesh(new CircleGeometry(2.3, 10), new MeshBasicMaterial({ color: 0x1b241c, transparent: true, opacity: 0.28, depthWrite: false }));
    skugga.rotation.x = -Math.PI / 2;
    skugga.position.y = 0.12;
    skugga.name = 'skuggproxy';
    const pinne = new Mesh(new SphereGeometry(1.15, 12, 8), new MeshBasicMaterial({ color: farg }));
    pinne.position.y = 2.4;
    const valjare = new Mesh(new CylinderGeometry(2.2, 2.2, 3.2, 6, 1, true), new MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
    valjare.position.y = 1.6;
    valjare.userData.placering = id;
    grupp.add(skugga, ring, pinne, valjare);
    enhetsGrupp.add(grupp);
    rad.grupp = grupp;
    rad.ring = ring;
    rad.pinne = pinne;
    rad.skugga = skugga;
    rad.valjare = valjare;
    placeringar.push(rad);
    skalaValjare();
    const meta = poster.get(rad.enhet);
    if (meta) {
      try {
        const pack = await hamtaEnhet(meta.fil);
        const modell = lattasteModell(pack.visning.modeller);
        if (modell) {
          const mall = await laddaMall(renderer, meta.fil, modell);
          grupp.add(klonaMall(mall));
        } else grupp.add(token());
      } catch {
        grupp.add(token());
      }
    } else grupp.add(token());
    if (fragaSida) {
      await valjSida(rad);
    } else {
      ritaLista();
    }
    return rad;
  }

  function token() {
    const kropp = new Mesh(new CylinderGeometry(0.45, 0.55, 1.7, 6), new MeshStandardMaterial({ color: 0x8d9284 }));
    kropp.position.y = 0.85;
    return kropp;
  }

  function valjSida(rad) {
    const ark = el.querySelector('[data-ark]');
    const namn = poster.get(rad.enhet)?.namn || rad.enhet;
    ark.hidden = false;
    ark.innerHTML = `
      <div class="ark-kort" role="dialog" aria-label="Välj sida">
        <h2>${esc(namn)}</h2>
        <p>Vilken sida hör enheten till?</p>
        <button type="button" class="knapp bla" data-sida="bla">Blå · egen</button>
        <button type="button" class="knapp rod" data-sida="rod">Röd · fiende</button>
        <button type="button" class="textknapp" data-avbryt>Avbryt</button>
      </div>`;
    return new Promise((resolve) => {
      ark.onclick = async (handelse) => {
        const sida = handelse.target.closest('[data-sida]')?.dataset.sida;
        if (handelse.target.closest('[data-avbryt]')) {
          taBort(rad.id, false);
          ark.hidden = true;
          resolve(null);
          return;
        }
        if (!sida) return;
        rad.sida = sida;
        const farg = sida === 'rod' ? 0xb42323 : 0x2458c9;
        rad.ring.material.color.set(farg);
        rad.pinne.material.color.set(farg);
        ark.hidden = true;
        await spara();
        valj(rad.id);
        status.textContent = (sida === 'bla' ? 'Blå' : 'Röd') + ' enhet sparad.';
        resolve(rad);
      };
    });
  }

  function valj(id) {
    valdPlacering = placeringar.find((post) => post.id === id) || null;
    flyttaId = null;
    for (const post of placeringar) post.grupp.scale.setScalar(post.id === id ? 1.04 : 1);
    el.querySelector('[data-flytta]').hidden = !valdPlacering;
    el.querySelector('[data-tabort]').hidden = !valdPlacering;
    if (valdPlacering) {
      const namn = poster.get(valdPlacering.enhet)?.namn || valdPlacering.enhet;
      status.textContent = namn + ' är vald. Flytta eller ta bort.';
    }
    ritaLista();
  }

  function flytta(id, punkt) {
    const post = placeringar.find((rad) => rad.id === id);
    if (!post) return;
    post.x = punkt.x;
    post.z = punkt.z;
    post.grupp.position.set(post.x, hojd(post.x, post.z), post.z);
    spara();
  }

  function taBort(id, sparaEfter = true) {
    const indexRad = placeringar.findIndex((post) => post.id === id);
    if (indexRad < 0) return;
    const [post] = placeringar.splice(indexRad, 1);
    post.grupp.removeFromParent();
    if (valdPlacering?.id === id) valdPlacering = null;
    el.querySelector('[data-flytta]').hidden = true;
    el.querySelector('[data-tabort]').hidden = true;
    if (sparaEfter) spara();
    else ritaLista();
  }

  async function spara() {
    const data = {
      schema: 'form.verkstad.scen.v1',
      varld: VARLD,
      placeringar: placeringar.filter((post) => post.sida).map(({ id, enhet, sida, x, z, yaw }) => ({
        id, enhet, sida, x: runda(x), z: runda(z), yaw
      }))
    };
    await skrivScen(VARLD, data);
    el.dataset.sparad = String(Date.now());
    ritaLista();
  }

  function ritaLista() {
    const klara = placeringar.filter((post) => post.sida);
    const bla = klara.filter((post) => post.sida === 'bla').length;
    const rod = klara.filter((post) => post.sida === 'rod').length;
    el.dataset.bla = String(bla);
    el.dataset.rod = String(rod);
    el.dataset.placeringar = String(klara.length);
    el.querySelector('[data-lista]').innerHTML = klara.map((post) => {
      const namn = poster.get(post.enhet)?.namn || post.enhet;
      const meta = poster.get(post.enhet);
      const statusText = meta ? statusNamn(meta.status) : 'Under utveckling';
      return `<li data-placering="${esc(post.id)}" data-x="${runda(post.x)}" data-z="${runda(post.z)}" data-sida="${esc(post.sida)}">
        <button type="button" data-id="${esc(post.id)}" data-handling="valj"><strong>${esc(namn)}</strong><small>${post.sida === 'bla' ? 'Blå' : 'Röd'} · ${esc(statusText)}</small></button>
        <button type="button" data-id="${esc(post.id)}" data-handling="flytta">Flytta</button>
        <button type="button" data-id="${esc(post.id)}" data-handling="tabort">Ta bort</button>
      </li>`;
    }).join('') || '<li class="tomrad">Inget utställt ännu.</li>';
    const valdText = valdEnhet ? (poster.get(valdEnhet)?.namn || valdEnhet) : null;
    el.querySelector('[data-vald]').textContent = valdText
      ? `Tryck på marken för att ställa ut ${valdText}.`
      : 'Välj en enhet, tryck på marken och välj sida.';
  }

  function oppnaBibliotek() {
    const ark = el.querySelector('[data-ark]');
    const rader = index.enheter.map((post) => `
      <button type="button" class="rad" data-enhet="${esc(post.id)}">
        <span><strong>${esc(post.namn)}</strong><small>${esc(post.nation)} · ${esc(statusNamn(post.status))}</small></span>
      </button>`).join('');
    ark.hidden = false;
    ark.innerHTML = `
      <div class="ark-kort ark-lang" role="dialog" aria-label="Välj enhet">
        <div class="radknappar"><h2>Välj enhet</h2><button type="button" class="textknapp" data-stang>Stäng</button></div>
        <input type="search" data-sok-enhet placeholder="Sök" aria-label="Sök enhet">
        <div data-enhetslista>${rader}</div>
      </div>`;
    ark.querySelector('[data-sok-enhet]').addEventListener('input', (handelse) => {
      const fraga = handelse.target.value.trim().toLowerCase();
      ark.querySelectorAll('[data-enhet]').forEach((knapp) => {
        knapp.hidden = fraga && !knapp.textContent.toLowerCase().includes(fraga);
      });
    });
    ark.onclick = (handelse) => {
      if (handelse.target.closest('[data-stang]')) { ark.hidden = true; return; }
      const knapp = handelse.target.closest('[data-enhet]');
      if (!knapp) return;
      valdEnhet = knapp.dataset.enhet;
      flyttaId = null;
      ark.hidden = true;
      ritaLista();
      status.textContent = 'Tryck på marken. Sedan väljer du blå eller röd.';
    };
  }

  function visa(synlig) {
    el.hidden = !synlig;
    kor = synlig;
    if (synlig) {
      senastTid = performance.now();
      passa();
      cancelAnimationFrame(ram);
      ram = requestAnimationFrame(bild);
    } else {
      cancelAnimationFrame(ram);
    }
  }
  visa(!el.hidden);

  return { visa, passa };
}

function placeringId(objekt) {
  let nod = objekt;
  while (nod) {
    if (nod.userData?.placering) return nod.userData.placering;
    nod = nod.parent;
  }
  return null;
}

function avstandTillRuta(punkt, bounds) {
  const x = Math.max(bounds[0], Math.min(punkt.x, bounds[3]));
  const y = Math.max(bounds[1], Math.min(punkt.y, bounds[4]));
  const z = Math.max(bounds[2], Math.min(punkt.z, bounds[5]));
  const dx = punkt.x - x;
  const dy = punkt.y - y;
  const dz = punkt.z - z;
  return Math.hypot(dx, dy, dz);
}

function runda(talVarde) {
  return Math.round(talVarde * 100) / 100;
}

async function ko(lista, bredd, arbete) {
  let index = 0;
  async function arbetare() {
    while (index < lista.length) {
      const aktuell = index;
      index += 1;
      await arbete(lista[aktuell], aktuell);
    }
  }
  await Promise.all(Array.from({ length: bredd }, arbetare));
}
