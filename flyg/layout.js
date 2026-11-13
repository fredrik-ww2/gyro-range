// Sikte, panel, rubrik och reglage ska inte dela yta.
// Ringen räknas som i spelet: vinkel mot synfält, mitt på skärmen när nosen är rak.
// Jaktvyns tavlor ligger längst ner, ovanför gas och knappar, och får inte gå in i ringen.
// botten_reserv_px är andningsrum. env(safe-area-inset-bottom) läggs på i applyLayout.

const MARGINAL = 14;

function lyft(px) {
  return `calc(${Math.round(px)}px + env(safe-area-inset-bottom, 0px))`;
}

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

export function layoutFor(w, h, ringRad, fovGrader, panelCfg) {
  const P = panelCfg || {};
  const bottenReserv = P.botten_reserv_px ?? 28;
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

  let panel, sikteHus, gas, system, pedaler, styr, center;
  if (liggande) {
    const vansterKant = ring.x - 10;
    const hogerKant = ring.x + ring.w + 10;
    const gasW = 78;
    const gasH = Math.min(96, Math.max(70, h - bottenY));
    gas = box(6, h - bottenReserv - gasH, gasW, gasH);
    const sysH = 40;
    system = box(6, gas.y - sysH - 4, Math.min(168, vansterKant - 12), sysH);
    const panelTopp = headerH + 6;
    const panelBotten = Math.min(system.y - 4, h - bottenReserv);
    panel = box(gas.x + gas.w + 6, panelTopp, Math.max(40, vansterKant - (gas.x + gas.w + 12)), Math.max(36, panelBotten - panelTopp));
    sikteHus = box(panel.x + 8, panel.y + 4, 72, 16);
    const pedalW = 124, pedalH = 48;
    pedaler = box(cx - pedalW / 2, h - bottenReserv - pedalH, pedalW, pedalH);
    if (pedaler.y < bottenY) pedaler = box(hogerKant, h - bottenReserv - pedalH, pedalW, pedalH);
    const styrW = Math.min(210, w - hogerKant - 8);
    styr = box(w - styrW - 6, h - bottenReserv - Math.min(104, h - bottenY), styrW, Math.min(104, h - bottenY));
  } else {
    const pedalH = 50, sysH = 42;
    pedaler = box(cx - 66, h - bottenReserv - pedalH, 132, pedalH);
    system = box(92, pedaler.y - sysH - 6, Math.max(120, w - 92 - 96), sysH);
    gas = box(8, h - bottenReserv - Math.min(108, pedaler.h + sysH), 78, Math.min(108, pedaler.h + sysH));
    const centerW = 56, centerH = 54;
    center = box(gas.x + gas.w + 6, pedaler.y + Math.max(0, pedaler.h - centerH), centerW, centerH);
    if (pedaler.x < center.x + center.w + 8) {
      const nx = center.x + center.w + 8;
      pedaler = box(nx, pedaler.y, Math.min(pedaler.w, Math.max(100, w - 100 - nx)), pedaler.h);
    }
    const panelBottenY = system.y - 8;
    const panelTopp = Math.max(bottenY, headerH + 8);
    const panelH = Math.max(64, Math.min(160, panelBottenY - panelTopp));
    panel = box(0, panelBottenY - panelH, w, panelH);
    sikteHus = box(cx - 36, panel.y, 72, 16);
    const styrH = h - pedaler.y + 8;
    styr = box(w - 200, h - styrH, 200, styrH);
  }

  const gap = P.gap_ovanfor_px ?? 6;
  const kant = P.kant_px ?? 8;
  let jakt;
  if (liggande) {
    // Tavlorna ligger i springan under ringen och över pedalerna, mellan system och skjutspak.
    const onskad = P.hojd_liggande_px ?? 72;
    const tak = ring.y + ring.h;
    const golv = pedaler.y - gap;
    const jaktH = Math.max(0, Math.min(onskad, golv - tak));
    const y = golv - jaktH;
    const x0 = system.x + system.w + gap;
    const x1 = styr.x - gap;
    jakt = box(x0, y, Math.max(0, x1 - x0), jaktH);
  } else {
    const takY = Math.min(gas.y, system.y) - gap;
    const onskad = P.hojd_staende_px ?? 118;
    const ledig = takY - (ring.y + ring.h + MARGINAL);
    const jaktH = Math.max(0, Math.min(onskad, Math.max(0, ledig)));
    jakt = box(kant, takY - jaktH, w - kant * 2, jaktH);
  }
  const vyW = liggande ? 176 : 188;
  const vyH = liggande ? 64 : 76;
  const vy = box(w - vyW - 10, headerH + 8, vyW, vyH);
  const delar = { header, metrics, hud, panel, sikteHus, gas, system, pedaler, styr, vy, jakt, center };
  return { w, h, r, cx, cy, liggande, ring, ...delar, headerH, bottenY, panelH: panel.h, panelBottom: h - panel.y - panel.h, gasH: gas.h, systemBottom: h - system.y - system.h, jaktH: jakt.h };
}

export function layoutKrockar(L) {
  const namn = ['header', 'metrics', 'hud', 'panel', 'sikteHus', 'gas', 'system', 'pedaler', 'styr', 'vy', 'jakt'];
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
    gas.style.bottom = lyft(L.h - L.gas.y - L.gas.h);
  }
  const system = doc.getElementById('system');
  if (system) {
    system.style.bottom = lyft(L.h - L.system.y - L.system.h);
    system.style.left = L.system.x + 'px';
    system.style.right = 'auto';
    system.style.width = L.system.w + 'px';
  }
  const pedaler = doc.getElementById('pedaler');
  if (pedaler) {
    pedaler.style.left = (L.pedaler.x + L.pedaler.w / 2) + 'px';
    pedaler.style.bottom = lyft(L.h - L.pedaler.y - L.pedaler.h);
  }
  const sidopanel = doc.querySelector('footer .sidopanel');
  const fotRad = doc.querySelector('footer .row');
  if (sidopanel && L.center && !L.liggande) {
    sidopanel.style.position = 'fixed';
    sidopanel.style.zIndex = '7';
    sidopanel.style.left = L.center.x + 'px';
    sidopanel.style.bottom = lyft(L.h - L.center.y - L.center.h);
    if (fotRad) fotRad.style.justifyContent = 'flex-end';
  } else if (sidopanel) {
    sidopanel.style.position = '';
    sidopanel.style.zIndex = '';
    sidopanel.style.left = '';
    sidopanel.style.bottom = '';
    if (fotRad) fotRad.style.justifyContent = '';
  }
  const jakt = doc.getElementById('jaktpanel');
  if (jakt && L.jakt && L.jakt.h > 0) {
    jakt.style.left = L.jakt.x + 'px';
    jakt.style.width = L.jakt.w + 'px';
    jakt.style.height = L.jakt.h + 'px';
    jakt.style.bottom = lyft(L.h - L.jakt.y - L.jakt.h);
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
