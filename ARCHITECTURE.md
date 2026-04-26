# Architecture

This document captures the conceptual model of `react-calendar-datetime`. It explains how the public surface is organized, what each part is responsible for, and how the parts compose. It is intended for contributors and for testers writing new test plans.

It is **not** a prop-by-prop API reference — see `DOCUMENTATION.md` for that.

---

## Two-layer composition

The library is built around a strict two-layer model:

```
┌─────────────────────────────────────────────────┐
│  <Calendar>                                     │   Layer 1 — invisible wrapper
│    state, contexts, theme, locale, timezone     │   No UI of its own
│                                                 │
│   ┌─────────┐  ┌──────────┐  ┌──────────────┐  │
│   │ <Days>  │  │ <Nav>    │  │ <TimeGrid>   │  │   Layer 2 — modules
│   └─────────┘  └──────────┘  └──────────────┘  │   Each is self-contained
│                                                 │
│   ┌────────────────┐  ┌──────────────────────┐ │
│   │ <SelectedDates>│  │ <ManualSelect>       │ │
│   └────────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Layer 1 — `<Calendar>` wrapper

`<Calendar>` is a **headless container**. By itself it renders effectively nothing visible — a positioning wrapper, theme/appearance attributes, and an inline-size container. It exists to hold:

- React contexts (config, navigation, selection, UI)
- Reducer state for selected dates / range / view date
- Locale, timezone, hour12, theme, appearance, gradient, readOnly
- onChange wiring back to the consumer

A `<Calendar>` with no children is a valid (but useless) component. **All visible behavior comes from modules placed as children.**

### Layer 2 — modules

A **module** is a self-contained React component that:

- Reads from the calendar contexts via hooks (no prop drilling).
- Optionally renders UI.
- Optionally writes back to the state via context actions.
- Is idempotent under remounting and reordering.

**Modules can be:**

- Placed individually inside `<Calendar>` (a single module, no others).
- Combined with any other modules in any order.
- Repeated — the same module can appear multiple times with different props (e.g. several `<CalendarDays offset={n} />` in a multi-month layout).

This is the central design promise: **any subset and any combination of modules must work**. The wrapper does not assume any particular module is present.

---

## Module classification

Modules fall into two functional categories. The split matters for both UX reasoning and test planning.

### A. Navigational modules

> **Definition:** Change the calendar's internal view date (which year/month/grid is displayed) but **do not commit a final selection** and **do not fire `onChange`**.

Their job is to let the user *navigate* through the calendar — to find the date they want to select. The actual select happens in an interactive module elsewhere on the page.

| Module | Role |
|---|---|
| `<CalendarMonthGrid>` | 12-cell grid of months for the current year |
| `<CalendarYearsGrid>` | Grid of years (page-paginated) |

`<CalendarNav>`, `<CalendarMonthsTrack>`, `<CalendarYearsTrack>`, and `<CalendarDaysTrack>` are navigational only in some configurations — see category **D. Hybrid modules** below.

**Common contract:**
- Reading: `viewDate` from navigation context.
- Writing: only `navigateTo(date)` — never `onChangeDate` / `onRangeSet`.
- Never fires the consumer's `onChange` callback.
- May open/close popups via the UI context.

### B. Interactive modules

> **Definition:** Commit a final selection. Call selection actions (`onChangeDate`, `onRangeSet`, `onDatesSet`, `onChangeTime`) which lead to a consumer-visible `onChange` event.

| Module | Role | Notes |
|---|---|---|
| `<CalendarDays>` | The day grid. Click → select day. | Most common interactive module. |
| `<CalendarTimeGrid>` | Hour/minute drums (and seconds). Change → updates time on selected date. | Interactive at finer granularity than days. |
| `<CalendarManualSelect>` | Masked text input(s) for typing dates directly. | Interactive via keyboard. |
| `<CalendarPresets>` | Preset shortcuts (Today, Last 7 days, This month). | Interactive — applies a whole range/date in one click. |

**Common contract:**
- Writing: at least one of `onChangeDate`, `onRangeSet`, `onDatesSet`, `onChangeTime`.
- Respects `readOnly` — must skip writes when `readOnly` is set.
- Respects `disabled`, `minDate`, `maxDate` — must reject selections that violate these constraints.
- Respects mode (`single` / `multiple` / `range`) and adapts internal flow accordingly.

### C. Display / feedback modules

> **Definition:** Render a representation of current selection or state. May trigger view navigation as a side effect of clicking on rendered items, but do not commit selection changes themselves.

| Module | Role |
|---|---|
| `<CalendarSelectedDates>` | Chips showing currently selected date(s). Click chip → `navigateTo`. May fire `onChange(null)` only via the explicit clear button. |

This is a **third category** that the user's two-bucket model didn't initially cover but exists in the codebase. Strictly speaking `<CalendarSelectedDates>` does nothing on its own — it's purely reactive UI plus an opt-in `Clear` action.

### D. Hybrid modules

> **Definition:** Behave as navigational or interactive depending on props and/or mode. The category is decided at render time, not at module identity.

| Module | Navigational when | Interactive / side-effecting when |
|---|---|---|
| `<CalendarNav>` | default — prev/next arrows, month/year labels, optional `showMonthPicker` / `showYearPicker` buttons (all view-only) | `clear` prop renders a button that calls `onChangeDate(null)`; `showTime` opens a time popup whose confirm calls `onChangeTime`; `themeToggle` mutates UI theme (no `onChange`) |
| `<CalendarDaysTrack>` | range mode without `bound` | `mode="single"` (item click commits date); `mode="range"` with `bound` (item click sets that boundary); `mode="multiple"` via auto save/remove button |
| `<CalendarMonthsTrack>` | single / multiple / range without `bound` | `mode="range"` with `bound="from"\|"to"` (click sets that boundary's month) |
| `<CalendarYearsTrack>` | single / multiple / range without `bound` | `mode="range"` with `bound="from"\|"to"` (click sets that boundary's year) |

**Common contract:**
- In navigational state: only `navigateTo` — never fires consumer `onChange`.
- In interactive state: writes via `SelectionContext` (`onRangeBoundSet`, `onChangeDate`, `onChangeTime`, …), respects `readOnly` / `disabled` / `minDate` / `maxDate`, and may fire consumer `onChange`.
- UI-only side effects (e.g. `<CalendarNav themeToggle>`, popup open/close) are independent of selection — they touch `UIContext` only and never fire `onChange`.
- Tests must cover each enabled prop explicitly per module: a Nav with `clear` is contractually different from a Nav without.

### Special case — `<CalendarPresets>`

Presets are interactive but operate at a different level than `<CalendarDays>`:

- **Days**: per-cell, single click → one selection delta.
- **Presets**: one click → entire range or whole `selectedDates[]` array applied.

Presets accept user-provided resolver functions (custom presets), so they sit at the **boundary between library and consumer code**. This is the highest-risk surface for hostile or malformed input. They get their own dedicated test file (`integration/presets.test.tsx`) covering adversarial inputs in addition to happy-path.

The resolver (`getResolvedPresets` in `preset-utils.ts`) wraps each entry in a defense layer:

1. Reject non-object entries (null, primitives) — warn, skip.
2. Reject entries missing `label` — warn, skip.
3. Detect duplicate `id` (including collisions with auto-derived ids) — first wins, warn, skip rest.
4. Wrap `getValue(ctx)` in `try/catch` — exception caught, warn, skip; component does not crash.
5. Validate the result is `Date` (not `NaN`), or `{ from, to }` with valid Dates, or `null`. Anything else — warn, skip.

All warnings go through `warnOnce` (dev-only, deduped per id+condition). In production every malformed entry is silently dropped. See `DOCUMENTATION.md → Defensive handling of bad input` for the consumer-facing matrix.

---

## Why the classification matters

**For users of the library:**
- A typical layout pairs at least one navigational module with one interactive module. (`<Nav>` + `<Days>`.)
- An interactive-only layout (`<Days>` alone) works but offers no way to navigate months from the UI — the consumer must drive `value` externally.
- A navigational-only layout (`<Nav>` + `<MonthGrid>`) is a date *viewer* — useful for showing context, never selecting.

**For testing:**
- Navigational modules: assert `viewDate` mutation, never `onChange` calls.
- Interactive modules: assert `onChange` payloads, respect `readOnly` / `disabled` / `min` / `max`.
- Display modules: assert rendered output matches state, no side effects beyond explicit user actions.
- Hybrid modules: cover both states. Without the activating prop/mode, behave as navigational (no `onChange`). With it, behave as interactive (writes selection, respects `readOnly` / `disabled` / `min` / `max`).

**For new modules:**
A new module proposal must declare which category it belongs to. Hybrid modules need explicit reasoning.

---

## State and context boundaries

The wrapper exposes four contexts to modules. Each has a clear responsibility:

| Context | Reads | Writes |
|---|---|---|
| `ConfigContext` | locale, timezone, mode, min/maxDate, disabled, hour12, minRangeDays, maxRangeDays, readOnly | (none — config is fixed per render) |
| `NavigationContext` | viewDate | `navigateTo(date)` |
| `SelectionContext` (split into `State`, `Actions`, `Hover` providers) | selectedDate, selectedDates, rangeStart, rangeEnd, hoverDate | `onChangeDate`, `onRangeSet`, `onDatesSet`, `onRangeBoundSet`, `onChangeTime`, `setHoverDate` |
| `UIContext` | containerRef, containerWidth, `showTimePopup` / `showMonthPopup` / `showYearPopup`, daysTrackActive, popupAnchorEl, navShowSeconds | `toggleTheme`, `setShowTimePopup` / `setShowMonthPopup` / `setShowYearPopup`, `setDaysTrackActive`, `setPopupAnchorEl`, `setNavShowSeconds` |

**Popup state ownership.** Popup open/close (`showTimePopup`, `showMonthPopup`, `showYearPopup`) is **pure UI state** and lives in a `useState` inside `CalendarProvider`, exposed via `UIContext`. It is intentionally **not** part of the reducer — popup transitions never need to be atomic with selection changes, and keeping the reducer focused on selection / view data avoids the "one giant store" anti-pattern. Only one popup can be open at a time.

**Rules:**
- Navigational modules touch only `NavigationContext` (writes) and `ConfigContext` (reads).
- Interactive modules write to `SelectionContext`. They may also `navigateTo` if selection implies a view change.
- Display modules read from `SelectionContext` and may `navigateTo`. They never write to `SelectionContext` except via explicit user action (Clear button).
- Hybrid modules follow navigational rules in their navigational state and interactive rules in their interactive state. Switching is determined by props/mode at render time.

---

## Controlled vs uncontrolled

`<Calendar>` supports both modes. The decision is made by `value`:

- **`value !== undefined`** — controlled. The reducer's selection state is synced from `value` on every change (via the `SYNC_EXTERNAL` action dispatched in an effect keyed on `serializeValue(value)`). `onChange` fires for every internal selection event.
- **`value === undefined`** — uncontrolled. Optional `defaultValue` seeds the reducer once at mount; subsequent changes to `defaultValue` are ignored. Internal state is the source of truth. `onChange` still fires.

The two modes are mutually exclusive at any moment: passing both `value` and `defaultValue` makes `value` win, and `defaultValue` is ignored.

The wrapper does not migrate selection across `mode` changes. Each mode reads its own shape from internal state (`single` → `selectedDates[0]`; `multiple` → `selectedDates`; `range` → `{ rangeStart, rangeEnd }`). Consumers needing a clean transition must pass a compatible `value` together with the new `mode`.

---

## Dev warnings

`src/core/dev-warn.ts` provides `warnOnce(key, message)` — a deduped `console.warn` that is a no-op when `process.env.NODE_ENV === "production"`. The same module exports two domain validators used by the provider:

- `validateCalendarValue(value, mode, source)` — flags shape mismatches (e.g. `Date` in `range` mode) and `NaN` dates.
- `validateMinMax(minDate, maxDate)` — flags inverted bounds.
- `validateTimeZone(tz)` — runtime check; warns and returns `false` for non-IANA / `Invalid Date` strings. Used for fallback decisions in production too.
- `validateTheme(theme)` — warns on string values outside `"auto" | "light" | "dark"`.
- `validateDateProp(value, propName)` — generic Date-instance sanitizer. Returns the value if it is a valid Date, `undefined` otherwise (with a dev warn). Used for `defaultViewDate`; reusable for any future Date prop where silent acceptance of garbage would crash render.

`createDisabled` and the presets resolver consume the same `warnOnce` channel for defensive validation of user-supplied data. Both never throw; bad entries are silently dropped after warning, and the rest of the structure is preserved. New consumer-facing builders MUST follow this convention.

Validators are invoked at:
- reducer initialization (initial seed);
- the `SYNC_EXTERNAL` effect (each controlled value change);
- a `useEffect` keyed on `[minDate, maxDate]`.

New validators belong in this module and follow the same dedupe-by-key convention. Tests reset the dedupe cache via `__resetWarnOnce()`.

---

## Performance model

The library is built to support repeated and combined modules — multi-month pickers (`<CalendarDays offset={0..11} />`), Track + Days mirroring, etc. Performance must hold under those compositions, not just the canonical single-grid case.

### What is already optimized

| Optimization                                                        | Lives in                                          |
| ------------------------------------------------------------------- | ------------------------------------------------- |
| `SelectionContext` split into `State` / `Actions` / `Hover`         | `src/context/selection-context.tsx`               |
| `DayCell` wrapped in `React.memo`                                   | `src/modules/days/index.tsx`                      |
| `AnimatedTime` wrapped in `memo`                                    | `src/modules/nav/index.tsx`                       |
| Live clock state local to Nav (`nowTime` in `useState`)             | `src/modules/nav/index.tsx`                       |
| Per-render derived data in `useMemo`: `weeksData`, `gridLabel`, `cellFmt`, `today`, `selectionState`, `config`, ... | Days, Nav, Provider |
| Reducer dispatch keyed via `notifySeq` so `onChange` only fires when commit actually happens | `src/core/state.ts`, `src/core/provider.tsx` |
| `useReducer` initializer + `validateCalendarValue` run once          | `src/core/provider.tsx`                           |
| Popup state outside the reducer (plain `useState`) so popup transitions don't bump selection consumers | `src/core/provider.tsx`             |

### Re-render boundaries (what triggers what)

- **`viewDate` change** (navigation) → Nav re-renders, all `<CalendarDays>` instances recompute their month grid, all Tracks recompute their highlight. Necessary.
- **`selectedDates` / `rangeStart` / `rangeEnd` change** → Days recomputes `weeksData`; cells whose state changed re-render (others are skipped by `DayCell.memo`).
- **`hoverDate` change** (range preview) → only `SelectionHoverContext` consumers re-render. `weeksData` does include `hoverDate` in its `useMemo` deps, so the highlighted month re-derives the preview range. Cells outside the changing preview band are skipped by `DayCell.memo`.
- **`showNowTime` tick** → only Nav re-renders (state lives there).
- **`readOnly` toggle** → entire tree re-renders once (config change). Acceptable.
- **Theme / appearance toggle** → root re-renders; modules read tokens from CSS variables, no JS re-derivation.

### Consumer responsibilities

The library cannot guarantee performance if the consumer hands it a fresh-reference object on every render. Recommend memoization for:

```tsx
const disabled = useMemo(() => createDisabled({ weekends: true }), []);
const presets = useMemo(() => [...basicPresets, { id: "x", label: "X", value: 0 }], []);
const customTheme = useMemo(() => createTheme({...}), []);

