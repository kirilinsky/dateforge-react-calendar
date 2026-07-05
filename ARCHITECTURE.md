# Architecture

This document is the conceptual map of `@dateforge/react-calendar` v3 — how the
library is layered, where each responsibility lives, and the contracts between
layers. It is written for contributors: people changing the core, porting or
writing modules, adding themes, or extending the test suite.

The **source of truth is the code**. Every claim here is anchored to a file
under `src/`; when the doc and the code disagree, the code wins and this doc
has a bug. It is not a prop-by-prop API reference.

---

## 1. Layering

v3 is built as four strict layers. Dependencies point downward only; the core
never imports from the layers above it.

```
┌────────────────────────────────────────────────────────────────────┐
│  styles/          CSS layer cascade, theme/appearance tokens,   │
│                      generated palettes (consumed by all UI)       │
├────────────────────────────────────────────────────────────────────┤
│  modules/         Visual modules: Days, Toolbar, Grids, Tracks, │
│                      Wheels, Presets, Info, ManualInput, Lunar …   │
│                      read via selectors, write via actions         │
├────────────────────────────────────────────────────────────────────┤
│  react/           React adapter: store + provider, effect       │
│                      interpreter, <Calendar> shell, popup, focus   │
│                      manager, announcer, labels, UI primitives     │
├────────────────────────────────────────────────────────────────────┤
│  core/            Pure core: calendar structs, reducer,         │
│                      strategies, engines, validation, effects.     │
│                      NO React. NO DOM. NO JS Date (one exception). │
└────────────────────────────────────────────────────────────────────┘
```

Three rules make the layering real, not aspirational:

1. **The core is pure.** `src/core/` contains no React import, no DOM
   access, no user callbacks, and no `console` calls on the state path. The
   one sanctioned exception to "no JS `Date`" is the timezone boundary
   (§3.2). Everything in the core is a plain function over plain data:
   `(state, action, config) -> { state, effects }`.
2. **Effects are data.** The reducer never performs a side effect; it
   *describes* effects and the React adapter interprets them (§3.7). This is
   what makes controlled/uncontrolled behavior, focus, and announcements
   inspectable and unit-testable.
3. **Invariants live in strategies.** Everything that can mutate the
   selection is routed through one selection strategy per `unit × mode`
   combination (§3.8), so rules like "disabled never commits" exist in
   exactly one place instead of being re-checked in every visual module.

The architectural rationale — why a selector store instead of v2's five
contexts, why strategies instead of reducer mode branches, why explicit
effects — is recorded in `.notes/rfc-v3.md` and `.notes/plans/v3.md`.

---

## 2. Repository map

```
src/
  core/              pure core (this is the library's brain)
    calendar-date.ts        CalendarDate struct + proleptic-Gregorian math
    calendar-time.ts        CalendarTime struct, clamping, window checks
    calendar-date-time.ts   CalendarDateTime = date + time
    calendar-range.ts       CalendarRange, mergeRanges, week math
    timezone-boundary.ts    THE one place JS Date is allowed (DST policies)
    state.ts                CalendarState / CalendarConfig / SelectionState
    actions.ts              CalendarAction union (flat, serializable)
    reducer.ts              reduce(state, action, config) -> ReduceResult
    effects.ts              CalendarEffect union + ReduceResult helpers
    strategy.ts             SelectionStrategy interface
    strategies/             single / multiple / range / single-span / multi-span
    validation.ts           ValidationResult, reasons, scopes, field errors
    date-rule-engine.ts     compiled disabled/exclude rules (cheapest-first)
    segment.ts              span → business-day segments (exclude cuts)
    preset-engine.ts        named shortcuts -> candidate values
    public-value.ts         Date-based public value, valueKey, round-trip
    day-flags.ts            per-cell bitmask + DayLookup + preview segments
    day-keyboard.ts         pure key -> move/select mapping
    month-grid.ts           pure 6x7 day matrix builder
    view-navigation.ts      min/max gating for prev/next/pickers
    bound.ts                read a span bound for display
    labels.ts               label registry (aria strings, interpolation)
    warnings.ts             dev warning registry (never-throw policy)
  react/             React adapter + shell
    store.ts                framework-agnostic store around the reducer
    provider.tsx            CalendarProvider: store creation, effect sink,
                            controlled sync, useCalendarActions
    use-store-selector.ts   selector-based subscription hook
    calendar.tsx            <Calendar> root shell (grid, theme, scheme)
    context.ts              the public /context surface for custom modules
    ui-context.tsx          popup state (kept OUT of the reducer)
    CalendarPopup.tsx       portalled anchored dialog (focus handling inside)
    focus-manager.ts        first-focus resolution (initialFocus)
    announcer.tsx           aria-live region for committed selections
    labels-context.tsx      label resolver provider
    theme-scope.tsx         theme/scheme/appearance context for portals
    day-attrs.ts            dayFlags bitmask -> data-* attributes
    picker-draft.tsx        staging context for confirm-gated popup pickers
    ui/                     UIButton / UITile internal primitives
    prebuilt.tsx            SimpleCalendar / DatePicker / MonthPicker /
                            MultiMonthCalendar
    config.ts               createCalendarConfig (options -> compiled config)
    VirtualTrack.tsx        shared physics-track shell (tracks)
  modules/           visual modules, one folder = one subpath bundle
    days/ toolbar/ months-grid/ years-grid/ presets/ selected-dates/ info/
    manual-input/ days-track/ months-track/ years-track/ time/ months-wheel/
    years-wheel/ lunar/  (+ _lab/ story helpers)
  styles/            cascade + tokens + generated palettes
    layers.css tokens.css themes.css appearances.css
    theme-tokens.ts theme-source.ts appearance-tokens.ts themes.ts appearances.ts
  hooks/                shared React hooks (track physics, SSR values, roving)
  __tests__/            unit (v3/core, v3/react), fixtures, fuzz, bench
scripts/                generate-theme.ts, generate-appearance.ts,
                        check-css-important.mjs
```

---

## 3. The pure core (`src/core/`)

### 3.1 Calendar primitives

The core does not use JS `Date`. Its vocabulary is four plain structs:

- `CalendarDate` — `{ year, month (1-12), day }`. A wall-calendar coordinate
  ("the 5th of June 2026"), independent of any clock or zone. Proleptic
  Gregorian; non-Gregorian systems are explicitly out of scope
  (`calendar-date.ts`).
- `CalendarTime` — wall-clock time of day (`hour/minute/second/ms`), with
  `clampTime` and `timeWindowSide` helpers for the `[minTime, maxTime]`
  window.
- `CalendarDateTime` — `{ date, time }`.
- `CalendarRange` — `{ start, end }` of `CalendarDate`s, plus `mergeRanges`
  (sort + merge overlapping/adjacent), `rangesContain` (binary search),
  `weekRange`, `orderRange`.

Being plain data, all of these are trivially serializable, comparable by
value, and free of timezone ambiguity — a `CalendarDate` cannot drift across
midnight the way a `Date` can.

