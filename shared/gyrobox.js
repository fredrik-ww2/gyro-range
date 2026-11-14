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
  rub.append(el('strong', null, 'Gyro'));
  const flikar = el('div', 'gyrobox-flikar');
  rub.append(flikar);
  panel.append(rub);
  const kropp = el('div', 'gyrobox-kropp');
  panel.append(kropp);
  const lagerBox = el('div', 'gyrobox-lager');
  const namnFalt = el('input', 'gyrobox-namn');
  namnFalt.type = 'text';
  namnFalt.maxLength = 40;
  namnFalt.placeholder = 'Namn på testläge';
  namnFalt.setAttribute('aria-label', 'Namn på testläge');
  namnFalt.autocomplete = 'off';
  const sparaNy = el('button', 'gyrobox-spara-ny', 'Spara som nytt testläge');
  sparaNy.type = 'button';
  const lista = el('ul', 'gyrobox-lista');
  lagerBox.append(el('p', 'gyrobox-mini', 'Spara som nytt testläge'), namnFalt, sparaNy, lista);
  panel.append(lagerBox);
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
    chipText.textContent = `Gyro: ${funktionText(id)} · ${a.axel}`;
    const en = a.enhet || '°';
    const dec = Math.abs(vis) >= 100 ? 0 : 1;
    chipTal.textContent = `${vis > 0 ? '+' : ''}${sv(vis, dec)}${en === '°' || en === '°/s' ? en : ''}`;
    const spann = Math.max(1, standard[id].spann || 45);
    const u = clamp(vis / spann, -1, 1);
    meter.style.setProperty('--u', String(u));
    chip.setAttribute('aria-label', `${chipText.textContent}. ${chipTal.textContent}. Öppna gyroinställningar`);
  }

  function reglage(nyckel, etikett, inst, std, suffix) {
    const span = {
      kanslighet: [0.2, 3, 0.05],
      kurva: [0.35, 3, 0.05],
      dodzon: [0, 40, 0.5],
      utjamning: [0, Math.max(0.8, (std.utjamning || 0) + 0.2), 0.01]
    }[nyckel];
    const lab = el('label', 'gyrobox-reg');
    const rad = el('span', 'gyrobox-reg-rad');
    const namn = el('span', null, etikett);
    const ut = el('output');
    const input = el('input');
    input.type = 'range';
    input.min = String(span[0]);
    input.max = String(span[1]);
    input.step = String(span[2]);
    input.value = String(inst[nyckel]);
    const dec = nyckel === 'dodzon' ? 1 : 2;
    const skriv = () => { ut.textContent = `${sv(inst[nyckel], dec)}${suffix}`; };
    skriv();
    input.addEventListener('input', () => {
      inst[nyckel] = Number(input.value);
      skriv();
      spara();
      ritaChip();
    });
    rad.append(namn, ut);
    lab.append(rad, input);
    return lab;
  }

  function ritaPanel() {
    flikar.replaceChildren();
    if (axlar.length > 1) {
      for (const a of axlar) {
        const b = el('button', 'gyrobox-flik' + (a.id === valdAxel ? ' pa' : ''), a.axel);
        b.type = 'button';
        b.setAttribute('aria-pressed', a.id === valdAxel ? 'true' : 'false');
        b.addEventListener('click', () => { valdAxel = a.id; ritaPanel(); });
        flikar.append(b);
      }
    }
    kropp.replaceChildren();
    const id = install[valdAxel] ? valdAxel : axlar[0].id;
    valdAxel = id;
    const inst = install[id];
    const std = standard[id];
    const a = axelInfo(id);
    kropp.append(el('p', 'gyrobox-mini', `${funktionText(id)} · ${a.axel}`));

    const inv = el('label', 'gyrobox-check');
    const invBox = el('input');
    invBox.type = 'checkbox';
    invBox.checked = !!inst.invertera;
    inv.append(invBox, el('span', null, 'Invertera'));
    invBox.addEventListener('change', () => { inst.invertera = invBox.checked; spara(); });
    kropp.append(inv);

    const lageRad = el('div', 'gyrobox-lage');
    for (const [kod, text] of [['vrid', 'Fortsätt vrida'], ['noll', 'Återgå till noll']]) {
      const b = el('button', 'gyrobox-val' + (inst.lage === kod ? ' pa' : ''), text);
      b.type = 'button';
      b.setAttribute('aria-pressed', inst.lage === kod ? 'true' : 'false');
      b.addEventListener('click', () => {
        inst.lage = kod;
        tillstand[id].iVrid = false;
        spara();
        ritaPanel();
      });
      lageRad.append(b);
    }
    kropp.append(lageRad);
    kropp.append(el('p', 'gyrobox-hint', inst.lage === 'vrid'
      ? 'Håller du lutningen kvar fortsätter det att vrida.'
      : 'När telefonen går tillbaka går utslaget tillbaka till noll.'));

    kropp.append(reglage('kanslighet', 'Känslighet', inst, std, '×'));
    kropp.append(reglage('kurva', 'Acceleration/kurva', inst, std, ''));
    kropp.append(reglage('dodzon', 'Dödzon', inst, std, '°'));
    kropp.append(reglage('utjamning', 'Utjämning', inst, std, spec.suffixUtjamning ?? ' s'));

    const kal = el('button', 'gyrobox-kal', 'Kalibrera');
    kal.type = 'button';
    kal.addEventListener('click', () => kalibrera());
    kropp.append(kal);

    lista.replaceChildren();
    if (!lagen.length) lista.append(el('li', 'gyrobox-tom', 'Inga sparade testlägen'));
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
