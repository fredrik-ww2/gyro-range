import { formaRen, koppla, nyttTillstand, lasLager, sparaLager, normaliseraAxel } from './gyrobox.js';

const fel = [];
const krav = (namn, ok) => { if (!ok) fel.push(namn); };
const nara = (a, b, t = 1e-6) => Math.abs(a - b) < t;

const std = normaliseraAxel({ kanslighet: 1, kurva: 1, dodzon: 0, utjamning: 0.05, lage: 'noll', invertera: false, spann: 40, gain: 1 });

krav('linjär utan dödzon', nara(formaRen(12, std), 12));
krav('dödzon tar bort små utslag', formaRen(3, { ...std, dodzon: 5 }) === 0);
krav('dödzon lämnar resten', nara(formaRen(8, { ...std, dodzon: 5 }), 3));
krav('känslighet skalar', nara(formaRen(4, { ...std, kanslighet: 2 }), 8));
krav('invertera byter tecken', nara(formaRen(6, { ...std, invertera: true }), -6));
{
  const mjuk = Math.abs(formaRen(10, { ...std, kurva: 2, spann: 40 }));
  const rak = Math.abs(formaRen(10, std));
  krav('kurva över 1 dämpar litet utslag', mjuk < rak);
}

{
  const s = nyttTillstand();
  krav('standard är identitet', koppla(0.4, 12, std, std, s, 0.016) === 0.4);
  const ann = { ...std, kanslighet: 2 };
  const s2 = nyttTillstand();
  const ut = koppla(0.4, 12, ann, std, s2, 0.016);
  krav('dubbel känslighet dubblar utslaget', nara(ut, 0.8));
  const s3 = nyttTillstand();
  const inv = koppla(0.4, 12, { ...std, invertera: true }, std, s3, 0.016);
  krav('invertera vänder spelets utslag', nara(inv, -0.4));
}

{
  const s = nyttTillstand();
  const dod = { ...std, dodzon: 15 };
  krav('större dödzon nollar', koppla(0.5, 10, dod, std, s, 0.016) === 0);
}

{
  const s = nyttTillstand();
  const rate = { ...std, lage: 'vrid' };
  const a = koppla(0.2, 10, rate, std, s, 0.5);
  const b = koppla(0.2, 10, rate, std, s, 0.5);
  krav('fortsätt vrida växer medan lutningen hålls', b > a + 0.05);
  const c = koppla(0, 0, rate, std, s, 0.5);
  krav('fortsätt vrida ligger kvar när telefonen är rak', nara(c, b, 1e-6));
  const hem = koppla(0.2, 10, std, std, nyttTillstand(), 0.016);
  krav('återgå till noll följer vinkeln', hem === 0.2);
}

{
  const absolut = { ...std, lage: 'vrid' };
  const s = nyttTillstand();
  const rak = koppla(1.2, 30, std, absolut, s, 0.016);
  krav('från fartläge till noll följer vinkeln', nara(rak, 30 * std.gain));
}

{
  const minne = new Map();
  const lagring = { getItem: (k) => minne.get(k) ?? null, setItem: (k, v) => minne.set(k, v) };
  sparaLager('prov', { nu: { a: { kanslighet: 2, lage: 'vrid' } }, lagen: [{ id: '1', namn: 'Kvick', axlar: { a: { kanslighet: 2 } } }], vald: '1' }, lagring);
  const las = lasLager('prov', lagring);
  krav('testläge sparas', las.lagen[0].namn === 'Kvick' && las.vald === '1' && las.nu.a.kanslighet === 2);
  krav('trasig lagring blir tom', lasLager('saknas', { getItem: () => '{', setItem() {} }).lagen.length === 0);
}

if (fel.length) {
  console.error(fel.join('\n'));
  process.exit(1);
}
console.log('gyrobox ok', 8);
