import * as THREE from '../js/vendor/three.module.js';

function klamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function mulberry(frö) {
  let a = frö | 0;
  return function () {
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function varldPx(x, z, half, S) {
  return [((x + half) / (2 * half)) * S, ((z + half) / (2 * half)) * S];
}

function trakorn(bas, mork, ljus, S, frö) {
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = bas;
  g.fillRect(0, 0, S, S);
  const rnd = mulberry(frö);
  for (let i = 0; i < 80; i++) {
    g.strokeStyle = rnd() > 0.5 ? mork : ljus;
    g.globalAlpha = 0.07 + rnd() * 0.2;
    g.lineWidth = 0.7 + rnd() * 2.4;
    g.beginPath();
    let y = 0;
    const x0 = rnd() * S;
    g.moveTo(x0, 0);
    while (y < S) {
      y += 8 + rnd() * 22;
      g.lineTo(x0 + Math.sin(y * 0.012 + i) * (1.2 + rnd() * 3.5), y);
    }
    g.stroke();
  }
  g.globalAlpha = 0.3;
  for (let i = 0; i < 4; i++) {
    const x = S * (0.12 + rnd() * 0.76);
    const y = S * (0.12 + rnd() * 0.76);
    const rad = 7 + rnd() * 18;
    const grd = g.createRadialGradient(x, y, 1, x, y, rad);
    grd.addColorStop(0, mork);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.beginPath();
    g.ellipse(x, y, rad, rad * 0.62, rnd() * 3, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
  return c;
}

function textur(canvas, renderer, upprepa) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  if (upprepa) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
  }
  return tex;
}

function laggUv(geo, half) {
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    uv.setXY(i, (x + half) / (2 * half), (half - z) / (2 * half));
  }
  uv.needsUpdate = true;
  geo.computeVertexNormals();
}

export function skapaBrade(canvas, konfig) {
  const br = konfig.brade;
  const farger = konfig.farger;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: br.kantutjamning !== false,
    alpha: false,
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: false,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = br.exponering;
  renderer.shadowMap.enabled = konfig.strombrytare.skuggor !== false;
  renderer.shadowMap.type = br.skuggMjuk === false ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
  renderer.setClearColor(new THREE.Color(farger.bakgrund));

  const scen = new THREE.Scene();
  const kamera = new THREE.PerspectiveCamera(br.kameraFov, 1, 0.02, 8);
  scen.add(new THREE.HemisphereLight(0xf4ead8, 0x3a2a1c, br.hemisfar));
  const sol = new THREE.DirectionalLight(0xfff3df, br.sol);
  sol.position.set(br.solX, br.solY, br.solZ);
  sol.castShadow = renderer.shadowMap.enabled;
  const rack = br.halvBredd + br.sargBredd + 0.06;
  sol.shadow.mapSize.set(br.skuggkarta, br.skuggkarta);
  sol.shadow.camera.left = -rack;
  sol.shadow.camera.right = rack;
  sol.shadow.camera.top = rack;
  sol.shadow.camera.bottom = -rack;
  sol.shadow.camera.near = 0.05;
  sol.shadow.camera.far = 3;
  sol.shadow.bias = -0.00035;
  sol.shadow.normalBias = 0.012;
  scen.add(sol, sol.target);
  const fyll = new THREE.DirectionalLight(0xd5e2ff, br.sol * 0.22);
  fyll.position.set(-0.45, 0.35, -0.25);
  scen.add(fyll);

  const ekCanvas = trakorn(farger.ek, farger.ekMork, farger.bjorkLjus, 256, 11);
  const ekTex = textur(ekCanvas, renderer, true);
  const ek = new THREE.MeshStandardMaterial({map: ekTex, roughness: 0.78, metalness: 0.04});
  const bjorkFarg = new THREE.MeshStandardMaterial({color: farger.bjorkLjus, roughness: 0.72, metalness: 0.02});
  const massing = new THREE.MeshStandardMaterial({color: farger.massing, roughness: 0.38, metalness: 0.72});
  const morkMetall = new THREE.MeshStandardMaterial({color: 0x2c2926, roughness: 0.4, metalness: 0.8});
  const halMat = new THREE.MeshBasicMaterial({color: farger.hal, side: THREE.BackSide});
  const halBotten = new THREE.MeshBasicMaterial({color: farger.hal});
  const bordCanvas = trakorn(farger.bord, '#1a120c', '#3a2a1e', 256, 4);
  const bordMat = new THREE.MeshStandardMaterial({map: textur(bordCanvas, renderer, true), roughness: 0.9, metalness: 0.02});
  const bord = new THREE.Mesh(new THREE.PlaneGeometry(br.bord, br.bord), bordMat);
  bord.rotation.x = -Math.PI / 2;
  bord.position.y = -br.bottenTjock - 0.004;
  bord.receiveShadow = true;
  scen.add(bord);

  const lada = new THREE.Group();
  scen.add(lada);
  const sophanter = [];
  let kula = null;
  let sparPlan = null;
  let kontakt = null;
  const skuggTex = textur(mjukSkiva(), renderer, false);

  function mjukSkiva() {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    grd.addColorStop(0, 'rgba(0,0,0,0.5)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    return c;
  }

  function hall(res) {
    sophanter.push(res);
    return res;
  }

  function mesh(geo, mat, skugga) {
    const m = new THREE.Mesh(hall(geo), mat);
    m.castShadow = !!skugga;
    m.receiveShadow = true;
    lada.add(m);
    return m;
  }

  function golv(bana) {
    const half = br.halvBredd;
    const S = 1024;
    const c = trakorn(farger.bjork, farger.bjorkMork, farger.bjorkLjus, S, 27);
    const g = c.getContext('2d');
    const flack = (x, z, radie, farg) => {
      const [px, py] = varldPx(x, z, half, S);
      const rr = radie / (2 * half) * S;
      g.fillStyle = farg;
      g.beginPath();
      g.arc(px, py, rr, 0, Math.PI * 2);
      g.fill();
    };
    flack(bana.start.x, bana.start.z, (bana.start.radie || 0.016) * 1.15, 'rgba(90,58,34,0.16)');
    flack(bana.mal.x, bana.mal.z, bana.mal.radie * 0.7, 'rgba(70,110,64,0.4)');
    const ord = (text, x, z) => {
      const [px, py] = varldPx(x, z, half, S);
      g.save();
      g.translate(px, py);
      g.font = `700 ${Math.round(S * 0.042)}px Palatino, Georgia, serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = 'rgba(255,248,230,0.45)';
      g.fillText(text, 0.8, 1);
      g.fillStyle = '#5c3d24';
      g.fillText(text, 0, 0);
      g.restore();
    };
    ord(konfig.texter.startFack || 'START', bana.start.x, bana.start.z);
    ord(konfig.texter.malFack || 'MÅL', bana.mal.x, bana.mal.z);
    for (const h of bana.hal || []) {
      const [px, py] = varldPx(h.x, h.z, half, S);
      const rr = h.radie / (2 * half) * S;
      g.strokeStyle = 'rgba(40,24,12,0.85)';
      g.lineWidth = Math.max(2, rr * 0.28);
      g.beginPath();
      g.arc(px, py, rr + g.lineWidth, 0, Math.PI * 2);
      g.stroke();
    }
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = '#000';
    for (const h of bana.hal || []) {
      const [px, py] = varldPx(h.x, h.z, half, S);
      g.beginPath();
      g.arc(px, py, (h.radie / (2 * half)) * S, 0, Math.PI * 2);
      g.fill();
    }
    const tex = hall(textur(c, renderer, false));
    const geo = hall(new THREE.PlaneGeometry(half * 2, half * 2));
    laggUv(geo, half);
    const mat = hall(new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.84, metalness: 0.02, alphaTest: 0.4, color: 0xffffff,
    }));
    const yta = new THREE.Mesh(geo, mat);
    yta.receiveShadow = true;
    lada.add(yta);
  }

  function spar(bana) {
    const half = br.halvBredd;
    const S = 1024;
    const c = document.createElement('canvas');
    c.width = S;
    c.height = S;
    const g = c.getContext('2d');
    const punkter = bana.spar || [];
    if (punkter.length > 1) {
      g.strokeStyle = farger.spar;
      g.lineWidth = Math.max(2, (0.0017 / (2 * half)) * S);
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.beginPath();
      punkter.forEach((p, i) => {
        const [px, py] = varldPx(p.x, p.z, half, S);
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      });
      g.stroke();
    }
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `700 ${Math.round(S * 0.022)}px Palatino, Georgia, serif`;
    for (const p of punkter) {
      if (!p.n) continue;
      const vidStart = Math.hypot(p.x - bana.start.x, p.z - bana.start.z) < 0.02;
      const vidMal = Math.hypot(p.x - bana.mal.x, p.z - bana.mal.z) < 0.02;
      if (vidStart || vidMal) continue;
      const [px, py] = varldPx(p.x, p.z, half, S);
      const rr = (0.0055 / (2 * half)) * S;
      g.fillStyle = '#f4e7cf';
      g.beginPath();
      g.arc(px, py, rr, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = 2;
      g.strokeStyle = farger.spar;
      g.stroke();
      g.fillStyle = '#4a301c';
      g.fillText(String(p.n), px, py + 0.5);
    }
    const tex = hall(textur(c, renderer, false));
    const geo = hall(new THREE.PlaneGeometry(half * 2, half * 2));
    laggUv(geo, half);
    const mat = hall(new THREE.MeshBasicMaterial({map: tex, transparent: true, depthWrite: false}));
    sparPlan = new THREE.Mesh(geo, mat);
    sparPlan.position.y = 0.0014;
    sparPlan.renderOrder = 2;
    lada.add(sparPlan);
  }

  function bygg(bana) {
    while (lada.children.length) lada.remove(lada.children[0]);
    for (const res of sophanter) res.dispose?.();
    sophanter.length = 0;
    const half = br.halvBredd;
    const yttre = (half + br.sargBredd) * 2;
    const botten = new THREE.Mesh(hall(new THREE.BoxGeometry(yttre, 0.004, yttre)), halBotten);
    botten.position.y = -br.bottenTjock;
    botten.receiveShadow = true;
    lada.add(botten);
    golv(bana);
    const sargH = br.sargHojd + br.bottenTjock;
    const sargY = (br.sargHojd - br.bottenTjock) / 2;
    const framBak = 2 * (half + br.sargBredd);
    const inskott = 0.0012;
    const fram = mesh(new THREE.BoxGeometry(framBak, sargH, br.sargBredd), ek, true);
    fram.position.set(0, sargY, half + br.sargBredd / 2 - inskott);
    const bak = mesh(new THREE.BoxGeometry(framBak, sargH, br.sargBredd), ek, true);
    bak.position.set(0, sargY, -(half + br.sargBredd / 2 - inskott));
    const sidaL = mesh(new THREE.BoxGeometry(br.sargBredd, sargH, half * 2), ek, true);
    sidaL.position.set(-(half + br.sargBredd / 2 - inskott), sargY, 0);
    const sidaR = mesh(new THREE.BoxGeometry(br.sargBredd, sargH, half * 2), ek, true);
    sidaR.position.set(half + br.sargBredd / 2 - inskott, sargY, 0);
    for (const v of bana.vaggar || []) {
      const kropp = mesh(new THREE.BoxGeometry(v.b, br.vaggHojd, v.d), ek, true);
      kropp.position.set(v.x, br.vaggHojd / 2, v.z);
      const kappa = mesh(new THREE.BoxGeometry(v.b * 0.86, br.kappaHojd, Math.max(0.003, v.d * 0.62)), bjorkFarg, false);
      kappa.position.set(v.x, br.vaggHojd + br.kappaHojd / 2, v.z);
      kappa.castShadow = false;
    }
    const kantMat = hall(new THREE.MeshStandardMaterial({color: farger.ekDjup, roughness: 0.9, metalness: 0.05}));
    for (const h of bana.hal || []) {
      const brunn = new THREE.Mesh(hall(new THREE.CylinderGeometry(h.radie * 0.98, h.radie * 0.8, br.bottenTjock, 24, 1, true)), halMat);
      brunn.position.set(h.x, -br.bottenTjock / 2, h.z);
      lada.add(brunn);
      const kant = mesh(new THREE.TorusGeometry(h.radie, 0.0017, 6, 28), kantMat, false);
      kant.rotation.x = Math.PI / 2;
      kant.position.set(h.x, 0.0012, h.z);
    }
    const startRing = mesh(new THREE.TorusGeometry((bana.start.radie || 0.016) * 0.92, 0.0015, 6, 28), massing, false);
    startRing.rotation.x = Math.PI / 2;
    startRing.position.set(bana.start.x, 0.0016, bana.start.z);
    const malRing = mesh(new THREE.TorusGeometry(bana.mal.radie * 0.78, 0.0018, 6, 32), massing, false);
    malRing.rotation.x = Math.PI / 2;
    malRing.position.set(bana.mal.x, 0.0016, bana.mal.z);
    for (const c of bana.checkpoint || []) {
      const peg = mesh(new THREE.CylinderGeometry(0.0032, 0.0032, 0.001, 10), massing, false);
      peg.position.set(c.x, 0.0012, c.z);
    }
    const skruv = br.sargBredd * 0.42;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const spik = mesh(new THREE.CylinderGeometry(0.0026, 0.0026, 0.0014, 8), morkMetall, false);
        spik.position.set(sx * (half + skruv), br.sargHojd + 0.0006, sz * (half + skruv));
      }
    }
    spar(bana);
    kula = new THREE.Mesh(
      hall(new THREE.SphereGeometry(konfig.fysik.kulaRadie, 32, 24)),
      hall(new THREE.MeshPhongMaterial({color: farger.stal, specular: farger.stalGlans, shininess: 150}))
    );
    kula.castShadow = true;
    lada.add(kula);
    kontakt = new THREE.Mesh(hall(new THREE.PlaneGeometry(konfig.fysik.kulaRadie * 2.6, konfig.fysik.kulaRadie * 2.6)), hall(new THREE.MeshBasicMaterial({
      map: skuggTex, transparent: true, depthWrite: false,
    })));
    kontakt.rotation.x = -Math.PI / 2;
    kontakt.position.y = 0.0011;
    kontakt.renderOrder = 1;
    lada.add(kontakt);
  }

  function pixelKvot() {
    const dpr = Math.min(globalThis.devicePixelRatio || 1, br.pixelRatioTak);
    const behov = innerWidth * innerHeight * dpr * dpr;
    if (behov > br.maxPixlar) return dpr * Math.sqrt(br.maxPixlar / behov);
    return dpr;
  }

  function passa() {
    const w = Math.max(1, innerWidth);
    const h = Math.max(1, innerHeight);
    const halv = Math.max(br.halvBredd, br.halvDjup) + br.sargBredd;
    const behov = halv * br.kameraMarginal;
    const fov = br.kameraFov * Math.PI / 180;
    const aspect = w / h;
    const halfV = Math.tan(fov / 2);
    const d = behov / Math.min(halfV, halfV * aspect);
    const langd = Math.hypot(br.kameraHojd, br.kameraBak) || 1;
    kamera.aspect = aspect;
    kamera.fov = br.kameraFov;
    kamera.position.set(0, (br.kameraHojd / langd) * d, (br.kameraBak / langd) * d);
    kamera.lookAt(0, 0, 0);
    kamera.updateProjectionMatrix();
    renderer.setPixelRatio(pixelKvot());
    renderer.setSize(w, h, false);
  }

  function luta(dt, fram, sida) {
    const malX = klamp(-fram * br.visuellSkala, -br.visuellMax, br.visuellMax);
    const malZ = klamp(-sida * br.visuellSkala, -br.visuellMax, br.visuellMax);
    const k = 1 - Math.exp(-Math.max(0, dt) / Math.max(0.02, br.lutningMjukSek));
    lada.rotation.x += (malX - lada.rotation.x) * k;
    lada.rotation.z += (malZ - lada.rotation.z) * k;
  }

  function boll(state, dt) {
    if (!kula) return;
    const r = konfig.fysik.kulaRadie;
    kula.position.set(state.x, state.y, state.z);
    kula.visible = state.lage !== 'paus' || state.y > -r;
    kula.castShadow = state.y > -0.002;
    if ((state.lage === 'rullar' || state.lage === 'tippar') && dt > 0) {
      kula.rotateX(state.vz / r * dt);
      kula.rotateZ(-state.vx / r * dt);
    }
    if (kontakt) {
      kontakt.position.x = state.x;
      kontakt.position.z = state.z;
      kontakt.material.opacity = state.y > 0 ? 0.34 : 0.08;
      kontakt.visible = state.lage !== 'faller' && state.lage !== 'paus';
    }
  }

  function hjalp(pa) {
    if (sparPlan) sparPlan.visible = !!pa;
  }

  function rita() {
    renderer.render(scen, kamera);
  }

  function prestanda() {
    const info = renderer.info.render;
    return {ritningar: info.calls, trianglar: info.triangles};
  }

  passa();
  return {bygg, passa, luta, boll, hjalp, rita, prestanda};
}
