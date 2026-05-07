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

Add `useToday()` SSR-safe hook (exported from main entry). Returns `null` on the server and during pre-hydration render, then resolves to `new Date()` after mount via layout effect. Use this instead of `useState(new Date())` to avoid hydration mismatch / two visually-selected day cells in Next.js / Remix / any SSR app. See `DOCUMENTATION.md → SSR pitfall`.

Fix: `CHANGE_TIME` now rejects time edits that violate `minDate` / `maxDate` / `disabled` rules. Range mode re-validates the affected endpoint via `validateRange` (covers `minRangeDays` / `maxRangeDays` / ordering).
