import * as THREE from 'three';

const _dir = new THREE.Vector3();
const _ort = new THREE.Vector3();
const _ax = new THREE.Vector3();

function kon(dir, sprid, ut) {
  ut.copy(dir);
  if (ut.lengthSq() < 1e-8) ut.set(0, 0, -1);
  ut.normalize();
  _ax.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
  _ort.crossVectors(ut, _ax);
  if (_ort.lengthSq() < 1e-8) _ort.set(1, 0, 0);
  _ort.normalize();
  const v = Math.random() * sprid;
  ut.multiplyScalar(Math.cos(v)).addScaledVector(_ort, Math.sin(v));
  return ut.normalize();
}

export function skapaEffekt(scene, blod) {
  const N = Math.max(8, blod.pool | 0);
  const pos = new Float32Array(N * 3);
  const liv = new Float32Array(N);
  const px = new Float32Array(N);
  const farg = new Float32Array(N * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aLiv', new THREE.BufferAttribute(liv, 1));
  geo.setAttribute('aPx', new THREE.BufferAttribute(px, 1));
  geo.setAttribute('aFarg', new THREE.BufferAttribute(farg, 3));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    uniforms: {},
    vertexShader: `
      attribute float aLiv;
      attribute float aPx;
      attribute vec3 aFarg;
      varying float vLiv;
      varying vec3 vFarg;
      void main() {
        vLiv = aLiv;
        vFarg = aFarg;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aLiv > 0.0 ? clamp(aPx * 28.0 / max(0.8, -mv.z), 2.0, 40.0) : 0.0;
      }
    `,
    fragmentShader: `
      varying float vLiv;
      varying vec3 vFarg;
      void main() {
        if (vLiv <= 0.0) discard;
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float r = dot(p, p);
        if (r > 1.0) discard;
        float a = (1.0 - smoothstep(0.2, 1.0, r)) * vLiv;
        gl_FragColor = vec4(vFarg, a);
      }
    `
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.raycast = () => {};
  points.userData.ingenTraff = true;
  scene.add(points);

  const p = Array.from({length: N}, (_, i) => ({
    i, aktiv: false, t: 0, max: 1,
    x: 0, y: -20, z: 0, vx: 0, vy: 0, vz: 0,
    px: 0, grav: 9, r: 0.4, g: 0.05, b: 0.05
  }));
  let cursor = 0;
  let senaste = null;

  function skriv(q) {
    const i = q.i;
    pos[i * 3] = q.x;
    pos[i * 3 + 1] = q.y;
    pos[i * 3 + 2] = q.z;
    liv[i] = q.aktiv ? Math.max(0, 1 - q.t / q.max) : 0;
    px[i] = q.aktiv ? q.px : 0;
    farg[i * 3] = q.r;
    farg[i * 3 + 1] = q.g;
    farg[i * 3 + 2] = q.b;
  }

  function ledig() {
    for (let n = 0; n < N; n++) {
      const i = (cursor + n) % N;
      if (!p[i].aktiv) {
        cursor = (i + 1) % N;
        return p[i];
      }
    }
    const q = p[cursor];
    cursor = (cursor + 1) % N;
    return q;
  }

  function slapp(o) {
    const q = ledig();
    q.aktiv = true;
    q.t = 0;
    q.max = o.liv;
    q.x = o.x;
    q.y = o.y;
    q.z = o.z;
    q.vx = o.vx;
    q.vy = o.vy;
    q.vz = o.vz;
    q.px = o.px;
    q.grav = o.grav;
    q.r = o.r;
    q.g = o.g;
    q.b = o.b;
    skriv(q);
  }

  function burst(punkt, riktning, typ) {
    const huvud = typ === 'huvud';
    const antal = huvud ? blod.huvud : typ === 'damm' ? 10 : blod.kropp;
    const dir = (riktning || _dir.set(0, 1, 0)).clone();
    if (dir.lengthSq() < 1e-8) dir.set(0, 0.2, -1);
    dir.normalize();
    const sprid = huvud ? 0.62 : typ === 'damm' ? 1.1 : 1.15;
    for (let n = 0; n < antal; n++) {
      const v = kon(dir, sprid, _dir);
      const fart = huvud
        ? 4.5 + Math.random() * 8
        : typ === 'damm'
          ? 0.4 + Math.random() * 1.6
          : 1.4 + Math.random() * 3.4;
      const ljus = Math.random();
      slapp({
        x: punkt.x + (Math.random() - 0.5) * (huvud ? 0.04 : 0.06),
        y: punkt.y + (Math.random() - 0.5) * 0.04,
        z: punkt.z + (Math.random() - 0.5) * (huvud ? 0.04 : 0.06),
        vx: v.x * fart,
        vy: v.y * fart + (huvud ? 0.6 + Math.random() * 1.4 : typ === 'damm' ? 0.8 : 0.3 + Math.random() * 1.1),
        vz: v.z * fart,
        liv: huvud ? 0.7 + Math.random() * 0.55 : typ === 'damm' ? 0.35 + Math.random() * 0.25 : 0.45 + Math.random() * 0.4,
        px: huvud ? 14 + Math.random() * 12 : typ === 'damm' ? 8 + Math.random() * 6 : 10 + Math.random() * 8,
        grav: typ === 'damm' ? 2.2 : 8.6,
        r: typ === 'damm' ? 0.72 + ljus * 0.12 : 0.34 + ljus * 0.28,
        g: typ === 'damm' ? 0.64 + ljus * 0.1 : 0.03 + ljus * 0.05,
        b: typ === 'damm' ? 0.46 + ljus * 0.08 : 0.04
      });
    }
    senaste = {typ, antal, origin: punkt.clone(), dir: dir.clone()};
  }

  const sarGeo = new THREE.SphereGeometry(1, 8, 6);
  const matHal = new THREE.MeshBasicMaterial({color: 0x8a1418, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4});
  const matSar = new THREE.MeshBasicMaterial({color: 0x7a1216, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3});
  const ledigaSar = [];
  for (let i = 0; i < blod.sar; i++) {
    const m = new THREE.Mesh(sarGeo, matSar);
    m.visible = false;
    m.frustumCulled = false;
    m.raycast = () => {};
    m.userData.sar = true;
    ledigaSar.push(m);
  }

  function fast(parent, lokal, typ, radie) {
    const m = ledigaSar.pop();
    if (!m) return null;
    m.material = typ === 'huvud' ? matHal : matSar;
    m.userData.typ = typ;
    m.visible = true;
    parent.add(m);
    parent.updateWorldMatrix(true, false);
    const ws = new THREE.Vector3();
    parent.getWorldScale(ws);
    m.position.copy(lokal);
    m.scale.setScalar(radie / Math.max(1e-4, ws.x));
    return m;
  }

  function los(m) {
    if (!m) return;
    m.removeFromParent();
    m.visible = false;
    if (!ledigaSar.includes(m)) ledigaSar.push(m);
  }

  function tick(dt) {
    const d = Math.max(0, Math.min(0.05, dt || 0));
    for (const q of p) {
      if (!q.aktiv) continue;
      q.t += d;
      if (q.t >= q.max) {
        q.aktiv = false;
        q.y = -40;
        skriv(q);
        continue;
      }
      q.vy -= q.grav * d;
      q.x += q.vx * d;
      q.y += q.vy * d;
      q.z += q.vz * d;
      skriv(q);
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aLiv.needsUpdate = true;
    geo.attributes.aPx.needsUpdate = true;
    geo.attributes.aFarg.needsUpdate = true;
  }

  function status() {
    let aktiva = 0;
    let bakom = 0;
    if (senaste) {
      const o = senaste.origin;
      const dir = senaste.dir;
      for (const q of p) {
        if (!q.aktiv) continue;
        aktiva++;
        const fram = (q.x - o.x) * dir.x + (q.y - o.y) * dir.y + (q.z - o.z) * dir.z;
        if (fram > 0.04) bakom++;
      }
    } else {
      for (const q of p) if (q.aktiv) aktiva++;
    }
    return {
      aktiva,
      bakom,
      senasteTyp: senaste ? senaste.typ : null,
      senasteAntal: senaste ? senaste.antal : 0
    };
  }

  return {
    tick,
    status,
    fast,
    los,
    blod(punkt, riktning) {
      const dir = (riktning || new THREE.Vector3(0, 0, -1)).clone();
      if (dir.lengthSq() < 1e-8) dir.set(0, 0, -1);
      dir.normalize();
      const bak = dir.clone().multiplyScalar(-1);
      burst(punkt.clone().addScaledVector(bak, 0.16), bak, 'kropp');
    },
    spray(punkt, riktning) { burst(punkt, riktning, 'huvud'); },
    damm(punkt) { burst(punkt, new THREE.Vector3(0, 1, 0), 'damm'); }
  };
}
