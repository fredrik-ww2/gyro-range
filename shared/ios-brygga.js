// Brygga till GyroRange-appen (WKWebView). På webben finns inte
// window.GyroRange, och då gör anropen ingenting.
// Kontinuerliga händelser (motor, rotor, band) skickas högst tio gånger
// per sekund. Avstängning (pa: false) går alltid fram.

const senast = new Map();

export function iAppen() {
  return typeof globalThis.GyroRange?.handelse === 'function'
    || typeof globalThis.ReactNativeWebView?.postMessage === 'function';
}

export function handelse(namn, detalj = {}) {
  const api = globalThis.GyroRange;
  const rn = globalThis.ReactNativeWebView;
  const viaApi = typeof api?.handelse === 'function';
  const viaRn = typeof rn?.postMessage === 'function';
  if (!viaApi && !viaRn) return false;
  const kont = !!detalj?.kontinuerlig;
  const av = detalj?.pa === false;
  if (kont && !av) {
    const nu = globalThis.performance?.now?.() ?? Date.now();
    const fore = senast.get(namn) || 0;
    if (nu - fore < 100) return true;
    senast.set(namn, nu);
  } else if (av) {
    senast.delete(namn);
  }
  try {
    if (viaApi) api.handelse(namn, detalj || {});
    else rn.postMessage(JSON.stringify({ type: 'spel-handelse', handelse: namn, ...(detalj || {}) }));
  } catch { /* appen tar nästa prov */ }
  return true;
}
