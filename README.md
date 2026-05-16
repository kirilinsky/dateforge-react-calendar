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

**Modular · Composable · Tokenized**

Monolithic pickers ship everything. DateForge ships only what you use.

Build exactly the calendar your product needs: start with a tiny date grid, then add navigation, ranges, multi-select, time, presets, manual input, track pickers, themes, appearances, and layout rules as separate modules. The module mix, selection modes, visual tokens, and focused props unlock **~1.9 trillion built-in calendar configurations** without forcing you into one prebuilt picker.

<div align="center">

### [📖 Docs](https://calendar-demo-pi.vercel.app/docs) &nbsp;·&nbsp; [🚀 Live Demo](https://calendar-demo-pi.vercel.app/) &nbsp;·&nbsp; [📚 Storybook](https://kirilinsky.github.io/dateforge-react-calendar/)

</div>

<div align="center">
  <img src="https://i.ibb.co/xSDRNqJC/image.png" alt="Calendar dark" width="330" />
  &nbsp;
  <img src="https://i.ibb.co/TDY5zb94/image.png" alt="Calendar light" width="330" />
</div>

---

## Why DateForge?

- **Modular by design** — compose only the modules you need: days, nav, selected-date chips, presets, manual input, months/years grids, time grids, and mobile-friendly tracks.
- **Deeply customizable** — mix `single`, `multiple`, and `range` modes with prop-level behavior, CSS-grid placement, themes, appearances, gradients, timezone handling, and tokenized styling.
- **Scales from minimal to complex** — use two components for a clean date picker, or assemble a full product calendar with time selection, range constraints, shortcuts, read-only states, and custom layouts.
- **Built for serious apps** — accessible interactions, SSR-safe defaults, React 18/19 support, zero runtime dependencies, and tree-shakeable module entry points.

Start minimal. Scale infinitely. Add only the modules you need.

## Install

```bash
npm i @dateforge/react-calendar
```

No global CSS import is required — styles are bundled into the modules and apply automatically.

## Modules

| Module                  | Use it for                                           |
| ----------------------- | ---------------------------------------------------- |
| `CalendarNav`           | Month/year navigation, popups, clear, optional time  |
| `CalendarDays`          | Classic month grid for single, multiple, and range   |
| `CalendarSelectedDates` | Selected-date chips, overflow, per-chip clear |
| `CalendarInfo`          | Selection metrics, relative hints, empty text, home / clear |
| `CalendarManualInput`   | Typed dates, keyboard-first editing, per-date remove |
| `CalendarPresets`       | Shortcuts like Today, Last 7 days, custom ranges     |
| `CalendarTimeGrid`      | Inline hour/minute/second selection                  |
| `CalendarMonthsGrid`    | Month-only picking or fast month jumps               |
| `CalendarYearsGrid`     | Year-only picking or fast year jumps                 |
| `CalendarDaysTrack`     | Scrollable day track for compact/mobile layouts      |
| `CalendarMonthsTrack`   | Scrollable month track                               |
| `CalendarYearsTrack`    | Scrollable year track                                |

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
