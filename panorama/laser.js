import * as THREE from 'three';
import {enhetsKvaternion, skarmVinkel, vinklarFranKvaternion} from './blick.js?v=8';

const RAD = Math.PI / 180;
const GRAD = 180 / Math.PI;
const FARG = /^#[0-9a-fA-F]{6}$/;

// Förstärkning 1 betyder att telefonens vridning och vyns vridning är samma vinkel.
export const STANDARD_LASER = {
  pa: false,
  forstarkning: 1,
  matcha: true,
  fov: 50,
  utjamning: 0.15,
  dodzon: 0.3,
  lasRoll: true,
  prick: 22,
  farg: '#ff1a1a',
  strale: false
};

function klamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

export function normalLaser(raw) {
  const bas = STANDARD_LASER;
  const farg = typeof raw?.farg === 'string' && FARG.test(raw.farg) ? raw.farg.toLowerCase() : bas.farg;
  return {
    pa: raw?.pa === true,
    forstarkning: klamp(Number.isFinite(+raw?.forstarkning) ? +raw.forstarkning : bas.forstarkning, 0.5, 3),
    matcha: raw?.matcha !== false,
    fov: klamp(Number.isFinite(+raw?.fov) ? +raw.fov : bas.fov, 8, 100),
    utjamning: klamp(Number.isFinite(+raw?.utjamning) ? +raw.utjamning : bas.utjamning, 0, 1),
    dodzon: klamp(Number.isFinite(+raw?.dodzon) ? +raw.dodzon : bas.dodzon, 0, 3),
    lasRoll: raw?.lasRoll !== false,
    prick: klamp(Math.round(Number.isFinite(+raw?.prick) ? +raw.prick : bas.prick), 10, 56),
    farg,
    strale: raw?.strale === true
  };
}

// CSS-pixlar gånger ungefärlig punkttäthet. Nutida iPhone ligger på 460, äldre på 326.
export function uppskattaPpi(cssKort, cssLang, dpr) {
  const d = Number(dpr) || 1;
  const kort = Number(cssKort) || 0;
  if (d >= 2 && kort >= 700) return 264;
  if (d >= 2.5 && kort >= 300 && kort <= 560) return 460;
  if (d >= 1.8 && d <= 2.2 && kort >= 300 && kort <= 450) return 326;
  return Math.max(120, Math.round(160 * d));
}

// Vertikalt synfält så skärmen täcker samma vinkel som ett fönster på avstandM.
export function matchaFonsterFov(opts = {}) {
  const avstand = Number(opts.avstandM) > 0 ? Number(opts.avstandM) : 0.35;
  const harFonster = typeof globalThis.innerWidth === 'number' && globalThis.innerWidth > 0;
  const cssBredd = Number.isFinite(opts.cssBredd) ? opts.cssBredd : (harFonster ? globalThis.innerWidth : 390);
  const cssHojd = Number.isFinite(opts.cssHojd) ? opts.cssHojd : (harFonster ? globalThis.innerHeight : 844);
  const dpr = Number.isFinite(opts.dpr) ? opts.dpr : (typeof globalThis.devicePixelRatio === 'number' ? globalThis.devicePixelRatio : 3);
  const kort = Number.isFinite(opts.cssKort) ? opts.cssKort : Math.min(cssBredd, cssHojd);
  const ppi = Number.isFinite(opts.ppi) ? opts.ppi : uppskattaPpi(kort, Math.max(cssBredd, cssHojd), dpr);
  const meterPerCss = (dpr / Math.max(1, ppi)) * 0.0254;
  const vertikalM = Math.max(0.01, cssHojd) * meterPerCss;
  return 2 * Math.atan((vertikalM / 2) / avstand) * GRAD;
}

const _axel = new THREE.Vector3();

