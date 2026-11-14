import { skapa } from '../shared/styrlage.js';

export function monteraRotorLage({ control, flight, config, onAndrad }) {
  const mal = {
    get control() { return control.settings; },
    get flight() { return flight.params; }
  };
  const motor = skapa({
    mal,
    presets: config.presets,
    spel: 'rotor',
    tillampa(p) {
      if (p.control) control.configure(p.control);
      if (p.flight) flight.configure(p.flight);
    }
  });
  const val = document.getElementById('styrlageVal');
  const text = document.getElementById('styrlageText');
  if (val && !val.childElementCount) {
    for (const id of ['standard', 'realistisk']) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.lage = id;
      b.textContent = id === 'standard' ? 'Standard' : 'Realistisk';
      b.addEventListener('click', () => { motor.valj(id); rita(); });
      val.append(b);
    }
    const eget = document.createElement('span');
    eget.dataset.lage = 'eget';
    eget.className = 'styrlage-eget';
    eget.textContent = 'Eget';
    val.append(eget);
  }
  function visaHack() {
    const mark = document.getElementById('hoverMark');
    if (!mark) return;
    mark.hidden = !flight.params.hovringHack;
    mark.style.bottom = ((flight.params.hoverCollective || 0.6) * 100) + '%';
  }
  function rita() {
    const nu = motor.lage;
    if (val) {
      for (const knapp of val.querySelectorAll('button')) {
        const pa = knapp.dataset.lage === nu;
        knapp.classList.toggle('pa', pa);
        knapp.setAttribute('aria-pressed', pa ? 'true' : 'false');
      }
      val.querySelector('[data-lage="eget"]')?.classList.toggle('pa', nu === 'eget');
    }
    if (text) text.textContent = motor.text();
    visaHack();
    if (typeof onAndrad === 'function') onAndrad();
  }
  rita();
  return {
    kolla() { motor.kolla(); rita(); },
    etikett() { return motor.etikett(); },
    visaHack
  };
}
