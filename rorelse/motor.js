// Ren hjälp för inspelning, export och första versionen av jämförelse.
// Inga window-anrop. Råvärden ändras inte här förrän någon ber om en behandlad serie.

export const FORMAT = 'ww2-rorelse';
export const VERSION = 1;

export const NYCKLAR = {
  t: 'sekunder från inspelningens start, sidans klocka när sensorn rapporterade',
  rot: '[alfa, beta, gamma] grader per sekund. alfa vridning, beta tippa fram/bak, gamma luta åt sidan',
  vinkel: '[alfa, beta, gamma] grader från DeviceOrientation. alfa 0–360, beta tipp, gamma lutning',
  acc: '[x, y, z] meter per sekundkvadrat utan gravitation. x höger, y uppåt, z ut ur skärmen',
  accG: '[x, y, z] meter per sekundkvadrat med gravitation, samma axlar',
  skarm: 'skärmens vinkel i grader, 0 är porträtt'
};

export const ENHETER = {
  tid: 'sekunder',
  rotationshastighet: 'grader per sekund, som webbläsaren rapporterar DeviceMotion.rotationRate',
  vinkel: 'grader, DeviceOrientation',
  acceleration: 'meter per sekundkvadrat, DeviceMotion.acceleration',
  accelerationMedGravitation: 'meter per sekundkvadrat, DeviceMotion.accelerationIncludingGravity'
};

const AXEL_ROT = ['vridning', 'tippa', 'luta'];
const AXEL_ACC = ['accX', 'accY', 'accZ'];

export function r3(v) {
  if (v == null || !Number.isFinite(v)) return null;
  return Math.round(v * 1000) / 1000;
}

export function r3v(a) {
  if (!a) return null;
  return a.map(r3);
}

export function rundaSampel(s) {
  return {
    t: r3(s.t) ?? 0,
    rot: r3v(s.rot),
    vinkel: r3v(s.vinkel),
    acc: r3v(s.acc),
    accG: r3v(s.accG),
    skarm: r3(s.skarm)
  };
}

function zon(v, axel, medKanslighet) {
  if (v == null || !Number.isFinite(v)) return null;
  const dod = Number(axel?.dodzon) || 0;
  const x = Math.abs(v) < dod ? 0 : v;
  if (!medKanslighet) return x;
  const k = Number.isFinite(axel?.kanslighet) ? axel.kanslighet : 1;
  return x * k;
}

function kanal(v, i) {
  return v && Number.isFinite(v[i]) ? v[i] : null;
}

export function nyaSlatare(utjamning) {
  const mangd = Math.min(1, Math.max(0, Number(utjamning) || 0));
  const tau = mangd * 0.45;
  const y = new Array(12).fill(null);
  let senast = null;
  return {
    kor(lista, t) {
      const dt = senast == null || !Number.isFinite(t) ? 1 / 60 : Math.max(0, Math.min(0.1, t - senast));
      if (Number.isFinite(t)) senast = t;
      const alfa = tau <= 0 || dt <= 0 ? 1 : 1 - Math.exp(-dt / tau);
      const ut = new Array(lista.length);
      for (let i = 0; i < lista.length; i++) {
        const x = lista[i];
        if (x == null || !Number.isFinite(x)) {
          ut[i] = y[i];
          continue;
        }
        y[i] = y[i] == null ? x : y[i] + alfa * (x - y[i]);
        ut[i] = y[i];
      }
      return ut;
    },
    noll() { y.fill(null); senast = null; }
  };
}

// tolv värden: rot, vinkel, acc, accG. Vinklar utjämnas bara. Dödzon gäller inte vinkel.
export function behandlaRaa(raw, ins, slatare) {
  const ax = ins.axlar || {};
  const rot = AXEL_ROT.map((namn, i) => zon(kanal(raw.rot, i), ax[namn], true));
  const vinkel = [0, 1, 2].map((i) => kanal(raw.vinkel, i));
  const acc = AXEL_ACC.map((namn, i) => zon(kanal(raw.acc, i), ax[namn], true));
  const accG = AXEL_ACC.map((namn, i) => zon(kanal(raw.accG, i), ax[namn], true));
  const slat = slatare.kor([...rot, ...vinkel, ...acc, ...accG], raw.t);
  return {
    t: raw.t,
    rot: slat.slice(0, 3),
    vinkel: slat.slice(3, 6),
    acc: slat.slice(6, 9),
    accG: slat.slice(9, 12)
  };
}

export function helaSerien(sampel, ins) {
  const slatare = nyaSlatare(ins.utjamning);
  return (sampel || []).map((s) => behandlaRaa(s, ins, slatare));
}

function hypot(v) {
  if (!v || v.every((x) => x == null || !Number.isFinite(x))) return null;
  let s = 0;
  for (const x of v) s += (Number.isFinite(x) ? x : 0) ** 2;
  return Math.sqrt(s);
}

