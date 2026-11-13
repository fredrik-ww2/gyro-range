// Framåtryck och vertikal dragning. Ett ensamt tryck väntar en kort stund
// så två tryck tätt inpå varandra kan bli ett dyk utan mellansteg.

const VANTAN = 0.34;
const DUBBEL = 0.46;
const PAUS = 0.12;

export function skapaGester(opt = {}) {
  let framK = Number.isFinite(+opt.fram) ? +opt.fram : 1;
  let vertK = Number.isFinite(+opt.vert) ? +opt.vert : 1;
  let senast = -10;
  let forra = -10;
  let vant = -1;
  let vertSenast = -10;
  let senaste = {ax: 0, ay: 0, az: 0, pitch: 0};

  function troskel(bas, k) {
    const n = Math.min(3, Math.max(0.35, Number(k) || 1));
    return bas / n;
  }

  function signal(prov) {
    const az = Number(prov?.az) || 0;
    const pitch = Number(prov?.pitch) || 0;
    return Math.max(0, -az, pitch / 26);
  }

  function mata(prov, tid) {
    const t = Number(tid) || 0;
    if (prov) senaste = {
      ax: Number(prov.ax) || 0,
      ay: Number(prov.ay) || 0,
      az: Number(prov.az) || 0,
      pitch: Number(prov.pitch) || 0
    };
    const ut = {fram: false, dubbel: false, upp: false, ner: false};
    if (vant >= 0 && t - vant >= VANTAN) {
      ut.fram = true;
      vant = -1;
    }
    const framSignal = signal(senaste);
    if (framSignal >= troskel(8, framK) && t - senast > PAUS) {
      const dubbel = forra > 0 && t - forra < DUBBEL;
      senast = t;
      forra = t;
      vant = dubbel ? -1 : t;
      if (dubbel) {
        ut.dubbel = true;
        ut.fram = false;
      }
    }
    const ay = senaste.ay;
    if (t - vertSenast > 0.3) {
      const grans = troskel(6.2, vertK);
      if (ay >= grans) { ut.upp = true; vertSenast = t; }
      else if (ay <= -grans) { ut.ner = true; vertSenast = t; }
    }
    return ut;
  }

  function prov(nasta) { senaste = {...senaste, ...nasta}; }

  function satt(fram, vert) {
    if (Number.isFinite(+fram)) framK = +fram;
    if (Number.isFinite(+vert)) vertK = +vert;
  }

  return {
    mata, prov, satt,
    get framK() { return framK; },
    get vertK() { return vertK; }
  };
}

export function sjalvtest() {
  const fel = [];
  const krav = (namn, ok) => { if (!ok) fel.push(namn); };
  const g = skapaGester();
  const tyst = g.mata({az: -1.2, ay: 0.4, pitch: 10}, 1);
  krav('svag rörelse är tyst', !tyst.fram && !tyst.dubbel && !tyst.upp && !tyst.ner);
  const ett = g.mata({az: -11, ay: 0}, 1.3);
  krav('första trycket väntar', !ett.fram && !ett.dubbel);
  const steg = g.mata({az: 0, ay: 0}, 1.7);
  krav('ensamt tryck blir ett steg', steg.fram === true && steg.dubbel === false);

  const d = skapaGester();
  d.mata({az: -12}, 2);
  const två = d.mata({az: -12}, 2.22);
  krav('två tryck blir dyk', två.dubbel === true && två.fram === false);
  const efter = d.mata({az: 0}, 2.7);
  krav('dyket lämnar inget extra steg', efter.fram === false);

  const v = skapaGester();
  const upp = v.mata({ay: 9, az: 0}, 3);
  const ner = v.mata({ay: -9, az: 0}, 3.4);
  krav('upp och ner', upp.upp === true && ner.ner === true && !upp.fram);

  const k = skapaGester({fram: 2.2});
  const lat = k.mata({az: -4.2}, 4);
  const senare = k.mata({az: 0}, 4.5);
  krav('högre känslighet tar svagare ryck', senare.fram === true && !lat.dubbel);
  const trubbig = skapaGester({fram: 0.45});
  trubbig.mata({az: -9}, 5);
  const nej = trubbig.mata({az: 0}, 5.5);
  krav('låg känslighet släpper inte svagt ryck', nej.fram === false);
  return fel;
}
