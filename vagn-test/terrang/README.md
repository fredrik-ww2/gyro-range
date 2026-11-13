# Terrängpaket för gyrospelet vagn-test (2026-11-13)

Mobiloptimerad kopia för three.js. Originalen i biblioteket är orörda.

## Vald terräng
Villers-Bocage, R50 tom markbas v1.0 (2026-11-08):
`/workspace/terrain_db/Normandie_1944/terrang/villers_bocage_R50_v1_20261108/`

Varför den är en av de bästa för ett mobilt stridsvagnstest:
- Exakt 2000 × 2000 m (räcker för skott på 200–800 m; diagonal ~2828 m).
- Verkliga markhöjder från IGN LiDAR HD MNT 0,5 m (DTM, utan träd/hus), höjd 105,79–184,42 m NGF-IGN69, relieff 78,63 m.
- 64 GLB-rutor à 250 × 250 m med gemensamt origo (ingen extra transform).
- Mobil LOD: `lod_10m` (2,6 MB, 80 000 marktrianglar) + `lod_50m` (0,26 MB) för översikt. `lod_5m` (8,3 MB) och `lod_1m` (188 MB) lämnades medvetet utanför paketet.
- Kända luckor i originalet: ingen textur/UV (neutral grön-grå färg), inga vägar/träd/hus, nutida mark (inte kontrollerad 1944-mark), kjolkant 10 m som inte är uppmätt terräng, inte oberoende kvalitetsgranskad.

Komplettering (lätta LOD-objekt och marktexturer, kopior):
- Marktexturer från `testbraden/terrang_stort_v1_20261102` (gräs, grus, lera, åker, skogsbotten).
- Bocage 10 m + ände, ek och gran (LOD2 + delad textur-GLB) från samma bräde.
- Hus `house_d` LOD2/bb och `lada_bessin_sten` LOD2 från världsbyggarens paket (tillfälliga ersättare enligt världsbyggaren).

Andra kandidater som valdes bort:
- `poc_europa` Villers-Bocage/Kursk/Hürtgen: bara ~300 kB mesh men grovt 8 m-nät, Copernicus DSM (träd/hus som pucklar), ingen textur.
- `terrang_stort_v1`: 1000 × 1000 m med bocage och texturer, men plan mark (`mark_y = 0`), för liten relieff för hull-down.
- `varldsbyggare_v1/varldar/by_2km_v1`: komplett med väg, by, åker och skog men syntetisk höjd, 20–34 MB (över mobilbudgeten 6–10 MB).
- 400 m-världar med riktiga Villers-Bocage-höjder: för små för 800 m skott (max ~400–565 m).

## Axlar och origo (1 enhet = 1 m)
- x = öster (E − 671450)
- y = upp, höjd i meter NGF-IGN69 (inte över zmin; typiskt 106–184 m)
- z = söder (5439340 − N)
- Origo ligger i utsnittets mitt. Omfattning: x,z ∈ [−1000, +1000] m.

## Placera vagnar, träd och hus på marken (utan att sväva eller sjunka)
Använd `mark/heightfield_5m.f32` (401 × 401, float32 LE, 5 m mellan noder). Rad 0 är norr (z = −1000), kolumn 0 är väster (x = −1000).

```js
// pseudo-three.js
function hojdY(x, z, hf, n = 401, spacing = 5, extent = 1000) {
  const col = (x + extent) / spacing;
  const row = (z + extent) / spacing;
  const c0 = Math.max(0, Math.min(n - 2, Math.floor(col)));
  const r0 = Math.max(0, Math.min(n - 2, Math.floor(row)));
  const tx = Math.min(1, Math.max(0, col - c0));
  const ty = Math.min(1, Math.max(0, row - r0));
  const i = (r, c) => hf[r * n + c]; // Float32Array
  const y00 = i(r0, c0), y10 = i(r0, c0 + 1);
  const y01 = i(r0 + 1, c0), y11 = i(r0 + 1, c0 + 1);
  return y00 * (1 - tx) * (1 - ty) + y10 * tx * (1 - ty)
       + y01 * (1 - tx) * ty       + y11 * tx * ty;
}
// Modellens origo ska ligga i markplanet (foten). Annars addera modellens egen minY-kompensation.
tank.position.set(x, hojdY(x, z, hf), z);
trad.position.set(x, hojdY(x, z, hf), z);
```

Gör inte raycast mot terräng-GLB:n för fysik: rutorna har en 10 m visuell kantkjol som inte ingår i höjdfältet. Ladda rutorna med identisk transform (0,0,0).

`heightfield_10m.f32` följer med som reserv (officiell, men enligt R50-README inte för spelkollision). `heightfield_1m.f32` (16 MB) är inte med; den finns kvar i källmappen.

## Texturera marken
Rutorna saknar UV (`POSITION` + `NORMAL` bara). Skapa UV från världskoordinater, t.ex. `u = x / upprepning_m`, `v = z / upprepning_m`. Arbetsvärden från terrang_stort: gräs 6 m, åker 9 m, grus 3,5 m, skog 5 m, dike/lera 4 m. Neutral basfärg i GLB: [0,46, 0,48, 0,43].

## LOD (R62)
Ladda `lod_10m` i spelområdet (planerad zon A är ungefär x ∈ [−500, 500], z ∈ [−300, 300] enligt terrain.json). Använd `lod_50m` längre bort. Blanda inte flera LOD-nivåer i samma ruta samtidigt.

## Tack / licens
- Höjd och GLB: IGN – LiDAR HD MNT – Etalab 2.0 / Licence Ouverte 2.0. Nutida mark.
- Marktexturer och vegetation: kopior från terrang_stort / biblioteket; se ursprungliga README och `docs/kallor/LICENSES.md`.
- Visa kreditering om paketet används eller visas.

Ingen publicering. Detta är ett arbetsPaket under `/workspace/_arbete/`.