// Skala rotationsvinkeln kring samma axel. Gain 1 lämnar kvaternionen orörd.
export function skalaRotation(q, gain, ut) {
  if (!(gain > 0)) return ut.identity();
  if (Math.abs(gain - 1) < 1e-6) return ut.copy(q);
  let w = q.w;
  let x = q.x, y = q.y, z = q.z;
  if (w < 0) { w = -w; x = -x; y = -y; z = -z; }
  w = Math.min(1, w);
  const vinkel = 2 * Math.acos(w);
  if (vinkel < 1e-7) return ut.identity();
  _axel.set(x, y, z);
  const len = _axel.length();
  if (len < 1e-8) return ut.identity();
  _axel.multiplyScalar(1 / len);
  return ut.setFromAxisAngle(_axel, vinkel * gain);
}

const _fram = new THREE.Vector3();
const _bak = new THREE.Vector3();
const _hoger = new THREE.Vector3();
const _upp = new THREE.Vector3();
const _mat = new THREE.Matrix4();
const _varldUpp = new THREE.Vector3(0, 1, 0);

// Ta bort vridning runt siktlinjen så horisonten ligger kvar. Pekriktningen behålls.
// minne är en Vector3 som bär senaste stabila högerledet genom zenit.
export function utanRoll(q, ut, minne) {
  _fram.set(0, 0, -1).applyQuaternion(q);
  if (_fram.lengthSq() < 1e-12) _fram.set(0, 0, -1);
  _fram.normalize();
  _bak.copy(_fram).negate();
  _hoger.crossVectors(_varldUpp, _bak);
  if (_hoger.lengthSq() < 1e-6) {
    _hoger.copy(minne || _axel.set(1, 0, 0));
    _hoger.y = 0;
    if (_hoger.lengthSq() < 1e-6) _hoger.set(1, 0, 0);
  }
  _hoger.normalize();
  if (minne) minne.copy(_hoger);
  _upp.crossVectors(_bak, _hoger).normalize();
  _hoger.crossVectors(_upp, _bak).normalize();
  _mat.makeBasis(_hoger, _upp, _bak);
  return ut.setFromRotationMatrix(_mat);
}

function euroAlfa(cutoff, dt) {
  const tau = 1 / (2 * Math.PI * Math.max(0.05, cutoff));
  return 1 / (1 + tau / Math.max(dt, 1e-4));
}

// One Euro på kvaternion. u = 0 används inte: anroparen hoppar över filtret.
export function skapaEuro() {
  const prev = new THREE.Quaternion();
  let har = false;
  let fart = 0;
  function noll() { har = false; fart = 0; }
  function filtrera(mal, dt, u, ut) {
    if (!(u > 0) || !har || !(dt > 0)) {
      har = true;
      prev.copy(mal);
      fart = 0;
      return ut.copy(mal);
    }
    const t = Math.min(1, Math.max(0, u));
    const minCutoff = 7 - t * 6.6;
    const beta = 0.3 + t * 1.2;
    const rate = prev.angleTo(mal) / dt;
    const aD = euroAlfa(1, dt);
    fart = aD * rate + (1 - aD) * fart;
    const a = Math.min(1, euroAlfa(minCutoff + beta * fart, dt));
    prev.slerp(mal, a);
    return ut.copy(prev);
  }
  return {noll, filtrera};
}

// Håll kvar vyn tills siktet rört sig minst `grader`. Större steg följs exakt.
export function skapaDodzon() {
  const vila = new THREE.Quaternion();
  let har = false;
  function noll() { har = false; }
  function tillampa(mal, grader, ut) {
    if (!(grader > 0)) {
      har = true;
      vila.copy(mal);
      return ut.copy(mal);
    }
    if (!har) {
      har = true;
      vila.copy(mal);
      return ut.copy(mal);
    }
    if (vila.angleTo(mal) < grader * RAD) return ut.copy(vila);
    vila.copy(mal);
    return ut.copy(mal);
  }
  return {noll, tillampa};
}

