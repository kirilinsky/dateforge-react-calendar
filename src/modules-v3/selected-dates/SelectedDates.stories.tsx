import type { Meta, StoryObj } from "@storybook/react";
import { buildConfig, D } from "../../__tests__/v3/fixtures/builders";
import { Calendar } from "../../react-v3/calendar";
import { CalendarDays } from "../days/CalendarDays";
import { CalendarSelectedDates } from "./CalendarSelectedDates";

const meta: Meta = {
  title: "v3/SelectedDates",
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj;

export const SingleMode: Story = {
  render: () => (
    <Calendar
      config={buildConfig({ mode: "single" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarDays />
      <CalendarSelectedDates allowClear />
    </Calendar>
  ),
};

export const MultipleMode: Story = {
  render: () => (
    <Calendar
      config={buildConfig({ mode: "multiple" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarDays />
      <CalendarSelectedDates allowClear allowClearPerChip />
    </Calendar>
  ),
};

export const RangeMode: Story = {
  render: () => (
    <Calendar
      config={buildConfig({ mode: "range" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarDays />
      <CalendarSelectedDates allowClear />
    </Calendar>
  ),
};

export const WithRemovePerChip: Story = {
  name: "Per-chip remove (multiple)",
  render: () => (
    <Calendar
      config={buildConfig({ mode: "multiple" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarDays />
      <CalendarSelectedDates allowClearPerChip />
    </Calendar>
  ),
};
