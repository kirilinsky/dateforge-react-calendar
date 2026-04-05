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
        <p><b>Paper (light)</b></p>
        <img src="https://i.ibb.co/NnrpfTsx/image.png" alt="Paper theme" height="300" />
      </td>
      <td align="center" style="border: none; padding: 4px;">
        <p><b>Carbon + gradient</b></p>
        <img src="https://iili.io/BHP0U0u.md.png" alt="Carbon theme" height="300" />
      </td>
      <td align="center" style="border: none; padding: 4px;">
        <p><b>Industrial + brutalism</b></p>
        <img src="https://i.ibb.co/d4JBjwy0/image.png" alt="Brutalism mode" height="300" />
      </td>
    </tr>
  </table>

  <br />

  <a href="https://calendar-demo-pi.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-Try%20it%20Out-60d276?style=for-the-badge&logo=rocket&logoColor=white" alt="Live Demo" />
  </a>
</div>

---

## Features

- ⚡ **Zero dependencies** — no moment, dayjs, or date-fns
- 📦 **~7kb gzipped** — styles included
- 🌎 **400+ locales** — native `Intl` API, no extra bytes
- 🎨 **20 themes** — dark & light, with optional gradient overlay
- 📐 **Fluid layout** — adapts to any container width, smart font scaling
- 🛠️ **Modular** — toggle time, presets, month grid, week numbers, two-months view
- 📅 **Range & multi-select** — live hover preview, range highlight, chips panel
- 👆 **Gesture support** — swipe to change months, swipe time tracks

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
      date={date}
      onChangeDate={(d) => { if (d instanceof Date) setDate(d); }}
    />
  );
};
```

### Date range

```tsx
const App = () => {
  const [range, setRange] = useState<Date[]>([]);
  return (
    <Calendar
      range
      showSelectedDates
      date={range}
      onChangeDate={(d) => {
        if (!d) setRange([]);
        else if (Array.isArray(d)) setRange(d);   // [start, end] when complete
        else setRange([d]);                        // [start] while picking end
      }}
    />
  );
};
```

First click sets start, hover shows live preview, second click confirms end. Clicking start again resets. `onChangeDate` fires `[start, end]` on completion, `null` on reset.

<!-- SCREENSHOT: Range picker, ~420px wide, theme: paper, months=true, time=false, presets=false, range selected spanning 2 weeks with blue fill, showSelectedDates showing "Apr 1 – Apr 14, 2026" chip below -->

### Multi-select

```tsx
const App = () => {
  const [dates, setDates] = useState<Date[]>([]);
  return (
    <Calendar
      date={dates}
      multiselect={3}        // or true for unlimited
      showSelectedDates
      onChangeDate={(d) => { if (Array.isArray(d)) setDates(d); }}
    />
  );
};
```

<!-- SCREENSHOT: Multi-select, ~380px wide, theme: mint, multiselect=3, 3 dates selected shown as connected pills, showSelectedDates panel visible below -->

### Two-months layout

```tsx
<Calendar
  twoMonthsLayout
  months
  time={false}
  presets={false}