export function skapaLaser(val = {}) {
  const raw = new THREE.Quaternion();
  const origin = new THREE.Quaternion();
  const relativ = new THREE.Quaternion();
  const skalad = new THREE.Quaternion();
  const filtrerad = new THREE.Quaternion();
  const hallen = new THREE.Quaternion();
  const komb = new THREE.Quaternion();
  const visad = new THREE.Quaternion();
  const bas = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const skarmQ = new THREE.Quaternion();
  const minneHoger = new THREE.Vector3(1, 0, 0);
  const euro = skapaEuro();
  const dod = skapaDodzon();
  let install = normalLaser(STANDARD_LASER);
  let fick = false;
  let vantarNoll = true;
  let behollVy = false;

  function las(alpha, beta, gamma, skarm) {
    const vinkel = Number.isFinite(skarm) ? skarm : skarmVinkel();
    enhetsKvaternion(alpha, beta, gamma, vinkel, raw, euler, skarmQ);
    fick = true;
    if (!vantarNoll) return;
    if (behollVy) {
      origin.copy(raw).invert();
      vantarNoll = false;
      return;
    }
    nollstall();
  }

  function nollInre() {
    euro.noll();
    dod.noll();
    minneHoger.set(1, 0, 0);
    visad.identity();
  }

  function nollstall() {
    if (fick) {
      origin.copy(raw).invert();
      vantarNoll = false;
    } else vantarNoll = true;
    bas.identity();
    behollVy = false;
    nollInre();
  }

  // Nuvarande bild blir utgångsläge. Telefonen som den hålls nu ändrar inte vyn förrän den rör sig.
  function behall(vyQ) {
    bas.copy(vyQ);
    behollVy = true;
    if (fick) {
      origin.copy(raw).invert();
      vantarNoll = false;
    } else vantarNoll = true;
    euro.noll();
    dod.noll();
    _hoger.set(1, 0, 0).applyQuaternion(vyQ);
    _hoger.y = 0;
    if (_hoger.lengthSq() > 1e-6) minneHoger.copy(_hoger).normalize();
    else minneHoger.set(1, 0, 0);
    visad.copy(vyQ);
  }

  function uppdatera(dt) {
    if (!fick || vantarNoll) {
      if (install.lasRoll) return utanRoll(bas, visad, minneHoger);
      return visad.copy(bas);
    }
    relativ.multiplyQuaternions(origin, raw);
    skalaRotation(relativ, install.forstarkning, skalad);
    if (!(install.utjamning > 0)) {
      euro.noll();
      filtrerad.copy(skalad);
    } else euro.filtrera(skalad, dt, install.utjamning, filtrerad);
    dod.tillampa(filtrerad, install.dodzon, hallen);
    komb.copy(hallen).multiply(bas);
    if (install.lasRoll) utanRoll(komb, visad, minneHoger);
    else visad.copy(komb);
    return visad;
  }

  if (val.lyssna !== false && typeof addEventListener === 'function') {
    addEventListener('deviceorientation', e => {
      if (![e.alpha, e.beta, e.gamma].every(Number.isFinite)) return;
      las(e.alpha, e.beta, e.gamma);
    }, {passive: true});
  }

  return {
    nollstall, behall, uppdatera,
    mata: las,
    get install() { return install; },
    satt(nasta) { install = normalLaser(nasta); },
    get fick() { return fick; }
  };
}

function fram(q, ut) { return ut.set(0, 0, -1).applyQuaternion(q); }

