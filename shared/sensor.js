// Gemensam läsning av skärmvinkel och DeviceOrientation.
// window.orientation är −90…180, screen.orientation.angle är 0…270.
// Samma vinkel ska ge samma tal, annars nollställs styrningen när källan byts.
// iOS kan skicka beta/gamma med alpha null tills kompassen finns.

export function skarmGrader(scope = globalThis) {
  const screen = scope.screen;
  const win = scope.window && scope.window !== scope ? scope.window : scope;
  const v = screen?.orientation?.angle ?? win.orientation ?? scope.orientation ?? 0;
  if (!Number.isFinite(+v)) return 0;
  return ((+v % 360) + 360) % 360;
}

export function arDold(scope = globalThis) {
  const doc = scope.document || (scope.window && scope.window.document);
  return !!doc?.hidden;
}

// Både orientationchange och screen.orientation. iOS och Android
// skickar inte alltid samma av dem. Samma normaliserade gradtal
// (–90 och 270) räknas inte som ett byte.
export function lyssnaSkarm(fn, scope = globalThis) {
  const win = scope.window && scope.window !== scope ? scope.window : scope;
  let sen = skarmGrader(scope);
  const kolla = () => {
    const nu = skarmGrader(scope);
    if (nu === sen) return;
    sen = nu;
    try { fn(nu); } catch { /* sidan får nollställa själv */ }
  };
  if (typeof win?.addEventListener === 'function') win.addEventListener('orientationchange', kolla);
  const orient = scope.screen?.orientation;
  if (typeof orient?.addEventListener === 'function') orient.addEventListener('change', kolla);
  return { kolla, nu: () => sen };
}

export function provFranEvent(e) {
  if (!e) return null;
  const beta = +e.beta;
  const gamma = +e.gamma;
  if (!Number.isFinite(beta) || !Number.isFinite(gamma)) return null;
  let alpha = +e.alpha;
  if (!Number.isFinite(alpha)) {
    const heading = +e.webkitCompassHeading;
    alpha = Number.isFinite(heading) ? (360 - heading) % 360 : 0;
  }
  return { alpha, beta, gamma };
}
