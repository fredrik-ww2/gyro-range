// Klotets bana följer den låsta riktningen. Kroken är 1,2° direkt och
// växer efter 55 % av banan, med högst 8° ingång. Käglorna är enkla kulor.

export function kaglaPositioner(konfig) {
  const av = konfig.kagla.avstand;
  const djup = av * Math.sin(Math.PI / 3);
  const huvud = -konfig.bana.langd;
  const rader = [[0], [-0.5, 0.5], [-1, 0, 1], [-1.5, -0.5, 0.5, 1.5]];
  const ut = [];
  rader.forEach((rad, i) => {
    rad.forEach(k => ut.push({ x: k * av, z: huvud - i * djup }));
  });
  return ut;
}

function heading(stracka, kast, konfig) {
  const L = konfig.bana.langd;
  const u = Math.max(0, Math.min(1.2, stracka / L));
  const omedelbar = konfig.krok.omedelbar_grader * Math.PI / 180;
  const maxIn = konfig.krok.max_ingang_grader * Math.PI / 180;
  const extraMax = Math.max(0, maxIn - omedelbar);
  let extra = 0;
  if (u > konfig.krok.start_andel) {
    const t = Math.min(1, (u - konfig.krok.start_andel) / (1 - konfig.krok.start_andel));
    extra = extraMax * (t * t * (3 - 2 * t));
  }
  return kast.aimYaw + kast.hook * (omedelbar + extra);
}

function studs(a, b, e) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const d = Math.hypot(dx, dz);
  const min = a.radie + b.radie;
  if (!(d < min) || d < 1e-8) return 0;
  const nx = dx / d;
  const nz = dz / d;
  const over = min - d;
  const invA = 1 / a.massa;
  const invB = 1 / b.massa;
  const inv = invA + invB;
  a.x -= nx * over * (invA / inv);
  a.z -= nz * over * (invA / inv);
  b.x += nx * over * (invB / inv);
  b.z += nz * over * (invB / inv);
  const rel = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz;
  // Överlapp som redan glider isär är ingen ny träff.
  if (rel <= 0) return 0;
  const j = (1 + e) * rel / inv;
  a.vx -= j * nx * invA;
  a.vz -= j * nz * invA;
  b.vx += j * nx * invB;
  b.vz += j * nz * invB;
  return j;
}

