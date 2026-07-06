<div align="center">

[![downloads](https://img.shields.io/npm/dm/@dateforge/react-calendar?style=flat-square)](https://www.npmjs.com/package/@dateforge/react-calendar)
&nbsp;&nbsp;
[![codecov](https://codecov.io/gh/kirilinsky/dateforge-react-calendar/branch/main/graph/badge.svg)](https://app.codecov.io/gh/kirilinsky/dateforge-react-calendar)
&nbsp;&nbsp;
[![publint](https://img.shields.io/github/actions/workflow/status/kirilinsky/dateforge-react-calendar/publint.yml?label=publint&style=flat-square)](https://github.com/kirilinsky/dateforge-react-calendar/actions/workflows/publint.yml)
&nbsp;&nbsp;
[![SSR safe](https://img.shields.io/github/actions/workflow/status/kirilinsky/dateforge-react-calendar/ssr.yml?branch=main&label=SSR%20safe&style=flat-square)](https://github.com/kirilinsky/dateforge-react-calendar/actions/workflows/ssr.yml)
&nbsp;&nbsp;
[![A11y](https://img.shields.io/github/actions/workflow/status/kirilinsky/dateforge-react-calendar/a11y.yml?branch=main&label=a11y%20%28axe%29&style=flat-square)](https://github.com/kirilinsky/dateforge-react-calendar/actions/workflows/a11y.yml)
&nbsp;&nbsp;
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/kirilinsky/dateforge-react-calendar/badge)](https://securityscorecards.dev/viewer/?uri=github.com/kirilinsky/dateforge-react-calendar)
&nbsp;&nbsp;
[![Socket](https://badge.socket.dev/npm/package/@dateforge/react-calendar)](https://badge.socket.dev/npm/package/@dateforge/react-calendar)
&nbsp;&nbsp;
[![Visual regression](https://img.shields.io/badge/visual%20regression-Chromatic-ff4785?style=flat-square&logo=chromatic)](https://www.chromatic.com/library?appId=69edcfe5e2f1e060b1cce900)
&nbsp;&nbsp;
[![CodSpeed Badge](https://img.shields.io/endpoint?url=https://codspeed.io/badge.json)](https://codspeed.io/kirilinsky/dateforge-react-calendar?utm_source=badge)

</div>

# @dateforge/react-calendar

<div align="center">

### [🚀 Live Demo](https://calendar-demo-pi.vercel.app/) &nbsp;·&nbsp; [📖 Docs](https://calendar-demo-pi.vercel.app/docs) &nbsp;·&nbsp; [📚 Storybook](https://kirilinsky.github.io/dateforge-react-calendar/)

</div>

**A modular React calendar toolkit that starts tiny and grows with your product.**

Monolithic pickers ship the grid, the toolbar, the time picker, the presets, the layout opinions — and all the weight. DateForge ships only what you use: every module is its own bundle on its own subpath, sharing one calendar core.

- **Zero runtime dependencies.** React 18/19 peer, nothing else.
- **SSR-safe.** No hydration mismatches — server render tested in CI.
- **Accessible.** Keyboard-first, roving focus, axe-audited, WCAG-checked contrast in every built-in theme.
- **Themeable.** 28 light/dark theme families, 8 appearances, gradient mode, or bring your own tokens.
- **Pay per module.** A minimal calendar stays around 20 KB min+gzip; size budgets are enforced in CI.

## Install

```bash
npm i @dateforge/react-calendar
```

No global CSS import required — styles ship inside the modules and apply automatically.

## 10-second start

One import, zero composition:

```tsx
import { useState } from "react";
import { SimpleCalendar } from "@dateforge/react-calendar/prebuilt";

export function Example() {
  const [date, setDate] = useState<Date | null>(null);
  return <SimpleCalendar value={date} onChange={setDate} />;
}
```

### Prebuilt gallery

Every prebuilt is a ready recipe over the same primitives, with plain-`Date` props (`value`, `defaultValue`, `onChange`, `locale`, `min`/`max`, `disabled`, `theme`, `appearance`, `gradient`, `scheme`):

```tsx
import {
  DatePicker,
  MonthPicker,
  MultiMonthCalendar,
  SimpleCalendar,
} from "@dateforge/react-calendar/prebuilt";

<SimpleCalendar onChange={setDate} />                      // header + day grid
<DatePicker allowClear onChange={setDate} />               // typed input + grid + Today
<MonthPicker onChange={setMonth} />                        // year stepper + 12-month grid
<MultiMonthCalendar months={6} cols={3} mode="range" />    // 6-month range board
```

## Compose your own

When a prebuilt stops fitting, drop one level down: `Calendar` takes a compiled `config` (from `createCalendarConfig`) and any mix of modules as children. The root is a CSS grid — `cols` on the root declares columns, `col` on a module places it.

```tsx
import {
  Calendar,
  commonPresets,
  createCalendarConfig,
} from "@dateforge/react-calendar";
import { CalendarDays } from "@dateforge/react-calendar/modules/days";
import { CalendarPresets } from "@dateforge/react-calendar/modules/presets";
import {
  CalendarToolbar,
  CalendarToolbarMonthTrigger,
  CalendarToolbarNext,
  CalendarToolbarPrev,
  CalendarToolbarYearTrigger,
} from "@dateforge/react-calendar/modules/toolbar";

const config = createCalendarConfig({
  mode: "range",
  locale: "de-DE",
  disabled: { weekends: true },
});

export function BookingCalendar() {
  return (
    <Calendar
      config={config}
      cols={3}
      onChange={(range) => console.log(range)} // { start: Date, end: Date } | null
    >
      <CalendarToolbar>
        <CalendarToolbarPrev />
        <CalendarToolbarMonthTrigger />
        <CalendarToolbarYearTrigger />
        <CalendarToolbarNext />
      </CalendarToolbar>
      <CalendarPresets col={1} presets={commonPresets} />
      <CalendarDays col={2} />
    </Calendar>
  );
}
```

Remove a line, remove a feature. Add a module, add a workflow. Order in JSX is visual flow — no `order` props, no slots.

The `onChange` value shape is derived from `unit` × `mode` alone: `day`+`single` → `Date | null`, `day`+`multiple` → `Date[]`, any single span (`range`, or `week`/`month` single) → `{ start, end } | null`, any multi span → `{ start, end }[]`.

## Modules

Import from `@dateforge/react-calendar/modules`, or per subpath (`…/modules/days`, `…/modules/toolbar`, …) for the smallest possible bundle.

| Module | Use it for |
| --- | --- |
| `CalendarToolbar` + primitives | Composable header: prev/next (unit-aware), month/year triggers and labels, Home, Apply, clock |
| `CalendarDays` | Classic month grid — single, multiple, range, multi-range; `offset` for multi-month boards |
| `CalendarMonthsGrid` / `CalendarYearsGrid` | Month/year picking or fast jumps |
| `CalendarDaysTrack` / `CalendarMonthsTrack` / `CalendarYearsTrack` | Physics-based scrollable strips for compact and mobile layouts |
| `CalendarTimeWheel` / `CalendarMonthsWheel` / `CalendarYearsWheel` | iOS-style drum pickers, range-bound aware (`bound="from" \| "to"`) |
| `CalendarManualInput` | Typed, segment-based date entry with keyboard stepping |
| `CalendarPresets` | Shortcuts — `commonPresets`, `relativePresets`, or `definePreset` your own |
| `CalendarSelectedDates` | Selected-date chips with overflow and per-chip clear |
| `CalendarInfo` | Selection metrics, relative hints, empty text |
| `CalendarLunar` | Information-only lunar phase strip |

## Features

- **Selection axes** — `mode`: `single` / `multiple` / `range` / `multi-range` × `unit`: `day` / `week` / `month`. Plus `minSpan`/`maxSpan`, `maxDates`, `maxRanges`.
- **Disabled vs excluded** — `disabled` days can't be picked; `exclude` days are cut out of emitted spans (business-day flows), with segments reported in change details.
- **28 theme families** — each with light + dark: `abyss`, `aurora`, `bauhaus`, `chalk`, `crimson`, `cyber`, `dracula`, `eclipse`, `espresso`, `fjord`, `graphite`, `industrial`, `meadow`, `mint`, `monsoon`, `nebula`, `neon`, `noir`, `pearl`, `prism`, `riso`, `sandstone`, `slate`, `snow`, `solar`, `split`, `temporal`, `velvet`.
- **8 appearances** (shape/spacing, independent of color): `zenith`, `airy`, `bubble`, `compact`, `loft`, `press`, `soft`, `square`.
- **Gradient mode** — `gradient` on the root adds corner glows and gradient selected fills, pure CSS, theme-driven.
- **Scheme control** — `scheme="auto" | "light" | "dark"`, controllable via `onSchemeChange`; no dark-mode flash on SSR.
- **Locales via `Intl`** — month/weekday names, digits, and week start derive from any BCP-47 `locale`; no locale files to import.
- **RTL** — logical properties throughout; the calendar follows the inherited `dir`.
- **Time** — `withTime`, 12/24-hour, `ampmLabels`, `defaultTime`, and a `minTime`/`maxTime` window enforced by the core.
- **Time zones & DST** — IANA `timeZone` for "today" resolution, with explicit ambiguous/nonexistent-time policies.
- **Presets** — built-in packs plus `definePreset` with validation context (disabled/min/max aware).
- **Accessibility** — full keyboard navigation, focus management, live announcements, axe test suite in CI.
- **Validation hooks** — `onValidationReject` tells you what was refused and why; `onViewChange` tracks navigation.

### Theming in one minute

```tsx
import { Calendar, createTheme } from "@dateforge/react-calendar";
import { nebula } from "@dateforge/react-calendar/themes";
import { compact } from "@dateforge/react-calendar/appearances";

// Built-in: by name (generated stylesheet) or by object (tree-shaken)
<Calendar config={config} theme="dracula" />
<Calendar config={config} theme={nebula} appearance={compact} scheme="dark" />

// Custom: common tokens + per-mode overrides → a light/dark family
const brand = createTheme({
  accent: "#2563eb",
  range: "#22c55e",
  light: { backdrop: "#f8fafc" },
  dark: { backdrop: "#0f172a", text: "#f8fafc" },
});
<Calendar config={config} theme={brand} />
```

## Bundle size

Budgets from [`.size-limit.json`](./.size-limit.json), min+gzip, enforced on every commit (React excluded):

| Import | Budget |
| --- | --- |
| `Calendar` only | < 18 KB |
| `Calendar` + `CalendarDays` | < 21.5 KB |
| `Calendar` + `CalendarDays` + theme + appearance | < 25.5 KB |
| `Calendar` + Toolbar + `CalendarDays` | < 26 KB |
| `SimpleCalendar` (prebuilt, one import) | < 27 KB |

Dual ESM/CJS, `sideEffects` limited to CSS, subpath exports per module — bundlers drop everything you don't touch.

## Migrating from v2

v3 is a clean rebuild. The three headline breaking changes:

- **Config object instead of flat props.** `<Calendar mode locale min …>` became `createCalendarConfig({ mode, locale, min, … })` passed as one `config` prop — compiled once, shared by every module.
- **Value shapes by `unit` × `mode`.** `onChange` shapes are fully determined by the config's unit and mode (see above); segments and reasons arrive in a second `details` argument.
- **Themes are families only.** Every theme is a `{ light, dark }` pair; the v1 single-variant palettes are gone, `createTheme` always returns a family.

Prefer not to migrate composition code by hand? The [prebuilt components](#prebuilt-gallery) cover the common v2 setups with one import. Full details in [DOCUMENTATION.md](./DOCUMENTATION.md).

## Links

- 📚 [Repo Documentation](https://github.com/kirilinsky/dateforge-react-calendar/blob/main/DOCUMENTATION.md)
- 🏛 [Architecture](https://github.com/kirilinsky/dateforge-react-calendar/blob/main/ARCHITECTURE.md)
- 📝 [Changelog](https://github.com/kirilinsky/dateforge-react-calendar/blob/main/CHANGELOG.md)
- 📚 [Storybook](https://kirilinsky.github.io/dateforge-react-calendar/)
- 🐛 [Issues](https://github.com/kirilinsky/dateforge-react-calendar/issues)

## License

[MIT](./LICENSE) © [Kirilinsky](https://github.com/kirilinsky)
