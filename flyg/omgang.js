// Rena regler för omgång, skada och ljud. main.js anropar de här, testerna också.

export const FLYG_VERSION = 'Flygprov 06';
export const FLYG_BYGG = 'flygprov-06';

export function tomOmgang(bas) {
  return {
    pedalRoder: 0,
    roder: 0,
    landInfo: '',
    hits: 0,
    shots: 0,
    nextShot: 0,
    hitUntil: 0,
    skadaTill: 0,
    spelareHp: bas.spelareHp,
    bomberKvar: bas.bomber,
    bombTraff: 0,
    bombTung: false,
    uppdragKlart: false,
    paMarken: false,
    gearMal: 0,
    gearPos: 0,
    flaps: 0
  };
}

// Skada av: inget liv tappas och planet blir inte nedskjutet.
export function traffPaSpelare(hp, skadaPa, n = 1) {
  if (!skadaPa) return { hp, ned: false };
  const kvar = Math.max(0, hp - n);
  return { hp: kvar, ned: kvar <= 0 };
}

// Träffobjektet måste bära med sig ballongen, annars syns inte träffen.
export function traffPost(m, pos, owner) { return { id: m.id, pos, owner, ref: m.ref ?? null }; }

// Stängt eller saknat ljud ska skapas på nytt. Ett pausat ljud ska bara väckas.
export function ljudBehov(audio, villHa) {
  if (!villHa) return audio && audio.state !== 'closed' ? 'paus' : 'inget';
  if (!audio || audio.state === 'closed') return 'skapa';
  if (audio.state === 'suspended' || audio.state === 'interrupted') return 'vakna';
  return 'kor';
}
