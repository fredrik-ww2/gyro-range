// Kulans rörelse på brädet. Allt som går att vrida på kommer från konfig.

function klamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function traffVagg(x, z, radie, vagg) {
  const hx = vagg.b / 2;
  const hz = vagg.d / 2;
  const inomX = Math.abs(x - vagg.x) <= hx;
  const inomZ = Math.abs(z - vagg.z) <= hz;
  const naraX = Math.max(vagg.x - hx, Math.min(x, vagg.x + hx));
  const naraZ = Math.max(vagg.z - hz, Math.min(z, vagg.z + hz));
  const dx = x - naraX;
  const dz = z - naraZ;
  const avst2 = dx * dx + dz * dz;
  if (inomX && inomZ) {
    const penX = hx - Math.abs(x - vagg.x);
    const penZ = hz - Math.abs(z - vagg.z);
    if (penX < penZ) {
      const tecken = Math.sign(x - vagg.x) || 1;
      return {nx: tecken, nz: 0, pen: penX + radie};
    }
    const tecken = Math.sign(z - vagg.z) || 1;
    return {nx: 0, nz: tecken, pen: penZ + radie};
  }
  if (avst2 >= radie * radie) return null;
  const avst = Math.sqrt(avst2) || 1e-8;
  return {nx: dx / avst, nz: dz / avst, pen: radie - avst};
}

