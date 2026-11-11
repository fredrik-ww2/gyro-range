// Safari på iPhone har inget navigator.vibrate. Från iOS 18 ger en
// <input type="checkbox" switch> en lätt knack när etiketten klickas.
// Android använder vibrate. En webbsida kan inte styra styrka eller mönster.

export function beskrivMetod(nav = {}) {
  const ua = nav.userAgent || '';
  const ios = /iPad|iPhone|iPod/.test(ua) || (nav.platform === 'MacIntel' && (nav.maxTouchPoints || 0) > 1);
  const vibrate = typeof nav.vibrate === 'function';
  if (!ios && vibrate) {
    let ok = true;
    try { ok = nav.vibrate(0) !== false; } catch { ok = false; }
    if (ok) return { id: 'vibrate', text: 'Vibration (Android).' };
  }
  return { id: 'brytare', text: 'Lätt knack via brytare (iPhone). En webbsida kan bara ge en kort, svag knack.' };
}

export function skapaHaptik(doc, nav = {}, nu = () => (globalThis.performance?.now?.() ?? Date.now())) {
  const label = doc?.querySelector?.('#haptikTickEtikett') || null;
  const metod = beskrivMetod(nav);
  let pa = true;
  let senaste = -1e9;
  function tick() {
    if (!pa) return false;
    const t = nu();
    if (t - senaste < 45) return false;
    senaste = t;
    if (metod.id === 'vibrate') {
      try { nav.vibrate(16); } catch { /* enheten saknar motor */ }
      return true;
    }
    label?.click?.();
    return true;
  }
  return {
    metod,
    get pa() { return pa; },
    set pa(v) { pa = !!v; },
    tick
  };
}

// Hur ofta siktet knackar. Mer skak → kortare mellanrum. Under tröskeln: tyst.
export function skakIntervall(niva, maxSkak) {
  if (!(maxSkak > 0) || !(niva > maxSkak * 0.12)) return 0;
  const andel = Math.max(0, Math.min(1, niva / maxSkak));
  return 0.55 - andel * 0.4;
}
