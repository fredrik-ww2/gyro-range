// Hexkrigsspel 1944 – gemensamma stridseffekter v2d (R15, R62, R48). Kopia av v2c (fryst, UNDERKÄND 09:41) med rättelserna F8 (markhöjd per
// instans ur en höjdfunktion, märket följer marken), F9 (egen pool för brännmärken, äldsta ersätts) och Fråga 1 (skärmtak för stora sprites).
// v2c hade i sin tur F6, F7 och Förb. N1–N10 ovanpå v2b. Unity Labs-flipbooks, hastighetsriktade gnistor/spårljus, vattennedslag, liggande brännmärke och valfri kort
// ljusblixt (PointLight, AV som standard, o.ljus=true slår på) vid mynningsflamma.
// EN atlas (fx_atlas_v2d.ktx2, 1024 px, 8x8 rutor), EN Points-pool = 1 draw call för vanliga partiklar (förmultiplicerad blandning:
// additiva och vanliga i samma pool). +1 draw call BARA när det behövs för sprites som är större än GPU:ns punktgräns (quad-mesh, N2), och
// +1 draw call BARA när det finns brännmärken: en egen mesh för ALLA märken (F9, standard 128 platser, märket draperas på marken, F8).
// Markhöjd (F8): o.markHojd(x, z) -> tal eller { y, normal }, valfritt o.markNormal(x, z) -> {x,y,z}, eller o.terrang = { hojd(x,z), normal(x,z) }.
// Per anrop: d.mark_y / d.mark_normal (plan genom träffen). Saknas allt används o.markY (som v2c). fx.sattMark({ hojd, normal, y }) byter senare.
// Ingen slump: variation ur en deterministisk heltalshash.
//   const fx = skapaEffekterV2d(THREE, scene, { atlas: textur, kamera, renderer, kvalitet: 'hog'|'mellan'|'lag', tvingaLod: null|0|1|2, ljus: false,
//                                    storaSomQuads: true, maxPunktPx: null /* test: simulera lägre punktgräns, t.ex. 511 */, quadMax: 64,
//                                    markHojd: (x, z) => h, markNormal: null, markY: 0, markMax: 128, markRutnat: 12, skarmtak: null,
//                                    markRutSteg: null /* t.ex. 0.5: terrängnätets steg i m */, markRutStart: [0, 0] /* nätets origo x, z */ });
//   markRutSteg: märkets hörn läggs i terrängnätets egna hörn (samma diagonal som three PlaneGeometry roterad −90° kring x: från (x0, z0+steg) till
//   (x0+steg, z0)). Då följer märket den ritade marken exakt (fel = lyft). Ryms märket inte i markRutnat rutor faller det tillbaka på fritt rutnät.
//   (renderer behövs för rätt punktstorlek vid alla DPR; fx.sattRenderer(r) om den byts. fx.dispose() frigör allt.)
//   const v = fx.registrera(vagnObj);                       // fästpunkter: noder eller bounding box
//   fx.spela('mynningsflamma', { vagn: v, kaliber_mm: 88, mynningsbroms: true });
//   fx.spela('traff_pansar', { pos, normal, riktning, utfall: 'rikoschett'|'ingen_genomslag'|'genomslag', kaliber_mm });
//   fx.spela('traff_mark', { pos, laddning_g, kaliber_mm, underlag: 'torr'|'fuktig' });
//   const h = fx.spela('brand_rok', { vagn: v, fas: 'tand'|'brinner'|'utbrand' }); h.fas('brinner'); h.stopp();   // standardfas 'tand'; handtaget är alltid fullt (även bortom LOD)
//   renderloop: fx.uppdatera(dt);
import { FX_V2 } from './effekter_v2d_defs.js';
const PHI = 0.6180339887498949, frac = x => x - Math.floor(x);
// Förb. 5 (Kvalitet): gyllene-snitt-följden gav ett regelbundet korkskruvsmönster i loopar (vinkeln steg med gyllene vinkeln per utsläpp).
// Nu deterministisk heltalshash (samma resultat varje körning, men utan mönster).
const vr = (i, c) => { let h = (Math.round(i * 2) * 0x9E3779B1) ^ Math.imul(c + 0x632BE5AB | 0, 0x85EBCA77); h ^= h >>> 15; h = Math.imul(h, 0x2C1B3C6D); h ^= h >>> 12; h = Math.imul(h, 0x297A2D39); h ^= h >>> 15; return (h >>> 0) / 4294967296; };
const KVALITET = { hog: 1, mellan: 0.6, lag: 0.3 };

