# Design

Visual & UX design system for `@dateforge/react-calendar`. Covers tokens, themes, appearances, motion, interaction patterns, and accessibility.

For state/composition/contracts see [`ARCHITECTURE.md`](./ARCHITECTURE.md). For prop reference see [`DOCUMENTATION.md`](./DOCUMENTATION.md).

---

## Two axes of styling

Styling splits along two **independent** dimensions. Any theme combines freely with any appearance.

- **Theme** = palette family (colors). CSS custom properties on the wrapper. Applied via `data-theme` plus inline token vars. The default palette supports auto/light/dark without imports; named palettes are `ThemeFamily` objects imported from `@dateforge/react-calendar/themes/<name>` or returned by `createTheme()`. Theme names are export names, not accepted string values — passing the string `"nebula"` is invalid and emits a dev warning.
- **Appearance** = structure (radii, sizing, density, border styles, motion duration). Applied via `data-appearance` attribute. Custom via `createAppearance()`.

The combinatorial product (themes × appearances) is the primary target for visual regression testing (Chromatic).

### CSS layering

User styles override library defaults predictably:

```
@layer cal-base, cal-themes, cal-appearances, cal-modules, cal-user;
```

Layer order is part of the public v2 styling contract:

- `cal-base` — reset, typed token declarations, token defaults, shell layout, shared primitives
- `cal-themes` — built-in/custom theme color variables
- `cal-appearances` — appearance sizing, radius, density, and motion variables
- `cal-modules` — module-owned layout and state styling
- `cal-user` — optional user override layer

Unlayered app CSS still wins over all library layers. Prefer tokens and stable
`data-*` state attributes before reaching for `cal-user`.

---

## Design tokens

### Color tokens (`--c-*`)

Source: `themes/themes.ts`. 15 tokens per theme.

| Token     | Role                                        |
| --------- | ------------------------------------------- |
| `--c-a`   | accent — primary action                     |
| `--c-at`  | activeText — text on active/pressed         |
| `--c-t-d` | todayDot — dot under selected today         |
| `--c-b`   | backdrop — dialog/overlay background        |
| `--c-h`   | highlight — hover/focus indicator, selected |
| `--c-t`   | tone — calendar grid background subtone     |
| `--c-c`   | text — primary text                         |
| `--c-s`   | stroke — border, divider, outline           |
| `--c-x`   | shadow — shadow tint (alpha-blended)        |
| `--c-d`   | disabled — disabled control background      |
| `--c-m`   | mutedText — secondary/hint text             |
| `--c-dt`  | disabledText                                |
| `--c-we`  | weekend — weekend cell highlight            |
| `--c-r`   | range — range selection background          |
| `--c-e`   | error — invalid state                       |

### Typography tokens

Source: `src/core/layout.module.css`.

- `--cal-font-size`: `clamp(11px, 2.7cqw, 18px)` — container-relative base
- `--cal-text-2xs … --cal-text-lg`: semantic scale (0.6em–0.95em). `xl`/`2xl` were retired in favor of `--cal-nav-meta-font-size` / `--cal-nav-font-size` since they were nav-only.
- `--cal-text-day`: `clamp(0.72em, …, 1.15em)` — adaptive day-cell sizing
- `--cal-weight-{regular,medium,semibold,bold}`: 400–700
- `--cal-leading-{tight,normal,relaxed}`: 1 → 1.6

### Appearance tokens (shape / spacing / motion)

Source: `appearances/index.ts`.

| Token                      | Purpose                                                           |
| -------------------------- | ----------------------------------------------------------------- |
| `--cal-radius`             | base border-radius                                                |
| `--cal-container-radius`   | outer container radius (multiplier of radius)                     |
| `--cal-spacing`            | base gap/padding unit                                             |
| `--cal-border`             | stroke width                                                      |
| `--cal-shadow-{sm,md,lg}`  | shadow depth (uses `var(--c-x)`)                                  |
| `--cal-transition`         | animation duration                                                |
| `--cal-days-padding`       | day-cell padding                                                  |
| `--cal-track-height`       | scrollable track height                                           |
| `--cal-day-ratio`          | day-cell aspect ratio                                             |
| `--cal-nav-padding`        | padding of `CalendarNav` container (was `--header-padding`)       |
| `--cal-nav-min-height`     | minimum height of `CalendarNav` (was `--header-min-height`)       |
| `--cal-nav-font-size`      | nav container root font-size; cascades to all nav children via em |
| `--cal-nav-meta-font-size` | font-size of `.currentYear` children (year/month text in nav)     |

---

## Themes (28 families)

Generated via `scripts/generate-theme.ts` → `themes/<name>.ts`. Do **not** hand-edit generated files; re-run `npm run build`.

Each public theme is a family with a light and dark variant:

