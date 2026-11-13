// Ställningar på soldat.glb (Soldat_Rig). Inga egna skelett.
// Barnbenet pekar längs lokal +Y. I viloläget är lokal X kroppens vänster–höger,
// så en böj i sidplanet är en gångjärnsrotation runt X efter vilokvaternioen.
// Tidigare poser roterade lår och rygg runt Z och vred därför lederna ur led.
// Armarna löses med tvåbens-IK så händerna når vapnets grepp och framstock.
import * as THREE from 'three';

const DEG = Math.PI / 180;
const KROPP = ['pelvis', 'spine_01', 'spine_02', 'spine_03', 'neck_01', 'thigh_l', 'thigh_r', 'calf_l', 'calf_r', 'foot_l', 'foot_r', 'clavicle_l', 'clavicle_r', 'upperarm_l', 'upperarm_r', 'lowerarm_l', 'lowerarm_r', 'hand_l', 'hand_r'];
const ARM = new Set(['upperarm_l', 'upperarm_r', 'lowerarm_l', 'lowerarm_r', 'hand_l', 'hand_r']);

// Grader runt lokal X. Negativt lår svänger knät framåt (tåns håll, modellens +Z).
// Positivt smalben böjer knät. Foten kring −55° ligger platt i huk.
export const POSER = {
  stående: { thigh_l: -6, thigh_r: -6, calf_l: 12, calf_r: 12, foot_l: -6, foot_r: -6, spine_01: 2 },
  hukande: { thigh_l: -65, thigh_r: -65, calf_l: 95, calf_r: 95, foot_l: -55, foot_r: -55, spine_01: 10, spine_02: 5 },
  knastående: { thigh_r: -10, calf_r: 100, foot_r: 40, thigh_l: -80, calf_l: 115, foot_l: -55, spine_01: 8, spine_02: 4 },
  liggande: { pelvis: 90, foot_l: 40, foot_r: 40 }
};

// Handmål i modellens rum ( +X vänster, +Y upp, +Z framåt ), från spine_03.
// hx/hy/hz är höger hand. dist är avståndet längs pipan till vänster hand.
// tipp lutar pipan nedåt. Värdena är inom armlängden på den här riggen.
export const MAL = {
  sankt: { hx: -0.11, hy: -0.06, hz: 0.2, dist: 0.22, tipp: 0.14 },
  axel: { hx: -0.07, hy: -0.05, hz: 0.16, dist: 0.22, tipp: 0.06 },
  liggSankt: { hx: -0.12, hy: 0.07, hz: 0.18, dist: 0.22, tipp: 0.1 },
  liggAxel: { hx: -0.1, hy: 0.1, hz: 0.2, dist: 0.24, tipp: 0.02 }
};

const STEG = { thigh_l: 14, thigh_r: 14, calf_l: -8, calf_r: -8, foot_l: 5, foot_r: 5 };

function blanda(a, b, t) {
  const u = Math.min(1, Math.max(0, t || 0));
  return {
    hx: a.hx + (b.hx - a.hx) * u,
    hy: a.hy + (b.hy - a.hy) * u,
    hz: a.hz + (b.hz - a.hz) * u,
    dist: a.dist + (b.dist - a.dist) * u,
    tipp: a.tipp + (b.tipp - a.tipp) * u
  };
}

