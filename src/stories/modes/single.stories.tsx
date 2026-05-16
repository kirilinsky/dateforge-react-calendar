import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import { CalendarNav } from "@/modules/nav";
import { CalendarTimeGrid } from "@/modules/time";
import { createDisabled } from "@/utils/create-disabled";
import { FIXED_DATE } from "../_constants";
import { debugStyle, fmtDate } from "../_helpers/debug";
import {
  resolveStoryAppearance,
  resolveStoryGradient,
  resolveStoryLocale,
  resolveStoryTheme,
} from "../_helpers/resolve-globals";

const meta: Meta = {
  title: "Modes/Single",
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarNav showMonthPicker compactYears />
        <CalendarDays />
      </Calendar>
    );
  },
};

export const DisabledDays: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    const disabled = useMemo(() => createDisabled({ weekends: true }), []);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        disabled={disabled}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarNav showMonthPicker compactYears />
        <CalendarDays />
      </Calendar>
    );
  },
};
DisabledDays.storyName = "Disabled days (weekends)";

export const MinMaxDate: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        minDate={new Date(2016, 1, 3)}
        maxDate={new Date(2016, 1, 20)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarNav showMonthPicker compactYears />
        <CalendarDays />
      </Calendar>
    );
  },
};
MinMaxDate.storyName = "Min/maxDate";

export const WithTime: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <>
        <p style={debugStyle}>value: {date ? fmtDate(date) : "null"}</p>
        <Calendar
          value={date}
          onChange={setDate}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
          gradient={resolveStoryGradient(ctx.globals.gradient)}
          locale={resolveStoryLocale(ctx.globals.locale)}
        >
          <CalendarNav showMonthPicker compactYears />
          <CalendarDays />
          <CalendarTimeGrid />
        </Calendar>
      </>
    );
  },
};
WithTime.storyName = "With time";

export const ReadOnly: Story = {
  render: (_args, ctx) => {
    return (
      <Calendar
        value={FIXED_DATE}
        onChange={() => {}}
        readOnly
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarNav showMonthPicker compactYears />
        <CalendarDays />
      </Calendar>
    );
  },
};
ReadOnly.storyName = "Read-only";
