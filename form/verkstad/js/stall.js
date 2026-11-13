import * as THREE from 'three';
import {
  BackSide, Box3, BoxGeometry, CircleGeometry, Color, CylinderGeometry, DirectionalLight, DoubleSide,
  Fog, Group, HemisphereLight,   BufferGeometry, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, MeshStandardMaterial, ShaderMaterial,
  MOUSE, Raycaster, RingGeometry, Scene, SphereGeometry, TOUCH, Vector2, Vector3, WebGLRenderer
} from 'three';
import { laddaMarkyta, markMaterial, stallFilter } from './markyta.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { skapaAppleKamera } from '../../../flyg/kamera/kamera_apple_zoom_v1.js';
import { KAMERAVARDEN } from './kameravarden.js';
import { klonaMall, laddaMall, laddaObjekt } from './modeller.js';
import { esc, hamtaEnhet, nationVisning, placeringsNivaer, statusNamn, tal, truppVisning, vapenslag } from './data.js';
import { filtreraMappar, kopplaMappminne, ritaEnhetstrad } from './enhetsmappar.js';
import { lasScen, skrivScen } from './spara.js';
import { byggFormMark, hamtaLandskap } from './formvarld.js';
import { byggFormSkog } from './formskog.js';
import {
  FARG, fartFaktor, ganglagAv, indexera, laddaTyper, linjeMot, markId, ofarbar, ritaHinderlista,
  kvarvarandeVarde, ritaTerrangkort, typVid, vapenAv
} from './terrang.js';

const NAR_M = 250;
const MODELL_NAR_M = 220;

