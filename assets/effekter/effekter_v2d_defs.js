// Definitioner för gemensamma stridseffekter v2d (R15). Kopia av v2c-definitionerna (v2c fryst) med F9 (markar: egen pool för brännmärken),
// Fråga 1 (skarmtak) och Förb. 10 (schemanamnet förklarat nedan). Effekterna i sig är oförändrade från v2c.
// v2c hade: F7 (brännmärke liggande), N3 (svans i taket), N5 (reserv_png finns), Förb. 8 (traff_mark: antal följer laddning_g). Som i v2: mynningsflamma, träffar och nedslag är omgjorda på
// Unity Labs-flipbooks (Flame02, WispySmoke02, FireBall01, Explosion01, DiscSmoke01) och Kenney-rutor. brand_rok är som v2 (VD: "håller").
// Alla tider, storlekar, färgfaktorer och skalexponenter är [F] (egen bedömning) om inte annat står. farg > 1 = ljusare än rutan (additivt).
const fm = (c, a) => [c[0], c[1], c[2], a];
const BRUN = [0.36, 0.28, 0.19], MORK = [0.22, 0.17, 0.12], DAMM = [0.62, 0.54, 0.42], GRA = [0.72, 0.7, 0.66], VIT = [0.9, 0.93, 0.96];
const gnista = (antal, kon, fart, liv = 0.45) => ({ grupp: 'gnista', add: 1, strak: true, antal, liv, fart, kon, gravity: 9.81, drag: 0.8, storlek: [1.3, 0.6], farg0: [2.2, 1.7, 0.9, 1], farg1: [1.2, 0.45, 0.1, 0] });
const blixt = (s, liv = 0.06) => ({ grupp: 'stjarna', add: 1, antal: 1, liv, fart: 0, kon: 0, storlek: [s, s * 1.3], farg0: [1.6, 1.4, 1.1, 1], farg1: [1.2, 0.6, 0.2, 0] });
const glod = (liv, s, a) => ({ grupp: 'glod', add: 1, antal: 1, liv, fart: 0, kon: 0, storlek: [s, s * 1.2], farg0: [1, 0.78, 0.5, a], farg1: [1, 0.5, 0.2, 0] });
export const FX_V2 = {
  schema: 'hexkrig1944.effekt.v1', version: 'v2d', datum: '2026-11-03',
  // Förb. 10: schemanamnet är kvar som 'hexkrig1944.effekt.v1'. Skäl: alla fält som fanns i v1 betyder samma sak som förut. Det som har
  // kommit till sedan v1 är VALFRIA tillägg som en v1-läsare kan hoppa över: 'ligg' (brännmärke som ligger på marken, v2c), 'markar'
  // och 'skarmtak' (v2d). Ett nytt schemanamn behövs först när ett befintligt fält byter betydelse. N5: reserv_png finns i _gemensamt_v2d/.
  atlas: { fil: 'fx_atlas_v2d.ktx2', reserv_png: 'fx_atlas_v2d.png', px: 1024, kolumner: 8, rader: 8, ruta_px: 128,
    grupper: { eld: { forsta: 0, antal: 8 }, rok: { forsta: 8, antal: 8 }, slinga: { forsta: 16, antal: 8 }, eldklot: { forsta: 24, antal: 8 }, explosion: { forsta: 32, antal: 8 }, markdamm: { forsta: 40, antal: 8 },
      mynning: { forsta: 48, antal: 4 }, sidoflamma: { forsta: 52, antal: 2 }, glod: { forsta: 54, antal: 1 }, gnista: { forsta: 55, antal: 2 }, stjarna: { forsta: 57, antal: 1 }, klump: { forsta: 58, antal: 3 },
      jordkast: { forsta: 61, antal: 1 }, brannmarke: { forsta: 62, antal: 1 }, droppe: { forsta: 63, antal: 1 } } },
  // storlek_skala: v2d:s storlekar är avstämda mot den gamla fasta skarm=600 (390×844, DPR 1). Med rätt skarm (≈1028 vid 393×852) ger 0,583
  // samma utseende vid DPR 1 och nu också vid DPR 2 och 3 (Kvalitet F2). [F] avstämning, inte mätt mot film.
  storlek_skala: 0.583,
  // F9: egen pool för brännmärken (poster med ligg: true). Full pool: äldsta märket ersätts. rutnat: rutor per sida när märket draperas på
  // marken (12 = 288 trianglar per märke). lyft_m: höjd över marken; polygon_offset: djupförskjutning mot marken. rut_steg_m: terrängnätets
  // steg (null = fritt rutnät; spelet kan ge markRutSteg i stället). [F] avstämda i v2d-proven.
  markar: { max: 128, rutnat: 12, lyft_m: 0.010, polygon_offset: -4, rut_steg_m: null },
  // Fråga 1: största sida på skärmen, i andel av bildbuffertens höjd. glod = mynningsflammans glöd och blixt; ovriga = alla andra sprites.
  // Posten väljer med skarmtak: 'glod'. [F] värden, Kvalitets förslag 09:41 (mätt bara i headless-webbläsare, inte på iPhone). Alla glöd- och blixtposter (mynning, spårljussvans, brandglöd) har 'glod'.
  skarmtak: { glod: 0.6, ovriga: 1.0 },
  pool_max: 512, vind_ms: [1.2, 0, 0.4], ref_yta_m2: 18.3,
  lod: { nivaer: [{ namn: 'nara', upp_till_m: 60, antal: 1, storlek: 1 }, { namn: 'mellan', upp_till_m: 200, antal: 0.5, storlek: 1.35 }, { namn: 'langt', upp_till_m: 800, antal: 0.25, storlek: 1.8 }], tona_m: [500, 800] },
  effekter: {
    mynningsflamma: {
      id: 'mynningsflamma.generell.v2d', handelse: (d) => (d.kaliber_mm || 76) < 20 ? 'skott.kulspruta' : 'skott.kanon', triggas_av: 'händelse skott (+ valfritt sparljus: { till })', fastpunkt: 'mynning', budget: { max_partiklar: 40, draw_calls: 1 },
      skala_formel: 'kaliber < 20 mm: 0,3; annars (kaliber/76)^0,8 (som v1/v2)',
      skala: (d) => (d.kaliber_mm || 76) < 20 ? 0.3 : Math.pow((d.kaliber_mm || 76) / 76, 0.8),
      parametrar: ['kaliber_mm', 'mynningsbroms', 'mark_m (mynningens höjd över mark)', 'underlag: torr|fuktig|vat', 'sparljus: { till: Vector3, fart_ms }'],
      blixt: { typ: 'PointLight (valfri, o.ljus=true) annars bara additiv blixtruta', liv_s: 0.065, intensitet: 60, radie_m: 14, farg: '#ffc27a', bara_lod: 'nara+mellan' },
      valj: (d) => {
        const k = d.kaliber_mm || 76, l = [
          { grupp: 'mynning', add: 1, strak: true, strak_ofs: Math.PI / 2, antal: 1, liv: 0.07, fart: 0, kon: 0, storlek: [3.2, 4.2], farg0: [1.7, 1.4, 0.9, 1], farg1: [1.2, 0.55, 0.2, 0] },
          { grupp: 'eldklot', add: 1, anim: true, antal: 2, liv: 0.12, fart: 9, kon: 6, drag: 6, storlek: [1.6, 3.2], farg0: [1.5, 1.25, 1, 1], farg1: [1, 0.55, 0.25, 0] },
          { ...blixt(4.5, 0.065), skarmtak: 'glod' }, { ...glod(0.07, 7, 0.7), skarmtak: 'glod' },   // Fråga 1: tak 0,6 × skärmhöjd
          gnista(6, 10, 28, 0.15)];
        if (d.mynningsbroms) l.push({ grupp: 'mynning', add: 1, strak: true, strak_ofs: Math.PI / 2, antal: 2, liv: 0.08, fart: 9, kon: 4, sidled: true, drag: 8, storlek: [1.8, 2.8], farg0: [1.6, 1.3, 0.8, 1], farg1: [1.1, 0.5, 0.2, 0] });
        if (k >= 20) l.push({ grupp: 'slinga', add: 0, antal: 6, liv: 2.6, fart: 4, kon: 20, drag: 1.5, lyft: 0.4, vind: true, in: 0.12, storlek: [1.2, 5], farg0: [1.9, 1.85, 1.75, 0.6], farg1: [1.6, 1.56, 1.48, 0] }   /* WispySmoke-rutorna är mörka (medel 0,36); förstärkt till ljusgrå krutrök, tonas in efter blixten */);
        if ((d.mark_m ?? 2) < 2.5 && d.underlag !== 'vat' && k >= 20)
          l.push({ grupp: 'markdamm', add: 0, antal: d.underlag === 'fuktig' ? 2 : 4, liv: 2.5, fart: 5, kon: 85, mark: true, vid_mark: true, drag: 1.2, vind: true, in: 0.04, storlek: [2, 6], farg0: fm(DAMM, 0.7), farg1: fm(DAMM, 0) });
        return l;
      } },
    sparljus: {
      id: 'sparljus (del av mynningsflamma.generell.v2d)', budget: { max_partiklar: 12 /* huvud + svans (N3) */ }, fart_ms: 800, max_liv_s: 2.5,
      huvud: { grupp: 'gnista', add: 1, strak: true, antal: 1, fart: 800, kon: 0, storlek: [7, 7], farg0: [1.8, 0.9, 0.35, 1], farg1: [1.6, 0.7, 0.25, 1],
        svans: { per_s: 60, grupp: 'glod', skarmtak: 'glod', add: 1, antal: 1, liv: 0.1, fart: 0, kon: 0, storlek: [1.6, 0.5], farg0: [1, 0.55, 0.2, 0.8], farg1: [1, 0.3, 0.1, 0] } } },
    traff_pansar: {
      id: 'traff_pansar.generell.v2d', handelse: () => 'traff.pansar', triggas_av: 'händelse traff (rikoschett / ingen_genomslag / genomslag)', fastpunkt: 'traffpunkt (pos ur stridsreglerna; annars vagnens mitt)', budget: { max_partiklar: 40, draw_calls: 1 },
      skala_formel: '(kaliber/75)^0,6 (som v1/v2)', skala: (d) => Math.pow((d.kaliber_mm || 75) / 75, 0.6),
      parametrar: ['utfall', 'pos', 'normal (plåtnormal)', 'riktning (inkommande)', 'kaliber_mm'],
      valj: (d) => {
        const kl = (s, liv) => ({ grupp: 'eldklot', add: 1, anim: true, antal: 1, liv, fart: 0, kon: 0, storlek: [s * 0.6, s], farg0: [1.5, 1.3, 1, 1], farg1: [1, 0.5, 0.2, 0] });
        if (d.utfall === 'rikoschett') return [gnista(22, 22, 30, 0.5), blixt(2.2), kl(1.6, 0.18)];
        if (d.utfall === 'genomslag') return [blixt(3), kl(3, 0.3), { grupp: 'explosion', add: 0, anim: true, antal: 1, liv: 1.0, fart: 0, kon: 0, storlek: [2.2, 4.8], farg0: [1.2, 1.2, 1.2, 1], farg1: [1, 1, 1, 0.2] }, gnista(20, 70, 18, 0.6),
          { grupp: 'slinga', add: 0, antal: 4, liv: 2.8, fart: 1.5, kon: 40, drag: 1, lyft: 0.6, vind: true, storlek: [1, 4], farg0: [0.25, 0.23, 0.21, 0.75], farg1: [0.4, 0.4, 0.4, 0] }];
        return [gnista(20, 60, 16, 0.5), blixt(2.4), kl(1.8, 0.2), { grupp: 'slinga', add: 0, antal: 3, liv: 1.6, fart: 1, kon: 40, drag: 1.2, lyft: 0.3, storlek: [0.6, 2.2], farg0: fm(GRA, 0.55), farg1: fm(GRA, 0) }];
      } },
    traff_mark: {
      id: 'traff_mark.generell.v2d', handelse: (d) => d.laddning_g > 0 ? 'explosion' : 'traff.mark', triggas_av: 'händelse nedslag (underlag vatten -> vattennedslag)', fastpunkt: 'traffpunkt (pos på marken)', budget: { max_partiklar: 50, draw_calls: 1 },
      skala_formel: 'laddning > 0: (laddning/ref)^(1/3) begränsad 0,5–2,0, ref 680 g under 800 g annars 900 g (som v1); laddning 0 (AP): 0,6·(kaliber/75)^0,5',
      skala: (d) => { const l = d.laddning_g || 0; if (l <= 0) return 0.6 * Math.sqrt((d.kaliber_mm || 75) / 75); return Math.min(2, Math.max(0.5, Math.cbrt(l / (l < 800 ? 680 : 900)))); },
      parametrar: ['pos', 'laddning_g', 'kaliber_mm', 'underlag: torr|fuktig|vatten'],
      valj: (d) => {
        const kl = (antal, fart) => ({ grupp: 'klump', add: 0, antal, liv: 1.8, fart, kon: 24, gravity: 9.81, drag: 0.2, snurr: 4, storlek: [1.1, 0.8], farg0: fm(MORK, 1), farg1: fm(BRUN, 0.6) });
        const jk = (antal, fart) => ({ grupp: 'jordkast', add: 0, antal, liv: 1.3, fart, kon: 14, gravity: 9.81, drag: 0.5, storlek: [1.6, 2.6], farg0: fm(BRUN, 1), farg1: fm(BRUN, 0) });
        const dm = (antal, s) => ({ grupp: 'markdamm', add: 0, antal: d.underlag === 'fuktig' ? Math.ceil(antal / 2) : antal, liv: 3.5, fart: 3, kon: 80, mark: true, vid_mark: true, spridning_m: 1.5, drag: 1, vind: true, storlek: [s * 0.5, s], farg0: fm(DAMM, 0.75), farg1: fm(DAMM, 0) });
        if (!(d.laddning_g > 0)) return [kl(8, 11), jk(2, 8), dm(3, 5), blixt(1.2, 0.05)];
        // Förb. 8: antalet klumpar, jordkast och damm följer laddningen (samma kubrot som skalan, begränsad 0,6–1,5) [F]. 680 g = som v2b (32), 3000 g = 44 (tak 50).
        const l_ = d.laddning_g, m = Math.min(1.5, Math.max(0.6, Math.cbrt(l_ / (l_ < 800 ? 680 : 900)))), A = (n) => Math.max(1, Math.round(n * m));
        return [blixt(3.5), { grupp: 'eldklot', add: 1, anim: true, antal: 1, liv: 0.22, fart: 0, kon: 0, storlek: [2, 4], farg0: [1.5, 1.3, 1, 1], farg1: [1, 0.5, 0.2, 0] },
          { grupp: 'explosion', add: 0, anim: true, antal: 1, liv: 1.1, fart: 0, kon: 0, storlek: [3, 6.5], farg0: [1.1, 1.1, 1.1, 1], farg1: [1, 1, 1, 0.15] },
          kl(A(14), 16), jk(A(5), 12), dm(A(6), 9),
          { grupp: 'slinga', add: 0, antal: 3, liv: 4, fart: 2, kon: 30, drag: 0.8, lyft: 0.5, vind: true, storlek: [2, 6], farg0: [0.45, 0.4, 0.33, 0.6], farg1: [0.5, 0.48, 0.45, 0] },
          { grupp: 'brannmarke', ligg: true /* F7: liggande quad i markplanet, inte kamerariktad punkt */, add: 0, antal: 1, liv: 30, fart: 0, kon: 0, vid_mark: true, rotvar: 6.283, storlek: [3.2, 3.2], farg0: [0.08, 0.07, 0.06, 0.85], farg1: [0.08, 0.07, 0.06, 0] }];
      } },
    traff_vatten: {
      id: 'traff_mark.generell.v2d (variant underlag vatten)', budget: { max_partiklar: 40 }, skala: (d) => (d.laddning_g > 0 ? Math.min(2, Math.max(0.5, Math.cbrt(d.laddning_g / 680))) : 0.6 * Math.sqrt((d.kaliber_mm || 75) / 75)),
      valj: (d) => [{ grupp: 'droppe', add: 0, antal: 22, liv: 1.5, fart: 13, kon: 14, gravity: 9.81, drag: 0.3, storlek: [0.8, 0.45], farg0: fm(VIT, 0.95), farg1: fm(VIT, 0.3) },
        { grupp: 'markdamm', add: 0, anim: true, antal: 3, liv: 1.6, fart: 5, kon: 10, vid_mark: true, drag: 1, storlek: [3.5, 10], farg0: fm(VIT, 0.9), farg1: fm(VIT, 0) },
        { grupp: 'slinga', add: 0, antal: 2, liv: 3, fart: 1, kon: 60, mark: true, vid_mark: true, drag: 1, vind: true, storlek: [2, 6], farg0: fm(VIT, 0.45), farg1: fm(VIT, 0) }] },
    // Kulor på skjutbanan. Små puffar, inte artillerinedslag. Mark = damm, metall = gnistor, annat = liten träff.
    traff_kula: {
      id: 'traff_kula.skjutbana', handelse: () => 'traff.kula', budget: { max_partiklar: 8, draw_calls: 1 },
      skala: () => 1,
      parametrar: ['yta: mark|metall|annat', 'pos', 'normal', 'riktning', 'kaliber_mm'],
      valj: (d) => {
        if (d.yta === 'mark') return [
          { grupp: 'markdamm', add: 0, antal: 5, liv: 0.42, fart: 1.5, kon: 68, mark: true, vid_mark: true, drag: 2.4, vind: true, in: 0.02, storlek: [0.16, 0.48], farg0: fm(DAMM, 0.85), farg1: fm(DAMM, 0) },
          { grupp: 'klump', add: 0, antal: 3, liv: 0.38, fart: 2.4, kon: 36, gravity: 9.81, drag: 0.5, storlek: [0.045, 0.03], farg0: fm(MORK, 1), farg1: fm(BRUN, 0.2) }
        ];
        if (d.yta === 'metall') return [
          { grupp: 'gnista', add: 1, strak: true, antal: 6, liv: 0.16, fart: 7, kon: 32, gravity: 9.81, drag: 1.1, storlek: [0.11, 0.03], farg0: [2.4, 1.85, 0.95, 1], farg1: [1.2, 0.4, 0.08, 0] },
          { grupp: 'stjarna', add: 1, antal: 1, liv: 0.04, fart: 0, kon: 0, storlek: [0.12, 0.16], farg0: [1.8, 1.5, 1.1, 1], farg1: [1.2, 0.6, 0.2, 0] }
        ];
        return [
          { grupp: 'markdamm', add: 0, antal: 3, liv: 0.28, fart: 1.1, kon: 48, drag: 2.2, storlek: [0.08, 0.22], farg0: fm(DAMM, 0.7), farg1: fm(DAMM, 0) },
          { grupp: 'klump', add: 0, antal: 2, liv: 0.3, fart: 2, kon: 40, gravity: 9.81, drag: 0.6, storlek: [0.04, 0.025], farg0: fm(MORK, 1), farg1: fm(BRUN, 0) }
        ];
      } },
    brand_rok: {
      id: 'brand_rok.generell.v2d', handelse: (d) => d.fas === 'utbrand' ? 'utfall.utslagen' : 'utfall.brand', triggas_av: 'skadeutfall brand / utslagen', fastpunkt: 'motordack (+ lucka för rök i fas tänd)', loop: true, budget: { max_partiklar: 80, draw_calls: 1 },
      skala_formel: 'vagnens fotavtryck: sqrt(L·B / 18,3 m²) begränsad 0,5–1,6 (som v1)', skala: (d, v) => d.skala || (v ? v.skala : 1),
      parametrar: ['vagn', 'fas: tand|brinner|utbrand', 'skala'],
      valj: () => [],
      faser: {
        tand: [{ fast: 'lucka', grupp: 'rok', add: 0, per_s: 4, liv: 5, fart: 1, kon: 15, drag: 0.6, lyft: 1.2, vind: true, storlek: [1, 4], farg0: [0.35, 0.33, 0.3, 0.6], farg1: [0.4, 0.4, 0.4, 0] }],
        brinner: [{ grupp: 'eld', add: 1, anim: true, per_s: 10, liv: 1.0, fart: 1.2, kon: 10, lyft: 0.8, spridning_m: 1.6, storlek: [2.6, 3.4], farg0: [1, 1, 1, 1], farg1: [1, 0.8, 0.6, 0], rotvar: 0.3 },
          { grupp: 'rok', add: 0, per_s: 5, liv: 7, fart: 2, kon: 12, drag: 0.4, lyft: 1.5, vind: true, spridning_m: 1, storlek: [2, 8], farg0: [0.12, 0.11, 0.1, 0.75], farg1: [0.25, 0.25, 0.25, 0] },
          { grupp: 'glod', skarmtak: 'glod', add: 1, per_s: 1, liv: 1, fart: 0, kon: 0, storlek: [4, 4], farg0: [1, 0.5, 0.2, 0.35], farg1: [1, 0.5, 0.2, 0] }],
        utbrand: [{ grupp: 'rok', add: 0, per_s: 1.5, liv: 6, fart: 1, kon: 10, drag: 0.5, lyft: 1, vind: true, storlek: [1, 4], farg0: [0.45, 0.45, 0.45, 0.35], farg1: [0.45, 0.45, 0.45, 0] }],
      } },
  },
};
export default FX_V2;
