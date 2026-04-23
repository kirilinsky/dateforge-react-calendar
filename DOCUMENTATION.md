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

| Prop           | Type                                | Default     | Description                                                                                   |
| -------------- | ----------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `mode`         | `"single" \| "multiple" \| "range"` | `"single"`  | Selection mode                                                                                |
| `value`        | `CalendarValue<M>`                  | —           | Controlled value. `Date \| null` for single, `Date[]` for multiple, `DateRange` for range     |
| `onChange`     | `(value: CalendarValue<M>) => void` | —           | Fires when the selection changes                                                              |
| `cols`         | `number`                            | —           | Number of columns in the internal CSS grid                                                    |
| `locale`       | `string`                            | `"en"`      | BCP 47 language tag used for all labels and formatting                                        |
| `timeZone`     | `string`                            | —           | IANA timezone (`"Europe/Paris"`, `"UTC"`) or fixed offset (`"UTC+2"`, `"UTC-5"`). Affects today detection, emitted date midnight, and chip formatting |
| `readonly`     | `boolean`                           | `false`     | Disables all state-changing interactions (date/time selection). Navigation still works. Adds `data-readonly` and `aria-readonly` on the root |
| `hour12`       | `boolean`                           | `false`     | Use 12-hour time format instead of 24-hour                                                    |
| `theme`        | `CalendarTheme`                     | `"auto"`    | Built-in theme name, `"auto"` / `"light"` / `"dark"`, or a `CustomTheme` from `createTheme()` |
| `appearance`   | `CalendarAppearance`                | `"default"` | Built-in appearance preset name or a `CustomAppearance` from `createAppearance()`             |
| `gradient`     | `boolean`                           | `false`     | Enable gradient backgrounds on selected cells                                                 |
| `width`        | `string \| number`                  | `"100%"`    | Container width                                                                               |
| `minDate`      | `Date`                              | —           | Earliest selectable date                                                                      |
| `maxDate`      | `Date`                              | —           | Latest selectable date                                                                        |
| `max`          | `number`                            | —           | Maximum number of selectable dates (multiple mode only)                                       |
| `rangeMinDays` | `number`                            | —           | Minimum number of days in a range selection                                                   |
| `rangeMaxDays` | `number`                            | —           | Maximum number of days in a range selection                                                   |
| `disabled`     | `DisabledConfig`                    | —           | Rules for disabling specific dates. Build with `createDisabled()`                             |
| `children`     | `React.ReactNode`                   | —           | Module components that compose the calendar UI                                                |

---

## CalendarDays

Renders the month grid — weekday headers, week numbers (optional), and the day cells.

```tsx
<CalendarDays />
```

### Props

| Prop                   | Type               | Default | Description                                                                          |
| ---------------------- | ------------------ | ------- | ------------------------------------------------------------------------------------ |
| `offset`               | `number`           | `0`     | Month offset relative to the current view. Use `1` or `-1` to render adjacent months |
| `startOfWeek`          | `0–6`              | `1`     | First day of the week. `0` = Sunday, `1` = Monday, … `6` = Saturday                  |
| `hideOtherMonths`      | `boolean`          | `false` | Hide day cells that belong to the previous or next month                             |
| `highlightWeekends`    | `boolean`          | `true`  | Apply a distinct style to Saturday and Sunday                                        |
| `highlightToday`       | `boolean`          | `true`  | Highlight today's date                                                               |
| `showWeekNumber`       | `boolean`          | `false` | Show ISO week numbers in the leftmost column                                         |
| `hideWeekdays`         | `boolean`          | `false` | Hide the row of weekday name headers                                                 |
| `hideLimited`          | `boolean`          | `false` | Completely hide dates that fall outside `minDate`/`maxDate` or match disabled rules  |
| `preventUnselect`      | `boolean`          | `false` | Prevent the user from deselecting the currently selected date                        |
| `allowSwipeNavigation` | `boolean`          | `false` | Enable swipe gestures to navigate between months                                     |
| `startMonth`           | `Date`             | —       | Initial month displayed on mount. Navigates whenever the value changes               |
| `col`                  | `number \| string` | —       | CSS grid `grid-column` value for layout positioning                                  |
| `dataArea`             | `string`           | —       | Value for the `data-area` attribute (useful for testing)                             |

