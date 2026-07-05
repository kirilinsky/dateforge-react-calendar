---
"@dateforge/react-calendar": major
---

v3.0.0 — ground-up rebuild. One implementation, no legacy.

**Breaking:**

- Flat root props replaced by `config` (`createCalendarConfig({ mode, unit, locale, min, max, disabled, withTime, … })`).
- Selection model is `unit × mode` (day/week/month × single/multiple/range/multi-range); `value`/`onChange` shapes derive from that pair alone. Spans are `{ start, end }`.
- Themes are families only (28, `light-dark()`-driven, `scheme` prop); token renames `highlight→accent`, `accent→focusRing`. Import named objects from `/themes`, `/appearances` (per-name subpaths removed).
- Context split replaced by one store: `/context` now exports `useCalendarStore` / `useStoreSelector` / `useCalendarActions` / `useUI` / `useLabels`.
- `~55 *Label` props → `labels` registry with per-module overrides.
- See `.notes/PARITY-V3.md` for the full changed-by-design record.

**New:**

- Prebuilts (`/prebuilt`): `SimpleCalendar`, `DatePicker`, `MonthPicker`, `MultiMonthCalendar` (6/12-month boards).
- Pure core (no React/DOM/Date) with strategy-enforced invariants; presets commit through the same validation as clicks; property-fuzzed reducer.
- DST-safe `timeZone` boundary (gap/fold policies, `UTC±N`), time window (`minTime`/`maxTime`), bound editing on wheels/tracks/toolbar/manual-input.
- aria-live selection announcer, roving focus, full keyboard maps (incl. Shift+PageUp/Down year jump), WCAG-audited 28×2 palettes.
- RTL, gradient mode, 8 appearances incl. `zenith`, container-query layouts, `cal-user` CSS layer escape hatch.
- Dev-warning registry: malformed input never throws — it degrades with a fix-oriented warning.
