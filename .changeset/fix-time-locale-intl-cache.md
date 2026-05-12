---
"@dateforge/react-calendar": patch
---

Fix `getTimeString` ignoring locale (always formatted with `"en"`). Add `locale` parameter; update both call sites in `CalendarNav` to pass the configured locale.

Add `getNumberFormat` to `intl-cache` so `Intl.NumberFormat` instances (used for unit labels in the time track) are cached across renders instead of recreated each time.

Deduplicate wrap arithmetic in `StepDrum` by using the existing `getDrumValue` utility.

Only fire `onTimeSelect` for accepted time changes.

Remove second-step future shortcuts from `basicPresets`.
