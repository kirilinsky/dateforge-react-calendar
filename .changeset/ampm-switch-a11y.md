---
"@dateforge/react-calendar": patch
---

AM/PM control redesigned as a single `role="switch"` toggle: larger hit target, sliding thumb, gradient-aware active styles, softer focus ring, keyboard Space/Enter support.

`CalendarDays` render perf: stabilize cell handlers via ref-pattern so `React.memo` no longer bypasses on every selection/hover, key cells by `dateTime` for stable identity across renders, cache `isTodayDate` per cell, extract class composition into pure `getDayCellClassName` helper.

Shared `Intl.DateTimeFormat` cache keyed by `locale + sorted-options`. Replaces ad-hoc `new Intl.DateTimeFormat` calls and inconsistent `useMemo` wrapping across `CalendarNav`, `CalendarDays`, `CalendarSelectedDates`, `CalendarMonthsGrid`, `CalendarMonthsTrack`, `CalendarDaysTrack`, layout announcer, `getTodayInTimezone`, and live-time `getTimeString`. Bounded FIFO eviction (64 entries) prevents unbounded growth.

`CalendarTimeGrid` gains optional `labels` prop. `labels="short"` renders `HH` / `MM` / `SS` above each drum (clock convention). `labels="long"` renders the localized field name via `Intl.DisplayNames(locale, { type: "dateTimeField" })`. Omit to keep current label-less layout.

`CalendarNav` polish: chevron SVG icons replace unicode `‹` / `›` arrows; compact month/year buttons match time/picker height and pick up hover styles; nav uses `justify-content: space-between` so items distribute across the row; `themeToggle` aria-label is dynamic (`"Switch to dark mode"` / `"Switch to light mode"`) with `aria-pressed` reflecting current theme; month/year picker buttons use native `disabled` instead of `aria-disabled` when fixed by `minDate === maxDate`; nav `label` prop renders as a heading and is wired to the toolbar via `aria-labelledby`; `manual-input` mask preserves caret position when editing mid-string and steps over separator on Backspace; `DaysTrack` month label uses active-cell color for proper contrast in the active item; `CalendarManualInput` internals split into `masked-date-input.tsx` and `date-slot.tsx`.

`CalendarTimeGrid` AM/PM switch fix: switch active label now uses an explicit `data-value` attribute so the AM label receives the active color in AM mode (the previous `:first-of-type` selector matched the thumb span, leaving AM muted).
