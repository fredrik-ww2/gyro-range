# Rörelsefil, version 2

Filen är vanlig JSON. Den kan sparas från menyn och hämtas in igen, så biblioteket inte försvinner om telefonen rensas.

Startvärden som går att ändra utan att bygga om sidan ligger i `config.json`. Där står bland annat hur många sekunder som klipps bort före ordet **slut** (`svansSek`, startvärde 0,4).

## Filnamn

`rorelser-ÅÅÅÅ-MM-DD.json`

Roten har:

| Fält | Betydelse |
| --- | --- |
| `format` | Alltid `"ww2-rorelse"`. |
| `version` | `2`. Version 1 (äldre namngivna gester) kan fortfarande läsas in och läggs under kategorin Tidigare rörelser. |
| `exporterad` | När filen skapades, ISO-8601. |
| `kategorier` | Bibliotekets kategorier, faktorer, val och underval. |
| `inspelningar` | De sparade rörelserna. |
| `senast` | Det val som föreslås nästa gång. |

## Kategori

En kategori, till exempel Bordtennis, har faktorer. En faktor, till exempel Skruv, har val. Ett val kan ha underval, ett steg ner.

```json
{
  "id": "…",
  "namn": "Bordtennis",
  "faktorer": [
    {
      "id": "…",
      "namn": "Skruv",
      "val": [
        { "id": "…", "namn": "Kraftig slice", "underval": [] }
      ]
    }
  ]
}
```

## Inspelning

`val` pekar på id. `etikett` är namnen som de såg ut när inspelningen sparades, så texten finns kvar även om ett val byter namn senare.

`egenskaper` är en vektor som `analys.js` räknar ut. `namn[i]` hör ihop med `vektor[i]`. `null` betyder att sensorn inte gav det värdet. Samma vektor kan senare användas för att lära appen känna igen en rörelse.

| Fält | Betydelse |
| --- | --- |
| `langdSek` | Längd efter att svansen klippts bort. |
| `avslut` | `slut` (ordet), `stopp` (knappen) eller `max` (tidsgränsen). |
| `svansSek` | Hur mycket som klipptes bort före stoppet. Vid `max` är den 0. |
| `nollage` | Orienteringen vid Nollställ, `[alfa, beta, gamma]` i grader. |
| `sampel` | Mätningarna. |

## Ett sampel

`t` är sekunder från Nollställ, sidans klocka när sensorn rapporterade.

```json
{
  "t": 0.16,
  "rot": [12.5, -40.2, 3.1],
  "acc": [0.4, 1.1, -0.2],
  "accG": [0.3, 1.0, -9.6],
  "vinkel": [4.0, -2.1, 0.5],
  "skarm": 0
}
```

`null` betyder att sensorn inte skickade värdet.

- **rot** är `DeviceMotion.rotationRate`, grader per sekund. Alfa är vridning, beta är tippa, gamma är luta.
- **acc** är acceleration utan gravitation, m/s². x åt höger, y uppåt, z ut ur skärmen.
- **accG** är acceleration med gravitation. Värdena sparas som telefonen skickar dem.
- **vinkel** är orienteringen minus nolläget, vikt till −180…180 grader, så att ett hopp över norr inte ser ut som ett helt varv.
- **skarm** är hur telefonen är vriden, 0 är porträtt.

Total vridning i tabellen är summan av rotationshastigheten över tiden, i grader.

## Import

En fil tas in om `format` är `ww2-rorelse` och `version` är 2 (eller 1, som ovan). Samma `id` ersätter det som redan finns. Nya id läggs till. Inget som bara finns på telefonen tas bort.

## Mönster

`profiler` är valfritt. Ett mönster hör till en kategori och en exakt kombination av val. Det sparas från jämförelsen och innehåller medelvärde och spridning (standardavvikelse, delat med n−1) för varje mätvärde, plus medelkurvan. Samma `id` ersätter mönstret som redan finns. En fil utan `profiler` går fortfarande att läsa in. En senare version kan jämföra ett nytt slag med mönstren i samma kategori.
