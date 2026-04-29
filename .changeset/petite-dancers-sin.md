---
"@dateforge/react-calendar": minor
---

- fix: range-bound tracks enforce composite ordering — `to` can't move before `from`, `from` can't move past `to`. Per-field min/max recomputed each render from opposite bound + other fields.
- fix: `useBoundDateView` falls back to opposite bound when own is null, so bound modules stay coherent across both sides.
- fix: `SET_RANGE_BOUND` reducer replaces auto-swap with no-cross clamp. Bounds no longer flip identity mid-drag.
- feat: `bound` prop on `<CalendarNav>` — labels, arrows, popups, `home`, `clear` route through the bound boundary.
- fix: controlled `value` is now single source of truth. User actions fire `onChange` with the next value but never mutate internal selection state. Only `viewDate` updates locally.
