---
"@dateforge/react-calendar": patch
---

Fix stale hover preview in range mode after clearing and re-selecting the start day. Clicking the start of a complete range now clears both bounds.

Add `todayDot` prop to `CalendarDays` (default `true`) — renders a small `--c-b` dot under the digit when the selected day is also today.
