import * as THREE from 'three';

const HOJD = 1.78;
const PLATSER = [
  {namn: 'usa', x: -2.2, z: -8.2, yaw: 0.2, beteende: 'vakt'},
  {namn: 'usa', x: 3.1, z: -11.5, yaw: -0.4, beteende: 'patrull'},
  {namn: 'usa', x: -15, z: -8, yaw: 1.0, beteende: 'kik'},
  {namn: 'usa', x: 3, z: -30, yaw: 0.15, beteende: 'patrull'},
  {namn: 'tysk', x: 16, z: -4, yaw: 2.6, beteende: 'vakt'},
  {namn: 'tysk', x: 14, z: 14, yaw: -2.3, beteende: 'patrull'},
  {namn: 'tysk', x: -5, z: 20, yaw: 2.8, beteende: 'kik'},
  {namn: 'tysk', x: 21, z: 18, yaw: -1.7, beteende: 'patrull'}
];
const EXTRA = [
  {namn: 'tysk', x: -28, z: -30, yaw: 0.35, beteende: 'kik'},
  {namn: 'usa', x: 22, z: -12, yaw: 2.4, beteende: 'patrull'},
  {namn: 'tysk', x: -10, z: 28, yaw: 1.15, beteende: 'vakt'},
  {namn: 'usa', x: 8, z: 8, yaw: -1.1, beteende: 'kik'}
];
const FARG = {usa: 0x6a5a34, tysk: 0x3c4838};
const LANGD = 4.6;
const FART = 0.85;

function klonaSkinn(source) {
  const clone = source.clone(true);
  const src = [];
  const dst = [];
  source.traverse(n => src.push(n));
  clone.traverse(n => dst.push(n));
  const map = new Map();
  src.forEach((n, i) => map.set(n, dst[i]));
  dst.forEach((node, i) => {
    if (!node.isSkinnedMesh) return;
    const orig = src[i];
    node.skeleton = orig.skeleton.clone();
    node.skeleton.bones = orig.skeleton.bones.map(b => map.get(b) || b);
    node.bind(node.skeleton, orig.bindMatrix);
    node.frustumCulled = false;
    node.castShadow = false;
    node.receiveShadow = false;
  });
  return clone;
}

function tona(root, hex) {
  const mal = new THREE.Color(hex);
  root.traverse(n => {
    if (!n.isMesh) return;
    const lista = Array.isArray(n.material) ? n.material : [n.material];
    const nya = lista.map(m => {
      const c = m.clone();
      if (/skin|eye|eyebrow|moustache/i.test(c.name || '')) return c;
      c.color.lerp(mal, 0.38);
      return c;
    });
    n.material = Array.isArray(n.material) ? nya : nya[0];
    n.userData.soldatKropp = true;
  });
}

function klipp(animations, del) {
  return animations.find(a => (a.name || '').includes(del)) || null;
}

function paPlats(clip) {
  if (!clip) return null;
  const c = clip.clone();
  for (const track of c.tracks) {
    if (!/position$/.test(track.name)) continue;
    if (!/Root|Hips|Body/.test(track.name)) continue;
    const v = track.values;
    if (v.length < 3) continue;
    const x0 = v[0];
    const z0 = v[2];
    for (let i = 0; i < v.length; i += 3) {
      v[i] = x0;
      v[i + 2] = z0;
    }
  }
  return c;
}

const _hp = new THREE.Vector3();
const _fp = new THREE.Vector3();

function benPunkt(rot, namn, ut) {
  const ben = rot.getObjectByName(namn);
  if (!ben) return false;
  rot.updateWorldMatrix(true, true);
  ben.getWorldPosition(ut);
  return true;
}

