import { HOUSE_TEXTURES } from "./texturer/katalog.js";
import { classifySurface, worldUv } from "./ytor.js";

export { HOUSE_TEXTURES };

const loaded = new Map();

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = `async`;
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Texturen kunde inte laddas.`));
    image.src = url;
  });
}

async function textureFrom(url, api, srgb) {
  if (loaded.has(url)) return loaded.get(url);
  const image = await loadImage(url);
  const texture = new api.Texture(image);
  texture.colorSpace = srgb ? api.colorSpace : ``;
  texture.wrapS = texture.wrapT = 1000;
  texture.flipY = true;
  texture.needsUpdate = true;
  loaded.set(url, texture);
  return texture;
}

export function textureById(id) {
  return HOUSE_TEXTURES.find(item => item.id === id) || null;
}

function worldMesh(mesh) {
  mesh.updateWorldMatrix(true, false);
  const elements = mesh.matrixWorld.elements;
  const position = mesh.geometry.getAttribute(`position`);
  const normal = mesh.geometry.getAttribute(`normal`);
  const positions = new Float32Array(position.count * 3);
  const normals = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    positions[i * 3] = elements[0] * x + elements[4] * y + elements[8] * z + elements[12];
    positions[i * 3 + 1] = elements[1] * x + elements[5] * y + elements[9] * z + elements[13];
    positions[i * 3 + 2] = elements[2] * x + elements[6] * y + elements[10] * z + elements[14];
    const nx = normal ? normal.getX(i) : 0, ny = normal ? normal.getY(i) : 1, nz = normal ? normal.getZ(i) : 0;
    let wx = elements[0] * nx + elements[4] * ny + elements[8] * nz;
    let wy = elements[1] * nx + elements[5] * ny + elements[9] * nz;
    let wz = elements[2] * nx + elements[6] * ny + elements[10] * nz;
    const length = Math.hypot(wx, wy, wz) || 1;
    normals[i * 3] = wx / length;
    normals[i * 3 + 1] = wy / length;
    normals[i * 3 + 2] = wz / length;
  }
  return { positions, normals };
}

function remember(mesh) {
  if (mesh.userData.originalSurface) return;
  const uv = mesh.geometry.getAttribute(`uv`);
  mesh.userData.originalSurface = {
    material: mesh.material,
    uv: uv ? new Float32Array(uv.array) : null,
  };
}

export function restoreHouseSurfaces(root, api) {
  if (!root) return;
  root.traverse(mesh => {
    if (!mesh.isMesh || !mesh.userData.originalSurface) return;
    const saved = mesh.userData.originalSurface;
    if (mesh.userData.paintedMaterial && mesh.userData.paintedMaterial !== saved.material) mesh.userData.paintedMaterial.dispose();
    mesh.material = saved.material;
    if (saved.uv) mesh.geometry.setAttribute(`uv`, new api.BufferAttribute(saved.uv.slice(), 2));
    const uv2 = mesh.geometry.getAttribute(`uv2`);
    if (uv2 && saved.uv) mesh.geometry.setAttribute(`uv2`, new api.BufferAttribute(saved.uv.slice(), 2));
    mesh.userData.paintedMaterial = null;
  });
}

export async function paintHouseTexture(root, entry, api) {
  if (!root || !entry) throw new Error(`Huset eller texturen saknas.`);
  const color = await textureFrom(entry.color, api, true);
  const normal = await textureFrom(entry.normal, api, false);
  const surface = await textureFrom(entry.surfaceMap, api, false);
  let painted = 0;
  root.traverse(mesh => {
    if (!mesh.isMesh || !mesh.geometry?.getAttribute?.(`position`)) return;
    const world = worldMesh(mesh);
    const role = classifySurface(mesh.name, world.positions, world.normals);
    if (role !== entry.role) return;
    remember(mesh);
    const uvs = worldUv(world.positions, world.normals, entry.meters);
    mesh.geometry.setAttribute(`uv`, new api.BufferAttribute(uvs, 2));
    mesh.geometry.setAttribute(`uv2`, new api.BufferAttribute(uvs.slice(), 2));
    if (mesh.userData.paintedMaterial) mesh.userData.paintedMaterial.dispose();
    const material = new api.MeshStandardMaterial({
      color: `#ffffff`,
      map: color,
      normalMap: normal,
      roughnessMap: surface,
      metalnessMap: entry.surface === `arm` ? surface : null,
      aoMap: entry.surface === `arm` ? surface : null,
      aoMapIntensity: 0.85,
      roughness: 1,
      metalness: entry.surface === `arm` ? 1 : 0,
      vertexColors: !!mesh.geometry.getAttribute(`color`),
    });
    material.name = mesh.name || entry.role;
    material.normalScale?.set(1, 1);
    mesh.material = material;
    mesh.userData.paintedMaterial = material;
    painted += 1;
  });
  if (!painted) throw new Error(entry.role === `roof` ? `Taket saknar en yta för texturen.` : `Väggen saknar en yta för texturen.`);
  root.userData.houseTextures = { ...root.userData.houseTextures, [entry.role]: entry.id };
  return painted;
}

