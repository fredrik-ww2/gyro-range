// Meny med förhandsbilder för den yta som byts, plus färgstyrka och färgton.

import { SURFACES, activeGroup, menuForSurface, toneIsNeutral } from "./farg.js";

const SURFACE_NAME = { wall: `väggen`, roof: `taket`, detail: `detaljerna` };

export function createTextureMenu({ jsx }) {
  return function TextureMenu({ place, role, groupId, look, disabled, onRole, onGroup, onTexture, onTone, onReset }) {
    const groups = menuForSurface(role);
    const group = activeGroup(role, groupId);
    const tone = look?.[role] || { hue: 0, saturation: 1 };
    const selected = group?.textures.find(item => item.id === look?.[role]?.textureId) || null;
    const previews = group ? jsx.jsx(`div`, {
      className: `house-texture-row`,
      role: `listbox`,
      "aria-label": group.label,
      children: group.textures.map(item => jsx.jsx(`button`, {
        type: `button`,
        className: `house-texture-choice`,
        disabled,
        "aria-pressed": look?.[role]?.textureId === item.id,
        "aria-label": item.label,
        onClick: () => onTexture(item.id),
        children: jsx.jsx(`img`, { src: item.preview, alt: `` }),
      }, item.id)),
    }) : null;
    if (place === `dock`) {
      return jsx.jsxs(`div`, {
        className: `house-texture-menu`,
        children: [
          previews,
          selected ? jsx.jsxs(`p`, { className: `house-texture-current`, children: [`Vald: `, selected.label] }) : null,
        ].filter(Boolean),
      });
    }
    return jsx.jsxs(`div`, {
      className: place === `dock` ? `house-texture-menu` : `house-texture-panel`,
      children: [
        jsx.jsx(`div`, {
          className: `house-texture-row`,
          role: `listbox`,
          "aria-label": `Yta`,
          children: SURFACES.map(item => jsx.jsx(`button`, {
            type: `button`,
            className: `house-texture-chip`,
            disabled,
            "aria-pressed": item.id === role,
            onClick: () => onRole(item.id),
            children: item.label,
          }, item.id)),
        }),
        groups.length ? jsx.jsx(`div`, {
          className: `house-texture-row`,
          role: `listbox`,
          "aria-label": `Material för ${SURFACE_NAME[role]}`,
          children: groups.map(item => jsx.jsx(`button`, {
            type: `button`,
            className: `house-texture-chip`,
            disabled,
            "aria-pressed": item.id === group?.id,
            onClick: () => onGroup(item.id),
            children: item.label,
          }, item.id)),
        }) : null,
        previews,
        selected ? jsx.jsxs(`p`, { className: `house-texture-current`, children: [`Vald: `, selected.label] }) : role === `detail` ? jsx.jsx(`p`, { className: `house-texture-current`, children: `Karmar, knutar och luckor. Fönster, dörrglas och glas lämnas orörda.` }) : null,
        place === `panel` ? jsx.jsxs(`div`, {
          className: `house-tone`,
          children: [
            jsx.jsxs(`label`, { children: [`Färgstyrka för ${SURFACE_NAME[role]}`, jsx.jsx(`input`, { type: `range`, min: `0`, max: `2`, step: `0.05`, value: tone.saturation, disabled, onChange: event => onTone(role, { saturation: Number(event.target.value) }) })] }),
            jsx.jsxs(`label`, { children: [`Färgton för ${SURFACE_NAME[role]}`, jsx.jsx(`input`, { type: `range`, min: `-180`, max: `180`, step: `1`, value: tone.hue, disabled, onChange: event => onTone(role, { hue: Number(event.target.value) }) })] }),
            jsx.jsx(`button`, { type: `button`, disabled: disabled || toneIsNeutral(tone), onClick: onReset, children: `Återställ` }),
          ],
        }) : null,
      ].filter(Boolean),
    });
  };
}
