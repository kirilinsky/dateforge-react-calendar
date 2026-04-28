---
"@dateforge/react-calendar": minor
---

Add `error` theme token (`--c-e`) and surface it across feedback paths.

- New `error` token in `ThemeTokens` mapped to CSS var `--c-e`. Provided for all 33 built-in themes (red-themed palettes use a contrasting amber/orange so the signal still pops). `createTheme` accepts the new key transparently.
- `<CalendarManualInput>`: invalid-input border, focus ring, save button and chip-remove hover all now use `var(--c-e)`. Input gets a deterministic SSR-safe `id` via `useId`.
- `multiple` mode: when `maxDates` is reached, hovering an unselected day shows a soft `--c-e` tint with `not-allowed` cursor (`data-max-reached` attribute on the cell).
- Disabled-day clicks no longer leak through the cell handler — explicitly rejected in the day select reducer.
