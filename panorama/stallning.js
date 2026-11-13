// Ögonhöjd över marken. Knästående kikar i tre steg över en fönsterbräda på 1,02 m.

export const OGA = {staende: 1.7, ligg: 0.36};
export const KIK = [0.78, 1.02, 1.28];

export function fartFaktor(stallning) {
  if (stallning === 'ligg') return 0.32;
  if (stallning === 'kna') return 0.6;
  return 1;
}

export function skapaStallning() {
  let stallning = 'staende';
  let kik = 0;
  let nerTid = 0;

  function oga() {
    if (stallning === 'kna') return KIK[kik];
    return OGA[stallning];
  }

  function satt(id) {
    if (id !== 'staende' && id !== 'kna' && id !== 'ligg') return stallning;
    stallning = id;
    if (id !== 'kna') kik = 0;
    return stallning;
  }

  function stegNer() {
    if (stallning === 'staende') {
      stallning = 'kna';
      kik = 0;
      return 'kna';
    }
    if (stallning === 'kna') {
      stallning = 'ligg';
      kik = 0;
      return 'ligg';
    }
    return 'ligg';
  }

  function kastaNer() {
    stallning = 'ligg';
    kik = 0;
    return 'ligg';
  }

  function kikaUpp() {
    if (stallning !== 'kna') return oga();
    kik = Math.min(KIK.length - 1, kik + 1);
    return KIK[kik];
  }

  function kikaNer() {
    if (stallning !== 'kna') return oga();
    kik = 0;
    nerTid = 1;
    return KIK[0];
  }

  return {
    get stallning() { return stallning; },
    get kik() { return kik; },
    get nerTid() { return nerTid; },
    oga, satt, stegNer, kastaNer, kikaUpp, kikaNer
  };
}

export function sjalvtest() {
  const fel = [];
  const krav = (namn, ok) => { if (!ok) fel.push(namn); };
  const s = skapaStallning();
  krav('står på 1,7', s.stallning === 'staende' && s.oga() === 1.7);
  krav('ett steg till knä', s.stegNer() === 'kna' && s.oga() === 0.78);
  krav('kik upp i steg', s.kikaUpp() === 1.02 && s.kikaUpp() === 1.28 && s.kikaUpp() === 1.28);
  krav('ner till bröstet', s.kikaNer() === 0.78 && s.kik === 0);
  krav('nästa steg är ligg', s.stegNer() === 'ligg' && Math.abs(s.oga() - 0.36) < 1e-6);
  const hopp = skapaStallning();
  hopp.stegNer();
  krav('två tryck från stå blir ligg', hopp.kastaNer() === 'ligg');
  const direkt = skapaStallning();
  krav('kasta från stå', direkt.kastaNer() === 'ligg' && direkt.oga() < 0.5);
  krav('ligg är långsammare än knä', fartFaktor('ligg') < fartFaktor('kna') && fartFaktor('kna') < fartFaktor('staende'));
  krav('kik över brädan skjuter', KIK[0] < 1.02 && KIK[1] === 1.02 && KIK[2] > 1.2);
  return fel;
}