async function encodeJpeg(image, api, quality) {
  const width = image.width || image.videoWidth || 1;
  const height = image.height || image.videoHeight || 1;
  const scale = Math.min(1, 1024 / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));
  const canvas = api.canvas(targetWidth, targetHeight);
  const context = canvas.getContext(`2d`);
  context.translate(0, targetHeight);
  context.scale(1, -1);
  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error(`Texturen kunde inte sparas.`)), `image/jpeg`, quality));
  canvas.width = canvas.height = 1;
  return { bytes: new Uint8Array(await blob.arrayBuffer()), mimeType: `image/jpeg`, width: targetWidth, height: targetHeight };
}

function tightGeometry(geometry, BufferAttribute) {
  const copy = geometry.clone();
  for (const name of Object.keys(copy.attributes)) {
    const attribute = copy.getAttribute(name);
    const array = new attribute.array.constructor(attribute.count * attribute.itemSize);
    for (let vertex = 0; vertex < attribute.count; vertex++) {
      for (let item = 0; item < attribute.itemSize; item++) array[vertex * attribute.itemSize + item] = attribute.getComponent(vertex, item);
    }
    copy.setAttribute(name, new BufferAttribute(array, attribute.itemSize, attribute.normalized));
  }
  if (copy.index) {
    const index = copy.index;
    const array = new index.array.constructor(index.count);
    for (let vertex = 0; vertex < index.count; vertex++) array[vertex] = index.getX(vertex);
    copy.setIndex(new BufferAttribute(array, 1));
  }
  return copy;
}

export async function exportPaintedHouse(root, spec, prompt, api) {
  const group = new api.Group();
  group.name = `FORM_House`;
  group.userData = { ...root.userData };
  const files = new Map();
  root.updateMatrixWorld(true);
  const meshes = [];
  root.traverse(mesh => {
    if (!mesh.isMesh) return;
    const name = mesh.name || ``;
    if (name.startsWith(`collision_`) || /_LOD[12]$/.test(name) || name === `house_LOD2`) return;
    meshes.push(mesh);
  });
  for (const source of meshes) {
    const geometry = tightGeometry(source.geometry, api.BufferAttribute);
    geometry.applyMatrix4(source.matrixWorld);
    const material = source.material;
    for (const key of [`map`, `normalMap`, `roughnessMap`, `aoMap`]) {
      const texture = material?.[key];
      if (!texture?.image || files.has(texture)) continue;
      const file = await encodeJpeg(texture.image, api, key === `map` ? 0.86 : 0.8);
      file.name = `${source.name || key}-${key}`;
      files.set(texture, file);
    }
    const mesh = new api.Mesh(geometry, material);
    mesh.name = source.name;
    mesh.castShadow = source.castShadow;
    mesh.receiveShadow = source.receiveShadow;
    group.add(mesh);
  }
  try {
    return await api.exportGlb(group, files, spec, prompt);
  } finally {
    group.traverse(mesh => {
      if (mesh.isMesh) mesh.geometry.dispose();
    });
  }
}
