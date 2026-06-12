import type { Meta, StoryObj } from "@storybook/react";
import { buildConfig, D } from "../../__tests__/v3/fixtures/builders";
import { Calendar } from "../../react-v3/calendar";
import { CalendarDays } from "../days/CalendarDays";
import { CalendarLunar } from "./CalendarLunar";

const meta: Meta = {
  title: "v3/Lunar",
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Calendar
      config={buildConfig({ mode: "single" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarDays />
      <CalendarLunar />
    </Calendar>
  ),
};

export const NoPhaseLabels: Story = {
  render: () => (
    <Calendar
      config={buildConfig({ mode: "single" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarDays />
      <CalendarLunar phaseLabels={false} />
    </Calendar>
  ),
};

export const CustomLabel: Story = {
  render: () => (
    <Calendar
      config={buildConfig({ mode: "single" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarDays />
      <CalendarLunar lunarLabel="Moon calendar" />
    </Calendar>
  ),
};
