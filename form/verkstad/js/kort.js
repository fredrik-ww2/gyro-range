import { OrbitControls } from '../vendor/OrbitControls.js';
import {
  Box3, Color, DirectionalLight, HemisphereLight, PerspectiveCamera,
  Scene, Vector3, WebGLRenderer, TOUCH
} from 'three';
import { skrivOverrid } from './spara.js';
import { klonaMall, laddaMall } from './modeller.js';
import {
  NIVA_NAMN, TERRANG, checklista, esc, fartSammanfattning, hamta, mobilRapport, placeringsNivaer,
  markeText, reglageSteg, reglageTak, ritaChecklista, statusNamn, stapelAndel, stridsrader, svarAndel, tal
} from './data.js';

const AVSTAND = ['100', '250', '500', '1000', '1500', '2000'];

export function monteraKort(el, { original, overrid, visning, beteende, tillbaka }) {
  if (el._stopp) el._stopp();
  const enhet = visning;
  const modell = narModell(enhet.modeller);
  const startCheck = checklista(enhet);
  const niva = startCheck.niva === 'klar' ? 'Klar' : (NIVA_NAMN[startCheck.niva] || '');
  el.innerHTML = `
    <header class="topp">
      <button type="button" class="tillbaka" data-tillbaka>Bibliotek</button>
      <div>
        <p class="ogat">${esc(enhet.nation)} · ${esc(enhet.typ)}</p>
        <h1>${esc(enhet.namn)}</h1>
      </div>
    </header>
    <p class="statusrad" data-status="${esc(startCheck.status)}" data-niva="${esc(startCheck.niva)}">
      <span class="chip ${startCheck.status === 'klar' ? 'chip-klar' : 'chip-arbete'}">${esc(statusNamn(startCheck.status))}${niva && startCheck.status !== 'klar' ? ' · ' + esc(niva) : ''}</span>
    </p>
    <p class="varning">En 3D-modell gör inte enheten färdig. Vägen till klar står i checklistan.</p>
    <div data-check-hallare>${ritaChecklista(startCheck)}</div>
    <div class="forhands" data-forhands>
      <div class="forhands-yta" data-yta></div>
      <p class="hint" data-modellrad>${modell
        ? `Närbild · ${tal(modell.trianglar, 0)} trianglar${(modell.trianglar || 0) <= 12 || modell.roll === 'impostor' ? ' · förenklad platshållare' : ''}`
        : 'Ingen 3D-modell levererad.'}</p>
    </div>
    <div class="flikar" role="tablist">
      <button type="button" role="tab" id="tab-varden" aria-selected="true" aria-controls="panel-varden" data-tab="varden">Stridsvärden</button>
      <button type="button" role="tab" id="tab-beteende" aria-selected="false" aria-controls="panel-beteende" data-tab="beteende">Beteende</button>
      <button type="button" role="tab" id="tab-mobil" aria-selected="false" aria-controls="panel-mobil" data-tab="mobil">Mobil</button>
      <button type="button" role="tab" id="tab-saknas" aria-selected="false" aria-controls="panel-saknas" data-tab="saknas">Saknas</button>
    </div>
    <div id="panel-varden" role="tabpanel" aria-labelledby="tab-varden" data-panel="varden">
      ${stridsTabell(enhet)}
      ${stapelBlock('Fart på väg', 'fart_per_terrang.vag', enhet, { enhetText: 'km/h' })}
      <section class="grafgrupp">
        <h2>Eldkraft</h2>
        <p class="fin">Kaliber och eldhastighet visas var för sig. Ingen samlad styrkesiffra.</p>
        ${stapelBlock('Kaliber', 'eldkraft.kaliber_mm', enhet)}
        ${stapelBlock('Eldhastighet', 'eldkraft.eldhastighet_skott_min', enhet, { logg: true })}
      </section>
      ${stapelBlock('Pansar fram', 'pansar.fram', enhet)}
      <section class="grafgrupp" data-pansar>
        <h2>Pansar uppifrån</h2>
        <p class="fin">Färg efter skrovets plåttjocklek. Taket är ytan i mitten. Inte vinklad verkan.</p>
        <div data-silhuett></div>
        ${stapelBlock('Sida', 'pansar.sida', enhet)}
        ${stapelBlock('Bak', 'pansar.bak', enhet)}
        ${stapelBlock('Tak', 'pansar.topp', enhet)}
      </section>
      ${stapelBlock('Räckvidd', 'rackvidd', enhet, { hjalp: 'Eldvapnets effektiva referensavstånd, inte körsträcka.' })}
      ${stapelBlock('Svår att upptäcka', 'upptackbarhet', enhet, { svar: true, hjalp: 'Siffran är avståndet där enheten brukar synas på öppen mark. Längre stapel betyder svårare att se.' })}
      <section class="grafgrupp" data-traff>
        <h2>Träffchans över avstånd</h2>
        <p class="fin">Provisorisk kurva för stillastående skytt och fri sikt. Inte en garanti i strid.</p>
        <div data-kurva></div>
        ${AVSTAND.map((avstand) => stapelBlock(avstand + ' m', 'traffchans_per_avstand.' + avstand, enhet, { andel: true })).join('')}
      </section>
      <section class="grafgrupp" data-fart-grupp>
        <h2>Fart i terräng</h2>
        <p class="sammanfattning" data-sammanfattning>${esc(fartSammanfattning(enhet.spelvarden.fart_per_terrang))}</p>
        <button type="button" class="knapp" data-fordjupa aria-expanded="false">Fördjupa</button>
        <div data-terrang-panel hidden>
          ${TERRANG.filter(([nyckel]) => nyckel !== 'vag').map(([nyckel, namn]) => stapelBlock(namn.charAt(0).toUpperCase() + namn.slice(1), 'fart_per_terrang.' + nyckel, enhet)).join('')}
          <p class="fin">Vägfarten ändras i den stora stapeln ovan.</p>
        </div>
      </section>
    </div>
    <div id="panel-beteende" role="tabpanel" aria-labelledby="tab-beteende" data-panel="beteende" hidden>
      <h2>Individbeteende som finns</h2>
      <p class="fin">Det här är de gemensamma reglerna enheten kan följa. En egen regelbok för just den här enheten finns inte.</p>
      ${beteendePanel(enhet, beteende, overrid)}
    </div>
    <div id="panel-mobil" role="tabpanel" aria-labelledby="tab-mobil" data-panel="mobil" hidden>
      <h2>Mobilanpassning</h2>
      ${mobilPanel(enhet)}
    </div>
    <div id="panel-saknas" role="tabpanel" aria-labelledby="tab-saknas" data-panel="saknas" hidden>
      <h2>Vad saknas för att bli färdig</h2>
      ${saknasPanel(enhet, startCheck)}
    </div>
    <p class="sparrad" data-sparrad aria-live="polite"></p>
    <p class="fin">Fastpunkter: ${esc(fastpunktText(enhet.fastpunkter))}. Effekter kopplas bara via det gemensamma biblioteket och spelas inte här.</p>
  `;

  overrid.spelvarden = overrid.spelvarden || {};
  overrid.beteende = overrid.beteende || {};
  for (const sokvag of Object.keys(overrid.spelvarden)) {
    const ater = el.querySelector(`[data-aterstall="${CSS.escape(sokvag)}"]`);
    if (ater) ater.hidden = false;
  }
  el.querySelector('[data-tillbaka]').addEventListener('click', tillbaka);
  el.querySelector('[data-fordjupa]').addEventListener('click', () => {
    const knapp = el.querySelector('[data-fordjupa]');
    const panel = el.querySelector('[data-terrang-panel]');
    const oppen = knapp.getAttribute('aria-expanded') !== 'true';
    knapp.setAttribute('aria-expanded', oppen ? 'true' : 'false');
    knapp.textContent = oppen ? 'Dölj terräng' : 'Fördjupa';
    panel.hidden = !oppen;
  });
  el.querySelectorAll('[data-tab]').forEach((knapp) => {
    knapp.addEventListener('click', () => {
      const namn = knapp.dataset.tab;
      el.querySelectorAll('[data-tab]').forEach((annan) => annan.setAttribute('aria-selected', annan === knapp ? 'true' : 'false'));
      el.querySelectorAll('[data-panel]').forEach((panel) => { panel.hidden = panel.dataset.panel !== namn; });
    });
  });

  const drag = new Map();
  el.addEventListener('pointerdown', (handelse) => {
    const input = handelse.target.closest('input[data-sokvag], input[data-reglage]');
    if (!input) return;
    if (input.dataset.sokvag) {
      const nod = hamta(enhet.spelvarden, input.dataset.sokvag);
      drag.set(input.dataset.sokvag, { varde: nod.varde, ursprung: nod.ursprung, andringshistorik: nod.andringshistorik || [] });
    } else {
      const id = input.dataset.reglage;
      const nu = beteendeNu(id);
      drag.set('beteende:' + id, nu);
    }
  });
  el.addEventListener('input', (handelse) => {
    const input = handelse.target.closest('input[data-sokvag], input[data-reglage]');
    if (!input) return;
    if (input.dataset.sokvag) {
      const sokvag = input.dataset.sokvag;
      const nod = hamta(enhet.spelvarden, sokvag);
      if (!drag.has(sokvag)) drag.set(sokvag, { varde: nod.varde, ursprung: nod.ursprung, andringshistorik: nod.andringshistorik || [] });
      nod.varde = Number(input.value);
      ritaFalt(sokvag);
    } else {
      const id = input.dataset.reglage;
      const nyckel = 'beteende:' + id;
      if (!drag.has(nyckel)) drag.set(nyckel, { ...beteendeNu(id) });
      visaReglage(id, Number(input.value), drag.get(nyckel).ursprung);
    }
  });
  el.addEventListener('change', async (handelse) => {
    const input = handelse.target.closest('input[data-sokvag], input[data-reglage]');
    if (!input) return;
    if (input.dataset.sokvag) {
      const sokvag = input.dataset.sokvag;
      const nytt = Number(input.value);
      const fore = drag.get(sokvag);
      if (fore && nytt !== Number(fore.varde)) commitSpel(sokvag, nytt, fore);
      drag.delete(sokvag);
    } else {
      const id = input.dataset.reglage;
      const nytt = Number(input.value);
      const fore = drag.get('beteende:' + id);
      if (!fore || nytt !== Number(fore.varde)) commitBeteende(id, nytt, fore);
      drag.delete('beteende:' + id);
    }
    await spara('Sparat på den här telefonen');
  });
  el.addEventListener('click', async (handelse) => {
    const god = handelse.target.closest('[data-godkann]');
    const ater = handelse.target.closest('[data-aterstall]');
    const beteGod = handelse.target.closest('[data-godkann-reglage]');
    const beteAter = handelse.target.closest('[data-aterstall-reglage]');
    if (god) {
      const sokvag = god.dataset.godkann;
      const nod = hamta(enhet.spelvarden, sokvag);
      if (nod.ursprung !== 'anvandarbestamd') commitSpel(sokvag, nod.varde, nod);
      await spara('Godkänd. Märket är borta, men värdet räknas inte som källa.');
    }
    if (ater) {
      const sokvag = ater.dataset.aterstall;
      delete overrid.spelvarden[sokvag];
      const originalNod = hamta(original.spelvarden, sokvag);
      const nod = hamta(enhet.spelvarden, sokvag);
      nod.varde = originalNod.varde;
      nod.ursprung = originalNod.ursprung;
      delete nod.andringshistorik;
      const input = el.querySelector(`input[data-sokvag="${CSS.escape(sokvag)}"]`);
      if (input) input.value = String(nod.varde);
      ritaFalt(sokvag);
      await spara('Återställt till datapaketet');
    }
    if (beteGod) {
      const id = beteGod.dataset.godkannReglage;
      const nu = beteendeNu(id);
      if (nu.ursprung !== 'anvandarbestamd') commitBeteende(id, nu.varde, nu);
      await spara('Godkänd för den här enheten. Inte en källa.');
    }
    if (beteAter) {
      const id = beteAter.dataset.aterstallReglage;
      delete overrid.beteende[id];
      const reg = beteende.reglage.find((rad) => rad.id === id);
      visaReglage(id, reg.standard, reg.ursprung);
      const input = el.querySelector(`input[data-reglage="${CSS.escape(id)}"]`);
      if (input) input.value = String(reg.standard);
      await spara('Reglaget följer den gemensamma modulen igen');
    }
  });

  ritaKurva();
  ritaPansar();
  const stopp3d = startaForhands(el.querySelector('[data-yta]'), enhet, original);
  el._stopp = stopp3d;
  return stopp3d;

  function beteendeNu(id) {
    if (overrid.beteende?.[id]) return overrid.beteende[id];
    const reg = beteende.reglage.find((rad) => rad.id === id);
    return { varde: reg.standard, ursprung: reg.ursprung, andringshistorik: [] };
  }

  function commitSpel(sokvag, nytt, fore) {
    const historik = [...(fore.andringshistorik || [])];
    historik.push({ varde: fore.varde, ursprung: fore.ursprung, tid: new Date().toISOString() });
    overrid.spelvarden[sokvag] = { varde: nytt, ursprung: 'anvandarbestamd', andringshistorik: historik.slice(-12) };
    const nod = hamta(enhet.spelvarden, sokvag);
    nod.varde = nytt;
    nod.ursprung = 'anvandarbestamd';
    nod.andringshistorik = overrid.spelvarden[sokvag].andringshistorik;
    ritaFalt(sokvag);
  }

  function commitBeteende(id, nytt, fore) {
    const historik = [...(fore?.andringshistorik || [])];
    if (fore) historik.push({ varde: fore.varde, ursprung: fore.ursprung, tid: new Date().toISOString() });
    overrid.beteende[id] = {
      varde: nytt,
      ursprung: 'anvandarbestamd',
      modul: 'beteende/standard.json',
      andringshistorik: historik.slice(-12)
    };
    visaReglage(id, nytt, 'anvandarbestamd');
  }

  function ritaFalt(sokvag) {
    const nod = hamta(enhet.spelvarden, sokvag);
    const tak = reglageTak(sokvag, Math.max(nod.varde, hamta(original.spelvarden, sokvag)?.varde || 0));
    const andel = sokvag === 'upptackbarhet' ? svarAndel(nod.varde) : stapelAndel(sokvag, nod.varde, visTak(sokvag, tak));
    el.querySelectorAll(`[data-falt="${CSS.escape(sokvag)}"]`).forEach((block) => {
      block.dataset.ursprung = nod.ursprung;
      const marke = block.querySelector('[data-marke]');
      marke.textContent = markeText(nod.ursprung);
      marke.className = 'marke marke-' + nod.ursprung;
      marke.title = nod.ursprung === 'kalla' ? (nod.kallfalt || nod.kallfil || '') : '';
      const god = block.querySelector('[data-godkann]');
      if (god) god.hidden = nod.ursprung !== 'uppskattat';
      const ater = block.querySelector('[data-aterstall]');
      if (ater) ater.hidden = !overrid.spelvarden[sokvag];
      block.querySelector('[data-varde]').textContent = visaVarde(nod);
      block.querySelector('[data-andel]').style.width = (andel * 100).toFixed(1) + '%';
      const historik = block.querySelector('[data-historik]');
      if (historik) historik.textContent = historikText(nod);
    });
    el.querySelectorAll(`input[data-sokvag="${CSS.escape(sokvag)}"]`).forEach((input) => {
      if (document.activeElement !== input) input.value = String(nod.varde);
    });
    if (sokvag.startsWith('fart_per_terrang')) {
      el.querySelector('[data-sammanfattning]').textContent = fartSammanfattning(enhet.spelvarden.fart_per_terrang);
    }
    if (sokvag.startsWith('traffchans')) ritaKurva();
    if (sokvag.startsWith('pansar')) ritaPansar();
    uppdateraChecklista();
  }

  function uppdateraChecklista() {
    const check = checklista(enhet);
    const hallare = el.querySelector('[data-check-hallare]');
    if (hallare) hallare.innerHTML = ritaChecklista(check);
    const chip = el.querySelector('.statusrad .chip');
    const namn = check.niva === 'klar' ? 'Klar' : (NIVA_NAMN[check.niva] || '');
    if (chip) chip.textContent = statusNamn(check.status) + (namn && check.status !== 'klar' ? ' · ' + namn : '');
    const rad = el.querySelector('.statusrad');
    if (rad) {
      rad.dataset.status = check.status;
      rad.dataset.niva = check.niva;
    }
  }

  function ritaKurva() {
    const traff = enhet.spelvarden.traffchans_per_avstand;
    const bredd = 320;
    const hojd = 150;
    const kant = 28;
    const x = (d) => kant + ((d - 100) / 1900) * (bredd - kant - 10);
    const y = (v) => 14 + (1 - v) * (hojd - 42);
    const punkter = AVSTAND.map((nyckel) => ({ d: Number(nyckel), v: Number(traff[nyckel]?.varde) || 0 }));
    const linje = punkter.map((punkt, i) => `${i ? 'L' : 'M'}${x(punkt.d).toFixed(1)},${y(punkt.v).toFixed(1)}`).join(' ');
    const prickar = punkter.map((punkt) => `<circle cx="${x(punkt.d).toFixed(1)}" cy="${y(punkt.v).toFixed(1)}" r="4.5" />`).join('');
    const axel = [0, 0.5, 1].map((v) => `<text x="2" y="${(y(v) + 4).toFixed(1)}">${Math.round(v * 100)}%</text>`).join('');
    const botten = punkter.filter((_, i) => i % 2 === 0).map((punkt) => `<text x="${x(punkt.d).toFixed(1)}" y="${hojd - 4}" text-anchor="middle">${punkt.d}</text>`).join('');
    el.querySelector('[data-kurva]').innerHTML = `
      <svg viewBox="0 0 ${bredd} ${hojd}" role="img" aria-label="Träffchans från 100 till 2000 meter">
        <line x1="${kant}" y1="${y(0)}" x2="${bredd - 8}" y2="${y(0)}" class="axel" />
        <line x1="${kant}" y1="${y(1)}" x2="${kant}" y2="${y(0)}" class="axel" />
        <path d="${linje}" />
        ${prickar}${axel}${botten}
      </svg>`;
  }

  function ritaPansar() {
    const p = enhet.spelvarden.pansar;
    const f = (nod) => pansarFarg(nod.varde);
    el.querySelector('[data-silhuett]').innerHTML = `
      <svg viewBox="0 0 220 250" class="silhuett" role="img" aria-label="Pansar sett uppifrån">
        <polygon points="78,34 142,34 168,78 168,188 52,188 52,78" fill="${f(p.topp)}" />
        <polygon points="86,16 134,16 150,46 70,46" fill="${f(p.fram)}" />
        <polygon points="52,86 74,74 74,180 52,188" fill="${f(p.sida)}" />
        <polygon points="168,86 146,74 146,180 168,188" fill="${f(p.sida)}" />
        <polygon points="74,180 146,180 162,214 58,214" fill="${f(p.bak)}" />
        <circle cx="110" cy="124" r="26" fill="${f(p.topp)}" />
        <text x="110" y="30" text-anchor="middle">fram ${esc(tal(p.fram.varde))} mm</text>
        <text x="28" y="130" text-anchor="middle" transform="rotate(-90 28 130)">sida</text>
        <text x="110" y="236" text-anchor="middle">bak ${esc(tal(p.bak.varde))} mm</text>
        <text x="110" y="128" text-anchor="middle">tak</text>
      </svg>
      <p class="fin">Tunn plåt är ljus, tjock plåt är mörk.</p>`;
  }

  function visaReglage(id, varde, ursprung) {
    const block = el.querySelector(`[data-reglage-block="${CSS.escape(id)}"]`);
    if (!block) return;
    block.dataset.ursprung = ursprung;
    const marke = block.querySelector('[data-marke]');
    marke.textContent = markeText(ursprung);
    marke.className = 'marke marke-' + ursprung;
    block.querySelector('[data-godkann-reglage]').hidden = ursprung !== 'uppskattat';
    block.querySelector('[data-aterstall-reglage]').hidden = !overrid.beteende[id];
    const reg = beteende.reglage.find((rad) => rad.id === id);
    block.querySelector('[data-varde]').textContent = id === 'eldlage' ? eldlageText(varde) : tal(varde) + (reg.enhet === 'andel' ? '' : ' ' + reg.enhet);
    const andel = (Number(varde) - reg.min) / (reg.max - reg.min || 1);
    block.querySelector('[data-andel]').style.width = (Math.max(0, Math.min(1, andel)) * 100).toFixed(1) + '%';
  }

  async function spara(text) {
    overrid.enhet = original.id;
    overrid.schema = 'form.verkstad.overrid.v1';
    await skrivOverrid(original.id, overrid);
    const rad = el.querySelector('[data-sparrad]');
    rad.textContent = text;
    el.dataset.sparad = String(Date.now());
  }
}

