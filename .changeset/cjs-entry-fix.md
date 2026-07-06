---
"@dateforge/react-calendar": patch
---

Fixes:

- **CJS build repaired** — `require()` of the root, `/prebuilt` and `/modules` entries failed with `MODULE_NOT_FOUND` (phantom `layers-*.cjs` chunk). The stylesheet is now also exported as `./style.css`, and CI smoke-loads every exports subpath.
- Subpath `.d.ts` files mark type-only exports with the `type` modifier (fixes `verbatimModuleSyntax`/`isolatedModules` consumers).
- Manual input: an unsupported `format` (e.g. `TT.MM.JJJJ`) silently never committed — it now falls back to the default with a dev warning; committing a date outside the shown month now moves the view to it.
- Selected-dates: the active chip kept readable text on hover (state-guarded hover styles).
- Days: weekend column strips align with the real columns under appearance padding.
- Smart toolbar: overflow wraps to the next line instead of escaping the container; `CalendarToolbarGroup` gained `push="start" | "end"`.
- Smart root `cols`: side-by-side months collapse to a single column on narrow screens (`--cal-cols-min`, default `14em`; set `0px` for fixed tracks). `MultiMonthCalendar` months are self-contained cells, so the collapse never separates a header from its grid.
- `DatePicker` gained the documented `allowClear` prop; dev warning when `scheme` changes on an uncontrolled calendar.
