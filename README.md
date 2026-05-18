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
[![Socket](https://badge.socket.dev/npm/package/@dateforge/react-calendar/1.0.0)](https://badge.socket.dev/npm/package/@dateforge/react-calendar/1.0.0)
&nbsp;&nbsp;
[![Visual regression](https://img.shields.io/badge/visual%20regression-Chromatic-ff4785?style=flat-square&logo=chromatic)](https://www.chromatic.com/library?appId=69edcfe5e2f1e060b1cce900)

</div>

# @dateforge/react-calendar

<div align="center">
  <img src="https://i.ibb.co/pj9WVkSR/image.png" alt="Compact DateForge calendar" width="360" />
</div>

**The modular calendar toolkit that starts tiny and grows into exactly what your product needs.**

Monolithic pickers ship everything: the grid, the nav, the time picker, the presets, the opinions, the layout, the weight. DateForge ships only what you use.

Start with two components. Add only the pieces your workflow earns: range selection, multi-select, time, presets, manual input, selected-date chips, track pickers, custom layouts, themes, appearances, and tokens. DateForge is not one picker with a long prop list — it is a toolkit of focused modules that share one calendar brain.

**Modular · Composable · Tokenized**  
**Start minimal. Scale infinitely. Add only the modules you need.**

The module mix, selection modes, visual tokens, and focused props unlock **~2.0 trillion built-in calendar configurations** without forcing you into one prebuilt UI.

Use built-in themes and appearances, or create your own with first-class APIs. Shape selection with flexible presets, disabled rules, min/max bounds, timezone-aware dates, and `single`, `multiple`, or `range` modes. Build a classic picker, a date track, a 12-month range board, a month-only selector, a time-only control, or a fully custom booking flow from the same parts.

<div align="center">

### [📖 Docs](https://calendar-demo-pi.vercel.app/docs) &nbsp;·&nbsp; [🚀 Live Demo](https://calendar-demo-pi.vercel.app/) &nbsp;·&nbsp; [📚 Storybook](https://kirilinsky.github.io/dateforge-react-calendar/)

</div>

<div align="center">
   <br />
  <br />
  <img src="https://i.ibb.co/7Jhq7s0Y/image.png" alt="DateForge date and time calendar flow" width="380" />
</div>

---

## Why DateForge?

Most date pickers ask you to accept their shape. DateForge lets you forge yours.

- **Ship less by default** — import a tiny `CalendarDays` grid and `CalendarNav`, then stop. No unused time picker, no bundled presets, no hidden panel waiting in your JavaScript.
- **Compose real product workflows** — add modules when the UX needs them: range previews, multi-month layouts, inline time grids, shortcuts, manual input, selected-date summaries, or mobile-friendly tracks.
- **Keep one shared state model** — every module plugs into the same provider, so custom layouts feel native instead of stitched together.
- **Style it like your system** — themes, appearances, gradients, CSS-grid placement, and tokenized styling let the calendar look built-in, not embedded.
- **Grow without rewriting** — the same API covers a two-component date picker, a booking range calendar, a time-aware scheduler, or a dense operations tool.
- **Built for serious apps** — accessible interactions, SSR-safe defaults, timezone handling, React 18/19 support, zero runtime dependencies, and tree-shakeable module entry points.

```tsx
<Calendar mode="range" value={range} onChange={setRange}>
  <CalendarNav showMonthPicker compactYears />
  <CalendarDays />
  <CalendarPresets presets={presets} />
  <CalendarSelectedDates />
</Calendar>
```

Remove a line, remove a feature. Add a module, add a workflow. That is the core idea.

## Install

```bash
npm i @dateforge/react-calendar
```

No global CSS import is required — styles are bundled into the modules and apply automatically.

## Modules

| Module                  | Use it for                                                  |
| ----------------------- | ----------------------------------------------------------- |
| `CalendarNav`           | Month/year navigation, popups, clear, optional time         |
| `CalendarDays`          | Classic month grid for single, multiple, and range          |
| `CalendarSelectedDates` | Selected-date chips, overflow, per-chip clear               |
| `CalendarInfo`          | Selection metrics, relative hints, empty text, home / clear |
| `CalendarManualInput`   | Typed dates, keyboard-first editing, per-date remove        |
| `CalendarPresets`       | Shortcuts like Today, Last 7 days, custom ranges            |
| `CalendarTimeGrid`      | Inline hour/minute/second selection                         |
| `CalendarMonthsGrid`    | Month-only picking or fast month jumps                      |
| `CalendarYearsGrid`     | Year-only picking or fast year jumps                        |
| `CalendarDaysTrack`     | Scrollable day track for compact/mobile layouts             |
| `CalendarMonthsTrack`   | Scrollable month track                                      |
| `CalendarYearsTrack`    | Scrollable year track                                       |

## Quick start

```tsx
import { useState } from "react";
import { Calendar } from "@dateforge/react-calendar";
import { CalendarNav, CalendarDays } from "@dateforge/react-calendar/modules";

export function Example() {
  const [date, setDate] = useState<Date | null>(null);

  return (
    <Calendar mode="single" value={date} onChange={setDate}>
      <CalendarNav showMonthPicker compactYears />
      <CalendarDays />
    </Calendar>
  );
}
```

---

## Links

- 📚 [Repo Documentation](https://github.com/kirilinsky/dateforge-react-calendar/blob/main/DOCUMENTATION.md)
- 🏛 [Architecture](https://github.com/kirilinsky/dateforge-react-calendar/blob/main/ARCHITECTURE.md)
- 📝 [Changelog](https://github.com/kirilinsky/dateforge-react-calendar/blob/main/CHANGELOG.md)
- 🐛 [Issues](https://github.com/kirilinsky/dateforge-react-calendar/issues)
