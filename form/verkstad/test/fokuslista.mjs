/* Fokuslistan har 51 typer. Bara entydiga namnmatchningar visas. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { enheterIFokus, fokusSammanfattning } from '../js/fokus.js';

const fokus = JSON.parse(await readFile(new URL('../data/fokuslista.json', import.meta.url), 'utf8'));
const summa = fokusSammanfattning(fokus);
const ids = enheterIFokus(fokus);
assert.equal(summa.typer, 51);
assert.equal(summa.typer, summa.matchade.length + summa.saknas.length + summa.flertydig.length);
assert.equal([...ids].length, summa.enheter);
assert.ok(ids.has('tiger_i'));
assert.equal(ids.has('tiger_ii'), false);
assert.equal(ids.has('usa_rifleman'), false);
assert.equal(ids.has('flak36'), false);
assert.equal(ids.has('pak43'), false);
assert.ok(ids.has('panzer_iv_h'));
assert.ok(ids.has('m3_lee'));
const kort = fokus.typer.find((typ) => typ.namn === 'Panzer IV kort');
assert.equal(kort.status, 'saknas');
assert.equal(kort.enheter.length, 0);
const atta = fokus.typer.find((typ) => typ.namn === '8,8 cm');
assert.equal(atta.status, 'flertydig');
assert.equal(atta.enheter.length, 0);
for (const typ of fokus.typer) {
  if (typ.status !== 'matchad') assert.equal(typ.enheter.length, 0, typ.namn);
}
const usa = fokus.typer.filter((typ) => typ.nation === 'USA').length;
const de = fokus.typer.filter((typ) => typ.nation === 'Tyskland').length;
assert.equal(usa, 24);
assert.equal(de, 27);
console.log('ok', summa.matchade.length, 'matchade,', summa.saknas.length, 'saknas,', summa.flertydig.length, 'flertydiga,', ids.size, 'enheter');