export function skapaFysik(konfig) {
  const startPin = kaglaPositioner(konfig);
  const pins = startPin.map(p => pin(p.x, p.z, konfig));
  const ball = viloklot(konfig);
  let kast = null;
  let poang = { senast: 0, strike: 0, kast: 0, fallen: 0, raknad: false };
  let efterSpel = 0;

  function pin(x, z, k) {
    return {
      x, z, vx: 0, vz: 0,
      radie: k.kagla.radie,
      massa: k.kagla.massa,
      fallen: false,
      riktning: 0,
      fall: 0,
      hemmaX: x,
      hemmaZ: z
    };
  }

  function viloklot(k) {
    return {
      x: 0,
      z: k.klot.start_z,
      y: k.klot.radie,
      vx: 0,
      vz: 0,
      radie: k.klot.radie,
      massa: k.klot.massa,
      aktiv: false,
      ranna: false,
      stilla: true,
      vag: 0,
      spin: 0
    };
  }

  function aterstallPin() {
    efterSpel = 0;
    startPin.forEach((p, i) => {
      pins[i].x = p.x;
      pins[i].z = p.z;
      pins[i].vx = 0;
      pins[i].vz = 0;
      pins[i].fallen = false;
      pins[i].fall = 0;
      pins[i].riktning = 0;
    });
  }

  function vilaKlot() {
    const r = viloklot(konfig);
    Object.assign(ball, r);
    kast = null;
  }

  function markeraFall(p) {
    if (Math.hypot(p.vx, p.vz) > konfig.kagla.fall_fart) {
      p.fallen = true;
      p.riktning = Math.atan2(p.vx, p.vz);
    }
  }

  function krockaPin(traffSet) {
    for (let i = 0; i < pins.length; i++) {
      for (let k = i + 1; k < pins.length; k++) {
        const j = studs(pins[i], pins[k], konfig.kagla.pin_restitution);
        if (j > 0) {
          traffSet.add(pins[i]);
          traffSet.add(pins[k]);
        }
        markeraFall(pins[i]);
        markeraFall(pins[k]);
      }
    }
  }

  function flyttaPin(h) {
    for (const p of pins) {
      p.x += p.vx * h;
      p.z += p.vz * h;
      const d = Math.hypot(p.vx, p.vz);
      const efter = Math.max(0, d - 2.4 * h);
      const s = d > 1e-4 ? efter / d : 0;
      p.vx *= s;
      p.vz *= s;
      if (p.fallen) p.fall = Math.min(1, p.fall + h * 1.8);
      const sidokant = konfig.bana.bredd / 2 + konfig.bana.ranna_bredd;
      p.x = Math.max(-sidokant, Math.min(sidokant, p.x));
    }
  }

  function pinLugna() {
    return pins.every(p => Math.hypot(p.vx, p.vz) < 0.15);
  }

  function starta(nasta) {
    efterSpel = 0;
    kast = {
      fart: nasta.fart,
      aimYaw: nasta.aimYaw,
      hook: nasta.hook,
      roll: nasta.roll
    };
    ball.aktiv = true;
    ball.stilla = false;
    ball.ranna = false;
    ball.x = 0;
    ball.z = konfig.klot.start_z;
    ball.y = konfig.klot.radie;
    ball.vag = 0;
    ball.vx = kast.fart * Math.sin(kast.aimYaw);
    ball.vz = -kast.fart * Math.cos(kast.aimYaw);
    poang.raknad = false;
    poang.fallen = 0;
  }

  function rakna() {
    if (poang.raknad || !konfig.brytare.poang) return;
    const n = pins.reduce((s, p) => s + (p.fallen ? 1 : 0), 0);
    poang.raknad = true;
    poang.fallen = n;
    poang.senast = n;
    poang.kast += 1;
    if (n === 10) poang.strike += 1;
  }

  function steg(dt) {
    const h = Math.min(konfig.fysik.dt_max, Math.max(0, dt));
    const traff = [];
    const traffSet = new Set();
    if (!ball.aktiv || !kast) {
      if (efterSpel > 0) {
        efterSpel = Math.max(0, efterSpel - h);
        for (let pass = 0; pass < konfig.fysik.pass_antal; pass++) krockaPin(traffSet);
        flyttaPin(h);
        if (efterSpel === 0 || pinLugna()) {
          efterSpel = 0;
          rakna();
        }
        return { traff, antalTraffade: traffSet.size, ranna: false, framme: false };
      }
      for (const p of pins) {
        if (p.fallen) p.fall = Math.min(1, p.fall + h * 1.6);
      }
      return { traff, antalTraffade: 0, ranna: false, framme: false };
    }

    const fartNu = Math.hypot(ball.vx, ball.vz);
    const broms = Math.max(0, fartNu - konfig.fysik.friktion * h);
    const skal = fartNu > 1e-4 ? broms / fartNu : 0;
    ball.vx *= skal;
    ball.vz *= skal;

    if (!ball.ranna) {
      const stracka = Math.max(0, -ball.z);
      const vinkel = heading(stracka, kast, konfig);
      const malX = broms * Math.sin(vinkel);
      const malZ = -broms * Math.cos(vinkel);
      const blend = 1 - Math.exp(-h * konfig.fysik.styrning);
      ball.vx += (malX - ball.vx) * blend;
      ball.vz += (malZ - ball.vz) * blend;
    }

    ball.x += ball.vx * h;
    ball.z += ball.vz * h;
    ball.vag += Math.hypot(ball.vx, ball.vz) * h;
    ball.spin = ball.vag / ball.radie;

    const kant = konfig.bana.bredd / 2;
    let nyRanna = false;
    if (!ball.ranna && konfig.brytare.ranna && Math.abs(ball.x) > kant - ball.radie * 0.2) {
      ball.ranna = true;
      nyRanna = true;
      const tecken = ball.x < 0 ? -1 : 1;
      ball.x = tecken * (kant + konfig.bana.ranna_bredd * 0.42);
      ball.vx = 0;
      ball.y = Math.max(0.02, ball.y - h * 0.8);
    } else if (!ball.ranna) ball.y = ball.radie;

    if (!ball.ranna) {
      for (let pass = 0; pass < konfig.fysik.pass_antal; pass++) {
        for (const p of pins) {
          const j = studs(ball, p, konfig.kagla.restitution);
          if (j > 0) {
            if (pass === 0) traff.push(p);
            traffSet.add(p);
          }
          markeraFall(p);
        }
        krockaPin(traffSet);
      }
    }

    flyttaPin(h);

    const framme = ball.z <= -konfig.bana.langd - 0.15 || (ball.ranna && ball.z <= -konfig.bana.langd);
    const langsam = Math.hypot(ball.vx, ball.vz) < 0.15 && ball.z < -1;
    if (framme || langsam) {
      ball.aktiv = false;
      ball.stilla = true;
      ball.vx = 0;
      ball.vz = 0;
      efterSpel = konfig.fysik.efter_spel_s;
    }
    return { traff, antalTraffade: traffSet.size, ranna: nyRanna, framme: framme || ball.z <= -konfig.bana.langd + 0.4 };
  }

  return {
    ball,
    pins,
    starta,
    steg,
    aterstallPin,
    vilaKlot,
    get kast() { return kast; },
    get poang() { return poang; },
    get aktiv() { return ball.aktiv; }
  };
}
