# FORM verkstad – data v1

Endast data och kopierade tillgångar. Ingen UI-, spel-, ljud- eller beslutskod ingår. Ingen enhet påstås vara en färdig spelenhet.

## Läsordning
1. Hämta index.json. mappar är det logiska mappträdet och innehåller också tomma kategorier.
2. enheter är den flata söklistan. Hämta fil-fältet först när kortet öppnas.
3. Alla enhetsdata finns en gång under enheter/<id>/enhet.json. Kategorimapparna är logiska vyer, inte dubbla modellkopior.
4. Världens terrain.json listar bara levererade 50- och 10-metersrutor. Övriga ursprungsnivåer och höjdfält ingår inte.

## Enhet
id, namn, nation, typ, kategori, status, utvecklingsniva, saknas, modeller, fastpunkter och spelvarden.
status är klar eller under_utveckling. Nivåer: 1_nastan_klar, 2_halvvags, 3_tidigt_skede. I detta paket är inga enheter klara eller nästan klara: integration och funktion är inte belagd. Registerposter utan fysisk modell listas öppet som tidigt skede. Modeller är inte samma sak som fungerande spelenheter. Tidigare underkännanden skrivs inte om till godkända.

### Värdeobjekt
Varje spelvärde: varde (nummer), enhet och ursprung = kalla | uppskattat | anvandarbestamd. kalla har kallfil och kallfalt (JSON-pointer eller dokumentavsnitt). kallstatus anger källans egen osäkerhet; källa betyder inte nygranskad historisk sanning. uppskattat har motivering och liknande_enhet; startvärdena är provisoriska, inte order eller belagda fakta. Ändring i UI ska få ursprung anvandarbestamd och behålla tidigare värde i ändringshistorik.

Fart anges i km/h. Pansar avser skrovets nominella plåttjocklek i mm, inte vinklad effektiv tjocklek eller tornets bästa skydd. Räckvidd är eldvapnets effektiva referensavstånd i meter, inte fordonets körsträcka. Upptäckbarhet är referensavstånd i meter, större tal = lättare att se på öppen mark. Eldkraft delas i kaliber_mm och eldhastighet_skott_min, aldrig en oförklarad styrkesiffra. Uppskattad eldhastighet för vagnar är uthålligt spelvärde; kulsprutors källvärden kan vara cyklisk eldhastighet och måste modifieras av eldläge.

träffchans_per_avstånd (JSON-nyckel traffchans_per_avstand) har nycklar 100, 250, 500, 1000, 1500, 2000 och andelar 0–1. Historiska provkurvor behåller provvillkor, ammunition och måltyp; de får inte användas oförändrade som träffchans i strid. Generiska kurvor är uttryckligen uppskattningar. Värden utanför praktisk räckvidd måste stridsmotorn bedöma, inte antas vara en garanti.

### Modeller och effekter
Modellfil är relativ till enhet.json. lod är ursprungsnivån eller null (mobilfil utan belagd geometrisk LOD). Namnen och nivåerna har inte skrivits om. roll = modell, besattning eller impostor. sha256, bytes, trianglar, material, animationer och extensioner är lästa ur filen. Trianglar räknas per meshinstans med triangelprimitiver. glTF-måtten är meter, +Y upp; ingen ny visuell skal- eller symbolgranskning har gjorts. Basmodellens granskningsprotokoll gäller, inte detta manifest som godkännande. En modell kan ha äldre inbäddade effektmeshar: dessa ska inte användas, effekter kopplas enbart via det gemensamma biblioteket.

Fastpunkter refererar faktisk nod och modellfil när sådan finns. position_m=null betyder att punkten saknas, inte origo! Mynning/avgas får inte aktiveras innan riktning och transform provkontrollerats. Fastpunkter, effekter och ljud är inte automatiskt kopplade. R15: effekter hör till gemensamt bibliotek; inga effektfiler dupliceras här.

### R62
Hämta aldrig hela katalogens GLB samtidigt. Återanvänd modeller och texturer; välj LOD efter skärmstorlek med mjuk toning. Frustum/occlusion-culling och skuggproxy vid första start måste UI-/motoragenten koppla in. EXT_meshopt_compression kräver MeshoptDecoder; KHR_texture_basisu kräver KTX2/Basis-laddare. Ladda besättningar först nära. Ingen fps-garanti: riktig iPhone ej testad.

## Beteende
beteende/standard.json är en gemensam dataprofil, inte körbar intelligens. Reglage är tydligt märkta förslag. IB-40 och befälskodens språngundantag får inte ersättas av ett moralreglage. Nationsspecifikt underlag för USA och Tyskland hålls åtskilt. Övriga nationer saknar motsvarande regelpaket här.

## Källor och kontroller
kallregister.json kopplar varje modellkopia till originalets SHA256. Referenser under ww2_assets är interna spårbarhetspekare och ska inte hämtas som publika länkar. kontrollrapport.json sammanfattar maskinkontroller; inte en kvalitetsdom. Kartans äldre statusfält är ursprungsmetadata: mobilpaket.status anger att den är en tom höjdterräng, inte spelklar.

Läst: LAS_FORST_RUTINER.md v0.14; GRUNDLAG_KARNA_v1_2.md; RUTIN_SPARA_ANVANDNING_v1_0.md; RUTIN_ARBETA_I_BIBLIOTEKET_v1_1.md; RUTIN_TA_IN_3D_MODELL_v1_3.md; RUTIN_KOMPRIMERING_LOD_v1_6.md; INDIVIDREGELBOK_v1_6_BEFALSKOD.md; BEFALSKOD_AI_REGLER_v1_6.md.
