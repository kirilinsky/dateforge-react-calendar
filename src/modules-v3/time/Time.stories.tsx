import type { Meta, StoryObj } from "@storybook/react";
import {
  buildConfig,
  D,
  point,
  span,
} from "../../__tests__/v3/fixtures/builders";
import { Calendar } from "../../react-v3/calendar";
import { storyLocale, storyThemeProps } from "../_lab/story-globals";
import { CalendarDays } from "../days/CalendarDays";
import { CalendarTimeWheel } from "./CalendarTimeWheel";

const meta: Meta = {
  title: "v3/TimeWheel",
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj;

// The wheel edits the time of an existing selection, so the demos seed one —
// without a picked day/range the wheel is intentionally inert (dimmed).

export const Default: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({
        ...storyLocale(ctx.globals),
        mode: "single",
        withTime: true,
      })}
      initialView={D(2026, 6, 1)}
      defaultSelection={point({ d: D(2026, 6, 10) })}
    >
      <CalendarDays />
      <CalendarTimeWheel />
    </Calendar>
  ),
};

export const WithSeconds: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({
        ...storyLocale(ctx.globals),
        mode: "single",
        withTime: true,
      })}
      initialView={D(2026, 6, 1)}
      defaultSelection={point({ d: D(2026, 6, 10) })}
    >
      <CalendarDays />
      <CalendarTimeWheel seconds labels="short" />
    </Calendar>
  ),
};

export const TwelveHour: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({
        ...storyLocale(ctx.globals),
        mode: "single",
        withTime: true,
      })}
      initialView={D(2026, 6, 1)}
      defaultSelection={point({ d: D(2026, 6, 10) })}
    >
      <CalendarDays />
      <CalendarTimeWheel hour12 labels="long" />
    </Calendar>
  ),
};

export const RangeBounds: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({
        ...storyLocale(ctx.globals),
        mode: "range",
        withTime: true,
      })}
      initialView={D(2026, 6, 1)}
      defaultSelection={span([[D(2026, 6, 8), D(2026, 6, 14)]])}
    >
      <CalendarDays />
      <CalendarTimeWheel bound="from" />
      <CalendarTimeWheel bound="to" />
    </Calendar>
  ),
};

export const WithReset: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({
        ...storyLocale(ctx.globals),
        mode: "single",
        withTime: true,
      })}
      initialView={D(2026, 6, 1)}
      defaultSelection={point({ d: D(2026, 6, 10) })}
    >
      <CalendarDays />
      <CalendarTimeWheel showReset />
    </Calendar>
  ),
};

export const InertWithoutSelection: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({
        ...storyLocale(ctx.globals),
        mode: "single",
        withTime: true,
      })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarDays />
      <CalendarTimeWheel />
    </Calendar>
  ),
};
