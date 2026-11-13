// Rena räkningar för en inspelning. Inget window, ingen lagring.

export function r3(v) {
  if (!Number.isFinite(v)) return null;
  return Math.round(v * 1000) / 1000;
}

export function r3v(a) {
  if (!Array.isArray(a)) return null;
  const u = a.map(r3);
  return u.every((x) => x == null) ? null : u;
}

export function rundaSampel(s) {
  return {
    t: r3(s.t) ?? 0,
    rot: r3v(s.rot),
    acc: r3v(s.acc),
    accG: r3v(s.accG),
    vinkel: r3v(s.vinkel),
    skarm: r3(s.skarm)
  };
}

export function lasVektor(obj, nycklar) {
  if (!obj) return null;
  const v = nycklar.map((k) => (Number.isFinite(obj[k]) ? obj[k] : null));
  return v.every((x) => x == null) ? null : v;
}

// Skillnad mot nollläget, vikt till −180…180 så ett hopp över 0/360 inte blir ett helt varv.
export function vinkelSkillnad(nu, noll) {
  if (!nu || !noll) return null;
  const ut = [null, null, null];
  for (let i = 0; i < 3; i++) {
    if (!Number.isFinite(nu[i]) || !Number.isFinite(noll[i])) continue;
    let d = nu[i] - noll[i];
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    ut[i] = d;
  }
  return ut.every((x) => x == null) ? null : ut;
}

// Klipp bort tiden närmast före ordet, så att telefonen som tas tillbaka inte följer med.
export function klippSvans(sampel, slutTid, svansSek) {
  const svans = Math.max(0, Number(svansSek) || 0);
  const grans = (Number(slutTid) || 0) - svans;
  return (sampel || []).filter((s) => s && Number.isFinite(s.t) && s.t <= grans + 1e-4);
}

export function matHz(sampel) {
  if (!sampel || sampel.length < 2) return null;
  const dt = sampel[sampel.length - 1].t - sampel[0].t;
  if (!(dt > 0)) return null;
  return (sampel.length - 1) / dt;
}

export function arSlutOrd(text, ord = 'slut') {
  const mal = String(ord || 'slut').trim().toLocaleLowerCase('sv');
  if (!mal) return false;
  const rensad = String(text || '')
    .toLocaleLowerCase('sv')
    .replace(/[.,!?;:"“”«»()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return rensad.split(' ').includes(mal);
}

export function serieAv(sampel, nyckel, index) {
  const ut = [];
  for (const s of sampel || []) {
    const v = s?.[nyckel]?.[index];
    if (Number.isFinite(s?.t) && Number.isFinite(v)) ut.push({ t: s.t, v });
  }
  return ut;
}

export function magnitudSerie(sampel, nyckel) {
  const ut = [];
  for (const s of sampel || []) {
    const v = s?.[nyckel];
    if (!Number.isFinite(s?.t) || !Array.isArray(v)) continue;
    let har = false;
    let sum = 0;
    for (const x of v) {
      if (Number.isFinite(x)) { har = true; sum += x * x; }
    }
    if (har) ut.push({ t: s.t, v: Math.sqrt(sum) });
  }
  return ut;
}

export function statistik(punkter) {
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let n = 0;
  let peakAbs = -1;
  let topp = null;
  let tidTillTopp = null;
  let total = 0;
  let slut = null;
  let fore = null;
  for (const p of punkter || []) {
    if (!Number.isFinite(p?.v) || !Number.isFinite(p?.t)) continue;
    if (p.v < min) min = p.v;
    if (p.v > max) max = p.v;
    const a = Math.abs(p.v);
    if (a > peakAbs) { peakAbs = a; topp = p.v; tidTillTopp = p.t; }
    sum += p.v;
    n++;
    slut = p.v;
    if (fore && p.t > fore.t && p.t - fore.t < 0.5) total += 0.5 * (fore.v + p.v) * (p.t - fore.t);
    fore = p;
  }
  if (!n) {
    return { min: null, max: null, medel: null, topp: null, tidTillTopp: null, total: null, slut: null, spann: null, antal: 0 };
  }
  return {
    min, max, medel: sum / n, topp, tidTillTopp, total, slut,
    spann: max - min,
    antal: n
  };
}

// Stickprovsstandardavvikelse, delat med n−1. Ett ensamt värde har ingen spridning.
export function medelOchSpridning(varden) {
  const vals = [];
  for (const v of varden || []) if (Number.isFinite(v)) vals.push(v);
  if (!vals.length) return { medel: null, spridning: null, antal: 0 };
  let sum = 0;
  for (const v of vals) sum += v;
  const medel = sum / vals.length;
  if (vals.length < 2) return { medel, spridning: null, antal: vals.length };
  let kv = 0;
  for (const v of vals) {
    const d = v - medel;
    kv += d * d;
  }
  return { medel, spridning: Math.sqrt(kv / (vals.length - 1)), antal: vals.length };
}

// Linjär interpolation. null om t ligger utanför serien.
export function vardeVid(punkter, t) {
  if (!punkter?.length || !Number.isFinite(t)) return null;
  const forsta = punkter[0];
  const sista = punkter[punkter.length - 1];
  if (!Number.isFinite(forsta?.t) || !Number.isFinite(sista?.t)) return null;
  if (t < forsta.t - 1e-6 || t > sista.t + 1e-6) return null;
  if (t <= forsta.t) return Number.isFinite(forsta.v) ? forsta.v : null;
  if (t >= sista.t) return Number.isFinite(sista.v) ? sista.v : null;
  for (let i = 1; i < punkter.length; i++) {
    const b = punkter[i];
    const a = punkter[i - 1];
    if (!Number.isFinite(b?.t) || t > b.t) continue;
    const dt = b.t - a.t;
    if (!(dt > 0) || !Number.isFinite(a.v) || !Number.isFinite(b.v)) {
      return Number.isFinite(b.v) ? b.v : (Number.isFinite(a.v) ? a.v : null);
    }
    const f = (t - a.t) / dt;
    return a.v + (b.v - a.v) * f;
  }
  return Number.isFinite(sista.v) ? sista.v : null;
}
