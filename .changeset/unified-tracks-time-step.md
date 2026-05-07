---
"@dateforge/react-calendar": minor
---

Add `timeStep` prop on `<Calendar>` for time drum granularity (applies to `CalendarTimeGrid` and the `CalendarNav` time popup):

```tsx
<Calendar timeStep={{ minute: 15 }}>
  <CalendarTimeGrid />
</Calendar>
```

`{ hour?, minute?, second? }`, default `1`. Affects `aria-valuemax`, keyboard, and snap. 

Fix: `CHANGE_TIME` now rejects time edits that violate `minDate` / `maxDate` / `disabled` rules. Range mode re-validates the affected endpoint via `validateRange` (covers `minRangeDays` / `maxRangeDays` / ordering).