---

## Modules

Module components are optional building blocks placed as children of `<Calendar>`. Each accepts a `col` prop for CSS grid placement.

---

### CalendarNav

Navigation header with configurable controls.

```tsx
<CalendarNav showMonthPicker showYearPicker showClear />
```

### Props

| Prop              | Type               | Default | Description                                     |
| ----------------- | ------------------ | ------- | ----------------------------------------------- |
| `label`           | `string`           | —       | Custom text shown as the header label           |
| `showMonthPicker` | `boolean`          | `false` | Show previous/next month arrow buttons          |
| `compactMonths`   | `boolean`          | `false` | Show a compact month dropdown instead of arrows |
| `showYearPicker`  | `boolean`          | `false` | Show previous/next year arrow buttons           |
| `compactYears`    | `boolean`          | `false` | Show a compact year dropdown instead of arrows  |
| `showSelectedMonthLabel` | `boolean`   | `false` | Show the current month name as plain text (no controls, no popup) |
| `showSelectedYearLabel`  | `boolean`   | `false` | Show the current year as plain text (no controls, no popup)       |
| `showTime`        | `boolean`          | `false` | Show a button that opens the time picker popup  |
| `showHome`        | `boolean`          | `false` | Show a button that navigates back to today      |
| `showClear`       | `boolean`          | `false` | Show a button that clears the current selection |
| `showThemeToggle` | `boolean`          | `false` | Show a light/dark theme toggle button           |
| `col`             | `number \| string` | —       | CSS grid `grid-column` value                    |

---

### CalendarMonthGrid

Full-page month picker grid (12 cells).

```tsx
<CalendarMonthGrid />
```

### Props

| Prop             | Type               | Default | Description                                                   |
| ---------------- | ------------------ | ------- | ------------------------------------------------------------- |
| `shortMonths`    | `boolean`          | `true`  | Use abbreviated month names (e.g. "Jan" instead of "January") |
| `disableLimited` | `boolean`          | `true`  | Disable months outside `minDate`/`maxDate` range              |
| `hideLimited`    | `boolean`          | `false` | Completely hide months outside the allowed range              |
| `col`            | `number \| string` | —       | CSS grid `grid-column` value                                  |

---

### CalendarYearsGrid

Full-page year picker grid with pagination.

```tsx
<CalendarYearsGrid yearsPerPage={12} />
```

### Props

| Prop             | Type               | Default | Description                                     |
| ---------------- | ------------------ | ------- | ----------------------------------------------- |
| `yearsPerPage`   | `number`           | `10`    | Number of years shown per page. Clamped to 1–40 |
| `disableLimited` | `boolean`          | `true`  | Disable years outside `minDate`/`maxDate` range |
| `hideLimited`    | `boolean`          | `false` | Completely hide years outside the allowed range |
| `col`            | `number \| string` | —       | CSS grid `grid-column` value                    |

---

### CalendarTimeGrid

Time picker — hours, minutes, optional seconds, AM/PM toggle when `hour12` is enabled.

```tsx
<CalendarTimeGrid showSeconds />
```

### Props

| Prop          | Type               | Default | Description                          |
| ------------- | ------------------ | ------- | ------------------------------------ |
| `showSeconds` | `boolean`          | `false` | Show a third drum for seconds (0–59) |
| `col`         | `number \| string` | —       | CSS grid `grid-column` value         |

---

### CalendarPresets

Quick-select preset buttons (e.g. "Last 7 days", "This month").

```tsx
<CalendarPresets showYears={false} />
```

### Props

| Prop         | Type               | Default | Description                     |
| ------------ | ------------------ | ------- | ------------------------------- |
| `showYears`  | `boolean`          | `true`  | Show year-based preset buttons  |
| `showMonths` | `boolean`          | `true`  | Show month-based preset buttons |
| `col`        | `number \| string` | —       | CSS grid `grid-column` value    |

