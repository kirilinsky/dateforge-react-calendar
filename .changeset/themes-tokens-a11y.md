---
"@dateforge/react-calendar": minor
---

Theming, tokens, a11y, standalone module callbacks.

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
