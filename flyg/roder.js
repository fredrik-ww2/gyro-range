// Roderytor ovanpå flygplansmodellen: skevroder, klaffar, höjdroder och sidroder.
// Modellerna är ett enda skrov, så ytorna ritas som tunna plattor som sitter på bakkanten
// och vrids kring sin framkant (gångjärnet). Mått i meter i flygplanets koordinater:
// nosen pekar mot -Z, höger vinge mot +X, upp är +Y. Alla tal kan justeras i config.json "roder".
export function skapaRoder(THREE, foralder, def, material) {
  const grupp = new THREE.Group(); grupp.name = 'Roder'; foralder.add(grupp);
  const mat = material || new THREE.MeshStandardMaterial({ color: def.farg ?? 0x5f6a55, roughness: 0.62, metalness: 0.18 });
  const kant = new THREE.MeshStandardMaterial({ color: def.kantfarg ?? 0x2a2e26, roughness: 0.8, metalness: 0.1 });
  const ytor = {};
  // Varje yta: gångjärn i framkanten, plattan sticker bakåt (+Z) eller för sidrodret bakåt i xz.
  function platta(namn, b) {
    const gj = new THREE.Group(); gj.position.set(b.x, b.y, b.z); gj.rotation.y = b.vridning || 0; grupp.add(gj);
    const geom = new THREE.BoxGeometry(b.bredd, b.tjocklek ?? 0.06, b.korda);
    const m = new THREE.Mesh(geom, mat); m.position.z = b.korda / 2; m.castShadow = false; gj.add(m);
    // mörk linje vid gångjärnet så utslaget syns även mot en enfärgad vinge
    const linje = new THREE.Mesh(new THREE.BoxGeometry(b.bredd, (b.tjocklek ?? 0.06) * 1.6, 0.04), kant); linje.position.z = 0.02; gj.add(linje);
    ytor[namn] = { gj, axel: b.axel || 'x', max: b.max ?? 0.4, tecken: b.tecken ?? 1 };
    return gj;
  }
  // Sidroder: plattan står upprätt (bredd blir höjd), gångjärnet är lodrätt
  function fena(namn, b) {
    const gj = new THREE.Group(); gj.position.set(b.x, b.y, b.z); grupp.add(gj);
    const m = new THREE.Mesh(new THREE.BoxGeometry(b.tjocklek ?? 0.06, b.hojd, b.korda), mat); m.position.set(0, b.hojd / 2, b.korda / 2); gj.add(m);
    const linje = new THREE.Mesh(new THREE.BoxGeometry((b.tjocklek ?? 0.06) * 1.6, b.hojd, 0.04), kant); linje.position.set(0, b.hojd / 2, 0.02); gj.add(linje);
    ytor[namn] = { gj, axel: 'y', max: b.max ?? 0.45, tecken: b.tecken ?? 1 };
    return gj;
  }
  const S = def;
  // Skevroder (yttre vingen) – vänster och höger speglade
  for (const s of [-1, 1]) {
    const a = S.skevroder; platta(s < 0 ? 'skevV' : 'skevH', { x: s * a.x, y: a.y, z: a.z, bredd: a.bredd, korda: a.korda, max: a.max, tecken: -s });
    const k = S.klaff; platta(s < 0 ? 'klaffV' : 'klaffH', { x: s * k.x, y: k.y, z: k.z, bredd: k.bredd, korda: k.korda, max: k.max, tecken: 1 });
    const h = S.hojdroder; platta(s < 0 ? 'hojdV' : 'hojdH', { x: s * h.x, y: h.y, z: h.z, bredd: h.bredd, korda: h.korda, max: h.max, tecken: 1 });
  }
  const r = S.sidroder; fena('sidroder', { x: 0, y: r.y, z: r.z, hojd: r.hojd, korda: r.korda, max: r.max });

  // Visade utslag glider mot målet så rörelsen ser mekanisk ut, inte hackig
  const vis = { skev: 0, klaff: 0, hojd: 0, sid: 0 };
  function satt(yta, vinkel) { const y = ytor[yta]; if (!y) return; y.gj.rotation[y.axel] = vinkel * y.tecken; }
  return {
    grupp,
    /** input: roll (+ = vänsterbank), pitch (+ = dra), roder (+ = nos vänster), klaff 0..1 */
    uppdatera(dt, inp) {
      const k = 1 - Math.exp(-dt / (S.respons_s ?? 0.08)), kk = 1 - Math.exp(-dt / (S.klaff_respons_s ?? 0.6));
      vis.skev += (clamp(inp.roll, -1, 1) - vis.skev) * k;
      vis.hojd += (clamp(inp.pitch, -1, 1) - vis.hojd) * k;
      vis.sid += (clamp(inp.roder, -1, 1) - vis.sid) * k;
      vis.klaff += (clamp(inp.klaff, 0, 1) - vis.klaff) * kk;
      // Vänsterbank: vänster skevroder upp (bakkant upp = negativ vridning kring X), höger ned.
      satt('skevV', -vis.skev * ytor.skevV.max); satt('skevH', -vis.skev * ytor.skevH.max);
      // Dra: höjdrodrets bakkant upp.
      satt('hojdV', -vis.hojd * ytor.hojdV.max); satt('hojdH', -vis.hojd * ytor.hojdH.max);
      // Klaff: bakkant ned.
      satt('klaffV', vis.klaff * ytor.klaffV.max); satt('klaffH', vis.klaff * ytor.klaffH.max);
      // Nos vänster: sidrodrets bakkant vrids åt vänster (−X).
      satt('sidroder', -vis.sid * ytor.sidroder.max);
    },
    synlig(v) { grupp.visible = v; },
    ytor, vis
  };
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