<Calendar disabled={disabled} presets={presets} theme={customTheme} />
```

Without these, every parent render makes new objects → `useMemo` deps inside Days / Provider invalidate → grid recomputes for every module instance. In a 12-month layout this multiplies cost by 12.

### Repeated modules

`<CalendarDays offset={n} />` instances share `viewDate`, `selectedDates`, `hoverDate`, all config. They diverge only by `offset` (which affects which month they display). The cost of N instances is roughly N × (single-instance cost) — there is no shared cache across them. For very wide multi-month grids (12+) consider:

- Aggressive memoization on the consumer side (above).
- Pre-flat `disabled` rule arrays — e.g. expand `before` / `after` once on the consumer rather than re-checking each cell.
- Avoid `showNowTime` with very frequent `seconds=true` ticking — animation runs once per second across the whole Nav subtree.

### Hover preview cost

In range mode, moving the mouse over the grid updates `hoverDate`, which causes `weeksData` to recompute the preview band. This is intrinsic to the feature. Mitigations already in place:
- `DayCell.memo` keeps cells whose preview-related props are unchanged from re-rendering.
- `SelectionContext` split prevents non-Days consumers (Nav, Tracks, Presets) from re-rendering on hover.

If hover preview is not needed for your UX, omit it by not setting `hoverDate` on cell mouseenter in your custom modules — hover is opt-in per module.

### Performance test coverage

`src/__tests__/integration/perf.test.tsx` mounts representative compositions and asserts:
- A `<DayCell>` outside the range preview band does not re-render when `hoverDate` moves around.
- `showNowTime` ticking does not re-render `<CalendarDays>`.

These are render-count tests using a render-counting wrapper, not wall-clock benchmarks. They guard against regressions in the boundary list above.

---

## Invalid input policy

The library is **defensive at every consumer-facing boundary**. The contract is uniform:

1. **Never throw.** Bad input is silently dropped, replaced with a safe default, or clamped to a valid range.
2. **Warn once in development.** `warnOnce(key, message)` from `src/core/dev-warn.ts` deduplicates per condition + identifier so the console isn't flooded.
3. **Silent in production.** `process.env.NODE_ENV === "production"` short-circuits the warning. The fallback behavior is identical to dev.

The complete catalog of validators:

| Validator                                         | Lives in                                | Catches                                                          |
| ------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------- |
| `validateCalendarValue(value, mode, source)`      | `core/dev-warn.ts`                      | `value` / `defaultValue` shape mismatch with `mode`; `NaN` Date   |
| `validateMinMax(minDate, maxDate)`                | `core/dev-warn.ts`                      | `minDate > maxDate`                                              |
| `validateTimeZone(tz)`                            | `core/dev-warn.ts`                      | empty string, non-IANA names, throwing `Intl` constructor        |
| `validateTheme(theme)`                            | `core/dev-warn.ts`                      | string outside `"auto" \| "light" \| "dark"`                     |
| `validateDateProp(value, propName)`               | `core/dev-warn.ts`                      | non-Date / Invalid Date for `defaultViewDate` (and any future Date prop) |
| `getResolvedPresets` defense layer                | `modules/presets/preset-utils.ts`       | non-object entries; missing `label`; duplicate `id`; throwing `getValue`; Invalid Date / range |
| `createDisabled` defense layer                    | `utils/create-disabled.ts`              | non-object init; invalid Dates in `before` / `after` / `dates` / `ranges`; non-array `dates` / `ranges` / `weekdays`; weekdays out of 0..6; `from > to` (swapped); throwing nothing |
| `<CalendarYearsGrid yearsPerPage>` clamp warning  | `modules/years-grid/index.tsx`          | non-integer / out of 1..40 range — silently clamped + warn        |
| Nav `showMonthPicker` + `compactMonths`           | `modules/nav/index.tsx`                 | both true → renders both UI variants + warn                       |
| Nav `showYearPicker` + `compactYears`             | `modules/nav/index.tsx`                 | both true → renders both UI variants + warn                       |

Validators are wired into:
- `useReducer` initializer (`provider.tsx`) — initial seed validation.
- `useEffect` on `[externalValue]` and `[minDate, maxDate]` and `[timeZone]` and `[themeProp]` — runtime re-validation.
- Builder functions (`createDisabled`, preset resolver) — every call site.

When you add a new prop that accepts user data, add a validator next to the existing ones in `dev-warn.ts` and wire it via the same `warnOnce` channel. Tests live in `src/__tests__/integration/dev-warn.test.tsx` and follow a consistent pattern (mock `console.warn`, render, assert spy and message).

Tests reset the dedupe cache via `__resetWarnOnce()` between cases.

---

## SSR / hydration

`react-calendar-datetime` is **SSR-safe**. Server-rendered HTML matches the first client render, no hydration warnings, works in Next.js (App Router and Pages), Remix, TanStack Start, and Astro server islands. The pattern below is enforced everywhere a value depends on the browser environment.

### The rule

Any value that comes from a browser-only API — `new Date()`, `Intl.DateTimeFormat().resolvedOptions()`, `window.matchMedia(...)`, `navigator.*` — is not consumed during the initial render. It is filled in after mount via `useEffect`.

### The hook

`src/hooks/use-client-value.ts` codifies the pattern:

```ts
function useClientValue<T>(getter: () => T, fallback: T): T {
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => { setValue(getter()); }, []);
  return value;
}
```

Used by:

- `Calendar` — `systemTheme` (`prefers-color-scheme` lookup) defaults to `"light"` until mount.
- `CalendarNav` — `today` (used for "Go to current month" button) starts `null`; "live time" string (`showNowTime`) starts empty.
- `CalendarDays` — `today` (used for `highlightToday` and keyboard initial focus) starts as a NaN-Date so `isSameDay` fails universally; gets the real value post-mount.
- `CalendarProvider` — `resolvedTimeZone` from `Intl.DateTimeFormat().resolvedOptions().timeZone` (see "Timezone resolution").

### Specifically handled cases

| Source                                  | Risk                                                                | Mitigation                                                       |
| --------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `prefers-color-scheme`                  | server defaults to "light", client may be "dark" → wrong `data-theme` on hydrate | `useClientValue` + `matchMedia` change subscription               |
| `Intl.DateTimeFormat().resolvedOptions().timeZone` | server's TZ ≠ client's TZ → wrong "today" cell, wrong chip text | Auto-resolved via effect (see "Timezone resolution")             |
| `new Date()` for "today"                | server clock ≠ client clock around midnight                         | `useClientValue(() => new Date(), null|NaN-Date)`                |
| Live clock (`showNowTime`)              | every second tick depends on client time                            | Initial state is empty string; `setInterval` starts post-mount   |
| `window.matchMedia` change events       | server has no API                                                   | Subscription only inside `useEffect`                             |
| Reducer `useReducer` initializer        | runs on both server and client; `new Date()` fallback for view date | Acceptable for typical sub-second SSR turnaround. Pass `defaultViewDate` for strict cases. |

### Test coverage

- `src/__tests__/integration/ssr.test.tsx` — runs `renderToString` on representative compositions, asserts the markup is valid (correct ARIA roles, no `NaN` / `undefined` text leaking into the DOM).
- `src/__tests__/integration/hydration.test.tsx` — runs the SSR HTML through `hydrateRoot` and asserts no React hydration warnings (`console.error` content scanned for "did not match" / "Hydration"). Covers Calendar + Days, Nav with `showNowTime`, `theme="auto"`, `timeZone="auto"`, and TimeGrid.

### Known SSR caveats

- The `Calendar` initial seed for `viewDate` falls back to `new Date()` when neither `value`, `defaultValue`, nor `defaultViewDate` is provided. In sub-second SSR-to-hydrate flows this is identical between server and client; near a midnight boundary it can briefly show a different month on first paint. **Mitigation:** pass `defaultViewDate` for strict deterministic SSR.
- Animations (drum flip, month slide) start on mount; SSR HTML contains the static "settled" frame.
- `prefers-reduced-motion` is not yet honored (see Accessibility → Known limitations).

---

## Accessibility

`react-calendar-datetime` is built **inclusive-first**. The library is meant to be usable by people who navigate with keyboards, screen readers, switch devices, voice control, and people who simply prefer larger touch targets or reduced motion. The contract below is enforceable — every public module ships with the ARIA attributes, keyboard handlers, and structural roles required to be operable by assistive technology out of the box. Tests in `src/__tests__/integration/a11y.test.tsx` use [`jest-axe`](https://github.com/nickcolley/jest-axe) to gate the contract on CI.

### Day grid (`<CalendarDays>`)

ARIA grid pattern (https://www.w3.org/WAI/ARIA/apg/patterns/grid/):

| Element                                     | Role          | ARIA / DOM                                                                                |
| ------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------- |
| Outer grid container                        | `grid`        | `aria-label` = localized month + year (e.g. "June 2024")                                  |
| Weekday header row                          | `row`         | —                                                                                         |
| Each weekday header                         | `columnheader`| `aria-label` = full weekday name; visible text may be the abbreviation                    |
| Week row                                    | `row`         | `aria-label="Week N"` (ISO week number)                                                   |
| Week number cell (when `weekNumbers`)       | `rowheader`   | `aria-label="Week N"`                                                                     |
| Day cell                                    | `gridcell`    | `aria-selected` for selected; `aria-disabled` for disabled or `readOnly`                  |
| Day button (inside cell)                    | (button)      | `aria-label` = full localized date + state suffix ("today", "selected", "disabled", …)    |
| Today's button                              | (button)      | `aria-current="date"`                                                                     |
| Hidden out-of-range cell (`hideOutOfRange`) | `presentation`| Not exposed to AT; preserves grid layout only                                              |
| Empty week row (all cells hidden)           | `presentation`| Whole row dropped from AT                                                                  |

Keyboard map (focused day button, see `use-calendar-keyboard.ts`):

| Key                  | Action                                |
| -------------------- | ------------------------------------- |
| Arrow Left / Right   | Move focus by one day                 |
| Arrow Up / Down      | Move focus by one week                |
| Home / End           | First / last day of the focused week  |
| Page Up / Page Down  | Previous / next month                 |
| Shift + Page Up/Down | Previous / next year                  |
| Enter or Space       | Select the focused day                |

Roving tabindex: only the focused day has `tabindex="0"`; all others are `tabindex="-1"`. Focus follows the user across months — `moveFocus` calls `navigateTo` when crossing month boundaries (unless `blockNavigation` is set).

### Time picker (`<CalendarTimeGrid>` and `<TimeTrack>` inside the Nav popup)

Each drum (hour / minute / second) is a `role="spinbutton"` with `aria-label`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-valuetext`. AM/PM buttons use `aria-pressed`. Under `readOnly` the spinbutton gets `aria-disabled="true"` and all keyboard / scroll / click handlers no-op.

