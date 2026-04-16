## Changelog

### 🚀 Version 5.2.2 (LTS)

- **✅ Code optimization**
- **📅 `highlightToday` prop** — When `true`, today's date cell gets outline.
- **🪲 Bug fixes**

### 🚀 Version 5.1.3

- **🌗 Theme toggle button** — New `showThemeToggle` prop adds header button that switches between `paper` (light) and `carbon` (dark) mode toggle.
- **🌌 Nebula theme** — New dark theme with deep indigo backdrop and bright violet accent.
- **❤️ A11y improvements**

### 🚀 Version 5.0.1

- **Bug fixes.**

### Version 5.0.0 — Breaking

- **🔄 New API** — `value` replaces `date`; selection mode is now controlled by `mode: 'single' | 'multiple' | 'range'`. Separate callbacks: `onChange` (single), `onDatesChange` (multiple), `onRangeChange` (range).
- **📅 Range mode** — First click sets `from`, hover shows live preview, second click sets `to`. `onRangeChange` fires on each click with `{ from, to }` where `to` is `null` until end is picked.
- **🔢 Range limits** — `rangeMinDays` / `rangeMaxDays` props block selections outside the allowed span.
- **📋 Selected dates panel** — `showSelectedDates` renders chips below the calendar for all modes.
- **🗓️ Two-months layout** — `twoMonthsLayout` shows current and next month side by side; stacks below ~540px.
- **🪟 Month/year popups** — Month and year selectors migrated from inline dropdowns to popups.
- **👆 Gestures on by default** — `gestures` prop now defaults to `true`.
- **✅ Multi-select** — `mode="multiple"` with optional `max` cap (replaces old `multiselect` prop).
- **🗑️ Removed** — `date`, `onChangeDate`, `onChangeDates`, `multiselect` props removed.
- **🚫 Disabled rule** — `disableWeekends` removed in favor of `disabled={{ dayOfWeek: [0, 6] }}`.

---

### Version 4.0.0

- **📐 Fluid adaptive grid** — Replaced static + "jelly" (cqw) dual modes with a single fluid layout that fits any container width. Smart font auto-sizing, ideal cell proportions, zero breakpoints.
- **🎨 Theme overhaul** — Reworked colors across all 18 themes for better contrast and readability.
- **🌈 Gradient mode redesign** — Completely rebuilt gradient backgrounds for a cleaner, more polished look.
- **🏗️ Brutalism mode redesign** — Now a proper industrial aesthetic — sharp edges, raw surfaces, heavy type.
- **🕒 4 new presets** — Next week, next month, in 2 weeks, next year.
- **👆 Gesture scrolling** — Swipe-to-scroll for hour & minute tracks (opt-in via `gestures` prop).
- **🚫 Date unselect** — Tap a selected date again to clear it.
- **🔲 Updated shadows** — Refined shadow tokens across all components.

---

## Patch notes (old versions)

- **v3.2.1:** Compact inline time popup, 12/24h support via `hour12` prop, time grid redesign.
- **v3.1.2:** Themes: `Industrial` & `Graphite`, month grid is now optional. Month selector defaults to a compact header
- **v3.0.5:** Brutalism mode added.
- **v3.0.4:** Gradient backgrounds.
- **v3.0.1:** Touch gestures.
- **v3.0.0:** Jelly Mode, Crimson & Amethyst themes, `startOfWeek`, `showWeekNumber`, `highlightWeekends`/`disableWeekends`, `compactMonths`/`compactYears`, migrated to CSS Modules, switched to `tsdown`.
- **v2.5.4:** Bug fixes.
- **v2.5.3:** Added `minDate` and `maxDate` support.
- **v2.5.2:** Added a new `boxShadow` layer to the theme engine.
- **v2.5.1:** New themes: `Neon` and `Temporal`.
- **v2.5.0:** Infinite localization added.
- **v2.4.4:** Bug fixes.
- **v2.4.3:** Optimized bundle size (experimental `tsup` config).
- **v2.4.2:** Bug fixes, added `Tomorrow` preset.
- **v2.4.1:** Decoupled data from types in `.d.ts` files.
- **v2.4.0:** Added `Comfy`, `Rosa`, `Solar`, and `Snow` themes, added `Portugal` 🇵🇹 locale.
- **v2.3.0:** Removed `dayjs`, refactored Time Picker, implemented fixed 42-cell days grid.
- **v2.2.0:** Auto-injected runtime styles (~1KB), added `Dracula` dark-red theme.
- **v2.1.0:** Added `Phosphor` neon-green theme.
- **v2.0.0:** TS migration, strict types, React 19, pre-generated labels, flexible `months` layout, `es`/`sr` locales.
- **v1.3.1:** Added year picker, dark theme, `zh-cn` and `fr` locales.
- **v1.0.0:** Initial release.
