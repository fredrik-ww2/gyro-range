const rot = new URL('../', import.meta.url);
const grupper = document.querySelector('#grupper');
const fel = document.querySelector('#fel');

try {
  const svar = await fetch(new URL('./lankar.json', import.meta.url));
  if (!svar.ok) throw new Error('saknas');
  const data = await svar.json();
  if (data.titel) document.querySelector('#rubrik').textContent = data.titel;
  if (data.ledtext) document.querySelector('#led').textContent = data.ledtext;
  for (const grupp of data.grupper || []) {
    const lankar = (grupp.lankar || []).filter((l) => l && l.namn && l.sokvag);
    if (!lankar.length) continue;
    const sektion = document.createElement('section');
    const rubrik = document.createElement('h2');
    rubrik.textContent = grupp.namn || grupp.id || '';
    sektion.append(rubrik);
    for (const lank of lankar) {
      const a = document.createElement('a');
      a.className = 'knapp';
      a.href = new URL(lank.sokvag, rot).href;
      const namn = document.createElement('b');
      namn.textContent = lank.namn;
      const text = document.createElement('span');
      text.textContent = lank.text || '';
      a.append(namn, text);
      sektion.append(a);
    }
    grupper.append(sektion);
  }
} catch (e) {
  fel.hidden = false;
}
