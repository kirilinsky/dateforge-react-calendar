Reduced motion# Design

Visual & UX design system for `@dateforge/react-calendar`. Covers tokens, themes, appearances, motion, interaction patterns, and accessibility.

For state/composition/contracts see [`ARCHITECTURE.md`](./ARCHITECTURE.md). For prop reference see [`DOCUMENTATION.md`](./DOCUMENTATION.md).

---

## Two axes of styling

Styling splits along two **independent** dimensions. Any theme combines freely with any appearance.

- **Theme** = palette (colors). CSS custom properties on the wrapper. Applied via `data-theme` attribute. String values: `"auto" | "light" | "dark"`. Anything else must be a `CustomTheme` object — either a named theme imported from `@dateforge/react-calendar/themes/<name>`, or `createTheme()` output. Named theme **names are export names, not accepted string values** — passing the string `"midnight"` is invalid and emits a dev warning.
- **Appearance** = structure (radii, sizing, density, border styles, motion duration). Applied via `data-appearance` attribute. Custom via `createAppearance()`.

The combinatorial product (themes × appearances) is the primary target for visual regression testing (Chromatic).

### CSS layering

User styles override library defaults predictably:

```
@layer cal-base, cal-components, cal-modules, themes, appearances, user;
```

User layer wins over `themes` and `appearances`; both win over base/component/module layers.

---

## Design tokens

### Color tokens (`--c-*`)

Source: `themes/themes.ts`. 15 tokens per theme.

| Token   | Role                                          |
| ------- | --------------------------------------------- |
| `--c-a` | accent — primary action                       |
| `--c-at`| activeText — text on active/pressed           |
| `--c-t-d` | todayDot — dot under selected today         |
| `--c-b` | backdrop — dialog/overlay background          |
| `--c-h` | highlight — hover/focus indicator, selected   |
| `--c-t` | tone — calendar grid background subtone       |
| `--c-c` | text — primary text                           |
| `--c-s` | stroke — border, divider, outline             |
| `--c-x` | shadow — shadow tint (alpha-blended)          |
| `--c-d` | disabled — disabled control background        |
| `--c-m` | mutedText — secondary/hint text               |
| `--c-dt`| disabledText                                  |
| `--c-we`| weekend — weekend cell highlight              |
| `--c-r` | range — range selection background            |
| `--c-e` | error — invalid state                         |

### Typography tokens

Source: `src/core/layout.module.css`.

- `--cal-font-size`: `clamp(11px, 2.7cqw, 18px)` — container-relative base
- `--cal-text-2xs … --cal-text-2xl`: semantic scale (0.6em–1.1em)
- `--cal-text-day`: `clamp(0.72em, …, 1.15em)` — adaptive day-cell sizing
- `--cal-weight-{regular,medium,semibold,bold}`: 400–700
- `--cal-leading-{tight,normal,relaxed}`: 1 → 1.6

### Appearance tokens (shape / spacing / motion)

Source: `appearances/index.ts`.

| Token                   | Purpose                                         |
| ----------------------- | ----------------------------------------------- |
| `--cal-radius`          | base border-radius                              |
| `--cal-container-radius`| outer container radius (multiplier of radius)   |
| `--cal-spacing`         | base gap/padding unit                           |
| `--cal-border`          | stroke width                                    |
| `--cal-shadow-{sm,md,lg}`| shadow depth (uses `var(--c-x)`)               |
| `--cal-transition`      | animation duration                              |
| `--cal-days-padding`    | day-cell padding                                |
| `--cal-track-height`    | scrollable track height                         |
| `--cal-day-ratio`       | day-cell aspect ratio                           |

---

## Themes (38)

Generated via `scripts/generate-theme.ts` → `themes/<name>.ts`. Do **not** hand-edit generated files; re-run `npm run build`.

**Light / bright:** `tide`, `graphite`, `mint`, `snow`, `solar`, `slate`, `neon`, `prism`, `meadow`, `latte`, `split`, `riso`, `monsoon`, `pearl`, `chalk`, `comfy`.

**Dark / vibrant:** `fjord`, `industrial`, `crimson`, `amethyst`, `cyber`, `espresso`, `ember`, `phosphor`, `midnight`, `sandstone`, `rosa`, `dracula`, `nebula`, `aurora`, `forest`, `scarlet`, `temporal`, `flare`, `abyss`.

Range covers muted pastels (`latte`, `comfy`), neon/cyber (`phosphor`, `neon`, `abyss`), earth tones (`sandstone`, `forest`).

---

## Appearances (5)

| Appearance | Character                                       | Key tokens                                                          |
| ---------- | ----------------------------------------------- | ------------------------------------------------------------------- |
| `compact`  | Dense, minimal padding, tight                   | radius 0.3em, spacing 0.35em, transition 0.15s, day-ratio 1/0.7     |
| `square`   | Sharp corners, tight, minimal shadows           | radius 0, spacing 0.5em, transition 0.12s                            |
| `soft`     | Subtle rounding, balanced, gentle shadows       | radius 0.75em, spacing 0.7em, transition 0.25s                       |
| `bubble`   | Rounded, spacious, prominent shadows            | radius 1.5em, spacing 0.7em, transition 0.28s, header 4em           |
| `loft`     | Large, relaxed                                  | radius 1em, spacing 1em, transition 0.35s, day-padding 1.8em        |
| `airy`     | Borderless, light weights, generous spacing     | radius 0.4em, border 1px, spacing 1em, weights 300, no shadows      |