// Armaturen är skalad 100 gånger. Höjden tas från benen, inte från varje hörn.
function matUpp(rot) {
  const sparadQ = rot.quaternion.clone();
  const sparadS = rot.scale.clone();
  const sparadP = rot.position.clone();
  benPunkt(rot, 'Head', _hp);
  const harFot = benPunkt(rot, 'FootL', _fp) || benPunkt(rot, 'FootR', _fp);
  const q = new THREE.Quaternion();
  if (harFot && _hp.y < _fp.y) q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
  rot.quaternion.multiply(q);
  benPunkt(rot, 'Head', _hp);
  if (harFot) benPunkt(rot, 'FootL', _fp) || benPunkt(rot, 'FootR', _fp);
  const spann = harFot ? Math.abs(_hp.y - _fp.y) : 1.5;
  const hojd = Math.max(0.5, spann / 0.86);
  rot.scale.multiplyScalar(HOJD / hojd);
  if (harFot) benPunkt(rot, 'FootL', _fp) || benPunkt(rot, 'FootR', _fp);
  else benPunkt(rot, 'Head', _hp);
  const y = harFot ? -_fp.y : 0;
  const mall = {q: rot.quaternion.clone(), s: rot.scale.x, y};
  rot.quaternion.copy(sparadQ);
  rot.scale.copy(sparadS);
  rot.position.copy(sparadP);
  return mall;
}

function stallMall(visual, mall) {
  visual.quaternion.copy(mall.q);
  visual.scale.setScalar(mall.s);
  visual.position.set(0, mall.y, 0);
}