Keyboard map:

| Key                | Action                              |
| ------------------ | ----------------------------------- |
| Arrow Up / Down    | Decrement / increment by one        |
| Home / End         | Jump to min / max value             |

### Tracks (`<CalendarDaysTrack>`, `<CalendarMonthsTrack>`, `<CalendarYearsTrack>`)

Same `role="spinbutton"` pattern as the time drums, with values reflecting the highlighted item.

| Key                | Action                              |
| ------------------ | ----------------------------------- |
| Arrow Left / Right | Step backwards / forwards by one    |
| Page Up / Down     | Jump 7 items at a time (DaysTrack)  |
| Home / End         | Jump to first / last allowed item   |

### Popups (`MonthPopup`, `YearPopup`, `TimePopup`)

`role="dialog"` + `aria-modal="true"` + `aria-label` ("Select month" / "Select year" / "Select time"). Focus is trapped inside while open (`useFocusTrap`) and `Escape` closes the popup.

### Calendar root and `readOnly`

The root wrapper element gets `data-readonly` and `aria-readonly="true"` when the `readOnly` prop is set. Every interactive module additionally renders its UI as `disabled` / `aria-disabled` so screen reader announcements stay consistent. See "`readOnly` contract" for the full disable matrix.

### Live region for selection changes

`CalendarLayout` mounts a single off-screen `<div role="status" aria-live="polite" aria-atomic="true">` that announces the most recently committed date in the configured locale. This makes range/selection updates audible without forcing the screen reader user to re-read the entire grid.

