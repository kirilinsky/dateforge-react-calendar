import type { Meta, StoryObj } from "@storybook/react-vite";
import { buildConfig, D } from "../../__tests__/fixtures/builders";
import { Calendar } from "../../react/calendar";
import { storyLocale, storyThemeProps } from "../_lab/story-globals";
import { CalendarDays } from "../days/CalendarDays";
import { CalendarSelectedDates } from "../selected-dates/CalendarSelectedDates";
import { CalendarManualInput } from "./CalendarManualInput";

const meta: Meta = {
  title: "ManualInput",
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ ...storyLocale(ctx.globals), mode: "single" })}
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
      config={buildConfig({ ...storyLocale(ctx.globals), mode: "single" })}
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
      config={buildConfig({
        ...storyLocale(ctx.globals),
        mode: "single",
        readOnly: true,
      })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarManualInput />
      <CalendarDays />
    </Calendar>
  ),
};

/** Label + clear (×) + ArrowUp/Down segment stepping (MUI DateField model):
 *  put the caret in a segment and press the arrows. */
export const LabelAndClear: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ ...storyLocale(ctx.globals), mode: "single" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarManualInput label="Date" allowClear />
      <CalendarDays />
    </Calendar>
  ),
};

/** Range via two bound inputs — the v3 take on v2's from—to slots. Typing an
 *  inverted bound flags the input instead of silently swapping. */
export const RangeBounds: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ ...storyLocale(ctx.globals), mode: "range" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarManualInput bound="from" label="From" />
      <CalendarManualInput bound="to" label="To" />
      <CalendarDays />
    </Calendar>
  ),
};

/** Multiple mode recipe replacing v2's chip editor: the input ADDS dates
 *  (live commit), CalendarSelectedDates lists and removes them. */
export const MultipleRecipe: Story = {
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ ...storyLocale(ctx.globals), mode: "multiple" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarManualInput label="Add date" />
      <CalendarDays />
      <CalendarSelectedDates allowClear allowClearPerChip />
    </Calendar>
  ),
};
