// Färgton och mättnad per yta, och vilka texturer som hör till ytan.

import { HOUSE_TEXTURES } from "./texturer/katalog.js";
import { baseName, classifyGeometry, classifyName } from "./ytor.js";

export const SURFACES = [
  { id: `wall`, label: `Vägg` },
  { id: `roof`, label: `Tak` },
  { id: `detail`, label: `Detaljer` },
];

export const GROUP_LABELS = {
  puts: `Puts`,
  tegel: `Tegel`,
  sten: `Sten`,
  trä: `Trä`,
  betong: `Betong`,
  skiffer: `Skiffer`,
  tegelpannor: `Takpannor`,
  halm: `Halm`,
};

const DETAIL_NAMES = new Set([`trim`, `shutter`, `wood`]);

export function toneRole(name, positions, normals) {
  const named = classifyName(name);
  if (named === `wall` || named === `roof`) return named;
  if (named === `keep`) return DETAIL_NAMES.has(baseName(name)) ? `detail` : null;
  if (!positions) return null;
  const geometry = classifyGeometry(positions, normals);
  return geometry === `wall` || geometry === `roof` ? geometry : null;
}

export function menuForSurface(role) {
  const groups = [];
  for (const item of HOUSE_TEXTURES) {
    if (item.role !== role) continue;
    let group = groups.find(entry => entry.id === item.group);
    if (!group) {
      group = { id: item.group, label: GROUP_LABELS[item.group] || item.group, textures: [] };
      groups.push(group);
    }
    group.textures.push(item);
  }
  return groups;
}

export function activeGroup(role, groupId) {
  const groups = menuForSurface(role);
  return groups.find(group => group.id === groupId) || groups[0] || null;
}

export function clampTone(tone) {
  const hue = Number(tone?.hue);
  const saturation = Number(tone?.saturation);
  return {
    hue: Math.max(-180, Math.min(180, Number.isFinite(hue) ? Math.round(hue) : 0)),
    saturation: Math.max(0, Math.min(2, Number.isFinite(saturation) ? Math.round(saturation * 100) / 100 : 1)),
  };
}

export function neutralLook() {
  return {
    wall: { textureId: ``, hue: 0, saturation: 1 },
    roof: { textureId: ``, hue: 0, saturation: 1 },
    detail: { textureId: ``, hue: 0, saturation: 1 },
  };
}

export function normalizeLook(look) {
  const next = neutralLook();
  for (const key of [`wall`, `roof`, `detail`]) {
    const source = look?.[key] || {};
    const tone = clampTone(source);
    next[key] = {
      textureId: typeof source.textureId === `string` ? source.textureId : ``,
      hue: tone.hue,
      saturation: tone.saturation,
    };
  }
  if (look?.bases?.meshes) next.bases = { meshes: look.bases.meshes.map(item => ({ ...item })) };
  return next;
}

export function toneIsNeutral(tone) {
  const value = clampTone(tone);
  return value.hue === 0 && value.saturation === 1;
}

export function lookActive(look) {
  const value = normalizeLook(look);
  return [`wall`, `roof`, `detail`].some(key => value[key].textureId || !toneIsNeutral(value[key]));
}

export function rgbToHsl(r, g, b) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const light = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: light };
  const delta = max - min;
  const sat = light > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;
  if (max === red) hue = (green - blue) / delta + (green < blue ? 6 : 0);
  else if (max === green) hue = (blue - red) / delta + 2;
  else hue = (red - green) / delta + 4;
  return { h: hue * 60, s: sat, l: light };
}

export function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360 / 360;
  if (s === 0) {
    const gray = Math.round(l * 255);
    return [gray, gray, gray];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = t => {
    let value = t;
    if (value < 0) value += 1;
    if (value > 1) value -= 1;
    if (value < 1 / 6) return p + (q - p) * 6 * value;
    if (value < 1 / 2) return q;
    if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
    return p;
  };
  return [hue + 1 / 3, hue, hue - 1 / 3].map(value => Math.round(channel(value) * 255));
}

export function toneRgb(r, g, b, hue, saturation) {
  const tone = clampTone({ hue, saturation });
  const hsl = rgbToHsl(r, g, b);
  return hslToRgb(hsl.h + tone.hue, Math.max(0, Math.min(1, hsl.s * tone.saturation)), hsl.l);
}