export function skapaEffekterV2d(THREE, scene, o = {}) {
  const N = o.maxPartiklar || FX_V2.pool_max;           // gemensam budget för ALLA effekter
  const G = FX_V2.atlas.kolumner;
  const kamera = o.kamera; let renderer = o.renderer || null, kv = KVALITET[o.kvalitet || 'hog'] ?? 1, tvingaLod = o.tvingaLod ?? null, varnatSkarm = false;
  const g = new THREE.BufferGeometry();
  const A = (n, k) => { const a = new Float32Array(N * k); g.setAttribute(n, new THREE.BufferAttribute(a, k).setUsage(THREE.DynamicDrawUsage)); return a; };
  const pos = A('position', 3), col = A('farg', 4), siz = A('storlek', 1), ruta = A('ruta', 1), rot = A('rot', 1), add = A('add', 1);
  // F8: markplan per partikel: markens höjd h(x,z) ≈ a + sx·x + sz·z, satt där partikeln föds (och för fallande partiklar där de landar).
  const mp = A('markplan', 3);
  const mat = new THREE.ShaderMaterial({
    uniforms: { atlas: { value: o.atlas }, skarm: { value: o.pixelPerMeter || 600 }, maxPx: { value: 1024 }, skala: { value: FX_V2.storlek_skala ?? 1 }, tona: { value: new THREE.Vector2(...FX_V2.lod.tona_m) }, camR: { value: new THREE.Vector3(1, 0, 0) }, camU: { value: new THREE.Vector3(0, 1, 0) }, mjukM: { value: o.mjukMark === false ? 0 : 0.35 } },
    vertexShader: `attribute vec4 farg; attribute vec3 markplan; attribute float storlek, ruta, rot, add; uniform float skarm, maxPx, skala; uniform vec2 tona;
      varying vec4 vF; varying vec3 vC, vM; varying float vR, vRot, vAdd, vS;
      void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*mv; float d=-mv.z;
        vF=farg; vF.a*=1.0-smoothstep(tona.x,tona.y,d);   // gradvis toning på avstånd (inget plötsligt försvinnande)
        vR=ruta; vRot=rot; vAdd=add; vC=(modelMatrix*vec4(position,1.0)).xyz; vM=markplan; vS=storlek*skala;
        // F2: skarm = bildbuffertens höjd / (2·tan(fov/2)) – följer kamera, fönster och DPR. Ingen klämning vid 256 px.
        // N2: sprites över maxPx ritas normalt som quads (uppdatera() flyttar dem). Bara om quad-meshen är full eller avslagen
        // kapas punkten här till maxPx, och då tonas alfa med maxPx/ps så att energin inte blir för hög (reserv, inte normalfallet).
        float ps = storlek>0.0 ? storlek*skala*skarm/max(d,0.1) : 0.0; if(ps>maxPx){ vF.a*=maxPx/ps; ps=maxPx; }
        gl_PointSize = storlek>0.0 ? max(ps,1.0) : 0.0; }`,
    fragmentShader: `uniform sampler2D atlas; uniform float mjukM; uniform vec3 camR, camU; varying vec4 vF; varying vec3 vC, vM; varying float vR, vRot, vAdd, vS;
      void main(){ vec2 p=gl_PointCoord-0.5; float c=cos(vRot), s=sin(vRot); p=vec2(c*p.x-s*p.y, s*p.x+c*p.y)+0.5;
        if(p.x<0.0||p.y<0.0||p.x>1.0||p.y>1.0) discard;
        vec2 cell=vec2(mod(vR,${G}.0), floor(vR/${G}.0)); vec4 t=texture2D(atlas,(cell+p)/${G}.0);
        float a=t.a*vF.a;
        // F8: mjuk mot den LOKALA marken – fragmentets världsläge ur punktens mitt, gl_PointCoord och kamerans axlar; markens höjd där ur
        // partikelns markplan (lutning ingår). Förr: ett globalt markY för hela scenen.
        if(mjukM>0.0){ vec2 q=gl_PointCoord-0.5; vec3 fw=vC+(q.x*camR-q.y*camU)*vS; float gy=vM.x+vM.y*fw.x+vM.z*fw.z; a*=smoothstep(0.0, mjukM*vS, fw.y-gy); }
        if(a<0.004) discard;
        // Förb. 3: färgrymdsomvandlingen görs på ofömultiplicerad färg, därefter förmultipliceras (inga ljusa kanter på mörk rök)
        gl_FragColor=vec4(t.rgb*vF.rgb, 1.0);
        #include <colorspace_fragment>
        gl_FragColor=vec4(gl_FragColor.rgb*a, a*(1.0-vAdd));   // förmultiplicerad: add=1 ger ren additiv
      }`,
    transparent: true, depthWrite: false, depthTest: true,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  });
  // Ljusblixt (Förb. N8): AV som standard (mobil). Med o.ljus === true läggs EN PointLight i scenen (intensitet 0 i vila) så att antalet
  // ljus aldrig ändras = ingen shader-omkompilering under spel. Kostnad (Kvalitet v2b): dubbla shader-varianter för belysta material, ≈ +10 % bildtid.
  const ljus = o.ljus === true ? new THREE.PointLight(0xffc27a, 0, 1, 2) : null; let ljusT = 0, ljusMax = 0, ljusI = 0;
  if (ljus) { ljus.castShadow = false; scene.add(ljus); }
  const pts = new THREE.Points(g, mat); pts.renderOrder = 10; pts.frustumCulled = true;   // culling mot synfältet via dynamisk bounding sphere
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 0); scene.add(pts);
  // ---- N2: quad-mesh (InstancedBufferGeometry, samma atlas, samma blandning) för sprites över punktgränsen ----
  // F9: brännmärkena ligger INTE längre här (de delade förr de 64 platserna med stora sprites och blev stående punkter när det var fullt).
  // Samma rutval, rotation, färg och mjuka markkant som punkterna, så bytet syns inte. Ritas bara när den har innehåll (+1 draw call då).
  const QN = o.quadMax || 64, storaSomQuads = o.storaSomQuads !== false;
  const qg = new THREE.InstancedBufferGeometry();
  qg.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3)); qg.setIndex([0, 1, 2, 0, 2, 3]);
  const QA = (n, k) => { const a = new Float32Array(QN * k); qg.setAttribute(n, new THREE.InstancedBufferAttribute(a, k).setUsage(THREE.DynamicDrawUsage)); return a; };
  const qPos = QA('iPos', 3), qCol = QA('iFarg', 4), qSiz = QA('iStorlek', 1), qRuta = QA('iRuta', 1), qRot = QA('iRot', 1), qAdd = QA('iAdd', 1), qMark = QA('iMark', 3);
  qg.instanceCount = 0;
  const U = mat.uniforms;
  const qmat = new THREE.ShaderMaterial({
    uniforms: { atlas: U.atlas, skala: U.skala, tona: U.tona, camR: U.camR, camU: U.camU, mjukM: U.mjukM },   // samma uniform-objekt som punkterna
    vertexShader: `attribute vec3 iPos, iMark; attribute vec4 iFarg; attribute float iStorlek, iRuta, iRot, iAdd; uniform float skala; uniform vec3 camR, camU; uniform vec2 tona;
      varying vec4 vF; varying vec2 vUv; varying vec3 vW, vM; varying float vR, vAdd, vS;
      void main(){ float s=iStorlek*skala; vec2 c=position.xy; vec4 mc=modelViewMatrix*vec4(iPos,1.0);
        vW=iPos+(c.x*camR+c.y*camU)*s; vec4 mv=modelViewMatrix*vec4(vW,1.0);   // N2: vänd mot kameran, som en punkt
        gl_Position=projectionMatrix*mv; float d=-mc.z;
        vF=iFarg; vF.a*=1.0-smoothstep(tona.x,tona.y,d);
        vec2 q=vec2(c.x,-c.y); float cr=cos(iRot), sr=sin(iRot); vUv=vec2(cr*q.x-sr*q.y, sr*q.x+cr*q.y)+0.5;   // samma rotation som gl_PointCoord
        vR=iRuta; vAdd=iAdd; vM=iMark; vS=s; }`,
    fragmentShader: `uniform sampler2D atlas; uniform float mjukM; varying vec4 vF; varying vec2 vUv; varying vec3 vW, vM; varying float vR, vAdd, vS;
      void main(){ vec2 p=vUv; if(p.x<0.0||p.y<0.0||p.x>1.0||p.y>1.0) discard;
        vec2 cell=vec2(mod(vR,${G}.0), floor(vR/${G}.0)); vec4 t=texture2D(atlas,(cell+p)/${G}.0);
        float a=t.a*vF.a; if(mjukM>0.0) a*=smoothstep(0.0, mjukM*vS, vW.y-(vM.x+vM.y*vW.x+vM.z*vW.z));   // F8: lokal mark
        if(a<0.004) discard;
        gl_FragColor=vec4(t.rgb*vF.rgb, 1.0);
        #include <colorspace_fragment>
        gl_FragColor=vec4(gl_FragColor.rgb*a, a*(1.0-vAdd)); }`,
    transparent: true, depthWrite: false, depthTest: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  });
  const qm = new THREE.Mesh(qg, qmat); qm.renderOrder = 9; qm.frustumCulled = false; qm.visible = false; scene.add(qm);   // få instanser: ingen culling behövs
  let qn = 0, qnStora = 0, toppQuads = 0, quadsFulla = 0;
  // ---- F9 + F8: EGEN mesh för brännmärken (ligg: true i defs) ----
  // MN platser (standard 128, FX_V2.markar.max). Varje märke är ett rutnät MG×MG som draperas på marken: hörnens höjd = markHojd(x, z) + lyft,
  // räknat EN gång när märket läggs (märken ligger still). Toningen sker i skuggaren ur födelsetid och livslängd (uniform tid), så en vanlig
  // bildruta laddar inte upp något alls. Full pool: det ÄLDSTA märket ersätts. Ett märke blir aldrig en stående punkt. Ingen slump.
  const MK = FX_V2.markar || {}, MN = Math.max(1, o.markMax || MK.max || 128), MG = Math.max(1, o.markRutnat || MK.rutnat || 12), MV = (MG + 1) * (MG + 1), MI = MG * MG * 6;
  const LYFT = o.markLyft ?? MK.lyft_m ?? 0.010;
  const RSTEG = o.markRutSteg || MK.rut_steg_m || 0, RS0 = o.markRutStart || MK.rut_start || [0, 0]; let markerNatt = 0;
  const mg = new THREE.BufferGeometry();
  const mPosA = new Float32Array(MN * MV * 3), mLok = new Float32Array(MN * MV * 2), mInfoA = new Float32Array(MN * MV * 4), mF0A = new Float32Array(MN * MV * 4), mF1A = new Float32Array(MN * MV * 4), mIdx = [];
  for (let sl = 0; sl < MN; sl++) { for (let iy = 0; iy <= MG; iy++) for (let ix = 0; ix <= MG; ix++) { const v = sl * MV + iy * (MG + 1) + ix; mLok[v * 2] = ix / MG - 0.5; mLok[v * 2 + 1] = iy / MG - 0.5; mInfoA[v * 4 + 1] = 1; mInfoA[v * 4] = -1e9; }
    for (let iy = 0; iy < MG; iy++) for (let ix = 0; ix < MG; ix++) { const a = sl * MV + iy * (MG + 1) + ix, b = a + 1, c = a + MG + 1, d2 = c + 1; mIdx.push(a, c, b, b, c, d2); } }
  const MA = (n, arr, k, dyn) => { const at = new THREE.BufferAttribute(arr, k); if (dyn) at.setUsage(THREE.DynamicDrawUsage); mg.setAttribute(n, at); return at; };
  MA('position', mPosA, 3, true); MA('lokal', mLok, 2, true); MA('mInfo', mInfoA, 4, true); MA('mF0', mF0A, 4, true); MA('mF1', mF1A, 4, true); mg.setIndex(mIdx);
  mg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 0);
  const mmat = new THREE.ShaderMaterial({
    uniforms: { atlas: U.atlas, tona: U.tona, tid: { value: 0 } },
    vertexShader: `attribute vec2 lokal; attribute vec4 mInfo, mF0, mF1; uniform float tid; uniform vec2 tona; varying vec4 vF; varying vec2 vUv; varying float vR;
      void main(){ float t=(tid-mInfo.x)/max(mInfo.y,0.001);
        if(t<0.0||t>=1.0){ gl_Position=vec4(2.0,2.0,2.0,1.0); vF=vec4(0.0); vUv=vec2(0.0); vR=0.0; return; }   // ledig plats: utanför bilden
        vec4 mv=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*mv;
        vF=mix(mF0,mF1,t); vF.a*=1.0-smoothstep(tona.x,tona.y,-mv.z);
        vec2 q=vec2(lokal.x,-lokal.y); float cr=cos(mInfo.z), sr=sin(mInfo.z); vUv=vec2(cr*q.x-sr*q.y, sr*q.x+cr*q.y)+0.5; vR=mInfo.w; }`,
    fragmentShader: `uniform sampler2D atlas; varying vec4 vF; varying vec2 vUv; varying float vR;
      void main(){ vec2 p=vUv; if(p.x<0.0||p.y<0.0||p.x>1.0||p.y>1.0) discard;
        vec2 cell=vec2(mod(vR,${G}.0), floor(vR/${G}.0)); vec4 t=texture2D(atlas,(cell+p)/${G}.0);
        float a=t.a*vF.a; if(a<0.004) discard;
        gl_FragColor=vec4(t.rgb*vF.rgb, 1.0);
        #include <colorspace_fragment>
        gl_FragColor=vec4(gl_FragColor.rgb*a, a); }`,
    transparent: true, depthWrite: false, depthTest: true, polygonOffset: true, polygonOffsetFactor: MK.polygon_offset ?? -4, polygonOffsetUnits: MK.polygon_offset ?? -4,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  });
  const mm = new THREE.Mesh(mg, mmat); mm.renderOrder = 8; mm.frustumCulled = true; mm.visible = false; scene.add(mm);
  const mFodd = new Float64Array(MN).fill(-1e9), mSlut = new Float64Array(MN).fill(-1e9), mBox = new Float32Array(MN * 6);
  let tidNu = 0, markHog = -1, markSmutsMin = MN, markSmutsMax = -1, markerAktiva = 0, toppMarker = 0, markerErsatta = 0, markerTotalt = 0;
  // ---- F8: markhöjd ----
  let hFn = null, nFn = null, markYbas = o.markY ?? 0, dNu = null;
  const sattMark = (m = {}) => { const t = m.terrang || null; hFn = m.hojd || m.markHojd || (t && t.hojd ? (x, z) => t.hojd(x, z) : null); nFn = m.normal || m.markNormal || (t && t.normal ? (x, z) => t.normal(x, z) : null); if (m.y !== undefined) markYbas = m.y; if (m.markY !== undefined) markYbas = m.markY; };
  sattMark({ hojd: o.markHojd, normal: o.markNormal, terrang: o.terrang });
  const hTal = (x, z) => { const r = hFn(x, z); return typeof r === 'number' ? r : (r && r.y !== undefined ? r.y : markYbas); };
  // markens höjd och lutning (sx = dh/dx, sz = dh/dz) i (x, z). Ordning: höjdfunktion (+ normal, annars central differens 0,25 m),
  // annars d.mark_y / d.mark_normal i anropet (plan genom träffpunkten), annars markY.
  function markVid(x, z) {
    if (hFn) { const r = hFn(x, z); const y = typeof r === 'number' ? r : (r && r.y !== undefined ? r.y : markYbas); let n = (r && typeof r === 'object' && r.normal) || (nFn && nFn(x, z)) || null;
      if (n) { const ny = Math.max(n.y, 0.05); return [y, -n.x / ny, -n.z / ny]; }
      const E = 0.25; return [y, (hTal(x + E, z) - hTal(x - E, z)) / (2 * E), (hTal(x, z + E) - hTal(x, z - E)) / (2 * E)]; }
    const D = dNu || {}; const y0 = D.mark_y ?? markYbas, n = D.mark_normal;
    if (n && D.pos) { const ny = Math.max(n.y, 0.05), sx = -n.x / ny, sz = -n.z / ny; return [y0 + sx * (x - D.pos.x) + sz * (z - D.pos.z), sx, sz]; }
    return [y0, 0, 0];
  }
  function laggMarke(e, p, skala, inst, lod, k) {
    const S = e.storlek[0] * skala * lod.storlek * (FX_V2.storlek_skala ?? 1);
    let sl = -1, bv = Infinity; for (let i = 0; i < MN; i++) if (mSlut[i] <= tidNu) { sl = i; break; }
    if (sl < 0) { for (let i = 0; i < MN; i++) if (mFodd[i] < bv) { bv = mFodd[i]; sl = i; } markerErsatta++; }   // full: äldsta ersätts
    const l = e.liv * (0.85 + 0.3 * vr(inst, k + 13)), R_ = FX_V2.atlas.grupper[e.grupp], vv = vr(inst, k + 31);
    const rt = (e.rot0 || 0) + vv * (e.rotvar ?? 6.283), rr = R_.forsta + Math.floor(vv * R_.antal) % R_.antal;
    const c0 = markVid(p.x, p.z); let ymin = 1e9, ymax = -1e9;
    // rutnät: i terrängnätets hörn om markRutSteg finns och märket (vridet: diagonal S·√2) ryms i MG rutor, annars fritt (S × S kring träffen)
    const span = S * 1.4143, iX0 = RSTEG ? Math.floor((p.x - span / 2 - RS0[0]) / RSTEG) : 0, iZ0 = RSTEG ? Math.floor((p.z - span / 2 - RS0[1]) / RSTEG) : 0;
    const natt = RSTEG > 0 && (RS0[0] + (iX0 + MG) * RSTEG >= p.x + span / 2) && (RS0[1] + (iZ0 + MG) * RSTEG >= p.z + span / 2); if (natt) markerNatt++;
    for (let iy = 0; iy <= MG; iy++) for (let ix = 0; ix <= MG; ix++) { const g = sl * MV + iy * (MG + 1) + ix;
      if (natt) { const x = RS0[0] + (iX0 + ix) * RSTEG, z = RS0[1] + (iZ0 + iy) * RSTEG; mLok[g * 2] = (x - p.x) / S; mLok[g * 2 + 1] = -(z - p.z) / S; }
      else { mLok[g * 2] = ix / MG - 0.5; mLok[g * 2 + 1] = 0.5 - iy / MG; } }
    for (let v = 0; v < MV; v++) { const g3 = (sl * MV + v), x = p.x + mLok[g3 * 2] * S, z = p.z - mLok[g3 * 2 + 1] * S;
      const y = (hFn ? hTal(x, z) : c0[0] + c0[1] * (x - p.x) + c0[2] * (z - p.z)) + LYFT;   // draperas på marken (lutning och ojämnheter)
      mPosA[g3 * 3] = x; mPosA[g3 * 3 + 1] = y; mPosA[g3 * 3 + 2] = z; if (y < ymin) ymin = y; if (y > ymax) ymax = y;
      mInfoA[g3 * 4] = tidNu; mInfoA[g3 * 4 + 1] = l; mInfoA[g3 * 4 + 2] = rt; mInfoA[g3 * 4 + 3] = rr;
      for (let c = 0; c < 4; c++) { mF0A[g3 * 4 + c] = e.farg0[c]; mF1A[g3 * 4 + c] = e.farg1[c]; } }
    mFodd[sl] = tidNu; mSlut[sl] = tidNu + l; const h = natt ? span * 0.5 + RSTEG : S * 0.5; mBox.set([p.x - h, ymin, p.z - h, p.x + h, ymax, p.z + h], sl * 6);
    if (sl > markHog) markHog = sl; markSmutsMin = Math.min(markSmutsMin, sl); markSmutsMax = Math.max(markSmutsMax, sl); markerTotalt++;
    return sl;
  }
  function uppdateraMarken() {
    mmat.uniforms.tid.value = tidNu; let n = 0; const lo = new THREE.Vector3(1e9, 1e9, 1e9), hi = new THREE.Vector3(-1e9, -1e9, -1e9);
    for (let i = 0; i <= markHog; i++) if (mSlut[i] > tidNu) { n++; const b = i * 6; lo.x = Math.min(lo.x, mBox[b]); lo.y = Math.min(lo.y, mBox[b + 1]); lo.z = Math.min(lo.z, mBox[b + 2]); hi.x = Math.max(hi.x, mBox[b + 3]); hi.y = Math.max(hi.y, mBox[b + 4]); hi.z = Math.max(hi.z, mBox[b + 5]); }
    markerAktiva = n; toppMarker = Math.max(toppMarker, n); mm.visible = n > 0;
    if (n > 0) { mg.boundingSphere.center.addVectors(lo, hi).multiplyScalar(0.5); mg.boundingSphere.radius = lo.distanceTo(hi) * 0.5 + 0.05; }
    mg.setDrawRange(0, (markHog + 1) * MI);
    if (markSmutsMax >= 0) { for (const [nm, k] of [['position', 3], ['lokal', 2], ['mInfo', 4], ['mF0', 4], ['mF1', 4]]) { const at = mg.attributes[nm]; at.clearUpdateRanges(); at.addUpdateRange(markSmutsMin * MV * k, (markSmutsMax - markSmutsMin + 1) * MV * k); at.needsUpdate = true; }
      markSmutsMin = MN; markSmutsMax = -1; }
  }
  const camP = new THREE.Vector3(), camF = new THREE.Vector3(), svAck = new Float32Array(N);
  const rv = new Float32Array(N * 3), proj = new THREE.Vector3(), proj2 = new THREE.Vector3();
  const arLoop = new Uint8Array(N), loopInst = new Set();
  const liv = new Float32Array(N), max = new Float32Array(N), vel = new Float32Array(N * 3), sk = new Float32Array(N), def = new Array(N), varv = new Float32Array(N), agare = new Int32Array(N).fill(-1);
  let nasta = 0, instans = 0, topp = 0, aktivNu = 0, loopRakning = 0, hogsta = -1, forraHogsta = -1; const upp = new THREE.Vector3(0, 1, 0), vind = new THREE.Vector3(...FX_V2.vind_ms);
  const perInstans = new Map(), instEffekt = new Map(), toppEffekt = {};  // topp per effekt-id (summa över dess instanser)  // instans-id -> aktiva (för budget per effekt)

  // ---- LOD: avståndsnivå per utsläpp ----
  function lodNiva(p) {
    const L = FX_V2.lod.nivaer;
    if (tvingaLod !== null && L[tvingaLod]) return { n: tvingaLod, ...L[tvingaLod] };   // F5: tvingad LOD-nivå (test)
    if (!kamera) return { n: 0, antal: 1, storlek: 1 };
    const d = kamera.position.distanceTo(p);
    for (let i = 0; i < L.length; i++) if (d <= L[i].upp_till_m) return { n: i, ...L[i] };
    return null;   // bortom sista nivån: ingenting skapas
  }
  // ---- fästpunkter (som v1; noder i första hand, annars bounding box [F]) ----
  const NOD = { mynning: [/^MuzzlePoint$/, /^(Muzzle|Mynning|FX_Muzzle)$/i], motordack: [/^(EngineDeck|Engine_Deck|Motordack|FX_Engine|FX_EngineDeck)$/i, /^CamoSocket_Deck_Engine[LR]$/], kanon: [/^Gun$/], lucka: /^Hatch_(Commander|Loader|Driver|RadioOp|AsstDriver|Gunner)(_Pivot)?$/ };
  function registrera(obj, ov = {}) {
    obj.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(obj.matrixWorld).invert(), box = new THREE.Box3();
    obj.traverse(n => { if (n.isMesh && n.geometry) { n.geometry.computeBoundingBox(); box.union(n.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, n.matrixWorld))); } });
    const alla = []; obj.traverse(n => alla.push(n));
    const hitta = l => { for (const re of l) { const h = alla.filter(n => re.test(n.name || '')); if (h.length) return h; } return []; };
    const L = box.max.z - box.min.z, W = box.max.x - box.min.x, H = box.max.y - box.min.y;
    return { obj, box, L, W, H, fram: (ov.framat || '+z') === '+z' ? 1 : -1, noder: { mynning: hitta(NOD.mynning)[0] || null, kanon: hitta(NOD.kanon)[0] || null, motordack: hitta(NOD.motordack), luckor: alla.filter(n => NOD.lucka.test(n.name || '')) },
      skala: Math.min(1.6, Math.max(0.5, Math.sqrt((L * W) / FX_V2.ref_yta_m2))) };
  }
  const lokal = (v, x, y, z) => v.obj.localToWorld(new THREE.Vector3(x, y, z));
  function fastpunkt(v, namn, i = 0) {
    const b = v.box, cx = (b.min.x + b.max.x) / 2, f = v.fram, wp = n => n.getWorldPosition(new THREE.Vector3());
    if (namn === 'mynning') return v.noder.mynning ? wp(v.noder.mynning) : lokal(v, cx, b.min.y + v.H * 0.78, f > 0 ? b.max.z : b.min.z);
    if (namn === 'motordack') { if (v.noder.motordack.length) { const p = new THREE.Vector3(); v.noder.motordack.forEach(n => p.add(wp(n))); return p.multiplyScalar(1 / v.noder.motordack.length); }
      return lokal(v, cx, b.min.y + v.H * 0.62, f > 0 ? b.min.z + v.L * 0.18 : b.max.z - v.L * 0.18); }
    if (namn === 'lucka') return v.noder.luckor.length ? wp(v.noder.luckor[i % v.noder.luckor.length]) : lokal(v, cx, b.max.y, (b.min.z + b.max.z) / 2);
    return lokal(v, cx, (b.min.y + b.max.y) / 2, (b.min.z + b.max.z) / 2);
  }
  function eldror(v) {
    if (v.noder.mynning && v.noder.kanon) { const a = v.noder.kanon.getWorldPosition(new THREE.Vector3()), b = v.noder.mynning.getWorldPosition(new THREE.Vector3()); if (b.distanceTo(a) > 0.3) return b.sub(a).normalize(); }
    return new THREE.Vector3(0, 0, v.fram).transformDirection(v.obj.matrixWorld);
  }
  // ---- utsläpp ----
  function iKon(dir, kon, i, k, sidled) {
    const d = dir.clone().normalize(), a = new THREE.Vector3().crossVectors(d, Math.abs(d.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : upp).normalize(), b = new THREE.Vector3().crossVectors(d, a).normalize();
    let bas = d; if (sidled) bas = (k % 2 ? a.clone().negate() : a.clone()).multiplyScalar(0.9).addScaledVector(d, -0.2).normalize();
    const th = kon * Math.PI / 180 * Math.sqrt(vr(i, k * 3 + 1)), ph = 2 * Math.PI * vr(i, k * 3 + 2), s = Math.sin(th);
    return bas.clone().multiplyScalar(Math.cos(th)).addScaledVector(a, s * Math.cos(ph)).addScaledVector(b, s * Math.sin(ph)).normalize();
  }
  // F4: posten för en instans tas bort när dess sista partikel dör (loopar behåller sin post tills stopp()).
  function minska(a) { const n = (perInstans.get(a) || 1) - 1; if (n > 0) perInstans.set(a, n); else { perInstans.delete(a); if (!loopInst.has(a)) instEffekt.delete(a); } }
  // Förb. 2: ledig plats i första hand; är poolen full tas den engångspartikel som har kommit längst i sitt liv. Loop-partiklar (bränder) tas sist.
  // N10: antalet aktiva (aktivNu) hålls aktuellt, så en full pool hoppar direkt till stöldsökningen i stället för att först leta efter
  // en ledig plats bland alla 512. Har bara loopar platserna och den nya partikeln är engång returneras −1 direkt (loopRakning).
  function platsFor(arLoopNy) {
    if (aktivNu < N) for (let s = 0; s < N; s++) { const j = (nasta + s) % N; if (liv[j] <= 0) { nasta = (j + 1) % N; aktivNu++; return j; } }
    if (!arLoopNy && loopRakning >= N) return -1;
    let bast = -1, bv = -1; for (let j = 0; j < N; j++) { const v = (arLoop[j] ? 0 : 2) + (1 - liv[j] / max[j]); if (v > bv) { bv = v; bast = j; } }
    if (arLoop[bast] && !arLoopNy) return -1;   // bara loop-partiklar kvar: engångseffekten får vänta (bränder skrivs inte över)
    return bast;
  }
  function emit(e, p, dir, skala, inst, lod, tak, effId, iLoop = false) {
    const ant = Math.max(e.min ?? 1, Math.round(e.antal * lod.antal * (iLoop ? 1 : kv)));
    let sist = -1;
    if (e.ligg) { for (let k = 0; k < ant; k++) laggMarke(e, p, skala, inst, lod, k); return -1; }   // F9: egen pool, ingen partikelplats
    for (let k = 0; k < ant; k++) {
      if ((perInstans.get(inst) || 0) >= tak) return sist;     // effektens partikeltak
      const j = platsFor(iLoop); if (j < 0) return sist;
      // F6: posten skapas först när en partikel faktiskt har fått en plats. Förr sattes den före platsFor(); var poolen full av
      // loop-partiklar gav platsFor −1, ingen partikel skapades, minska() kördes aldrig och posten blev kvar (40k anrop = 60k poster).
      if (effId && !instEffekt.has(inst)) instEffekt.set(inst, effId);
      if (liv[j] > 0 && agare[j] >= 0) minska(agare[j]);
      const r = e.kon > 0 ? iKon(e.mark ? upp : dir, e.kon, inst, k, e.sidled) : dir.clone().normalize(); if (e.mark) { r.y *= 0.2; r.normalize(); }
      const f = e.fart * skala * (0.75 + 0.5 * vr(inst, k + 7)), ofs = (e.spridning_m || 0) * skala;
      pos[j * 3] = p.x + ofs * (vr(inst, k + 21) - 0.5); pos[j * 3 + 2] = p.z + ofs * (vr(inst, k + 23) - 0.5);
      const mv_ = markVid(pos[j * 3], pos[j * 3 + 2]);   // F8: marken under just den här partikeln
      mp[j * 3] = mv_[0] - mv_[1] * pos[j * 3] - mv_[2] * pos[j * 3 + 2]; mp[j * 3 + 1] = mv_[1]; mp[j * 3 + 2] = mv_[2];
      pos[j * 3 + 1] = (e.vid_mark ? mv_[0] + 0.3 * e.storlek[0] * skala * lod.storlek * (FX_V2.storlek_skala ?? 1) : p.y)   /* Förb. 1: lyft ≈0,3·storlek + mjuk kant i skuggaren; F8: lokal markhöjd */ + ofs * 0.3 * vr(inst, k + 22);
      vel.set([r.x * f, r.y * f, r.z * f], j * 3); rv.set([r.x, r.y, r.z], j * 3);
      if (arLoop[j]) loopRakning--; if (iLoop) loopRakning++; arLoop[j] = iLoop ? 1 : 0;
      const l = e.liv * (0.85 + 0.3 * vr(inst, k + 13)); liv[j] = l; max[j] = l; def[j] = e; sk[j] = skala * lod.storlek; varv[j] = vr(inst, k + 31); agare[j] = inst; svAck[j] = 0;
      perInstans.set(inst, (perInstans.get(inst) || 0) + 1); sist = j; if (j > hogsta) hogsta = j;
    }
    return sist;
  }
  const loopar = new Set();
  function spela(id, d = {}) {
    const D = FX_V2.effekter[id]; if (!D) { console.warn('[effekter_v2d] okänd effekt', id); return null; }
    const inst = instans++; dNu = d;   // F8: d.mark_y / d.mark_normal gäller detta anrops utsläpp
    if (o.ljudkrok && D.handelse) try { o.ljudkrok(D.handelse(d), { effekt_id: D.id, pos: d.pos || null, kaliber_mm: d.kaliber_mm, utfall: d.utfall, underlag: d.underlag, fas: d.fas }); } catch (e) { console.warn('[effekter_v2d] ljudkrok', e); }
    let p = d.pos, dir = d.riktning || upp;
    if (d.vagn && !p) p = fastpunkt(d.vagn, D.fastpunkt);
    if (id === 'mynningsflamma' && d.vagn && !d.riktning) dir = eldror(d.vagn);
    if (id === 'traff_pansar') dir = (d.normal || upp).clone();
    if (id === 'traff_mark' && d.underlag === 'vatten') { const W = FX_V2.effekter.traff_vatten; const lodw = lodNiva(p); if (!lodw) return engang(inst, -1);
      for (const e of W.valj(d)) emit(e, p, upp, W.skala(d), inst, lodw, W.budget.max_partiklar, id); return { ...engang(inst, lodw.n), variant: 'vatten' }; }
    if (id === 'traff_pansar' && d.utfall === 'rikoschett' && d.riktning) { const n = (d.normal || upp).clone().normalize(), r = d.riktning.clone().normalize(); dir = r.sub(n.multiplyScalar(2 * r.dot(n))).normalize(); }
    const skala = D.skala(d, d.vagn);
    // F1: loopar får ALLTID ett fullt handtag och registreras även bortom sista LOD-nivån; uppdatera() släpper bara ut partiklar
    // när loopen är inom LOD-avstånd, så branden syns när kameran närmar sig. Standardfas är 'tand' (Förb. 7).
    if (D.loop) { const h = { id, D, d, inst, p: p.clone(), skala, fasNamn: d.fas || 'tand', ack: {}, vagn: d.vagn, aktiv: true,
        get lod() { const l = lodNiva(this.p); return l ? l.n : -1; },
        fas(n) { if (!D.faser[n]) { console.warn('[effekter_v2d] okänd fas', n); return this; } this.fasNamn = n; if (o.ljudkrok && D.handelse) o.ljudkrok(D.handelse({ ...d, fas: n }), { effekt_id: D.id, fas: n }); return this; },
        flytta(np) { this.p.copy(np); return this; },
        stopp() { loopar.delete(this); loopInst.delete(inst); if (!perInstans.has(inst)) instEffekt.delete(inst); this.aktiv = false; return this; },
        starta() { if (!this.aktiv) { loopar.add(this); loopInst.add(inst); instEffekt.set(inst, id); this.aktiv = true; } return this; } };
      loopar.add(h); loopInst.add(inst); instEffekt.set(inst, id); return h; }
    const lod = lodNiva(p); if (!lod) return engang(inst, -1);
    const val = D.valj(d);
    for (const e of val) emit(e, p, dir, skala, inst, lod, D.budget.max_partiklar, id);
    if (D.blixt && ljus && lod.n <= 1) { const B = D.blixt; ljus.position.copy(p).addScaledVector(dir, 0.6); ljusMax = B.liv_s; ljusT = B.liv_s; ljusI = B.intensitet * skala * skala; ljus.distance = B.radie_m * skala; }
    if (id === 'mynningsflamma' && d.sparljus && d.sparljus.till) {          // spårljus: 1 huvud + kort svans ur samma pool och samma draw call
      const S = FX_V2.effekter.sparljus, till = d.sparljus.till.clone(), ln = till.distanceTo(p), dv = till.clone().sub(p).normalize(), fart = d.sparljus.fart_ms || S.fart_ms;
      const lodS = lodNiva(p) || lod; emit({ ...S.huvud, fart, liv: Math.min(S.max_liv_s, ln / fart), svans_tak: S.budget.max_partiklar }, p.clone().addScaledVector(dv, 1), dv, 1, instans++, {   /* eget heltals-id: agare är Int32Array, inst+0,5 avrundades förr till inst (gav '?' och kvarblivna poster) */  antal: 1, storlek: lodS.storlek }, S.budget.max_partiklar, 'sparljus');
    }
    return engang(inst, lod.n);
  }
  // Engångseffekter: samma form på handtaget oavsett LOD (fas/stopp finns men gör inget), så anropare aldrig får TypeError (F1).
  function engang(inst, lod) { return { inst, lod, aktiv: false, fas() { return this; }, stopp() { return this; }, starta() { return this; }, flytta() { return this; } }; }
  // ---- uppdatering ----
  const bmin = new THREE.Vector3(), bmax = new THREE.Vector3();
  const vb = new THREE.Vector2();
  function uppdateraSkarm() {   // F2
    if (renderer && kamera && kamera.isPerspectiveCamera) { renderer.getDrawingBufferSize(vb); bufH = vb.y; mat.uniforms.skarm.value = vb.y / (2 * Math.tan(THREE.MathUtils.degToRad(kamera.fov) / 2) * (kamera.zoom ? 1 / kamera.zoom : 1));
      if (!mat.uniforms.maxPx.userData) { const gl = renderer.getContext(); const r = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE); glMaxPx = r ? r[1] : 1024;   // läses vid start (och vid sattRenderer)
        mat.uniforms.maxPx.value = Math.min(glMaxPx, o.maxPunktPx || Infinity); mat.uniforms.maxPx.userData = 1; } }
    else if (!varnatSkarm && !o.pixelPerMeter) { varnatSkarm = true; console.warn('[effekter_v2d] ingen renderer given: punktstorleken använder reservvärdet 600 (ge { renderer } för rätt storlek vid alla DPR)'); }
  }
  let glMaxPx = null, bufH = 0;
  function uppdatera(dt) {
    dt = Math.min(dt, 0.1); uppdateraSkarm();
    tidNu += dt;
    for (const h of loopar) { const lod = lodNiva(h.p); if (!lod) continue; dNu = h.d;
      for (const [k, e] of h.D.faser[h.fasNamn].entries()) { h.ack[k] = (h.ack[k] || 0) + e.per_s * lod.antal * kv * dt;
        while (h.ack[k] >= 1) { h.ack[k] -= 1; const pp = e.fast === 'lucka' && h.vagn ? fastpunkt(h.vagn, 'lucka', instans) : h.p; emit({ ...e, antal: 1 }, pp, upp, h.skala, h.inst, { antal: 1, storlek: lod.storlek }, h.D.budget.max_partiklar, h.id, true); instans++; } } }
    dNu = null;   // svansar och övrigt i uppdatera: markY/höjdfunktion, inte senaste anropets mark_y
    if (ljus) { if (ljusT > 0) { ljusT -= dt; const t = Math.max(0, ljusT / ljusMax); ljus.intensity = ljusI * t * t; } else ljus.intensity = 0; }
    let akt = 0, hiNu = -1, maxS = 0; kapadeNu = 0; quadsFullaNu = 0; const perEff = {}; bmin.set(1e9, 1e9, 1e9); bmax.set(-1e9, -1e9, -1e9);
    const skalaV = mat.uniforms.skala.value, skarmV = mat.uniforms.skarm.value, maxPxV = mat.uniforms.maxPx.value;
    qn = 0; qnStora = 0;
    const harKam = !!kamera, kanStora = storaSomQuads && harKam;
    if (harKam) { const me = kamera.matrixWorld.elements; camP.set(me[12], me[13], me[14]); camF.set(-me[8], -me[9], -me[10]).normalize(); U.camR.value.set(me[0], me[1], me[2]).normalize(); U.camU.value.set(me[4], me[5], me[6]).normalize(); }
    // Fråga 1: skärmtak (sidans längd ≤ tak × bildbuffertens höjd). FX_V2.skarmtak = { glod: 0,6, ovriga: 1,0 } (o.skarmtak ersätter).
    const TAK = o.skarmtak || FX_V2.skarmtak || {}, Hb = bufH || (harKam ? skarmV * 2 * Math.tan(THREE.MathUtils.degToRad(kamera.fov) / 2) / (kamera.zoom || 1) : 0);
    for (let j = 0; j < N; j++) {
      if (liv[j] <= 0) { siz[j] = 0; continue; }
      liv[j] -= dt; if (liv[j] <= 0) { siz[j] = 0; col[j * 4 + 3] = 0; if (agare[j] >= 0) minska(agare[j]); agare[j] = -1; if (arLoop[j]) loopRakning--; arLoop[j] = 0; aktivNu--; continue; }
      akt++; { const ef = instEffekt.get(agare[j]) || '?'; perEff[ef] = (perEff[ef] || 0) + 1; } const e = def[j], t = 1 - liv[j] / max[j], i3 = j * 3, dr = Math.exp(-(e.drag || 0) * dt);
      vel[i3] *= dr; vel[i3 + 1] *= dr; vel[i3 + 2] *= dr; vel[i3 + 1] += (-(e.gravity || 0) + (e.lyft || 0)) * dt;
      if (e.vind) { vel[i3] += vind.x * 0.3 * dt; vel[i3 + 2] += vind.z * 0.3 * dt; }
      pos[i3] += vel[i3] * dt; pos[i3 + 1] += vel[i3 + 1] * dt; pos[i3 + 2] += vel[i3 + 2] * dt;
      // N3: svansen räknas in i spårljusets tak (FX_V2.effekter.sparljus.budget.max_partiklar, huvud + svans) och släpps ut med fast takt
      // per sekund (inte per bildruta), bakåt längs banan. emit() returnerar platsen som faktiskt fick partikeln (förr: nasta, kunde vara fel).
      if (e.svans && liv[j] > dt) { const S = e.svans, ps_ = S.per_s || 60; svAck[j] += ps_ * dt; const n = Math.floor(svAck[j]); svAck[j] -= n;
        for (let q = 0; q < n; q++) { const bak = q / ps_; proj.set(pos[i3] - vel[i3] * bak, pos[i3 + 1] - vel[i3 + 1] * bak, pos[i3 + 2] - vel[i3 + 2] * bak);
          const k = emit({ ...S }, proj, upp, 1, agare[j], { antal: 1, storlek: sk[j] }, e.svans_tak || 12, instEffekt.get(agare[j]) || 'sparljus', false);
          if (k >= 0 && k !== j) { rv[k * 3] = vel[i3]; rv[k * 3 + 1] = vel[i3 + 1]; rv[k * 3 + 2] = vel[i3 + 2]; } else if (k < 0) break; } }
      if (e.gravity) {   // F8: studsar mot den lokala marken (markplanet; nära marken och på väg ner läses höjdfunktionen där partikeln är)
        let gy = mp[i3] + mp[i3 + 1] * pos[i3] + mp[i3 + 2] * pos[i3 + 2];
        if (hFn && vel[i3 + 1] < 0 && pos[i3 + 1] < gy + 1) { gy = hTal(pos[i3], pos[i3 + 2]); mp[i3] = gy - mp[i3 + 1] * pos[i3] - mp[i3 + 2] * pos[i3 + 2]; }
        if (pos[i3 + 1] < gy) { pos[i3 + 1] = gy; vel[i3 + 1] *= -0.2; vel[i3] *= 0.5; vel[i3 + 2] *= 0.5; } }
      siz[j] = (e.storlek[0] + (e.storlek[1] - e.storlek[0]) * t) * sk[j];
      const R = FX_V2.atlas.grupper[e.grupp];
      ruta[j] = R.forsta + (e.anim ? Math.min(R.antal - 1, Math.floor(t * R.antal)) : Math.floor(varv[j] * R.antal) % R.antal);
      if (e.strak && kamera) {   // riktning på skärmen ur hastighet (eller utsläppsriktning) – gnistor och spårljus blir streck
        const vx = Math.hypot(vel[i3], vel[i3 + 1], vel[i3 + 2]) > 0.5 ? 1 : 0, ax = vx ? vel.subarray(i3, i3 + 3) : rv.subarray(i3, i3 + 3);
        proj.set(pos[i3], pos[i3 + 1], pos[i3 + 2]).project(kamera); proj2.set(pos[i3] + ax[0] * 0.05, pos[i3 + 1] + ax[1] * 0.05, pos[i3 + 2] + ax[2] * 0.05).project(kamera);
        rot[j] = Math.atan2((proj2.y - proj.y) / kamera.aspect, proj2.x - proj.x) * -1 + (e.strak_ofs || 0) + (e.rotvar ? (varv[j] - 0.5) * e.rotvar : 0); }
      else rot[j] = (e.snurr ? varv[j] * 6.283 + e.snurr * t : (e.rot0 || 0) + varv[j] * (e.rotvar ?? 6.283)); add[j] = e.add ? 1 : 0;
      for (let c = 0; c < 4; c++) col[j * 4 + c] = e.farg0[c] + (e.farg1[c] - e.farg0[c]) * t; if (e.in) col[j * 4 + 3] *= Math.min(1, t / e.in);   // in: tona in (andel av livet), t.ex. rök som inte ska ligga framför blixten
      hiNu = j;
      // F7 / N2: till quad-meshen? Liggande märken alltid; övriga när punkten skulle bli större än GPU:ns punktgräns (t.ex. 511 px på iPhone [F]).
      let tillQuad = false;
      if (harKam) { const dz = Math.max((pos[i3] - camP.x) * camF.x + (pos[i3 + 1] - camP.y) * camF.y + (pos[i3 + 2] - camP.z) * camF.z, 0.1); let px = siz[j] * skalaV * skarmV / dz;
        const tk = (TAK[e.skarmtak] ?? TAK.ovriga ?? Infinity) * Hb; if (Hb > 0 && px > tk) { siz[j] *= tk / px; px = tk; kapadeNu++; }   // Fråga 1
        tillQuad = kanStora && px > maxPxV; }
      if (tillQuad && qn >= QN) quadsFullaNu++;   // N13: reserv (kapad punkt) används
      if (tillQuad && qn < QN) { const q3 = qn * 3, q4 = qn * 4; qPos[q3] = pos[i3]; qPos[q3 + 1] = pos[i3 + 1]; qPos[q3 + 2] = pos[i3 + 2];
        for (let c = 0; c < 4; c++) qCol[q4 + c] = col[j * 4 + c]; qSiz[qn] = siz[j]; qRuta[qn] = ruta[j]; qRot[qn] = rot[j]; qAdd[qn] = add[j]; qMark[q3] = mp[i3]; qMark[q3 + 1] = mp[i3 + 1]; qMark[q3 + 2] = mp[i3 + 2];
        qnStora++; qn++; siz[j] = 0; continue; }   // punkten ritas inte (storlek 0)
      // N4: lådan räknas på partiklarnas mitt; radien får marginalen största halva sprite-diagonal (storlek × skala × √2 / 2), inte fasta 0,5 m.
      const s = siz[j] * skalaV * 0.7072; if (s > maxS) maxS = s; bmin.min({ x: pos[i3], y: pos[i3 + 1], z: pos[i3 + 2] }); bmax.max({ x: pos[i3], y: pos[i3 + 1], z: pos[i3 + 2] });
    }
    topp = Math.max(topp, akt); aktiva = akt; for (const k in perEff) toppEffekt[k] = Math.max(toppEffekt[k] || 0, perEff[k]); aktivaEffekt = perEff;
    const iPunkter = akt - qn;
    if (iPunkter > 0) { g.boundingSphere.center.addVectors(bmin, bmax).multiplyScalar(0.5); g.boundingSphere.radius = bmin.distanceTo(bmax) * 0.5 + maxS + 0.05; } else g.boundingSphere.radius = 0;
    pts.visible = iPunkter > 0;   // inga punkter = inget draw call
    // Förb. 9: ladda bara upp den del av bufferten som används (addUpdateRange), och rita bara dit (drawRange).
    const hi = Math.max(hiNu, hogsta), omr = Math.max(hi, forraHogsta) + 1; hogsta = -1; forraHogsta = hi;
    if (omr > 0) for (const n of ATTR) { const at = g.attributes[n]; at.clearUpdateRanges(); at.addUpdateRange(0, omr * at.itemSize); at.needsUpdate = true; }
    g.setDrawRange(0, hi + 1);
    qg.instanceCount = qn; qm.visible = qn > 0; toppQuads = Math.max(toppQuads, qn);
    if (qn > 0 || forraQn > 0) for (const n of QATTR) { const at = qg.attributes[n]; at.clearUpdateRanges(); at.addUpdateRange(0, Math.max(qn, 1) * at.itemSize); at.needsUpdate = true; }
    forraQn = qn; quadsFulla = quadsFullaNu; kapade = kapadeNu; uppdateraMarken();
  }
  let kapadeNu = 0, quadsFullaNu = 0, kapade = 0;
  const ATTR = ['position', 'farg', 'storlek', 'ruta', 'rot', 'add', 'markplan'], QATTR = ['iPos', 'iFarg', 'iStorlek', 'iRuta', 'iRot', 'iAdd', 'iMark']; let forraQn = 0;
  let aktiva = 0, aktivaEffekt = {};
  const statistik = () => ({ kvalitet: Object.keys(KVALITET).find(k => KVALITET[k] === kv) || kv, tvingad_lod: tvingaLod, skarm_px_per_m: +mat.uniforms.skarm.value.toFixed(1), max_punkt_px: mat.uniforms.maxPx.value, instanser_i_minne: perInstans.size, effekt_poster: instEffekt.size, partiklar: aktiva, topp, per_effekt: { ...aktivaEffekt }, topp_per_effekt: { ...toppEffekt }, pool: N, loopar: loopar.size, ritanrop_effekter: (pts.visible ? 1 : 0) + (qm.visible ? 1 : 0) + (mm.visible ? 1 : 0), quads: qn, quads_liggande: 0 /* F9: märken räknas i markar */, quads_stora: qnStora, topp_quads: toppQuads, quad_max: QN, quads_fulla: quadsFulla, kapade_av_skarmtak: kapade,
    markar: markerAktiva, topp_markar: toppMarker, markar_max: MN, markar_ersatta: markerErsatta, markar_totalt: markerTotalt, markar_rutnat: MG, markar_i_terrangnat: markerNatt, mark_rut_steg_m: RSTEG || null, staende_markar: 0 /* F9: märken går aldrig till punktpoolen */, mark_hojd: hFn ? (nFn ? 'funktion+normal' : 'funktion') : 'markY/anrop', gl_max_punkt_px: glMaxPx, texturer: o.atlas ? 1 : 0 /* N7: punkter och quads delar samma atlas */, ljus_i_scen: ljus ? 1 : 0, ljus_intensitet: ljus ? +ljus.intensity.toFixed(2) : 0 });
  const nollstallTopp = () => { topp = 0; toppQuads = 0; toppMarker = 0; for (const k in toppEffekt) delete toppEffekt[k]; };
  // F5: detaljnivåer. kvalitet multiplicerar antal och utsläppstakt; tvingaLod 0|1|2 låser LOD-nivån (null = efter avstånd).
  const sattKvalitet = (k) => { if (!(k in KVALITET)) throw new Error('kvalitet: hog|mellan|lag'); kv = KVALITET[k]; };
  const sattTvingadLod = (n) => { tvingaLod = (n === null || n === undefined || n === '') ? null : Math.max(0, Math.min(FX_V2.lod.nivaer.length - 1, n | 0)); };
  const sattRenderer = (r) => { renderer = r; mat.uniforms.maxPx.userData = 0; uppdateraSkarm(); };
  let bortkastad = false;
  // F3: frigör allt fx äger. Atlasen frigörs bara om fx äger den (o.agerAtlas === true).
  function dispose() { if (bortkastad) return; bortkastad = true; scene.remove(pts); g.dispose(); mat.dispose(); scene.remove(qm); qg.dispose(); qmat.dispose(); scene.remove(mm); mg.dispose(); mmat.dispose(); mFodd.fill(-1e9); mSlut.fill(-1e9); if (o.agerAtlas && o.atlas) o.atlas.dispose();
    if (ljus) { scene.remove(ljus); ljus.dispose && ljus.dispose(); } loopar.clear(); loopInst.clear(); perInstans.clear(); instEffekt.clear(); liv.fill(0); aktivNu = 0; loopRakning = 0; arLoop.fill(0); }
  return { spela, registrera, fastpunkt, uppdatera, statistik, nollstallTopp, sattKvalitet, sattTvingadLod, sattRenderer, sattMark, markVid, dispose, objekt: pts, material: mat, quadObjekt: qm, quadMaterial: qmat, markObjekt: mm, markMaterial: mmat, defs: FX_V2, kvaliteter: Object.keys(KVALITET) };
}
export default skapaEffekterV2d;
