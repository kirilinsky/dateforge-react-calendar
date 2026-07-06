# Changelog

## 3.1.0

### Minor Changes

- [#125](https://github.com/kirilinsky/dateforge-react-calendar/pull/125) [`a5b5c9d`](https://github.com/kirilinsky/dateforge-react-calendar/commit/a5b5c9d0d209324ca8fecb1b727a1b435c63dac3) Thanks [@kirilinsky](https://github.com/kirilinsky)! - CJS repair, smart layouts, and a hardened build pipeline.

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

## 3.0.0

### Major Changes

- [#118](https://github.com/kirilinsky/dateforge-react-calendar/pull/118) [`95bf2a7`](https://github.com/kirilinsky/dateforge-react-calendar/commit/95bf2a71250b3a0ad193c7506d0e0f61f069c481) Thanks [@kirilinsky](https://github.com/kirilinsky)! - v3.0.0 — ground-up rebuild. One implementation, no legacy.

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

## 2.0.1

### Patch Changes

- [#103](https://github.com/kirilinsky/dateforge-react-calendar/pull/103) [`ec7ec10`](https://github.com/kirilinsky/dateforge-react-calendar/commit/ec7ec1075a976cd7e272c94386881d66dfb2813c) Thanks [@kirilinsky](https://github.com/kirilinsky)! - Fix MonthsGrid and YearsGrid container query (moved `container-type/name` to parent wrapper so responsive column switch now fires), remove `max-width` cap on grid tiles so buttons fill cells.

  Add `id` prop to `<Calendar>`.

## 2.0.0

### Major Changes

- [#100](https://github.com/kirilinsky/dateforge-react-calendar/pull/100) [`499ce55`](https://github.com/kirilinsky/dateforge-react-calendar/commit/499ce5576b7e060ab546c63570c28c1ddac4e489) Thanks [@kirilinsky](https://github.com/kirilinsky)! - **`CalendarManualInput` — `format` prop**

  Pass a token string with `DD`, `MM`, `YYYY` and any single-char separator(s) —
  e.g. `"DD.MM.YYYY"` (default), `"MM/DD/YYYY"`, `"YYYY-MM-DD"`, `"DD-MM-YYYY"`.
  The format string also serves as the placeholder. Invalid format strings fall
  back to the default with no error. Existing usage stays on `DD.MM.YYYY` and is
  unchanged.

  **`CalendarDays` — `renderDay` prop**

  Custom renderer for the day cell inner content:

  ```tsx
  renderDay?: (date: Date, state: DayState) => ReactNode
  ```

  `DayState` exposes `isSelected`, `isToday`, `isDisabled`, `isWeekend`,
  `isInRange`, `isRangeStart`, `isRangeEnd`, `isOtherMonth`. The button shell,
  data attributes, keyboard handlers, and a11y stay owned by the library — only
  the inner label is replaced. Default rendering (just the day number) is
  preserved when `renderDay` is omitted. New public exports: `DayState`,
  `RenderDay` from `@dateforge/react-calendar/modules/days`.

  **`Calendar` — `data-testid` prop**

  Optional `data-testid` on the root wrapper. Defaults to `"dateforge-calendar"`.
  Override per-instance when mounting multiple calendars side by side.

  **CSS layers**

  Collapse the styling contract to `cal-base`, `cal-themes`, `cal-appearances`,
  `cal-modules`, and `cal-user`; old internal layer names are removed.

  **`Calendar` — `motion` prop**

  Opt into browser View Transitions with `motion="view-transition"` for calendar
  navigation and popup open/close. Default remains `"none"`.

  **`CalendarTimeGrid` → `CalendarTimeWheel` (rename, breaking)**

  The drum-style time picker module has been renamed. Migration:

  ```diff
  - import { CalendarTimeGrid } from "@dateforge/react-calendar/modules/time";
  + import { CalendarTimeWheel } from "@dateforge/react-calendar/modules/time";
  - type X = CalendarTimeGridProps;
  + type X = CalendarTimeWheelProps;
  ```

  The subpath import (`@dateforge/react-calendar/modules/time`) stays the same.
  Only the component / type identifier changed. Motivation: free up the
  `TimeGrid` name for a future fixed-slot booking-style picker (see roadmap F-9
  `CalendarTimeSlots`) and align with the new "Wheels" module family.

  **New module: `CalendarMonthsWheel`**

  Drum-style month picker built on the shared `StepDrum` physics (same engine
  as `CalendarTimeWheel`). Mirrors the wheel API: `bound?: "from"|"to"` (range
  mode), `showBoundDate?`, `showReset?`, `resetLabel?`, `showLabel?`,
  `monthsLabel?` (aria), `monthPickerLabel?` (group aria), `resetMonthLabel?`,
  `shortMonths?` (render `Jan`/`Фев` instead of full names), `onMonthSelect`.

  Without `bound` the drum dispatches `navigateTo` (view-only); with `bound` it
  dispatches `onRangeBoundSet(bound, …)` to mutate that boundary's month while
  preserving the other fields. Subpath: `@dateforge/react-calendar/modules/months-wheel`.

  **New module: `CalendarYearsWheel`**

  Drum-style year picker. Same wheel API surface as `MonthsWheel`. Year range
  is bounded by `minDate.getFullYear()` / `maxDate.getFullYear()` when set,
  otherwise the virtual range `[1900, 2100]`. Subpath:
  `@dateforge/react-calendar/modules/years-wheel`.

  **New module: `CalendarLunar`**

  Information-only lunar phase strip. Shows the day number + a moon-phase
  glyph + a short phase label for a 21-day window centered on the selected
  date (or `viewDate` as fallback). CSS container queries auto-fit the visible
  subset (1 / 3 / 5 / ... / 21 cells) based on container width — anchor cell
  is always visible. Smooth crossfade animation between phases via stacked SVG
  paths with CSS opacity transition. Honours `prefers-reduced-motion`.

  Props: `col?`, `theme?`, `lunarLabel?` (group aria), `phaseLabels?`
  (`false` to hide, or `Partial<Record<LunarPhaseKey, string>>` to localize),
  `phaseAriaLabels?` (per-locale screen-reader labels).

  Phase helpers (tree-shakeable when only the component is imported):
  `getLunarFraction`, `getLunarPhaseKey`, `getLunarIllumination`,
  `buildLunarWindow` from `src/modules/lunar/helpers.ts`. Astronomical
  math: synodic month = 29.530588853d, reference new moon = 2000-01-06 18:14
  UTC. `LunarPhaseKey` is a stable string union for typed label maps.
  Subpath: `@dateforge/react-calendar/modules/lunar`.

  **Wheel ergonomics — shared additions across TimeWheel, MonthsWheel, YearsWheel**

  - `bound="from"|"to"` — range mode only, edits that boundary instead of
    guessing by `viewDate`.
  - `showBoundDate?: boolean` (default `true`) — localized date header above
    the drum when `bound` is set.
  - `showReset?: boolean` — render a reset button below the drum that snaps
    to "now" (time) / current month / current year.
  - `resetLabel?: ReactNode` — override reset button content.
  - `showLabel?: boolean` — show localized header above the drum
    (`Intl.DisplayNames` `dateTimeField`).
  - New action-label keys: `monthsLabel`, `yearsLabel`, `resetMonthLabel`
    (`"Reset to {month}"`), `resetYearLabel` (`"Reset to {year}"`).

  **`CHANGE_TIME` ambiguity guard in range mode (A-2 fix, breaking-soft)**

  When both `rangeStart` and `rangeEnd` share the calendar day matching
  `viewDate`, the legacy reducer silently edited `rangeStart` (the earlier
  branch) and made `rangeEnd` unreachable. After the fix, this ambiguous case
  is a no-op + a one-time dev warning that points to
  `<CalendarTimeWheel bound="from"|"to">` / `onRangeBoundSet(bound, date)`.

  Single mode, multiple mode, and unambiguous range mode are unaffected.
  Bound-aware paths (`TimeWheel bound`, bound Nav time popup) bypass this
  branch entirely. Migration: pass an explicit `bound` prop when editing
  time on a range-mode calendar.

  **`UIContext.containerWidth` removed (breaking)**

  The field was unused internally — modules adapt via CSS `@container` queries
  (`cal-root`, `cal-days`, `cal-nav`, …) instead of JS width measurement. The
  root `<Calendar>` no longer attaches a `ResizeObserver`. If you read
  `useUI().containerWidth` in custom modules, switch to container queries or
  measure your own ref.

  **`!important` purge in `src/**/\*.module.css` (breaking-soft)\*\*

  All 55 `!important` declarations have been removed from library CSS modules.
  The natural layer cascade (`cal-base` → `cal-themes` → `cal-appearances` →
  `cal-modules` → `cal-user`) now resolves all priority. User CSS overrides
  land in `cal-user` (last layer) and win without needing `!important`. A CI
  guard hard-bans any new `!important` from `src/**/*.module.css`.

  **Theme tokens — `outOfMonth` rolled out to all 42 themes**

  The `outOfMonth` color token (`--c-oom`) is now defined in every built-in
  theme so adjacent-month day text in the grid is colored consistently.

  **Apple-style press feedback on selected cells**

  `.activeItem` (selected day, current month/year, active preset, selected
  chip) and popup confirm button gain a subtle scale + spring easing on press
  (`transform: scale(0.95)` for 80ms down, 180ms springy release). Tuneable via
  `--cal-press-scale`, `--cal-press-down-duration`, `--cal-press-up-duration`,
  `--cal-press-up-easing`. Honours `prefers-reduced-motion`.

  **New module: `CalendarToolbar` + toolbar submodules (replaces `CalendarNav` composition pattern)**

  `CalendarToolbar` is a composable toolbar shell that replaces the monolithic `CalendarNav` for custom header layouts. Drop it anywhere in the `<Calendar>` tree; it reads the active `bound` and date from context.

  Submodules (all under `@dateforge/react-calendar/modules/toolbar`):

  | Component                                     | Role                                                                                |
  | --------------------------------------------- | ----------------------------------------------------------------------------------- |
  | `CalendarToolbarGroup`                        | `flex` wrapper with optional `grow` (fills remaining space)                         |
  | `CalendarToolbarMonthLabel`                   | Static month display, `short?`, `currentMonthLabel?`                                |
  | `CalendarToolbarYearLabel`                    | Static year display, `currentYearLabel?`                                            |
  | `CalendarToolbarDayLabel`                     | Static day display, `format?: "numeric" \| "2-digit" \| "long"`, `currentDayLabel?` |
  | `CalendarToolbarLabel`                        | Generic text label, `content?: ReactNode`                                           |
  | `CalendarToolbarClock`                        | Live clock (mirrors `CalendarNav showNowTime`)                                      |
  | `CalendarToolbarPrev` / `CalendarToolbarNext` | Prev/next nav buttons, `unit?: "day" \| "week" \| "month" \| "year"`                |
  | `CalendarToolbarHome`                         | Jump-to-today button                                                                |
  | `CalendarToolbarClear`                        | Clear selection button                                                              |
  | `CalendarToolbarThemeToggle`                  | Toggle light/dark theme                                                             |
  | `CalendarToolbarTime`                         | Open time-picker popup button                                                       |
  | `CalendarToolbarMonthTrigger`                 | Open month-picker popup button                                                      |
  | `CalendarToolbarYearTrigger`                  | Open year-picker popup button                                                       |
  | `CalendarToolbarApply`                        | Confirm / apply button (`applyLabel?`, `onApply?`, `disabled?`)                     |

  All label submodules use the visually-hidden text pattern for screen readers — the accessible name is always announced regardless of display format. Label text is resolved via `resolveActionLabel` (per-instance prop → `actionLabels` config → English default), so the full localization pipeline applies.

  New `CalendarActionLabels` keys: `currentDayLabel` (default `"Current day, {day}"`), `currentMonthLabel` (default `"Current month, {month}"`), `currentYearLabel` (default `"Current year, {year}"`), `nextDayLabel`, `previousDayLabel`.

  **Toolbar submodules — `offset` prop**

  `CalendarToolbarMonthLabel`, `CalendarToolbarMonthTrigger`, `CalendarToolbarYearLabel`, and `CalendarToolbarYearTrigger` accept `offset?: number` to shift the displayed month/year by N months relative to the Calendar's base view date. Positive values go forward, negative backward; year rolls over correctly at December/January boundaries.

  Component-level `offset` is **independent** of any `offset` set on the parent `<CalendarToolbar>` — it is always applied to the raw view date (`baseDate`), not to the already-offset toolbar date. This makes it safe to build multi-month panels using a single toolbar:

  ```tsx
  <CalendarToolbar>
    <CalendarToolbarPrev />
    <CalendarToolbarMonthLabel /> {/* current month */}
    <CalendarToolbarMonthLabel offset={1} /> {/* next month */}
    <CalendarToolbarNext />
  </CalendarToolbar>
  ```

  New `ToolbarContextValue` field: `baseDate` (pre-offset view date); previously only `date` (post-offset) was exposed. Custom toolbar submodules that need the raw anchor can read `baseDate` from `useToolbarContext()`.

  **Toolbar — disabled-button animation fix**

  Interactive toolbar buttons (MonthTrigger, YearTrigger, and any `.interactive` element) no longer show the `:active` press animation when `disabled` or `aria-disabled="true"`. Both the module-level `:active:not([disabled])` guard and a global `transform: none` fallback in `global.module.css` enforce this.

  **`CalendarDays` — keyboard month navigation slide animation**

  Arrow-key and Page-key navigation that crosses a month boundary now plays a vertical slide animation (`slideInDown` for previous month, `slideInUp` for next month) instead of the existing horizontal `slideInLeft` / `slideInRight`. Left/right swipe and toolbar prev/next buttons retain the horizontal animation. Honours `prefers-reduced-motion`.

  **`CalendarLunar` — accessibility**

  Strip upgraded from `role="group"` to `role="list"` / `role="listitem"`. Each cell now includes visually-hidden text (`date + phase name`) so screen readers in browse mode announce content correctly. `phaseAriaLabels` overrides apply to the hidden text, not an `aria-label` attribute.

## 1.6.0

### Minor Changes

- [#94](https://github.com/kirilinsky/dateforge-react-calendar/pull/94) [`2364da7`](https://github.com/kirilinsky/dateforge-react-calendar/commit/2364da749e710dc8a6053cb79e4351549932e809) Thanks [@kirilinsky](https://github.com/kirilinsky)! - Add cascading `actionLabels` config to `<Calendar>` for centralized aria-label customization across all modules.

  Add `press` appearance — newspaper-style serif with sharp corners, wide letter-spacing, and flat shadows.

  Add `atelier` (light) and `bauhaus` (dark) themes — paired warm cream / cool ink palette with red dateline accent.

  Rename appearance tokens for clarity: `--header-padding` → `--cal-nav-padding`, `--header-min-height` → `--cal-nav-min-height`, `--cal-text-2xl` → `--cal-nav-font-size`, `--cal-text-xl` → `--cal-nav-meta-font-size`. The `headerPadding` / `headerMinHeight` TS keys become `navPadding` / `navMinHeight`, with new `navFontSize` / `navMetaFontSize` added.

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