### Selected dates / chips (`<CalendarSelectedDates>`)

Chips are real `<button>`s with localized text content; clicking navigates the view (`navigateTo`). The clear-all button has `aria-label="Clear"` and is disabled under `readOnly`.

### Manual input (`<CalendarManualSelect>`)

The masked input is a regular `<input type="text" inputMode="numeric">` — it inherits the platform's IME / a11y behavior. Under `readOnly` the HTML `readOnly` attribute is applied. Apply / clear buttons use `aria-label`. Invalid input flips a red wrapper class (visual only); the rejected commit policy is documented in the `<CalendarManualSelect>` "When `onChange` fires" table.

### Reduced motion

Not yet implemented as an explicit guard. Animations (drum flip in `AnimatedTime`, month slide on navigation, chip fade-in/out) currently run regardless of user preference. **TODO:** honor `prefers-reduced-motion: reduce` — wrap animation classes behind a media query, or expose a `reducedMotion` prop / context flag. Tracked in `DOCUMENTATION.md → Accessibility → Known limitations`.

### Testing

`src/__tests__/integration/a11y.test.tsx` runs `jest-axe` on representative module compositions (default Days, with selection, with min/max, in range mode, with `hideOutOfRange`, with `currentMonthOnly`, on TimeGrid). Any axe violation fails CI. New modules MUST land with their own axe test cases.