---

## Layout & composition

### Container responsiveness

Source: `src/core/layout.module.css`.

- `container-type: inline-size` — calendar responds to its **own** width, not viewport.
- `max-width: 864px`, grid layout with 1px gap.
- `--cal-font-size: clamp(11px, 2.7cqw, 18px)` — text scales with container width.

### Grid systems

- Days: `grid-template-columns: repeat(7, 1fr)` (+ optional week-number column).
- Years grid: 3 → 4 → 5-col responsive via `@container` queries.
- Months grid: 2 → 3-col responsive.

### Data attributes (root)

- `data-theme="light|dark|auto"` — theme selector. CSS handles `auto` via `prefers-color-scheme` (avoids flash).
- `data-appearance="<name>"` — appearance selector.
- `data-readonly` — read-only mode marker.
- `data-area="days|selected-dates|time"` — functional region markers.
- `data-direction="up|down"` — popup anchor direction (set by `useLayoutEffect` in popup).

---

## Motion

### Transition durations (per appearance)

`compact 0.15s`, `square 0.12s`, `soft 0.25s`, `bubble 0.28s`, `loft 0.35s`, `airy 0.2s`. Used by CSS transitions on opacity / transform / colors via `var(--cal-transition)`.

### Track scroll physics

Source: `src/hooks/use-track.ts`.

| Constant       | Value | Role                              |
| -------------- | ----- | --------------------------------- |
| `FRICTION`     | 0.95  | velocity decay (inertia)          |
| `SPRING_K`     | 0.08  | snap stiffness                    |
| `SPRING_DAMP`  | 0.82  | underdamped bounce                |
| `RUBBER_K`     | 0.12  | boundary resistance               |
| `RUBBER_DAMP`  | 0.75  | rubber-band damping               |

Snap threshold ~3.5px/frame; settle tolerance 0.4px. Pointer events drive position updates.

### Reduced motion

**Not yet enforced globally.** `src/modules/nav/nav.module.css` honors `@media (prefers-reduced-motion: reduce)` for drum/pulse animations; other animations (month slide, chip fade, AnimatedTime) currently run regardless. **TODO:** wrap remaining animations behind the same media query, or expose a `reducedMotion` prop / context flag.

---

## Interaction patterns

### Keyboard — day grid

