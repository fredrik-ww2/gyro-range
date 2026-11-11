// Sparar huset i användarens egen Google Drive. Token stannar i minnet under besöket.

import { GOOGLE_DRIVE_CLIENT_ID } from "./drive-config.js";

export const DRIVE_SCOPE = `https://www.googleapis.com/auth/drive.file`;
export const DRIVE_FOLDER = `Husbyggaren`;
export const DRIVE_SCRIPT = `https://accounts.google.com/gsi/client`;

let cached = null;
let pendingSignIn = null;

export function driveReady() {
  return Boolean(GOOGLE_DRIVE_CLIENT_ID);
}

function slug(name) {
  const value = String(name || `hus`).toLowerCase().normalize(`NFD`).replace(/[\u0300-\u036f]/g, ``).replace(/å/g, `a`).replace(/ä/g, `a`).replace(/ö/g, `o`).replace(/[^a-z0-9]+/g, `-`).replace(/^-|-$/g, ``).slice(0, 40);
  return value || `hus`;
}

function fileStem(kind, model) {
  return `${kind}-${slug(model?.name)}-${String(model?.id || `okand`).replace(/[^a-z0-9]/gi, ``).slice(0, 8) || `okand`}`;
}

function asBytes(value) {
  if (!value) return null;
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  return null;
}

export function filesForDrive(model) {
  const saved = new Date().toISOString();
  if (model?.source === `kvarter` && model.kvarter) {
    const body = JSON.stringify({
      typ: `kvarter`,
      namn: model.name,
      mapp: model.folder,
      sparad: saved,
      id: model.id,
      gata: model.kvarter.gata,
      hus: (model.kvarter.hus || []).map(house => ({
        id: house.id,
        namn: house.namn,
        bredd: house.bredd,
        djup: house.djup,
        tomt: house.tomt,
      })),
    }, null, 2);
    return [{ name: `${fileStem(`kvarter`, model)}.json`, mimeType: `application/json`, body }];
  }
  const spec = model?.house?.spec || {};
  const look = model?.house?.finishLook;
  const utseende = {};
  for (const [key, label] of [[`wall`, `vagg`], [`roof`, `tak`], [`detail`, `detaljer`]]) {
    const source = look?.[key] || {};
    utseende[label] = { textur: source.textureId || ``, mattnad: source.saturation ?? 1, fargton: source.hue ?? 0 };
  }
  const body = JSON.stringify({
    typ: `hus`,
    namn: model?.name,
    mapp: model?.folder,
    sparad: saved,
    id: model?.id,
    matt: { bredd: spec.width, djup: spec.depth, vaningar: spec.floors, vaningshojd: spec.floorHeight },
    tak: spec.roof,
    fasad: spec.facade,
    farger: { vagg: spec.wallColor, tak: spec.roofColor, detaljer: spec.trimColor },
    utseende: look ? utseende : null,
    text: model?.recipe?.prompt || ``,
  }, null, 2);
  const files = [{ name: `${fileStem(`hus`, model)}.json`, mimeType: `application/json`, body }];
  const glb = asBytes(model?.glb);
  if (glb && glb.byteLength > 32) files.push({ name: `${fileStem(`hus`, model)}.glb`, mimeType: `model/gltf-binary`, body: glb });
  return files;
}

function escapeQuery(value) {
  return String(value).replace(/\\/g, `\\\\`).replace(/'/g, `\\'`);
}

async function driveJson(fetchImpl, token, url, options = {}) {
  const response = await fetchImpl(url, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  if (!response.ok) throw new Error(`Drive svarade ${response.status}`);
  return response.json();
}

export async function saveDriveFiles({ fetch: fetchImpl, token, files, folderName = DRIVE_FOLDER }) {
  if (!token) throw new Error(`Google Drive är inte kopplat.`);
  const listed = await driveJson(fetchImpl, token, `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`name='${escapeQuery(folderName)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`)}&fields=files(id,name)&pageSize=5&spaces=drive`);
  let folderId = listed.files?.[0]?.id;
  if (!folderId) {
    const created = await driveJson(fetchImpl, token, `https://www.googleapis.com/drive/v3/files?fields=id`, {
      method: `POST`,
      headers: { "Content-Type": `application/json` },
      body: JSON.stringify({ name: folderName, mimeType: `application/vnd.google-apps.folder` }),
    });
    folderId = created.id;
  }
  const saved = [];
  for (const file of files) {
    const found = await driveJson(fetchImpl, token, `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`name='${escapeQuery(file.name)}' and '${folderId}' in parents and trashed=false`)}&fields=files(id,name)&pageSize=1&spaces=drive`);
    const existing = found.files?.[0]?.id;
    const boundary = `husbyggaren`;
    const head = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(existing ? { name: file.name } : { name: file.name, parents: [folderId] })}\r\n`;
    const mid = `--${boundary}\r\nContent-Type: ${file.mimeType}\r\n\r\n`;
    const tail = `\r\n--${boundary}--`;
    const body = new Blob([head, mid, file.body, tail]);
    const url = existing
      ? `https://www.googleapis.com/upload/drive/v3/files/${existing}?uploadType=multipart&fields=id,name`
      : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name`;
    const uploaded = await driveJson(fetchImpl, token, url, {
      method: existing ? `PATCH` : `POST`,
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    });
    saved.push({ name: file.name, id: uploaded.id });
  }
  return { folderId, files: saved };
}

export function prepareDrive() {
  if (!driveReady() || typeof document === `undefined`) return;
  if (document.getElementById(`google-drive-gis`)) return;
  const script = document.createElement(`script`);
  script.id = `google-drive-gis`;
  script.src = DRIVE_SCRIPT;
  script.async = true;
  document.head.appendChild(script);
}

export function beginDriveSignIn() {
  if (!driveReady()) return Promise.resolve(null);
  if (cached && cached.exp > Date.now() + 15000) return Promise.resolve(cached.token);
  if (pendingSignIn) return pendingSignIn;
  const oauth = globalThis.google?.accounts?.oauth2;
  if (!oauth) {
    prepareDrive();
    return Promise.resolve(null);
  }
  pendingSignIn = new Promise((resolve, reject) => {
    const client = oauth.initTokenClient({
      client_id: GOOGLE_DRIVE_CLIENT_ID,
      scope: DRIVE_SCOPE,
      callback: response => {
        if (!response || response.error) reject(new Error(`avbruten`));
        else {
          cached = { token: response.access_token, exp: Date.now() + (Number(response.expires_in) || 3600) * 1000 };
          resolve(response.access_token);
        }
      },
    });
    try {
      client.requestAccessToken({ prompt: cached ? `` : `consent` });
    } catch (error) {
      reject(error);
    }
  }).finally(() => {
    pendingSignIn = null;
  });
  return pendingSignIn;
}

export async function rememberDrive(model, signIn) {
  if (!driveReady() || !model) return ``;
  try {
    const token = await (signIn || beginDriveSignIn());
    if (!token) return `Sparat i Mina hus. Tryck Spara igen för att koppla Google Drive.`;
    await saveDriveFiles({ fetch: globalThis.fetch.bind(globalThis), token, files: filesForDrive(model), folderName: DRIVE_FOLDER });
    return `Kopian ligger i Google Drive, mappen ${DRIVE_FOLDER}.`;
  } catch {
    return `Sparat i Mina hus. Google Drive hoppades över.`;
  }
}
