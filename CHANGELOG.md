# Changelog

## 1.5.1

### Patch Changes

- [#83](https://github.com/kirilinsky/dateforge-react-calendar/pull/83) [`2a9489b`](https://github.com/kirilinsky/dateforge-react-calendar/commit/2a9489b51137bfc6738ecca2f562af6c67bdcf10) Thanks [@kirilinsky](https://github.com/kirilinsky)! - Perf: rAF-coalesce range-hover updates and gate hover-date recomputation per month so multi-month layouts stay under one frame per hover tick.

  Feat: new `syncViewOnSelect` prop on `CalendarDays`. Defaults to `true` for the primary grid and `false` for any `offset` grid, so clicking a day in a side month no longer steals the primary view. Pass `true`/`false` to override.

## 1.5.0

### Minor Changes

- [#72](https://github.com/kirilinsky/dateforge-react-calendar/pull/72) [`4ea631b`](https://github.com/kirilinsky/dateforge-react-calendar/commit/4ea631bb657d44a82268ca6428f77ba3563ba5fb) Thanks [@kirilinsky](https://github.com/kirilinsky)! - `compactTime` prop for Nav module, to get quick access to time popup.

  Add the new `CalendarInfo` module for rendering selection summaries and relative date text.

  Improve time selection workflows with bound range time editing, expanded time grid behavior, and a range duration recipe that combines range selection with time grids.

  Extend tokens for customization and polish across appearances, themes.

## 1.4.8

### Patch Changes

- [#70](https://github.com/kirilinsky/dateforge-react-calendar/pull/70) [`3aca8c5`](https://github.com/kirilinsky/dateforge-react-calendar/commit/3aca8c56ed889f8cc35178222b0c1f91169a98d8) Thanks [@kirilinsky](https://github.com/kirilinsky)! - Add `allowClearPerChip` to `CalendarSelectedDates` and fix animated height after clearing and selecting again.

## 1.4.7

### Patch Changes

- [#68](https://github.com/kirilinsky/dateforge-react-calendar/pull/68) [`a86063d`](https://github.com/kirilinsky/dateforge-react-calendar/commit/a86063d172e50e754cfc91687b6c5c165b738c13) Thanks [@kirilinsky](https://github.com/kirilinsky)! - Hotfix popup drum text colors.

  Improve month/year grid accessibility states.

## 1.4.6

### Patch Changes

- [#66](https://github.com/kirilinsky/dateforge-react-calendar/pull/66) [`2bbc9c6`](https://github.com/kirilinsky/dateforge-react-calendar/commit/2bbc9c65f9b43409a22fb9bd0090a67422498cb0) Thanks [@kirilinsky](https://github.com/kirilinsky)! - Add controlled overflow chips for `CalendarSelectedDates`, make its clear action opt-in/read-only safe, and introduce the `todayDot` theme token for selected-today dots.

## 1.4.5

### Patch Changes

- [#64](https://github.com/kirilinsky/dateforge-react-calendar/pull/64) [`09a4194`](https://github.com/kirilinsky/dateforge-react-calendar/commit/09a4194a26ddf4d379850ec808bbf9307a383d36) Thanks [@kirilinsky](https://github.com/kirilinsky)! - Add `startYear` and `showControls` to `CalendarYearsGrid`, refresh selected date chip styles, and improve track text contrast.

## 1.4.4

### Patch Changes

- [#62](https://github.com/kirilinsky/dateforge-react-calendar/pull/62) [`9cd903e`](https://github.com/kirilinsky/dateforge-react-calendar/commit/9cd903e83beb2bce4c8fb7e274e590765fd87746) Thanks [@kirilinsky](https://github.com/kirilinsky)! - Fix stale hover preview in range mode after clearing and re-selecting the start day. Clicking the start of a complete range now clears both bounds.

  Add `todayDot` prop to `CalendarDays` (default `true`) — renders a small `--c-b` dot under the digit when the selected day is also today.

## 1.4.3

### Patch Changes

- [#60](https://github.com/kirilinsky/dateforge-react-calendar/pull/60) [`1cc5f5a`](https://github.com/kirilinsky/dateforge-react-calendar/commit/1cc5f5af2de974b9bb7195024bd00bc093da368f) Thanks [@kirilinsky](https://github.com/kirilinsky)! - Fix `getTimeString` ignoring locale (always formatted with `"en"`). Add `locale` parameter; update both call sites in `CalendarNav` to pass the configured locale.

  Add `getNumberFormat` to `intl-cache` so `Intl.NumberFormat` instances (used for unit labels in the time track) are cached across renders instead of recreated each time.

  Deduplicate wrap arithmetic in `StepDrum` by using the existing `getDrumValue` utility.

  Only fire `onTimeSelect` for accepted time changes.

  Remove second-step future shortcuts from `basicPresets`.

## 1.4.2

### Patch Changes

- [#53](https://github.com/kirilinsky/dateforge-react-calendar/pull/53) [`53481d4`](https://github.com/kirilinsky/dateforge-react-calendar/commit/53481d4fa9efef7a8f74d0b88397eecde813a47f) Thanks [@kirilinsky](https://github.com/kirilinsky)! - AM/PM control redesigned as a single `role="switch"` toggle: larger hit target, sliding thumb, gradient-aware active styles, softer focus ring, keyboard Space/Enter support.

  `CalendarDays` render perf: stabilize cell handlers via ref-pattern so `React.memo` no longer bypasses on every selection/hover, key cells by `dateTime` for stable identity across renders, cache `isTodayDate` per cell, extract class composition into pure `getDayCellClassName` helper.

  Shared `Intl.DateTimeFormat` cache keyed by `locale + sorted-options`. Replaces ad-hoc `new Intl.DateTimeFormat` calls and inconsistent `useMemo` wrapping across `CalendarNav`, `CalendarDays`, `CalendarSelectedDates`, `CalendarMonthsGrid`, `CalendarMonthsTrack`, `CalendarDaysTrack`, layout announcer, `getTodayInTimezone`, and live-time `getTimeString`. Bounded FIFO eviction (64 entries) prevents unbounded growth.

  `CalendarTimeGrid` gains optional `labels` prop. `labels="short"` renders `HH` / `MM` / `SS` above each drum (clock convention). `labels="long"` renders the localized field name via `Intl.DisplayNames(locale, { type: "dateTimeField" })`. Omit to keep current label-less layout.

  `CalendarNav` polish: chevron SVG icons replace unicode `‹` / `›` arrows; compact month/year buttons match time/picker height and pick up hover styles; nav uses `justify-content: space-between` so items distribute across the row; `themeToggle` aria-label is dynamic (`"Switch to dark mode"` / `"Switch to light mode"`) with `aria-pressed` reflecting current theme; month/year picker buttons use native `disabled` instead of `aria-disabled` when fixed by `minDate === maxDate`; nav `label` prop renders as a heading and is wired to the toolbar via `aria-labelledby`; `manual-input` mask preserves caret position when editing mid-string and steps over separator on Backspace; `DaysTrack` month label uses active-cell color for proper contrast in the active item; `CalendarManualInput` internals split into `masked-date-input.tsx` and `date-slot.tsx`.

  `CalendarTimeGrid` AM/PM switch fix: switch active label now uses an explicit `data-value` attribute so the AM label receives the active color in AM mode (the previous `:first-of-type` selector matched the thumb span, leaving AM muted).

## 1.4.1

### Patch Changes

- [#42](https://github.com/kirilinsky/dateforge-react-calendar/pull/42) [`b00568c`](https://github.com/kirilinsky/dateforge-react-calendar/commit/b00568cce3bfd511547808da8bf1cacb054e43b5) Thanks [@kirilinsky](https://github.com/kirilinsky)! - CalendarDays: new `weekdayFormat` prop (`"narrow" | "short" | "long"`, default `"short"`). Locale-aware via `Intl.DateTimeFormat` — `"narrow"` renders single-letter labels (M T W…), `"long"` renders full names. Header font-size auto-adjusts per format.

  Gradient mode (`<Calendar gradient />`): styling extended beyond root background. Active surfaces across all modules now consume the gradient tokens — selected day cell, active preset chip, active selected-dates chip, current month/year cell, drum/track highlight pills (time, days/months/years tracks), nav time button, popup confirm button, days-track confirm button, manual-input chip wrapper, month-year nav track. Theme-aware via `--c-h` highlight token. Non-gradient mode behavior unchanged (var fallbacks resolve to existing tokens).

## 1.4.0

### Minor Changes

- [#40](https://github.com/kirilinsky/dateforge-react-calendar/pull/40) [`371dc9d`](https://github.com/kirilinsky/dateforge-react-calendar/commit/371dc9d253d97e9a2e1d77d3699225058c6d8574) Thanks [@kirilinsky](https://github.com/kirilinsky)! - Theming, tokens, a11y, standalone module callbacks.

  - Theme tokens: add `activeText` (`--c-at`), `mutedText` (`--c-m`), `disabledText` (`--c-dt`). All built-in themes updated.
  - Themes: add 3 new dark themes — `cobalt`, `velvet`, `eclipse` (36 built-in total).
  - Contrast: cover all WCAG AA contrast issues across themes (axe-clean baseline).
  - Appearance tokens: extend `createAppearance` with `font`, `fontSize`, `dayFontSize`, `controlFontSize`, `daysSpacing`, `trackHeight`, `dayRatio` (typography + sizing).
  - Built-in appearances (`loft`, `compact`, `square`, `soft`, `bubble`) refreshed with new tokens.
  - `CalendarMonthsTrack`: new `showYearLabel` prop — renders year under the active month chip.
  - Standalone callbacks — every navigation/time module now exposes a callback so it can be used without `CalendarDays`:
    - `CalendarMonthsGrid` → `onMonthSelect?: (date: Date) => void`
    - `CalendarYearsGrid` → `onYearSelect?: (date: Date) => void`
    - `CalendarMonthsTrack` → `onMonthSelect?: (date: Date) => void` (receives clamped bound date in range mode)
    - `CalendarYearsTrack` → `onYearSelect?: (date: Date) => void` (receives clamped bound date in range mode)
    - `CalendarTimeGrid` → `onTimeSelect?: (date: Date) => void` (fires on every drum change; read `getHours()` / `getMinutes()` / `getSeconds()` for time-only value)
  - `CalendarSelectedDates`: split date and time with `|` when `showTime` is on (`Jun 15, 2024 | 3:30 PM`).
  - A11y: Storybook addon-a11y switched to `test: "error"` — 117 stories × axe per story = 0 violations gate. New `a11y.yml` workflow + README badge.

## 1.3.0

### Minor Changes

- [#37](https://github.com/kirilinsky/dateforge-react-calendar/pull/37) [`6410327`](https://github.com/kirilinsky/dateforge-react-calendar/commit/64103278aee082aed0014517dc35c1750cc0c8a3) Thanks [@kirilinsky](https://github.com/kirilinsky)! - Add `timeStep` prop on `<Calendar>` for time drum granularity (applies to `CalendarTimeGrid` and the `CalendarNav` time popup):

  ```tsx
  <Calendar timeStep={{ minute: 15 }}>
    <CalendarTimeGrid />
  </Calendar>
  ```

  `{ hour?, minute?, second? }`, default `1`. Affects `aria-valuemax`, keyboard, and snap.

  Add `useToday()` SSR-safe hook (exported from main entry). Returns `null` on the server and during pre-hydration render, then resolves to `new Date()` after mount via layout effect. Use this instead of `useState(new Date())` to avoid hydration mismatch / two visually-selected day cells in Next.js / Remix / any SSR app. See `DOCUMENTATION.md → SSR pitfall`.

  Fix: `CHANGE_TIME` now rejects time edits that violate `minDate` / `maxDate` / `disabled` rules. Range mode re-validates the affected endpoint via `validateRange` (covers `minRangeDays` / `maxRangeDays` / ordering).

## 1.2.2

### Patch Changes

- [#34](https://github.com/kirilinsky/dateforge-react-calendar/pull/34) [`844537e`](https://github.com/kirilinsky/dateforge-react-calendar/commit/844537e62c7899e107c0dd2a0b73e9c05ff14175) Thanks [@kirilinsky](https://github.com/kirilinsky)! - Improve track and range behavior.

  - Stop `useTrack` animation frames when the track is idle, and restart them only for active movement.
  - Validate range updates from manual input, presets, track bounds, and selection actions against min/max range length and disabled dates.
  - Keep outside-month day styling dominant when a day is also disabled.

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
