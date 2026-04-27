<div align="center">

[![bundle size](https://img.shields.io/bundlephobia/minzip/@dateforge/react-calendar?style=flat-square)](https://bundlephobia.com/package/@dateforge/react-calendar)
&nbsp;&nbsp;
[![downloads](https://img.shields.io/npm/dm/@dateforge/react-calendar?style=flat-square)](https://www.npmjs.com/package/@dateforge/react-calendar)
&nbsp;&nbsp;
[![codecov](https://codecov.io/gh/kirilinsky/dateforge-react-calendar/branch/main/graph/badge.svg)](https://app.codecov.io/gh/kirilinsky/dateforge-react-calendar)
&nbsp;&nbsp;
[![publint](https://img.shields.io/github/actions/workflow/status/kirilinsky/dateforge-react-calendar/publint.yml?label=publint&style=flat-square)](https://github.com/kirilinsky/dateforge-react-calendar/actions/workflows/publint.yml)
&nbsp;&nbsp;
![zero deps](https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square)
&nbsp;&nbsp;
[![SSR safe](https://img.shields.io/github/actions/workflow/status/kirilinsky/dateforge-react-calendar/ssr.yml?branch=main&label=SSR%20safe&style=flat-square)](https://github.com/kirilinsky/dateforge-react-calendar/actions/workflows/ssr.yml)
&nbsp;&nbsp;
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/kirilinsky/dateforge-react-calendar/badge)](https://securityscorecards.dev/viewer/?uri=github.com/kirilinsky/dateforge-react-calendar)
&nbsp;&nbsp;
[![Socket](https://badge.socket.dev/npm/package/@dateforge/react-calendar/1.0.0)](https://badge.socket.dev/npm/package/@dateforge/react-calendar/1.0.0)
&nbsp;&nbsp;
[![Storybook](https://cdn.jsdelivr.net/gh/storybookjs/brand@master/badge/badge-storybook.svg)](https://kirilinsky.github.io/dateforge-react-calendar/)
&nbsp;&nbsp;
[![Visual regression](https://img.shields.io/badge/visual%20regression-Chromatic-ff4785?style=flat-square&logo=chromatic)](https://www.chromatic.com/library?appId=69edcfe5e2f1e060b1cce900)

</div>

# @dateforge/react-calendar

Modular React calendar and date/time picker. Single, range, and multi-select with time support and presets. Themeable, accessible, SSR-safe, zero dependencies.

[**Live Storybook →**](https://kirilinsky.github.io/dateforge-react-calendar/)

<div align="center">
  <img src="https://i.ibb.co/8DLr6zrt/image.png" alt="Calendar with dark theme" width="400" />
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

See **[DOCUMENTATION.md](https://github.com/kirilinsky/dateforge-react-calendar/blob/main/DOCUMENTATION.md)** for every module and prop.

---

## Links

- 📚 [Documentation](https://github.com/kirilinsky/dateforge-react-calendar/blob/main/DOCUMENTATION.md)
- 🏛 [Architecture](https://github.com/kirilinsky/dateforge-react-calendar/blob/main/ARCHITECTURE.md)
- 📝 [Changelog](https://github.com/kirilinsky/dateforge-react-calendar/blob/main/CHANGELOG.md)
- 🐛 [Issues](https://github.com/kirilinsky/dateforge-react-calendar/issues)
