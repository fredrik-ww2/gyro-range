// Kör det här innan flygspelet publiceras: syntax, flygtester och skjutbanans tester.
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rot = join(dirname(fileURLToPath(import.meta.url)), '..');
const flyg = join(rot, 'flyg');
const js = readdirSync(flyg).filter((f) => f.endsWith('.js'));
for (const namn of js) {
  const r = spawnSync(process.execPath, ['--check', join(flyg, namn)], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
const tester = ['test/flyg.mjs', 'test/flyg-skarm.mjs', 'test/riktning.mjs', 'test/gang.mjs', 'test/rorelse.mjs', 'test/stallning.mjs'];
for (const fil of tester) {
  const r = spawnSync(process.execPath, [join(rot, fil)], { stdio: 'inherit', cwd: rot });
  if (r.status !== 0) {
    console.error('Misslyckades: ' + fil);
    process.exit(r.status ?? 1);
  }
}
console.log('for-publicering-ok');
