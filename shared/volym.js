// Gemensam huvudvolym. 1 är fullt, samma som innan reglaget fanns.
// Tyst kopplar bort ljudet utan att spelen ändrar sina egna slingor.

const NYCKEL = 'gyro-volym-v1';
const lyssnare = new Set();
let installerad = false;
const gainar = new WeakMap();

export function lasVolym() {
  try {
    const raw = JSON.parse(globalThis.localStorage?.getItem(NYCKEL) || 'null');
    const niva = Number(raw?.niva);
    return {
      niva: Number.isFinite(niva) ? Math.min(1, Math.max(0, niva)) : 1,
      tyst: raw?.tyst === true
    };
  } catch {
    return { niva: 1, tyst: false };
  }
}

export function sparaVolym(nasta) {
  const nu = lasVolym();
  const niva = Number.isFinite(+nasta?.niva) ? Math.min(1, Math.max(0, +nasta.niva)) : nu.niva;
  const tyst = typeof nasta?.tyst === 'boolean' ? nasta.tyst : nu.tyst;
  try { globalThis.localStorage?.setItem(NYCKEL, JSON.stringify({ niva, tyst })); } catch { /* privat läge */ }
  for (const fn of lyssnare) fn({ niva, tyst });
  return { niva, tyst };
}

export function effektiv(tillstand = lasVolym()) {
  return tillstand.tyst ? 0 : tillstand.niva;
}

function masterFor(ctx) {
  let g = gainar.get(ctx);
  if (g) return g;
  g = ctx.createGain();
  g.gain.value = effektiv();
  g.connect(ctx.destination);
  gainar.set(ctx, g);
  lyssnare.add((tillstand) => {
    try { g.gain.value = effektiv(tillstand); } catch { /* stängd kontext */ }
  });
  return g;
}

export function installeraKoppling() {
  if (installerad || typeof globalThis.AudioNode === 'undefined') return;
  installerad = true;
  const orig = globalThis.AudioNode.prototype.connect;
  globalThis.AudioNode.prototype.connect = function koppla(dest, ...rest) {
    if (dest && typeof globalThis.AudioDestinationNode !== 'undefined' && dest instanceof globalThis.AudioDestinationNode && this.context) {
      const master = masterFor(this.context);
      if (this !== master) return orig.call(this, master, ...rest);
    }
    return orig.call(this, dest, ...rest);
  };
}

function rita(rot) {
  const tillstand = lasVolym();
  rot.querySelectorAll('[data-volym-reglage]').forEach((el) => {
    const slid = el.querySelector('input[type=range]');
    const tal = el.querySelector('[data-volym-tal]');
    const av = el.querySelector('[data-volym-av]');
    if (slid) slid.value = String(Math.round(tillstand.niva * 100));
    if (tal) tal.textContent = (tillstand.tyst ? 0 : Math.round(tillstand.niva * 100)) + ' %';
    if (av) {
      av.textContent = tillstand.tyst ? 'Ljud av' : 'Ljud på';
      av.setAttribute('aria-pressed', tillstand.tyst ? 'true' : 'false');
    }
  });
}

export function monteraVolym(rot = globalThis.document) {
  installeraKoppling();
  if (!rot?.querySelector || rot.querySelector('[data-volym-reglage]')) {
    rita(rot);
    return;
  }
  if (rot.querySelector('#ljudVol')) return;
  const mal = rot.querySelector('#settings .meny-kropp, #settings .settings-scroll, #installningar, #settings, #menu .menyfast, #panel, #meny, #sikteInstall, #s-start .kort')
    || rot.querySelector('dialog');
  if (!mal) return;
  const el = rot.createElement ? null : null;
  const box = (rot.ownerDocument || rot).createElement('div');
  box.dataset.volymReglage = 'ja';
  box.className = 'volym-reglage';
  box.innerHTML = '<div class="volym-rad"><span>Volym <b data-volym-tal>100 %</b></span><button type="button" data-volym-av aria-pressed="false">Ljud på</button></div><input type="range" min="0" max="100" step="1" value="100" aria-label="Volym">';
  mal.prepend(box);
  const slid = box.querySelector('input');
  const av = box.querySelector('[data-volym-av]');
  slid.addEventListener('input', () => {
    sparaVolym({ niva: Number(slid.value) / 100, tyst: false });
    rita(rot);
  });
  av.addEventListener('click', () => {
    sparaVolym({ tyst: !lasVolym().tyst });
    rita(rot);
  });
  if (!rot.getElementById?.('volymStil') && !rot.querySelector?.('#volymStil')) {
    const stil = (rot.ownerDocument || rot).createElement('style');
    stil.id = 'volymStil';
    stil.textContent = '.volym-reglage{margin:0 0 10px;padding:8px 10px;border:1px solid #ffffff2e;border-radius:12px;background:#121816e6;color:#f4f7ee;font:13px/1.3 -apple-system,sans-serif}.volym-rad{display:flex;align-items:center;justify-content:space-between;gap:8px}.volym-reglage button{min-height:36px;padding:6px 10px;border-radius:8px;border:1px solid #e0f1a466;background:#24302b;color:#e0f1a4;font:inherit;font-weight:700}.volym-reglage input{width:100%;margin-top:6px;accent-color:#e0f1a4}';
    (rot.head || rot.querySelector('head') || mal).appendChild(stil);
  }
  rita(rot);
}

if (typeof globalThis.document !== 'undefined') {
  const start = () => monteraVolym(globalThis.document);
  if (globalThis.document.readyState === 'loading') globalThis.document.addEventListener('DOMContentLoaded', start);
  else start();
}