`noir`, `espresso`, `meadow`, `fjord`, `velvet`, `crimson`, `solar`, `nebula`, `neon`, `prism`, `slate`, `pearl`, `sandstone`, `bauhaus`, `monsoon`, `industrial`, `snow`, `eclipse`, `chalk`, `temporal`, `riso`, `cyber`, `split`, `aurora`, `graphite`, `dracula`, `mint`, `abyss`.

Families preserve the old palette coverage by pairing previous light/dark themes or creating complementary variants where no obvious pair existed. Range covers neutral (`noir`, `slate`, `pearl`), neon/cyber (`neon`, `cyber`, `abyss`), earth tones (`sandstone`, `meadow`), print-inspired (`riso`, `bauhaus`), and vivid editorial palettes (`velvet`, `nebula`, `crimson`).

---

## Appearances (7)

| Appearance | Character                                     | Key tokens                                                               |
| ---------- | --------------------------------------------- | ------------------------------------------------------------------------ |
| `compact`  | Dense, minimal padding, tight                 | radius 0.3em, spacing 0.35em, transition 0.15s, day-ratio 1/0.7          |
| `square`   | Sharp corners, tight, minimal shadows         | radius 0, spacing 0.5em, transition 0.12s                                |
| `soft`     | Subtle rounding, balanced, gentle shadows     | radius 0.75em, spacing 0.7em, transition 0.25s                           |
| `bubble`   | Rounded, spacious, prominent shadows          | radius 1.5em, spacing 0.7em, transition 0.28s, nav-min-height 4em        |
| `loft`     | Large, relaxed                                | radius 1em, spacing 1em, transition 0.35s, day-padding 1.8em             |
| `airy`     | light weights, generous spacing               | radius 0.4em, border 1px, spacing 1em, weights 300, no shadows           |
| `press`    | Newspaper serif, sharp corners, wide tracking | radius 0.05em, serif font, letter-spacing 0.18em, no shadows, border 1px |

---

## Layout & composition

### Container responsiveness

Source: `src/core/layout.module.css`.

- `container-type: inline-size` — calendar responds to its **own** width, not viewport.
- `max-width: 864px`, grid layout with 1px gap.
- `--cal-font-size: clamp(11px, 2.7cqw, 18px)` — text scales with container width.

### Grid systems

- Calendar shell: CSS grid with `grid-column: 1 / -1` defaults for each
  `[data-area]`; module `col` props opt individual areas into narrower grid
  slots.
- Days: fixed 7-column calendar grid, or `2.2em + 7 columns` when week numbers
  are enabled. Narrow `cal-days` containers tighten cell sizing via container
  queries.
- Months grid: 12 months render as 3 columns by default, 4 columns at
  `cal-months-grid >= 18em`.
- Years grid: column count depends on `yearsPerPage` and container width:
  narrow/default layouts use 2-4 columns; `cal-years-grid >= 18em` promotes to
  4-5 columns.
- Presets: count-aware grid (`data-count`) with compact 2-column fallback and
  wider single-row layouts when `cal-presets >= 40em`.
- Info / SelectedDates animated sections use `grid-template-rows: 0fr → 1fr`
  for collapse/reveal, not absolute height animation.

### Data attributes (root)

- `data-theme="light|dark|auto"` — active mode selector. CSS handles `auto` via `prefers-color-scheme` for the default palette; imported/custom families apply their resolved variant vars inline.
- `data-appearance="<name>"` — appearance selector.
- `data-readonly` — read-only mode marker.
- `data-area="days|selected-dates|time"` — functional region markers.
- `data-direction="up|down"` — popup anchor direction (set by `useLayoutEffect` in popup).

---

## Motion

### Transition durations (per appearance)

`compact 0.15s`, `square 0.12s`, `soft 0.25s`, `bubble 0.28s`, `loft 0.35s`, `airy 0.2s`, `press 0.18s`. Used by CSS transitions on opacity / transform / colors via `var(--cal-transition)`.

### Shared track / drum physics

Source: `src/hooks/use-track.ts`.

| Constant      | Value | Role                     |
| ------------- | ----- | ------------------------ |
| `FRICTION`    | 0.95  | velocity decay (inertia) |
| `SPRING_K`    | 0.08  | snap stiffness           |
| `SPRING_DAMP` | 0.82  | underdamped bounce       |
| `RUBBER_K`    | 0.12  | boundary resistance      |
| `RUBBER_DAMP` | 0.75  | rubber-band damping      |

`useTrack` is the shared motion layer for horizontal track modules and vertical
drums. It exposes a continuous `position` float, pointer/wheel handlers,
inertia, snapping, and interaction state. Consumers choose the axis:
`axis: "x"` for rails, `axis: "y"` for drums.

Supported modes:
- circular lists (`count` + `circular`) for months and time values;
- bounded lists (`minIndex` / `maxIndex`) for constrained month/year ranges;
- unbounded vertical wheels for years when no bounds are set.

Snap threshold is ~3.5px/frame; settle tolerance is 0.4px. Pointer events drive
position updates, wheel input feeds the same physics path, and dragging disables
item transitions while the user is actively moving the control.