/>
```

Shows current and next month side by side. Switches to stacked single-column below ~540px.

<!-- SCREENSHOT: Two-months layout WIDE — ~680px, theme: paper, twoMonthsLayout=true, months=true, time=false, header shows "April 2026  May 2026" with arrows, two day grids side by side, one date selected -->
<!-- SCREENSHOT: Two-months layout STACKED — ~400px, same props, single-column with "May 2026" label between the two grids -->

---

## Props

### Data & callbacks

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `date` | `Date \| Date[]` | — | Selected date, array of dates (multi), or `[start, end]` (range) |
| `onChangeDate` | `(d: Date \| Date[] \| null) => void` | — | Fires on selection |
| `startDate` | `Date` | — | Minimum selectable/navigable date |
| `endDate` | `Date` | — | Maximum selectable/navigable date |
| `startMonth` | `Date` | — | Initial month to display (does not select a date) |
| `locale` | `string` | `'en'` | BCP 47 locale tag |
| `theme` | `CalendarTheme` | `'paper'` | See [Themes](#themes) |
| `width` | `string \| number` | `'100%'` | Any CSS width value |
| `startOfWeek` | `0–6` | `1` | Week start: `0` = Sun, `1` = Mon … |
| `disabled` | `DisabledRule` | — | See [Disabled Dates](#disabled-dates) |

### Selection modes

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `multiselect` | `number \| boolean` | — | Multi-select mode. Number caps selections, `true` = unlimited |
| `range` | `boolean` | `false` | Range mode with live hover preview |
| `showSelectedDates` | `boolean` | `false` | Panel showing selected dates / range below calendar |

### Layout modules

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `twoMonthsLayout` | `boolean` | `false` | Show current + next month side by side. Stacks on narrow screens |
| `time` | `boolean` | `true` | Time button in header (opens time popup) |
| `timeGrid` | `boolean` | `false` | Full-size time picker panel alongside the calendar |
| `months` | `boolean` | `true` | Month navigation arrows in header |
| `years` | `boolean` | `false` | Year navigation arrows in header |
| `monthsGrid` | `boolean` | `false` | Full-size month-grid panel alongside the calendar |
| `compactMonths` | `boolean` | `false` | Compact month dropdown button in header |
| `compactYears` | `boolean` | `true` | Compact year dropdown button in header |
| `monthsColumn` | `boolean` | `false` | Stack months grid and time grid vertically |
| `presets` | `boolean` | `false` | Quick-select presets (Today, Tomorrow, Next week…) |
| `showWeekNumber` | `boolean` | `false` | ISO week numbers alongside each row |

<!-- SCREENSHOT: Modules — wide layout ~780px, theme: midnight, monthsGrid=true, timeGrid=true, presets=true, months=true, compactYears=true — showing full grid with presets row at bottom, month panel on left, time panel on right -->

### Appearance

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `gradient` | `boolean` | `false` | Subtle radial gradient tinted by active theme |
| `brutalism` | `boolean` | `false` | Brutalism aesthetic — monospace font, hard borders, no radius |
| `hour12` | `boolean` | `false` | 12-hour AM/PM format for time picker |
| `highlightWeekends` | `boolean` | `true` | Highlight Saturday and Sunday |
| `shortMonths` | `boolean` | `false` | Abbreviated month names (Jan, Feb…) |

### Visibility

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `hideLimited` | `boolean` | `false` | Hide dates outside `startDate`/`endDate` instead of dimming |
| `hideDisabled` | `boolean` | `false` | Hide disabled dates entirely instead of striking through |
| `hideWeekdays` | `boolean` | `false` | Hide the weekday header row (Mon Tue Wed…) |

### Input

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `gestures` | `boolean` | `true` | Swipe left/right on days to change month; swipe time tracks |

---

## Disabled Dates

```tsx
// All dates
<Calendar disabled={true} />

// Single date
<Calendar disabled={new Date("2025-12-25")} />

// Array of dates
<Calendar disabled={[new Date("2025-01-01"), new Date("2025-12-31")]} />

// Date range
<Calendar disabled={{ from: new Date("2025-06-01"), to: new Date("2025-06-30") }} />

// Specific weekdays (0=Sun … 6=Sat)
<Calendar disabled={{ dayOfWeek: [0, 6] }} />

