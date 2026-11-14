# Ljudkällor

Flygljud, vapen, träffar och varningar spelas från inspelade filer i den här mappen. `ljud.json` här styr volym, loop och mp3-reserv. `ljud.js` kan fortfarande syntetisera ett lager om en post i rotens `ljud.json` har tom `file`, men spelet använder inspelningarna så fort de går att avkoda. Källor och licenser står i `KALLOR.md`. Masterfiler och original laddas inte av sidan.

`ljud.json` mappar varje händelse till `file`, `volume` och `loop`.

- Lämna `file` tom (`""`) så används syntesen.
- Sätt `file` till en relativ sökväg, till exempel `ljud/kanon.ogg` eller `ljud/raket.mp3`. Motorn hämtar filen, och om den går att avkoda spelas den i stället för syntesen. Volym och loop tas från samma post. Ingen kod behöver ändras.
- `loop: true` är ett ihållande lager (rotor, vind, varning). Uppspelningshastighet och nivå följer fortfarande flygläget när filen är ett loopande lager.
- `refDistance` på en händelse, eller `refDistance` i roten, styr hur fort träffar och explosioner tystnar och dämpas med avstånd.

Lägg bara in ljud som är fria att använda. Skriv källa, upphovsperson och licens här under. CC0 passar bäst.

Förslag på ställen med CC0, om en fil ska bytas in senare:

- Kenney, https://kenney.nl/assets — CC0
- OpenGameArt, https://opengameart.org — filtrera på CC0
- Freesound, https://freesound.org — filtrera på Creative Commons 0

## Inbyggd syntes

| Händelse | Vad den gör |
| --- | --- |
| rotorSlap | Bladpassage, fyra blad. Takten följer ett varvtal som rör sig med lyftet. Hårdare slag i fart. |
| rotorWash | Bruslager under slagen, följer lyftet. |
| rotorThump | Låg puls i rotorvarv, inte bladpassage. |
| turbine | Två lätt ostämda deltoner, stiger med lyft och fart. |
| wind | Brus som öppnar och växer med farten, med långsam byighet. |
| gun | Kort knall, mekaniskt klick och dovt slag. Hylsa kommer strax efter. |
| casing | Metallisk ringning, som en hylsa mot durken. |
| rocket | Whoosh med fallande bandpass. |
| explosion | Smäll och muller. Lågpass och nivå följer avståndet. |
| hit | Kortare träff, samma avståndsdämpning. |
| warnLow | Två toner när höjden är låg eller sjunket är brant. |
| warnBoundary | Låg puls vid yttre gräns. |
| click | Kort reglageklick. |
| pedal | Mekaniskt pedalklick. |

Inget av det här är en inspelning. Det finns därför ingen extern licens att ange för standardljuden.