### Drum visual model

Source: `src/components/step-drum/step-drum.tsx`,
`src/modules/nav/month-year-track.tsx`.

Time drums and Nav month/year drums are separate components, but share the same
visual vocabulary:

| CSS variable | Role |
|---|---|
| `--drum-item-active` | mixes active text color into the centered item |
| `--drum-item-opacity` | fades items by distance from center |
| `--drum-item-scale` | subtly enlarges the active row |
| `--drum-item-shift` | fractional wheel offset for continuous roll motion |
| `--drum-item-y` | local vertical lift by signed distance |
| `--drum-item-z` | depth cue with perspective |
| `--drum-item-tilt` | `rotateX()` cue for iOS-style wheel curvature |

The active highlight stays fixed in the center; item transforms create the
feeling of a round, continuous drum moving behind it.

### View Transitions

`<Calendar motion="view-transition" />` opts into browser View Transitions for
calendar navigation and popup open/close. The default is `motion="none"` so the
library does not affect host app page transitions unless requested. Browsers
without `document.startViewTransition` run the same state update directly.

### Reduced motion

Global reduced motion is enforced through the shared transition tokens:
`--cal-transition`, `--cal-paint-transition`, press durations, and press scale
collapse inside `@media (prefers-reduced-motion: reduce)`. Keyframe-based
module animations (day/year slides, nav pulse/drums, chip reveal) have local
reduced-motion overrides.

Browser View Transitions are opt-in via `<Calendar motion="view-transition" />`
and are also disabled under `prefers-reduced-motion: reduce`.

---

## Interaction patterns

### Keyboard — day grid

ARIA grid pattern (https://www.w3.org/WAI/ARIA/apg/patterns/grid/). Source: `src/hooks/use-calendar-keyboard.ts`.

| Key                  | Action                           |
| -------------------- | -------------------------------- |
| Arrow Left / Right   | Move focus by one day            |
| Arrow Up / Down      | Move focus by one week           |
| Home / End           | First / last day of focused week |
| Page Up / Page Down  | Previous / next month            |
| Shift + Page Up/Down | Previous / next year             |
| Enter or Space       | Select focused day               |

Roving tabindex: focused day = `tabindex="0"`, others `-1`. Focus crosses month boundaries via `navigateTo` unless `blockNavigation` is set.

### Keyboard — time picker / tracks

| Key             | Action                       |
| --------------- | ---------------------------- |
| Arrow Up / Down | Decrement / increment by one |
| Home / End      | Jump to min / max value      |

Tracks (`<CalendarDaysTrack>`, `<CalendarMonthsTrack>`, `<CalendarYearsTrack>`):

| Key                | Action                    |
| ------------------ | ------------------------- |
| Arrow Left / Right | Step backwards / forwards |
| Page Up / Down     | Jump 7 items (DaysTrack)  |
| Home / End         | First / last allowed item |

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

### Time picker (`<CalendarTimeWheel>` and `<TimeTrack>` inside Nav popup)

Each drum (hour / minute / second) is `role="spinbutton"` with `aria-label`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext`. AM/PM buttons use `aria-pressed`. Under `readOnly` the spinbutton gets `aria-disabled="true"` and all keyboard / scroll / click handlers no-op.

### Tracks

Same `role="spinbutton"` pattern as time drums; values reflect highlighted item.

### Popups (`MonthPopup`, `YearPopup`, `TimePopup`)

`role="dialog"` + `aria-modal="true"` + `aria-label` ("Select month" / "Select year" / "Select time"). Focus trapped inside via `useFocusTrap`; `Escape` closes.

### Calendar root and `readOnly`

Root gets `data-readonly` when `readOnly` is set. Every interactive module
additionally renders its UI as `disabled` / `aria-disabled` so screen reader
announcements stay consistent. The root wrapper intentionally does not use
`aria-readonly` because plain `<div>` does not support it.

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

Covered by CSS `prefers-reduced-motion` guards. There is no explicit
`reducedMotion` prop yet; the current contract follows the OS preference.

### Testing

`a11y.test.tsx` runs `jest-axe` on representative module compositions (default Days, with selection, with min/max, range mode, `hideOutOfRange`, `currentMonthOnly`, TimeWheel). Any axe violation fails CI. New modules MUST land with their own axe test cases.

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

- `themes/themes.ts` — source variants plus 28 public theme families, 15 color tokens each
- `appearances/index.ts` — 6 appearances
- `src/core/layout.module.css` — typography, container query, color defaults
- `src/hooks/use-client-value.ts` — SSR-safe deferred values
- `src/hooks/use-calendar-keyboard.ts` — keyboard nav
- `src/hooks/use-focus-trap.ts` — focus trap
- `src/hooks/use-track.ts` — scroll physics
- `src/components/popup/popup.tsx` — popup positioning + focus trap
- `src/__tests__/integration/a11y.test.tsx` — axe gate
