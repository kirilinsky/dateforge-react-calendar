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

Modular React calendar and date/time picker. Single, range, and multi-select with time support and presets. Themeable, accessible, SSR-safe, zero dependencies.

<div align="center">

### [📖 Docs](https://calendar-demo-pi.vercel.app/docs) &nbsp;·&nbsp; [🚀 Live Demo](https://calendar-demo-pi.vercel.app/) &nbsp;·&nbsp; [📚 Storybook](https://kirilinsky.github.io/dateforge-react-calendar/)

</div>

<div align="center">
  <img src="https://i.ibb.co/xSDRNqJC/image.png" alt="Calendar dark" width="350" />
  &nbsp;
  <img src="https://i.ibb.co/TDY5zb94/image.png" alt="Calendar light" width="350" />
</div>

---

## Install

```bash
npm i @dateforge/react-calendar
```

No global CSS import is required — styles are bundled into the modules and apply automatically.

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