Manual SR coverage: NVDA (Windows), VoiceOver (macOS / iOS), and TalkBack (Android) are the supported targets. Bug reports against other AT are welcome but not gating.

---

## Hidden day cells (a11y)

`<CalendarDays hideOutOfRange>` and `<CalendarDays currentMonthOnly>` replace skipped cells with `<div role="presentation" />` placeholders. These placeholders preserve the grid layout (so `fixedRows` and column alignment still work) but are removed from the accessibility tree — screen readers see only real `gridcell`s.

Disabled-but-visible cells follow the standard ARIA grid pattern: `role="gridcell"` + `aria-disabled="true"` on the cell, an `aria-label` describing why (e.g. "16 June 2024, disabled"). They remain reachable by keyboard so users do not silently lose positions.

The decision tree for any out-of-range date:

1. Default — render as gridcell with `aria-disabled="true"`.
2. `hideOutOfRange` enabled — render as `role="presentation"` placeholder. AT skips it.
3. Whole row of placeholders — outer row also becomes `role="presentation"`.

Keyboard navigation does not currently skip over hidden positions (computed by date math, not visibility). When `hideOutOfRange` is desired together with full keyboard traversal, consumers should add `blockNavigation` to constrain arrows to the visible month. This is documented in `DOCUMENTATION.md` and exercised by `a11y.test.tsx`.

