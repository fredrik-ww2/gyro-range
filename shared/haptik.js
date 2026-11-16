// Knack: appen om bryggan finns, annars navigator.vibrate.
// WKWebView har inget vibrate. Skriptet i appen kan ändå ha lagt dit en ersättare.

export function harBrygga() {
  return typeof globalThis.webkit?.messageHandlers?.gyroRange?.postMessage === 'function'
    || typeof globalThis.GyroRange?.handelse === 'function'
    || typeof globalThis.ReactNativeWebView?.postMessage === 'function';
}

export function knack(ms = 16) {
  const langd = Math.max(0, Number(ms) || 0);
  const niva = Math.max(0.35, Math.min(1, (langd || 16) / 40));
  const msg = { type: 'haptic', kind: 'vibrate', handelse: 'vibrera', niva };
  try {
    if (typeof globalThis.webkit?.messageHandlers?.gyroRange?.postMessage === 'function') {
      globalThis.webkit.messageHandlers.gyroRange.postMessage(msg);
      return true;
    }
    if (typeof globalThis.GyroRange?.handelse === 'function') {
      globalThis.GyroRange.handelse('vibrera', { niva });
      return true;
    }
    if (typeof globalThis.ReactNativeWebView?.postMessage === 'function') {
      globalThis.ReactNativeWebView.postMessage(JSON.stringify(msg));
      return true;
    }
  } catch { /* prova vibrate */ }
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      return navigator.vibrate(langd || 16) !== false;
    }
  } catch { /* enheten saknar motor */ }
  return false;
}
