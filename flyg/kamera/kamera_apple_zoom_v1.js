/* kamera_apple_zoom_v1.js – återanvändbar kartkamera i Apple Kartor-stil för WW2-bräden (three.js r160).
 * Alla värden läses ur kamera_apple_zoom_v1.json (samma mapp) eller ges som objekt. Inget hårdkodat beteende.
 * Kameramodell (EXEMPEL_ZOOM_KAMERA_LOD_v0_2): mål T, avstånd d, lutning θ (0° = rakt ned), kurs φ.
 *   Zoom ändrar bara d (logaritmiskt, steglöst) mot fingrarnas mitt/muspekaren. Lutning svänger kring T med samma d.
 *   Lutningstak efter d: vid utzoomning klämms θ mjukt (tidsbaserat); önskad θ sparas och återkommer vid inzoomning.
 * Pekgester: kartgester.js v1.0 (window.Kartgester, laddas som vanligt skript före modulen; filen ändras aldrig).
 * Användning:
 *   import { skapaAppleKamera } from './kamera/kamera_apple_zoom_v1.js';
 *   const kam = await skapaAppleKamera({ THREE, OrbitControls, renderer, markHojd:(x,z)=>y, yta:{minX,maxX,minZ,maxZ} });
 *   i renderloopen: kam.uppdatera(dt); renderer.render(scen, kam.kamera);
 * API: kamera, controls, varden, lage(), sattVy({mal:[x,z], d, lutning, kurs}), dMin, dMax, gester (kartgester-instans).
 * Ingen tredjepartskod utöver three.js (MIT). Intern projektkod. */
export const VERSION = '1.0';