function narModell(modeller) {
  return placeringsNivaer(modeller).mobil || null;
}

function startaForhands(yta, enhet, original) {
  const modell = narModell(enhet.modeller);
  if (!modell || !yta) return () => {};
  let stopp = false;
  let renderer;
  let ram = 0;
  (async () => {
    renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = 'srgb';
    renderer.setClearColor(new Color('#e4ece3'), 1);
    yta.append(renderer.domElement);
    if (stopp) return;
    const scen = new Scene();
    scen.add(new HemisphereLight(0xf7f8f4, 0x7d8872, 1.15));
    const sol = new DirectionalLight(0xffffff, 1.35);
    sol.position.set(3, 5, 4);
    scen.add(sol);
    const kamera = new PerspectiveCamera(35, 1, 0.05, 200);
    const controls = new OrbitControls(kamera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.touches.ONE = TOUCH.ROTATE;
    controls.touches.TWO = TOUCH.DOLLY_PAN;
    let objekt;
    try {
      const mall = await laddaMall(renderer, 'enheter/' + original.id + '/enhet.json', modell);
      if (stopp) return;
      objekt = klonaMall(mall);
      scen.add(objekt);
    } catch {
      yta.insertAdjacentHTML('beforeend', '<p class="varning">Modellen gick inte att visa. Enheten är fortfarande under utveckling.</p>');
      return;
    }
    const box = new Box3().setFromObject(objekt);
    const mitt = box.getCenter(new Vector3());
    const storlek = Math.max(0.4, box.getSize(new Vector3()).length());
    controls.target.copy(mitt);
    kamera.position.copy(mitt).add(new Vector3(storlek * 0.55, storlek * 0.38, storlek * 0.72));
    kamera.near = Math.max(0.01, storlek / 80);
    kamera.far = storlek * 30;
    kamera.updateProjectionMatrix();
    const passa = () => {
      const w = yta.clientWidth || 320;
      const h = yta.clientHeight || 220;
      renderer.setSize(w, h, false);
      kamera.aspect = w / Math.max(1, h);
      kamera.updateProjectionMatrix();
    };
    passa();
    addEventListener('resize', passa);
    const bild = () => {
      if (stopp) return;
      ram = requestAnimationFrame(bild);
      controls.update();
      renderer.render(scen, kamera);
    };
    bild();
    yta._passa = passa;
  })();
  return () => {
    stopp = true;
    cancelAnimationFrame(ram);
    if (yta._passa) removeEventListener('resize', yta._passa);
    renderer?.dispose();
    renderer?.forceContextLoss?.();
    renderer?.domElement.remove();
  };
}

function mattRad(namn, text, farg) {
  return `<li class="matt-${esc(farg)}" data-matt="${esc(namn)}"><span>${esc(namn)}</span><strong>${esc(text)}</strong></li>`;
}

function mobilPanel(enhet) {
  const rapport = mobilRapport(enhet);
  const nivaer = rapport.rader.map((rad) => mattRad(rad.namn, rad.text, rad.farg)).join('');
  return `
    <ul class="mattlista" data-mobil>
      ${nivaer}
      ${mattRad('LOD-nivåer', String(rapport.antalNivaer) + ' av 3', rapport.nivaFarg)}
      ${mattRad('Texturer', rapport.texturText, rapport.texturFarg)}
      ${mattRad('Filstorlek', rapport.bytesText, rapport.bytesFarg)}
      ${mattRad('Komprimering', rapport.komprimering, rapport.komprimeringFarg)}
      ${mattRad('Skuggproxy', rapport.skuggproxy, rapport.skuggFarg)}
    </ul>
    <p class="fin">Grönt är inom gränsen för en enhet på iPhone. Gult är tätt. Rött är för tungt eller saknas.</p>`;
}

function stridsTabell(enhet) {
  const rader = stridsrader(enhet).map((rad) => `
    <tr data-strid="${esc(rad.stig)}" data-marke="${esc(rad.marke)}">
      <td>${esc(rad.stig)}</td>
      <td>${esc(rad.text)}</td>
      <td class="matt-${esc(rad.farg)}">${esc(rad.marke)}</td>
    </tr>`).join('');
  return `
    <section class="grafgrupp" data-stridstabell>
      <h2>Alla stridsvärden</h2>
      <p class="fin">Källa är hämtat. Uppskattat är en gissning. Saknas betyder att värdet inte finns.</p>
      <table class="stridstabell"><tbody>${rader}</tbody></table>
    </section>`;
}

function saknasPanel(enhet, check) {
  const finns = check.punkter.filter((punkt) => punkt.ok);
  const saknas = check.punkter.filter((punkt) => !punkt.ok);
  const extra = (enhet.saknas || []).map((rad) => `<li class="saknas">${esc(rad)}</li>`).join('');
  return `
    <section data-saknas-panel>
      <h3>Finns</h3>
      <ul>${finns.map((punkt) => `<li class="ok">${esc(punkt.text)}</li>`).join('') || '<li>Inget är ikryssat ännu.</li>'}</ul>
      <h3>Saknas</h3>
      <ul>${saknas.map((punkt) => `<li class="saknas">${esc(punkt.text)}</li>`).join('') || '<li>Inget saknas på checklistan.</li>'}</ul>
      ${extra ? `<h3>Övrigt som datapaketet nämner</h3><ul>${extra}</ul>` : ''}
      <p class="fin">Eget individbeteende för just den här enheten saknas. De gemensamma reglerna ligger under Beteende.</p>
    </section>`;
}

function stapelBlock(rubrik, sokvag, enhet, extra = {}) {
  const nod = hamta(enhet.spelvarden, sokvag);
  if (!nod) return '';
  const originalVarde = nod.varde;
  const tak = reglageTak(sokvag, originalVarde);
  const andel = extra.svar ? svarAndel(nod.varde) : stapelAndel(sokvag, nod.varde, visTak(sokvag, tak));
  const min = sokvag.startsWith('traffchans') ? 0 : 0;
  const steg = extra.andel || nod.enhet === 'andel' ? 0.01 : reglageSteg(nod.enhet);
  return `
    <section class="stapelblock" data-falt="${esc(sokvag)}" data-ursprung="${esc(nod.ursprung)}">
      <div class="stapelhuvud">
        <h3>${esc(rubrik)}</h3>
        <strong data-varde>${esc(visaVarde(nod))}</strong>
        <span class="marke marke-${esc(nod.ursprung)}" data-marke ${nod.ursprung === 'kalla' ? `title="${esc(nod.kallfalt || nod.kallfil || '')}"` : ''}>${esc(markeText(nod.ursprung))}</span>
      </div>
      ${extra.hjalp ? `<p class="fin">${esc(extra.hjalp)}</p>` : ''}
      ${extra.logg ? '<p class="fin">Stapeln för eldhastighet är logaritmisk så både kanon och kulspruta syns. Siffran är spelvärdet.</p>' : ''}
      <div class="stapel" aria-hidden="true"><i data-andel style="width:${(andel * 100).toFixed(1)}%"></i></div>
      <input type="range" data-sokvag="${esc(sokvag)}" min="${min}" max="${tak}" step="${steg}" value="${Number(nod.varde)}" aria-label="${esc(rubrik)}">
      <div class="radknappar">
        <button type="button" class="textknapp" data-godkann="${esc(sokvag)}" ${nod.ursprung === 'uppskattat' ? '' : 'hidden'}>Godkänn</button>
        <button type="button" class="textknapp" data-aterstall="${esc(sokvag)}" hidden>Återställ</button>
      </div>
      <p class="historik" data-historik>${esc(historikText(nod))}</p>
    </section>`;
}

function visaVarde(nod) {
  if (nod.enhet === 'andel') return tal(nod.varde * 100, 0) + ' %';
  return tal(nod.varde) + (nod.enhet ? ' ' + nod.enhet : '');
}

function historikText(nod) {
  const senaste = nod.andringshistorik?.[nod.andringshistorik.length - 1];
  if (!senaste) return '';
  return 'Tidigare: ' + tal(senaste.varde) + (nod.enhet && nod.enhet !== 'andel' ? ' ' + nod.enhet : '');
}

function pansarFarg(mm) {
  const t = Math.max(0, Math.min(1, (Number(mm) || 0) / 120));
  const ljus = Math.round(78 - t * 42);
  const mattnad = Math.round(18 + t * 22);
  return `hsl(${32 + t * 78} ${mattnad}% ${ljus}%)`;
}

function fastpunktText(fast) {
  if (!fast) return 'inga';
  return Object.entries(fast).map(([namn, punkt]) => {
    const etikett = namn === 'mynning' ? 'Mynning' : namn === 'avgas' ? 'Avgas' : namn;
    return etikett + (punkt?.position_m ? ' mätt' : ' saknas');
  }).join(' · ');
}

function beteendePanel(enhet, beteende, overrid) {
  const nyckel = enhet.nation === 'USA' ? 'USA' : enhet.nation === 'Tyskland' ? 'Tyskland' : 'ovriga';
  const nation = beteende.nationell_avgransning?.[nyckel] || '';
  const regler = (beteende.regler || []).map((regel) => `<li><strong>${esc(regel.id)}</strong> ${esc(regel.regel)}</li>`).join('');
  const reglage = beteende.reglage.map((reg) => {
    const sparad = overrid.beteende?.[reg.id];
    const varde = sparad ? sparad.varde : reg.standard;
    const ursprung = sparad ? sparad.ursprung : reg.ursprung;
    const andel = (Number(varde) - reg.min) / (reg.max - reg.min || 1);
    return `
      <section class="stapelblock" data-reglage-block="${esc(reg.id)}" data-ursprung="${esc(ursprung)}" data-modul="beteende/standard.json">
        <div class="stapelhuvud">
          <h3>${esc(reg.namn)}</h3>
          <strong data-varde>${esc(reg.id === 'eldlage' ? eldlageText(varde) : tal(varde) + (reg.enhet === 'andel' ? '' : ' ' + reg.enhet))}</strong>
          <span class="marke marke-${esc(ursprung)}" data-marke>${esc(markeText(ursprung))}</span>
        </div>
        <p class="fin">${esc(reg.motivering || '')} Gemensam modul: Beteende · standard.</p>
        <div class="stapel" aria-hidden="true"><i data-andel style="width:${(Math.max(0, Math.min(1, andel)) * 100).toFixed(1)}%"></i></div>
        <input type="range" data-reglage="${esc(reg.id)}" min="${reg.min}" max="${reg.max}" step="${reg.id === 'eldlage' ? 1 : reglageSteg(reg.enhet)}" value="${Number(varde)}" aria-label="${esc(reg.namn)}">
        ${reg.id === 'eldlage' ? '<p class="fin">0 håll eld · 1 riktad eld · 2 nedhållande eld. Förslag, inte en order.</p>' : ''}
        <div class="radknappar">
          <button type="button" class="textknapp" data-godkann-reglage="${esc(reg.id)}" ${ursprung === 'uppskattat' ? '' : 'hidden'}>Godkänn</button>
          <button type="button" class="textknapp" data-aterstall-reglage="${esc(reg.id)}" ${sparad ? '' : 'hidden'}>Återställ</button>
        </div>
      </section>`;
  }).join('');
  return `
    <p class="ledtext">Reglagen är förslag ur den gemensamma modulen. Det du ändrar gäller bara den här enheten och skriver inte om modulen.</p>
    <p class="fin">Nation: ${esc(nation)}</p>
    <h2>Regler som reglagen inte ersätter</h2>
    <ul class="regler">${regler}</ul>
    <p class="varning">Moralreglaget ersätter inte IB-40 och inte befälskodens språngundantag.</p>
    ${reglage}
  `;
}

function visTak(sokvag, tak) {
  if (sokvag.startsWith('fart_per_terrang')) return 80;
  if (sokvag.includes('kaliber')) return 128;
  if (sokvag.startsWith('pansar')) return 100;
  if (sokvag === 'rackvidd') return 2500;
  return tak;
}

function eldlageText(varde) {
  const n = Math.round(Number(varde) || 0);
  if (n <= 0) return 'Håll eld';
  if (n === 1) return 'Riktad eld';
  return 'Nedhållande eld';
}
