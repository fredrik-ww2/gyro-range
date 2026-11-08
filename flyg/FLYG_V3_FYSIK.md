# Flygprov 03 – hur ett propellerjaktplan rör sig (underlag för flight-model.js)
Datum 2026-11-08. Värdena i config.json → "aero". [F] = förenklat/uppskattat.

## Krafter
- Lyft L = ½·ρ·v²·S·CL(α). CL ökar linjärt med anfallsvinkeln α (≈5,0 per radian, noll-lyft vid −2°) upp till den kritiska vinkeln ≈16°. Därefter släpper strömningen (stall): CL faller till ca 65 % och motståndet ökar kraftigt.
- Motstånd D = ½·ρ·v²·S·(CD0 + k·CL²). Formmotståndet CD0 ≈ 0,0165 [F] och det inducerade k ≈ 0,065 [F]. Det inducerade motståndet blir stort vid hård dragning och låg fart.
- Dragkraft T = η·P·gas/v, högst ca 24 kN statiskt. Sabre IIA ≈ 2 180 hk ≈ 1 625 kW, η ≈ 0,78. Full effekt upp till ca 3 400 m (kompressor), sedan avtar effekten exponentiellt (skalhöjd 5 200 m) [F].
- Luftens densitet ρ(h) enligt standardatmosfären (1,225 kg/m³ vid havet, ca 0,41 vid 10 km).
- Typhoon Mk IB [F]: massa ca 5 170 kg, vingyta 25,9 m², spännvidd 12,67 m.

## Rörelseekvationer (punktmassa, γ = banvinkel, ψ = kurs, φ = bank)
- dv/dt = (T − D)/m − g·sin γ. Fart byts mot höjd i stigning och tillbaka i dyk (energi).
- dγ/dt = (L·cos φ − m·g·cos γ)/(m·v)
- dψ/dt = L·sin φ/(m·v·cos γ). Koordinerad sväng: med bank vrids lyftet åt sidan. Svängradien blir R = v²/(g·tan φ) när man drar n = 1/cos φ. Drar man inte, räcker lyftet inte och planet tappar höjd.
- Nosens attityd = γ + α (det syns att nosen ligger högre än banan vid låg fart).

## Styrning
- Lutning åt sidan = skevroder. Planet bankar till mobilens vinkel (kritiskt dämpad, samma tecken som flygprov 02: vänster lutning ger vänstersväng).
- Lutning bakåt/framåt = höjdroder. Det ändrar anfallsvinkeln utöver trimmen (0,35 rad α per rad lutning, högst +15°/−9°).
- Trim (spelhjälp, brytaren "Automatisk nivellering"): i neutralläge ger lyftet rak bana med plana vingar. Lyftet räknas inte upp vid bank, och trimvinkeln är högst 11°. Låg fart gör därför att nosen sjunker.
- Stall: när α > 16° tappar planet lyft, nosen faller (0,7 rad/s) och en vinge faller. Det står STALL i HUD:en och telefonen vibrerar. Planet återhämtar sig när mobilen lutas framåt, för då minskar α och farten ökar.
- Markkontakt ger krasch: en explosion och en brand med rök från den gemensamma effektkatalogen, sedan knappen "Flyg igen".

## Typhoon-data att jämföra med [F, ur allmänt kända uppgifter]
| | Verkligt (ca) | Modellen (simulerad) |
|---|---|---|
| Toppfart nära marken | ~600 km/h | 600 km/h |
| Toppfart på höjd | ~650 km/h (ca 5 000 m) | 657 km/h vid 3 000 m, 607 vid 5 500 m |
| Stigning | ~15 m/s | 0→3 000 m på ca 112–120 s med lätt dragning (stigning med fartförlust) |
| Stallfart | 140–170 km/h | 163 km/h (α 16°) |
| Tak | ~10 km | ca 7,5 km efter 10 min stigning, fortsätter långsamt [F] |
| Dyk | | ~770–850 km/h |

Begränsningar [F]: ingen spinn, inga loopar (banvinkeln är begränsad till ±83°), ingen sidglidning, ingen propellereffekt och ingen kompressibilitet.
