import type { Meta, StoryObj } from "@storybook/react-vite";
import { buildConfig, D } from "../../__tests__/v3/fixtures/builders";
import { Calendar } from "../../react-v3/calendar";
import { storyLocale, storyThemeProps } from "../_lab/story-globals";
import { CalendarDays } from "../days/CalendarDays";
import { CalendarMonthsWheel } from "./CalendarMonthsWheel";

const meta: Meta = {
  title: "v3/MonthsWheel",
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ ...storyLocale(ctx.globals) })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarMonthsWheel />
      <CalendarDays />
    </Calendar>
  ),
};

export const ShortWithLabel: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ ...storyLocale(ctx.globals) })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarMonthsWheel shortMonths showLabel />
      <CalendarDays />
    </Calendar>
  ),
};

export const WithReset: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ ...storyLocale(ctx.globals) })}
      initialView={D(2026, 2, 1)}
    >
      <CalendarMonthsWheel showReset />
      <CalendarDays />
    </Calendar>
  ),
};
