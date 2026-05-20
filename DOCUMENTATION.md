# @dateforge/react-calendar — Documentation

## Table of Contents

- [Quick start](#quick-start)
- [`onChange` value shapes](#onchange-value-shapes)
- [Which modules do I need?](#which-modules-do-i-need)
- [Import strategy](#import-strategy)
- [Calendar (Main Component)](#calendar)
- [Edge cases](#edge-cases)
- [Recommended compositions](#recommended-compositions)
- [CalendarDays](#calendardays)
- [Modules](#modules)
  - [CalendarNav](#calendarnav)
  - [CalendarMonthsGrid](#CalendarMonthsGrid)
  - [CalendarYearsGrid](#calendaryearsgrid)
  - [CalendarTimeGrid](#calendartimegrid)
  - [CalendarPresets](#calendarpresets)
  - [CalendarSelectedDates](#calendarselecteddates)
  - [CalendarInfo](#calendarinfo)
  - [CalendarManualInput](#calendarmanualinput)
  - [CalendarDaysTrack](#calendardaystrack)
  - [CalendarMonthsTrack](#calendarmonthstrack)
  - [CalendarYearsTrack](#calendaryearstrack)
- [Utility Functions](#utility-functions)
- [Types](#types)
- [Design space](#design-space)

---

## Quick start

Install:

```bash
npm i @dateforge/react-calendar
```

No global CSS import is required — every module bundles its own styles and applies them automatically on first render. Zero runtime dependencies; React 18 or 19 is the only peer.

Minimal single-date picker:

```tsx
import { useState } from "react";
import { Calendar } from "@dateforge/react-calendar";
import { CalendarNav, CalendarDays } from "@dateforge/react-calendar/modules";

export function DatePicker() {
  const [date, setDate] = useState<Date | null>(null);

  return (
    <Calendar mode="single" value={date} onChange={setDate}>
      <CalendarNav showMonthPicker compactYears />
      <CalendarDays />
    </Calendar>
  );
}
```

The `<Calendar>` wrapper is a headless state provider — children compose the visible UI. Swap or reorder modules to change the layout; omit `<CalendarDays>` to build a non-grid picker (drum, manual input, presets only).

App Router note: `<Calendar>` is interactive, so it must live behind a `"use client"` boundary in RSC frameworks — see [Server-side rendering](#server-side-rendering).

## `onChange` value shapes

`onChange` and `value` / `defaultValue` are typed per `mode`. The same callback fires in both controlled and uncontrolled trees.

| `mode`       | `value` / `defaultValue` type              | `onChange` argument                        | Cleared (clear button, deselect) |
| ------------ | ------------------------------------------ | ------------------------------------------ | -------------------------------- |
| `"single"`   | `Date \| null`                             | `Date \| null`                             | `null`                           |
| `"multiple"` | `Date[]`                                   | `Date[]` (new array each call)             | `[]`                             |
| `"range"`    | `{ from: Date \| null; to: Date \| null }` | same shape; partial range allowed mid-flow | `{ from: null, to: null }`       |

Notes:

- `Date` instances passed to `onChange` are midnight in the resolved timezone (see [Timezone](#timezone)).
- For `mode="range"`, `onChange` fires on each bound update — guard with `if (range.from && range.to)` if you only care about complete ranges.
- For `mode="multiple"`, the array is sorted ascending and bounded by `maxDates`.

## Which modules do I need?

Pick the modules per the UX you want. All compose under one `<Calendar>` provider and share state automatically.

| You want…                       | Modules                                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| Basic date picker               | `CalendarNav`, `CalendarDays`                                                                  |
| Date range picker               | `CalendarNav`, `CalendarDays` (set `mode="range"` on `<Calendar>`)                             |
| Date + time picker              | `CalendarNav` (with `showTime`) + `CalendarDays`, or inline `CalendarTimeGrid`                 |
| Time-only picker                | `CalendarTimeGrid` (no `CalendarDays`)                                                         |
| Manual typing / keyboard-first  | `CalendarManualInput` (alone or with `CalendarDays`)                                           |
| Presets (Today, Last 7 days, …) | `CalendarPresets` (+ any picker modules)                                                       |
| Month / year-only picker        | `CalendarMonthsGrid` or `CalendarYearsGrid` (no `CalendarDays`)                                |
| Mobile / drum-style picker      | `CalendarDaysTrack`, `CalendarMonthsTrack`, `CalendarYearsTrack` (alone or alongside the grid) |
| Selected-date chips             | `CalendarSelectedDates` (best with `mode="multiple"` or `range`)                               |
| Selection metrics / hint text   | `CalendarInfo`                                                                                 |

See [Recommended compositions](#recommended-compositions) for ready-made JSX snippets.

## Import strategy

Three subpaths, each tree-shakeable:

| Import from                                 | What's there                                                                                   | When to use                                                                   |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `@dateforge/react-calendar`                 | `Calendar`, `createTheme`, `createDisabled`, `createAppearance`, all public types              | Always — the root provider lives here.                                        |
| `@dateforge/react-calendar/modules`         | All `Calendar*` module components (Days, Nav, Presets, TimeGrid, …)                            | When pulling in the visible UI pieces.                                        |
| `@dateforge/react-calendar/context`         | Context hooks: `useConfig`, `useNavigation`, `useSelection`, `useSelectionActions`, `useUI`, … | When building custom modules that need to read or dispatch calendar state.    |
| `@dateforge/react-calendar/themes`          | All theme families re-exported together                                                        | Quick prototyping; pulls every theme family into the bundle.                  |
| `@dateforge/react-calendar/themes/<name>`   | A single theme family (e.g. `…/themes/nebula`)                                                 | Production — only the theme families you actually use end up in the bundle.   |
| `@dateforge/react-calendar/appearances`     | All appearance objects together                                                                | Same trade-off as themes — prefer the per-name subpath for production builds. |
| `@dateforge/react-calendar/appearances/<n>` | A single appearance (`loft`, `compact`, `square`, `soft`, `bubble`, `airy`)                    | Production.                                                                   |

Each module is its own bundle, so importing `CalendarPresets` does not pull `CalendarTimeGrid` or any other unused module. The `modules` aggregate subpath is still tree-shakeable under ESM — bundlers drop unused named exports.

---

## Calendar

The root component. All other components must be placed as its children.

```tsx
import { Calendar } from "@dateforge/react-calendar";
import { CalendarNav, CalendarDays } from "@dateforge/react-calendar/modules";

<Calendar mode="single" onChange={(v) => console.log(v)}>
  <CalendarNav />
  <CalendarDays />
</Calendar>;
```

### Props

| Prop              | Type                                                  | Default    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------- | ----------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mode`            | `"single" \| "multiple" \| "range"`                   | `"single"` | Selection mode                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `value`           | `CalendarValue<M>`                                    | —          | Controlled value. `Date \| null` for single, `Date[]` for multiple, `DateRange` for range. Pass `undefined` to opt out of controlled mode.                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `defaultValue`    | `CalendarValue<M>`                                    | —          | Initial value for uncontrolled mode. Used only when `value` is `undefined`. Subsequent changes to `defaultValue` are ignored.                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `defaultViewDate` | `Date`                                                | —          | Initial month/year displayed on mount when no selection seeds the view. Read once; subsequent changes are ignored. Use this instead of repeating the prop on every `CalendarDays`. Non-`Date` values and `Invalid Date` are rejected (dev warn) and treated as omitted.                                                                                                                                                                                                                                                                                        |
| `onChange`        | `(value: CalendarValue<M>) => void`                   | —          | Fires when the selection changes (in both controlled and uncontrolled modes)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `cols`            | `number`                                              | —          | Number of columns in the internal CSS grid                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `locale`          | `string`                                              | `"en"`     | BCP 47 language tag used for all labels and formatting                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `timeZone`        | `string \| "auto"`                                    | `"auto"`   | IANA timezone (`"Europe/Paris"`, `"UTC"`), fixed offset (`"UTC+2"`, `"UTC-5"`), or `"auto"`. When `"auto"` (or omitted) the library detects the user's timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone` after mount. Invalid values fall back to auto-detect with a dev warning. Affects today detection, emitted date midnight, and formatting. **Important:** with an explicit `timeZone`, the `Date` passed to `onChange` is the absolute instant of midnight **in that zone** — see [Timezone](#timezone) for examples and storage guidance |
| `readOnly`        | `boolean`                                             | `false`    | Disables all state-changing interactions (date/time selection). Navigation still works. Adds `data-readonly` on the root and `aria-disabled` on each interactive cell — the wrapper itself carries no ARIA state because plain `<div>` does not support `aria-readonly` per ARIA spec                                                                                                                                                                                                                                                                          |
| `clearLabel`      | `string`                                              | `"Clear"`  | Global aria-label for clear buttons. Module-level `clearLabel` props override it                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `homeLabel`       | `string`                                              | `"Go to current month"` | Global aria-label for home/current-month buttons. Module-level `homeLabel` props override it                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `hour12`          | `boolean`                                             | `false`    | Use 12-hour time format instead of 24-hour                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `timeStep`        | `{ hour?: number; minute?: number; second?: number }` | `{1,1,1}`  | Granularity (step) for time drums. Affects both inline `CalendarTimeGrid` and `CalendarNav` time popup. Example: `timeStep={{ minute: 5 }}` snaps minutes to 0/5/10/.../55. Step values divide the unit range; `aria-valuemax`, keyboard `±step`, and scroll snap follow the step. Default `1` (no snapping)                                                                                                                                                                                                                                                   |
| `theme`           | `CalendarTheme`                                       | `"auto"`   | Base mode string (`"auto"` / `"light"` / `"dark"`) or a theme family from `@dateforge/react-calendar/themes[/name]` or `createTheme()`. Named string themes (e.g. `"nebula"`) are not supported — import the family object instead.                                                                                                                                                                                                                                                                                                                               |
| `light`           | `boolean`                                             | `false`    | Start in light mode. Works with the default palette and imported/custom theme families.                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `dark`            | `boolean`                                             | `false`    | Start in dark mode. If both `light` and `dark` are passed, dark wins and a dev warning is emitted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `appearance`      | `CalendarAppearance`                                  | —          | Pre-built appearance object from `@dateforge/react-calendar/appearances[/name]`, or a `CustomAppearance` from `createAppearance()`. Omit the prop entirely for the default appearance.                                                                                                                                                                                                                                                                                                                                                                         |
| `gradient`        | `boolean`                                             | `false`    | Enable gradient backgrounds on selected cells                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `width`           | `string \| number`                                    | `"100%"`   | Container width                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `minDate`         | `Date`                                                | —          | Earliest selectable date                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `maxDate`         | `Date`                                                | —          | Latest selectable date                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `maxDates`        | `number`                                              | —          | Maximum number of selectable dates (`mode="multiple"` only). When the cap is reached: clicking a not-yet-selected date (in `<CalendarDays>`, via a preset, or any other interactive module) is silently ignored — no `onChange`, no view change. Clicking an already-selected date still toggles it off, freeing a slot. `<CalendarManualInput>` hides its add-input when the cap is reached.                                                                                                                                                                  |
| `minRangeDays`    | `number`                                              | —          | Minimum number of days in a range selection                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `maxRangeDays`    | `number`                                              | —          | Maximum number of days in a range selection                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `disabled`        | `DisabledConfig`                                      | —          | Rules for disabling specific dates. Build with `createDisabled()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `children`        | `React.ReactNode`                                     | —          | Module components that compose the calendar UI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

### Action aria labels

Control aria-labels resolve as `module prop → Calendar prop → built-in default`. Use root props for a whole calendar, then override a specific module only when needed.

Template labels support named placeholders:

```tsx
<Calendar
  clearLabel="Auswahl löschen"
  changeMonthLabel="Monat öffnen: {month}"
  weekLabel="Woche"
  showMoreSelectedDatesLabel="{count} weitere ausgewählte Daten anzeigen"
/>
```

Date labels remain locale-derived through `Intl` where the label describes an actual date, month, year, or weekday. Week number labels use `weekLabel`.

#### Root label props

All of these props can be passed to `<Calendar>`.

| Prop | Default | Placeholders | Used for |
| ---- | ------- | ------------ | -------- |
| `applyLabel` | `"Apply"` | — | Manual input apply buttons |
| `calendarNavigationLabel` | `"Calendar navigation"` | — | Nav toolbar when no visible `label` prop is provided |
| `changeMonthLabel` | `"Change month, currently {month}"` | `{month}` | Nav month popup trigger |
| `changeTimeLabel` | `"Change time, currently {time}"` | `{time}` | Nav time popup trigger |
| `changeYearLabel` | `"Change year, currently {year}"` | `{year}` | Nav year popup trigger |
| `clearLabel` | `"Clear"` | — | Clear buttons |
| `confirmLabel` | `"Confirm"` | — | Popup confirm buttons |
| `dayTrackLabel` | `"Day"` | — | Days track spinbutton |
| `homeLabel` | `"Go to current month"` | — | Home/current-month buttons |
| `hoursLabel` | `"Hours"` | — | Time hour drum |
| `minutesLabel` | `"Minutes"` | — | Time minute drum |
| `monthGridLabel` | `"Select month, {year}"` | `{year}` | Months grid group |
| `monthPickerLabel` | `"Month picker"` | — | Nav month picker group |
| `monthTrackLabel` | `"Month"` | — | Month track / month popup drum |
| `nextMonthLabel` | `"Next month"` | — | Nav next-month button |
| `nextYearLabel` | `"Next year"` | — | Nav next-year button |
| `nextYearsLabel` | `"Next years"` | — | Years grid next-page button |
| `previousMonthLabel` | `"Previous month"` | — | Nav previous-month button |
| `previousYearLabel` | `"Previous year"` | — | Nav previous-year button |
| `previousYearsLabel` | `"Previous years"` | — | Years grid previous-page button |
| `removeLabel` | `"Remove"` | — | Manual input per-chip remove button |
| `removeRangeEndLabel` | `"Remove range end"` | — | Selected-dates range-end remove button |
| `removeRangeStartLabel` | `"Remove range start"` | — | Selected-dates range-start remove button |
| `removeSelectedDateLabel` | `"Remove selected date"` | — | Selected date remove/toggle buttons |
| `resetTimeLabel` | `"Reset to {time}"` | `{time}` | Time reset button |
| `saveSelectedDateLabel` | `"Save selected date"` | — | Days track multi-mode save button |
| `secondsLabel` | `"Seconds"` | — | Time second drum |
| `selectMonthLabel` | `"Select month"` | — | Month popup dialog |
| `selectTimeLabel` | `"Select time"` | — | Time popup dialog |
| `selectYearLabel` | `"Select year"` | — | Year popup dialog |
| `showMoreSelectedDatesLabel` | `"Show {count} more selected dates"` | `{count}` | Selected-dates overflow chip |
| `themeSwitchToDarkLabel` | `"Switch to dark mode"` | — | Theme toggle when current theme is light |
| `themeSwitchToLightLabel` | `"Switch to light mode"` | — | Theme toggle when current theme is dark |
| `themeToggleLabel` | `"Toggle theme"` | — | Theme toggle while theme is still auto/unresolved |
| `timePeriodLabel` | `"Time period, currently {period}"` | `{period}` | AM/PM switch |
| `timePickerLabel` | `"Time picker"` | — | Time track group |
| `weekLabel` | `"Week"` | — | Days grid week-number rows and row headers |
| `yearGridLabel` | `"Select year, showing {from} to {to}"` | `{from}`, `{to}` | Years grid group |
| `yearPageNavigationLabel` | `"Year page navigation"` | — | Years grid page controls group |
| `yearPickerLabel` | `"Year picker"` | — | Nav year picker group |
| `yearTrackLabel` | `"Year"` | — | Year track / year popup drum |

#### Module override props

Module props use the same names and override the matching root prop only for that module instance.

| Module | Override props |
| ------ | -------------- |
| `CalendarNav` | `calendarNavigationLabel`, `changeMonthLabel`, `changeTimeLabel`, `changeYearLabel`, `clearLabel`, `confirmLabel`, `homeLabel`, `hoursLabel`, `minutesLabel`, `monthPickerLabel`, `monthTrackLabel`, `nextMonthLabel`, `nextYearLabel`, `previousMonthLabel`, `previousYearLabel`, `secondsLabel`, `selectMonthLabel`, `selectTimeLabel`, `selectYearLabel`, `themeSwitchToDarkLabel`, `themeSwitchToLightLabel`, `themeToggleLabel`, `timePeriodLabel`, `timePickerLabel`, `yearPickerLabel`, `yearTrackLabel` |
| `CalendarDays` | `weekLabel` |
| `CalendarInfo` | `clearLabel`, `homeLabel` |
| `CalendarManualInput` | `applyLabel`, `clearLabel`, `removeLabel` |
| `CalendarSelectedDates` | `clearLabel`, `removeRangeEndLabel`, `removeRangeStartLabel`, `removeSelectedDateLabel`, `showMoreSelectedDatesLabel` |
| `CalendarDaysTrack` | `dayTrackLabel`, `removeSelectedDateLabel`, `saveSelectedDateLabel` |
| `CalendarMonthsTrack` | `monthTrackLabel` |
| `CalendarYearsTrack` | `yearTrackLabel` |
| `CalendarTimeGrid` | `hoursLabel`, `minutesLabel`, `resetTimeLabel`, `secondsLabel`, `timePeriodLabel`, `timePickerLabel` |
| `CalendarMonthsGrid` | `monthGridLabel` |
| `CalendarYearsGrid` | `nextYearsLabel`, `previousYearsLabel`, `yearGridLabel`, `yearPageNavigationLabel` |

### When does each action fire `onChange`?

The complete cross-module matrix lives in `ARCHITECTURE.md → Module behavior matrix`. It tells you for every public action — Nav arrows, day click, preset click, drum scroll, manual input commit, etc. — whether it changes the view, mutates the selection, fires the consumer callback, and how it behaves under `readOnly`.

Quick high-level summary:

- **Pure navigation** (Nav arrows / popups, MonthsGrid / YearsGrid clicks, Track scrolling without `bound`) never fires `onChange`.
- **Pure selection** (Days click, ManualInput Enter / apply, Presets click, SelectedDates clear) fires `onChange`.
- **Mixed actions** (Nav `clear`, `showTime` confirm, Days click that crosses months, Track items in `bound` mode) change both view and selection — fire `onChange`.
- **`readOnly`** disables every selection-affecting affordance; navigation stays enabled.

### Controlled and uncontrolled

`Calendar` works in both modes. The decision is made by whether `value` is passed.

**Controlled** — `value` is provided (including `null`):

```tsx
const [date, setDate] = useState<Date | null>(null);
<Calendar value={date} onChange={setDate}>
  <CalendarDays />
</Calendar>;
```

External changes to `value` are synced into internal state on every change. **Selection is single-source-of-truth in controlled mode**: user actions (clicks, range bounds, time edits) only fire `onChange` with the would-be-next value — they never mutate internal selection state. If the parent ignores `onChange` (or sets the same `value` back), the rendered selection stays put. Only `viewDate` updates locally, so the user's view follows the action regardless. To keep the calendar in sync, the parent must accept `onChange` and pass the new value back via `value`.

**Uncontrolled** — `value` is `undefined`. Optional `defaultValue` seeds the initial selection:

```tsx
<Calendar defaultValue={new Date()} onChange={(d) => console.log(d)}>
  <CalendarDays />
</Calendar>
```

Internal state lives independently. `defaultValue` is read once on mount; subsequent changes are ignored. `onChange` still fires for every selection change.

**Mixing rule.** When both `value` and `defaultValue` are passed, `value` wins (controlled mode). `defaultValue` is ignored.

**Mode change at runtime.** Changing `mode` (e.g. `"single"` → `"range"`) does not migrate selection. The new mode reads internal state through its own shape: range mode looks for `from`/`to`, multiple looks for an array, single looks for a `Date`. Pass a compatible `value` together with the mode change if you need a clean transition.

### SSR pitfall: never seed initial value with `new Date()`

In Next.js / Remix / any SSR setup, evaluating `new Date()` returns a different timestamp on the server vs the client (and across midnight, even a different day). Seeding `useState(new Date())` for a controlled `<Calendar>` causes the SSR HTML to show one day cell active and the hydrated client render to show another — React logs a hydration mismatch and you may see two visually-selected day cells until React reconciles.

**Don't:**

```tsx
const [date, setDate] = useState<Date | null>(new Date()); // ❌ hydration mismatch
return (
  <Calendar value={date} onChange={setDate}>
    <CalendarDays />
  </Calendar>
);
```

**Do — use the SSR-safe `useToday` hook exported by the package:**

```tsx
import { Calendar, useToday } from "@dateforge/react-calendar";

const today = useToday(); // null on server, Date after mount
const [date, setDate] = useState<Date | null>(null);
return (
  <Calendar value={date ?? today} onChange={setDate}>
    <CalendarDays />
  </Calendar>
);
```

That's it — `value` is `null` on the server (no day selected in SSR HTML), `today` after hydration. No mismatch, no ghost selection.

`useToday()` is a thin wrapper around the internal `useClientValue` hook: it returns `null` on the first server-side and pre-hydration render and resolves to `new Date()` synchronously after mount (layout effect — no flash).

### Time semantics — when does time editing fire `onChange`?

`CalendarTimeGrid` and `CalendarNav.showTime` both edit time. They share the same rules. The principle is:

> `viewDate` always carries the **current working time**. A selection's time is updated only when the selection corresponds to `viewDate`'s day. Otherwise the time stays "pending" — applied to the next date the user selects in `CalendarDays` (because Days commits a new date with `viewDate.hours / minutes / seconds`).

Per-mode behavior:

| Mode       | State                                     | Effect of time change                                   | Fires `onChange`? |
| ---------- | ----------------------------------------- | ------------------------------------------------------- | ----------------- |
| `single`   | no selection                              | auto-creates `selectedDate = viewDate.day + new time` ¹ | yes               |
| `single`   | selection day matches `viewDate`          | updates that date's time                                | yes               |
| `single`   | selection day differs from `viewDate`     | pending — selection untouched, only `viewDate` updates  | no                |
| `multiple` | no selection                              | pending — no auto-create                                | no                |
| `multiple` | one of `selectedDates` matches `viewDate` | updates that date's time, others untouched              | yes               |
| `multiple` | none match                                | pending — selection untouched                           | no                |
| `range`    | no selection                              | pending                                                 | no                |
| `range`    | `rangeStart` day matches `viewDate`       | updates `rangeStart`'s time                             | yes               |
| `range`    | `rangeEnd` day matches `viewDate`         | updates `rangeEnd`'s time                               | yes               |
| `range`    | neither matches                           | pending                                                 | no                |

¹ This makes `<Calendar mode="single"><CalendarNav showTime /><CalendarTimeGrid /></Calendar>` work as a **time-only picker**: scrolling time drums commits a date for today (or whatever `viewDate` defaults to). For `multiple` and `range` modes time-only pickers are not supported by design — the user must select a date first because there is no unambiguous boundary to attach time to.

**Pending vs committed.** "Pending" means `viewDate.hours / minutes / seconds` are updated for display and for the next selection, but the existing committed selection is not mutated and `onChange` is not called. The next click in `CalendarDays` will pick up the pending time automatically.

### Timezone

`Calendar` is **timezone-aware by default**. When you don't pass `timeZone` (or pass `"auto"`), the library reads the user's IANA timezone from `Intl.DateTimeFormat().resolvedOptions().timeZone` inside a `useEffect` after mount. This pattern is SSR-safe: the first render does not depend on browser locale, so server-rendered HTML and client hydration agree. After hydration, the resolved timezone is fed into the calendar config and any timezone-dependent UI (today highlight, emitted Date midnight, chip formatting) updates accordingly.

When you need an explicit timezone — typically because your data is stored in a fixed zone (e.g. an event scheduler shown in `"America/New_York"` regardless of the viewer), or because you want to avoid the brief auto-resolve gap — pass an IANA name or a fixed offset:

```tsx
<Calendar timeZone="America/New_York">…</Calendar>
<Calendar timeZone="UTC+2">…</Calendar>
```

Fixed offsets `"UTC+N"` / `"UTC-N"` are normalized internally to the corresponding `Etc/GMT∓N` IANA name.

**What `onChange` actually emits when `timeZone` is set.** The library always returns a native JS `Date` (an absolute UTC instant). What changes is which moment that instant points to:

- **`timeZone` set** (e.g. `"Europe/Paris"`): the emitted `Date` represents **midnight in that zone**. For `"Europe/Paris"` (UTC+2 in summer) picking June 15 yields `2024-06-15T00:00:00+02:00` — i.e. UTC instant `2024-06-14T22:00:00Z`. A viewer in `America/New_York` (UTC-4) who calls `.toString()` on that same Date will see `Fri Jun 14 2024 18:00:00 GMT-0400` — that is correct: it is the same instant. The wall-clock day in Paris is June 15. Use `Intl.DateTimeFormat(..., { timeZone: 'Europe/Paris' })` (or any tz-aware formatter) when displaying.
- **`timeZone` unset / `"auto"`**: midnight is set in **system local time** (`new Date(y, m, d)` semantics). Same calendar day across system zones, but the absolute instant differs per viewer.
- **With `showTime`**: the time portion is added on top of the chosen midnight. With `timeZone`, that means hours/minutes are local to the configured zone.

If you persist these dates server-side, prefer `.toISOString()` and store as UTC. Reconstruct in the configured zone via `Intl.DateTimeFormat`. Do **not** rely on `getDate()` / `getMonth()` for storage — those read the host machine's local zone and silently drift across servers.

When does timezone matter?

- **SSR / Next.js.** Server's `new Date()` is in server's locale (often UTC). Without an explicit timezone, "today" detection differs between server and client. The auto-detect default keeps the initial render server-stable and resolves to client zone post-hydration.
- **Off-by-one selection.** When dates are stored as UTC midnight and the user is in a negative offset, displaying with local conversion shifts the rendered day back by one. Setting `timeZone` to the storage zone fixes this.
- **Explicit data zone.** Scheduling apps where dates are anchored to a specific city's time, regardless of the viewer.

For purely local single-user CRUD without SSR, the default `"auto"` is the right choice and you do not need to think about it.

**Invalid timezone values** (e.g. `"Europe/Wrongville"`) fall back to auto-detect and emit a dev warning. In production they are silently treated as auto-detect.

**Dev warnings.** The library never throws on bad input. In development a deduped `console.warn` is emitted; in production the same fallback runs silently. The complete list of validated cases:

| Source                                                                                                                  | Behavior                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value` / `defaultValue` shape does not match `mode`                                                                    | Best-effort normalization (e.g. `Date` in range mode → `from`)                                                                                            |
| `value` / `defaultValue` contains `Invalid Date`                                                                        | Invalid entries dropped (single → no selection; multiple → filtered; range → bound nulled). View date falls back to `defaultViewDate` or today. Dev warn. |
| `defaultViewDate` not a valid Date                                                                                      | Treated as omitted                                                                                                                                        |
| `minDate > maxDate`                                                                                                     | No date selectable; warn                                                                                                                                  |
| `timeZone` not a valid IANA / `UTC±N`                                                                                   | Falls back to auto-detect                                                                                                                                 |
| `theme` string outside `"auto" \| "light" \| "dark"`                                                                    | Falls back to system theme                                                                                                                                |
| `<CalendarYearsGrid yearsPerPage>` outside 1..40 / non-integer                                                          | Clamped to 1..40                                                                                                                                          |
| `<CalendarNav>` with both `showMonthPicker` + `compactMonths` (or year equivalents)                                     | Both UI variants render; warn                                                                                                                             |
| `<CalendarPresets>` entry: not an object / missing `label` / duplicate `id` / throwing `getValue` / Invalid Date result | Entry skipped                                                                                                                                             |
| `createDisabled()` bad input (non-object init, invalid Dates, malformed ranges, weekdays out of 0..6)                   | Bad pieces dropped, valid kept                                                                                                                            |

`process.env.NODE_ENV === "production"` short-circuits the `console.warn`. The fallback behavior is identical in both modes.

### Performance tips

The library memoizes its internals (split selection contexts, `React.memo` on day cells, `useMemo` for derived data, popup state outside the reducer). Repeated `<CalendarDays>` for multi-month layouts is a first-class case.

What you can do to keep things fast:

- **Memoize objects you pass down.** `disabled`, `theme`, `appearance`, `presets` should be stable references between renders. Wrap creation in `useMemo`:

  ```tsx
  const disabled = useMemo(() => createDisabled({ weekends: true }), []);
  const presets = useMemo(() => [...basicPresets], []);
  <Calendar disabled={disabled} presets={presets} />;
  ```

  Without this every parent render invalidates the calendar's internal `useMemo` chain.

- **Wide multi-month layouts** (12+ instances of `<CalendarDays>`) work, but cost scales linearly. Avoid heavy `disabled` configs (long `ranges` / `dates` arrays) when you can express the same constraint via `minDate` / `maxDate` instead.

- **`<CalendarNav showNowTime />`** ticks every second; the tick is isolated to `Nav` so it does not re-render the day grid. Adding `seconds={true}` makes the animation more frequent but still local.

- **Hover range preview** (in `mode="range"`) recomputes the day grid as the mouse moves over cells. `<CalendarDays>` cells outside the preview band are skipped via `React.memo`, so the cost stays bounded. If preview is not desired, omit hover-driven custom modules.

### Server-side rendering

`<Calendar>` is **SSR / hydration-safe**: the server-rendered HTML matches the first client render, so React does not emit a hydration warning. It works with Next.js (App Router and Pages), Remix, TanStack Start, Astro server islands, and any other React SSR setup.

**SSR-safe is not the same as React Server Component-compatible.** `<Calendar>` is an interactive widget — it uses hooks, state, and effects — so under the Next.js App Router (or any RSC-based framework) it must be rendered from a Client Component boundary. It cannot be returned directly from a Server Component.

**Next.js App Router:**

```tsx
// app/picker.tsx
"use client";

import { Calendar } from "@dateforge/react-calendar";
import { CalendarDays, CalendarNav } from "@dateforge/react-calendar/modules";

export function Picker() {
  return (
    <Calendar mode="single" defaultValue={null}>
      <CalendarNav />
      <CalendarDays />
    </Calendar>
  );
}
```

```tsx
// app/page.tsx — Server Component, no "use client" needed
import { Picker } from "./picker";

export default function Page() {
  return <Picker />;
}
```

**Pages Router / Remix / Vite SSR:** no boundary directive needed — render `<Calendar>` anywhere in the tree, the SSR HTML stays deterministic.

What you can rely on regardless of framework:

- The default theme mode and `timeZone="auto"` detect the user's preferences after hydration. The first server render uses neutral defaults (`light` theme, no timezone) so the markup is deterministic.
- The live clock (`<CalendarNav showNowTime />`) renders an empty time slot on the server and starts ticking after hydration.
- `highlightToday` is intentionally inactive on the server render — the highlight appears on the client once `today` is resolved in the user's timezone. This avoids the classic "server highlights yesterday because it's UTC, client expected today" bug.

For deterministic SSR snapshots (e.g. visual regression testing) pass `defaultViewDate` so the displayed month does not depend on either side's clock.

CI runs `react-dom/server` `renderToString` and `hydrateRoot` against representative compositions to gate this contract — see `integration/ssr.test.tsx` and `integration/hydration.test.tsx`.

### Accessibility

The library is **inclusive-first** — keyboard, screen reader, and reduced-motion users are first-class. Every interactive module ships with the ARIA attributes, focus management, and keyboard handlers described below; CI runs `jest-axe` against representative compositions and fails on any violation.

**Day grid** follows the [WAI-ARIA grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/):

- `role="grid"` with `aria-label` (localized month + year).
- Weekday headers use `role="columnheader"`; day cells use `role="gridcell"` with `aria-selected` / `aria-disabled` / `aria-current="date"`.
- Roving `tabindex` — the focused day is `tabindex="0"`, others are `-1`.
- Keyboard: Arrow keys (day / week), Home / End (week edges), Page Up / Down (month), Shift + Page Up / Down (year), Enter / Space (select).

**Time picker, Tracks** use `role="spinbutton"` with `aria-valuenow` / `aria-valuemin` / `aria-valuemax` / `aria-valuetext`. Arrow keys step by one; Home / End jump to bounds.

**Popups** (month / year / time) are `role="dialog"` + `aria-modal="true"` with focus trapping; `Escape` closes.

**Live region.** The root mounts an off-screen `role="status" aria-live="polite"` element that announces the most recently committed date — selecting a day or applying a range is audible without re-reading the grid.

**`readOnly`.** Adds `data-readonly` + `aria-readonly="true"` to the root, and disables every state-changing button / input visually and semantically.

**Known limitations.**

- `prefers-reduced-motion` is not yet honored. Drum flip, month slide, and chip fade animations run regardless of the OS setting. Tracked as a TODO in `ARCHITECTURE.md → Accessibility`.
- `hideOutOfRange` removes hidden cells from the AT tree but keyboard arrow navigation still computes by date math; pair with `blockNavigation` for full traversal predictability (see "`hideOutOfRange` accessibility").

If you find an a11y regression, open an issue — these are treated as bugs, not enhancements.

### `readOnly` contract

When `readOnly` is `true`:

**Blocked**

- Selecting a date in `CalendarDays`, `CalendarDaysTrack`, `CalendarPresets`, `CalendarManualInput`.
- Setting a range boundary in `CalendarDaysTrack` / `CalendarMonthsTrack` / `CalendarYearsTrack` with `bound`.
- Changing time in `CalendarTimeGrid` and the time popup of `CalendarNav`.
- Clearing selection from `CalendarNav` (`clear`), `CalendarSelectedDates` (`allowClear`), `CalendarManualInput` (`allowClear`).
- Editing a date chip in `CalendarManualInput`.

**Still works**

- Navigating the view (`CalendarNav` arrows, month/year popups, all Track scrolling, `CalendarMonthsGrid`, `CalendarYearsGrid`).
- Theme toggle (`CalendarNav.themeToggle`).
- Opening the time popup in `CalendarNav` (drums inside are read-only).
- Clicking a chip in `CalendarSelectedDates` to navigate to that date.
- Hover preview in range mode.

Interactive UI elements are rendered with `disabled` or `aria-disabled="true"` so they are visually inactive. State-changing actions are also blocked at the reducer layer, so even custom modules calling selection actions will no-op when `readOnly`.

---

## Edge cases

A consolidated checklist of non-obvious cases the library handles, with pointers to the section that defines the behavior. Use this as a quick smoke list when integrating.

| Case                                                                        | Behavior                                                                                                                                                        | Defined in                          |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `readOnly` + `clear` button (any module)                                    | Button disabled; `onChange` does not fire                                                                                                                       | `readOnly` contract                 |
| `readOnly` + day click / Track item / preset                                | Affordance disabled (aria-disabled / hidden); `onChange` does not fire                                                                                          | `readOnly` contract                 |
| `minDate > maxDate`                                                         | No date selectable; dev warn                                                                                                                                    | Dev warnings                        |
| `minDate` / `maxDate` + preset whose target falls outside the bounds        | Preset filtered (button not rendered)                                                                                                                           | Presets → Mode filtering            |
| `minDate` / `maxDate` + manual input outside bounds                         | Wrapper turns red, no commit, `onChange` does not fire                                                                                                          | ManualInput → When `onChange` fires |
| `disabled` config + manual input typing a disabled date                     | Same as above — invalid state, no commit                                                                                                                        | ManualInput → Constraints respected |
| `mode="range"` with `minRangeDays` / `maxRangeDays`                         | Hover preview is gated by these; commit also rejected                                                                                                           | Calendar props                      |
| `mode="range"` + `<CalendarDaysTrack bound="from">` only (no `to` boundary) | User can set `from` but never `to`. Renders but UX incomplete.                                                                                                  | "Any subset … not every is UX"      |
| `mode="multiple"` + `maxDates` reached                                      | Click on new date silently ignored; click on already-selected toggles off; ManualInput add input hidden                                                         | Calendar props                      |
| `mode="multiple"` + `<CalendarTimeGrid>` without selection                  | Time changes are pending, never commit (no unambiguous date)                                                                                                    | Time semantics                      |
| `mode="single"` + `<CalendarTimeGrid>` without selection (time-only picker) | First time interaction auto-creates a date for `viewDate.day`                                                                                                   | Time semantics                      |
| `mode="range"` + `<CalendarTimeGrid>` + viewDate matches neither boundary   | Time pending; no commit                                                                                                                                         | Time semantics                      |
| `timeZone="auto"` (default) on SSR                                          | First render uses no TZ; resolved post-hydration via `Intl`                                                                                                     | Timezone, SSR / hydration           |
| Explicit `timeZone="UTC+2"` / `"UTC-5"`                                     | Normalized internally to `Etc/GMT∓N`                                                                                                                            | Timezone                            |
| Invalid `timeZone` string (e.g. `"Europe/Wrongville"`)                      | Falls back to auto-detect; dev warn                                                                                                                             | Timezone                            |
| `value = new Date("invalid")`                                               | Dropped from selection (single → no value; multiple → filtered; range → bound nulled); dev warn                                                                 | Dev warnings                        |
| `defaultViewDate = "garbage"` (non-Date)                                    | Treated as omitted; dev warn                                                                                                                                    | Dev warnings                        |
| Repeated `<CalendarDays offset={n} />` (multi-month layout)                 | All instances share `viewDate`, `selectedDates`, `hoverDate` — diverge only by `offset`. Cost scales linearly                                                   | Performance model                   |
| Mode change at runtime (e.g. `single` → `range`)                            | Selection is **not** migrated. Each mode reads its own shape from internal state. Pass a compatible `value` together with the new `mode` for a clean transition | Controlled and uncontrolled         |
| `theme="nebula"` (string, not object)                                       | Falls back to system theme; dev warn                                                                                                                            | Dev warnings                        |
| `<CalendarPresets>` with a `getValue` that throws                           | Preset dropped; rest still render; dev warn                                                                                                                     | Presets → Defensive handling        |
| `<CalendarPresets>` with two entries sharing the same `id`                  | First wins; duplicates dropped; dev warn                                                                                                                        | Presets → Defensive handling        |
| `<CalendarYearsGrid yearsPerPage={999} />`                                  | Clamped to 40; dev warn                                                                                                                                         | CalendarYearsGrid → Props           |
| `<CalendarNav showMonthPicker compactMonths />` (both true)                 | Renders both UI variants; dev warn                                                                                                                              | CalendarNav → Behavior matrix       |
| `hideOutOfRange` + arrow-key navigation crossing hidden cells               | Focus may not land (no button rendered). Pair with `blockNavigation`.                                                                                           | `hideOutOfRange` accessibility      |
| SSR (Next.js / Remix) without `defaultViewDate`                             | Works; momentary first-paint mismatch possible near midnight UTC                                                                                                | SSR / hydration                     |

If you hit a case not on this list and the behavior surprises you, that is a bug — please open an issue.

---

## Recommended compositions

Copy-paste recipes. Each renders a complete, working calendar; pair with `useState` to make it interactive.

### Basic date picker

```tsx
const [date, setDate] = useState<Date | null>(null);

<Calendar mode="single" value={date} onChange={setDate}>
  <CalendarNav showMonthPicker showYearPicker />
  <CalendarDays />
</Calendar>;
```

### Date picker with selection feedback and clear

```tsx
<Calendar mode="single" value={date} onChange={setDate}>
  <CalendarNav showMonthPicker showYearPicker clear />
  <CalendarDays />
  <CalendarSelectedDates />
</Calendar>
```

### Date range picker

```tsx
const [range, setRange] = useState<DateRange>({ from: null, to: null });

<Calendar mode="range" value={range} onChange={setRange}>
  <CalendarNav showMonthPicker showYearPicker clear />
  <CalendarDays />
  <CalendarSelectedDates />
</Calendar>;
```

### Date range picker with shortcuts

```tsx
<Calendar mode="range" value={range} onChange={setRange}>
  <CalendarNav showMonthPicker showYearPicker clear />
  <CalendarPresets presets={basicPresets} />
  <CalendarDays />
  <CalendarSelectedDates />
</Calendar>
```

### Multi-month range picker (two months side by side)

```tsx
<Calendar mode="range" cols={2} value={range} onChange={setRange}>
  <CalendarNav col={1} />
  <CalendarNav offset={1} col={2} />
  <CalendarDays offset={0} col={1} />
  <CalendarDays offset={1} col={2} />
  <CalendarSelectedDates col="1 / span 2" />
</Calendar>
```

### Multiple-date picker (max 3)

```tsx
const [dates, setDates] = useState<Date[]>([]);

<Calendar mode="multiple" maxDates={3} value={dates} onChange={setDates}>
  <CalendarNav />
  <CalendarDays />
  <CalendarSelectedDates />
</Calendar>;
```

### Date + time picker

```tsx
<Calendar mode="single" value={date} onChange={setDate}>
  <CalendarNav />
  <CalendarDays />
  <CalendarTimeGrid />
</Calendar>
```

### Time-only picker (no day grid)

Single mode auto-creates a date from `viewDate.day` + the new time on the first interaction — see "Time semantics".

```tsx
<Calendar mode="single" value={date} onChange={setDate}>
  <CalendarNav showNowTime />
  <CalendarTimeGrid />
</Calendar>
```

### Manual input + grid

```tsx
<Calendar mode="single" value={date} onChange={setDate}>
  <CalendarManualInput />
  <CalendarNav />
  <CalendarDays />
</Calendar>
```

### Read-only display showing a specific month

```tsx
<Calendar readOnly defaultViewDate={new Date(1990, 4, 1)}>
  <CalendarNav />
  <CalendarDays />
</Calendar>
```

### Track-driven picker (drum-style)

```tsx
<Calendar mode="single" value={date} onChange={setDate}>
  <CalendarYearsTrack />
  <CalendarMonthsTrack />
  <CalendarDaysTrack />
</Calendar>
```

### Days + MonthsTrack (compact month switcher above the grid)

A scrollable month strip plus a regular day grid. Saves vertical space compared to a full Nav header — the month strip doubles as the navigation control.

```tsx
<Calendar mode="single" value={date} onChange={setDate}>
  <CalendarMonthsTrack />
  <CalendarDays />
</Calendar>
```

---

## CalendarDays

Renders the month grid — weekday headers, week numbers (optional), and the day cells.

```tsx
<CalendarDays />
```

### Props

| Prop                | Type                            | Default   | Description                                                                                                                                                                                                                                                                                                                      |
| ------------------- | ------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `offset`            | `number`                        | `0`       | Month offset relative to the current view. Use `1` or `-1` to render adjacent months                                                                                                                                                                                                                                             |
| `startOfWeek`       | `0–6`                           | `1`       | First day of the week. `0` = Sunday, `1` = Monday, … `6` = Saturday                                                                                                                                                                                                                                                              |
| `currentMonthOnly`  | `boolean`                       | `false`   | Hide day cells that belong to the previous or next month                                                                                                                                                                                                                                                                         |
| `highlightWeekends` | `boolean`                       | `true`    | Apply a distinct style to Saturday and Sunday                                                                                                                                                                                                                                                                                    |
| `boldWeekends`      | `boolean`                       | `false`   | Render Saturday and Sunday in bold with the weekend accent color (`--c-we`)                                                                                                                                                                                                                                                      |
| `highlightToday`    | `boolean`                       | `true`    | Highlight today's date                                                                                                                                                                                                                                                                                                           |
| `todayDot`          | `boolean`                       | `true`    | Render a small dot under today's digit. Selected-today dot color uses gradient/active text color first, then the theme `todayDot` token. Dot size and lower inset can be tuned by appearance tokens.                                                                                                                             |
| `weekLabel`         | `string`                        | `"Week"`  | Aria-label prefix for week-number rows and row headers. The root `Calendar` `weekLabel` applies globally; this prop overrides it for this days grid                                                                                                                                                                             |
| `fixedRows`         | `boolean`                       | `true`    | Always render 6 rows of day cells                                                                                                                                                                                                                                                                                                |
| `weekNumbers`       | `boolean`                       | `false`   | Show ISO week numbers in the leftmost column                                                                                                                                                                                                                                                                                     |
| `hideWeekdays`      | `boolean`                       | `false`   | Hide the row of weekday name headers                                                                                                                                                                                                                                                                                             |
| `weekdayFormat`     | `"narrow" \| "short" \| "long"` | `"short"` | Weekday header label format. Resolved per-locale via `Intl.DateTimeFormat`. `"narrow"` = single letter (e.g. `M T W T F S S`), `"short"` = abbreviated (e.g. `Mon Tue …`), `"long"` = full name. Note: `"narrow"` may produce duplicates in some locales (e.g. `T` for Tue/Thu in English) — that is expected locale convention. |
| `hideOutOfRange`    | `boolean`                       | `false`   | Do not render visible day buttons for dates outside `minDate`/`maxDate` or disabled rules. Layout placeholders are still rendered with `role="presentation"` so the grid stays aligned and accessibility tree contains only real cells. See "`hideOutOfRange` accessibility" below.                                              |
| `lockDeselection`   | `boolean`                       | `false`   | Prevent the user from deselecting the currently selected date                                                                                                                                                                                                                                                                    |
| `blockNavigation`   | `boolean`                       | `false`   | Block keyboard navigation (arrow keys, `PageUp`/`PageDown`) from crossing month boundaries                                                                                                                                                                                                                                       |
| `swipe`             | `boolean`                       | `true`    | Enable swipe gestures to navigate between months                                                                                                                                                                                                                                                                                 |
| `syncViewOnSelect`  | `boolean`                       | `offset === 0` | When a day is clicked, also move the calendar's `viewDate` to that day's month. Defaults to `true` for the primary grid (`offset === 0`) and `false` for any offset grid — so clicking a day in a side month of a multi-month layout no longer steals the primary view. Set explicitly to override. Works in both controlled and uncontrolled mode (the controlled-value round-trip is suppressed for the click that requested keepView). |
| `col`               | `number \| string`              | —         | CSS grid `grid-column` value for layout positioning                                                                                                                                                                                                                                                                              |

### `hideOutOfRange` accessibility

When `hideOutOfRange` is enabled, dates outside `minDate`/`maxDate` (or matching disabled rules) are not rendered as interactive day buttons. To keep the visual grid aligned, an empty placeholder `<div role="presentation" />` is rendered in their place.

WCAG/ARIA semantics:

- Disabled-but-visible cells (default behavior) keep `role="gridcell"`, `aria-disabled="true"`, and an `aria-label` ending in "disabled". Screen readers announce them so users know the position is reachable but blocked.
- Hidden cells (`hideOutOfRange={true}`) are removed from the accessibility tree entirely (`role="presentation"`). They are not announced. The row reports a smaller cell count.
- Rows that end up entirely empty after hiding are also `role="presentation"`.

**Trade-off — keyboard navigation.** Arrow-key navigation is computed by date math, not by what is visible. If the user arrows past the visible edge into a hidden region, focus may not land on a button (because no button was rendered for that date). To keep keyboard traversal predictable, pair `hideOutOfRange` with `blockNavigation` so arrows do not leave the visible range, or prefer the default disabled-and-visible mode when full keyboard reachability matters more than visual cleanliness.

This trade-off is exercised by `axe` checks in `src/__tests__/integration/a11y.test.tsx`.

---

## Modules

Module components are optional building blocks placed as children of `<Calendar>`. Each accepts a `col` prop for CSS grid placement.

---

### CalendarNav

Navigation header with configurable controls.

```tsx
<CalendarNav showMonthPicker showYearPicker clear />
```

### Props

| Prop              | Type               | Default | Description                                                                                                                                                                                                    |
| ----------------- | ------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`           | `string`           | —       | Custom text shown as the header label, max 180 length.                                                                                                                                                         |
| `showMonthPicker` | `boolean`          | `false` | Render the month controls block: previous/next month arrows plus a clickable month label that opens a full-page month grid popup. Mutually exclusive with `compactMonths` (combining both fires a dev warning) |
| `compactMonths`   | `boolean`          | `false` | Render the same month popup behind a compact dropdown button (no inline arrows). Use this **instead of** `showMonthPicker` for a smaller header                                                                |
| `showYearPicker`  | `boolean`          | `false` | Render the year controls block: previous/next year arrows plus a clickable year label that opens a year grid popup. Mutually exclusive with `compactYears`                                                     |
| `compactYears`    | `boolean`          | `false` | Render the same year popup behind a compact dropdown button. Use this **instead of** `showYearPicker`                                                                                                          |
| `animateTime`     | `boolean`          | `true`  | Enable per-digit flip animation for both `showTime` (the inline display of the selected time) and `showNowTime` (the live system clock). Set `false` to render plain text                                      |
| `monthLabel`      | `boolean`          | `false` | Show the current month name as plain text (no controls, no popup)                                                                                                                                              |
| `yearLabel`       | `boolean`          | `false` | Show the current year as plain text (no controls, no popup)                                                                                                                                                    |
| `showTime`        | `boolean`          | `false` | Show a button that opens the time picker popup                                                                                                                                                                 |
| `compactTime`     | `boolean`          | `false` | Show a compact icon-only button (clock icon) that opens the same time picker popup as `showTime`. Use instead of `showTime` for a smaller header                                                               |
| `showNowTime`     | `boolean`          | `false` | Show the current system time as a live read-only display (updates every second). A pulsing dot indicates it is live. Respects the `hour12` setting from `<Calendar>`                                           |
| `seconds`         | `boolean`          | `false` | Include seconds in `showTime` and `showNowTime` displays, and in the time picker popup                                                                                                                         |
| `home`            | `boolean`          | `false` | Show a button that navigates back to today                                                                                                                                                                     |
| `homeLabel`       | `string`           | global / `"Go to current month"` | aria-label for the `home` button. Overrides `<Calendar homeLabel>`                                                                                                                                                         |
| `clear`           | `boolean`          | `false` | Show a button that clears the current selection                                                                                                                                                                |
| `clearLabel`      | `string`           | global / `"Clear"` | aria-label for the `clear` button. Overrides `<Calendar clearLabel>`                                                                                                                                                       |
| `themeToggle`     | `boolean`          | `false` | Show a light/dark theme toggle button. Works with the default palette and with imported/custom theme families.                                                                                                      |
| `offset`          | `number`           | `0`     | Month offset relative to `viewDate`. Use to render two synced nav headers in `cols={2}` layouts (`<CalendarNav offset={1} />`)                                                                                 |
| `col`             | `number \| string` | —       | CSS grid `grid-column` value                                                                                                                                                                                   |
| `bound`           | `"from" \| "to"`   | —       | In range mode binds the nav to a range boundary. Header reflects that bound's date; arrows / popups / `home` / `clear` write to that bound only. Falls back to opposite bound when own bound is null           |

### Behavior matrix

`<CalendarNav>` is a hybrid module — its category depends on which props are enabled.

| Prop                                                             | Effect                                                                                                                     | Fires `onChange`? | Respects `readOnly`?                              |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------- |
| `showMonthPicker` / `compactMonths` / month/year arrows / popups | `navigateTo` (changes `viewDate`)                                                                                          | no                | n/a — navigation                                  |
| `home`                                                           | `navigateTo(today)`                                                                                                        | no                | n/a — navigation                                  |
| `monthLabel` / `yearLabel` / `showNowTime`                       | display only                                                                                                               | no                | n/a                                               |
| `themeToggle`                                                    | toggles UI theme via `UIContext.toggleTheme`                                                                               | no                | yes — UI not blocked                              |
| `clear`                                                          | `onChangeDate(null)` — clears current selection. With `bound` clears that boundary only via `onRangeBoundSet(bound, null)` | yes               | yes — button disabled when `readOnly`             |
| `showTime` / `compactTime`                                       | opens time popup; confirm calls `onChangeTime`                                                                             | yes (on confirm)  | yes — drums and confirm read-only when `readOnly` |

Use this table to decide which guarantees apply to your composition. A `<CalendarNav>` without `clear` and without `showTime` is purely navigational and never fires `onChange`.

---

### CalendarMonthsGrid

Full-page **month navigation grid** (12 cells). Clicking a month sets `viewDate` to that month — it does **not** select a date and does **not** call `onChange`. Pair with `<CalendarDays>` (or another interactive module) for date selection, or use `onMonthSelect` for a standalone month-picker UX.

```tsx
<CalendarMonthsGrid />
```

Standalone month picker (no `CalendarDays` needed):

```tsx
<Calendar>
  <CalendarMonthsGrid onMonthSelect={(date) => setMonth(date)} />
</Calendar>
```

`date` is the navigated `viewDate` — first day of the picked month, same year.

### Props

| Prop                | Type                   | Default | Description                                                                       |
| ------------------- | ---------------------- | ------- | --------------------------------------------------------------------------------- |
| `short`             | `boolean`              | `true`  | Use abbreviated month names (e.g. "Jan" instead of "January")                     |
| `disableOutOfRange` | `boolean`              | `true`  | Disable months outside `minDate`/`maxDate` range                                  |
| `hideOutOfRange`    | `boolean`              | `false` | Completely hide months outside the allowed range                                  |
| `col`               | `number \| string`     | —       | CSS grid `grid-column` value                                                      |
| `onMonthSelect`     | `(date: Date) => void` | —       | Fires after a month click. Receives navigated `viewDate` (first day of the month) |

---

### CalendarYearsGrid

Full-page **year navigation grid** with pagination. Clicking a year sets `viewDate` to that year — it does **not** select a date and does **not** call `onChange`. Pair with `<CalendarDays>` (or another interactive module) for date selection, or use `onYearSelect` for a standalone year-picker UX.

```tsx
<CalendarYearsGrid yearsPerPage={12} />
```

Custom first year / no pagination controls:

```tsx
<CalendarYearsGrid startYear={2014} yearsPerPage={12} showControls={false} />
```

Standalone year picker:

```tsx
<Calendar>
  <CalendarYearsGrid onYearSelect={(date) => setYear(date.getFullYear())} />
</Calendar>
```

### Props

| Prop                | Type                   | Default | Description                                                                                       |
| ------------------- | ---------------------- | ------- | ------------------------------------------------------------------------------------------------- |
| `yearsPerPage`      | `number`               | `10`    | Number of years shown per page. Integer in 1..40; out-of-range values are clamped and warn in dev |
| `startYear`         | `number`               | —       | First year rendered on the first page. Integer in 1900..2100; out-of-range values are clamped     |
| `showControls`      | `boolean`              | `true`  | Render the previous/next pagination controls and visible year range label                         |
| `disableOutOfRange` | `boolean`              | `true`  | Disable years outside `minDate`/`maxDate` range                                                   |
| `hideOutOfRange`    | `boolean`              | `false` | Completely hide years outside the allowed range                                                   |
| `col`               | `number \| string`     | —       | CSS grid `grid-column` value                                                                      |
| `onYearSelect`      | `(date: Date) => void` | —       | Fires after a year click. Receives navigated `viewDate` (same month/day, picked year)             |

---

### CalendarTimeGrid

Time picker — hours, minutes, optional seconds, AM/PM toggle when `hour12` is enabled.

```tsx
<CalendarTimeGrid seconds />
```

Step granularity is configured via the `timeStep` prop on `<Calendar>` and applies to both this inline grid and the `CalendarNav` time popup:

```tsx
<Calendar timeStep={{ minute: 5 }}>
  <CalendarTimeGrid />
</Calendar>
```

With `minute: 5` the minute drum cycles `0, 5, 10, …, 55`; `minute: 30` cycles `0, 30`; `hour: 2` halves the hour range. `aria-valuemax`, keyboard `Arrow`/`Home`/`End`, and wheel/touch snapping all follow the configured step.

In `mode="range"`, pass `bound="from"` or `bound="to"` when the time grid should edit a specific range boundary:

```tsx
<Calendar mode="range">
  <CalendarTimeGrid bound="from" />
  <CalendarTimeGrid bound="to" />
</Calendar>
```

Standalone time picker (no selected date required):

```tsx
<Calendar>
  <CalendarTimeGrid
    seconds
    onTimeSelect={(d) =>
      setTime({ h: d.getHours(), m: d.getMinutes(), s: d.getSeconds() })
    }
  />
</Calendar>
```

`onTimeSelect` fires on every drum change. The Date is built from `viewDate` with the new time — read `getHours()` / `getMinutes()` / `getSeconds()` for the time-only value.

### Props

| Prop           | Type                   | Default | Description                                                                                                                                                                                                                                                                                         |
| -------------- | ---------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bound`        | `"from" \| "to"`       | —       | Range-only: edit the time of a specific range boundary. Without `bound`, the grid edits whichever selected date matches `viewDate`; if neither boundary matches, time stays pending and does not fire `onChange`                                                                                    |
| `seconds`      | `boolean`              | `false` | Show a third drum for seconds (0–59)                                                                                                                                                                                                                                                                |
| `col`          | `number \| string`     | —       | CSS grid `grid-column` value                                                                                                                                                                                                                                                                        |
| `labels`       | `"short" \| "long"`    | —       | Show a small label above each drum. `"short"` → `HH` / `MM` / `SS` (clock convention, not localized). `"long"` → localized field name via `Intl.DisplayNames(locale, { type: "dateTimeField" })` — e.g. `hour` / `minute` / `second` in EN, `час` / `минута` / `секунда` in RU. Omit to hide labels |
| `onTimeSelect` | `(date: Date) => void` | —       | Fires on any drum change. Receives Date with new time — use `getHours()` / `getMinutes()`                                                                                                                                                                                                           |

---

### CalendarPresets

Quick-select preset buttons. Renders **nothing** by default — pass `presets` with the entries you want.

Two entry forms are supported:

- **Simple** — `{ label, value, range? }` (declarative: day offsets, fixed dates, fixed-length ranges)
- **Advanced** — `{ id, label, getValue }` (function form with `PresetContext`)

#### Types

All preset types are re-exported from the root barrel — no deep imports needed.

```ts
import type {
  PresetEntry,
  SimplePresetDef,
  AdvancedPresetDef,
  PresetContext,
  PresetRangeValue,
} from "@dateforge/react-calendar";

// Simple — declarative
interface SimplePresetDef {
  id?: string;
  label: string | ((locale: string) => string);
  value: number | Date; // number = day offset from today; Date = fixed
  range?: number; // length in days after `value`; absent = single
}

// Advanced — function form
interface AdvancedPresetDef {
  id: string;
  label: string | ((locale: string) => string);
  getValue: (ctx: PresetContext) => Date | PresetRangeValue | null;
  //   Date         → single-date preset
  //   {from, to}   → range preset (shown only in range mode)
  //   null         → preset unavailable this render; button hidden
}

interface PresetContext {
  now: Date; // real `new Date()` with time taken from viewDate
  isValid: (date: Date) => boolean; // checks against minDate / maxDate / disabled
  locale: string; // BCP-47 locale from calendar config
}

interface PresetRangeValue {
  from: Date; // always non-null
  to: Date;
}

type PresetEntry = SimplePresetDef | AdvancedPresetDef;
```

`label` accepts a function `(locale) => string` for locale-aware labels. `id` is optional on `SimplePresetDef` (auto-derived from label) and required on `AdvancedPresetDef` for stable React keys.

Import `basicPresets` for the classic pack.

```tsx
import { basicPresets } from "@dateforge/react-calendar";
import { CalendarPresets } from "@dateforge/react-calendar/modules";

// empty — renders nothing
<CalendarPresets />

// basic pack
<CalendarPresets presets={basicPresets} />

// inline, no imports needed
<CalendarPresets presets={[
  { label: "Today",       value: 0 },
  { label: "In 3 days",   value: 3 },
  { label: "Last 7 days", value: -6, range: 6 },
  { label: "New Year",    value: new Date(2026, 0, 1) },
]} />

// mix pack + your own
<CalendarPresets presets={[
  ...basicPresets,
  { label: "Start of month", getValue: ({ now }) => new Date(now.getFullYear(), now.getMonth(), 1) },
]} />
```

### Props

| Prop      | Type               | Default | Description                                                 |
| --------- | ------------------ | ------- | ----------------------------------------------------------- |
| `presets` | `PresetEntry[]`    | `[]`    | Entries to render. Empty / omitted → module renders nothing |
| `col`     | `number \| string` | —       | CSS grid `grid-column` value                                |

---

### CalendarSelectedDates

Displays the currently selected dates as chips. Clicking a chip navigates the view to that date (when `allowNavigate`). An optional clear-all button next to the chips wipes the selection unless the calendar is `readOnly`. Set `allowClearPerChip` to add a remove button inside each chip; in range mode it clears the matching `from` / `to` bound. In multiple mode, `maxVisibleChips` can cap the visible chip count and collapse the rest into an overflow chip such as `+27`; clicking that overflow chip expands the hidden dates. In range mode, `maxVisibleChips` is ignored: the start chip and optional end chip render normally.

```tsx
<CalendarSelectedDates allowClear animated align="center" />
```

### Props

| Prop              | Type                            | Default      | Description                                                                                         |
| ----------------- | ------------------------------- | ------------ | --------------------------------------------------------------------------------------------------- |
| `allowClear`      | `boolean`                       | `false`      | Show a clear-all button next to the chips. In `readOnly`, the button remains disabled and cannot clear selection |
| `allowClearPerChip` | `boolean`                     | `false`      | Show a remove button inside each chip. Removes that date; in range mode, clears the matching bound   |
| `allowNavigate`   | `boolean`                       | `true`       | Clicking a chip navigates the calendar to that date                                                 |
| `animated`        | `boolean`                       | `true`       | Animate chips appearing and disappearing                                                            |
| `align`           | `"left" \| "center" \| "right"` | `"left"`     | Horizontal alignment of the chip list                                                               |
| `clearLabel`      | `string`                        | global / `"Clear"` | aria-label for the clear-all button. Overrides `<Calendar clearLabel>`                              |
| `maxVisibleChips` | `number`                        | —            | Maximum number of selected-date chips before overflow. Applies to `mode="multiple"` only; range chips are not collapsed |
| `overflowLabel`   | `string`                        | `"+{count}"` | Overflow chip label. `{count}` is replaced with the number of hidden selected dates                  |
| `showTime`        | `boolean`                       | `false`      | Include time (hours and minutes) in the chip label. Respects the `hour12` setting from `<Calendar>` |
| `col`             | `number \| string`              | —            | CSS grid `grid-column` value                                                                        |

---

### CalendarInfo

Displays compact selection feedback: selected count, range length, relative time, empty-state text, a home button, and an optional clear-all button. It is intentionally not a date-chip renderer — use [`CalendarSelectedDates`](#calendarselecteddates) when users need visible dates, per-chip remove, or chip navigation.

```tsx
<CalendarInfo emptyLabel="Select a date" showRelative allowClear />
```

### Default summaries

When `showSummary` is `true` and no custom `formatter` is passed:

- `mode="single"` with a selected date shows `1 day`.
- `mode="multiple"` shows the selected count as localized days, e.g. `3 days`.
- `mode="range"` with one boundary selected shows `1 day`.
- `mode="range"` with both boundaries selected shows a range metric controlled by `rangeStyle`.

`showRelative` can be enabled at the same time as `showSummary`; the module renders a second compact text chip such as `in 3 days`. Relative time always uses the current selected value (`selectedDate`, first selected date, `rangeStart`, then `rangeEnd`) and compares it to today.

Keyboard: `showHome` and `allowClear` render native buttons. When both actions are available, `ArrowLeft` / `ArrowUp`, `ArrowRight` / `ArrowDown`, `Home`, and `End` move focus between them; `Enter` / `Space` activate the focused button.

### Props

| Prop           | Type                                           | Default     | Description                                                                                                                                                       |
| -------------- | ---------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `allowClear`   | `boolean`                                      | `false`     | Show a clear-all button when there is a selection. Clears `null` in single mode, `[]` in multiple mode, and `{ from: null, to: null }` in range mode. Disabled in `readOnly` |
| `align`        | `"left" \| "center" \| "right"`                | `"left"`    | Horizontal alignment of the text group                                                                                                                            |
| `animated`     | `boolean`                                      | `true`      | Animate the module's height when content appears/disappears                                                                                                        |
| `clearLabel`   | `string`                                       | global / `"Clear"` | aria-label for the clear-all button. Overrides `<Calendar clearLabel>`                                                                                  |
| `col`          | `number \| string`                             | —           | CSS grid `grid-column` value                                                                                                                                      |
| `emptyLabel`   | `React.ReactNode`                              | `null`      | Text/content shown when nothing is selected. Boolean values and empty strings are treated as empty                                                                |
| `formatter`    | `(value: CalendarInfoValue) => React.ReactNode` | —           | Custom summary renderer. Receives `Date`, `Date[]`, `{ from, to }`, or `null`. Overrides the default summary only; it does not affect `showRelative`               |
| `homeLabel`    | `string`                                       | global / `"Go to current month"` | aria-label for the home/current-month button. Overrides `<Calendar homeLabel>`                                                                         |
| `prefix`       | `React.ReactNode`                              | —           | Small content rendered before the summary. Hidden for `emptyLabel` and hidden when there is no summary                                                             |
| `rangeStyle`   | `"days" \| "duration"`                         | `"days"`    | Range-only summary style for complete ranges. `"days"` uses calendar-day difference; `"duration"` uses elapsed time (`3 days 4 hours`, etc.)                       |
| `showHome`     | `boolean`                                      | `false`     | Show a button that navigates to the current month. Does not change selection                                                                                       |
| `showRelative` | `boolean`                                      | `false`     | Show relative time for the current selected value, compared to today                                                                                               |
| `showSummary`  | `boolean`                                      | `true`      | Show the default/custom summary. Set `false` when you only want `emptyLabel`, `showRelative`, `showHome`, or `allowClear`                                          |

`CalendarInfoValue` is exported from the root package and from the module:

```ts
type CalendarInfoValue =
  | Date
  | Date[]
  | { from: Date | null; to: Date | null }
  | null;
```

Custom formatter example:

```tsx
<CalendarInfo
  formatter={(value) => {
    if (Array.isArray(value)) return `${value.length} dates selected`;
    if (value instanceof Date) return "1 date selected";
    if (value?.from && value.to) return "Range selected";
    return null;
  }}
/>
```

Notes:

- `CalendarInfo` is a display / feedback module. `showHome` navigates view only; `allowClear` is the only prop that mutates selection.
- `rangeStyle="days"` counts calendar-day boundaries, so Jun 10 → Jun 17 is `7 days`.
- `rangeStyle="duration"` uses timestamps, so Jun 10 10:00 → Jun 13 14:00 is `3 days 4 hours`.
- Relative output depends on the SSR-safe `useToday()` value. On the server and first client render, today is not available yet, so relative text appears after mount.

---

### CalendarManualInput

Text input that lets the user type a date directly. Adapts shape to the calendar `mode`:

- `mode="single"` — one input.
- `mode="range"` — two inputs separated by `—`, one per boundary.
- `mode="multiple"` — one "add date" input plus a chip per selected date; each chip is editable.

```tsx
<CalendarManualInput label="Date" allowClear={false} />
```

### Props

| Prop         | Type                            | Default  | Description                                                   |
| ------------ | ------------------------------- | -------- | ------------------------------------------------------------- |
| `allowClear` | `boolean`                       | `true`   | Show a top-level clear button that wipes the entire selection |
| `align`      | `"left" \| "center" \| "right"` | `"left"` | Horizontal alignment of the input content                     |
| `clearLabel` | `string`                        | global / `"Clear"` | aria-label for clear controls. Overrides `<Calendar clearLabel>` |
| `col`        | `number \| string`              | —        | CSS grid `grid-column` value                                  |
| `label`      | `React.ReactNode`               | —        | Inline label shown before the input / selected chips          |
| `format`     | `string`                        | `"DD.MM.YYYY"` | Date input format. Token string with `DD`, `MM`, `YYYY` + any single-char separator(s). See [Input format](#input-format). |

### Input format

The format is controlled by the `format` prop. Default: `"DD.MM.YYYY"`. The format string accepts three tokens (`DD`, `MM`, `YYYY`) and any non-token characters as separators. Invalid format strings fall back to the default with no error.

```tsx
<CalendarManualInput format="DD.MM.YYYY" />   // 15.06.2024 (default)
<CalendarManualInput format="MM/DD/YYYY" />   // 06/15/2024 (US)
<CalendarManualInput format="YYYY-MM-DD" />   // 2024-06-15 (ISO)
<CalendarManualInput format="DD-MM-YYYY" />   // 15-06-2024 (EU dash)
```

The input applies a digit-only mask: separators are inserted automatically as the user types digits, non-digit input is rejected, and exactly 8 digits are accepted (4 for the year, 2 each for day and month). The format string also serves as the placeholder.

```text
format="DD.MM.YYYY"
"1"        → "1"
"15"       → "15"
"156"      → "15.6"
"15062024" → "15.06.2024"

format="YYYY-MM-DD"
"2024"     → "2024"
"202406"   → "2024-06"
"20240615" → "2024-06-15"
```

Time is **not** parseable from the input. To set time use `<CalendarTimeGrid>` or `<CalendarNav showTime>`.

### When `onChange` fires

Typing **does not** commit by itself. The user has to confirm the typed date with `Enter` or by clicking the inline apply button (`✓`). Validation runs per keystroke, but its result feeds the visual state (valid / invalid wrapper, apply button enabled / disabled), not the consumer's `onChange`.

| User action                                                          | Effect                                                                                                                              |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Typing characters                                                    | Updates internal text and validity state. **No `onChange`.**                                                                        |
| `Enter`                                                              | Commits the typed date if valid and allowed. Exits edit mode. `onChange` fires. Otherwise no commit, no `onChange`.                 |
| Click the inline apply (`✓`) button                                  | Same as `Enter`.                                                                                                                    |
| `Escape`                                                             | Clears the input text without changing selection. No `onChange`.                                                                    |
| Click a chip / filled date slot                                      | Enters edit mode for that slot. No `onChange` until the user commits via Enter / apply.                                             |
| Click the inline clear (`×`) icon while editing                      | Clears the local input text only. No `onChange`.                                                                                    |
| Per-chip remove icon (multiple mode)                                 | Removes that single date from the selection — `onChange` fires.                                                                     |
| Top-level clear button (`allowClear`)                                | Clears the entire selection — `onChange(null)` (single) / `onChange({ from: null, to: null })` (range) / `onChange([])` (multiple). |
| `Enter` / apply on a date outside `minDate` / `maxDate` / `disabled` | Wrapper shows invalid state (red). No commit, no `onChange`.                                                                        |
| `Enter` / apply on a malformed date (`32.13.2024`, etc.)             | No commit, no `onChange`.                                                                                                           |
| Calendar root has `readOnly`                                         | Input is HTML `readOnly`. All commits / clears no-op. See "`readOnly` contract".                                                    |

Per-keystroke commit is intentionally avoided — it would fire `onChange` for every intermediate valid date the user types through (e.g. `01.01.0202` is valid before the user finishes typing `2024`). The Enter/apply confirmation makes intent explicit.

### Constraints respected

`minDate`, `maxDate`, and the `disabled` config from `<Calendar>` are all enforced. Disallowed dates trigger the invalid state and do not commit. Multi-mode inputs additionally respect `maxDates` — the "add date" input is hidden once the cap is reached.

---

### CalendarDaysTrack

A horizontal scrollable strip of day numbers for the current month.

```tsx
<CalendarDaysTrack showMonthLabel />
```

### Props

| Prop             | Type               | Default | Description                                                                               |
| ---------------- | ------------------ | ------- | ----------------------------------------------------------------------------------------- |
| `showMonthLabel` | `boolean`          | `false` | Show the abbreviated month name above the active day item                                 |
| `bound`          | `"from" \| "to"`   | —       | In range mode binds the track to a range boundary. Without it tracks single-mode behavior |
| `col`            | `number \| string` | —       | CSS grid `grid-column` value                                                              |

> **Scroll axis limitation.** The track loops day 1..N within `viewDate.getMonth()`. Scrolling past the last day wraps back to day 1 of the same month — it does not advance the month. Compose with `<CalendarMonthsTrack>` / `<CalendarYearsTrack>` / `<CalendarNav>` to change month or year. See `ARCHITECTURE.md → D. Hybrid modules → Track scroll axis (current limitation)`.

In `mode="multiple"` the track automatically renders a save / remove button. Item click only previews; the button commits the date (toggles in/out of `selectedDates`). The button shows `Check` when the previewed date is not selected, `Clear` (×) when it is.

```tsx
<Calendar mode="range">
  <CalendarDaysTrack bound="from" />
  <CalendarDaysTrack bound="to" />
</Calendar>
```

#### Bound coordination

When two `bound` modules (Tracks or `<CalendarNav bound>`) coexist:

- The `to`-bound module never moves before `rangeStart`, and the `from`-bound module never moves past `rangeEnd`. Per-field min/max on each track is recomputed each render from the opposite bound + the track's own other fields.
- Crossing is clamped (no swap): writing a `from > to` (or `to < from`) collapses the moving bound onto the opposite. Identity stays stable mid-drag.
- A bound module whose own date is `null` mirrors the opposite as starting reference (so the `to` track lands at `from` once `from` is set).

---

### CalendarMonthsTrack

A horizontal scrollable strip of month names for the current year.

```tsx
<CalendarMonthsTrack short={false} />
```

### Props

| Prop            | Type                   | Default | Description                                                                            |
| --------------- | ---------------------- | ------- | -------------------------------------------------------------------------------------- |
| `short`         | `boolean`              | `true`  | Use abbreviated month names                                                            |
| `showYearLabel` | `boolean`              | `false` | Show the year under the active month item                                              |
| `bound`         | `"from" \| "to"`       | —       | In range mode binds the track to a range boundary                                      |
| `col`           | `number \| string`     | —       | CSS grid `grid-column` value                                                           |
| `onMonthSelect` | `(date: Date) => void` | —       | Fires after the user lands on a month. Receives navigated date (or clamped bound date) |

> **Scroll axis limitation.** The track loops month 0–11 within `viewDate.getFullYear()`. Scrolling past December does not advance the year — it wraps back to January of the same year. Compose with `<CalendarYearsTrack>` or `<CalendarNav>` to change year. See `ARCHITECTURE.md → D. Hybrid modules → Track scroll axis (current limitation)`.

---

### CalendarYearsTrack

A horizontal scrollable strip of years.

```tsx
<CalendarYearsTrack />
```

### Props

| Prop           | Type                   | Default | Description                                                                           |
| -------------- | ---------------------- | ------- | ------------------------------------------------------------------------------------- |
| `bound`        | `"from" \| "to"`       | —       | In range mode binds the track to a range boundary                                     |
| `col`          | `number \| string`     | —       | CSS grid `grid-column` value                                                          |
| `onYearSelect` | `(date: Date) => void` | —       | Fires after the user lands on a year. Receives navigated date (or clamped bound date) |

### Track behavior matrix

`MonthsTrack` / `YearsTrack`:

| mode       | `bound`         | Click does                             |
| ---------- | --------------- | -------------------------------------- |
| `single`   | —               | `navigateTo` (changes view month/year) |
| `range`    | `"from"`/`"to"` | `setLocalView` + `onRangeBoundSet`     |
| `range`    | —               | `navigateTo`                           |
| `multiple` | —               | `navigateTo`                           |

`DaysTrack`:

| mode       | `bound`         | Click item        | Auto button (multi only)                         |
| ---------- | --------------- | ----------------- | ------------------------------------------------ |
| `single`   | —               | `onChangeDate`    | —                                                |
| `range`    | `"from"`/`"to"` | `onRangeBoundSet` | —                                                |
| `range`    | —               | `setLocalView`    | —                                                |
| `multiple` | —               | preview only      | toggles in/out of selection (Check ↔ Clear icon) |

In multiselect mode the active item follows the date in `selectedDates[]` whose day matches the current `viewDate`. Without a match the track centers on `viewDate` without active highlight.

---

## Design space

12 composable modules, ~80 public props (≈60 boolean), 28 built-in theme families, 7 appearances, plus `createTheme`/`createAppearance` for custom tokens.

| Layer | Count |
|---|---|
| Module prop combinations (full calendar) | ~10^10 |
| × built-in theme families | × 28 |
| × appearances | × 7 |
| **= built-in configurations** | **~2.0 trillion** |
| + `createTheme` / `createAppearance` | ∞ |

Every configuration is type-safe, tree-shakeable, and SSR-compatible.

---

## Utility Functions

### Theming

Three ways to apply a theme.

**Option 1 — pre-built theme family** (one of the 28 built-in families):

```ts
// barrel — all families, bundler tree-shakes to just the one you import
import { nebula } from "@dateforge/react-calendar/themes";

// per-theme — single file, zero overhead from other theme families
import { nebula } from "@dateforge/react-calendar/themes/nebula";

<Calendar theme={nebula} />;
<Calendar theme={nebula} dark />;
```

Each exported theme is a `ThemeFamily`: one logical palette with `light` and `dark` variants. The consuming bundler includes only the file you import. Theme vars are applied as inline CSS custom properties on the calendar container — no extra CSS file needed.

**What ships in the core bundle.** The default light/dark palette and the `"auto"` resolver are built into `<Calendar>` itself. Omit `theme` for system-aware auto mode. Pass `light` or `dark` when you want a specific initial mode. For any named palette (`nebula`, `dracula`, `riso`, …), import the theme family object.

**Option 2 — default palette**:

```ts
<Calendar />       // follows system preference (default)
<Calendar light /> // default palette, light initial mode
<Calendar dark />  // default palette, dark initial mode
```

The default auto mode tracks `prefers-color-scheme` and switches in real time. Named palette strings like `"nebula"` are not valid. In development a `console.warn` is emitted; in production the value is ignored. Always import the theme family object instead.

**Option 3 — custom theme family** via `createTheme()`:

```ts
import { createTheme } from "@dateforge/react-calendar";

const myTheme = createTheme({
  highlight: "#6366f1",
  range: "#22c55e",
  weekend: "#ef4444",
  dark: {
    backdrop: "#0f172a",
    text: "#f1f5f9",
  },
});

<Calendar theme={myTheme} />;
<Calendar theme={myTheme} light />;
```

`createTheme` returns a `ThemeFamily`. Root tokens apply to both modes; `light` and `dark` override only their own variant. Missing tokens are filled from the default light/dark palettes.

### Appearances

Three ways to apply an appearance.

**Default — omit the prop entirely:**

```tsx
<Calendar /> // default appearance, nothing to import
```

**Pre-built appearance object** (one of 5 presets):

```ts
// barrel — bundler tree-shakes to just the one you import
import { loft } from "@dateforge/react-calendar/appearances";

// per-appearance — single file
import { compact } from "@dateforge/react-calendar/appearances/compact";

<Calendar appearance={compact} />;
```

Available presets: `soft` `compact` `square` `bubble` `loft`

Each preset is a self-contained object. Vars are applied as inline CSS custom properties — no extra CSS file required.

**Custom appearance** via `createAppearance()`:

```ts
import { createAppearance } from "@dateforge/react-calendar";

const myAppearance = createAppearance({ radius: "0", spacing: "0.4em" });

<Calendar appearance={myAppearance} />;
```

### `createTheme(theme)`

| Token          | CSS variable | Role                                                                                                                                      |
| -------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `highlight`    | `--c-h`      | **Primary accent.** Background of the selected day cell, active buttons, nav accents. The most impactful token.                           |
| `activeText`   | `--c-at`     | Readable text/icon color on top of `highlight`. Built-in themes keep it at 4.5:1+ against `highlight`.                                    |
| `todayDot`     | `--c-t-d`    | Fallback dot color for selected today. Built-in themes choose a contrasting ink that matches the theme's active surface.                   |
| `accent`       | `--c-a`      | Inverted/accent surface color for secondary month labels and decorative active outlines.                                                  |
| `backdrop`     | `--c-b`      | Main calendar background.                                                                                                                 |
| `tone`         | `--c-t`      | Secondary / muted background for rows, tracks, and hover states.                                                                          |
| `text`         | `--c-c`      | Default text color for all labels and numbers.                                                                                            |
| `stroke`       | `--c-s`      | Border and separator color between cells and sections.                                                                                    |
| `shadow`       | `--c-x`      | Drop-shadow color. Should include alpha (e.g. `"#6366f130"`).                                                                             |
| `disabled`     | `--c-d`      | Decorative disabled surface color. Kept for non-text affordances; do not rely on it for readable disabled text.                           |
| `mutedText`    | `--c-m`      | Secondary readable foreground: outside-month dates, week numbers, placeholders, separators.                                               |
| `disabledText` | `--c-dt`     | Readable disabled / unavailable foreground. Built-in themes keep it at 4.5:1+ against `backdrop` and `tone`.                              |
| `weekend`      | `--c-we`     | Weekend text accent for weekend day labels and bold weekend day numbers. Built-in themes keep it at 4.5:1+ against `backdrop` and `tone`. |
| `range`        | `--c-r`      | Background tint for days that fall inside a selected date range.                                                                          |
| `error`        | `--c-e`      | Error / destructive signal.                                                                                                               |

`activeText`, `mutedText`, `disabledText`, and `weekend` are intentionally contrast-aware text tokens, while `accent` and `disabled` can stay more expressive as surface/decorative colors.

---

### `createAppearance(tokens)`

Creates a custom appearance object to pass to the `appearance` prop.

```ts
import { createAppearance } from "@dateforge/react-calendar";

const myAppearance = createAppearance({
  radius: "2px",
  fontSize: "13px",
  dayFontSize: "1.05em",
});
```

| Token             | Description                                                                         |
| ----------------- | ----------------------------------------------------------------------------------- |
| `radius`          | Border radius for day cells and buttons                                             |
| `containerRadius` | Border radius for the calendar container                                            |
| `border`          | Border width for the container and internal dividers                                |
| `containerGap`    | Gap between calendar module areas. Use `"0px"` for borderless layouts              |
| `spacing`         | Internal padding / gap between elements                                             |
| `navPadding`      | Padding for `CalendarNav`                                                           |
| `navMinHeight`    | Minimum height for `CalendarNav`                                                    |
| `navFontSize`     | Root font-size of `CalendarNav` container — cascades to all nav children via `em`   |
| `navMetaFontSize` | Font-size of the year/month text inside the nav's current selector                  |
| `navButtonBg`     | Background for month/year picker buttons in `CalendarNav`                           |
| `font`            | Font family                                                                         |
| `fontSize`        | Base font size                                                                      |
| `dayFontSize`     | Font size for day numbers. Accepts fixed or responsive CSS values like `clamp(...)` |
| `dayWeight`       | Font weight for non-selected day numbers                                            |
| `controlFontSize` | Font size for primary controls such as nav/time buttons                             |
| `daysSpacing`     | Gap between individual day cells                                                    |
| `dayRatio`        | Aspect ratio of each day cell (e.g. `"1 / 1"`)                                      |
| `trackHeight`     | Height of Track module items                                                        |
| `shadowSm`        | Small shadow value                                                                  |
| `shadowMd`        | Medium shadow value                                                                 |
| `shadowLg`        | Large shadow value                                                                  |
| `transition`      | CSS transition shorthand applied to interactive elements                            |
| `todayOutlineWidth` | Width of the today outline. Use `"0px"` to hide it                                |
| `selectedDayWeight` | Font weight for selected day cells                                                |
| `selectedTextDotSize` | Size of the today dot                                                            |
| `selectedTextDotOffset` | Inset between the today dot and the lower edge of the day cell                 |

---

### `createDisabled(init)`

Creates a `DisabledConfig` object to pass to the `disabled` prop.

```ts
import { createDisabled } from "@dateforge/react-calendar";

const disabled = createDisabled({
  weekdays: [0, 6], // disable Sundays and Saturdays
  before: new Date("2024-01-01"),
  dates: [new Date("2024-06-15")],
});
```

| Option     | Type                         | Description                                           |
| ---------- | ---------------------------- | ----------------------------------------------------- |
| `all`      | `boolean`                    | Disable every date                                    |
| `weekends` | `boolean`                    | Disable Saturday and Sunday                           |
| `weekdays` | `number[]`                   | Disable specific weekdays (0 = Sunday … 6 = Saturday) |
| `before`   | `Date`                       | Disable all dates before this date                    |
| `after`    | `Date`                       | Disable all dates after this date                     |
| `dates`    | `Date[]`                     | Disable specific individual dates                     |
| `ranges`   | `{ from: Date; to: Date }[]` | Disable one or more date ranges                       |

#### Defensive handling

`createDisabled` validates every input and silently drops malformed entries. In development each drop emits a deduped `console.warn`; in production the function never throws.

| Bad input                                               | Behavior                                              |
| ------------------------------------------------------- | ----------------------------------------------------- |
| `init` is not an object                                 | Returns empty config + warn                           |
| `before` / `after` is not a valid Date                  | Rule skipped + warn                                   |
| Item in `dates` is not a Date or is `Invalid Date`      | Item dropped + warn; valid items kept                 |
| `dates` is not an array                                 | Rule skipped + warn                                   |
| Item in `ranges` lacks valid `from` / `to`              | Item dropped + warn; valid items kept                 |
| Range with `from > to`                                  | Values swapped + warn (range still applied correctly) |
| `weekdays` contains values outside 0..6 or non-integers | Bad values dropped + warn                             |
| `weekdays` is not an array                              | Rule skipped + warn                                   |

The function never returns an object whose `rules` contain malformed entries — downstream code (`checkIsDateDisabled`) receives only well-formed rules.

---

### Presets

Presets are plain objects. Pass an array of them to `<CalendarPresets presets={[...]} />`. Two forms are supported.

#### Simple form — `SimplePresetDef`

Declarative. Covers day offsets, fixed dates, fixed-length ranges. Zero imports needed.

| Field   | Type                                   | Description                                                                                                                                                                                                                                  |
| ------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`    | `string` (optional)                    | Stable React key. Auto-derived from `label` / index if omitted                                                                                                                                                                               |
| `label` | `string \| (locale: string) => string` | Button text. Function form for locale-aware labels                                                                                                                                                                                           |
| `value` | `number \| Date`                       | `number` — day offset from today (neg = past, pos = future). `Date` — absolute fixed date                                                                                                                                                    |
| `range` | `number` (optional)                    | Length of range in days after `value`. Absent → single date. Any number → range. Range presets are rendered **only** when `<Calendar mode="range" />`; in `single` and `multiple` modes they are silently filtered out (no button rendered). |

`range` examples:

| `value`                | `range` | Result                                         |
| ---------------------- | ------- | ---------------------------------------------- |
| `0`                    | —       | Today (single)                                 |
| `7`                    | —       | Today + 7 (single)                             |
| `-6`                   | `6`     | `{ from: today-6, to: today }` (7-day span)    |
| `0`                    | `13`    | `{ from: today, to: today+13 }` (next 2 weeks) |
| `new Date(2026, 0, 1)` | —       | Jan 1 2026 (fixed single)                      |
| `new Date(2026, 0, 1)` | `89`    | `{ from: Jan 1, to: Apr 1 }` (fixed Q1)        |

```tsx
<CalendarPresets
  presets={[
    { label: "Today", value: 0 },
    { label: "In 3 days", value: 3 },
    { label: "Last 7 days", value: -6, range: 6 },
    { label: "New Year", value: new Date(2026, 0, 1) },
  ]}
/>
```

#### Advanced form — `AdvancedPresetDef`

Function form. Use when offsets are not enough (calendar-accurate month shifts, weekday-relative dates, conditional visibility, `isValid` loops).

| Field      | Type                                                               | Description                                                                         |
| ---------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `id`       | `string`                                                           | Stable React key. Required                                                          |
| `label`    | `string \| (locale: string) => string`                             | Button text                                                                         |
| `getValue` | `(ctx: PresetContext) => Date \| { from: Date; to: Date } \| null` | Computes target. Return type decides kind (single / range); `null` hides the button |

`PresetContext`:

| Field     | Type                      | Description                                                                             |
| --------- | ------------------------- | --------------------------------------------------------------------------------------- |
| `now`     | `Date`                    | Real `new Date()` with time-of-day from the calendar's `viewDate`. Stable across clicks |
| `isValid` | `(date: Date) => boolean` | True if `date` passes `minDate`, `maxDate`, `disabled`                                  |
| `locale`  | `string`                  | BCP-47 locale string from calendar config                                               |

Return-type semantics:

- `Date` → single-date preset; click fires `onChangeDate`
- `{ from, to }` → range preset; click fires `onRangeSet`. Hidden unless `<Calendar mode="range" />`
- `null` → unavailable this render; button hidden

All preset targets are auto-filtered through `isValid` — a target that is disabled / out of range is not rendered.

#### Defensive handling of bad input

Presets accept user-provided functions and arrays, so the resolver guards against malformed entries. Each guard emits a deduped dev warning and silently drops the offending entry — the rest of the array still renders.

| Condition                                            | Behavior                                         | Warning                                |
| ---------------------------------------------------- | ------------------------------------------------ | -------------------------------------- |
| Array element is not an object (`null`, primitive)   | Entry skipped                                    | `not an object`                        |
| Entry missing required `label`                       | Entry skipped                                    | `missing the required \`label\` field` |
| Two entries share the same `id` (or auto-derived id) | First wins; duplicates skipped                   | `Duplicate preset id`                  |
| `getValue` throws                                    | Entry skipped, error message included in warning | `getValue threw: ...`                  |
| `getValue` returns `new Date(NaN)`                   | Entry skipped                                    | `invalid Date`                         |
| `getValue` returns a range with NaN `from` / `to`    | Entry skipped                                    | `range with invalid Date(s)`           |
| `getValue` returns an unexpected shape               | Entry skipped                                    | `unexpected shape`                     |
| `getValue` returns `null`                            | Entry skipped silently — documented contract     | (none)                                 |

In production all of the above silently fall back to "skip"; no warning is emitted. The component never crashes due to a single malformed preset.

#### Mode filtering

Whether a preset renders depends on the calendar's `mode`:

| Preset shape                                 | `mode="single"` | `mode="multiple"` | `mode="range"` |
| -------------------------------------------- | --------------- | ----------------- | -------------- |
| Simple `{ value }` (no `range`)              | rendered        | rendered          | rendered       |
| Simple `{ value, range }` (with `range`)     | **filtered**    | **filtered**      | rendered       |
| Advanced `getValue` returning `Date`         | rendered        | rendered          | rendered       |
| Advanced `getValue` returning `{ from, to }` | **filtered**    | **filtered**      | rendered       |
| Advanced `getValue` returning `null`         | filtered        | filtered          | filtered       |

Filtered presets are silently dropped — no warning, no placeholder. Click handler is never reached because the button is not in the DOM.

```tsx
<CalendarPresets
  presets={[
    {
      id: "som",
      label: "Start of month",
      getValue: ({ now }) => new Date(now.getFullYear(), now.getMonth(), 1),
    },
    {
      id: "next-weekend",
      label: "Next available weekend",
      getValue: ({ now, isValid }) => {
        const d = new Date(now);
        const delta = (6 - d.getDay() + 7) % 7 || 7;
        d.setDate(d.getDate() + delta);
        for (let i = 0; i < 52; i++) {
          const sun = new Date(d);
          sun.setDate(sun.getDate() + 1);
          if (isValid(d) && isValid(sun)) return { from: d, to: sun };
          d.setDate(d.getDate() + 7);
        }
        return null;
      },
    },
  ]}
/>
```

#### `basicPresets`

A ready-made compact pack with localized labels:

- last year
- last month
- last week
- yesterday
- today
- tomorrow
- next week
- next month
- next year

```ts
import { basicPresets } from "@dateforge/react-calendar";

<CalendarPresets presets={basicPresets} />;

// Or mix
<CalendarPresets
  presets={[...basicPresets, { label: "In 3 days", value: 3 }]}
/>;
```

Toggle behavior: clicking an active preset deselects (fires `onChangeDate(null)` / `onRangeSet(null, null)`).

**Tree-shaking.** `basicPresets` is exported from the root barrel only (no separate subpath). The pack module is side-effect-free and the package declares `sideEffects: ["**/*.css"]`, so consumers who import `Calendar` (or any other symbol) from the root and never reference `basicPresets` do not pay the bundle cost. Modern bundlers (esbuild, rollup, webpack 5+) eliminate it automatically.

---

## Types

### `CalendarMode`

```ts
type CalendarMode = "single" | "multiple" | "range";
```

### `CalendarValue<M>`

```ts
type CalendarValue<M extends CalendarMode> = M extends "range"
  ? DateRange
  : M extends "multiple"
  ? Date[]
  : Date | null;
```

### `DateRange`

```ts
type DateRange = {
  from: Date | null;
  to: Date | null;
};
```

### `CalendarInfoValue`

```ts
type CalendarInfoValue =
  | Date
  | Date[]
  | { from: Date | null; to: Date | null }
  | null;
```

Used by `<CalendarInfo formatter={(value) => ...} />`.

### `StartOfWeek`

```ts
type StartOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
// 0 = Sunday, 1 = Monday, 2 = Tuesday, …, 6 = Saturday
```

### Built-in themes

28 named theme families, each exported as a tree-shakeable `ThemeFamily` object.

Each family has a light and dark variant: `noir`, `espresso`, `meadow`, `fjord`, `velvet`, `crimson`, `solar`, `nebula`, `neon`, `prism`, `slate`, `pearl`, `sandstone`, `bauhaus`, `monsoon`, `industrial`, `snow`, `eclipse`, `chalk`, `temporal`, `riso`, `cyber`, `split`, `aurora`, `graphite`, `dracula`, `mint`, `abyss`.

**Base (no imported palette):** omit `theme` for auto mode, or pass `light` / `dark` flags for an explicit initial mode.

```ts
// barrel — your bundler only includes nebula
import { nebula } from "@dateforge/react-calendar/themes";
<Calendar theme={nebula} />

// per-file — zero dependency on other theme families
import { nebula } from "@dateforge/react-calendar/themes/nebula";
<Calendar theme={nebula} dark />

// default palette — no import
<Calendar />       // default, follows system preference
<Calendar dark />
<Calendar light />
```

### Built-in appearances

5 presets, each a tree-shakeable `CustomAppearance` object. Omitting the prop gives the default appearance.

`soft` `compact` `square` `bubble` `loft`

```ts
// barrel
import { loft } from "@dateforge/react-calendar/appearances";
<Calendar appearance={loft} />

// per-file — zero dependency on other appearances
import { compact } from "@dateforge/react-calendar/appearances/compact";
<Calendar appearance={compact} />

// default — nothing to import
<Calendar />
```
