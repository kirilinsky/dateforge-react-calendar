import type { Meta, StoryObj } from "@storybook/react";
import { buildConfig, D } from "../../__tests__/v3/fixtures/builders";
import { Calendar } from "../../react-v3/calendar";
import { storyThemeProps } from "../_lab/story-globals";
import { CalendarDays } from "../days/CalendarDays";
import { CalendarYearsWheel } from "./CalendarYearsWheel";

const meta: Meta = {
  title: "v3/YearsWheel",
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig()}
      initialView={D(2026, 6, 1)}
    >
      <CalendarYearsWheel showLabel />
      <CalendarDays />
    </Calendar>
  ),
};

export const Bounded: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ min: D(2020, 1, 1), max: D(2030, 12, 31) })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarYearsWheel showLabel />
      <CalendarDays />
    </Calendar>
  ),
};

export const WithReset: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig()}
      initialView={D(2020, 6, 1)}
    >
      <CalendarYearsWheel showReset />
      <CalendarDays />
    </Calendar>
  ),
};