// Stillhet på rå fart efter dödzon, utan känslighet, så reglaget inte ändrar stoppet.
export function arStilla(raw, ins) {
  const ax = ins.axlar || {};
  const rot = hypot(AXEL_ROT.map((namn, i) => zon(kanal(raw?.rot, i), ax[namn], false)));
  const acc = hypot(AXEL_ACC.map((namn, i) => zon(kanal(raw?.acc, i), ax[namn], false)));
  const rotOk = rot == null || rot < (ins.stillaRotDegS ?? 12);
  const accOk = acc == null || acc < (ins.stillaAcc ?? 0.45);
  return rotOk && accOk;
}

export function matHz(sampel) {
  if (!sampel || sampel.length < 2) return null;
  const dt = sampel[sampel.length - 1].t - sampel[0].t;
  if (!(dt > 0)) return null;
  return (sampel.length - 1) / dt;
}

function lerp(a, b, u) {
  if (!Number.isFinite(a) && !Number.isFinite(b)) return null;
  if (!Number.isFinite(a)) return b;
  if (!Number.isFinite(b)) return a;
  return a + (b - a) * u;
}

function lerpV(a, b, u) {
  const n = Math.max(a?.length || 0, b?.length || 0, 3);
  const ut = new Array(n);
  for (let i = 0; i < n; i++) ut[i] = lerp(kanal(a, i), kanal(b, i), u);
  return ut;
}

export function samplaOm(sampel, hz) {
  if (!sampel?.length) return [];
  const takt = Math.max(1, hz || 20);
  const t0 = sampel[0].t;
  const t1 = sampel[sampel.length - 1].t;
  if (!(t1 > t0)) return sampel.map((s) => ({ t: 0, rot: s.rot, acc: s.acc }));
  const dt = 1 / takt;
  const ut = [];
  let j = 0;
  for (let t = t0; t <= t1 + 1e-9; t += dt) {
    while (j < sampel.length - 2 && sampel[j + 1].t < t) j++;
    const a = sampel[j];
    const b = sampel[Math.min(j + 1, sampel.length - 1)];
    const span = b.t - a.t;
    const u = span > 1e-6 ? Math.min(1, Math.max(0, (t - a.t) / span)) : 0;
    ut.push({ t: t - t0, rot: lerpV(a.rot, b.rot, u), acc: lerpV(a.acc, b.acc, u) });
    if (ut.length > takt * 30) break;
  }
  return ut;
}

function tillDrag(serie, ins) {
  const rs = ins.igenkanning?.rotSkala || 200;
  const as = ins.igenkanning?.accSkala || 8;
  return serie.map((s) => [
    (kanal(s.rot, 0) || 0) / rs,
    (kanal(s.rot, 1) || 0) / rs,
    (kanal(s.rot, 2) || 0) / rs,
    (kanal(s.acc, 0) || 0) / as,
    (kanal(s.acc, 1) || 0) / as,
    (kanal(s.acc, 2) || 0) / as
  ]);
}

function ramAvstand(p, q) {
  let s = 0;
  const n = Math.max(p.length, q.length);
  for (let i = 0; i < n; i++) {
    const d = (p[i] || 0) - (q[i] || 0);
    s += d * d;
  }
  return Math.sqrt(s);
}

// Sakoe-Chiba. Avståndet delas med längden så en kort och en lång rörelse går att jämföra.
export function dtw(a, b, bandAndel) {
  const n = a.length;
  const m = b.length;
  if (!n || !m) return Infinity;
  const w = Math.max(2, Math.ceil(Math.max(n, m) * (bandAndel > 0 ? bandAndel : 1)));
  const INF = Infinity;
  let fore = new Float64Array(m + 1);
  let nu = new Float64Array(m + 1);
  fore.fill(INF);
  fore[0] = 0;
  for (let i = 1; i <= n; i++) {
    nu.fill(INF);
    const j0 = Math.max(1, i - w);
    const j1 = Math.min(m, i + w);
    const ai = a[i - 1];
    for (let j = j0; j <= j1; j++) {
      const d = ramAvstand(ai, b[j - 1]);
      nu[j] = d + Math.min(fore[j], fore[j - 1], nu[j - 1]);
    }
    const tmp = fore;
    fore = nu;
    nu = tmp;
  }
  return Number.isFinite(fore[m]) ? fore[m] / (n + m) : Infinity;
}

function dtwMedBand(a, b, band) {
  const d = dtw(a, b, band);
  if (Number.isFinite(d)) return d;
  return dtw(a, b, 1);
}

function procentAv(d, annan) {
  if (!Number.isFinite(d)) return 0;
  if (!Number.isFinite(annan)) return d < 0.02 ? 100 : 50;
  const p = 100 * annan / (d + annan);
  return Math.round(Math.max(0, Math.min(100, p)));
}

function dragAvExempel(ex, ins) {
  const hz = ins.igenkanning?.hz || 20;
  return tillDrag(samplaOm(helaSerien(ex.sampel, ins), hz), ins);
}