export function skapaBen(root, install = {}) {
  const poser = install.poser || POSER;
  const malTab = install.mal || MAL;
  const ben = new Map();
  const fingrar = [];
  root.traverse(n => {
    if (KROPP.includes(n.name)) ben.set(n.name, { node: n, vila: n.quaternion.clone() });
    else if (/^(index|middle|ring|pinky|thumb)_0[1-3]_[lr]$/.test(n.name)) fingrar.push({ node: n, vila: n.quaternion.clone(), led: n.name.includes('_01_') ? 62 : n.name.includes('_02_') ? 48 : 30, tumme: n.name.startsWith('thumb') });
  });
  const extraQ = new THREE.Quaternion();
  const malQ = new THREE.Quaternion();
  const euler = new THREE.Euler(0, 0, 0, 'XYZ');
  const parentQ = new THREE.Quaternion();
  const restW = new THREE.Quaternion();
  const delta = new THREE.Quaternion();
  const worldQ = new THREE.Quaternion();
  const restY = new THREE.Vector3();
  const onskat = new THREE.Vector3();
  const axelPos = new THREE.Vector3();
  const rikt = new THREE.Vector3();
  const tillPole = new THREE.Vector3();
  const sida = new THREE.Vector3();
  const armbage = new THREE.Vector3();
  const fram = new THREE.Vector3();
  const upp = new THREE.Vector3();
  const vanster = new THREE.Vector3();
  const brost = new THREE.Vector3();
  const grepp = new THREE.Vector3();
  const stod = new THREE.Vector3();
  const poleH = new THREE.Vector3();
  const poleV = new THREE.Vector3();
  let langdU = 0;
  let langdL = 0;
  let skala = 1;

  function matt() {
    if (langdU > 0) return;
    root.updateWorldMatrix(true, true);
    const u = ben.get('upperarm_r')?.node;
    const l = ben.get('lowerarm_r')?.node;
    const h = ben.get('hand_r')?.node;
    if (!u || !l || !h) return;
    u.getWorldPosition(axelPos);
    l.getWorldPosition(rikt);
    langdU = axelPos.distanceTo(rikt) || 0.25;
    h.getWorldPosition(axelPos);
    langdL = rikt.distanceTo(axelPos) || 0.24;
    skala = langdU / 0.251;
  }

  function mjukhet(dt, hard) {
    if (hard) return 1;
    return 1 - Math.exp(-Math.max(0.001, dt || 0.016) / 0.07);
  }

  function satt(del, quat, u) {
    if (u >= 1) del.node.quaternion.copy(quat);
    else del.node.quaternion.slerp(quat, u);
  }

  function gangjarn(namn, grader, u) {
    const del = ben.get(namn);
    if (!del) return;
    euler.set((grader || 0) * DEG, 0, 0);
    extraQ.setFromEuler(euler);
    malQ.copy(del.vila).multiply(extraQ);
    satt(del, malQ, u);
  }

  function svang(del, malVarld, u) {
    const node = del.node;
    node.updateWorldMatrix(true, false);
    node.getWorldPosition(axelPos);
    onskat.copy(malVarld).sub(axelPos);
    if (onskat.lengthSq() < 1e-8) return;
    onskat.normalize();
    node.parent.getWorldQuaternion(parentQ);
    restW.copy(parentQ).multiply(del.vila);
    restY.set(0, 1, 0).applyQuaternion(restW);
    if (restY.dot(onskat) < -0.999) delta.setFromAxisAngle(vanster, Math.PI);
    else delta.setFromUnitVectors(restY, onskat);
    worldQ.copy(delta).multiply(restW);
    malQ.copy(parentQ).invert().multiply(worldQ);
    satt(del, malQ, u);
  }

  function ik(upperNamn, lowerNamn, malVarld, pole, u) {
    const upper = ben.get(upperNamn);
    const lower = ben.get(lowerNamn);
    if (!upper || !lower) return;
    upper.node.updateWorldMatrix(true, false);
    upper.node.getWorldPosition(axelPos);
    rikt.copy(malVarld).sub(axelPos);
    const raw = rikt.length();
    if (raw < 1e-5) return;
    rikt.multiplyScalar(1 / raw);
    const max = (langdU + langdL) * 0.985;
    const min = Math.abs(langdU - langdL) + 0.01;
    const dist = Math.min(max, Math.max(min, raw));
    const cosA = (langdU * langdU + dist * dist - langdL * langdL) / (2 * langdU * dist);
    const adj = langdU * Math.max(-1, Math.min(1, cosA));
    const hyp = Math.sqrt(Math.max(0, langdU * langdU - adj * adj));
    tillPole.copy(pole).sub(axelPos);
    sida.copy(tillPole).addScaledVector(rikt, -tillPole.dot(rikt));
    if (sida.lengthSq() < 1e-8) sida.set(0, -1, 0).addScaledVector(rikt, rikt.y);
    sida.normalize();
    armbage.copy(axelPos).addScaledVector(rikt, adj).addScaledVector(sida, hyp);
    svang(upper, armbage, u);
    upper.node.updateWorldMatrix(true, true);
    svang(lower, malVarld, u);
  }

  function inomRack(skuldra, mal) {
    const max = (langdU + langdL) * 0.96;
    rikt.copy(mal).sub(skuldra);
    const len = rikt.length();
    if (len > max && len > 1e-5) mal.copy(skuldra).addScaledVector(rikt, max / len);
  }

  function rakna(axel, stallning) {
    const spine = ben.get('spine_03')?.node;
    if (!spine) return null;
    root.updateWorldMatrix(true, true);
    vanster.set(1, 0, 0).transformDirection(root.matrixWorld);
    upp.set(0, 1, 0).transformDirection(root.matrixWorld);
    fram.set(0, 0, 1).transformDirection(root.matrixWorld);
    spine.getWorldPosition(brost);
    const tab = stallning === 'liggande'
      ? blanda(malTab.liggSankt, malTab.liggAxel, axel)
      : blanda(malTab.sankt, malTab.axel, axel);
    grepp.copy(brost)
      .addScaledVector(vanster, tab.hx * skala)
      .addScaledVector(upp, tab.hy * skala)
      .addScaledVector(fram, tab.hz * skala);
    const lut = fram.clone().multiplyScalar(Math.cos(tab.tipp)).addScaledVector(upp, -Math.sin(tab.tipp));
    if (lut.lengthSq() < 1e-8) lut.copy(fram);
    lut.normalize();
    stod.copy(grepp).addScaledVector(lut, tab.dist * skala);
    const axelH = ben.get('upperarm_r')?.node;
    const axelV = ben.get('upperarm_l')?.node;
    if (axelH) { axelH.getWorldPosition(axelPos); inomRack(axelPos, grepp); }
    if (axelV) { axelV.getWorldPosition(axelPos); inomRack(axelPos, stod); }
    poleH.copy(grepp).addScaledVector(vanster, -0.26 * skala).addScaledVector(upp, -0.2 * skala);
    poleV.copy(stod).addScaledVector(vanster, 0.26 * skala).addScaledVector(upp, -0.16 * skala);
    return { grepp: grepp.clone(), stod: stod.clone(), fram: lut.clone(), upp: upp.clone() };
  }

  function armarMot(mal, u) {
    if (!mal) return;
    ik('upperarm_r', 'lowerarm_r', mal.grepp, poleH, u);
    root.updateWorldMatrix(true, true);
    ik('upperarm_l', 'lowerarm_l', mal.stod, poleV, u);
    for (const namn of ['hand_r', 'hand_l']) {
      const del = ben.get(namn);
      if (del) satt(del, del.vila, u);
    }
    for (const del of fingrar) {
      const grader = del.tumme ? del.led * 0.45 : del.led;
      const tecken = del.node.name.endsWith('_l') ? -1 : 1;
      euler.set(grader * tecken * DEG, 0, 0);
      extraQ.setFromEuler(euler);
      malQ.copy(del.vila).multiply(extraQ);
      if (u >= 1) del.node.quaternion.copy(malQ);
      else del.node.quaternion.slerp(malQ, u);
    }
  }

  let senaste = null;

  return {
    antal: ben.size,
    poser,
    mal: malTab,
    böj() {
      const t = ben.get('thigh_l');
      if (!t) return 0;
      return t.node.quaternion.angleTo(t.vila) * 180 / Math.PI;
    },
    senaste() { return senaste; },
    // axel 0 = på armen, 1 = i axeln. fas är stegrytm i radianer, 0 står stilla.
    // hard skriver kvaternionerna direkt (efter ett klipp som annars skriver över nästa bild).
    applicera(stallning, axel = 0, dt = 0.016, fas = 0, hard = false) {
      matt();
      const u = mjukhet(dt, hard);
      const tab = poser[stallning] || poser.stående;
      const rytm = fas || 0;
      for (const namn of KROPP) {
        if (ARM.has(namn)) continue;
        let grader = tab[namn] || 0;
        if (rytm && STEG[namn]) grader += Math.sin(rytm + (namn.endsWith('_r') ? Math.PI : 0)) * STEG[namn];
        gangjarn(namn, grader, u);
      }
      root.updateWorldMatrix(true, true);
      senaste = rakna(axel, stallning);
      armarMot(senaste, u);
      root.updateWorldMatrix(true, true);
      return senaste;
    },
    armar(axel = 0, dt = 0.016, stallning = 'stående') {
      matt();
      root.updateWorldMatrix(true, true);
      senaste = rakna(axel, stallning);
      armarMot(senaste, 1);
      root.updateWorldMatrix(true, true);
      return senaste;
    }
  };
}
