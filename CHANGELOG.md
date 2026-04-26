# Changelog

## 1.0.0

Initial stable release of `@dateforge/react-calendar`.

Renamed from `react-calendar-datetime`. Behavior matches the last published beta of the old package, with one explicit policy change:

- **Invalid Date drop policy** — `value` / `defaultValue` containing `Invalid Date` is dropped from the selection (single → no value; multiple → filtered; range → bound nulled) instead of being silently replaced with today. View date falls back to `defaultViewDate` or today. A dev warning is emitted.
