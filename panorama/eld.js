// När en skytt får skjuta. Själva strålen och ljudet sitter hos spelvärlden.

export function skapaSkytt(vapen) {
  const mg = vapen === 'mg42';
  return {vapen: mg ? 'mg42' : 'gevar', vanta: mg ? 0.45 : 0.32, salva: 0, steg: 0};
}

export function eldSteg(s, dt, synlig) {
  const n = {
    vapen: s.vapen === 'mg42' ? 'mg42' : 'gevar',
    vanta: Number(s.vanta) || 0,
    salva: s.salva | 0,
    steg: Number(s.steg) || 0
  };
  const ut = [];
  const d = Math.max(0, Number(dt) || 0);
  if (n.salva > 0) {
    n.steg -= d;
    if (n.steg <= 0) {
      ut.push('skott');
      n.salva -= 1;
      n.steg = 0.055;
      if (n.salva <= 0) n.vanta = n.vapen === 'mg42' ? 2.5 : 1.6;
    }
    return {s: n, ut};
  }
  n.vanta -= d;
  if (n.vanta > 0) return {s: n, ut};
  if (!synlig) {
    n.vanta = 0.22;
    return {s: n, ut};
  }
  if (n.vapen === 'mg42') {
    ut.push('salva');
    n.salva = 8;
    n.steg = 0.02;
    n.vanta = 2.6;
  } else {
    ut.push('skott');
    n.vanta = 1.65;
  }
  return {s: n, ut};
}

export function avstandTillSegment(ax, ay, az, bx, by, bz, px, py, pz) {
  const abx = bx - ax;
  const aby = by - ay;
  const abz = bz - az;
  const ab2 = abx * abx + aby * aby + abz * abz;
  let t = 0;
  if (ab2 > 1e-8) t = ((px - ax) * abx + (py - ay) * aby + (pz - az) * abz) / ab2;
  t = Math.min(1, Math.max(0, t));
  return Math.hypot(ax + abx * t - px, ay + aby * t - py, az + abz * t - pz);
}

export function sjalvtest() {
  const fel = [];
  const krav = (namn, ok) => { if (!ok) fel.push(namn); };
  let gevar = skapaSkytt('gevar');
  let dold = eldSteg(gevar, 1, false);
  krav('dold skytt tiger', dold.ut.length === 0 && dold.s.vanta > 0);
  const syns = eldSteg(dold.s, dold.s.vanta, true);
  krav('synlig gevärskytte skjuter', syns.ut.includes('skott') && !syns.ut.includes('salva'));
  const paus = eldSteg(syns.s, 0.2, true);
  krav('bultpaus mellan gevärsskott', paus.ut.length === 0);
  let mg = skapaSkytt('mg42');
  mg = eldSteg(mg, 0.5, true);
  krav('kulsprutan startar salva', mg.ut.includes('salva'));
  let skott = 0;
  let tillstand = mg.s;
  for (let i = 0; i < 20; i++) {
    const steg = eldSteg(tillstand, 0.06, true);
    tillstand = steg.s;
    if (steg.ut.includes('skott')) skott++;
  }
  krav('salvan har flera skott', skott >= 6);
  const nara = avstandTillSegment(0, 1.6, -10, 0, 1.6, 4, 0.2, 1.7, 0);
  const avsides = avstandTillSegment(0, 1.6, -10, 4, 0.2, -10, 0, 1.7, 0);
  krav('kula nära huvudet', nara < 0.4 && avsides > 1.4);
  return fel;
}
