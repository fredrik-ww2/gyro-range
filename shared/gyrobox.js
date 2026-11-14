// Gemensam gyrolåda. Spelen talar om vilka axlar som finns och matar
// sitt färdiga utslag genom koppla(). Vid standardvärdena är koppla
// identitet, så befintlig styrning ligger kvar tills någon drar i ett reglage.

const LAGRING = 'gyrobox:';

export function standardAxel(over = {}) {
  return {
    invertera: false,
    lage: 'noll',
    kanslighet: 1,
    kurva: 1,
    dodzon: 0,
    utjamning: 0,
    spann: 45,
    gain: 1,
    ...over
  };
}

function tal(v, reserv) {
  const n = Number(v);
  return Number.isFinite(n) ? n : reserv;
}

export function normaliseraAxel(raw, bas) {
  const b = standardAxel(bas);
  const lage = raw?.lage === 'vrid' ? 'vrid' : 'noll';
  return {
    invertera: !!(raw?.invertera ?? b.invertera),
    lage: raw?.lage === 'vrid' || raw?.lage === 'noll' ? lage : b.lage,
    kanslighet: clamp(tal(raw?.kanslighet, b.kanslighet), 0.2, 3),
    kurva: clamp(tal(raw?.kurva, b.kurva), 0.35, 3),
    dodzon: clamp(tal(raw?.dodzon, b.dodzon), 0, 40),
    utjamning: clamp(tal(raw?.utjamning, b.utjamning), 0, 1.5),
    spann: b.spann,
    gain: b.gain
  };
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function lika(a, b) {
  return !!a.invertera === !!b.invertera
    && a.lage === b.lage
    && Math.abs(a.kanslighet - b.kanslighet) < 1e-6
    && Math.abs(a.kurva - b.kurva) < 1e-6
    && Math.abs(a.dodzon - b.dodzon) < 1e-6
    && Math.abs(a.utjamning - b.utjamning) < 1e-6;
}

// Rå grader in, formade grader ut. Känslighet skalar efter dödzonen.
// Kurvan är en exponent på utslaget mot axelns spann.
export function formaRen(raw, inst) {
  const x0 = Number.isFinite(raw) ? raw : 0;
  const dod = Math.max(0, inst.dodzon || 0);
  const abs = Math.abs(x0);
  let mag = abs <= dod ? 0 : abs - dod;
  const sens = inst.kanslighet ?? 1;
  mag *= sens > 0 ? sens : 0;
  let y = Math.sign(x0 || 0) * mag;
  if (inst.invertera) y = -y;
  const expo = inst.kurva ?? 1;
  const spann = Math.max(1e-3, inst.spann || 45);
  if (Math.abs(expo - 1) > 1e-6 && y !== 0) {
    const m = Math.min(Math.abs(y), spann);
    const u = m / spann;
    y = Math.sign(y) * Math.pow(u, expo) * spann;
  }
  return y;
}

export function nyttTillstand() {
  return { noll: 0, integral: 0, gain: null, jamn: 0, senaste: 0, senRaw: 0, vis: 0, iVrid: false };
}

// spelUt är spelets eget utslag i dess enhet. rawDeg är vinkeln i grader
// från spelets nolla. Vid standard och utan kalibrering kommer spelUt tillbaka.
export function koppla(spelUt, rawDeg, instIn, stdIn, state, dt, opt = {}) {
  const std = normaliseraAxel(stdIn, stdIn);
  const inst = normaliseraAxel(instIn, std);
  const stateOk = state || nyttTillstand();
  const spel = Number.isFinite(spelUt) ? spelUt : 0;
  const rawAbs = Number.isFinite(rawDeg) ? rawDeg : 0;
  const noll = stateOk.noll || 0;
  const raw = rawAbs - noll;
  const jamna = opt.jamna !== false;
  let x;

  if (inst.lage === 'vrid' && std.lage !== 'vrid') {
    const nu = formaRen(raw, inst);
    if (!stateOk.iVrid) {
      const g = Math.abs(nu) > 1e-3 ? spel / nu : (std.gain || 1);
      stateOk.gain = Number.isFinite(g) && Math.abs(g) < 40 ? g : (std.gain || 1);
      stateOk.integral = Math.abs(stateOk.gain) > 1e-6 ? spel / stateOk.gain : 0;
      stateOk.iVrid = true;
    } else {
      stateOk.integral += nu * Math.max(0, dt || 0);
    }
    const tak = (std.spann || 45) * 6;
    stateOk.integral = clamp(stateOk.integral, -tak, tak);
    x = stateOk.integral * (stateOk.gain || std.gain || 1);
  } else if (inst.lage !== 'vrid' && std.lage === 'vrid') {
    stateOk.iVrid = false;
    stateOk.integral = 0;
    x = formaRen(raw, inst) * (std.gain || 1);
  } else if (lika(inst, std) && !stateOk.noll) {
    stateOk.iVrid = false;
    x = spel;
  } else {
    stateOk.iVrid = false;
    stateOk.integral = 0;
    // bas är vinkeln spelet redan räknat på. nu är samma vinkel efter nollställning.
    const bas = formaRen(rawAbs, std);
    const nu = formaRen(raw, inst);
    if (Math.abs(bas) < 1e-4 && Math.abs(nu) < 1e-4) x = noll ? 0 : spel;
    else if (Math.abs(bas) < 1e-4) x = nu * (stateOk.gain || std.gain || 0);
    else {
      const g = spel / bas;
      if (Number.isFinite(g) && Math.abs(g) < 40) stateOk.gain = g;
      const kvot = nu / bas;
      x = spel * clamp(Number.isFinite(kvot) ? kvot : 1, -12, 12);
    }
  }

  const extra = jamna ? Math.max(0, inst.utjamning - std.utjamning) : 0;
  if (extra > 0.001 && dt > 0) {
    const a = 1 - Math.exp(-Math.min(0.1, dt) / extra);
    stateOk.jamn = (Number.isFinite(stateOk.jamn) ? stateOk.jamn : x) + (x - (Number.isFinite(stateOk.jamn) ? stateOk.jamn : x)) * a;
    x = stateOk.jamn;
  } else stateOk.jamn = x;
  stateOk.senaste = x;
  stateOk.senRaw = Number.isFinite(rawDeg) ? rawDeg : 0;
  stateOk.vis = stateOk.iVrid ? stateOk.integral : (lika(inst, std) && !stateOk.noll ? raw : formaRen(raw, inst));
  return x;
}

export function lasLager(spel, lagring) {
  try {
    const raw = (lagring || globalThis.localStorage).getItem(LAGRING + spel);
    const data = raw ? JSON.parse(raw) : null;
    if (!data || typeof data !== 'object') return { nu: null, lagen: [], vald: null };
    const lagen = Array.isArray(data.lagen) ? data.lagen.filter(l => l && typeof l.namn === 'string' && l.axlar) : [];
    return { nu: data.nu && typeof data.nu === 'object' ? data.nu : null, lagen, vald: typeof data.vald === 'string' ? data.vald : null };
  } catch {
    return { nu: null, lagen: [], vald: null };
  }
}

export function sparaLager(spel, data, lagring) {
  const ut = { nu: data.nu || null, lagen: data.lagen || [], vald: data.vald || null };
  (lagring || globalThis.localStorage).setItem(LAGRING + spel, JSON.stringify(ut));
  return ut;
}

function sv(n, dec = 1) {
  if (!Number.isFinite(n)) return '0';
  const t = n.toFixed(dec);
  return t.replace('.', ',');
}

function cssEnGang() {
  if (typeof document === 'undefined' || document.querySelector('link[data-gyrobox]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('./gyrobox.css', import.meta.url).href;
  link.dataset.gyrobox = '';
  document.head.append(link);
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

export function monteraGyrobox(spec) {
  const axlar = spec.axlar.map(a => ({ enhet: '°', ...a }));
  const standard = {};
  for (const a of axlar) standard[a.id] = normaliseraAxel(spec.standard?.[a.id], spec.standard?.[a.id]);
  const sparad = lasLager(spec.spel);
  const install = {};
  const tillstand = {};
  for (const a of axlar) {
    install[a.id] = normaliseraAxel(sparad.nu?.[a.id], standard[a.id]);
    tillstand[a.id] = nyttTillstand();
  }
  let lagen = sparad.lagen.map(l => ({ id: l.id || String(Math.random()).slice(2), namn: l.namn, axlar: l.axlar }));
  let vald = sparad.vald;
  let oppna = false;
  let valdAxel = axlar[0]?.id;
  let senVis = 0;

  function spara(extra = {}) {
    sparaLager(spec.spel, { nu: install, lagen, vald, ...extra });
    if (typeof spec.tillampa === 'function') spec.tillampa(install);
  }

  function kopplaId(id, spelUt, rawDeg, dt, opt) {
    const x = koppla(spelUt, rawDeg, install[id], standard[id], tillstand[id], dt, opt);
    return x;
  }

  cssEnGang();
  const rot = el('div', 'gyrobox-rot');
  rot.dataset.gyrobox = spec.spel;
  const chip = el('button', 'gyrobox-chip');
  chip.type = 'button';
  chip.setAttribute('aria-expanded', 'false');
  chip.setAttribute('aria-controls', 'gyrobox-panel-' + spec.spel);
  const chipText = el('b', 'gyrobox-text');
  const chipRad = el('span', 'gyrobox-rad');
  const chipTal = el('span', 'gyrobox-tal');
  const meter = el('i', 'gyrobox-meter');
  meter.append(el('i', 'gyrobox-thumb'));
  chipRad.append(meter, chipTal);
  chip.append(chipText, chipRad);

  const panel = el('section', 'gyrobox-panel');
  panel.id = 'gyrobox-panel-' + spec.spel;
  panel.hidden = true;
  const rub = el('div', 'gyrobox-rub');
  rub.append(el('strong', null, 'Styrning'));
  rub.append(el('p', 'gyrobox-hint', 'Varje reglage visar vad som gäller nu. Högre betyder mer av det som står under namnet.'));
  const flikar = el('div', 'gyrobox-flikar');
  rub.append(flikar);
  panel.append(rub);
  const kropp = el('div', 'gyrobox-kropp');
  panel.append(kropp);
  const lagerDet = el('details', 'gyrobox-lager-det');
  lagerDet.append(el('summary', null, 'Sparade lägen'));
  const lagerBox = el('div', 'gyrobox-lager');
  const namnFalt = el('input', 'gyrobox-namn');
  namnFalt.type = 'text';
  namnFalt.maxLength = 40;
  namnFalt.placeholder = 'Till exempel Lugn';
  namnFalt.setAttribute('aria-label', 'Namn på sparat läge');
  namnFalt.autocomplete = 'off';
  const sparaNy = el('button', 'gyrobox-spara-ny', 'Spara det här läget');
  sparaNy.type = 'button';
  const lista = el('ul', 'gyrobox-lista');
  lagerBox.append(el('p', 'gyrobox-gor', 'Ge läget ett namn om du vill prova och kunna gå tillbaka.'), namnFalt, sparaNy, lista);
  lagerDet.append(lagerBox);
  panel.append(lagerDet);
  const stang = el('button', 'gyrobox-stang', 'Stäng och spara');
  stang.type = 'button';
  panel.append(stang);
  rot.append(chip, panel);
  (spec.rot || document.body).append(rot);

  const stopp = (e) => e.stopPropagation();
  rot.addEventListener('pointerdown', stopp);
  rot.addEventListener('pointermove', stopp);
  rot.addEventListener('click', stopp);

  function aktivId() {
    try {
      const id = spec.aktiv?.();
      if (id && install[id]) return id;
    } catch { /* spelet har inte hunnit starta */ }
    let bast = axlar[0]?.id;
    let mag = -1;
    for (const a of axlar) {
      const v = Math.abs(tillstand[a.id].senaste || 0);
      if (v > mag) { mag = v; bast = a.id; }
    }
    return bast;
  }

  function axelInfo(id) {
    return axlar.find(a => a.id === id) || axlar[0];
  }

  function funktionText(id) {
    const a = axelInfo(id);
    try {
      if (typeof spec.funktion === 'function') return spec.funktion(id) || a.funktion;
    } catch { /* */ }
    return a.funktion;
  }

  function slagAv(a) {
    const s = `${a?.axel || ''}`.toLowerCase();
    if (/fart|sving/.test(s)) return 'Sving';
    if (/vrid|gir|yaw|sidled/.test(s)) return 'Vridning';
    if (/roll|krok|(^| )sida($| )|åt sidan/.test(s)) return 'Sidolutning';
    return 'Lutning';
  }

  function titelAv(a) {
    const bas = slagAv(a);
    const samma = axlar.filter(x => slagAv(x) === bas);
    const funk = funktionText(a.id);
    return samma.length > 1 && funk ? `${bas} · ${funk}` : bas;
  }

  function meningAv(a) {
    const slag = slagAv(a);
    if (slag === 'Vridning') return 'När du vrider telefonen som en dörr följer det här med.';
    if (slag === 'Sidolutning') return 'När du lutar telefonen åt sidan, som en ratt, följer det här med.';
    if (slag === 'Sving') return 'När du svingar armen följer klotet med.';
    return 'När du lutar telefonen framåt eller bakåt följer det här med.';
  }

  function figur(slag) {
    const wrap = el('div', 'gyrobox-figur');
    const telefon = slag === 'Sidolutning'
      ? '<rect x="8" y="6" width="12" height="18" rx="2" transform="rotate(-16 14 15)" fill="none" stroke="currentColor" stroke-width="1.6"/>'
      : '<rect x="8" y="4" width="12" height="20" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/>';
    const pil = slag === 'Vridning'
      ? '<path d="M36 18a8 8 0 1 1 8-10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M42 6l6 1-1 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
      : slag === 'Sidolutning'
        ? '<path d="M34 14h18M46 9l8 5-8 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
        : slag === 'Kalibrering'
          ? '<circle cx="36" cy="14" r="7" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M36 4v6M36 18v6M26 14h6M40 14h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'
          : slag === 'Sving'
            ? '<path d="M28 22c8-16 20-16 28 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'
            : '<path d="M40 6v14M35 16l5 6 5-6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>';
    wrap.innerHTML = `<svg viewBox="0 0 72 28" aria-hidden="true">${slag === 'Kalibrering' || slag === 'Sving' ? '' : telefon}${pil}</svg>`;
    return wrap;
  }

  function ritaChip() {
    const id = aktivId();
    const a = axelInfo(id);
    const st = tillstand[id];
    const fersk = performance.now() - senVis < 500 && Number.isFinite(st.vis);
    let vis = fersk ? st.vis : null;
    if (vis == null) {
      try { vis = spec.las?.(id); } catch { vis = 0; }
    }
    if (!Number.isFinite(vis)) vis = 0;
    chipText.textContent = titelAv(a);
    const en = a.enhet || '°';
    const dec = Math.abs(vis) >= 100 ? 0 : 1;
    const talText = `${vis > 0 ? '+' : ''}${sv(vis, dec)}${en === '°' || en === '°/s' ? en : ''}`;
    chipTal.textContent = talText;
    const spann = Math.max(1, standard[id].spann || 45);
    const u = clamp(vis / spann, -1, 1);
    meter.style.setProperty('--u', String(u));
    chip.setAttribute('aria-label', `${chipText.textContent}, ${talText}. Öppna styrning`);
  }

  function reglage(nyckel, etikett, hint, inst, std, suffix, slag) {
    const span = {
      kanslighet: [0.2, 3, 0.05],
      kurva: [0.35, 3, 0.05],
      dodzon: [0, 40, 0.5],
      utjamning: [0, Math.max(0.8, (std.utjamning || 0) + 0.2), 0.01]
    }[nyckel];
    const lab = el('label', 'gyrobox-reg');
    const rad = el('span', 'gyrobox-reg-rad');
    const namn = el('span', 'gyrobox-namn', etikett);
    const ut = el('output');
    const input = el('input');
    input.type = 'range';
    input.min = String(span[0]);
    input.max = String(span[1]);
    input.step = String(span[2]);
    input.value = String(inst[nyckel]);
    const dec = nyckel === 'dodzon' ? 1 : 2;
    const vis = el('i', 'gyrobox-mini-vis ' + slag);
    const skriv = () => {
      ut.textContent = `${sv(inst[nyckel], dec)}${suffix}`;
      const bredd = Number(input.max) - Number(input.min) || 1;
      vis.style.setProperty('--u', String(clamp((inst[nyckel] - Number(input.min)) / bredd, 0, 1)));
    };
    skriv();
    input.addEventListener('input', () => {
      inst[nyckel] = Number(input.value);
      skriv();
      spara();
      ritaChip();
    });
    rad.append(namn, ut);
    lab.append(rad, el('span', 'gyrobox-gor', hint), vis, input);
    return lab;
  }

  function aterstall() {
    for (const a of axlar) {
      install[a.id] = normaliseraAxel(standard[a.id], standard[a.id]);
      tillstand[a.id].iVrid = false;
      tillstand[a.id].integral = 0;
      tillstand[a.id].jamn = 0;
    }
    vald = null;
    spara();
    ritaPanel();
    ritaChip();
  }

  function ritaAxel(id) {
    const det = el('details', 'gyrobox-grupp');
    det.open = axlar.length === 1 || id === (valdAxel || axlar[0].id);
    const a = axelInfo(id);
    const inst = install[id];
    const std = standard[id];
    det.append(el('summary', null, titelAv(a)));
    det.append(el('p', 'gyrobox-gor', meningAv(a)));
    det.append(figur(slagAv(a)));

    const lageRad = el('div', 'gyrobox-lage');
    for (const [kod, text] of [['noll', 'Följer med'], ['vrid', 'Snurrar vidare']]) {
      const b = el('button', 'gyrobox-val' + (inst.lage === kod ? ' pa' : ''), text);
      b.type = 'button';
      b.setAttribute('aria-pressed', inst.lage === kod ? 'true' : 'false');
      b.addEventListener('click', () => {
        inst.lage = kod;
        tillstand[id].iVrid = false;
        valdAxel = id;
        spara();
        ritaPanel();
      });
      lageRad.append(b);
    }
    det.append(lageRad);
    const ord = slagAv(a).toLowerCase();
    det.append(el('p', 'gyrobox-gor', inst.lage === 'vrid'
      ? 'Håller du kvar fortsätter det. Rakt igen = det stannar där det är.'
      : `Mer ${ord} = större utslag. Rakt igen = tillbaka till noll.`));

    det.append(el('h4', null, 'Känslighet'));
    det.append(reglage('kanslighet', 'Känslighet', 'Högre = mer utslag för samma rörelse.', inst, std, '×', 'pil'));
    det.append(reglage('kurva', 'Hur det ökar', 'Högre = små rörelser blir svagare och stora slår hårdare.', inst, std, '', 'kurva'));
    det.append(el('h4', null, 'Dödzon'));
    det.append(reglage('dodzon', 'Dödzon', 'Högre = du måste luta eller vrida mer innan något händer.', inst, std, '°', 'gap'));
    det.append(reglage('utjamning', 'Mjukhet', 'Högre = mjukare och långsammare följning.', inst, std, spec.suffixUtjamning ?? ' s', 'mjuk'));

    const inv = el('label', 'gyrobox-check');
    const invBox = el('input');
    invBox.type = 'checkbox';
    invBox.checked = !!inst.invertera;
    inv.append(invBox, el('span', null, 'Vänd riktningen'));
    invBox.addEventListener('change', () => { inst.invertera = invBox.checked; spara(); });
    det.append(inv);
    det.append(el('p', 'gyrobox-gor', 'På = höger blir vänster, och upp blir ner.'));
    return det;
  }

  function ritaPanel() {
    flikar.replaceChildren();
    kropp.replaceChildren();
    for (const a of axlar) kropp.append(ritaAxel(a.id));

    const kal = el('section', 'gyrobox-grupp kal');
    kal.append(el('h3', null, 'Kalibrering'));
    kal.append(figur('Kalibrering'));
    kal.append(el('p', 'gyrobox-gor', 'Håll telefonen som du vill att noll ska kännas, och tryck på knappen.'));
    const kalKnapp = el('button', 'gyrobox-kal', 'Sätt noll här');
    kalKnapp.type = 'button';
    kalKnapp.addEventListener('click', () => kalibrera());
    const ater = el('button', 'gyrobox-ater', 'Återställ standard');
    ater.type = 'button';
    ater.addEventListener('click', () => aterstall());
    kal.append(kalKnapp, el('p', 'gyrobox-gor', 'Standard är så spelet styrs från början.'), ater);
    kropp.append(kal);

    lista.replaceChildren();
    if (!lagen.length) lista.append(el('li', 'gyrobox-tom', 'Inga sparade lägen ännu'));
    for (const lag of lagen) {
      const li = el('li');
      const valj = el('button', 'gyrobox-lag' + (lag.id === vald ? ' pa' : ''), lag.namn);
      valj.type = 'button';
      valj.addEventListener('click', () => {
        for (const ax of axlar) {
          if (lag.axlar[ax.id]) install[ax.id] = normaliseraAxel(lag.axlar[ax.id], standard[ax.id]);
          tillstand[ax.id].iVrid = false;
        }
        vald = lag.id;
        spara();
        ritaPanel();
      });
      const bort = el('button', 'gyrobox-ta-bort', 'Ta bort');
      bort.type = 'button';
      bort.setAttribute('aria-label', `Ta bort ${lag.namn}`);
      bort.addEventListener('click', () => {
        lagen = lagen.filter(x => x.id !== lag.id);
        if (vald === lag.id) vald = null;
        spara();
        ritaPanel();
      });
      li.append(valj, bort);
      lista.append(li);
    }
  }

  function visa(op) {
    oppna = !!op;
    panel.hidden = !oppna;
    chip.setAttribute('aria-expanded', oppna ? 'true' : 'false');
    rot.classList.toggle('oppen', oppna);
    if (oppna) ritaPanel();
  }

  chip.addEventListener('click', () => visa(!oppna));
  stang.addEventListener('click', () => { spara(); visa(false); });
  sparaNy.addEventListener('click', () => {
    const namn = (namnFalt.value || '').trim().slice(0, 40) || `Testläge ${lagen.length + 1}`;
    const id = `${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
    const kopia = {};
    for (const a of axlar) kopia[a.id] = { ...install[a.id] };
    lagen = [{ id, namn, axlar: kopia }, ...lagen].slice(0, 24);
    vald = id;
    namnFalt.value = '';
    spara();
    ritaPanel();
  });

  function kalibrera() {
    if (typeof spec.kalibrera === 'function') {
      try { spec.kalibrera(); } catch { /* spelets nollställning får misslyckas tyst */ }
      for (const a of axlar) {
        tillstand[a.id].noll = 0;
        tillstand[a.id].integral = 0;
        tillstand[a.id].iVrid = false;
        tillstand[a.id].jamn = 0;
      }
    } else {
      for (const a of axlar) {
        let raw = tillstand[a.id].senRaw;
        try {
          const nu = spec.las?.(a.id);
          if (Number.isFinite(nu)) raw = nu;
        } catch { /* */ }
        tillstand[a.id].noll = Number.isFinite(raw) ? raw : 0;
        tillstand[a.id].integral = 0;
        tillstand[a.id].iVrid = false;
        tillstand[a.id].jamn = 0;
      }
    }
  }

  if (sparad.nu) spara();
  ritaChip();
  if (typeof requestAnimationFrame === 'function') {
    const loop = () => {
      senVis = Math.max(senVis, 0);
      ritaChip();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  return {
    rot,
    standard,
    get installningar() { return install; },
    axel(id) { return install[id]; },
    satt(id, del) {
      if (!install[id]) return;
      Object.assign(install[id], normaliseraAxel({ ...install[id], ...del }, standard[id]));
      spara();
      if (oppna) ritaPanel();
    },
    koppla(id, spelUt, rawDeg, dt, opt) {
      senVis = typeof performance !== 'undefined' ? performance.now() : Date.now();
      return kopplaId(id, spelUt, rawDeg, dt, opt);
    },
    kalibrera,
    oppna() { visa(true); },
    stang() { spara(); visa(false); },
    varde(id) { return tillstand[id]?.senaste || 0; }
  };
}