export function stallSoldater(scene, kalla) {
  const klippBank = {};
  const mallar = {};
  for (const namn of ['usa', 'tysk']) {
    const gltf = kalla[namn];
    klippBank[namn] = {
      idle: klipp(gltf.animations, 'Idle_Gun'),
      peka: klipp(gltf.animations, 'Idle_Gun_Pointing'),
      walk: paPlats(klipp(gltf.animations, '|Walk') || klipp(gltf.animations, 'Walk')),
      death: klipp(gltf.animations, 'Death')
    };
    const prov = klonaSkinn(gltf.scene);
    const mixer = new THREE.AnimationMixer(prov);
    const idle = klippBank[namn].idle;
    if (idle) {
      mixer.clipAction(idle).play();
      mixer.update(0.35);
    }
    mallar[namn] = matUpp(prov);
    mixer.stopAllAction();
  }

  const lista = [];
  let nastaExtra = 0;
  const _huvud = new THREE.Vector3();
  const _upp = new THREE.Vector3(0, 1, 0);

  function bygg(plats) {
    const gltf = kalla[plats.namn];
    const visual = klonaSkinn(gltf.scene);
    tona(visual, FARG[plats.namn] || 0x555544);
    stallMall(visual, mallar[plats.namn]);
    const fallGrupp = new THREE.Group();
    fallGrupp.add(visual);
    const wrap = new THREE.Group();
    wrap.name = 'soldat';
    wrap.add(fallGrupp);
    const hitbox = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.32, 1.05, 3, 6),
      new THREE.MeshBasicMaterial({visible: false})
    );
    hitbox.position.y = 0.98;
    hitbox.castShadow = false;
    hitbox.receiveShadow = false;
    wrap.add(hitbox);
    scene.add(wrap);
    wrap.position.set(plats.x, 0, plats.z);
    wrap.rotation.y = plats.yaw;

    const bank = klippBank[plats.namn];
    const mixer = new THREE.AnimationMixer(visual);
    const actions = {
      idle: bank.idle ? mixer.clipAction(bank.idle) : null,
      peka: bank.peka ? mixer.clipAction(bank.peka) : null,
      walk: bank.walk ? mixer.clipAction(bank.walk) : null,
      death: bank.death ? mixer.clipAction(bank.death) : null
    };
    if (actions.death) {
      actions.death.setLoop(THREE.LoopOnce, 1);
      actions.death.clampWhenFinished = true;
    }
    let aktuell = null;
    function spela(nyckel, mjuk = 0.2) {
      const nasta = actions[nyckel] || actions.idle;
      if (!nasta || nasta === aktuell) return;
      if (aktuell) aktuell.fadeOut(mjuk);
      nasta.reset().fadeIn(mjuk).play();
      aktuell = nasta;
    }
    const startKlipp = plats.beteende === 'patrull' ? 'walk' : plats.beteende === 'kik' ? 'peka' : 'idle';
    spela(startKlipp, 0);
    mixer.update(0.2);

    const soldat = {
      index: lista.length,
      sida: plats.namn,
      beteende: plats.beteende,
      lever: true,
      fallTid: 0,
      damm: false,
      vag: Math.random() * LANGD,
      bas: {x: plats.x, z: plats.z, yaw: plats.yaw},
      wrap, fallGrupp, hitbox, visual, mixer,
      spela,
      fall() {
        if (!this.lever) return false;
        this.lever = false;
        this.fallTid = 0;
        this.damm = false;
        if (actions.death) {
          if (aktuell) aktuell.fadeOut(0.08);
          actions.death.reset().fadeIn(0.05).play();
          aktuell = actions.death;
        } else if (aktuell) aktuell.paused = true;
        return true;
      },
      res() {
        this.lever = true;
        this.fallTid = 0;
        this.damm = false;
        this.fallGrupp.rotation.x = 0;
        this.wrap.position.set(this.bas.x, 0, this.bas.z);
        this.wrap.rotation.y = this.bas.yaw;
        const nyckel = this.beteende === 'patrull' ? 'walk' : this.beteende === 'kik' ? 'peka' : 'idle';
        aktuell = null;
        spela(nyckel, 0.05);
      }
    };
    hitbox.userData.soldat = soldat;
    lista.push(soldat);
    return soldat;
  }

  for (const plats of PLATSER) bygg(plats);

  function patrull(s, dt) {
    if (s.beteende !== 'patrull') return;
    s.vag += dt * FART;
    const span = LANGD * 2;
    let p = s.vag % span;
    if (p < 0) p += span;
    const fram = p <= LANGD;
    const d = fram ? p : span - p;
    const yaw = s.bas.yaw;
    const ux = Math.sin(yaw);
    const uz = Math.cos(yaw);
    s.wrap.position.x = s.bas.x + ux * (d - LANGD * 0.5);
    s.wrap.position.z = s.bas.z + uz * (d - LANGD * 0.5);
    s.wrap.rotation.y = yaw + (fram ? 0 : Math.PI);
  }

  function uppdatera(dt) {
    const damm = [];
    for (const s of lista) {
      s.mixer.update(dt);
      if (s.lever) {
        patrull(s, dt);
        continue;
      }
      s.fallTid += dt;
      s.wrap.updateWorldMatrix(true, true);
      const huvud = s.visual.getObjectByName('Head');
      let huvudY = 0.4;
      if (huvud) {
        huvud.getWorldPosition(_huvud);
        huvudY = _huvud.y;
      }
      if (huvudY > 0.62) {
        const e = Math.min(1, s.fallTid / 0.8);
        const mjuk = e * e * (3 - 2 * e);
        s.fallGrupp.rotation.x = mjuk * 1.35;
      }
      if (!s.damm && s.fallTid > 0.42) {
        s.damm = true;
        damm.push(new THREE.Vector3(s.wrap.position.x, 0.08, s.wrap.position.z));
      }
    }
    return damm;
  }

  function traffa(raycaster) {
    const mal = [];
    for (const s of lista) if (s.lever) mal.push(s.hitbox);
    if (!mal.length) return null;
    const hits = raycaster.intersectObjects(mal, false);
    if (!hits.length) return null;
    const s = hits[0].object.userData.soldat;
    s.fall();
    return {index: s.index, sida: s.sida, avstand: hits[0].distance, punkt: hits[0].point.clone(), normal: _upp.clone()};
  }

  function siktePunkt(index) {
    const s = lista[index];
    if (!s || !s.lever) return null;
    s.wrap.updateWorldMatrix(true, true);
    return s.hitbox.getWorldPosition(new THREE.Vector3());
  }

  function status() {
    return lista.map(s => ({
      index: s.index,
      sida: s.sida,
      lever: s.lever,
      fall: s.lever ? 0 : Math.min(1, s.fallTid / 0.85),
      beteende: s.beteende,
      x: +s.wrap.position.x.toFixed(2),
      z: +s.wrap.position.z.toFixed(2)
    }));
  }

  function resFallna() {
    let n = 0;
    for (const s of lista) if (!s.lever) { s.res(); n++; }
    return n;
  }

  function fyllPa() {
    if (nastaExtra < EXTRA.length && lista.length < PLATSER.length + EXTRA.length) {
      const s = bygg(EXTRA[nastaExtra]);
      nastaExtra++;
      return {nytt: s.index, resta: 0};
    }
    return {nytt: null, resta: resFallna()};
  }

  return {uppdatera, traffa, siktePunkt, status, resFallna, fyllPa, get antal() { return lista.length; }};
}
