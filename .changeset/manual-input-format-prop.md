---
"@dateforge/react-calendar": minor
---

`CalendarManualInput` gains a `format` prop for the date input. Pass a token
string with `DD`, `MM`, `YYYY` and any single-char separator(s) — e.g.
`"DD.MM.YYYY"` (default), `"MM/DD/YYYY"`, `"YYYY-MM-DD"`, `"DD-MM-YYYY"`. The
format string also serves as the placeholder. Invalid format strings fall back
to the default with no error. Existing usage stays on `DD.MM.YYYY` and is
unchanged.
