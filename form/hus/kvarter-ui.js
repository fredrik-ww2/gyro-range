// Uppladdning av en kvartersbild och listan över husen längs gatan.

import { assignHouses } from "./kvarter.js";

export function createKvarterImport({ react, jsx, loadSheet, splitSheet, readHouse }) {
  return function KvarterImport({ disabled, onBuild, onBusy, onError }) {
    const input = react.useRef(null);
    const lock = react.useRef(false);
    const [sheet, setSheet] = react.useState();
    const [regions, setRegions] = react.useState([]);
    const [mode, setMode] = react.useState(`auto`);
    const [status, setStatus] = react.useState(``);
    const plan = regions.length ? assignHouses(regions, mode) : null;

    async function load(file) {
      if (!file || lock.current) return;
      lock.current = true;
      onBusy(true);
      onError(``);
      setStatus(`Läser kvartersbilden…`);
      try {
        const image = await loadSheet(file, 3072);
        const split = await splitSheet(image);
        setSheet(image);
        setRegions(split.regions || []);
        setMode(`auto`);
        const next = assignHouses(split.regions || [], `auto`);
        setStatus(split.detected ? `${next.houses.length} hus hittades i bildens rutor.` : `${next.houses.length} hus föreslås. Byt rad eller ruta om det ser fel ut.`);
      } catch (error) {
        onError(error.message || `Bilden kunde inte läsas.`);
        setStatus(``);
      } finally {
        lock.current = false;
        onBusy(false);
        if (input.current) input.current.value = ``;
      }
    }

    async function build() {
      if (!plan || !sheet || lock.current) return;
      lock.current = true;
      onBusy(true);
      onError(``);
      try {
        const houses = [];
        for (let index = 0; index < plan.houses.length; index++) {
          const house = plan.houses[index];
          setStatus(`Läser ${house.name}…`);
          houses.push({ name: house.name, ...await readHouse(sheet, house) });
        }
        setStatus(`Bygger ${houses.length} hus…`);
        await onBuild({ name: `Kvarteret`, houses });
        setSheet(undefined);
        setRegions([]);
        setStatus(``);
      } catch (error) {
        onError(error.message || `Kvarteret kunde inte byggas.`);
      } finally {
        lock.current = false;
        setStatus(``);
        onBusy(false);
      }
    }

    return jsx.jsxs(`section`, {
      className: `house-block`,
      "aria-label": `Kvarter från en bild`,
      children: [
        jsx.jsx(`h3`, { children: `Kvarter från en bild` }),
        jsx.jsx(`p`, { children: `Flera hus på tomter längs en gata. Ladda upp en bild med vyer, på samma sätt som för ett hus.` }),
        jsx.jsx(`button`, { className: `house-primary`, type: `button`, disabled: disabled || lock.current, onClick: () => input.current?.click(), children: sheet ? `Byt kvartersbild` : `Ladda upp kvartersbild` }),
        jsx.jsx(`input`, { ref: input, type: `file`, hidden: true, accept: `image/*`, onChange: event => load(event.target.files?.[0]) }),
        status ? jsx.jsx(`p`, { role: `status`, children: status }) : null,
        plan ? jsx.jsxs(jsx.Fragment, { children: [
          jsx.jsxs(`div`, { className: `house-mode`, children: [
            jsx.jsx(`button`, { type: `button`, disabled, "aria-pressed": plan.mode === `rad`, onClick: () => setMode(`rad`), children: `Varje rad är ett hus` }),
            jsx.jsx(`button`, { type: `button`, disabled, "aria-pressed": plan.mode === `ruta`, onClick: () => setMode(`ruta`), children: `Varje ruta är ett hus` }),
          ] }),
          jsx.jsx(`p`, { children: plan.mode === `rad` ? `Varje rad blir ett hus. Rutorna blir fram, höger, bak och vänster.` : `Varje ruta blir ett eget hus längs gatan. Övriga sidor fylls i som stilförslag.` }),
          jsx.jsx(`div`, { className: `house-street`, children: plan.houses.map(house => jsx.jsxs(`span`, { children: [jsx.jsx(`strong`, { children: house.name }), jsx.jsx(`small`, { children: `${house.views.filter(view => view.role !== `skip`).length} vyer` })] }, house.name)) }),
          jsx.jsx(`button`, { className: `house-primary`, type: `button`, disabled: disabled || lock.current, onClick: () => void build(), children: `Bygg kvarteret` }),
        ] }) : null,
      ],
    });
  };
}

export function createKvarterPanel({ jsx }) {
  return function KvarterPanel({ block, currentId, disabled, onOpen }) {
    const houses = block?.kvarter?.hus || [];
    if (!houses.length) return null;
    const length = block.kvarter.gata?.langd;
    return jsx.jsxs(`section`, {
      className: `house-kvarter`,
      id: `house-kvarter`,
      "aria-label": `Kvarteret`,
      children: [
        jsx.jsx(`span`, { className: `house-eyebrow`, children: `KVARTERET` }),
        jsx.jsx(`h2`, { children: block.name || `Kvarteret` }),
        jsx.jsx(`p`, { children: `${houses.length} hus på tomter längs gatan${length ? `, ${length} meter` : ``}. Tryck på ett hus för att öppna och ändra det. Spara lagrar hela kvarteret.` }),
        jsx.jsx(`div`, { className: `house-street`, role: `list`, children: houses.map(house => jsx.jsxs(`button`, {
          type: `button`,
          disabled,
          "aria-pressed": house.id === currentId,
          onClick: () => onOpen(house.id),
          children: [jsx.jsx(`strong`, { children: house.namn }), jsx.jsxs(`small`, { children: [`Tomt `, house.tomt?.index || ``] })],
        }, house.id)) }),
      ],
    });
  };
}