### 3.2 The timezone boundary

`timezone-boundary.ts` is **the one module where JS `Date` is allowed**.
Every conversion between an instant (`Date`) and a wall-clock struct goes
through it; no other file hand-rolls timezone math.

- `today(timeZone?)` — current `CalendarDate` in a zone.
- `toCalendarDateTime(date, timeZone?)` — instant → wall clock.
- `fromCalendarDateTime(dt, timeZone?, options?)` — wall clock → instant,
  with **explicit DST policies**:
  - nonexistent times (spring-forward gap): `"next-valid"` (default),
    `"previous-valid"`, or `"reject"`;
  - ambiguous times (fall-back fold): `"earlier"` (default) or `"later"`.
  The result reports `kind` (`"exact" | "ambiguous"`) and whether the wall
  clock was `adjusted` — nothing is silently coerced without a trace.
- `normalizeTimeZone` — accepts the human `"UTC±N"` shorthand by mapping it
  to the IANA `Etc/GMT∓N` zone (note the deliberate POSIX sign flip).

Implementation notes: zero runtime deps — `Intl.DateTimeFormat` does the
heavy lifting, formatters are cached per zone, and the reverse conversion
searches candidate offsets around the target instant to detect gaps/folds.
An unknown zone degrades to the system zone with a dev warning (the
"malformed input never throws" contract, §3.16).

### 3.3 Config

`CalendarConfig` (`state.ts`) is **static, compiled config** — built once and
passed *alongside* state into the reducer, never stored in state. It carries
the selection axes (`unit`, `mode`), locale/week data (`locale`,
`firstDayOfWeek`, `weekendDays`), bounds (`min`/`max`, `minSpan`/`maxSpan`,
`maxDates`/`maxRanges`), time config (`withTime`, `defaultTime`,
`minTime`/`maxTime`, `hour12`, `ampmLabels`), behavior flags (`readOnly`,
`deselectOnReclick`, `excludedEndpointPolicy`) and two **compiled rule
engines**: `disabled` and `exclude` (§3.11).

Consumers build it with `createCalendarConfig(options)`
(`react/config.ts`): plain-`Date` bounds, plain rule objects, and locale
defaults (`firstDayOfWeek` derived from `Intl.Locale.getWeekInfo`, falling
back to Monday) are compiled into the struct once. An inverted `min > max`
window is kept as passed (nothing becomes selectable) but warns once in dev.

### 3.4 State

```ts
type CalendarState = {
  selection: SelectionState;     // point | span (see §4)
  view: { viewDate: CalendarDate };
  interaction: { hoverDate?: CalendarDate; focusDate?: CalendarDate };
  validation: ValidationState;   // persistent per-scope field errors
};
```

Selection storage collapses the `unit × mode` matrix into two shapes
(`selectionShape` in `state.ts`):

- **point** — discrete day picks: `{ shape: "point", dates: CalendarDateTime[] }`.
  Only `unit:"day"` with `single`/`multiple`.
- **span** — everything else: `{ shape: "span", ranges: CalendarRange[],
  draftAnchor?, fromTime?, toTime? }`. `draftAnchor` is the pending first
  click of a two-click range; `fromTime`/`toTime` are the time bounds of the
  active range when `withTime`.

The view anchor is a `CalendarDate`, never a date-time. Hover and roving
focus are ephemeral interaction state, separate from selection so hover never
invalidates selection subscribers.

Popup state is deliberately **not** here — it lives in the React adapter's
`UIContext` (§6.6): popups are view concerns, never serialized, never part of
`onChange`.

### 3.5 Actions

`CalendarAction` (`actions.ts`) is a flat, serializable discriminated union —
no hidden mode branches:

| Action | Meaning |
|---|---|
| `selectDay` | Pick a day; meaning depends on `unit × mode` (strategy decides) |
| `setTime` | Edit time of the selection or a range bound (`bound?: "from"\|"to"`) |
| `setBoundDate` | Edit one bound's date (manual input, bound wheels) |
| `navigateTo` / `navigateBy` | Move / step the view anchor |
| `hover` / `focus` | Ephemeral preview / roving-focus target |
| `clear` | Clear the whole selection |
| `applyPreset` | Apply a resolved `PresetResult` through the strategy |
| `removeDate` / `removeRange` | Remove one point / one logical span |
| `syncExternal` | Replace selection from a controlled `value` change (no notify) |

### 3.6 Reducer

`reduce(state, action, config)` (`reducer.ts`) is the one pure transition
function. It handles `navigate*`, `hover`, `focus`, and `syncExternal`
directly; **every selection-mutating action is routed through the active
strategy** (`resolveStrategy(config)`), after a single `readOnly` gate that
rejects with a `validationRejected` effect.

Structural sharing is a contract, not an optimization detail: every handler
returns **the same state reference on a no-op** (hovering the same cell,
rejected clicks, equal navigation target), because state identity is the
store's change signal (§6.1).

### 3.7 Effects contract

A transition's side effects are returned as data (`effects.ts`):

```ts
type ReduceResult = { state: CalendarState; effects: readonly CalendarEffect[] };
```

| Effect | Meaning | Adapter interpretation |
|---|---|---|
| `notify` | Committed selection changed | calls `onChange(publicValue, details)` |
| `viewChanged` | View anchor moved | calls `onViewChange(viewDate)` |
| `focus` | Request focus on a day cell | DOM focus |
| `announce` | aria-live message (label key + params) | announcer resolves + speaks |
| `validationRejected` | Transient rejection (disabled click, cap…) | calls `onValidationReject(result)` |
| `warn` | Dev warning id + message | warning registry |
| `clearHover` | Drop the hover preview | dispatch/UI cleanup |

Two rules:

- **Effects are reports, not commands to re-dispatch.** `viewChanged` tells
  the adapter the view moved; answering it with another `navigateTo` would
  loop.
- **Effects always flow, even on a no-op.** A rejected action keeps state
  identity (subscribers stay quiet) but still emits `validationRejected` so
  the host observes the rejection.

Hot paths allocate nothing: `NO_EFFECTS` is one shared frozen array.

### 3.8 Selection strategies

`SelectionStrategy` (`strategy.ts`) is the behavior of one selection mode:
`selectDay`, `setTime`, `clear`, `applyPreset`, plus optional `setBoundDate`,
`removeDate`, `removeRange`. Strategies are pure — context in
(`{ state, config }`), `ReduceResult` out.

`strategies/index.ts` picks one from the configured `unit × mode`:

| Shape | Mode | Strategy | Behavior |
|---|---|---|---|
| point | `single` | `single` | one day; re-click deselects (`deselectOnReclick`, default on); time-only flow: `setTime` on an empty selection auto-creates on the view anchor |
| point | `multiple` | `multiple` | toggle days; sorted + deduped; `maxDates` cap rejects (never silently drops); toggle-off is always allowed even if the day became invalid |
| span | `single` (week/month unit) | `single-span` | one click commits the whole snapped unit span |
| span | `range` | `range` | two-click: first valid click arms `draftAnchor` (pending, **no notify**), second commits the outer hull of both unit-snapped endpoints; a third click clears (with notify) and re-arms |
| span | `multiple` / `multi-range` | `multi-span` | collects multiple spans (two-click in multi-range, one-click toggle for week/month multiple); committed ranges kept canonical via `mergeRanges`; `maxRanges` cap |

