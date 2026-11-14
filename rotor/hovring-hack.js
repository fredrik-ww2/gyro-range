// Hack vid hovringsläget på lyftspaken.
// Visuell markering sköts av spelet. Här: när spaken går in i hacket, och knackningen.

export function hovringKryss(fore, nu, mal, band = 0.018) {
  if (![fore, nu, mal].every(Number.isFinite)) return false;
  if (fore === nu) return false;
  const inne = (v) => Math.abs(v - mal) <= band;
  if (!inne(fore) && inne(nu)) return true;
  return (fore - mal) * (nu - mal) < 0;
}

export function knackHovring(nav, win) {
  const root = win || globalThis;
  const vibrator = nav || root.navigator;
  const bridge = root.ReactNativeWebView;
  let native = false;
  let vibrera = false;
  if (bridge && typeof bridge.postMessage === 'function') {
    bridge.postMessage(JSON.stringify({ type: 'haptic', kind: 'hovring', strength: 0.65 }));
    native = true;
  }
  if (typeof vibrator?.vibrate === 'function') {
    vibrator.vibrate(14);
    vibrera = true;
  }
  return { native, vibrera };
}
