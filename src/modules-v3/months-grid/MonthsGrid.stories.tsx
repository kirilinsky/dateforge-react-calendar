import type { Meta, StoryObj } from "@storybook/react";
import { buildConfig, D } from "../../__tests__/v3/fixtures/builders";
import { Calendar } from "../../react-v3/calendar";
import { storyThemeProps } from "../_lab/story-globals";
import { CalendarMonthsGrid } from "./CalendarMonthsGrid";

const meta: Meta = {
  title: "v3/MonthsGrid",
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ mode: "single" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarMonthsGrid />
    </Calendar>
  ),
};

export const ShortLabels: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ mode: "single" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarMonthsGrid short />
    </Calendar>
  ),
};

export const RangeMode: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ mode: "range" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarMonthsGrid />
    </Calendar>
  ),
};
