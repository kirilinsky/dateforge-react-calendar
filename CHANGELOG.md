## Changelog

### 🚀 Version 6.0.0

- **🗂️ CSS-only responsive layout via `:has()`** — `getGridLayout()` and `getLayoutMode()` removed entirely. All grid logic is now in CSS: `.calendarContainer` detects child blocks via `:has([data-area="..."])` and switches `grid-template-columns` / `grid-template-areas` declaratively. Responsive breakpoints implemented via `@container` — no JS, no `ResizeObserver`.
- **📐 Smart breakpoints for panel combinations** — at 350–660px with `monthsGrid` + `timeGrid` active: months span full width (4 columns), days and time sit side by side. At ≤350px — full vertical stack. Single panels collapse at ≤460px.
- **🧱 CSS `@layer cal-base`** — all component styles wrapped in `@layer cal-base`. Layer order: `cal-base → themes → appearances → cal-user`. User styles in `@layer cal-user` win without `!important`.
- **💅 New appearance `"bubble"`** — highly rounded borders (`--cal-radius: 1.5em`), harmonious container via `--cal-container-radius: 2.2em`.
- **🔵 `--cal-container-radius`** — new CSS variable for independent control of the container border-radius (decoupled from `--cal-radius * 1.6`).
- **📅 Presets: 12 items, chronological order** — added «2 weeks ago» and «In 2 months». Order reworked from past to future: Last year → … → Today → … → Next year. Presets grid: `repeat(4, 1fr)` — identical to the months grid.
- **🎨 Unified button style** — presets and months share the same size, padding, and transparent background for inactive items.
- **📦 `dist/style.css` as an explicit import** — CSS is no longer injected into the JS bundle. Requires explicit `import 'react-calendar-datetime/style.css'`.
- **🎨 CSS `@layer` architecture** — All component styles now live inside named `@layer` blocks (`base`, `themes`, etc.), giving consumer apps full specificity control without `!important`.
- **🖌️ Themes as separate CSS files** — Theme definitions moved out of the main bundle. Each theme ships as its own `dist/themes/<name>.css`; `dist/themes/index.css` bundles all of them. Import only what you need. `src/themes.gen.css` is auto-generated via `npm run build` — do not edit manually.
- **🧩 `createTheme()` utility** — New `createTheme(tokens, base)` helper lets you build a fully typed custom theme object and pass it directly as the `theme` prop. No CSS required.
- **🗑️ `allowCleanSelected` prop** — Controls visibility of the clear (×) button in the selected-dates panel. Defaults to `true`. When `false`, the button is hidden but still reserves its layout space so the panel height stays stable.
- **🚫 `allowNavigateSelected` prop** — When `false`, clicking a date chip in the selected-dates panel no longer navigates the calendar view. Defaults to `true`.
- **✍️ `manualSelect` prop** — Enables a manual date entry bar between the header and the day grid. Renders a masked `DD.MM.YYYY` input with Enter-to-save, Escape-to-clear, and keyboard-friendly navigation. Fully respects `startDate`/`endDate`/`disabled` rules — out-of-bounds dates are rejected and highlighted in red. Each mode is supported:
  - **Single** — one input that toggles between a display chip and an editable field on click.
  - **Range** — two inputs (start / end) separated by an em-dash; each can be cleared independently.
  - **Multiple** — an add-new input plus a chip per selected date; only one slot is editable at a time; each chip has an inline clear button.
- **🗑️ `allowCleanManualSelect` prop** — Controls visibility of the "clear all" button inside the manual-select bar. Defaults to `true`.
- **🎨 `appearance` prop** — Controls the visual shape of the calendar independently of the color theme. Four built-in presets: `"default"` (0.5em radius, soft shadows), `"compact"` (tighter spacing, smaller radius), `"square"` (no radius, clean edges), `"brutalist"` (2px border, no shadows, monospace font, uppercase labels). Replaces the old boolean `brutalist` prop.
- **🛠️ `createAppearance()` utility** — Build a fully typed custom appearance object and pass it as the `appearance` prop. Accepts `radius`, `border`, `spacing`, `shadowSm`, `shadowMd`, `shadowLg` tokens.
- **🌑 Shadow tokens** — Three new CSS variables extracted from component styles: `--cal-shadow-sm` (interactive element hover/focus), `--cal-shadow-md` (internal panels and highlights), `--cal-shadow-lg` (outer calendar container). All are set to `none` in the brutalist appearance.
- **🪲 Bug fixes** — Month navigation no longer resets the selected time to 00:00 when navigating to a boundary month.

### 🚀 Version 5.2.2

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
