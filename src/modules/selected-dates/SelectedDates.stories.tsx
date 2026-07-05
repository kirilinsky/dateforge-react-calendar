import type { Meta, StoryObj } from "@storybook/react-vite";
import { buildConfig, D } from "../../__tests__/fixtures/builders";
import { Calendar } from "../../react/calendar";
import { storyLocale, storyThemeProps } from "../_lab/story-globals";
import { CalendarDays } from "../days/CalendarDays";
import { CalendarSelectedDates } from "./CalendarSelectedDates";

const meta: Meta = {
  title: "SelectedDates",
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
      <CalendarSelectedDates allowClear />
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
      <CalendarSelectedDates allowClear allowClearPerChip />
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
      <CalendarSelectedDates allowClear />
    </Calendar>
  ),
};

export const WithRemovePerChip: Story = {
  name: "Per-chip remove (multiple)",
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ ...storyLocale(ctx.globals), mode: "multiple" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarDays />
      <CalendarSelectedDates allowClearPerChip />
    </Calendar>
  ),
};
