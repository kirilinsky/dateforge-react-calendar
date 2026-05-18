---
"@dateforge/react-calendar": patch
---

Perf: rAF-coalesce range-hover updates and gate hover-date recomputation per month so multi-month layouts stay under one frame per hover tick.

Feat: new `syncViewOnSelect` prop on `CalendarDays`. Defaults to `true` for the primary grid and `false` for any `offset` grid, so clicking a day in a side month no longer steals the primary view. Pass `true`/`false` to override.
