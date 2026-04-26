# react-calendar-datetime — Documentation

## Table of Contents

- [Calendar (Main Component)](#calendar)
- [CalendarDays](#calendardays)
- [Modules](#modules)
  - [CalendarNav](#calendarnav)
  - [CalendarMonthGrid](#calendarmonthgrid)
  - [CalendarYearsGrid](#calendaryearsgrid)
  - [CalendarTimeGrid](#calendartimegrid)
  - [CalendarPresets](#calendarpresets)
  - [CalendarSelectedDates](#calendarselectedates)
  - [CalendarManualSelect](#calendarmanualselect)
  - [CalendarDaysTrack](#calendardaystrack)
  - [CalendarMonthsTrack](#calendarmonthstrack)
  - [CalendarYearsTrack](#calendaryearstrack)
- [Utility Functions](#utility-functions)
- [Types](#types)

---

## Calendar

The root component. All other components must be placed as its children.

```tsx
import { Calendar } from "react-calendar-datetime";

<Calendar mode="single" onChange={(v) => console.log(v)}>
  <CalendarNav />
  <CalendarDays />
</Calendar>;
```

### Props

| Prop           | Type                                | Default     | Description                                                                                                                                                                                                           |
| -------------- | ----------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mode`         | `"single" \| "multiple" \| "range"` | `"single"`  | Selection mode                                                                                                                                                                                                        |
| `value`        | `CalendarValue<M>`                  | —           | Controlled value. `Date \| null` for single, `Date[]` for multiple, `DateRange` for range. Pass `undefined` to opt out of controlled mode.                                                                            |
| `defaultValue` | `CalendarValue<M>`                  | —           | Initial value for uncontrolled mode. Used only when `value` is `undefined`. Subsequent changes to `defaultValue` are ignored.                                                                                         |
| `defaultViewDate` | `Date`                           | —           | Initial month/year displayed on mount when no selection seeds the view. Read once; subsequent changes are ignored. Use this instead of repeating the prop on every `CalendarDays`. Non-`Date` values and `Invalid Date` are rejected (dev warn) and treated as omitted.                                    |
| `onChange`     | `(value: CalendarValue<M>) => void` | —           | Fires when the selection changes (in both controlled and uncontrolled modes)                                                                                                                                          |
| `cols`         | `number`                            | —           | Number of columns in the internal CSS grid                                                                                                                                                                            |
| `locale`       | `string`                            | `"en"`      | BCP 47 language tag used for all labels and formatting                                                                                                                                                                |
| `timeZone`     | `string \| "auto"`                  | `"auto"`    | IANA timezone (`"Europe/Paris"`, `"UTC"`), fixed offset (`"UTC+2"`, `"UTC-5"`), or `"auto"`. When `"auto"` (or omitted) the library detects the user's timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone` after mount. Invalid values fall back to auto-detect with a dev warning. Affects today detection, emitted date midnight, and formatting |
| `readOnly`     | `boolean`                           | `false`     | Disables all state-changing interactions (date/time selection). Navigation still works. Adds `data-readonly` and `aria-readonly` on the root                                                                          |
| `hour12`       | `boolean`                           | `false`     | Use 12-hour time format instead of 24-hour                                                                                                                                                                            |
| `theme`        | `CalendarTheme`                     | `"auto"`    | Base value (`"auto"` / `"light"` / `"dark"`), a pre-built theme object from `react-calendar-datetime/themes[/name]`, or a `CustomTheme` from `createTheme()`. Named string themes (e.g. `"midnight"`) are not supported — import the object instead. |
| `appearance`   | `CalendarAppearance`                | —           | Pre-built appearance object from `react-calendar-datetime/appearances[/name]`, or a `CustomAppearance` from `createAppearance()`. Omit the prop entirely for the default appearance.                                  |
| `gradient`     | `boolean`                           | `false`     | Enable gradient backgrounds on selected cells                                                                                                                                                                         |
| `width`        | `string \| number`                  | `"100%"`    | Container width                                                                                                                                                                                                       |
| `minDate`      | `Date`                              | —           | Earliest selectable date                                                                                                                                                                                              |
| `maxDate`      | `Date`                              | —           | Latest selectable date                                                                                                                                                                                                |
| `maxDates`     | `number`                            | —           | Maximum number of selectable dates (multiple mode only)                                                                                                                                                               |
| `minRangeDays` | `number`                            | —           | Minimum number of days in a range selection                                                                                                                                                                           |
| `maxRangeDays` | `number`                            | —           | Maximum number of days in a range selection                                                                                                                                                                           |
| `disabled`     | `DisabledConfig`                    | —           | Rules for disabling specific dates. Build with `createDisabled()`                                                                                                                                                     |
| `children`     | `React.ReactNode`                   | —           | Module components that compose the calendar UI                                                                                                                                                                        |

### Controlled and uncontrolled

`Calendar` works in both modes. The decision is made by whether `value` is passed.

**Controlled** — `value` is provided (including `null`):

```tsx
const [date, setDate] = useState<Date | null>(null);
<Calendar value={date} onChange={setDate}>
  <CalendarDays />
</Calendar>
```

External changes to `value` are synced into internal state on every change.

**Uncontrolled** — `value` is `undefined`. Optional `defaultValue` seeds the initial selection:

```tsx
<Calendar defaultValue={new Date()} onChange={(d) => console.log(d)}>
  <CalendarDays />
</Calendar>
```

Internal state lives independently. `defaultValue` is read once on mount; subsequent changes are ignored. `onChange` still fires for every selection change.

**Mixing rule.** When both `value` and `defaultValue` are passed, `value` wins (controlled mode). `defaultValue` is ignored.

**Mode change at runtime.** Changing `mode` (e.g. `"single"` → `"range"`) does not migrate selection. The new mode reads internal state through its own shape: range mode looks for `from`/`to`, multiple looks for an array, single looks for a `Date`. Pass a compatible `value` together with the mode change if you need a clean transition.

### Time semantics — when does time editing fire `onChange`?

`CalendarTimeGrid` and `CalendarNav.showTime` both edit time. They share the same rules. The principle is:

> `viewDate` always carries the **current working time**. A selection's time is updated only when the selection corresponds to `viewDate`'s day. Otherwise the time stays "pending" — applied to the next date the user selects in `CalendarDays` (because Days commits a new date with `viewDate.hours / minutes / seconds`).

Per-mode behavior:

| Mode       | State                                     | Effect of time change                                          | Fires `onChange`? |
|------------|-------------------------------------------|----------------------------------------------------------------|-------------------|
| `single`   | no selection                              | auto-creates `selectedDate = viewDate.day + new time` ¹        | yes               |
| `single`   | selection day matches `viewDate`          | updates that date's time                                       | yes               |
| `single`   | selection day differs from `viewDate`     | pending — selection untouched, only `viewDate` updates         | no                |
| `multiple` | no selection                              | pending — no auto-create                                       | no                |
| `multiple` | one of `selectedDates` matches `viewDate` | updates that date's time, others untouched                     | yes               |
| `multiple` | none match                                | pending — selection untouched                                  | no                |
| `range`    | no selection                              | pending                                                        | no                |
| `range`    | `rangeStart` day matches `viewDate`       | updates `rangeStart`'s time                                    | yes               |
| `range`    | `rangeEnd` day matches `viewDate`         | updates `rangeEnd`'s time                                      | yes               |
| `range`    | neither matches                           | pending                                                        | no                |

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

When does timezone matter?
- **SSR / Next.js.** Server's `new Date()` is in server's locale (often UTC). Without an explicit timezone, "today" detection differs between server and client. The auto-detect default keeps the initial render server-stable and resolves to client zone post-hydration.
- **Off-by-one selection.** When dates are stored as UTC midnight and the user is in a negative offset, displaying with local conversion shifts the rendered day back by one. Setting `timeZone` to the storage zone fixes this.
- **Explicit data zone.** Scheduling apps where dates are anchored to a specific city's time, regardless of the viewer.

For purely local single-user CRUD without SSR, the default `"auto"` is the right choice and you do not need to think about it.

**Invalid timezone values** (e.g. `"Europe/Wrongville"`) fall back to auto-detect and emit a dev warning. In production they are silently treated as auto-detect.

**Dev warnings.** In development, the library emits a `console.warn` (deduped per condition) for:
- `value` / `defaultValue` shape that does not match `mode` (e.g. `Date` passed in `mode="range"`);
- `Date` instances that are `NaN` (`new Date("invalid")`) inside `value` / `defaultValue`;
- `defaultViewDate` that is not a valid `Date` instance — falls back to omitted;
- `minDate` later than `maxDate`;
- invalid `timeZone` strings — falls back to auto-detect;
- `theme` strings outside `"auto" | "light" | "dark"` — falls back to system theme.

In production all of the above silently fall back to a safe default; no warning is emitted.

Warnings are silenced when `process.env.NODE_ENV === "production"`.

### `readOnly` contract

When `readOnly` is `true`:

**Blocked**
- Selecting a date in `CalendarDays`, `CalendarDaysTrack`, `CalendarPresets`, `CalendarManualSelect`.
- Setting a range boundary in `CalendarDaysTrack` / `CalendarMonthsTrack` / `CalendarYearsTrack` with `bound`.
- Changing time in `CalendarTimeGrid` and the time popup of `CalendarNav`.
- Clearing selection from `CalendarNav` (`clear`), `CalendarSelectedDates` (`allowClear`), `CalendarManualSelect` (`allowClear`).
- Editing a date chip in `CalendarManualSelect`.

**Still works**
- Navigating the view (`CalendarNav` arrows, month/year popups, all Track scrolling, `CalendarMonthGrid`, `CalendarYearsGrid`).
- Theme toggle (`CalendarNav.themeToggle`).
- Opening the time popup in `CalendarNav` (drums inside are read-only).
- Clicking a chip in `CalendarSelectedDates` to navigate to that date.
- Hover preview in range mode.

Interactive UI elements are rendered with `disabled` or `aria-disabled="true"` so they are visually inactive. State-changing actions are also blocked at the reducer layer, so even custom modules calling selection actions will no-op when `readOnly`.

---

## CalendarDays

Renders the month grid — weekday headers, week numbers (optional), and the day cells.

```tsx
<CalendarDays />
```

### Props

| Prop                | Type               | Default | Description                                                                                |
| ------------------- | ------------------ | ------- | ------------------------------------------------------------------------------------------ |
| `offset`            | `number`           | `0`     | Month offset relative to the current view. Use `1` or `-1` to render adjacent months       |
| `startOfWeek`       | `0–6`              | `1`     | First day of the week. `0` = Sunday, `1` = Monday, … `6` = Saturday                        |
| `currentMonthOnly`  | `boolean`          | `false` | Hide day cells that belong to the previous or next month                                   |
| `highlightWeekends` | `boolean`          | `true`  | Apply a distinct style to Saturday and Sunday                                              |
| `boldWeekends`      | `boolean`          | `false` | Render Saturday and Sunday in bold with the weekend accent color (`--c-we`)                |
| `highlightToday`    | `boolean`          | `true`  | Highlight today's date                                                                     |
| `fixedRows`         | `boolean`          | `true`  | Always render 6 rows of day cells                                                          |
| `weekNumbers`       | `boolean`          | `false` | Show ISO week numbers in the leftmost column                                               |
| `hideWeekdays`      | `boolean`          | `false` | Hide the row of weekday name headers                                                       |
| `hideOutOfRange`    | `boolean`          | `false` | Do not render visible day buttons for dates outside `minDate`/`maxDate` or disabled rules. Layout placeholders are still rendered with `role="presentation"` so the grid stays aligned and accessibility tree contains only real cells. See "`hideOutOfRange` accessibility" below. |
| `lockSelection`     | `boolean`          | `false` | Prevent the user from deselecting the currently selected date                              |
| `blockNavigation`   | `boolean`          | `false` | Block keyboard navigation (arrow keys, `PageUp`/`PageDown`) from crossing month boundaries |
| `swipe`             | `boolean`          | `true`  | Enable swipe gestures to navigate between months                                           |
| `col`               | `number \| string` | —       | CSS grid `grid-column` value for layout positioning                                        |

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

| Prop              | Type               | Default | Description                                                                                                                                                          |
| ----------------- | ------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`           | `string`           | —       | Custom text shown as the header label, max 180 length.                                                                                                               |
| `showMonthPicker` | `boolean`          | `false` | Show previous/next month arrow buttons                                                                                                                               |
| `compactMonths`   | `boolean`          | `false` | Show a compact month dropdown instead of arrows                                                                                                                      |
| `showYearPicker`  | `boolean`          | `false` | Show previous/next year arrow buttons                                                                                                                                |
| `compactYears`    | `boolean`          | `false` | Show a compact year dropdown instead of arrows                                                                                                                       |
| `animateTime`     | `boolean`          | `true`  | Show flip animation for in `showTime` and `showNowTime`                                                                                                              |
| `monthLabel`      | `boolean`          | `false` | Show the current month name as plain text (no controls, no popup)                                                                                                    |
| `yearLabel`       | `boolean`          | `false` | Show the current year as plain text (no controls, no popup)                                                                                                          |
| `showTime`        | `boolean`          | `false` | Show a button that opens the time picker popup                                                                                                                       |
| `showNowTime`     | `boolean`          | `false` | Show the current system time as a live read-only display (updates every second). A pulsing dot indicates it is live. Respects the `hour12` setting from `<Calendar>` |
| `seconds`         | `boolean`          | `false` | Include seconds in `showTime` and `showNowTime` displays, and in the time picker popup                                                                               |
| `home`            | `boolean`          | `false` | Show a button that navigates back to today                                                                                                                           |
| `clear`           | `boolean`          | `false` | Show a button that clears the current selection                                                                                                                      |
| `themeToggle`     | `boolean`          | `false` | Show a light/dark theme toggle button. Has no effect when a custom theme (`createTheme()` or pre-built palette) is passed to `<Calendar theme={...} />`              |
| `offset`          | `number`           | `0`     | Month offset relative to `viewDate`. Use to render two synced nav headers in `cols={2}` layouts (`<CalendarNav offset={1} />`)                                       |
| `col`             | `number \| string` | —       | CSS grid `grid-column` value                                                                                                                                         |

### Behavior matrix

`<CalendarNav>` is a hybrid module — its category depends on which props are enabled.

| Prop                                                              | Effect                                                              | Fires `onChange`? | Respects `readOnly`? |
| ----------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------- | -------------------- |
| `showMonthPicker` / `compactMonths` / month/year arrows / popups  | `navigateTo` (changes `viewDate`)                                   | no                | n/a — navigation     |
| `home`                                                            | `navigateTo(today)`                                                 | no                | n/a — navigation     |
| `monthLabel` / `yearLabel` / `showNowTime`                        | display only                                                        | no                | n/a                  |
| `themeToggle`                                                     | toggles UI theme via `UIContext.toggleTheme`                        | no                | yes — UI not blocked |
| `clear`                                                           | `onChangeDate(null)` — clears current selection                     | yes               | yes — button disabled when `readOnly` |
| `showTime`                                                        | opens time popup; confirm calls `onChangeTime`                      | yes (on confirm)  | yes — drums and confirm read-only when `readOnly` |

Use this table to decide which guarantees apply to your composition. A `<CalendarNav>` without `clear` and without `showTime` is purely navigational and never fires `onChange`.

---

### CalendarMonthGrid

Full-page **month navigation grid** (12 cells). Clicking a month sets `viewDate` to that month — it does **not** select a date and does **not** call `onChange`. Pair with `<CalendarDays>` (or another interactive module) for date selection.

```tsx
<CalendarMonthGrid />
```

### Props

| Prop                | Type               | Default | Description                                                   |
| ------------------- | ------------------ | ------- | ------------------------------------------------------------- |
| `short`             | `boolean`          | `true`  | Use abbreviated month names (e.g. "Jan" instead of "January") |
| `disableOutOfRange` | `boolean`          | `true`  | Disable months outside `minDate`/`maxDate` range              |
| `hideOutOfRange`    | `boolean`          | `false` | Completely hide months outside the allowed range              |
| `col`               | `number \| string` | —       | CSS grid `grid-column` value                                  |

---

### CalendarYearsGrid

Full-page **year navigation grid** with pagination. Clicking a year sets `viewDate` to that year — it does **not** select a date and does **not** call `onChange`. Pair with `<CalendarDays>` (or another interactive module) for date selection.

```tsx
<CalendarYearsGrid yearsPerPage={12} />
```

### Props

| Prop                | Type               | Default | Description                                     |
| ------------------- | ------------------ | ------- | ----------------------------------------------- |
| `yearsPerPage`      | `number`           | `10`    | Number of years shown per page. Clamped to 1–40 |
| `disableOutOfRange` | `boolean`          | `true`  | Disable years outside `minDate`/`maxDate` range |
| `hideOutOfRange`    | `boolean`          | `false` | Completely hide years outside the allowed range |
| `col`               | `number \| string` | —       | CSS grid `grid-column` value                    |

---

### CalendarTimeGrid

Time picker — hours, minutes, optional seconds, AM/PM toggle when `hour12` is enabled.

```tsx
<CalendarTimeGrid seconds />
```

### Props

| Prop      | Type               | Default | Description                          |
| --------- | ------------------ | ------- | ------------------------------------ |
| `seconds` | `boolean`          | `false` | Show a third drum for seconds (0–59) |
| `col`     | `number \| string` | —       | CSS grid `grid-column` value         |

---

### CalendarPresets

Quick-select preset buttons. Renders **nothing** by default — pass `presets` with the entries you want.

Two entry forms are supported:

- **Simple** — `{ label, value, range? }` (declarative: day offsets, fixed dates, fixed-length ranges)
- **Advanced** — `{ id, label, getValue }` (function form with `PresetContext`)

Import `basicPresets` for the classic pack.

```tsx
import { CalendarPresets, basicPresets } from "react-calendar-datetime";

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

Displays the currently selected dates as removable chips.

```tsx
<CalendarSelectedDates allowClear animated align="center" />
```

### Props

| Prop            | Type                            | Default  | Description                                                                                         |
| --------------- | ------------------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| `allowClear`    | `boolean`                       | `true`   | Show a clear-all button next to the chips                                                           |
| `allowNavigate` | `boolean`                       | `true`   | Clicking a chip navigates the calendar to that date                                                 |
| `animated`      | `boolean`                       | `true`   | Animate chips appearing and disappearing                                                            |
| `align`         | `"left" \| "center" \| "right"` | `"left"` | Horizontal alignment of the chip list                                                               |
| `showTime`      | `boolean`                       | `false`  | Include time (hours and minutes) in the chip label. Respects the `hour12` setting from `<Calendar>` |
| `col`           | `number \| string`              | —        | CSS grid `grid-column` value                                                                        |

---

### CalendarManualSelect

Text input that lets the user type a date directly.

```tsx
<CalendarManualSelect allowClear={false} />
```

### Props

| Prop         | Type                            | Default  | Description                               |
| ------------ | ------------------------------- | -------- | ----------------------------------------- |
| `allowClear` | `boolean`                       | `true`   | Show a clear button inside the input      |
| `align`      | `"left" \| "center" \| "right"` | `"left"` | Horizontal alignment of the input content |
| `col`        | `number \| string`              | —        | CSS grid `grid-column` value              |

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

In `mode="multiple"` the track automatically renders a save / remove button. Item click only previews; the button commits the date (toggles in/out of `selectedDates`). The button shows `Check` when the previewed date is not selected, `Clear` (×) when it is.

```tsx
<Calendar mode="range">
  <CalendarDaysTrack bound="from" />
  <CalendarDaysTrack bound="to" />
</Calendar>
```

---

### CalendarMonthsTrack

A horizontal scrollable strip of month names for the current year.

```tsx
<CalendarMonthsTrack short={false} />
```

### Props

| Prop    | Type               | Default | Description                                       |
| ------- | ------------------ | ------- | ------------------------------------------------- |
| `short` | `boolean`          | `true`  | Use abbreviated month names                       |
| `bound` | `"from" \| "to"`   | —       | In range mode binds the track to a range boundary |
| `col`   | `number \| string` | —       | CSS grid `grid-column` value                      |

---

### CalendarYearsTrack

A horizontal scrollable strip of years.

```tsx
<CalendarYearsTrack />
```

### Props

| Prop    | Type               | Default | Description                                       |
| ------- | ------------------ | ------- | ------------------------------------------------- |
| `bound` | `"from" \| "to"`   | —       | In range mode binds the track to a range boundary |
| `col`   | `number \| string` | —       | CSS grid `grid-column` value                      |

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

## Utility Functions

### Theming

Three ways to apply a theme.

**Option 1 — pre-built theme object** (one of the 33 built-in palettes):

```ts
// barrel — all themes, bundler tree-shakes to just the one you import
import { midnight } from "react-calendar-datetime/themes";

// per-theme — single file, zero overhead from other themes
import { midnight } from "react-calendar-datetime/themes/midnight";

<Calendar theme={midnight} />
```

Each theme is a self-contained `CustomTheme` object. The consuming bundler includes only the file you import. Theme vars are applied as inline CSS custom properties on the calendar container — no extra CSS file needed.

**Option 2 — base theme** (`"auto"` / `"light"` / `"dark"`):

```ts
<Calendar theme="auto" />   // follows system preference (default)
<Calendar theme="light" />
<Calendar theme="dark" />
```

`"auto"` tracks `prefers-color-scheme` and switches in real time. These are the only string values supported — named palette strings like `"midnight"` are not valid. In development a `console.warn` is emitted; in production the value is ignored. Always import the theme object instead.

**Option 3 — fully custom theme** via `createTheme()`:

```ts
import { createTheme } from "react-calendar-datetime";

const myTheme = createTheme({ highlight: "#6366f1", backdrop: "#0f172a", text: "#f1f5f9" });

<Calendar theme={myTheme} />
```

`createTheme` accepts a partial token map — only the tokens you provide are applied; the rest fall back to the base palette CSS variables.

### Appearances

Three ways to apply an appearance.

**Default — omit the prop entirely:**

```tsx
<Calendar />  // default appearance, nothing to import
```

**Pre-built appearance object** (one of 5 presets):

```ts
// barrel — bundler tree-shakes to just the one you import
import { loft } from "react-calendar-datetime/appearances";

// per-appearance — single file
import { compact } from "react-calendar-datetime/appearances/compact";

<Calendar appearance={compact} />
```

Available presets: `soft` `compact` `square` `bubble` `loft`

Each preset is a self-contained object. Vars are applied as inline CSS custom properties — no extra CSS file required.

**Custom appearance** via `createAppearance()`:

```ts
import { createAppearance } from "react-calendar-datetime";

const myAppearance = createAppearance({ radius: "0", spacing: "0.4em" });

<Calendar appearance={myAppearance} />
```

### `createTheme(tokens)`

| Token       | CSS variable | Role                                                                                                                 |
| ----------- | ------------ | -------------------------------------------------------------------------------------------------------------------- |
| `highlight` | `--c-h`      | **Primary accent.** Background of the selected day cell, active buttons, nav accents. The most impactful token.      |
| `accent`    | `--c-a`      | **Inverted container color.** Text/icon color _inside_ the selected day circle — usually the inverse of `highlight`. |
| `backdrop`  | `--c-b`      | Main calendar background.                                                                                            |
| `tone`      | `--c-t`      | Secondary / muted background for rows, tracks, and hover states.                                                     |
| `text`      | `--c-c`      | Default text color for all labels and numbers.                                                                       |
| `stroke`    | `--c-s`      | Border and separator color between cells and sections.                                                               |
| `shadow`    | `--c-x`      | Drop-shadow color. Should include alpha (e.g. `"#6366f130"`).                                                        |
| `disabled`  | `--c-d`      | Color for disabled / out-of-range date cells.                                                                        |
| `weekend`   | `--c-we`     | Accent color applied to weekend day labels (Saturday / Sunday).                                                      |
| `range`     | `--c-r`      | Background tint for days that fall inside a selected date range.                                                     |

---

### `createAppearance(tokens)`

Creates a custom appearance object to pass to the `appearance` prop.

```ts
import { createAppearance } from "react-calendar-datetime";

const myAppearance = createAppearance({ radius: "2px", fontSize: "13px" });
```

| Token             | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `radius`          | Border radius for day cells and buttons                  |
| `containerRadius` | Border radius for the calendar container                 |
| `border`          | Border width/style for the container                     |
| `spacing`         | Internal padding / gap between elements                  |
| `font`            | Font family                                              |
| `fontSize`        | Base font size                                           |
| `daysSpacing`     | Gap between individual day cells                         |
| `dayRatio`        | Aspect ratio of each day cell (e.g. `"1 / 1"`)           |
| `trackHeight`     | Height of Track module items                             |
| `shadowSm`        | Small shadow value                                       |
| `shadowMd`        | Medium shadow value                                      |
| `shadowLg`        | Large shadow value                                       |
| `transition`      | CSS transition shorthand applied to interactive elements |

---

### `createDisabled(init)`

Creates a `DisabledConfig` object to pass to the `disabled` prop.

```ts
import { createDisabled } from "react-calendar-datetime";

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

---

### Presets

Presets are plain objects. Pass an array of them to `<CalendarPresets presets={[...]} />`. Two forms are supported.

#### Simple form — `SimplePresetDef`

Declarative. Covers day offsets, fixed dates, fixed-length ranges. Zero imports needed.

| Field   | Type                                   | Description                                                                               |
| ------- | -------------------------------------- | ----------------------------------------------------------------------------------------- |
| `id`    | `string` (optional)                    | Stable React key. Auto-derived from `label` / index if omitted                            |
| `label` | `string \| (locale: string) => string` | Button text. Function form for locale-aware labels                                        |
| `value` | `number \| Date`                       | `number` — day offset from today (neg = past, pos = future). `Date` — absolute fixed date |
| `range` | `number` (optional)                    | Length of range in days after `value`. Absent → single date. Any number → range           |

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

A ready-made pack (classic "yesterday / today / tomorrow / last week / next month / …" set) with localized labels.

```ts
import { basicPresets } from "react-calendar-datetime";

<CalendarPresets presets={basicPresets} />;

// Or mix
<CalendarPresets presets={[...basicPresets, { label: "In 3 days", value: 3 }]} />;
```

Toggle behavior: clicking an active preset deselects (fires `onChangeDate(null)` / `onRangeSet(null, null)`).

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

### `StartOfWeek`

```ts
type StartOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
// 0 = Sunday, 1 = Monday, 2 = Tuesday, …, 6 = Saturday
```

### Built-in themes

33 named palettes, each exported as a tree-shakeable `CustomTheme` object.

**Light:** `mint` `comfy` `neon` `rosa` `snow` `solar` `graphite` `amethyst` `latte` `slate` `scarlet` `prism` `meadow` `monsoon` `pearl` `chalk` `split` `riso`

**Dark:** `industrial` `midnight` `sandstone` `phosphor` `dracula` `cyber` `abyss` `temporal` `crimson` `forest` `nebula` `aurora` `espresso` `ember` `flare`

**Base (no palette):** `"light"` `"dark"` `"auto"` — passed as strings, no import needed.

```ts
// barrel — your bundler only includes midnight
import { midnight } from "react-calendar-datetime/themes";
<Calendar theme={midnight} />

// per-file — zero dependency on other themes
import { midnight } from "react-calendar-datetime/themes/midnight";
<Calendar theme={midnight} />

// base strings — no import
<Calendar theme="auto" />   // default, follows system preference
<Calendar theme="dark" />
<Calendar theme="light" />
```

### Built-in appearances

5 presets, each a tree-shakeable `CustomAppearance` object. Omitting the prop gives the default appearance.

`soft` `compact` `square` `bubble` `loft`

```ts
// barrel
import { loft } from "react-calendar-datetime/appearances";
<Calendar appearance={loft} />

// per-file — zero dependency on other appearances
import { compact } from "react-calendar-datetime/appearances/compact";
<Calendar appearance={compact} />

// default — nothing to import
<Calendar />
```
