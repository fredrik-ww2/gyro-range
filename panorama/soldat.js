import * as THREE from 'three';

const HOJD = 1.78;
const FARG = {usa: 0x6a5a34, tysk: 0x3c4838};
const LANGD = 4.6;
const FART = 0.85;
const KROPP_BEN = ['Chest', 'Torso', 'Abdomen', 'Hips', 'UpperArm.L', 'UpperArm.R', 'UpperLeg.L', 'UpperLeg.R'];
const MARK_BEN = ['Head', 'Hips', 'Chest', 'Foot.L', 'Foot.R'];

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
const _p = new THREE.Vector3();
const _ws = new THREE.Vector3();

function benNamn(rot, namn) {
  return rot.getObjectByName(namn) || rot.getObjectByName(namn.replace('.', ''));
}

function benPunkt(rot, namn, ut) {
  const ben = benNamn(rot, namn);
  if (!ben) return false;
  rot.updateWorldMatrix(true, true);
  ben.getWorldPosition(ut);
  return true;
}

// Armaturen är skalad ungefär 100 gånger. Höjden tas från benen, inte från varje hörn.
function matUpp(rot) {
  const sparadQ = rot.quaternion.clone();
  const sparadS = rot.scale.clone();
  const sparadP = rot.position.clone();
  benPunkt(rot, 'Head', _hp);
  const harFot = benPunkt(rot, 'Foot.L', _fp) || benPunkt(rot, 'Foot.R', _fp);
  const q = new THREE.Quaternion();
  if (harFot && _hp.y < _fp.y) q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
  rot.quaternion.multiply(q);
  benPunkt(rot, 'Head', _hp);
  if (harFot) benPunkt(rot, 'Foot.L', _fp) || benPunkt(rot, 'Foot.R', _fp);
  const spann = harFot ? Math.abs(_hp.y - _fp.y) : 1.5;
  const hojd = Math.max(0.5, spann / 0.86);
  rot.scale.multiplyScalar(HOJD / hojd);
  if (harFot) benPunkt(rot, 'Foot.L', _fp) || benPunkt(rot, 'Foot.R', _fp);
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

export function stallSoldater(scene, kalla, miljo = {}) {
  const markHojd = typeof miljo.markHojd === 'function' ? miljo.markHojd : () => 0;
  const effekt = miljo.effekt || null;
  const traff = miljo.traff || {kroppsskott: 3, huvudSkottDodar: true, huvudRadie: 0.15};
  const rayMax = Number.isFinite(+miljo.rayMax) ? +miljo.rayMax : 560;
  const PLATSER = Array.isArray(miljo.platser) ? miljo.platser : [];
  const EXTRA = Array.isArray(miljo.extra) ? miljo.extra : [];
  const kroppGeo = new THREE.CapsuleGeometry(0.34, 0.62, 3, 6);
  const dold = new THREE.MeshBasicMaterial({visible: false});
  const huvudGeo = new THREE.SphereGeometry(traff.huvudRadie, 8, 6);

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

  function laggPaMark(s, lyftKropp) {
    s.wrap.position.y = markHojd(s.wrap.position.x, s.wrap.position.z);
    if (!lyftKropp) return;
    s.wrap.updateWorldMatrix(true, true);
    let lyft = 0;
    for (const namn of MARK_BEN) {
      const ben = benNamn(s.visual, namn);
      if (!ben) continue;
      ben.getWorldPosition(_p);
      const golv = markHojd(_p.x, _p.z) + 0.02;
      if (_p.y < golv) lyft = Math.max(lyft, golv - _p.y);
    }
    if (lyft > 0) s.wrap.position.y += lyft;
  }

  function huvudVarld(s, ut) {
    const ben = benNamn(s.visual, 'Head');
    if (!ben) return false;
    s.visual.updateWorldMatrix(true, true);
    ben.getWorldPosition(ut);
    return true;
  }

  function flyttaHuvud(s) {
    if (!huvudVarld(s, _hp)) return;
    s.huvud.position.copy(_hp);
    s.huvud.updateMatrixWorld();
  }

  function narmaste(s, punkt) {
    let best = benNamn(s.visual, 'Chest') || benNamn(s.visual, 'Hips');
    let bestD = Infinity;
    for (const namn of KROPP_BEN) {
      const ben = benNamn(s.visual, namn);
      if (!ben) continue;
      ben.getWorldPosition(_p);
      const d = _p.distanceToSquared(punkt);
      if (d < bestD) { bestD = d; best = ben; }
    }
    return best;
  }

  function sarPa(s, ben, punkt, typ) {
    if (!effekt || !ben) return;
    const lokal = ben.worldToLocal(punkt.clone());
    ben.getWorldScale(_ws);
    const langd = lokal.length() * _ws.x;
    const mal = typ === 'huvud' ? 0.09 : 0.07;
    if (langd > 1e-4) lokal.multiplyScalar(mal / langd);
    else lokal.set(0, 0.02, 0.05);
    const m = effekt.fast(ben, lokal, typ, typ === 'huvud' ? 0.075 : 0.05);
    if (m) s.sar.push(m);
  }

  function rensaSar(s) {
    if (!effekt) { s.sar.length = 0; return; }
    for (const m of s.sar) effekt.los(m);
    s.sar.length = 0;
  }

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
    const hitbox = new THREE.Mesh(kroppGeo, dold);
    hitbox.position.y = 0.71;
    hitbox.castShadow = false;
    hitbox.receiveShadow = false;
    wrap.add(hitbox);
    const huvud = new THREE.Mesh(huvudGeo, dold);
    huvud.castShadow = false;
    huvud.receiveShadow = false;
    scene.add(huvud);
    scene.add(wrap);
    wrap.position.set(plats.x, markHojd(plats.x, plats.z), plats.z);
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
      zon: plats.zon || 'nara',
      beteende: plats.beteende,
      vapen: plats.vapen === 'mg42' ? 'mg42' : plats.vapen === 'gevar' ? 'gevar' : '',
      lever: true,
      fallTid: 0,
      damm: false,
      kroppTraff: 0,
      ryck: 0,
      ryckTecken: 1,
      sar: [],
      vag: Math.random() * LANGD,
      bas: {x: plats.x, z: plats.z, yaw: plats.yaw},
      wrap, fallGrupp, hitbox, huvud, visual, mixer,
      spela,
      fall(val = {}) {
        if (!this.lever) return false;
        this.lever = false;
        this.fallTid = 0;
        this.damm = false;
        this.ryck = 0;
        this.steg = 0;
        this.film = !!val.film;
        this.fallGrupp.rotation.set(0, 0, 0);
        this.visual.visible = true;
        this.wrap.visible = true;
        const rikt = val.riktning;
        if (rikt && rikt.lengthSq() > 1e-6) {
          this.knuff = rikt.clone();
          this.knuff.y = 0;
          if (this.knuff.lengthSq() > 1e-6) this.knuff.normalize();
          else this.knuff.set(0, 0, 1);
          this.knuffKvar = this.film ? 0.42 : 0.18;
          this.knuffFart = this.film ? 1.35 : 0.35;
        } else {
          this.knuff = null;
          this.knuffKvar = 0;
        }
        if (actions.death) {
          actions.death.timeScale = this.film ? 2.25 : 1;
          if (aktuell && aktuell !== actions.death) aktuell.fadeOut(0.05);
          actions.death.reset().fadeIn(this.film ? 0.02 : 0.05).play();
          aktuell = actions.death;
        } else if (aktuell) aktuell.paused = true;
        return true;
      },
      res() {
        this.lever = true;
        this.fallTid = 0;
        this.damm = false;
        this.kroppTraff = 0;
        this.ryck = 0;
        this.steg = 0;
        this.film = false;
        this.knuff = null;
        this.knuffKvar = 0;
        this.visual.visible = true;
        this.wrap.visible = true;
        this.fallGrupp.rotation.set(0, 0, 0);
        rensaSar(this);
        for (const a of Object.values(actions)) if (a) { a.timeScale = 1; a.stop(); }
        aktuell = null;
        this.wrap.position.set(this.bas.x, markHojd(this.bas.x, this.bas.z), this.bas.z);
        this.wrap.rotation.y = this.bas.yaw;
        const nyckel = this.beteende === 'patrull' ? 'walk' : this.beteende === 'kik' ? 'peka' : 'idle';
        spela(nyckel, 0.05);
        this.mixer.update(0.08);
        flyttaHuvud(this);
      }
    };
    hitbox.userData.soldat = soldat;
    hitbox.userData.zon = 'kropp';
    huvud.userData.soldat = soldat;
    huvud.userData.zon = 'huvud';
    lista.push(soldat);
    laggPaMark(soldat, false);
    flyttaHuvud(soldat);
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

  function ryck(s, dt) {
    if (!(s.ryck > 0)) {
      s.fallGrupp.rotation.x = 0;
      s.fallGrupp.rotation.z = 0;
      return;
    }
    s.ryck = Math.max(0, s.ryck - dt / 0.4);
    const k = s.ryck;
    s.fallGrupp.rotation.x = -0.32 * k;
    s.fallGrupp.rotation.z = 0.16 * k * s.ryckTecken;
    if (s.steg > 0) {
      const bit = Math.min(s.steg, dt * 0.7);
      const yaw = s.wrap.rotation.y;
      s.wrap.position.x += Math.sin(yaw) * bit;
      s.wrap.position.z += Math.cos(yaw) * bit;
      s.steg -= bit;
    }
  }

  function uppdatera(dt) {
    for (const s of lista) {
      s.mixer.update(dt);
      if (s.lever) {
        patrull(s, dt);
        ryck(s, dt);
        laggPaMark(s, false);
      } else {
        s.fallGrupp.rotation.set(0, 0, 0);
        s.fallTid += dt;
        if (s.knuff && s.knuffKvar > 0) {
          const bit = Math.min(dt, s.knuffKvar);
          const kvar = s.knuffKvar / (s.film ? 0.42 : 0.18);
          s.wrap.position.x += s.knuff.x * s.knuffFart * bit * kvar;
          s.wrap.position.z += s.knuff.z * s.knuffFart * bit * kvar;
          s.knuffKvar -= bit;
        }
        s.visual.visible = true;
        s.wrap.visible = true;
        laggPaMark(s, true);
        if (!s.damm && s.fallTid > 0.45 && effekt) {
          s.damm = true;
          effekt.damm(new THREE.Vector3(s.wrap.position.x, s.wrap.position.y + 0.08, s.wrap.position.z));
        }
      }
      flyttaHuvud(s);
    }
  }

  function traffa(raycaster) {
    for (const s of lista) if (s.lever) flyttaHuvud(s);
    const mal = [];
    for (const s of lista) if (s.lever) mal.push(s.hitbox, s.huvud);
    if (!mal.length) return null;
    const hits = raycaster.intersectObjects(mal, false);
    if (!hits.length || !(hits[0].distance <= rayMax)) return null;
    const huvudTraff = hits.find(h => h.object.userData.zon === 'huvud') || null;
    const kroppTraff = hits.find(h => h.object.userData.zon === 'kropp') || null;
    let hit = hits[0];
    if (huvudTraff && kroppTraff) {
      const iHuvud = kroppTraff.point.distanceTo(huvudTraff.object.position) <= traff.huvudRadie + 0.04;
      if (huvudTraff.distance <= kroppTraff.distance || iHuvud) hit = huvudTraff;
    } else if (huvudTraff) hit = huvudTraff;
    const s = hit.object.userData.soldat;
    const zon = hit.object.userData.zon === 'huvud' ? 'huvud' : 'kropp';
    const riktning = raycaster.ray.direction.clone().normalize();
    const punkt = hit.point.clone();
    if (zon === 'huvud' && traff.huvudSkottDodar) {
      const ben = benNamn(s.visual, 'Head');
      sarPa(s, ben, punkt, 'huvud');
      const ut = punkt.clone().addScaledVector(riktning, 0.11);
      if (effekt) {
        effekt.spray(ut, riktning);
        effekt.spray(punkt, riktning);
      }
      s.fall({film: true, riktning});
      return {index: s.index, sida: s.sida, avstand: hit.distance, punkt, normal: riktning, zon: 'huvud', traff: 1, dog: true};
    }
    s.kroppTraff += 1;
    const ben = zon === 'huvud' ? benNamn(s.visual, 'Head') : narmaste(s, punkt);
    sarPa(s, ben, punkt, 'kropp');
    if (effekt) effekt.blod(punkt, riktning);
    const grans = Math.max(1, traff.kroppsskott | 0);
    const dog = s.kroppTraff >= grans;
    if (dog) s.fall();
    else {
      s.ryck = 1;
      s.ryckTecken = riktning.x >= 0 ? -1 : 1;
      s.steg = (s.steg || 0) + 0.16;
    }
    return {index: s.index, sida: s.sida, avstand: hit.distance, punkt, normal: riktning, zon: 'kropp', traff: s.kroppTraff, dog};
  }

  function siktePunkt(index) {
    const s = lista[index];
    if (!s || !s.lever) return null;
    s.wrap.updateWorldMatrix(true, true);
    return s.hitbox.getWorldPosition(new THREE.Vector3());
  }

  function sikteHuvud(index) {
    const s = lista[index];
    if (!s || !s.lever) return null;
    flyttaHuvud(s);
    return s.huvud.position.clone();
  }

  function huvudY(s) {
    if (!huvudVarld(s, _hp)) return null;
    return _hp.y;
  }

  function status() {
    return lista.map(s => ({
      index: s.index,
      sida: s.sida,
      zon: s.zon,
      lever: s.lever,
      beteende: s.beteende,
      vapen: s.vapen,
      kroppTraff: s.kroppTraff,
      sar: s.sar.filter(m => m.visible).length,
      huvudSar: s.sar.some(m => m.visible && m.userData.typ === 'huvud'),
      synlig: s.visual.visible !== false && s.wrap.visible !== false && !!s.wrap.parent,
      film: !!s.film,
      fall: s.lever ? 0 : Math.min(1, s.fallTid / 1.05),
      fallX: +s.fallGrupp.rotation.x.toFixed(3),
      huvudY: huvudY(s),
      x: +s.wrap.position.x.toFixed(2),
      y: +s.wrap.position.y.toFixed(2),
      z: +s.wrap.position.z.toFixed(2),
      avstand: +Math.hypot(s.wrap.position.x, s.wrap.position.z).toFixed(1)
    }));
  }

  function resFallna() {
    let n = 0;
    for (const s of lista) {
      if (!s.lever || s.kroppTraff > 0 || s.sar.length) { s.res(); n++; }
    }
    return n;
  }

  function skyttar() {
    const ut = [];
    for (const s of lista) {
      if (!s.lever || (s.vapen !== 'gevar' && s.vapen !== 'mg42')) continue;
      ut.push({
        index: s.index,
        vapen: s.vapen,
        x: s.huvud.position.x,
        y: s.huvud.position.y,
        z: s.huvud.position.z
      });
    }
    return ut;
  }

  function fyllPa() {
    if (nastaExtra < EXTRA.length) {
      const s = bygg(EXTRA[nastaExtra]);
      nastaExtra++;
      return {nytt: s.index, resta: 0};
    }
    return {nytt: null, resta: resFallna()};
  }

  return {
    uppdatera, traffa, siktePunkt, sikteHuvud, status, resFallna, fyllPa, skyttar,
    get antal() { return lista.length; },
    get grans() { return traff.kroppsskott; }
  };
}