export async function skapaAppleKamera(o) {
  const { THREE, OrbitControls, renderer } = o;
  const V = o.varden || await (await fetch(o.url || new URL('kamera_apple_zoom_v1.json', import.meta.url).href, { cache: 'no-cache' })).json();
  const rad = THREE.MathUtils.degToRad, deg = THREE.MathUtils.radToDeg, kl = THREE.MathUtils.clamp;
  const yta = o.yta || { minX: -1000, maxX: 1000, minZ: -1000, maxZ: 1000 };
  const markHojd = o.markHojd || (() => 0);
  const el = renderer.domElement;

  const kamera = new THREE.PerspectiveCamera(V.fov_vertikal_grader, el.clientWidth / Math.max(1, el.clientHeight) || innerWidth / innerHeight, 1, 20000);
  const controls = new OrbitControls(kamera, el);
  controls.enableDamping = !!V.gester.mus_dampning_pa;
  controls.dampingFactor = V.gester.mus_dampning;
  controls.zoomSpeed = V.gester.hjul_zoom_hastighet;
  controls.minPolarAngle = rad(V.lutning.min_grader);
  controls.maxPolarAngle = rad(V.lutning.max_grader);

  // ---- d_max: tal eller 'auto' (hela ytan ryms i både stående och liggande läge) ----
  const LX = yta.maxX - yta.minX, LZ = yta.maxZ - yta.minZ;
  function dMaxAuto() {
    const tv = Math.tan(rad(V.fov_vertikal_grader) / 2), asp = Math.min(innerWidth / innerHeight, innerHeight / innerWidth);
    const th = tv * asp; // smalaste ledden (stående telefon)
    return Math.max(LX, LZ) / 2 / th * V.avstand.d_max_auto_marginal;
  }
  const A = V.avstand;
  const api = { dMin: A.d_min_m, dMax: 0 };
  function sattDmax() { api.dMax = A.d_max_m === 'auto' ? Math.max(A.d_min_m * 2, dMaxAuto()) : Number(A.d_max_m) || A.d_max_fast_m;
    controls.minDistance = api.dMin; controls.maxDistance = api.dMax; }
  sattDmax();

  // ---- lutningstak efter avstånd (log-interpolering) ----
  const TAK = V.lutning.tak_efter_avstand.slice().sort((a, b) => a[0] - b[0]);
  function tak(d) { if (d <= TAK[0][0]) return rad(TAK[0][1]); const n = TAK.length - 1; if (d >= TAK[n][0]) return rad(TAK[n][1]);
    for (let i = 0; i < n; i++) if (d <= TAK[i + 1][0]) { const t = (Math.log(d) - Math.log(TAK[i][0])) / (Math.log(TAK[i + 1][0]) - Math.log(TAK[i][0]));
      return rad(TAK[i][1] + (TAK[i + 1][1] - TAK[i][1]) * t); } return rad(TAK[n][1]); }

  // ---- gester ----
  let gester = null;
  if (V.gester.kartgester_pa && window.Kartgester) {
    try { await window.Kartgester.laddat; } catch (_) {}
    gester = window.Kartgester.tre(controls, THREE, {}) || (window.Kartgester.instanser || []).find(i => i.controls === controls) || null;
  }

  const sf = new THREE.Spherical(), off = new THREE.Vector3();
  function sfarisk() { off.copy(kamera.position).sub(controls.target); sf.setFromVector3(off); return sf; }
  function sattSfarisk(s) { off.setFromSpherical(s); kamera.position.copy(controls.target).add(off); kamera.lookAt(controls.target); }

  /** sattVy: mal [x,z] i meter (scen), d i meter, lutning och kurs i grader (kurs 0 = norr upp, medurs). Saknade fält behålls. */
  function sattVy(v) {
    const s = sfarisk().clone();
    if (v.mal) { controls.target.set(v.mal[0], markHojd(v.mal[0], v.mal[1]), v.mal[1]); }
    if (v.d != null) s.radius = kl(v.d, api.dMin, api.dMax);
    if (v.lutning != null) { s.phi = Math.max(1e-4, rad(v.lutning)); onskadPhi = s.phi; }
    if (v.kurs != null) s.theta = -rad(v.kurs); // kameran söder om målet när kurs = 0 (norr = −Z)
    sattSfarisk(s); controls.update(); senastPhi = sfarisk().phi;
  }
  function lage() { const s = sfarisk(); const t = controls.target;
    return { mal: [t.x, t.y, t.z].map(n => +n.toFixed(2)), d: +s.radius.toFixed(2), lutning: +deg(s.phi).toFixed(2), kurs: +(((((-deg(s.theta)) % 360) + 360) % 360 + 0.005) % 360 - 0.005).toFixed(2),
      onskadLutning: +deg(onskadPhi).toFixed(2), tillatenLutning: +deg(Math.min(tak(s.radius), controls.maxPolarAngle)).toFixed(2),
      kameraHojdOverMark: +(kamera.position.y - markHojd(kamera.position.x, kamera.position.z)).toFixed(1), dMin: api.dMin, dMax: +api.dMax.toFixed(0) }; }

  let onskadPhi = rad(V.start.lutning_grader), senastPhi = onskadPhi;
  sattVy({ mal: V.start.mal_xz_m, d: V.start.d_m, lutning: V.start.lutning_grader, kurs: V.start.kurs_grader });

  function uppdatera(dt) {
    dt = Math.min(0.1, Math.max(0, dt || 0));
    controls.update();
    const t = controls.target;
    // 1) målpunkten inom ytan (+ marginal) – kameran följer med
    if (V.granser.panorering_begransad_pa) { const m = V.granser.marginal_m;
      const nx = kl(t.x, yta.minX - m, yta.maxX + m), nz = kl(t.z, yta.minZ - m, yta.maxZ + m);
      if (nx !== t.x || nz !== t.z) { kamera.position.x += nx - t.x; kamera.position.z += nz - t.z; t.x = nx; t.z = nz; } }
    // 2) målpunkten följer markhöjden mjukt
    if (V.mark.mal_foljer_mark_pa) { const k = 1 - Math.exp(-dt / Math.max(1e-3, V.mark.mal_foljer_mark_tid_s));
      const dy = (markHojd(t.x, t.z) - t.y) * (dt > 0 ? k : 1); t.y += dy; kamera.position.y += dy; }
    // 3) lutningstak: önskad vs tillåten, mjuk tidsbaserad klämning
    const s = sfarisk();
    if (Math.abs(s.phi - senastPhi) > 1e-3) onskadPhi = s.phi; // användaren har lutat
    const mal = Math.min(onskadPhi, tak(s.radius), controls.maxPolarAngle);
    if (Math.abs(mal - s.phi) > 1e-5) { const k = 1 - Math.exp(-dt / Math.max(1e-3, V.lutning.klamning_tid_s / 3)); s.phi += (mal - s.phi) * k; sattSfarisk(s); }
    // 4) lägsta höjd över marken
    const mh = markHojd(kamera.position.x, kamera.position.z) + V.mark.min_hojd_over_mark_m;
    if (kamera.position.y < mh) { kamera.position.y = mh; kamera.lookAt(t); }
    senastPhi = sfarisk().phi;
    // 5) klipplan efter höjd och avstånd
    const alt = Math.max(1, kamera.position.y - markHojd(kamera.position.x, kamera.position.z)), C = V.klipp;
    const near = kl(alt * C.near_andel_av_hojd, C.near_min_m, C.near_max_m), far = Math.max(C.far_min_m, sf.radius * C.far_faktor);
    if (Math.abs(near - kamera.near) > 0.01 * kamera.near || Math.abs(far - kamera.far) > 1) { kamera.near = near; kamera.far = far; kamera.updateProjectionMatrix(); }
  }
  function storlek(w, h) { kamera.aspect = w / h; kamera.updateProjectionMatrix(); sattDmax(); }
  addEventListener('resize', () => storlek(el.clientWidth || innerWidth, el.clientHeight || innerHeight));

  return Object.assign(api, { kamera, controls, varden: V, gester, uppdatera, sattVy, lage, tak: d => deg(tak(d)), storlek, VERSION });
}
