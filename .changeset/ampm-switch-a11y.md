---
"@dateforge/react-calendar": patch
---

AM/PM control redesigned as a single `role="switch"` toggle: larger hit target, sliding thumb, gradient-aware active styles, softer focus ring, keyboard Space/Enter support.

`CalendarDays` render perf: stabilize cell handlers via ref-pattern so `React.memo` no longer bypasses on every selection/hover, key cells by `dateTime` for stable identity across renders, cache `isTodayDate` per cell, extract class composition into pure `getDayCellClassName` helper.

Shared `Intl.DateTimeFormat` cache keyed by `locale + sorted-options`. Replaces ad-hoc `new Intl.DateTimeFormat` calls and inconsistent `useMemo` wrapping across `CalendarNav`, `CalendarDays`, `CalendarSelectedDates`, `CalendarMonthsGrid`, `CalendarMonthsTrack`, `CalendarDaysTrack`, layout announcer, `getTodayInTimezone`, and live-time `getTimeString`. Bounded FIFO eviction (64 entries) prevents unbounded growth.

`CalendarTimeGrid` gains optional `labels` prop. `labels="short"` renders `HH` / `MM` / `SS` above each drum (clock convention). `labels="long"` renders the localized field name via `Intl.DisplayNames(locale, { type: "dateTimeField" })`. Omit to keep current label-less layout.