---

## View date ownership

`viewDate` is owned by `NavigationContext` and seeded once by `buildInitialState`. Modules **read** `viewDate` and may call `navigateTo(date)` — they never seed it.

Initial seed precedence:
1. If `value` / `defaultValue` carries a date, the first selected date is used as `viewDate`.
2. Otherwise `defaultViewDate` (a `<Calendar>` prop) is used.
3. Otherwise `new Date()` (today).

`<CalendarDays>` does not own a "default month" prop. Repeating multiple `<CalendarDays>` (e.g. in a multi-month layout) all read the same shared `viewDate` plus their own `offset`. There is no race because there is no per-module seed.

---

## Timezone resolution

The library is timezone-aware. The `timeZone` prop has three forms:

- **omitted** — same as `"auto"`. The default.
- **`"auto"`** — detect via `Intl.DateTimeFormat().resolvedOptions().timeZone` after mount.
- **explicit IANA / `"UTC±N"`** — used as-is after validation. `"UTC+N"` / `"UTC-N"` are normalized to the corresponding `Etc/GMT∓N`.

`CalendarProvider` keeps a `resolvedTimeZone` `useState` that is fed into `ConfigContext`. The pattern:

1. **Initial render.** If `timeZone` is omitted or `"auto"`, `resolvedTimeZone` is `undefined`. This is identical on server and client, so SSR hydration matches.
2. **`useEffect` after mount.** Detects via `Intl` and updates `resolvedTimeZone`. Calendar UI re-renders with the user's zone.
3. **Explicit value.** Validated synchronously via `validateTimeZone` (in `dev-warn.ts`). Valid → used directly. Invalid → falls back to auto-detect, emits a dev warning.

