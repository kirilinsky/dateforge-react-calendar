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
