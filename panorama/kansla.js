// Acceleration och ryck för vibrationsåterkoppling.
// Linjär acceleration (m/s²) används när den finns. Annars vinkelacceleration från gyro, i grader/s² delat med 400 så den hamnar i samma skala.

export function nivaFranProv(prov, fore, dt) {
  const lin = Number.isFinite(+prov?.linjar) ? Math.abs(+prov.linjar) : null;
  const omega = Number.isFinite(+prov?.omega) ? Math.abs(+prov.omega) : null;
  let vinkelAcc = 0;
  const dtOk = dt > 0.001 && dt < 0.5;
  if (omega != null && fore && Number.isFinite(fore.omega) && dtOk) {
    vinkelAcc = Math.abs(omega - Math.abs(fore.omega)) / dt;
  }
  const linDel = lin == null ? 0 : lin;
  const vinkelDel = vinkelAcc / 400;
  const acc = Math.max(linDel, vinkelDel);
  let ryck = 0;
  if (fore && Number.isFinite(fore.acc) && dtOk) ryck = Math.abs(acc - fore.acc) / dt;
  return {acc, ryck, linjar: linDel, vinkelAcc, omega: omega == null ? null : omega};
}

// Styrka växer med acceleration. Ojämnhet (ryck) gör pulsen både starkare och tätare.
export function pulsFor(acc, ryck, install) {
  const kans = Math.max(0.2, Number(install?.kanslighet) || 1);
  const styrkaReg = Math.min(1, Math.max(0, Number(install?.styrka) ?? 1));
  const troskel = 1.1 / kans;
  if (!(acc >= troskel)) return null;
  const ryckKvot = Math.min(3, Math.max(0, ryck) / (troskel * 8));
  const bas = Math.min(1, acc / (troskel * 3));
  const styrka = Math.min(1, styrkaReg * (0.35 + 0.65 * bas) * (1 + 0.85 * ryckKvot));
  const ms = Math.round(10 + styrka * 40);
  const paus = Math.round(Math.max(18, 110 - ryckKvot * 28 - Math.min(1, acc / 6) * 24));
  const monster = ryckKvot > 1.2 ? [ms, Math.max(10, Math.round(paus * 0.35)), ms] : [ms];
  return {ms, paus, styrka, monster, ryckKvot};
}

export function skapaKansla() {
  let fore = null;
  function mata(prov, tid) {
    const dt = fore ? tid - fore.tid : 0;
    const niva = nivaFranProv(prov, fore, dt);
    fore = {tid, acc: niva.acc, omega: niva.omega, linjar: niva.linjar};
    return niva;
  }
  function noll() { fore = null; }
  return {mata, noll};
}

export function sjalvtest() {
  const fel = [];
  const krav = (namn, ok) => { if (!ok) fel.push(namn); };
  const jamn = skapaKansla();
  jamn.mata({linjar: 0, omega: 40}, 0);
  const still = jamn.mata({linjar: 0, omega: 40}, 0.05);
  krav('jämn rotation ger ingen vinkelacceleration', still.acc < 0.05 && still.ryck < 1);

  const gyro = skapaKansla();
  gyro.mata({linjar: 1, omega: 10}, 1);
  const ryck = gyro.mata({linjar: 1, omega: 90}, 1.05);
  krav('ojämn vinkelacceleration syns', ryck.acc > 3.5 && ryck.ryck > 50);

  const lin = skapaKansla();
  lin.mata({linjar: 0, omega: null}, 0);
  const hopp = lin.mata({linjar: 8, omega: null}, 0.1);
  krav('linjär acceleration och ryck', hopp.acc > 7.5 && hopp.acc < 8.5 && hopp.ryck > 70 && hopp.ryck < 90);

  const svag = pulsFor(2, 0, {styrka: 1, kanslighet: 1});
  const ojamt = pulsFor(2, 60, {styrka: 1, kanslighet: 1});
  krav('under tröskeln är tyst', pulsFor(0.2, 0, {styrka: 1, kanslighet: 1}) == null);
  krav('ojämnhet ger starkare puls', svag && ojamt && ojamt.styrka > svag.styrka);
  krav('ojämnhet ger tätare puls', svag && ojamt && ojamt.paus < svag.paus && ojamt.monster.length > svag.monster.length);
  krav('högre känslighet tar svagare skakning', pulsFor(0.7, 0, {styrka: 1, kanslighet: 2.2}) != null);
  krav('lägre styrka ger kortare puls', pulsFor(2, 0, {styrka: 0.2, kanslighet: 1}).ms < pulsFor(2, 0, {styrka: 1, kanslighet: 1}).ms);
  return fel;
}