// Första versionen. Procenten säger hur mycket närmare bästa träffen är än nästa,
// eller än samma mall med omvänt tecken om det bara finns en rörelse.
export function kannIgen(sampel, gester, ins) {
  const hz = ins.igenkanning?.hz || 20;
  const band = ins.igenkanning?.band ?? 0.2;
  const fraga = tillDrag(samplaOm(helaSerien(sampel, ins), hz), ins);
  if (fraga.length < 3) return { ok: false, orsak: 'kort', version: 1, metod: 'dtw' };
  const traffar = [];
  for (const g of gester || []) {
    let bast = Infinity;
    let exempelId = null;
    for (const ex of g.exempel || []) {
      const mall = dragAvExempel(ex, ins);
      if (mall.length < 3) continue;
      const d = dtwMedBand(fraga, mall, band);
      if (d < bast) {
        bast = d;
        exempelId = ex.id;
      }
    }
    if (bast < Infinity) traffar.push({ id: g.id, namn: g.namn, avstand: bast, exempelId });
  }
  traffar.sort((a, b) => a.avstand - b.avstand);
  if (!traffar.length) return { ok: false, orsak: 'tom', version: 1, metod: 'dtw' };
  const bast = traffar[0];
  const nasta = traffar[1] || null;
  let jamforelse = nasta ? nasta.avstand : null;
  if (!nasta) {
    const gest = (gester || []).find((g) => g.id === bast.id);
    const ex = gest?.exempel?.find((e) => e.id === bast.exempelId) || gest?.exempel?.[0];
    if (ex) {
      const mall = dragAvExempel(ex, ins).map((v) => v.map((x) => -x));
      jamforelse = dtwMedBand(fraga, mall, band);
    }
  }
  return {
    ok: true,
    version: 1,
    metod: 'dtw',
    bast: {
      id: bast.id,
      namn: bast.namn,
      procent: procentAv(bast.avstand, jamforelse),
      avstand: r3(bast.avstand)
    },
    nasta: nasta ? { id: nasta.id, namn: nasta.namn, avstand: r3(nasta.avstand) } : null
  };
}

export function byggExport({ gester, installningar, enhet, tid }) {
  return {
    format: FORMAT,
    version: VERSION,
    app: 'rorelse',
    exporterad: tid,
    nycklar: NYCKLAR,
    enheter: ENHETER,
    enhet: enhet || null,
    installningar,
    igenkanning: {
      version: 1,
      metod: 'dtw',
      not: 'Rådata ligger i sampel. Känn igen använder inställningarna som gäller just då. Se FORMAT.md.'
    },
    gester: gester || []
  };
}

function textId(v) {
  return typeof v === 'string' && v ? v : null;
}

function normaliseraExempel(ex, i) {
  if (!ex || !Array.isArray(ex.sampel)) return null;
  return {
    id: textId(ex.id) || `ex-${i}`,
    skapad: typeof ex.skapad === 'string' ? ex.skapad : null,
    langdSek: Number.isFinite(ex.langdSek) ? ex.langdSek : null,
    samplingsfrekvensHz: Number.isFinite(ex.samplingsfrekvensHz) ? ex.samplingsfrekvensHz : null,
    antal: Number.isFinite(ex.antal) ? ex.antal : ex.sampel.length,
    avslut: typeof ex.avslut === 'string' ? ex.avslut : null,
    sampel: ex.sampel.filter((s) => s && Number.isFinite(s.t)).map((s) => ({
      t: s.t,
      rot: Array.isArray(s.rot) ? s.rot : null,
      vinkel: Array.isArray(s.vinkel) ? s.vinkel : null,
      acc: Array.isArray(s.acc) ? s.acc : null,
      accG: Array.isArray(s.accG) ? s.accG : null,
      skarm: Number.isFinite(s.skarm) ? s.skarm : null
    }))
  };
}

export function lasImport(obj) {
  if (!obj || obj.format !== FORMAT) {
    const fel = new Error('format');
    fel.kod = 'format';
    throw fel;
  }
  if (obj.version !== VERSION) {
    const fel = new Error('version');
    fel.kod = 'version';
    throw fel;
  }
  if (!Array.isArray(obj.gester)) {
    const fel = new Error('gester');
    fel.kod = 'gester';
    throw fel;
  }
  return obj.gester.map((g, i) => {
    const exempel = (Array.isArray(g?.exempel) ? g.exempel : []).map(normaliseraExempel).filter(Boolean);
    return {
      id: textId(g?.id) || `gest-${i}`,
      namn: typeof g?.namn === 'string' && g.namn.trim() ? g.namn.trim() : 'Namnlös rörelse',
      skapad: typeof g?.skapad === 'string' ? g.skapad : null,
      uppdaterad: typeof g?.uppdaterad === 'string' ? g.uppdaterad : null,
      exempel
    };
  }).filter((g) => g.exempel.length);
}