This design avoids the common SSR pitfall (server's `new Date()` differs from client's) without making consumers think about it. The brief gap before `useEffect` runs renders with no explicit zone (default JS Date semantics), which is acceptable for any UI not hovering near midnight in a far-away zone — the first paint shows local-ish data, then snaps to the resolved zone.

Timezone-dependent operations live in `src/utils/tz-utils.ts` (`getTodayInTimezone`, `toTZMidnight`). Modules read `timeZone` from `ConfigContext` and call into these utilities — no module reaches for `Intl` or `new Date()` directly when computing dates that participate in selection.

---

## Time editing semantics

Time interactions (`CalendarTimeGrid` drums, `CalendarNav.showTime` popup confirm) are unified through one reducer action: `CHANGE_TIME { date, config }`. The action is dispatched by `provider.handleChangeTime`, which always passes the current `selectConfig`.

The reducer's contract:

1. `viewDate` is always updated to `date` — `viewDate` is the source of truth for "current working time" and feeds `CalendarDays.handleSetDay` so a subsequent date click inherits it.
2. Selection is mutated **only** when there is a meaningful match between `viewDate.day` and an existing selected slot.
   - `range` mode: matches against `rangeStart` then `rangeEnd`; updates whichever matches.
   - `multiple` mode: matches against an entry in `selectedDates`; updates only that entry, never replaces the array.
   - `single` mode: matches the only `selectedDate`; updates it. **Special case:** if `selectedDates` is empty, single mode auto-creates `[date]` to keep time-only picker compositions (`<CalendarNav showTime />` + `<CalendarTimeGrid />` without `<CalendarDays />`) functional.