Shared helpers (`strategies/shared.ts`) implement the cross-mode rules:
`validateDay` (disabled → min → max), `validateTime` (window),
`validateSpanLength` (min/maxSpan measured **in units**, closed-form),
`validateRangeCrossing` (day-unit ranges may not step over a disabled day;
week/month units are atomic so an interior disabled day does not reject),
`unitSnap` (day → itself, week → whole week honoring `firstDayOfWeek`,
month → whole month), `commitPoint`/`commitSpan` (build the selection +
`notify`), and the exclusion commit checks (§3.12).

Presets commit **through the same strategy methods** as manual picks, so a
preset can never bypass an invariant.

### 3.9 Invariants — who enforces what

| Invariant | Enforced by | File |
|---|---|---|
| `readOnly` blocks every mutation | reducer, before strategy dispatch | `reducer.ts` |
| Disabled day never commits | `validateDay` in every strategy | `strategies/shared.ts` |
| `min`/`max` day window | `validateDay` | `strategies/shared.ts` |
| Malformed date/time input rejects (never throws) | `validateDay` / `validateTime` | `strategies/shared.ts` |
| Day range cannot cross a disabled day | `validateRangeCrossing` (unit `"day"` only) | `strategies/shared.ts` |
| `minSpan`/`maxSpan` (in units) | `validateSpanLength` | `strategies/shared.ts` |
| `maxDates` cap (reject + effect, plus pre-click `MaxReached` flag) | `multiple` strategy + `day-flags.ts` | `strategies/multiple.ts` |
| `maxRanges` cap | `multi-span` strategy | `strategies/multi-span.ts` |
| `start ≤ end` (bound edits reject, never silently swap) | `spanSetBoundDate` | `strategies/shared.ts` |
| Same-day span: `fromTime ≤ toTime` | `spanSetTime` / `spanSetBoundDate` | `strategies/shared.ts` |
| Time inside `[minTime, maxTime]` | `validateTime` (core); modules only gate affordances on top | `strategies/shared.ts` |
| `defaultTime` clamped into the time window | `resolveDefaultTime` | `state.ts` |
| Excluded endpoint policy (`snap-inward` / `reject`), span never empty after exclusion | `commitSpan` exclusion check | `strategies/shared.ts` |
| Committed span sets are canonical (sorted, merged, non-overlapping) | `mergeRanges` at commit | `strategies/multi-span.ts`, `calendar-range.ts` |
| Value shape fixed by `unit × mode` alone (§4) | `toPublicValue` | `public-value.ts` |
| Controlled identity by serialized key, not object reference | `valueKey` sync | `provider.tsx` |
| Bad public input degrades with a dev warning, never throws | `fromPublicValue`, rule/preset compilers | `public-value.ts`, `date-rule-engine.ts`, `preset-engine.ts` |

The point of the table: a visual module **never re-implements any of these**.
If a module needs to know whether a click will succeed, it renders the state
the core already derived (day flags, view-navigation gates) — it does not
re-run validation.

### 3.10 Validation

`validation.ts` distinguishes two outcome kinds:

- **Transient rejections** — a disabled-day click, a cap hit, a crossing
  range. These are *not stored*; they flow out as a `validationRejected`
  effect with a stable, telemetry-friendly `ValidationReason` string
  (`"disabled"`, `"before-min"`, `"range-too-long"`, `"max-dates-reached"`,
  `"time-out-of-order"`, `"empty-after-exclude"`, `"read-only"`, …).
- **Persistent field errors** — a manual-input parse error that must stay
  visible until the next edit or successful commit. These live in
  `state.validation` keyed by a `ValidationScope`: a built-in scope
  (`"manualInput"`, `"time.from"`, `"range.to"`, …) or a namespaced
  `custom:<id>` for third-party modules (`customScope(id)` — never invent
  unscoped strings). A successful result *clears* the stored error.

No UI is forced: a composition with no error surface simply ignores the
state.

### 3.11 Date rule engine (`disabled` / `exclude`)

`date-rule-engine.ts` is one compiled engine behind both props — identical
rule shapes, different meaning:

- `disabled` — the day cannot be selected at all;
- `exclude` — the day stays *selectable-through* inside a span but is dropped
  from committed segments, splitting the span (§3.12).

Rules: `all`, `weekends`, `weekdays[]`, `before`/`after`, exact `dates[]`,
`ranges[]` (accepting both `{start,end}` and the v2 `{from,to}` alias, and
plain JS `Date` day inputs), and a `predicate` escape hatch.

`compileDateRules(config)` compiles **once** into a queryable engine;
`matches(date, weekday?)` is the per-cell hot path and is allocation-free,
checking rules **cheapest-first**: empty short-circuit → `all` flag → weekday
bitmask → exact-date `Set` → before/after compares → merged-range binary
search → predicate last. Reasons (`getReason`) are computed lazily, only when
a tooltip/aria asks. Malformed entries are skipped with a dev warning — the
compiler never throws. The engine also exposes `limits` (bounds implied by
`before`/`after`) for view clamping.

`createDisabled` on the public surface is literally an alias of
`compileDateRules` (`react/index.ts`).

### 3.12 Exclusion and segments

`segment.ts` turns one drawn span into its surviving contiguous
**business-day segments** by dropping days a cut matches
(`applyExclusion`). `combineCuts(exclude, disabled)` merges both engines into
one membership test — a disabled day must never survive inside an emitted
span either.

Where each piece runs is deliberate:

- **at click time** — `exclude` is *not* checked (`validateDay` skips it):
  excluded days may be inside a span;
- **at commit time** — `commitSpan` rejects spans that would be *empty* after
  exclusion, and rejects excluded endpoints under
  `excludedEndpointPolicy: "reject"`;
- **at emit/render time** — segmentation happens once per commit
  (`toSegments`, `buildDayLookup`), never per cell per render.

### 3.13 Preset engine

`preset-engine.ts` turns named shortcuts ("Today", "Last 7 days") into
candidate values. The boundary is strict: a preset is a **pure resolver to a
candidate** (`PresetResult`: `date` | `dates` | `range`). It never changes
the selection mode, never bypasses a strategy, and never drives reducer
behavior — applying a chosen preset dispatches `applyPreset`, which commits
through the same strategy invariants as a manual pick.

The engine dedupes ids, resolves labels (`string` or the locale-aware
`(locale) => string`), groups presets, and `evaluate()`s each one against the
current context to a status: `ok` / `incompatible` (mode filter) /
`disabled` (blocked by rules or min/max) / `empty`. Throwing resolvers and
malformed defs degrade with dev warnings. Shipped packs: `relativePresets`,
`commonPresets`, plus `definePreset` for declarative one-offs.

