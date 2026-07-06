# @dateforge/react-calendar 3.0 — Documentation

Modular React calendar / date-picker library. Zero runtime dependencies, SSR-safe, themeable, accessible. React 18 or 19 is the only peer.

## Table of contents

- [Install & quick start](#install--quick-start)
  - [Prebuilt calendars](#prebuilt-calendars)
- [Composition model](#composition-model)
  - [The grid contract: `cols` / `col`](#the-grid-contract-cols--col)
- [`<Calendar>` — root component](#calendar--root-component)
- [`createCalendarConfig`](#createcalendarconfig)
- [Value shapes (`unit` × `mode`)](#value-shapes-unit--mode)
  - [`onChange` details and `segments`](#onchange-details-and-segments)
- [Controlled vs uncontrolled](#controlled-vs-uncontrolled)
- [Modules](#modules)
  - [CalendarDays](#calendardays)
  - [CalendarMonthsGrid](#calendarmonthsgrid)
  - [CalendarYearsGrid](#calendaryearsgrid)
  - [Toolbar](#toolbar)
  - [CalendarTimeWheel](#calendartimewheel)
  - [CalendarMonthsWheel](#calendarmonthswheel)
  - [CalendarYearsWheel](#calendaryearswheel)
  - [CalendarDaysTrack](#calendardaystrack)
  - [CalendarMonthsTrack](#calendarmonthstrack)
  - [CalendarYearsTrack](#calendaryearstrack)
  - [CalendarManualInput](#calendarmanualinput)
  - [CalendarPresets](#calendarpresets)
  - [CalendarSelectedDates](#calendarselecteddates)
  - [CalendarInfo](#calendarinfo)
  - [CalendarLunar](#calendarlunar)
- [Presets](#presets)
- [Disabled and excluded dates](#disabled-and-excluded-dates)
- [Time](#time)
- [Time zones & DST](#time-zones--dst)
- [Theming](#theming)
- [Localization](#localization)
- [Accessibility](#accessibility)
- [SSR](#ssr)
- [Validation & dev warnings](#validation--dev-warnings)
- [Bundle size & import strategy](#bundle-size--import-strategy)
- [Building custom modules (`/context`)](#building-custom-modules-context)
- [Types appendix](#types-appendix)

---

## Install & quick start

```bash
npm i @dateforge/react-calendar
```

No global CSS import is required — styles ship with the components and land in a predictable [`@layer` cascade](#the-layer-cascade). Zero runtime dependencies.

### Prebuilt calendars

The fastest path: one import, plain-`Date` props, no composition. All four live on the `/prebuilt` subpath so modular consumers never pay for them.

```tsx
import { SimpleCalendar } from "@dateforge/react-calendar/prebuilt";

<SimpleCalendar onChange={(date) => console.log(date)} />
```

| Component | What it is | `value` / `onChange` shape |
|---|---|---|
| `SimpleCalendar` | Month/year navigation header + day grid, single-date selection | `Date \| null` |
| `DatePicker` | Typed manual input above the calendar, plus a Today jump | `Date \| null` |
| `MonthPicker` | Year-stepping header + 12-month grid; a pick selects the whole month | `Date \| null` (first day of the picked month) |
| `MultiMonthCalendar` | N consecutive months as one board with one shared selection | the root contract (`AnyCalendarValue` + `CalendarChangeDetails`) |

Shared props on all four (`PrebuiltShared`):

| Prop | Type | Description |
|---|---|---|
| `locale` | `string` | BCP-47 locale (names, digits, week start) |
| `min`, `max` | `Date` | Earliest / latest selectable day (inclusive) |
| `disabled` | `DateRuleConfig` | Days that cannot be selected |
| `readOnly` | `boolean` | Browse-only mode |
| `theme` | `string \| ThemeFamily` | Built-in name or a `createTheme` family |
| `appearance` | `CalendarAppearance` | Built-in name or a `createAppearance` object |
| `gradient` | `boolean` | Decorative corner glows + gradient selected fill |
| `scheme` | `"light" \| "dark" \| "auto"` | Light/dark choice |
| `config` | `CalendarConfigOptions` | Escape hatch: extra `createCalendarConfig` options, spread last |
| `className`, `data-testid` | `string` | Root overrides |

`SimpleCalendar` / `DatePicker` add `value?: Date | null`, `defaultValue?: Date | null`, `onChange?: (date: Date | null) => void`; `DatePicker` also takes `allowClear?: boolean` (default `true`) for the clear button inside its input. `MonthPicker` uses the same shapes but reports the first day of the picked month. `MultiMonthCalendar` adds:

| Prop | Type | Default | Description |
|---|---|---|---|
| `months` | `number` | `3` | How many consecutive months to render |
| `cols` | `number` | `3` | Months per row |
| `mode` | `"single" \| "multiple" \| "range" \| "multi-range"` | `"range"` | Selection mode for the whole board |
| `startMonth` | `Date` | current month | First shown month (any day inside it) |
| `navigation` | `boolean` | `true` | Prev/next arrows on the first/last header, stepping the whole board |
| `value`, `defaultValue`, `onChange` | root contract | — | One shared selection spans the board; ranges drag across months |

```tsx
import { MultiMonthCalendar } from "@dateforge/react-calendar/prebuilt";

<MultiMonthCalendar
  months={6}
  cols={3}
  mode="range"
  onChange={(value, details) => console.log(value, details.reason)}
/>
```

### Composed quick start

The prebuilts are recipes over the real API. The same single-date picker, assembled by hand:

```tsx
import { useState } from "react";
import { Calendar, createCalendarConfig } from "@dateforge/react-calendar";
import { CalendarDays } from "@dateforge/react-calendar/modules/days";
import {
  CalendarToolbar,
  CalendarToolbarGroup,
  CalendarToolbarMonthTrigger,
  CalendarToolbarNext,
  CalendarToolbarPrev,
  CalendarToolbarYearTrigger,
} from "@dateforge/react-calendar/modules/toolbar";

const config = createCalendarConfig({ mode: "single" });

function Picker() {
  const [date, setDate] = useState<Date | null>(null);
  return (
    <Calendar config={config} value={date} onChange={(v) => setDate(v as Date | null)}>
      <CalendarToolbar cols="auto minmax(0, 1fr) auto">
        <CalendarToolbarPrev />
        <CalendarToolbarGroup>
          <CalendarToolbarMonthTrigger />
          <CalendarToolbarYearTrigger />
        </CalendarToolbarGroup>
        <CalendarToolbarNext />
      </CalendarToolbar>
      <CalendarDays />
    </Calendar>
  );
}
```

---

## Composition model

Three layers:

1. **`<Calendar>`** — the root shell. Renders one CSS-grid container, owns the selection store, theme/scheme/appearance, the label registry, and the aria-live announcer. Takes a **compiled `config`** — not loose props.
2. **`createCalendarConfig(options)`** — turns friendly options (plain `Date`s, plain rule objects) into the compiled `CalendarConfig` the store consumes. Build it **once** (module scope or `useMemo`) — compiling rule engines on every render is wasted work.
3. **Modules** — self-contained components (`CalendarDays`, toolbar parts, wheels, tracks, info surfaces) that read and dispatch through the store via context. Drop them inside `<Calendar>` in any combination and order; JSX order is visual order.

There is no module registry and no required module: `<Calendar config={config}><CalendarDays /></Calendar>` is a complete calendar. Modules never own value state — the root `onChange` is the single source of the public value; per-module callbacks (`onDaySelect`, `onTimeSelect`, …) are observational only.

### The grid contract: `cols` / `col`

The calendar root is one CSS grid. Modules occupy grid cells.

- **`<Calendar cols={N}>`** — a SMART grid: up to N equal columns on wide containers, automatically collapsing N → … → 1 when a column would drop below the per-column floor (`--cal-cols-min`, default `14em`) — side-by-side months stack into a single column on phones. Set `--cal-cols-min: 0px` on the root for fixed N tracks, or pass a raw `grid-template-columns` string for full control. Omit for the default single column (modules stack vertically).
- **`<Module col={value}>`** — per-module `grid-column`:
  - `col={3}` (number) → `grid-column: span 3`;
  - `col="2 / 4"` (string) → raw CSS `grid-column` placement;
  - omitted → the module takes a full row (spans all columns).
- **Order in JSX = visual flow.** No `order` prop; the grid auto-places row by row.

The naming is intentional: the parent declares `cols` (plural, like `grid-template-columns`), children get `col` (singular, like `grid-column`).

```tsx
// Two-column split: sidebar + main
<Calendar config={config} cols={3}>
  <CalendarToolbar />               {/* spans all 3 columns */}
  <CalendarPresets col={1} presets={commonPresets} />
  <CalendarDays col={2} />
  <CalendarInfo />                  {/* spans all 3 columns */}
</Calendar>

// Equal split for from/to bound editing
<Calendar config={rangeConfig} cols={2}>
  <CalendarToolbar />
  <CalendarDays />
  <CalendarTimeWheel bound="from" col={1} />
  <CalendarTimeWheel bound="to" col={1} />
</Calendar>
```

`CalendarToolbar` also accepts its own `cols` for its internal grid — same semantics, one level down.

---

## `<Calendar>` — root component

```tsx
import { Calendar, createCalendarConfig, calendarDate } from "@dateforge/react-calendar";
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `config` | `CalendarConfig` | **required** | Compiled config from [`createCalendarConfig`](#createcalendarconfig) |
| `value` | `AnyCalendarValue` | — | Controlled value. Presence (including `null` = empty) switches to controlled mode |
| `defaultValue` | `AnyCalendarValue` | — | Uncontrolled initial selection, same public shape as `value` |
| `onChange` | `(value, details) => void` | — | Fires on every committed selection change. See [value shapes](#value-shapes-unit--mode) |
| `onViewChange` | `(viewDate: CalendarDate) => void` | — | View anchor moved (prev/next, `navigateTo`) |
| `onValidationReject` | `(result: ValidationResult) => void` | — | A transient action was rejected (disabled click, cap reached, range crossing…) |
| `initialView` | `CalendarDate` | today in `config.timeZone` | Initial view anchor. Note: a `CalendarDate` struct, not a JS `Date` — build with `calendarDate(2026, 7, 5)` (month is 1-based) |
| `initialFocus` | `false \| "view" \| CalendarDate` | `false` | Whether mounting moves DOM focus into a day cell, and which. Default: never steal focus |
| `theme` | `string \| ThemeFamily` | `"noir"` | Built-in family name (`data-theme`) or a `createTheme` object (inline `light-dark()` vars) |
| `appearance` | `string \| CustomAppearance` | — | Non-color visual axis: built-in name (`data-appearance`) or a `createAppearance` object. Omit for the v3 default look |
| `scheme` | `"light" \| "dark" \| "auto"` | `"auto"` | Light/dark. `"auto"` follows the OS via `color-scheme` — no flash, no JS on first paint |
| `onSchemeChange` | `(scheme: "light" \| "dark") => void` | — | Provide together with `scheme` to own the light/dark choice (controlled). The toolbar theme toggle then calls this instead of flipping internal state |
| `cols` | `number \| string` | — | Root grid columns (see [grid contract](#the-grid-contract-cols--col)) |
| `gradient` | `boolean` | `false` | Decorative gradient mode: soft accent glows in the shell corners + gradient fill on selected cells. Pure CSS, follows the active theme and scheme |
| `labels` | `LabelOverrides` | — | Root-level aria-label overrides (see [Localization](#localization)) |
| `className` | `string` | — | Extra class on the root shell |
| `id` | `string` | — | `id` on the root shell (label targets, anchors) |
| `style` | `CSSProperties` | — | Inline style, merged over theme/appearance vars |
| `data-testid` | `string` | `"dateforge-calendar"` | Test handle on the root |

The root renders `<div data-dateforge-root data-theme data-appearance data-scheme data-gradient data-readonly data-testid>` and mounts a hidden `role="status"` live region (the announcer). `data-readonly` is present when `config.readOnly` is set.

---

## `createCalendarConfig`

```tsx
import { createCalendarConfig, createDisabled } from "@dateforge/react-calendar";

const config = createCalendarConfig({
  mode: "range",
  locale: "de-DE",
  min: new Date(2026, 0, 1),
  disabled: { weekends: true },
});
```

All options with defaults:

| Option | Type | Default | Description |
|---|---|---|---|
| `mode` | `"single" \| "multiple" \| "range" \| "multi-range"` | `"single"` | Selection cardinality |
| `unit` | `"day" \| "week" \| "month"` | `"day"` | Selection granularity — what a single pick covers. `week`/`month` picks always produce spans |
| `locale` | `string` | host default | BCP-47 locale for month/weekday names and digits |
| `firstDayOfWeek` | `number` (0=Sun..6=Sat) | derived from `locale` | Week start. Derived via `Intl.Locale.getWeekInfo`, falling back to Monday |
| `min`, `max` | `Date` | — | Earliest / latest selectable day, inclusive. `min` after `max` warns in dev and makes nothing selectable |
| `disabled` | `DateRuleConfig \| DateRuleEngine` | — | Days that cannot be selected (rules or a precompiled `createDisabled` engine) |
| `exclude` | `DateRuleConfig \| DateRuleEngine` | — | Days excluded from emitted spans — business-day cuts (see [segments](#onchange-details-and-segments)) |
| `excludedEndpointPolicy` | `"snap-inward" \| "reject"` | `"snap-inward"` | What happens when a span endpoint is excluded |
| `readOnly` | `boolean` | `false` | Browsing stays enabled; value-mutating interactions are blocked |
| `deselectOnReclick` | `boolean` | `true` | Clicking the selected day deselects it. Set `false` to keep the selection |
| `withTime` | `boolean` | `false` | Selected values carry a time of day |
| `hour12` | `boolean` | `false` | 12-hour clock with AM/PM. Root-level so display and pickers never desync |
| `ampmLabels` | `{ am: string; pm: string }` | `AM`/`PM` | Localized period labels for `hour12` surfaces |
| `defaultTime` | `Partial<CalendarTime>` | midnight | Time applied to a freshly picked day (when `withTime`). Missing fields fill with `0` |
| `minTime`, `maxTime` | `Partial<CalendarTime>` | — | Inclusive selectable time-of-day window (when `withTime`) — applies to every day |
| `weekendDays` | `number[]` (0=Sun..6=Sat) | `[0, 6]` | Weekend columns for *highlighting only* (`data-weekend`). Presentational — use `disabled: { weekdays }` to actually block days |
| `minSpan`, `maxSpan` | `number` | — | Min/max span length in `unit`s (range modes) |
| `maxDates` | `number` | — | Cap on point selections (multiple mode). Over-cap clicks reject with `max-dates-reached` and cells signal `data-max-reached` |
| `maxRanges` | `number` | — | Cap on spans (multi-range mode) |
| `timeZone` | `string` | system zone | IANA name (`"Europe/Berlin"`) or `"UTC±N"` shorthand — see [Time zones](#time-zones--dst) |

`CalendarTime` is `{ hour, minute, second, ms }` (all numeric, wall-clock, no zone).

---

## Value shapes (`unit` × `mode`)

The public boundary speaks plain JS `Date`. The shape of `value` / `onChange` is fixed by **`unit` × `mode` alone** — `exclude`, `disabled`, `maxRanges` never change it, so you can type your handler from the props you pass, with no conditional unions:

| `unit` | `mode` | Value type |
|---|---|---|
| `day` | `single` | `Date \| null` |
| `day` | `multiple` | `Date[]` |
| `day` | `range` | `{ start: Date; end: Date } \| null` |
| `day` | `multi-range` | `{ start: Date; end: Date }[]` |
| `week` / `month` | `single` or `range` | `{ start: Date; end: Date } \| null` |
| `week` / `month` | `multiple` or `multi-range` | `{ start: Date; end: Date }[]` |

Rules the shape follows:

- **Empty is `null`** (or `[]` in the "many" cardinalities) — never an empty span.
- **`value` always carries the LOGICAL spans** — the user's anchor→end intent. Excluded days never split the emitted value; the segmented view rides in `details.segments`.
- **Range modes emit only complete spans.** The first click sets a silent pending anchor (no `onChange`); the second click completes the span and emits. Restarting a range emits `null` first, then the new complete span. There is never a partial `{ from, to: null }` value.
- The exact static type is available as `CalendarValue<U, M>`; the runtime union is `AnyCalendarValue = Date | null | Date[] | PublicRange | PublicRange[]`.

```tsx
// unit: "day", mode: "range"
const config = createCalendarConfig({ mode: "range" });

<Calendar
  config={config}
  onChange={(value, details) => {
    // value: { start: Date; end: Date } | null
    // details.reason: "select" | "clear" | "preset" | "time" | "remove" | "external-sync"
  }}
>
```

### `onChange` details and `segments`

The second argument to `onChange` is `CalendarChangeDetails`:

```ts
type CalendarChangeDetails = {
  segments?: { start: Date; end: Date }[];
  reason: "select" | "clear" | "preset" | "time" | "remove" | "external-sync";
};
```

- `reason` names the action that caused the commit: a grid/track/wheel pick is `"select"`, the Clear button is `"clear"`, a preset tile is `"preset"`, a time edit is `"time"`, removing a chip/range is `"remove"`.
- `segments` is present **only** when the selection is span-shaped **and** `exclude` or `disabled` rules are configured. It is the business-day view: every drawn span minus its excluded/disabled days, flattened into ordered contiguous segments. Consumers whose real value *is* the segment list (booking, business days) read this instead of `value`:

```tsx
const config = createCalendarConfig({
  mode: "range",
  exclude: { weekends: true },
});

<Calendar
  config={config}
  onChange={(value, { segments }) => {
    // value:    Mon 1 – Sun 14   (the logical span the user drew)
    // segments: [Mon 1–Fri 5, Mon 8–Fri 12]  (weekends cut out)
  }}
>
```

With no `exclude`/`disabled`, `segments` is absent — the common case allocates nothing.

---

## Controlled vs uncontrolled

**Uncontrolled**: omit `value`. Optionally seed with `defaultValue` (public `Date`-based shape). The store owns the selection; `onChange` observes.

```tsx
<Calendar config={config} defaultValue={new Date(2026, 6, 5)} onChange={log}>
```

**Controlled**: pass `value` (including `null` for "empty"). The host owns the selection:

```tsx
const [range, setRange] = useState<PublicRange | null>(null);
<Calendar config={config} value={range} onChange={(v) => setRange(v as PublicRange | null)}>
```

Semantics worth knowing:

- **Optimistic commit.** Interactions update the calendar's internal state immediately and then report through `onChange` — the UI never waits for the host to echo `value` back. A host that *ignores* a change will drift from the internal state; to veto a change, pass the previous `value` back and the calendar re-syncs to it.
- **Identity by `valueKey`, not reference.** The controlled adapter serializes `value` in the **calendar time zone** (`YYYY-MM-DD`, plus time only when `withTime`) and re-syncs the store only when that key changes. Passing a fresh-but-equal array/object each render never loops; array order does not matter (keys are sorted). DST shifts and host-zone vs calendar-zone differences can't cause phantom syncs, because identity is never a raw `getTime()` comparison.
- **A time-less config ignores time-of-day** in incoming `Date`s — `12:00` and `18:00` on the same calendar day are the same value.
- **External sync emits no `onChange`.** A `value` change from the host updates the UI without echoing.
- **Bad input never throws.** `Invalid Date`, wrong-shape entries, arrays in single mode — all degrade with a dev warning: invalid entries are dropped, a lone `Date` where a span is expected becomes a one-day span, an array in single mode collapses to its first valid entry.

---

## Modules

All modules are importable from the `/modules` barrel or (preferably) their own subpath. Shared conventions:

- `col?: number | string` — placement in the root grid.
- `className?: string` — extra class on the module container.
- `theme?: string` — per-module theme override (a built-in **name**; `data-theme` on the container). Custom token objects are root-only.
- `scheme?: "light" | "dark" | "auto"` — per-module scheme override.
- Per-module `on*Select` callbacks are **observational** — the root `onChange` remains the single source of the public value.
- aria strings resolve `module prop → root labels → English default` (see [Localization](#localization)).

### CalendarDays

`@dateforge/react-calendar/modules/days` — the month day grid.

| Prop | Type | Default | Description |
|---|---|---|---|
| `offset` | `number` | `0` | Months ahead of the root view this grid shows (multi-month boards) |
| `syncViewOnSelect` | `boolean` | `true` when `offset === 0`, else `false` | Move the root view to a clicked outside-month day. Offset grids default off so a side month never steals the primary view |
| `showOutsideDays` | `boolean` | `true` | Render leading/trailing days of neighbour months |
| `fixedWeeks` | `boolean` | `true` | Always render 6 weeks — stable height across months |
| `weekNumbers` | `boolean` | `false` | ISO 8601 week-number column |
| `weekLabel` | `string` | registry `week` | aria-label for the week-number column header |
| `hideWeekdays` | `boolean` | `false` | Hide the weekday header row |
| `weekdayFormat` | `"short" \| "narrow" \| "long"` | `"short"` | Weekday header style ("Mon" / "M" / "Monday") |
| `highlightWeekends` | `boolean` | `false` | Continuous background tint down the weekend columns |
| `weekendHeaders` | `boolean` | `true` | Tint + bold the weekend weekday headers |
| `boldWeekends` | `boolean` | `false` | Bold + weekend-ink day numbers |
| `todayDot` | `boolean` | `true`, but off when `renderDay` is set | Dot under today's number (`--c-todayDot`) |
| `highlightToday` | `boolean` | `false` | Subtle inset outline on today |
| `hideOutOfRange` | `boolean` | `false` | Render days outside the `min`/`max` window as blank cells. Rule-disabled days stay visible-but-disabled |
| `renderDay` | `(date, state) => ReactNode` | — | Custom day-cell content. The button shell, data attributes, keyboard and aria stay library-owned. Pass a **stable** reference — an inline closure re-renders all 42 cells every pass |
| `theme`, `scheme`, `col`, `className` | shared | — | |

`renderDay` receives a `DayRenderState` with plain booleans: `selected`, `inRange`, `rangeStart`, `rangeEnd`, `preview`, `today`, `outside`, `weekend`, `disabled`, `excluded`.

```tsx
<CalendarDays
  weekNumbers
  highlightWeekends
  renderDay={(date, s) => (
    <span style={{ opacity: s.outside ? 0.4 : 1 }}>{date.day}</span>
  )}
/>
```

Performance contract: each cell subscribes to its own packed flag bitmask, so a hover that moves the range preview re-renders only the two or three cells whose state actually changed.

#### Day cell `data-*` contract

Each day cell is a `<button role="gridcell" data-date="20260705">` (the numeric key is `year*10000 + month*100 + day`). State flags render as empty-string attributes when present, and are omitted entirely otherwise — so CSS selectors stay precise:

`data-selected`, `data-in-range`, `data-range-start`, `data-range-end`, `data-preview`, `data-preview-start`, `data-preview-end`, `data-disabled`, `data-excluded`, `data-today`, `data-outside`, `data-weekend`, `data-max-reached`.

`data-max-reached` appears on remaining selectable cells when `maxDates` is hit in multiple mode (not-allowed cursor + error-tint hover) — the pre-click affordance to the `max-dates-reached` rejection.

### CalendarMonthsGrid

`@dateforge/react-calendar/modules/months-grid` — 12-month tile grid for the viewed year. Clicking a month **navigates** the view (it does not select dates by itself — pair with `unit: "month"` and `onMonthSelect` for month selection, as the `MonthPicker` prebuilt does).

| Prop | Type | Default | Description |
|---|---|---|---|
| `short` | `boolean` | `true` | Short month names ("Jan"); aria stays long |
| `outOfRangeBehavior` | `"disable" \| "hide" \| "show"` | `"disable"` | Presentation of months fully outside `min`/`max` or fully rule-disabled |
| `onMonthSelect` | `(year, month) => void` | — | Observational; `month` is 1-based |
| `theme`, `scheme`, `col`, `className` | shared | — | |

`"disable"` greys out but keeps cells keyboard-reachable; `"hide"` removes them from layout and the a11y tree; `"show"` keeps them fully interactive (clicking only navigates — the core still guards actual date selection).

### CalendarYearsGrid

`@dateforge/react-calendar/modules/years-grid` — paged year tile grid.

| Prop | Type | Default | Description |
|---|---|---|---|
| `yearsPerPage` | `number` | `12` | Tiles per page (max 40) |
| `startYear` | `number` | — | First year of the initially shown page; paging/navigation take over after |
| `showControls` | `boolean` | `true` | Prev/next pager + live range label |
| `outOfRangeBehavior` | `"disable" \| "hide" \| "show"` | `"disable"` | Same enum as the months grid |
| `onYearSelect` | `(year) => void` | — | Observational |
| `theme`, `scheme`, `col`, `className` | shared | — | |

The pager clamps to the `min`/`max` window; if the view navigates outside the pinned page, the grid follows the view again.

### Toolbar

`@dateforge/react-calendar/modules/toolbar` — composable navigation primitives. There is no monolithic navbar: you arrange small parts inside a `CalendarToolbar` container (header, footer, sidebar, a day stepper — any layout).

Exports: `CalendarToolbar`, `CalendarToolbarGroup`, `CalendarToolbarPrev`, `CalendarToolbarNext`, `CalendarToolbarHome`, `CalendarToolbarLabel`, `CalendarToolbarMonthLabel`, `CalendarToolbarYearLabel`, `CalendarToolbarDayLabel`, `CalendarToolbarMonthTrigger`, `CalendarToolbarYearTrigger`, `CalendarToolbarClear`, `CalendarToolbarApply`, `CalendarToolbarClock`, `CalendarToolbarTime`, `CalendarToolbarThemeToggle`.

**Smart layout (default):** the toolbar is a wrapping flex row — parts keep their natural width (icons never shrink to slivers) and overflow WRAPS to the next line instead of pushing past the container. Each row distributes space-between (`justify` overrides); pin a group to an edge with `push` (`<CalendarToolbarGroup push="end">` = "actions right"). For precise tracks (a truncating middle label, equal halves) switch to the explicit grid with `cols` + `col`.

Conventions shared by every part:

- `col` places the part in the toolbar's own grid (when the toolbar has `cols`).
- Navigation parts **stay enabled under `readOnly`** — browsing never mutates the value. Value-mutating parts (Clear, Apply, bound editing, time) are disabled instead.
- Arrow keys move focus between the toolbar's enabled buttons; Home/End jump to the edges (WAI-ARIA toolbar pattern, RTL-aware).

#### `CalendarToolbar` (container)

| Prop | Type | Default | Description |
|---|---|---|---|
| `cols` | `number \| string` | — | Toolbar-internal grid columns (number → equal tracks, string → raw `grid-template-columns`) |
| `col` | `number \| string` | — | Placement in the parent Calendar grid |
| `justify` | CSS `justify-content` | — | Row justification |
| `label` | `string` | registry `calendarNavigation` | Accessible toolbar name |
| `offset` | `number` | `0` | Months ahead of the root view that every part inside displays/steps. Part-level `offset` **adds** to this |
| `bound` | `"from" \| "to"` | — | Span mode: every part inside displays and **edits** this range edge instead of the view (labels title the bound date; prev/next/home/triggers commit via `setBoundDate`). Per-part `bound` overrides (replaces, never combines) |
| `theme`, `scheme`, `className` | shared | — | |

`CalendarToolbarGroup` — visual grouping: `{ grow?: boolean; push?: "start" | "end"; col?; className? }`. `grow` claims the row's slack; `push` pins the group to a toolbar edge in the smart flex layout.

#### Prev / Next (`StepProps`)

| Prop | Type | Default | Description |
|---|---|---|---|
| `unit` | `"day" \| "month" \| "year"` | `"month"` | What one step covers |
| `target` | `"view" \| "selection"` | `"view"` | `"view"` pages the calendar; `"selection"` steps the **selected date itself** (a date spinner) — commits via `selectDay`, follows it into view, gated by `readOnly` and min/max. Point selections only; disabled until something is picked |
| `label` | `string` | registry `previousMonth`/`nextDay`/… per unit+direction | aria-label override |
| `bound` | `"from" \| "to"` | container | Step this range edge instead of paging the view. Gated by `readOnly`, min/max and range ordering |
| `col`, `className`, `children` | — | — | `children` replaces the chevron icon |

Arrows disable at the `min`/`max` window edges, gating on the **displayed** month (an offset toolbar stops when *its* month hits the edge).

#### `CalendarToolbarHome`

Jump the view to today's month (disabled while already shown, and until mounted — SSR-safe). In a bound toolbar it resets **this range edge** to today instead (gated by `readOnly`, min/max, ordering). Props: `label` (registry `home`), `col`, `offset`, `bound`, `className`, `children`.

#### Labels

All label parts are width-stable: an invisible sizer reserves the locale's longest rendering so stepping months never shifts the layout (CLS-free).

- **`CalendarToolbarLabel`** — live "Month Year" heading. Props: `options?: Intl.DateTimeFormatOptions`, `level?: 1..6` (default `2`, rendered as `role="heading"`), `col`, `offset`, `bound`, `className`, `children` (freeform title override).
- **`CalendarToolbarMonthLabel`** — month only. Props: `short?: boolean` (default `false`), `col`, `offset`, `bound`, `className`.
- **`CalendarToolbarYearLabel`** — year only. Props: `options?`, `col`, `offset`, `bound`, `className`.
- **`CalendarToolbarDayLabel`** — day number/date; pairs with `unit="day"` steppers. Props: `format?: "numeric" | "2-digit" | "long"` (default `"numeric"`), `source?: "view" | "selection"` (default `"view"`; with `"selection"` and nothing picked it shows `emptyText`), `emptyText?: string` (default `"—"`), `col`, `offset`, `bound`, `className`.

```tsx
// A single-date "spinner" toolbar
<CalendarToolbar>
  <CalendarToolbarPrev unit="day" target="selection" />
  <CalendarToolbarDayLabel source="selection" format="long" />
  <CalendarToolbarNext unit="day" target="selection" />
</CalendarToolbar>
```

#### Month / Year triggers

Buttons showing the current month/year that open a popup picker (a roving arrow-key tile grid by default; the year picker pages 12 years at a time). Picking navigates the view and closes. Popup state lives in UI context, never in the reducer.

Shared `TriggerProps`:

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | registry `changeMonth` / `changeYear` | Trigger aria-label |
| `compact` | `boolean` | `false` | Adds a chevron to the trigger |
| `bound` | `"from" \| "to"` | container | Edit this range edge instead of the view: the trigger shows the bound's month/year and picking commits via `setBoundDate` (day kept in-month; core owns ordering). Blocked by `readOnly` |
| `picker` | `ReactNode` | built-in grid | Replace the popup body — e.g. `picker={<CalendarMonthsWheel />}`. The wheel import is yours, so grid-only consumers never bundle drum physics |
| `pickerConfirm` | `boolean` | `true` | With a custom `picker`: stage picks in a draft and apply on the Confirm footer button (registry `confirm`). `false` = the picker commits live |
| `confirmLabel` | `string` | registry `confirm` | aria-label override for the Confirm button |
| `pickerReset` | `boolean` | `true` | "Now" reset in the custom-picker footer (registry `resetMonth`/`resetYear`), staged like any pick |
| `col`, `offset`, `className` | — | — | |

`CalendarToolbarMonthTrigger` additionally takes `short?: boolean` — force the short month name ("Jun"). A too-narrow toolbar auto-shortens anyway via container queries.

Triggers disable themselves when the `min`/`max` window pins a single month/year.

```tsx
import { CalendarMonthsWheel } from "@dateforge/react-calendar/modules/months-wheel";

<CalendarToolbarMonthTrigger picker={<CalendarMonthsWheel />} />
```

#### `CalendarToolbarClear` / `CalendarToolbarApply`

- **Clear** — clears the whole selection. Disabled when empty or `readOnly`. Props: `label` (registry `clear`), `col`, `className`, `children`.
- **Apply** — hands the current public value (same shape as root `onChange`) to a host callback: the "confirm" button of picker-in-popover UIs. Props: `onApply?: (value: AnyCalendarValue) => void`, `disabled?: boolean` (default: disabled when empty or `readOnly`), `label` (registry `apply`), `col`, `className`, `children`.

#### `CalendarToolbarClock`

Live wall-clock time, decorative (`aria-hidden`). Ticks aligned to the minute (or second) boundary. Props: `seconds?: boolean` (default `false`), `col`, `className`.

#### `CalendarToolbarTime`

A button showing the selected time that opens a time picker popup. Disabled until a date is selected (there is no time to edit yet) and under `readOnly`. `hour12`/`ampmLabels` come from the root config so display and picker never desync.

| Prop | Type | Default | Description |
|---|---|---|---|
| `compact` | `boolean` | `false` | Clock icon instead of the time text |
| `seconds` | `boolean` | `false` | Show/step seconds |
| `step` | `number` | `1` | Minute increment of the built-in stepper |
| `bound` | `"from" \| "to"` | container / `from` | Edit this range edge's time (span selections only) |
| `picker` | `ReactNode` | built-in steppers | Swap the popup body for a drum: `picker={<CalendarTimeWheel />}` |
| `pickerConfirm` | `boolean` | `true` | Stage wheel edits behind a Confirm button; the built-in steppers always commit live |
| `confirmLabel` | `string` | registry `confirm` | |
| `onTimeSelect` | `(time: CalendarTime) => void` | — | Observational; fires only for changes that actually committed |
| `label`, `col`, `className` | — | — | |

The built-in popup renders each unit as a WAI-ARIA `spinbutton` (Arrow/Home/End keyboard, mouse-only chevrons) plus an AM/PM toggle in 12h mode.

#### `CalendarToolbarThemeToggle`

Light/dark toggle. Flips the root `data-scheme`, resolving `"auto"` against the OS at flip time; `aria-pressed` reflects the resolved dark state and tracks OS changes live. Under a controlled `<Calendar scheme onSchemeChange>` the flip calls the host instead. Props: `label` (registry `themeSwitchToLight`/`themeSwitchToDark`), `col`, `className`, `children`.

### CalendarTimeWheel

`@dateforge/react-calendar/modules/time` — drum-style (physics) time picker.

| Prop | Type | Default | Description |
|---|---|---|---|
| `bound` | `"from" \| "to"` | — | Range mode only: edit `fromTime`/`toTime` instead of the point selection's time |
| `hour12` | `boolean` | `false` | 12-hour drums with an AM/PM switch |
| `seconds` | `boolean` | `false` | Render the seconds drum |
| `step` | `{ hour?; minute?; second? }` | `1` each | Per-field increment |
| `labels` | `"short" \| "long"` | — | Small label above each drum (HH/MM/SS or localized) |
| `showBoundDate` | `boolean` | `true` | Localized date header above the drums for the bound's current date (requires `bound`; hidden while the range is empty) |
| `showReset` | `boolean` | `false` | "Now" button below the drums — sets the fields to the current time |
| `resetLabel` | `ReactNode` | localized "now" | Reset button content |
| `resetTimeLabel` | `string` | registry `resetTime` | Reset aria-label template |
| `hoursLabel`, `minutesLabel`, `secondsLabel`, `timePeriodLabel`, `timePickerLabel` | `string` | registry keys | Per-module aria overrides |
| `onTimeSelect` | `(time: CalendarTime) => void` | — | Observational; fires only after a commit actually lands (walls/validation may reject) |
| `theme`, `scheme`, `col`, `className` | shared | — | |

Behavior notes:

- **Time-only picker flow**: in single mode, editing time with an empty selection auto-creates a selection on the view anchor — a bare `<CalendarTimeWheel />` inside `<Calendar>` is a working time picker.
- **Span modes need a drawn range first**: without one, the wheel renders read-only.
- **Drum walls**: for a same-day range, the from-wheel physically cannot pass the to-time (and vice versa); a `minTime`/`maxTime` window also becomes walls. 24h drums turn finite at walls; 12h drums stay circular (the AM/PM wrap breaks contiguity) and clamp each commit instead. The core validates regardless — walls are the affordance.
- Inside a `pickerConfirm` trigger popup, the wheel edits a draft; the time lands only when Confirm applies it.

### CalendarMonthsWheel

`@dateforge/react-calendar/modules/months-wheel` — month drum. Spinning navigates the view (circular).

| Prop | Type | Default | Description |
|---|---|---|---|
| `shortMonths` | `boolean` | `false` | Short names in the drum; aria stays long |
| `showLabel` | `boolean` | `false` | Small localized "Month" label above the drum |
| `showReset` | `boolean` | `false` | Reset button — navigates back to the current month |
| `resetLabel` | `ReactNode` | localized current month | |
| `resetMonthLabel` | `string` | registry `resetMonth` | |
| `monthsLabel` | `string` | localized "Month" | Drum aria-label |
| `monthPickerLabel` | `string` | registry `monthPicker` | Group aria-label |
| `bound` | `"from" \| "to"` | — | Edit a range bound's month instead of the view (commits via `setBoundDate`, day clamped in-month) |
| `showBoundDate` | `boolean` | `true` | Bound-mode date header |
| `onMonthSelect` | `(year, month) => void` | — | Observational |
| `theme`, `scheme`, `col`, `className` | shared | — | |

### CalendarYearsWheel

`@dateforge/react-calendar/modules/years-wheel` — year drum. Finite window: `config.min/max` years, or 1900–2100 by default.

Props are the year-flavored mirror of the months wheel: `showLabel`, `showReset`, `resetLabel`, `resetYearLabel` (registry `resetYear`), `yearsLabel`, `yearPickerLabel` (registry `yearPicker`), `bound`, `showBoundDate` (default `true`), `onYearSelect: (year) => void`, plus the shared `theme` / `scheme` / `col` / `className`.

Both wheels work inside toolbar triggers as `picker` bodies — staged behind Confirm by default.

### CalendarDaysTrack

`@dateforge/react-calendar/modules/days-track` — the view month's days as a horizontal physics track (inertia + snap). Landing on a day navigates the view; in single mode it also commits the date (a day picker). Circular; clamps to `min`/`max` within the month.

| Prop | Type | Default | Description |
|---|---|---|---|
| `showMonthLabel` | `boolean` | `false` | Short month name as a sub-label on the active day |
| `bound` | `"from" \| "to"` | — | Edit a range bound's day. The **opposite bound walls the track** within the same month, so from can't scroll past to |
| `onDaySelect` | `(year, month, day) => void` | — | Observational |
| `theme`, `scheme`, `col`, `className` | shared | — | |

In **multiple** mode the track is a cursor, not a picker: it only moves, and a confirm overlay on the centred day toggles it into the selection (check to add, cross to remove) — auto-committing every landed day would carpet the month.

### CalendarMonthsTrack

`@dateforge/react-calendar/modules/months-track` — months as a horizontal track. Landing on a month navigates the view. Circular; clamps to `min`/`max` within the year.

| Prop | Type | Default | Description |
|---|---|---|---|
| `short` | `boolean` | `true` | Short month names |
| `showYearLabel` | `boolean` | `false` | Year as a sub-label on the active month |
| `bound` | `"from" \| "to"` | — | Edit a range bound's month |
| `onMonthSelect` | `(year, month) => void` | — | Observational |
| `theme`, `scheme`, `col`, `className` | shared | — | |

### CalendarYearsTrack

`@dateforge/react-calendar/modules/years-track` — years as a horizontal track. Finite (non-circular).

| Prop | Type | Default | Description |
|---|---|---|---|
| `minYear`, `maxYear` | `number` | `config.min/max` year, else 1900–2100 | Track window |
| `bound` | `"from" \| "to"` | — | Edit a range bound's year |
| `onYearSelect` | `(year) => void` | — | Observational |
| `theme`, `scheme`, `col`, `className` | shared | — | |

All tracks are WAI-ARIA sliders: focusable, Arrow keys step, PageUp/PageDown jump (7 days / 10 years), with localized `aria-valuetext`.

### CalendarManualInput

`@dateforge/react-calendar/modules/manual-input` — masked, keyboard-first typed date entry. Auto-commits as soon as the typed date is complete and valid; invalid/blocked dates mark the field `aria-invalid` + `data-invalid` without committing.

| Prop | Type | Default | Description |
|---|---|---|---|
| `format` | `string` | `"DD.MM.YYYY"` | Token string with `DD`, `MM`, `YYYY` and single-char separators (`"MM/DD/YYYY"`, `"YYYY-MM-DD"`). Also the default placeholder |
| `placeholder` | `string` | = `format` | |
| `bound` | `"from" \| "to"` | `"from"` | Span modes: which bound this input edits. Two inputs compose a from—to row. Ignored for point selections |
| `label` | `ReactNode` | — | Visible label before the input (wired via `htmlFor`) |
| `inputLabel` | `string` | registry `manualInput` (points) / `rangeFrom`/`rangeTo` (spans) | aria-label when no visible label |
| `allowClear` | `boolean` | `false` | Clear (×) button inside the input; clears the whole selection |
| `clearLabel` | `string` | registry `clear` | |
| `align` | `"left" \| "center" \| "right"` | `"left"` | Row alignment |
| `theme`, `scheme`, `col`, `className` | shared | — | |

Keyboard: digits fill through the mask; **ArrowUp/ArrowDown step the segment under the caret** (day/month/year, seeded from today when empty); **Escape** clears; **Backspace** over a separator eats it together with the preceding digit.

**Multiple mode — add box.** The input never mirrors a picked date: each complete entry appends to the selection and the field resets for the next one; at `maxDates` the box disables. Compose it with the chip list:

```tsx
const config = createCalendarConfig({ mode: "multiple", maxDates: 5 });

<Calendar config={config}>
  <CalendarManualInput allowClear />
  <CalendarSelectedDates allowClearPerChip />
  <CalendarDays />
</Calendar>
```

### CalendarPresets

`@dateforge/react-calendar/modules/presets` — quick-pick tiles. Renders nothing with an empty list.

| Prop | Type | Default | Description |
|---|---|---|---|
| `presets` | `(Preset \| PresetInput)[]` | `[]` | Declarative shorthands and/or compiled resolvers, mixed freely with the built-in packs |
| `theme`, `scheme`, `col`, `className` | shared | — | |

Tiles carry `data-preset-id`, `data-status` (`ok` / `incompatible` / `disabled` / `empty`) and `data-active`. Clicking an active preset clears the selection; incompatible (wrong mode) and blocked (disabled/min/max) presets render disabled. Roving arrow-key focus. See [Presets](#presets) for authoring.

### CalendarSelectedDates

`@dateforge/react-calendar/modules/selected-dates` — the current selection as chips (points) or from–to chip pairs (spans). Renders nothing when empty.

| Prop | Type | Default | Description |
|---|---|---|---|
| `allowClear` | `boolean` | `false` | Clear-all button |
| `allowClearPerChip` | `boolean` | `false` | Per-chip remove (×) — removes one date (multiple) or one range (multi-range) |
| `allowNavigate` | `boolean` | `true` | Clicking a chip navigates the view to that date |
| `showTime` | `boolean` | `false` | Append the time to each chip label |
| `maxVisibleChips` | `number` | — | Collapse after N chips behind an expanding "+{count}" chip |
| `overflowLabel` | `string` | `"+{count}"` | Overflow chip text; `{count}` interpolates |
| `align` | `"left" \| "center" \| "right"` | `"left"` | |
| `clearLabel`, `removeDateLabel`, `removeRangeStartLabel`, `removeRangeEndLabel` | `string` | registry keys | Per-module aria overrides |
| `theme`, `scheme`, `col`, `className` | shared | — | |

### CalendarInfo

`@dateforge/react-calendar/modules/info` — human-readable selection summary + optional actions. Renders nothing when there is nothing to show.

| Prop | Type | Default | Description |
|---|---|---|---|
| `allowClear` | `boolean` | `false` | Clear (×) action when something is selected |
| `showHome` | `boolean` | `false` | "Jump to current month" action |
| `emptyLabel` | `ReactNode` | — | Placeholder while nothing is selected |
| `formatter` | `(value: AnyCalendarValue) => ReactNode` | — | Custom summary renderer. Receives the **public value** — the exact shape root `onChange` emits |
| `showRelative` | `boolean` | `false` | Relative line under the summary ("in 5 days", "yesterday" — `Intl.RelativeTimeFormat`) |
| `rangeStyle` | `"days" \| "duration"` | `"days"` | Range summary: whole days, or days+hours+minutes duration (uses the range time bounds) |
| `showSummary` | `boolean` | `true` | Toggle the built-in text (actions stay) |
| `align` | `"left" \| "center" \| "right"` | `"left"` | |
| `prefix` | `ReactNode` | — | Node before the summary text (icon, label) |
| `clearLabel`, `homeLabel` | `string` | registry keys | |
| `theme`, `scheme`, `col`, `className` | shared | — | |

The text block is a polite `role="status"` live region; the action pair supports roving arrow-key focus, and clearing hands focus to the remaining action instead of dropping it.

### CalendarLunar

`@dateforge/react-calendar/modules/lunar` — moon-phase strip around the selection anchor (first selected date → range end → range start → the viewed day). Renders 21 cells; container queries reveal the symmetric subset that fits.

| Prop | Type | Default | Description |
|---|---|---|---|
| `lunarLabel` | `string` | registry `lunar` | Strip aria-label |
| `phaseLabels` | `false \| Partial<Record<LunarPhaseKey, string>>` | NASA-style abbreviations | Short visible phase labels; partial map to localize, `false` to hide |
| `phaseAriaLabels` | `Partial<Record<LunarPhaseKey, string>>` | long English names | Per-cell aria names |
| `theme`, `scheme`, `col`, `className` | shared | — | |

The lunar bundle also exports the math for standalone use: `getLunarPhaseKey`, `getLunarPhaseIndex`, `getLunarFraction`, `getLunarIllumination`, `buildLunarWindow`, `LUNAR_PHASE_KEYS`, `LUNAR_PHASE_ABBR`, `LUNAR_PHASE_LONG`, plus the `LunarPhaseKey` / `LunarPhaseIndex` types.

---

## Presets

Presets turn named shortcuts ("Today", "Last 7 days") into candidate selection values. They never bypass validation: applying a preset goes through the same strategy as a manual pick, so `disabled`, `min`/`max`, and span limits all hold. Presets **never throw** — malformed entries, duplicate ids and throwing resolvers degrade with one dev warning each.

### Built-in packs

```tsx
import { commonPresets, relativePresets } from "@dateforge/react-calendar";
import { CalendarPresets } from "@dateforge/react-calendar/modules/presets";

<CalendarPresets presets={commonPresets} />
```

- `commonPresets` — `presetToday`, `presetThisWeek`, `presetLast7Days`, `presetThisMonth` (range-ish set).
- `relativePresets` — single-date quick-picks past→future: `presetLastYear`, `presetLastMonth`, `presetLastWeek`, `presetYesterday`, `presetToday`, `presetTomorrow`, `presetNextWeek`, `presetNextMonth`, `presetNextYear`.

Every individual preset is also exported. Pack labels localize automatically via `Intl.RelativeTimeFormat` in the calendar locale ("Вчера", "Nächsten Monat", …).

### Declarative authoring — `definePreset` / `PresetInput`

`CalendarPresets` accepts the declarative form directly; `definePreset(input)` compiles one explicitly.

```ts
type PresetInput = {
  id?: string;                    // derived from a string label when omitted
  label: string | ((locale: string) => string);
  group?: string;
  modes?: SelectionMode[];        // which modes offer it (else inferred from the result kind)
  value?: number | Date;          // day offset from today, or a fixed wall-clock Date
  range?: number;                 // span length in days after `value` → makes it a range
  getValue?: (ctx: { now: Date }) => Date | { from: Date; to: Date } | null;
};
```

```tsx
<CalendarPresets
  presets={[
    { label: "Today", value: 0 },
    { label: "In 3 days", value: 3 },
    { label: "Last 7 days", value: -6, range: 6 },
    { label: "New Year", value: new Date(2027, 0, 1) },
    { label: "Start of month", getValue: ({ now }) => new Date(now.getFullYear(), now.getMonth(), 1) },
  ]}
/>
```

### Full resolver form — `Preset`

```ts
type Preset = {
  id: string;                                   // stable identity (React key, telemetry)
  label?: string | ((locale: string) => string);
  group?: string;                               // sectioned lists
  resolve: (ctx: { today: CalendarDate; firstDayOfWeek: number }) =>
    | { kind: "date"; date: CalendarDate }
    | { kind: "dates"; dates: CalendarDate[] }
    | { kind: "range"; range: { start: CalendarDate; end: CalendarDate } }
    | null;                                     // null = does not apply right now
  modes?: SelectionMode[];                      // default inferred: date → single/multiple,
                                                // dates → multiple, range → range/multi-range
};
```

Engine-level helpers exported from the root: `compilePresets(presets)` (dedupe + `evaluate`/`groups` queries), `resolvePresetLabel(preset, locale)`, and the `EvaluatedPreset` / `PresetStatus` (`"ok" | "incompatible" | "disabled" | "empty"`) / `PresetValidationContext` types.

---

## Disabled and excluded dates

One rule engine serves two props with different meanings:

- **`disabled`** — days that cannot be selected at all. A user-drawn day range can never contain a disabled day (the pick is rejected with `range-crosses-disabled`).
- **`exclude`** — days skipped **inside** a span: the logical span survives in `value`, the business-day cut rides in `details.segments`. `excludedEndpointPolicy` decides what happens when a span endpoint itself is excluded: `"snap-inward"` (default) moves it to the nearest included day; `"reject"` refuses the pick.

Rule config (`DateRuleConfig`) — all fields optional, combined with OR:

| Rule | Type | Matches |
|---|---|---|
| `all` | `boolean` | every day |
| `weekends` | `boolean` | Saturday and Sunday |
| `weekdays` | `number[]` (0=Sun..6=Sat) | those weekdays |
| `before` | `Date \| CalendarDate` | days strictly before (also implies a lower view limit) |
| `after` | `Date \| CalendarDate` | days strictly after (also implies an upper view limit) |
| `dates` | `(Date \| CalendarDate)[]` | those exact days |
| `ranges` | `({ start, end } \| { from, to })[]` | days inside any span — both spellings accepted |
| `predicate` | `(date: CalendarDate) => boolean` | anything — evaluated last, never indexed |

```tsx
import { createDisabled } from "@dateforge/react-calendar";

const config = createCalendarConfig({
  disabled: createDisabled({
    weekends: true,
    dates: [new Date(2026, 11, 25)],
    ranges: [{ from: new Date(2026, 6, 1), to: new Date(2026, 6, 14) }],
  }),
  exclude: { weekdays: [3] }, // plain configs compile automatically too
});
```

`createDisabled` is an alias of `compileDateRules` — both are exported. Passing a plain config object to `disabled`/`exclude` compiles it for you; precompile when sharing one engine across configs. Malformed entries (Invalid Date, missing bounds) are skipped with a dev warning — never a throw. The compiled `DateRuleEngine` exposes `matches(date, weekday?)` (allocation-free hot path), `isEmpty`, `getReason(date)` (`"all" | "weekday" | "date" | "before" | "after" | "range" | "predicate"`), and `limits`.

---

## Time

Enable with `withTime: true` in the config. The value's `Date`s then carry a wall-clock time (resolved through the calendar zone); without `withTime` everything is midnight and time-of-day in inputs is ignored.

- **`defaultTime`** — applied to a freshly picked day (clamped into the time window).
- **`minTime` / `maxTime`** — an inclusive time-of-day window applied to *every* day. Out-of-window `setTime` rejects (`time-before-min` / `time-after-max`); time surfaces gate their steppers and drum walls to the window.
- **`hour12` + `ampmLabels`** — root-level 12-hour display so the toolbar time trigger, wheels and any picker agree; `ampmLabels` localizes the period.
- **Bound editing** — in range modes each edge has its own time: `CalendarTimeWheel bound="from"`, `CalendarToolbarTime bound="to"`, etc. For a same-day range the core keeps `fromTime ≤ toTime` (`time-out-of-order` on violation) and the drums wall physically.
- **Time-only picker** — in single mode, a time edit with an empty selection auto-creates the selection on the view anchor, so a lone `<CalendarTimeWheel />` works.
- Root `onChange` fires with `reason: "time"` on time edits.

```tsx
const config = createCalendarConfig({
  mode: "range",
  withTime: true,
  hour12: true,
  defaultTime: { hour: 9 },
  minTime: { hour: 8 },
  maxTime: { hour: 20 },
});

<Calendar config={config} cols={2}>
  <CalendarDays />
  <CalendarTimeWheel bound="from" col={1} />
  <CalendarTimeWheel bound="to" col={1} />
</Calendar>
```

---

## Time zones & DST

`timeZone` fixes what "today" means and how public `Date`s convert to and from wall-clock calendar days. Omit it to use the system zone.

- **Accepted forms**: any IANA name (`"Asia/Tokyo"`), `"UTC"`, and the `"UTC±N"` shorthand — normalized internally to the equivalent `Etc/GMT∓N` zone (note POSIX's inverted sign: `UTC+3` → `Etc/GMT-3`). An unknown zone degrades to the system zone with one dev warning — never a throw.
- **All calendar math is wall-clock.** Internally days are pure `{ year, month, day }` structs; the JS `Date` conversion happens only at the public boundary, in the configured zone.
- **DST is resolved by explicit policy** at the conversion boundary:
  - Nonexistent local times (spring-forward gap): `"next-valid"` (default) jumps forward over the gap, `"previous-valid"` stays before it, `"reject"` refuses.
  - Ambiguous local times (fall-back fold): `"earlier"` (default) or `"later"`.
  - Emission (`onChange` values) uses the defaults, which never reject.
- **Controlled identity is DST-proof**: `valueKey` serializes in the calendar zone, so a DST shift in the host zone can't trigger a phantom re-sync.

---

## Theming

Two orthogonal axes:

- **Theme** = colors (`--c-*` tokens). Every theme is a **family** with light + dark variants.
- **Appearance** = shape/spacing/motion/typography (`--cal-*` tokens).

### Built-in theme families (28)

`abyss`, `aurora`, `bauhaus`, `chalk`, `crimson`, `cyber`, `dracula`, `eclipse`, `espresso`, `fjord`, `graphite`, `industrial`, `meadow`, `mint`, `monsoon`, `nebula`, `neon`, `noir` (the default), `pearl`, `prism`, `riso`, `sandstone`, `slate`, `snow`, `solar`, `split`, `temporal`, `velvet`.

Two ways to use one:

```tsx
// String form — rides the generated stylesheet (all themes available at runtime)
<Calendar theme="dracula" />

// Object form — tree-shakes to a single theme
import { dracula } from "@dateforge/react-calendar/themes";
<Calendar theme={dracula} />
```

The `/themes` barrel also exports `THEMES: Record<string, ThemeFamily>`.

Every built-in family passes the generator's WCAG contrast audit: `text`/`backdrop` and `activeText`/`accent` at AA for text, and the low-emphasis inks — `mutedText`, `outOfMonth` and `disabledText` against `backdrop` — at 3:1 minimum, in both light and dark variants.

### `scheme` — light/dark

`scheme="auto"` (default) follows the OS via CSS `color-scheme` + `light-dark()` — the server-rendered first paint is already correct, no flash. `"light"`/`"dark"` pin a side. Uncontrolled, the `CalendarToolbarThemeToggle` flips it internally; pass `scheme` + `onSchemeChange` to own it:

```tsx
const [scheme, setScheme] = useState<"light" | "dark" | "auto">("auto");
<Calendar scheme={scheme} onSchemeChange={setScheme}>
  <CalendarToolbar><CalendarToolbarThemeToggle /></CalendarToolbar>
  <CalendarDays />
</Calendar>
```

### `createTheme`

Build a custom family. Top-level tokens are shared between the modes; `light` / `dark` override per side. When you give an `accent` without companions, legible ones are derived (WCAG-driven `activeText`, an accent-alpha `shadow`, `focusRing` = accent).

```tsx
import { createTheme } from "@dateforge/react-calendar";

const teal = createTheme({
  accent: "#14b8a6",
  range: "#0ea5e9",
  weekend: "#be123c",
  light: { backdrop: "#f0fdff" },
  dark: { backdrop: "#061a1d", text: "#e6fffb" },
});

<Calendar theme={teal} />
```

Token contract (`ThemeTokens` → CSS var):

| Token | CSS var | Role |
|---|---|---|
| `accent` | `--c-accent` | Brand color: selected cells, active drum items |
| `activeText` | `--c-activeText` | Ink on top of `accent` |
| `todayDot` | `--c-todayDot` | Today marker |
| `backdrop` | `--c-backdrop` | Root shell background |
| `tone` | `--c-tone` | Subtle surface: hovers, secondary chips |
| `text` | `--c-text` | Main ink |
| `stroke` | `--c-stroke` | Borders and separators |
| `shadow` | `--c-shadow` | Shadow color (usually accent at low alpha) |
| `disabled` | `--c-disabled` | Disabled surface. Disabled controls (buttons, tiles, day cells) render their background as a 10% `color-mix` tint of this token, so a saturated `disabled` reads as a whisper, not a slab |
| `mutedText` | `--c-mutedText` | Secondary ink |
| `disabledText` | `--c-disabledText` | Disabled ink |
| `weekend` | `--c-weekend` | Weekend ink; surfaces derive tints from it |
| `range` | `--c-range` | Range fill |
| `error` | `--c-error` | Validation/error ink |
| `outOfMonth` (opt) | `--c-outOfMonth` | Ink for days outside the viewed month |
| `focusRing` (opt) | `--c-focusRing` | Focus outline ink |

### `gradient`

`<Calendar gradient>` turns on the decorative mode: soft accent glows in two shell corners and a light accent-gradient fill on selected cells (via the `--cal-selected-*` indirection). Pure CSS `color-mix` on theme tokens — follows every theme and both schemes.

### Appearances

Built-in (8): `zenith`, `airy`, `bubble`, `compact`, `loft`, `press`, `soft`, `square`. Omit the prop for the v3 default look.

```tsx
// String form (resolved via the appearances stylesheet)
<Calendar appearance="zenith" />

// Object form (self-contained inline vars, tree-shakeable)
import { loft } from "@dateforge/react-calendar/appearances";
<Calendar appearance={loft} />

// Custom
import { createAppearance } from "@dateforge/react-calendar";
const tight = createAppearance({ radius: "0.25em", spacing: "0.4em" });
<Calendar appearance={tight} />
```

`AppearanceTokens` keys (each maps to a `--cal-*` var): `radius`, `containerRadius`, `border`, `containerGap`, `spacing`, `shadowSm`, `shadowMd`, `shadowLg`, `transition`, `easing`, `font`, `fontSize`, `dayFontSize`, `dayWeight`, `dayHeight`, `daysGap`, `daysPadding`, `popupPadding`, `chipSize`, `controlPadding`, `controlBorder`, `controlWeight`, `pressScale` (the `:active` squish scale), `tilePadding`, `opacityDisabled`, `opacityMuted`, `opacityHover`, `letterSpacing`. All partial — unknown keys are ignored, never a throw.

### The layer cascade

All styles land in a declared-once `@layer` order:

```
@layer cal-base, cal-themes, cal-appearances, cal-modules, cal-user;
```

- `cal-base` — reset, neutral token defaults, the shell, popup, focus ring, RTL mirroring.
- `cal-themes` / `cal-appearances` — generated token sets.
- `cal-modules` — per-module styles.
- **`cal-user`** — empty, reserved for you. Anything you put there beats every library rule without specificity wars:

```css
@layer cal-user {
  [data-dateforge-days] [data-selected] {
    border-radius: 50%;
  }
  [data-dateforge-root][data-theme="noir"] {
    --c-accent: rebeccapurple;
  }
}
```

The library uses zero `!important`, so plain (unlayered) user CSS also wins by default.

### Styling hooks — `data-*` map

| Surface | Attribute |
|---|---|
| Root shell | `data-dateforge-root`, plus `data-theme`, `data-appearance`, `data-scheme`, `data-gradient`, `data-readonly` |
| Popups (portalled to `<body>`) | `data-dateforge-popup` (re-declares theme/scheme/appearance) |
| Day grid | `data-dateforge-days`, header cells `data-weekday` (+`data-weekend`), option flags `data-week-numbers`, `data-weekend-tint`, `data-weekend-headers`, `data-bold-weekends`, `data-today-dot`, `data-today-outline` |
| Day cells | `data-date="YYYYMMDD"` + the [flag contract](#day-cell-data--contract) |
| Toolbar | `data-dateforge-toolbar`; parts: `data-toolbar-prev/next/home/label/month-label/year-label/day-label/month-trigger/year-trigger/clear/apply/clock/time/theme-toggle` |
| Other modules | `data-dateforge-months-grid`, `-years-grid`, `-time`, `-months-wheel`, `-years-wheel`, `-presets`, `-selected-dates`, `-info`, `-manual-input`, `-lunar`, tracks via `data-area="days-track"` etc. |

Container queries: the root registers `@container cal-root` (and the toolbar its own container), so modules adapt to the calendar's width, not the viewport.

---

## Localization

- **`locale`** (config) drives every formatted string — month/weekday names, digits, relative labels, preset pack labels — via `Intl`. Week start derives from the locale unless `firstDayOfWeek` overrides.
- **The label registry** covers everything `Intl` cannot: aria strings and the few visible UI words. Resolution order: **module prop → root `labels` → English default**. Placeholders interpolate with `{name}` syntax.

```tsx
<Calendar
  config={config}
  labels={{
    previousMonth: "Vorheriger Monat",
    nextMonth: "Nächster Monat",
    clear: "Löschen",
    announceSelected: "Ausgewählt: {value}",
  }}
>
```

Full key list (`LabelKey`), with defaults:

| Key | Default |
|---|---|
| `announceCleared` | `Selection cleared` |
| `announceSelected` | `Selected: {value}` |
| `apply` | `Apply` |
| `calendarNavigation` | `Calendar navigation` |
| `changeMonth` | `Change month, currently {month}` |
| `changeTime` | `Change time, currently {time}` |
| `changeYear` | `Change year, currently {year}` |
| `clear` | `Clear` |
| `confirm` | `Confirm` |
| `currentDay` | `Current day, {day}` |
| `currentMonth` | `Current month, {month}` |
| `currentYear` | `Current year, {year}` |
| `dayTrack` | `Day` |
| `home` | `Go to current month` |
| `hours` | `Hours` |
| `infoRanges` | `{count} ranges` |
| `lunar` | `Lunar phases` |
| `manualInput` | `Date` |
| `minutes` | `Minutes` |
| `monthGrid` | `Select month, {year}` |
| `monthPicker` | `Month picker` |
| `monthSelected` | `{month}, selected` |
| `monthTrack` | `Month` |
| `nextDay` / `nextMonth` / `nextYear` / `nextYears` | `Next day` / `Next month` / `Next year` / `Next years` |
| `noDate` | `No date selected` |
| `previousDay` / `previousMonth` / `previousYear` / `previousYears` | `Previous day` / `Previous month` / `Previous year` / `Previous years` |
| `rangeFrom` / `rangeTo` | `Start date` / `End date` |
| `remove` | `Remove` |
| `removeRangeEnd` / `removeRangeStart` | `Remove range end` / `Remove range start` |
| `removeSelectedDate` | `Remove selected date` |
| `resetMonth` / `resetTime` / `resetYear` | `Reset to {month}` / `Reset to {time}` / `Reset to {year}` |
| `saveSelectedDate` | `Save selected date` |
| `seconds` | `Seconds` |
| `selectMonth` / `selectTime` / `selectYear` | `Select month` / `Select time` / `Select year` |
| `showMoreSelectedDates` | `Show {count} more selected dates` |
| `themeSwitchToDark` / `themeSwitchToLight` / `themeToggle` | `Switch to dark mode` / `Switch to light mode` / `Toggle theme` |
| `timePeriod` | `Time period, currently {period}` |
| `timePicker` | `Time picker` |
| `week` | `Week` |
| `yearGrid` | `Select year, showing {from} to {to}` |
| `yearPageNavigation` | `Year page navigation` |
| `yearPicker` | `Year picker` |
| `yearSelected` | `{year}, selected` |
| `yearTrack` | `Year` |

### RTL

The calendar is RTL-ready via CSS logical properties. It deliberately does **not** set `dir` itself — it inherits from the document or any ancestor (`<html dir="rtl">`, or `dir` on a wrapper). Direction-bearing chevrons mirror automatically (`data-flip-rtl`), including inside portalled popups; toolbar arrow-key navigation is direction-aware.

---

## Accessibility

Roles and patterns:

- Day grid: `role="grid"` / `row` / `columnheader` / `gridcell` buttons, roving tabindex (one tab stop), full localized `aria-label` per day cell, `aria-selected`, `aria-disabled`, `aria-current="date"` on today.
- Toolbar: `role="toolbar"` with arrow-key movement; the live title is a `role="heading"`.
- Month/year pickers, presets, tile grids: roving arrow-key focus.
- Time steppers and drums: WAI-ARIA `spinbutton`s (`aria-valuenow/-min/-max/-text`).
- Tracks: `slider` semantics with localized `aria-valuetext`.
- Popups: `role="dialog"`, focus-trapped, Escape and outside-click close, focus returns to the trigger.

Keyboard map (day grid):

| Key | Action |
|---|---|
| `←` / `→` | ±1 day |
| `↑` / `↓` | ±1 week |
| `Home` / `End` | start / end of week (respects `firstDayOfWeek`) |
| `PageUp` / `PageDown` | ±1 month |
| `Shift+PageUp` / `Shift+PageDown` | ±1 year |
| `Enter` / `Space` | select the focused day |

Moving past the visible month navigates the view. `initialFocus` controls whether mount focuses a day (default: never steal focus).

**aria-live announcer**: the root mounts a permanent off-screen `role="status"` region announcing committed changes — a picked date, a completed range ("Selected: July 5, 2026"), or "Selection cleared" (`announceSelected` / `announceCleared` keys). Hover, focus moves and the pending range anchor never chatter.

**Contrast (WCAG)**: the theme generator audits every built-in family in both schemes — primary text at AA, and the low-emphasis inks (`mutedText`, `outOfMonth`/`backdrop`, `disabledText`/`backdrop`) at a 3:1 floor, so out-of-month and disabled days stay readable, not just present. Disabled controls keep their ink on a near-backdrop surface (a 10% `color-mix` tint of `--c-disabled`) rather than a heavy fill, which preserves that ratio across themes. `createTheme` derives an AA-legible `activeText` when you only supply `accent`. The focus ring is themable (`focusRing` token) and applied through `:focus-visible` everywhere.

---

## SSR

Server rendering (Next.js, Remix, …) works out of the box:

- **No environment reads at render.** "Today"-dependent UI (Home buttons, wheel resets, clocks) resolves after mount via the exported `useToday()` hook (`null` on the server → resolved `Date` after hydration), so server and client markup match.
- **`scheme="auto"` is CSS-native**: `color-scheme` + `light-dark()` decide on first paint without JS — dark systems never flash light.
- **No focus stealing** on mount unless you opt in with `initialFocus`.
- For a controlled calendar seeded with "today", use `useToday()` instead of `new Date()` — a server/client timestamp mismatch across midnight would otherwise select two different days and break hydration.

```tsx
import { useToday } from "@dateforge/react-calendar";

const today = useToday();               // null on the server
const [date, setDate] = useState<Date | null>(null);
useEffect(() => { if (today && !date) setDate(today); }, [today]);
```

---

## Validation & dev warnings

### Transient rejections — `onValidationReject`

Rejected actions (clicking a disabled day, exceeding a cap, an out-of-order time…) do not change state; they surface once through `onValidationReject(result)`:

```ts
type ValidationResult =
  | { ok: true }
  | { ok: false; reason: ValidationReason; messageKey?: LabelKey; params?: LabelParams };

type ValidationReason =
  | "disabled" | "before-min" | "after-max"
  | "range-too-short" | "range-too-long" | "range-crosses-disabled"
  | "max-dates-reached" | "max-ranges-reached"
  | "malformed-input" | "ambiguous-time" | "nonexistent-time"
  | "time-before-min" | "time-after-max" | "time-out-of-order"
  | "range-out-of-order" | "empty-after-exclude" | "read-only";
```

For custom modules, `customScope(id)` brands a namespaced validation scope (`custom:<id>`); the built-in scopes are `manualInput`, `time`, `time.from`, `time.to`, `date`, `range`, `range.from`, `range.to`, `presets`.

### Dev warnings

Malformed input never throws — it degrades to a safe fallback and warns **once per distinct message**, in non-production builds only, prefixed `[dateforge]`:

| Id | Fires when |
|---|---|
| `invalidFirstDayOfWeek` | `firstDayOfWeek` outside 0–6 (normalized) |
| `invalidMinMax` | `min` is after `max` — nothing is selectable |
| `malformedDateRule` | a `disabled`/`exclude` rule entry was skipped (Invalid Date, bad bound) |
| `invalidTimeZone` | unknown zone — fell back to the system zone |
| `invalidValue` | an entry in `value`/`defaultValue` was dropped (Invalid Date, wrong shape, array in single mode) |
| `emptySelectionAfterExclude` | exclude rules removed every day of a span; nothing committed |
| `maxRangesReached` | a new range was ignored at the `maxRanges` cap |
| `invalidPreset` | a preset entry was skipped (null, missing label/id) |
| `duplicatePresetId` | two presets share an id — first wins |
| `presetResolveError` | a preset resolver threw — treated as empty |

---

## Bundle size & import strategy

The package is pay-for-what-you-import: dual ESM/CJS, every module its own bundle and subpath.

| Subpath | Contents |
|---|---|
| `@dateforge/react-calendar` | `Calendar`, `createCalendarConfig`, `createTheme`, `createAppearance`, `createDisabled`/`compileDateRules`, `calendarDate`, presets engine + packs, `useToday`, all public types |
| `…/prebuilt` | `SimpleCalendar`, `DatePicker`, `MonthPicker`, `MultiMonthCalendar` |
| `…/context` | store hooks for custom modules |
| `…/modules` | every module (convenience barrel — pulls them all) |
| `…/modules/days`, `…/modules/toolbar`, `…/modules/months-grid`, `…/modules/years-grid`, `…/modules/time`, `…/modules/months-wheel`, `…/modules/years-wheel`, `…/modules/days-track`, `…/modules/months-track`, `…/modules/years-track`, `…/modules/presets`, `…/modules/selected-dates`, `…/modules/info`, `…/modules/manual-input`, `…/modules/lunar` | one module each |
| `…/themes` | 28 named `ThemeFamily` objects + `THEMES` |
| `…/appearances` | 8 named appearance objects + token records |

Guidelines:

- **Prefer module subpaths** over the `/modules` barrel in production — the barrel imports everything.
- The **object forms** of themes/appearances tree-shake to exactly what you use; the **string forms** ride generated stylesheets that cover all of them.
- Heavy physics (drum wheels, tracks) is only bundled when you import those modules — the toolbar triggers' default pickers are plain grids, and a wheel enters a trigger only through *your* `picker` import.
- CSS is marked `sideEffects` and ships with the components — no manual style imports, and unused modules bring no CSS.

---

## Building custom modules (`/context`)

Custom modules use the same three hooks the built-ins do:

```tsx
import {
  useCalendarStore,
  useStoreSelector,
  useCalendarActions,
  useUI,
  useLabels,
} from "@dateforge/react-calendar/context";

function SelectionCount() {
  const store = useCalendarStore();
  const count = useStoreSelector(store, (s) =>
    s.selection.shape === "point" ? s.selection.dates.length : s.selection.ranges.length,
  );
  const { clear } = useCalendarActions();
  return <button onClick={clear}>Clear ({count})</button>;
}
```

- **`useCalendarStore()`** — the store for the nearest `<Calendar>`: `getState()`, `getConfig()`, `subscribe(fn)`, `dispatch(action)`. Referentially stable. Throws outside a provider.
- **`useStoreSelector(store, selector, isEqual?)`** — subscribe to a slice; re-renders only when the selected value changes (`Object.is` by default). This is the per-cell performance lever — select the narrowest thing you need.
- **`useCalendarActions()`** — stable dispatchers: `selectDay(date)`, `setTime(time, bound?)`, `setBoundDate(date, bound)`, `navigateTo(date)`, `navigateBy(step, amount)`, `hover(date?)`, `focus(date?)`, `clear()`, `applyPreset(result)`, `removeDate(date)`, `removeRange(index)`. All dates are `CalendarDate` structs (`calendarDate(y, m, d)`, month 1-based). Every action flows through core validation — a custom module cannot bypass `disabled`/`min`/`max`.
- **`useUI()`** — transient popup state (`popup`, `anchor`, `isOpen`, `open`, `close`, `toggle`) plus `scheme` / `toggleScheme`. Popups are view concerns, never in the reducer or `onChange`.
- **`useLabels()`** — the label resolver: `t(key, params?, moduleOverride?)`.

State shape (typed via `CalendarState`): `selection` (a `PointSelection { dates: CalendarDateTime[] }` or `SpanSelection { ranges, draftAnchor?, fromTime?, toTime? }`), `view.viewDate`, `interaction` (`hoverDate?`, `focusDate?`), `validation`. Action and state types (`CalendarAction`, `SelectionState`, …) are exported from `/context`.

Two rules keep custom modules well-behaved:

1. **Never own value state** — dispatch and let the root `onChange` report.
2. **Read committed state, not events** — dispatch is synchronous, so after dispatching you can read `store.getState()` to see whether the action landed (the built-in wheels use this to fire observational callbacks only on real commits).

---

## Types appendix

All exported from the root unless noted:

```ts
// Dates & time
type CalendarDate = { year: number; month: number; day: number };   // month 1-based
function calendarDate(year: number, month: number, day: number): CalendarDate;
type CalendarTime = { hour: number; minute: number; second: number; ms: number };

// Values
type PublicRange = { start: Date; end: Date };
type CalendarValue<U extends SelectionUnit, M extends SelectionMode>; // exact shape per unit × mode
type AnyCalendarValue = Date | null | Date[] | PublicRange | PublicRange[];
type ChangeReason = "select" | "clear" | "preset" | "time" | "remove" | "external-sync";
type CalendarChangeDetails = { segments?: PublicRange[]; reason: ChangeReason };

// Config
type SelectionUnit = "day" | "week" | "month";
type SelectionMode = "single" | "multiple" | "range" | "multi-range";
type CalendarConfigOptions;   // createCalendarConfig input (see reference table)
type CalendarConfig;          // compiled output, consumed by <Calendar config>

// Rules
type DateRuleConfig; type DateRuleDayInput; type DateRuleRangeInput; type DateRuleReason;
function compileDateRules(config?: DateRuleConfig): DateRuleEngine;  // alias: createDisabled

// Presets
type Preset; type PresetInput; type PresetLabel; type PresetContext; type PresetResult;
type EvaluatedPreset; type PresetStatus; type PresetValidationContext;
function definePreset(input: PresetInput): Preset;
function compilePresets(presets: Preset[]): PresetEngine;
function resolvePresetLabel(preset: Preset, locale?: string): string;

// Validation
type ValidationReason; type ValidationResult; type ValidationScope; type BuiltInValidationScope;
function customScope(id: string): `custom:${string}`;

// Time zones
type NonexistentTimePolicy = "next-valid" | "previous-valid" | "reject";
type AmbiguousTimePolicy = "earlier" | "later";

// Styling
type ThemeTokens; type ThemeFamily; type ThemeFamilyInput; type ThemeMode;
function createTheme(input: ThemeFamilyInput): ThemeFamily;
type AppearanceTokens; type CalendarAppearance; type CustomAppearance;
function createAppearance(tokens: Partial<AppearanceTokens>): CustomAppearance;
function isCustomAppearance(value: unknown): value is CustomAppearance;

// Shell
type CalendarProps;
function useToday(): Date | null;
```

From `/context`: `CalendarStore`, `CalendarActions`, `CalendarState`, `SelectionState`, `PointSelection`, `SpanSelection`, `ViewState`, `InteractionState`, `CalendarAction`, `CalendarActionType`, `SchemeMode`, plus the hooks. From `/modules/*`: each module's `…Props` type (and the lunar math types `LunarPhaseKey`, `LunarPhaseIndex`).
