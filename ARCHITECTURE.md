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

| Module | Navigational when | Interactive when |
|---|---|---|
| `<CalendarDaysTrack>` | range mode without `bound` | `mode="single"` (item click commits date); `mode="range"` with `bound` (item click sets that boundary); `mode="multiple"` via auto save/remove button |
| `<CalendarMonthsTrack>` | single / multiple / range without `bound` | `mode="range"` with `bound="from"\|"to"` (click sets that boundary's month) |
| `<CalendarYearsTrack>` | single / multiple / range without `bound` | `mode="range"` with `bound="from"\|"to"` (click sets that boundary's year) |

**Common contract:**
- In navigational state: only `navigateTo` — never fires consumer `onChange`.
- In interactive state: writes via `SelectionContext` (`onRangeBoundSet`, `onChangeDate`, etc.), respects `readOnly` / `disabled` / `minDate` / `maxDate`, and may fire consumer `onChange`.
- Tests must cover both states explicitly per module.

### Special case — `<CalendarPresets>`

Presets are interactive but operate at a different level than `<CalendarDays>`:

- **Days**: per-cell, single click → one selection delta.
- **Presets**: one click → entire range or whole `selectedDates[]` array applied.

Presets accept user-provided resolver functions (custom presets), so they sit at the **boundary between library and consumer code**. This is the highest-risk surface for hostile or malformed input. They get their own dedicated test file (`integration/presets.test.tsx`) covering adversarial inputs in addition to happy-path.

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
| `SelectionContext` | selectedDates, rangeStart, rangeEnd, hoverDate, openPopup | `onChangeDate`, `onRangeSet`, `onDatesSet`, `onChangeTime`, `setHoverDate`, `setOpenPopup` |
| `UIContext` | containerRef, containerWidth, popups visibility, daysTrackActive | toggleTheme, popup open/close setters |

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

Validators are invoked at:
- reducer initialization (initial seed);
- the `SYNC_EXTERNAL` effect (each controlled value change);
- a `useEffect` keyed on `[minDate, maxDate]`.

New validators belong in this module and follow the same dedupe-by-key convention. Tests reset the dedupe cache via `__resetWarnOnce()`.

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

---

## Reading order for new contributors

1. This file (`ARCHITECTURE.md`) — conceptual model.
2. `DOCUMENTATION.md` — prop reference per component.
3. `plans/testing-strategy.md` — what to test and why.
4. `plans/storybook-strategy.md` — how stories are organized.
5. `src/core/state.ts` — the reducer (single source of truth for selection logic).
6. `src/core/provider.tsx` — how state is wired to the four contexts.
