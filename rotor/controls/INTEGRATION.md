# ControlModule – helikopterstyrning

Modulen är vanlig JavaScript utan DOM, Three.js, sensorer eller ljud. Spelets flygning läser bara:

- `getCyclic()` → `{x, y}` inom −1…1. X positivt är höger, Y positivt är framåt.
- `getCollective()` → 0…1. 0 är nere, 1 är uppe. Läget ligger kvar.
- `getYaw()` → −1…1. Positivt är höger.
- `getAimOffset()` → `{yaw, pitch}` i radianer. Yaw positivt är sikte åt höger, pitch positivt är sikte upp. Metoden lämnar en kopia. `getAim()` är samma värde.

`FlightDynamics` läser bara de tre första. Siktet är spelets sak.

## Fyra lägen

`setControlMode(mode)` eller `configure({controlMode})` byter läge utan att tappa collective.

| Läge | Vad gyrot gör | Vad fingret gör |
| --- | --- | --- |
| `gyro-flight` | Cyclic, och gir om yaw-läget är `orientation` | Sikte, lyft, pedaler |
| `gyro-aim` | Siktet. Framåt tittar ned, höger tittar höger | Cyclic, lyft, pedaler |
| `gyro-both` | Både flygning och sikte. `setAimClutch(true)` fryser cyclic och låter lutningen styra siktet | Lyft och pedaler |
| `touch` | Ingenting | Cyclic, sikte, lyft, pedaler |

I växlande läge rör både vridning och sidlutning siktet i sidled. Framåtlutning sänker siktet. När fokuset släpps räknas nolläget om så cyclic inte hoppar.

Mata in en färsk sensorvinkel med `feedOrientation({pitch, roll, yaw})`. Pitch är positiv framåt, roll positiv åt höger, yaw positiv medurs, allt i grader. Kalla inte metoden igen med samma gamla prov. Då nollställs tidsgränsen. När proven uteblir längre än `inputTimeoutSeconds` går cyclic och gyro-gir mot noll. Collective ligger kvar.

## GyroAdapter

`controls/GyroAdapter.js` är det enda stället som känner till telefonen. Den gör om `DeviceOrientation` till samma grader via kvaternion, med skärmens vinkel (`screen.orientation` eller `window.orientation`) så att liggande och stående grepp stämmer. Ett hopp i Eulervinklar som inte motsvarar en verklig rörelse flyttar nolläget i stället för att slå spaken i botten.

`requestPermission()` anropar `DeviceOrientationEvent.requestPermission` direkt, så den ska startas av ett tryck. `take()` ger ett nytt prov eller `null`. `calibrate()` sätter den nuvarande telefonvinkeln som noll i adaptern. Kontrollmodulen har en egen `calibrate()` som nollar det filtrerade utslaget.

Tvåzonsroll från flygplanet används inte. En helikopterspak är ett läge, inte ett kommando som fortsätter att rolla.

## Känsla

Dödzon, fullt utslag, känslighet och mjukhet ligger i modulens inställningar. Standarddödzonen är 5°. Vid 17,5° är utslaget 0,5 och vid 30° är det fullt, före känslighet. Filtret är `1 − exp(−dt / tau)`.

Flygmodellen tappar vertikalt lyft med `cos(pitch) · cos(roll)`, så framåtlutning kräver mer collective. Fartlyft växer mjukt mellan 25 och 45 knop, med mittpunkt vid 35 knop. Hovringshjälp och pedalkompensation ändrar inte det som getterna lämnar. De verkar i flygmodellen.

Alla de här värdena finns i `config.json` och kan dras i spelets meny. Ingenting av det är fast i spelkoden.

## Tester

`npm test` i `rotor/` kör modul, flygmodell, de fyra lägena, `getAimOffset` och gyroadaptern. Inga paket behövs.