export function sjalvtest() {
  const fel = [];
  const krav = (namn, ok) => { if (!ok) fel.push(namn); };
  const q = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const skarmQ = new THREE.Quaternion();
  const a = new THREE.Quaternion();
  const b = new THREE.Quaternion();
  const enhet = (alpha, beta, gamma, skarm = 0) => enhetsKvaternion(alpha, beta, gamma, skarm, q, euler, skarmQ).clone();
  const id = new THREE.Quaternion();
  const minne = new THREE.Vector3(1, 0, 0);
  const f1 = new THREE.Vector3();
  const f2 = new THREE.Vector3();

  const sta = enhet(0, 90, 0, 0);
  const tio = enhet(-10, 90, 0, 0);
  const rel = sta.clone().invert().multiply(tio);
  skalaRotation(rel, 1, a);
  skalaRotation(rel, 2, b);
  krav('10° med telefonen är 10° i vyn', Math.abs(a.angleTo(id) * GRAD - 10) < 0.05);
  krav('förstärkning 2 ger 20°', Math.abs(b.angleTo(id) * GRAD - 20) < 0.05);
  krav('förstärkning 0,5 ger 5°', Math.abs(skalaRotation(rel, 0.5, q).angleTo(id) * GRAD - 5) < 0.05);
  krav('tillbaka till samma håll är noll', sta.clone().invert().multiply(sta).angleTo(id) < 1e-6);

  const land0 = enhet(90, 0, -90, 90);
  const land1 = enhet(80, 0, -90, 90);
  const landRel = land0.clone().invert().multiply(land1);
  krav('landskap: 10° är 10°', Math.abs(landRel.angleTo(id) * GRAD - 10) < 0.05);

  const upp = sta.clone().invert().multiply(enhet(0, 130, 0, 0));
  krav('toppen upp är 40°', Math.abs(upp.angleTo(id) * GRAD - 40) < 0.05);

  const ren = new THREE.Quaternion();
  const rullad = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 30 * RAD);
  utanRoll(rullad, ren, minne);
  krav('ren sidolutning tas bort', ren.angleTo(id) < 0.01);
  const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 40 * RAD);
  const bland = yaw.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 25 * RAD));
  utanRoll(bland, ren, minne.set(1, 0, 0));
  fram(bland, f1);
  fram(ren, f2);
  const hogerY = new THREE.Vector3(1, 0, 0).applyQuaternion(ren).y;
  krav('lås behåller pekriktningen', f1.angleTo(f2) < 0.01);
  krav('låst horisont har rakt högerled', Math.abs(hogerY) < 0.02);
  krav('lås lämnar girningen', ren.angleTo(yaw) < 0.02);

  const pose = sta.clone().invert().multiply(enhet(90, 70, -90, 0));
  utanRoll(pose, ren, minne.set(1, 0, 0));
  fram(pose, f1);
  fram(ren, f2);
  krav('telefonens lutning låses utan att flytta siktet', f1.angleTo(f2) < 0.01 && Math.abs(new THREE.Vector3(1, 0, 0).applyQuaternion(ren).y) < 0.02);

  const z0 = sta.clone().invert().multiply(enhet(0, 179, 0, 0));
  const z1 = sta.clone().invert().multiply(enhet(0, 181, 0, 0));
  const eulerA = vinklarFranKvaternion(z0, euler);
  const eulerB = vinklarFranKvaternion(z1, euler);
  krav('kvaternion stegar genom zenit', z0.angleTo(z1) * GRAD < 4);
  krav('Euler-yaw hoppar vid samma steg', Math.abs(eulerB.vrida - eulerA.vrida) > 1);

  const dod = skapaDodzon();
  const liten = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.2 * RAD);
  const stor = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 10 * RAD);
  dod.tillampa(id, 0.5, a);
  dod.tillampa(liten, 0.5, a);
  krav('död zon håller små skakningar', a.angleTo(id) < 1e-6);
  dod.tillampa(stor, 0.5, a);
  krav('död zon släpper igenom 10°', Math.abs(a.angleTo(id) * GRAD - 10) < 0.05);
  const dodNoll = skapaDodzon();
  dodNoll.tillampa(stor, 0, a);
  krav('död zon 0 är exakt', Math.abs(a.angleTo(stor)) < 1e-6);

  const euro = skapaEuro();
  const mal30 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 30 * RAD);
  euro.filtrera(id, 1 / 60, 1, a);
  euro.filtrera(mal30, 1 / 60, 1, a);
  const stegEuro = a.angleTo(id) * GRAD;
  krav('hög utjämning följer inte direkt', stegEuro > 0.2 && stegEuro < 20);
  for (let i = 0; i < 240; i++) euro.filtrera(mal30, 1 / 60, 1, a);
  krav('utjämning hinner ifatt', Math.abs(a.angleTo(id) * GRAD - 30) < 1);

  const laser = skapaLaser({lyssna: false});
  laser.satt({...STANDARD_LASER, utjamning: 0, dodzon: 0, lasRoll: true, forstarkning: 1, matcha: false});
  laser.mata(0, 90, 0, 0);
  laser.uppdatera(1 / 60);
  laser.mata(-10, 90, 0, 0);
  const q10 = laser.uppdatera(1 / 60).clone();
  krav('läge 1:1 med låst horisont', Math.abs(q10.angleTo(id) * GRAD - 10) < 0.08);
  laser.mata(0, 90, 0, 0);
  krav('samma håll igen är rakt fram', laser.uppdatera(1 / 60).angleTo(id) * GRAD < 0.08);

  laser.nollstall();
  laser.satt({...laser.install, forstarkning: 2, utjamning: 0, dodzon: 0, lasRoll: false});
  laser.mata(0, 90, 0, 0);
  laser.uppdatera(1 / 60);
  laser.mata(-10, 90, 0, 0);
  krav('lägets förstärkning skalar vinkeln', Math.abs(laser.uppdatera(1 / 60).angleTo(id) * GRAD - 20) < 0.08);

  const vy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.5);
  laser.nollstall();
  laser.satt({...laser.install, forstarkning: 1, utjamning: 0, dodzon: 0, lasRoll: true});
  laser.mata(0, 90, 0, 0);
  laser.behall(vy);
  const kvar = laser.uppdatera(1 / 60).clone();
  krav('påslag behåller vyn', kvar.angleTo(vy) < 0.03);
  laser.mata(-10, 90, 0, 0);
  const efter = laser.uppdatera(1 / 60).clone();
  krav('påslag följer sedan 10°', Math.abs(kvar.angleTo(efter) * GRAD - 10) < 0.4);

  const tidig = skapaLaser({lyssna: false});
  tidig.satt({...STANDARD_LASER, utjamning: 0, dodzon: 0, lasRoll: true, forstarkning: 1, matcha: false});
  const vyTidig = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.35);
  tidig.behall(vyTidig);
  tidig.mata(0, 90, 0, 0);
  const efterForsta = tidig.uppdatera(1 / 60).clone();
  krav('första mätningen behåller vyn', efterForsta.angleTo(vyTidig) < 0.03);
  tidig.mata(-10, 90, 0, 0);
  krav('första mätningen följer sedan 10°', Math.abs(efterForsta.angleTo(tidig.uppdatera(1 / 60)) * GRAD - 10) < 0.4);

  const fov = matchaFonsterFov({cssBredd: 393, cssHojd: 852, dpr: 3, ppi: 460, avstandM: 0.35});
  krav('fönster på 35 cm är cirka 23°', Math.abs(fov - 22.79) < 0.2);
  const fovLand = matchaFonsterFov({cssBredd: 852, cssHojd: 393, dpr: 3, ppi: 460, avstandM: 0.35});
  krav('liggande fönster är smalare', fovLand > 10 && fovLand < 11.5);
  krav('iPhone-täthet', uppskattaPpi(393, 852, 3) === 460 && uppskattaPpi(375, 667, 2) === 326);
  krav('förstärkning kläms', normalLaser({forstarkning: 9, utjamning: 0, dodzon: 0, matcha: false, lasRoll: false, strale: true, farg: '#00ff00', pa: true}).forstarkning === 3);
  krav('rå utjämning får vara 0', normalLaser({utjamning: 0, dodzon: 0, matcha: false, lasRoll: false}).utjamning === 0);
  krav('fel färg faller tillbaka till rött', normalLaser({farg: 'rod'}).farg === '#ff1a1a');
  return fel;
}
