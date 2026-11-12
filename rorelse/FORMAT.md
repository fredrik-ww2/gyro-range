# Rörelsefil, version 1

Filen är vanlig JSON. Den är inte låst till en spelmotor. Ett spel som ska känna igen gester läser `gester` och jämför en ny mätning med exemplen. Samma jämförelse som telefonens **Känn igen** (första versionen) står längst ner, så den går att bygga om.

Sidans startvärden ligger i `installningar.json`. Det man drar i på telefonen sparas i webbläsarens localStorage under nyckeln `ww2-rorelse-installningar` och följer med i exporten.

## Filnamn

`rorelser-ÅÅÅÅ-MM-DD.json`

Roten har:

| Fält | Betydelse |
| --- | --- |
| `format` | Alltid `"ww2-rorelse"`. Annan text är en annan fil. |
| `version` | `1`. Högre nummer kan ändra fält. |
| `exporterad` | Tidpunkt i ISO-8601, när filen skapades. |
| `nycklar` | Vad varje kort namn i ett sampel betyder. Ligger i filen så man inte måste ha den här texten. |
| `enheter` | Vilka storheter som används. |
| `enhet` | Telefonen som spelade in: `userAgent`, `plattform` (`ios`, `android` eller `other`), `sprak`, `skarm`. |
| `installningar` | Känslighet, dödzon, utjämning och tider som gällde vid exporten. |
| `gester` | Listan med namngivna rörelser. |

## En gest

```json
{
  "id": "…",
  "namn": "backhand i tennis",
  "skapad": "2026-11-12T22:00:00.000Z",
  "uppdaterad": "2026-11-12T22:04:00.000Z",
  "exempel": []
}
```

Flera exempel på samma namn är meningen. De är olika tagningar, inte olika gester.

## Ett exempel

| Fält | Betydelse |
| --- | --- |
| `id` | Unikt inom filen. |
| `skapad` | När tagningen gjordes. |
| `langdSek` | Längd i sekunder. |
| `samplingsfrekvensHz` | Verklig takt, `(antal − 1) / langdSek`. Målet är omkring 60. Telefonen kan ge färre. |
| `antal` | Antal sampel. |
| `avslut` | `stopp` (knappen), `stilla` (tillräckligt stilla) eller `max` (tidsgränsen). |
| `sampel` | Rå mätningar. Känslighet, dödzon och utjämning är inte inbakade. |

## Ett sampel

Tiden `t` är sekunder från tagningens start. Klockan är sidans `performance.now`, läst när webbläsaren levererade händelsen.

```json
{
  "t": 0.167,
  "rot": [12.5, -40.2, 3.1],
  "vinkel": [184.0, 21.4, -6.2],
  "acc": [0.4, 1.1, -0.2],
  "accG": [0.3, 1.0, -9.6],
  "skarm": 0
}
```

`null` betyder att sensorn inte skickade det värdet. På iPhone saknas ofta acceleration utan gravitation tills telefonen rör sig.

Axlarna är webbläsarens, i porträtt när `skarm` är 0:

- **rot** är `DeviceMotion.rotationRate`, grader per sekund. `alfa` är vridning (runt axeln ut ur skärmen), `beta` är tippa framåt/bakåt, `gamma` är luta åt sidan.
- **vinkel** är `DeviceOrientation`, grader. `alfa` beror på hur man är vänd i rummet. Använd den inte som själva gesten.
- **acc** är `DeviceMotion.acceleration`, m/s², utan gravitation. x åt höger, y uppåt, z ut ur skärmen mot en själv.
- **accG** är `accelerationIncludingGravity`. Ligger telefonen stilla med skärmen upp ger iOS ofta z omkring **−9,8**, inte +9,8. Värdena sparas som telefonen skickar dem, utan teckenbyte.
- **skarm** är `screen.orientation.angle`, eller `window.orientation` om det är det som finns.

## Import

En fil tas in om `format` är `ww2-rorelse` och `version` är 1. Samma `id` ersätter den rörelsen på telefonen. Nya id läggs till. Inget som bara finns på telefonen tas bort.

## Känn igen, version 1

Märkt som första version i gränssnittet. Den kan ta fel.

1. Läs råa `sampel`.
2. Applicera dödzon och känslighet från inställningarna som gäller just då, sedan utjämning från start av tagningen. Vinklar utjämnas men används inte i jämförelsen, eftersom de beror på hur man står vänd.
3. Sampla om till `igenkanning.hz` (startvärde 20) med linjär interpolation.
4. Bygg en sexvärdesrad: tre rotationshastigheter delat med `rotSkala`, tre accelerationer utan gravitation delat med `accSkala`.
5. Jämför med varje sparat exempel med DTW (dynamisk tidsvarpning) och ett Sakoe-Chiba-band (`igenkanning.band`, andel av längden). Avståndet delas med antal rutor i vägen, så längden inte ensam vinner.
6. Bästa gest är den med minst avstånd till något av sina exempel.
7. Procenten är `100 * annat / (bästa + annat)`. `annat` är näst bästa gest. Finns bara en gest är `annat` avståndet till samma mall med omvänt tecken. 100 betyder att träffen är mycket närmare än alternativet. Omkring 50 betyder att de är lika nära.

Stillhet under inspelning tittar på rå rotationshastighet och rå acceleration efter dödzon, utan känslighet. Standard är 3 sekunder under 12 °/s och 0,45 m/s², och aldrig längre än 10 sekunder. Talen ligger i `installningar.json` och kan ändras på sidan.
