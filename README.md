<div align="center">

[![react version](https://img.shields.io/badge/react-%5E18.0.0%20%7C%7C%20%5E19.0.0-61dafb?style=flat-square&logo=react)](https://react.dev/)
&nbsp;&nbsp;
[![npm downloads](https://img.shields.io/npm/dm/react-calendar-datetime.svg?style=flat-square)](https://www.npmjs.com/package/react-calendar-datetime)
&nbsp;&nbsp;
![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square)
&nbsp;&nbsp;
![themes](https://img.shields.io/badge/themes-20-orange?style=flat-square)
&nbsp;&nbsp;
[![bundle size](https://img.shields.io/bundlephobia/minzip/react-calendar-datetime?style=flat-square)](https://bundlephobia.com/package/react-calendar-datetime)
&nbsp;&nbsp;
[![license](https://img.shields.io/npm/l/react-calendar-datetime.svg?style=flat-square)](https://github.com/kirilinsky/react-calendar-datetime/blob/main/LICENSE)

</div>

# React Calendar & Date/Time Picker

Ultra-lightweight Date & Time picker for React — zero dependencies, fluid adaptive layout, 20 themes.

<div align="center">
  <table style="border: none; border-collapse: collapse;">
    <tr style="border: none;">
      <td align="center" style="border: none; padding: 4px;">
        <p><b>Paper (light theme)</b></p>
        <img src="https://i.ibb.co/1fRLgr4j/image.png" alt="Paper theme" height="300" />
      </td>
      <td align="center" style="border: none; padding: 4px;">
        <p><b>Carbon + gradient</b></p>
        <img src="https://i.ibb.co/zH7XjwDC/image.png" alt="Carbon theme" height="300" />
      </td>
      <td align="center" style="border: none; padding: 4px;">
        <p><b>Industrial + brutalism</b></p>
        <img src="https://i.ibb.co/k6sQG8jR/image.png" alt="Brutalism mode" height="300" />
      </td>
    </tr>
  </table>

  <br /> 
  <a href="https://calendar-demo-pi.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-Try%20it%20Out-60d276?style=for-the-badge&logo=rocket&logoColor=white" alt="Live Demo" />
  </a>
  &nbsp;&nbsp;
  <a href="https://calendar-demo-pi.vercel.app/doc" target="_blank">
    <img src="https://img.shields.io/badge/Documentation-View%20Docs-3559e0?style=for-the-badge&logo=read-the-docs&logoColor=white" alt="Documentation" />
  </a>
</div>

---

## Features

- ⚡ **Zero dependencies** — no moment, dayjs, or date-fns
- 📦 **~10kb gzipped** — styles included
- 🌎 **200+ locales** — native `Intl` API, no extra bytes
- 🎨 **20 themes** — dark & light, with optional gradient overlay
- 📐 **Fluid layout** — adapts to any container width, smart font scaling
- 🛠️ **Modular** — toggle time, presets, month grid, week numbers, two-months view
- 📅 **Range & multi-select** — live hover preview, range highlight, chips panel
- 👆 **Gesture support** — swipe to change months, swipe time tracks
- 🗓️ **Two-months layout** — side-by-side months, auto-stacks on narrow containers

---

## Install

```bash
npm i react-calendar-datetime
```

---

## Usage

### Single date

```tsx
import { Calendar } from "react-calendar-datetime";

const App = () => {
  const [date, setDate] = useState(new Date());

  return (
    <Calendar
      value={date}
      // called with Date on select, null when user clicks the same date again to deselect
      onChange={(d) => {
        if (d) setDate(d);
      }}
    />
  );
};
```

### Date range

<img src="https://i.ibb.co/G4H5h24r/Date-Range.png" alt="Date range mode" />

First click sets `from`, hover shows a live preview, second click sets `to`. Clicking `from` again resets both. While picking the end date `to` is `null`; on reset both are `null`.

<img src="https://i.ibb.co/gZfxYFkX/image.png" alt="range mode" width="400" />

### Multi-select

<img src="https://i.ibb.co/5ZZ8CGx/Multiple-Dates.png" alt="multiple range mode" />

Clicking a selected date deselects it. When `max` is reached further clicks are ignored.

<img src="https://i.ibb.co/8gjrCGhr/image.png" alt="multiple range mode" width="400" />

### Two-months layout

<img src="https://i.ibb.co/C3qX9C46/Two-Moths-Layout.png" alt="Two-months" width="400" />

`Automatically stacks to single-column below ~540 px container width.`

<table style="border: none; border-collapse: collapse;">
    <tr style="border: none;">
      <td align="center" style="border: none; padding: 4px;">
        <p><b>Two-months layout WIDE</b></p>
      <img src="https://i.ibb.co/GQK90Z4g/image.png" alt="Two-months layout WIDE" width="460" />
      </td>
      <td align="center" style="border: none; padding: 4px;">
        <p><b>Two-months layout STACKED</b></p>
        <img src="https://i.ibb.co/HTkgs4qr/image.png" alt="Two-months layout STACKED" width="320" />
      </td> 
    </tr>
  </table>

---

## Props

### Data & callbacks

| Prop            | Type                                                        | Default   | Description                                                                 |
| :-------------- | :---------------------------------------------------------- | :-------- | :-------------------------------------------------------------------------- |
| `value`         | `Date \| Date[] \| DateRange`                               | —         | Single: `Date`, multi: `Date[]`, range: `{ from, to }`                      |
| `onChange`      | `(date: Date \| null) => void`                              | —         | Single mode: fires on select / deselect                                     |
| `onDatesChange` | `(dates: Date[]) => void`                                   | —         | Multi-select mode: fires with updated selection array                       |
| `onRangeChange` | `(range: { from: Date \| null; to: Date \| null }) => void` | —         | Range mode: fires on each click; `to` is `null` while end is not yet picked |
| `startDate`     | `Date`                                                      | —         | Minimum selectable/navigable date                                           |
| `endDate`       | `Date`                                                      | —         | Maximum selectable/navigable date                                           |
| `startMonth`    | `Date`                                                      | —         | Initial month to display (does not select a date)                           |
| `locale`        | `string`                                                    | `'en'`    | BCP 47 locale tag                                                           |
| `theme`         | `CalendarTheme`                                             | `'paper'` | See [Themes](#themes)                                                       |
| `width`         | `string \| number`                                          | `'100%'`  | Any CSS width value                                                         |
| `startOfWeek`   | `0–6`                                                       | `1`       | Week start: `0` = Sun, `1` = Mon …                                          |
| `disabled`      | `DisabledRule`                                              | —         | See [Disabled Dates](#disabled-dates)                                       |

### Selection modes

| Prop                | Type                                | Default    | Description                                                                      |
| :------------------ | :---------------------------------- | :--------- | :------------------------------------------------------------------------------- |
| `mode`              | `'single' \| 'multiple' \| 'range'` | `'single'` | Selection mode                                                                   |
| `max`               | `number`                            | —          | `mode="multiple"` only — caps the number of selectable dates; omit for unlimited |
| `rangeMinDays`      | `number`                            | —          | `mode="range"` only — minimum span in days; shorter selections are blocked       |
| `rangeMaxDays`      | `number`                            | —          | `mode="range"` only — maximum span in days; days beyond the limit are blocked    |
| `showSelectedDates` | `boolean`                           | `false`    | Panel showing selected dates / range below calendar                              |

### Layout modules

| Prop              | Type      | Default | Description                                                                                                                     |
| :---------------- | :-------- | :------ | :------------------------------------------------------------------------------------------------------------------------------ |
| `twoMonthsLayout` | `boolean` | `false` | Show current + next month side by side. Stacks on narrow screens                                                                |
| `time`            | `boolean` | `true`  | Time button in header (opens time popup)                                                                                        |
| `timeGrid`        | `boolean` | `false` | Full-size time picker panel alongside the calendar                                                                              |
| `months`          | `boolean` | `true`  | Month navigation arrows in header                                                                                               |
| `years`           | `boolean` | `false` | Year navigation arrows in header                                                                                                |
| `monthsGrid`      | `boolean` | `false` | Full-size month-grid panel alongside the calendar                                                                               |
| `compactMonths`   | `boolean` | `false` | Compact month dropdown button in header                                                                                         |
| `compactYears`    | `boolean` | `true`  | Compact year dropdown button in header                                                                                          |
| `monthsColumn`    | `boolean` | `false` | Stack months vertically for two-months layout                                                                                   |
| `presets`         | `boolean` | `false` | Quick-select presets (Today, Tomorrow, Next week…)                                                                              |
| `showWeekNumber`  | `boolean` | `false` | ISO week numbers alongside each row                                                                                             |
| `showHomeButton`  | `boolean` | `false` | Home button in header — active when viewing any month other than the current one; click navigates back without selecting a date |
| `showClearButton` | `boolean` | `false` | Clear button in header — active when any date is selected; click clears the entire selection (single, multi, or range)          |

<img src="https://i.ibb.co/6cQcpgnt/image.png" alt="modular" width="460" />

### Appearance

| Prop                | Type      | Default | Description                                                   |
| :------------------ | :-------- | :------ | :------------------------------------------------------------ |
| `gradient`          | `boolean` | `false` | Subtle radial gradient tinted by active theme                 |
| `brutalism`         | `boolean` | `false` | Brutalism aesthetic — monospace font, hard borders, no radius |
| `hour12`            | `boolean` | `false` | 12-hour AM/PM format for time picker                          |
| `highlightWeekends` | `boolean` | `true`  | Highlight Saturday and Sunday weekday                         |
| `shortMonths`       | `boolean` | `false` | Abbreviated month names (Jan, Feb…)                           |

### Visibility

| Prop           | Type      | Default | Description                                                 |
| :------------- | :-------- | :------ | :---------------------------------------------------------- |
| `hideLimited`  | `boolean` | `false` | Hide dates outside `startDate`/`endDate` instead of dimming |
| `hideDisabled` | `boolean` | `false` | Hide disabled dates entirely instead of striking through    |
| `hideWeekdays` | `boolean` | `false` | Hide the weekday header row (Mon Tue Wed…)                  |

### Input

| Prop       | Type      | Default | Description                                                 |
| :--------- | :-------- | :------ | :---------------------------------------------------------- |
| `gestures` | `boolean` | `true`  | Swipe left/right on days to change month; swipe time tracks |

---

## Disabled Dates

Rules can be combined into an array — all matching rules are applied.

<img src="https://i.ibb.co/GvWThVQR/Disabled-rules.png" alt="Disabled Dates" />

`hideDisabled` removes disabled days from the grid entirely instead of striking them through. `hideLimited` does the same for date limits: outside `startDate`/`endDate`.

---

## Themes

20 built-in themes via the `theme` prop. Swatches show **background · accent** colors.

<img src="https://i.ibb.co/PZMb2k02/theme.png" alt="Themes" />

| 🌑 Dark                                                                                                                                                              | ☀️ Light                                                                                                                                                           |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <img src="https://placehold.co/13x13/1a1a1c/1a1a1c.png" valign="middle"/> <img src="https://placehold.co/13x13/ffffff/ffffff.png" valign="middle"/> **`carbon`**     | <img src="https://placehold.co/13x13/ffffff/ffffff.png" valign="middle"/> <img src="https://placehold.co/13x13/1a1a1c/1a1a1c.png" valign="middle"/> **`paper`**    |
| <img src="https://placehold.co/13x13/0d0909/0d0909.png" valign="middle"/> <img src="https://placehold.co/13x13/f92f2f/f92f2f.png" valign="middle"/> **`crimson`**    | <img src="https://placehold.co/13x13/f5f3f7/f5f3f7.png" valign="middle"/> <img src="https://placehold.co/13x13/681c9e/681c9e.png" valign="middle"/> **`amethyst`** |
| <img src="https://placehold.co/13x13/07070b/07070b.png" valign="middle"/> <img src="https://placehold.co/13x13/00f3ff/00f3ff.png" valign="middle"/> **`cyber`**      | <img src="https://placehold.co/13x13/f8f9fc/f8f9fc.png" valign="middle"/> <img src="https://placehold.co/13x13/60d276/60d276.png" valign="middle"/> **`mint`**     |
| <img src="https://placehold.co/13x13/1a1e2b/1a1e2b.png" valign="middle"/> <img src="https://placehold.co/13x13/3559e0/3559e0.png" valign="middle"/> **`midnight`**   | <img src="https://placehold.co/13x13/fef0f4/fef0f4.png" valign="middle"/> <img src="https://placehold.co/13x13/d64c7f/d64c7f.png" valign="middle"/> **`rosa`**     |
| <img src="https://placehold.co/13x13/010401/010401.png" valign="middle"/> <img src="https://placehold.co/13x13/76ff03/76ff03.png" valign="middle"/> **`phosphor`**   | <img src="https://placehold.co/13x13/e2e5e9/e2e5e9.png" valign="middle"/> <img src="https://placehold.co/13x13/3a60d6/3a60d6.png" valign="middle"/> **`snow`**     |
| <img src="https://placehold.co/13x13/1f1c18/1f1c18.png" valign="middle"/> <img src="https://placehold.co/13x13/e3ae5c/e3ae5c.png" valign="middle"/> **`sandstone`**  | <img src="https://placehold.co/13x13/fffbe8/fffbe8.png" valign="middle"/> <img src="https://placehold.co/13x13/e67e22/e67e22.png" valign="middle"/> **`solar`**    |
| <img src="https://placehold.co/13x13/1c1111/1c1111.png" valign="middle"/> <img src="https://placehold.co/13x13/ff5e5e/ff5e5e.png" valign="middle"/> **`dracula`**    | <img src="https://placehold.co/13x13/f2e8e0/f2e8e0.png" valign="middle"/> <img src="https://placehold.co/13x13/c04e2f/c04e2f.png" valign="middle"/> **`comfy`**    |
| <img src="https://placehold.co/13x13/14252e/14252e.png" valign="middle"/> <img src="https://placehold.co/13x13/27d1f4/27d1f4.png" valign="middle"/> **`temporal`**   | <img src="https://placehold.co/13x13/f7f8f9/f7f8f9.png" valign="middle"/> <img src="https://placehold.co/13x13/80ec27/80ec27.png" valign="middle"/> **`neon`**     |
| <img src="https://placehold.co/13x13/111111/111111.png" valign="middle"/> <img src="https://placehold.co/13x13/e85d00/e85d00.png" valign="middle"/> **`industrial`** | <img src="https://placehold.co/13x13/f7f8f9/f7f8f9.png" valign="middle"/> <img src="https://placehold.co/13x13/f1a01d/f1a01d.png" valign="middle"/> **`graphite`** |
| <img src="https://placehold.co/13x13/0f2016/0f2016.png" valign="middle"/> <img src="https://placehold.co/13x13/4ade80/4ade80.png" valign="middle"/> **`forest`**     | <img src="https://placehold.co/13x13/faf8f4/faf8f4.png" valign="middle"/> <img src="https://placehold.co/13x13/6f3d18/6f3d18.png" valign="middle"/> **`latte`**    |

Each theme exposes CSS custom properties you can override:

| Variable | Role               |
| :------- | :----------------- |
| `--c-b`  | Background         |
| `--c-h`  | Accent / highlight |
| `--c-c`  | Text               |
| `--c-s`  | Border / separator |

> `gradient` adds a radial tint tuned to each theme's accent color.

<a href="https://calendar-demo-pi.vercel.app/?step=3" target="_blank">
  <img src="https://img.shields.io/badge/Themes%20Playground-Try%20it%20Out-60d276?style=for-the-badge&logo=paint-format&logoColor=white" alt="Themes playground" />
</a>

---

## Localization

Powered by the native **Intl API** — 200+ BCP 47 locales, zero extra bytes.

```tsx
<Calendar locale="de" />     // Deutsch
<Calendar locale="zh-CN" />  // 中文
<Calendar locale="ar-SA" />  // العربية
<Calendar locale="ja" />     // 日本語
```

Days, months, date labels, and range separators all follow local standards automatically.

---

## Changelog

[**CHANGELOG.md**](https://github.com/kirilinsky/react-calendar-datetime/blob/main/CHANGELOG.md)

## Roadmap

- [ ] Full accessibility — keyboard navigation, ARIA roles (`grid`, `gridcell`, `dialog`), screen reader announcements, focus management in popups
- [ ] Custom presets via prop
- [ ] Custom theme API
- [ ] Holiday markers with labels
- [ ] Week Selection mode
- [ ] RTL support
