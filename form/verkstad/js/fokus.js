/* Starturvalet från KUNSKAP_STARTURVAL_ENHETER. Bara matchade enheter visas. */

const DATA = new URL('../data/fokuslista.json', import.meta.url);

export function hamtaFokus() {
  return fetch(DATA).then((svar) => {
    if (!svar.ok) throw new Error('Kunde inte läsa fokuslistan');
    return svar.json();
  });
}

export function enheterIFokus(fokus) {
  const ids = new Set();
  for (const typ of fokus?.typer || []) {
    if (typ.status !== 'matchad') continue;
    for (const id of typ.enheter || []) ids.add(id);
  }
  return ids;
}

export function fokusSammanfattning(fokus) {
  const typer = fokus?.typer || [];
  const saknas = typer.filter((typ) => typ.status === 'saknas');
  const flertydig = typer.filter((typ) => typ.status === 'flertydig');
  const matchade = typer.filter((typ) => typ.status === 'matchad');
  return { typer: typer.length, saknas, flertydig, matchade, enheter: enheterIFokus(fokus).size };
}