// Before / after (also locks header navigation)
<Calendar disabled={{ before: new Date("2025-03-01"), after: new Date("2025-12-31") }} />
```

`hideDisabled` removes disabled days from the grid. `hideLimited` does the same for dates outside `startDate`/`endDate`.

---

## Themes

20 built-in themes via the `theme` prop. Swatches show **background · accent** colors.

<!-- SCREENSHOT: Theme grid — composite image or single wide strip showing all 20 themes as small calendar thumbnails, ~100px each, 5 per row or similar layout -->

<img src="https://i.ibb.co/PZMb2k02/theme.png" alt="Themes" />

| 🌑 Dark | ☀️ Light |
| :--- | :--- |
| <img src="https://placehold.co/13x13/1a1a1c/1a1a1c.png" valign="middle"/> <img src="https://placehold.co/13x13/ffffff/ffffff.png" valign="middle"/> **`carbon`** | <img src="https://placehold.co/13x13/ffffff/ffffff.png" valign="middle"/> <img src="https://placehold.co/13x13/1a1a1c/1a1a1c.png" valign="middle"/> **`paper`** |
| <img src="https://placehold.co/13x13/0d0909/0d0909.png" valign="middle"/> <img src="https://placehold.co/13x13/f92f2f/f92f2f.png" valign="middle"/> **`crimson`** | <img src="https://placehold.co/13x13/f5f3f7/f5f3f7.png" valign="middle"/> <img src="https://placehold.co/13x13/681c9e/681c9e.png" valign="middle"/> **`amethyst`** |
| <img src="https://placehold.co/13x13/07070b/07070b.png" valign="middle"/> <img src="https://placehold.co/13x13/00f3ff/00f3ff.png" valign="middle"/> **`cyber`** | <img src="https://placehold.co/13x13/f8f9fc/f8f9fc.png" valign="middle"/> <img src="https://placehold.co/13x13/60d276/60d276.png" valign="middle"/> **`mint`** |
| <img src="https://placehold.co/13x13/1a1e2b/1a1e2b.png" valign="middle"/> <img src="https://placehold.co/13x13/3559e0/3559e0.png" valign="middle"/> **`midnight`** | <img src="https://placehold.co/13x13/fef0f4/fef0f4.png" valign="middle"/> <img src="https://placehold.co/13x13/d64c7f/d64c7f.png" valign="middle"/> **`rosa`** |
| <img src="https://placehold.co/13x13/010401/010401.png" valign="middle"/> <img src="https://placehold.co/13x13/76ff03/76ff03.png" valign="middle"/> **`phosphor`** | <img src="https://placehold.co/13x13/e2e5e9/e2e5e9.png" valign="middle"/> <img src="https://placehold.co/13x13/3a60d6/3a60d6.png" valign="middle"/> **`snow`** |
| <img src="https://placehold.co/13x13/1f1c18/1f1c18.png" valign="middle"/> <img src="https://placehold.co/13x13/e3ae5c/e3ae5c.png" valign="middle"/> **`sandstone`** | <img src="https://placehold.co/13x13/fffbe8/fffbe8.png" valign="middle"/> <img src="https://placehold.co/13x13/e67e22/e67e22.png" valign="middle"/> **`solar`** |
| <img src="https://placehold.co/13x13/1c1111/1c1111.png" valign="middle"/> <img src="https://placehold.co/13x13/ff5e5e/ff5e5e.png" valign="middle"/> **`dracula`** | <img src="https://placehold.co/13x13/f2e8e0/f2e8e0.png" valign="middle"/> <img src="https://placehold.co/13x13/c04e2f/c04e2f.png" valign="middle"/> **`comfy`** |
| <img src="https://placehold.co/13x13/14252e/14252e.png" valign="middle"/> <img src="https://placehold.co/13x13/27d1f4/27d1f4.png" valign="middle"/> **`temporal`** | <img src="https://placehold.co/13x13/f7f8f9/f7f8f9.png" valign="middle"/> <img src="https://placehold.co/13x13/80ec27/80ec27.png" valign="middle"/> **`neon`** |
| <img src="https://placehold.co/13x13/111111/111111.png" valign="middle"/> <img src="https://placehold.co/13x13/e85d00/e85d00.png" valign="middle"/> **`industrial`** | <img src="https://placehold.co/13x13/f7f8f9/f7f8f9.png" valign="middle"/> <img src="https://placehold.co/13x13/f1a01d/f1a01d.png" valign="middle"/> **`graphite`** |
| <img src="https://placehold.co/13x13/0f2016/0f2016.png" valign="middle"/> <img src="https://placehold.co/13x13/4ade80/4ade80.png" valign="middle"/> **`forest`** | <img src="https://placehold.co/13x13/faf8f4/faf8f4.png" valign="middle"/> <img src="https://placehold.co/13x13/6f3d18/6f3d18.png" valign="middle"/> **`latte`** |

> `gradient` adds a radial tint tuned to each theme's accent color.

<a href="https://calendar-demo-pi.vercel.app/?step=3" target="_blank">
  <img src="https://img.shields.io/badge/Themes%20Playground-Try%20it%20Out-60d276?style=for-the-badge&logo=paint-format&logoColor=white" alt="Themes playground" />
</a>

---

## Localization

Powered by the native **Intl API** — 400+ BCP 47 locales, zero extra bytes.

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

- [ ] Custom presets via prop
- [ ] Custom theme API
- [ ] Holiday markers with labels
- [ ] RTL support
