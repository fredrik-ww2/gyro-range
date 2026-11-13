export async function lasKonfig() {
  const svar = await fetch(new URL('./konfig.json', import.meta.url), {cache: 'no-store'});
  if (!svar.ok) throw new Error('Kunde inte läsa konfig.json');
  return svar.json();
}
