const FILTER = {
  vanlig: 'none',
  film: 'grayscale(1) contrast(1.22) sepia(0.42) brightness(0.94)',
  natt: 'brightness(0.34) contrast(1.35) saturate(0.4) grayscale(0.25)'
};

function textForFel(fel) {
  const namn = fel && (fel.name || '');
  if (namn === 'NotAllowedError' || namn === 'PermissionDeniedError' || namn === 'SecurityError') {
    return 'Kameran nekades. Tillåt kameran i Safari om du vill se verkligheten bakom soldaterna. 3D-miljön visas i stället.';
  }
  if (namn === 'NotFoundError' || namn === 'OverconstrainedError' || namn === 'DevicesNotFoundError') {
    return 'Ingen kamera hittades på den här enheten. 3D-miljön visas i stället.';
  }
  return 'Kameran gick inte att öppna. 3D-miljön visas i stället.';
}

export function skapaBakgrund(video) {
  let strom = null;
  let lage = '3d';
  let filter = 'vanlig';

  function appliceraFilter() {
    video.style.filter = FILTER[filter] || 'none';
  }

  function stoppaStrom() {
    if (strom) {
      for (const spar of strom.getTracks()) {
        try { spar.stop(); } catch { /* spåret kan redan vara stoppat */ }
      }
      strom = null;
    }
    if (video.srcObject) video.srcObject = null;
    video.hidden = true;
  }

  async function oppnaKamera() {
    const media = navigator.mediaDevices;
    if (!media || typeof media.getUserMedia !== 'function') {
      return {ok: false, text: 'Ingen kamera hittades på den här enheten. 3D-miljön visas i stället.'};
    }
    const forsok = [
      {video: {facingMode: {ideal: 'environment'}}, audio: false},
      {video: true, audio: false}
    ];
    let sista = null;
    for (const krav of forsok) {
      try {
        const ny = await media.getUserMedia(krav);
        return {ok: true, strom: ny};
      } catch (fel) {
        sista = fel;
      }
    }
    return {ok: false, text: textForFel(sista)};
  }

  async function sattLage(nasta) {
    if (nasta !== 'kamera') {
      stoppaStrom();
      lage = '3d';
      return {ok: true, lage, text: ''};
    }
    let res;
    try { res = await oppnaKamera(); }
    catch (fel) { res = {ok: false, text: textForFel(fel)}; }
    if (!res.ok) {
      stoppaStrom();
      lage = '3d';
      return {ok: false, lage, text: res.text};
    }
    stoppaStrom();
    strom = res.strom;
    video.srcObject = strom;
    video.hidden = false;
    appliceraFilter();
    try { await video.play(); } catch { /* nästa tryck får igång bilden */ }
    lage = 'kamera';
    return {ok: true, lage, text: ''};
  }

  function sattFilter(namn) {
    filter = Object.prototype.hasOwnProperty.call(FILTER, namn) ? namn : 'vanlig';
    appliceraFilter();
    return filter;
  }

  return {
    sattLage, sattFilter, stoppa: stoppaStrom,
    get lage() { return lage; },
    get filter() { return filter; }
  };
}
