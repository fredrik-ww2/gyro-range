/* Terrängtyper: alla begärda fält finns, och talen är märkta uppskattade. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  fartFaktor, ganglagAv, indexera, kvarvarandeVarde, linjeMot, ofarbar, reduktionFranKvarvarande,
  skadaAv, typVid, vapenAv
} from '../js/terrang.js';

const data = JSON.parse(await readFile(new URL('../data/terrang/typer.json', import.meta.url), 'utf8'));
const { typer } = indexera(data);
const KRAV = [
  'ang', 'aker', 'skog', 'buskage', 'hack', 'bocagevall', 'stenmur', 'trastaket',
  'hus_sten', 'hus_tra', 'ruin', 'krater', 'dike', 'vag', 'grusvag', 'bro',
  'vatten', 'sumpmark', 'taggtrad', 'stridsvagnshinder', 'minfalt', 'sandsack', 'skyttegrav'
];
const HOT = ['gevar', 'kulspruta', 'prickskytt', 'splitter_granat', 'splitter_artilleri', 'artilleri_ovanifran', 'pansarbrytande'];
const GANG = ['fot', 'hjul', 'band'];

assert.equal(data.schema, 'form.verkstad.terrang.v1');
assert.equal(KRAV.length, 23);
for (const id of KRAV) {
  const typ = typer.get(id);
  assert.ok(typ, id);
  assert.equal(typeof typ.namn, 'string');
  assert.equal(typ.forflyttning.historiskt_verifierad, false, id);
  assert.equal(typeof typ.hojd_m, 'number');
  assert.equal(typeof typ.radie_m, 'number');
  for (const hot of HOT) {
    const post = typ.kvarvarande[hot];
    assert.ok(post, id + ' ' + hot);
    if (post.varde != null) assert.equal(typeof post.varde, 'number');
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
assert.equal(typer.get('minfalt').skada_vid_intrad.historiskt_verifierad, false);
assert.equal(typer.get('bocagevall').kvarvarande.gevar.varde, 0.2);
assert.equal(typer.get('bocagevall').kvarvarande.gevar.tagg, 'forskningsdata');
assert.equal(typer.get('hack').kvarvarande.gevar.varde, 0.7);
assert.equal(typer.get('hack').riktigt_kulskydd, false);
assert.equal(typer.get('buskage').riktigt_kulskydd, false);
assert.equal(typer.get('bocagevall').riktigt_kulskydd, true);
assert.equal(kvarvarandeVarde(typer.get('buskage'), 'gevar'), 1);
assert.equal(reduktionFranKvarvarande(0.2), 0.8);
assert.ok(Math.abs(skadaAv(34, typer.get('bocagevall'), 'gevar') - 6.8) < 0.001);
assert.ok(Math.abs(skadaAv(34, typer.get('hack'), 'gevar') - 23.8) < 0.001);
assert.ok(skadaAv(34, typer.get('bocagevall'), 'gevar') < skadaAv(34, typer.get('hack'), 'gevar'));
assert.notEqual(skadaAv(34, typer.get('bocagevall'), 'gevar'), 34 * 0.8);
assert.equal(skadaAv(34, typer.get('skog'), 'artilleri_ovanifran'), 51);
assert.equal(reduktionFranKvarvarande(1.5), -0.5);
assert.equal(typer.get('skyttegrav').kvarvarande.gevar.varde, 0.1);
assert.equal(typer.get('ang').kvarvarande.gevar.tagg, 'forskningsdata');
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
const stopp = linjeMot(-10, 0, 10, 0, [hinder[0]], typer, 'id');
assert.equal(stopp.length, 1);
assert.equal(stopp[0].typ.id, 'stenmur');
const hackLinje = linjeMot(-10, 0, 10, 0, [{ id: 'h', typ: 'hack', x: 0, z: 0 }], typer, 'id');
const vallLinje = linjeMot(-10, 0, 10, 0, [{ id: 'v', typ: 'bocagevall', x: 0, z: 0 }], typer, 'id');
assert.ok(kvarvarandeVarde(vallLinje[0].typ, 'gevar') < kvarvarandeVarde(hackLinje[0].typ, 'gevar'));
const buske = linjeMot(-10, 0, 10, 0, [{ id: 'b', typ: 'buskage', x: 0, z: 0 }], typer, 'id');
assert.equal(kvarvarandeVarde(buske[0].typ, 'gevar'), 1);

console.log('ok', KRAV.length, 'typer');
