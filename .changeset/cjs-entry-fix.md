---
"@dateforge/react-calendar": minor
---

CJS repair, smart layouts, and a hardened build pipeline.

**Fixed:**

- **CJS build repaired** — `require()` of the root, `/prebuilt` and `/modules` entries failed with `MODULE_NOT_FOUND` (phantom `layers-*.cjs` chunk). **CJS CSS contract:** the CJS output carries no CSS references — import the stylesheet once via the new `@dateforge/react-calendar/style.css` export (ESM stays automatic through bundler-resolved css imports). CI now smoke-loads every exports subpath and re-pins the `@layer` order statement on the shipped stylesheet.
- Subpath `.d.ts` files mark type-only exports with the `type` modifier, including cross-chunk re-exports (fixes `verbatimModuleSyntax`/`isolatedModules` consumers); CI cross-checks every `d.cts` value export against the real `require()` namespace.
- Manual input: an unsupported `format` (e.g. `TT.MM.JJJJ`) silently never committed — it falls back to the default with a dev warning; committing a date outside the shown month moves the view to it (typed commits only — arrow segment-stepping stays quiet, and a rejected pick never moves the view).
- Selected-dates: the active chip keeps readable text on hover.
- Days: weekend column strips align with the real columns under appearance padding; `createAppearance` warns on a multi-value `daysPadding` (the strip math needs a single length).

**Changed / added (the minor):**

- **Smart toolbar**: the default layout is a wrapping flex row — overflow wraps to the next line instead of escaping the container, rows distribute space-between, and an over-wide label shrinks with an ellipsis. `CalendarToolbarGroup` gained `push="start" | "end"`. The explicit `cols`/`col` grid mode is unchanged.
- **Smart root `cols`**: `cols={N}` now renders up to N equal columns, collapsing toward one on narrow screens (`--cal-cols-min`, default `14em`; set `0px` for fixed tracks). New `col="full"` places a module across the full row collapse-safely. `MultiMonthCalendar` months are self-contained cells, so a collapse never separates a header from its grid.
- `DatePicker` gained `allowClear` (default `true`); dev warning when `scheme` changes on an uncontrolled calendar.