### 3.14 Day flags — the per-cell bitmask

Days are the most-rendered surface (42 cells × N calendars), re-derived on
every hover while a range is drawn. `day-flags.ts` packs a cell's full visual
state into a single SMI-safe `number`:

`Selected, InRange, RangeStart, RangeEnd, Preview, PreviewStart, PreviewEnd,
Disabled, Excluded, Today, OutOfMonth, Weekend, MaxReached`.

The pipeline has three stages with distinct cost profiles:

1. `buildDayLookup(selection, config)` — **on commit only** (a click, rare).
   Point selections become an O(1) key `Set`; span selections store the
   *effective* ranges (post-exclusion segments), so the grid renders the same
   holes the emitted value has. The pending `draftAnchor` is carried so the
   range start is visible while drafting.
2. `buildPreviewSegments(selection, config, hoverDate)` — **once per hover**,
   by the module, not per cell: the anchor→hover hull, unit-snapped and split
   by exclude/disabled exactly as the commit will be (no "blue on hover, hole
   on select" flicker).
3. `dayFlags(date, lookup, config, preview, today, inMonth)` — **per visible
   cell**, allocation-free. A day's range role is decided by comparing it to
   its containing span's endpoints (committed ranges are canonical), never by
   probing neighbor days.

The bits are opaque inside the core. `react/day-attrs.ts` maps them to
readable `data-*` attributes exactly once, at the DOM edge:
`data-selected`, `data-in-range`, `data-range-start/end`,
`data-preview(-start/-end)`, `data-disabled`, `data-excluded`, `data-today`,
`data-outside`, `data-weekend`, `data-max-reached`. Present flags render as
empty-string attributes; absent ones are omitted — this is the public styling
and testing contract for day cells.

### 3.15 Other pure helpers

- `day-keyboard.ts` — pure key → intent mapping for the day grid: arrows step
  a day/week, Home/End jump within the week, PageUp/Down step a month (a
  **year** with Shift), Enter/Space select. Testable without React; the
  module only wires DOM focus.
- `month-grid.ts` — pure 7-column day matrix for a month
  (`fixedWeeks` default `true` → always 6 rows, constant height, no reflow
  on navigation), memoizable by `(year, month, options)`. Cells are purely
  structural (`date`, `inMonth`, `weekday`); selection state is layered on
  later via day flags.
- `view-navigation.ts` — min/max gating for navigation controls
  (`canStepView`, `isMonthInBounds`, `isYearInBounds`, `isYearFixed`,
  `isMonthFixed`) so a prev/next/picker disables instead of silently
  bouncing.
- `bound.ts` — `boundDateOf(selection, bound)`: read one span bound for
  display. Modules display bounds via this and *commit* edits via
  `setBoundDate` / `setTime(…, bound)` — the strategy owns all ordering and
  clamping.

### 3.16 Labels and warnings

**Labels** (`labels.ts`) — the single home for user-facing strings (mostly
aria). A typed registry of ~60 keys with `{placeholder}` interpolation and a
single resolution order: **module override → root override → English
default**. Modules never hard-code an aria string; every label is
overridable via `<Calendar labels={…}>` or a per-module label prop.

**Warnings** (`warnings.ts`) — the "never throw" policy has one enforcement
point. Rules: stable ids, warn **once** per distinct message, every message
names the fix, dev-only (`NODE_ENV === "production"` silences), and the sink
is injectable so tests capture warnings deterministically instead of spying
on the console. Malformed user input anywhere (values, rules, presets,
timezones) degrades to a safe fallback and emits one of these.

---

## 4. Selection model: `unit × mode`

Two orthogonal, **static** axes replace v2's `mode` + boolean flag pile
(`selection-types.ts`):

- `unit: "day" | "week" | "month"` — what a single pick covers;
- `mode: "single" | "multiple" | "range" | "multi-range"` — cardinality.

They are configuration, never inferred from which modules are mounted, and
never drive hidden reducer behavior. Internally the matrix collapses to the
two storage shapes (§3.4); the strategy enforces cardinality within the
shape.

### 4.1 Public value shape (the §2d contract)

`public-value.ts` defines the boundary value — what `onChange` emits and
`value` accepts. Internally everything is calendar structs; the public
surface is plain JS `Date`, matching the React ecosystem.

The shape is derived from `(unit, mode)` **alone**:

| unit | mode | `CalendarValue<U, M>` |
|---|---|---|
| day | single | `Date \| null` |
| day | multiple | `Date[]` |
| day | range | `{ start: Date; end: Date } \| null` |
| day | multi-range | `PublicRange[]` |
| week/month | single, range | `PublicRange \| null` |
| week/month | multiple, multi-range | `PublicRange[]` |

`exclude` / `disabled` / `maxRanges` **never change the shape** — a consumer
can type its `onChange` handler from the props it passes, with no conditional
types over optional flags. Empty is `null`, never an empty span.

`value` always carries the **logical spans** (the user's anchor→end intent).
The segmented business-day view is derived data and rides in the second
`onChange` argument:

```ts
onChange(value, details);   // details: CalendarChangeDetails
// details.segments?: PublicRange[]  — surviving segments after exclude/disabled
//                                     (present only for span shapes with cuts)
// details.reason: "select" | "clear" | "preset" | "time" | "remove" | "external-sync"
```

Consumers whose real value *is* the segment list (booking, business days)
read `details.segments`; everyone else keeps a stable-shaped `value`.

### 4.2 Value identity: `valueKey`

`valueKey(value, config)` computes a canonical string key for a public value
**in the calendar zone**: `YYYY-MM-DD` per date, plus time components only
when the composition edits time (`withTime`). Arrays are sorted before
joining. Consequences, all deliberate:

- identity is robust to host-zone vs calendar-zone differences and DST (never
  a raw `getTime()` delta);
- a time-less composition ignores the time-of-day of incoming `Date`s;
- re-emitting an equal value with fresh object identity (the normal React
  case) or in a different order produces the same key — no sync loops.

### 4.3 Round-trip

`fromPublicValue` is the inverse of `toPublicValue`, used by controlled
mode. Because the value carries logical spans (not segments), the round-trip
is clean. Bad input follows the v2 contract — never throws: `Invalid Date`
and wrong-typed entries are dropped with a dev warning, a lone `Date` in a
span shape degrades to a one-day span, an array in single mode collapses to
its first valid entry.

---

## 5. Controlled vs uncontrolled

Both flow through `CalendarProvider` (`provider.tsx`):

- **Uncontrolled** — seed from public `defaultValue` (or the internal
  `defaultSelection` escape hatch); the store owns state; `onChange` is
  optional.
- **Controlled** — `value` present (including `null` = empty). The mount
  seeds the store from `value`; afterwards a `useEffect` keyed on
  `valueKey(value, config)` dispatches `syncExternal` when the host's value
  *actually* changed (by serialized identity, not reference). `syncExternal`
  updates state so subscribers re-render but emits **no notify** — the value
  came from the host; echoing `onChange` would loop.

The semantics are **optimistic**: a user action commits to the store
immediately and `onChange` reports it; the host is expected to reflect the
value back. A host that ignores `onChange` will see drift until it passes the
same `value` again — the `valueKey` sync then snaps the store back. (This is
an intentional departure from v2's strict "UI never moves unless `value`
does" model; see §14 and `.notes/PARITY-V3.md`.)

Change callbacks are read through a **latest-ref**, so swapping `onChange`
between renders never rebuilds the store or re-subscribes anything.

---

## 6. React adapter (`src/react/`)

### 6.1 Store

`createCalendarStore(config, initialState, onEffect)` (`store.ts`) is a
~40-line framework-agnostic wrapper around the reducer, shaped for
`useSyncExternalStore`. Two rules:

- **State identity is the change signal.** `reduce` returns the same
  reference on a no-op, so listeners fire only on real changes.
- **Effects always flow**, even when state didn't change — the sink receives
  `(effect, state, action)` for every effect of every dispatch.

### 6.2 Provider and effect interpretation

`CalendarProvider` creates the store once (`useState` initializer — the store
is referentially stable for the component's lifetime) and installs the effect
sink that turns core effects into host callbacks:

- `notify` → `onChange(toPublicValue(state.selection, config), { segments:
  toSegments(...), reason })` — both value and segments derive from the
  committed state, the single source of truth; `reason` is mapped from the
  action type;
- `viewChanged` → `onViewChange(viewDate)`;
- `validationRejected` → `onValidationReject(result)`.

`useCalendarStore()` exposes the store; `useCalendarActions()` returns a
memoized object of typed dispatchers (`selectDay`, `setTime`,
`setBoundDate`, `navigateTo`, `navigateBy`, `hover`, `focus`, `clear`,
`applyPreset`, `removeDate`, `removeRange`) — built once, safe to hand to
memoized children.

### 6.3 Selector subscriptions

`useStoreSelector(store, selector, isEqual?)` (`use-store-selector.ts`) is a
zero-dependency equivalent of `useSyncExternalStoreWithSelector`: the
snapshot is stabilized through a ref so an equal selection returns the
previous reference (no tearing, no render loop when a selector builds a
fresh object).

This is the lever behind per-cell performance: a day cell selects its own
`dayFlags` number, so `Object.is` bails out and the cell skips rendering
unless *its own* bitmask moved — hovering wakes two or three neighbors, not
all 42 × N cells. It is also the whole custom-module read API (§7.4).

### 6.4 `<Calendar>` root shell

`calendar.tsx` renders the single grid container every module places itself
into, wrapped in the provider stack:

```
<CalendarProvider>            store + effects
  <ThemeScopeProvider>        theme/scheme/appearance for portals
    <LabelsProvider>          label resolver
      <UIProvider>            popup state + scheme toggle
        <div data-dateforge-root data-theme data-appearance data-scheme
             data-gradient? data-readonly? data-testid>
          {children}
          <CalendarAnnouncer />
        </div>
```

Root props of architectural note:

- `theme` — built-in family **name** (rides on `data-theme`, resolved by the
  generated `cal-themes` CSS) or a `createTheme` `ThemeFamily` object
  (applied as inline `light-dark()` vars). One resolver
  (`resolveThemeScope`) serves the root and every portalled popup.
- `appearance` — same dual pattern for the non-color axis
  (`resolveAppearance`: name → `data-appearance`, `createAppearance` object →
  inline `--cal-*` vars).
- `scheme` — `"light" | "dark" | "auto"` (default `"auto"`, which keeps the
  CSS-native first paint via `color-scheme` — dark systems never flash
  light). Uncontrolled: the toolbar theme toggle flips internal state,
  resolving `"auto"` against `matchMedia` at flip time. Controlled: provide
  `onSchemeChange` and own the value.
- `cols` — root grid columns: a number becomes
  `repeat(N, minmax(0, 1fr))` (the `0` floor lets cells shrink so wide
  content cannot blow the grid), a string is a raw `grid-template-columns`.
- `gradient` — decorative corner glows + gradient selected-cell fill, pure
  token-driven CSS (`--cal-selected-*` indirection), follows every theme and
  scheme.
- `labels`, `data-testid`, `id`, `style`, `className` — escape hatches.

### 6.5 Grid layout contract (`cols` / `col`)

The root is one CSS grid; modules occupy cells. The contract (unchanged in
spirit from v2, verified in `calendar.tsx` + `utils/get-grid-slot-style.ts`):

- `<Calendar cols={N}>` — N equal tracks; omit for a single column (modules
  stack vertically).
- `<Module col={3}>` → `grid-column: span 3`; `col="2 / 4"` → raw placement;
  `col` omitted → the module takes the full row.
- **JSX order = visual flow.** Auto-placement fills row by row; there is no
  `order` prop and no dense packing (dense reorders visually vs DOM — an
  a11y smell).

The naming is intentional CSS-grid mental model — parent declares `cols`,
children get `col`. The toolbar mirrors the same `cols` idea internally.

### 6.6 UI context and popups

`ui-context.tsx` holds ephemeral UI state that is *not* selection: which
popup (`"month" | "year" | "time"`) is open and its anchor element, plus the
active scheme and `toggleScheme`. Kept out of the reducer so opening a month
picker never churns selection subscribers.

`CalendarPopup.tsx` is the one popup shell: portalled into `document.body`
with `position: fixed` (never clipped by a short calendar container — a v2
bug class), flipping above the anchor when there is no room below and
clamping to the viewport. It closes on Escape and outside pointer-down,
wraps Tab focus at the edges, restores focus to the anchor on Escape-close,
and — because it lives outside the root — **re-declares**
`data-theme` / `data-scheme` / `data-appearance` from `theme-scope.tsx` so
`--c-*` / `--cal-*` tokens resolve identically to the root.

`picker-draft.tsx` is a small staging channel for pickers rendered inside a
confirm-gated trigger popup: with the context present, a wheel/grid picker
reads/writes a *staged* date instead of the store, and the trigger applies it
only on Confirm — so the calendar doesn't lurch while the user is still
spinning. Absent context = live behavior.

### 6.7 Focus manager

`focus-manager.ts` deliberately owns only the **first focus** concern: the
root `initialFocus` prop (`false`/omitted = never steal focus; `"view"` =
the view anchor; a `CalendarDate` = that day) resolves once at mount, is
seeded into `interaction.focusDate` (StrictMode-safe: seeding state instead
of firing a mount effect), and `useFirstFocus` performs the one DOM focus
from the root via `[data-date="…"]` lookup. Focus *return* on popup close is
owned by `CalendarPopup`. A per-module focus-priority registry was
considered and deferred — with one interactive grid per composition it would
be speculative infrastructure (rationale in the file header).

### 6.8 Announcer

`announcer.tsx` mounts one permanent off-screen `role="status"
aria-live="polite"` region at the root (live regions must exist before their
first update). It watches the **committed** selection through a selector,
formats it with `Intl.DateTimeFormat` in the configured locale, and
announces `announceSelected` / `announceCleared` through the label
registry. Hover, focus moves, and the pending range anchor never change the
committed text, so the region never chatters; the mount value is seeded as
"already announced".

### 6.9 UI primitives

`react/ui/` holds the two internal building blocks every module composes
(styled in `cal-base` so module CSS can override without `!important`):

- `UIButton` — the one action-button primitive (toolbar nav, resets, clear,
  pagers). Variants `outline`/`ghost`, sizes `md`/`sm`, always
  `type="button"`, all states token-driven.
- `UITile` — the one roving-grid cell primitive (month/year pickers, grids,
  presets): `selected` (accent fill), `current` (subtle accent outline),
  roving props spread straight onto it. **Not** used for Days cells — those
  keep a bespoke bitmask-memoized cell for the per-cell perf contract.

Disabled states for both (and for day cells) use a translucent surface
derived from the theme: `color-mix(in srgb, var(--c-disabled) 10%,
transparent)` — theme-aware without a dedicated "disabled background" token.

The style guide lives in `.notes/ui-styleguide.md` and the `v3/UI Kit`
stories.

### 6.10 Prebuilts

`prebuilt.tsx` (`@dateforge/react-calendar/prebuilt`) ships one-import
compositions for the common cases — `SimpleCalendar`, `DatePicker`,
`MonthPicker`, `MultiMonthCalendar` — assembled purely from the public shell
+ modules, as proof that the composition surface is sufficient.

---

## 7. Module layer (`src/modules/`)

### 7.1 The composition promise

`<Calendar>` renders no calendar UI of its own; all visible behavior comes
from modules placed as children. The promise, carried over from v2:

> Any subset of modules renders without crashing. Not every subset is a
> complete UX — that part is the consumer's design job.

Modules are self-contained, idempotent under remount/reorder, repeatable
(several `<CalendarDays offset={n}>` make a multi-month board), and read
everything from the store — no prop drilling from the root.

### 7.2 Visual families

| Family | Modules | Shared machinery |
|---|---|---|
| **Grids** | `CalendarDays`, `CalendarMonthsGrid`, `CalendarYearsGrid` | `month-grid.ts`, roving tile focus, page-slide animation |
| **Tracks** | `CalendarDaysTrack`, `CalendarMonthsTrack`, `CalendarYearsTrack` | `VirtualTrack` shell + `useTrack` physics (axis "x") |
| **Wheels** | `CalendarTimeWheel`, `CalendarMonthsWheel`, `CalendarYearsWheel` | StepDrum on the same `useTrack` physics (axis "y", sticky mode) |
| **Information** | `CalendarInfo`, `CalendarSelectedDates`, `CalendarLunar` | read-only / removal actions |
| **Input & control** | `CalendarToolbar` + primitives, `CalendarManualInput`, `CalendarPresets` | toolbar popups, date mask, preset engine |

The toolbar is not a monolith: `CalendarToolbar` plus composable primitives
(prev/next, month/year triggers and labels with unit-stepping, clock, home,
apply, clear, theme toggle, groups). There is deliberately **no**
`<CalendarNav>` ready-made export — the ready nav is a docs recipe.

Span-mode surfaces accept `bound="from" | "to"` (wheels, tracks, manual
input, toolbar time) to edit one bound of the active range; display reads
through `boundDateOf`, edits go through `setBoundDate` / `setTime(…, bound)`
so ordering rules stay in the core.

### 7.3 Module anatomy

A module folder is `<name>/Calendar<Name>.tsx` + `<name>.module.css` +
`<Name>.stories.tsx`, and each module is its own subpath bundle
(`@dateforge/react-calendar/modules/<name>`, see §13). The pattern, using
Days as the canonical example (`days/CalendarDays.tsx`):

1. **Read** narrow slices via selectors — `viewDate`, `selection`,
   `hoverDate`, `focusDate` are separate subscriptions, so hover doesn't
   re-render the parts that only care about the view.
2. **Derive** view models from pure core helpers, memoized at the right
   granularity: the structural grid by month (`buildMonthGrid`), the
   selection lookup on commit (`buildDayLookup`), the preview once per hover
   (`buildPreviewSegments`), and per-cell `dayFlags` numbers memoized so a
   cell re-renders only when its own bitmask changes.
3. **Write** via `useCalendarActions()` only — never by mutating state, never
   by calling user callbacks (those belong to the effect sink).
4. **Expose state as `data-*`** (via `dayDataAttrs` or module-specific
   attributes) and style off tokens in the `cal-modules` layer.
5. **Resolve every aria string** through `useLabels()` (module override →
   root override → default).

### 7.4 Building a third-party module

Everything a custom module needs is the public `/context` surface
(`react/context.ts`); no internal imports, no context spelunking:

- `useCalendarStore()` + `useStoreSelector(store, selector)` — read;
- `useCalendarActions()` — write;
- `useUI()` — popup state; `useLabels()` — label resolution;
- exported types: `CalendarState`, `SelectionState`, `CalendarAction`, …

`src/react/Recipes.stories.tsx` is the reference recipe (an RC-gate
item): a custom footer that subscribes to the picked-day count and the first
date, and writes back with `navigateTo`/`clear` — a dozen lines, re-rendering
only when its own selections change.

---

## 8. Styling (`src/styles/`)

### 8.1 Layer cascade

All library CSS lives in five cascade layers, declared in this order:

```css
@layer cal-base, cal-themes, cal-appearances, cal-modules, cal-user;
```

- `cal-base` — neutral token defaults, root shell, popup shell, focus ring,
  RTL flips, UIButton/UITile, VirtualTrack/StepDrum shells. An unthemed
  calendar is legible from this layer alone.
- `cal-themes` — generated color tokens (`--c-*`) per family.
- `cal-appearances` — generated shape/spacing/motion tokens (`--cal-*`).
- `cal-modules` — per-module layout and state styling; reads tokens from the
  inner layers.
- `cal-user` — the supported consumer override escape hatch. (Unlayered app
  CSS still wins over all library layers, per the CSS spec.)

**Critical rule:** the `@layer` *order statement* must be the first statement
of **every** layered CSS file — `layers.css`, every `*.module.css`, the
generated `themes.css`/`appearances.css`. The bundler concatenates chunk CSS
in graph order, and the first `@layer` statement encountered pins the layer
order; a module chunk that happens to load first would otherwise re-rank the
layers. Each file carries the comment explaining this; do not "clean it up".

**Zero `!important`** anywhere in library CSS — hard-banned by
`scripts/check-css-important.mjs` (`npm run check:css`, part of `verify`).
Raise specificity or move a rule to an outer layer instead.

### 8.2 Theme tokens (colors)

The v3 color contract is 16 tokens (`theme-tokens.ts`), mapped to long
readable vars (`--c-accent`, not v2's `--c-a`):

`accent, activeText, todayDot, backdrop, tone, text, stroke, shadow,
disabled, mutedText, disabledText, weekend, range, error, outOfMonth?,
focusRing?`

Three keys were renamed from v2 because the old names lied about their role:
v2 `highlight` → v3 `accent` (the brand/selected fill), v2 `accent` → v3
`focusRing` (it only ever painted focus rings), `tone` kept.

Every `--c-*` token is registered as a typed `<color>` custom property in
`tokens.css` (`@property … syntax: "<color>"`). That makes token changes
**interpolable**: when the theme or scheme flips, surfaces that declare paint
transitions crossfade smoothly instead of snapping.

### 8.3 Theme pipeline (generator)

```
styles/theme-source.ts        28 hand-tuned families (light + dark),
        │                        v2 token vocabulary
        ▼
scripts/generate-theme.ts     remaps keys (highlight→accent, accent→focusRing),
        │                        runs a WCAG contrast audit per family
        ├──► styles/themes.css    one [data-theme="<name>"] block per family,
        │                            every token as light-dark(light, dark)
        └──► styles/themes.ts     named ThemeFamily objects (importable,
                                     tree-shakeable via /themes)
```

Key properties:

- **`light-dark()` everywhere** — the active side follows the root's
  `color-scheme` (set from the `scheme` prop), so switching light/dark needs
  no JS mode tracking and no duplicated dark blocks. `createTheme` families
  use the exact same mechanism via inline vars (`themeFamilyToVars`).
- **Contrast audit in the generator** — the build warns with a list of
  violations when a family misses the targets: 4.5:1 for primary ink pairs
  (AA normal text) and 3:1 for de-emphasized UI ink, including the
  `outOfMonth`/`backdrop` and `disabledText`/`backdrop` pairs.
- **Generated files are never hand-edited** — change `theme-source.ts` and
  re-run `npm run build`.

`createTheme(input)` builds a custom `ThemeFamily` at runtime: top-level
tokens shared, `light`/`dark` per-side overrides, plus WCAG-driven seeding —
given only an `accent`, it derives a legible `activeText` (black or white by
contrast ratio), a `shadow`, and a `focusRing`. `todayDot` is deliberately
*not* derived (the CSS default `var(--c-accent)` contrasts against the
backdrop, which is where the dot actually lives).

### 8.4 Appearances (shape / spacing / motion)

`appearance-tokens.ts` defines the non-color axis: ~28 tokens
(radius, spacing, borders, shadows, transition/easing, typography, day-cell
height, control/tile padding, `pressScale`, opacities, letter-spacing)
mapped to `--cal-*` vars. Same dual pattern as themes: a built-in name rides
on `data-appearance` (generated `appearances.css` via
`scripts/generate-appearance.ts`), a `createAppearance(tokens)` object
becomes inline vars.

A small **bridge in `cal-base`** aliases the vars modules actually consume
(`--c-day-radius`, `--c-radius`, `--c-gap`, `--c-pad`, …) to the appearance
contract vars with the v3 defaults as fallbacks — so "no appearance" is the
default v3 look and an appearance restyles every module without any module
knowing about it.

### 8.5 Container queries, not JS measurement

The root shell declares `container-type: inline-size; container-name:
cal-root`, and modules declare their own named containers. All responsive
behavior (day-cell sizing, grid column promotion, lunar strip auto-fit) is
CSS `@container` — there is no JS width measurement on the layout path. The
only ResizeObserver in the library is `useItemSize`, which measures one item
inside tracks/drums to convert pixels ↔ indices for the physics.

### 8.6 RTL

RTL support is structural, not scripted: layout uses CSS logical properties
throughout, and the calendar never sets `dir` itself — it inherits from the
host. The only explicit handling is mirroring direction-bearing glyphs: the
horizontal prev/next/pager chevrons are marked `data-flip-rtl` and a single
`cal-base` rule (`[dir="rtl"] [data-flip-rtl] { transform: scaleX(-1) }`)
flips them, including inside portalled popups. Direction-neutral icons
(clock, home, check) stay put.

---

## 9. Accessibility architecture

A11y is layered into the architecture rather than sprinkled per component:

- **Label registry** (§3.16 + `labels-context.tsx`) — every aria string
  resolves `module override → root labels → English default`. No module
  hard-codes a string; localization is one surface.
- **Announcer** (§6.8) — one polite live region announces committed
  selections and clears; drafting/hovering never chatters.
- **Day grid** — ARIA grid pattern: `role="grid"` with a localized
  month+year label, `row`/`columnheader`/`rowheader`/`gridcell` roles,
  roving tabindex driven by `interaction.focusDate`, and the full keyboard
  map from `day-keyboard.ts` (arrows/Home/End/PageUp/PageDown, Shift+Page for
  year jumps, Enter/Space to select).
- **Roving tile grids** — months/years grids, presets, and the toolbar's
  popup pickers share `useRovingTileFocus` (`hooks/use-roving-tile-focus.ts`):
  one tab stop, arrow navigation by DOM geometry, disabled/hidden tiles
  skipped.
- **Popups** (§6.6) — `role="dialog"` with a registry label, focus wrap on
  Tab, Escape-close with focus return to the trigger.
- **Wheels/tracks** — spinbutton semantics with value text, keyboard
  stepping, and drum walls at min/max.
- **Focus visibility** — a themed global `:focus-visible` ring
  (`--c-focusRing`) in `cal-base`, overridable per module.
- **Contrast** — enforced at theme-generation time (§8.3), including muted
  inks, plus a neutral default palette in `cal-base` chosen for AA on small
  text.
- **Reduced motion** — transition/press tokens collapse under
  `prefers-reduced-motion`, and `usePageSlide` no-ops.
- **Gate** — `src/__tests__/react/a11y.test.tsx` runs axe over
  representative compositions; violations fail CI. New modules must land
  with axe cases.

---

## 10. SSR and hydration

The contract: server HTML equals the first client render — no hydration
mismatch, verified by `npm run test:ssr` (`v3/react/ssr.test.tsx`, a
node-environment `renderToString` suite over the shell + modules).

The mechanisms:

- **`useClientValue(getter, fallback)`** (`hooks/use-client-value.ts`) — the
  one pattern for browser-dependent values: `fallback` on the server and the
  first client render, `getter()` applied in an isomorphic layout effect
  (before paint, so no flash). `useToday()` builds on it for a
  hydration-safe "today" `Date` (`null` until mount).
- **Scheme without flash** — `scheme="auto"` renders `data-scheme="auto"` and
  lets CSS `color-scheme: light dark` + `light-dark()` resolve the palette
  natively; no JS runs before first paint, so dark systems never flash
  light. JS only enters when the user explicitly toggles.
- **"Today" in the core** — `today(timeZone)` is called at store creation on
  the client; the core never bakes `Date.now()` into render output.
- **First focus** — seeded into state, not fired as a mount effect
  (StrictMode-safe, absent in SSR by construction, §6.7).
- **Portals** — `CalendarPopup` renders `null` until mounted, so SSR output
  never contains portal content.

---

## 11. Performance model

The recurring theme: **pay on commit (rare), not on hover/render (hot)**.

- **Packed day bitmask** — a cell's whole visual state is one SMI `number`;
  cells memo on `prevFlags === nextFlags` (§3.14).
- **Selector subscriptions** — per-slice `useStoreSelector` with
  ref-stabilized snapshots; hover wakes only the cells whose flags changed
  (§6.3).
- **Structural sharing** — the reducer returns identical state references on
  no-ops; the store notifies only on identity change (§3.6, §6.1).
- **Compile-once engines** — disabled/exclude rules (§3.11) and presets
  (§3.13) compile at config-build time; the per-cell query is
  allocation-free and cheapest-first. Intl formatters are cached per zone in
  the timezone boundary.
- **Commit-time derivation** — `DayLookup` on selection change,
  preview segments once per hover, segmentation at emit time; never per cell
  per render (§3.12, §3.14).
- **Zero-allocation hot paths** — shared `NO_EFFECTS`, no effect objects on
  hover, weekday computed once and threaded into the rule engines.
- **Container queries instead of JS measurement** — no resize-driven React
  re-renders on the layout path (§8.5).
- **Compositor-only page transitions** — `usePageSlide` animates
  `transform`/`opacity` via the Web Animations API on already-committed DOM;
  no remount, memoized cells stay put, rapid paging cancels in-flight runs.
- **Track physics off the React render path** — `useTrack`
  (`hooks/use-track.ts`) runs inertia/spring/rubber-band physics
  (`FRICTION 0.86`, `SPRING_K 0.18`, plus a "sticky" constant set for drums
  that can't skip items) in rAF with refs, committing a single `position`
  float; shared by `VirtualTrack` (tracks, axis "x") and StepDrum (wheels,
  axis "y").
- **Budget enforcement** — the size-limit multi-bundle gate (§13) and
  `vitest bench` benches over the core (`__tests__/bench/core.bench.ts`).

---

## 12. Testing layout

```
src/__tests__/
  v3/core/        pure-core unit tests: one file per core module
                  (reducer, strategies per mode, engines, value round-trip,
                  timezone boundary incl. DST, day flags, labels, warnings,
                  parity-fixes.test.ts — the restored-v2-contract suite)
  v3/react/       adapter + module tests (happy-dom + @testing-library/react):
                  provider/store/selector, calendar shell, every module,
                  keyboard, popups, a11y (axe), SSR (node env), parity fixes
  v3/fixtures/    shared data-focused builders (D, buildConfig, point, span,
                  extDate, extRange) — the one vocabulary for configs and
                  selections across tests; fixtures encode the v3 CONTRACT,
                  with each labeled parity vs intentional-break (README.md)
  fuzz/           randomized action sequences against the core
                  (FUZZ_RUNS env; npm run fuzz / fuzz:ci)
  bench/          vitest bench over core hot paths
```

Vitest runs two projects (`vitest.config.ts`):

1. the default **happy-dom** project for unit/component tests (globals,
   `setup.ts`, typechecked against `tsconfig.test.json`);
2. a **storybook browser project** — `@storybook/addon-vitest` runs every
   story as a real-browser test in headless Chromium via Playwright
   (`npm run test:storybook`), which keeps stories from rotting and doubles
   as smoke coverage for the physics-heavy modules.

Coverage thresholds are enforced (80% lines/functions/statements, 75%
branches). Chromatic covers visual regression of the theme × appearance
product from Storybook. Warnings are asserted through the injectable warner
sink, not console spies (§3.16).

---

## 13. Build and release pipeline

**Bundler** — tsdown (rolldown-based), `tsdown.config.ts`, two passes over
one entry map:

- **ESM** — `.mjs` + `.d.ts`, CSS **injected** into the JS at import time
  (importing a module auto-applies its styles);
- **CJS** — `.cjs` + `.d.cts`, CSS inject disabled (keeps ESM syntax out of
  CJS output).

The entry map lists the root (`index`), `context`, `prebuilt`,
`modules/index` plus **every module as its own entry**, and the
`themes`/`appearances` palettes. Because all entries build in one pass per
format, rolldown **auto-extracts shared chunks** (store, core, hooks, UI
primitives) that the small per-module entries import — no manual
externalization plugin (the v2 approach). React and peers are never bundled;
`target: es2022`, minified, treeshaken.

**Exports map** (`package.json`) mirrors the entries: `.` (shell + config +
value types), `./context`, `./prebuilt`, `./modules`, `./modules/<name>` per
module, `./themes`, `./appearances` — each with `import`/`require` and
matching type conditions. (Per-theme subpaths were dropped in v3: named
exports off the barrels tree-shake; 60+ subpath entries bloated the map.)

**Gates**, all wired into `npm run verify`:

```
typecheck  →  tsc --noEmit
check      →  biome lint + format
check:css  →  scripts/check-css-important.mjs (zero !important)
knip       →  unused exports/deps
build      →  tsdown --dts + theme/appearance generators
check:exports → publint + attw --pack (node16 profile) — dual-package hygiene
size       →  size-limit over 5 REAL import scenarios (.size-limit.json):
              Calendar only · Calendar+Days · Calendar+Toolbar+Days ·
              Calendar+Days+theme+appearance · prebuilt SimpleCalendar
test       →  vitest run (all projects)
```

Releases go through changesets (`pr` script). Runtime dependencies remain
**zero** — additions land in dev/peer only.

---

## 14. v3 vs v2 — why the rebuild

v3 is a clean rebuild, not a refactor. The v2 pain points that motivated it
(full rationale in `.notes/rfc-v3.md`):

| v2 | v3 |
|---|---|
| JS `Date` arithmetic spread across modules; DST handled ad hoc | calendar structs everywhere; one timezone boundary with explicit DST policies |
| hidden `notifySeq` effect triggered `onChange` | explicit `{ state, effects[] }`; the adapter interprets `notify` |
| one reducer with single/multiple/range branches | one strategy per `unit × mode`; invariants in one place each |
| 5 React contexts, hover-driven wide invalidation | one store + selector subscriptions; per-cell bailout |
| disabled/range checks re-implemented per module ("works in Days, breaks in ManualInput") | compiled engines + strategy validation; modules render derived state |
| `mode` + boolean flag pile; `exclude` reshaped the value | static `unit × mode` axes; value shape fixed by them alone, segments in change details |
| strict controlled SSOT (UI frozen until `value` echoes) | optimistic commit + `valueKey` identity re-sync |

The compatibility ledger is `.notes/PARITY-V3.md`: everything from v2 is
either present 1:1, changed by design with the reason recorded (label
registry instead of ~55 label props, `config` object instead of flat root
props, one store instead of context hooks, families-only themes, …), or an
explicitly listed open gap for 3.x (`motion="view-transition"`, days
touch-swipe, per-day time editing in multiple mode). The governing rule
during the port was **no unmotivated regressions** — every v2 behavior that
silently disappeared was either restored (with tests in
`parity-fixes.test.*`) or written down with its motivation.
