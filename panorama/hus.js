import {forstaTraff, skapaKollision} from './kollision.js';

// Enterbart stenhus. Dörren vetter mot start (+z). Fönstret vetter mot fienderna (−z), bröstning 1,02 m.

export function husSpec(over = {}) {
  const x = Number.isFinite(+over.x) ? +over.x : -6;
  const z = Number.isFinite(+over.z) ? +over.z : -14;
  const bredd = 6.4;
  const djup = 5.2;
  const hojd = 3.2;
  const tjock = 0.34;
  const dorrBredd = 1.2;
  const dorrHojd = 2.15;
  const fonsterBredd = 2.05;
  const sill = 1.02;
  const fonsterTopp = 2.22;
  return {
    x, z, bredd, djup, hojd, tjock, dorrBredd, dorrHojd, fonsterBredd, sill, fonsterTopp,
    minX: x - bredd / 2,
    maxX: x + bredd / 2,
    minZ: z - djup / 2,
    maxZ: z + djup / 2
  };
}

function lada(x, y, z, sx, sy, sz, roll) {
  return {
    roll, x, y, z, sx, sy, sz,
    minX: x - sx / 2, maxX: x + sx / 2,
    minY: y - sy / 2, maxY: y + sy / 2,
    minZ: z - sz / 2, maxZ: z + sz / 2
  };
}

export function husVaggar(spec, markY = 0) {
  const s = spec || husSpec();
  const y0 = Number(markY) || 0;
  const ut = [];
  const nordZ = s.minZ + s.tjock / 2;
  const sydZ = s.maxZ - s.tjock / 2;
  const halvF = s.fonsterBredd / 2;
  const halvD = s.dorrBredd / 2;
  const vansterF = (s.x - halvF) - s.minX;
  const hogerF = s.maxX - (s.x + halvF);
  ut.push(lada(s.minX + vansterF / 2, y0 + s.hojd / 2, nordZ, vansterF, s.hojd, s.tjock, 'vägg'));
  ut.push(lada(s.maxX - hogerF / 2, y0 + s.hojd / 2, nordZ, hogerF, s.hojd, s.tjock, 'vägg'));
  ut.push(lada(s.x, y0 + s.sill / 2, nordZ, s.fonsterBredd, s.sill, s.tjock, 'bröst'));
  const karm = s.hojd - s.fonsterTopp;
  ut.push(lada(s.x, y0 + s.fonsterTopp + karm / 2, nordZ, s.fonsterBredd, karm, s.tjock, 'karm'));
  const vansterD = (s.x - halvD) - s.minX;
  const hogerD = s.maxX - (s.x + halvD);
  ut.push(lada(s.minX + vansterD / 2, y0 + s.hojd / 2, sydZ, vansterD, s.hojd, s.tjock, 'vägg'));
  ut.push(lada(s.maxX - hogerD / 2, y0 + s.hojd / 2, sydZ, hogerD, s.hojd, s.tjock, 'vägg'));
  const over = s.hojd - s.dorrHojd;
  ut.push(lada(s.x, y0 + s.dorrHojd + over / 2, sydZ, s.dorrBredd, over, s.tjock, 'karm'));
  ut.push(lada(s.minX + s.tjock / 2, y0 + s.hojd / 2, s.z, s.tjock, s.hojd, s.djup, 'vägg'));
  ut.push(lada(s.maxX - s.tjock / 2, y0 + s.hojd / 2, s.z, s.tjock, s.hojd, s.djup, 'vägg'));
  ut.push(lada(s.x, y0 + s.hojd + 0.08, s.z, s.bredd + 0.2, 0.16, s.djup + 0.2, 'tak'));
  ut.push(lada(s.x, y0 + 0.04, s.z, s.bredd - s.tjock * 2.2, 0.08, s.djup - s.tjock * 2.2, 'golv'));
  return ut;
}

export function inneIHus(spec, x, z, marginal = 0.15) {
  const s = spec;
  return x > s.minX + s.tjock + marginal && x < s.maxX - s.tjock - marginal
    && z > s.minZ + s.tjock + marginal && z < s.maxZ - s.tjock - marginal;
}

export function sjalvtest() {
  const fel = [];
  const krav = (namn, ok) => { if (!ok) fel.push(namn); };
  const s = husSpec();
  const vaggar = husVaggar(s, 0);
  krav('hus nära start', Math.abs(s.x + 6) < 1e-6 && Math.abs(s.z + 14) < 1e-6);
  krav('bröstning 1,02', Math.abs(s.sill - 1.02) < 1e-6);
  krav('mitten är inne', inneIHus(s, s.x, s.z));
  const brost = vaggar.find(v => v.roll === 'bröst');
  krav('fönsterbräda finns', !!brost && Math.abs(brost.maxY - 1.02) < 1e-6);
  const under = forstaTraff(s.x, 0.78, s.z, 0, 0, -1, vaggar, 30);
  const genom = forstaTraff(s.x, 1.28, s.z, 0, 0, -1, vaggar, 30);
  krav('hukad träffar bröstningen', !!under && under.box.roll === 'bröst' && under.t < 4);
  krav('kikhöjd går genom fönstret', genom == null || genom.t > 8);
  const koll = skapaKollision(vaggar);
  const inFr = koll.ga(s.x, s.maxZ + 1.2, s.x, s.z, 0.28, 0, 1.7);
  krav('dörren släpper in', inFr.z < s.maxZ - s.tjock - 0.2);
  const utanfor = s.minX - 0.7;
  const iVagg = koll.ga(utanfor, s.z, s.x, s.z, 0.28, 0, 1.7);
  krav('ytterväggen stoppar', iVagg.x < s.minX + s.tjock);
  return fel;
}
