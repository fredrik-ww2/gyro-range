// Markmål för bombuppdrag plus luftvärn. Från flyg-v05d, med återställning vid ny omgång.
// Enkla primitiver, inga märken. Mål: bränsledepå, hangar, tåg, luftvärn.
// Luftvärnet skjuter spridda brisader. Skadan på spelaren bestäms av anroparen.
export function skapaMal(THREE, scene, hojd, D) {
  const mal = [], brisader = [], rok = [];
  const defs = (D && D.mal) || [];
  const matGra = new THREE.MeshLambertMaterial({ color: 0x8b8f86 }), matOliv = new THREE.MeshLambertMaterial({ color: 0x5c6648 }),
        matTegel = new THREE.MeshLambertMaterial({ color: 0x7a4a3a }), matSvart = new THREE.MeshLambertMaterial({ color: 0x2a2724 }),
        matSand = new THREE.MeshLambertMaterial({ color: 0x9c8a62 }), matTrae = new THREE.MeshLambertMaterial({ color: 0x4d4034 });
  const matForstord = new THREE.MeshLambertMaterial({ color: 0x1d1b19 });
  const rokMat = new THREE.MeshBasicMaterial({ color: 0x2b2a28, transparent: true, opacity: 0.55, depthWrite: false });
  const brisadMat = new THREE.MeshBasicMaterial({ color: 0x3a3632, transparent: true, opacity: 0.85, depthWrite: false });
  const blixtMat = new THREE.MeshBasicMaterial({ color: 0xffb060, transparent: true, opacity: 0.9, depthWrite: false });
  const rokGeo = new THREE.SphereGeometry(1, 7, 5), brisadGeo = new THREE.SphereGeometry(1, 8, 6);

  function bygg(def) {
    const g = new THREE.Group(); const y = hojd(def.x, def.z); g.position.set(def.x, y, def.z); g.rotation.y = def.vridning || 0;
    const delar = [];
    const lagg = (geo, mat, x, yy, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, yy, z); g.add(m); delar.push(m); return m; };
    let radie = 25, hp = 3, namn = def.namn;
    if (def.typ === 'depa') {
      namn = namn || 'Bränsledepå'; radie = 30; hp = 4;
      const tank = new THREE.CylinderGeometry(5.5, 5.5, 7, 14);
      [[-8, -8], [8, -8], [-8, 8], [8, 8]].forEach(([x, z]) => lagg(tank, matGra, x, 3.5, z));
      lagg(new THREE.BoxGeometry(30, 0.3, 30), matSvart, 0, 0.15, 0);
      lagg(new THREE.BoxGeometry(12, 4, 8), matTegel, 0, 2, -22);
    } else if (def.typ === 'hangar') {
      namn = namn || 'Hangar'; radie = 32; hp = 4;
      lagg(new THREE.BoxGeometry(44, 11, 28), matOliv, 0, 5.5, 0);
      const tak = lagg(new THREE.CylinderGeometry(14, 14, 44, 16, 1, false, 0, Math.PI), matOliv, 0, 11, 0);
      tak.rotation.set(0, 0, Math.PI / 2);
      lagg(new THREE.BoxGeometry(10, 6, 8), matTegel, 30, 3, 6);
      lagg(new THREE.BoxGeometry(60, 0.2, 60), matGra, 0, 0.1, 30);
    } else if (def.typ === 'tag') {
      namn = namn || 'Tåg'; radie = 40; hp = 3;
      lagg(new THREE.BoxGeometry(120, 0.4, 3), matTrae, 0, 0.2, 0);
      lagg(new THREE.BoxGeometry(12, 4, 3.2), matSvart, -40, 2.4, 0);
      const skorsten = lagg(new THREE.CylinderGeometry(1.4, 1.4, 8, 10), matSvart, -42, 3.6, 0);
      skorsten.rotation.z = Math.PI / 2;
      for (let i = 0; i < 5; i++) lagg(new THREE.BoxGeometry(10, 3.4, 3), i % 2 ? matTegel : matOliv, -26 + i * 12, 2.1, 0);
    } else if (def.typ === 'lv') {
      namn = namn || 'Luftvärn'; radie = 18; hp = 2;
      const vall = lagg(new THREE.TorusGeometry(7, 1.6, 8, 18), matSand, 0, 0.9, 0);
      vall.rotation.x = Math.PI / 2;
      lagg(new THREE.BoxGeometry(3, 1.6, 3), matGra, 0, 1.6, 0);
      const pipa = lagg(new THREE.CylinderGeometry(0.25, 0.35, 6, 8), matSvart, 0, 4, 0);
      pipa.rotation.x = -0.9;
      lagg(new THREE.BoxGeometry(5, 2.2, 3), matTrae, 10, 1.1, 4);
    }
    scene.add(g);
    const m = { ...def, namn, grupp: g, delar, radie, hp, hpMax: hp, forstord: false, y, naesta: 1 + Math.random() * 2 };
    mal.push(m); return m;
  }
  defs.forEach(bygg);

  function forstor(m) {
    m.forstord = true;
    m.delar.forEach((d, i) => { d.material = matForstord; d.rotation.x += (i % 2 ? 1 : -1) * 0.18; d.rotation.z += (i % 3 ? -1 : 1) * 0.12; d.position.y *= 0.65; });
    for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(rokGeo, rokMat); r.position.set(m.x + (Math.random() - 0.5) * 10, m.y + 4, m.z + (Math.random() - 0.5) * 10); scene.add(r); rok.push({ mesh: r, fas: i / 6, mal: m }); }
  }
  function traff(x, z, massa) {
    const spr = massa > 300 ? 34 : 26; let text = null;
    for (const m of mal) {
      if (m.forstord) continue;
      const d = Math.hypot(m.x - x, m.z - z); if (d > m.radie + spr) continue;
      const skada = d < m.radie * 0.6 ? 2 : 1; m.hp -= skada;
      text = m.hp <= 0 ? `${m.namn} förstört` : `${m.namn} träffat (${m.hp}/${m.hpMax})`;
      if (m.hp <= 0) forstor(m);
    }
    return text;
  }
  function uppdragStatus() {
    const primara = mal.filter(m => m.typ !== 'lv'); const klara = primara.filter(m => m.forstord).length;
    return { klara, totalt: primara.length, klart: klara === primara.length && primara.length > 0 };
  }
  function narmaste(pos, psi) {
    let b = null, bd = 1e9;
    for (const m of mal) { if (m.forstord || m.typ === 'lv') continue; const d = Math.hypot(m.x - pos.x, m.z - pos.z); if (d < bd) { bd = d; b = m; } }
    if (!b) return null;
    const vinkel = Math.atan2(-(b.x - pos.x), -(b.z - pos.z));
    let rel = vinkel - psi; while (rel > Math.PI) rel -= 2 * Math.PI; while (rel < -Math.PI) rel += 2 * Math.PI;
    return { mal: b, avstand: bd, rel: -rel };
  }
  function rensaEffekter() {
    for (const b of brisader) { scene.remove(b.mesh); scene.remove(b.blixt); b.mesh.material.dispose(); b.blixt.material.dispose(); }
    brisader.length = 0;
    for (const r of rok) scene.remove(r.mesh);
    rok.length = 0;
  }
  function aterstall() {
    rensaEffekter();
    for (const m of mal) scene.remove(m.grupp);
    mal.length = 0;
    defs.forEach(bygg);
  }
  const tmp = new THREE.Vector3();
  function uppdatera(dt, spelare, agl, onTraff, tid) {
    const L = (D && D.luftvarn) || {};
    for (const m of mal) {
      if (m.typ !== 'lv' || m.forstord) continue;
      const d = Math.hypot(m.x - spelare.pos.x, m.z - spelare.pos.z);
      if (d > (L.rackvidd_m || 2600) || agl < (L.min_hojd_m || 120)) continue;
      m.naesta -= dt; if (m.naesta > 0) continue;
      m.naesta = (L.intervall_s || 0.9) * (0.7 + Math.random() * 0.6);
      const flyg = d / (L.granathastighet_ms || 800), spr = (L.spridning_m || 60) * (0.4 + d / (L.rackvidd_m || 2600));
      tmp.set(spelare.pos.x + spelare.vel.x * flyg + (Math.random() - 0.5) * spr, spelare.pos.y + spelare.vel.y * flyg + (Math.random() - 0.5) * spr * 0.6, spelare.pos.z + spelare.vel.z * flyg + (Math.random() - 0.5) * spr);
      if (brisader.length > 24) continue;
      const bmesh = new THREE.Mesh(brisadGeo, brisadMat.clone()); bmesh.position.copy(tmp); bmesh.scale.setScalar(0.5); scene.add(bmesh);
      const f = new THREE.Mesh(brisadGeo, blixtMat.clone()); f.position.copy(tmp); f.scale.setScalar(2.5); scene.add(f);
      brisader.push({ mesh: bmesh, blixt: f, t: 0, traffad: false });
    }
    for (let i = brisader.length - 1; i >= 0; i--) {
      const b = brisader[i]; b.t += dt;
      const s = 2 + b.t * 14; b.mesh.scale.setScalar(Math.min(s, 13)); b.mesh.material.opacity = Math.max(0, 0.85 - b.t * 0.5);
      b.blixt.scale.setScalar(Math.max(0.01, 2.5 - b.t * 12)); b.blixt.material.opacity = Math.max(0, 0.9 - b.t * 6);
      if (!b.traffad && b.t < 0.25 && b.mesh.position.distanceTo(spelare.pos) < (L.skaderadie_m || 20)) { b.traffad = true; if (onTraff) onTraff(); }
      if (b.t > 1.8) { scene.remove(b.mesh); scene.remove(b.blixt); b.mesh.material.dispose(); b.blixt.material.dispose(); brisader.splice(i, 1); }
    }
    for (const r of rok) {
      r.fas += dt * 0.12; if (r.fas > 1) r.fas -= 1;
      r.mesh.position.y = r.mal.y + 4 + r.fas * 70; r.mesh.position.x += Math.sin(tid * 0.3 + r.fas * 6) * dt * 2;
      r.mesh.scale.setScalar(3 + r.fas * 18);
    }
  }
  return { mal, traff, uppdatera, uppdragStatus, narmaste, aterstall };
}