export async function monteraStall(el, { index, katalog, tillbaka, varld }) {
  const valdVarld = varld?.typ === 'form'
    ? varld
    : { typ: 'villers', id: 'villers_bocage', namn: 'Villers-Bocage' };
  const VARLD = valdVarld.typ === 'form' ? 'form:' + valdVarld.id : 'villers_bocage';
  const varldNamn = valdVarld.namn || (valdVarld.typ === 'form' ? 'FORM-värld' : 'Villers-Bocage');
  if (valdVarld.typ === 'form' && !valdVarld.post) {
    el.innerHTML = `
      <div class="stall">
        <header class="topp stall-topp">
          <button type="button" class="tillbaka" data-tillbaka>Bibliotek</button>
          <div>
            <p class="ogat">FORM satellit</p>
            <h1>Ställ ut</h1>
          </div>
        </header>
        <p class="varning">Den här världen finns inte i den här webbläsaren. Bygg den i FORM satellit, så dyker den upp under Världar.</p>
      </div>`;
    el.querySelector('[data-tillbaka]').addEventListener('click', tillbaka);
    el.dataset.redo = 'saknas';
    el.dataset.varld = VARLD;
    return { visa() {}, passa() {}, stang() {} };
  }
  const poster = new Map(index.enheter.map((post) => [post.id, post]));
  const startFaktor = valdVarld.typ === 'form' ? 1 : 1.5;
  el.innerHTML = `
    <div class="stall">
      <header class="topp stall-topp">
        <button type="button" class="tillbaka" data-tillbaka>Bibliotek</button>
        <div>
          <p class="ogat">${esc(varldNamn)}</p>
          <h1>Ställ ut</h1>
        </div>
        <p class="trirad"><span data-trianglar>0</span> trianglar</p>
      </header>
      <div class="stall-yta">
        <canvas data-duk aria-label="${esc(varldNamn)}. Ett finger flyttar vyn, nyp för att zooma."></canvas>
        <p class="stall-status" data-status>Läser höjdterrängen…</p>
        <details class="terrangruta" data-terrangruta>
          <summary>Terräng på mobil</summary>
          <dl data-terrangmatt></dl>
        </details>
        <p class="hint stall-hint">Ett finger flyttar · nyp zoomar · två fingrar lutar</p>
        <div class="etikett-lager" data-etiketter></div>
      </div>
      <p class="lodmatare" data-lodmatare>Mätare väntar…</p>
      <div class="stall-panel">
        <p data-vald>Välj en enhet, tryck på marken och välj sida.</p>
        <div data-terrangfalt></div>
        <div class="radknappar">
          <button type="button" class="knapp primar" data-valj-enhet>Välj enhet</button>
          <button type="button" class="knapp" data-hinder>Hinder</button>
          <button type="button" class="knapp" data-hojd aria-pressed="${startFaktor === 1.5 ? 'true' : 'false'}">${startFaktor === 1.5 ? 'Höjd 1,5×' : 'Höjd vanlig'}</button>
          <button type="button" class="knapp" data-fagel>Fågelperspektiv</button>
          <button type="button" class="knapp" data-klar hidden>Klar</button>
          <button type="button" class="knapp" data-tillbaka-lage hidden>Tillbaka</button>
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
  scen.background = new Color('#d7e4cf');
  scen.fog = new Fog(0xd7e4cf, 70, 640);
  scen.add(new HemisphereLight(0xd5e6f4, 0x6a6248, 1.05));
  const sol = new DirectionalLight(0xfff1d6, 0.72);
  sol.position.set(-260, 120, -70);
  scen.add(sol);
  const himmel = new Mesh(new SphereGeometry(2200, 20, 10), new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      topp: { value: new Color('#7eafd6') },
      horisont: { value: new Color('#d7e4cf') }
    },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec3 vP; uniform vec3 topp; uniform vec3 horisont; void main(){ float h = clamp(normalize(vP).y * 1.5, 0.0, 1.0); gl_FragColor = vec4(mix(horisont, topp, h), 1.0); }'
  }));
  himmel.frustumCulled = false;
  scen.add(himmel);
  const markGrupp = new Group();
  const enhetsGrupp = new Group();
  const hinderGrupp = new Group();
  scen.add(markGrupp, enhetsGrupp, hinderGrupp);

  const markMeshar = [];
  const rutor50 = new Map();
  const rutor10 = new Map();
  const pagar10 = new Set();
  const placeringar = [];
  const hinder = [];
  let terrangPaket = { data: { typer: [], tom_mark: 'ang', form_etikett: {} }, typer: new Map() };
  let valtHinder = null;
  let valdEnhet = null;
  let valdPlacering = null;
  let flyttaId = null;
  let spellage = 'stall';
  let fagelSparad = null;
  let mjuk = null;
  let matareMal = { typ: 'mark' };
  let fps = 0;
  const skottMat = new LineBasicMaterial({ color: 0xffe08a });
  let kor = false;
  let ram = 0;
  let senast = 0;

  const hojdRay = new Raycaster();
  const ned = new Vector3(0, -1, 0);
  const ur = new Vector3();
  const reservHojd = valdVarld.typ === 'form' ? 0 : 145;
  function hojd(x, z) {
    ur.set(x, 420, z);
    hojdRay.set(ur, ned);
    hojdRay.far = 520;
    const traffar = hojdRay.intersectObjects(markMeshar, false);
    return traffar.length ? traffar[0].point.y : reservHojd;
  }

  const formMark = valdVarld.typ === 'form' ? await byggFormMark(valdVarld.post) : null;
  const skog = formMark ? await byggFormSkog(valdVarld.post) : null;
  const yta = formMark
    ? { minX: -formMark.bredd / 2, maxX: formMark.bredd / 2, minZ: -formMark.djup / 2, maxZ: formMark.djup / 2 }
    : { minX: -1000, maxX: 1000, minZ: -1000, maxZ: 1000 };
  const spann = formMark ? Math.max(formMark.bredd, formMark.djup) : 0;
  const startVy = formMark
    ? (spann > 300
      ? { mal_xz_m: [0, 0], d_m: Math.min(560, spann * 0.85), lutning_grader: 46, kurs_grader: 38 }
      : { mal_xz_m: [0, 0], d_m: Math.max(48, spann * 0.42), lutning_grader: 58, kurs_grader: 28 })
    : KAMERAVARDEN.start;
  const kam = await skapaAppleKamera({
    THREE,
    OrbitControls,
    renderer,
    markHojd: hojd,
    yta,
    varden: formMark
      ? { ...KAMERAVARDEN, start: startVy, granser: { ...KAMERAVARDEN.granser, marginal_m: Math.min(120, Math.max(24, formMark.bredd * 0.12)) } }
      : KAMERAVARDEN
  });
  kam.controls.touches.ONE = TOUCH.PAN;
  kam.controls.touches.TWO = TOUCH.DOLLY_ROTATE;
  kam.controls.mouseButtons.LEFT = MOUSE.PAN;
  kam.controls.screenSpacePanning = true;

  let markMat = null;
  let fina = [];
  let medelHojd = 145;
  let bas = null;
  const husPaMark = [];
  if (formMark) {
    markGrupp.add(formMark.mark);
    markMeshar.push(formMark.mark);
    for (const hus of formMark.hus) {
      markGrupp.add(hus);
      husPaMark.push(hus);
    }
    if (skog) {
      markGrupp.add(skog.grupp);
      el.dataset.trad = String(skog.antal);
      el.dataset.skogMeshar = String(skog.meshar);
      el.dataset.texturer = String(skog.texturer);
      el.dataset.lod = skog.antal ? '3d+impostor' : 'ingen';
    }
    el.dataset.textur = String(formMark.texturSida);
    const punkter = formMark.mark.geometry.attributes.position;
    let summa = 0;
    for (let i = 0; i < punkter.count; i += 1) summa += punkter.getY(i);
    medelHojd = punkter.count ? summa / punkter.count : 0;
  } else {
    const markyta = await laddaMarkyta().catch(() => null);
    markMat = markyta ? markMaterial(markyta.textur) : null;
    if (markyta) {
      stallFilter(markyta.textur, renderer);
      markyta.detalj.then(() => {
        stallFilter(markyta.textur, renderer);
        el.dataset.textur = '2048';
      }).catch(() => { el.dataset.textur = '512'; });
    }
    const terrang = await fetch(new URL('../data/varldar/villers_bocage/terrain.json', import.meta.url)).then((svar) => svar.json());
    bas = new URL('../data/varldar/villers_bocage/', import.meta.url);
    const grova = terrang.chunkar.filter((ruta) => ruta.spacing_m === 50);
    fina = terrang.chunkar.filter((ruta) => ruta.spacing_m === 10);
    await ko(grova, 6, async (ruta) => {
      const objekt = await laddaMark(new URL(ruta.fil, bas).href);
      objekt.visible = true;
      objekt.userData.ruta = ruta.id;
      markGrupp.add(objekt);
      rutor50.set(ruta.id, objekt);
      objekt.traverse((nod) => { if (nod.isMesh) { forberedMark(nod); markMeshar.push(nod); } });
      status.textContent = `Mark ${rutor50.size} av ${grova.length}`;
    });
    medelHojd = (terrang.hojdmin_m + terrang.hojdmax_m) / 2;
  }
  let hojdFaktor = startFaktor;
  function appliceraHojd() {
    for (const mesh of markMeshar) {
      const pos = mesh.geometry.attributes.position;
      if (!mesh.geometry.userData.basY) {
        const bas = new Float32Array(pos.count);
        for (let i = 0; i < pos.count; i++) bas[i] = pos.getY(i);
        mesh.geometry.userData.basY = bas;
      }
      const bas = mesh.geometry.userData.basY;
      for (let i = 0; i < pos.count; i++) pos.setY(i, medelHojd + (bas[i] - medelHojd) * hojdFaktor);
      pos.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeBoundingSphere();
    }
    if (formMark) {
      const pos = formMark.mark.geometry.attributes.position;
      let minY = Infinity;
      let maxY = -Infinity;
      for (let i = 0; i < pos.count; i += 1) {
        const y = pos.getY(i);
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      el.dataset.hojdmin = minY.toFixed(2);
      el.dataset.hojdmax = maxY.toFixed(2);
      el.dataset.hojdspann = (maxY - minY).toFixed(2);
    }
  }
  appliceraHojd();
  skog?.tillampaHojd(hojdFaktor, medelHojd);
  function stallLandskap() {
    for (const hus of husPaMark) {
      hus.position.set(hus.userData.markX, hojd(hus.userData.markX, hus.userData.markZ) + hus.userData.lyft, hus.userData.markZ);
    }
  }
  stallLandskap();
  kam.sattVy({ mal: startVy.mal_xz_m, d: startVy.d_m, lutning: startVy.lutning_grader, kurs: startVy.kurs_grader });
  el._kamera = kam;
  el.dataset.redo = 'mark';
  el.dataset.varld = VARLD;
  status.textContent = formMark
    ? 'Tryck på marken för att ställa ut.'
    : 'Tryck på marken för att ställa ut. 50 m på håll, 10 m nära kameran.';

  try {
    terrangPaket = indexera(await laddaTyper());
  } catch {
    terrangPaket = indexera({ typer: [], tom_mark: 'ang', form_etikett: {} });
  }
  const sparad = await lasScen(VARLD);
  if (sparad?.placeringar) {
    for (const post of sparad.placeringar) {
      if (post.sida !== 'bla' && post.sida !== 'rod') continue;
      await stallUt(post, false);
    }
  }
  if (sparad?.hinder) {
    for (const post of sparad.hinder) stallHinder(post);
  }
  ritaLista();
  fyllTerrang();

  el.querySelector('[data-fagel]').addEventListener('click', () => {
    const knapp = el.querySelector('[data-fagel]');
    const nu = kam.lage();
    if (fagelSparad) {
      mjukTill({ mal: fagelSparad.mal, d: fagelSparad.d, lutning: fagelSparad.lutning, kurs: fagelSparad.kurs });
      fagelSparad = null;
      knapp.textContent = 'Fågelperspektiv';
      knapp.setAttribute('aria-pressed', 'false');
      return;
    }
    fagelSparad = { mal: [nu.mal[0], nu.mal[2]], d: nu.d, lutning: nu.lutning, kurs: nu.kurs };
    const span = Math.max(yta.maxX - yta.minX, yta.maxZ - yta.minZ);
    mjukTill({
      mal: [0, 0],
      d: Math.min(kam.dMax * 0.9, Math.max(80, span * 0.72)),
      lutning: 8,
      kurs: nu.kurs
    });
    knapp.textContent = 'Tillbaka till vyn';
    knapp.setAttribute('aria-pressed', 'true');
  });
  el.querySelector('[data-klar]').addEventListener('click', () => {
    spara();
    oppnaKlar();
  });
  el.querySelector('[data-tillbaka-lage]').addEventListener('click', () => {
    spellage = 'stall';
    for (const post of placeringar) {
      post.hp = 100;
      post.grupp.visible = true;
      if (post.tagg) post.tagg.style.visibility = '';
    }
    el.querySelector('[data-tillbaka-lage]').hidden = true;
    status.textContent = 'Tillbaka till utplacering.';
    ritaLista();
  });

  el.querySelector('[data-hojd]').addEventListener('click', () => {
    const knapp = el.querySelector('[data-hojd]');
    hojdFaktor = hojdFaktor === 1 ? 1.5 : 1;
    knapp.setAttribute('aria-pressed', hojdFaktor === 1.5 ? 'true' : 'false');
    knapp.textContent = hojdFaktor === 1.5 ? 'Höjd 1,5×' : 'Höjd vanlig';
    appliceraHojd();
    skog?.tillampaHojd(hojdFaktor, medelHojd);
    skog?.uppdatera(kam.kamera, true);
    stallLandskap();
    for (const post of placeringar) post.grupp.position.y = hojd(post.x, post.z);
  });
  el.querySelector('[data-tillbaka]').addEventListener('click', tillbaka);
  el.querySelector('[data-valj-enhet]').addEventListener('click', oppnaBibliotek);
  el.querySelector('[data-hinder]').addEventListener('click', oppnaHinder);
  el.querySelector('[data-flytta]').addEventListener('click', () => {
    if (!valdPlacering) return;
    flyttaId = valdPlacering.id;
    status.textContent = 'Tryck på marken dit enheten ska.';
  });
  el.querySelector('[data-tabort]').addEventListener('click', () => {
    if (valdPlacering) taBort(valdPlacering.id);
    else if (el.dataset.hinderValt) taBortHinder(el.dataset.hinderValt);
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
    const kamerAvstand = kam.lage().d || 40;
    const near = Math.max(0.04, Math.min(0.3, kamerAvstand * 0.012));
    if (Math.abs(kam.kamera.near - near) > 0.02) {
      kam.kamera.near = near;
      kam.kamera.updateProjectionMatrix();
    }
    himmel.position.copy(kam.kamera.position);
    const avstand = kam.lage().d || 150;
    scen.fog.near = Math.max(120, avstand * 0.85);
    scen.fog.far = Math.max(700, avstand * 5);
    if (nu - senast > 280) {
      senast = nu;
      synkLod();
      skalaValjare();
    }
    if (skog) {
      skog.uppdatera(kam.kamera);
      el.dataset.nara = String(skog.nara);
    }
    if (mjuk) stegMjuk(nu);
    if (spellage === 'spel') spelaSteg(dt);
    fps = fps ? fps * 0.9 + (dt > 0 ? 0.1 / dt : fps) : (dt > 0 ? 1 / dt : 0);
    placeraEtiketter();
    renderer.render(scen, kam.kamera);
    const tri = renderer.info.render.triangles;
    el.dataset.trianglar = String(tri);
    el.dataset.anrop = String(renderer.info.render.calls);
    el.dataset.fps = fps.toFixed(0);
    el.querySelector('[data-trianglar]').textContent = tal(tri, 0);
    ritaMatare(tri);
  }

  function mjukTill(mal) {
    const nu = kam.lage();
    mjuk = {
      start: { mal: [nu.mal[0], nu.mal[2]], d: nu.d, lutning: nu.lutning, kurs: nu.kurs },
      mal,
      t0: performance.now()
    };
  }

  function stegMjuk(nu) {
    const t = Math.min(1, (nu - mjuk.t0) / 700);
    const s = t * t * (3 - 2 * t);
    const a = mjuk.start;
    const b = mjuk.mal;
    kam.sattVy({
      mal: [a.mal[0] + (b.mal[0] - a.mal[0]) * s, a.mal[1] + (b.mal[1] - a.mal[1]) * s],
      d: a.d + (b.d - a.d) * s,
      lutning: a.lutning + (b.lutning - a.lutning) * s,
      kurs: a.kurs + (b.kurs - a.kurs) * s
    });
    if (t >= 1) mjuk = null;
  }

  function markTri() {
    let antal = 0;
    for (const mesh of markMeshar) {
      const geo = mesh.geometry;
      if (!geo) continue;
      antal += geo.index ? geo.index.count / 3 : (geo.attributes.position?.count || 0) / 3;
    }
    return Math.round(antal);
  }

  function fyllTerrang() {
    const lista = el.querySelector('[data-terrangmatt]');
    if (!lista) return;
    const rutor = formMark ? (skog?.meshar || 0) + 1 : rutor50.size;
    const lodNivaer = formMark ? (skog ? 3 : 1) : 2;
    const texturer = formMark ? (skog ? 4 : 1) : 1;
    const vaxter = skog?.antal || 0;
    el.dataset.terrangLod = String(lodNivaer);
    el.dataset.terrangRutor = String(rutor);
    lista.innerHTML = `
      <div><dt>Trianglar i marken</dt><dd>${tal(markTri(), 0)}</dd></div>
      <div><dt>LOD-nivåer</dt><dd>${lodNivaer}</dd></div>
      <div><dt>Rutor</dt><dd>${rutor}</dd></div>
      <div><dt>Texturer</dt><dd>${texturer}</dd></div>
      <div><dt>Växter</dt><dd data-vaxter>${tal(vaxter, 0)}</dd></div>
      <div><dt>Ritanrop</dt><dd data-terrang-anrop>0</dd></div>
      <div><dt>Bilder per sekund</dt><dd data-terrang-fps>0</dd></div>`;
  }

  function ritaMatare(tri) {
    const rad = el.querySelector('[data-lodmatare]');
    const anrop = el.querySelector('[data-terrang-anrop]');
    const fpsRad = el.querySelector('[data-terrang-fps]');
    if (anrop) anrop.textContent = el.dataset.anrop || '0';
    if (fpsRad) fpsRad.textContent = el.dataset.fps || '0';
    if (!rad) return;
    let extra = 'Mark · en nivå';
    if (matareMal.typ === 'enhet') {
      const post = placeringar.find((rad) => rad.id === matareMal.id);
      if (post) {
        const namn = poster.get(post.enhet)?.namn || post.enhet;
        const avstand = Math.round(kam.kamera.position.distanceTo(post.grupp.position));
        const niva = post.lod === 'mobil' ? 'närbild' : 'enkel';
        extra = `${namn} · ${niva} · ${avstand} m`;
      }
    } else if (formMark && skog) {
      const d = kam.lage().d || 0;
      extra = d < 80 ? 'Mark och nära träd i 3D' : 'Mark och träd som skyltar';
    } else if (!formMark) {
      extra = 'Mark · 50 m, 10 m nära';
    }
    rad.textContent = `${el.dataset.fps || '0'} bilder/s · ${el.dataset.anrop || '0'} anrop · ${tal(tri, 0)} trianglar · ${extra}`;
  }

  function oppnaKlar() {
    const ark = el.querySelector('[data-ark]');
    ark.hidden = false;
    ark.innerHTML = `
      <div class="ark-kort" role="dialog" aria-label="Klar">
        <h2>Sparat</h2>
        <p>Enheterna ligger kvar på kartan.</p>
        <button type="button" class="knapp primar" data-testa-grafik>Testa grafik</button>
        <button type="button" class="knapp" data-spela>Spela och testa</button>
        <p class="fin">Spela och testa är en första version. Enheterna går mot varandra och skjuter. Det är inte ett färdigt slag.</p>
        <button type="button" class="textknapp" data-stang>Stäng</button>
      </div>`;
    ark.onclick = (handelse) => {
      if (handelse.target.closest('[data-stang]')) { ark.hidden = true; return; }
      if (handelse.target.closest('[data-testa-grafik]')) {
        spellage = 'grafik';
        ark.hidden = true;
        el.querySelector('[data-tillbaka-lage]').hidden = false;
        el.querySelector('[data-klar]').hidden = true;
        status.textContent = 'Fri kamera. Ingen strid.';
        return;
      }
      if (handelse.target.closest('[data-spela]')) {
        spellage = 'spel';
        for (const post of placeringar) post.hp = post.hp || 100;
        ark.hidden = true;
        el.querySelector('[data-tillbaka-lage]').hidden = false;
        el.querySelector('[data-klar]').hidden = true;
        status.textContent = 'Första version. De går mot varandra och skjuter.';
      }
    };
  }

  function spelaSteg(dt) {
    const levande = (sida) => placeringar.filter((post) => post.sida === sida && (post.hp ?? 100) > 0);
    if (!levande('bla').length || !levande('rod').length) {
      status.textContent = !levande('bla').length && !levande('rod').length
        ? 'Båda sidor är slut. Första version.'
        : (levande('bla').length ? 'Blå sida kvar. Första version.' : 'Röd sida kvar. Första version.');
      return;
    }
    for (const post of placeringar) {
      if (!post.sida || (post.hp ?? 100) <= 0) continue;
      const fiender = levande(post.sida === 'bla' ? 'rod' : 'bla');
      if (!fiender.length) continue;
      let mal = fiender[0];
      let bast = Infinity;
      for (const fiende of fiender) {
        const avstand = Math.hypot(fiende.x - post.x, fiende.z - post.z);
        if (avstand < bast) { bast = avstand; mal = fiende; }
      }
      const markNu = markUnder(post.x, post.z);
      const fart = fartFaktor(markNu, post.ganglag || 'fot');
      if (bast > 14 && fart > 0) {
        const steg = Math.min(bast - 12, 7 * dt * fart);
        const nx = post.x + ((mal.x - post.x) / bast) * steg;
        const nz = post.z + ((mal.z - post.z) / bast) * steg;
        const nasta = markUnder(nx, nz);
        if (!ofarbar(nasta, post.ganglag || 'fot')) {
          post.x = nx;
          post.z = nz;
          post.grupp.position.set(post.x, hojd(post.x, post.z), post.z);
        }
      }
      minaVid(post);
      post.sedanSkott = (post.sedanSkott || 0) + dt;
      if (bast < 220 && post.sedanSkott > 1.1) {
        post.sedanSkott = 0;
        visaSkott(post, mal);
        const hot = post.vapen || 'handeldvapen';
        let faktor = kvarvarandeVarde(markUnder(mal.x, mal.z), hot);
        for (const traff of linjeMot(post.x, post.z, mal.x, mal.z, hinder, terrangPaket.typer, 'id')) {
          faktor = Math.min(faktor, kvarvarandeVarde(traff.typ, hot));
        }
        mal.hp = (mal.hp ?? 100) - 34 * faktor;
        if (mal.hp <= 0) mal.grupp.visible = false;
      }
    }
  }

  function visaSkott(fran, till) {
    const geo = new BufferGeometry().setFromPoints([
      new Vector3(fran.x, fran.grupp.position.y + 1.5, fran.z),
      new Vector3(till.x, till.grupp.position.y + 1.2, till.z)
    ]);
    const linje = new Line(geo, skottMat);
    scen.add(linje);
    setTimeout(() => {
      linje.removeFromParent();
      geo.dispose();
    }, 160);
  }

  function forberedMark(nod) {
    nod.frustumCulled = true;
    nod.geometry = nod.geometry.clone();
    if (markMat) nod.material = markMat;
    const pos = nod.geometry.attributes.position;
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      uv[i * 2] = (pos.getX(i) + 1000) / 2000;
      uv[i * 2 + 1] = (1000 - pos.getZ(i)) / 2000;
    }
    nod.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  }

  async function laddaMark(url) {
    const rot = await laddaObjekt(renderer, url);
    return rot.clone(true);
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
          objekt.traverse((nod) => {
            if (!nod.isMesh) return;
            forberedMark(nod);
            markMeshar.push(nod);
          });
          appliceraHojd();
          el.dataset.nar = String(rutor10.size);
          pagar10.delete(ruta.id);
        }).catch(() => pagar10.delete(ruta.id));
      }
      if (finns) finns.visible = nära;
      const grov = rutor50.get(ruta.id);
      if (grov) grov.visible = !(nära && finns);
    }
    for (const post of placeringar) {
      if (!post.nara) continue;
      const modellAvstand = kamera.distanceTo(post.grupp.position);
      const nara = modellAvstand < MODELL_NAR_M;
      post.nara.visible = nara || post.fjarr === post.nara;
      if (post.fjarr && post.fjarr !== post.nara) post.fjarr.visible = !nara;
      post.lod = nara ? 'mobil' : 'enkel';
      const rad = el.querySelector(`[data-placering="${post.id}"]`);
      if (rad) rad.dataset.lod = post.lod;
    }
  }

  function skalaValjare() {}

  function placeraEtiketter() {
    const lager = el.querySelector('[data-etiketter]');
    if (!lager) return;
    const bredd = lager.clientWidth || 1;
    const hojdPx = lager.clientHeight || 1;
    const punkt = new Vector3();
    for (const post of placeringar) {
      const tagg = post.tagg;
      if (!tagg) continue;
      punkt.copy(post.grupp.position);
      punkt.y += post.etikettHojd || 2.4;
      punkt.project(kam.kamera);
      if (punkt.z > 1) {
        tagg.style.visibility = 'hidden';
        continue;
      }
      const avstand = kam.kamera.position.distanceTo(post.grupp.position);
      const skala = Math.min(1, Math.max(0.62, avstand / 170));
      tagg.style.visibility = 'visible';
      tagg.style.transform = `scale(${skala})`;
      const x = (punkt.x * 0.5 + 0.5) * bredd;
      const y = (-punkt.y * 0.5 + 0.5) * hojdPx;
      const lagerRect = lager.getBoundingClientRect();
      const statusRect = el.querySelector('[data-status]')?.getBoundingClientRect();
      const hintRect = el.querySelector('.stall-hint')?.getBoundingClientRect();
      const toppMarg = statusRect ? Math.max(6, statusRect.bottom - lagerRect.top + 6) : 6;
      const bottenMarg = hintRect ? Math.max(6, lagerRect.bottom - hintRect.top + 6) : 6;
      const layoutBredd = tagg.offsetWidth || 72;
      const layoutHojd = tagg.offsetHeight || 18;
      const halv = layoutBredd * skala * 0.5;
      const visH = layoutHojd * skala;
      const xKlam = Math.max(6 + halv, Math.min(bredd - 6 - halv, x));
      const botten = Math.max(toppMarg + visH, Math.min(hojdPx - bottenMarg, y - 8));
      tagg.style.left = (xKlam - layoutBredd / 2) + 'px';
      tagg.style.top = (botten - layoutHojd) + 'px';
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
    const hinderTraff = ray.intersectObjects(hinderGrupp.children, true)[0];
    if (valtHinder && markTraff) {
      stallHinder({ typ: valtHinder, x: markTraff.point.x, z: markTraff.point.z });
      spara();
      visaTerrang(valtHinder, markTraff.point);
      status.textContent = (terrangPaket.typer.get(valtHinder)?.namn || 'Hinder') + ' är utställt.';
      return;
    }
    if (traffad && !valdEnhet) {
      valj(traffad);
      return;
    }
    if (!markTraff && !hinderTraff) return;
    if (!markTraff) {
      const traffadHinder = hinderIdAv(hinderTraff.object);
      const post = hinder.find((rad) => rad.id === traffadHinder);
      if (post) visaTerrang(post.typ, post);
      return;
    }
    const hinderId = hinderIdAv(hinderTraff?.object);
    if (spellage !== 'stall') {
      matareMal = { typ: 'mark' };
      if (hinderId) visaTerrang(hinder.find((post) => post.id === hinderId)?.typ, markTraff.point);
      else if (markTraff) visaTerrang(null, markTraff.point);
      return;
    }
    if (hinderId && !valdEnhet) {
      const post = hinder.find((rad) => rad.id === hinderId);
      visaTerrang(post?.typ, markTraff?.point || post);
      status.textContent = (terrangPaket.typer.get(post?.typ)?.namn || 'Hinder') + '. Tryck på Ta bort om det ska väck.';
      valdPlacering = null;
      flyttaId = null;
      el.dataset.hinderValt = hinderId;
      el.querySelector('[data-tabort]').hidden = false;
      return;
    }
    if (valdEnhet && markTraff) stallUt({ enhet: valdEnhet, x: markTraff.point.x, z: markTraff.point.z, yaw: 0 }, true);
    else if (traffad) valj(traffad);
    else if (markTraff) {
      matareMal = { typ: 'mark' };
      visaTerrang(null, markTraff.point);
    }
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
    const fargHex = rad.sida === 'rod' ? 0xb42323 : rad.sida === 'bla' ? 0x2458c9 : 0x8a8474;
    const ring = new Mesh(new RingGeometry(1.35, 1.55, 40), new MeshBasicMaterial({ color: fargHex, side: DoubleSide, depthWrite: false, depthTest: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.2;
    ring.renderOrder = 2;
    const skugga = new Mesh(new CircleGeometry(1.4, 12), new MeshBasicMaterial({ color: 0x1b241c, transparent: true, opacity: 0.28, depthWrite: false }));
    skugga.rotation.x = -Math.PI / 2;
    skugga.position.y = 0.08;
    skugga.name = 'skuggproxy';
    const valjare = new Mesh(new CylinderGeometry(1.1, 1.1, 2.2, 6, 1, true), new MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
    valjare.position.y = 1.2;
    valjare.userData.placering = id;
    grupp.add(skugga, ring, valjare);
    enhetsGrupp.add(grupp);
    rad.grupp = grupp;
    rad.ring = ring;
    rad.skugga = skugga;
    rad.valjare = valjare;
    rad.tagg = skapaEtikett(poster.get(rad.enhet)?.namn || rad.enhet, rad.sida);
    placeringar.push(rad);
    const meta = poster.get(rad.enhet);
    let kropp = null;
    if (meta) {
      try {
        const pack = await hamtaEnhet(meta.fil);
        rad.ganglag = ganglagAv(pack.visning);
        rad.vapen = vapenAv(pack.visning);
        const nivaer = placeringsNivaer(pack.visning.modeller);
        if (nivaer.mobil) {
          const nara = klonaMall(await laddaMall(renderer, meta.fil, nivaer.mobil));
          grupp.add(nara);
          const yaw = riktaOchSatt(nara);
          let fjarr = nara;
          if (nivaer.enkel && nivaer.enkel.fil !== nivaer.mobil.fil) {
            fjarr = klonaMall(await laddaMall(renderer, meta.fil, nivaer.enkel));
            grupp.add(fjarr);
            riktaOchSatt(fjarr, yaw);
            fjarr.visible = false;
          }
          rad.nara = nara;
          rad.fjarr = fjarr;
          rad.lod = 'mobil';
          kropp = nara;
          rad.visning = 'modell';
        }
      } catch {
        kropp = null;
      }
    }
    if (!kropp) {
      kropp = platshallare(meta ? (await hamtaEnhet(meta.fil).catch(() => null))?.visning : null);
      grupp.add(kropp);
      rad.visning = 'platshallare';
    }
    rad.kropp = kropp;
    kropp.traverse?.((nod) => { nod.renderOrder = 3; });
    passaRing(rad);
    if (fragaSida) {
      await valjSida(rad);
    } else {
      ritaLista();
    }
    return rad;
  }

  function platshallare(enhet) {
    const trupp = truppVisning(enhet || {});
    const grupp = new Group();
    const matta = new MeshStandardMaterial({ color: 0x6d7268, roughness: 0.9, metalness: 0.02 });
    if (trupp === 'Infanteri') {
      const kropp = new Mesh(new BoxGeometry(0.42, 1.05, 0.26), matta);
      kropp.position.y = 0.72;
      const huvud = new Mesh(new BoxGeometry(0.22, 0.24, 0.22), matta);
      huvud.position.y = 1.38;
      grupp.add(kropp, huvud);
    } else {
      const skrov = new Mesh(new BoxGeometry(3.2, 1.15, 6.4), matta);
      skrov.position.y = 0.72;
      const torn = new Mesh(new BoxGeometry(1.8, 0.72, 2.2), matta);
      torn.position.set(0, 1.58, -0.25);
      const eldror = new Mesh(new BoxGeometry(0.18, 0.18, 2.8), matta);
      eldror.position.set(0, 1.7, 2.3);
      grupp.add(skrov, torn, eldror);
    }
    return grupp;
  }

  function riktaOchSatt(objekt, yaw) {
    objekt.rotation.y = 0;
    objekt.position.y = 0;
    objekt.updateWorldMatrix(true, true);
    let box = new Box3().setFromObject(objekt);
    const storlek = box.getSize(new Vector3());
    if (yaw == null) yaw = storlek.x > storlek.z * 1.2 ? Math.PI / 2 : 0;
    objekt.rotation.y = yaw;
    objekt.updateWorldMatrix(true, true);
    box = new Box3().setFromObject(objekt);
    const parentY = objekt.parent ? objekt.parent.getWorldPosition(new Vector3()).y : 0;
    objekt.position.y -= box.min.y - parentY;
    return yaw;
  }

  function passaRing(rad) {
    const box = new Box3().setFromObject(rad.kropp);
    const storlek = box.getSize(new Vector3());
    const radie = Math.max(0.9, Math.max(storlek.x, storlek.z) * 0.68);
    const tjock = Math.max(0.07, Math.min(0.18, radie * 0.045));
    rad.ring.geometry.dispose();
    rad.ring.geometry = new RingGeometry(Math.max(0.2, radie - tjock), radie, 48);
    rad.skugga.scale.setScalar(radie / 1.4);
    rad.valjare.scale.set(Math.max(0.8, radie / 1.6), 1, Math.max(0.8, radie / 1.6));
    rad.etikettHojd = Math.max(1.6, storlek.y + 0.4);
  }

  function skapaEtikett(namn, sida) {
    const lager = el.querySelector('[data-etiketter]');
    const tagg = document.createElement('div');
    tagg.className = 'enhets-etikett ' + (sida === 'rod' ? 'rod' : sida === 'bla' ? 'bla' : 'neutral');
    tagg.textContent = namn;
    lager.append(tagg);
    return tagg;
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
        rad.ring.material.color.set(sida === 'rod' ? 0xb42323 : 0x2458c9);
        if (rad.tagg) {
          rad.tagg.className = 'enhets-etikett ' + (sida === 'rod' ? 'rod' : 'bla');
        }
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
      matareMal = { typ: 'enhet', id: valdPlacering.id };
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
    post.tagg?.remove();
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
      })),
      hinder: hinder.filter((post) => !post.forstord).map(({ id, typ, x, z }) => ({
        id, typ, x: runda(x), z: runda(z)
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
    const klarKnapp = el.querySelector('[data-klar]');
    if (klarKnapp) klarKnapp.hidden = spellage !== 'stall' || klara.length < 1;
    el.querySelector('[data-lista]').innerHTML = klara.map((post) => {
      const namn = poster.get(post.enhet)?.namn || post.enhet;
      const meta = poster.get(post.enhet);
      const statusText = meta ? statusNamn(meta.status) : 'Under utveckling';
      return `<li data-placering="${esc(post.id)}" data-enhet-id="${esc(post.enhet)}" data-visning="${esc(post.visning || '')}" data-lod="${esc(post.lod || '')}" data-x="${runda(post.x)}" data-z="${runda(post.z)}" data-y="${runda(post.grupp.position.y)}" data-sida="${esc(post.sida)}">
        <button type="button" data-id="${esc(post.id)}" data-handling="valj"><strong>${esc(namn)}</strong><small>${post.sida === 'bla' ? 'Blå' : 'Röd'} · ${esc(statusText)}</small></button>
        <button type="button" data-id="${esc(post.id)}" data-handling="flytta">Flytta</button>
        <button type="button" data-id="${esc(post.id)}" data-handling="tabort">Ta bort</button>
      </li>`;
    }).join('') || '<li class="tomrad">Inget utställt ännu.</li>';
    const valdText = valdEnhet ? (poster.get(valdEnhet)?.namn || valdEnhet) : null;
    const hinderNamn = valtHinder ? terrangPaket.typer.get(valtHinder)?.namn : null;
    el.querySelector('[data-vald]').textContent = hinderNamn
      ? `Tryck på marken för att ställa ut ${hinderNamn}.`
      : valdText
        ? `Tryck på marken för att ställa ut ${valdText}.`
        : 'Välj en enhet eller ett hinder, och tryck på marken.';
  }

  function oppnaBibliotek() {
    const ark = el.querySelector('[data-ark]');
    const rader = (katalog && katalog.length ? katalog : raderFranIndex(index)).map((rad) => ({
      enhet: rad.enhet || rad,
      check: rad.check || { niva: rad.utvecklingsniva || (rad.status === 'klar' ? 'klar' : '3_tidigt_skede'), status: rad.status }
    }));
    ark.hidden = false;
    ark.innerHTML = `
      <div class="ark-kort ark-lang" role="dialog" aria-label="Välj enhet">
        <div class="radknappar"><h2>Välj enhet</h2><button type="button" class="textknapp" data-stang>Stäng</button></div>
        <input type="search" data-sok-enhet placeholder="Sök" aria-label="Sök enhet">
        <div data-enhetslista>${ritaEnhetstrad(rader, ritaValRad)}</div>
      </div>`;
    kopplaMappminne(ark);
    ark.querySelector('[data-sok-enhet]').addEventListener('input', (handelse) => {
      filtreraMappar(ark, handelse.target.value);
    });
    ark.onclick = (handelse) => {
      if (handelse.target.closest('[data-stang]')) { ark.hidden = true; return; }
      const knapp = handelse.target.closest('[data-enhet]');
      if (!knapp) return;
      valdEnhet = knapp.dataset.enhet;
      valtHinder = null;
      flyttaId = null;
      ark.hidden = true;
      ritaLista();
      status.textContent = 'Tryck på marken. Sedan väljer du blå eller röd.';
    };
  }

  function oppnaHinder() {
    const ark = el.querySelector('[data-ark]');
    ark.hidden = false;
    ark.innerHTML = `
      <div class="ark-kort ark-lang" role="dialog" aria-label="Välj hinder">
        <div class="radknappar"><h2>Hinder och mark</h2><button type="button" class="textknapp" data-stang>Stäng</button></div>
        <p class="fin">Värdena är uppskattade. Gul färg betyder det.</p>
        ${ritaHinderlista(terrangPaket.data.typer || [])}
      </div>`;
    ark.onclick = (handelse) => {
      if (handelse.target.closest('[data-stang]')) { ark.hidden = true; return; }
      const knapp = handelse.target.closest('[data-hinder-typ]');
      if (!knapp) return;
      valtHinder = knapp.dataset.hinderTyp;
      valdEnhet = null;
      flyttaId = null;
      ark.hidden = true;
      ritaLista();
      status.textContent = 'Tryck på marken för att ställa ut ' + (terrangPaket.typer.get(valtHinder)?.namn || 'hindret') + '.';
    };
  }

  function formEtikett(x, z) {
    const karta = valdVarld.typ === 'form' ? valdVarld.post?.analysis : null;
    if (!karta?.labels || !formMark) return null;
    const u = x / formMark.bredd + 0.5;
    const v = z / formMark.djup + 0.5;
    if (u < 0 || v < 0 || u > 1 || v > 1) return null;
    const col = Math.min(karta.width - 1, Math.max(0, Math.floor(u * karta.width)));
    const rad = Math.min(karta.height - 1, Math.max(0, Math.floor(v * karta.height)));
    return karta.labels[rad * karta.width + col];
  }

  function markUnder(x, z) {
    const etikett = formEtikett(x, z);
    const id = markId(terrangPaket.data, etikett);
    const markTyp = terrangPaket.typer.get(id) || terrangPaket.typer.get('ang');
    return typVid(x, z, hinder, markTyp, terrangPaket.typer) || markTyp;
  }

  function visaTerrang(typId, punkt) {
    const falt = el.querySelector('[data-terrangfalt]');
    if (!falt) return;
    let typ = typId ? terrangPaket.typer.get(typId) : null;
    const tomKarta = valdVarld.typ !== 'form';
    if (!typ && punkt) typ = markUnder(punkt.x, punkt.z);
    falt.innerHTML = ritaTerrangkort(typ, { tomKarta: tomKarta && !typId });
  }

  function stallHinder(post) {
    const typ = terrangPaket.typer.get(post.typ);
    if (!typ) return null;
    const id = post.id || 'h' + Math.random().toString(36).slice(2, 8);
    const hojdMesh = Math.max(0.2, Number(typ.hojd_m) || 0.2);
    const langd = Math.max(1.4, (Number(typ.radie_m) || 2) * 2);
    const geo = (typ.hojd_m || 0) > 0.5
      ? new BoxGeometry(langd, hojdMesh, Math.min(1.4, langd * 0.28))
      : new CylinderGeometry(Math.max(0.8, typ.radie_m || 2), Math.max(0.8, typ.radie_m || 2), 0.25, 18);
    const mesh = new Mesh(geo, new MeshStandardMaterial({ color: FARG[typ.id] || 0x6a6248, roughness: 1, metalness: 0 }));
    mesh.position.set(post.x, hojd(post.x, post.z) + ((typ.hojd_m || 0) > 0.5 ? hojdMesh / 2 : 0.14), post.z);
    mesh.userData.hinder = id;
    mesh.frustumCulled = true;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    hinderGrupp.add(mesh);
    const rad = { id, typ: typ.id, x: post.x, z: post.z, mesh, forstord: false };
    hinder.push(rad);
    el.dataset.hinder = String(hinder.filter((postH) => !postH.forstord).length);
    return rad;
  }

  function taBortHinder(id) {
    const index = hinder.findIndex((post) => post.id === id);
    if (index < 0) return;
    const post = hinder[index];
    post.mesh?.removeFromParent();
    post.mesh?.geometry?.dispose();
    post.mesh?.material?.dispose();
    hinder.splice(index, 1);
    delete el.dataset.hinderValt;
    el.querySelector('[data-tabort]').hidden = !valdPlacering;
    el.dataset.hinder = String(hinder.length);
    spara();
  }

  function minaVid(post) {
    post.minor = post.minor || new Set();
    for (const rad of hinder) {
      if (rad.forstord || post.minor.has(rad.id)) continue;
      const typ = terrangPaket.typer.get(rad.typ);
      if (!typ || !(typ.skada_vid_intrad?.varde > 0)) continue;
      if (Math.hypot(rad.x - post.x, rad.z - post.z) > (typ.radie_m || 0)) continue;
      post.minor.add(rad.id);
      post.hp = (post.hp ?? 100) - typ.skada_vid_intrad.varde;
      status.textContent = typ.namn + ' skadade enheten.';
      if (post.hp <= 0 && post.grupp) post.grupp.visible = false;
    }
  }

  function ritaValRad(rad) {
    const enhet = rad.enhet;
    const sok = `${enhet.namn} ${nationVisning(enhet.nation)} ${vapenslag(enhet)} ${enhet.id}`.toLowerCase();
    return `<button type="button" class="rad" data-enhet="${esc(enhet.id)}" data-sok="${esc(sok)}">
      <span><strong>${esc(enhet.namn)}</strong><small>${esc(nationVisning(enhet.nation))} · ${esc(vapenslag(enhet))}</small></span>
    </button>`;
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
  function stang() {
    kor = false;
    cancelAnimationFrame(ram);
    removeEventListener('resize', passa);
    släpp(markGrupp);
    renderer.dispose();
  }
  visa(!el.hidden);

  return { visa, passa, stang };
}

function släpp(rot) {
  const geometrier = new Set();
  const material = new Set();
  const texturer = new Set();
  rot.traverse((nod) => {
    if (!nod.isMesh) return;
    if (nod.isInstancedMesh) nod.dispose();
    if (nod.geometry) geometrier.add(nod.geometry);
    const lista = Array.isArray(nod.material) ? nod.material : [nod.material];
    for (const mat of lista) {
      if (!mat) continue;
      material.add(mat);
      for (const varde of Object.values(mat)) {
        if (varde?.isTexture) texturer.add(varde);
      }
    }
  });
  for (const geo of geometrier) geo.dispose();
  for (const mat of material) mat.dispose();
  for (const tex of texturer) tex.dispose();
}

function raderFranIndex(index) {
  return (index?.enheter || []).map((post) => ({
    enhet: post,
    check: {
      niva: post.status === 'klar' ? 'klar' : (post.utvecklingsniva || '3_tidigt_skede'),
      status: post.status
    }
  }));
}

function hinderIdAv(objekt) {
  let nod = objekt;
  while (nod) {
    if (nod.userData?.hinder) return nod.userData.hinder;
    nod = nod.parent;
  }
  return null;
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
