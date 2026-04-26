<div align="center">

[![react version](https://img.shields.io/badge/react-%5E18.0.0%20%7C%7C%20%5E19.0.0-61dafb?style=flat-square&logo=react)](https://react.dev/)
&nbsp;&nbsp;
[![npm downloads](https://img.shields.io/npm/dm/react-calendar-datetime.svg?style=flat-square)](https://www.npmjs.com/package/react-calendar-datetime)
&nbsp;&nbsp;
![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square)
&nbsp;&nbsp;
[![bundle size](https://img.shields.io/bundlephobia/minzip/react-calendar-datetime?style=flat-square)](https://bundlephobia.com/package/react-calendar-datetime)
&nbsp;&nbsp;
[![license](https://img.shields.io/npm/l/react-calendar-datetime.svg?style=flat-square)](https://github.com/kirilinsky/react-calendar-datetime/blob/main/LICENSE)
&nbsp;&nbsp;
![axe](https://img.shields.io/badge/axe-0%20critical%20violations-brightgreen)
&nbsp;&nbsp;
![lighthouse](https://img.shields.io/badge/a11y-98%20Lighthouse-brightgreen)
&nbsp;&nbsp;
[![Storybook](https://cdn.jsdelivr.net/gh/storybookjs/brand@master/badge/badge-storybook.svg)](https://69edcfe5e2f1e060b1cce900-iprjksemvn.chromatic.com)
&nbsp;&nbsp;
[![Chromatic](https://img.shields.io/badge/chromatic-passing-brightgreen?logo=chromatic&style=flat-square)](https://www.chromatic.com/library?appId=69edcfe5e2f1e060b1cce900)
&nbsp;&nbsp;
[![Visual regression](https://img.shields.io/badge/visual%20regression-Chromatic-ff4785?style=flat-square&logo=chromatic)](https://www.chromatic.com/library?appId=69edcfe5e2f1e060b1cce900)

</div>

# React Calendar & Date/Time Picker

> ⚠️ **Beta — work in progress.**
> The API is being reshaped around a new modular composition model with CSS grid columns. Everything below is **TBD** until the first stable release.
>
> Props, module names, themes, and appearance presets may change without notice between beta versions.

---

## 📖 Documentation

The full, up-to-date API reference lives in **[DOCUMENTATION.md](./DOCUMENTATION.md)** — all components, modules, props, utility functions, and types are documented there.

Please read the docs before filing issues — the README will be rewritten once the API stabilizes.

---

## Install

```bash
npm i react-calendar-datetime
```

## Quick look

```tsx
import { Calendar, CalendarNav, CalendarDays } from "react-calendar-datetime";

<Calendar mode="single" onChange={(d) => console.log(d)}>
  <CalendarNav showMonthPicker />
  <CalendarDays />
</Calendar>;
```

See **[DOCUMENTATION.md](./DOCUMENTATION.md)** for every module and prop.

---

## Links

- 📚 [Documentation](./DOCUMENTATION.md)
- 📝 [Changelog](./CHANGELOG.md)
- 🐛 [Issues](https://github.com/kirilinsky/react-calendar-datetime/issues)
