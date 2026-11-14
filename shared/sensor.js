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