3. `notifySeq` (the trigger for the consumer's `onChange`) is incremented **only when selection actually changed**. Pure `viewDate` time updates ("pending time") do not fire `onChange`.

This rule set replaces the earlier behavior where `notifySeq` always incremented (firing spurious `onChange(null)` when no selection existed) and where a non-matching `viewDate` would overwrite the entire selection. Both were latent bugs surfaced while documenting the time contract.

The `multiple` and `range` modes intentionally do **not** auto-create on time change. Without an explicit user action choosing a date or boundary, the library cannot pick where the time should live, and silently inventing a selection would be surprising. Single mode is the only ambiguity-free case.

---

## `readOnly` contract

`readOnly` is the master flag for blocking all selection changes from the user. The contract is enforced on two layers:

**Layer 1 — reducer (data).** The provider guards every selection-writing action (`onChangeDate`, `onChangeTime`, `onDatesSet`, `onRangeSet`, `onRangeBoundSet`) with `if (readOnly) return;`. This is the hard guarantee: even custom modules cannot mutate selection state under `readOnly`.

**Layer 2 — UI (visual).** Every interactive module reads `readOnly` from `ConfigContext` and:
- disables clear / save / preset / commit buttons via the HTML `disabled` attribute;
- marks selectable cells/drums with `aria-disabled="true"` and short-circuits their click/keyboard handlers;
- sets `readOnly` on `<input>` elements in `CalendarManualSelect`.

**Always allowed under `readOnly`:**
- view navigation (`navigateTo`, all Tracks scrolling, `CalendarNav` arrows, month/year popups);
- hover preview (`setHoverDate`);
- popup open/close (`UIContext`);
- theme toggle.

When adding a new module that writes selection, it MUST read `readOnly` and gate its UI accordingly. The reducer guard is a safety net, not a substitute.

---

## Themes and appearances

Themes and appearances are independent dimensions of styling.

- **Theme** = palette (colors). Applied via `data-theme` attribute and CSS custom properties on the wrapper element. Three string values are accepted (`"auto"`, `"light"`, `"dark"`); everything else must be a `CustomTheme` object — either an exported named theme (e.g. `midnight`, `scarlet`) imported from `react-calendar-datetime/themes/<name>`, or a user-built one from `createTheme()`. Named theme **names are module export names, not accepted string values** — passing the string `"midnight"` is invalid and emits a dev warning.
- **Appearance** = structure (radii, sizing, density, border styles). Applied via `data-appearance` attribute. Custom appearances via `createAppearance()`.

A library consumer can mix any theme with any appearance freely. This combinatorial space is the primary target for visual regression testing (Chromatic).

CSS layering enforces that user styles override library defaults predictably:

```
@layer cal-base, cal-components, cal-modules, themes, appearances, user;
```

User styles win over `themes` and `appearances`, which win over the base layers.

---

## Subpath imports

The package ships individual modules and themes as separate entry points:

```ts
import { Calendar } from "react-calendar-datetime";
import { CalendarDays } from "react-calendar-datetime/modules/days";
import { midnight } from "react-calendar-datetime/themes/midnight";
import { compact } from "react-calendar-datetime/appearances/compact";
```

Tree-shaking eliminates unused modules from the consumer bundle. **All modules and themes/appearances must remain individually importable.** The build verifies this via `publint` and `arethetypeswrong`.

### Data packs (e.g. `basicPresets`)

Static data packs live at the root barrel (`react-calendar-datetime`) — there is no parallel `/presets/<pack>` namespace. Two reasons:

- The component (`CalendarPresets`) is a UI module; the pack is a data array. Different categories.
- Adding one subpath per pack would proliferate as packs grow.

Tree-shaking stays correct because pack files are pure (no top-level side effects) and `package.json` has `sideEffects: ["**/*.css"]`. A consumer who imports `Calendar` from the root barrel and never references `basicPresets` does not pull the pack into their bundle. New data packs added in the future MUST follow the same discipline: side-effect-free module body, no top-level execution.

---

## Reading order for new contributors

1. This file (`ARCHITECTURE.md`) — conceptual model.
2. `DOCUMENTATION.md` — prop reference per component.
3. `plans/testing-strategy.md` — what to test and why.
4. `plans/storybook-strategy.md` — how stories are organized.
5. `src/core/state.ts` — the reducer (single source of truth for selection logic).
6. `src/core/provider.tsx` — how state is wired to the four contexts.
