// Skärmvridning och representationsomslag för flygets webbgyro.
// Tecken: pitch > 0 stiger, roll > 0 är vänsterbank, yaw > 0 är vänstersväng.
// Yaw är världens lodlinje och följer inte med skärmen. Pitch och roll gör det,
// annars blir nos upp en bank när telefonen ligger ner.
// Omslag: samma fysiska läge kan rapporteras med helt andra Euler-vinklar
// (ofta nära ±90/180). Avståndet räknas med samma quaternion som js/gyro.js.
const DEG = Math.PI / 180;
const FIX = axelVinkel(1, 0, 0, -Math.PI / 2);

export function wrapDeg(d) {
  return ((d + 180) % 360 + 360) % 360 - 180;
}

function axelVinkel(x, y, z, v) {
  const h = v / 2, s = Math.sin(h);
  return { x: x * s, y: y * s, z: z * s, w: Math.cos(h) };
}

function mul(a, b) {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z
  };
}

function eulerYXZ(x, y, z) {
  // Samma YXZ-ordning som three.js Quaternion.setFromEuler.
  const c1 = Math.cos(x / 2), c2 = Math.cos(y / 2), c3 = Math.cos(z / 2);
  const s1 = Math.sin(x / 2), s2 = Math.sin(y / 2), s3 = Math.sin(z / 2);
  return {
    x: s1 * c2 * c3 + c1 * s2 * s3,
    y: c1 * s2 * c3 - s1 * c2 * s3,
    z: c1 * c2 * s3 - s1 * s2 * c3,
    w: c1 * c2 * c3 + s1 * s2 * s3
  };
}

// Samma kedja som GyroAim.lasOrientering, utan skärmvridning (den ändrar inte vinkeln mellan två prov).
export function enhetsQuat(p) {
  return mul(eulerYXZ(p.beta * DEG, p.alpha * DEG, -p.gamma * DEG), FIX);
}

export function fysikVinkel(a, b) {
  const qa = enhetsQuat(a), qb = enhetsQuat(b);
  const d = Math.abs(qa.x * qb.x + qa.y * qb.y + qa.z * qb.z + qa.w * qb.w);
  return 2 * Math.acos(Math.min(1, d));
}

export function skarmDelta(dBeta, dGamma, skarmDeg) {
  const a = (skarmDeg || 0) * DEG, c = Math.cos(a), s = Math.sin(a);
  return { pitchDeg: dBeta * c - dGamma * s, rollDeg: -(dBeta * s + dGamma * c) };
}

export function eulerStyrning(prov, noll, skarmDeg) {
  const dB = wrapDeg(prov.beta - noll.beta);
  const dG = wrapDeg(prov.gamma - noll.gamma);
  const dA = wrapDeg(prov.alpha - noll.alpha);
  const s = skarmDelta(dB, dG, skarmDeg);
  return { pitch: s.pitchDeg * DEG, roll: s.rollDeg * DEG, yaw: dA * DEG };
}

// Sant när siffrorna hoppar men telefonen knappt rört sig.
export function arOmslag(fore, nu, eulerGrans = 40, fysikGrans = 20) {
  if (!fore || !nu) return false;
  const e = Math.hypot(wrapDeg(nu.beta - fore.beta), wrapDeg(nu.gamma - fore.gamma), wrapDeg(nu.alpha - fore.alpha));
  const f = fysikVinkel(fore, nu) / DEG;
  return e > eulerGrans && f < fysikGrans && e > f * 4;
}

// Nytt nolläge så att det nya provet ger samma utslag som förut. Inget hopp vid omslag.
export function nyNoll(nu, ut, skarmDeg) {
  const pitchDeg = ut.pitch / DEG, rollDeg = ut.roll / DEG, yawDeg = ut.yaw / DEG;
  const a = (skarmDeg || 0) * DEG, c = Math.cos(a), s = Math.sin(a);
  const dB = pitchDeg * c - rollDeg * s;
  const dG = -pitchDeg * s - rollDeg * c;
  return { alpha: nu.alpha - yawDeg, beta: nu.beta - dB, gamma: nu.gamma - dG };
}
