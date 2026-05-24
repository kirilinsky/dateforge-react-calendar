---
"@dateforge/react-calendar": major
---

**`CalendarManualInput` — `format` prop**

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

**`!important` purge in `src/**/*.module.css` (breaking-soft)**

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

| Component | Role |
|---|---|
| `CalendarToolbarGroup` | `flex` wrapper with optional `grow` (fills remaining space) |
| `CalendarToolbarMonthLabel` | Static month display, `short?`, `currentMonthLabel?` |
| `CalendarToolbarYearLabel` | Static year display, `currentYearLabel?` |
| `CalendarToolbarDayLabel` | Static day display, `format?: "numeric" \| "2-digit" \| "long"`, `currentDayLabel?` |
| `CalendarToolbarLabel` | Generic text label, `content?: ReactNode` |
| `CalendarToolbarClock` | Live clock (mirrors `CalendarNav showNowTime`) |
| `CalendarToolbarPrev` / `CalendarToolbarNext` | Prev/next nav buttons, `unit?: "day" \| "week" \| "month" \| "year"` |
| `CalendarToolbarHome` | Jump-to-today button |
| `CalendarToolbarClear` | Clear selection button |
| `CalendarToolbarThemeToggle` | Toggle light/dark theme |
| `CalendarToolbarTime` | Open time-picker popup button |
| `CalendarToolbarMonthTrigger` | Open month-picker popup button |
| `CalendarToolbarYearTrigger` | Open year-picker popup button |
| `CalendarToolbarApply` | Confirm / apply button (`applyLabel?`, `onApply?`, `disabled?`) |

All label submodules use the visually-hidden text pattern for screen readers — the accessible name is always announced regardless of display format. Label text is resolved via `resolveActionLabel` (per-instance prop → `actionLabels` config → English default), so the full localization pipeline applies.

New `CalendarActionLabels` keys: `currentDayLabel` (default `"Current day, {day}"`), `currentMonthLabel` (default `"Current month, {month}"`), `currentYearLabel` (default `"Current year, {year}"`), `nextDayLabel`, `previousDayLabel`.

**Toolbar submodules — `offset` prop**

`CalendarToolbarMonthLabel`, `CalendarToolbarMonthTrigger`, `CalendarToolbarYearLabel`, and `CalendarToolbarYearTrigger` accept `offset?: number` to shift the displayed month/year by N months relative to the Calendar's base view date. Positive values go forward, negative backward; year rolls over correctly at December/January boundaries.

Component-level `offset` is **independent** of any `offset` set on the parent `<CalendarToolbar>` — it is always applied to the raw view date (`baseDate`), not to the already-offset toolbar date. This makes it safe to build multi-month panels using a single toolbar:

```tsx
<CalendarToolbar>
  <CalendarToolbarPrev />
  <CalendarToolbarMonthLabel />          {/* current month */}
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
