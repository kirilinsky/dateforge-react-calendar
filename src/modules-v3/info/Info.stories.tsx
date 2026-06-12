import type { Meta, StoryObj } from "@storybook/react";
import { buildConfig, D } from "../../__tests__/v3/fixtures/builders";
import { Calendar } from "../../react-v3/calendar";
import { storyThemeProps } from "../_lab/story-globals";
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
      config={buildConfig({ mode: "single" })}
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
      config={buildConfig({ mode: "range" })}
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
      config={buildConfig({ mode: "multiple" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarDays />
      <CalendarInfo allowClear emptyLabel="Select dates" />
    </Calendar>
  ),
};
