import type { Meta, StoryObj } from "@storybook/react-vite";
import { buildConfig, D } from "../../__tests__/fixtures/builders";
import type { CalendarDate } from "../../core/calendar-date";
import { Calendar } from "../../react/calendar";
import { storyLocale, storyThemeProps } from "../_lab/story-globals";
import { CalendarDays, type DayRenderState } from "./CalendarDays";

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
