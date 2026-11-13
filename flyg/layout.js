// Sikte, panel, rubrik och reglage ska inte dela yta.
// Ringen räknas som i spelet: vinkel mot synfält, mitt på skärmen när nosen är rak.
// I liggande läge ligger instrumenten vid sidan av ringen. I stående läge ligger de under den.
// Botten lämnar 28 px för hemindikatorn, så den ytan inte behöver läggas till en gång till.

const BOTTEN_RESERV = 28;
const MARGINAL = 14;

export function sikteRadiePx(hojd, ringRad, fovGrader) {
  return Math.tan(ringRad) / Math.tan((fovGrader * Math.PI / 180) / 2) * hojd / 2;
}

export function rectsOverlappar(a, b) {
  if (!a || !b || a.w <= 0 || a.h <= 0 || b.w <= 0 || b.h <= 0) return false;
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function box(x, y, w, h) {
  return { x, y, w: Math.max(0, w), h: Math.max(0, h) };
}

export function layoutFor(w, h, ringRad, fovGrader) {
  const r = sikteRadiePx(h, ringRad, fovGrader);
  const cx = w / 2, cy = h / 2;
  const ring = box(cx - r, cy - r, r * 2, r * 2);
  const liggande = w > h;
  const tak = ring.y - MARGINAL;
  const headerH = Math.min(liggande ? 92 : 120, Math.max(68, tak));
  const header = box(0, 0, w, headerH);
  const metrics = box(10, headerH - 26, Math.max(40, w - 20), 12);
  const hud = box(10, headerH - 13, Math.max(40, w - 20), 12);
  const bottenY = ring.y + ring.h + MARGINAL;

  let panel, sikteHus, gas, system, pedaler, styr;
  if (liggande) {
    const vansterKant = ring.x - 10;
    const hogerKant = ring.x + ring.w + 10;
    const gasW = 78;
    const gasH = Math.min(96, Math.max(70, h - bottenY));
    gas = box(6, h - BOTTEN_RESERV - gasH, gasW, gasH);
    const sysH = 40;
    system = box(6, gas.y - sysH - 4, Math.min(168, vansterKant - 12), sysH);
    const panelTopp = headerH + 6;
    const panelBotten = Math.min(system.y - 4, h - BOTTEN_RESERV);
    panel = box(gas.x + gas.w + 6, panelTopp, Math.max(40, vansterKant - (gas.x + gas.w + 12)), Math.max(36, panelBotten - panelTopp));
    sikteHus = box(panel.x + 8, panel.y + 4, 72, 16);
    const pedalW = 124, pedalH = 48;
    pedaler = box(cx - pedalW / 2, h - BOTTEN_RESERV - pedalH, pedalW, pedalH);
    if (pedaler.y < bottenY) pedaler = box(hogerKant, h - BOTTEN_RESERV - pedalH, pedalW, pedalH);
    const styrW = Math.min(210, w - hogerKant - 8);
    styr = box(w - styrW - 6, h - BOTTEN_RESERV - Math.min(104, h - bottenY), styrW, Math.min(104, h - bottenY));
  } else {
    const pedalH = 50, sysH = 42;
    pedaler = box(cx - 66, h - BOTTEN_RESERV - pedalH, 132, pedalH);
    system = box(92, pedaler.y - sysH - 6, Math.max(120, w - 92 - 96), sysH);
    gas = box(8, h - BOTTEN_RESERV - Math.min(108, pedaler.h + sysH), 78, Math.min(108, pedaler.h + sysH));
    const panelBottenY = system.y - 8;
    const panelTopp = Math.max(bottenY, headerH + 8);
    const panelH = Math.max(64, Math.min(160, panelBottenY - panelTopp));
    panel = box(0, panelBottenY - panelH, w, panelH);
    sikteHus = box(cx - 36, panel.y, 72, 16);
    const styrH = h - pedaler.y + 8;
    styr = box(w - 200, h - styrH, 200, styrH);
  }

  const vyW = liggande ? 176 : 188;
  const vyH = liggande ? 64 : 76;
  const vy = box(w - vyW - 10, headerH + 8, vyW, vyH);
  const delar = { header, metrics, hud, panel, sikteHus, gas, system, pedaler, styr, vy };
  return { w, h, r, cx, cy, liggande, ring, ...delar, headerH, bottenY, panelH: panel.h, panelBottom: h - panel.y - panel.h, gasH: gas.h, systemBottom: h - system.y - system.h };
}

export function layoutKrockar(L) {
  const namn = ['header', 'metrics', 'hud', 'panel', 'sikteHus', 'gas', 'system', 'pedaler', 'styr', 'vy'];
  return namn.filter((n) => rectsOverlappar(L.ring, L[n]));
}

// Sätter samma mått som layoutFor. Anropas vid start och när fönstret ändrar storlek.
export function applyLayout(doc, L) {
  const root = doc.documentElement;
  root.style.setProperty('--flyg-header', L.headerH + 'px');
  root.style.setProperty('--flyg-panel-h', L.panel.h + 'px');
  root.style.setProperty('--flyg-panel-bottom', (L.h - L.panel.y - L.panel.h) + 'px');
  root.style.setProperty('--flyg-panel-left', L.panel.x + 'px');
  root.style.setProperty('--flyg-panel-width', L.panel.w + 'px');
  root.style.setProperty('--flyg-gas-h', L.gas.h + 'px');
  root.style.setProperty('--flyg-system-bottom', (L.h - L.system.y - L.system.h) + 'px');
  root.style.setProperty('--flyg-system-left', L.system.x + 'px');
  root.style.setProperty('--flyg-system-width', L.system.w + 'px');
  root.dataset.flygLiggande = L.liggande ? '1' : '0';
  const header = doc.querySelector('header');
  if (header) header.style.maxHeight = L.headerH + 'px';
  const panel = doc.getElementById('panel');
  if (panel) {
    panel.style.left = L.panel.x + 'px';
    panel.style.right = 'auto';
    panel.style.width = L.panel.w + 'px';
    panel.style.bottom = (L.h - L.panel.y - L.panel.h) + 'px';
    panel.style.height = L.panel.h + 'px';
    panel.style.maxHeight = L.panel.h + 'px';
    panel.style.top = 'auto';
    panel.style.aspectRatio = 'auto';
  }
  const hus = doc.querySelector('#cockpit .sikhuset');
  if (hus) {
    hus.style.left = (L.sikteHus.x + L.sikteHus.w / 2) + 'px';
    hus.style.bottom = (L.h - L.sikteHus.y - L.sikteHus.h) + 'px';
  }
  const gas = doc.getElementById('gasreglage');
  if (gas) {
    gas.style.height = L.gas.h + 'px';
    gas.style.bottom = (L.h - L.gas.y - L.gas.h) + 'px';
  }
  const system = doc.getElementById('system');
  if (system) {
    system.style.bottom = (L.h - L.system.y - L.system.h) + 'px';
    system.style.left = L.system.x + 'px';
    system.style.right = 'auto';
    system.style.width = L.system.w + 'px';
  }
  const pedaler = doc.getElementById('pedaler');
  if (pedaler) {
    pedaler.style.left = (L.pedaler.x + L.pedaler.w / 2) + 'px';
    pedaler.style.bottom = (L.h - L.pedaler.y - L.pedaler.h) + 'px';
  }
  const vanster = doc.getElementById('vanster');
  if (vanster) {
    vanster.style.top = (L.headerH + 6) + 'px';
    vanster.style.left = '8px';
    vanster.style.width = L.liggande ? 'auto' : '92px';
  }
  const sight = doc.getElementById('sight');
  if (sight && L.vy) {
    sight.style.top = L.vy.y + 'px';
    sight.style.width = L.vy.w + 'px';
    sight.style.height = L.vy.h + 'px';
    sight.style.left = 'auto';
    sight.style.fontSize = (L.liggande ? 20 : 24) + 'px';
  }
  const footer = doc.querySelector('footer');
  if (footer && L.liggande) {
    footer.style.left = 'auto';
    footer.style.right = '6px';
    footer.style.width = L.styr.w + 'px';
    footer.style.bottom = '0px';
    footer.style.paddingLeft = '0px';
  } else if (footer) {
    footer.style.left = '0px';
    footer.style.right = '0px';
    footer.style.width = 'auto';
    footer.style.paddingLeft = '0px';
  }
}