export function skapaSim(konfig, bana) {
  const f = konfig.fysik;
  const br = konfig.brade;
  const r = f.kulaRadie;
  const state = {
    x: bana.start.x,
    z: bana.start.z,
    y: r,
    vx: 0,
    vy: 0,
    vz: 0,
    fart: 0,
    lage: 'rullar',
    paus: 0,
    malTid: 0,
    halId: -1,
    vunnen: false,
    checkpoint: {x: bana.start.x, z: bana.start.z},
    handelser: [],
  };

  function noll(x, z) {
    state.x = x;
    state.z = z;
    state.y = r;
    state.vx = 0;
    state.vy = 0;
    state.vz = 0;
    state.fart = 0;
    state.lage = 'rullar';
    state.malTid = 0;
    state.halId = -1;
    state.vunnen = false;
  }

  function placera(x, z, vx = 0, vz = 0) {
    noll(x, z);
    state.vx = vx;
    state.vz = vz;
    state.fart = Math.hypot(vx, vz);
  }

  function studs(nx, nz) {
    const vn = state.vx * nx + state.vz * nz;
    if (vn >= 0) return;
    if (-vn < f.vilaStuds) {
      state.vx -= vn * nx;
      state.vz -= vn * nz;
      return;
    }
    const e = f.vaggStuds;
    state.vx -= (1 + e) * vn * nx;
    state.vz -= (1 + e) * vn * nz;
    const tx = -nz;
    const tz = nx;
    const vt = state.vx * tx + state.vz * tz;
    const behall = 1 - f.vaggFriktion;
    state.vx += tx * vt * (behall - 1);
    state.vz += tz * vt * (behall - 1);
    if (-vn > f.studsFart) {
      state.handelser.push({typ: 'studs', kraft: klamp(-vn / 0.55, 0.25, 1)});
    }
  }

  function sarg() {
    const maxX = br.halvBredd - r;
    const maxZ = br.halvDjup - r;
    if (state.x > maxX) { state.x = maxX; studs(-1, 0); }
    else if (state.x < -maxX) { state.x = -maxX; studs(1, 0); }
    if (state.z > maxZ) { state.z = maxZ; studs(0, -1); }
    else if (state.z < -maxZ) { state.z = -maxZ; studs(0, 1); }
  }

  function vaggar() {
    const lista = bana.vaggar || [];
    for (let varv = 0; varv < 3; varv++) {
      for (let i = 0; i < lista.length; i++) {
        const traff = traffVagg(state.x, state.z, r, lista[i]);
        if (!traff) continue;
        state.x += traff.nx * traff.pen;
        state.z += traff.nz * traff.pen;
        studs(traff.nx, traff.nz);
      }
    }
  }

  function skalar(cx, cz, radie, styrka, h) {
    const dx = cx - state.x;
    const dz = cz - state.z;
    const d = Math.hypot(dx, dz);
    if (d >= radie || d < 1e-5) return d;
    const drag = f.g * styrka * (1 - d / radie);
    state.vx += (dx / d) * drag * h;
    state.vz += (dz / d) * drag * h;
    return d;
  }

  function fall(h) {
    const hal = bana.hal[state.halId];
    state.vy -= f.g * h;
    state.y += state.vy * h;
    if (hal) {
      const dx = hal.x - state.x;
      const dz = hal.z - state.z;
      state.vx += dx * 8 * h;
      state.vz += dz * 8 * h;
    }
    state.vx *= Math.exp(-3 * h);
    state.vz *= Math.exp(-3 * h);
    state.x += state.vx * h;
    state.z += state.vz * h;
    state.fart = Math.hypot(state.vx, state.vz);
    if (state.y < -f.halDjup) {
      state.y = -f.halDjup;
      state.vy = 0;
      state.vx = 0;
      state.vz = 0;
      state.fart = 0;
      state.lage = 'paus';
      state.paus = f.halPaus;
    }
  }

  function tippa(h) {
    let basta = null;
    const hal = bana.hal || [];
    for (let i = 0; i < hal.length; i++) {
      const punkt = hal[i];
      const d = Math.hypot(state.x - punkt.x, state.z - punkt.z);
      if (!basta || d < basta.d) basta = {i, d, punkt};
    }
    if (!basta) {
      state.y += (r - state.y) * Math.min(1, h * 16);
      if (state.lage === 'tippar') state.lage = 'rullar';
      return;
    }
    const overhang = basta.punkt.radie - basta.d;
    if (overhang <= 0) {
      state.y += (r - state.y) * Math.min(1, h * 16);
      if (state.lage === 'tippar') state.lage = 'rullar';
      return;
    }
    state.lage = 'tippar';
    const inne = klamp(overhang / r, 0, 1.4);
    if (overhang < r) {
      const yMal = Math.sqrt(Math.max(0, r * r - overhang * overhang));
      state.y += (yMal - state.y) * Math.min(1, h * 20);
    } else state.y = Math.max(-r, state.y - f.g * h * h);
    const d = Math.max(basta.d, 1e-4);
    const drag = f.g * f.halDrag * Math.min(1.2, 0.25 + inne);
    state.vx += ((basta.punkt.x - state.x) / d) * drag * h;
    state.vz += ((basta.punkt.z - state.z) / d) * drag * h;
    if (inne >= f.halFastna) {
      state.lage = 'faller';
      state.halId = basta.i;
      state.vy = Math.min(state.vy, -0.04);
      state.handelser.push({typ: 'hal', kraft: 1});
    }
  }

  function delsteg(h, lut) {
    if (state.lage === 'faller') {
      fall(h);
      return;
    }
    const ax = f.g * lut.sida;
    const az = -f.g * lut.fram;
    state.vx += ax * h;
    state.vz += az * h;
    const fart = Math.hypot(state.vx, state.vz);
    const lutning = Math.min(1, Math.hypot(lut.fram, lut.sida));
    const cosT = Math.sqrt(Math.max(0.15, 1 - lutning * lutning));
    if (fart > 1e-5) {
      const broms = f.rullfriktion * f.g * cosT * h;
      const kvar = Math.max(0, fart - broms) / fart;
      state.vx *= kvar;
      state.vz *= kvar;
    }
    const damp = Math.exp(-f.viskos * h);
    state.vx *= damp;
    state.vz *= damp;
    const efter = Math.hypot(state.vx, state.vz);
    if (efter > f.maxFart) {
      const skala = f.maxFart / efter;
      state.vx *= skala;
      state.vz *= skala;
    }
    if (state.lage === 'rullar') {
      skalar(bana.start.x, bana.start.z, bana.start.radie || r * 1.4, f.startSkal, h);
      const mal = bana.mal;
      const dm = skalar(mal.x, mal.z, mal.radie, f.malSkal, h);
      const nuFart = Math.hypot(state.vx, state.vz);
      if (dm < mal.radie && nuFart < f.malFart) state.malTid += h;
      else state.malTid = Math.max(0, state.malTid - h * 2);
      if (state.malTid >= f.malTid) {
        state.lage = 'mal';
        state.vunnen = true;
        state.vx = 0;
        state.vz = 0;
        state.fart = 0;
        state.y = r * 0.9;
        state.x += (mal.x - state.x) * 0.35;
        state.z += (mal.z - state.z) * 0.35;
        state.handelser.push({typ: 'mal', kraft: 1});
        return;
      }
    }
    state.x += state.vx * h;
    state.z += state.vz * h;
    sarg();
    vaggar();
    tippa(h);
    const punkter = bana.checkpoint || [];
    for (let i = 0; i < punkter.length; i++) {
      const c = punkter[i];
      if (Math.hypot(state.x - c.x, state.z - c.z) <= c.radie) {
        if (Math.hypot(state.checkpoint.x - c.x, state.checkpoint.z - c.z) > 0.004) {
          state.checkpoint = {x: c.x, z: c.z};
          state.handelser.push({typ: 'checkpoint'});
        }
      }
    }
    state.fart = Math.hypot(state.vx, state.vz);
  }

  function steg(dt, lut) {
    state.handelser.length = 0;
    const ram = Math.min(Math.max(0, dt), f.dtMax);
    if (state.lage === 'paus') {
      state.paus -= ram;
      if (state.paus <= 0) noll(state.checkpoint.x, state.checkpoint.z);
      return state;
    }
    if (state.lage === 'mal') return state;
    const fram = lut?.fram || 0;
    const sida = lut?.sida || 0;
    const antal = Math.max(1, Math.ceil(ram / f.steg));
    const h = ram / antal;
    for (let i = 0; i < antal; i++) delsteg(h, {fram, sida});
    return state;
  }

  function aterstall() {
    noll(bana.start.x, bana.start.z);
    state.checkpoint = {x: bana.start.x, z: bana.start.z};
  }

  return {state, steg, placera, aterstall, get x() { return state.x; }, get z() { return state.z; }, get y() { return state.y; }, get vx() { return state.vx; }, get vz() { return state.vz; }, get vy() { return state.vy; }, get fart() { return state.fart; }, get lage() { return state.lage; }, get handelser() { return state.handelser; }, get vunnen() { return state.vunnen; }};
}
