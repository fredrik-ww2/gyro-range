// Gemensam iPhone-Safari-ljudväg. AudioContext skapas och väcks i en gest
// (pointerup/touchend). Den återupptas efter dold flik, skärmlås och
// avbrott (state "interrupted", till exempel ett samtal).

const poster = [];
let lyssnar = false;

export function arIos() {
  const nav = globalThis.navigator;
  if (!nav) return false;
  const ua = nav.userAgent || '';
  return /iP(hone|ad|od)/.test(ua) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
}

export function forberedTystLage() {
  const nav = globalThis.navigator;
  try { if (nav?.audioSession) nav.audioSession.type = 'playback'; } catch { /* äldre webbläsare */ }
  try {
    const finns = globalThis.__tystBrytare;
    if (finns) { finns.play?.().catch(() => {}); return; }
    if (!arIos()) return;
    const n = 8000;
    const b = new ArrayBuffer(44 + n * 2);
    const v = new DataView(b);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, n, true); v.setUint32(28, n * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    w(36, 'data'); v.setUint32(40, n * 2, true);
    const a = globalThis.document?.createElement?.('audio');
    if (!a) return;
    a.setAttribute('playsinline', '');
    a.setAttribute('x-webkit-airplay', 'deny');
    a.loop = true;
    a.volume = 0.001;
    a.src = URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
    globalThis.__tystBrytare = a;
    a.play().catch(() => {});
  } catch { /* ljud är valfritt */ }
}

export function vakna(ctx) {
  if (!ctx || ctx.state === 'closed' || ctx.state === 'running') return Promise.resolve(!!ctx && ctx.state === 'running');
  try {
    const p = ctx.resume?.();
    return Promise.resolve(p).then(() => ctx.state === 'running', () => false);
  } catch { return Promise.resolve(false); }
}

const sedda = new WeakSet();
export function hallKoll(ctx) {
  if (!ctx || sedda.has(ctx)) return;
  sedda.add(ctx);
  ctx.addEventListener?.('statechange', () => {
    if (ctx.state === 'interrupted') ctx.__avbrott = true;
    const dold = !!globalThis.document?.hidden;
    if (!dold && (ctx.state === 'interrupted' || (ctx.__avbrott && ctx.state === 'suspended'))) vakna(ctx);
  });
}

function korPoster() {
  forberedTystLage();
  for (const post of poster) {
    try { post.oppna?.(); } catch { /* sidan får försöka igen */ }
    const ctx = post.hamta?.();
    if (ctx) { hallKoll(ctx); vakna(ctx); }
  }
}

export function installeraIosLjud({ hamta, oppna } = {}) {
  poster.push({ hamta, oppna });
  if (lyssnar || typeof globalThis.document === 'undefined') return;
  lyssnar = true;
  const gest = () => korPoster();
  const synlig = () => { if (!globalThis.document.hidden) korPoster(); };
  globalThis.addEventListener('pointerup', gest, { capture: true, passive: true });
  globalThis.addEventListener('touchend', gest, { capture: true, passive: true });
  globalThis.document.addEventListener('visibilitychange', synlig);
  globalThis.addEventListener('pageshow', synlig);
  globalThis.addEventListener('focus', synlig);
}

export function oppnaKontext(ctx) {
  forberedTystLage();
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AC) return ctx || null;
  if (!ctx || ctx.state === 'closed') {
    try { ctx = new AC(); } catch { return null; }
  }
  hallKoll(ctx);
  vakna(ctx);
  return ctx;
}

export function tick(ctx) {
  if (!ctx || ctx.state !== 'running') return false;
  try {
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = 196;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.09);
    o.onended = () => { try { o.disconnect(); g.disconnect(); } catch { /* redan borta */ } };
    return true;
  } catch { return false; }
}
