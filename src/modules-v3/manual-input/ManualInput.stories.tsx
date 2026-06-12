import type { Meta, StoryObj } from "@storybook/react";
import { buildConfig, D } from "../../__tests__/v3/fixtures/builders";
import { Calendar } from "../../react-v3/calendar";
import { storyThemeProps } from "../_lab/story-globals";
import { CalendarDays } from "../days/CalendarDays";
import { CalendarManualInput } from "./CalendarManualInput";

const meta: Meta = {
  title: "v3/ManualInput",
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
      <CalendarManualInput />
      <CalendarDays />
    </Calendar>
  ),
};

export const CustomFormat: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ mode: "single" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarManualInput format="MM/DD/YYYY" />
      <CalendarDays />
    </Calendar>
  ),
};

export const ReadOnly: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ mode: "single", readOnly: true })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarManualInput />
      <CalendarDays />
    </Calendar>
  ),
};
