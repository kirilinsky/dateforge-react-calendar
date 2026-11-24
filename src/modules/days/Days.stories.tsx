import type { Meta, StoryObj } from "@storybook/react-vite";
import { buildConfig, D } from "../../__tests__/fixtures/builders";
import type { CalendarDate } from "../../core/calendar-date";
import { Calendar } from "../../react/calendar";
import { createTheme } from "../../styles/theme-tokens";
import { storyLocale, storyThemeProps } from "../_lab/story-globals";
import { CalendarDays, type DayRenderState } from "./CalendarDays";

/** A `createTheme` family handed straight to a module's `theme` prop. */
const brandTheme = createTheme({
  accent: "#7c5cff",
  light: { backdrop: "#f7f5ff", text: "#241a4d", tone: "#ece7ff" },
  dark: { backdrop: "#161029", text: "#e6e0ff", tone: "#241a4d" },
});

const meta: Meta = {
  title: "Days",
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ ...storyLocale(ctx.globals), mode: "range" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarDays />
    </Calendar>
  ),
};

/** Today layers: dot only / outline only / bare. */
export const TodayMarkers: Story = {
  render: (_, ctx) => (
    <div style={{ display: "grid", gap: 16 }}>
      <Calendar
        {...storyThemeProps(ctx.globals)}
        config={buildConfig({ ...storyLocale(ctx.globals), mode: "single" })}
      >
        <CalendarDays highlightToday={false} />
      </Calendar>
      <Calendar
        {...storyThemeProps(ctx.globals)}
        config={buildConfig({ ...storyLocale(ctx.globals), mode: "single" })}
      >
        <CalendarDays todayDot={false} highlightToday />
      </Calendar>
    </div>
  ),
};

export const WeekNumbersAndBoldWeekends: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ ...storyLocale(ctx.globals), mode: "single" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarDays weekNumbers boldWeekends weekdayFormat="narrow" />
    </Calendar>
  ),
};

/**
 * Weekend styling axes:
 * 1. Default — tinted weekday HEADERS only (`weekendHeaders`, on by default);
 *    no cell background.
 * 2. `highlightWeekends` — opt-in column BACKGROUND strip down the weekend days.
 * 3. `weekendDays: [5, 6]` + background — a Fri/Sat (MENA-style) week.
 * 4. `weekendHeaders={false}` — no weekend cue at all.
 */
export const WeekendStyling: Story = {
  render: (_, ctx) => (
    <div style={{ display: "grid", gap: 16 }}>
      <Calendar
        {...storyThemeProps(ctx.globals)}
        config={buildConfig({ ...storyLocale(ctx.globals), mode: "single" })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarDays />
      </Calendar>
      <Calendar
        {...storyThemeProps(ctx.globals)}
        config={buildConfig({ ...storyLocale(ctx.globals), mode: "single" })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarDays highlightWeekends />
      </Calendar>
      <Calendar
        {...storyThemeProps(ctx.globals)}
        config={buildConfig({
          ...storyLocale(ctx.globals),
          mode: "single",
          weekendDays: [5, 6],
        })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarDays highlightWeekends />
      </Calendar>
      <Calendar
        {...storyThemeProps(ctx.globals)}
        config={buildConfig({ ...storyLocale(ctx.globals), mode: "single" })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarDays weekendHeaders={false} />
      </Calendar>
    </div>
  ),
};

export const CompactNoOutside: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ ...storyLocale(ctx.globals), mode: "single" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarDays
        showOutsideDays={false}
        fixedWeeks={false}
        hideWeekdays
        highlightWeekends={false}
      />
    </Calendar>
  ),
};

/** Two months side by side: primary grid + offset grid. */
export const TwoMonths: Story = {
  render: (_, ctx) => (
    <div style={{ width: 560 }}>
      <Calendar
        {...storyThemeProps(ctx.globals)}
        config={buildConfig({ ...storyLocale(ctx.globals), mode: "range" })}
        initialView={D(2026, 6, 1)}
      >
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <CalendarDays />
          <CalendarDays offset={1} />
        </div>
      </Calendar>
    </div>
  ),
};

// Module-level renderer — stable reference, cells stay memoized.
const priceDay = (date: CalendarDate, state: DayRenderState) => (
  <span style={{ display: "grid", lineHeight: 1.2, padding: "0.15em 0" }}>
    <span>{date.day}</span>
    {!state.outside && (
      <span style={{ fontSize: "0.6em", opacity: 0.7 }}>
        ${90 + ((date.day * 7) % 60)}
      </span>
    )}
  </span>
);

/** Custom cell content (prices) — shell, keyboard and aria stay built-in. */
export const RenderDayPrices: Story = {
  // The built-in date aria-label names the cell; extra renderDay content
  // (the price) is not part of it, which axe flags as Label in Name.
  // Tracked as a follow-up (renderDay accessible-name API).
  parameters: {
    a11y: {
      config: {
        rules: [{ id: "label-content-name-mismatch", enabled: false }],
      },
    },
  },
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ ...storyLocale(ctx.globals), mode: "range" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarDays renderDay={priceDay} />
    </Calendar>
  ),
};

/**
 * Per-module theming, both forms. The left grid takes a built-in family NAME
 * (rides on `data-theme`); the right one takes a `createTheme` token OBJECT
 * (inline `--c-*` vars, `light-dark()` values). A module that declares a theme
 * or a `scheme` paints its own backdrop, so a dark-schemed module stays
 * readable inside a light root.
 */
export const PerModuleTheme: Story = {
  render: (_, ctx) => (
    <div style={{ display: "grid", gap: 16, gridAutoFlow: "column" }}>
      <Calendar
        {...storyThemeProps(ctx.globals)}
        config={buildConfig({ ...storyLocale(ctx.globals), mode: "single" })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarDays theme="espresso" />
      </Calendar>
      <Calendar
        {...storyThemeProps(ctx.globals)}
        config={buildConfig({ ...storyLocale(ctx.globals), mode: "single" })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarDays theme={brandTheme} scheme="dark" />
      </Calendar>
    </div>
  ),
  // Cascade check — invisible to happy-dom, so it lives in the browser project:
  // a module-level `scheme` must narrow `color-scheme` (otherwise every
  // light-dark() token silently resolves to the light side) and the module must
  // paint its own backdrop.
  play: ({ canvasElement }) => {
    const grids = canvasElement.querySelectorAll("[data-dateforge-days]");
    const dark = grids[1] as HTMLElement;
    const cs = getComputedStyle(dark);
    if (cs.colorScheme !== "dark")
      throw new Error(
        `module scheme did not narrow color-scheme: ${cs.colorScheme}`,
      );
    if (cs.backgroundColor !== "rgb(22, 16, 41)")
      throw new Error(
        `module theme did not paint its backdrop: ${cs.backgroundColor}`,
      );
  },
};
