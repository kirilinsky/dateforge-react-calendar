import type { Meta, StoryObj } from "@storybook/react";
import { buildConfig, D } from "../../__tests__/v3/fixtures/builders";
import { Calendar } from "../../react-v3/calendar";
import { storyLocale, storyThemeProps } from "../_lab/story-globals";
import { CalendarDays } from "../days/CalendarDays";
import { CalendarInfo } from "./CalendarInfo";

const meta: Meta = {
  title: "v3/Info",
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj;

export const SingleMode: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ ...storyLocale(ctx.globals), mode: "single" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarDays />
      <CalendarInfo allowClear showHome emptyLabel="Pick a date" />
    </Calendar>
  ),
};

export const RangeMode: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ ...storyLocale(ctx.globals), mode: "range" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarDays />
      <CalendarInfo allowClear emptyLabel="Select a range" />
    </Calendar>
  ),
};

export const MultipleMode: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ ...storyLocale(ctx.globals), mode: "multiple" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarDays />
      <CalendarInfo allowClear emptyLabel="Select dates" />
    </Calendar>
  ),
};

/** Relative line ("in 5 days") + prefix node, localized via Intl. */
export const RelativeAndPrefix: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ ...storyLocale(ctx.globals), mode: "single" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarDays />
      <CalendarInfo showRelative prefix="📅" emptyLabel="Pick a date" />
    </Calendar>
  ),
};

/** Duration-style range summary (days + hours + minutes when times exist). */
export const DurationRange: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ ...storyLocale(ctx.globals), mode: "range" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarDays />
      <CalendarInfo rangeStyle="duration" emptyLabel="Select a range" />
    </Calendar>
  ),
};

/** Custom formatter — receives the v3 public value (same shape as onChange). */
export const CustomFormatter: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ ...storyLocale(ctx.globals), mode: "single" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarDays />
      <CalendarInfo
        emptyLabel="Pick a date"
        formatter={(value) =>
          value instanceof Date
            ? `→ ISO ${value.toISOString().slice(0, 10)}`
            : null
        }
      />
    </Calendar>
  ),
};

/** Height animation: select/clear to watch the bar collapse and expand.
 *  CSS-only (grid-template-rows 0fr→1fr), reduced-motion disables. */
export const AnimatedCollapse: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ ...storyLocale(ctx.globals), mode: "single" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarDays />
      <CalendarInfo allowClear align="center" />
    </Calendar>
  ),
};
