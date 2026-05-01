# Changelog

## 1.2.1

### Patch Changes

- [#22](https://github.com/kirilinsky/dateforge-react-calendar/pull/22) [`ec5e0e2`](https://github.com/kirilinsky/dateforge-react-calendar/commit/ec5e0e27838b2f284d728300a84aba8550ffe1be) Thanks [@kirilinsky](https://github.com/kirilinsky)! - Fix nav header overflow and stabilize month picker width via hidden longest-month sizer.

## 1.2.0

### Minor Changes

- [#20](https://github.com/kirilinsky/dateforge-react-calendar/pull/20) [`d3cedd6`](https://github.com/kirilinsky/dateforge-react-calendar/commit/d3cedd66ea0246586c3905a799403d687e7f9dcf) Thanks [@kirilinsky](https://github.com/kirilinsky)! - - fix: range-bound tracks enforce composite ordering — `to` can't move before `from`, `from` can't move past `to`. Per-field min/max recomputed each render from opposite bound + other fields.
  - fix: `useBoundDateView` falls back to opposite bound when own is null, so bound modules stay coherent across both sides.
  - fix: `SET_RANGE_BOUND` reducer replaces auto-swap with no-cross clamp. Bounds no longer flip identity mid-drag.
  - feat: `bound` prop on `<CalendarNav>` — labels, arrows, popups, `home`, `clear` route through the bound boundary.
  - fix: controlled `value` is now single source of truth. User actions fire `onChange` with the next value but never mutate internal selection state. Only `viewDate` updates locally.

## 1.1.0

### Minor Changes

- [#17](https://github.com/kirilinsky/dateforge-react-calendar/pull/17) [`c292d62`](https://github.com/kirilinsky/dateforge-react-calendar/commit/c292d627c964f2e3e33e3a673ce30ed12e7c7a38) Thanks [@kirilinsky](https://github.com/kirilinsky)! - Add `error` theme token (`--c-e`) and surface it across feedback paths.

  - New `error` token in `ThemeTokens` mapped to CSS var `--c-e`. Provided for all 33 built-in themes (red-themed palettes use a contrasting amber/orange so the signal still pops). `createTheme` accepts the new key transparently.
  - `<CalendarManualInput>`: invalid-input border, focus ring, save button and chip-remove hover all now use `var(--c-e)`. Input gets a deterministic SSR-safe `id` via `useId`.
  - `multiple` mode: when `maxDates` is reached, hovering an unselected day shows a soft `--c-e` tint with `not-allowed` cursor (`data-max-reached` attribute on the cell).
  - Disabled-day clicks no longer leak through the cell handler — explicitly rejected in the day select reducer.

## 1.0.0

Initial stable release of `@dateforge/react-calendar`.

Renamed from `react-calendar-datetime`. Behavior matches the last published beta of the old package, with one explicit policy change:

- **Invalid Date drop policy** — `value` / `defaultValue` containing `Invalid Date` is dropped from the selection (single → no value; multiple → filtered; range → bound nulled) instead of being silently replaced with today. View date falls back to `defaultViewDate` or today. A dev warning is emitted.
