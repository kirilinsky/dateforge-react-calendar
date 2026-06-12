import type { Meta, StoryObj } from "@storybook/react";
import { buildConfig, D } from "../../__tests__/v3/fixtures/builders";
import { Calendar } from "../../react-v3/calendar";
import { CalendarDays } from "../days/CalendarDays";
import { CalendarYearsGrid } from "./CalendarYearsGrid";

const meta: Meta = {
  title: "v3/YearsGrid",
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Calendar config={buildConfig()} initialView={D(2026, 6, 1)}>
      <CalendarDays />
      <CalendarYearsGrid />
    </Calendar>
  ),
};

export const NoControls: Story = {
  render: () => (
    <Calendar config={buildConfig()} initialView={D(2026, 6, 1)}>
      <CalendarYearsGrid showControls={false} />
    </Calendar>
  ),
};

export const WithMinMax: Story = {
  render: () => (
    <Calendar
      config={buildConfig({ min: D(2020, 1, 1), max: D(2030, 12, 31) })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarYearsGrid />
    </Calendar>
  ),
};
