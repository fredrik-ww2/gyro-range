// Sidroder och utjämning för flygplanets styrläge.
// Standard (flaggor av, utjamning_s 0, hojd_expo 1) ger samma kommando som tidigare.

const DEG = 180 / Math.PI;

export function hojdExpo(x, max, k) {
  const e = Number(k);
  if (!Number.isFinite(x)) return 0;
  if (!Number.isFinite(e) || e <= 0 || Math.abs(e - 1) < 1e-9 || !(max > 0)) return x;
  const u = Math.max(-1, Math.min(1, x / max));
  if (u === 0) return 0;
  return Math.sign(u) * Math.pow(Math.abs(u), e) * max;
}

// Första provet (dt null) och utjamning_s 0 släpper igenom målet oförändrat.
export function jamnaSteg(fore, mal, dt, tau) {
  if (!Number.isFinite(mal)) return 0;
  if (!(Number(tau) > 0) || dt == null || !Number.isFinite(fore)) return mal;
  if (!(dt > 0)) return fore;
  const a = 1 - Math.exp(-Math.min(0.1, dt) / tau);
  return fore + (mal - fore) * a;
}

export function sidaMening(styr) {
  return styr?.samordnad_svang ? 'sidrodret följer banken' : 'vrid för sidroder';
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Pedalerna vinner. Annars: telefonvridning plus den lilla hjälpen, eller banken när läget ber om det.
export function roderKommando(pedal, last, komm, bank, styr) {
  const telefon = styr?.sidroder_vrid === false ? 0 : (last?.roder || 0);
  if (styr?.samordnad_svang && !pedal) {
    const g = Number.isFinite(styr.samordning_styrka) ? styr.samordning_styrka : 0.9;
    return clamp(Math.sin(bank || 0) * g, -1, 1);
  }
  const bas = pedal ? pedal : telefon;
  return clamp(bas + (komm?.roderHjalp || 0), -1, 1);
}

export const REGLAGE = [
  { grupp: 'styrning', id: 'dodzon', label: 'Dödzon', min: 0, max: 12, step: 0.1, fran: (v) => v * DEG, till: (v) => v / DEG, suffix: '°' },
  { grupp: 'styrning', id: 'dodzon_mjuk', label: 'Mjuk kant', min: 0, max: 8, step: 0.1, fran: (v) => v * DEG, till: (v) => v / DEG, suffix: '°' },
  { grupp: 'styrning', id: 'utjamning_s', label: 'Utjämning', min: 0, max: 0.4, step: 0.01, fran: (v) => v, till: (v) => v, suffix: ' s' },
  { grupp: 'styrning', id: 'hojd_expo', label: 'Höjdroder, kurva', min: 1, max: 3, step: 0.05, fran: (v) => v, till: (v) => v, suffix: '' },
  { grupp: 'gyro_zon', id: 'kurva_full_grader', label: 'Fullt skevroder vid', min: 18, max: 50, step: 1, fran: (v) => v, till: (v) => v, suffix: '°' },
  { grupp: 'styrning', id: 'bank_forstarkning', label: 'Bankkänsla', min: 0.6, max: 2.2, step: 0.05, fran: (v) => v, till: (v) => v, suffix: '×' },
  { grupp: 'styrning', id: 'samordning_styrka', label: 'Sidroder följer banken, styrka', min: 0, max: 1.5, step: 0.05, fran: (v) => v, till: (v) => v, suffix: '' }
];

export const BRYTARE = [
  { grupp: 'styrning', id: 'sidroder_vrid', label: 'Sidroder när du vrider telefonen' },
  { grupp: 'styrning', id: 'samordnad_svang', label: 'Sidroder följer banken' }
];

function tal(v, dec) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '0';
  return n.toFixed(dec).replace('.', ',');
}

export function monteraFlygMeny(rot, motor, C, onAndrad) {
  if (!rot || !motor) return;
  const val = rot.querySelector('#styrlageVal') || rot;
  const text = rot.querySelector('#styrlageText');
  const reglage = rot.querySelector('#styrlageReglage');
  val.replaceChildren();
  const ritaVal = () => {
    const nu = motor.lage;
    for (const knapp of val.querySelectorAll('button')) {
      const pa = knapp.dataset.lage === nu;
      knapp.classList.toggle('pa', pa);
      knapp.setAttribute('aria-pressed', pa ? 'true' : 'false');
    }
    const eget = val.querySelector('[data-lage="eget"]');
    if (eget) eget.classList.toggle('pa', nu === 'eget');
    if (text) text.textContent = motor.text();
    if (typeof onAndrad === 'function') onAndrad(nu);
  };
  for (const id of ['standard', 'realistisk']) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.lage = id;
    b.textContent = id === 'standard' ? 'Standard' : 'Realistisk';
    b.addEventListener('click', () => { motor.valj(id); ritaAllt(); });
    val.append(b);
  }
  const eget = document.createElement('span');
  eget.dataset.lage = 'eget';
  eget.className = 'styrlage-eget';
  eget.textContent = 'Eget';
  val.append(eget);

  if (reglage) {
    reglage.replaceChildren();
    for (const rad of REGLAGE) {
      const lab = document.createElement('label');
      lab.className = 'reglage-rad';
      const span = document.createElement('span');
      const ut = document.createElement('output');
      span.append(rad.label + ' ', ut);
      const input = document.createElement('input');
      input.type = 'range';
      input.min = String(rad.min);
      input.max = String(rad.max);
      input.step = String(rad.step);
      const las = () => rad.fran(C[rad.grupp][rad.id]);
      const visa = () => {
        input.value = String(las());
        const dec = rad.step < 0.1 ? 2 : 1;
        ut.textContent = tal(las(), dec) + rad.suffix;
      };
      input.addEventListener('input', () => {
        C[rad.grupp][rad.id] = rad.till(Number(input.value));
        visa();
        motor.kolla();
        ritaVal();
      });
      visa();
      lab.append(span, input);
      reglage.append(lab);
    }
    for (const rad of BRYTARE) {
      const lab = document.createElement('label');
      lab.className = 'styrlage-check';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = !!C[rad.grupp][rad.id];
      input.addEventListener('change', () => {
        C[rad.grupp][rad.id] = input.checked;
        motor.kolla();
        ritaVal();
      });
      lab.append(input, document.createTextNode(rad.label));
      reglage.append(lab);
    }
  }

  function ritaAllt() {
    if (reglage) {
      const inputs = reglage.querySelectorAll('input');
      let i = 0;
      for (const rad of REGLAGE) {
        const input = inputs[i++];
        if (!input) break;
        const v = rad.fran(C[rad.grupp][rad.id]);
        input.value = String(v);
        const ut = input.parentElement?.querySelector('output');
        if (ut) {
          const dec = rad.step < 0.1 ? 2 : 1;
          ut.textContent = tal(v, dec) + rad.suffix;
        }
      }
      for (const rad of BRYTARE) {
        const input = inputs[i++];
        if (input) input.checked = !!C[rad.grupp][rad.id];
      }
    }
    ritaVal();
  }
  ritaAllt();
  return { rita: ritaAllt };
}
