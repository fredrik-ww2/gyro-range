/* Terrängtyper: alla begärda fält finns, och talen är märkta uppskattade. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  fartFaktor, ganglagAv, indexera, linjeMot, ofarbar, skyddFaktor, typVid, vapenAv
} from '../js/terrang.js';

const data = JSON.parse(await readFile(new URL('../data/terrang/typer.json', import.meta.url), 'utf8'));
const { typer } = indexera(data);
const KRAV = [
  'ang', 'aker', 'skog', 'buskage', 'hack_bocage', 'stenmur', 'trastaket',
  'hus_sten', 'hus_tra', 'ruin', 'krater', 'dike', 'vag', 'grusvag', 'bro',
  'vatten', 'sumpmark', 'taggtrad', 'stridsvagnshinder', 'minfalt', 'sandsack', 'skyttegrav'
];
const VAPEN = ['handeldvapen', 'splitter', 'pansarbrytande'];
const STALLNING = ['staende', 'knaende', 'liggande'];
const GANG = ['fot', 'hjul', 'band'];

assert.equal(data.schema, 'form.verkstad.terrang.v1');
assert.equal(KRAV.length, 22);
for (const id of KRAV) {
  const typ = typer.get(id);
  assert.ok(typ, id);
  assert.equal(typ.ursprung, 'uppskattat', id);
  assert.equal(typeof typ.namn, 'string');
  assert.equal(typeof typ.hojd_m, 'number');
  assert.equal(typeof typ.radie_m, 'number');
  assert.equal(typeof typ.insyn, 'number');
  assert.equal(typeof typ.dold_position, 'boolean');
  assert.equal(typeof typ.blockerar_sikt, 'boolean');
  assert.equal(typeof typ.blockerar_skjutlinje, 'boolean');
  assert.equal(typeof typ.kan_forstoras, 'boolean');
  for (const vapen of VAPEN) {
    for (const stallning of STALLNING) {
      const tal = typ.skydd[vapen][stallning];
      assert.equal(typeof tal, 'number', id + ' ' + vapen + ' ' + stallning);
      assert.ok(tal >= 0 && tal <= 1);
    }
  }
  for (const gang of GANG) {
    const tal = typ.forflyttning[gang];
    assert.ok(tal >= 0 && tal <= 1, id + ' ' + gang);
  }
}

assert.equal(fartFaktor(typer.get('vag'), 'fot'), 1);
assert.equal(fartFaktor(typer.get('sumpmark'), 'fot'), 0.35);
assert.equal(ofarbar(typer.get('stenmur'), 'band'), true);
assert.equal(ofarbar(typer.get('buskage'), 'fot'), false);
assert.equal(typer.get('buskage').blockerar_skjutlinje, false);
assert.equal(typer.get('hack_bocage').blockerar_skjutlinje, true);
assert.equal(skyddFaktor(typer.get('skyttegrav'), 'handeldvapen', 'fot'), 0.95);
assert.equal(skyddFaktor(typer.get('skyttegrav'), 'handeldvapen', 'band'), 0.85);
assert.equal(ganglagAv({ id: 'm3_halftrack', typ: 'fordon', kategori: 'Transport och halvbandvagnar' }), 'band');
assert.equal(ganglagAv({ id: 'usa_rifleman', typ: 'soldat', kategori: 'Infanteri' }), 'fot');
assert.equal(vapenAv({ id: 'pak40', typ: 'dragen pjäs', kategori: 'Pansarvärnskanoner' }), 'pansarbrytande');
assert.equal(vapenAv({ id: 'usa_rifleman', typ: 'soldat', kategori: 'Infanteri' }), 'handeldvapen');

const hinder = [
  { id: 'mur', typ: 'stenmur', x: 0, z: 0, forstord: false },
  { id: 'ang', typ: 'ang', x: 0, z: 0, forstord: false }
];
assert.equal(typVid(0, 0, hinder, typer.get('vag'), typer).id, 'stenmur');
assert.equal(typVid(40, 0, hinder, typer.get('vag'), typer).id, 'vag');
const stopp = linjeMot(-10, 0, 10, 0, hinder, typer, 'blockerar_skjutlinje');
assert.equal(stopp.length, 1);
assert.equal(stopp[0].typ.id, 'stenmur');
const buske = [{ id: 'b', typ: 'buskage', x: 0, z: 0, forstord: false }];
assert.equal(linjeMot(-10, 0, 10, 0, buske, typer, 'blockerar_skjutlinje').length, 0);

console.log('ok', KRAV.length, 'typer');
