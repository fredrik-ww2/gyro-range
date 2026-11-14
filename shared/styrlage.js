// Standard och Realistisk ligger i spelets config.presets.
// Värdena skrivs in i de levande objekten så bytet gäller direkt.
// Stämmer inget läge visas Eget, och det sparas i localStorage.

const NYCKLAR = { flyg: 'gyro-flyg-styrlage', rotor: 'gyro-rotor-styrlage' };

export function etikett(lage) {
  if (lage === 'realistisk') return 'Realistisk';
  if (lage === 'eget') return 'Eget';
  return 'Standard';
}

export function forklaring(presets, lage) {
  return presets?.text?.[lage] || presets?.text?.eget || '';
}

function grupper(preset) {
  if (!preset || typeof preset !== 'object') return [];
  return Object.entries(preset).filter(([, v]) => v && typeof v === 'object' && !Array.isArray(v));
}

export function likaVarde(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= 1e-6;
  return a === b;
}

export function skriv(mal, preset) {
  for (const [grupp, varden] of grupper(preset)) {
    if (!mal[grupp] || typeof mal[grupp] !== 'object') continue;
    for (const [k, v] of Object.entries(varden)) mal[grupp][k] = v;
  }
  return mal;
}

export function samma(mal, preset) {
  for (const [grupp, varden] of grupper(preset)) {
    for (const [k, v] of Object.entries(varden)) {
      if (!likaVarde(mal[grupp]?.[k], v)) return false;
    }
  }
  return true;
}

export function vilket(mal, presets) {
  if (presets?.standard && samma(mal, presets.standard)) return 'standard';
  if (presets?.realistisk && samma(mal, presets.realistisk)) return 'realistisk';
  return 'eget';
}

export function fanga(mal, mall) {
  const ut = {};
  for (const [grupp, varden] of grupper(mall)) {
    ut[grupp] = {};
    for (const k of Object.keys(varden)) ut[grupp][k] = mal[grupp]?.[k];
  }
  return ut;
}

export function lasSparat(spel, lagring) {
  try {
    const store = lagring || globalThis.localStorage;
    const raw = store.getItem(NYCKLAR[spel] || spel);
    const data = raw ? JSON.parse(raw) : null;
    if (!data || typeof data !== 'object') return null;
    if (data.lage !== 'standard' && data.lage !== 'realistisk' && data.lage !== 'eget') return null;
    return data;
  } catch {
    return null;
  }
}

export function sparaSparat(spel, data, lagring) {
  try {
    const store = lagring || globalThis.localStorage;
    store.setItem(NYCKLAR[spel] || spel, JSON.stringify(data));
  } catch { /* privat läge */ }
}

export function skapa({ mal, presets, spel, lagring, tillampa }) {
  const applicera = (p) => {
    if (typeof tillampa === 'function') tillampa(p);
    else skriv(mal, p);
  };
  const forsok = (p) => {
    try { applicera(p); return true; } catch { return false; }
  };
  let lage = vilket(mal, presets);
  const sparad = lasSparat(spel, lagring);
  if (sparad?.lage === 'eget' && sparad.varden && forsok(sparad.varden)) lage = vilket(mal, presets);
  else if (sparad && (sparad.lage === 'standard' || sparad.lage === 'realistisk') && presets?.[sparad.lage] && forsok(presets[sparad.lage])) lage = sparad.lage;

  function valj(id) {
    if (id !== 'standard' && id !== 'realistisk') return lage;
    if (!presets?.[id] || !forsok(presets[id])) return lage;
    lage = id;
    sparaSparat(spel, { lage }, lagring);
    return lage;
  }

  function kolla() {
    lage = vilket(mal, presets);
    if (lage === 'eget') sparaSparat(spel, { lage, varden: fanga(mal, presets.standard) }, lagring);
    else sparaSparat(spel, { lage }, lagring);
    return lage;
  }

  return {
    get lage() { return lage; },
    valj,
    kolla,
    etikett() { return etikett(lage); },
    text() { return forklaring(presets, lage); }
  };
}
