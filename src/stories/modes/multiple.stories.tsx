import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import { CalendarNav } from "@/modules/nav";
import { FIXED_DATE } from "../_constants";
import {
  resolveStoryTheme,
  resolveStoryAppearance,
} from "../_helpers/resolve-globals";
import { debugStyle, fmtDate } from "../_helpers/debug";

const meta: Meta = {
  title: "Modes/Multiple",
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: (_args, ctx) => {
    const [dates, setDates] = useState<Date[]>([FIXED_DATE]);
    return (
      <>
        <p style={debugStyle}>
          selected ({dates.length}): [{dates.map(fmtDate).join(", ")}]
        </p>
        <Calendar
          mode="multiple"
          value={dates}
          onChange={setDates}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarNav showMonthPicker compactYears />
          <CalendarDays />
        </Calendar>
      </>
    );
  },
};

export const Capped: Story = {
  render: (_args, ctx) => {
    const [dates, setDates] = useState<Date[]>([FIXED_DATE]);
    return (
      <>
        <p style={debugStyle}>
          selected ({dates.length}/3): [{dates.map(fmtDate).join(", ")}]
        </p>
        <Calendar
          mode="multiple"
          value={dates}
          onChange={setDates}
          maxDates={3}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarNav showMonthPicker compactYears />
          <CalendarDays />
        </Calendar>
      </>
    );
  },
};
Capped.storyName = "Capped (maxDates=3)";

export const PreSelected: Story = {
  render: (_args, ctx) => {
    const [dates, setDates] = useState<Date[]>([
      new Date(2016, 1, 3),
      new Date(2016, 1, 10),
      new Date(2016, 1, 17),
    ]);
    return (
      <>
        <p style={debugStyle}>
          selected ({dates.length}): [{dates.map(fmtDate).join(", ")}]
        </p>
        <Calendar
          mode="multiple"
          value={dates}
          onChange={setDates}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarNav showMonthPicker compactYears />
          <CalendarDays />
        </Calendar>
      </>
    );
  },
};
PreSelected.storyName = "Pre-selected";
