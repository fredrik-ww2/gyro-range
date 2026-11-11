import { buildMobilePlan, formatMobileReport } from "./house-finish.js";

function readMesh(object) {
  object.updateWorldMatrix(true, false);
  const geometry = object.geometry;
  const position = geometry.getAttribute(`position`);
  const normal = geometry.getAttribute(`normal`);
  const uv = geometry.getAttribute(`uv`);
  const index = geometry.getIndex ? geometry.getIndex() : geometry.index;
  const elements = object.matrixWorld.elements;
  const positions = new Float32Array(position.count * 3);
  const normals = normal ? new Float32Array(normal.count * 3) : null;
  for (let vertex = 0; vertex < position.count; vertex++) {
    const x = position.getX(vertex), y = position.getY(vertex), z = position.getZ(vertex);
    positions[vertex * 3] = elements[0] * x + elements[4] * y + elements[8] * z + elements[12];
    positions[vertex * 3 + 1] = elements[1] * x + elements[5] * y + elements[9] * z + elements[13];
    positions[vertex * 3 + 2] = elements[2] * x + elements[6] * y + elements[10] * z + elements[14];
    if (!normal) continue;
    let nx = elements[0] * normal.getX(vertex) + elements[4] * normal.getY(vertex) + elements[8] * normal.getZ(vertex);
    let ny = elements[1] * normal.getX(vertex) + elements[5] * normal.getY(vertex) + elements[9] * normal.getZ(vertex);
    let nz = elements[2] * normal.getX(vertex) + elements[6] * normal.getY(vertex) + elements[10] * normal.getZ(vertex);
    const length = Math.hypot(nx, ny, nz) || 1;
    normals[vertex * 3] = nx / length;
    normals[vertex * 3 + 1] = ny / length;
    normals[vertex * 3 + 2] = nz / length;
  }
  const material = Array.isArray(object.material) ? object.material[0] : object.material;
  return {
    name: object.name || material?.name || `del`,
    positions,
    normals,
    uvs: uv ? new Float32Array(uv.array) : null,
    indices: index ? Uint32Array.from(index.array) : null,
    material,
  };
}

function geometryFrom(part, BufferGeometry, BufferAttribute) {
  const geometry = new BufferGeometry();
  geometry.setAttribute(`position`, new BufferAttribute(part.positions, 3));
  geometry.setAttribute(`normal`, new BufferAttribute(part.normals, 3));
  if (part.uvs) geometry.setAttribute(`uv`, new BufferAttribute(part.uvs, 2));
  if (part.colors) geometry.setAttribute(`color`, new BufferAttribute(part.colors, 3));
  geometry.setIndex(new BufferAttribute(part.indices, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

async function resizedTexture(source, maxEdge, api) {
  const image = source?.image;
  const width = image?.width || image?.videoWidth;
  const height = image?.height || image?.videoHeight;
  if (!width || !height) throw new Error(`En textur saknar storlek.`);
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));
  const canvas = api.canvas(targetWidth, targetHeight);
  const context = canvas.getContext(`2d`);
  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error(`Texturen kunde inte förminskas.`)), `image/jpeg`, scale < 1 ? 0.82 : 0.9));
  const texture = new api.Texture(canvas);
  texture.name = source.name || `texture`;
  texture.colorSpace = source.colorSpace || ``;
  texture.wrapS = source.wrapS;
  texture.wrapT = source.wrapT;
  texture.flipY = false;
  texture.needsUpdate = true;
  return {
    texture,
    file: { bytes: new Uint8Array(await blob.arrayBuffer()), mimeType: `image/jpeg`, width: targetWidth, height: targetHeight, name: texture.name },
  };
}

export async function buildMobileExport(root, asset, spec, prompt, api) {
  root.updateMatrixWorld(true);
  const meshes = [];
  root.traverse(object => {
    if (!api.isMesh(object) || !object.geometry?.getAttribute?.(`position`)) return;
    const name = String(object.name || ``);
    if (name.startsWith(`collision_`) || /_LOD[12]$/.test(name)) return;
    meshes.push(readMesh(object));
  });
  const plan = buildMobilePlan(meshes, asset);
  const materials = new Map(meshes.map(mesh => [String(mesh.name || `del`).replace(/_LOD[0-2]$/, ``), mesh.material]));
  const files = new Map();
  const encodedBySource = new Map();
  const created = [];
  async function materialFor(part, level) {
    if (level === 2) {
      const wall = materials.get(`wall`) || materials.get(`surface_front`) || [...materials.values()][0];
      const material = new api.MeshStandardMaterial({
        color: wall?.color ? wall.color.clone?.() || wall.color : new api.Color(`#c8bfae`),
        roughness: 0.9,
        metalness: 0,
        vertexColors: true,
      });
      material.name = `house`;
      created.push(material);
      return material;
    }
    const source = materials.get(part.materialName);
    if (!source) throw new Error(`Material saknas: ` + part.materialName);
    const material = source.clone();
    material.name = source.name || part.materialName;
    material.vertexColors = true;
    for (const key of [`map`, `normalMap`]) {
      if (!material[key]) continue;
      let encoded = encodedBySource.get(material[key]);
      if (!encoded) {
        encoded = await resizedTexture(material[key], 1024, api);
        encodedBySource.set(material[key], encoded);
        files.set(encoded.texture, encoded.file);
        created.push(encoded.texture);
      }
      material[key] = encoded.texture;
    }
    created.push(material);
    return material;
  }
  const group = new api.Group();
  group.name = `FORM_House`;
  group.userData = { ...root.userData, gameAsset: asset, mobileReady: true };
  const levels = [[plan.lod0, 0], [plan.lod1, 1], [plan.lod2, 2], [plan.collision, 3]];
  for (const [parts, level] of levels) {
    for (const part of parts) {
      const material = level === 3
        ? Object.assign(new api.MeshStandardMaterial({ color: `#c47b3a`, roughness: 1, metalness: 0 }), { name: `collision` })
        : await materialFor(part, level);
      if (level === 3) created.push(material);
      const mesh = new api.Mesh(geometryFrom(part, api.BufferGeometry, api.BufferAttribute), material);
      mesh.name = part.name;
      mesh.castShadow = level === 0 && !/^(photo|facade_|window_photo)/.test(part.name);
      mesh.receiveShadow = level === 0;
      group.add(mesh);
    }
  }
  try {
    const glb = await api.exportGlb(group, files, spec, prompt);
    return { glb, report: formatMobileReport({ lodTriangles: plan.lodTriangles, drawCalls: plan.drawCalls, fileBytes: glb.byteLength }), plan };
  } finally {
    group.traverse(object => {
      if (api.isMesh(object)) object.geometry.dispose();
    });
    for (const item of created) item.dispose?.();
  }
}