---

### CalendarSelectedDates

Displays the currently selected dates as removable chips.

```tsx
<CalendarSelectedDates allowClean animated align="center" />
```

### Props

| Prop            | Type                            | Default  | Description                                         |
| --------------- | ------------------------------- | -------- | --------------------------------------------------- |
| `allowClean`    | `boolean`                       | `true`   | Show a clear-all button next to the chips           |
| `allowNavigate` | `boolean`                       | `true`   | Clicking a chip navigates the calendar to that date |
| `animated`      | `boolean`                       | `true`   | Animate chips appearing and disappearing            |
| `align`         | `"left" \| "center" \| "right"` | `"left"` | Horizontal alignment of the chip list               |
| `showTime`      | `boolean`                       | `false`  | Include time (hours and minutes) in the chip label. Respects the `hour12` setting from `<Calendar>` |
| `col`           | `number \| string`              | —        | CSS grid `grid-column` value                        |

---

### CalendarManualSelect

Text input that lets the user type a date directly.

```tsx
<CalendarManualSelect allowClean={false} />
```

### Props

| Prop         | Type                            | Default  | Description                               |
| ------------ | ------------------------------- | -------- | ----------------------------------------- |
| `allowClean` | `boolean`                       | `true`   | Show a clear button inside the input      |
| `align`      | `"left" \| "center" \| "right"` | `"left"` | Horizontal alignment of the input content |
| `col`        | `number \| string`              | —        | CSS grid `grid-column` value              |

---

### CalendarDaysTrack

A horizontal scrollable strip of day numbers for the current month.

```tsx
<CalendarDaysTrack showMonthLabel />
```

### Props

| Prop             | Type               | Default | Description                                               |
| ---------------- | ------------------ | ------- | --------------------------------------------------------- |
| `showMonthLabel` | `boolean`          | `false` | Show the abbreviated month name above the active day item |
| `col`            | `number \| string` | —       | CSS grid `grid-column` value                              |

---

### CalendarMonthsTrack

A horizontal scrollable strip of month names for the current year.

```tsx
<CalendarMonthsTrack shortMonths={false} />
```

### Props

| Prop          | Type               | Default | Description                  |
| ------------- | ------------------ | ------- | ---------------------------- |
| `shortMonths` | `boolean`          | `true`  | Use abbreviated month names  |
| `col`         | `number \| string` | —       | CSS grid `grid-column` value |

---

### CalendarYearsTrack

A horizontal scrollable strip of years.

```tsx
<CalendarYearsTrack />
```

### Props

| Prop  | Type               | Default | Description                  |
| ----- | ------------------ | ------- | ---------------------------- |
| `col` | `number \| string` | —       | CSS grid `grid-column` value |

---

## Utility Functions

### `createTheme(tokens, base?)`

Creates a custom theme object to pass to the `theme` prop.

```ts
import { createTheme } from "react-calendar-datetime";

const myTheme = createTheme(
  { accent: "#6366f1", backdrop: "#0f172a", text: "#f1f5f9" },
  "dark",
);
```

| Token       | Description                                 |
| ----------- | ------------------------------------------- |
| `accent`    | Primary highlight / selected-cell color     |
| `backdrop`  | Calendar background color                   |
| `highlight` | Secondary accent (hover, range ends)        |
| `tone`      | Muted background tone for alternating cells |
| `text`      | Default text color                          |
| `stroke`    | Border / separator color                    |
| `shadow`    | Drop-shadow color                           |
| `disabled`  | Color for disabled date cells               |
| `weekend`   | Color applied to weekend cells              |
| `range`     | Background color for the in-range cells     |

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

**Light:** `mint` `comfy` `neon` `rosa` `snow` `solar` `graphite` `amethyst` `latte` `slate` `scarlet` `prism` `meadow`

**Dark:** `industrial` `midnight` `sandstone` `phosphor` `dracula` `cyber` `temporal` `crimson` `forest` `nebula` `aurora` `espresso` `ember`

**Base:** `light` `dark` `auto`

### Built-in appearances

`default` `soft` `compact` `square` `bubble`
