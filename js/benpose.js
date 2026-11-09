// Procedurella poser på den befintliga riggen. Inga nya klipp.
// Barnbenet sitter längs lokala +Y, så en böj är en extra rotation runt X efter viloläget.
import * as THREE from 'three';
const DEG = Math.PI / 180;
const NAMN = ['pelvis','spine_01','spine_02','spine_03','neck_01','thigh_l','thigh_r','calf_l','calf_r','foot_l','foot_r','clavicle_l','clavicle_r','upperarm_l','upperarm_r','lowerarm_l','lowerarm_r','hand_l','hand_r'];

const ARMAR = {
  upperarm_l: [0, 0, -105], upperarm_r: [0, 0, 105],
  lowerarm_l: [0, 0, 18], lowerarm_r: [0, 0, -18]
};
const POS = {
  stående: { ...ARMAR },
  hukande: {
    thigh_l: [0, 0, 58], thigh_r: [0, 0, -58],
    calf_l: [0, 0, -75], calf_r: [0, 0, 75],
    spine_01: [0, 0, 18], spine_02: [0, 0, 10],
    ...ARMAR
  },
  knastående: {
    thigh_r: [0, 0, -95], calf_r: [0, 0, 100],
    thigh_l: [0, 0, 42], calf_l: [0, 0, -48],
    spine_01: [0, 0, 8],
    ...ARMAR
  },
  liggande: {
    pelvis: [-82, 0, 0],
    thigh_l: [8, 0, 0], thigh_r: [8, 0, 0],
    calf_l: [-14, 0, 0], calf_r: [-14, 0, 0],
    upperarm_l: [0, 0, -28], upperarm_r: [0, 0, 28],
    lowerarm_l: [0, 0, 8], lowerarm_r: [0, 0, -8]
  }
};
const AXEL = {
  upperarm_r: [40, 0, 30],
  lowerarm_r: [-55, 0, 0],
  upperarm_l: [35, 0, -25],
  lowerarm_l: [-40, 0, 0],
  spine_03: [8, 0, 0]
};

export function skapaBen(root) {
  const ben = new Map();
  root.traverse(n => { if (NAMN.includes(n.name)) ben.set(n.name, { node: n, vila: n.quaternion.clone() }); });
  const extra = new THREE.Quaternion();
  const mal = new THREE.Quaternion();
  const euler = new THREE.Euler(0, 0, 0, 'XYZ');
  return {
    antal: ben.size,
    böj() {
      const t = ben.get('thigh_l');
      if (!t) return 0;
      return t.node.quaternion.angleTo(t.vila) * 180 / Math.PI;
    },
    applicera(stallning, axel, dt) {
      const tab = { ...(POS[stallning] || POS.stående) };
      if (axel && stallning !== 'liggande') for (const k of Object.keys(AXEL)) tab[k] = AXEL[k];
      const u = 1 - Math.exp(-Math.max(0.001, dt || 0.016) / 0.14);
      for (const [namn, del] of ben) {
        const grad = tab[namn];
        if (grad) {
          euler.set(grad[0] * DEG, grad[1] * DEG, grad[2] * DEG);
          extra.setFromEuler(euler);
          mal.copy(del.vila).multiply(extra);
        } else mal.copy(del.vila);
        del.node.quaternion.slerp(mal, u);
      }
    }
  };
}
