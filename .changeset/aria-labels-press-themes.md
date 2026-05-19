---
"@dateforge/react-calendar": minor
---
Add cascading `actionLabels` config to `<Calendar>` for centralized aria-label customization across all modules.

Add `press` appearance — newspaper-style serif with sharp corners, wide letter-spacing, and flat shadows.

Add `atelier` (light) and `bauhaus` (dark) themes — paired warm cream / cool ink palette with red dateline accent.

Rename appearance tokens for clarity: `--header-padding` → `--cal-nav-padding`, `--header-min-height` → `--cal-nav-min-height`, `--cal-text-2xl` → `--cal-nav-font-size`, `--cal-text-xl` → `--cal-nav-meta-font-size`. The `headerPadding` / `headerMinHeight` TS keys become `navPadding` / `navMinHeight`, with new `navFontSize` / `navMetaFontSize` added.
