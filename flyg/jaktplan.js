// Lätt jaktplan i meter, nos mot -Z. Bf 109-proportioner utan den tunga GLB-filen
// (drygt 200 000 trianglar). Måtten kommer från config form.
export function skapaJaktplan(THREE, F) {
  const rot = new THREE.Group();
  rot.name = 'Jaktplan';
  const mat = (farg, extra) => new THREE.MeshStandardMaterial({ color: farg, roughness: 0.72, metalness: 0.08, ...extra });
  const kropp = mat(F.farg_kropp, { side: THREE.DoubleSide });
  const nos = mat(F.farg_nos);
  const mork = mat(F.farg_mork);
  const glas = mat(F.farg_glas, { transparent: true, opacity: 0.45, roughness: 0.15, metalness: 0.2 });

  function del(geom, material, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(geom, material);
    mesh.position.set(x, y, z);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    mesh.castShadow = false;
    rot.add(mesh);
    return mesh;
  }

  const L = F.langd_m;
  const nosZ = -L * 0.48;
  del(new THREE.CylinderGeometry(F.kropp_radie * 0.72, F.kropp_radie, L * 0.62, 10), kropp, 0, F.kropp_y, -L * 0.02, Math.PI / 2);
  del(new THREE.CylinderGeometry(F.kropp_radie * 0.28, F.kropp_radie * 0.7, L * 0.28, 8), nos, 0, F.kropp_y, nosZ + L * 0.08, Math.PI / 2);
  del(new THREE.SphereGeometry(F.spinner_radie, 10, 8), nos, 0, F.kropp_y, nosZ - 0.05);
  del(new THREE.CylinderGeometry(F.kropp_radie * 0.22, F.kropp_radie * 0.55, L * 0.34, 8), kropp, 0, F.kropp_y + 0.05, L * 0.36, Math.PI / 2);

  const halv = F.spann_m / 2;
  const form = new THREE.Shape();
  form.moveTo(0, 0);
  const steg = 7;
  for (let i = 0; i <= steg; i++) {
    const t = i / steg;
    const x = t * halv;
    const korda = F.korda_rot + (F.korda_tipp - F.korda_rot) * Math.sin(t * Math.PI / 2);
    form.lineTo(x, -korda);
  }
  form.lineTo(0, -F.korda_rot);
  const vingeGeom = new THREE.ExtrudeGeometry(form, { depth: F.vinge_tjock, bevelEnabled: false, steps: 1, curveSegments: 1 });
  vingeGeom.rotateX(Math.PI / 2);
  vingeGeom.translate(0, F.vinge_y, F.vinge_z);
  const vanster = new THREE.Mesh(vingeGeom, kropp);
  const hoger = vanster.clone();
  hoger.scale.x = -1;
  rot.add(vanster, hoger);
  del(new THREE.SphereGeometry(F.tipp_radie, 8, 6), mork, halv - 0.05, F.vinge_y, F.vinge_z - F.korda_tipp * 0.45);
  del(new THREE.SphereGeometry(F.tipp_radie, 8, 6), mork, -halv + 0.05, F.vinge_y, F.vinge_z - F.korda_tipp * 0.45);

  del(new THREE.BoxGeometry(F.stab_spann, 0.08, F.stab_korda), kropp, 0, F.stab_y, F.stab_z);
  del(new THREE.BoxGeometry(0.08, F.fena_hojd, F.fena_korda), mork, 0, F.fena_y, F.fena_z);

  del(new THREE.SphereGeometry(F.huv_radie, 10, 8), glas, 0, F.huv_y, F.huv_z);
  del(new THREE.BoxGeometry(0.04, F.huv_radie * 1.1, 0.04), mork, 0, F.huv_y, F.huv_z - F.huv_radie * 0.2);

  const prop = del(new THREE.BoxGeometry(0.12, F.prop_radie * 1.7, 0.06), mork, 0, F.kropp_y, nosZ - 0.22);
  prop.name = 'Propeller';
  const nav = del(new THREE.CylinderGeometry(0.16, 0.2, 0.18, 8), nos, 0, F.kropp_y, nosZ - 0.28, Math.PI / 2);
  nav.name = 'Spinner';
  return rot;
}