ARIA grid pattern (https://www.w3.org/WAI/ARIA/apg/patterns/grid/). Source: `src/hooks/use-calendar-keyboard.ts`.

| Key                  | Action                               |
| -------------------- | ------------------------------------ |
| Arrow Left / Right   | Move focus by one day                |
| Arrow Up / Down      | Move focus by one week               |
| Home / End           | First / last day of focused week     |
| Page Up / Page Down  | Previous / next month                |
| Shift + Page Up/Down | Previous / next year                 |
| Enter or Space       | Select focused day                   |

Roving tabindex: focused day = `tabindex="0"`, others `-1`. Focus crosses month boundaries via `navigateTo` unless `blockNavigation` is set.

### Keyboard — time picker / tracks

| Key             | Action                       |
| --------------- | ---------------------------- |
| Arrow Up / Down | Decrement / increment by one |
| Home / End      | Jump to min / max value      |

Tracks (`<CalendarDaysTrack>`, `<CalendarMonthsTrack>`, `<CalendarYearsTrack>`):

| Key                | Action                             |
| ------------------ | ---------------------------------- |
| Arrow Left / Right | Step backwards / forwards          |
| Page Up / Down     | Jump 7 items (DaysTrack)           |
| Home / End         | First / last allowed item          |

### Focus management

`src/hooks/use-focus-trap.ts`. Tab cycles through focusable elements (`button, [href], input, select, textarea, [tabindex]`); Shift+Tab wraps backward; Escape closes popup and returns focus to the trigger.

### Popup positioning

`src/components/popup/popup.tsx`. `useLayoutEffect` places dialog below anchor (or above if space-constrained). `data-direction` reflects actual placement. Confirm/Close in footer. Only one popup open at a time (UI state in `UIContext`).

---

## Accessibility

`@dateforge/react-calendar` is built **inclusive-first** — usable by people who navigate with keyboards, screen readers, switch devices, voice control, and people who prefer larger touch targets or reduced motion. Tests in `src/__tests__/integration/a11y.test.tsx` use [`jest-axe`](https://github.com/nickcolley/jest-axe) to gate the contract on CI.

### Day grid (`<CalendarDays>`)

| Element                                     | Role           | ARIA / DOM                                                                             |
| ------------------------------------------- | -------------- | -------------------------------------------------------------------------------------- |
| Outer grid container                        | `grid`         | `aria-label` = localized month + year (e.g. "June 2024")                               |
| Weekday header row                          | `row`          | —                                                                                      |
| Each weekday header                         | `columnheader` | `aria-label` = full weekday name; visible text may be the abbreviation                 |
| Week row                                    | `row`          | `aria-label="Week N"` (ISO week number)                                                |
| Week number cell (when `weekNumbers`)       | `rowheader`    | `aria-label="Week N"`                                                                  |
| Day cell                                    | `gridcell`     | `aria-selected` for selected; `aria-disabled` for disabled or `readOnly`               |
| Day button (inside cell)                    | (button)       | `aria-label` = full localized date + state suffix ("today", "selected", "disabled", …) |
| Today's button                              | (button)       | `aria-current="date"`                                                                  |
| Hidden out-of-range cell (`hideOutOfRange`) | `presentation` | Not exposed to AT; preserves grid layout only                                          |
| Empty week row (all cells hidden)           | `presentation` | Whole row dropped from AT                                                              |

### Time picker (`<CalendarTimeGrid>` and `<TimeTrack>` inside Nav popup)

Each drum (hour / minute / second) is `role="spinbutton"` with `aria-label`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext`. AM/PM buttons use `aria-pressed`. Under `readOnly` the spinbutton gets `aria-disabled="true"` and all keyboard / scroll / click handlers no-op.

### Tracks

Same `role="spinbutton"` pattern as time drums; values reflect highlighted item.

### Popups (`MonthPopup`, `YearPopup`, `TimePopup`)

`role="dialog"` + `aria-modal="true"` + `aria-label` ("Select month" / "Select year" / "Select time"). Focus trapped inside via `useFocusTrap`; `Escape` closes.

### Calendar root and `readOnly`

Root gets `data-readonly` and `aria-readonly="true"` when `readOnly` is set. Every interactive module additionally renders its UI as `disabled` / `aria-disabled` so screen reader announcements stay consistent. See ARCHITECTURE.md → "`readOnly` contract" for the full disable matrix.

### Live region for selection changes

`CalendarLayout` mounts a single off-screen `<div role="status" aria-live="polite" aria-atomic="true">` that announces the most recently committed date in the configured locale. Range/selection updates are audible without forcing the screen reader user to re-read the entire grid.

### Selected dates / chips

Chips are real `<button>`s with localized text content; click navigates the view (`navigateTo`). Clear-all button has `aria-label="Clear"` and is disabled under `readOnly`.

### Manual input

Masked `<input type="text" inputMode="numeric">` — inherits platform IME / a11y. Under `readOnly` HTML `readOnly` attribute applied. Apply / clear buttons use `aria-label`. Invalid input flips a red wrapper class (visual only).

### Hidden day cells

`<CalendarDays hideOutOfRange>` and `<CalendarDays currentMonthOnly>` replace skipped cells with `<div role="presentation" />` placeholders — preserve grid layout, removed from a11y tree. Disabled-but-visible cells follow standard ARIA grid pattern: `role="gridcell"` + `aria-disabled="true"` + descriptive `aria-label`. They remain reachable by keyboard so users do not silently lose positions.

Decision tree for any out-of-range date:

1. Default — `gridcell` + `aria-disabled="true"`.
2. `hideOutOfRange` — `role="presentation"` placeholder. AT skips it.
3. Whole row of placeholders — outer row also becomes `role="presentation"`.

Keyboard navigation does not currently skip over hidden positions (computed by date math, not visibility). When `hideOutOfRange` is desired together with full keyboard traversal, consumers should add `blockNavigation` to constrain arrows to the visible month.

### Reduced motion

Not yet implemented as an explicit guard. See "Motion → Reduced motion" above.

### Testing

`a11y.test.tsx` runs `jest-axe` on representative module compositions (default Days, with selection, with min/max, range mode, `hideOutOfRange`, `currentMonthOnly`, TimeGrid). Any axe violation fails CI. New modules MUST land with their own axe test cases.

Manual SR coverage: NVDA (Windows), VoiceOver (macOS / iOS), TalkBack (Android) are supported targets.

---

## SSR-safe theming

CSS-native `auto` fallback prevents white flash on dark-mode first paint:

```
[data-theme="auto"] { … light defaults … }
@media (prefers-color-scheme: dark) {
  [data-theme="auto"] { … dark overrides … }
}
```

CSS wins the race vs JS. Client-side resolution via `useClientValue(matchMedia, "light")` updates `data-theme` after mount; CSS already rendered the correct palette so no FOUC. Mechanism details in ARCHITECTURE.md → "SSR / hydration".

---

## File references

- `themes/themes.ts` — 40 themes, 15 tokens each
- `appearances/index.ts` — 6 appearances
- `src/core/layout.module.css` — typography, container query, color defaults
- `src/hooks/use-client-value.ts` — SSR-safe deferred values
- `src/hooks/use-calendar-keyboard.ts` — keyboard nav
- `src/hooks/use-focus-trap.ts` — focus trap
- `src/hooks/use-track.ts` — scroll physics
- `src/components/popup/popup.tsx` — popup positioning + focus trap
- `src/__tests__/integration/a11y.test.tsx` — axe gate
