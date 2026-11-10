// Högst en nod per kanal. Ett skott får inte loopa, och släpps avtryckaren
// ska noden tystna och kopplas bort genast. Samma hjälp håller motorn till en nod
// så att ett nytt skott inte startar en motor till.

export function tystNod(nod) {
  if (!nod) return;
  nod.aktiv = false;
  const source = nod.source;
  const gain = nod.gain;
  try { if (source) source.loop = false; } catch { /* redan stängd */ }
  try {
    const g = gain && gain.gain;
    if (g) {
      try { g.cancelScheduledValues(0); } catch { /* saknar tidslinje */ }
      g.value = 0;
    }
  } catch { /* gain saknas */ }
  try { if (source && source.stop) source.stop(); } catch { /* redan stoppad */ }
  try { if (source && source.disconnect) source.disconnect(); } catch { /* redan bortkopplad */ }
  try { if (gain && gain.disconnect) gain.disconnect(); } catch { /* redan bortkopplad */ }
  try { if (source) source.onended = null; } catch { /* frusen nod */ }
}

export function skapaKanal() {
  let nod = null;
  return {
    antal() { return nod && nod.aktiv ? 1 : 0; },
    spelar() { return !!(nod && nod.aktiv); },
    spela(audio, buffer, val = {}) {
      if (!audio || !buffer) return null;
      const loop = !!val.loop;
      if (loop && nod && nod.aktiv && nod.source && nod.source.buffer === buffer) return nod;
      const fore = nod;
      nod = null;
      tystNod(fore);
      const source = audio.createBufferSource();
      const gain = audio.createGain();
      source.buffer = buffer;
      source.loop = loop;
      if (loop && val.loopEnd > 0) {
        const dur = Number(buffer.duration) || val.loopEnd;
        source.loopEnd = Math.min(val.loopEnd, dur);
      }
      const volym = Number.isFinite(val.volym) ? val.volym : 1;
      gain.gain.value = volym;
      source.connect(gain);
      gain.connect(audio.destination);
      const n = { source, gain, aktiv: true, loop, senRate: null, senVol: null };
      source.onended = () => {
        if (nod !== n) return;
        n.aktiv = false;
        try { source.disconnect(); } catch { /* redan borta */ }
        try { gain.disconnect(); } catch { /* redan borta */ }
        nod = null;
      };
      nod = n;
      const nu = Number(audio.currentTime) || 0;
      const maxSek = Number(val.maxSek);
      try {
        if (!loop && maxSek > 0) source.start(nu, 0, maxSek);
        else source.start(nu);
      } catch {
        try { source.start(); } catch { /* kontexten tog inte emot */ }
      }
      return n;
    },
    tyst() {
      const n = nod;
      nod = null;
      tystNod(n);
    },
    volym(v, tid) {
      if (!nod || !nod.aktiv) return;
      if (nod.senVol != null && Math.abs(nod.senVol - v) < 0.02) return;
      nod.senVol = v;
      const t = tid || 0;
      try {
        const g = nod.gain.gain;
        g.cancelScheduledValues(t);
        g.setValueAtTime(g.value, t);
        g.setTargetAtTime(v, t, 0.12);
      } catch {
        try { nod.gain.gain.value = v; } catch { /* ingen förstärkare */ }
      }
    },
    takt(rate, tid) {
      if (!nod || !nod.aktiv) return;
      if (nod.senRate != null && Math.abs(nod.senRate - rate) < 0.02) return;
      nod.senRate = rate;
      const t = tid || 0;
      try {
        const p = nod.source.playbackRate;
        p.cancelScheduledValues(t);
        p.setValueAtTime(p.value, t);
        p.setTargetAtTime(rate, t, 0.12);
      } catch {
        try { nod.source.playbackRate.value = rate; } catch { /* ingen hastighet */ }
      }
    }
  };
}
