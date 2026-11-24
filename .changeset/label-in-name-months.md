---
"@dateforge/react-calendar": patch
---

a11y: month accessible names now match the visible label (WCAG 2.5.3 Label in Name). `CalendarMonthsGrid` tiles with short labels are named "Jan" (or "Jan, selected") instead of "January", and `CalendarToolbarMonthTrigger` with `short` reads "Change month, currently Jun". Voice-control users can now activate them by what they see. If your tests query month tiles by full name (e.g. `getByLabelText("January")`) with short labels, update them to the short label.
