import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { DRIVE_FOLDER, DRIVE_SCOPE, filesForDrive, saveDriveFiles } from "./drive.js";

test(`Drive-filen kan läsas utan hemligheter eller bilddata`, () => {
  const config = readFileSync(new URL(`./drive-config.js`, import.meta.url), `utf8`);
  assert.match(config, /export const GOOGLE_DRIVE_CLIENT_ID = "";/);
  assert.equal(config.includes(`client_secret`), false);
  const source = readFileSync(new URL(`./drive.js`, import.meta.url), `utf8`);
  assert.equal(source.includes(`client_secret`), false);
  assert.equal(DRIVE_SCOPE, `https://www.googleapis.com/auth/drive.file`);
  assert.equal(DRIVE_FOLDER, `Husbyggaren`);
  const files = filesForDrive({
    id: `abc-123`,
    name: `Mitt stenhus`,
    folder: `Mina hus`,
    source: `house`,
    recipe: { prompt: `Ett hus` },
    glb: new Uint8Array(64),
    house: {
      spec: { width: 12, depth: 8, floors: 2, floorHeight: 3, roof: `gable`, facade: `stone`, wallColor: `#ddd`, roofColor: `#444`, trimColor: `#eee` },
      finishLook: { wall: { textureId: `rott-tegel`, hue: 8, saturation: 0.8 }, bases: { meshes: [{ color: `#fff` }] }, photo: `data:image/jpeg;base64,AAAA` },
    },
  });
  assert.equal(files.length, 2);
  assert.match(files[0].name, /^hus-mitt-stenhus-/);
  assert.match(files[1].name, /\.glb$/);
  const json = JSON.parse(files[0].body);
  assert.equal(json.typ, `hus`);
  assert.equal(json.utseende.vagg.textur, `rott-tegel`);
  assert.equal(json.utseende.vagg.fargton, 8);
  assert.equal(JSON.stringify(json).includes(`data:`), false);
  assert.equal(JSON.stringify(json).includes(`access_token`), false);
  assert.equal(JSON.stringify(json).includes(`bases`), false);
});

test(`kvarteret blir en egen fil och husfilen uppdateras i samma mapp`, async () => {
  const folder = { id: null };
  const stored = new Map();
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    const method = options.method || `GET`;
    calls.push(method + ` ` + url.split(`?`)[0]);
    const query = decodeURIComponent(url);
    if (method === `GET` && query.includes(`mimeType=`)) return json({ files: folder.id ? [{ id: folder.id }] : [] });
    if (method === `POST` && url.includes(`/drive/v3/files`) && !url.includes(`upload`)) {
      folder.id = `mapp-1`;
      return json({ id: folder.id });
    }
    if (method === `GET` && query.includes(`in parents`)) {
      const name = query.match(/name='([^']+)'/)[1];
      return json({ files: stored.has(name) ? [{ id: stored.get(name), name }] : [] });
    }
    if (url.includes(`upload`)) {
      const body = await options.body.text();
      const name = body.match(/"name":"([^"]+)"/)[1];
      assert.equal(body.includes(`access_token`), false);
      const id = stored.get(name) || `fil-${stored.size + 1}`;
      stored.set(name, id);
      return json({ id, name });
    }
    throw new Error(url);
  };
  const files = filesForDrive({ id: `k1`, name: `Kvarteret`, folder: `Mina hus`, source: `kvarter`, kvarter: { gata: { namn: `Gatan`, langd: 40 }, hus: [{ id: `a`, namn: `Hus 1`, tomt: { index: 1, x: 8 } }] } });
  const first = await saveDriveFiles({ fetch: fetchImpl, token: `minnes-token`, files, folderName: `Husbyggaren` });
  assert.equal(first.folderId, `mapp-1`);
  assert.equal(JSON.parse(files[0].body).hus[0].namn, `Hus 1`);
  await saveDriveFiles({ fetch: fetchImpl, token: `minnes-token`, files, folderName: `Husbyggaren` });
  assert.ok(calls.some(call => call.startsWith(`PATCH `)));
  assert.equal(stored.size, 1);
});

function json(value) {
  return { ok: true, json: async () => value };
}
