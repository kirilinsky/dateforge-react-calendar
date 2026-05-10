---
"@dateforge/react-calendar": patch
---

CalendarDays: new `weekdayFormat` prop (`"narrow" | "short" | "long"`, default `"short"`). Locale-aware via `Intl.DateTimeFormat` — `"narrow"` renders single-letter labels (M T W…), `"long"` renders full names. Header font-size auto-adjusts per format.

Gradient mode (`<Calendar gradient />`): styling extended beyond root background. Active surfaces across all modules now consume the gradient tokens — selected day cell, active preset chip, active selected-dates chip, current month/year cell, drum/track highlight pills (time, days/months/years tracks), nav time button, popup confirm button, days-track confirm button, manual-input chip wrapper, month-year nav track. Theme-aware via `--c-h` highlight token. Non-gradient mode behavior unchanged (var fallbacks resolve to existing tokens).
