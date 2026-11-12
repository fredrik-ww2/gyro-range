# Gemensam WW2-katalog – utkast

Publicerad bläddringssida 2026-11-12. Sökvägarna är relativa i biblioteket, inte lokala datorsökvägar. JSON- och CSV-filerna och 3D-modellerna ingår inte i det här paketet.


Uppdaterad 2026-11-10T03:03:38+01:00 (Stockholm). **752 modeller + 1593 materialset.**

Läst: LAS_FORST_RUTINER.md v0.14; GRUNDLAG_KARNA_v1_2.md; RUTIN_SPARA_ANVANDNING_v1_0.md; RUTIN_ARBETA_I_BIBLIOTEKET_v1_1.md; RUTIN_MODELLREGISTER_v1_0.md; RUTIN_TA_IN_3D_MODELL_v1_3.md.

Öppna [sökbar katalog](index.html). Den har sök, filter och sortering. Miniatyrerna ligger i mappen tumnaglar. 3D-modellfilerna ingår inte på den här sidan.

Markslag: [terrängdatabasen](markslag.md) · [markslagslista](markslag.md).

Inga modellfiler flyttade, omdöpta, raderade eller omskrivna. Primärfilernas SHA256 oförändrade: **True**.
## Klarhetsnivåer (teknisk gallring, inte nytt kvalitetsgodkännande)
- **A – Spelbar nu:** laddning via glTF-Transform (meshopt/Draco vid behov) och glTF-validator utan fel; alla använda material har färg-, normal- och metal/roughness-textur; refererade resurser finns; rimlig skala enligt intervallen nedan; LOD1 + LOD2 + billboard/impostor; valda LOD-meshar laddas och valideras också. Befintlig modellbild krävs också. För enheter dessutom dokumenterat äkta, lyssningsgodkänt ljud och godkänd animerad besättning/bärare. Inga enheter ges A i detta utkast: inget komplett godkännande finns i aktuellt underlag. A är inte ett iPhone-prestandagodkännande.
- **B – Spelbar med lite arbete:** modellen laddar och har användbar geometri, men t.ex. LOD, texturkarta, verifierad skala, modellbild eller annan liten kontroll saknas. Enheter får B bara när rörliga delar och animerad besättningskandidat finns; ljud/besättning är fortfarande INTE godkända.
- **C – Långt ifrån klar:** laddfel, validatorfel, orimlig/okänd skala, helt saknade färgtexturer eller väsentliga enhetssystem saknas. För enheter utan godkänd besättning/ljud och utan en nästan färdig besättningskandidat är C normalnivån.
- **D – Bara kub/platshållare:** explicit placeholder/mannequin/kub-namn, eller högst 24 trianglar, högst 24 positioner, ingen färgtextur och få material. Låg triangelnivå ensam gör INTE en färdig vägg eller ett gräsblad till D. Automatiskt D är märkt som misstanke när geometri utlöser det.

**Skalgränser (meter, arbetsantagande):** hus/kyrka höjd 2–65 och största mått 2–120; byggdel höjd 0,01–35 och största mått 0,02–100; träd höjd 0,5–70; buske/småväxt höjd 0,01–15; sten/terräng största mått 0,02–1000; föremål/möbel största mått 0,005–15; stridsvagn/fordon största mått 1–18, höjd 0,5–8; artilleri största mått 0,5–18; handvapen största mått 0,15–3. Avvikelse med faktor över 10 ger C; mindre avvikelse ger B. Bbox är scenens statiska vilopos med nodtransformer, inte animationens hela rörelse. För trasiga huvudfiler används deklarerade accessorgränser; dessa mått/tri är metadata, EJ verifierade mot vertexdata, och nivån förblir C. Enheten meter följer glTF-specifikationen; verklig historisk skala är inte därmed bevisad.

**Materialset:** separat avdelning, inte 3D-modeller i modellantalet. B när färg, normal och roughness finns; annars C. De saknar naturligtvis tri, bbox och LOD. Förhandsbilden visar färgtexturen, inte ett färdigtestat material.

**Bild:** befintlig impostoratlas beskärs till en vy; annars billig geometriöversikt i 128 px JPG (ej textur/PBR-bevis). Vid saknad textur görs en geometribild från oförändrade geometriresurser, men laddfelet och C kvarstår. Om inte ens geometrin går att läsa visas en tydligt märkt reservbild. Bilderna är inte ett påstående om visuell kvalitetsgranskning.

**En rad per modell:** LOD, billboard, mobil/web/iOS, material- och upplösningsvarianter slås ihop; alla exakta sökvägar sparas i JSON. Besättningen listas som egenskap hos sin pjäs, protze som egen modell. Olika skaparversioner av samma historiska vagn är separata resurser. Texturset och tillhörande visningssfärer räknas separat som material, inte extra hus/föremål. Ljud och effekter är länkade resurser, inte 3D-modeller.


## Antal per nivå (modeller)
A: 135 · B: 328 · C: 289 · D: 0

## Antal per typ
- Artilleri/pansarvärn: 13
- Buske: 8
- Byggdel/stadsmiljö: 407
- Fordon: 2
- Föremål: 145
- Handvapen: 3
- Hus: 23
- Kyrka/kyrkdel: 25
- Möbel: 12
- Småväxt/undervegetation: 12
- Sten/klippa: 20
- Stridsvagn: 15
- Terrängdetalj/föremål: 20
- Terrängmodell: 17
- Träd: 25
- Utrustning: 5

## Artilleri/pansarvärn
| Nivå | Svenskt namn (härlett/gissning *) | Land | Mått x/y/z m · MB | Tri | LOD | Animation/ljud | Bild | Sökväg | Kvar |
|---|---|---|---|---|---|---|---|---|---|
| **B** | Flak 36 – tysk 8,8 cm luftvärnskanon * | Tyskland | 5.70 × 2.09 × 5.79 · 0.03 | 1152 | Nej | 11 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/898fafbc68af.jpg) | [assets/asset_niva_1/enheter/artilleri/flak36/flak36_pjas_web.glb](../assets/asset_niva_1/enheter/artilleri/flak36/flak36_pjas_web.glb) | Inte komplett färg/normal/MR på alla material; LOD1 + LOD2 + billboard/impostor inte komplett; Texturerad modellvy inte stickprovad; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd |
| **B** | M1 57 mm – amerikansk pansarvärnskanon * | USA | 2.95 × 1.33 × 4.78 · 0.05 | 1130 | Ja | 12 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/2d05907bf428.jpg) | [assets/asset_niva_1/enheter/artilleri/m1_57/m1_57_pjas_v2_web.glb](../assets/asset_niva_1/enheter/artilleri/m1_57/m1_57_pjas_v2_web.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd |
| **B** | M42 – sovjetisk 45 mm pansarvärnskanon * | Sovjetunionen | 2.80 × 1.25 × 4.86 · 0.04 | 1118 | Ja | 10 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/d244f29135b9.jpg) | [assets/asset_niva_1/enheter/artilleri/m42_45/m42_45_pjas_v2_web.glb](../assets/asset_niva_1/enheter/artilleri/m42_45/m42_45_pjas_v2_web.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd |
| **B** | PaK 38 – tysk 5 cm pansarvärnskanon * | Tyskland | 2.40 × 1.10 × 4.61 · 0.05 | 1338 | Ja | 12 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/013a1dbf32a1.jpg) | [assets/asset_niva_1/enheter/artilleri/pak38/pak38_pjas_v2_web.glb](../assets/asset_niva_1/enheter/artilleri/pak38/pak38_pjas_v2_web.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd |
| **B** | QF 17-pdr – brittisk pansarvärnskanon * | Storbritannien | 3.80 × 1.65 × 7.37 · 0.05 | 1612 | Ja | 10 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/955784838f51.jpg) | [assets/asset_niva_1/enheter/artilleri/qf_17pdr/qf_17pdr_pjas_v2_web.glb](../assets/asset_niva_1/enheter/artilleri/qf_17pdr/qf_17pdr_pjas_v2_web.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd |
| **B** | QF 6-pdr – brittisk pansarvärnskanon * | Storbritannien | 2.95 × 1.33 × 4.98 · 0.05 | 1140 | Ja | 10 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/1fe4164d1a05.jpg) | [assets/asset_niva_1/enheter/artilleri/qf_6pdr/qf_6pdr_pjas_v2_web.glb](../assets/asset_niva_1/enheter/artilleri/qf_6pdr/qf_6pdr_pjas_v2_web.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd |
| **B** | ZiS-3 – sovjetisk 76 mm kanon * | Sovjetunionen | 3.06 × 1.42 × 5.95 · 0.05 | 1134 | Ja | 12 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/97e93a273da0.jpg) | [assets/asset_niva_1/enheter/artilleri/zis3/zis3_pjas_v2_web.glb](../assets/asset_niva_1/enheter/artilleri/zis3/zis3_pjas_v2_web.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd |
| **C** | M1 – amerikansk 155 mm haubits * | USA | 5.06 × 2.13 × 7.13 · 0.18 | 4712 | Ja | 17 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/fa03170668fe.jpg) | [assets/asset_niva_1/enheter/artilleri/m1_155/m1_155_pjas_web.glb](../assets/asset_niva_1/enheter/artilleri/m1_155/m1_155_pjas_web.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd |
| **C** | M2A1 – amerikansk 105 mm haubits * | USA | 4.73 × 1.85 × 5.51 · 0.12 | 3460 | Ja | 16 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/616f5effaa4e.jpg) | [assets/asset_niva_1/enheter/artilleri/m2a1_105/m2a1_105_pjas_web.glb](../assets/asset_niva_1/enheter/artilleri/m2a1_105/m2a1_105_pjas_web.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd |
| **C** | PaK 40 – tysk 7,5 cm pansarvärnskanon * | Tyskland | 3.97 × 1.40 × 6.92 · 0.13 | 2226 | Ja | 15 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/2147c558dac8.jpg) | [assets/asset_niva_1/enheter/artilleri/pak40/pak40_pjas_v5.glb](../assets/asset_niva_1/enheter/artilleri/pak40/pak40_pjas_v5.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd |
| **C** | leFH 18 – tysk 10,5 cm haubits * | Tyskland | 4.70 × 2.12 × 8.16 · 0.14 | 2708 | Ja | 13 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/ac8f0723aebe.jpg) | [assets/asset_niva_1/enheter/artilleri/lefh18/lefh18_pjas_v3.glb](../assets/asset_niva_1/enheter/artilleri/lefh18/lefh18_pjas_v3.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd |
| **C** | sFH 18 – tysk 15 cm haubits * | Tyskland | 5.73 × 2.00 × 11.25 · 0.20 | 4908 | Ja | 17 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/058a6725c37f.jpg) | [assets/asset_niva_1/enheter/artilleri/sfh18/sfh18_pjas_web.glb](../assets/asset_niva_1/enheter/artilleri/sfh18/sfh18_pjas_web.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd |
| **C** | sFH 18 – tysk 15 cm haubits – transportvagn * | Tyskland | 1.80 × 0.95 × 3.43 · 0.03 | 1208 | Ja | 2 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/866337fe2846.jpg) | [assets/asset_niva_1/enheter/artilleri/sfh18/sfh18_protze_web.glb](../assets/asset_niva_1/enheter/artilleri/sfh18/sfh18_protze_web.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd; Väsentlig koppling/animation/besättning återstår |

## Buske
| Nivå | Svenskt namn (härlett/gissning *) | Land | Mått x/y/z m · MB | Tri | LOD | Animation/ljud | Bild | Sökväg | Kvar |
|---|---|---|---|---|---|---|---|---|---|
| **A** | Buske 02 * | Ej relevant | 6.05 × 1.70 × 2.29 · 3.00 | 27254 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/800884d013b6.jpg) | [assets/asset_niva_1/terrang/buskar/shrub_02/shrub_02_v2.glb](../assets/asset_niva_1/terrang/buskar/shrub_02/shrub_02_v2.glb) |  |
| **A** | Potted plant 01 * | Ej relevant | 0.59 × 1.35 × 0.63 · 0.01 | 176226 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/a6bad46c11e2.jpg) | [assets/asset_niva_1/terrang/buskar/potted_plant_01/potted_plant_01_2k.gltf](../assets/asset_niva_1/terrang/buskar/potted_plant_01/potted_plant_01_2k.gltf) |  |
| **A** | Potted plant 02 * | Ej relevant | 0.70 × 0.84 × 0.66 · 0.01 | 69806 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/fad70bbb9473.jpg) | [assets/asset_niva_1/terrang/buskar/potted_plant_02/potted_plant_02_2k.gltf](../assets/asset_niva_1/terrang/buskar/potted_plant_02/potted_plant_02_2k.gltf) |  |
| **A** | Wild rooibos buske * | Ej relevant | 2.28 × 0.54 × 0.84 · 0.02 | 27519 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/4c3abce95028.jpg) | [assets/asset_niva_1/terrang/buskar/wild_rooibos_bush/wild_rooibos_bush_2k_v2.gltf](../assets/asset_niva_1/terrang/buskar/wild_rooibos_bush/wild_rooibos_bush_2k_v2.gltf) |  |
| **B** | Buske1 s601 * | Ej relevant | 3.12 × 3.00 × 3.01 · 7.01 | 13872 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b5ab5fb3c4dc.jpg) | [assets/asset_niva_1/terrang/buskar/ezt_buske1_s601/ezt_buske1_s601.glb](../assets/asset_niva_1/terrang/buskar/ezt_buske1_s601/ezt_buske1_s601.glb) | Inte komplett färg/normal/MR på alla material |
| **B** | Buske2 gron s602 * | Ej relevant | 3.72 × 4.00 × 4.71 · 6.52 | 4760 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b79e0a06cc25.jpg) | [assets/asset_niva_1/terrang/buskar/ezt_buske2_gron_s602/ezt_buske2_gron_s602.glb](../assets/asset_niva_1/terrang/buskar/ezt_buske2_gron_s602/ezt_buske2_gron_s602.glb) | Inte komplett färg/normal/MR på alla material |
| **B** | Buske2 s602 * | Ej relevant | 3.72 × 4.00 × 4.71 · 6.52 | 4760 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e5a7cc5383b1.jpg) | [assets/asset_niva_1/terrang/buskar/ezt_buske2_s602/ezt_buske2_s602.glb](../assets/asset_niva_1/terrang/buskar/ezt_buske2_s602/ezt_buske2_s602.glb) | Inte komplett färg/normal/MR på alla material |
| **B** | Buske3 s603 * | Ej relevant | 3.97 × 2.50 × 3.39 · 7.42 | 16170 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/36ef1e9cd888.jpg) | [assets/asset_niva_1/terrang/buskar/ezt_buske3_s603/ezt_buske3_s603.glb](../assets/asset_niva_1/terrang/buskar/ezt_buske3_s603/ezt_buske3_s603.glb) | Inte komplett färg/normal/MR på alla material |

## Byggdel/stadsmiljö
| Nivå | Svenskt namn (härlett/gissning *) | Land | Mått x/y/z m · MB | Tri | LOD | Animation/ljud | Bild | Sökväg | Kvar |
|---|---|---|---|---|---|---|---|---|---|
| **A** | Modul el stolpar * | Ej relevant | 13.12 × 7.00 × 1.96 · 12.35 | 200610 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3d74d4ab443f.jpg) | [assets/asset_niva_1/terrang/stad/detaljer/modular_electricity_poles.glb](../assets/asset_niva_1/terrang/stad/detaljer/modular_electricity_poles.glb) |  |
| **B** | Barricade fönster * | Ej relevant | 0.12 × 1.60 × 1.48 · 0.02 | 122 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f9cfb6e6141b.jpg) | [assets/asset_niva_1/terrang/stad/fasader/barricade_window.glb](../assets/asset_niva_1/terrang/stad/fasader/barricade_window.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Betong road barrier * | Ej relevant | 1.55 × 0.83 × 0.64 · 1.84 | 60928 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/1a9ef9f6fae0.jpg) | [assets/asset_niva_1/terrang/stad/detaljer/concrete_road_barrier.glb](../assets/asset_niva_1/terrang/stad/detaljer/concrete_road_barrier.glb) | Texturerad modellvy inte stickprovad |
| **B** | Betong road barrier * | Ej relevant | 1.55 × 0.83 × 0.64 · 1.84 | 60928 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/30ae11308f60.jpg) | [assets/asset_niva_1/terrang/stad/vagar/concrete_road_barrier.glb](../assets/asset_niva_1/terrang/stad/vagar/concrete_road_barrier.glb) | Texturerad modellvy inte stickprovad |
| **B** | Bh03 normandie 01 * | Ej relevant | 11.00 × 8.00 × 22.00 · 8.72 | 9566 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/cdea8878745b.jpg) | [assets/asset_niva_1/terrang/stad/gardar/BH03_normandie_01_pbr.glb](../assets/asset_niva_1/terrang/stad/gardar/BH03_normandie_01_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Border pillar * | Ej relevant | 3.00 × 10.29 × 3.00 · 0.02 | 104 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/442bda642482.jpg) | [assets/asset_niva_1/terrang/stad/murar/border_pillar.glb](../assets/asset_niva_1/terrang/stad/murar/border_pillar.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Borne kilometre * | Ej relevant | 0.42 × 0.75 × 0.24 · 12.60 | 80 | Nej | 0 klipp; Ej relevant | ![](tumnaglar/05f83708aafd.jpg) | [assets/asset_niva_1/terrang/stad/detaljer/borne_kilometre.glb](../assets/asset_niva_1/terrang/stad/detaljer/borne_kilometre.glb) | LOD1 + LOD2 + billboard/impostor inte komplett; Texturerad modellvy inte stickprovad |
| **B** | Byggnad farm * | Ej relevant | 40.00 × 16.00 × 46.19 · 0.03 | 186 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/70fe833db786.jpg) | [assets/asset_niva_1/terrang/stad/gardar/building_farm.glb](../assets/asset_niva_1/terrang/stad/gardar/building_farm.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Byggnad watermill * | Ej relevant | 40.00 × 20.77 × 46.19 · 0.06 | 594 | Ja | 1 klipp; Ej relevant | ![](tumnaglar/ddfad0e1c321.jpg) | [assets/asset_niva_1/terrang/stad/gardar/building_watermill.glb](../assets/asset_niva_1/terrang/stad/gardar/building_watermill.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Calvaire sten * | Ej relevant | 1.60 × 3.64 × 1.60 · 21.81 | 72 | Nej | 0 klipp; Ej relevant | ![](tumnaglar/5bc5fc256c30.jpg) | [assets/asset_niva_1/terrang/stad/detaljer/calvaire_sten.glb](../assets/asset_niva_1/terrang/stad/detaljer/calvaire_sten.glb) | LOD1 + LOD2 + billboard/impostor inte komplett; Texturerad modellvy inte stickprovad |
| **B** | Farm lada silo polygoogle * | Ej relevant | 16.12 × 10.04 × 18.00 · 0.06 | 988 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/39c555af294f.jpg) | [assets/asset_niva_1/terrang/stad/gardar/farm_barn_silo_polygoogle.glb](../assets/asset_niva_1/terrang/stad/gardar/farm_barn_silo_polygoogle.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Farm staket a * | Ej relevant | 3.00 × 0.60 × 0.08 · 1.63 | 324 | Nej | 0 klipp; Ej relevant | ![](tumnaglar/36375d3d39b8.jpg) | [assets/asset_niva_1/terrang/stad/trastaket/farm_fence_a_pbr.glb](../assets/asset_niva_1/terrang/stad/trastaket/farm_fence_a_pbr.glb) | LOD1 + LOD2 + billboard/impostor inte komplett; Texturerad modellvy inte stickprovad |
| **B** | Farm staket b * | Ej relevant | 3.00 × 0.56 × 0.08 · 1.62 | 188 | Nej | 0 klipp; Ej relevant | ![](tumnaglar/7c5812d08186.jpg) | [assets/asset_niva_1/terrang/stad/trastaket/farm_fence_b_pbr.glb](../assets/asset_niva_1/terrang/stad/trastaket/farm_fence_b_pbr.glb) | LOD1 + LOD2 + billboard/impostor inte komplett; Texturerad modellvy inte stickprovad |
| **B** | Gata lampa 01 * | Ej relevant | 0.70 × 3.87 × 0.39 · 2.47 | 30610 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b8bb76460d36.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/street_lamp_01/street_lamp_01_v2_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/street_lamp_01/street_lamp_01_v2_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Gata lampa 02 * | Ej relevant | 0.39 × 1.68 × 0.81 · 2.17 | 20338 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/617ced8828bc.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/street_lamp_02/street_lamp_02_v2_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/street_lamp_02/street_lamp_02_v2_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Grave lightpost enkel * | Ej relevant | 0.66 × 4.00 × 1.47 · 0.04 | 352 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/04301eeab2a5.jpg) | [assets/asset_niva_1/terrang/stad/detaljer/grave_lightpost_single.glb](../assets/asset_niva_1/terrang/stad/detaljer/grave_lightpost_single.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Grind regel 01 * | Ej relevant | 0.21 × 0.09 × 0.07 · 2.08 | 5480 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/70f65f4d5b48.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/gate_latch_01/gate_latch_01_v2_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/gate_latch_01/gate_latch_01_v2_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Lada auge korsvirke * | Ej relevant | 21.10 × 8.99 × 9.07 · 14.04 | 11918 | Ja | 6 klipp; Ej relevant | ![](tumnaglar/3cf6dc433e17.jpg) | [assets/asset_niva_1/terrang/stad/gardar/lada_auge_korsvirke_pbr.glb](../assets/asset_niva_1/terrang/stad/gardar/lada_auge_korsvirke_pbr.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Lada bessin sten * | Ej relevant | 27.65 × 9.69 × 9.43 · 12.83 | 9420 | Ja | 6 klipp; Ej relevant | ![](tumnaglar/fa9ab85674e2.jpg) | [assets/asset_niva_1/terrang/stad/gardar/lada_bessin_sten_pbr.glb](../assets/asset_niva_1/terrang/stad/gardar/lada_bessin_sten_pbr.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Lada bocage granit * | Ej relevant | 19.65 × 8.95 × 8.52 · 12.32 | 6044 | Ja | 6 klipp; Ej relevant | ![](tumnaglar/5848f043f133.jpg) | [assets/asset_niva_1/terrang/stad/gardar/lada_bocage_granit_pbr.glb](../assets/asset_niva_1/terrang/stad/gardar/lada_bocage_granit_pbr.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Lada creativetrio * | Ej relevant | 10.11 × 9.00 × 14.27 · 0.26 | 3007 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/4a107d5c183f.jpg) | [assets/asset_niva_1/terrang/stad/gardar/barn_creativetrio.glb](../assets/asset_niva_1/terrang/stad/gardar/barn_creativetrio.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Lada original * | Ej relevant | 9.79 × 11.00 × 14.75 · 2.24 | 21176 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/9eff6236f06d.jpg) | [assets/asset_niva_1/terrang/stad/gardar/barn__original.glb](../assets/asset_niva_1/terrang/stad/gardar/barn__original.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Lada ost halm * | Ej relevant | 15.22 × 5.65 × 8.24 · 12.48 | 4852 | Ja | 6 klipp; Ej relevant | ![](tumnaglar/54401f461451.jpg) | [assets/asset_niva_1/terrang/stad/gardar/lada_ost_halm_pbr.glb](../assets/asset_niva_1/terrang/stad/gardar/lada_ost_halm_pbr.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Lada scene polygoogle * | Ej relevant | 40.00 × 24.81 × 40.00 · 0.47 | 6468 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/ffe65f8feed7.jpg) | [assets/asset_niva_1/terrang/stad/gardar/barn_scene_polygoogle.glb](../assets/asset_niva_1/terrang/stad/gardar/barn_scene_polygoogle.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Lykta 01 * | Ej relevant | 0.12 × 0.29 × 0.10 · 3.01 | 33902 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/4041d88fea6d.jpg) | [assets/asset_niva_1/terrang/stad/detaljer/lantern_01.glb](../assets/asset_niva_1/terrang/stad/detaljer/lantern_01.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul befästning 01 * | Ej relevant | 42.67 × 13.67 × 71.38 · 37.64 | 28218 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/7f52c12dac58.jpg) | [assets/asset_niva_1/terrang/stad/murar/modular_fort_01.glb](../assets/asset_niva_1/terrang/stad/murar/modular_fort_01.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul befästning 01 torn runda * | Ej relevant | 15.84 × 13.50 × 15.84 · 23.22 | 4772 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f5b2de9c121a.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_tower_round/modular_fort_01_tower_round_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_tower_round/modular_fort_01_tower_round_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul befästning 01 vägg gång end 01 * | Ej relevant | 3.12 × 7.53 × 4.85 · 23.05 | 76 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f2e76a5a7ce5.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_walkway_end_01/modular_fort_01_wall_walkway_end_01_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_walkway_end_01/modular_fort_01_wall_walkway_end_01_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul befästning 01 vägg gång hörn 01 * | Ej relevant | 7.68 × 7.53 × 7.68 · 23.05 | 140 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/36293e3b2a71.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_walkway_corner_01/modular_fort_01_wall_walkway_corner_01_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_walkway_corner_01/modular_fort_01_wall_walkway_corner_01_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul befästning 01 vägg gång hörn 02 * | Ej relevant | 2.79 × 7.08 × 2.79 · 23.05 | 94 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e00a4cbd35f2.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_walkway_corner_02/modular_fort_01_wall_walkway_corner_02_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_walkway_corner_02/modular_fort_01_wall_walkway_corner_02_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul befästning 01 vägg gång rak 01 * | Ej relevant | 3.37 × 7.70 × 14.56 · 36.44 | 2654 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/fb71f5e79715.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_walkway_straight_01/modular_fort_01_wall_walkway_straight_01_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_walkway_straight_01/modular_fort_01_wall_walkway_straight_01_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul befästning 01 vägg gång rak 02 * | Ej relevant | 3.12 × 7.53 × 14.56 · 23.05 | 76 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/905fae060b50.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_walkway_straight_02/modular_fort_01_wall_walkway_straight_02_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_walkway_straight_02/modular_fort_01_wall_walkway_straight_02_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul befästning 01 vägg tjock end 01 * | Ej relevant | 4.17 × 7.79 × 4.85 · 23.06 | 442 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/d9951227ded8.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thick_end_01/modular_fort_01_wall_thick_end_01_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thick_end_01/modular_fort_01_wall_thick_end_01_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul befästning 01 vägg tjock end 02 * | Ej relevant | 4.17 × 8.53 × 4.85 · 23.09 | 642 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/91069dbff0c3.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thick_end_02/modular_fort_01_wall_thick_end_02_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thick_end_02/modular_fort_01_wall_thick_end_02_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul befästning 01 vägg tjock hörn 01 * | Ej relevant | 5.84 × 8.53 × 5.84 · 23.08 | 816 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/72dc9adaa654.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thick_corner_01/modular_fort_01_wall_thick_corner_01_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thick_corner_01/modular_fort_01_wall_thick_corner_01_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul befästning 01 vägg tjock hörn 02 * | Ej relevant | 7.07 × 8.53 × 5.72 · 23.08 | 836 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/21b264ebc369.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thick_corner_02/modular_fort_01_wall_thick_corner_02_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thick_corner_02/modular_fort_01_wall_thick_corner_02_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul befästning 01 vägg tjock rak 01 * | Ej relevant | 4.17 × 8.53 × 14.56 · 23.13 | 2340 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/da348cf39179.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thick_straight_01/modular_fort_01_wall_thick_straight_01_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thick_straight_01/modular_fort_01_wall_thick_straight_01_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul befästning 01 vägg tjock rak 02 * | Ej relevant | 4.23 × 8.52 × 14.56 · 23.25 | 5996 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/27aedb8646f5.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thick_straight_02/modular_fort_01_wall_thick_straight_02_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thick_straight_02/modular_fort_01_wall_thick_straight_02_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul befästning 01 vägg tjock tunn transition 01 * | Ej relevant | 4.17 × 8.57 × 3.56 · 23.06 | 434 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/ea8d713489c4.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thick_thin_transition_01/modular_fort_01_wall_thick_thin_transition_01_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thick_thin_transition_01/modular_fort_01_wall_thick_thin_transition_01_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul befästning 01 vägg trappa rak 01 * | Ej relevant | 3.54 × 7.53 × 14.82 · 23.09 | 1196 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/12ce497c4b4f.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_stairs_straight_01/modular_fort_01_wall_stairs_straight_01_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_stairs_straight_01/modular_fort_01_wall_stairs_straight_01_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul befästning 01 vägg tunn grind 01 * | Ej relevant | 2.67 × 8.62 × 7.41 · 23.10 | 1368 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/bc9060a4f4c3.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thin_gate_01/modular_fort_01_wall_thin_gate_01_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thin_gate_01/modular_fort_01_wall_thin_gate_01_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul befästning 01 vägg tunn hörn 01 * | Ej relevant | 4.56 × 8.61 × 4.56 · 23.07 | 654 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f61ef4e8ae62.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thin_corner_01/modular_fort_01_wall_thin_corner_01_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thin_corner_01/modular_fort_01_wall_thin_corner_01_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul befästning 01 vägg tunn hörn 02 * | Ej relevant | 5.34 × 8.61 × 5.34 · 23.08 | 708 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/18c5154b6734.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thin_corner_02/modular_fort_01_wall_thin_corner_02_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thin_corner_02/modular_fort_01_wall_thin_corner_02_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul befästning 01 vägg tunn hörn 03 * | Ej relevant | 6.46 × 8.61 × 4.99 · 23.07 | 494 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/5c92956cf311.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thin_corner_03/modular_fort_01_wall_thin_corner_03_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thin_corner_03/modular_fort_01_wall_thin_corner_03_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul befästning 01 vägg tunn rak 01 * | Ej relevant | 2.55 × 8.61 × 14.82 · 23.09 | 1076 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/787119bb5389.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thin_straight_01/modular_fort_01_wall_thin_straight_01_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thin_straight_01/modular_fort_01_wall_thin_straight_01_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul befästning 01 vägg tunn rak 02 * | Ej relevant | 2.55 × 8.61 × 14.82 · 23.13 | 2376 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/883e18aa83a1.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thin_straight_02/modular_fort_01_wall_thin_straight_02_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thin_straight_02/modular_fort_01_wall_thin_straight_02_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul befästning 01 vägg tunn rak 03 * | Ej relevant | 2.55 × 7.79 × 7.41 · 23.06 | 406 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/559ca1ea0ef5.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thin_straight_03/modular_fort_01_wall_thin_straight_03_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thin_straight_03/modular_fort_01_wall_thin_straight_03_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul befästning 01 vägg tunn rak 04 * | Ej relevant | 2.55 × 8.61 × 7.41 · 23.07 | 622 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/fe2eacfd3352.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thin_straight_04/modular_fort_01_wall_thin_straight_04_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_fort_01_wall_thin_straight_04/modular_fort_01_wall_thin_straight_04_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar fuse 01 * | Ej relevant | 0.44 × 0.40 × 0.35 · 2.81 | 2392 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c109c42a01f1.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_fuse_01/modular_electricity_poles_fuse_01_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_fuse_01/modular_electricity_poles_fuse_01_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar fuse 02 * | Ej relevant | 0.94 × 0.47 × 0.36 · 2.86 | 3660 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f238f39c6489.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_fuse_02/modular_electricity_poles_fuse_02_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_fuse_02/modular_electricity_poles_fuse_02_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar fäste * | Ej relevant | 1.45 × 3.06 × 0.04 · 2.78 | 1802 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/71c3b8dbd5e4.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_fastener/modular_electricity_poles_fastener_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_fastener/modular_electricity_poles_fastener_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar fäste koppling * | Ej relevant | 0.19 × 0.03 × 0.16 · 2.74 | 366 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/ce50c806237a.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_fastener_connection/modular_electricity_poles_fastener_connection_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_fastener_connection/modular_electricity_poles_fastener_connection_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar fäste loop * | Ej relevant | 0.05 × 0.07 × 0.01 · 2.73 | 144 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/653e13066ece.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_fastener_loop/modular_electricity_poles_fastener_loop_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_fastener_loop/modular_electricity_poles_fastener_loop_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar insulators liten * | Ej relevant | 0.47 × 0.36 × 0.34 · 2.88 | 4232 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/9e5daec11162.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_insulators_small/modular_electricity_poles_insulators_small_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_insulators_small/modular_electricity_poles_insulators_small_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar insulators stor * | Ej relevant | 0.97 × 0.36 × 0.34 · 2.96 | 6348 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/a74db4763e95.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_insulators_large/modular_electricity_poles_insulators_large_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_insulators_large/modular_electricity_poles_insulators_large_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar isolator 01 * | Ej relevant | 0.07 × 0.25 × 0.34 · 2.80 | 2116 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/7c2139bc6217.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_insulator_01/modular_electricity_poles_insulator_01_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_insulator_01/modular_electricity_poles_insulator_01_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar isolator 02 * | Ej relevant | 0.08 × 0.29 × 0.34 · 2.80 | 2116 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/8b09bf08925b.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_insulator_02/modular_electricity_poles_insulator_02_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_insulator_02/modular_electricity_poles_insulator_02_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar isolator 03 * | Ej relevant | 0.08 × 0.36 × 0.34 · 2.80 | 2116 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/571f7f430bf2.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_insulator_03/modular_electricity_poles_insulator_03_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_insulator_03/modular_electricity_poles_insulator_03_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar isolator kabel 02 * | Ej relevant | 0.07 × 0.33 × 0.52 · 2.73 | 232 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c07e83c7b683.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_insulator_cable_02/modular_electricity_poles_insulator_cable_02_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_insulator_cable_02/modular_electricity_poles_insulator_cable_02_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar isolator kabel 03 * | Ej relevant | 0.05 × 0.28 × 0.52 · 2.73 | 248 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/0e3410539fcb.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_insulator_cable_03/modular_electricity_poles_insulator_cable_03_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_insulator_cable_03/modular_electricity_poles_insulator_cable_03_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar koppling enkel 01 * | Ej relevant | 0.16 × 0.11 × 0.27 · 2.76 | 954 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/d635335feb10.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_connection_single_01/modular_electricity_poles_connection_single_01_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_connection_single_01/modular_electricity_poles_connection_single_01_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar koppling enkel 02 * | Ej relevant | 0.16 × 0.11 × 0.27 · 2.76 | 954 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/60d82072ab25.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_connection_single_02/modular_electricity_poles_connection_single_02_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_connection_single_02/modular_electricity_poles_connection_single_02_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar koppling enkel 03 * | Ej relevant | 0.08 × 0.13 × 0.12 · 2.77 | 1158 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/9de80c2fbf50.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_connection_single_03/modular_electricity_poles_connection_single_03_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_connection_single_03/modular_electricity_poles_connection_single_03_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar koppling liten 01 * | Ej relevant | 0.70 × 0.50 × 0.85 · 3.11 | 9818 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/1e869e14f7c4.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_connection_small_01/modular_electricity_poles_connection_small_01_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_connection_small_01/modular_electricity_poles_connection_small_01_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar koppling liten 02 * | Ej relevant | 0.70 × 0.50 × 0.52 · 2.94 | 5620 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b5eefadd2bbd.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_connection_small_02/modular_electricity_poles_connection_small_02_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_connection_small_02/modular_electricity_poles_connection_small_02_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar koppling stor 01 * | Ej relevant | 1.20 × 0.50 × 0.85 · 3.24 | 13376 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/db4dc0d546e4.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_connection_large_01/modular_electricity_poles_connection_large_01_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_connection_large_01/modular_electricity_poles_connection_large_01_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar koppling stor 02 * | Ej relevant | 1.20 × 0.50 × 0.52 · 3.02 | 7736 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/165de15c09d8.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_connection_large_02/modular_electricity_poles_connection_large_02_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_connection_large_02/modular_electricity_poles_connection_large_02_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar koppling stor förskjuten 01 * | Ej relevant | 1.20 × 0.50 × 0.85 · 3.26 | 13778 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/4cde5fc9eb7a.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_connection_large_offset_01/modular_electricity_poles_connection_large_offset_01_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_connection_large_offset_01/modular_electricity_poles_connection_large_offset_01_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar koppling stor förskjuten 02 * | Ej relevant | 1.20 × 0.50 × 0.52 · 3.02 | 7736 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/8961620d1801.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_connection_large_offset_02/modular_electricity_poles_connection_large_offset_02_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_connection_large_offset_02/modular_electricity_poles_connection_large_offset_02_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar ring liten * | Ej relevant | 0.15 × 0.02 × 0.15 · 2.73 | 120 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/7202b3abf036.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_ring_small/modular_electricity_poles_ring_small_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_ring_small/modular_electricity_poles_ring_small_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar ring stor * | Ej relevant | 0.15 × 0.04 × 0.15 · 2.73 | 120 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/45a52df35860.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_ring_large/modular_electricity_poles_ring_large_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_ring_large/modular_electricity_poles_ring_large_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar spik * | Ej relevant | 0.02 × 0.02 × 0.02 · 2.73 | 114 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/58705319a6d4.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_nail/modular_electricity_poles_nail_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_nail/modular_electricity_poles_nail_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar spik böjd * | Ej relevant | 0.02 × 0.05 × 0.03 · 2.73 | 198 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/909b53ba6666.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_nail_bent/modular_electricity_poles_nail_bent_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_nail_bent/modular_electricity_poles_nail_bent_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar stolpe * | Ej relevant | 0.14 × 6.00 × 0.14 · 2.35 | 360 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c945241b1afd.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_pole/modular_electricity_poles_pole_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_pole/modular_electricity_poles_pole_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar stolpe liten * | Ej relevant | 0.14 × 5.00 × 0.14 · 2.35 | 288 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/2e916bada7ff.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_pole_small/modular_electricity_poles_pole_small_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_pole_small/modular_electricity_poles_pole_small_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar stolpe stor * | Ej relevant | 0.14 × 7.00 × 0.14 · 2.36 | 400 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/2d83724e8daf.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_pole_large/modular_electricity_poles_pole_large_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_pole_large/modular_electricity_poles_pole_large_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar stöd liten 01 * | Ej relevant | 0.70 × 0.39 × 0.28 · 2.82 | 2042 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c49e5ac4c56e.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_support_small_01/modular_electricity_poles_support_small_01_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_support_small_01/modular_electricity_poles_support_small_01_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar stöd liten 02 * | Ej relevant | 0.70 × 0.39 × 0.24 · 2.78 | 1388 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3ea189c53990.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_support_small_02/modular_electricity_poles_support_small_02_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_support_small_02/modular_electricity_poles_support_small_02_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar stöd stor 01 * | Ej relevant | 1.20 × 0.39 × 0.28 · 2.82 | 2130 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/d5f9fc373c16.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_support_large_01/modular_electricity_poles_support_large_01_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_support_large_01/modular_electricity_poles_support_large_01_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar stöd stor 02 * | Ej relevant | 1.20 × 0.39 × 0.24 · 2.78 | 1388 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c2c7afb797ee.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_support_large_02/modular_electricity_poles_support_large_02_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_support_large_02/modular_electricity_poles_support_large_02_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar stöd stor förskjuten 01 * | Ej relevant | 1.20 × 0.39 × 0.28 · 2.82 | 2130 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/68ab1e0739d4.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_support_large_offset_01/modular_electricity_poles_support_large_offset_01_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_support_large_offset_01/modular_electricity_poles_support_large_offset_01_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar stöd stor förskjuten 02 * | Ej relevant | 1.20 × 0.39 × 0.24 · 2.78 | 1388 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/9b94304aaa23.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_support_large_offset_02/modular_electricity_poles_support_large_offset_02_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_support_large_offset_02/modular_electricity_poles_support_large_offset_02_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar transformator 01 * | Ej relevant | 0.55 × 0.61 × 0.30 · 2.94 | 6076 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f0599aea5641.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_transformer_01/modular_electricity_poles_transformer_01_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_transformer_01/modular_electricity_poles_transformer_01_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul el stolpar transformator 02 * | Ej relevant | 0.18 × 0.30 × 0.22 · 2.76 | 1032 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3c136b7feef1.jpg) | [assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_transformer_02/modular_electricity_poles_transformer_02_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/element/modular_electricity_poles_transformer_02/modular_electricity_poles_transformer_02_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul trä brygga plankor * | Ej relevant | 2.52 × 0.08 × 2.20 · 10.06 | 5512 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/2646b4b62c89.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_wooden_pier_planks/modular_wooden_pier_planks_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_wooden_pier_planks/modular_wooden_pier_planks_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul trä brygga section 01 * | Ej relevant | 2.49 × 4.27 × 3.52 · 21.14 | 23280 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f36b73eeacd6.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_wooden_pier_section_01/modular_wooden_pier_section_01_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_wooden_pier_section_01/modular_wooden_pier_section_01_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul trä brygga section 02 * | Ej relevant | 2.51 × 3.84 × 3.39 · 20.77 | 11758 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f3465bb5bce5.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_wooden_pier_section_02/modular_wooden_pier_section_02_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_wooden_pier_section_02/modular_wooden_pier_section_02_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul trä brygga section 03 * | Ej relevant | 2.51 × 3.84 × 3.39 · 20.85 | 14162 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c82b58a494e7.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_wooden_pier_section_03/modular_wooden_pier_section_03_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_wooden_pier_section_03/modular_wooden_pier_section_03_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul trä brygga section 04 * | Ej relevant | 2.46 × 4.16 × 3.16 · 20.86 | 14598 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3e3afad54d7b.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_wooden_pier_section_04/modular_wooden_pier_section_04_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_wooden_pier_section_04/modular_wooden_pier_section_04_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul trä brygga section 05 * | Ej relevant | 3.10 × 7.00 × 0.46 · 20.77 | 13010 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/5df0641c2f6c.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_wooden_pier_section_05/modular_wooden_pier_section_05_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_wooden_pier_section_05/modular_wooden_pier_section_05_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Modul trä brygga stolpar * | Ej relevant | 2.21 × 3.85 × 3.08 · 10.57 | 2460 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/dbe3b46e8143.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/modular_wooden_pier_poles/modular_wooden_pier_poles_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/modular_wooden_pier_poles/modular_wooden_pier_poles_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Pillar sten * | Ej relevant | 3.00 × 18.75 × 3.00 · 0.02 | 124 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b96d16f3b465.jpg) | [assets/asset_niva_1/terrang/stad/fasader/pillar_stone.glb](../assets/asset_niva_1/terrang/stad/fasader/pillar_stone.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Raserad gårdshus * | Ej relevant | 4.78 × 3.92 × 6.99 · 2.07 | 835 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3f4a66be0139.jpg) | [assets/asset_niva_1/terrang/stad/gardar/ruined_farmhouse_pbr.glb](../assets/asset_niva_1/terrang/stad/gardar/ruined_farmhouse_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Road * | Ej relevant | 6.00 × 0.15 × 6.00 · 0.01 | 12 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/6267fa196dc9.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road.glb](../assets/asset_niva_1/terrang/stad/vagar/road.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Road bend * | Ej relevant | 6.00 × 0.10 × 6.00 · 0.03 | 280 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/4277b7ab1a7f.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_bend.glb](../assets/asset_niva_1/terrang/stad/vagar/road_bend.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Road curb * | Ej relevant | 6.00 × 0.30 × 6.00 · 0.01 | 12 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/6714dbcd0f4a.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_curb.glb](../assets/asset_niva_1/terrang/stad/vagar/road_curb.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Road edge * | Ej relevant | 6.00 × 0.30 × 6.00 · 0.01 | 36 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e7056a425f90.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_edge.glb](../assets/asset_niva_1/terrang/stad/vagar/road_edge.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Road hörn * | Ej relevant | 6.00 × 0.30 × 6.00 · 0.02 | 150 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/1b2949cdccaa.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_corner.glb](../assets/asset_niva_1/terrang/stad/vagar/road_corner.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Road hörn curved * | Ej relevant | 10.00 × 0.50 × 10.00 · 0.03 | 172 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/25a7dd18a599.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_corner_curved.glb](../assets/asset_niva_1/terrang/stad/vagar/road_corner_curved.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Road hörn inner * | Ej relevant | 6.00 × 0.30 × 6.00 · 0.02 | 146 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/eaee12a21a1b.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_corner_inner.glb](../assets/asset_niva_1/terrang/stad/vagar/road_corner_inner.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Road hörn roads kaylousberg * | Ej relevant | 10.00 × 0.50 × 10.00 · 0.03 | 152 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/1dd132ca3333.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_corner__roads_kaylousberg.glb](../assets/asset_niva_1/terrang/stad/vagar/road_corner__roads_kaylousberg.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Road junction * | Ej relevant | 10.00 × 0.50 × 10.00 · 0.03 | 170 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/42d74d307ea8.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_junction.glb](../assets/asset_niva_1/terrang/stad/vagar/road_junction.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Road rak * | Ej relevant | 10.00 × 0.50 × 10.00 · 0.02 | 58 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/2402ed197938.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_straight.glb](../assets/asset_niva_1/terrang/stad/vagar/road_straight.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Road rak crossing * | Ej relevant | 10.00 × 0.50 × 10.00 · 0.03 | 64 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/6fc3004a710b.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_straight_crossing.glb](../assets/asset_niva_1/terrang/stad/vagar/road_straight_crossing.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Road slope * | Ej relevant | 6.00 × 1.35 × 6.00 · 0.01 | 12 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/ffc43d82fec3.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_slope.glb](../assets/asset_niva_1/terrang/stad/vagar/road_slope.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Road tsplit * | Ej relevant | 10.00 × 0.50 × 10.00 · 0.03 | 138 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/0a26350930c9.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_tsplit.glb](../assets/asset_niva_1/terrang/stad/vagar/road_tsplit.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Skorsten * | Ej relevant | 1.87 × 8.82 × 3.00 · 0.01 | 32 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/2e471f6ad40d.jpg) | [assets/asset_niva_1/terrang/stad/hustak/chimney.glb](../assets/asset_niva_1/terrang/stad/hustak/chimney.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Staket broken sten järn * | Ej relevant | 2.91 × 1.60 × 0.36 · 0.05 | 446 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/4a866aff3a0f.jpg) | [assets/asset_niva_1/terrang/stad/murar/fence_broken_stone_iron.glb](../assets/asset_niva_1/terrang/stad/murar/fence_broken_stone_iron.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Staket trä medieval * | Ej relevant | 2.91 × 1.20 × 0.10 · 1.63 | 208 | Nej | 0 klipp; Ej relevant | ![](tumnaglar/31c6b69ad295.jpg) | [assets/asset_niva_1/terrang/stad/trastaket/fence_wood_medieval_pbr.glb](../assets/asset_niva_1/terrang/stad/trastaket/fence_wood_medieval_pbr.glb) | LOD1 + LOD2 + billboard/impostor inte komplett; Texturerad modellvy inte stickprovad |
| **B** | Sten vägg * | Ej relevant | 3.00 × 2.18 × 0.60 · 2.46 | 60 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/ac7e2ea94b33.jpg) | [assets/asset_niva_1/terrang/stad/murar/stone_wall_pbr.glb](../assets/asset_niva_1/terrang/stad/murar/stone_wall_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Sten vägg column * | Ej relevant | 3.00 × 2.55 × 1.05 · 2.46 | 138 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/74104d834fb3.jpg) | [assets/asset_niva_1/terrang/stad/murar/stone_wall_column_pbr.glb](../assets/asset_niva_1/terrang/stad/murar/stone_wall_column_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Sten vägg curve * | Ej relevant | 3.00 × 2.18 × 3.00 · 2.47 | 266 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c0a1bdf1c2c9.jpg) | [assets/asset_niva_1/terrang/stad/murar/stone_wall_curve_pbr.glb](../assets/asset_niva_1/terrang/stad/murar/stone_wall_curve_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Sten vägg damaged * | Ej relevant | 3.00 × 2.18 × 0.60 · 2.46 | 144 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/bffe1541a1a0.jpg) | [assets/asset_niva_1/terrang/stad/murar/stone_wall_damaged_pbr.glb](../assets/asset_niva_1/terrang/stad/murar/stone_wall_damaged_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Stor järn grind * | Ej relevant | 2.95 × 2.93 × 0.10 · 3.13 | 38140 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/9134dadf8c76.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/large_iron_gate/large_iron_gate_v2_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/large_iron_gate/large_iron_gate_v2_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Stor slott dörr * | Ej relevant | 2.01 × 2.96 × 0.30 · 3.27 | 12640 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/0049f4a3e1ee.jpg) | [assets/asset_niva_1/bebyggelse/byggdelar/large_castle_door/large_castle_door_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/byggdelar/large_castle_door/large_castle_door_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Survival signpost * | Ej relevant | 0.93 × 2.00 × 0.19 · 0.02 | 44 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/effc0751bf28.jpg) | [assets/asset_niva_1/terrang/stad/skyltar/survival_signpost.glb](../assets/asset_niva_1/terrang/stad/skyltar/survival_signpost.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Survival signpost enkel * | Ej relevant | 0.91 × 2.00 × 0.19 · 0.01 | 28 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/ccd09ce2d696.jpg) | [assets/asset_niva_1/terrang/stad/skyltar/survival_signpost_single.glb](../assets/asset_niva_1/terrang/stad/skyltar/survival_signpost_single.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Tak * | Ej relevant | 3.00 × 1.82 × 2.81 · 0.02 | 64 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3cb2edcdd8d2.jpg) | [assets/asset_niva_1/terrang/stad/hustak/roof.glb](../assets/asset_niva_1/terrang/stad/hustak/roof.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Tak gavel * | Ej relevant | 3.00 × 1.56 × 2.92 · 0.02 | 72 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/a6bbdc5a4883.jpg) | [assets/asset_niva_1/terrang/stad/hustak/roof_gable.glb](../assets/asset_niva_1/terrang/stad/hustak/roof_gable.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Tak gavel end * | Ej relevant | 3.00 × 1.58 × 2.96 · 0.02 | 50 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/06ba15886f89.jpg) | [assets/asset_niva_1/terrang/stad/hustak/roof_gable_end.glb](../assets/asset_niva_1/terrang/stad/hustak/roof_gable_end.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Tak gavel top * | Ej relevant | 3.00 × 1.13 × 3.00 · 0.02 | 56 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3650de6795c0.jpg) | [assets/asset_niva_1/terrang/stad/hustak/roof_gable_top.glb](../assets/asset_niva_1/terrang/stad/hustak/roof_gable_top.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Tak high * | Ej relevant | 3.00 × 3.30 × 2.80 · 0.02 | 64 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/d3abaeaa3a15.jpg) | [assets/asset_niva_1/terrang/stad/hustak/roof_high.glb](../assets/asset_niva_1/terrang/stad/hustak/roof_high.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Tak high gavel * | Ej relevant | 2.91 × 3.06 × 3.00 · 0.02 | 72 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/67b9ee0e35cb.jpg) | [assets/asset_niva_1/terrang/stad/hustak/roof_high_gable.glb](../assets/asset_niva_1/terrang/stad/hustak/roof_high_gable.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Tak high gavel end * | Ej relevant | 2.96 × 3.06 × 3.00 · 0.02 | 52 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f74558103a4b.jpg) | [assets/asset_niva_1/terrang/stad/hustak/roof_high_gable_end.glb](../assets/asset_niva_1/terrang/stad/hustak/roof_high_gable_end.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Tak hörn * | Ej relevant | 3.00 × 1.82 × 3.00 · 0.02 | 36 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/876e7202d7ad.jpg) | [assets/asset_niva_1/terrang/stad/hustak/roof_corner.glb](../assets/asset_niva_1/terrang/stad/hustak/roof_corner.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Tak panna section * | Ej relevant | 2.00 × 0.25 × 2.00 · 1.21 | 13760 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/0393ac047d2b.jpg) | [assets/asset_niva_1/terrang/stad/hustak/roof-tile-section.glb](../assets/asset_niva_1/terrang/stad/hustak/roof-tile-section.glb) | Texturerad modellvy inte stickprovad |
| **B** | Tak point * | Ej relevant | 3.00 × 1.36 × 3.00 · 0.02 | 44 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b360826689b9.jpg) | [assets/asset_niva_1/terrang/stad/hustak/roof_point.glb](../assets/asset_niva_1/terrang/stad/hustak/roof_point.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Takutsprång * | Ej relevant | 0.85 × 0.99 × 3.00 · 0.02 | 68 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/9c7b14dac902.jpg) | [assets/asset_niva_1/terrang/stad/fasader/overhang.glb](../assets/asset_niva_1/terrang/stad/fasader/overhang.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Tegel vägg curve * | Ej relevant | 3.00 × 2.18 × 3.00 · 0.04 | 348 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/fcb8b6310e40.jpg) | [assets/asset_niva_1/terrang/stad/murar/brick_wall_curve.glb](../assets/asset_niva_1/terrang/stad/murar/brick_wall_curve.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Tegel vägg curve * | Ej relevant | 3.00 × 2.18 × 3.00 · 0.04 | 348 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/8a360bcd3413.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/brick_wall_curve.glb](../assets/asset_niva_1/terrang/stad/vaggar/brick_wall_curve.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Tegel vägg end * | Ej relevant | 3.00 × 2.55 × 1.35 · 0.03 | 316 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/900c1e50d754.jpg) | [assets/asset_niva_1/terrang/stad/murar/brick_wall_end.glb](../assets/asset_niva_1/terrang/stad/murar/brick_wall_end.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Tegel vägg end * | Ej relevant | 3.00 × 2.55 × 1.35 · 0.03 | 316 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/096ad31d0746.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/brick_wall_end.glb](../assets/asset_niva_1/terrang/stad/vaggar/brick_wall_end.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Town cart * | Ej relevant | 2.67 × 1.60 × 4.00 · 0.05 | 608 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/87f2836cd9f6.jpg) | [assets/asset_niva_1/terrang/stad/detaljer/town_cart.glb](../assets/asset_niva_1/terrang/stad/detaljer/town_cart.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Town fountain runda * | Ej relevant | 14.29 × 2.00 × 14.29 · 0.07 | 1002 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c3609c541ef3.jpg) | [assets/asset_niva_1/terrang/stad/detaljer/town_fountain_round.glb](../assets/asset_niva_1/terrang/stad/detaljer/town_fountain_round.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Town lykta * | Ej relevant | 0.36 × 2.60 × 0.37 · 0.02 | 158 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f5cea59d2b5e.jpg) | [assets/asset_niva_1/terrang/stad/detaljer/town_lantern.glb](../assets/asset_niva_1/terrang/stad/detaljer/town_lantern.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Town stall * | Ej relevant | 4.62 × 2.60 × 7.11 · 0.02 | 106 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f34b4d486994.jpg) | [assets/asset_niva_1/terrang/stad/detaljer/town_stall.glb](../assets/asset_niva_1/terrang/stad/detaljer/town_stall.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Town watermill * | Ej relevant | 3.78 × 8.00 × 8.00 · 0.05 | 600 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/4df1ec9a0ad4.jpg) | [assets/asset_niva_1/terrang/stad/gardar/town_watermill.glb](../assets/asset_niva_1/terrang/stad/gardar/town_watermill.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Town windmill * | Ej relevant | 2.12 × 14.00 × 14.00 · 0.06 | 732 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/0da34ced956a.jpg) | [assets/asset_niva_1/terrang/stad/gardar/town_windmill.glb](../assets/asset_niva_1/terrang/stad/gardar/town_windmill.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Trappa sten * | Ej relevant | 3.00 × 2.94 × 1.47 · 0.02 | 136 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c42e8699c10e.jpg) | [assets/asset_niva_1/terrang/stad/fasader/stairs_stone.glb](../assets/asset_niva_1/terrang/stad/fasader/stairs_stone.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Trä barrels 01 * | Ej relevant | 4.44 × 0.96 × 3.34 · 4.37 | 33142 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/4ffde283eade.jpg) | [assets/asset_niva_1/terrang/stad/detaljer/wooden_barrels_01.glb](../assets/asset_niva_1/terrang/stad/detaljer/wooden_barrels_01.glb) | Texturerad modellvy inte stickprovad |
| **B** | Tunna 01 * | Ej relevant | 0.56 × 0.88 × 0.56 · 1.20 | 2682 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/be19a206e285.jpg) | [assets/asset_niva_1/terrang/stad/detaljer/barrel_01.glb](../assets/asset_niva_1/terrang/stad/detaljer/barrel_01.glb) | Texturerad modellvy inte stickprovad |
| **B** | Tunna 03 * | Ej relevant | 0.63 × 0.93 × 0.64 · 1.17 | 1473 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f44df359195b.jpg) | [assets/asset_niva_1/terrang/stad/detaljer/barrel_03.glb](../assets/asset_niva_1/terrang/stad/detaljer/barrel_03.glb) | Texturerad modellvy inte stickprovad |
| **B** | Village market square quaternius * | Ej relevant | 40.00 × 19.93 × 32.82 · 1.26 | 28818 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/1c5d50dfd4ca.jpg) | [assets/asset_niva_1/terrang/stad/torg/village_market_square_quaternius.glb](../assets/asset_niva_1/terrang/stad/torg/village_market_square_quaternius.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Vägg * | Ej relevant | 0.30 × 3.00 × 3.00 · 0.01 | 32 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/023077f9c836.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Vägg archround overgrown broken * | Ej relevant | 5.99 × 5.98 × 0.47 · 0.24 | 1826 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/74982fadf39a.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall_archround_overgrown_broken.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall_archround_overgrown_broken.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Vägg broken * | Ej relevant | 0.35 × 3.00 × 3.00 · 0.02 | 166 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/8456b14c160e.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall_broken.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall_broken.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Vägg dörr * | Ej relevant | 0.30 × 3.00 × 3.00 · 0.03 | 376 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/5dfde617ab9f.jpg) | [assets/asset_niva_1/terrang/stad/fasader/wall_door.glb](../assets/asset_niva_1/terrang/stad/fasader/wall_door.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Vägg dörr * | Ej relevant | 0.30 × 3.00 × 3.00 · 0.03 | 376 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/be4ea02f80d8.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall_door.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall_door.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Vägg fönster glas * | Ej relevant | 0.30 × 3.00 × 3.00 · 0.02 | 178 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/386cc32022d9.jpg) | [assets/asset_niva_1/terrang/stad/fasader/wall_window_glass.glb](../assets/asset_niva_1/terrang/stad/fasader/wall_window_glass.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Vägg fönster glas * | Ej relevant | 0.30 × 3.00 × 3.00 · 0.02 | 178 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/591f09fccdb2.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall_window_glass.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall_window_glass.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Vägg fönster liten * | Ej relevant | 0.30 × 3.00 × 3.00 · 0.02 | 102 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c5558d97395c.jpg) | [assets/asset_niva_1/terrang/stad/fasader/wall_window_small.glb](../assets/asset_niva_1/terrang/stad/fasader/wall_window_small.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Vägg fönster liten * | Ej relevant | 0.30 × 3.00 × 3.00 · 0.02 | 102 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/fc334edc7167.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall_window_small.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall_window_small.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Vägg fönster shutters * | Ej relevant | 0.53 × 3.00 × 3.00 · 0.03 | 286 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3d8365ad4de9.jpg) | [assets/asset_niva_1/terrang/stad/fasader/wall_window_shutters.glb](../assets/asset_niva_1/terrang/stad/fasader/wall_window_shutters.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Vägg fönster shutters * | Ej relevant | 0.53 × 3.00 × 3.00 · 0.03 | 286 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/9dca3ecbf8d0.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall_window_shutters.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall_window_shutters.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Vägg half * | Ej relevant | 0.30 × 1.50 × 3.00 · 0.01 | 32 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f5fa4e0b042c.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall_half.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall_half.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Vägg hörn * | Ej relevant | 3.00 × 3.00 × 3.00 · 0.02 | 52 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b4018ac03ac4.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall_corner.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall_corner.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Vägg overgrown * | Ej relevant | 2.99 × 2.98 × 0.46 · 0.19 | 1370 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/686f98acb7a4.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall_overgrown.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall_overgrown.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Vägg trä * | Ej relevant | 0.30 × 3.00 × 3.00 · 0.01 | 32 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/33b223babd30.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall_wood.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall_wood.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Vägg trä broken * | Ej relevant | 0.34 × 3.00 × 3.00 · 0.02 | 166 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/1041cd00b95e.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall_wood_broken.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall_wood_broken.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Vägg trä dörr * | Ej relevant | 0.30 × 3.00 × 3.00 · 0.03 | 376 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/852fb58f7aee.jpg) | [assets/asset_niva_1/terrang/stad/fasader/wall_wood_door.glb](../assets/asset_niva_1/terrang/stad/fasader/wall_wood_door.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Vägg trä dörr * | Ej relevant | 0.30 × 3.00 × 3.00 · 0.03 | 376 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/d815a924ea75.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall_wood_door.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall_wood_door.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Vägg trä fönster liten * | Ej relevant | 0.60 × 3.00 × 3.00 · 0.02 | 134 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e6a1682dc714.jpg) | [assets/asset_niva_1/terrang/stad/fasader/wall_wood_window_small.glb](../assets/asset_niva_1/terrang/stad/fasader/wall_wood_window_small.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Vägg trä fönster liten * | Ej relevant | 0.60 × 3.00 × 3.00 · 0.02 | 134 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/6188862ed178.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall_wood_window_small.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall_wood_window_small.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Vägg trä fönster shutters * | Ej relevant | 0.30 × 3.00 × 3.00 · 0.02 | 122 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/61c5944f4f61.jpg) | [assets/asset_niva_1/terrang/stad/fasader/wall_wood_window_shutters.glb](../assets/asset_niva_1/terrang/stad/fasader/wall_wood_window_shutters.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Vägg trä fönster shutters * | Ej relevant | 0.30 × 3.00 × 3.00 · 0.02 | 122 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/4b25d8477a95.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall_wood_window_shutters.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall_wood_window_shutters.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Vägg trä hörn * | Ej relevant | 3.00 × 3.00 × 3.00 · 0.02 | 52 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f5515cd1dd35.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall_wood_corner.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall_wood_corner.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Windmill * | Ej relevant | 16.16 × 24.08 × 17.70 · 1.48 | 17420 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/cd7688d1224a.jpg) | [assets/asset_niva_1/terrang/stad/gardar/windmill.glb](../assets/asset_niva_1/terrang/stad/gardar/windmill.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Wine tunna 01 * | Ej relevant | 0.74 × 0.87 × 0.76 · 1.59 | 10820 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f12adef31ac1.jpg) | [assets/asset_niva_1/terrang/stad/detaljer/wine_barrel_01.glb](../assets/asset_niva_1/terrang/stad/detaljer/wine_barrel_01.glb) | Texturerad modellvy inte stickprovad |
| **C** | Betong road barrier 02 * | Ej relevant | 1.57 × 1.11 × 0.44 † · 0.00 | 23822 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e100f9196bf0.jpg) | [assets/asset_niva_1/terrang/stad/detaljer/concrete_road_barrier_02_1k.gltf](../assets/asset_niva_1/terrang/stad/detaljer/concrete_road_barrier_02_1k.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/detaljer/concrete_road_barrier_02.bin' |
| **C** | Betong road barrier 02 * | Ej relevant | 1.57 × 1.11 × 0.44 † · 0.00 | 23822 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/35050d59785f.jpg) | [assets/asset_niva_1/terrang/stad/vagar/concrete_road_barrier_02_1k.gltf](../assets/asset_niva_1/terrang/stad/vagar/concrete_road_barrier_02_1k.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vagar/concrete_road_barrier_02.bin' |
| **C** | Big lada * | Ej relevant | 9.80 × 10.00 × 10.43 · 0.19 | 4220 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/44d85de312d5.jpg) | [assets/asset_niva_1/terrang/stad/gardar/big_barn.glb](../assets/asset_niva_1/terrang/stad/gardar/big_barn.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Bänk * | Ej relevant | 3.22 × 0.90 × 1.08 · 0.02 | 276 | Nej | 0 klipp; Ej relevant | ![](tumnaglar/96622f1fba09.jpg) | [assets/asset_niva_1/terrang/stad/detaljer/bench.glb](../assets/asset_niva_1/terrang/stad/detaljer/bench.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; LOD1 + LOD2 + billboard/impostor inte komplett; Texturerad modellvy inte stickprovad |
| **C** | Chicken coop * | Ej relevant | 3.90 × 3.00 × 3.49 · 0.05 | 948 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/426c0176de60.jpg) | [assets/asset_niva_1/terrang/stad/gardar/chicken_coop.glb](../assets/asset_niva_1/terrang/stad/gardar/chicken_coop.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Dörr 1 platt * | Ej relevant | 1.12 × 2.10 × 0.12 † · 0.00 | 314 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/6a8b71f699bd.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Door_1_Flat.gltf](../assets/asset_niva_1/terrang/stad/fasader/Door_1_Flat.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Door_1_Flat.bin' |
| **C** | Dörr 1 runda * | Ej relevant | 1.12 × 2.32 × 0.12 † · 0.00 | 470 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/22f22ea59576.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Door_1_Round.gltf](../assets/asset_niva_1/terrang/stad/fasader/Door_1_Round.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Door_1_Round.bin' |
| **C** | Dörr 2 platt * | Ej relevant | 1.11 × 2.10 × 0.26 † · 0.00 | 6032 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/1b3c9723ba2b.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Door_2_Flat.gltf](../assets/asset_niva_1/terrang/stad/fasader/Door_2_Flat.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Door_2_Flat.bin' |
| **C** | Dörr 2 runda * | Ej relevant | 1.12 × 2.33 × 0.26 † · 0.00 | 6188 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/eb59ee9dca2e.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Door_2_Round.gltf](../assets/asset_niva_1/terrang/stad/fasader/Door_2_Round.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Door_2_Round.bin' |
| **C** | Dörr 4 platt * | Ej relevant | 1.12 × 2.09 × 0.21 † · 0.00 | 1044 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/501d9659c189.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Door_4_Flat.gltf](../assets/asset_niva_1/terrang/stad/fasader/Door_4_Flat.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Door_4_Flat.bin' |
| **C** | Dörr 4 runda * | Ej relevant | 1.11 × 2.32 × 0.21 † · 0.00 | 1228 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/9a189430fe9c.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Door_4_Round.gltf](../assets/asset_niva_1/terrang/stad/fasader/Door_4_Round.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Door_4_Round.bin' |
| **C** | Dörr 8 platt * | Ej relevant | 1.12 × 2.10 × 0.20 † · 0.00 | 986 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/d5076dc53486.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Door_8_Flat.gltf](../assets/asset_niva_1/terrang/stad/fasader/Door_8_Flat.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Door_8_Flat.bin' |
| **C** | Dörr 8 runda * | Ej relevant | 1.15 × 2.32 × 0.20 † · 0.00 | 1142 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/1e587163ad01.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Door_8_Round.gltf](../assets/asset_niva_1/terrang/stad/fasader/Door_8_Round.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Door_8_Round.bin' |
| **C** | Dörrkarm platt tegel * | Ej relevant | 1.57 × 2.38 × 0.49 † · 0.00 | 1880 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/fcffaf61bc81.jpg) | [assets/asset_niva_1/terrang/stad/fasader/DoorFrame_Flat_Brick.gltf](../assets/asset_niva_1/terrang/stad/fasader/DoorFrame_Flat_Brick.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/DoorFrame_Flat_Brick.bin' |
| **C** | Dörrkarm platt tegel * | Ej relevant | 1.57 × 2.38 × 0.49 † · 0.00 | 1880 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/a59718af638c.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/DoorFrame_Flat_Brick.gltf](../assets/asset_niva_1/terrang/stad/vaggar/DoorFrame_Flat_Brick.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/DoorFrame_Flat_Brick.bin' |
| **C** | Dörrkarm platt wooddark * | Ej relevant | 1.57 × 2.31 × 0.39 † · 0.00 | 56 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/7ac838e6cddb.jpg) | [assets/asset_niva_1/terrang/stad/fasader/DoorFrame_Flat_WoodDark.gltf](../assets/asset_niva_1/terrang/stad/fasader/DoorFrame_Flat_WoodDark.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/DoorFrame_Flat_WoodDark.bin' |
| **C** | Dörrkarm runda tegel * | Ej relevant | 1.60 × 2.59 × 0.48 † · 0.00 | 2046 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/21935536c89d.jpg) | [assets/asset_niva_1/terrang/stad/fasader/DoorFrame_Round_Brick.gltf](../assets/asset_niva_1/terrang/stad/fasader/DoorFrame_Round_Brick.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/DoorFrame_Round_Brick.bin' |
| **C** | Dörrkarm runda tegel * | Ej relevant | 1.60 × 2.59 × 0.48 † · 0.00 | 2046 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/9307982458b8.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/DoorFrame_Round_Brick.gltf](../assets/asset_niva_1/terrang/stad/vaggar/DoorFrame_Round_Brick.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/DoorFrame_Round_Brick.bin' |
| **C** | Dörrkarm runda wooddark * | Ej relevant | 1.41 × 2.56 × 0.54 † · 0.00 | 320 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/4c631b20903c.jpg) | [assets/asset_niva_1/terrang/stad/fasader/DoorFrame_Round_WoodDark.gltf](../assets/asset_niva_1/terrang/stad/fasader/DoorFrame_Round_WoodDark.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/DoorFrame_Round_WoodDark.bin' |
| **C** | Farm rts * | Ej relevant | 6.24 × 6.00 × 6.46 · 0.23 | 4162 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/0c943328b6bf.jpg) | [assets/asset_niva_1/terrang/stad/gardar/farm_rts.glb](../assets/asset_niva_1/terrang/stad/gardar/farm_rts.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Farm rts b * | Ej relevant | 8.40 × 6.00 × 6.62 · 0.14 | 2552 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/a76da19ce14b.jpg) | [assets/asset_niva_1/terrang/stad/gardar/farm_rts_b.glb](../assets/asset_niva_1/terrang/stad/gardar/farm_rts_b.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Farm rts c * | Ej relevant | 48.59 × 6.00 × 39.11 · 0.12 | 6376 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/9bc6ce104866.jpg) | [assets/asset_niva_1/terrang/stad/gardar/farm_rts_c.glb](../assets/asset_niva_1/terrang/stad/gardar/farm_rts_c.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Farm runda polygoogle * | Ej relevant | 40.00 × 10.22 × 40.00 · 0.14 | 2860 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/0ea94cb7d6a8.jpg) | [assets/asset_niva_1/terrang/stad/gardar/farm_round_polygoogle.glb](../assets/asset_niva_1/terrang/stad/gardar/farm_round_polygoogle.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Farm yard polygoogle * | Ej relevant | 40.00 × 14.59 × 36.76 · 0.21 | 5016 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c202caca5790.jpg) | [assets/asset_niva_1/terrang/stad/gardar/farm_yard_polygoogle.glb](../assets/asset_niva_1/terrang/stad/gardar/farm_yard_polygoogle.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Fönster bars * | Ej relevant | 2.99 × 2.98 × 0.45 · 0.08 | 1220 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/ceca2be9f4f7.jpg) | [assets/asset_niva_1/terrang/stad/fasader/window_bars.glb](../assets/asset_niva_1/terrang/stad/fasader/window_bars.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Fönster bred flat1 * | Ej relevant | 1.61 × 1.58 × 0.68 † · 0.00 | 160 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/78e2b790b11b.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Window_Wide_Flat1.gltf](../assets/asset_niva_1/terrang/stad/fasader/Window_Wide_Flat1.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Window_Wide_Flat1.bin' |
| **C** | Fönster bred round1 * | Ej relevant | 1.36 × 1.73 × 0.53 † · 0.00 | 354 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f4436b5d132b.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Window_Wide_Round1.gltf](../assets/asset_niva_1/terrang/stad/fasader/Window_Wide_Round1.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Window_Wide_Round1.bin' |
| **C** | Fönster open * | Ej relevant | 2.99 × 2.98 × 0.45 · 0.07 | 1146 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/2d1468af1fb6.jpg) | [assets/asset_niva_1/terrang/stad/fasader/window_open.glb](../assets/asset_niva_1/terrang/stad/fasader/window_open.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Fönster open double * | Ej relevant | 2.99 × 5.98 × 0.46 · 0.13 | 1948 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/88c8f468fc77.jpg) | [assets/asset_niva_1/terrang/stad/fasader/window_open_double.glb](../assets/asset_niva_1/terrang/stad/fasader/window_open_double.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Fönster tak bred * | Ej relevant | 1.42 × 1.18 × 1.18 † · 0.00 | 66 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/bbb01a3f4f5c.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Window_Roof_Wide.gltf](../assets/asset_niva_1/terrang/stad/fasader/Window_Roof_Wide.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Window_Roof_Wide.bin' |
| **C** | Fönster tak bred * | Ej relevant | 1.42 × 1.18 × 1.18 † · 0.00 | 66 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/6794fdde3af3.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Window_Roof_Wide.gltf](../assets/asset_niva_1/terrang/stad/hustak/Window_Roof_Wide.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Window_Roof_Wide.bin' |
| **C** | Fönster tak tunn * | Ej relevant | 0.85 × 1.18 × 1.18 † · 0.00 | 46 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/640ae45d94e9.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Window_Roof_Thin.gltf](../assets/asset_niva_1/terrang/stad/fasader/Window_Roof_Thin.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Window_Roof_Thin.bin' |
| **C** | Fönster tak tunn * | Ej relevant | 0.85 × 1.18 × 1.18 † · 0.00 | 46 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/7a3b94155f7d.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Window_Roof_Thin.gltf](../assets/asset_niva_1/terrang/stad/hustak/Window_Roof_Thin.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Window_Roof_Thin.bin' |
| **C** | Fönster tunn flat1 * | Ej relevant | 0.79 × 1.56 × 0.44 † · 0.00 | 112 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/9e495dd0907b.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Window_Thin_Flat1.gltf](../assets/asset_niva_1/terrang/stad/fasader/Window_Thin_Flat1.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Window_Thin_Flat1.bin' |
| **C** | Fönster tunn round1 * | Ej relevant | 0.89 × 1.60 × 0.34 † · 0.00 | 418 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f4d0b1f39d82.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Window_Thin_Round1.gltf](../assets/asset_niva_1/terrang/stad/fasader/Window_Thin_Round1.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Window_Thin_Round1.bin' |
| **C** | Förråd hut * | Ej relevant | 7.41 × 4.00 × 7.70 · 0.21 | 4088 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/54286e237c89.jpg) | [assets/asset_niva_1/terrang/stad/gardar/storage_hut.glb](../assets/asset_niva_1/terrang/stad/gardar/storage_hut.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Förråd shed * | Ej relevant | 7.41 × 4.00 × 7.70 · 0.27 | 5236 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/ae80e630d38b.jpg) | [assets/asset_niva_1/terrang/stad/gardar/storage_shed.glb](../assets/asset_niva_1/terrang/stad/gardar/storage_shed.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Förråd shed b * | Ej relevant | 9.42 × 4.00 × 8.49 · 0.38 | 7488 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c18af906ca79.jpg) | [assets/asset_niva_1/terrang/stad/gardar/storage_shed_b.glb](../assets/asset_niva_1/terrang/stad/gardar/storage_shed_b.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Förråd shed c * | Ej relevant | 13.74 × 4.00 × 11.00 · 0.53 | 8160 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/29b9de12f2e2.jpg) | [assets/asset_niva_1/terrang/stad/gardar/storage_shed_c.glb](../assets/asset_niva_1/terrang/stad/gardar/storage_shed_c.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Golv ojämnt tegel * | Ej relevant | 2.00 × 0.02 × 2.00 † · 0.00 | 4 | Nej | 0 klipp; Ej relevant | ![](tumnaglar/c4e9bdcd5505.jpg) | [assets/asset_niva_1/terrang/stad/torg/Floor_UnevenBrick.gltf](../assets/asset_niva_1/terrang/stad/torg/Floor_UnevenBrick.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/torg/Floor_UnevenBrick.bin' |
| **C** | Golv redbrick * | Ej relevant | 2.00 × 0.02 × 2.00 † · 0.00 | 4 | Nej | 0 klipp; Ej relevant | ![](tumnaglar/fd6a5167dc74.jpg) | [assets/asset_niva_1/terrang/stad/torg/Floor_RedBrick.gltf](../assets/asset_niva_1/terrang/stad/torg/Floor_RedBrick.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/torg/Floor_RedBrick.bin' |
| **C** | Golv tegel * | Ej relevant | 2.00 × 0.02 × 2.00 † · 0.00 | 4 | Nej | 0 klipp; Ej relevant | ![](tumnaglar/67255012a60c.jpg) | [assets/asset_niva_1/terrang/stad/torg/Floor_Brick.gltf](../assets/asset_niva_1/terrang/stad/torg/Floor_Brick.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/torg/Floor_Brick.bin' |
| **C** | Golv wooddark overhangcorner * | Ej relevant | 1.00 × 0.02 × 1.76 † · 0.00 | 16 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/4297266849b5.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Floor_WoodDark_OverhangCorner.gltf](../assets/asset_niva_1/terrang/stad/fasader/Floor_WoodDark_OverhangCorner.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Floor_WoodDark_OverhangCorner.bin' |
| **C** | Golv wooddark overhangcorner2 * | Ej relevant | 0.96 × 0.02 × 1.75 † · 0.00 | 26 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/21c548d13f25.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Floor_WoodDark_OverhangCorner2.gltf](../assets/asset_niva_1/terrang/stad/fasader/Floor_WoodDark_OverhangCorner2.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Floor_WoodDark_OverhangCorner2.bin' |
| **C** | Golv woodlight overhangcorner * | Ej relevant | 1.00 × 0.02 × 1.76 † · 0.00 | 16 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/90d53b813eec.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Floor_WoodLight_OverhangCorner.gltf](../assets/asset_niva_1/terrang/stad/fasader/Floor_WoodLight_OverhangCorner.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Floor_WoodLight_OverhangCorner.bin' |
| **C** | Golv woodlight overhangcorner2 * | Ej relevant | 0.96 × 0.02 × 1.75 † · 0.00 | 26 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/5e769abfc659.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Floor_WoodLight_OverhangCorner2.gltf](../assets/asset_niva_1/terrang/stad/fasader/Floor_WoodLight_OverhangCorner2.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Floor_WoodLight_OverhangCorner2.bin' |
| **C** | Hörn exterior tegel * | Ej relevant | 0.53 × 3.02 × 0.58 † · 0.00 | 3102 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/7cd929df0f79.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Corner_Exterior_Brick.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Corner_Exterior_Brick.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Corner_Exterior_Brick.bin' |
| **C** | Hörn exteriorwide tegel * | Ej relevant | 0.71 × 3.04 × 0.76 † · 0.00 | 2882 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/fe40aebfb6fc.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Corner_ExteriorWide_Brick.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Corner_ExteriorWide_Brick.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Corner_ExteriorWide_Brick.bin' |
| **C** | Lada * | Ej relevant | 11.57 × 9.00 × 12.32 · 0.13 | 2910 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/5872c276e0fe.jpg) | [assets/asset_niva_1/terrang/stad/gardar/barn.glb](../assets/asset_niva_1/terrang/stad/gardar/barn.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Lada auge korsvirke * | Ej relevant | 21.10 × 8.99 × 9.07 · 0.94 | 11918 | Ja | 6 klipp; Ej relevant | ![](tumnaglar/61d4392a0d63.jpg) | [assets/asset_niva_1/terrang/stad/fasader/lada_auge_korsvirke.glb](../assets/asset_niva_1/terrang/stad/fasader/lada_auge_korsvirke.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Liten farm rts * | Ej relevant | 8.47 × 5.00 × 5.18 · 0.13 | 2232 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3be3834e5b11.jpg) | [assets/asset_niva_1/terrang/stad/gardar/small_farm_rts.glb](../assets/asset_niva_1/terrang/stad/gardar/small_farm_rts.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Liten lada * | Ej relevant | 7.35 × 6.00 × 7.59 · 0.10 | 2176 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/9c6d08ccbe8b.jpg) | [assets/asset_niva_1/terrang/stad/gardar/small_barn.glb](../assets/asset_niva_1/terrang/stad/gardar/small_barn.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Masonry rubble chunk c4da0b * | Ej relevant | 0.57 × 0.59 × 0.26 · 0.04 | 394 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/403994acb0d9.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/masonry-rubble-chunk-c4da0b.glb](../assets/asset_niva_1/terrang/stad/vaggar/masonry-rubble-chunk-c4da0b.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Open lada * | Ej relevant | 8.48 × 7.00 × 9.12 · 0.07 | 1612 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/4d3a34573fe6.jpg) | [assets/asset_niva_1/terrang/stad/gardar/open_barn.glb](../assets/asset_niva_1/terrang/stad/gardar/open_barn.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Prop brick1 * | Ej relevant | 0.35 × 0.21 × 0.25 † · 0.00 | 108 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3a699c55aeaa.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Prop_Brick1.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Prop_Brick1.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Prop_Brick1.bin' |
| **C** | Prop brick2 * | Ej relevant | 0.40 × 0.24 × 0.22 † · 0.00 | 94 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/58e7f9ecdd9b.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Prop_Brick2.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Prop_Brick2.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Prop_Brick2.bin' |
| **C** | Prop brick3 * | Ej relevant | 0.38 × 0.25 × 0.22 † · 0.00 | 126 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/76b3deaa7ed2.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Prop_Brick3.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Prop_Brick3.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Prop_Brick3.bin' |
| **C** | Prop brick4 * | Ej relevant | 0.26 × 0.25 × 0.22 † · 0.00 | 126 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e8adf5c935ed.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Prop_Brick4.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Prop_Brick4.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Prop_Brick4.bin' |
| **C** | Prop chimney2 * | Ej relevant | 0.95 × 3.00 × 0.99 † · 0.00 | 130 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/7393adcaad83.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Prop_Chimney2.gltf](../assets/asset_niva_1/terrang/stad/hustak/Prop_Chimney2.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Prop_Chimney2.bin' |
| **C** | Prop skorsten * | Ej relevant | 0.95 × 3.18 × 1.00 † · 0.00 | 618 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/fd610064ac3b.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Prop_Chimney.gltf](../assets/asset_niva_1/terrang/stad/hustak/Prop_Chimney.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Prop_Chimney.bin' |
| **C** | Road bend 2 * | Ej relevant | 10.00 × 0.80 × 10.00 · 0.02 | 388 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c53b1af28661.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_bend_2.glb](../assets/asset_niva_1/terrang/stad/vagar/road_bend_2.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Road bend roads kenney * | Ej relevant | 10.00 × 0.80 × 10.00 · 0.02 | 388 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b67ad7bb3259.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_bend__roads_kenney.glb](../assets/asset_niva_1/terrang/stad/vagar/road_bend__roads_kenney.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Road bridge * | Ej relevant | 10.00 × 5.20 × 10.00 · 0.02 | 312 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/d7a20311daf9.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_bridge.glb](../assets/asset_niva_1/terrang/stad/vagar/road_bridge.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Road crossing * | Ej relevant | 10.00 × 0.20 × 10.00 · 0.01 | 104 | Nej | 0 klipp; Ej relevant | ![](tumnaglar/0f704197b5a7.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_crossing.glb](../assets/asset_niva_1/terrang/stad/vagar/road_crossing.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; LOD1 + LOD2 + billboard/impostor inte komplett; Texturerad modellvy inte stickprovad |
| **C** | Road crossroad * | Ej relevant | 10.00 × 0.80 × 10.00 · 0.02 | 228 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/bd0dbfb157cb.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_crossroad.glb](../assets/asset_niva_1/terrang/stad/vagar/road_crossroad.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Road crossroad stig * | Ej relevant | 10.00 × 0.20 × 10.00 · 0.02 | 276 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/67d84f223b52.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_crossroad_path.glb](../assets/asset_niva_1/terrang/stad/vagar/road_crossroad_path.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Road curve * | Ej relevant | 20.00 × 0.80 × 20.00 · 0.03 | 508 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c9538147f9ad.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_curve.glb](../assets/asset_niva_1/terrang/stad/vagar/road_curve.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Road end * | Ej relevant | 10.00 × 0.80 × 10.00 · 0.01 | 72 | Nej | 0 klipp; Ej relevant | ![](tumnaglar/f2c370664c93.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_end.glb](../assets/asset_niva_1/terrang/stad/vagar/road_end.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; LOD1 + LOD2 + billboard/impostor inte komplett; Texturerad modellvy inte stickprovad |
| **C** | Road end runda * | Ej relevant | 10.00 × 0.80 × 10.00 · 0.02 | 366 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/85649adeaf8b.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_end_round.glb](../assets/asset_niva_1/terrang/stad/vagar/road_end_round.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Road intersection * | Ej relevant | 10.00 × 0.80 × 10.00 · 0.01 | 152 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e18e426c5edf.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_intersection.glb](../assets/asset_niva_1/terrang/stad/vagar/road_intersection.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Road rak barrier * | Ej relevant | 10.00 × 0.80 × 10.00 · 0.01 | 68 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c1746c54bbbf.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_straight_barrier.glb](../assets/asset_niva_1/terrang/stad/vagar/road_straight_barrier.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Road scene hills polygoogle * | Ej relevant | 40.00 × 9.08 × 31.72 · 0.21 | 2230 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/8aa35fb41eaa.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_scene_hills_polygoogle.glb](../assets/asset_niva_1/terrang/stad/vagar/road_scene_hills_polygoogle.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Road sida * | Ej relevant | 10.00 × 1.00 × 13.10 · 0.01 | 68 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/1aa47a093529.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_side.glb](../assets/asset_niva_1/terrang/stad/vagar/road_side.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Road slant * | Ej relevant | 10.00 × 3.30 × 10.00 · 0.01 | 68 | Nej | 0 klipp; Ej relevant | ![](tumnaglar/2cc7eb082438.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_slant.glb](../assets/asset_niva_1/terrang/stad/vagar/road_slant.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; LOD1 + LOD2 + billboard/impostor inte komplett; Texturerad modellvy inte stickprovad |
| **C** | Road square * | Ej relevant | 10.00 × 0.80 × 10.00 · 0.01 | 68 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c102742466ff.jpg) | [assets/asset_niva_1/terrang/stad/torg/road_square.glb](../assets/asset_niva_1/terrang/stad/torg/road_square.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Road square * | Ej relevant | 10.00 × 0.80 × 10.00 · 0.01 | 68 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/1cb5762a8c41.jpg) | [assets/asset_niva_1/terrang/stad/vagar/road_square.glb](../assets/asset_niva_1/terrang/stad/vagar/road_square.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Shack * | Ej relevant | 7.62 × 4.00 × 6.11 · 0.06 | 1048 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/35475423469d.jpg) | [assets/asset_niva_1/terrang/stad/gardar/shack.glb](../assets/asset_niva_1/terrang/stad/gardar/shack.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Shack b * | Ej relevant | 4.74 × 4.00 × 6.11 · 0.04 | 804 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/264c866f7666.jpg) | [assets/asset_niva_1/terrang/stad/gardar/shack_b.glb](../assets/asset_niva_1/terrang/stad/gardar/shack_b.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Silo * | Ej relevant | 4.85 × 12.00 × 4.64 · 0.07 | 1592 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/6895b9c78345.jpg) | [assets/asset_niva_1/terrang/stad/gardar/silo.glb](../assets/asset_niva_1/terrang/stad/gardar/silo.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Silo hus * | Ej relevant | 7.07 × 12.00 × 4.65 · 0.13 | 2880 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b1828c4ec6f4.jpg) | [assets/asset_niva_1/terrang/stad/gardar/silo_house.glb](../assets/asset_niva_1/terrang/stad/gardar/silo_house.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Sten vägg rts * | Ej relevant | 6.00 × 1.71 × 0.95 · 0.02 | 216 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/72261ace6513.jpg) | [assets/asset_niva_1/terrang/stad/murar/stone_wall_rts.glb](../assets/asset_niva_1/terrang/stad/murar/stone_wall_rts.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Tak 2x4 roundtile * | Ej relevant | 3.29 × 2.67 × 4.23 † · 0.00 | 1112 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/1441bff5d1e8.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_2x4_RoundTile.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_2x4_RoundTile.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_2x4_RoundTile.bin' |
| **C** | Tak dormer roundtile * | Ej relevant | 1.97 × 2.67 × 2.44 † · 0.01 | 904 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/5956d80f2d16.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_Dormer_RoundTile.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_Dormer_RoundTile.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_Dormer_RoundTile.bin' |
| **C** | Tak fram brick2 * | Ej relevant | 2.61 × 1.77 × 0.75 † · 0.00 | 78 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/a762d0199724.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick2.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick2.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick2.bin' |
| **C** | Tak fram brick2 * | Ej relevant | 2.61 × 1.77 × 0.75 † · 0.00 | 78 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e75d1c2eb72d.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick2.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick2.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick2.bin' |
| **C** | Tak fram brick4 * | Ej relevant | 4.40 × 3.07 × 1.13 † · 0.00 | 252 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/6f93dd7c1f8c.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick4.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick4.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick4.bin' |
| **C** | Tak fram brick4 * | Ej relevant | 4.40 × 3.07 × 1.13 † · 0.00 | 252 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c98ec313cadd.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick4.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick4.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick4.bin' |
| **C** | Tak fram brick4 half l * | Ej relevant | 2.41 × 3.20 × 0.49 † · 0.00 | 140 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b708ec64dcb0.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick4_Half_L.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick4_Half_L.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick4_Half_L.bin' |
| **C** | Tak fram brick4 half l * | Ej relevant | 2.41 × 3.20 × 0.49 † · 0.00 | 140 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/fe9aa2805d39.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick4_Half_L.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick4_Half_L.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick4_Half_L.bin' |
| **C** | Tak fram brick4 half r * | Ej relevant | 2.42 × 3.20 × 0.49 † · 0.00 | 146 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/ff70b9d0daad.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick4_Half_R.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick4_Half_R.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick4_Half_R.bin' |
| **C** | Tak fram brick4 half r * | Ej relevant | 2.42 × 3.20 × 0.49 † · 0.00 | 146 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/75074bcd7968.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick4_Half_R.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick4_Half_R.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick4_Half_R.bin' |
| **C** | Tak fram brick6 * | Ej relevant | 6.69 × 4.52 × 1.13 † · 0.00 | 328 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/13e31fdd30c0.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick6.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick6.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick6.bin' |
| **C** | Tak fram brick6 * | Ej relevant | 6.69 × 4.52 × 1.13 † · 0.00 | 328 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/95974913ba98.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick6.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick6.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick6.bin' |
| **C** | Tak fram brick6 half l * | Ej relevant | 3.41 × 4.52 × 0.49 † · 0.00 | 186 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/33d201061604.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick6_Half_L.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick6_Half_L.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick6_Half_L.bin' |
| **C** | Tak fram brick6 half l * | Ej relevant | 3.41 × 4.52 × 0.49 † · 0.00 | 186 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/bc921df68fa3.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick6_Half_L.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick6_Half_L.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick6_Half_L.bin' |
| **C** | Tak fram brick6 half r * | Ej relevant | 3.40 × 4.52 × 0.49 † · 0.00 | 186 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e7984487450d.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick6_Half_R.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick6_Half_R.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick6_Half_R.bin' |
| **C** | Tak fram brick6 half r * | Ej relevant | 3.40 × 4.52 × 0.49 † · 0.00 | 186 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/0f859252c312.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick6_Half_R.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick6_Half_R.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick6_Half_R.bin' |
| **C** | Tak fram brick8 * | Ej relevant | 8.51 × 5.45 × 1.13 † · 0.00 | 364 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/0e645e7a1d5c.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick8.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick8.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick8.bin' |
| **C** | Tak fram brick8 * | Ej relevant | 8.51 × 5.45 × 1.13 † · 0.00 | 364 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/98961ffdf5f0.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick8.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick8.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick8.bin' |
| **C** | Tak fram brick8 half l * | Ej relevant | 4.33 × 5.45 × 0.49 † · 0.00 | 204 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e2e4bd3e0080.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick8_Half_L.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick8_Half_L.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick8_Half_L.bin' |
| **C** | Tak fram brick8 half l * | Ej relevant | 4.33 × 5.45 × 0.49 † · 0.00 | 204 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/0320c68a85a3.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick8_Half_L.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick8_Half_L.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick8_Half_L.bin' |
| **C** | Tak fram brick8 half r * | Ej relevant | 4.35 × 5.45 × 0.49 † · 0.00 | 204 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e578d0f9e89c.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick8_Half_R.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick8_Half_R.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_Front_Brick8_Half_R.bin' |
| **C** | Tak fram brick8 half r * | Ej relevant | 4.35 × 5.45 × 0.49 † · 0.00 | 204 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/8af49b3ad102.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick8_Half_R.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick8_Half_R.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Roof_Front_Brick8_Half_R.bin' |
| **C** | Tak frontsupports * | Ej relevant | 5.49 × 0.23 × 0.65 † · 0.00 | 60 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/d000a7c93174.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_FrontSupports.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_FrontSupports.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_FrontSupports.bin' |
| **C** | Tak log * | Ej relevant | 1.15 × 1.39 × 10.70 † · 0.00 | 164 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/cb751773f560.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_Log.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_Log.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_Log.bin' |
| **C** | Tak modul runda takpannor * | Ej relevant | 0.66 × 0.51 × 2.25 † · 0.00 | 136 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/9dfab3ccbff5.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_Modular_RoundTiles.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_Modular_RoundTiles.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_Modular_RoundTiles.bin' |
| **C** | Tak roundtile 2x1 * | Ej relevant | 3.30 × 2.66 × 1.95 † · 0.00 | 612 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/9d877447a05c.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTile_2x1.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTile_2x1.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTile_2x1.bin' |
| **C** | Tak roundtile 2x1 lång * | Ej relevant | 4.35 × 3.33 × 1.95 † · 0.00 | 628 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/a21b06cbca7d.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTile_2x1_Long.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTile_2x1_Long.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTile_2x1_Long.bin' |
| **C** | Tak runda takpannor 4x4 * | Ej relevant | 5.51 × 4.25 × 5.56 † · 0.00 | 1996 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/63f4525c568d.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_4x4.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_4x4.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_4x4.bin' |
| **C** | Tak runda takpannor 4x6 * | Ej relevant | 5.51 × 4.23 × 7.57 † · 0.00 | 2520 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/0c21e24db7cd.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_4x6.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_4x6.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_4x6.bin' |
| **C** | Tak runda takpannor 4x8 * | Ej relevant | 5.51 × 4.23 × 9.68 † · 0.00 | 3116 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/ac105b6d0260.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_4x8.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_4x8.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_4x8.bin' |
| **C** | Tak runda takpannor 6x10 * | Ej relevant | 8.25 × 5.67 × 11.85 † · 0.00 | 4300 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e60afce87a4b.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_6x10.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_6x10.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_6x10.bin' |
| **C** | Tak runda takpannor 6x12 * | Ej relevant | 8.25 × 5.67 × 13.66 † · 0.00 | 4752 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/daef82d1d733.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_6x12.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_6x12.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_6x12.bin' |
| **C** | Tak runda takpannor 6x14 * | Ej relevant | 8.25 × 5.67 × 15.71 † · 0.00 | 5372 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/413c4e4197ed.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_6x14.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_6x14.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_6x14.bin' |
| **C** | Tak runda takpannor 6x4 * | Ej relevant | 8.25 × 5.67 × 4.99 † · 0.00 | 2192 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/75c165bf5a9b.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_6x4.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_6x4.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_6x4.bin' |
| **C** | Tak runda takpannor 6x6 * | Ej relevant | 8.25 × 5.67 × 8.03 † · 0.00 | 3244 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e25e0c11e6a6.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_6x6.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_6x6.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_6x6.bin' |
| **C** | Tak runda takpannor 6x8 * | Ej relevant | 8.25 × 5.67 × 9.68 † · 0.00 | 3796 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/48701aafa8ef.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_6x8.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_6x8.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_6x8.bin' |
| **C** | Tak runda takpannor 8x10 * | Ej relevant | 9.95 × 6.78 × 11.86 † · 0.00 | 4480 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f2a733b0a830.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_8x10.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_8x10.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_8x10.bin' |
| **C** | Tak runda takpannor 8x12 * | Ej relevant | 9.95 × 6.78 × 14.13 † · 0.00 | 6356 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/649ce40ae955.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_8x12.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_8x12.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_8x12.bin' |
| **C** | Tak runda takpannor 8x14 * | Ej relevant | 9.95 × 6.78 × 15.71 † · 0.00 | 5484 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e263688549fd.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_8x14.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_8x14.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_8x14.bin' |
| **C** | Tak runda takpannor 8x8 * | Ej relevant | 9.95 × 6.78 × 10.33 † · 0.00 | 3888 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/4c820c18b7e9.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_8x8.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_8x8.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_RoundTiles_8x8.bin' |
| **C** | Tak support2 * | Ej relevant | 0.20 × 0.74 × 0.77 † · 0.00 | 84 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/bf3b4673830a.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_Support2.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_Support2.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_Support2.bin' |
| **C** | Tak torn runda takpannor * | Ej relevant | 5.65 × 7.36 × 5.43 † · 0.01 | 4024 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c287c8eef3c1.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_Tower_RoundTiles.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_Tower_RoundTiles.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_Tower_RoundTiles.bin' |
| **C** | Tak trä 2x1 * | Ej relevant | 2.26 × 1.25 × 1.56 † · 0.00 | 224 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/5ba5d9433a83.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_Wooden_2x1.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_Wooden_2x1.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_Wooden_2x1.bin' |
| **C** | Tak trä 2x1 center * | Ej relevant | 2.00 × 1.21 × 1.50 † · 0.00 | 52 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/52347bc20b61.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_Wooden_2x1_Center.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_Wooden_2x1_Center.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_Wooden_2x1_Center.bin' |
| **C** | Tak trä 2x1 center spegel * | Ej relevant | 2.00 × 1.21 × 1.50 † · 0.00 | 52 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/021f85b0b910.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_Wooden_2x1_Center_Mirror.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_Wooden_2x1_Center_Mirror.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_Wooden_2x1_Center_Mirror.bin' |
| **C** | Tak trä 2x1 hörn * | Ej relevant | 1.54 × 1.18 × 1.56 † · 0.00 | 82 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c717e2ad6ed3.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_Wooden_2x1_Corner.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_Wooden_2x1_Corner.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_Wooden_2x1_Corner.bin' |
| **C** | Tak trä 2x1 l * | Ej relevant | 2.13 × 1.25 × 1.56 † · 0.00 | 158 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f6b6580a659a.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_Wooden_2x1_L.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_Wooden_2x1_L.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_Wooden_2x1_L.bin' |
| **C** | Tak trä 2x1 middle * | Ej relevant | 2.00 × 0.14 × 2.00 † · 0.00 | 24 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f49ed8c1b325.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_Wooden_2x1_Middle.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_Wooden_2x1_Middle.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_Wooden_2x1_Middle.bin' |
| **C** | Tak trä 2x1 r * | Ej relevant | 2.13 × 1.25 × 1.56 † · 0.00 | 158 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/939698f68988.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Roof_Wooden_2x1_R.gltf](../assets/asset_niva_1/terrang/stad/hustak/Roof_Wooden_2x1_R.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Roof_Wooden_2x1_R.bin' |
| **C** | Takutsprång ojämnt tegel hörn * | Ej relevant | 3.10 × 3.12 × 3.10 † · 0.01 | 420 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/afaac7936c7b.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Overhang_UnevenBrick_Corner.gltf](../assets/asset_niva_1/terrang/stad/fasader/Overhang_UnevenBrick_Corner.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Overhang_UnevenBrick_Corner.bin' |
| **C** | Takutsprång ojämnt tegel hörn * | Ej relevant | 3.10 × 3.12 × 3.10 † · 0.01 | 420 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/ff58ec9d91a8.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Overhang_UnevenBrick_Corner.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Overhang_UnevenBrick_Corner.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Overhang_UnevenBrick_Corner.bin' |
| **C** | Takutsprång ojämnt tegel hörn fram * | Ej relevant | 3.12 × 3.12 × 3.12 † · 0.01 | 60 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/87090fbf5165.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Overhang_UnevenBrick_Corner_Front.gltf](../assets/asset_niva_1/terrang/stad/fasader/Overhang_UnevenBrick_Corner_Front.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Overhang_UnevenBrick_Corner_Front.bin' |
| **C** | Takutsprång ojämnt tegel hörn fram * | Ej relevant | 3.12 × 3.12 × 3.12 † · 0.01 | 60 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/a216516d749c.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Overhang_UnevenBrick_Corner_Front.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Overhang_UnevenBrick_Corner_Front.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Overhang_UnevenBrick_Corner_Front.bin' |
| **C** | Takutsprång ojämnt tegel kort * | Ej relevant | 2.00 × 3.12 × 1.32 † · 0.01 | 214 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f69d8c1b00cf.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Overhang_UnevenBrick_Short.gltf](../assets/asset_niva_1/terrang/stad/fasader/Overhang_UnevenBrick_Short.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Overhang_UnevenBrick_Short.bin' |
| **C** | Takutsprång ojämnt tegel kort * | Ej relevant | 2.00 × 3.12 × 1.32 † · 0.01 | 214 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/36d62f90a92c.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Overhang_UnevenBrick_Short.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Overhang_UnevenBrick_Short.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Overhang_UnevenBrick_Short.bin' |
| **C** | Takutsprång ojämnt tegel lång * | Ej relevant | 2.00 × 3.03 × 2.20 † · 0.01 | 196 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/281f39a6cb88.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Overhang_UnevenBrick_Long.gltf](../assets/asset_niva_1/terrang/stad/fasader/Overhang_UnevenBrick_Long.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Overhang_UnevenBrick_Long.bin' |
| **C** | Takutsprång ojämnt tegel lång * | Ej relevant | 2.00 × 3.03 × 2.20 † · 0.01 | 196 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/65b40035731b.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Overhang_UnevenBrick_Long.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Overhang_UnevenBrick_Long.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Overhang_UnevenBrick_Long.bin' |
| **C** | Takutsprång puts hörn * | Ej relevant | 3.10 × 3.12 × 3.10 † · 0.00 | 440 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/ee70cf6bbc13.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Overhang_Plaster_Corner.gltf](../assets/asset_niva_1/terrang/stad/fasader/Overhang_Plaster_Corner.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Overhang_Plaster_Corner.bin' |
| **C** | Takutsprång puts hörn * | Ej relevant | 3.10 × 3.12 × 3.10 † · 0.00 | 440 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e657e4783364.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Overhang_Plaster_Corner.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Overhang_Plaster_Corner.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Overhang_Plaster_Corner.bin' |
| **C** | Takutsprång puts hörn fram * | Ej relevant | 3.12 × 3.14 × 3.12 † · 0.00 | 142 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/240a679a205b.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Overhang_Plaster_Corner_Front.gltf](../assets/asset_niva_1/terrang/stad/fasader/Overhang_Plaster_Corner_Front.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Overhang_Plaster_Corner_Front.bin' |
| **C** | Takutsprång puts hörn fram * | Ej relevant | 3.12 × 3.14 × 3.12 † · 0.00 | 142 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/8ea8a1e1714b.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Overhang_Plaster_Corner_Front.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Overhang_Plaster_Corner_Front.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Overhang_Plaster_Corner_Front.bin' |
| **C** | Takutsprång puts kort * | Ej relevant | 2.00 × 3.12 × 1.32 † · 0.00 | 222 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/1a3ed51d0b42.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Overhang_Plaster_Short.gltf](../assets/asset_niva_1/terrang/stad/fasader/Overhang_Plaster_Short.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Overhang_Plaster_Short.bin' |
| **C** | Takutsprång puts kort * | Ej relevant | 2.00 × 3.12 × 1.32 † · 0.00 | 222 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/7a0ca3f0fc97.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Overhang_Plaster_Short.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Overhang_Plaster_Short.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Overhang_Plaster_Short.bin' |
| **C** | Takutsprång puts lång * | Ej relevant | 2.00 × 3.03 × 2.20 † · 0.00 | 204 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/30bd89db2494.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Overhang_Plaster_Long.gltf](../assets/asset_niva_1/terrang/stad/fasader/Overhang_Plaster_Long.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Overhang_Plaster_Long.bin' |
| **C** | Takutsprång puts lång * | Ej relevant | 2.00 × 3.03 × 2.20 † · 0.00 | 204 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/60b33058548e.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Overhang_Plaster_Long.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Overhang_Plaster_Long.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Overhang_Plaster_Long.bin' |
| **C** | Takutsprång roofincline puts * | Ej relevant | 2.00 × 0.27 × 1.43 † · 0.00 | 36 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/49386d8d21b1.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Overhang_RoofIncline_Plaster.gltf](../assets/asset_niva_1/terrang/stad/fasader/Overhang_RoofIncline_Plaster.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Overhang_RoofIncline_Plaster.bin' |
| **C** | Takutsprång roofincline puts * | Ej relevant | 2.00 × 0.27 × 1.43 † · 0.00 | 36 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/4529013caaca.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Overhang_RoofIncline_Plaster.gltf](../assets/asset_niva_1/terrang/stad/hustak/Overhang_RoofIncline_Plaster.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Overhang_RoofIncline_Plaster.bin' |
| **C** | Takutsprång roofincline puts * | Ej relevant | 2.00 × 0.27 × 1.43 † · 0.00 | 36 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/18b4b5528cf2.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Overhang_RoofIncline_Plaster.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Overhang_RoofIncline_Plaster.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Overhang_RoofIncline_Plaster.bin' |
| **C** | Takutsprång roofincline unevenbricks * | Ej relevant | 2.00 × 0.27 × 1.43 † · 0.00 | 36 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/a5f6a47e6aa0.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Overhang_RoofIncline_UnevenBricks.gltf](../assets/asset_niva_1/terrang/stad/fasader/Overhang_RoofIncline_UnevenBricks.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Overhang_RoofIncline_UnevenBricks.bin' |
| **C** | Takutsprång roofincline unevenbricks * | Ej relevant | 2.00 × 0.27 × 1.43 † · 0.00 | 36 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/ac86cd9e2622.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Overhang_RoofIncline_UnevenBricks.gltf](../assets/asset_niva_1/terrang/stad/hustak/Overhang_RoofIncline_UnevenBricks.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Overhang_RoofIncline_UnevenBricks.bin' |
| **C** | Takutsprång roofincline unevenbricks * | Ej relevant | 2.00 × 0.27 × 1.43 † · 0.00 | 36 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/cbce70f4f59e.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Overhang_RoofIncline_UnevenBricks.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Overhang_RoofIncline_UnevenBricks.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Overhang_RoofIncline_UnevenBricks.bin' |
| **C** | Takutsprång sida ojämnt tegel kort l * | Ej relevant | 0.48 × 6.12 × 1.44 † · 0.01 | 294 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/bd5d2dc8193c.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Overhang_Side_UnevenBrick_Short_L.gltf](../assets/asset_niva_1/terrang/stad/fasader/Overhang_Side_UnevenBrick_Short_L.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Overhang_Side_UnevenBrick_Short_L.bin' |
| **C** | Takutsprång sida ojämnt tegel kort l * | Ej relevant | 0.48 × 6.12 × 1.44 † · 0.01 | 294 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/7d8594f40751.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Overhang_Side_UnevenBrick_Short_L.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Overhang_Side_UnevenBrick_Short_L.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Overhang_Side_UnevenBrick_Short_L.bin' |
| **C** | Takutsprång sida ojämnt tegel kort r * | Ej relevant | 0.48 × 6.12 × 1.44 † · 0.01 | 294 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b4a37ac998dd.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Overhang_Side_UnevenBrick_Short_R.gltf](../assets/asset_niva_1/terrang/stad/fasader/Overhang_Side_UnevenBrick_Short_R.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Overhang_Side_UnevenBrick_Short_R.bin' |
| **C** | Takutsprång sida ojämnt tegel kort r * | Ej relevant | 0.48 × 6.12 × 1.44 † · 0.01 | 294 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/1b148790c5dd.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Overhang_Side_UnevenBrick_Short_R.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Overhang_Side_UnevenBrick_Short_R.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Overhang_Side_UnevenBrick_Short_R.bin' |
| **C** | Takutsprång sida ojämnt tegel lång l * | Ej relevant | 0.48 × 6.12 × 2.31 † · 0.01 | 292 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/6ea2bd64169e.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Overhang_Side_UnevenBrick_Long_L.gltf](../assets/asset_niva_1/terrang/stad/fasader/Overhang_Side_UnevenBrick_Long_L.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Overhang_Side_UnevenBrick_Long_L.bin' |
| **C** | Takutsprång sida ojämnt tegel lång l * | Ej relevant | 0.48 × 6.12 × 2.31 † · 0.01 | 292 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/adbeb774f1bc.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Overhang_Side_UnevenBrick_Long_L.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Overhang_Side_UnevenBrick_Long_L.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Overhang_Side_UnevenBrick_Long_L.bin' |
| **C** | Takutsprång sida ojämnt tegel lång r * | Ej relevant | 0.48 × 6.12 × 2.31 † · 0.01 | 292 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c9edfe63d20f.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Overhang_Side_UnevenBrick_Long_R.gltf](../assets/asset_niva_1/terrang/stad/fasader/Overhang_Side_UnevenBrick_Long_R.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Overhang_Side_UnevenBrick_Long_R.bin' |
| **C** | Takutsprång sida ojämnt tegel lång r * | Ej relevant | 0.48 × 6.12 × 2.31 † · 0.01 | 292 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/86fa44fde975.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Overhang_Side_UnevenBrick_Long_R.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Overhang_Side_UnevenBrick_Long_R.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Overhang_Side_UnevenBrick_Long_R.bin' |
| **C** | Takutsprång sida puts kort l * | Ej relevant | 0.48 × 6.12 × 1.44 † · 0.00 | 302 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e19fe09b2165.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Overhang_Side_Plaster_Short_L.gltf](../assets/asset_niva_1/terrang/stad/fasader/Overhang_Side_Plaster_Short_L.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Overhang_Side_Plaster_Short_L.bin' |
| **C** | Takutsprång sida puts kort l * | Ej relevant | 0.48 × 6.12 × 1.44 † · 0.00 | 302 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/0b7c0c5d5306.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Overhang_Side_Plaster_Short_L.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Overhang_Side_Plaster_Short_L.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Overhang_Side_Plaster_Short_L.bin' |
| **C** | Takutsprång sida puts kort r * | Ej relevant | 0.48 × 6.12 × 1.44 † · 0.00 | 302 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/48e41d6fbe5b.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Overhang_Side_Plaster_Short_R.gltf](../assets/asset_niva_1/terrang/stad/fasader/Overhang_Side_Plaster_Short_R.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Overhang_Side_Plaster_Short_R.bin' |
| **C** | Takutsprång sida puts kort r * | Ej relevant | 0.48 × 6.12 × 1.44 † · 0.00 | 302 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/63355f10c7fa.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Overhang_Side_Plaster_Short_R.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Overhang_Side_Plaster_Short_R.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Overhang_Side_Plaster_Short_R.bin' |
| **C** | Takutsprång sida puts lång l * | Ej relevant | 0.48 × 6.12 × 2.31 † · 0.00 | 314 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/ecdcd4e80db5.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Overhang_Side_Plaster_Long_L.gltf](../assets/asset_niva_1/terrang/stad/fasader/Overhang_Side_Plaster_Long_L.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Overhang_Side_Plaster_Long_L.bin' |
| **C** | Takutsprång sida puts lång l * | Ej relevant | 0.48 × 6.12 × 2.31 † · 0.00 | 314 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/d114ad50a2da.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Overhang_Side_Plaster_Long_L.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Overhang_Side_Plaster_Long_L.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Overhang_Side_Plaster_Long_L.bin' |
| **C** | Takutsprång sida puts lång r * | Ej relevant | 0.48 × 6.12 × 2.31 † · 0.00 | 314 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/073d203439de.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Overhang_Side_Plaster_Long_R.gltf](../assets/asset_niva_1/terrang/stad/fasader/Overhang_Side_Plaster_Long_R.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Overhang_Side_Plaster_Long_R.bin' |
| **C** | Takutsprång sida puts lång r * | Ej relevant | 0.48 × 6.12 × 2.31 † · 0.00 | 314 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/967ba85b040c.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Overhang_Side_Plaster_Long_R.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Overhang_Side_Plaster_Long_R.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Overhang_Side_Plaster_Long_R.bin' |
| **C** | Takutsprång tak puts * | Ej relevant | 2.00 × 0.27 × 2.02 † · 0.00 | 38 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/406f35cfb284.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Overhang_Roof_Plaster.gltf](../assets/asset_niva_1/terrang/stad/fasader/Overhang_Roof_Plaster.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Overhang_Roof_Plaster.bin' |
| **C** | Takutsprång tak puts * | Ej relevant | 2.00 × 0.27 × 2.02 † · 0.00 | 38 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/8200d7ff291d.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Overhang_Roof_Plaster.gltf](../assets/asset_niva_1/terrang/stad/hustak/Overhang_Roof_Plaster.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Overhang_Roof_Plaster.bin' |
| **C** | Takutsprång tak puts * | Ej relevant | 2.00 × 0.27 × 2.02 † · 0.00 | 38 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/5e0acabc4188.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Overhang_Roof_Plaster.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Overhang_Roof_Plaster.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Overhang_Roof_Plaster.bin' |
| **C** | Takutsprång tak unevenbricks * | Ej relevant | 2.00 × 0.27 × 2.02 † · 0.00 | 38 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f0fcc69a33ae.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Overhang_Roof_UnevenBricks.gltf](../assets/asset_niva_1/terrang/stad/fasader/Overhang_Roof_UnevenBricks.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Overhang_Roof_UnevenBricks.bin' |
| **C** | Takutsprång tak unevenbricks * | Ej relevant | 2.00 × 0.27 × 2.02 † · 0.00 | 38 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b807cb9fa9c8.jpg) | [assets/asset_niva_1/terrang/stad/hustak/Overhang_Roof_UnevenBricks.gltf](../assets/asset_niva_1/terrang/stad/hustak/Overhang_Roof_UnevenBricks.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/hustak/Overhang_Roof_UnevenBricks.bin' |
| **C** | Takutsprång tak unevenbricks * | Ej relevant | 2.00 × 0.27 × 2.02 † · 0.00 | 38 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b557be01ea3d.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Overhang_Roof_UnevenBricks.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Overhang_Roof_UnevenBricks.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Overhang_Roof_UnevenBricks.bin' |
| **C** | Tegel * | Ej relevant | 0.80 × 0.48 × 0.43 · 0.01 | 76 | Nej | 0 klipp; Ej relevant | ![](tumnaglar/ef92718d1e2a.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/brick.glb](../assets/asset_niva_1/terrang/stad/vaggar/brick.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; LOD1 + LOD2 + billboard/impostor inte komplett; Texturerad modellvy inte stickprovad |
| **C** | Tegel * | Ej relevant | 1.31 × 0.48 × 1.17 · 0.03 | 484 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/2a8e749bb6bc.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Bricks.glb](../assets/asset_niva_1/terrang/stad/vaggar/Bricks.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Tegel vägg * | Ej relevant | 227.56 × 19.88 × 256.00 · 0.09 | 1188 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/1e0545cb74d5.jpg) | [assets/asset_niva_1/terrang/stad/murar/Brick_wall.glb](../assets/asset_niva_1/terrang/stad/murar/Brick_wall.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Skalan behöver kontrolleras; Texturerad modellvy inte stickprovad |
| **C** | Tegel vägg * | Ej relevant | 227.56 × 19.88 × 256.00 · 0.09 | 1188 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/a951899d43cf.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Brick_wall.glb](../assets/asset_niva_1/terrang/stad/vaggar/Brick_wall.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Skalan behöver kontrolleras; Texturerad modellvy inte stickprovad |
| **C** | Telephone stolpe * | Ej relevant | 4.33 × 8.00 × 7.67 · 0.50 | 6528 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f9c27e2962e0.jpg) | [assets/asset_niva_1/terrang/stad/detaljer/telephone_pole.glb](../assets/asset_niva_1/terrang/stad/detaljer/telephone_pole.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Torn windmill * | Ej relevant | 9.72 × 14.00 × 6.12 · 0.34 | 7827 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/7be42eadd7cb.jpg) | [assets/asset_niva_1/terrang/stad/gardar/tower_windmill.glb](../assets/asset_niva_1/terrang/stad/gardar/tower_windmill.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Tunna * | Ej relevant | 1.25 × 1.61 × 1.24 · 0.07 | 1312 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/20bf947c30d1.jpg) | [assets/asset_niva_1/terrang/stad/detaljer/barrel.glb](../assets/asset_niva_1/terrang/stad/detaljer/barrel.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Tunna trä * | Ej relevant | 0.70 × 0.90 × 0.69 · 0.05 | 1312 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/6792d5da34d6.jpg) | [assets/asset_niva_1/terrang/stad/detaljer/barrel_wood.glb](../assets/asset_niva_1/terrang/stad/detaljer/barrel_wood.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Vägg 2 * | Ej relevant | 3.00 × 3.00 × 0.43 · 0.09 | 1296 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/cb7215287078.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall_2.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall_2.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Vägg arch * | Ej relevant | 2.00 × 3.00 × 0.06 † · 0.00 | 196 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/0c2fe80693c3.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Wall_Arch.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Wall_Arch.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Wall_Arch.bin' |
| **C** | Vägg archround * | Ej relevant | 6.01 × 5.99 × 0.46 · 0.16 | 2360 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/97dd66c07a3a.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall_archround.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall_archround.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Vägg archround broken * | Ej relevant | 5.99 × 5.98 × 0.46 · 0.11 | 1604 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/aec93e231843.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall_archround_broken.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall_archround_broken.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Vägg bottomcover * | Ej relevant | 2.00 × 0.24 × 0.43 † · 0.00 | 36 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f78b6b6a7378.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Wall_BottomCover.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Wall_BottomCover.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Wall_BottomCover.bin' |
| **C** | Vägg broken 2 * | Ej relevant | 2.99 × 2.92 × 0.43 · 0.07 | 971 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c0556a2766e3.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall_broken_2.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall_broken_2.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Vägg broken ruins quaternius * | Ej relevant | 2.99 × 2.92 × 0.43 · 0.07 | 971 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c15ca93c0d55.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall_broken__ruins_quaternius.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall_broken__ruins_quaternius.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Vägg double broken * | Ej relevant | 2.99 × 1.48 × 0.85 · 0.06 | 856 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/7c4d99617da2.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall_double_broken.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall_double_broken.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Vägg double hole * | Ej relevant | 2.99 × 2.96 × 0.85 · 0.12 | 1875 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/1517dfb133fe.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall_double_hole.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall_double_hole.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Vägg half 2 * | Ej relevant | 1.49 × 3.00 × 0.43 · 0.04 | 632 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f7b18eb14ec4.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall_half_2.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall_half_2.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Vägg half ruins quaternius * | Ej relevant | 1.49 × 3.00 × 0.43 · 0.04 | 632 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b4692c14cdbd.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall_half__ruins_quaternius.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall_half__ruins_quaternius.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Vägg hole * | Ej relevant | 3.00 × 3.00 × 0.43 · 0.06 | 912 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/94f8c81991d0.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall_hole.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall_hole.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Vägg ojämnt tegel dörr platt * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 74 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3aba8769da5e.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Wall_UnevenBrick_Door_Flat.gltf](../assets/asset_niva_1/terrang/stad/fasader/Wall_UnevenBrick_Door_Flat.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Wall_UnevenBrick_Door_Flat.bin' |
| **C** | Vägg ojämnt tegel dörr platt * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 74 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e0d558d780fb.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Wall_UnevenBrick_Door_Flat.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Wall_UnevenBrick_Door_Flat.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Wall_UnevenBrick_Door_Flat.bin' |
| **C** | Vägg ojämnt tegel dörr runda * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 136 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/4b6fafc91b9b.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Wall_UnevenBrick_Door_Round.gltf](../assets/asset_niva_1/terrang/stad/fasader/Wall_UnevenBrick_Door_Round.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Wall_UnevenBrick_Door_Round.bin' |
| **C** | Vägg ojämnt tegel dörr runda * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 136 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3a017779bee9.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Wall_UnevenBrick_Door_Round.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Wall_UnevenBrick_Door_Round.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Wall_UnevenBrick_Door_Round.bin' |
| **C** | Vägg ojämnt tegel fönster bred platt * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 88 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/8d755aac804d.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Wall_UnevenBrick_Window_Wide_Flat.gltf](../assets/asset_niva_1/terrang/stad/fasader/Wall_UnevenBrick_Window_Wide_Flat.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Wall_UnevenBrick_Window_Wide_Flat.bin' |
| **C** | Vägg ojämnt tegel fönster bred platt * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 88 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/fab4dba5a356.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Wall_UnevenBrick_Window_Wide_Flat.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Wall_UnevenBrick_Window_Wide_Flat.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Wall_UnevenBrick_Window_Wide_Flat.bin' |
| **C** | Vägg ojämnt tegel fönster bred runda * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 116 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e06c511ecc9f.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Wall_UnevenBrick_Window_Wide_Round.gltf](../assets/asset_niva_1/terrang/stad/fasader/Wall_UnevenBrick_Window_Wide_Round.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Wall_UnevenBrick_Window_Wide_Round.bin' |
| **C** | Vägg ojämnt tegel fönster bred runda * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 116 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/50bfe9a5200b.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Wall_UnevenBrick_Window_Wide_Round.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Wall_UnevenBrick_Window_Wide_Round.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Wall_UnevenBrick_Window_Wide_Round.bin' |
| **C** | Vägg ojämnt tegel fönster tunn runda * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 158 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/27e50d5f21aa.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Wall_UnevenBrick_Window_Thin_Round.gltf](../assets/asset_niva_1/terrang/stad/fasader/Wall_UnevenBrick_Window_Thin_Round.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Wall_UnevenBrick_Window_Thin_Round.bin' |
| **C** | Vägg ojämnt tegel fönster tunn runda * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 158 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/542001a53951.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Wall_UnevenBrick_Window_Thin_Round.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Wall_UnevenBrick_Window_Thin_Round.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Wall_UnevenBrick_Window_Thin_Round.bin' |
| **C** | Vägg ojämnt tegel rak * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 56 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b373616e2be7.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Wall_UnevenBrick_Straight.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Wall_UnevenBrick_Straight.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Wall_UnevenBrick_Straight.bin' |
| **C** | Vägg puts dörr platt * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 92 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e14f95bbeed6.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Door_Flat.gltf](../assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Door_Flat.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Door_Flat.bin' |
| **C** | Vägg puts dörr platt * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 92 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/a77af77648b0.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Door_Flat.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Door_Flat.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Door_Flat.bin' |
| **C** | Vägg puts dörr roundinset * | Ej relevant | 2.00 × 3.12 × 1.09 † · 0.01 | 180 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e0b67157a287.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Door_RoundInset.gltf](../assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Door_RoundInset.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Door_RoundInset.bin' |
| **C** | Vägg puts dörr roundinset * | Ej relevant | 2.00 × 3.12 × 1.09 † · 0.01 | 180 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/6e90be3ffdbc.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Door_RoundInset.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Door_RoundInset.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Door_RoundInset.bin' |
| **C** | Vägg puts dörr runda * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 137 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/789cd543ffda.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Door_Round.gltf](../assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Door_Round.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Door_Round.bin' |
| **C** | Vägg puts dörr runda * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 137 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/4a27db31b860.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Door_Round.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Door_Round.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Door_Round.bin' |
| **C** | Vägg puts fönster bred flat2 * | Ej relevant | 2.00 × 3.15 × 0.41 † · 0.00 | 122 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/4f224597ce13.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Window_Wide_Flat2.gltf](../assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Window_Wide_Flat2.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Window_Wide_Flat2.bin' |
| **C** | Vägg puts fönster bred flat2 * | Ej relevant | 2.00 × 3.15 × 0.41 † · 0.00 | 122 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/1c5ca26e5b12.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Window_Wide_Flat2.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Window_Wide_Flat2.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Window_Wide_Flat2.bin' |
| **C** | Vägg puts fönster bred platt * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 96 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e2f90b4fdc35.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Window_Wide_Flat.gltf](../assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Window_Wide_Flat.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Window_Wide_Flat.bin' |
| **C** | Vägg puts fönster bred platt * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 96 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/39599f449c0c.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Window_Wide_Flat.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Window_Wide_Flat.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Window_Wide_Flat.bin' |
| **C** | Vägg puts fönster bred runda * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 124 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/cfcf42f4bcd5.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Window_Wide_Round.gltf](../assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Window_Wide_Round.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Window_Wide_Round.bin' |
| **C** | Vägg puts fönster bred runda * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 124 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/6adc8572b3a6.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Window_Wide_Round.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Window_Wide_Round.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Window_Wide_Round.bin' |
| **C** | Vägg puts fönster tunn runda * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 166 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f68781ee0b7f.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Window_Thin_Round.gltf](../assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Window_Thin_Round.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Window_Thin_Round.bin' |
| **C** | Vägg puts fönster tunn runda * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 166 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/80cd2e7dc93d.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Window_Thin_Round.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Window_Thin_Round.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Window_Thin_Round.bin' |
| **C** | Vägg puts rak * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.00 | 86 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/44901a602530.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Straight.gltf](../assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Straight.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Straight.bin' |
| **C** | Vägg puts rak * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.00 | 86 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/bb8abcbe51e9.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Straight.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Straight.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Straight.bin' |
| **C** | Vägg puts rak base * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 64 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/811367c60371.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Straight_Base.gltf](../assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Straight_Base.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Straight_Base.bin' |
| **C** | Vägg puts rak base * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 64 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/486900f4fb9e.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Straight_Base.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Straight_Base.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Straight_Base.bin' |
| **C** | Vägg puts rak l * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 72 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/d7165d31d69a.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Straight_L.gltf](../assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Straight_L.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Straight_L.bin' |
| **C** | Vägg puts rak l * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 72 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/4ee0c2774a7c.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Straight_L.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Straight_L.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Straight_L.bin' |
| **C** | Vägg puts rak r * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 72 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3ee52a5701a4.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Straight_R.gltf](../assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Straight_R.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_Straight_R.bin' |
| **C** | Vägg puts rak r * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.01 | 72 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/0dad67945334.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Straight_R.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Straight_R.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_Straight_R.bin' |
| **C** | Vägg puts woodgrid * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.00 | 248 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/bc701437b158.jpg) | [assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_WoodGrid.gltf](../assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_WoodGrid.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/Wall_Plaster_WoodGrid.bin' |
| **C** | Vägg puts woodgrid * | Ej relevant | 2.00 × 3.12 × 0.41 † · 0.00 | 248 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f5ad2b5e1ca1.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_WoodGrid.gltf](../assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_WoodGrid.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/vaggar/Wall_Plaster_WoodGrid.bin' |
| **C** | Vägg ruins quaternius * | Ej relevant | 3.00 × 3.00 × 0.43 · 0.09 | 1296 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/0e9f35e77f1f.jpg) | [assets/asset_niva_1/terrang/stad/vaggar/wall__ruins_quaternius.glb](../assets/asset_niva_1/terrang/stad/vaggar/wall__ruins_quaternius.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Well * | Ej relevant | 1.33 × 2.50 × 2.01 · 0.11 | 1870 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/1d0d9e73bcc2.jpg) | [assets/asset_niva_1/terrang/stad/detaljer/well.glb](../assets/asset_niva_1/terrang/stad/detaljer/well.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Windowshutters bred platt closed * | Ej relevant | 1.35 × 1.42 × 0.14 † · 0.00 | 120 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/bb210205e035.jpg) | [assets/asset_niva_1/terrang/stad/fasader/WindowShutters_Wide_Flat_Closed.gltf](../assets/asset_niva_1/terrang/stad/fasader/WindowShutters_Wide_Flat_Closed.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/WindowShutters_Wide_Flat_Closed.bin' |
| **C** | Windowshutters bred platt open * | Ej relevant | 2.48 × 1.42 × 0.46 † · 0.00 | 120 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/bac9d233f5d4.jpg) | [assets/asset_niva_1/terrang/stad/fasader/WindowShutters_Wide_Flat_Open.gltf](../assets/asset_niva_1/terrang/stad/fasader/WindowShutters_Wide_Flat_Open.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/WindowShutters_Wide_Flat_Open.bin' |
| **C** | Windowshutters bred runda closed * | Ej relevant | 1.35 × 1.65 × 0.14 † · 0.00 | 136 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/912a3ea459f5.jpg) | [assets/asset_niva_1/terrang/stad/fasader/WindowShutters_Wide_Round_Closed.gltf](../assets/asset_niva_1/terrang/stad/fasader/WindowShutters_Wide_Round_Closed.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/WindowShutters_Wide_Round_Closed.bin' |
| **C** | Windowshutters bred runda open * | Ej relevant | 2.30 × 1.65 × 0.47 † · 0.00 | 136 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f69e2b2a43f4.jpg) | [assets/asset_niva_1/terrang/stad/fasader/WindowShutters_Wide_Round_Open.gltf](../assets/asset_niva_1/terrang/stad/fasader/WindowShutters_Wide_Round_Open.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/WindowShutters_Wide_Round_Open.bin' |
| **C** | Windowshutters tunn platt closed * | Ej relevant | 0.85 × 1.42 × 0.14 † · 0.00 | 96 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/6f9526f632ec.jpg) | [assets/asset_niva_1/terrang/stad/fasader/WindowShutters_Thin_Flat_Closed.gltf](../assets/asset_niva_1/terrang/stad/fasader/WindowShutters_Thin_Flat_Closed.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/WindowShutters_Thin_Flat_Closed.bin' |
| **C** | Windowshutters tunn platt open * | Ej relevant | 1.35 × 1.42 × 0.38 † · 0.00 | 96 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/7061ad6ea1ce.jpg) | [assets/asset_niva_1/terrang/stad/fasader/WindowShutters_Thin_Flat_Open.gltf](../assets/asset_niva_1/terrang/stad/fasader/WindowShutters_Thin_Flat_Open.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/WindowShutters_Thin_Flat_Open.bin' |
| **C** | Windowshutters tunn runda closed * | Ej relevant | 0.87 × 1.52 × 0.14 † · 0.00 | 112 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/1c753245acb0.jpg) | [assets/asset_niva_1/terrang/stad/fasader/WindowShutters_Thin_Round_Closed.gltf](../assets/asset_niva_1/terrang/stad/fasader/WindowShutters_Thin_Round_Closed.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/WindowShutters_Thin_Round_Closed.bin' |
| **C** | Windowshutters tunn runda open * | Ej relevant | 1.61 × 1.52 × 0.38 † · 0.00 | 112 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3cfebadb351d.jpg) | [assets/asset_niva_1/terrang/stad/fasader/WindowShutters_Thin_Round_Open.gltf](../assets/asset_niva_1/terrang/stad/fasader/WindowShutters_Thin_Round_Open.gltf) | Modellen gick inte att läsa: ENOENT: no such file or directory, open 'assets/asset_niva_1/terrang/stad/fasader/WindowShutters_Thin_Round_Open.bin' |

## Fordon
| Nivå | Svenskt namn (härlett/gissning *) | Land | Mått x/y/z m · MB | Tri | LOD | Animation/ljud | Bild | Sökväg | Kvar |
|---|---|---|---|---|---|---|---|---|---|
| **C** | M3 halftrack 42manako * | USA | 6.31 × 2.34 × 2.22 · 4.43 | 17734 | Ja | 0 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/3cf0b6df0770.jpg) | [assets/asset_niva_1/enheter/fordon/m3_halftrack_sketchfab_42manako.glb](../assets/asset_niva_1/enheter/fordon/m3_halftrack_sketchfab_42manako.glb) | Inte komplett färg/normal/MR på alla material; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd; Väsentlig koppling/animation/besättning återstår |
| **C** | Willys-jeep * | USA | 1.63 × 1.75 × 3.36 · 14.00 | 20384 | Ja | 0 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/0c15c76f87e6.jpg) | [assets/asset_niva_1/enheter/fordon/willys-jeep-asset/willys-jeep-asset_v3_pbr.glb](../assets/asset_niva_1/enheter/fordon/willys-jeep-asset/willys-jeep-asset_v3_pbr.glb) | Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd; Väsentlig koppling/animation/besättning återstår |

## Föremål
| Nivå | Svenskt namn (härlett/gissning *) | Land | Mått x/y/z m · MB | Tri | LOD | Animation/ljud | Bild | Sökväg | Kvar |
|---|---|---|---|---|---|---|---|---|---|
| **A** | Alarm klocka 01 * | Ej relevant | 0.13 × 0.17 × 0.07 · 0.01 | 8985 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/ba603c1b8f4f.jpg) | [assets/asset_niva_1/bebyggelse/foremal/alarm_clock_01/alarm_clock_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/alarm_clock_01/alarm_clock_01_2k.gltf) |  |
| **A** | Antique keramik vas 01 * | Ej relevant | 0.26 × 0.44 × 0.26 · 0.00 | 9408 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e5e3eb3d5822.jpg) | [assets/asset_niva_1/bebyggelse/foremal/antique_ceramic_vase_01/antique_ceramic_vase_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/antique_ceramic_vase_01/antique_ceramic_vase_01_2k.gltf) |  |
| **A** | Arm stol 01 * | Ej relevant | 0.85 × 1.07 × 0.77 · 0.00 | 5626 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/5b1b6395f0a4.jpg) | [assets/asset_niva_1/bebyggelse/foremal/ArmChair_01/ArmChair_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/ArmChair_01/ArmChair_01_2k.gltf) |  |
| **A** | Barber Shop stol 01 * | Ej relevant | 0.76 × 1.49 × 1.33 · 0.00 | 4280 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/a542bdf2b6a1.jpg) | [assets/asset_niva_1/bebyggelse/foremal/BarberShopChair_01/BarberShopChair_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/BarberShopChair_01/BarberShopChair_01_2k.gltf) |  |
| **A** | Bok uppslagsverk uppsättning 01 * | Ej relevant | 0.55 × 0.24 × 0.16 · 0.06 | 67306 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/02a6d040f0ea.jpg) | [assets/asset_niva_1/bebyggelse/foremal/book_encyclopedia_set_01/book_encyclopedia_set_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/book_encyclopedia_set_01/book_encyclopedia_set_01_2k.gltf) |  |
| **A** | Bolt cutters 01 * | Ej relevant | 0.15 × 0.80 × 0.04 · 0.00 | 3410 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/cfa0d988e6ff.jpg) | [assets/asset_niva_1/bebyggelse/foremal/bolt_cutters_01/bolt_cutters_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/bolt_cutters_01/bolt_cutters_01_2k.gltf) |  |
| **A** | Bunsen burner * | Ej relevant | 0.14 × 0.17 × 0.14 · 0.00 | 8434 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/716a034c006c.jpg) | [assets/asset_niva_1/bebyggelse/foremal/bunsen_burner/bunsen_burner_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/bunsen_burner/bunsen_burner_2k.gltf) |  |
| **A** | Caged hängande light * | Ej relevant | 1.16 × 0.75 × 0.31 · 0.00 | 22893 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/cf4285258f7f.jpg) | [assets/asset_niva_1/bebyggelse/foremal/caged_hanging_light/caged_hanging_light_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/caged_hanging_light/caged_hanging_light_2k.gltf) |  |
| **A** | Cardboard box 01 * | Ej relevant | 0.39 × 0.34 × 0.52 · 0.00 | 16952 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/47925158a46d.jpg) | [assets/asset_niva_1/bebyggelse/foremal/cardboard_box_01/cardboard_box_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/cardboard_box_01/cardboard_box_01_2k.gltf) |  |
| **A** | Carved trä elephant * | Ej relevant | 0.11 × 0.10 × 0.06 · 0.00 | 2752 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/304be3b85d70.jpg) | [assets/asset_niva_1/bebyggelse/foremal/carved_wooden_elephant/carved_wooden_elephant_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/carved_wooden_elephant/carved_wooden_elephant_2k.gltf) |  |
| **A** | Carved trä plate * | Ej relevant | 0.27 × 0.04 × 0.27 · 0.00 | 2112 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/115741f8849b.jpg) | [assets/asset_niva_1/bebyggelse/foremal/carved_wooden_plate/carved_wooden_plate_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/carved_wooden_plate/carved_wooden_plate_2k.gltf) |  |
| **A** | Chemistry uppsättning * | Ej relevant | 1.08 × 0.43 × 0.35 · 0.08 | 41958 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/a71b82bba1d2.jpg) | [assets/asset_niva_1/bebyggelse/foremal/chemistry_set/chemistry_set_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/chemistry_set/chemistry_set_2k.gltf) |  |
| **A** | Chess uppsättning * | Ej relevant | 0.55 × 0.11 × 0.55 · 0.05 | 76920 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/65fb5a4bc4e3.jpg) | [assets/asset_niva_1/bebyggelse/foremal/chess_set/chess_set_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/chess_set/chess_set_2k.gltf) |  |
| **A** | Classic Console 01 * | Ej relevant | 1.54 × 0.95 × 0.59 · 0.00 | 7566 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/fd79b8307649.jpg) | [assets/asset_niva_1/bebyggelse/foremal/ClassicConsole_01/ClassicConsole_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/ClassicConsole_01/ClassicConsole_01_2k.gltf) |  |
| **A** | Classic Nightstand 01 * | Ej relevant | 0.57 × 0.70 × 0.42 · 0.00 | 2002 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/6fdcca431dfa.jpg) | [assets/asset_niva_1/bebyggelse/foremal/ClassicNightstand_01/ClassicNightstand_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/ClassicNightstand_01/ClassicNightstand_01_2k.gltf) |  |
| **A** | Clipboard * | Ej relevant | 0.23 × 0.04 × 0.34 · 0.00 | 6176 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3ecd826ff66e.jpg) | [assets/asset_niva_1/bebyggelse/foremal/clipboard/clipboard_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/clipboard/clipboard_2k.gltf) |  |
| **A** | Coffee bord 01 * | Ej relevant | 1.54 × 0.52 × 0.97 · 0.00 | 10404 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/9666b0f60179.jpg) | [assets/asset_niva_1/bebyggelse/foremal/CoffeeTable_01/CoffeeTable_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/CoffeeTable_01/CoffeeTable_01_2k.gltf) |  |
| **A** | Coffee bord runda 01 * | Ej relevant | 1.30 × 0.49 × 1.30 · 0.00 | 4044 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c7fb7a79e78a.jpg) | [assets/asset_niva_1/bebyggelse/foremal/coffee_table_round_01/coffee_table_round_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/coffee_table_round_01/coffee_table_round_01_2k.gltf) |  |
| **A** | Combination nyckel * | Ej relevant | 0.06 × 0.02 × 0.34 · 0.00 | 1986 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/12d883f5a4cc.jpg) | [assets/asset_niva_1/bebyggelse/foremal/combination_wrench/combination_wrench_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/combination_wrench/combination_wrench_2k.gltf) |  |
| **A** | Croissant * | Ej relevant | 0.20 × 0.06 × 0.08 · 0.00 | 1990 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/9ba5afee7540.jpg) | [assets/asset_niva_1/bebyggelse/foremal/croissant/croissant_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/croissant/croissant_2k.gltf) |  |
| **A** | Cross pein hammare * | Ej relevant | 0.10 × 0.30 × 0.02 · 0.00 | 2124 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/89f60dc04c4f.jpg) | [assets/asset_niva_1/bebyggelse/foremal/cross_pein_hammer/cross_pein_hammer_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/cross_pein_hammer/cross_pein_hammer_2k.gltf) |  |
| **A** | Dartboard * | Ej relevant | 0.45 × 0.45 × 0.04 · 0.00 | 6800 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f929d296f58a.jpg) | [assets/asset_niva_1/bebyggelse/foremal/dartboard/dartboard_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/dartboard/dartboard_2k.gltf) |  |
| **A** | Desk lampa arm 01 * | Ej relevant | 0.20 × 0.89 × 0.61 · 0.00 | 24102 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/075adc6b0972.jpg) | [assets/asset_niva_1/bebyggelse/foremal/desk_lamp_arm_01/desk_lamp_arm_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/desk_lamp_arm_01/desk_lamp_arm_01_2k.gltf) |  |
| **A** | Dining stol 02 * | Ej relevant | 0.43 × 0.97 × 0.58 · 0.00 | 22013 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/4bb8928e9111.jpg) | [assets/asset_niva_1/bebyggelse/foremal/dining_chair_02/dining_chair_02_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/dining_chair_02/dining_chair_02_2k.gltf) |  |
| **A** | Fancy picture ram 01 * | Ej relevant | 0.60 × 0.46 × 0.02 · 0.01 | 938 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/4802fdcd2d32.jpg) | [assets/asset_niva_1/bebyggelse/foremal/fancy_picture_frame_01/fancy_picture_frame_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/fancy_picture_frame_01/fancy_picture_frame_01_2k.gltf) |  |
| **A** | Fancy picture ram 02 * | Ej relevant | 0.66 × 0.77 × 0.09 · 0.01 | 35102 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/2d1d2fa832ec.jpg) | [assets/asset_niva_1/bebyggelse/foremal/fancy_picture_frame_02/fancy_picture_frame_02_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/fancy_picture_frame_02/fancy_picture_frame_02_2k.gltf) |  |
| **A** | Fish knife * | Ej relevant | 0.03 × 0.22 × 0.02 · 0.00 | 2736 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/1b3d07f239d2.jpg) | [assets/asset_niva_1/bebyggelse/foremal/fish_knife/fish_knife_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/fish_knife/fish_knife_2k.gltf) |  |
| **A** | Fishermans hatt * | Ej relevant | 0.32 × 0.12 × 0.35 · 0.00 | 10304 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/297c2474072b.jpg) | [assets/asset_niva_1/bebyggelse/foremal/fishermans_hat/fishermans_hat_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/fishermans_hat/fishermans_hat_2k.gltf) |  |
| **A** | Flätad korg 02 * | Ej relevant | 0.35 × 0.20 × 0.25 · 0.00 | 17850 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3798a2fe4b2c.jpg) | [assets/asset_niva_1/bebyggelse/foremal/wicker_basket_02/wicker_basket_02_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/wicker_basket_02/wicker_basket_02_2k.gltf) |  |
| **A** | Food apple 01 * | Ej relevant | 0.10 × 0.09 × 0.10 · 0.00 | 7012 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/74e7dd647562.jpg) | [assets/asset_niva_1/bebyggelse/foremal/food_apple_01/food_apple_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/food_apple_01/food_apple_01_2k.gltf) |  |
| **A** | Food pomegranate 01 * | Ej relevant | 0.11 × 0.11 × 0.12 · 0.00 | 8142 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b1fc6f5ccbb8.jpg) | [assets/asset_niva_1/bebyggelse/foremal/food_pomegranate_01/food_pomegranate_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/food_pomegranate_01/food_pomegranate_01_2k.gltf) |  |
| **A** | Gallinera bord * | Ej relevant | 0.83 × 0.49 × 0.52 · 0.01 | 5528 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/55c2fbb79af0.jpg) | [assets/asset_niva_1/bebyggelse/foremal/gallinera_table/gallinera_table_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/gallinera_table/gallinera_table_2k.gltf) |  |
| **A** | Gallinera stol * | Ej relevant | 0.58 × 1.03 × 0.60 · 0.00 | 11560 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/82365a6e9b6a.jpg) | [assets/asset_niva_1/bebyggelse/foremal/gallinera_chair/gallinera_chair_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/gallinera_chair/gallinera_chair_2k.gltf) |  |
| **A** | Gammal drill press * | Ej relevant | 0.53 × 1.05 × 0.61 · 0.00 | 21842 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/75a55b47e6ba.jpg) | [assets/asset_niva_1/bebyggelse/foremal/old_drill_press/old_drill_press_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/old_drill_press/old_drill_press_2k.gltf) |  |
| **A** | Garden gloves 01 * | Ej relevant | 0.23 × 0.08 × 0.30 · 0.00 | 6822 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/cef07fa103c2.jpg) | [assets/asset_niva_1/bebyggelse/foremal/garden_gloves_01/garden_gloves_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/garden_gloves_01/garden_gloves_01_2k.gltf) |  |
| **A** | Gata rat * | Ej relevant | 0.03 × 0.03 × 0.15 · 0.00 | 57216 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/cd5d6c05b4da.jpg) | [assets/asset_niva_1/bebyggelse/foremal/street_rat/street_rat_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/street_rat/street_rat_2k.gltf) |  |
| **A** | Gothic Commode 01 * | Ej relevant | 1.20 × 1.21 × 0.58 · 0.01 | 3897 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/ec68fb901d96.jpg) | [assets/asset_niva_1/bebyggelse/foremal/GothicCommode_01/GothicCommode_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/GothicCommode_01/GothicCommode_01_2k.gltf) |  |
| **A** | Gothic coffee bord * | Ej relevant | 1.44 × 0.56 × 1.44 · 0.00 | 23836 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/24b1200de3af.jpg) | [assets/asset_niva_1/bebyggelse/foremal/gothic_coffee_table/gothic_coffee_table_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/gothic_coffee_table/gothic_coffee_table_2k.gltf) |  |
| **A** | Gothic skåp 01 * | Ej relevant | 1.72 × 2.36 × 1.12 · 0.01 | 12170 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/8eb209837fcb.jpg) | [assets/asset_niva_1/bebyggelse/foremal/GothicCabinet_01/GothicCabinet_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/GothicCabinet_01/GothicCabinet_01_2k.gltf) |  |
| **A** | Gothic säng 01 * | Ej relevant | 1.49 × 1.53 × 2.04 · 0.00 | 18745 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/6ce4e8b8e460.jpg) | [assets/asset_niva_1/bebyggelse/foremal/GothicBed_01/GothicBed_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/GothicBed_01/GothicBed_01_2k.gltf) |  |
| **A** | Grön stol 01 * | Ej relevant | 0.67 × 1.06 × 0.66 · 0.00 | 4213 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c0ad37a39e10.jpg) | [assets/asset_niva_1/bebyggelse/foremal/GreenChair_01/GreenChair_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/GreenChair_01/GreenChair_01_2k.gltf) |  |
| **A** | Gummi stövlar * | Ej relevant | 0.89 × 0.37 × 0.27 · 0.01 | 56128 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/731418746fd9.jpg) | [assets/asset_niva_1/bebyggelse/foremal/rubber_boots/rubber_boots_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/rubber_boots/rubber_boots_2k.gltf) |  |
| **A** | Hand plane no4 * | Ej relevant | 0.33 × 0.20 × 0.08 · 0.00 | 8220 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f83a66b68ffb.jpg) | [assets/asset_niva_1/bebyggelse/foremal/hand_plane_no4/hand_plane_no4_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/hand_plane_no4/hand_plane_no4_2k.gltf) |  |
| **A** | Hand truck * | Ej relevant | 0.59 × 1.40 × 0.69 · 0.00 | 13220 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/7f51e532708a.jpg) | [assets/asset_niva_1/bebyggelse/foremal/hand_truck/hand_truck_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/hand_truck/hand_truck_2k.gltf) |  |
| **A** | Horse head * | Ej relevant | 0.21 × 0.42 × 0.33 · 0.00 | 12068 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/0c42dfbea1b7.jpg) | [assets/asset_niva_1/bebyggelse/foremal/horse_head/horse_head_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/horse_head/horse_head_2k.gltf) |  |
| **A** | Horse statue 01 * | Ej relevant | 0.16 × 0.22 × 0.11 · 0.01 | 22388 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/576ba5a9c818.jpg) | [assets/asset_niva_1/bebyggelse/foremal/horse_statue_01/horse_statue_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/horse_statue_01/horse_statue_01_2k.gltf) |  |
| **A** | Hängande picture ram 02 * | Ej relevant | 0.75 × 0.50 × 0.03 · 0.01 | 3678 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/1df88dbc80f3.jpg) | [assets/asset_niva_1/bebyggelse/foremal/hanging_picture_frame_02/hanging_picture_frame_02_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/hanging_picture_frame_02/hanging_picture_frame_02_2k.gltf) |  |
| **A** | Industri caged sconce * | Ej relevant | 1.21 × 0.91 × 0.39 · 0.02 | 26576 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b9952dbe0b57.jpg) | [assets/asset_niva_1/bebyggelse/foremal/industrial_caged_sconce/industrial_caged_sconce_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/industrial_caged_sconce/industrial_caged_sconce_2k.gltf) |  |
| **A** | Industri förråd cart * | Ej relevant | 1.60 × 1.38 × 1.10 · 0.00 | 18902 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/0d4c64b88be3.jpg) | [assets/asset_niva_1/bebyggelse/foremal/industrial_storage_cart/industrial_storage_cart_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/industrial_storage_cart/industrial_storage_cart_2k.gltf) |  |
| **A** | Industri pipe lampa * | Ej relevant | 0.18 × 0.36 × 0.26 · 0.01 | 8626 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/809565480a56.jpg) | [assets/asset_niva_1/bebyggelse/foremal/industrial_pipe_lamp/industrial_pipe_lamp_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/industrial_pipe_lamp/industrial_pipe_lamp_2k.gltf) |  |
| **A** | Industri vägg lampa * | Ej relevant | 0.27 × 0.43 × 0.14 · 0.01 | 4446 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/eec7c789214e.jpg) | [assets/asset_niva_1/bebyggelse/foremal/industrial_wall_lamp/industrial_wall_lamp_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/industrial_wall_lamp/industrial_wall_lamp_2k.gltf) |  |
| **A** | Kassa apparat 01 * | Ej relevant | 0.60 × 0.62 × 0.62 · 0.01 | 9927 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b59c26045994.jpg) | [assets/asset_niva_1/bebyggelse/foremal/CashRegister_01/CashRegister_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/CashRegister_01/CashRegister_01_2k.gltf) |  |
| **A** | Keramik kanna * | Ej relevant | 0.66 × 0.37 × 0.50 · 0.00 | 3592 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/7ace7fa3a67d.jpg) | [assets/asset_niva_1/bebyggelse/foremal/ceramic_pot/ceramic_pot_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/ceramic_pot/ceramic_pot_2k.gltf) |  |
| **A** | Keramik vas 01 * | Ej relevant | 0.20 × 0.40 × 0.20 · 0.00 | 10296 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/41841f14167a.jpg) | [assets/asset_niva_1/bebyggelse/foremal/ceramic_vase_01/ceramic_vase_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/ceramic_vase_01/ceramic_vase_01_2k.gltf) |  |
| **A** | Keramik vas 02 * | Ej relevant | 0.22 × 0.31 × 0.22 · 0.00 | 11128 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/d133e25815fb.jpg) | [assets/asset_niva_1/bebyggelse/foremal/ceramic_vase_02/ceramic_vase_02_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/ceramic_vase_02/ceramic_vase_02_2k.gltf) |  |
| **A** | Keramik vas 03 * | Ej relevant | 0.11 × 0.41 × 0.11 · 0.00 | 11136 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/2f78e20571d9.jpg) | [assets/asset_niva_1/bebyggelse/foremal/ceramic_vase_03/ceramic_vase_03_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/ceramic_vase_03/ceramic_vase_03_2k.gltf) |  |
| **A** | Keramik vas 04 * | Ej relevant | 0.18 × 0.34 × 0.18 · 0.00 | 9000 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/08092a9e9cb7.jpg) | [assets/asset_niva_1/bebyggelse/foremal/ceramic_vase_04/ceramic_vase_04_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/ceramic_vase_04/ceramic_vase_04_2k.gltf) |  |
| **A** | Lifebuoy * | Ej relevant | 0.78 × 0.84 × 0.16 · 0.00 | 10728 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/93a430c55ca8.jpg) | [assets/asset_niva_1/bebyggelse/foremal/lifebuoy/lifebuoy_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/lifebuoy/lifebuoy_2k.gltf) |  |
| **A** | Lightbulb 01 * | Ej relevant | 0.06 × 0.10 × 0.06 · 0.01 | 4372 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/4f91a6d005dd.jpg) | [assets/asset_niva_1/bebyggelse/foremal/lightbulb_01/lightbulb_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/lightbulb_01/lightbulb_01_2k.gltf) |  |
| **A** | Lion head * | Ej relevant | 0.32 × 0.44 × 0.21 · 0.00 | 47214 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/8981bb87e05c.jpg) | [assets/asset_niva_1/bebyggelse/foremal/lion_head/lion_head_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/lion_head/lion_head_2k.gltf) |  |
| **A** | Liten trä bord 01 * | Ej relevant | 0.92 × 0.53 × 0.44 · 0.00 | 3410 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f73b23e03bd6.jpg) | [assets/asset_niva_1/bebyggelse/foremal/small_wooden_table_01/small_wooden_table_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/small_wooden_table_01/small_wooden_table_01_2k.gltf) |  |
| **A** | Ljuskrona 03 * | Ej relevant | 0.78 × 1.04 × 0.79 · 0.00 | 29301 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/aec1df4173d7.jpg) | [assets/asset_niva_1/bebyggelse/foremal/Chandelier_03/Chandelier_03_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/Chandelier_03/Chandelier_03_2k.gltf) |  |
| **A** | Machete * | Ej relevant | 0.04 × 0.75 × 0.06 · 0.00 | 3032 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/2bc65f32e576.jpg) | [assets/asset_niva_1/bebyggelse/foremal/machete/machete_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/machete/machete_2k.gltf) |  |
| **A** | Mantel klocka 01 * | Ej relevant | 0.34 × 0.16 × 0.13 · 0.01 | 25721 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/1a4cb1388cf8.jpg) | [assets/asset_niva_1/bebyggelse/foremal/mantel_clock_01/mantel_clock_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/mantel_clock_01/mantel_clock_01_2k.gltf) |  |
| **A** | Marble bust 01 * | Ej relevant | 0.27 × 0.51 × 0.30 · 0.00 | 17456 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/4b105e1d4070.jpg) | [assets/asset_niva_1/bebyggelse/foremal/marble_bust_01/marble_bust_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/marble_bust_01/marble_bust_01_2k.gltf) |  |
| **A** | Measuring tape 01 * | Ej relevant | 0.04 × 0.07 × 0.17 · 0.00 | 2868 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e0b26ad1299e.jpg) | [assets/asset_niva_1/bebyggelse/foremal/measuring_tape_01/measuring_tape_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/measuring_tape_01/measuring_tape_01_2k.gltf) |  |
| **A** | Metall avfall burk * | Ej relevant | 1.78 × 0.91 × 0.56 · 0.02 | 13960 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/23f070022f41.jpg) | [assets/asset_niva_1/bebyggelse/foremal/metal_trash_can/metal_trash_can_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/metal_trash_can/metal_trash_can_2k.gltf) |  |
| **A** | Metall pall 01 * | Ej relevant | 0.35 × 0.88 × 0.35 · 0.00 | 8334 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e5a77c372351.jpg) | [assets/asset_niva_1/bebyggelse/foremal/metal_stool_01/metal_stool_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/metal_stool_01/metal_stool_01_2k.gltf) |  |
| **A** | Metall pall 02 * | Ej relevant | 0.45 × 0.46 × 0.47 · 0.00 | 6532 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/475883057565.jpg) | [assets/asset_niva_1/bebyggelse/foremal/metal_stool_02/metal_stool_02_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/metal_stool_02/metal_stool_02_2k.gltf) |  |
| **A** | Metall pall 03 * | Ej relevant | 0.46 × 1.02 × 0.47 · 0.00 | 6576 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/0999ffbe3fb4.jpg) | [assets/asset_niva_1/bebyggelse/foremal/metal_stool_03/metal_stool_03_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/metal_stool_03/metal_stool_03_2k.gltf) |  |
| **A** | Modul industri pipes 01 * | Ej relevant | 1.40 × 1.95 × 0.31 · 0.02 | 12340 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/0d10db50a9ca.jpg) | [assets/asset_niva_1/bebyggelse/foremal/modular_industrial_pipes_01/modular_industrial_pipes_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/modular_industrial_pipes_01/modular_industrial_pipes_01_2k.gltf) |  |
| **A** | Modul metall gutter * | Ej relevant | 2.27 × 1.84 × 1.51 · 0.02 | 16490 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f550e64ccd16.jpg) | [assets/asset_niva_1/bebyggelse/foremal/modular_metal_gutter/modular_metal_gutter_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/modular_metal_gutter/modular_metal_gutter_2k.gltf) |  |
| **A** | Modul pipes * | Ej relevant | 4.19 × 2.43 × 0.46 · 0.11 | 94856 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/0eae3903b77c.jpg) | [assets/asset_niva_1/bebyggelse/foremal/modular_pipes/modular_pipes_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/modular_pipes/modular_pipes_2k.gltf) |  |
| **A** | Mousetrap * | Ej relevant | 0.05 × 0.02 × 0.10 · 0.00 | 5136 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b8a9645324d4.jpg) | [assets/asset_niva_1/bebyggelse/foremal/mousetrap/mousetrap_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/mousetrap/mousetrap_2k.gltf) |  |
| **A** | Mässing blowtorch * | Ej relevant | 0.13 × 0.21 × 0.26 · 0.00 | 11750 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/688a478d49ca.jpg) | [assets/asset_niva_1/bebyggelse/foremal/brass_blowtorch/brass_blowtorch_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/brass_blowtorch/brass_blowtorch_2k.gltf) |  |
| **A** | Mässing diya lykta * | Ej relevant | 0.12 × 0.38 × 0.12 · 0.01 | 12742 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/69772061933d.jpg) | [assets/asset_niva_1/bebyggelse/foremal/brass_diya_lantern/brass_diya_lantern_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/brass_diya_lantern/brass_diya_lantern_2k.gltf) |  |
| **A** | Mässing goblets * | Ej relevant | 0.45 × 0.27 × 0.30 · 0.01 | 9600 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/527dda090242.jpg) | [assets/asset_niva_1/bebyggelse/foremal/brass_goblets/brass_goblets_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/brass_goblets/brass_goblets_2k.gltf) |  |
| **A** | Mässing kanna 01 * | Ej relevant | 0.30 × 0.29 × 0.30 · 0.00 | 3760 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/21d90e5d4d0f.jpg) | [assets/asset_niva_1/bebyggelse/foremal/brass_pot_01/brass_pot_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/brass_pot_01/brass_pot_01_2k.gltf) |  |
| **A** | Mässing kanna 02 * | Ej relevant | 0.37 × 0.11 × 0.30 · 0.00 | 3344 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/ad6ee924663a.jpg) | [assets/asset_niva_1/bebyggelse/foremal/brass_pot_02/brass_pot_02_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/brass_pot_02/brass_pot_02_2k.gltf) |  |
| **A** | Mässing pan 01 * | Ej relevant | 0.19 × 0.05 × 0.45 · 0.00 | 4340 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/a9d547fd1012.jpg) | [assets/asset_niva_1/bebyggelse/foremal/brass_pan_01/brass_pan_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/brass_pan_01/brass_pan_01_2k.gltf) |  |
| **A** | Mässing vas 01 * | Ej relevant | 0.23 × 0.69 × 0.23 · 0.00 | 21440 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/2eca4e37bb52.jpg) | [assets/asset_niva_1/bebyggelse/foremal/brass_vase_01/brass_vase_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/brass_vase_01/brass_vase_01_2k.gltf) |  |
| **A** | Mässing vas 02 * | Ej relevant | 0.21 × 0.53 × 0.21 · 0.00 | 6890 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/99f177910e7b.jpg) | [assets/asset_niva_1/bebyggelse/foremal/brass_vase_02/brass_vase_02_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/brass_vase_02/brass_vase_02_2k.gltf) |  |
| **A** | Mässing vas 03 * | Ej relevant | 0.08 × 0.20 × 0.08 · 0.00 | 2616 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/2ff246a658b1.jpg) | [assets/asset_niva_1/bebyggelse/foremal/brass_vase_03/brass_vase_03_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/brass_vase_03/brass_vase_03_2k.gltf) |  |
| **A** | Mässing vas 04 * | Ej relevant | 0.08 × 0.17 × 0.06 · 0.00 | 2760 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3888e01681bc.jpg) | [assets/asset_niva_1/bebyggelse/foremal/brass_vase_04/brass_vase_04_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/brass_vase_04/brass_vase_04_2k.gltf) |  |
| **A** | Ornate spegel 01 * | Ej relevant | 0.49 × 0.74 × 0.03 · 0.00 | 14246 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/22bee9bebb69.jpg) | [assets/asset_niva_1/bebyggelse/foremal/ornate_mirror_01/ornate_mirror_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/ornate_mirror_01/ornate_mirror_01_2k.gltf) |  |
| **A** | Ottoman 01 * | Ej relevant | 0.88 × 0.62 × 0.62 · 0.00 | 4240 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/16e8d8a0c0b3.jpg) | [assets/asset_niva_1/bebyggelse/foremal/Ottoman_01/Ottoman_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/Ottoman_01/Ottoman_01_2k.gltf) |  |
| **A** | Overhead crane * | Ej relevant | 12.49 × 5.13 × 4.00 · 0.01 | 89964 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/7d4303319111.jpg) | [assets/asset_niva_1/bebyggelse/foremal/overhead_crane/overhead_crane_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/overhead_crane/overhead_crane_2k.gltf) |  |
| **A** | Plunger * | Ej relevant | 0.17 × 0.42 × 0.17 · 0.00 | 3278 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/6b772bf447ff.jpg) | [assets/asset_niva_1/bebyggelse/foremal/plunger/plunger_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/plunger/plunger_2k.gltf) |  |
| **A** | Postcard uppsättning 01 * | Ej relevant | 0.68 × 0.54 × 0.00 · 0.03 | 2720 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/abbecefa8458.jpg) | [assets/asset_niva_1/bebyggelse/foremal/postcard_set_01/postcard_set_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/postcard_set_01/postcard_set_01_2k.gltf) |  |
| **A** | Pull chain light socket * | Ej relevant | 0.11 × 0.17 × 0.11 · 0.00 | 10902 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/21985e395a74.jpg) | [assets/asset_niva_1/bebyggelse/foremal/pull_chain_light_socket/pull_chain_light_socket_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/pull_chain_light_socket/pull_chain_light_socket_2k.gltf) |  |
| **A** | Ratchet nyckel * | Ej relevant | 0.04 × 0.25 × 0.04 · 0.00 | 8796 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/8d1c72d3042d.jpg) | [assets/asset_niva_1/bebyggelse/foremal/ratchet_wrench/ratchet_wrench_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/ratchet_wrench/ratchet_wrench_2k.gltf) |  |
| **A** | Rostig hacksaw * | Ej relevant | 0.50 × 0.11 × 0.03 · 0.00 | 6546 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/d55dda7da4e0.jpg) | [assets/asset_niva_1/bebyggelse/foremal/rusted_hacksaw/rusted_hacksaw_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/rusted_hacksaw/rusted_hacksaw_2k.gltf) |  |
| **A** | Rostig hjul rim 02 * | Ej relevant | 0.34 × 0.34 × 0.12 · 0.00 | 15256 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/5fad4e0b4e06.jpg) | [assets/asset_niva_1/bebyggelse/foremal/rusted_wheel_rim_02/rusted_wheel_rim_02_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/rusted_wheel_rim_02/rusted_wheel_rim_02_2k.gltf) |  |
| **A** | Runda trä bord 01 * | Ej relevant | 1.40 × 1.01 × 1.40 · 0.00 | 8640 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/17dc9011d642.jpg) | [assets/asset_niva_1/bebyggelse/foremal/round_wooden_table_01/round_wooden_table_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/round_wooden_table_01/round_wooden_table_01_2k.gltf) |  |
| **A** | Scandinavian masonry heater * | Ej relevant | 1.17 × 2.36 × 1.34 · 0.00 | 9350 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/6c42020e18d0.jpg) | [assets/asset_niva_1/bebyggelse/foremal/scandinavian_masonry_heater/scandinavian_masonry_heater_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/scandinavian_masonry_heater/scandinavian_masonry_heater_2k.gltf) |  |
| **A** | School stol 01 * | Ej relevant | 0.57 × 1.01 × 0.68 · 0.00 | 5072 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/fae719753a91.jpg) | [assets/asset_niva_1/bebyggelse/foremal/SchoolChair_01/SchoolChair_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/SchoolChair_01/SchoolChair_01_2k.gltf) |  |
| **A** | Screwdrivers 02 * | Ej relevant | 0.10 × 0.03 × 0.27 · 0.00 | 3548 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/56dde1876afe.jpg) | [assets/asset_niva_1/bebyggelse/foremal/screwdrivers_02/screwdrivers_02_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/screwdrivers_02/screwdrivers_02_2k.gltf) |  |
| **A** | Sida bord 01 * | Ej relevant | 0.55 × 0.55 × 0.45 · 0.00 | 2756 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/cf8884692d3d.jpg) | [assets/asset_niva_1/bebyggelse/foremal/side_table_01/side_table_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/side_table_01/side_table_01_2k.gltf) |  |
| **A** | Sida bord hög 01 * | Ej relevant | 0.38 × 0.76 × 0.38 · 0.00 | 6408 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/78e1db698b72.jpg) | [assets/asset_niva_1/bebyggelse/foremal/side_table_tall_01/side_table_tall_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/side_table_tall_01/side_table_tall_01_2k.gltf) |  |
| **A** | Sjömans kompass * | Ej relevant | 0.08 × 0.09 × 0.14 · 0.01 | 11645 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f2884efffade.jpg) | [assets/asset_niva_1/bebyggelse/foremal/seadogs_compass/seadogs_compass_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/seadogs_compass/seadogs_compass_2k.gltf) |  |
| **A** | Skruvmejsel * | Ej relevant | 0.03 × 0.21 × 0.03 · 0.00 | 3412 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/54b0fb9bb120.jpg) | [assets/asset_niva_1/bebyggelse/foremal/screwdriver/screwdriver_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/screwdriver/screwdriver_2k.gltf) |  |
| **A** | Spår skruvmejsel * | Ej relevant | 0.03 × 0.26 × 0.03 · 0.00 | 2300 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3ca795ba6899.jpg) | [assets/asset_niva_1/bebyggelse/foremal/flathead_screwdriver/flathead_screwdriver_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/flathead_screwdriver/flathead_screwdriver_2k.gltf) |  |
| **A** | Stege sectioned 01 * | Ej relevant | 0.66 × 2.13 × 0.18 · 0.01 | 29140 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/9d4c63b9592f.jpg) | [assets/asset_niva_1/bebyggelse/foremal/ladder_sectioned_01/ladder_sectioned_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/ladder_sectioned_01/ladder_sectioned_01_2k.gltf) |  |
| **A** | Stående picture ram 01 * | Ej relevant | 0.10 × 0.25 × 0.20 · 0.01 | 1634 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/82954c30943a.jpg) | [assets/asset_niva_1/bebyggelse/foremal/standing_picture_frame_01/standing_picture_frame_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/standing_picture_frame_01/standing_picture_frame_01_2k.gltf) |  |
| **A** | Stående skrivtavla 01 * | Ej relevant | 0.92 × 1.51 × 0.76 · 0.01 | 2372 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c282f1f5d38e.jpg) | [assets/asset_niva_1/bebyggelse/foremal/standing_chalkboard_01/standing_chalkboard_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/standing_chalkboard_01/standing_chalkboard_01_2k.gltf) |  |
| **A** | Stål ram shelves 02 * | Ej relevant | 0.59 × 2.14 × 0.50 · 0.00 | 4348 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/ed6daa443e1a.jpg) | [assets/asset_niva_1/bebyggelse/foremal/steel_frame_shelves_02/steel_frame_shelves_02_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/steel_frame_shelves_02/steel_frame_shelves_02_2k.gltf) |  |
| **A** | Stål ram shelves 03 * | Ej relevant | 2.35 × 2.31 × 0.72 · 0.01 | 8396 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/8ddba22d2fb8.jpg) | [assets/asset_niva_1/bebyggelse/foremal/steel_frame_shelves_03/steel_frame_shelves_03_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/steel_frame_shelves_03/steel_frame_shelves_03_2k.gltf) |  |
| **A** | Throw pillows 01 * | Ej relevant | 0.94 × 0.45 × 0.45 · 0.00 | 6362 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/aea00a7f70f1.jpg) | [assets/asset_niva_1/bebyggelse/foremal/throw_pillows_01/throw_pillows_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/throw_pillows_01/throw_pillows_01_2k.gltf) |  |
| **A** | Tire pump * | Ej relevant | 0.25 × 0.58 × 0.10 · 0.00 | 6572 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/9cb8f7b91781.jpg) | [assets/asset_niva_1/bebyggelse/foremal/tire_pump/tire_pump_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/tire_pump/tire_pump_2k.gltf) |  |
| **A** | Tongue groove tång * | Ej relevant | 0.06 × 0.01 × 0.24 · 0.00 | 2694 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c4d64dd81e0b.jpg) | [assets/asset_niva_1/bebyggelse/foremal/tongue_groove_pliers/tongue_groove_pliers_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/tongue_groove_pliers/tongue_groove_pliers_2k.gltf) |  |
| **A** | Tool cart * | Ej relevant | 1.27 × 0.96 × 0.75 · 0.00 | 29394 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b987bc69ed23.jpg) | [assets/asset_niva_1/bebyggelse/foremal/tool_cart/tool_cart_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/tool_cart/tool_cart_2k.gltf) |  |
| **A** | Trowel 01 * | Ej relevant | 0.10 × 0.10 × 0.35 · 0.00 | 5242 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/88e25f76eb01.jpg) | [assets/asset_niva_1/bebyggelse/foremal/trowel_01/trowel_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/trowel_01/trowel_01_2k.gltf) |  |
| **A** | Trä candlestick * | Ej relevant | 0.10 × 0.22 × 0.10 · 0.00 | 212992 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/aa0036efd45c.jpg) | [assets/asset_niva_1/bebyggelse/foremal/wooden_candlestick/wooden_candlestick_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/wooden_candlestick/wooden_candlestick_2k.gltf) |  |
| **A** | Trä display shelves 01 * | Ej relevant | 0.37 × 1.56 × 1.08 · 0.01 | 3174 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/a6552bfb2905.jpg) | [assets/asset_niva_1/bebyggelse/foremal/wooden_display_shelves_01/wooden_display_shelves_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/wooden_display_shelves_01/wooden_display_shelves_01_2k.gltf) |  |
| **A** | Trä pall 02 * | Ej relevant | 0.27 × 0.18 × 0.18 · 0.00 | 11146 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c8cda5acb1ad.jpg) | [assets/asset_niva_1/bebyggelse/foremal/wooden_stool_02/wooden_stool_02_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/wooden_stool_02/wooden_stool_02_2k.gltf) |  |
| **A** | Trä picknick bord * | Ej relevant | 2.24 × 0.75 × 3.02 · 0.01 | 10210 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/df5f37a919a8.jpg) | [assets/asset_niva_1/bebyggelse/foremal/wooden_picnic_table/wooden_picnic_table_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/wooden_picnic_table/wooden_picnic_table_2k.gltf) |  |
| **A** | Trä skål 01 * | Ej relevant | 0.31 × 0.09 × 0.31 · 0.00 | 14122 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e81b3b15c034.jpg) | [assets/asset_niva_1/bebyggelse/foremal/wooden_bowl_01/wooden_bowl_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/wooden_bowl_01/wooden_bowl_01_2k.gltf) |  |
| **A** | Trä stege 02 * | Ej relevant | 0.99 × 1.72 × 0.62 · 0.00 | 6126 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/6b4e468bd07c.jpg) | [assets/asset_niva_1/bebyggelse/foremal/wooden_ladder_02/wooden_ladder_02_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/wooden_ladder_02/wooden_ladder_02_2k.gltf) |  |
| **A** | Tunna 02 * | Ej relevant | 0.49 × 0.88 × 0.48 · 0.00 | 2688 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/065434a0bbf1.jpg) | [assets/asset_niva_1/bebyggelse/foremal/Barrel_02/Barrel_02_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/Barrel_02/Barrel_02_2k.gltf) |  |
| **A** | Tång * | Ej relevant | 0.06 × 0.18 × 0.02 · 0.01 | 4540 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/174cbe8acee7.jpg) | [assets/asset_niva_1/bebyggelse/foremal/pliers/pliers_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/pliers/pliers_2k.gltf) |  |
| **A** | Water manhole cover * | Ej relevant | 0.69 × 0.07 × 0.69 · 0.00 | 6301 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/36909eefc28f.jpg) | [assets/asset_niva_1/bebyggelse/foremal/water_manhole_cover/water_manhole_cover_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/water_manhole_cover/water_manhole_cover_2k.gltf) |  |
| **A** | Worn metall hylla * | Ej relevant | 0.92 × 1.90 × 0.60 · 0.00 | 6372 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/78373ecfe803.jpg) | [assets/asset_niva_1/bebyggelse/foremal/worn_metal_rack/worn_metal_rack_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/worn_metal_rack/worn_metal_rack_2k.gltf) |  |
| **A** | Yellow onion * | Ej relevant | 0.07 × 0.09 × 0.07 · 0.00 | 5444 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3715ee57b156.jpg) | [assets/asset_niva_1/bebyggelse/foremal/yellow_onion/yellow_onion_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/yellow_onion/yellow_onion_2k.gltf) |  |
| **A** | Äldre crutches 01 * | Ej relevant | 0.38 × 1.60 × 0.20 · 0.00 | 10628 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/d05314971736.jpg) | [assets/asset_niva_1/bebyggelse/foremal/vintage_crutches_01/vintage_crutches_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/vintage_crutches_01/vintage_crutches_01_2k.gltf) |  |
| **A** | Äldre hand drill * | Ej relevant | 0.13 × 0.49 × 0.13 · 0.01 | 8338 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/9b87d12b432b.jpg) | [assets/asset_niva_1/bebyggelse/foremal/vintage_hand_drill/vintage_hand_drill_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/vintage_hand_drill/vintage_hand_drill_2k.gltf) |  |
| **A** | Äldre lighter * | Ej relevant | 0.08 × 0.07 × 0.01 · 0.01 | 3366 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/35efbfc8f434.jpg) | [assets/asset_niva_1/bebyggelse/foremal/vintage_lighter/vintage_lighter_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/vintage_lighter/vintage_lighter_2k.gltf) |  |
| **A** | Äldre microscope * | Ej relevant | 0.11 × 0.40 × 0.18 · 0.01 | 20631 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/12d89c6b1232.jpg) | [assets/asset_niva_1/bebyggelse/foremal/vintage_microscope/vintage_microscope_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/vintage_microscope/vintage_microscope_2k.gltf) |  |
| **A** | Äldre stapler * | Ej relevant | 0.21 × 0.10 × 0.05 · 0.01 | 4370 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/206074b4e56c.jpg) | [assets/asset_niva_1/bebyggelse/foremal/vintage_stapler/vintage_stapler_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/vintage_stapler/vintage_stapler_2k.gltf) |  |
| **A** | Äldre telephone vägg klocka * | Ej relevant | 0.34 × 0.50 × 0.19 · 0.00 | 15864 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/570859bd2447.jpg) | [assets/asset_niva_1/bebyggelse/foremal/vintage_telephone_wall_clock/vintage_telephone_wall_clock_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/vintage_telephone_wall_clock/vintage_telephone_wall_clock_2k.gltf) |  |
| **B** | Hängande industri lampa * | Ej relevant | 0.55 × 1.36 × 0.55 · 0.01 | 9530 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/715b4d5a7992.jpg) | [assets/asset_niva_1/bebyggelse/foremal/hanging_industrial_lamp/hanging_industrial_lamp_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/hanging_industrial_lamp/hanging_industrial_lamp_2k.gltf) | Inte komplett färg/normal/MR på alla material |
| **B** | Hängande picture ram 01 * | Ej relevant | 0.59 × 0.84 × 0.02 · 0.01 | 2586 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/01e1bc3cb454.jpg) | [assets/asset_niva_1/bebyggelse/foremal/hanging_picture_frame_01/hanging_picture_frame_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/hanging_picture_frame_01/hanging_picture_frame_01_2k.gltf) | Inte komplett färg/normal/MR på alla material |
| **B** | Hängande picture ram 03 * | Ej relevant | 0.39 × 0.50 × 0.03 · 0.01 | 24348 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/508537c14b85.jpg) | [assets/asset_niva_1/bebyggelse/foremal/hanging_picture_frame_03/hanging_picture_frame_03_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/hanging_picture_frame_03/hanging_picture_frame_03_2k.gltf) | Inte komplett färg/normal/MR på alla material |
| **B** | Industri vägg sconce * | Ej relevant | 0.15 × 0.34 × 0.25 · 0.00 | 9826 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e615e943e70d.jpg) | [assets/asset_niva_1/bebyggelse/foremal/industrial_wall_sconce/industrial_wall_sconce_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/industrial_wall_sconce/industrial_wall_sconce_2k.gltf) | Inte komplett färg/normal/MR på alla material |
| **B** | Ljuskrona 01 * | Ej relevant | 0.75 × 0.80 × 0.82 · 0.00 | 26860 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/595df56a5073.jpg) | [assets/asset_niva_1/bebyggelse/foremal/Chandelier_01/Chandelier_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/Chandelier_01/Chandelier_01_2k.gltf) | Inte komplett färg/normal/MR på alla material |
| **B** | Ljuskrona 02 * | Ej relevant | 0.68 × 0.85 × 0.62 · 0.00 | 21514 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/440ca584edfe.jpg) | [assets/asset_niva_1/bebyggelse/foremal/Chandelier_02/Chandelier_02_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/Chandelier_02/Chandelier_02_2k.gltf) | Inte komplett färg/normal/MR på alla material |
| **B** | Lykta ljuskrona 01 * | Ej relevant | 0.58 × 0.88 × 0.57 · 0.01 | 5971 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/a3f2c9808dbc.jpg) | [assets/asset_niva_1/bebyggelse/foremal/lantern_chandelier_01/lantern_chandelier_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/lantern_chandelier_01/lantern_chandelier_01_2k.gltf) | Inte komplett färg/normal/MR på alla material |
| **B** | Magnifying glas 01 * | Ej relevant | 0.13 × 0.27 × 0.03 · 0.00 | 7240 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/d973b1ead3d1.jpg) | [assets/asset_niva_1/bebyggelse/foremal/magnifying_glass_01/magnifying_glass_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/magnifying_glass_01/magnifying_glass_01_2k.gltf) | Inte komplett färg/normal/MR på alla material |
| **B** | Modul fabrik facade * | Ej relevant | 53.33 × 29.00 × 5.36 · 0.37 | 175014 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/879f1bffdbbd.jpg) | [assets/asset_niva_1/bebyggelse/foremal/modular_factory_facade/modular_factory_facade_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/modular_factory_facade/modular_factory_facade_2k.gltf) | Skalan behöver kontrolleras |
| **B** | Mässing candleholders * | Ej relevant | 1.05 × 0.84 × 0.36 · 0.01 | 41936 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/05f499c7037a.jpg) | [assets/asset_niva_1/bebyggelse/foremal/brass_candleholders/brass_candleholders_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/brass_candleholders/brass_candleholders_2k.gltf) | Inte komplett färg/normal/MR på alla material |
| **B** | Stående picture ram 02 * | Ej relevant | 0.10 × 0.27 × 0.22 · 0.01 | 2986 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/68e10f40bd96.jpg) | [assets/asset_niva_1/bebyggelse/foremal/standing_picture_frame_02/standing_picture_frame_02_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/standing_picture_frame_02/standing_picture_frame_02_2k.gltf) | Inte komplett färg/normal/MR på alla material |
| **B** | Stål ram shelves 01 * | Ej relevant | 10.97 × 21.41 × 5.02 · 0.00 | 4348 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/83b88d33486d.jpg) | [assets/asset_niva_1/bebyggelse/foremal/steel_frame_shelves_01/steel_frame_shelves_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/steel_frame_shelves_01/steel_frame_shelves_01_2k.gltf) | Skalan behöver kontrolleras |
| **B** | Trä broom * | Ej relevant | 0.49 × 1.45 × 0.11 · 0.01 | 14258 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/6464be293ab4.jpg) | [assets/asset_niva_1/bebyggelse/foremal/wooden_broom/wooden_broom_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/wooden_broom/wooden_broom_2k.gltf) | Inte komplett färg/normal/MR på alla material |
| **B** | Vägg klocka * | Ej relevant | 0.32 × 0.32 × 0.05 · 0.01 | 3658 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/66ddde6e7541.jpg) | [assets/asset_niva_1/bebyggelse/foremal/wall_clock/wall_clock_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/wall_clock/wall_clock_2k.gltf) | Inte komplett färg/normal/MR på alla material |
| **B** | Wine bottles 01 * | Ej relevant | 0.68 × 0.33 × 0.08 · 0.03 | 28848 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/bf413a3c3f11.jpg) | [assets/asset_niva_1/bebyggelse/foremal/wine_bottles_01/wine_bottles_01_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/wine_bottles_01/wine_bottles_01_2k.gltf) | Inte komplett färg/normal/MR på alla material |
| **B** | Äldre fick ur * | Ej relevant | 0.06 × 0.08 × 0.01 · 0.01 | 16098 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3ed29b2c7afd.jpg) | [assets/asset_niva_1/bebyggelse/foremal/vintage_pocket_watch/vintage_pocket_watch_2k.gltf](../assets/asset_niva_1/bebyggelse/foremal/vintage_pocket_watch/vintage_pocket_watch_2k.gltf) | Inte komplett färg/normal/MR på alla material |

## Handvapen
| Nivå | Svenskt namn (härlett/gissning *) | Land | Mått x/y/z m · MB | Tri | LOD | Animation/ljud | Bild | Sökväg | Kvar |
|---|---|---|---|---|---|---|---|---|---|
| **C** | Panzerschreck tactical beard * | Tyskland | 0.39 × 0.44 × 1.64 · 5.45 | 5346 | Ja | 0 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/40f2ad1d2605.jpg) | [assets/asset_niva_1/enheter/vapen/panzerschreck_tactical_beard/panzerschreck_tactical_beard_v2_pbr.glb](../assets/asset_niva_1/enheter/vapen/panzerschreck_tactical_beard/panzerschreck_tactical_beard_v2_pbr.glb) | Texturerad modellvy inte stickprovad; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd; Väsentlig koppling/animation/besättning återstår |
| **C** | Sten mk2 * | Storbritannien | 0.28 × 0.20 × 0.76 · 10.72 | 6632 | Ja | 0 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/d2e167a7a63e.jpg) | [assets/asset_niva_1/enheter/vapen/sten-mk2/sten-mk2_v2_pbr.glb](../assets/asset_niva_1/enheter/vapen/sten-mk2/sten-mk2_v2_pbr.glb) | Texturerad modellvy inte stickprovad; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd; Väsentlig koppling/animation/besättning återstår |
| **C** | Sten mk2 foxxassets * | Storbritannien | 0.23 × 0.20 × 0.76 · 3.04 | 5462 | Ja | 0 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/6257737dc94d.jpg) | [assets/asset_niva_1/enheter/vapen/sten_mk2_foxxassets/sten_mk2_foxxassets_v2_pbr.glb](../assets/asset_niva_1/enheter/vapen/sten_mk2_foxxassets/sten_mk2_foxxassets_v2_pbr.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd; Väsentlig koppling/animation/besättning återstår |

## Hus
| Nivå | Svenskt namn (härlett/gissning *) | Land | Mått x/y/z m · MB | Tri | LOD | Animation/ljud | Bild | Sökväg | Kvar |
|---|---|---|---|---|---|---|---|---|---|
| **B** | Byggnad hus * | Ej relevant | 40.00 × 24.00 × 46.19 · 0.04 | 352 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/31109eeaebc8.jpg) | [assets/asset_niva_1/terrang/stad/hus/building_house.glb](../assets/asset_niva_1/terrang/stad/hus/building_house.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Newc42 hus * | Ej relevant | 7.01 × 6.00 × 7.42 · 0.04 | 566 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/edf703d46aa3.jpg) | [assets/asset_niva_1/terrang/stad/hus/newc42_house.glb](../assets/asset_niva_1/terrang/stad/hus/newc42_house.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Normandiskt hus BH01 * | Ej relevant | 7.00 × 6.00 × 9.00 · 10.69 | 8201 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c75d3ff913c6.jpg) | [assets/asset_niva_1/terrang/stad/hus/BH01_normandie_01_pbr.glb](../assets/asset_niva_1/terrang/stad/hus/BH01_normandie_01_pbr.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Raserad gårdshus * | Ej relevant | 4.78 × 3.92 × 6.99 · 2.07 | 835 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3f583a0b2e77.jpg) | [assets/asset_niva_1/terrang/stad/hus/ruined_farmhouse_pbr.glb](../assets/asset_niva_1/terrang/stad/hus/ruined_farmhouse_pbr.glb) | Texturerad modellvy inte stickprovad |
| **C** | Affärs byggnad * | Ej relevant | 20.15 × 10.00 × 15.96 · 0.54 | 8556 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/5ec7fdf61ee7.jpg) | [assets/asset_niva_1/terrang/stad/hus/business_building.glb](../assets/asset_niva_1/terrang/stad/hus/business_building.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Byhus * | Ej relevant | 28.15 × 30.72 × 9.70 · 0.07 | 730 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/856f8015b8f3.jpg) | [assets/asset_niva_1/terrang/stad/hus/byhus_L0.glb](../assets/asset_niva_1/terrang/stad/hus/byhus_L0.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Förråd hus * | Ej relevant | 12.96 × 7.00 × 9.84 · 0.56 | 8744 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/82f1f779f005.jpg) | [assets/asset_niva_1/terrang/stad/hus/storage_house.glb](../assets/asset_niva_1/terrang/stad/hus/storage_house.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Hus a * | Ej relevant | 9.10 × 8.00 × 12.27 · 0.06 | 1028 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/60149d9783c3.jpg) | [assets/asset_niva_1/terrang/stad/hus/house_a.glb](../assets/asset_niva_1/terrang/stad/hus/house_a.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Hus b * | Ej relevant | 9.31 × 8.00 × 9.85 · 0.16 | 3504 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c3739b6fbd9f.jpg) | [assets/asset_niva_1/terrang/stad/hus/house_b.glb](../assets/asset_niva_1/terrang/stad/hus/house_b.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Hus c * | Ej relevant | 9.16 × 8.00 × 9.16 · 0.05 | 964 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/59c1d4d83a80.jpg) | [assets/asset_niva_1/terrang/stad/hus/house_c.glb](../assets/asset_niva_1/terrang/stad/hus/house_c.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Hus d * | Ej relevant | 13.09 × 8.00 × 9.92 · 0.18 | 4012 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/7497d8247f55.jpg) | [assets/asset_niva_1/terrang/stad/hus/house_d.glb](../assets/asset_niva_1/terrang/stad/hus/house_d.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Hus e * | Ej relevant | 7.51 × 8.00 × 6.86 · 0.08 | 1548 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/1eb7723bbc9c.jpg) | [assets/asset_niva_1/terrang/stad/hus/house_e.glb](../assets/asset_niva_1/terrang/stad/hus/house_e.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Hus f * | Ej relevant | 9.22 × 8.00 × 8.96 · 0.11 | 2336 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/6a21dcfa7618.jpg) | [assets/asset_niva_1/terrang/stad/hus/house_f.glb](../assets/asset_niva_1/terrang/stad/hus/house_f.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Hus g * | Ej relevant | 5.81 × 8.00 × 7.65 · 0.15 | 2716 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e8cd5bf7ca80.jpg) | [assets/asset_niva_1/terrang/stad/hus/house_g.glb](../assets/asset_niva_1/terrang/stad/hus/house_g.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Husgrupp grupp * | Ej relevant | 18.13 × 9.00 × 17.78 · 0.26 | 5948 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/a5dbfb271b68.jpg) | [assets/asset_niva_1/terrang/stad/hus/houses_group.glb](../assets/asset_niva_1/terrang/stad/hus/houses_group.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Husgrupp par * | Ej relevant | 18.32 × 8.00 × 19.78 · 0.11 | 2404 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/51fe8cfb50ae.jpg) | [assets/asset_niva_1/terrang/stad/hus/houses_pair.glb](../assets/asset_niva_1/terrang/stad/hus/houses_pair.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Husgrupp rad * | Ej relevant | 11.45 × 9.00 × 12.37 · 0.16 | 3492 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/783cfbc76dd4.jpg) | [assets/asset_niva_1/terrang/stad/hus/houses_row.glb](../assets/asset_niva_1/terrang/stad/hus/houses_row.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Radhus d * | Ej relevant | 19.70 × 10.35 × 7.70 · 0.02 | 246 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/6087be7f9a2b.jpg) | [assets/asset_niva_1/terrang/stad/hus/radhus_d_L0.glb](../assets/asset_niva_1/terrang/stad/hus/radhus_d_L0.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Ruin hus * | Ej relevant | 7.72 × 5.00 × 7.98 · 0.26 | 2524 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/185ae2e37bee.jpg) | [assets/asset_niva_1/terrang/stad/hus/ruin_house.glb](../assets/asset_niva_1/terrang/stad/hus/ruin_house.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Silo hus * | Ej relevant | 7.07 × 12.00 × 4.65 · 0.13 | 2880 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/7f04ca1196c0.jpg) | [assets/asset_niva_1/terrang/stad/hus/silo_house.glb](../assets/asset_niva_1/terrang/stad/hus/silo_house.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Stenhus a * | Ej relevant | 10.70 × 9.97 × 6.90 · 0.01 | 130 | Nej | 0 klipp; Ej relevant | ![](tumnaglar/8be2a2bca890.jpg) | [assets/asset_niva_1/terrang/stad/hus/stenhus_a_L0.glb](../assets/asset_niva_1/terrang/stad/hus/stenhus_a_L0.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; LOD1 + LOD2 + billboard/impostor inte komplett; Texturerad modellvy inte stickprovad |
| **C** | Stenhus b * | Ej relevant | 8.70 × 8.70 × 6.70 · 0.01 | 66 | Nej | 0 klipp; Ej relevant | ![](tumnaglar/b85a9666bfa6.jpg) | [assets/asset_niva_1/terrang/stad/hus/stenhus_b_L0.glb](../assets/asset_niva_1/terrang/stad/hus/stenhus_b_L0.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; LOD1 + LOD2 + billboard/impostor inte komplett; Texturerad modellvy inte stickprovad |
| **C** | Stenhus c * | Ej relevant | 13.70 × 10.32 × 7.70 · 0.02 | 182 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3465498a9b33.jpg) | [assets/asset_niva_1/terrang/stad/hus/stenhus_c_L0.glb](../assets/asset_niva_1/terrang/stad/hus/stenhus_c_L0.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |

## Kyrka/kyrkdel
| Nivå | Svenskt namn (härlett/gissning *) | Land | Mått x/y/z m · MB | Tri | LOD | Animation/ljud | Bild | Sökväg | Kvar |
|---|---|---|---|---|---|---|---|---|---|
| **B** | Grave cross * | Ej relevant | 0.77 × 1.20 × 0.29 · 0.02 | 158 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/489ce2af8159.jpg) | [assets/asset_niva_1/terrang/stad/kyrka/grave_cross.glb](../assets/asset_niva_1/terrang/stad/kyrka/grave_cross.glb) | Inte komplett färg/normal/MR på alla material; Skalan behöver kontrolleras; Texturerad modellvy inte stickprovad |
| **B** | Grave cross trä * | Ej relevant | 0.49 × 1.20 × 0.49 · 0.02 | 126 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c8c455bfeac3.jpg) | [assets/asset_niva_1/terrang/stad/kyrka/grave_cross_wood.glb](../assets/asset_niva_1/terrang/stad/kyrka/grave_cross_wood.glb) | Inte komplett färg/normal/MR på alla material; Skalan behöver kontrolleras; Texturerad modellvy inte stickprovad |
| **B** | Grave crypt * | Ej relevant | 3.94 × 4.00 × 6.10 · 0.03 | 252 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3d99c5bd2cb6.jpg) | [assets/asset_niva_1/terrang/stad/kyrka/grave_crypt.glb](../assets/asset_niva_1/terrang/stad/kyrka/grave_crypt.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Grave grave * | Ej relevant | 7.62 × 1.20 × 13.06 · 0.03 | 256 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/363ddd6adac0.jpg) | [assets/asset_niva_1/terrang/stad/kyrka/grave_grave.glb](../assets/asset_niva_1/terrang/stad/kyrka/grave_grave.glb) | Inte komplett färg/normal/MR på alla material; Skalan behöver kontrolleras; Texturerad modellvy inte stickprovad |
| **B** | Grave gravestone broken * | Ej relevant | 1.79 × 1.20 × 1.38 · 0.02 | 134 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/45fe8903a135.jpg) | [assets/asset_niva_1/terrang/stad/kyrka/grave_gravestone_broken.glb](../assets/asset_niva_1/terrang/stad/kyrka/grave_gravestone_broken.glb) | Inte komplett färg/normal/MR på alla material; Skalan behöver kontrolleras; Texturerad modellvy inte stickprovad |
| **B** | Grave gravestone cross * | Ej relevant | 0.59 × 1.20 × 0.43 · 0.03 | 222 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/0325b966638f.jpg) | [assets/asset_niva_1/terrang/stad/kyrka/grave_gravestone_cross.glb](../assets/asset_niva_1/terrang/stad/kyrka/grave_gravestone_cross.glb) | Inte komplett färg/normal/MR på alla material; Skalan behöver kontrolleras; Texturerad modellvy inte stickprovad |
| **B** | Grave gravestone runda * | Ej relevant | 0.94 × 1.20 × 0.52 · 0.02 | 178 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/64df5b17c27d.jpg) | [assets/asset_niva_1/terrang/stad/kyrka/grave_gravestone_round.glb](../assets/asset_niva_1/terrang/stad/kyrka/grave_gravestone_round.glb) | Inte komplett färg/normal/MR på alla material; Skalan behöver kontrolleras; Texturerad modellvy inte stickprovad |
| **B** | Grave järn staket * | Ej relevant | 3.00 × 2.64 × 0.33 · 0.04 | 376 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/36c7a6e98835.jpg) | [assets/asset_niva_1/terrang/stad/kyrka/grave_iron_fence.glb](../assets/asset_niva_1/terrang/stad/kyrka/grave_iron_fence.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Grave järn staket border * | Ej relevant | 3.00 × 2.64 × 0.45 · 0.04 | 380 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/526a6537fb8a.jpg) | [assets/asset_niva_1/terrang/stad/kyrka/grave_iron_fence_border.glb](../assets/asset_niva_1/terrang/stad/kyrka/grave_iron_fence_border.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Grave järn staket border grind * | Ej relevant | 3.00 × 2.28 × 0.66 · 0.03 | 256 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f1e238218514.jpg) | [assets/asset_niva_1/terrang/stad/kyrka/grave_iron_fence_border_gate.glb](../assets/asset_niva_1/terrang/stad/kyrka/grave_iron_fence_border_gate.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Grave järn staket damaged * | Ej relevant | 3.00 × 2.64 × 0.97 · 0.04 | 336 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/5fcff3c2eb3b.jpg) | [assets/asset_niva_1/terrang/stad/kyrka/grave_iron_fence_damaged.glb](../assets/asset_niva_1/terrang/stad/kyrka/grave_iron_fence_damaged.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Grave lightpost enkel * | Ej relevant | 0.66 × 4.00 × 1.47 · 0.04 | 352 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/7431b3481c5c.jpg) | [assets/asset_niva_1/terrang/stad/kyrka/grave_lightpost_single.glb](../assets/asset_niva_1/terrang/stad/kyrka/grave_lightpost_single.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Grave staket * | Ej relevant | 3.00 × 1.86 × 0.55 · 0.04 | 432 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e7edcbf2bceb.jpg) | [assets/asset_niva_1/terrang/stad/kyrka/grave_fence.glb](../assets/asset_niva_1/terrang/stad/kyrka/grave_fence.glb) | Inte komplett färg/normal/MR på alla material; Skalan behöver kontrolleras; Texturerad modellvy inte stickprovad |
| **B** | Grave staket damaged * | Ej relevant | 3.00 × 1.86 × 0.94 · 0.03 | 320 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b011f0bcc1a2.jpg) | [assets/asset_niva_1/terrang/stad/kyrka/grave_fence_damaged.glb](../assets/asset_niva_1/terrang/stad/kyrka/grave_fence_damaged.glb) | Inte komplett färg/normal/MR på alla material; Skalan behöver kontrolleras; Texturerad modellvy inte stickprovad |
| **B** | Grave staket grind * | Ej relevant | 3.00 × 1.86 × 0.61 · 0.03 | 296 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/ff03e4d48b4c.jpg) | [assets/asset_niva_1/terrang/stad/kyrka/grave_fence_gate.glb](../assets/asset_niva_1/terrang/stad/kyrka/grave_fence_gate.glb) | Inte komplett färg/normal/MR på alla material; Skalan behöver kontrolleras; Texturerad modellvy inte stickprovad |
| **B** | Kapell * | Ej relevant | 8.73 × 10.00 × 14.28 · 4.23 | 1292 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/463a498d78a9.jpg) | [assets/asset_niva_1/terrang/stad/kyrka/chapel_pbr.glb](../assets/asset_niva_1/terrang/stad/kyrka/chapel_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Kyrka * | Ej relevant | 16.13 × 38.40 × 39.80 · 1.95 | 25920 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/0c6e07f9cd99.jpg) | [assets/asset_niva_1/terrang/stad/kyrka/church.glb](../assets/asset_niva_1/terrang/stad/kyrka/church.glb) | Texturerad modellvy inte stickprovad |
| **B** | Kyrka a * | Ej relevant | 8.20 × 18.00 × 15.30 · 3.45 | 1370 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/05d81fdea360.jpg) | [assets/asset_niva_1/terrang/stad/kyrka/church_a_pbr.glb](../assets/asset_niva_1/terrang/stad/kyrka/church_a_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Kyrka b * | Ej relevant | 11.19 × 18.00 × 11.88 · 3.39 | 760 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/45929d5b6bb6.jpg) | [assets/asset_niva_1/terrang/stad/kyrka/church_b_pbr.glb](../assets/asset_niva_1/terrang/stad/kyrka/church_b_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Kyrka c * | Ej relevant | 8.95 × 20.00 × 16.20 · 3.40 | 1470 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/448e2cac8ad2.jpg) | [assets/asset_niva_1/terrang/stad/kyrka/church_c_pbr.glb](../assets/asset_niva_1/terrang/stad/kyrka/church_c_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Kyrka creativetrio * | Ej relevant | 8.07 × 18.00 × 13.45 · 0.22 | 2265 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/cf6363ad4f40.jpg) | [assets/asset_niva_1/terrang/stad/kyrka/church_creativetrio.glb](../assets/asset_niva_1/terrang/stad/kyrka/church_creativetrio.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Kyrka d * | Ej relevant | 17.14 × 20.00 × 6.88 · 4.48 | 4014 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c718b9197035.jpg) | [assets/asset_niva_1/terrang/stad/kyrka/church_d_pbr.glb](../assets/asset_niva_1/terrang/stad/kyrka/church_d_pbr.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Bell torn * | Ej relevant | 5.70 × 14.00 × 6.55 · 0.73 | 11799 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b49f8a7be3d3.jpg) | [assets/asset_niva_1/terrang/stad/kyrka/bell_tower.glb](../assets/asset_niva_1/terrang/stad/kyrka/bell_tower.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Klocktorn * | Ej relevant | 5.70 × 14.00 × 6.55 · 0.14 | 11799 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c890cb91b293.jpg) | [assets/asset_niva_1/terrang/stad/kyrka/klocktorn_L0.glb](../assets/asset_niva_1/terrang/stad/kyrka/klocktorn_L0.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **C** | Kyrka * | Ej relevant | 28.15 × 30.72 × 9.70 · 0.01 | 106 | Nej | 0 klipp; Ej relevant | ![](tumnaglar/105cb3101325.jpg) | [assets/asset_niva_1/terrang/stad/kyrka/kyrka_L0.glb](../assets/asset_niva_1/terrang/stad/kyrka/kyrka_L0.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; LOD1 + LOD2 + billboard/impostor inte komplett; Texturerad modellvy inte stickprovad |

## Möbel
| Nivå | Svenskt namn (härlett/gissning *) | Land | Mått x/y/z m · MB | Tri | LOD | Animation/ljud | Bild | Sökväg | Kvar |
|---|---|---|---|---|---|---|---|---|---|
| **B** | Folding trä pall * | Ej relevant | 0.53 × 0.44 × 0.55 · 2.27 | 6324 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/d84013415dc4.jpg) | [assets/asset_niva_1/bebyggelse/mobler/folding_wooden_stool/folding_wooden_stool_v2_pbr.glb](../assets/asset_niva_1/bebyggelse/mobler/folding_wooden_stool/folding_wooden_stool_v2_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Gammal säng ram * | Ej relevant | 0.90 × 1.20 × 2.00 · 4.04 | 49990 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/97380d404e7e.jpg) | [assets/asset_niva_1/bebyggelse/mobler/old_bed_frame/old_bed_frame_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/mobler/old_bed_frame/old_bed_frame_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Kanna emalj 01 * | Ej relevant | 0.26 × 0.18 × 0.18 · 1.74 | 11416 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/6f5292f32495.jpg) | [assets/asset_niva_1/bebyggelse/mobler/pot_enamel_01/pot_enamel_01_v2_pbr.glb](../assets/asset_niva_1/bebyggelse/mobler/pot_enamel_01/pot_enamel_01_v2_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Målad trä bord * | Ej relevant | 2.41 × 0.96 × 1.14 · 1.78 | 600 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/92aa9c7fb36b.jpg) | [assets/asset_niva_1/bebyggelse/mobler/painted_wooden_table/painted_wooden_table_v2_pbr.glb](../assets/asset_niva_1/bebyggelse/mobler/painted_wooden_table/painted_wooden_table_v2_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Målad trä bänk * | Ej relevant | 1.16 × 0.89 × 0.50 · 1.99 | 630 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/8ba21ede0e67.jpg) | [assets/asset_niva_1/bebyggelse/mobler/painted_wooden_bench/painted_wooden_bench_v2_pbr.glb](../assets/asset_niva_1/bebyggelse/mobler/painted_wooden_bench/painted_wooden_bench_v2_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Målad trä stol 01 * | Ej relevant | 0.43 × 0.96 × 0.54 · 0.49 | 724 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/9ea9b6c6223c.jpg) | [assets/asset_niva_1/bebyggelse/mobler/painted_wooden_chair_01/painted_wooden_chair_01_v2_pbr.glb](../assets/asset_niva_1/bebyggelse/mobler/painted_wooden_chair_01/painted_wooden_chair_01_v2_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Spinn hjul 01 * | Ej relevant | 0.49 × 0.97 × 1.02 · 2.12 | 52023 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/19e11be47cee.jpg) | [assets/asset_niva_1/bebyggelse/mobler/spinning_wheel_01/spinning_wheel_01_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/mobler/spinning_wheel_01/spinning_wheel_01_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Trä bord 01 * | Ej relevant | 1.80 × 0.55 × 0.66 · 0.55 | 952 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/2e0de2fd6c59.jpg) | [assets/asset_niva_1/bebyggelse/mobler/WoodenTable_01/WoodenTable_01_v2_pbr.glb](../assets/asset_niva_1/bebyggelse/mobler/WoodenTable_01/WoodenTable_01_v2_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Trä pall 01 * | Ej relevant | 0.43 × 0.44 × 0.44 · 2.13 | 10946 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/00cb27a193c8.jpg) | [assets/asset_niva_1/bebyggelse/mobler/wooden_stool_01/wooden_stool_01_v2_pbr.glb](../assets/asset_niva_1/bebyggelse/mobler/wooden_stool_01/wooden_stool_01_v2_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Äldre olja lampa * | Ej relevant | 0.22 × 0.80 × 0.22 · 2.16 | 7208 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/23c474305aad.jpg) | [assets/asset_niva_1/bebyggelse/mobler/vintage_oil_lamp/vintage_oil_lamp_v2_pbr.glb](../assets/asset_niva_1/bebyggelse/mobler/vintage_oil_lamp/vintage_oil_lamp_v2_pbr.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Äldre resväska * | Ej relevant | 1.61 × 0.57 × 0.24 · 4.33 | 16474 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c5e4a5a7a101.jpg) | [assets/asset_niva_1/bebyggelse/mobler/vintage_suitcase/vintage_suitcase_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/mobler/vintage_suitcase/vintage_suitcase_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Äldre trä låda 01 * | Ej relevant | 1.72 × 1.09 × 1.01 · 2.08 | 5184 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b517ff2710eb.jpg) | [assets/asset_niva_1/bebyggelse/mobler/vintage_wooden_drawer_01/vintage_wooden_drawer_01_v3_pbr.glb](../assets/asset_niva_1/bebyggelse/mobler/vintage_wooden_drawer_01/vintage_wooden_drawer_01_v3_pbr.glb) | Texturerad modellvy inte stickprovad |

## Småväxt/undervegetation
| Nivå | Svenskt namn (härlett/gissning *) | Land | Mått x/y/z m · MB | Tri | LOD | Animation/ljud | Bild | Sökväg | Kvar |
|---|---|---|---|---|---|---|---|---|---|
| **B** | Celandine 01 * | Ej relevant | 2.24 × 0.19 × 0.31 · 1.52 | 8966 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b4113f217309.jpg) | [assets/asset_niva_1/terrang/smavaxter/celandine_01/celandine_01.glb](../assets/asset_niva_1/terrang/smavaxter/celandine_01/celandine_01.glb) | Texturerad modellvy inte stickprovad |
| **B** | Ormbunke 02 * | Ej relevant | 1.97 × 0.43 × 1.72 · 2.19 | 6232 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/6212cafc1682.jpg) | [assets/asset_niva_1/terrang/smavaxter/fern_02/fern_02_v2.glb](../assets/asset_niva_1/terrang/smavaxter/fern_02/fern_02_v2.glb) | Texturerad modellvy inte stickprovad |
| **B** | Skog blåbärsris * | Ej relevant | 0.45 × 0.45 × 0.39 · 0.00 | 12 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/a35d1b8702ea.jpg) | [assets/asset_niva_1/terrang/kit/skog_gemensamt/undervaxt/skog_blabarsris.gltf](../assets/asset_niva_1/terrang/kit/skog_gemensamt/undervaxt/skog_blabarsris.gltf) | Texturerad modellvy inte stickprovad |
| **B** | Skog gransly * | Ej relevant | 0.75 × 1.50 × 0.65 · 0.00 | 12 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/17ac2b43d7d0.jpg) | [assets/asset_niva_1/terrang/kit/skog_gemensamt/undervaxt/skog_gransly.gltf](../assets/asset_niva_1/terrang/kit/skog_gemensamt/undervaxt/skog_gransly.gltf) | Texturerad modellvy inte stickprovad |
| **B** | Skog grastuva * | Ej relevant | 0.70 × 0.35 × 0.61 · 0.00 | 12 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/a736f6f355e9.jpg) | [assets/asset_niva_1/terrang/kit/skog_gemensamt/undervaxt/skog_grastuva.gltf](../assets/asset_niva_1/terrang/kit/skog_gemensamt/undervaxt/skog_grastuva.gltf) | Texturerad modellvy inte stickprovad |
| **B** | Skog grastuva torr * | Ej relevant | 0.70 × 0.35 × 0.61 · 0.00 | 12 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/8f01500c7a0b.jpg) | [assets/asset_niva_1/terrang/kit/skog_gemensamt/undervaxt/skog_grastuva_torr.gltf](../assets/asset_niva_1/terrang/kit/skog_gemensamt/undervaxt/skog_grastuva_torr.gltf) | Texturerad modellvy inte stickprovad |
| **B** | Skog lövsly * | Ej relevant | 1.00 × 2.00 × 0.87 · 0.00 | 12 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e9eff2eaf94c.jpg) | [assets/asset_niva_1/terrang/kit/skog_gemensamt/undervaxt/skog_lovsly.gltf](../assets/asset_niva_1/terrang/kit/skog_gemensamt/undervaxt/skog_lovsly.gltf) | Texturerad modellvy inte stickprovad |
| **B** | Skog nässla hundkex * | Ej relevant | 0.60 × 1.20 × 0.60 · 0.00 | 8 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/4af10f535081.jpg) | [assets/asset_niva_1/terrang/kit/skog_gemensamt/undervaxt/skog_nassla_hundkex.gltf](../assets/asset_niva_1/terrang/kit/skog_gemensamt/undervaxt/skog_nassla_hundkex.gltf) | Texturerad modellvy inte stickprovad |
| **B** | Skog ormbunke liten * | Ej relevant | 0.91 × 0.44 × 0.86 · 0.00 | 40 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b1b9804d9e9e.jpg) | [assets/asset_niva_1/terrang/kit/skog_gemensamt/undervaxt/skog_ormbunke_liten.gltf](../assets/asset_niva_1/terrang/kit/skog_gemensamt/undervaxt/skog_ormbunke_liten.gltf) | Texturerad modellvy inte stickprovad |
| **B** | Skog ormbunke stor * | Ej relevant | 1.48 × 0.71 × 1.45 · 0.00 | 56 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/17ebc6ad4a35.jpg) | [assets/asset_niva_1/terrang/kit/skog_gemensamt/undervaxt/skog_ormbunke_stor.gltf](../assets/asset_niva_1/terrang/kit/skog_gemensamt/undervaxt/skog_ormbunke_stor.gltf) | Texturerad modellvy inte stickprovad |
| **B** | Skog tallsly * | Ej relevant | 0.60 × 1.20 × 0.52 · 0.00 | 12 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/10f77ecbb063.jpg) | [assets/asset_niva_1/terrang/kit/skog_gemensamt/undervaxt/skog_tallsly.gltf](../assets/asset_niva_1/terrang/kit/skog_gemensamt/undervaxt/skog_tallsly.gltf) | Texturerad modellvy inte stickprovad |
| **C** | Skog kvistar barr dekal * | Ej relevant | 1.00 × 0.00 × 1.00 · 0.00 | 4 | Nej | 0 klipp; Ej relevant | ![](tumnaglar/6d0442f6cdf9.jpg) | [assets/asset_niva_1/terrang/kit/skog_gemensamt/undervaxt/skog_kvistar_barr_dekal.gltf](../assets/asset_niva_1/terrang/kit/skog_gemensamt/undervaxt/skog_kvistar_barr_dekal.gltf) | LOD1 + LOD2 + billboard/impostor inte komplett; Skala orimlig; Texturerad modellvy inte stickprovad |

## Sten/klippa
| Nivå | Svenskt namn (härlett/gissning *) | Land | Mått x/y/z m · MB | Tri | LOD | Animation/ljud | Bild | Sökväg | Kvar |
|---|---|---|---|---|---|---|---|---|---|
| **B** | Kust klippa 01 * | Ej relevant | 91.98 × 10.33 × 10.97 · 20.88 | 461824 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f6314f3b5395.jpg) | [assets/asset_niva_1/terrang/stenar/coastal_cliff_01/coastal_cliff_01_pivot_fot.glb](../assets/asset_niva_1/terrang/stenar/coastal_cliff_01/coastal_cliff_01_pivot_fot.glb) | Texturerad modellvy inte stickprovad |
| **B** | Kust klippa 02 * | Ej relevant | 40.93 × 10.05 × 8.65 · 35.79 | 943284 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/efb6525f2e07.jpg) | [assets/asset_niva_1/terrang/stenar/coastal_cliff_02/coastal_cliff_02_pivot_fot.glb](../assets/asset_niva_1/terrang/stenar/coastal_cliff_02/coastal_cliff_02_pivot_fot.glb) | Texturerad modellvy inte stickprovad |
| **B** | Kust klippa 04 * | Ej relevant | 86.77 × 11.00 × 24.25 · 54.09 | 1537926 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/72df1a62cfc0.jpg) | [assets/asset_niva_1/terrang/stenar/coastal_cliff_04/coastal_cliff_04_pivot_fot.glb](../assets/asset_niva_1/terrang/stenar/coastal_cliff_04/coastal_cliff_04_pivot_fot.glb) | Texturerad modellvy inte stickprovad |
| **B** | Kust land stenar 02 * | Ej relevant | 4.89 × 1.40 × 10.45 · 47.54 | 1291146 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3e51c3873408.jpg) | [assets/asset_niva_1/terrang/stenar/coast_land_rocks_02/coast_land_rocks_02_pivot_fot.glb](../assets/asset_niva_1/terrang/stenar/coast_land_rocks_02/coast_land_rocks_02_pivot_fot.glb) | Texturerad modellvy inte stickprovad |
| **B** | Kust land stenar 03 * | Ej relevant | 8.98 × 1.53 × 5.63 · 41.62 | 1096655 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/77a6926afe06.jpg) | [assets/asset_niva_1/terrang/stenar/coast_land_rocks_03/coast_land_rocks_03_pivot_fot.glb](../assets/asset_niva_1/terrang/stenar/coast_land_rocks_03/coast_land_rocks_03_pivot_fot.glb) | Texturerad modellvy inte stickprovad |
| **B** | Kust land stenar 04 * | Ej relevant | 9.96 × 0.85 × 11.50 · 41.40 | 1086668 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/5a24bfe56b81.jpg) | [assets/asset_niva_1/terrang/stenar/coast_land_rocks_04/coast_land_rocks_04_pivot_fot.glb](../assets/asset_niva_1/terrang/stenar/coast_land_rocks_04/coast_land_rocks_04_pivot_fot.glb) | Texturerad modellvy inte stickprovad |
| **B** | Kust line 01 * | Ej relevant | 54.61 × 2.63 × 42.96 · 25.08 | 539491 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/6c411300b567.jpg) | [assets/asset_niva_1/terrang/stenar/coast_line_01/coast_line_01_pivot_fot.glb](../assets/asset_niva_1/terrang/stenar/coast_line_01/coast_line_01_pivot_fot.glb) | Texturerad modellvy inte stickprovad |
| **B** | Kust line 02 * | Ej relevant | 45.64 × 2.29 × 23.28 · 31.06 | 756940 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/0e2f58d278dd.jpg) | [assets/asset_niva_1/terrang/stenar/coast_line_02/coast_line_02_pivot_fot.glb](../assets/asset_niva_1/terrang/stenar/coast_line_02/coast_line_02_pivot_fot.glb) | Texturerad modellvy inte stickprovad |
| **B** | Kust stenar 01 * | Ej relevant | 59.51 × 3.29 × 42.52 · 28.61 | 679936 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/4978a8a64f62.jpg) | [assets/asset_niva_1/terrang/stenar/coast_rocks_01/coast_rocks_01_pivot_fot.glb](../assets/asset_niva_1/terrang/stenar/coast_rocks_01/coast_rocks_01_pivot_fot.glb) | Texturerad modellvy inte stickprovad |
| **B** | Kust stenar 02 * | Ej relevant | 45.96 × 3.17 × 49.46 · 46.13 | 1260423 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e816c803c5ea.jpg) | [assets/asset_niva_1/terrang/stenar/coast_rocks_02/coast_rocks_02_pivot_fot.glb](../assets/asset_niva_1/terrang/stenar/coast_rocks_02/coast_rocks_02_pivot_fot.glb) | Texturerad modellvy inte stickprovad |
| **B** | Kust stenar 03 * | Ej relevant | 21.12 × 3.20 × 28.27 · 32.90 | 813464 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b9705c325320.jpg) | [assets/asset_niva_1/terrang/stenar/coast_rocks_03/coast_rocks_03_pivot_fot.glb](../assets/asset_niva_1/terrang/stenar/coast_rocks_03/coast_rocks_03_pivot_fot.glb) | Texturerad modellvy inte stickprovad |
| **B** | Kust stenar 05 * | Ej relevant | 4.04 × 1.33 × 3.75 · 33.58 | 771724 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/d2291ac06f59.jpg) | [assets/asset_niva_1/terrang/stenar/coast_rocks_05/coast_rocks_05_pivot_fot.glb](../assets/asset_niva_1/terrang/stenar/coast_rocks_05/coast_rocks_05_pivot_fot.glb) | Texturerad modellvy inte stickprovad |
| **B** | Mountainside pivot fot * | Ej relevant | 10.21 × 10.52 × 5.25 · 15.37 | 153472 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/7b9cf2975499.jpg) | [assets/asset_niva_1/terrang/stenar/mountainside_pivot_fot/mountainside_pivot_fot.glb](../assets/asset_niva_1/terrang/stenar/mountainside_pivot_fot/mountainside_pivot_fot.glb) | Texturerad modellvy inte stickprovad |
| **B** | Sand stenar liten 01 * | Ej relevant | 4.63 × 0.53 × 3.88 · 30.96 | 739469 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/8ac35e561a7a.jpg) | [assets/asset_niva_1/terrang/stenar/sand_rocks_small_01/original/sand_rocks_small_01.glb](../assets/asset_niva_1/terrang/stenar/sand_rocks_small_01/original/sand_rocks_small_01.glb) | Texturerad modellvy inte stickprovad |
| **B** | Sten 07 * | Ej relevant | 0.17 × 0.14 × 0.32 · 0.82 | 14844 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/efdaa70fb50d.jpg) | [assets/asset_niva_1/terrang/stenar/rock_07/rock_07.glb](../assets/asset_niva_1/terrang/stenar/rock_07/rock_07.glb) | Texturerad modellvy inte stickprovad |
| **B** | Sten face 01 pivot fot * | Ej relevant | 4.95 × 3.56 × 3.83 · 3.05 | 20174 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/d2a1e10b3d96.jpg) | [assets/asset_niva_1/terrang/stenar/rock_face_01_pivot_fot/rock_face_01_pivot_fot.glb](../assets/asset_niva_1/terrang/stenar/rock_face_01_pivot_fot/rock_face_01_pivot_fot.glb) | Texturerad modellvy inte stickprovad |
| **B** | Sten face 02 pivot fot * | Ej relevant | 2.71 × 2.47 × 2.13 · 3.53 | 29566 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f49c73ecf2f2.jpg) | [assets/asset_niva_1/terrang/stenar/rock_face_02_pivot_fot/rock_face_02_pivot_fot.glb](../assets/asset_niva_1/terrang/stenar/rock_face_02_pivot_fot/rock_face_02_pivot_fot.glb) | Texturerad modellvy inte stickprovad |
| **B** | Sten mossa uppsättning 01 * | Ej relevant | 8.00 × 1.77 × 6.95 · 1.88 | 63127 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/2726f3f64e65.jpg) | [assets/asset_niva_1/terrang/stenar/rock_moss_set_01/rock_moss_set_01.glb](../assets/asset_niva_1/terrang/stenar/rock_moss_set_01/rock_moss_set_01.glb) | Texturerad modellvy inte stickprovad |
| **B** | Sten mossa uppsättning 02 * | Ej relevant | 8.28 × 1.37 × 3.41 · 1.87 | 57647 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/728dc04d1544.jpg) | [assets/asset_niva_1/terrang/stenar/rock_moss_set_02/rock_moss_set_02.glb](../assets/asset_niva_1/terrang/stenar/rock_moss_set_02/rock_moss_set_02.glb) | Texturerad modellvy inte stickprovad |
| **B** | Stenblock 01 * | Ej relevant | 1.27 × 1.00 × 1.83 · 4.11 | 66122 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/387a406b3da2.jpg) | [assets/asset_niva_1/terrang/stenar/boulder_01/boulder_01.glb](../assets/asset_niva_1/terrang/stenar/boulder_01/boulder_01.glb) | Texturerad modellvy inte stickprovad |

## Stridsvagn
| Nivå | Svenskt namn (härlett/gissning *) | Land | Mått x/y/z m · MB | Tri | LOD | Animation/ljud | Bild | Sökväg | Kvar |
|---|---|---|---|---|---|---|---|---|---|
| **C** | Cromwell iv 42manako * | Storbritannien | 6.81 × 2.54 × 3.14 · 3.75 | 13609 | Ja | 0 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/23e5135acb5d.jpg) | [assets/asset_niva_1/enheter/stridsvagnar/cromwell_iv_sketchfab_42manako.glb](../assets/asset_niva_1/enheter/stridsvagnar/cromwell_iv_sketchfab_42manako.glb) | Inte komplett färg/normal/MR på alla material; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd; Väsentlig koppling/animation/besättning återstår |
| **C** | Jagdpanzer iv late 42manako * | Tyskland | 7.01 × 3.69 × 3.30 · 5.98 | 24039 | Ja | 0 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/f0601a40262d.jpg) | [assets/asset_niva_1/enheter/stridsvagnar/jagdpanzer_iv_late_sketchfab_42manako.glb](../assets/asset_niva_1/enheter/stridsvagnar/jagdpanzer_iv_late_sketchfab_42manako.glb) | Inte komplett färg/normal/MR på alla material; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd; Väsentlig koppling/animation/besättning återstår |
| **C** | M10 wolverine late 42manako * | USA | 6.84 × 3.41 × 3.05 · 9.26 | 22517 | Ja | 0 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/8c4b951f36a9.jpg) | [assets/asset_niva_1/enheter/stridsvagnar/m10_wolverine_late_sketchfab_42manako.glb](../assets/asset_niva_1/enheter/stridsvagnar/m10_wolverine_late_sketchfab_42manako.glb) | Inte komplett färg/normal/MR på alla material; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd; Väsentlig koppling/animation/besättning återstår |
| **C** | M4a1 75 rhino late 42manako * | USA | 6.27 × 4.36 × 2.70 · 6.88 | 19532 | Ja | 0 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/4673f838dbb9.jpg) | [assets/asset_niva_1/enheter/stridsvagnar/m4a1_75_rhino_late_sketchfab_42manako.glb](../assets/asset_niva_1/enheter/stridsvagnar/m4a1_75_rhino_late_sketchfab_42manako.glb) | Inte komplett färg/normal/MR på alla material; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd; Väsentlig koppling/animation/besättning återstår |
| **C** | M4a3 76w early 42manako * | USA | 7.29 × 4.42 × 2.67 · 8.23 | 20926 | Ja | 0 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/778d1dfe72b4.jpg) | [assets/asset_niva_1/enheter/stridsvagnar/m4a3_76w_early_sketchfab_42manako.glb](../assets/asset_niva_1/enheter/stridsvagnar/m4a3_76w_early_sketchfab_42manako.glb) | Inte komplett färg/normal/MR på alla material; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd; Väsentlig koppling/animation/besättning återstår |
| **C** | Marder iii 42manako * | Tyskland | 4.94 × 2.45 × 2.13 · 6.84 | 36177 | Ja | 0 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/3618a88d95cf.jpg) | [assets/asset_niva_1/enheter/stridsvagnar/marder_iii_m_sketchfab_42manako.glb](../assets/asset_niva_1/enheter/stridsvagnar/marder_iii_m_sketchfab_42manako.glb) | Inte komplett färg/normal/MR på alla material; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd; Väsentlig koppling/animation/besättning återstår |
| **C** | Panther a mid 42manako * | Tyskland | 8.90 × 3.81 × 3.32 · 8.38 | 40183 | Ja | 0 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/88eb10180f86.jpg) | [assets/asset_niva_1/enheter/stridsvagnar/panther_a_mid_sketchfab_42manako.glb](../assets/asset_niva_1/enheter/stridsvagnar/panther_a_mid_sketchfab_42manako.glb) | Inte komplett färg/normal/MR på alla material; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd; Väsentlig koppling/animation/besättning återstår |
| **C** | Panther g dan11l11l * | Tyskland | 85.15 × 82.44 × 225.53 · 43.07 | 363229 | Ja | 0 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/4f13dc712a93.jpg) | [assets/asset_niva_1/enheter/stridsvagnar/panther_g_sketchfab_dan11l11l.glb](../assets/asset_niva_1/enheter/stridsvagnar/panther_g_sketchfab_dan11l11l.glb) | Inte komplett färg/normal/MR på alla material; Skala orimlig; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd; Väsentlig koppling/animation/besättning återstår |
| **C** | Panzer IV H – tysk stridsvagn * | Tyskland | 3.34 × 3.38 × 7.02 · 18.16 | 16446 | Ja | 24 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/fe9910abfe88.jpg) | [assets/asset_niva_1/enheter/stridsvagnar/panzer_iv_h/panzer_iv_h_v2b_v2_pbr.glb](../assets/asset_niva_1/enheter/stridsvagnar/panzer_iv_h/panzer_iv_h_v2b_v2_pbr.glb) | Inte komplett färg/normal/MR på alla material; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd; Väsentlig koppling/animation/besättning återstår |
| **C** | Panzer ii luchs 42manako * | Tyskland | 4.72 × 2.77 × 2.47 · 5.31 | 20955 | Ja | 0 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/7be9bd81d330.jpg) | [assets/asset_niva_1/enheter/stridsvagnar/panzer_ii_luchs_sketchfab_42manako.glb](../assets/asset_niva_1/enheter/stridsvagnar/panzer_ii_luchs_sketchfab_42manako.glb) | Inte komplett färg/normal/MR på alla material; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd; Väsentlig koppling/animation/besättning återstår |
| **C** | Sherman firefly barking dogo * | Storbritannien | 2.70 × 3.91 × 7.78 · 71.41 | 328246 | Ja | 0 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/28f01b6c86d4.jpg) | [assets/asset_niva_1/enheter/stridsvagnar/sherman_firefly_barking_dogo/sherman_firefly_barking_dogo_v3_pbr.glb](../assets/asset_niva_1/enheter/stridsvagnar/sherman_firefly_barking_dogo/sherman_firefly_barking_dogo_v3_pbr.glb) | Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd; Väsentlig koppling/animation/besättning återstår |
| **C** | Sherman m4 barking dogo * | USA | 2.70 × 3.90 × 6.10 · 65.41 | 279176 | Ja | 0 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/c2073fa94450.jpg) | [assets/asset_niva_1/enheter/stridsvagnar/sherman_m4_barking_dogo/sherman_m4_barking_dogo_v3_pbr.glb](../assets/asset_niva_1/enheter/stridsvagnar/sherman_m4_barking_dogo/sherman_m4_barking_dogo_v3_pbr.glb) | Inte komplett färg/normal/MR på alla material; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd; Väsentlig koppling/animation/besättning återstår |
| **C** | Tiger I – tung tysk stridsvagn * | Tyskland | 3.70 × 2.95 × 8.45 · 14.60 | 15516 | Ja | 21 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/4c2abe02951e.jpg) | [assets/asset_niva_1/enheter/stridsvagnar/tiger_i/tiger_i_heavy_v2_v2_pbr.glb](../assets/asset_niva_1/enheter/stridsvagnar/tiger_i/tiger_i_heavy_v2_v2_pbr.glb) | Inte komplett färg/normal/MR på alla material; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd; Väsentlig koppling/animation/besättning återstår |
| **C** | Tiger i late 42manako * | Tyskland | 8.70 × 3.73 × 3.83 · 4.72 | 25073 | Ja | 0 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/1799392293c8.jpg) | [assets/asset_niva_1/enheter/stridsvagnar/tiger_i_late_sketchfab_42manako.glb](../assets/asset_niva_1/enheter/stridsvagnar/tiger_i_late_sketchfab_42manako.glb) | Inte komplett färg/normal/MR på alla material; Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd; Väsentlig koppling/animation/besättning återstår |
| **C** | Tiger i vyachslavka25 * | Tyskland | 1.22 × 0.97 × 2.76 · 34.84 | 175659 | Ja | 0 klipp; Ej lyssningsgodkänt; se luckmatris och ljudkatalog | ![](tumnaglar/199cf9009e89.jpg) | [assets/asset_niva_1/enheter/stridsvagnar/tiger_i_sketchfab_vyachslavka25.glb](../assets/asset_niva_1/enheter/stridsvagnar/tiger_i_sketchfab_vyachslavka25.glb) | Ljud inte lyssningsgodkänt; Besättning/bärare inte godkänd; Väsentlig koppling/animation/besättning återstår |

## Terrängdetalj/föremål
| Nivå | Svenskt namn (härlett/gissning *) | Land | Mått x/y/z m · MB | Tri | LOD | Animation/ljud | Bild | Sökväg | Kvar |
|---|---|---|---|---|---|---|---|---|---|
| **B** | Bark spill 01 * | Ej relevant | 1.21 × 0.11 × 0.67 · 16.67 | 193406 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/03f33fc2e545.jpg) | [assets/asset_niva_1/terrang/detaljer/bark_debris_01/original/bark_debris_01.glb](../assets/asset_niva_1/terrang/detaljer/bark_debris_01/original/bark_debris_01.glb) | Texturerad modellvy inte stickprovad |
| **B** | Burk rostig * | Ej relevant | 0.12 × 0.15 × 0.12 · 2.11 | 3520 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/d89cbc600de0.jpg) | [assets/asset_niva_1/terrang/detaljer/can_rusted/can_rusted_v2_pbr.glb](../assets/asset_niva_1/terrang/detaljer/can_rusted/can_rusted_v2_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Crowbar 01 * | Ej relevant | 0.04 × 0.56 × 0.13 · 1.97 | 2300 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/7826645ef610.jpg) | [assets/asset_niva_1/terrang/detaljer/crowbar_01/crowbar_01_v2_pbr.glb](../assets/asset_niva_1/terrang/detaljer/crowbar_01/crowbar_01_v2_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Död träd stam * | Ej relevant | 3.05 × 0.29 × 0.28 · 2.86 | 101802 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c1971421b352.jpg) | [assets/asset_niva_1/terrang/detaljer/dead_tree_trunk/dead_tree_trunk_v2.glb](../assets/asset_niva_1/terrang/detaljer/dead_tree_trunk/dead_tree_trunk_v2.glb) | Texturerad modellvy inte stickprovad |
| **B** | Död träd stam 02 * | Ej relevant | 4.05 × 1.06 × 1.06 · 2.67 | 83128 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f5d33239f498.jpg) | [assets/asset_niva_1/terrang/detaljer/dead_tree_trunk_02/dead_tree_trunk_02_v2.glb](../assets/asset_niva_1/terrang/detaljer/dead_tree_trunk_02/dead_tree_trunk_02_v2.glb) | Texturerad modellvy inte stickprovad |
| **B** | Flätad korg 01 * | Ej relevant | 0.38 × 0.12 × 0.30 · 2.73 | 22276 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/2d548838cba7.jpg) | [assets/asset_niva_1/terrang/detaljer/wicker_basket_01/wicker_basket_01_v2_pbr.glb](../assets/asset_niva_1/terrang/detaljer/wicker_basket_01/wicker_basket_01_v2_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Handsaw trä * | Ej relevant | 0.04 × 0.17 × 0.63 · 2.48 | 2548 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c34cbb38c8c8.jpg) | [assets/asset_niva_1/terrang/detaljer/handsaw_wood/handsaw_wood_v2_pbr.glb](../assets/asset_niva_1/terrang/detaljer/handsaw_wood/handsaw_wood_v2_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Metall jug * | Ej relevant | 0.20 × 0.29 × 0.20 · 1.79 | 6040 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/c42847ab5f10.jpg) | [assets/asset_niva_1/terrang/detaljer/metal_jug/metal_jug_v2_pbr.glb](../assets/asset_niva_1/terrang/detaljer/metal_jug/metal_jug_v2_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Metall verktygslåda * | Ej relevant | 0.40 × 0.30 × 0.27 · 2.74 | 14228 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/26beec0d076d.jpg) | [assets/asset_niva_1/terrang/detaljer/metal_toolbox/metal_toolbox_v3_pbr.glb](../assets/asset_niva_1/terrang/detaljer/metal_toolbox/metal_toolbox_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Olja plåtdunk * | Ej relevant | 0.11 × 0.21 × 0.15 · 2.09 | 2834 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/ca6834d611a8.jpg) | [assets/asset_niva_1/terrang/detaljer/oil_tin/oil_tin_v2_pbr.glb](../assets/asset_niva_1/terrang/detaljer/oil_tin/oil_tin_v2_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Sten fire pit * | Ej relevant | 1.45 × 0.39 × 1.43 · 0.64 | 3887 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/dc4f14b85a22.jpg) | [assets/asset_niva_1/terrang/detaljer/stone_fire_pit/stone_fire_pit.glb](../assets/asset_niva_1/terrang/detaljer/stone_fire_pit/stone_fire_pit.glb) | Texturerad modellvy inte stickprovad |
| **B** | Torra grenar mellan 01 * | Ej relevant | 1.06 × 0.34 × 1.30 · 1.14 | 16803 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/0bf9e7a59981.jpg) | [assets/asset_niva_1/terrang/detaljer/dry_branches_medium_01/dry_branches_medium_01_v2.glb](../assets/asset_niva_1/terrang/detaljer/dry_branches_medium_01/dry_branches_medium_01_v2.glb) | Texturerad modellvy inte stickprovad |
| **B** | Trä hammare 01 * | Ej relevant | 0.11 × 0.28 × 0.02 · 1.89 | 3617 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3dc72d95cefa.jpg) | [assets/asset_niva_1/terrang/detaljer/wooden_hammer_01/wooden_hammer_01_v2_pbr.glb](../assets/asset_niva_1/terrang/detaljer/wooden_hammer_01/wooden_hammer_01_v2_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Trä hink 02 * | Ej relevant | 0.62 × 0.35 × 0.62 · 2.51 | 7252 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f9b8de794f45.jpg) | [assets/asset_niva_1/terrang/detaljer/wooden_bucket_02/wooden_bucket_02_v2_pbr.glb](../assets/asset_niva_1/terrang/detaljer/wooden_bucket_02/wooden_bucket_02_v2_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Trä lykta 01 * | Ej relevant | 0.22 × 0.53 × 0.23 · 3.76 | 8321 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/e7ea41325756.jpg) | [assets/asset_niva_1/terrang/detaljer/wooden_lantern_01/wooden_lantern_01_v3_pbr.glb](../assets/asset_niva_1/terrang/detaljer/wooden_lantern_01/wooden_lantern_01_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Trä yxa * | Ej relevant | 0.05 × 0.63 × 0.21 · 2.03 | 3348 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/7509299c218b.jpg) | [assets/asset_niva_1/terrang/detaljer/wooden_axe/wooden_axe_v2_pbr.glb](../assets/asset_niva_1/terrang/detaljer/wooden_axe/wooden_axe_v2_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Träd stubbe 01 * | Ej relevant | 1.43 × 0.57 × 1.59 · 1.71 | 41046 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/4749ac9c73c1.jpg) | [assets/asset_niva_1/terrang/detaljer/tree_stump_01/tree_stump_01_v2.glb](../assets/asset_niva_1/terrang/detaljer/tree_stump_01/tree_stump_01_v2.glb) | Texturerad modellvy inte stickprovad |
| **B** | Träd stubbe 02 * | Ej relevant | 1.52 × 0.52 × 1.39 · 2.18 | 62345 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/d0409f24a73f.jpg) | [assets/asset_niva_1/terrang/detaljer/tree_stump_02/tree_stump_02_v2.glb](../assets/asset_niva_1/terrang/detaljer/tree_stump_02/tree_stump_02_v2.glb) | Texturerad modellvy inte stickprovad |
| **B** | Tunna kamin * | Ej relevant | 0.59 × 0.86 × 0.59 · 2.58 | 9216 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/4fbe1aedfa13.jpg) | [assets/asset_niva_1/terrang/detaljer/barrel_stove/barrel_stove_v2_pbr.glb](../assets/asset_niva_1/terrang/detaljer/barrel_stove/barrel_stove_v2_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Watering burk metall 01 * | Ej relevant | 0.19 × 0.20 × 0.45 · 2.61 | 11837 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/2c43dde428d0.jpg) | [assets/asset_niva_1/terrang/detaljer/watering_can_metal_01/watering_can_metal_01_v2_pbr.glb](../assets/asset_niva_1/terrang/detaljer/watering_can_metal_01/watering_can_metal_01_v2_pbr.glb) | Texturerad modellvy inte stickprovad |

## Terrängmodell
| Nivå | Svenskt namn (härlett/gissning *) | Land | Mått x/y/z m · MB | Tri | LOD | Animation/ljud | Bild | Sökväg | Kvar |
|---|---|---|---|---|---|---|---|---|---|
| **B** | Bocage vall ande 4m * | Ej relevant | 4.40 × 1.44 × 4.00 · 5.07 | 576 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/ad193359cd3b.jpg) | [assets/asset_niva_1/terrang/kit/normandie_lovskog_bocage/bocage/bocage_vall_ande_4m.glb](../assets/asset_niva_1/terrang/kit/normandie_lovskog_bocage/bocage/bocage_vall_ande_4m.glb) | Texturerad modellvy inte stickprovad |
| **B** | Bocage vall rak 10m * | Ej relevant | 4.40 × 1.52 × 10.00 · 5.09 | 1440 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b24b7c70f747.jpg) | [assets/asset_niva_1/terrang/kit/normandie_lovskog_bocage/bocage/bocage_vall_rak_10m.glb](../assets/asset_niva_1/terrang/kit/normandie_lovskog_bocage/bocage/bocage_vall_rak_10m.glb) | Texturerad modellvy inte stickprovad |
| **B** | Hogstubbe gran 2m5 * | Ej relevant | 0.73 × 2.60 × 1.12 · 5.52 | 548 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b87d73c5e862.jpg) | [assets/asset_niva_1/terrang/kit/skog_gemensamt/stockar_stubbar/hogstubbe_gran_2m5.glb](../assets/asset_niva_1/terrang/kit/skog_gemensamt/stockar_stubbar/hogstubbe_gran_2m5.glb) | Texturerad modellvy inte stickprovad |
| **B** | Hogstubbe hög 4m * | Ej relevant | 0.55 × 4.00 × 0.55 · 5.51 | 72 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3adeb93aedbb.jpg) | [assets/asset_niva_1/terrang/kit/skog_gemensamt/stockar_stubbar/hogstubbe_tall_4m.glb](../assets/asset_niva_1/terrang/kit/skog_gemensamt/stockar_stubbar/hogstubbe_tall_4m.glb) | Texturerad modellvy inte stickprovad |
| **B** | Liggande stam gran 8m * | Ej relevant | 0.93 × 1.12 × 8.00 · 5.57 | 2468 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/247cbe6657b9.jpg) | [assets/asset_niva_1/terrang/kit/skog_gemensamt/stockar_stubbar/liggande_stam_gran_8m.glb](../assets/asset_niva_1/terrang/kit/skog_gemensamt/stockar_stubbar/liggande_stam_gran_8m.glb) | Texturerad modellvy inte stickprovad |
| **B** | Liggande stam hög 9m * | Ej relevant | 0.55 × 0.76 × 9.00 · 5.51 | 136 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/a4cc5f0a3752.jpg) | [assets/asset_niva_1/terrang/kit/skog_gemensamt/stockar_stubbar/liggande_stam_tall_9m.glb](../assets/asset_niva_1/terrang/kit/skog_gemensamt/stockar_stubbar/liggande_stam_tall_9m.glb) | Texturerad modellvy inte stickprovad |
| **B** | Liggande stam ph01 3m * | Ej relevant | 0.28 × 0.29 × 3.05 · 11.30 | 101802 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/a3a7f564641e.jpg) | [assets/asset_niva_1/terrang/kit/skog_gemensamt/stockar_stubbar/liggande_stam_ph01_3m.glb](../assets/asset_niva_1/terrang/kit/skog_gemensamt/stockar_stubbar/liggande_stam_ph01_3m.glb) | Texturerad modellvy inte stickprovad |
| **B** | Liggande stam ph02 4m * | Ej relevant | 1.06 × 1.06 × 4.05 · 13.35 | 83128 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/1474f5e654f5.jpg) | [assets/asset_niva_1/terrang/kit/skog_gemensamt/stockar_stubbar/liggande_stam_ph02_4m.glb](../assets/asset_niva_1/terrang/kit/skog_gemensamt/stockar_stubbar/liggande_stam_ph02_4m.glb) | Texturerad modellvy inte stickprovad |
| **B** | Skog vag natt dasy444 * | Ej relevant | 19.24 × 2.85 × 9.74 · 14.78 | 151954 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/1b80bc4668b5.jpg) | [assets/asset_niva_1/terrang/skog_vag/skog_vag_natt_sketchfab_dasy444.glb](../assets/asset_niva_1/terrang/skog_vag/skog_vag_natt_sketchfab_dasy444.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Sten vägg * | Ej relevant | 3.00 × 2.18 × 0.60 · 2.46 | 60 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/86d7a3ed4094.jpg) | [assets/asset_niva_1/terrang/murar/stone_wall_pbr/stone_wall_pbr.glb](../assets/asset_niva_1/terrang/murar/stone_wall_pbr/stone_wall_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Sten vägg column * | Ej relevant | 3.00 × 2.55 × 1.05 · 2.46 | 138 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3d71e914fffc.jpg) | [assets/asset_niva_1/terrang/murar/stone_wall_column_pbr/stone_wall_column_pbr.glb](../assets/asset_niva_1/terrang/murar/stone_wall_column_pbr/stone_wall_column_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Sten vägg curve * | Ej relevant | 3.00 × 2.18 × 3.00 · 2.47 | 266 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/100fcea428c7.jpg) | [assets/asset_niva_1/terrang/murar/stone_wall_curve_pbr/stone_wall_curve_pbr.glb](../assets/asset_niva_1/terrang/murar/stone_wall_curve_pbr/stone_wall_curve_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Sten vägg damaged * | Ej relevant | 3.00 × 2.18 × 0.60 · 2.46 | 144 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/5eb7b44a630f.jpg) | [assets/asset_niva_1/terrang/murar/stone_wall_damaged_pbr/stone_wall_damaged_pbr.glb](../assets/asset_niva_1/terrang/murar/stone_wall_damaged_pbr/stone_wall_damaged_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Stubbe ph01 * | Ej relevant | 1.43 × 0.57 × 1.59 · 11.37 | 41046 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/2dbb9e5236dc.jpg) | [assets/asset_niva_1/terrang/kit/skog_gemensamt/stockar_stubbar/stubbe_ph01.glb](../assets/asset_niva_1/terrang/kit/skog_gemensamt/stockar_stubbar/stubbe_ph01.glb) | Texturerad modellvy inte stickprovad |
| **B** | Stubbe ph02 * | Ej relevant | 1.52 × 0.52 × 1.39 · 13.03 | 62345 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b467bf46a7ce.jpg) | [assets/asset_niva_1/terrang/kit/skog_gemensamt/stockar_stubbar/stubbe_ph02.glb](../assets/asset_niva_1/terrang/kit/skog_gemensamt/stockar_stubbar/stubbe_ph02.glb) | Texturerad modellvy inte stickprovad |
| **B** | Torra grenar ph01 * | Ej relevant | 1.06 × 0.34 × 1.30 · 10.81 | 16803 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/039077146e56.jpg) | [assets/asset_niva_1/terrang/kit/skog_gemensamt/stockar_stubbar/torra_grenar_ph01.glb](../assets/asset_niva_1/terrang/kit/skog_gemensamt/stockar_stubbar/torra_grenar_ph01.glb) | Texturerad modellvy inte stickprovad |
| **C** | Dammig stig falt 3dhdscan * | Ej relevant | 2670.68 × 171.85 × 4183.10 · 51.43 | 444982 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/163e123a68e5.jpg) | [assets/asset_niva_1/terrang/dusty_path/dusty_path_falt_3dhdscan.glb](../assets/asset_niva_1/terrang/dusty_path/dusty_path_falt_3dhdscan.glb) | Färgtextur saknas; Inte komplett färg/normal/MR på alla material; Skalan behöver kontrolleras; Texturerad modellvy inte stickprovad |

## Träd
| Nivå | Svenskt namn (härlett/gissning *) | Land | Mått x/y/z m · MB | Tri | LOD | Animation/ljud | Bild | Sökväg | Kvar |
|---|---|---|---|---|---|---|---|---|---|
| **A** | Torrgran s961 * | Ej relevant | 3.26 × 15.00 × 2.50 · 6.19 | 8592 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/0ee85f3511c6.jpg) | [assets/asset_niva_1/terrang/träd/ezt_torrgran_s961/ezt_torrgran_s961.glb](../assets/asset_niva_1/terrang/tr%C3%A4d/ezt_torrgran_s961/ezt_torrgran_s961.glb) |  |
| **B** | Ask liten s111 * | Ej relevant | 8.46 × 10.00 × 9.18 · 6.93 | 11072 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/75a984115e13.jpg) | [assets/asset_niva_1/terrang/träd/ezt_ask_liten_s111/ezt_ask_liten_s111.glb](../assets/asset_niva_1/terrang/tr%C3%A4d/ezt_ask_liten_s111/ezt_ask_liten_s111.glb) | Inte komplett färg/normal/MR på alla material |
| **B** | Ask mellan s211 * | Ej relevant | 17.50 × 18.00 × 15.67 · 7.43 | 20000 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/fc012c1e1bb7.jpg) | [assets/asset_niva_1/terrang/träd/ezt_ask_mellan_s211/ezt_ask_mellan_s211.glb](../assets/asset_niva_1/terrang/tr%C3%A4d/ezt_ask_mellan_s211/ezt_ask_mellan_s211.glb) | Inte komplett färg/normal/MR på alla material |
| **B** | Ask stor s311 * | Ej relevant | 25.23 × 25.00 × 27.26 · 7.43 | 21512 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/7ce6ab232007.jpg) | [assets/asset_niva_1/terrang/träd/ezt_ask_stor_s311/ezt_ask_stor_s311.glb](../assets/asset_niva_1/terrang/tr%C3%A4d/ezt_ask_stor_s311/ezt_ask_stor_s311.glb) | Inte komplett färg/normal/MR på alla material |
| **B** | Ask stor s312 * | Ej relevant | 23.58 × 25.00 × 25.71 · 7.43 | 21512 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/87d939673e90.jpg) | [assets/asset_niva_1/terrang/träd/ezt_ask_stor_s312/ezt_ask_stor_s312.glb](../assets/asset_niva_1/terrang/tr%C3%A4d/ezt_ask_stor_s312/ezt_ask_stor_s312.glb) | Inte komplett färg/normal/MR på alla material |
| **B** | Ek liten s101 * | Ej relevant | 7.86 × 9.00 × 7.14 · 6.90 | 6806 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/612dce742b60.jpg) | [assets/asset_niva_1/terrang/träd/ezt_ek_liten_s101/ezt_ek_liten_s101.glb](../assets/asset_niva_1/terrang/tr%C3%A4d/ezt_ek_liten_s101/ezt_ek_liten_s101.glb) | Inte komplett färg/normal/MR på alla material |
| **B** | Ek mellan s201 * | Ej relevant | 11.30 × 15.00 × 11.96 · 7.41 | 13806 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/83941dc8c255.jpg) | [assets/asset_niva_1/terrang/träd/ezt_ek_mellan_s201/ezt_ek_mellan_s201.glb](../assets/asset_niva_1/terrang/tr%C3%A4d/ezt_ek_mellan_s201/ezt_ek_mellan_s201.glb) | Inte komplett färg/normal/MR på alla material |
| **B** | Ek mellan s202 * | Ej relevant | 11.26 × 15.00 × 11.51 · 7.41 | 13806 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/5c9613c4d459.jpg) | [assets/asset_niva_1/terrang/träd/ezt_ek_mellan_s202/ezt_ek_mellan_s202.glb](../assets/asset_niva_1/terrang/tr%C3%A4d/ezt_ek_mellan_s202/ezt_ek_mellan_s202.glb) | Inte komplett färg/normal/MR på alla material |
| **B** | Ek stor s301 * | Ej relevant | 23.77 × 22.00 × 21.37 · 7.66 | 22566 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/294bc56647f0.jpg) | [assets/asset_niva_1/terrang/träd/ezt_ek_stor_s301/ezt_ek_stor_s301.glb](../assets/asset_niva_1/terrang/tr%C3%A4d/ezt_ek_stor_s301/ezt_ek_stor_s301.glb) | Inte komplett färg/normal/MR på alla material |
| **B** | Ek stor s302 * | Ej relevant | 26.08 × 22.00 × 23.99 · 7.66 | 22566 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b690fe956228.jpg) | [assets/asset_niva_1/terrang/träd/ezt_ek_stor_s302/ezt_ek_stor_s302.glb](../assets/asset_niva_1/terrang/tr%C3%A4d/ezt_ek_stor_s302/ezt_ek_stor_s302.glb) | Inte komplett färg/normal/MR på alla material |
| **B** | Gran liten s951 * | Ej relevant | 2.84 × 6.00 × 2.75 · 7.96 | 21792 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/1de5e4cd419c.jpg) | [assets/asset_niva_1/terrang/träd/ezt_gran_liten_s951/ezt_gran_liten_s951.glb](../assets/asset_niva_1/terrang/tr%C3%A4d/ezt_gran_liten_s951/ezt_gran_liten_s951.glb) | Inte komplett färg/normal/MR på alla material |
| **B** | Gran mellan s952 * | Ej relevant | 7.89 × 14.00 × 7.44 · 8.12 | 24192 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/b62e041cc87f.jpg) | [assets/asset_niva_1/terrang/träd/ezt_gran_mellan_s952/ezt_gran_mellan_s952.glb](../assets/asset_niva_1/terrang/tr%C3%A4d/ezt_gran_mellan_s952/ezt_gran_mellan_s952.glb) | Inte komplett färg/normal/MR på alla material |
| **B** | Gran stor s953 * | Ej relevant | 12.59 × 24.00 × 11.59 · 8.15 | 26112 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/aa96e83fa828.jpg) | [assets/asset_niva_1/terrang/träd/ezt_gran_stor_s953/ezt_gran_stor_s953.glb](../assets/asset_niva_1/terrang/tr%C3%A4d/ezt_gran_stor_s953/ezt_gran_stor_s953.glb) | Inte komplett färg/normal/MR på alla material |
| **B** | Gran stor s954 * | Ej relevant | 13.70 × 28.00 × 12.85 · 8.25 | 28272 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f0c816699e1a.jpg) | [assets/asset_niva_1/terrang/träd/ezt_gran_stor_s954/ezt_gran_stor_s954.glb](../assets/asset_niva_1/terrang/tr%C3%A4d/ezt_gran_stor_s954/ezt_gran_stor_s954.glb) | Inte komplett färg/normal/MR på alla material |
| **B** | Hamlad pil s501 * | Ej relevant | 4.02 × 6.00 × 4.43 · 7.71 | 26484 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/6c030be4b806.jpg) | [assets/asset_niva_1/terrang/träd/ezt_hamlad_pil_s501/ezt_hamlad_pil_s501.glb](../assets/asset_niva_1/terrang/tr%C3%A4d/ezt_hamlad_pil_s501/ezt_hamlad_pil_s501.glb) | Inte komplett färg/normal/MR på alla material |
| **B** | Hamlad pil s502 * | Ej relevant | 4.89 × 7.00 × 4.86 · 7.71 | 26484 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/2ebff35c5c5a.jpg) | [assets/asset_niva_1/terrang/träd/ezt_hamlad_pil_s502/ezt_hamlad_pil_s502.glb](../assets/asset_niva_1/terrang/tr%C3%A4d/ezt_hamlad_pil_s502/ezt_hamlad_pil_s502.glb) | Inte komplett färg/normal/MR på alla material |
| **B** | Hög liten s901 * | Ej relevant | 3.48 × 8.00 × 3.52 · 7.46 | 11712 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/1c961e27b2c4.jpg) | [assets/asset_niva_1/terrang/träd/ezt_tall_liten_s901/ezt_tall_liten_s901.glb](../assets/asset_niva_1/terrang/tr%C3%A4d/ezt_tall_liten_s901/ezt_tall_liten_s901.glb) | Inte komplett färg/normal/MR på alla material |
| **B** | Hög mellan s902 * | Ej relevant | 5.47 × 16.00 × 5.11 · 8.44 | 32160 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/eb6c18ba9d34.jpg) | [assets/asset_niva_1/terrang/träd/ezt_tall_mellan_s902/ezt_tall_mellan_s902.glb](../assets/asset_niva_1/terrang/tr%C3%A4d/ezt_tall_mellan_s902/ezt_tall_mellan_s902.glb) | Inte komplett färg/normal/MR på alla material |
| **B** | Hög stor s903 * | Ej relevant | 7.47 × 24.00 × 8.27 · 8.36 | 30384 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/57c30b2f16e5.jpg) | [assets/asset_niva_1/terrang/träd/ezt_tall_stor_s903/ezt_tall_stor_s903.glb](../assets/asset_niva_1/terrang/tr%C3%A4d/ezt_tall_stor_s903/ezt_tall_stor_s903.glb) | Inte komplett färg/normal/MR på alla material |
| **B** | Hög stor s904 * | Ej relevant | 7.38 × 27.00 × 7.59 · 8.20 | 26832 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/94492393fd52.jpg) | [assets/asset_niva_1/terrang/träd/ezt_tall_stor_s904/ezt_tall_stor_s904.glb](../assets/asset_niva_1/terrang/tr%C3%A4d/ezt_tall_stor_s904/ezt_tall_stor_s904.glb) | Inte komplett färg/normal/MR på alla material |
| **B** | Kastanj form s801 * | Ej relevant | 22.54 × 20.00 × 22.27 · 7.50 | 22566 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/f22f5553c46b.jpg) | [assets/asset_niva_1/terrang/träd/ezt_kastanj_form_s801/ezt_kastanj_form_s801.glb](../assets/asset_niva_1/terrang/tr%C3%A4d/ezt_kastanj_form_s801/ezt_kastanj_form_s801.glb) | Inte komplett färg/normal/MR på alla material |
| **B** | Poppel pelare s401 * | Ej relevant | 4.91 × 25.00 × 4.43 · 7.50 | 24808 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/cf2d2751d2cc.jpg) | [assets/asset_niva_1/terrang/träd/ezt_poppel_pelare_s401/ezt_poppel_pelare_s401.glb](../assets/asset_niva_1/terrang/tr%C3%A4d/ezt_poppel_pelare_s401/ezt_poppel_pelare_s401.glb) | Inte komplett färg/normal/MR på alla material |
| **B** | Poppel pelare s402 * | Ej relevant | 5.23 × 28.00 × 5.37 · 7.50 | 24808 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/9548d33cbf53.jpg) | [assets/asset_niva_1/terrang/träd/ezt_poppel_pelare_s402/ezt_poppel_pelare_s402.glb](../assets/asset_niva_1/terrang/tr%C3%A4d/ezt_poppel_pelare_s402/ezt_poppel_pelare_s402.glb) | Inte komplett färg/normal/MR på alla material |
| **B** | Äppelträd odling s701 * | Ej relevant | 6.44 × 5.50 × 6.05 · 7.30 | 15740 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/2ac737244aaa.jpg) | [assets/asset_niva_1/terrang/träd/ezt_appeltrad_odling_s701/ezt_appeltrad_odling_s701.glb](../assets/asset_niva_1/terrang/tr%C3%A4d/ezt_appeltrad_odling_s701/ezt_appeltrad_odling_s701.glb) | Inte komplett färg/normal/MR på alla material |
| **B** | Äppelträd odling s702 * | Ej relevant | 6.05 × 5.00 × 6.24 · 7.30 | 15740 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/962556624ad2.jpg) | [assets/asset_niva_1/terrang/träd/ezt_appeltrad_odling_s702/ezt_appeltrad_odling_s702.glb](../assets/asset_niva_1/terrang/tr%C3%A4d/ezt_appeltrad_odling_s702/ezt_appeltrad_odling_s702.glb) | Inte komplett färg/normal/MR på alla material |

## Utrustning
| Nivå | Svenskt namn (härlett/gissning *) | Land | Mått x/y/z m · MB | Tri | LOD | Animation/ljud | Bild | Sökväg | Kvar |
|---|---|---|---|---|---|---|---|---|---|
| **B** | Cigarettask * | Ej fastställt | 0.32 × 0.02 × 0.10 · 2.06 | 16912 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/d77386e90dbe.jpg) | [assets/asset_niva_1/enheter/utrustning/cigarette_case/cigarette_case_v3_pbr.glb](../assets/asset_niva_1/enheter/utrustning/cigarette_case/cigarette_case_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Fickur * | Ej fastställt | 0.06 × 0.08 × 0.02 · 2.07 | 15615 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/59b6e6b42dd0.jpg) | [assets/asset_niva_1/enheter/utrustning/pocket_watch/pocket_watch_v3_pbr.glb](../assets/asset_niva_1/enheter/utrustning/pocket_watch/pocket_watch_v3_pbr.glb) | Inte komplett färg/normal/MR på alla material; Texturerad modellvy inte stickprovad |
| **B** | Runda glasögon * | Ej fastställt | 0.16 × 0.05 × 0.15 · 2.57 | 11810 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/3f5477d0a59f.jpg) | [assets/asset_niva_1/enheter/utrustning/round_spectacles/round_spectacles_v2_pbr.glb](../assets/asset_niva_1/enheter/utrustning/round_spectacles/round_spectacles_v2_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Signalficklampa * | Ej fastställt | 0.07 × 0.15 × 0.04 · 2.55 | 9730 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/acd227cb1b59.jpg) | [assets/asset_niva_1/enheter/utrustning/signal_flashlight/signal_flashlight_v3_pbr.glb](../assets/asset_niva_1/enheter/utrustning/signal_flashlight/signal_flashlight_v3_pbr.glb) | Texturerad modellvy inte stickprovad |
| **B** | Äldre kikare * | Ej fastställt | 0.19 × 0.07 × 0.20 · 2.74 | 19362 | Ja | 0 klipp; Ej relevant | ![](tumnaglar/450531d6ba22.jpg) | [assets/asset_niva_1/enheter/utrustning/vintage_binocular/vintage_binocular_v3_pbr.glb](../assets/asset_niva_1/enheter/utrustning/vintage_binocular/vintage_binocular_v3_pbr.glb) | Texturerad modellvy inte stickprovad |

## Materialset (separat från modeller)
| Nivå | Namn * | MB | Färg/normal/roughness | Plats |
|---|---|---|---|---|
| **B** | Bricks001 2K JPG * | 10.81 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks001_2K-JPG` |
| **B** | Bricks003 2K JPG * | 11.53 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks003_2K-JPG` |
| **B** | Bricks008 2K JPG * | 14.93 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks008_2K-JPG` |
| **B** | Bricks013 2K JPG * | 18.16 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks013_2K-JPG` |
| **B** | Bricks021 2K JPG * | 16.27 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks021_2K-JPG` |
| **B** | Bricks024 2K JPG * | 20.19 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks024_2K-JPG` |
| **B** | Bricks026 2K JPG * | 21.75 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks026_2K-JPG` |
| **B** | Bricks037 2K JPG * | 18.09 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks037_2K-JPG` |
| **B** | Bricks038 2K JPG * | 19.04 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks038_2K-JPG` |
| **B** | Bricks039 2K JPG * | 23.74 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks039_2K-JPG` |
| **B** | Bricks040 2K JPG * | 22.15 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks040_2K-JPG` |
| **B** | Bricks041 2K JPG * | 23.81 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks041_2K-JPG` |
| **B** | Bricks043 2K JPG * | 22.34 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks043_2K-JPG` |
| **B** | Bricks044 2K JPG * | 22.59 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks044_2K-JPG` |
| **B** | Bricks045 2K JPG * | 23.29 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks045_2K-JPG` |
| **B** | Bricks048 2K JPG * | 22.34 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks048_2K-JPG` |
| **B** | Bricks049 2K JPG * | 22.69 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks049_2K-JPG` |
| **B** | Bricks050 2K JPG * | 25.14 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks050_2K-JPG` |
| **B** | Bricks052 2K JPG * | 19.64 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks052_2K-JPG` |
| **B** | Bricks053 2K JPG * | 18.89 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks053_2K-JPG` |
| **B** | Bricks054 2K JPG * | 19.22 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks054_2K-JPG` |
| **B** | Bricks055 2K JPG * | 19.21 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks055_2K-JPG` |
| **B** | Bricks056 2K JPG * | 18.94 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks056_2K-JPG` |
| **B** | Bricks057 2K JPG * | 19.33 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks057_2K-JPG` |
| **B** | Bricks058 2K JPG * | 17.20 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks058_2K-JPG` |
| **B** | Bricks060 2K JPG * | 18.22 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks060_2K-JPG` |
| **B** | Bricks061 2K JPG * | 16.84 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks061_2K-JPG` |
| **B** | Bricks062 2K JPG * | 19.26 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks062_2K-JPG` |
| **B** | Bricks063 2K JPG * | 21.09 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks063_2K-JPG` |
| **B** | Bricks070 2K JPG * | 17.29 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks070_2K-JPG` |
| **B** | Bricks071 2K JPG * | 16.88 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks071_2K-JPG` |
| **B** | Bricks073A 2K JPG * | 22.62 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks073A_2K-JPG` |
| **B** | Bricks073C 2K JPG * | 22.58 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks073C_2K-JPG` |
| **B** | Bricks075B 2K JPG * | 11.28 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks075B_2K-JPG` |
| **B** | Bricks076C 2K JPG * | 20.87 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks076C_2K-JPG` |
| **B** | Bricks077 2K JPG * | 10.56 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks077_2K-JPG` |
| **B** | Bricks080A 2K JPG * | 21.06 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks080A_2K-JPG` |
| **B** | Bricks080B 2K JPG * | 21.00 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks080B_2K-JPG` |
| **B** | Bricks080C 2K JPG * | 21.06 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks080C_2K-JPG` |
| **B** | Bricks081A 2K JPG * | 20.87 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks081A_2K-JPG` |
| **B** | Bricks081B 2K JPG * | 19.84 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks081B_2K-JPG` |
| **B** | Bricks081C 2K JPG * | 19.82 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks081C_2K-JPG` |
| **B** | Bricks082A 2K JPG * | 20.62 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks082A_2K-JPG` |
| **B** | Bricks082B 2K JPG * | 20.52 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks082B_2K-JPG` |
| **B** | Bricks082C 2K JPG * | 20.39 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks082C_2K-JPG` |
| **B** | Bricks083 2K JPG * | 10.55 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks083_2K-JPG` |
| **B** | Bricks084 2K JPG * | 9.94 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks084_2K-JPG` |
| **B** | Bricks085 2K JPG * | 9.96 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks085_2K-JPG` |
| **B** | Bricks094 2K JPG * | 10.88 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks094_2K-JPG` |
| **B** | Bricks095 2K JPG * | 10.94 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks095_2K-JPG` |
| **B** | Bricks097 2K JPG * | 11.03 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks097_2K-JPG` |
| **B** | Bricks098 2K JPG * | 10.05 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks098_2K-JPG` |
| **B** | Bricks099 2K JPG * | 19.79 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks099_2K-JPG` |
| **B** | Bricks100 2K JPG * | 9.98 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks100_2K-JPG` |
| **B** | Bricks105 2K JPG * | 10.23 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks105_2K-JPG` |
| **B** | Bricks106A 2K JPG * | 19.44 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks106A_2K-JPG` |
| **B** | Bricks106B 2K JPG * | 19.64 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks106B_2K-JPG` |
| **B** | Bricks107A 2K JPG * | 19.57 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks107A_2K-JPG` |
| **B** | Bricks107B 2K JPG * | 19.70 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks107B_2K-JPG` |
| **B** | Bricks108A 2K JPG * | 18.40 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks108A_2K-JPG` |
| **B** | Bricks108B 2K JPG * | 18.74 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks108B_2K-JPG` |
| **B** | Bricks109A 2K JPG * | 19.00 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks109A_2K-JPG` |
| **B** | Bricks109B 2K JPG * | 19.13 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks109B_2K-JPG` |
| **B** | Bricks110A 2K JPG * | 18.92 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks110A_2K-JPG` |
| **B** | Bricks110B 2K JPG * | 19.13 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks110B_2K-JPG` |
| **B** | Bricks111A 2K JPG * | 18.94 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks111A_2K-JPG` |
| **B** | Bricks111B 2K JPG * | 19.15 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks111B_2K-JPG` |
| **B** | Bricks112A 2K JPG * | 18.94 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks112A_2K-JPG` |
| **B** | Bricks112B 2K JPG * | 19.11 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks112B_2K-JPG` |
| **B** | Bricks113A 2K JPG * | 18.54 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks113A_2K-JPG` |
| **B** | Bricks113B 2K JPG * | 18.77 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Bricks113B_2K-JPG` |
| **B** | Målad Bricks001 2K JPG * | 10.42 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/PaintedBricks001_2K-JPG` |
| **B** | Målad Bricks002 2K JPG * | 18.31 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/PaintedBricks002_2K-JPG` |
| **B** | Målad Bricks003 2K JPG * | 13.36 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/PaintedBricks003_2K-JPG` |
| **B** | Målad Bricks004 2K JPG * | 13.29 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/PaintedBricks004_2K-JPG` |
| **B** | Målad Bricks005 2K JPG * | 18.30 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/PaintedBricks005_2K-JPG` |
| **B** | Målad Plaster001 2K JPG * | 17.33 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/PaintedPlaster001_2K-JPG` |
| **B** | Målad Plaster002 2K JPG * | 16.43 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/PaintedPlaster002_2K-JPG` |
| **B** | Målad Plaster003 2K JPG * | 15.68 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/PaintedPlaster003_2K-JPG` |
| **B** | Målad Plaster004 2K JPG * | 16.76 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/PaintedPlaster004_2K-JPG` |
| **B** | Målad Plaster005 2K JPG * | 17.11 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/PaintedPlaster005_2K-JPG` |
| **B** | Målad Plaster007 2K JPG * | 21.57 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/PaintedPlaster007_2K-JPG` |
| **B** | Målad Plaster013 2K JPG * | 20.01 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/PaintedPlaster013_2K-JPG` |
| **B** | Målad Plaster017 2K JPG * | 9.13 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/PaintedPlaster017_2K-JPG` |
| **B** | Målad Plaster018 2K JPG * | 21.52 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/PaintedPlaster018_2K-JPG` |
| **B** | Plaster002 2K JPG * | 16.32 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Plaster002_2K-JPG` |
| **B** | Plaster005 2K JPG * | 17.59 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Plaster005_2K-JPG` |
| **B** | Plaster006 2K JPG * | 17.39 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/Plaster006_2K-JPG` |
| **B** | Roofing Tiles005 2K JPG * | 16.35 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/RoofingTiles005_2K-JPG` |
| **B** | Roofing Tiles011A 2K JPG * | 9.10 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/RoofingTiles011A_2K-JPG` |
| **B** | Roofing Tiles012A 2K JPG * | 9.41 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/RoofingTiles012A_2K-JPG` |
| **B** | Roofing Tiles013B 2K JPG * | 13.02 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/RoofingTiles013B_2K-JPG` |
| **B** | Roofing Tiles013D 2K JPG * | 19.94 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/RoofingTiles013D_2K-JPG` |
| **B** | Roofing Tiles014A 2K JPG * | 10.25 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/RoofingTiles014A_2K-JPG` |
| **B** | Roofing Tiles014D 2K JPG * | 20.96 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/RoofingTiles014D_2K-JPG` |
| **B** | Roofing Tiles015A 2K JPG * | 7.90 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/RoofingTiles015A_2K-JPG` |
| **B** | Roofing Tiles015B 2K JPG * | 11.56 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/RoofingTiles015B_2K-JPG` |
| **B** | Thatched Roof001A 2K JPG * | 32.48 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/ThatchedRoof001A_2K-JPG` |
| **B** | Thatched Roof002A 2K JPG * | 30.31 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/ThatchedRoof002A_2K-JPG` |
| **B** | Trä Siding002 * | 22.42 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/WoodSiding002` |
| **B** | Trä Siding004 * | 20.60 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/WoodSiding004` |
| **B** | Trä Siding005 * | 21.02 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/WoodSiding005` |
| **B** | Trä Siding006 * | 21.54 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/WoodSiding006` |
| **B** | Trä Siding007 * | 22.43 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/WoodSiding007` |
| **B** | Asphalt golv * | 21.79 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/asphalt_floor` |
| **B** | Beige vägg 001 * | 3.30 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/beige_wall_001` |
| **B** | Beige vägg 002 * | 1.20 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/beige_wall_002` |
| **B** | Blue puts vägg * | 13.09 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/blue_plaster_wall` |
| **B** | Blue puts weathered * | 11.37 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/blue_plaster_weathered` |
| **B** | Tegel 4 * | 6.76 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/brick_4` |
| **B** | Tegel golv * | 7.29 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/brick_floor` |
| **B** | Tegel golv 003 * | 4.05 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/brick_floor_003` |
| **B** | Tegel golv 02 * | 17.55 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/brick_floor_02` |
| **B** | Tegel golv 04 * | 16.43 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/brick_floor_04` |
| **B** | Tegel mossa 001 * | 4.43 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/brick_moss_001` |
| **B** | Tegel pavement * | 16.66 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/brick_pavement` |
| **B** | Tegel pavement 02 * | 17.50 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/brick_pavement_02` |
| **B** | Tegel pavement 03 * | 14.01 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/brick_pavement_03` |
| **B** | Tegel pavement 04 * | 18.50 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/brick_pavement_04` |
| **B** | Tegel villa golv * | 18.03 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/brick_villa_floor` |
| **B** | Tegel vägg 001 * | 5.96 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/brick_wall_001` |
| **B** | Tegel vägg 003 * | 11.37 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/brick_wall_003` |
| **B** | Tegel vägg 005 * | 15.99 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/brick_wall_005` |
| **B** | Tegel vägg 006 * | 15.45 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/brick_wall_006` |
| **B** | Tegel vägg 02 * | 17.79 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/brick_wall_02` |
| **B** | Tegel vägg 04 * | 17.30 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/brick_wall_04` |
| **B** | Tegel vägg 07 * | 18.11 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/brick_wall_07` |
| **B** | Tegel vägg 08 * | 15.43 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/brick_wall_08` |
| **B** | Tegel vägg 09 * | 16.26 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/brick_wall_09` |
| **B** | Tegel vägg 10 * | 14.38 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/brick_wall_10` |
| **B** | Tegel vägg 11 * | 12.58 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/brick_wall_11` |
| **B** | Tegel vägg 12 * | 16.78 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/brick_wall_12` |
| **B** | Tegel vägg 13 * | 11.85 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/brick_wall_13` |
| **B** | Brown tegel 02 * | 6.58 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/brown_brick_02` |
| **B** | Slott tegel 02 röd * | 11.39 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/castle_brick_02_red` |
| **B** | Slott tegel 02 vit * | 12.06 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/castle_brick_02_white` |
| **B** | Slott vägg slates * | 14.96 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/castle_wall_slates` |
| **B** | Slott vägg varriation * | 10.63 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/castle_wall_varriation` |
| **B** | Keramik tak 01 * | 9.27 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/ceramic_roof_01` |
| **B** | Clay block vägg * | 16.19 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/clay_block_wall` |
| **B** | Clay golv 001 * | 2.37 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/clay_floor_001` |
| **B** | Clay puts * | 10.20 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/clay_plaster` |
| **B** | Clay tak pannor 03 * | 14.94 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/clay_roof_tiles_03` |
| **B** | Betong * | 10.51 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/concrete` |
| **B** | Betong block vägg * | 13.72 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/concrete_block_wall` |
| **B** | Betong block vägg 02 * | 13.86 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/concrete_block_wall_02` |
| **B** | Betong block vägg 03 * | 12.35 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/concrete_block_wall_03` |
| **B** | Betong tegel vägg 001 * | 3.79 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/concrete_brick_wall_001` |
| **B** | Betong golv * | 17.92 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/concrete_floor` |
| **B** | Betong golv 01 * | 11.23 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/concrete_floor_01` |
| **B** | Betong golv 02 * | 8.50 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/concrete_floor_02` |
| **B** | Betong golv 03 * | 22.68 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/concrete_floor_03` |
| **B** | Betong golv damaged 01 * | 13.10 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/concrete_floor_damaged_01` |
| **B** | Betong golv worn 001 * | 4.10 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/concrete_floor_worn_001` |
| **B** | Betong golv worn 02 * | 14.63 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/concrete_floor_worn_02` |
| **B** | Betong mossa * | 10.63 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/concrete_moss` |
| **B** | Betong vägg 001 * | 2.99 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/concrete_wall_001` |
| **B** | Betong vägg 003 * | 4.63 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/concrete_wall_003` |
| **B** | Betong vägg 004 * | 16.25 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/concrete_wall_004` |
| **B** | Betong vägg 005 * | 9.90 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/concrete_wall_005` |
| **B** | Betong vägg 006 * | 18.41 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/concrete_wall_006` |
| **B** | Betong vägg 007 * | 13.94 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/concrete_wall_007` |
| **B** | Betong vägg 009 * | 13.60 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/concrete_wall_009` |
| **B** | Damaged betong golv * | 11.88 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/damaged_concrete_floor` |
| **B** | Damaged betong golv 02 * | 8.34 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/damaged_concrete_floor_02` |
| **B** | Damaged betong golv 03 * | 12.52 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/damaged_concrete_floor_03` |
| **B** | Dark tegel vägg * | 18.25 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/dark_brick_wall` |
| **B** | Decrepit wallpaper * | 12.24 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/decrepit_wallpaper` |
| **B** | Defense vägg 02 * | 11.04 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/defense_wall_02` |
| **B** | Double tegel golv * | 17.22 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/double_brick_floor` |
| **B** | Embedded plank flooring * | 13.91 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/embedded_plank_flooring` |
| **B** | Embedded sten golv * | 13.17 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/embedded_rock_floor` |
| **B** | Fabrik tegel * | 18.29 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/factory_brick` |
| **B** | Fabrik vägg * | 5.35 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/factory_wall` |
| **B** | Golv tegel 02 * | 6.13 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/floor_bricks_02` |
| **B** | Golv klinkers 01 * | 15.54 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/floor_klinkers_01` |
| **B** | Golv klinkers 04 * | 15.52 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/floor_klinkers_04` |
| **B** | Golv pavement * | 11.44 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/floor_pavement` |
| **B** | Granite vägg * | 14.83 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/granite_wall` |
| **B** | Grey puts * | 10.81 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/grey_plaster` |
| **B** | Grey puts 02 * | 12.15 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/grey_plaster_02` |
| **B** | Grey puts 03 * | 9.62 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/grey_plaster_03` |
| **B** | Grey tak 01 * | 9.55 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/grey_roof_01` |
| **B** | Grey tak pannor 02 * | 9.69 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/grey_roof_tiles_02` |
| **B** | Hangar betong golv * | 14.49 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/hangar_concrete_floor` |
| **B** | Herringbone tegel * | 17.19 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/herringbone_brick` |
| **B** | Herringbone tegel 02 * | 11.64 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/herringbone_brick_02` |
| **B** | Herringbone tegel 03 * | 18.82 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/herringbone_brick_03` |
| **B** | Stor röd tegel * | 8.93 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/large_red_bricks` |
| **B** | Stor sandstone blocks 01 * | 13.09 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/large_sandstone_blocks_01` |
| **B** | Medieval blocks 05 * | 9.92 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/medieval_blocks_05` |
| **B** | Medieval blocks 06 * | 10.14 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/medieval_blocks_06` |
| **B** | Medieval röd tegel * | 16.97 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/medieval_red_brick` |
| **B** | Medieval vägg 02 * | 16.77 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/medieval_wall_02` |
| **B** | Medieval trä * | 14.91 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/medieval_wood` |
| **B** | Mixed tegel vägg * | 16.32 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/mixed_brick_wall` |
| **B** | Mossa trä * | 15.04 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/moss_wood` |
| **B** | Mossy tegel golv * | 16.99 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/mossy_brick_floor` |
| **B** | Mossy sandstone * | 15.11 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/mossy_sandstone` |
| **B** | Gammal trä golv * | 13.97 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/old_wood_floor` |
| **B** | Gammal trä golv 01 * | 15.61 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/old_wooden_floor_01` |
| **B** | Gammal trä golv 02 * | 11.35 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/old_wooden_floor_02` |
| **B** | Gammal trä golv 03 * | 13.47 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/old_wooden_floor_03` |
| **B** | Målad tegel * | 14.50 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/painted_brick` |
| **B** | Målad metall shutter * | 12.61 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/painted_metal_shutter` |
| **B** | Målad puts vägg * | 14.68 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/painted_plaster_wall` |
| **B** | Målad worn tegel * | 17.43 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/painted_worn_brick` |
| **B** | Patterned tegel golv * | 18.65 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/patterned_brick_floor` |
| **B** | Patterned tegel golv 02 * | 19.53 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/patterned_brick_floor_02` |
| **B** | Patterned tegel golv 03 * | 14.59 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/patterned_brick_floor_03` |
| **B** | Patterned tegel vägg * | 16.88 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/patterned_brick_wall` |
| **B** | Patterned tegel vägg 02 * | 13.72 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/patterned_brick_wall_02` |
| **B** | Patterned tegel vägg 03 * | 12.20 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/patterned_brick_wall_03` |
| **B** | Patterned clay puts * | 13.05 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/patterned_clay_plaster` |
| **B** | Patterned clay vägg * | 15.14 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/patterned_clay_wall` |
| **B** | Patterned betong vägg * | 14.02 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/patterned_concrete_wall` |
| **B** | Patterned puts vägg * | 14.37 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/patterned_plaster_wall` |
| **B** | Pebble tegel * | 23.35 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/pebble_bricks` |
| **B** | Peeling målad vägg * | 14.31 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/peeling_painted_wall` |
| **B** | Puts tegel 01 * | 10.33 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/plaster_brick_01` |
| **B** | Puts tegel pattern * | 14.40 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/plaster_brick_pattern` |
| **B** | Puts grey 04 * | 10.76 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/plaster_grey_04` |
| **B** | Plastered vägg 02 * | 12.57 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/plastered_wall_02` |
| **B** | Plastered vägg 03 * | 7.63 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/plastered_wall_03` |
| **B** | Plastered vägg 04 * | 5.85 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/plastered_wall_04` |
| **B** | Plastered vägg 05 * | 15.46 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/plastered_wall_05` |
| **B** | Quarry vägg * | 18.10 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/quarry_wall` |
| **B** | Quarry vägg 02 * | 15.47 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/quarry_wall_02` |
| **B** | Random tegel tjock * | 10.67 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/random_bricks_thick` |
| **B** | Raw trä golv 01 * | 13.27 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/raw_wooden_floor_01` |
| **B** | Recycled tegel golv * | 15.66 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/recycled_brick_floor` |
| **B** | Röd tegel puts patch 02 * | 8.20 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/red_brick_plaster_patch_02` |
| **B** | Röd tegel 02 * | 9.29 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/red_bricks_02` |
| **B** | Röd tegel 04 * | 5.28 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/red_bricks_04` |
| **B** | Röd puts weathered * | 15.69 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/red_plaster_weathered` |
| **B** | Riet 01 * | 13.42 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/riet_01` |
| **B** | Sten embedded betong vägg * | 16.84 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rock_embedded_concrete_wall` |
| **B** | Sten vägg * | 13.73 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rock_wall` |
| **B** | Sten vägg 02 * | 5.25 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rock_wall_02` |
| **B** | Sten vägg 03 * | 14.11 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rock_wall_03` |
| **B** | Sten vägg 04 * | 15.72 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rock_wall_04` |
| **B** | Sten vägg 05 * | 16.87 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rock_wall_05` |
| **B** | Sten vägg 06 * | 15.41 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rock_wall_06` |
| **B** | Sten vägg 07 * | 14.49 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rock_wall_07` |
| **B** | Sten vägg 08 * | 15.46 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rock_wall_08` |
| **B** | Sten vägg 09 * | 15.90 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rock_wall_09` |
| **B** | Sten vägg 10 * | 18.71 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rock_wall_10` |
| **B** | Sten vägg 11 * | 15.59 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rock_wall_11` |
| **B** | Sten vägg 12 * | 14.39 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rock_wall_12` |
| **B** | Sten vägg 13 * | 13.75 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rock_wall_13` |
| **B** | Sten vägg 14 * | 15.09 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rock_wall_14` |
| **B** | Sten vägg 15 * | 16.22 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rock_wall_15` |
| **B** | Sten vägg 16 * | 14.31 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rock_wall_16` |
| **B** | Sten vägg 17 * | 14.82 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rock_wall_17` |
| **B** | Tak 07 * | 7.09 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/roof_07` |
| **B** | Tak 09 * | 7.01 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/roof_09` |
| **B** | Tak 3 * | 6.96 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/roof_3` |
| **B** | Tak plankor * | 9.25 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/roof_planks` |
| **B** | Tak pannor 14 * | 9.28 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/roof_tiles_14` |
| **B** | Grov block vägg * | 9.45 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rough_block_wall` |
| **B** | Grov puts 03 * | 9.55 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rough_plaster_03` |
| **B** | Grov puts tegel * | 11.23 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rough_plaster_brick` |
| **B** | Grov puts tegel 02 * | 11.18 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rough_plaster_brick_02` |
| **B** | Grov puts tegel 04 * | 11.65 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rough_plaster_brick_04` |
| **B** | Grov plasterbrick 05 * | 19.70 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rough_plasterbrick_05` |
| **B** | Rostig shutter * | 17.69 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rusted_shutter` |
| **B** | Rostig metall * | 8.92 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rusty_metal` |
| **B** | Rostig metall shutter * | 12.20 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/rusty_metal_shutter` |
| **B** | Sandstone blocks 04 * | 12.12 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/sandstone_blocks_04` |
| **B** | Sandstone blocks 05 * | 12.79 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/sandstone_blocks_05` |
| **B** | Sandstone blocks 08 * | 4.28 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/sandstone_blocks_08` |
| **B** | Sandstone tegel vägg 01 * | 17.74 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/sandstone_brick_wall_01` |
| **B** | Seaworn sandstone tegel * | 13.48 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/seaworn_sandstone_brick` |
| **B** | Seaworn sten pannor * | 14.35 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/seaworn_stone_tiles` |
| **B** | Kort tegel golv * | 18.50 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/short_bricks_floor` |
| **B** | Slumped mortar tegel * | 13.24 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/slumped_mortar_brick` |
| **B** | Square tegel golv * | 17.28 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/square_brick_floor` |
| **B** | Square tegel paving * | 15.26 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/square_brick_paving` |
| **B** | Stacked tegel vägg * | 13.14 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/stacked_brick_wall` |
| **B** | Stenciled tegel golv * | 13.33 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/stenciled_brick_floor` |
| **B** | Sten tegel vägg 001 * | 5.11 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/stone_brick_wall_001` |
| **B** | Sten panna vägg * | 9.44 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/stone_tile_wall` |
| **B** | Sten pannor * | 18.49 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/stone_tiles` |
| **B** | T tegel golv 002 * | 12.59 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/t_brick_floor_002` |
| **B** | T betong vägg 002 * | 11.93 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/t_concrete_wall_002` |
| **B** | Klinker golv 001 * | 6.69 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/tiled_floor_001` |
| **B** | Vägg tegel puts * | 10.00 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/wall_bricks_plaster` |
| **B** | Vit tegel * | 11.08 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/white_bricks` |
| **B** | Vit plankor clean * | 9.05 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/white_planks_clean` |
| **B** | Vit puts 02 * | 11.60 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/white_plaster_02` |
| **B** | Vit puts grov 01 * | 10.39 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/white_plaster_rough_01` |
| **B** | Vit puts grov 02 * | 9.78 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/white_plaster_rough_02` |
| **B** | Vit sandstone tegel 03 * | 8.61 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/white_sandstone_bricks_03` |
| **B** | Vit stucco * | 13.06 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/white_stucco` |
| **B** | Vit stucco 02 * | 17.90 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/white_stucco_02` |
| **B** | Whitewashed tegel * | 13.71 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/whitewashed_brick` |
| **B** | Trä golv * | 14.30 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/wood_floor` |
| **B** | Trä golv worn * | 13.51 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/wood_floor_worn` |
| **B** | Trä inlaid betong vägg * | 13.67 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/wood_inlaid_concrete_wall` |
| **B** | Trä inlaid sten vägg * | 13.59 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/wood_inlaid_stone_wall` |
| **B** | Trä plankor dirt * | 12.86 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/wood_planks_dirt` |
| **B** | Trä textured betong * | 13.45 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/wood_textured_concrete` |
| **B** | Trä stam vägg * | 11.38 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/wood_trunk_wall` |
| **B** | Trä golv 01 * | 13.04 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/wooden_floor_01` |
| **B** | Trä golv 02 * | 13.73 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/wooden_floor_02` |
| **B** | Trä garage dörr * | 12.92 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/wooden_garage_door` |
| **B** | Worn tegel golv * | 15.93 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/worn_brick_floor` |
| **B** | Worn tegel stig * | 14.91 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/worn_brick_path` |
| **B** | Worn betong golv * | 17.18 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/worn_concrete_floor` |
| **B** | Worn mossy plasterwall * | 17.23 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/worn_mossy_plasterwall` |
| **B** | Yellow tegel * | 18.56 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/yellow_brick` |
| **B** | Yellow tegel * | 12.57 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/yellow_bricks` |
| **B** | Yellow puts * | 6.33 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/yellow_plaster` |
| **B** | Yellow puts 02 * | 15.96 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/yellow_plaster_02` |
| **B** | Yellow sten vägg * | 17.50 | True/True/True | `assets/asset_niva_1/bebyggelse/texturer/yellow_stone_wall` |
| **B** | Korrugerad Steel001 * | 16.12 | True/True/True | `assets/asset_niva_1/material/texturer/CorrugatedSteel001` |
| **B** | Korrugerad Steel002 * | 17.98 | True/True/True | `assets/asset_niva_1/material/texturer/CorrugatedSteel002` |
| **B** | Korrugerad Steel003 * | 26.79 | True/True/True | `assets/asset_niva_1/material/texturer/CorrugatedSteel003` |
| **B** | Korrugerad Steel004 * | 15.61 | True/True/True | `assets/asset_niva_1/material/texturer/CorrugatedSteel004` |
| **B** | Korrugerad Steel006A * | 17.67 | True/True/True | `assets/asset_niva_1/material/texturer/CorrugatedSteel006A` |
| **B** | Korrugerad Steel007C * | 25.65 | True/True/True | `assets/asset_niva_1/material/texturer/CorrugatedSteel007C` |
| **B** | Korrugerad Steel008A * | 18.31 | True/True/True | `assets/asset_niva_1/material/texturer/CorrugatedSteel008A` |
| **B** | Korrugerad Steel008B * | 19.18 | True/True/True | `assets/asset_niva_1/material/texturer/CorrugatedSteel008B` |
| **B** | Korrugerad Steel008C * | 25.53 | True/True/True | `assets/asset_niva_1/material/texturer/CorrugatedSteel008C` |
| **B** | Diamond Plate001 2K JPG * | 17.21 | True/True/True | `assets/asset_niva_1/material/texturer/DiamondPlate001_2K-JPG` |
| **B** | Diamond Plate002 2K JPG * | 18.06 | True/True/True | `assets/asset_niva_1/material/texturer/DiamondPlate002_2K-JPG` |
| **B** | Diamond Plate003 2K JPG * | 18.62 | True/True/True | `assets/asset_niva_1/material/texturer/DiamondPlate003_2K-JPG` |
| **B** | Diamond Plate004 2K JPG * | 19.75 | True/True/True | `assets/asset_niva_1/material/texturer/DiamondPlate004_2K-JPG` |
| **B** | Diamond Plate005A 2K JPG * | 9.31 | True/True/True | `assets/asset_niva_1/material/texturer/DiamondPlate005A_2K-JPG` |
| **B** | Diamond Plate005B 2K JPG * | 13.08 | True/True/True | `assets/asset_niva_1/material/texturer/DiamondPlate005B_2K-JPG` |
| **B** | Diamond Plate005C 2K JPG * | 17.05 | True/True/True | `assets/asset_niva_1/material/texturer/DiamondPlate005C_2K-JPG` |
| **B** | Diamond Plate005D 2K JPG * | 17.98 | True/True/True | `assets/asset_niva_1/material/texturer/DiamondPlate005D_2K-JPG` |
| **B** | Diamond Plate006A 2K JPG * | 9.96 | True/True/True | `assets/asset_niva_1/material/texturer/DiamondPlate006A_2K-JPG` |
| **B** | Diamond Plate006B 2K JPG * | 14.87 | True/True/True | `assets/asset_niva_1/material/texturer/DiamondPlate006B_2K-JPG` |
| **B** | Diamond Plate006C 2K JPG * | 19.98 | True/True/True | `assets/asset_niva_1/material/texturer/DiamondPlate006C_2K-JPG` |
| **B** | Diamond Plate006D 2K JPG * | 19.01 | True/True/True | `assets/asset_niva_1/material/texturer/DiamondPlate006D_2K-JPG` |
| **B** | Diamond Plate007A 2K JPG * | 9.91 | True/True/True | `assets/asset_niva_1/material/texturer/DiamondPlate007A_2K-JPG` |
| **B** | Diamond Plate007B 2K JPG * | 14.79 | True/True/True | `assets/asset_niva_1/material/texturer/DiamondPlate007B_2K-JPG` |
| **B** | Diamond Plate007C 2K JPG * | 19.40 | True/True/True | `assets/asset_niva_1/material/texturer/DiamondPlate007C_2K-JPG` |
| **B** | Diamond Plate007D 2K JPG * | 18.48 | True/True/True | `assets/asset_niva_1/material/texturer/DiamondPlate007D_2K-JPG` |
| **B** | Diamond Plate008A 2K JPG * | 17.37 | True/True/True | `assets/asset_niva_1/material/texturer/DiamondPlate008A_2K-JPG` |
| **B** | Diamond Plate008B 2K JPG * | 17.01 | True/True/True | `assets/asset_niva_1/material/texturer/DiamondPlate008B_2K-JPG` |
| **B** | Diamond Plate008C 2K JPG * | 17.74 | True/True/True | `assets/asset_niva_1/material/texturer/DiamondPlate008C_2K-JPG` |
| **B** | Diamond Plate008D 2K JPG * | 17.39 | True/True/True | `assets/asset_niva_1/material/texturer/DiamondPlate008D_2K-JPG` |
| **B** | Diamond Plate009 2K JPG * | 23.19 | True/True/True | `assets/asset_niva_1/material/texturer/DiamondPlate009_2K-JPG` |
| **B** | Fabric005 * | 35.89 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric005` |
| **B** | Fabric006 * | 39.48 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric006` |
| **B** | Fabric007 * | 26.36 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric007` |
| **B** | Fabric008 * | 24.94 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric008` |
| **B** | Fabric009 * | 23.69 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric009` |
| **B** | Fabric011 * | 19.38 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric011` |
| **B** | Fabric012 * | 21.28 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric012` |
| **B** | Fabric013 * | 20.97 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric013` |
| **B** | Fabric016 * | 25.25 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric016` |
| **B** | Fabric017 * | 26.83 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric017` |
| **B** | Fabric018 * | 21.40 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric018` |
| **B** | Fabric019 * | 23.22 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric019` |
| **B** | Fabric020 * | 25.69 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric020` |
| **B** | Fabric021 * | 23.53 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric021` |
| **B** | Fabric030 * | 38.03 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric030` |
| **B** | Fabric031 * | 32.53 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric031` |
| **B** | Fabric032 * | 27.98 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric032` |
| **B** | Fabric034 * | 31.42 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric034` |
| **B** | Fabric035 * | 36.48 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric035` |
| **B** | Fabric036 * | 33.93 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric036` |
| **B** | Fabric037 * | 33.56 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric037` |
| **B** | Fabric038 * | 36.98 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric038` |
| **B** | Fabric039 * | 35.39 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric039` |
| **B** | Fabric040 * | 34.28 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric040` |
| **B** | Fabric041 * | 35.94 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric041` |
| **B** | Fabric042 * | 35.25 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric042` |
| **B** | Fabric043 * | 35.29 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric043` |
| **B** | Fabric044 * | 27.42 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric044` |
| **B** | Fabric045 * | 31.54 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric045` |
| **B** | Fabric046 * | 26.20 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric046` |
| **B** | Fabric047 * | 24.53 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric047` |
| **B** | Fabric048 * | 23.66 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric048` |
| **B** | Fabric049 * | 23.87 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric049` |
| **B** | Fabric050 * | 35.02 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric050` |
| **B** | Fabric051 * | 33.04 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric051` |
| **B** | Fabric052 * | 34.37 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric052` |
| **B** | Fabric053 * | 34.58 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric053` |
| **B** | Fabric054 * | 33.10 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric054` |
| **B** | Fabric055 * | 28.59 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric055` |
| **B** | Fabric056 * | 28.78 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric056` |
| **B** | Fabric057 * | 33.77 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric057` |
| **B** | Fabric058 * | 35.60 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric058` |
| **B** | Fabric059 * | 33.38 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric059` |
| **B** | Fabric060 * | 31.95 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric060` |
| **B** | Fabric061 * | 33.40 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric061` |
| **B** | Fabric062 * | 31.58 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric062` |
| **B** | Fabric063 * | 33.15 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric063` |
| **B** | Fabric064 * | 33.35 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric064` |
| **B** | Fabric065 * | 31.75 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric065` |
| **B** | Fabric066 * | 35.77 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric066` |
| **B** | Fabric067 * | 27.69 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric067` |
| **B** | Fabric068 * | 30.18 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric068` |
| **B** | Fabric069 * | 33.78 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric069` |
| **B** | Fabric070 * | 30.96 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric070` |
| **B** | Fabric071 * | 29.11 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric071` |
| **B** | Fabric072 * | 35.09 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric072` |
| **B** | Fabric073 * | 32.78 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric073` |
| **B** | Fabric074 * | 29.41 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric074` |
| **B** | Fabric075 * | 29.01 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric075` |
| **B** | Fabric076 * | 29.24 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric076` |
| **B** | Fabric077 * | 33.29 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric077` |
| **B** | Fabric078 * | 35.53 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric078` |
| **B** | Fabric079 * | 27.25 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric079` |
| **B** | Fabric081A * | 28.81 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric081A` |
| **B** | Fabric081B * | 23.85 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric081B` |
| **B** | Fabric081C * | 21.43 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric081C` |
| **B** | Fabric082A * | 26.53 | True/True/True | `assets/asset_niva_1/material/texturer/Fabric082A` |
| **B** | Fence002 * | 18.33 | True/True/True | `assets/asset_niva_1/material/texturer/Fence002` |
| **B** | Fence002 2K JPG * | 14.17 | True/True/True | `assets/asset_niva_1/material/texturer/Fence002_2K-JPG` |
| **B** | Fence004 * | 15.01 | True/True/True | `assets/asset_niva_1/material/texturer/Fence004` |
| **B** | Fence004 2K JPG * | 11.44 | True/True/True | `assets/asset_niva_1/material/texturer/Fence004_2K-JPG` |
| **B** | Fence005 * | 18.16 | True/True/True | `assets/asset_niva_1/material/texturer/Fence005` |
| **B** | Fence005 2K JPG * | 14.05 | True/True/True | `assets/asset_niva_1/material/texturer/Fence005_2K-JPG` |
| **B** | Fence006 * | 18.80 | True/True/True | `assets/asset_niva_1/material/texturer/Fence006` |
| **B** | Fence006 2K JPG * | 14.60 | True/True/True | `assets/asset_niva_1/material/texturer/Fence006_2K-JPG` |
| **B** | Fence007A * | 14.81 | True/True/True | `assets/asset_niva_1/material/texturer/Fence007A` |
| **B** | Fence007A 2K JPG * | 10.98 | True/True/True | `assets/asset_niva_1/material/texturer/Fence007A_2K-JPG` |
| **B** | Fence007C * | 19.14 | True/True/True | `assets/asset_niva_1/material/texturer/Fence007C` |
| **B** | Fence007C 2K JPG * | 14.19 | True/True/True | `assets/asset_niva_1/material/texturer/Fence007C_2K-JPG` |
| **B** | Fence008A * | 15.29 | True/True/True | `assets/asset_niva_1/material/texturer/Fence008A` |
| **B** | Fence008A 2K JPG * | 11.36 | True/True/True | `assets/asset_niva_1/material/texturer/Fence008A_2K-JPG` |
| **B** | Fence008B * | 19.45 | True/True/True | `assets/asset_niva_1/material/texturer/Fence008B` |
| **B** | Fence008B 2K JPG * | 15.13 | True/True/True | `assets/asset_niva_1/material/texturer/Fence008B_2K-JPG` |
| **B** | Fence008C * | 19.62 | True/True/True | `assets/asset_niva_1/material/texturer/Fence008C` |
| **B** | Fence008C 2K JPG * | 14.80 | True/True/True | `assets/asset_niva_1/material/texturer/Fence008C_2K-JPG` |
| **B** | Grate001 2K JPG * | 15.66 | True/True/True | `assets/asset_niva_1/material/texturer/Grate001_2K-JPG` |
| **B** | Grate002 2K JPG * | 10.67 | True/True/True | `assets/asset_niva_1/material/texturer/Grate002_2K-JPG` |
| **B** | Metal001 * | 14.99 | True/True/True | `assets/asset_niva_1/material/texturer/Metal001` |
| **B** | Metal002 * | 20.06 | True/True/True | `assets/asset_niva_1/material/texturer/Metal002` |
| **B** | Metal003 2K JPG * | 12.76 | True/True/True | `assets/asset_niva_1/material/texturer/Metal003_2K-JPG` |
| **B** | Metal004 * | 20.18 | True/True/True | `assets/asset_niva_1/material/texturer/Metal004` |
| **B** | Metal005 * | 32.76 | True/True/True | `assets/asset_niva_1/material/texturer/Metal005` |
| **B** | Metal006 * | 5.67 | True/True/True | `assets/asset_niva_1/material/texturer/Metal006` |
| **B** | Metal007 2K JPG * | 12.49 | True/True/True | `assets/asset_niva_1/material/texturer/Metal007_2K-JPG` |
| **B** | Metal008 2K JPG * | 12.80 | True/True/True | `assets/asset_niva_1/material/texturer/Metal008_2K-JPG` |
| **B** | Metal009 2K JPG * | 11.42 | True/True/True | `assets/asset_niva_1/material/texturer/Metal009_2K-JPG` |
| **B** | Metal010 2K JPG * | 12.77 | True/True/True | `assets/asset_niva_1/material/texturer/Metal010_2K-JPG` |
| **B** | Metal011 2K JPG * | 10.40 | True/True/True | `assets/asset_niva_1/material/texturer/Metal011_2K-JPG` |
| **B** | Metal012 2K JPG * | 8.94 | True/True/True | `assets/asset_niva_1/material/texturer/Metal012_2K-JPG` |
| **B** | Metal014 * | 26.40 | True/True/True | `assets/asset_niva_1/material/texturer/Metal014` |
| **B** | Metal015 * | 23.30 | True/True/True | `assets/asset_niva_1/material/texturer/Metal015` |
| **B** | Metal016 * | 24.69 | True/True/True | `assets/asset_niva_1/material/texturer/Metal016` |
| **B** | Metal017 * | 23.81 | True/True/True | `assets/asset_niva_1/material/texturer/Metal017` |
| **B** | Metal020 * | 26.19 | True/True/True | `assets/asset_niva_1/material/texturer/Metal020` |
| **B** | Metal021 2K JPG * | 16.22 | True/True/True | `assets/asset_niva_1/material/texturer/Metal021_2K-JPG` |
| **B** | Metal023 * | 31.64 | True/True/True | `assets/asset_niva_1/material/texturer/Metal023` |
| **B** | Metal024 2K JPG * | 14.21 | True/True/True | `assets/asset_niva_1/material/texturer/Metal024_2K-JPG` |
| **B** | Metal027 2K JPG * | 16.92 | True/True/True | `assets/asset_niva_1/material/texturer/Metal027_2K-JPG` |
| **B** | Metal028 2K JPG * | 18.74 | True/True/True | `assets/asset_niva_1/material/texturer/Metal028_2K-JPG` |
| **B** | Metal029 2K JPG * | 17.42 | True/True/True | `assets/asset_niva_1/material/texturer/Metal029_2K-JPG` |
| **B** | Metal030 2K JPG * | 8.07 | True/True/True | `assets/asset_niva_1/material/texturer/Metal030_2K-JPG` |
| **B** | Metal031 2K JPG * | 7.85 | True/True/True | `assets/asset_niva_1/material/texturer/Metal031_2K-JPG` |
| **B** | Metal032 2K JPG * | 10.34 | True/True/True | `assets/asset_niva_1/material/texturer/Metal032_2K-JPG` |
| **B** | Metal033 2K JPG * | 10.67 | True/True/True | `assets/asset_niva_1/material/texturer/Metal033_2K-JPG` |
| **B** | Metal034 2K JPG * | 6.27 | True/True/True | `assets/asset_niva_1/material/texturer/Metal034_2K-JPG` |
| **B** | Metal035 2K JPG * | 9.67 | True/True/True | `assets/asset_niva_1/material/texturer/Metal035_2K-JPG` |
| **B** | Metal036 2K JPG * | 9.70 | True/True/True | `assets/asset_niva_1/material/texturer/Metal036_2K-JPG` |
| **B** | Metal037 * | 18.34 | True/True/True | `assets/asset_niva_1/material/texturer/Metal037` |
| **B** | Metal038 2K JPG * | 11.21 | True/True/True | `assets/asset_niva_1/material/texturer/Metal038_2K-JPG` |
| **B** | Metal039 * | 27.06 | True/True/True | `assets/asset_niva_1/material/texturer/Metal039` |
| **B** | Metal040 * | 19.73 | True/True/True | `assets/asset_niva_1/material/texturer/Metal040` |
| **B** | Metal041A 2K JPG * | 9.05 | True/True/True | `assets/asset_niva_1/material/texturer/Metal041A_2K-JPG` |
| **B** | Metal041C 2K JPG * | 17.12 | True/True/True | `assets/asset_niva_1/material/texturer/Metal041C_2K-JPG` |
| **B** | Metal042A 2K JPG * | 6.93 | True/True/True | `assets/asset_niva_1/material/texturer/Metal042A_2K-JPG` |
| **B** | Metal042B * | 19.78 | True/True/True | `assets/asset_niva_1/material/texturer/Metal042B` |
| **B** | Metal043A * | 14.81 | True/True/True | `assets/asset_niva_1/material/texturer/Metal043A` |
| **B** | Metal043B * | 16.10 | True/True/True | `assets/asset_niva_1/material/texturer/Metal043B` |
| **B** | Metal044A 2K JPG * | 6.57 | True/True/True | `assets/asset_niva_1/material/texturer/Metal044A_2K-JPG` |
| **B** | Metal044B 2K JPG * | 8.76 | True/True/True | `assets/asset_niva_1/material/texturer/Metal044B_2K-JPG` |
| **B** | Metal045A * | 17.96 | True/True/True | `assets/asset_niva_1/material/texturer/Metal045A` |
| **B** | Metal045B * | 18.81 | True/True/True | `assets/asset_niva_1/material/texturer/Metal045B` |
| **B** | Metal046A 2K JPG * | 11.00 | True/True/True | `assets/asset_niva_1/material/texturer/Metal046A_2K-JPG` |
| **B** | Metal046B 2K JPG * | 15.83 | True/True/True | `assets/asset_niva_1/material/texturer/Metal046B_2K-JPG` |
| **B** | Metal047A 2K JPG * | 9.34 | True/True/True | `assets/asset_niva_1/material/texturer/Metal047A_2K-JPG` |
| **B** | Metal047B 2K JPG * | 16.71 | True/True/True | `assets/asset_niva_1/material/texturer/Metal047B_2K-JPG` |
| **B** | Metal048A 2K JPG * | 4.28 | True/True/True | `assets/asset_niva_1/material/texturer/Metal048A_2K-JPG` |
| **B** | Metal048B 2K JPG * | 6.50 | True/True/True | `assets/asset_niva_1/material/texturer/Metal048B_2K-JPG` |
| **B** | Metal048C 2K JPG * | 9.56 | True/True/True | `assets/asset_niva_1/material/texturer/Metal048C_2K-JPG` |
| **B** | Metal049A 2K JPG * | 4.82 | True/True/True | `assets/asset_niva_1/material/texturer/Metal049A_2K-JPG` |
| **B** | Metal049B 2K JPG * | 5.60 | True/True/True | `assets/asset_niva_1/material/texturer/Metal049B_2K-JPG` |
| **B** | Metal049C 2K JPG * | 6.52 | True/True/True | `assets/asset_niva_1/material/texturer/Metal049C_2K-JPG` |
| **B** | Metal050A 2K JPG * | 4.47 | True/True/True | `assets/asset_niva_1/material/texturer/Metal050A_2K-JPG` |
| **B** | Metal050B * | 6.75 | True/True/True | `assets/asset_niva_1/material/texturer/Metal050B` |
| **B** | Metal050C 2K JPG * | 7.61 | True/True/True | `assets/asset_niva_1/material/texturer/Metal050C_2K-JPG` |
| **B** | Metal051A 2K JPG * | 6.08 | True/True/True | `assets/asset_niva_1/material/texturer/Metal051A_2K-JPG` |
| **B** | Metal051B * | 7.89 | True/True/True | `assets/asset_niva_1/material/texturer/Metal051B` |
| **B** | Metal051C 2K JPG * | 7.49 | True/True/True | `assets/asset_niva_1/material/texturer/Metal051C_2K-JPG` |
| **B** | Metal052A 2K JPG * | 4.94 | True/True/True | `assets/asset_niva_1/material/texturer/Metal052A_2K-JPG` |
| **B** | Metal052B * | 10.35 | True/True/True | `assets/asset_niva_1/material/texturer/Metal052B` |
| **B** | Metal052C 2K JPG * | 11.30 | True/True/True | `assets/asset_niva_1/material/texturer/Metal052C_2K-JPG` |
| **B** | Metal053A * | 8.14 | True/True/True | `assets/asset_niva_1/material/texturer/Metal053A` |
| **B** | Metal053B 2K JPG * | 10.13 | True/True/True | `assets/asset_niva_1/material/texturer/Metal053B_2K-JPG` |
| **B** | Metal053C 2K JPG * | 14.31 | True/True/True | `assets/asset_niva_1/material/texturer/Metal053C_2K-JPG` |
| **B** | Metal054A * | 9.35 | True/True/True | `assets/asset_niva_1/material/texturer/Metal054A` |
| **B** | Metal054B * | 16.28 | True/True/True | `assets/asset_niva_1/material/texturer/Metal054B` |
| **B** | Metal055A 2K JPG * | 9.88 | True/True/True | `assets/asset_niva_1/material/texturer/Metal055A_2K-JPG` |
| **B** | Metal055B 2K JPG * | 10.30 | True/True/True | `assets/asset_niva_1/material/texturer/Metal055B_2K-JPG` |
| **B** | Metal055C * | 17.96 | True/True/True | `assets/asset_niva_1/material/texturer/Metal055C` |
| **B** | Metal056A * | 15.37 | True/True/True | `assets/asset_niva_1/material/texturer/Metal056A` |
| **B** | Metal056B 2K JPG * | 13.31 | True/True/True | `assets/asset_niva_1/material/texturer/Metal056B_2K-JPG` |
| **B** | Metal057A 2K JPG * | 4.71 | True/True/True | `assets/asset_niva_1/material/texturer/Metal057A_2K-JPG` |
| **B** | Metal057B * | 8.76 | True/True/True | `assets/asset_niva_1/material/texturer/Metal057B` |
| **B** | Metal057C * | 10.21 | True/True/True | `assets/asset_niva_1/material/texturer/Metal057C` |
| **B** | Metal058A 2K JPG * | 5.53 | True/True/True | `assets/asset_niva_1/material/texturer/Metal058A_2K-JPG` |
| **B** | Metal058B * | 16.20 | True/True/True | `assets/asset_niva_1/material/texturer/Metal058B` |
| **B** | Metal058C 2K JPG * | 18.27 | True/True/True | `assets/asset_niva_1/material/texturer/Metal058C_2K-JPG` |
| **B** | Metal059A 2K JPG * | 3.89 | True/True/True | `assets/asset_niva_1/material/texturer/Metal059A_2K-JPG` |
| **B** | Metal059B * | 11.36 | True/True/True | `assets/asset_niva_1/material/texturer/Metal059B` |
| **B** | Metal059C 2K JPG * | 11.59 | True/True/True | `assets/asset_niva_1/material/texturer/Metal059C_2K-JPG` |
| **B** | Metal060A * | 6.12 | True/True/True | `assets/asset_niva_1/material/texturer/Metal060A` |
| **B** | Metal060B * | 11.63 | True/True/True | `assets/asset_niva_1/material/texturer/Metal060B` |
| **B** | Metal060C * | 16.08 | True/True/True | `assets/asset_niva_1/material/texturer/Metal060C` |
| **B** | Metal061A 2K JPG * | 6.73 | True/True/True | `assets/asset_niva_1/material/texturer/Metal061A_2K-JPG` |
| **B** | Metal061B 2K JPG * | 8.92 | True/True/True | `assets/asset_niva_1/material/texturer/Metal061B_2K-JPG` |
| **B** | Metal061C * | 16.18 | True/True/True | `assets/asset_niva_1/material/texturer/Metal061C` |
| **B** | Metal062A * | 6.10 | True/True/True | `assets/asset_niva_1/material/texturer/Metal062A` |
| **B** | Metal062B * | 10.32 | True/True/True | `assets/asset_niva_1/material/texturer/Metal062B` |
| **B** | Metal062C 2K JPG * | 14.50 | True/True/True | `assets/asset_niva_1/material/texturer/Metal062C_2K-JPG` |
| **B** | Metal063 2K JPG * | 15.86 | True/True/True | `assets/asset_niva_1/material/texturer/Metal063_2K-JPG` |
| **B** | Metall Plates001 * | 15.63 | True/True/True | `assets/asset_niva_1/material/texturer/MetalPlates001` |
| **B** | Metall Plates002 * | 14.16 | True/True/True | `assets/asset_niva_1/material/texturer/MetalPlates002` |
| **B** | Metall Plates003 * | 15.12 | True/True/True | `assets/asset_niva_1/material/texturer/MetalPlates003` |
| **B** | Metall Plates004 * | 7.97 | True/True/True | `assets/asset_niva_1/material/texturer/MetalPlates004` |
| **B** | Metall Plates005 * | 8.03 | True/True/True | `assets/asset_niva_1/material/texturer/MetalPlates005` |
| **B** | Metall Plates006 2K JPG * | 8.52 | True/True/True | `assets/asset_niva_1/material/texturer/MetalPlates006_2K-JPG` |
| **B** | Metall Plates007 * | 9.12 | True/True/True | `assets/asset_niva_1/material/texturer/MetalPlates007` |
| **B** | Metall Plates008 * | 10.07 | True/True/True | `assets/asset_niva_1/material/texturer/MetalPlates008` |
| **B** | Metall Plates009 * | 11.73 | True/True/True | `assets/asset_niva_1/material/texturer/MetalPlates009` |
| **B** | Metall Plates010 * | 25.39 | True/True/True | `assets/asset_niva_1/material/texturer/MetalPlates010` |
| **B** | Metall Plates011 * | 23.33 | True/True/True | `assets/asset_niva_1/material/texturer/MetalPlates011` |
| **B** | Metall Plates012 * | 28.02 | True/True/True | `assets/asset_niva_1/material/texturer/MetalPlates012` |
| **B** | Metall Plates013 2K JPG * | 16.38 | True/True/True | `assets/asset_niva_1/material/texturer/MetalPlates013_2K-JPG` |
| **B** | Metall Plates014 * | 14.82 | True/True/True | `assets/asset_niva_1/material/texturer/MetalPlates014` |
| **B** | Målad Metal001 * | 28.99 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedMetal001` |
| **B** | Målad Metal002 * | 28.51 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedMetal002` |
| **B** | Målad Metal003 * | 29.92 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedMetal003` |
| **B** | Målad Metal004 * | 25.74 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedMetal004` |
| **B** | Målad Metal005 * | 25.84 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedMetal005` |
| **B** | Målad Metal007 * | 29.33 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedMetal007` |
| **B** | Målad Metal008 * | 33.72 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedMetal008` |
| **B** | Målad Metal009 * | 35.23 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedMetal009` |
| **B** | Målad Metal010 * | 24.00 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedMetal010` |
| **B** | Målad Metal013 * | 37.13 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedMetal013` |
| **B** | Målad Metal015 * | 31.60 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedMetal015` |
| **B** | Målad Metal016 * | 36.31 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedMetal016` |
| **B** | Målad Metal017 * | 33.45 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedMetal017` |
| **B** | Målad Metal018 * | 33.44 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedMetal018` |
| **B** | Målad Wood001 * | 29.75 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood001` |
| **B** | Målad Wood001 2K JPG * | 20.54 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood001_2K-JPG` |
| **B** | Målad Wood002 * | 29.91 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood002` |
| **B** | Målad Wood002 2K JPG * | 20.69 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood002_2K-JPG` |
| **B** | Målad Wood003 * | 28.88 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood003` |
| **B** | Målad Wood003 2K JPG * | 19.74 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood003_2K-JPG` |
| **B** | Målad Wood004 * | 29.25 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood004` |
| **B** | Målad Wood004 2K JPG * | 20.14 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood004_2K-JPG` |
| **B** | Målad Wood005 * | 26.29 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood005` |
| **B** | Målad Wood005 2K JPG * | 17.11 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood005_2K-JPG` |
| **B** | Målad Wood006A * | 25.90 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood006A` |
| **B** | Målad Wood006A 2K JPG * | 17.81 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood006A_2K-JPG` |
| **B** | Målad Wood006B * | 26.90 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood006B` |
| **B** | Målad Wood006B 2K JPG * | 18.59 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood006B_2K-JPG` |
| **B** | Målad Wood006C * | 27.50 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood006C` |
| **B** | Målad Wood006C 2K JPG * | 18.67 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood006C_2K-JPG` |
| **B** | Målad Wood007A * | 26.57 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood007A` |
| **B** | Målad Wood007A 2K JPG * | 18.13 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood007A_2K-JPG` |
| **B** | Målad Wood007B 2K JPG * | 21.14 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood007B_2K-JPG` |
| **B** | Målad Wood007C 2K JPG * | 18.90 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood007C_2K-JPG` |
| **B** | Målad Wood008A * | 26.82 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood008A` |
| **B** | Målad Wood008A 2K JPG * | 18.28 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood008A_2K-JPG` |
| **B** | Målad Wood008B * | 28.18 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood008B` |
| **B** | Målad Wood008B 2K JPG * | 19.53 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood008B_2K-JPG` |
| **B** | Målad Wood008C 2K JPG * | 18.99 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood008C_2K-JPG` |
| **B** | Målad Wood009A * | 25.90 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood009A` |
| **B** | Målad Wood009A 2K JPG * | 17.66 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood009A_2K-JPG` |
| **B** | Målad Wood009B * | 28.09 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood009B` |
| **B** | Målad Wood009B 2K JPG * | 19.46 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood009B_2K-JPG` |
| **B** | Målad Wood009C 2K JPG * | 18.96 | True/True/True | `assets/asset_niva_1/material/texturer/PaintedWood009C_2K-JPG` |
| **B** | Planks003 * | 25.42 | True/True/True | `assets/asset_niva_1/material/texturer/Planks003` |
| **B** | Planks004 * | 25.36 | True/True/True | `assets/asset_niva_1/material/texturer/Planks004` |
| **B** | Planks006 * | 29.13 | True/True/True | `assets/asset_niva_1/material/texturer/Planks006` |
| **B** | Planks007 * | 26.55 | True/True/True | `assets/asset_niva_1/material/texturer/Planks007` |
| **B** | Planks008 * | 17.94 | True/True/True | `assets/asset_niva_1/material/texturer/Planks008` |
| **B** | Planks009 * | 22.28 | True/True/True | `assets/asset_niva_1/material/texturer/Planks009` |
| **B** | Planks010 * | 22.50 | True/True/True | `assets/asset_niva_1/material/texturer/Planks010` |
| **B** | Planks012 * | 29.58 | True/True/True | `assets/asset_niva_1/material/texturer/Planks012` |
| **B** | Planks013 * | 30.14 | True/True/True | `assets/asset_niva_1/material/texturer/Planks013` |
| **B** | Planks014 * | 32.94 | True/True/True | `assets/asset_niva_1/material/texturer/Planks014` |
| **B** | Planks017 * | 31.14 | True/True/True | `assets/asset_niva_1/material/texturer/Planks017` |
| **B** | Planks018 * | 31.14 | True/True/True | `assets/asset_niva_1/material/texturer/Planks018` |
| **B** | Planks019 * | 29.78 | True/True/True | `assets/asset_niva_1/material/texturer/Planks019` |
| **B** | Planks021 2K JPG * | 16.16 | True/True/True | `assets/asset_niva_1/material/texturer/Planks021_2K-JPG` |
| **B** | Planks022 * | 28.67 | True/True/True | `assets/asset_niva_1/material/texturer/Planks022` |
| **B** | Planks023A 2K JPG * | 15.90 | True/True/True | `assets/asset_niva_1/material/texturer/Planks023A_2K-JPG` |
| **B** | Planks023B 2K JPG * | 16.11 | True/True/True | `assets/asset_niva_1/material/texturer/Planks023B_2K-JPG` |
| **B** | Planks023C * | 25.19 | True/True/True | `assets/asset_niva_1/material/texturer/Planks023C` |
| **B** | Planks024A * | 23.98 | True/True/True | `assets/asset_niva_1/material/texturer/Planks024A` |
| **B** | Planks024B * | 23.95 | True/True/True | `assets/asset_niva_1/material/texturer/Planks024B` |
| **B** | Planks024C * | 25.01 | True/True/True | `assets/asset_niva_1/material/texturer/Planks024C` |
| **B** | Planks025A * | 26.01 | True/True/True | `assets/asset_niva_1/material/texturer/Planks025A` |
| **B** | Planks025B * | 26.16 | True/True/True | `assets/asset_niva_1/material/texturer/Planks025B` |
| **B** | Planks025C * | 26.20 | True/True/True | `assets/asset_niva_1/material/texturer/Planks025C` |
| **B** | Planks026A * | 25.12 | True/True/True | `assets/asset_niva_1/material/texturer/Planks026A` |
| **B** | Planks026B * | 25.55 | True/True/True | `assets/asset_niva_1/material/texturer/Planks026B` |
| **B** | Planks026C * | 26.39 | True/True/True | `assets/asset_niva_1/material/texturer/Planks026C` |
| **B** | Planks027A * | 25.28 | True/True/True | `assets/asset_niva_1/material/texturer/Planks027A` |
| **B** | Planks027B * | 25.44 | True/True/True | `assets/asset_niva_1/material/texturer/Planks027B` |
| **B** | Planks028 * | 22.59 | True/True/True | `assets/asset_niva_1/material/texturer/Planks028` |
| **B** | Planks029L * | 30.54 | True/True/True | `assets/asset_niva_1/material/texturer/Planks029L` |
| **B** | Planks029S * | 29.12 | True/True/True | `assets/asset_niva_1/material/texturer/Planks029S` |
| **B** | Planks030A * | 30.70 | True/True/True | `assets/asset_niva_1/material/texturer/Planks030A` |
| **B** | Planks030B * | 30.69 | True/True/True | `assets/asset_niva_1/material/texturer/Planks030B` |
| **B** | Planks030C * | 30.75 | True/True/True | `assets/asset_niva_1/material/texturer/Planks030C` |
| **B** | Planks031A * | 30.70 | True/True/True | `assets/asset_niva_1/material/texturer/Planks031A` |
| **B** | Planks031C * | 31.06 | True/True/True | `assets/asset_niva_1/material/texturer/Planks031C` |
| **B** | Planks032 * | 29.25 | True/True/True | `assets/asset_niva_1/material/texturer/Planks032` |
| **B** | Planks033A * | 22.74 | True/True/True | `assets/asset_niva_1/material/texturer/Planks033A` |
| **B** | Planks033B 2K JPG * | 15.83 | True/True/True | `assets/asset_niva_1/material/texturer/Planks033B_2K-JPG` |
| **B** | Planks034A * | 23.89 | True/True/True | `assets/asset_niva_1/material/texturer/Planks034A` |
| **B** | Planks034B * | 23.63 | True/True/True | `assets/asset_niva_1/material/texturer/Planks034B` |
| **B** | Planks035A * | 23.87 | True/True/True | `assets/asset_niva_1/material/texturer/Planks035A` |
| **B** | Planks035B * | 23.60 | True/True/True | `assets/asset_niva_1/material/texturer/Planks035B` |
| **B** | Planks036A * | 21.36 | True/True/True | `assets/asset_niva_1/material/texturer/Planks036A` |
| **B** | Planks036B * | 21.05 | True/True/True | `assets/asset_niva_1/material/texturer/Planks036B` |
| **B** | Planks037B 2K JPG * | 14.51 | True/True/True | `assets/asset_niva_1/material/texturer/Planks037B_2K-JPG` |
| **B** | Planks039 2K JPG * | 8.51 | True/True/True | `assets/asset_niva_1/material/texturer/Planks039_2K-JPG` |
| **B** | Rails001 2K JPG * | 20.31 | True/True/True | `assets/asset_niva_1/material/texturer/Rails001_2K-JPG` |
| **B** | Rust003 * | 27.55 | True/True/True | `assets/asset_niva_1/material/texturer/Rust003` |
| **B** | Rust004 * | 27.39 | True/True/True | `assets/asset_niva_1/material/texturer/Rust004` |
| **B** | Rust006 * | 27.76 | True/True/True | `assets/asset_niva_1/material/texturer/Rust006` |
| **B** | Rust008 * | 26.18 | True/True/True | `assets/asset_niva_1/material/texturer/Rust008` |
| **B** | Rust010 * | 26.58 | True/True/True | `assets/asset_niva_1/material/texturer/Rust010` |
| **B** | Plåt Metal001 2K JPG * | 10.94 | True/True/True | `assets/asset_niva_1/material/texturer/SheetMetal001_2K-JPG` |
| **B** | Plåt Metal002 * | 14.19 | True/True/True | `assets/asset_niva_1/material/texturer/SheetMetal002` |
| **B** | Plåt Metal003 * | 15.50 | True/True/True | `assets/asset_niva_1/material/texturer/SheetMetal003` |
| **B** | Plåt Metal004 * | 13.54 | True/True/True | `assets/asset_niva_1/material/texturer/SheetMetal004` |
| **B** | Träd End001 2K JPG * | 8.29 | True/True/True | `assets/asset_niva_1/material/texturer/TreeEnd001_2K-JPG` |
| **B** | Träd End002 2K JPG * | 15.78 | True/True/True | `assets/asset_niva_1/material/texturer/TreeEnd002_2K-JPG` |
| **B** | Träd End003 2K JPG * | 12.40 | True/True/True | `assets/asset_niva_1/material/texturer/TreeEnd003_2K-JPG` |
| **B** | Träd End004 2K JPG * | 10.78 | True/True/True | `assets/asset_niva_1/material/texturer/TreeEnd004_2K-JPG` |
| **B** | Wood001 * | 22.77 | True/True/True | `assets/asset_niva_1/material/texturer/Wood001` |
| **B** | Wood002 * | 21.00 | True/True/True | `assets/asset_niva_1/material/texturer/Wood002` |
| **B** | Wood003 * | 21.27 | True/True/True | `assets/asset_niva_1/material/texturer/Wood003` |
| **B** | Wood004 * | 21.60 | True/True/True | `assets/asset_niva_1/material/texturer/Wood004` |
| **B** | Wood005 * | 18.27 | True/True/True | `assets/asset_niva_1/material/texturer/Wood005` |
| **B** | Wood006 2K JPG * | 11.16 | True/True/True | `assets/asset_niva_1/material/texturer/Wood006_2K-JPG` |
| **B** | Wood007 * | 17.46 | True/True/True | `assets/asset_niva_1/material/texturer/Wood007` |
| **B** | Wood008 * | 17.84 | True/True/True | `assets/asset_niva_1/material/texturer/Wood008` |
| **B** | Wood009 * | 19.31 | True/True/True | `assets/asset_niva_1/material/texturer/Wood009` |
| **B** | Wood010 * | 19.63 | True/True/True | `assets/asset_niva_1/material/texturer/Wood010` |
| **B** | Wood013 * | 16.47 | True/True/True | `assets/asset_niva_1/material/texturer/Wood013` |
| **B** | Wood014 * | 17.24 | True/True/True | `assets/asset_niva_1/material/texturer/Wood014` |
| **B** | Wood015 * | 16.16 | True/True/True | `assets/asset_niva_1/material/texturer/Wood015` |
| **B** | Wood016 * | 17.21 | True/True/True | `assets/asset_niva_1/material/texturer/Wood016` |
| **B** | Wood017 * | 15.76 | True/True/True | `assets/asset_niva_1/material/texturer/Wood017` |
| **B** | Wood018 * | 14.25 | True/True/True | `assets/asset_niva_1/material/texturer/Wood018` |
| **B** | Wood019 * | 14.48 | True/True/True | `assets/asset_niva_1/material/texturer/Wood019` |
| **B** | Wood020 * | 17.50 | True/True/True | `assets/asset_niva_1/material/texturer/Wood020` |
| **B** | Wood021 2K JPG * | 15.29 | True/True/True | `assets/asset_niva_1/material/texturer/Wood021_2K-JPG` |
| **B** | Wood022 * | 23.69 | True/True/True | `assets/asset_niva_1/material/texturer/Wood022` |
| **B** | Wood023 2K JPG * | 14.84 | True/True/True | `assets/asset_niva_1/material/texturer/Wood023_2K-JPG` |
| **B** | Wood024 * | 23.94 | True/True/True | `assets/asset_niva_1/material/texturer/Wood024` |
| **B** | Wood025 2K JPG * | 15.73 | True/True/True | `assets/asset_niva_1/material/texturer/Wood025_2K-JPG` |
| **B** | Wood026 2K JPG * | 15.77 | True/True/True | `assets/asset_niva_1/material/texturer/Wood026_2K-JPG` |
| **B** | Wood027 2K JPG * | 15.83 | True/True/True | `assets/asset_niva_1/material/texturer/Wood027_2K-JPG` |
| **B** | Wood028 2K JPG * | 15.16 | True/True/True | `assets/asset_niva_1/material/texturer/Wood028_2K-JPG` |
| **B** | Wood029 * | 23.40 | True/True/True | `assets/asset_niva_1/material/texturer/Wood029` |
| **B** | Wood030 2K JPG * | 16.61 | True/True/True | `assets/asset_niva_1/material/texturer/Wood030_2K-JPG` |
| **B** | Wood031 * | 23.57 | True/True/True | `assets/asset_niva_1/material/texturer/Wood031` |
| **B** | Wood032 * | 23.60 | True/True/True | `assets/asset_niva_1/material/texturer/Wood032` |
| **B** | Wood033 * | 23.99 | True/True/True | `assets/asset_niva_1/material/texturer/Wood033` |
| **B** | Wood034 2K JPG * | 8.05 | True/True/True | `assets/asset_niva_1/material/texturer/Wood034_2K-JPG` |
| **B** | Wood037 * | 27.11 | True/True/True | `assets/asset_niva_1/material/texturer/Wood037` |
| **B** | Wood038 * | 28.46 | True/True/True | `assets/asset_niva_1/material/texturer/Wood038` |
| **B** | Wood039 * | 28.61 | True/True/True | `assets/asset_niva_1/material/texturer/Wood039` |
| **B** | Wood040 * | 25.41 | True/True/True | `assets/asset_niva_1/material/texturer/Wood040` |
| **B** | Wood041 * | 21.27 | True/True/True | `assets/asset_niva_1/material/texturer/Wood041` |
| **B** | Wood042 * | 19.41 | True/True/True | `assets/asset_niva_1/material/texturer/Wood042` |
| **B** | Wood043 * | 19.76 | True/True/True | `assets/asset_niva_1/material/texturer/Wood043` |
| **B** | Wood044 * | 19.80 | True/True/True | `assets/asset_niva_1/material/texturer/Wood044` |
| **B** | Wood045 * | 20.17 | True/True/True | `assets/asset_niva_1/material/texturer/Wood045` |
| **B** | Wood046 * | 18.36 | True/True/True | `assets/asset_niva_1/material/texturer/Wood046` |
| **B** | Wood047 2K JPG * | 9.82 | True/True/True | `assets/asset_niva_1/material/texturer/Wood047_2K-JPG` |
| **B** | Wood048 2K JPG * | 16.52 | True/True/True | `assets/asset_niva_1/material/texturer/Wood048_2K-JPG` |
| **B** | Wood050 2K JPG * | 17.29 | True/True/True | `assets/asset_niva_1/material/texturer/Wood050_2K-JPG` |
| **B** | Wood052 2K JPG * | 17.56 | True/True/True | `assets/asset_niva_1/material/texturer/Wood052_2K-JPG` |
| **B** | Wood053 * | 25.15 | True/True/True | `assets/asset_niva_1/material/texturer/Wood053` |
| **B** | Wood054 * | 25.60 | True/True/True | `assets/asset_niva_1/material/texturer/Wood054` |
| **B** | Wood055 * | 29.46 | True/True/True | `assets/asset_niva_1/material/texturer/Wood055` |
| **B** | Wood056 * | 26.10 | True/True/True | `assets/asset_niva_1/material/texturer/Wood056` |
| **B** | Wood057 * | 28.29 | True/True/True | `assets/asset_niva_1/material/texturer/Wood057` |
| **B** | Wood058 2K JPG * | 17.49 | True/True/True | `assets/asset_niva_1/material/texturer/Wood058_2K-JPG` |
| **B** | Wood059 2K JPG * | 24.87 | True/True/True | `assets/asset_niva_1/material/texturer/Wood059_2K-JPG` |
| **B** | Wood060 2K JPG * | 26.39 | True/True/True | `assets/asset_niva_1/material/texturer/Wood060_2K-JPG` |
| **B** | Wood061 2K JPG * | 26.64 | True/True/True | `assets/asset_niva_1/material/texturer/Wood061_2K-JPG` |
| **B** | Wood062 2K JPG * | 25.40 | True/True/True | `assets/asset_niva_1/material/texturer/Wood062_2K-JPG` |
| **B** | Wood063 2K JPG * | 26.32 | True/True/True | `assets/asset_niva_1/material/texturer/Wood063_2K-JPG` |
| **B** | Wood064 * | 35.46 | True/True/True | `assets/asset_niva_1/material/texturer/Wood064` |
| **B** | Wood065 * | 35.05 | True/True/True | `assets/asset_niva_1/material/texturer/Wood065` |
| **B** | Wood066 2K JPG * | 16.90 | True/True/True | `assets/asset_niva_1/material/texturer/Wood066_2K-JPG` |
| **B** | Wood067 2K JPG * | 15.41 | True/True/True | `assets/asset_niva_1/material/texturer/Wood067_2K-JPG` |
| **B** | Wood068 2K JPG * | 16.32 | True/True/True | `assets/asset_niva_1/material/texturer/Wood068_2K-JPG` |
| **B** | Wood069 * | 21.85 | True/True/True | `assets/asset_niva_1/material/texturer/Wood069` |
| **B** | Wood070 * | 17.73 | True/True/True | `assets/asset_niva_1/material/texturer/Wood070` |
| **B** | Wood071 * | 17.64 | True/True/True | `assets/asset_niva_1/material/texturer/Wood071` |
| **B** | Wood072 * | 17.66 | True/True/True | `assets/asset_niva_1/material/texturer/Wood072` |
| **B** | Wood074 * | 30.25 | True/True/True | `assets/asset_niva_1/material/texturer/Wood074` |
| **B** | Wood075 * | 30.78 | True/True/True | `assets/asset_niva_1/material/texturer/Wood075` |
| **B** | Wood076 2K JPG * | 21.61 | True/True/True | `assets/asset_niva_1/material/texturer/Wood076_2K-JPG` |
| **B** | Wood077 * | 31.47 | True/True/True | `assets/asset_niva_1/material/texturer/Wood077` |
| **B** | Wood078 * | 31.43 | True/True/True | `assets/asset_niva_1/material/texturer/Wood078` |
| **B** | Wood079 * | 31.32 | True/True/True | `assets/asset_niva_1/material/texturer/Wood079` |
| **B** | Wood080 * | 26.24 | True/True/True | `assets/asset_niva_1/material/texturer/Wood080` |
| **B** | Wood081 2K JPG * | 14.06 | True/True/True | `assets/asset_niva_1/material/texturer/Wood081_2K-JPG` |
| **B** | Wood082A * | 21.87 | True/True/True | `assets/asset_niva_1/material/texturer/Wood082A` |
| **B** | Wood082B * | 22.31 | True/True/True | `assets/asset_niva_1/material/texturer/Wood082B` |
| **B** | Wood083A 2K JPG * | 15.75 | True/True/True | `assets/asset_niva_1/material/texturer/Wood083A_2K-JPG` |
| **B** | Wood083B * | 22.39 | True/True/True | `assets/asset_niva_1/material/texturer/Wood083B` |
| **B** | Wood084A 2K JPG * | 15.70 | True/True/True | `assets/asset_niva_1/material/texturer/Wood084A_2K-JPG` |
| **B** | Wood084B * | 22.22 | True/True/True | `assets/asset_niva_1/material/texturer/Wood084B` |
| **B** | Wood085A * | 22.02 | True/True/True | `assets/asset_niva_1/material/texturer/Wood085A` |
| **B** | Wood085B * | 22.18 | True/True/True | `assets/asset_niva_1/material/texturer/Wood085B` |
| **B** | Wood085B 2K JPG * | 15.85 | True/True/True | `assets/asset_niva_1/material/texturer/Wood085B_2K-JPG` |
| **B** | Wood086 * | 33.91 | True/True/True | `assets/asset_niva_1/material/texturer/Wood086` |
| **B** | Wood086 2K JPG * | 23.77 | True/True/True | `assets/asset_niva_1/material/texturer/Wood086_2K-JPG` |
| **B** | Wood087 * | 27.27 | True/True/True | `assets/asset_niva_1/material/texturer/Wood087` |
| **B** | Wood087 2K JPG * | 17.63 | True/True/True | `assets/asset_niva_1/material/texturer/Wood087_2K-JPG` |
| **B** | Wood088 * | 27.63 | True/True/True | `assets/asset_niva_1/material/texturer/Wood088` |
| **B** | Wood088 2K JPG * | 17.86 | True/True/True | `assets/asset_niva_1/material/texturer/Wood088_2K-JPG` |
| **B** | Wood089 2K JPG * | 18.23 | True/True/True | `assets/asset_niva_1/material/texturer/Wood089_2K-JPG` |
| **B** | Wood090A 2K JPG * | 13.65 | True/True/True | `assets/asset_niva_1/material/texturer/Wood090A_2K-JPG` |
| **B** | Wood090B * | 16.05 | True/True/True | `assets/asset_niva_1/material/texturer/Wood090B` |
| **B** | Wood090B 2K JPG * | 12.82 | True/True/True | `assets/asset_niva_1/material/texturer/Wood090B_2K-JPG` |
| **B** | Wood091A * | 17.53 | True/True/True | `assets/asset_niva_1/material/texturer/Wood091A` |
| **B** | Wood091A 2K JPG * | 14.30 | True/True/True | `assets/asset_niva_1/material/texturer/Wood091A_2K-JPG` |
| **B** | Wood091B * | 15.95 | True/True/True | `assets/asset_niva_1/material/texturer/Wood091B` |
| **B** | Wood091B 2K JPG * | 12.73 | True/True/True | `assets/asset_niva_1/material/texturer/Wood091B_2K-JPG` |
| **B** | Wood092 2K JPG * | 12.22 | True/True/True | `assets/asset_niva_1/material/texturer/Wood092_2K-JPG` |
| **B** | Wood093 2K JPG * | 6.67 | True/True/True | `assets/asset_niva_1/material/texturer/Wood093_2K-JPG` |
| **B** | Wood094 2K JPG * | 10.75 | True/True/True | `assets/asset_niva_1/material/texturer/Wood094_2K-JPG` |
| **B** | Wood096 2K JPG * | 13.56 | True/True/True | `assets/asset_niva_1/material/texturer/Wood096_2K-JPG` |
| **B** | Trä Chips001 2K JPG * | 20.11 | True/True/True | `assets/asset_niva_1/material/texturer/WoodChips001_2K-JPG` |
| **B** | Trä Chips002 2K JPG * | 11.79 | True/True/True | `assets/asset_niva_1/material/texturer/WoodChips002_2K-JPG` |
| **B** | Trä Chips003 2K JPG * | 25.21 | True/True/True | `assets/asset_niva_1/material/texturer/WoodChips003_2K-JPG` |
| **B** | Trä Siding002 2K JPG * | 13.91 | True/True/True | `assets/asset_niva_1/material/texturer/WoodSiding002_2K-JPG` |
| **B** | Trä Siding004 2K JPG * | 12.82 | True/True/True | `assets/asset_niva_1/material/texturer/WoodSiding004_2K-JPG` |
| **B** | Trä Siding005 2K JPG * | 13.11 | True/True/True | `assets/asset_niva_1/material/texturer/WoodSiding005_2K-JPG` |
| **B** | Trä Siding006 2K JPG * | 13.10 | True/True/True | `assets/asset_niva_1/material/texturer/WoodSiding006_2K-JPG` |
| **B** | Trä Siding007 2K JPG * | 13.66 | True/True/True | `assets/asset_niva_1/material/texturer/WoodSiding007_2K-JPG` |
| **B** | Trä Siding008 2K JPG * | 13.48 | True/True/True | `assets/asset_niva_1/material/texturer/WoodSiding008_2K-JPG` |
| **B** | Trä Siding009 2K JPG * | 8.99 | True/True/True | `assets/asset_niva_1/material/texturer/WoodSiding009_2K-JPG` |
| **B** | Asbestos plåt * | 10.66 | True/True/True | `assets/asset_niva_1/material/texturer/asbestos_sheet` |
| **B** | Asbestos plåt 02 * | 11.07 | True/True/True | `assets/asset_niva_1/material/texturer/asbestos_sheet_02` |
| **B** | Bitumen * | 9.00 | True/True/True | `assets/asset_niva_1/material/texturer/bitumen` |
| **B** | Black målad plankor * | 11.58 | True/True/True | `assets/asset_niva_1/material/texturer/black_painted_planks` |
| **B** | Blue metall plate * | 6.00 | True/True/True | `assets/asset_niva_1/material/texturer/blue_metal_plate` |
| **B** | Blue målad plankor * | 8.70 | True/True/True | `assets/asset_niva_1/material/texturer/blue_painted_planks` |
| **B** | Brown läder * | 12.41 | True/True/True | `assets/asset_niva_1/material/texturer/brown_leather` |
| **B** | Brown plankor 03 * | 8.38 | True/True/True | `assets/asset_niva_1/material/texturer/brown_planks_03` |
| **B** | Brown plankor 04 * | 3.28 | True/True/True | `assets/asset_niva_1/material/texturer/brown_planks_04` |
| **B** | Brown plankor 05 * | 7.50 | True/True/True | `assets/asset_niva_1/material/texturer/brown_planks_05` |
| **B** | Brown plankor 07 * | 6.15 | True/True/True | `assets/asset_niva_1/material/texturer/brown_planks_07` |
| **B** | Brown plankor 08 * | 13.00 | True/True/True | `assets/asset_niva_1/material/texturer/brown_planks_08` |
| **B** | Brown plankor 09 * | 9.91 | True/True/True | `assets/asset_niva_1/material/texturer/brown_planks_09` |
| **B** | Coated pine * | 14.76 | True/True/True | `assets/asset_niva_1/material/texturer/coated_pine` |
| **B** | Coated pine 02 * | 8.64 | True/True/True | `assets/asset_niva_1/material/texturer/coated_pine_02` |
| **B** | Korrugerad järn * | 11.27 | True/True/True | `assets/asset_niva_1/material/texturer/corrugated_iron` |
| **B** | Korrugerad järn 02 * | 14.15 | True/True/True | `assets/asset_niva_1/material/texturer/corrugated_iron_02` |
| **B** | Korrugerad järn 03 * | 8.05 | True/True/True | `assets/asset_niva_1/material/texturer/corrugated_iron_03` |
| **B** | Dark paneled trä * | 15.52 | True/True/True | `assets/asset_niva_1/material/texturer/dark_paneled_wood` |
| **B** | Dark plankor * | 6.86 | True/True/True | `assets/asset_niva_1/material/texturer/dark_planks` |
| **B** | Dark trä * | 13.80 | True/True/True | `assets/asset_niva_1/material/texturer/dark_wood` |
| **B** | Dark trä plankor * | 13.42 | True/True/True | `assets/asset_niva_1/material/texturer/dark_wooden_planks` |
| **B** | Distressed målad plankor * | 7.11 | True/True/True | `assets/asset_niva_1/material/texturer/distressed_painted_planks` |
| **B** | Tyg läder 01 * | 12.30 | True/True/True | `assets/asset_niva_1/material/texturer/fabric_leather_01` |
| **B** | Tyg läder 02 * | 10.18 | True/True/True | `assets/asset_niva_1/material/texturer/fabric_leather_02` |
| **C** | Tyg pattern 05 * | 16.45 | False/True/True | `assets/asset_niva_1/material/texturer/fabric_pattern_05` |
| **C** | Tyg pattern 07 * | 14.67 | False/True/True | `assets/asset_niva_1/material/texturer/fabric_pattern_07` |
| **B** | Gingham check * | 40.08 | True/True/True | `assets/asset_niva_1/material/texturer/gingham_check` |
| **B** | Grön grov plankor * | 8.20 | True/True/True | `assets/asset_niva_1/material/texturer/green_rough_planks` |
| **B** | Hessian 380 * | 20.49 | True/True/True | `assets/asset_niva_1/material/texturer/hessian_380` |
| **C** | Läder röd 02 * | 26.31 | False/True/True | `assets/asset_niva_1/material/texturer/leather_red_02` |
| **C** | Läder röd 03 * | 19.72 | False/True/True | `assets/asset_niva_1/material/texturer/leather_red_03` |
| **B** | Läder vit * | 20.55 | True/True/True | `assets/asset_niva_1/material/texturer/leather_white` |
| **B** | Metall grate rostig * | 16.32 | True/True/True | `assets/asset_niva_1/material/texturer/metal_grate_rusty` |
| **B** | Metall plate * | 15.62 | True/True/True | `assets/asset_niva_1/material/texturer/metal_plate` |
| **B** | Metall plate 02 * | 12.83 | True/True/True | `assets/asset_niva_1/material/texturer/metal_plate_02` |
| **B** | Oak trä plankor * | 15.79 | True/True/True | `assets/asset_niva_1/material/texturer/oak_wood_planks` |
| **B** | Gammal plankor 02 * | 6.79 | True/True/True | `assets/asset_niva_1/material/texturer/old_planks_02` |
| **B** | Plank flooring * | 12.44 | True/True/True | `assets/asset_niva_1/material/texturer/plank_flooring` |
| **B** | Plank flooring 02 * | 11.94 | True/True/True | `assets/asset_niva_1/material/texturer/plank_flooring_02` |
| **B** | Plank flooring 03 * | 13.99 | True/True/True | `assets/asset_niva_1/material/texturer/plank_flooring_03` |
| **B** | Plank flooring 04 * | 10.18 | True/True/True | `assets/asset_niva_1/material/texturer/plank_flooring_04` |
| **B** | Plankor brown 10 * | 5.60 | True/True/True | `assets/asset_niva_1/material/texturer/planks_brown_10` |
| **B** | Plywood * | 19.47 | True/True/True | `assets/asset_niva_1/material/texturer/plywood` |
| **B** | Poly wool herringbone * | 40.93 | True/True/True | `assets/asset_niva_1/material/texturer/poly_wool_herringbone` |
| **B** | Grov linen * | 45.40 | True/True/True | `assets/asset_niva_1/material/texturer/rough_linen` |
| **B** | Grov trä * | 8.09 | True/True/True | `assets/asset_niva_1/material/texturer/rough_wood` |
| **B** | Rust coarse 01 * | 17.87 | True/True/True | `assets/asset_niva_1/material/texturer/rust_coarse_01` |
| **B** | Rostig metall 03 * | 12.74 | True/True/True | `assets/asset_niva_1/material/texturer/rusty_metal_03` |
| **B** | Rostig metall 04 * | 14.73 | True/True/True | `assets/asset_niva_1/material/texturer/rusty_metal_04` |
| **B** | Rostig metall 05 * | 10.92 | True/True/True | `assets/asset_niva_1/material/texturer/rusty_metal_05` |
| **B** | Rostig metall grid * | 10.08 | True/True/True | `assets/asset_niva_1/material/texturer/rusty_metal_grid` |
| **B** | Rostig metall plåt * | 12.84 | True/True/True | `assets/asset_niva_1/material/texturer/rusty_metal_sheet` |
| **B** | Stained pine * | 10.15 | True/True/True | `assets/asset_niva_1/material/texturer/stained_pine` |
| **B** | Stair plankor * | 11.83 | True/True/True | `assets/asset_niva_1/material/texturer/stair_planks` |
| **B** | Weathered brown plankor * | 4.69 | True/True/True | `assets/asset_niva_1/material/texturer/weathered_brown_planks` |
| **B** | Trä skåp worn lång * | 7.90 | True/True/True | `assets/asset_niva_1/material/texturer/wood_cabinet_worn_long` |
| **B** | Trä golv deck * | 16.70 | True/True/True | `assets/asset_niva_1/material/texturer/wood_floor_deck` |
| **B** | Trä peeling paint weathered * | 12.09 | True/True/True | `assets/asset_niva_1/material/texturer/wood_peeling_paint_weathered` |
| **B** | Trä plankor grey * | 3.43 | True/True/True | `assets/asset_niva_1/material/texturer/wood_planks_grey` |
| **B** | Trä bord * | 15.33 | True/True/True | `assets/asset_niva_1/material/texturer/wood_table` |
| **B** | Trä bord 001 * | 5.37 | True/True/True | `assets/asset_niva_1/material/texturer/wood_table_001` |
| **B** | Trä bord stor * | 14.38 | True/True/True | `assets/asset_niva_1/material/texturer/wood_table_large` |
| **B** | Trä bord worn * | 16.51 | True/True/True | `assets/asset_niva_1/material/texturer/wood_table_worn` |
| **B** | Trä tunna * | 16.09 | True/True/True | `assets/asset_niva_1/material/texturer/wooden_barrel` |
| **B** | Trä panels * | 11.07 | True/True/True | `assets/asset_niva_1/material/texturer/wooden_panels` |
| **B** | Trä plankor * | 10.95 | True/True/True | `assets/asset_niva_1/material/texturer/wooden_planks` |
| **B** | Målad Plaster006 * | 8.96 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/PaintedPlaster006` |
| **B** | Målad Plaster008 * | 8.78 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/PaintedPlaster008` |
| **B** | Målad Plaster009 * | 8.31 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/PaintedPlaster009` |
| **B** | Målad Plaster010 * | 9.45 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/PaintedPlaster010` |
| **B** | Målad Plaster011 * | 8.75 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/PaintedPlaster011` |
| **B** | Målad Plaster012 * | 8.01 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/PaintedPlaster012` |
| **B** | Målad Plaster014 * | 8.82 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/PaintedPlaster014` |
| **B** | Målad Plaster015 * | 8.21 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/PaintedPlaster015` |
| **B** | Målad Plaster016 * | 9.36 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/PaintedPlaster016` |
| **B** | Plaster001 * | 26.14 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/Plaster001` |
| **B** | Plaster003 * | 7.88 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/Plaster003` |
| **B** | Plaster004 * | 8.28 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/Plaster004` |
| **B** | Plaster007 * | 8.07 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/Plaster007` |
| **B** | Trä Siding001 * | 7.24 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/WoodSiding001` |
| **B** | Trä Siding003 * | 7.24 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/WoodSiding003` |
| **B** | Trä Siding010 * | 7.66 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/WoodSiding010` |
| **B** | Trä Siding011 * | 6.43 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/WoodSiding011` |
| **B** | Trä Siding012 * | 8.26 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/WoodSiding012` |
| **B** | Trä Siding013 * | 7.05 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/WoodSiding013` |
| **B** | Damaged puts * | 3.54 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/damaged_plaster` |
| **B** | Puts sten vägg 01 * | 8.57 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/plaster_stone_wall_01` |
| **B** | Puts sten vägg 02 * | 3.98 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/plaster_stone_wall_02` |
| **B** | Plastered sten vägg * | 9.61 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/plastered_stone_wall` |
| **B** | Plastered vägg * | 4.26 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/plastered_wall` |
| **B** | Grov puts broken * | 2.04 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/rough_plaster_broken` |
| **B** | Weathered plank siding * | 2.60 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/weathered_plank_siding` |
| **B** | Vit grov puts * | 2.50 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/white_rough_plaster` |
| **B** | Trä shutter * | 2.62 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/wood_shutter` |
| **B** | Worn cracked puts * | 3.66 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/worn_cracked_plaster` |
| **B** | Worn puts vägg * | 2.63 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/worn_plaster_wall` |
| **B** | Worn shutter * | 2.68 | True/True/True | `assets/asset_niva_1/terrang/stad/fasader/worn_shutter` |
| **B** | Grassy cobblestone * | 10.00 | True/True/True | `assets/asset_niva_1/terrang/stad/grasmatta/grassy_cobblestone` |
| **B** | Leafy gräs * | 5.98 | True/True/True | `assets/asset_niva_1/terrang/stad/grasmatta/leafy_grass` |
| **B** | Roofing Tiles001 * | 7.59 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/RoofingTiles001` |
| **B** | Roofing Tiles002 * | 24.46 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/RoofingTiles002` |
| **B** | Roofing Tiles003 * | 7.67 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/RoofingTiles003` |
| **B** | Roofing Tiles004 * | 7.50 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/RoofingTiles004` |
| **B** | Roofing Tiles006 * | 24.32 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/RoofingTiles006` |
| **B** | Roofing Tiles007 * | 7.02 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/RoofingTiles007` |
| **B** | Roofing Tiles008 * | 7.80 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/RoofingTiles008` |
| **B** | Roofing Tiles011B * | 6.45 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/RoofingTiles011B` |
| **B** | Roofing Tiles011C * | 8.24 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/RoofingTiles011C` |
| **B** | Roofing Tiles012B * | 6.56 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/RoofingTiles012B` |
| **B** | Roofing Tiles012C * | 7.73 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/RoofingTiles012C` |
| **B** | Roofing Tiles013A * | 11.89 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/RoofingTiles013A` |
| **B** | Roofing Tiles013C * | 7.15 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/RoofingTiles013C` |
| **B** | Roofing Tiles014B * | 6.48 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/RoofingTiles014B` |
| **B** | Roofing Tiles014C * | 7.88 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/RoofingTiles014C` |
| **B** | Roofing Tiles015C * | 6.65 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/RoofingTiles015C` |
| **B** | Thatched Roof001B * | 33.53 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/ThatchedRoof001B` |
| **B** | Thatched Roof002B * | 31.21 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/ThatchedRoof002B` |
| **B** | Clay tak pannor * | 4.02 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/clay_roof_tiles` |
| **B** | Clay tak pannor 02 * | 9.00 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/clay_roof_tiles_02` |
| **B** | Grey tak pannor * | 1.94 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/grey_roof_tiles` |
| **B** | Röd skiffer tak pannor 01 * | 1.97 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/red_slate_roof_tiles_01` |
| **B** | Reed tak 03 * | 3.36 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/reed_roof_03` |
| **B** | Reed tak 04 * | 3.43 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/reed_roof_04` |
| **B** | Tak slates 02 * | 2.44 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/roof_slates_02` |
| **B** | Tak slates 03 * | 3.16 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/roof_slates_03` |
| **B** | Tak pannor * | 4.91 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/roof_tiles` |
| **B** | Thatch tak angled * | 4.87 | True/True/True | `assets/asset_niva_1/terrang/stad/hustak/thatch_roof_angled` |
| **B** | Kyrka tegel 02 * | 13.75 | True/True/True | `assets/asset_niva_1/terrang/stad/kyrka/church_bricks_02` |
| **B** | Kyrka tegel 03 * | 2.97 | True/True/True | `assets/asset_niva_1/terrang/stad/kyrka/church_bricks_03` |
| **B** | Broken tegel vägg * | 0.68 | True/True/True | `assets/asset_niva_1/terrang/stad/murar/broken_brick_wall` |
| **B** | Defense vägg * | 6.62 | True/True/True | `assets/asset_niva_1/terrang/stad/murar/defense_wall` |
| **B** | Mossy sten vägg * | 11.72 | True/True/True | `assets/asset_niva_1/terrang/stad/murar/mossy_stone_wall` |
| **B** | Gammal sten vägg * | 9.87 | True/True/True | `assets/asset_niva_1/terrang/stad/murar/old_stone_wall` |
| **B** | Gammal sten vägg 02 * | 3.53 | True/True/True | `assets/asset_niva_1/terrang/stad/murar/old_stone_wall_02` |
| **B** | Rustic sten vägg * | 11.37 | True/True/True | `assets/asset_niva_1/terrang/stad/murar/rustic_stone_wall` |
| **B** | Rustic sten vägg 02 * | 4.25 | True/True/True | `assets/asset_niva_1/terrang/stad/murar/rustic_stone_wall_02` |
| **B** | Stacked sten vägg * | 9.87 | True/True/True | `assets/asset_niva_1/terrang/stad/murar/stacked_stone_wall` |
| **B** | Sten vägg * | 13.77 | True/True/True | `assets/asset_niva_1/terrang/stad/murar/stone_wall` |
| **B** | Sten vägg 02 * | 3.68 | True/True/True | `assets/asset_niva_1/terrang/stad/murar/stone_wall_02` |
| **B** | Sten vägg 03 * | 4.84 | True/True/True | `assets/asset_niva_1/terrang/stad/murar/stone_wall_03` |
| **B** | Sten vägg 04 * | 11.67 | True/True/True | `assets/asset_niva_1/terrang/stad/murar/stone_wall_04` |
| **B** | Sten vägg 05 * | 4.02 | True/True/True | `assets/asset_niva_1/terrang/stad/murar/stone_wall_05` |
| **B** | Worn tegel vägg * | 4.39 | True/True/True | `assets/asset_niva_1/terrang/stad/murar/worn_brick_wall` |
| **B** | Paving Stones009 * | 8.66 | True/True/True | `assets/asset_niva_1/terrang/stad/torg/PavingStones009` |
| **B** | Paving Stones010 * | 9.62 | True/True/True | `assets/asset_niva_1/terrang/stad/torg/PavingStones010` |
| **B** | Paving Stones025 * | 7.99 | True/True/True | `assets/asset_niva_1/terrang/stad/torg/PavingStones025` |
| **B** | Paving Stones033 * | 8.69 | True/True/True | `assets/asset_niva_1/terrang/stad/torg/PavingStones033` |
| **B** | Paving Stones047 * | 10.15 | True/True/True | `assets/asset_niva_1/terrang/stad/torg/PavingStones047` |
| **B** | Paving Stones048 * | 9.57 | True/True/True | `assets/asset_niva_1/terrang/stad/torg/PavingStones048` |
| **B** | Paving Stones049 * | 9.63 | True/True/True | `assets/asset_niva_1/terrang/stad/torg/PavingStones049` |
| **B** | Paving Stones050 * | 9.82 | True/True/True | `assets/asset_niva_1/terrang/stad/torg/PavingStones050` |
| **B** | Paving Stones051 * | 8.90 | True/True/True | `assets/asset_niva_1/terrang/stad/torg/PavingStones051` |
| **B** | Paving Stones070 * | 31.22 | True/True/True | `assets/asset_niva_1/terrang/stad/torg/PavingStones070` |
| **B** | Paving Stones084 * | 9.12 | True/True/True | `assets/asset_niva_1/terrang/stad/torg/PavingStones084` |
| **B** | Paving Stones113 * | 9.51 | True/True/True | `assets/asset_niva_1/terrang/stad/torg/PavingStones113` |
| **B** | Paving Stones115A * | 8.45 | True/True/True | `assets/asset_niva_1/terrang/stad/torg/PavingStones115A` |
| **B** | Paving Stones115B * | 8.67 | True/True/True | `assets/asset_niva_1/terrang/stad/torg/PavingStones115B` |
| **B** | Paving Stones131 * | 9.24 | True/True/True | `assets/asset_niva_1/terrang/stad/torg/PavingStones131` |
| **B** | Paving Stones134 * | 8.61 | True/True/True | `assets/asset_niva_1/terrang/stad/torg/PavingStones134` |
| **B** | Paving Stones139 * | 9.43 | True/True/True | `assets/asset_niva_1/terrang/stad/torg/PavingStones139` |
| **B** | Cobblestone 01 * | 4.62 | True/True/True | `assets/asset_niva_1/terrang/stad/torg/cobblestone_01` |
| **C** | Cobblestone 02 * | 3.17 | False/False/True | `assets/asset_niva_1/terrang/stad/torg/cobblestone_02` |
| **C** | Cobblestone 05 * | 4.68 | False/False/True | `assets/asset_niva_1/terrang/stad/torg/cobblestone_05` |
| **B** | Cobblestone golv 01 * | 5.80 | True/True/True | `assets/asset_niva_1/terrang/stad/torg/cobblestone_floor_01` |
| **B** | Cobblestone golv 08 * | 2.62 | True/True/True | `assets/asset_niva_1/terrang/stad/torg/cobblestone_floor_08` |
| **B** | Mossy cobblestone * | 11.88 | True/True/True | `assets/asset_niva_1/terrang/stad/torg/mossy_cobblestone` |
| **C** | Polyhaven cobblestone 01 * | 2.01 | False/False/True | `assets/asset_niva_1/terrang/stad/torg/polyhaven_cobblestone_01` |
| **C** | Polyhaven mossy cobblestone * | 6.40 | False/False/True | `assets/asset_niva_1/terrang/stad/torg/polyhaven_mossy_cobblestone` |
| **C** | Square cobblestone * | 3.71 | False/False/True | `assets/asset_niva_1/terrang/stad/torg/square_cobblestone` |
| **B** | Asphalt016 * | 8.38 | True/True/True | `assets/asset_niva_1/terrang/stad/vagar/Asphalt016` |
| **B** | Asphalt018 * | 8.40 | True/True/True | `assets/asset_niva_1/terrang/stad/vagar/Asphalt018` |
| **B** | Asphalt024C * | 8.81 | True/True/True | `assets/asset_niva_1/terrang/stad/vagar/Asphalt024C` |
| **B** | Pathway001 * | 4.66 | True/True/True | `assets/asset_niva_1/terrang/stad/vagar/Pathway001` |
| **B** | Pathway003 * | 4.68 | True/True/True | `assets/asset_niva_1/terrang/stad/vagar/Pathway003` |
| **B** | Road002 * | 7.65 | True/True/True | `assets/asset_niva_1/terrang/stad/vagar/Road002` |
| **B** | Road005 * | 7.75 | True/True/True | `assets/asset_niva_1/terrang/stad/vagar/Road005` |
| **B** | Road012A * | 8.29 | True/True/True | `assets/asset_niva_1/terrang/stad/vagar/Road012A` |
| **B** | Road014C * | 8.17 | True/True/True | `assets/asset_niva_1/terrang/stad/vagar/Road014C` |
| **B** | Bricks006 * | 8.18 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks006` |
| **B** | Bricks007 * | 8.66 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks007` |
| **B** | Bricks011 * | 8.79 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks011` |
| **B** | Bricks014 * | 8.22 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks014` |
| **B** | Bricks018 * | 8.05 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks018` |
| **B** | Bricks023 * | 9.11 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks023` |
| **B** | Bricks042 * | 8.87 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks042` |
| **B** | Bricks046 * | 9.00 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks046` |
| **B** | Bricks047 * | 8.77 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks047` |
| **B** | Bricks059 * | 0.76 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks059` |
| **B** | Bricks064 * | 7.56 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks064` |
| **B** | Bricks065 * | 7.90 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks065` |
| **B** | Bricks066 * | 7.23 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks066` |
| **B** | Bricks067 * | 7.36 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks067` |
| **B** | Bricks068 * | 8.14 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks068` |
| **B** | Bricks069 * | 8.33 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks069` |
| **B** | Bricks073B * | 9.57 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks073B` |
| **B** | Bricks074 * | 8.49 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks074` |
| **B** | Bricks075A * | 0.53 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks075A` |
| **B** | Bricks076A * | 9.02 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks076A` |
| **B** | Bricks076B * | 9.06 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks076B` |
| **B** | Bricks078 * | 5.19 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks078` |
| **B** | Bricks079 * | 4.56 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks079` |
| **B** | Bricks087 * | 8.23 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks087` |
| **B** | Bricks089 * | 5.32 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks089` |
| **B** | Bricks090 * | 7.49 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks090` |
| **B** | Bricks091 * | 7.87 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks091` |
| **B** | Bricks096 * | 4.68 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks096` |
| **B** | Bricks102 * | 4.89 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/Bricks102` |
| **B** | Beam vägg 01 * | 1.74 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/beam_wall_01` |
| **B** | Broken vägg * | 2.79 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/broken_wall` |
| **B** | Slott tegel 01 * | 7.54 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/castle_brick_01` |
| **B** | Slott tegel 07 * | 2.99 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/castle_brick_07` |
| **B** | Slott tegel broken 06 * | 2.34 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/castle_brick_broken_06` |
| **B** | Betong vägg 008 * | 7.59 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/concrete_wall_008` |
| **B** | Cracked betong vägg * | 4.15 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/cracked_concrete_wall` |
| **B** | Stor sandstone blocks * | 3.30 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/large_sandstone_blocks` |
| **B** | Medieval blocks 02 * | 3.02 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/medieval_blocks_02` |
| **B** | Medieval blocks 03 * | 3.86 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/medieval_blocks_03` |
| **B** | Medieval vägg 01 * | 5.48 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/medieval_wall_01` |
| **B** | Mossy tegel * | 3.89 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/mossy_brick` |
| **B** | Precast betong vägg * | 14.75 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/precast_concrete_wall` |
| **B** | Raw plank vägg * | 8.18 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/raw_plank_wall` |
| **B** | Röd tegel * | 0.61 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/red_brick` |
| **B** | Röd tegel 03 * | 2.69 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/red_brick_03` |
| **B** | Sten block vägg * | 3.94 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/stone_block_wall` |
| **B** | Vit sandstone blocks 02 * | 3.68 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/white_sandstone_blocks_02` |
| **B** | Vit sandstone tegel * | 5.54 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/white_sandstone_bricks` |
| **B** | Trä plank vägg * | 7.23 | True/True/True | `assets/asset_niva_1/terrang/stad/vaggar/wood_plank_wall` |
| **B** | Asphalt002 2K JPG * | 14.05 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt002_2K-JPG` |
| **B** | Asphalt003 2K JPG * | 13.20 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt003_2K-JPG` |
| **B** | Asphalt004 2K JPG * | 18.64 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt004_2K-JPG` |
| **B** | Asphalt005 2K JPG * | 20.94 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt005_2K-JPG` |
| **B** | Asphalt006 2K JPG * | 23.68 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt006_2K-JPG` |
| **B** | Asphalt007 2K JPG * | 17.70 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt007_2K-JPG` |
| **B** | Asphalt008 2K JPG * | 20.32 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt008_2K-JPG` |
| **B** | Asphalt009 2K JPG * | 19.28 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt009_2K-JPG` |
| **B** | Asphalt010 2K JPG * | 21.20 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt010_2K-JPG` |
| **B** | Asphalt011 2K JPG * | 21.92 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt011_2K-JPG` |
| **B** | Asphalt012 2K JPG * | 20.36 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt012_2K-JPG` |
| **B** | Asphalt013 2K JPG * | 20.97 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt013_2K-JPG` |
| **B** | Asphalt014 2K JPG * | 19.72 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt014_2K-JPG` |
| **B** | Asphalt015 2K JPG * | 18.84 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt015_2K-JPG` |
| **B** | Asphalt017 2K JPG * | 19.68 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt017_2K-JPG` |
| **B** | Asphalt019 2K JPG * | 19.62 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt019_2K-JPG` |
| **B** | Asphalt020L 2K JPG * | 26.77 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt020L_2K-JPG` |
| **B** | Asphalt020S 2K JPG * | 24.72 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt020S_2K-JPG` |
| **B** | Asphalt021 2K JPG * | 23.93 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt021_2K-JPG` |
| **B** | Asphalt022 2K JPG * | 24.13 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt022_2K-JPG` |
| **B** | Asphalt023L 2K JPG * | 24.32 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt023L_2K-JPG` |
| **B** | Asphalt023S 2K JPG * | 23.27 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt023S_2K-JPG` |
| **B** | Asphalt024A 2K JPG * | 23.82 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt024A_2K-JPG` |
| **B** | Asphalt024B 2K JPG * | 23.27 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt024B_2K-JPG` |
| **B** | Asphalt025A 2K JPG * | 22.04 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt025A_2K-JPG` |
| **B** | Asphalt025B 2K JPG * | 21.98 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt025B_2K-JPG` |
| **B** | Asphalt025C 2K JPG * | 21.91 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt025C_2K-JPG` |
| **B** | Asphalt026A * | 33.76 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt026A` |
| **B** | Asphalt026B * | 33.31 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt026B` |
| **B** | Asphalt026C 2K JPG * | 22.62 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt026C_2K-JPG` |
| **B** | Asphalt027A 2K JPG * | 21.01 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt027A_2K-JPG` |
| **B** | Asphalt027B 2K JPG * | 21.46 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt027B_2K-JPG` |
| **B** | Asphalt027C 2K JPG * | 21.63 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt027C_2K-JPG` |
| **B** | Asphalt028A 2K JPG * | 19.74 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt028A_2K-JPG` |
| **B** | Asphalt028B 2K JPG * | 20.06 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt028B_2K-JPG` |
| **B** | Asphalt028C 2K JPG * | 20.01 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt028C_2K-JPG` |
| **B** | Asphalt029A 2K JPG * | 24.77 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt029A_2K-JPG` |
| **B** | Asphalt029B 2K JPG * | 24.27 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt029B_2K-JPG` |
| **B** | Asphalt030 2K JPG * | 26.70 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt030_2K-JPG` |
| **B** | Asphalt031 2K JPG * | 21.23 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt031_2K-JPG` |
| **B** | Asphalt032 2K JPG * | 20.40 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt032_2K-JPG` |
| **B** | Asphalt033 2K JPG * | 24.88 | True/True/True | `assets/asset_niva_1/terrang/texturer/Asphalt033_2K-JPG` |
| **B** | Clay003 4K JPG * | 64.55 | True/True/True | `assets/asset_niva_1/terrang/texturer/Clay003_4K-JPG` |
| **B** | Clay004 4K JPG * | 68.03 | True/True/True | `assets/asset_niva_1/terrang/texturer/Clay004_4K-JPG` |
| **B** | Clay005 4K JPG * | 72.64 | True/True/True | `assets/asset_niva_1/terrang/texturer/Clay005_4K-JPG` |
| **B** | Clay006 4K JPG * | 58.87 | True/True/True | `assets/asset_niva_1/terrang/texturer/Clay006_4K-JPG` |
| **B** | Clay007 4K JPG * | 57.56 | True/True/True | `assets/asset_niva_1/terrang/texturer/Clay007_4K-JPG` |
| **B** | Clay008 4K JPG * | 54.94 | True/True/True | `assets/asset_niva_1/terrang/texturer/Clay008_4K-JPG` |
| **B** | Clay009 4K JPG * | 57.95 | True/True/True | `assets/asset_niva_1/terrang/texturer/Clay009_4K-JPG` |
| **B** | Concrete003 2K JPG * | 16.74 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete003_2K-JPG` |
| **B** | Concrete005 2K JPG * | 20.15 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete005_2K-JPG` |
| **B** | Concrete006 2K JPG * | 16.10 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete006_2K-JPG` |
| **B** | Concrete007 2K JPG * | 15.18 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete007_2K-JPG` |
| **B** | Concrete008 2K JPG * | 14.61 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete008_2K-JPG` |
| **B** | Concrete009 2K JPG * | 14.88 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete009_2K-JPG` |
| **B** | Concrete010 2K JPG * | 14.63 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete010_2K-JPG` |
| **B** | Concrete011 2K JPG * | 20.62 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete011_2K-JPG` |
| **B** | Concrete013 2K JPG * | 10.29 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete013_2K-JPG` |
| **B** | Concrete014 2K JPG * | 17.23 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete014_2K-JPG` |
| **B** | Concrete015 2K JPG * | 15.93 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete015_2K-JPG` |
| **B** | Concrete016 2K JPG * | 16.18 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete016_2K-JPG` |
| **B** | Concrete017 2K JPG * | 17.37 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete017_2K-JPG` |
| **B** | Concrete018 2K JPG * | 18.74 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete018_2K-JPG` |
| **B** | Concrete019 2K JPG * | 19.01 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete019_2K-JPG` |
| **B** | Concrete020 2K JPG * | 18.37 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete020_2K-JPG` |
| **B** | Concrete021 2K JPG * | 21.44 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete021_2K-JPG` |
| **B** | Concrete022 2K JPG * | 19.73 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete022_2K-JPG` |
| **B** | Concrete023 2K JPG * | 19.78 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete023_2K-JPG` |
| **B** | Concrete024 2K JPG * | 18.47 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete024_2K-JPG` |
| **B** | Concrete025 2K JPG * | 22.26 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete025_2K-JPG` |
| **B** | Concrete026 2K JPG * | 23.71 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete026_2K-JPG` |
| **B** | Concrete030 2K JPG * | 19.44 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete030_2K-JPG` |
| **B** | Concrete035 2K JPG * | 9.51 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete035_2K-JPG` |
| **B** | Concrete037 2K JPG * | 25.15 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete037_2K-JPG` |
| **B** | Concrete038 2K JPG * | 20.13 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete038_2K-JPG` |
| **B** | Concrete040 2K JPG * | 24.10 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete040_2K-JPG` |
| **B** | Concrete041A 2K JPG * | 17.73 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete041A_2K-JPG` |
| **B** | Concrete041C 2K JPG * | 19.72 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete041C_2K-JPG` |
| **B** | Concrete041D 2K JPG * | 20.79 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete041D_2K-JPG` |
| **B** | Concrete042B 2K JPG * | 17.32 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete042B_2K-JPG` |
| **B** | Concrete042D 2K JPG * | 20.37 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete042D_2K-JPG` |
| **B** | Concrete043A 2K JPG * | 18.95 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete043A_2K-JPG` |
| **B** | Concrete043B 2K JPG * | 18.88 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete043B_2K-JPG` |
| **B** | Concrete043D 2K JPG * | 21.26 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete043D_2K-JPG` |
| **B** | Concrete044A 2K JPG * | 17.30 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete044A_2K-JPG` |
| **B** | Concrete044B 2K JPG * | 17.38 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete044B_2K-JPG` |
| **B** | Concrete044D 2K JPG * | 18.63 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete044D_2K-JPG` |
| **B** | Concrete046 2K JPG * | 16.34 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete046_2K-JPG` |
| **B** | Concrete047B 2K JPG * | 23.58 | True/True/True | `assets/asset_niva_1/terrang/texturer/Concrete047B_2K-JPG` |
| **B** | Foam001 4K JPG * | 79.88 | True/True/True | `assets/asset_niva_1/terrang/texturer/Foam001_4K-JPG` |
| **B** | Foam002 2K JPG * | 21.90 | True/True/True | `assets/asset_niva_1/terrang/texturer/Foam002_2K-JPG` |
| **B** | Foam003 2K JPG * | 21.65 | True/True/True | `assets/asset_niva_1/terrang/texturer/Foam003_2K-JPG` |
| **B** | Foliage005 2K JPG * | 0.91 | True/True/True | `assets/asset_niva_1/terrang/texturer/Foliage005_2K-JPG` |
| **B** | Granite001A 2K JPG * | 12.93 | True/True/True | `assets/asset_niva_1/terrang/texturer/Granite001A_2K-JPG` |
| **B** | Granite001B 2K JPG * | 20.36 | True/True/True | `assets/asset_niva_1/terrang/texturer/Granite001B_2K-JPG` |
| **B** | Granite002A 2K JPG * | 9.57 | True/True/True | `assets/asset_niva_1/terrang/texturer/Granite002A_2K-JPG` |
| **B** | Granite002B 2K JPG * | 17.59 | True/True/True | `assets/asset_niva_1/terrang/texturer/Granite002B_2K-JPG` |
| **B** | Granite003A 2K JPG * | 13.11 | True/True/True | `assets/asset_niva_1/terrang/texturer/Granite003A_2K-JPG` |
| **B** | Granite003B 2K JPG * | 21.80 | True/True/True | `assets/asset_niva_1/terrang/texturer/Granite003B_2K-JPG` |
| **B** | Granite004A 2K JPG * | 11.84 | True/True/True | `assets/asset_niva_1/terrang/texturer/Granite004A_2K-JPG` |
| **B** | Granite005A 2K JPG * | 13.86 | True/True/True | `assets/asset_niva_1/terrang/texturer/Granite005A_2K-JPG` |
| **B** | Granite005B 2K JPG * | 21.94 | True/True/True | `assets/asset_niva_1/terrang/texturer/Granite005B_2K-JPG` |
| **B** | Granite006A 2K JPG * | 12.61 | True/True/True | `assets/asset_niva_1/terrang/texturer/Granite006A_2K-JPG` |
| **B** | Granite006B 2K JPG * | 20.23 | True/True/True | `assets/asset_niva_1/terrang/texturer/Granite006B_2K-JPG` |
| **B** | Granite007A 2K JPG * | 10.54 | True/True/True | `assets/asset_niva_1/terrang/texturer/Granite007A_2K-JPG` |
| **B** | Granite007B 2K JPG * | 17.80 | True/True/True | `assets/asset_niva_1/terrang/texturer/Granite007B_2K-JPG` |
| **B** | Grass001 4K JPG * | 106.43 | True/True/True | `assets/asset_niva_1/terrang/texturer/Grass001_4K-JPG` |
| **B** | Grass002 4K JPG * | 104.80 | True/True/True | `assets/asset_niva_1/terrang/texturer/Grass002_4K-JPG` |
| **B** | Grass003 4K JPG * | 106.08 | True/True/True | `assets/asset_niva_1/terrang/texturer/Grass003_4K-JPG` |
| **B** | Grass004 4K JPG * | 109.31 | True/True/True | `assets/asset_niva_1/terrang/texturer/Grass004_4K-JPG` |
| **B** | Grass005 4K JPG * | 114.66 | True/True/True | `assets/asset_niva_1/terrang/texturer/Grass005_4K-JPG` |
| **B** | Grass006 4K JPG * | 105.92 | True/True/True | `assets/asset_niva_1/terrang/texturer/Grass006_4K-JPG` |
| **B** | Grass007 4K JPG * | 97.56 | True/True/True | `assets/asset_niva_1/terrang/texturer/Grass007_4K-JPG` |
| **B** | Grass008 4K JPG * | 118.05 | True/True/True | `assets/asset_niva_1/terrang/texturer/Grass008_4K-JPG` |
| **B** | Gravel009 4K JPG * | 91.79 | True/True/True | `assets/asset_niva_1/terrang/texturer/Gravel009_4K-JPG` |
| **B** | Gravel015 4K JPG * | 91.79 | True/True/True | `assets/asset_niva_1/terrang/texturer/Gravel015_4K-JPG` |
| **B** | Gravel022 4K JPG * | 74.42 | True/True/True | `assets/asset_niva_1/terrang/texturer/Gravel022_4K-JPG` |
| **B** | Gravel026 4K JPG * | 77.92 | True/True/True | `assets/asset_niva_1/terrang/texturer/Gravel026_4K-JPG` |
| **B** | Gravel032 4K JPG * | 94.98 | True/True/True | `assets/asset_niva_1/terrang/texturer/Gravel032_4K-JPG` |
| **B** | Gravel033 4K JPG * | 86.89 | True/True/True | `assets/asset_niva_1/terrang/texturer/Gravel033_4K-JPG` |
| **B** | Gravel034 4K JPG * | 88.31 | True/True/True | `assets/asset_niva_1/terrang/texturer/Gravel034_4K-JPG` |
| **B** | Gravel039 4K JPG * | 80.43 | True/True/True | `assets/asset_niva_1/terrang/texturer/Gravel039_4K-JPG` |
| **B** | Gravel041 4K JPG * | 77.71 | True/True/True | `assets/asset_niva_1/terrang/texturer/Gravel041_4K-JPG` |
| **B** | Gravel042 4K JPG * | 90.09 | True/True/True | `assets/asset_niva_1/terrang/texturer/Gravel042_4K-JPG` |
| **B** | Ground003 4K JPG * | 75.56 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground003_4K-JPG` |
| **B** | Ground004 4K JPG * | 67.80 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground004_4K-JPG` |
| **B** | Ground012 4K JPG * | 74.13 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground012_4K-JPG` |
| **B** | Ground013 4K JPG * | 82.99 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground013_4K-JPG` |
| **B** | Ground015 4K JPG * | 80.05 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground015_4K-JPG` |
| **B** | Ground017 4K JPG * | 65.06 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground017_4K-JPG` |
| **B** | Ground020 4K JPG * | 93.85 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground020_4K-JPG` |
| **B** | Ground023 4K JPG * | 78.37 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground023_4K-JPG` |
| **B** | Ground024 4K JPG * | 80.32 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground024_4K-JPG` |
| **B** | Ground025 4K JPG * | 79.43 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground025_4K-JPG` |
| **B** | Ground026 4K JPG * | 80.14 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground026_4K-JPG` |
| **B** | Ground027 4K JPG * | 64.87 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground027_4K-JPG` |
| **B** | Ground029 4K JPG * | 73.56 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground029_4K-JPG` |
| **B** | Ground030 4K JPG * | 85.11 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground030_4K-JPG` |
| **B** | Ground032 4K JPG * | 47.74 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground032_4K-JPG` |
| **B** | Ground033 4K JPG * | 86.58 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground033_4K-JPG` |
| **B** | Ground034 4K JPG * | 86.40 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground034_4K-JPG` |
| **B** | Ground035 4K JPG * | 87.60 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground035_4K-JPG` |
| **B** | Ground036 4K JPG * | 88.74 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground036_4K-JPG` |
| **B** | Ground037 4K JPG * | 98.20 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground037_4K-JPG` |
| **B** | Ground039 4K JPG * | 88.40 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground039_4K-JPG` |
| **B** | Ground040 4K JPG * | 101.67 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground040_4K-JPG` |
| **B** | Ground042 4K JPG * | 102.91 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground042_4K-JPG` |
| **B** | Ground047 4K JPG * | 97.68 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground047_4K-JPG` |
| **B** | Ground048 4K JPG * | 104.11 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground048_4K-JPG` |
| **B** | Ground049A 4K JPG * | 66.82 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground049A_4K-JPG` |
| **B** | Ground049C 4K JPG * | 75.87 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground049C_4K-JPG` |
| **B** | Ground050 4K JPG * | 58.74 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground050_4K-JPG` |
| **B** | Ground051 4K JPG * | 64.79 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground051_4K-JPG` |
| **B** | Ground054 4K JPG * | 93.85 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground054_4K-JPG` |
| **B** | Ground055L 4K JPG * | 76.49 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground055L_4K-JPG` |
| **B** | Ground057 4K JPG * | 65.86 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground057_4K-JPG` |
| **B** | Ground059 4K JPG * | 61.04 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground059_4K-JPG` |
| **B** | Ground066 4K JPG * | 101.94 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground066_4K-JPG` |
| **B** | Ground067 4K JPG * | 95.55 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground067_4K-JPG` |
| **B** | Ground069 4K JPG * | 87.00 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground069_4K-JPG` |
| **B** | Ground071 4K JPG * | 91.24 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground071_4K-JPG` |
| **B** | Ground080 4K JPG * | 70.65 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground080_4K-JPG` |
| **B** | Ground081 4K JPG * | 47.72 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground081_4K-JPG` |
| **B** | Ground082L 4K JPG * | 105.23 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground082L_4K-JPG` |
| **B** | Ground083 4K JPG * | 74.79 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground083_4K-JPG` |
| **B** | Ground085 4K JPG * | 98.60 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground085_4K-JPG` |
| **B** | Ground088 4K JPG * | 82.91 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground088_4K-JPG` |
| **B** | Ground091 4K JPG * | 103.73 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground091_4K-JPG` |
| **B** | Ground093C 4K JPG * | 62.94 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground093C_4K-JPG` |
| **B** | Ground103 4K JPG * | 90.19 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground103_4K-JPG` |
| **B** | Ground104 4K JPG * | 90.41 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground104_4K-JPG` |
| **B** | Ground107 2K JPG * | 24.42 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground107_2K-JPG` |
| **B** | Ground107 4K JPG * | 94.40 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground107_4K-JPG` |
| **B** | Ground109 4K JPG * | 84.10 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground109_4K-JPG` |
| **B** | Ground111 2K JPG * | 24.47 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground111_2K-JPG` |
| **B** | Ground111 4K JPG * | 92.70 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ground111_4K-JPG` |
| **B** | Ice001 2K JPG * | 12.55 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ice001_2K-JPG` |
| **B** | Ice002 2K JPG * | 13.17 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ice002_2K-JPG` |
| **B** | Ice003 2K JPG * | 10.51 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ice003_2K-JPG` |
| **B** | Ice004 2K JPG * | 12.39 | True/True/True | `assets/asset_niva_1/terrang/texturer/Ice004_2K-JPG` |
| **B** | Leaf Set001 2K JPG * | 6.01 | True/True/True | `assets/asset_niva_1/terrang/texturer/LeafSet001_2K-JPG` |
| **B** | Leaf Set002 2K JPG * | 11.21 | True/True/True | `assets/asset_niva_1/terrang/texturer/LeafSet002_2K-JPG` |
| **B** | Leaf Set003 2K JPG * | 9.59 | True/True/True | `assets/asset_niva_1/terrang/texturer/LeafSet003_2K-JPG` |
| **B** | Leaf Set004 2K JPG * | 7.49 | True/True/True | `assets/asset_niva_1/terrang/texturer/LeafSet004_2K-JPG` |
| **B** | Leaf Set005 2K JPG * | 5.25 | True/True/True | `assets/asset_niva_1/terrang/texturer/LeafSet005_2K-JPG` |
| **B** | Leaf Set006 2K JPG * | 6.62 | True/True/True | `assets/asset_niva_1/terrang/texturer/LeafSet006_2K-JPG` |
| **B** | Leaf Set008 2K JPG * | 9.45 | True/True/True | `assets/asset_niva_1/terrang/texturer/LeafSet008_2K-JPG` |
| **B** | Leaf Set009 2K JPG * | 9.67 | True/True/True | `assets/asset_niva_1/terrang/texturer/LeafSet009_2K-JPG` |
| **B** | Leaf Set010 2K JPG * | 7.61 | True/True/True | `assets/asset_niva_1/terrang/texturer/LeafSet010_2K-JPG` |
| **B** | Leaf Set012 2K JPG * | 5.58 | True/True/True | `assets/asset_niva_1/terrang/texturer/LeafSet012_2K-JPG` |
| **B** | Leaf Set013 2K JPG * | 3.13 | True/True/True | `assets/asset_niva_1/terrang/texturer/LeafSet013_2K-JPG` |
| **B** | Leaf Set014 2K JPG * | 7.25 | True/True/True | `assets/asset_niva_1/terrang/texturer/LeafSet014_2K-JPG` |
| **B** | Leaf Set015 2K JPG * | 8.76 | True/True/True | `assets/asset_niva_1/terrang/texturer/LeafSet015_2K-JPG` |
| **B** | Leaf Set016 2K JPG * | 8.02 | True/True/True | `assets/asset_niva_1/terrang/texturer/LeafSet016_2K-JPG` |
| **B** | Leaf Set018 2K JPG * | 4.49 | True/True/True | `assets/asset_niva_1/terrang/texturer/LeafSet018_2K-JPG` |
| **B** | Leaf Set020 2K JPG * | 3.03 | True/True/True | `assets/asset_niva_1/terrang/texturer/LeafSet020_2K-JPG` |
| **B** | Leaf Set021 2K JPG * | 4.27 | True/True/True | `assets/asset_niva_1/terrang/texturer/LeafSet021_2K-JPG` |
| **B** | Leaf Set022 2K JPG * | 8.19 | True/True/True | `assets/asset_niva_1/terrang/texturer/LeafSet022_2K-JPG` |
| **B** | Leaf Set023 2K JPG * | 12.48 | True/True/True | `assets/asset_niva_1/terrang/texturer/LeafSet023_2K-JPG` |
| **B** | Leaf Set024 2K JPG * | 10.11 | True/True/True | `assets/asset_niva_1/terrang/texturer/LeafSet024_2K-JPG` |
| **B** | Leaf Set025 2K JPG * | 11.09 | True/True/True | `assets/asset_niva_1/terrang/texturer/LeafSet025_2K-JPG` |
| **B** | Leaf Set027 2K JPG * | 9.01 | True/True/True | `assets/asset_niva_1/terrang/texturer/LeafSet027_2K-JPG` |
| **B** | Leaf Set028 2K JPG * | 5.06 | True/True/True | `assets/asset_niva_1/terrang/texturer/LeafSet028_2K-JPG` |
| **B** | Leaf Set030 2K JPG * | 7.49 | True/True/True | `assets/asset_niva_1/terrang/texturer/LeafSet030_2K-JPG` |
| **B** | Moss001 4K JPG * | 93.61 | True/True/True | `assets/asset_niva_1/terrang/texturer/Moss001_4K-JPG` |
| **B** | Pathway002 * | 16.60 | True/True/True | `assets/asset_niva_1/terrang/texturer/Pathway002` |
| **B** | Pathway004 * | 17.37 | True/True/True | `assets/asset_niva_1/terrang/texturer/Pathway004` |
| **B** | Paving Stones002 2K JPG * | 15.49 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones002_2K-JPG` |
| **B** | Paving Stones003 2K JPG * | 17.56 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones003_2K-JPG` |
| **B** | Paving Stones004 2K JPG * | 15.50 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones004_2K-JPG` |
| **B** | Paving Stones005 2K JPG * | 20.24 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones005_2K-JPG` |
| **B** | Paving Stones006 2K JPG * | 18.61 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones006_2K-JPG` |
| **B** | Paving Stones007 2K JPG * | 18.85 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones007_2K-JPG` |
| **B** | Paving Stones008 2K JPG * | 20.57 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones008_2K-JPG` |
| **B** | Paving Stones011 2K JPG * | 20.73 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones011_2K-JPG` |
| **B** | Paving Stones012 2K JPG * | 20.36 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones012_2K-JPG` |
| **B** | Paving Stones013 2K JPG * | 18.99 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones013_2K-JPG` |
| **B** | Paving Stones014 2K JPG * | 18.36 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones014_2K-JPG` |
| **B** | Paving Stones015 2K JPG * | 18.10 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones015_2K-JPG` |
| **B** | Paving Stones016 2K JPG * | 20.00 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones016_2K-JPG` |
| **B** | Paving Stones017 2K JPG * | 19.85 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones017_2K-JPG` |
| **B** | Paving Stones018 2K JPG * | 20.35 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones018_2K-JPG` |
| **B** | Paving Stones019 2K JPG * | 17.68 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones019_2K-JPG` |
| **B** | Paving Stones020 2K JPG * | 15.22 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones020_2K-JPG` |
| **B** | Paving Stones021 2K JPG * | 20.31 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones021_2K-JPG` |
| **B** | Paving Stones022 2K JPG * | 17.01 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones022_2K-JPG` |
| **B** | Paving Stones023 2K JPG * | 18.77 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones023_2K-JPG` |
| **B** | Paving Stones024 2K JPG * | 20.35 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones024_2K-JPG` |
| **B** | Paving Stones026 2K JPG * | 17.27 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones026_2K-JPG` |
| **B** | Paving Stones027 2K JPG * | 20.71 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones027_2K-JPG` |
| **B** | Paving Stones028 2K JPG * | 20.68 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones028_2K-JPG` |
| **B** | Paving Stones029 2K JPG * | 16.12 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones029_2K-JPG` |
| **B** | Paving Stones030 2K JPG * | 18.49 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones030_2K-JPG` |
| **B** | Paving Stones031 2K JPG * | 15.93 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones031_2K-JPG` |
| **B** | Paving Stones032 2K JPG * | 18.53 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones032_2K-JPG` |
| **B** | Paving Stones034 2K JPG * | 21.71 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones034_2K-JPG` |
| **B** | Paving Stones036 2K JPG * | 23.44 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones036_2K-JPG` |
| **B** | Paving Stones037 2K JPG * | 18.76 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones037_2K-JPG` |
| **B** | Paving Stones039 2K JPG * | 19.46 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones039_2K-JPG` |
| **B** | Paving Stones040 2K JPG * | 22.81 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones040_2K-JPG` |
| **B** | Paving Stones041 2K JPG * | 22.20 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones041_2K-JPG` |
| **B** | Paving Stones042 2K JPG * | 19.33 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones042_2K-JPG` |
| **B** | Paving Stones043 2K JPG * | 19.49 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones043_2K-JPG` |
| **B** | Paving Stones044 2K JPG * | 21.45 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones044_2K-JPG` |
| **B** | Paving Stones045 2K JPG * | 19.48 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones045_2K-JPG` |
| **B** | Paving Stones046 2K JPG * | 18.63 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones046_2K-JPG` |
| **B** | Paving Stones052 2K JPG * | 18.36 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones052_2K-JPG` |
| **B** | Paving Stones053 2K JPG * | 23.61 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones053_2K-JPG` |
| **B** | Paving Stones054 2K JPG * | 15.89 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones054_2K-JPG` |
| **B** | Paving Stones055 2K JPG * | 21.89 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones055_2K-JPG` |
| **B** | Paving Stones056 2K JPG * | 22.13 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones056_2K-JPG` |
| **B** | Paving Stones057 2K JPG * | 23.10 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones057_2K-JPG` |
| **B** | Paving Stones058 2K JPG * | 23.41 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones058_2K-JPG` |
| **B** | Paving Stones059 2K JPG * | 23.65 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones059_2K-JPG` |
| **B** | Paving Stones060 2K JPG * | 23.20 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones060_2K-JPG` |
| **B** | Paving Stones061 2K JPG * | 23.44 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones061_2K-JPG` |
| **B** | Paving Stones062 2K JPG * | 23.31 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones062_2K-JPG` |
| **B** | Paving Stones063 2K JPG * | 23.44 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones063_2K-JPG` |
| **B** | Paving Stones064 2K JPG * | 23.28 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones064_2K-JPG` |
| **B** | Paving Stones065 2K JPG * | 24.37 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones065_2K-JPG` |
| **B** | Paving Stones066 2K JPG * | 22.34 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones066_2K-JPG` |
| **B** | Paving Stones067 2K JPG * | 19.61 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones067_2K-JPG` |
| **B** | Paving Stones068 2K JPG * | 22.01 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones068_2K-JPG` |
| **B** | Paving Stones069 2K JPG * | 9.25 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones069_2K-JPG` |
| **B** | Paving Stones071 2K JPG * | 16.67 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones071_2K-JPG` |
| **B** | Paving Stones072 2K JPG * | 18.10 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones072_2K-JPG` |
| **B** | Paving Stones073 2K JPG * | 17.97 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones073_2K-JPG` |
| **B** | Paving Stones074 2K JPG * | 18.01 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones074_2K-JPG` |
| **B** | Paving Stones075 2K JPG * | 18.27 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones075_2K-JPG` |
| **B** | Paving Stones076 2K JPG * | 18.68 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones076_2K-JPG` |
| **B** | Paving Stones077 2K JPG * | 17.55 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones077_2K-JPG` |
| **B** | Paving Stones078 2K JPG * | 18.15 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones078_2K-JPG` |
| **B** | Paving Stones079 2K JPG * | 18.67 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones079_2K-JPG` |
| **B** | Paving Stones080 2K JPG * | 18.72 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones080_2K-JPG` |
| **B** | Paving Stones081 2K JPG * | 17.53 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones081_2K-JPG` |
| **B** | Paving Stones082 2K JPG * | 18.51 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones082_2K-JPG` |
| **B** | Paving Stones083 2K JPG * | 18.53 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones083_2K-JPG` |
| **B** | Paving Stones085 2K JPG * | 22.97 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones085_2K-JPG` |
| **B** | Paving Stones086 2K JPG * | 22.56 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones086_2K-JPG` |
| **B** | Paving Stones087 2K JPG * | 21.25 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones087_2K-JPG` |
| **B** | Paving Stones088 2K JPG * | 22.38 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones088_2K-JPG` |
| **B** | Paving Stones089 2K JPG * | 23.04 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones089_2K-JPG` |
| **B** | Paving Stones090 2K JPG * | 22.54 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones090_2K-JPG` |
| **B** | Paving Stones091 2K JPG * | 21.60 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones091_2K-JPG` |
| **B** | Paving Stones092 2K JPG * | 21.86 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones092_2K-JPG` |
| **B** | Paving Stones093 2K JPG * | 20.05 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones093_2K-JPG` |
| **B** | Paving Stones094 2K JPG * | 20.03 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones094_2K-JPG` |
| **B** | Paving Stones095 2K JPG * | 19.81 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones095_2K-JPG` |
| **B** | Paving Stones096 2K JPG * | 20.65 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones096_2K-JPG` |
| **B** | Paving Stones097 2K JPG * | 21.16 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones097_2K-JPG` |
| **B** | Paving Stones098 2K JPG * | 18.29 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones098_2K-JPG` |
| **B** | Paving Stones099 2K JPG * | 18.23 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones099_2K-JPG` |
| **B** | Paving Stones100 2K JPG * | 20.13 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones100_2K-JPG` |
| **B** | Paving Stones101 2K JPG * | 20.43 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones101_2K-JPG` |
| **B** | Paving Stones102 2K JPG * | 19.65 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones102_2K-JPG` |
| **B** | Paving Stones103 2K JPG * | 20.44 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones103_2K-JPG` |
| **B** | Paving Stones104 2K JPG * | 18.74 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones104_2K-JPG` |
| **B** | Paving Stones105 2K JPG * | 19.05 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones105_2K-JPG` |
| **B** | Paving Stones106 2K JPG * | 18.93 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones106_2K-JPG` |
| **B** | Paving Stones107 2K JPG * | 22.59 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones107_2K-JPG` |
| **B** | Paving Stones108 2K JPG * | 24.04 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones108_2K-JPG` |
| **B** | Paving Stones109 2K JPG * | 22.71 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones109_2K-JPG` |
| **B** | Paving Stones110 2K JPG * | 9.67 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones110_2K-JPG` |
| **B** | Paving Stones111 2K JPG * | 11.09 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones111_2K-JPG` |
| **B** | Paving Stones112 2K JPG * | 23.70 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones112_2K-JPG` |
| **B** | Paving Stones114 2K JPG * | 21.38 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones114_2K-JPG` |
| **B** | Paving Stones115C 2K JPG * | 16.75 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones115C_2K-JPG` |
| **B** | Paving Stones116 2K JPG * | 21.26 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones116_2K-JPG` |
| **B** | Paving Stones117 2K JPG * | 24.10 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones117_2K-JPG` |
| **B** | Paving Stones118 2K JPG * | 21.49 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones118_2K-JPG` |
| **B** | Paving Stones119 2K JPG * | 22.16 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones119_2K-JPG` |
| **B** | Paving Stones120 2K JPG * | 23.97 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones120_2K-JPG` |
| **B** | Paving Stones121 2K JPG * | 10.19 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones121_2K-JPG` |
| **B** | Paving Stones122 2K JPG * | 10.62 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones122_2K-JPG` |
| **B** | Paving Stones123 2K JPG * | 20.37 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones123_2K-JPG` |
| **B** | Paving Stones124 2K JPG * | 20.67 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones124_2K-JPG` |
| **B** | Paving Stones125A 2K JPG * | 22.59 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones125A_2K-JPG` |
| **B** | Paving Stones125B 2K JPG * | 22.39 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones125B_2K-JPG` |
| **B** | Paving Stones126A 2K JPG * | 22.66 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones126A_2K-JPG` |
| **B** | Paving Stones126B 2K JPG * | 22.40 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones126B_2K-JPG` |
| **B** | Paving Stones127 2K JPG * | 22.05 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones127_2K-JPG` |
| **B** | Paving Stones128 2K JPG * | 21.96 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones128_2K-JPG` |
| **B** | Paving Stones129 2K JPG * | 20.63 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones129_2K-JPG` |
| **B** | Paving Stones130 2K JPG * | 24.16 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones130_2K-JPG` |
| **B** | Paving Stones132 2K JPG * | 17.72 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones132_2K-JPG` |
| **B** | Paving Stones133 2K JPG * | 17.74 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones133_2K-JPG` |
| **B** | Paving Stones135 2K JPG * | 24.86 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones135_2K-JPG` |
| **B** | Paving Stones137 2K JPG * | 18.98 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones137_2K-JPG` |
| **B** | Paving Stones138 2K JPG * | 10.56 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones138_2K-JPG` |
| **B** | Paving Stones141 2K JPG * | 22.87 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones141_2K-JPG` |
| **B** | Paving Stones142 2K JPG * | 20.64 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones142_2K-JPG` |
| **B** | Paving Stones145 2K JPG * | 22.19 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones145_2K-JPG` |
| **B** | Paving Stones146 2K JPG * | 23.25 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones146_2K-JPG` |
| **B** | Paving Stones147 2K JPG * | 21.75 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones147_2K-JPG` |
| **B** | Paving Stones148 2K JPG * | 21.68 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones148_2K-JPG` |
| **B** | Paving Stones149 2K JPG * | 11.63 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones149_2K-JPG` |
| **B** | Paving Stones150 2K JPG * | 11.01 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones150_2K-JPG` |
| **B** | Paving Stones151 2K JPG * | 20.59 | True/True/True | `assets/asset_niva_1/terrang/texturer/PavingStones151_2K-JPG` |
| **B** | Pine Needles001 2K JPG * | 7.91 | True/True/True | `assets/asset_niva_1/terrang/texturer/PineNeedles001_2K-JPG` |
| **B** | Rocks012 2K JPG * | 16.11 | True/True/True | `assets/asset_niva_1/terrang/texturer/Rocks012_2K-JPG` |
| **B** | Rocks013 2K JPG * | 17.99 | True/True/True | `assets/asset_niva_1/terrang/texturer/Rocks013_2K-JPG` |
| **B** | Rocks014 2K JPG * | 20.46 | True/True/True | `assets/asset_niva_1/terrang/texturer/Rocks014_2K-JPG` |
| **B** | Rocks015 2K JPG * | 18.90 | True/True/True | `assets/asset_niva_1/terrang/texturer/Rocks015_2K-JPG` |
| **B** | Rocks017 2K JPG * | 17.52 | True/True/True | `assets/asset_niva_1/terrang/texturer/Rocks017_2K-JPG` |
| **B** | Rocks018 2K JPG * | 18.13 | True/True/True | `assets/asset_niva_1/terrang/texturer/Rocks018_2K-JPG` |
| **B** | Rocks019 2K JPG * | 19.58 | True/True/True | `assets/asset_niva_1/terrang/texturer/Rocks019_2K-JPG` |
| **B** | Rocks020 2K JPG * | 20.08 | True/True/True | `assets/asset_niva_1/terrang/texturer/Rocks020_2K-JPG` |
| **B** | Rocks021 2K JPG * | 20.93 | True/True/True | `assets/asset_niva_1/terrang/texturer/Rocks021_2K-JPG` |
| **B** | Rocks024S 2K JPG * | 18.73 | True/True/True | `assets/asset_niva_1/terrang/texturer/Rocks024S_2K-JPG` |
| **B** | Rocks025 2K JPG * | 21.90 | True/True/True | `assets/asset_niva_1/terrang/texturer/Rocks025_2K-JPG` |
| **B** | Scattered Leaves001 4K JPG * | 74.22 | True/True/True | `assets/asset_niva_1/terrang/texturer/ScatteredLeaves001_4K-JPG` |
| **B** | Scattered Leaves002 4K JPG * | 109.33 | True/True/True | `assets/asset_niva_1/terrang/texturer/ScatteredLeaves002_4K-JPG` |
| **B** | Scattered Leaves003 4K JPG * | 21.70 | True/True/True | `assets/asset_niva_1/terrang/texturer/ScatteredLeaves003_4K-JPG` |
| **B** | Scattered Leaves004 4K JPG * | 25.32 | True/True/True | `assets/asset_niva_1/terrang/texturer/ScatteredLeaves004_4K-JPG` |
| **B** | Scattered Leaves005 4K JPG * | 53.86 | True/True/True | `assets/asset_niva_1/terrang/texturer/ScatteredLeaves005_4K-JPG` |
| **B** | Scattered Leaves008 4K JPG * | 86.79 | True/True/True | `assets/asset_niva_1/terrang/texturer/ScatteredLeaves008_4K-JPG` |
| **B** | Scattered Leaves009 4K JPG * | 100.02 | True/True/True | `assets/asset_niva_1/terrang/texturer/ScatteredLeaves009_4K-JPG` |
| **B** | Stick Set001 2K JPG * | 6.56 | True/True/True | `assets/asset_niva_1/terrang/texturer/StickSet001_2K-JPG` |
| **B** | Surface Imperfections017 2K JPG * | 19.27 | True/True/True | `assets/asset_niva_1/terrang/texturer/SurfaceImperfections017_2K-JPG` |
| **B** | Surface Imperfections018 2K JPG * | 17.84 | True/True/True | `assets/asset_niva_1/terrang/texturer/SurfaceImperfections018_2K-JPG` |
| **B** | Surface Imperfections019 2K JPG * | 18.68 | True/True/True | `assets/asset_niva_1/terrang/texturer/SurfaceImperfections019_2K-JPG` |
| **B** | Surface Imperfections020 2K JPG * | 19.01 | True/True/True | `assets/asset_niva_1/terrang/texturer/SurfaceImperfections020_2K-JPG` |
| **B** | Tire Tracks001 2K JPG * | 4.14 | True/True/True | `assets/asset_niva_1/terrang/texturer/TireTracks001_2K-JPG` |
| **B** | Travertine001 2K JPG * | 7.20 | True/True/True | `assets/asset_niva_1/terrang/texturer/Travertine001_2K-JPG` |
| **B** | Travertine002 2K JPG * | 6.12 | True/True/True | `assets/asset_niva_1/terrang/texturer/Travertine002_2K-JPG` |
| **B** | Travertine003 2K JPG * | 7.08 | True/True/True | `assets/asset_niva_1/terrang/texturer/Travertine003_2K-JPG` |
| **B** | Travertine004 2K JPG * | 7.08 | True/True/True | `assets/asset_niva_1/terrang/texturer/Travertine004_2K-JPG` |
| **B** | Travertine005 2K JPG * | 10.71 | True/True/True | `assets/asset_niva_1/terrang/texturer/Travertine005_2K-JPG` |
| **B** | Travertine006 2K JPG * | 13.33 | True/True/True | `assets/asset_niva_1/terrang/texturer/Travertine006_2K-JPG` |
| **B** | Travertine007 2K JPG * | 8.02 | True/True/True | `assets/asset_niva_1/terrang/texturer/Travertine007_2K-JPG` |
| **B** | Travertine008 2K JPG * | 7.81 | True/True/True | `assets/asset_niva_1/terrang/texturer/Travertine008_2K-JPG` |
| **B** | Travertine009 2K JPG * | 6.69 | True/True/True | `assets/asset_niva_1/terrang/texturer/Travertine009_2K-JPG` |
| **B** | Travertine010 2K JPG * | 8.80 | True/True/True | `assets/asset_niva_1/terrang/texturer/Travertine010_2K-JPG` |
| **B** | Travertine011 2K JPG * | 8.25 | True/True/True | `assets/asset_niva_1/terrang/texturer/Travertine011_2K-JPG` |
| **B** | Travertine012 2K JPG * | 8.03 | True/True/True | `assets/asset_niva_1/terrang/texturer/Travertine012_2K-JPG` |
| **B** | Travertine013 2K JPG * | 8.49 | True/True/True | `assets/asset_niva_1/terrang/texturer/Travertine013_2K-JPG` |
| **B** | Travertine014 2K JPG * | 12.91 | True/True/True | `assets/asset_niva_1/terrang/texturer/Travertine014_2K-JPG` |
| **B** | Aerial beach 02 * | 5.04 | True/True/True | `assets/asset_niva_1/terrang/texturer/aerial_beach_02` |
| **B** | Aerial beach 03 * | 4.68 | True/True/True | `assets/asset_niva_1/terrang/texturer/aerial_beach_03` |
| **B** | Aerial stenar 04 * | 11.56 | True/True/True | `assets/asset_niva_1/terrang/texturer/aerial_rocks_04` |
| **B** | Ambientcg Foliage001 * | 11.10 | True/True/True | `assets/asset_niva_1/terrang/texturer/ambientcg_Foliage001` |
| **B** | Ambientcg Foliage002 * | 8.12 | True/True/True | `assets/asset_niva_1/terrang/texturer/ambientcg_Foliage002` |
| **B** | Ambientcg Foliage003 * | 8.40 | True/True/True | `assets/asset_niva_1/terrang/texturer/ambientcg_Foliage003` |
| **B** | Ambientcg Foliage004 * | 9.12 | True/True/True | `assets/asset_niva_1/terrang/texturer/ambientcg_Foliage004` |
| **B** | Ambientcg Foliage006 * | 3.71 | True/True/True | `assets/asset_niva_1/terrang/texturer/ambientcg_Foliage006` |
| **B** | Ambientcg Foliage007 * | 4.65 | True/True/True | `assets/asset_niva_1/terrang/texturer/ambientcg_Foliage007` |
| **B** | Ambientcg Foliage008 * | 4.95 | True/True/True | `assets/asset_niva_1/terrang/texturer/ambientcg_Foliage008` |
| **B** | Ambientcg Leaf Set017 * | 10.44 | True/True/True | `assets/asset_niva_1/terrang/texturer/ambientcg_LeafSet017` |
| **B** | Ambientcg Leaf Set026 * | 5.87 | True/True/True | `assets/asset_niva_1/terrang/texturer/ambientcg_LeafSet026` |
| **B** | Ambientcg Leaf Set029 * | 9.10 | True/True/True | `assets/asset_niva_1/terrang/texturer/ambientcg_LeafSet029` |
| **B** | Asphalt 01 * | 19.17 | True/True/True | `assets/asset_niva_1/terrang/texturer/asphalt_01` |
| **B** | Asphalt 02 * | 13.42 | True/True/True | `assets/asset_niva_1/terrang/texturer/asphalt_02` |
| **B** | Asphalt 03 * | 20.95 | True/True/True | `assets/asset_niva_1/terrang/texturer/asphalt_03` |
| **B** | Asphalt 04 * | 14.82 | True/True/True | `assets/asset_niva_1/terrang/texturer/asphalt_04` |
| **B** | Asphalt snow * | 22.46 | True/True/True | `assets/asset_niva_1/terrang/texturer/asphalt_snow` |
| **B** | Bark platanus * | 15.35 | True/True/True | `assets/asset_niva_1/terrang/texturer/bark_platanus` |
| **B** | Bark willow 02 * | 20.49 | True/True/True | `assets/asset_niva_1/terrang/texturer/bark_willow_02` |
| **B** | Bicolour gravel * | 25.29 | True/True/True | `assets/asset_niva_1/terrang/texturer/bicolour_gravel` |
| **B** | Tegel gravel * | 20.22 | True/True/True | `assets/asset_niva_1/terrang/texturer/brick_gravel` |
| **B** | Brown mud * | 13.81 | True/True/True | `assets/asset_niva_1/terrang/texturer/brown_mud` |
| **B** | Brown mud 02 * | 15.79 | True/True/True | `assets/asset_niva_1/terrang/texturer/brown_mud_02` |
| **B** | Brown mud 03 * | 14.23 | True/True/True | `assets/asset_niva_1/terrang/texturer/brown_mud_03` |
| **B** | Brown mud torra * | 17.63 | True/True/True | `assets/asset_niva_1/terrang/texturer/brown_mud_dry` |
| **B** | Brown mud leaves 01 * | 22.10 | True/True/True | `assets/asset_niva_1/terrang/texturer/brown_mud_leaves_01` |
| **B** | Burned ground 01 * | 15.52 | True/True/True | `assets/asset_niva_1/terrang/texturer/burned_ground_01` |
| **B** | Ceiling interior * | 16.31 | True/True/True | `assets/asset_niva_1/terrang/texturer/ceiling_interior` |
| **B** | Chipped betong * | 14.20 | True/True/True | `assets/asset_niva_1/terrang/texturer/chipped_concrete` |
| **B** | Klippa sida * | 12.75 | True/True/True | `assets/asset_niva_1/terrang/texturer/cliff_side` |
| **B** | Kust sand 03 * | 21.44 | True/True/True | `assets/asset_niva_1/terrang/texturer/coast_sand_03` |
| **B** | Kust sand 04 * | 20.61 | True/True/True | `assets/asset_niva_1/terrang/texturer/coast_sand_04` |
| **B** | Cobblestone 03 * | 18.23 | True/True/True | `assets/asset_niva_1/terrang/texturer/cobblestone_03` |
| **B** | Cobblestone 04 * | 16.43 | True/True/True | `assets/asset_niva_1/terrang/texturer/cobblestone_04` |
| **B** | Cobblestone color * | 14.99 | True/True/True | `assets/asset_niva_1/terrang/texturer/cobblestone_color` |
| **B** | Cobblestone golv 001 * | 8.13 | True/True/True | `assets/asset_niva_1/terrang/texturer/cobblestone_floor_001` |
| **B** | Cobblestone golv 02 * | 4.13 | True/True/True | `assets/asset_niva_1/terrang/texturer/cobblestone_floor_02` |
| **B** | Cobblestone golv 03 * | 11.19 | True/True/True | `assets/asset_niva_1/terrang/texturer/cobblestone_floor_03` |
| **B** | Cobblestone golv 04 * | 9.82 | True/True/True | `assets/asset_niva_1/terrang/texturer/cobblestone_floor_04` |
| **B** | Cobblestone golv 05 * | 5.44 | True/True/True | `assets/asset_niva_1/terrang/texturer/cobblestone_floor_05` |
| **B** | Cobblestone golv 06 * | 14.40 | True/True/True | `assets/asset_niva_1/terrang/texturer/cobblestone_floor_06` |
| **B** | Cobblestone golv 07 * | 11.43 | True/True/True | `assets/asset_niva_1/terrang/texturer/cobblestone_floor_07` |
| **B** | Cobblestone golv 09 * | 15.96 | True/True/True | `assets/asset_niva_1/terrang/texturer/cobblestone_floor_09` |
| **B** | Cobblestone golv 13 * | 7.99 | True/True/True | `assets/asset_niva_1/terrang/texturer/cobblestone_floor_13` |
| **B** | Cobblestone stor 01 * | 10.79 | True/True/True | `assets/asset_niva_1/terrang/texturer/cobblestone_large_01` |
| **B** | Cobblestone pavement * | 12.03 | True/True/True | `assets/asset_niva_1/terrang/texturer/cobblestone_pavement` |
| **B** | Cobblestone square * | 7.81 | True/True/True | `assets/asset_niva_1/terrang/texturer/cobblestone_square` |
| **B** | Betong layers * | 13.06 | True/True/True | `assets/asset_niva_1/terrang/texturer/concrete_layers` |
| **B** | Betong layers 02 * | 12.91 | True/True/True | `assets/asset_niva_1/terrang/texturer/concrete_layers_02` |
| **B** | Betong pavement * | 20.66 | True/True/True | `assets/asset_niva_1/terrang/texturer/concrete_pavement` |
| **B** | Betong pavement 02 * | 19.45 | True/True/True | `assets/asset_niva_1/terrang/texturer/concrete_pavement_02` |
| **B** | Betong pavement 03 * | 18.82 | True/True/True | `assets/asset_niva_1/terrang/texturer/concrete_pavement_03` |
| **B** | Betong sten stig * | 15.97 | True/True/True | `assets/asset_niva_1/terrang/texturer/concrete_rock_path` |
| **B** | Cracked betong * | 15.17 | True/True/True | `assets/asset_niva_1/terrang/texturer/cracked_concrete` |
| **B** | Cracked betong 02 * | 16.86 | True/True/True | `assets/asset_niva_1/terrang/texturer/cracked_concrete_02` |
| **B** | Damp beach sand 02 * | 17.13 | True/True/True | `assets/asset_niva_1/terrang/texturer/damp_beach_sand_02` |
| **B** | Damp sand * | 18.92 | True/True/True | `assets/asset_niva_1/terrang/texturer/damp_sand` |
| **B** | Dark sten * | 14.01 | True/True/True | `assets/asset_niva_1/terrang/texturer/dark_rock` |
| **B** | Dark sten 02 * | 13.75 | True/True/True | `assets/asset_niva_1/terrang/texturer/dark_rock_02` |
| **B** | Dense sand * | 14.74 | True/True/True | `assets/asset_niva_1/terrang/texturer/dense_sand` |
| **B** | Diagonal parquet * | 10.45 | True/True/True | `assets/asset_niva_1/terrang/texturer/diagonal_parquet` |
| **B** | Dirt * | 15.65 | True/True/True | `assets/asset_niva_1/terrang/texturer/dirt` |
| **B** | Dirt golv * | 17.91 | True/True/True | `assets/asset_niva_1/terrang/texturer/dirt_floor` |
| **B** | Dirty betong * | 8.04 | True/True/True | `assets/asset_niva_1/terrang/texturer/dirty_concrete` |
| **B** | Torra decay leaves * | 15.87 | True/True/True | `assets/asset_niva_1/terrang/texturer/dry_decay_leaves` |
| **B** | Torra ground 01 * | 11.23 | True/True/True | `assets/asset_niva_1/terrang/texturer/dry_ground_01` |
| **B** | Torra ground stenar * | 18.98 | True/True/True | `assets/asset_niva_1/terrang/texturer/dry_ground_rocks` |
| **B** | Torra mud field 001 * | 7.80 | True/True/True | `assets/asset_niva_1/terrang/texturer/dry_mud_field_001` |
| **B** | Torra river pebbles * | 16.24 | True/True/True | `assets/asset_niva_1/terrang/texturer/dry_river_pebbles` |
| **B** | Torra riverbed sten * | 17.39 | True/True/True | `assets/asset_niva_1/terrang/texturer/dry_riverbed_rock` |
| **B** | Excavated soil vägg * | 15.96 | True/True/True | `assets/asset_niva_1/terrang/texturer/excavated_soil_wall` |
| **B** | Farm furrows * | 17.03 | True/True/True | `assets/asset_niva_1/terrang/texturer/farm_furrows` |
| **B** | Farm soil * | 19.18 | True/True/True | `assets/asset_niva_1/terrang/texturer/farm_soil` |
| **B** | Golv pattern 01 * | 5.95 | True/True/True | `assets/asset_niva_1/terrang/texturer/floor_pattern_01` |
| **B** | Golv pattern 02 * | 22.72 | True/True/True | `assets/asset_niva_1/terrang/texturer/floor_pattern_02` |
| **B** | Golv pebbles 01 * | 14.09 | True/True/True | `assets/asset_niva_1/terrang/texturer/floor_pebbles_01` |
| **B** | Flower scattered gravel * | 20.93 | True/True/True | `assets/asset_niva_1/terrang/texturer/flower_scattered_gravel` |
| **B** | Forest golv * | 23.01 | True/True/True | `assets/asset_niva_1/terrang/texturer/forest_floor` |
| **B** | Forest ground 04 * | 19.54 | True/True/True | `assets/asset_niva_1/terrang/texturer/forest_ground_04` |
| **B** | Forest ground 05 * | 16.78 | True/True/True | `assets/asset_niva_1/terrang/texturer/forest_ground_05` |
| **B** | Forest ground 06 * | 22.12 | True/True/True | `assets/asset_niva_1/terrang/texturer/forest_ground_06` |
| **B** | Forest leaves 02 * | 7.64 | True/True/True | `assets/asset_niva_1/terrang/texturer/forest_leaves_02` |
| **B** | Forest leaves 03 * | 19.03 | True/True/True | `assets/asset_niva_1/terrang/texturer/forest_leaves_03` |
| **B** | Forest leaves 04 * | 8.16 | True/True/True | `assets/asset_niva_1/terrang/texturer/forest_leaves_04` |
| **B** | Forrest ground 01 * | 19.05 | True/True/True | `assets/asset_niva_1/terrang/texturer/forrest_ground_01` |
| **B** | Forrest ground 03 * | 22.97 | True/True/True | `assets/asset_niva_1/terrang/texturer/forrest_ground_03` |
| **B** | Forrest sand 01 * | 17.27 | True/True/True | `assets/asset_niva_1/terrang/texturer/forrest_sand_01` |
| **B** | Granular betong * | 20.43 | True/True/True | `assets/asset_niva_1/terrang/texturer/granular_concrete` |
| **B** | Gräs ground * | 21.99 | True/True/True | `assets/asset_niva_1/terrang/texturer/grass_ground` |
| **B** | Gräs stig 2 * | 13.76 | True/True/True | `assets/asset_niva_1/terrang/texturer/grass_path_2` |
| **B** | Gräs stig 3 * | 14.25 | True/True/True | `assets/asset_niva_1/terrang/texturer/grass_path_3` |
| **B** | Gravel * | 20.14 | True/True/True | `assets/asset_niva_1/terrang/texturer/gravel` |
| **B** | Gravel betong * | 17.05 | True/True/True | `assets/asset_niva_1/terrang/texturer/gravel_concrete` |
| **B** | Gravel betong 02 * | 19.45 | True/True/True | `assets/asset_niva_1/terrang/texturer/gravel_concrete_02` |
| **B** | Gravel betong 03 * | 13.35 | True/True/True | `assets/asset_niva_1/terrang/texturer/gravel_concrete_03` |
| **B** | Gravel betong 04 * | 19.62 | True/True/True | `assets/asset_niva_1/terrang/texturer/gravel_concrete_04` |
| **B** | Gravel embedded betong * | 23.21 | True/True/True | `assets/asset_niva_1/terrang/texturer/gravel_embedded_concrete` |
| **B** | Gravel embedded betong 02 * | 17.79 | True/True/True | `assets/asset_niva_1/terrang/texturer/gravel_embedded_concrete_02` |
| **B** | Gravel golv * | 24.69 | True/True/True | `assets/asset_niva_1/terrang/texturer/gravel_floor` |
| **B** | Gravel golv 02 * | 24.08 | True/True/True | `assets/asset_niva_1/terrang/texturer/gravel_floor_02` |
| **B** | Gravel golv 03 * | 22.38 | True/True/True | `assets/asset_niva_1/terrang/texturer/gravel_floor_03` |
| **B** | Gravel golv 04 * | 20.49 | True/True/True | `assets/asset_niva_1/terrang/texturer/gravel_floor_04` |
| **B** | Gravel ground 01 * | 18.21 | True/True/True | `assets/asset_niva_1/terrang/texturer/gravel_ground_01` |
| **B** | Gravel road * | 11.57 | True/True/True | `assets/asset_niva_1/terrang/texturer/gravel_road` |
| **B** | Gravelly sand * | 20.57 | True/True/True | `assets/asset_niva_1/terrang/texturer/gravelly_sand` |
| **B** | Gray stenar * | 18.89 | True/True/True | `assets/asset_niva_1/terrang/texturer/gray_rocks` |
| **B** | Grey cartago 01 * | 10.02 | True/True/True | `assets/asset_niva_1/terrang/texturer/grey_cartago_01` |
| **B** | Grey cartago 02 * | 9.57 | True/True/True | `assets/asset_niva_1/terrang/texturer/grey_cartago_02` |
| **B** | Grey cartago 03 * | 10.82 | True/True/True | `assets/asset_niva_1/terrang/texturer/grey_cartago_03` |
| **B** | Grey sten stig * | 17.42 | True/True/True | `assets/asset_niva_1/terrang/texturer/grey_stone_path` |
| **B** | Herringbone parquet * | 13.19 | True/True/True | `assets/asset_niva_1/terrang/texturer/herringbone_parquet` |
| **B** | Herringbone pavement * | 17.98 | True/True/True | `assets/asset_niva_1/terrang/texturer/herringbone_pavement` |
| **B** | Herringbone pavement 02 * | 12.94 | True/True/True | `assets/asset_niva_1/terrang/texturer/herringbone_pavement_02` |
| **B** | Herringbone pavement 03 * | 19.03 | True/True/True | `assets/asset_niva_1/terrang/texturer/herringbone_pavement_03` |
| **B** | Herringbone pavement 04 * | 18.62 | True/True/True | `assets/asset_niva_1/terrang/texturer/herringbone_pavement_04` |
| **B** | Jolcham oak bark 01 * | 37.77 | True/True/True | `assets/asset_niva_1/terrang/texturer/jolcham_oak_bark_01` |
| **B** | Knotted pine bark * | 18.70 | True/True/True | `assets/asset_niva_1/terrang/texturer/knotted_pine_bark` |
| **B** | Stor pebbles * | 14.40 | True/True/True | `assets/asset_niva_1/terrang/texturer/large_pebbles` |
| **B** | Stor square pattern 01 * | 13.66 | True/True/True | `assets/asset_niva_1/terrang/texturer/large_square_pattern_01` |
| **B** | Leaf scattered gravel * | 20.63 | True/True/True | `assets/asset_niva_1/terrang/texturer/leaf_scattered_gravel` |
| **B** | Leaves forest ground * | 20.36 | True/True/True | `assets/asset_niva_1/terrang/texturer/leaves_forest_ground` |
| **B** | Lichen sten * | 17.60 | True/True/True | `assets/asset_niva_1/terrang/texturer/lichen_rock` |
| **B** | Low tide stenar * | 24.06 | True/True/True | `assets/asset_niva_1/terrang/texturer/low_tide_rocks` |
| **B** | Mixed sten pannor * | 16.46 | True/True/True | `assets/asset_niva_1/terrang/texturer/mixed_rock_tiles` |
| **B** | Mixed sten pannor * | 19.05 | True/True/True | `assets/asset_niva_1/terrang/texturer/mixed_stone_tiles` |
| **B** | Monastery sten golv * | 14.37 | True/True/True | `assets/asset_niva_1/terrang/texturer/monastery_stone_floor` |
| **B** | Mossy sten * | 18.47 | True/True/True | `assets/asset_niva_1/terrang/texturer/mossy_rock` |
| **B** | Mud cracked torra 03 * | 18.89 | True/True/True | `assets/asset_niva_1/terrang/texturer/mud_cracked_dry_03` |
| **B** | Mud cracked torra riverbed 002 * | 19.42 | True/True/True | `assets/asset_niva_1/terrang/texturer/mud_cracked_dry_riverbed_002` |
| **B** | Mud forest * | 15.83 | True/True/True | `assets/asset_niva_1/terrang/texturer/mud_forest` |
| **B** | Muddy tracks * | 20.22 | True/True/True | `assets/asset_niva_1/terrang/texturer/muddy_tracks` |
| **B** | Multicolored pebble golv * | 14.78 | True/True/True | `assets/asset_niva_1/terrang/texturer/multicolored_pebble_floor` |
| **B** | Gammal sandstone 02 * | 15.30 | True/True/True | `assets/asset_niva_1/terrang/texturer/old_sandstone_02` |
| **B** | Park dirt * | 24.39 | True/True/True | `assets/asset_niva_1/terrang/texturer/park_dirt` |
| **B** | Park sand * | 16.44 | True/True/True | `assets/asset_niva_1/terrang/texturer/park_sand` |
| **B** | Patterned cobblestone * | 18.40 | True/True/True | `assets/asset_niva_1/terrang/texturer/patterned_cobblestone` |
| **B** | Patterned cobblestone 02 * | 17.33 | True/True/True | `assets/asset_niva_1/terrang/texturer/patterned_cobblestone_02` |
| **B** | Patterned paving * | 17.66 | True/True/True | `assets/asset_niva_1/terrang/texturer/patterned_paving` |
| **B** | Patterned paving 02 * | 12.30 | True/True/True | `assets/asset_niva_1/terrang/texturer/patterned_paving_02` |
| **B** | Patterned skiffer pannor * | 13.98 | True/True/True | `assets/asset_niva_1/terrang/texturer/patterned_slate_tiles` |
| **B** | Patterned terracotta tiling * | 10.12 | True/True/True | `assets/asset_niva_1/terrang/texturer/patterned_terracotta_tiling` |
| **B** | Pavement 01 * | 7.95 | True/True/True | `assets/asset_niva_1/terrang/texturer/pavement_01` |
| **B** | Pavement 02 * | 20.53 | True/True/True | `assets/asset_niva_1/terrang/texturer/pavement_02` |
| **B** | Pavement 03 * | 22.93 | True/True/True | `assets/asset_niva_1/terrang/texturer/pavement_03` |
| **B** | Pavement 04 * | 16.52 | True/True/True | `assets/asset_niva_1/terrang/texturer/pavement_04` |
| **B** | Pavement 05 * | 18.46 | True/True/True | `assets/asset_niva_1/terrang/texturer/pavement_05` |
| **B** | Pavement 06 * | 15.70 | True/True/True | `assets/asset_niva_1/terrang/texturer/pavement_06` |
| **B** | Pebble cemented golv * | 22.10 | True/True/True | `assets/asset_niva_1/terrang/texturer/pebble_cemented_floor` |
| **B** | Pebble embedded betong * | 18.76 | True/True/True | `assets/asset_niva_1/terrang/texturer/pebble_embedded_concrete` |
| **B** | Pebble embedded betong 02 * | 22.98 | True/True/True | `assets/asset_niva_1/terrang/texturer/pebble_embedded_concrete_02` |
| **B** | Pebble embedded pavement * | 19.52 | True/True/True | `assets/asset_niva_1/terrang/texturer/pebble_embedded_pavement` |
| **B** | Pebble ground 01 * | 11.35 | True/True/True | `assets/asset_niva_1/terrang/texturer/pebble_ground_01` |
| **B** | Pebbles * | 19.26 | True/True/True | `assets/asset_niva_1/terrang/texturer/pebbles` |
| **B** | Polyhaven cobblestone 02 * | 13.50 | True/True/True | `assets/asset_niva_1/terrang/texturer/polyhaven_cobblestone_02` |
| **B** | Polyhaven cobblestone 05 * | 5.06 | True/True/True | `assets/asset_niva_1/terrang/texturer/polyhaven_cobblestone_05` |
| **B** | Polyhaven cobblestone golv 08 * | 9.38 | True/True/True | `assets/asset_niva_1/terrang/texturer/polyhaven_cobblestone_floor_08` |
| **B** | Polyhaven leafy gräs * | 19.81 | True/True/True | `assets/asset_niva_1/terrang/texturer/polyhaven_leafy_grass` |
| **B** | Polyhaven sand 01 * | 6.73 | True/True/True | `assets/asset_niva_1/terrang/texturer/polyhaven_sand_01` |
| **B** | Polyhaven square cobblestone * | 15.51 | True/True/True | `assets/asset_niva_1/terrang/texturer/polyhaven_square_cobblestone` |
| **B** | Raked dirt * | 74.19 | True/True/True | `assets/asset_niva_1/terrang/texturer/raked_dirt` |
| **B** | Rectangular parquet * | 10.09 | True/True/True | `assets/asset_niva_1/terrang/texturer/rectangular_parquet` |
| **B** | Rectangular paving * | 14.82 | True/True/True | `assets/asset_niva_1/terrang/texturer/rectangular_paving` |
| **B** | River liten stenar * | 18.23 | True/True/True | `assets/asset_niva_1/terrang/texturer/river_small_rocks` |
| **B** | Road damaged * | 18.00 | True/True/True | `assets/asset_niva_1/terrang/texturer/road_damaged` |
| **B** | Road damaged 2 * | 18.62 | True/True/True | `assets/asset_niva_1/terrang/texturer/road_damaged_2` |
| **B** | Road damaged clean * | 17.05 | True/True/True | `assets/asset_niva_1/terrang/texturer/road_damaged_clean` |
| **B** | Sten 01 * | 11.25 | True/True/True | `assets/asset_niva_1/terrang/texturer/rock_01` |
| **B** | Sten 04 * | 11.52 | True/True/True | `assets/asset_niva_1/terrang/texturer/rock_04` |
| **B** | Sten 05 * | 14.30 | True/True/True | `assets/asset_niva_1/terrang/texturer/rock_05` |
| **B** | Sten 06 * | 12.83 | True/True/True | `assets/asset_niva_1/terrang/texturer/rock_06` |
| **B** | Sten 08 * | 10.16 | True/True/True | `assets/asset_niva_1/terrang/texturer/rock_08` |
| **B** | Sten 2 * | 16.16 | True/True/True | `assets/asset_niva_1/terrang/texturer/rock_2` |
| **B** | Sten stenblock cracked * | 14.52 | True/True/True | `assets/asset_niva_1/terrang/texturer/rock_boulder_cracked` |
| **B** | Sten stenblock torra * | 15.70 | True/True/True | `assets/asset_niva_1/terrang/texturer/rock_boulder_dry` |
| **B** | Sten embedded betong * | 14.44 | True/True/True | `assets/asset_niva_1/terrang/texturer/rock_embedded_concrete` |
| **B** | Sten embedded golv * | 16.44 | True/True/True | `assets/asset_niva_1/terrang/texturer/rock_embedded_floor` |
| **B** | Sten face 03 * | 17.55 | True/True/True | `assets/asset_niva_1/terrang/texturer/rock_face_03` |
| **B** | Sten face 04 * | 15.46 | True/True/True | `assets/asset_niva_1/terrang/texturer/rock_face_04` |
| **B** | Sten ground * | 19.79 | True/True/True | `assets/asset_niva_1/terrang/texturer/rock_ground` |
| **B** | Sten ground 02 * | 20.70 | True/True/True | `assets/asset_niva_1/terrang/texturer/rock_ground_02` |
| **B** | Sten stig * | 21.28 | True/True/True | `assets/asset_niva_1/terrang/texturer/rock_path` |
| **B** | Sten pitted mossy * | 17.35 | True/True/True | `assets/asset_niva_1/terrang/texturer/rock_pitted_mossy` |
| **B** | Sten surface * | 18.12 | True/True/True | `assets/asset_niva_1/terrang/texturer/rock_surface` |
| **B** | Sten panna golv * | 18.55 | True/True/True | `assets/asset_niva_1/terrang/texturer/rock_tile_floor` |
| **B** | Sten panna golv 02 * | 17.06 | True/True/True | `assets/asset_niva_1/terrang/texturer/rock_tile_floor_02` |
| **B** | Stenar ground 01 * | 12.57 | True/True/True | `assets/asset_niva_1/terrang/texturer/rocks_ground_01` |
| **C** | Stenar ground 02 * | 14.14 | False/True/True | `assets/asset_niva_1/terrang/texturer/rocks_ground_02` |
| **B** | Stenar ground 03 * | 15.24 | True/True/True | `assets/asset_niva_1/terrang/texturer/rocks_ground_03` |
| **B** | Stenar ground 04 * | 10.89 | True/True/True | `assets/asset_niva_1/terrang/texturer/rocks_ground_04` |
| **B** | Stenar ground 05 * | 12.62 | True/True/True | `assets/asset_niva_1/terrang/texturer/rocks_ground_05` |
| **B** | Stenar ground 06 * | 12.51 | True/True/True | `assets/asset_niva_1/terrang/texturer/rocks_ground_06` |
| **B** | Stenar ground 08 * | 13.99 | True/True/True | `assets/asset_niva_1/terrang/texturer/rocks_ground_08` |
| **B** | Stenar ground 09 * | 13.17 | True/True/True | `assets/asset_niva_1/terrang/texturer/rocks_ground_09` |
| **B** | Rocky gravel * | 23.49 | True/True/True | `assets/asset_niva_1/terrang/texturer/rocky_gravel` |
| **B** | Rocky trail 02 * | 21.04 | True/True/True | `assets/asset_niva_1/terrang/texturer/rocky_trail_02` |
| **B** | Roots * | 19.24 | True/True/True | `assets/asset_niva_1/terrang/texturer/roots` |
| **B** | Rubble * | 15.65 | True/True/True | `assets/asset_niva_1/terrang/texturer/rubble` |
| **B** | Sand 02 * | 18.26 | True/True/True | `assets/asset_niva_1/terrang/texturer/sand_02` |
| **B** | Sand 03 * | 14.62 | True/True/True | `assets/asset_niva_1/terrang/texturer/sand_03` |
| **B** | Sandstone cracks * | 12.61 | True/True/True | `assets/asset_niva_1/terrang/texturer/sandstone_cracks` |
| **B** | Sandy gravel * | 19.77 | True/True/True | `assets/asset_niva_1/terrang/texturer/sandy_gravel` |
| **B** | Sandy gravel 02 * | 20.11 | True/True/True | `assets/asset_niva_1/terrang/texturer/sandy_gravel_02` |
| **B** | Seaside sten * | 16.26 | True/True/True | `assets/asset_niva_1/terrang/texturer/seaside_rock` |
| **B** | Skiffer driveway * | 17.59 | True/True/True | `assets/asset_niva_1/terrang/texturer/slate_driveway` |
| **B** | Skiffer golv * | 19.10 | True/True/True | `assets/asset_niva_1/terrang/texturer/slate_floor` |
| **B** | Skiffer golv 02 * | 11.14 | True/True/True | `assets/asset_niva_1/terrang/texturer/slate_floor_02` |
| **B** | Skiffer golv 03 * | 15.32 | True/True/True | `assets/asset_niva_1/terrang/texturer/slate_floor_03` |
| **B** | Snow 01 * | 10.52 | True/True/True | `assets/asset_niva_1/terrang/texturer/snow_01` |
| **B** | Snow 03 * | 12.75 | True/True/True | `assets/asset_niva_1/terrang/texturer/snow_03` |
| **B** | Snow 04 * | 12.68 | True/True/True | `assets/asset_niva_1/terrang/texturer/snow_04` |
| **B** | Snow 05 * | 11.89 | True/True/True | `assets/asset_niva_1/terrang/texturer/snow_05` |
| **B** | Sparse gräs * | 25.01 | True/True/True | `assets/asset_niva_1/terrang/texturer/sparse_grass` |
| **B** | Square golv * | 9.24 | True/True/True | `assets/asset_niva_1/terrang/texturer/square_floor` |
| **B** | Square golv patern 01 * | 16.78 | True/True/True | `assets/asset_niva_1/terrang/texturer/square_floor_patern_01` |
| **B** | Stad klattervaxter ambientcg leafset017 2k * | 7.12 | True/True/True | `assets/asset_niva_1/terrang/texturer/stad_klattervaxter_ambientcg_leafset017_2k` |
| **B** | Stad klattervaxter ambientcg leafset029 2k * | 7.53 | True/True/True | `assets/asset_niva_1/terrang/texturer/stad_klattervaxter_ambientcg_leafset029_2k` |
| **B** | Sten embedded betong * | 15.92 | True/True/True | `assets/asset_niva_1/terrang/texturer/stone_embedded_concrete` |
| **B** | Sten golv * | 15.66 | True/True/True | `assets/asset_niva_1/terrang/texturer/stone_floor` |
| **B** | Sten pathway * | 14.66 | True/True/True | `assets/asset_niva_1/terrang/texturer/stone_pathway` |
| **B** | Sten pathway 02 * | 15.19 | True/True/True | `assets/asset_niva_1/terrang/texturer/stone_pathway_02` |
| **B** | Sten pannor 02 * | 15.31 | True/True/True | `assets/asset_niva_1/terrang/texturer/stone_tiles_02` |
| **B** | Sten pannor 03 * | 18.88 | True/True/True | `assets/asset_niva_1/terrang/texturer/stone_tiles_03` |
| **B** | Stony dirt stig * | 18.15 | True/True/True | `assets/asset_niva_1/terrang/texturer/stony_dirt_path` |
| **B** | Tarred gravel * | 19.55 | True/True/True | `assets/asset_niva_1/terrang/texturer/tarred_gravel` |
| **B** | Winter leaves * | 22.60 | True/True/True | `assets/asset_niva_1/terrang/texturer/winter_leaves` |
| **B** | Withered gräs * | 99.11 | True/True/True | `assets/asset_niva_1/terrang/texturer/withered_grass` |
| **B** | Trä chip stig * | 20.96 | True/True/True | `assets/asset_niva_1/terrang/texturer/wood_chip_path` |
| **B** | Trä chips * | 19.82 | True/True/True | `assets/asset_niva_1/terrang/texturer/wood_chips` |
| **B** | Trä sten pathway * | 17.04 | True/True/True | `assets/asset_niva_1/terrang/texturer/wood_stone_pathway` |
| **B** | Worn asphalt * | 22.45 | True/True/True | `assets/asset_niva_1/terrang/texturer/worn_asphalt` |
| **B** | Worn sten natural 01 * | 13.60 | True/True/True | `assets/asset_niva_1/terrang/texturer/worn_rock_natural_01` |
| **B** | Yellow flower mulch * | 20.58 | True/True/True | `assets/asset_niva_1/terrang/texturer/yellow_flower_mulch` |

## Återkörning
```sh
python3 KATALOG/uppdatera_katalog.py
```
Cache återanvänder oförändrade SHA256. `--refresh` mäter om. Katalogutdata skrivs över, aldrig modellfiler. Diskvakt stoppar under 3 GiB (lite striktare än 3 GB). Inga externa tjänster eller servrar behövs. Verktyg: Python/Pillow + befintliga glTF-Transform/meshoptimizer/Draco/validator-paket.

## Viktiga luckor
- † vid mått = deklarerade JSON-gränser/tri, inte vertexverifierad mätning.
- Materialgenvägar följs en gång och finns i JSON: interna dubbletter räknas inte extra; externa materialmål länkas utan att flyttas.
- Huvudfiler med saknade binär-/bildresurser märks C. Mått från deras JSON-metadata är märkta EJ vertexverifierade; miniatyrer kan komma från befintliga härledda LOD-filer.
- Inget enhetspaket har styrkt godkänt ljud + besättning; statusmappens kandidatläge räcker inte för A.
- Alla härledda svenska namn är märkta som tolkning/gissning; exakta ID och sökvägar finns kvar.
- Skala är automatisk rimlighetskontroll, inte historiskt måttgodkännande. Ingen iPhone-mätning gjord.
- Katalogens modellomfång är asset_niva_1. Soldater och bl.a. M1919/Maxim finns i andra biblioteksdelar och är inte inräknade här; _STATUS är länkat som underlag.
- Geometribilder är inte texturerad granskning. Endast ett visuellt stickprov görs, se separat STICKPROV.md.
- Versionsvarianter finns kvar på disk; katalogen grupperar dem utan att flytta eller döpa om.

## Underlag
- `_work/klar_kategori_luckmatris_v1.md`
- `_work/tiger_sherman_klar_v1.md`
- `assets/models/per_nation/_STATUS/README.md`