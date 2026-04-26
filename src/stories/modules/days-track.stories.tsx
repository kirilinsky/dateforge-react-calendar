import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDaysTrack } from "@/modules/days-track";
import { FIXED_DATE } from "../_constants";
import {
  resolveStoryTheme,
  resolveStoryAppearance,
} from "../_helpers/resolve-globals";

const meta: Meta = {
  title: "Modules/DaysTrack",
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
      >
        <CalendarDaysTrack />
      </Calendar>
    );
  },
};
Default.storyName = "Horizontal interactive";

export const WithMonthLabel: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarDaysTrack showMonthLabel />
      </Calendar>
    );
  },
};
WithMonthLabel.storyName = "With month label";

export const RangeBounds: Story = {
  render: (_args, ctx) => {
    const [range, setRange] = useState<{ from: Date | null; to: Date | null }>({
      from: FIXED_DATE,
      to: new Date(2016, 1, 20),
    });
    return (
      <>
        <p style={{ marginBottom: 8, fontFamily: "monospace", fontSize: 12 }}>
          from: {range.from?.toISOString() ?? "null"} | to: {range.to?.toISOString() ?? "null"}
        </p>
        <Calendar
          mode="range"
          value={range}
          onChange={setRange}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarDaysTrack bound="from" />
          <CalendarDaysTrack bound="to" />
        </Calendar>
      </>
    );
  },
};
RangeBounds.storyName = "Range — from + to tracks";

export const MultipleMode: Story = {
  render: (_args, ctx) => {
    const [dates, setDates] = useState<Date[]>([FIXED_DATE]);
    return (
      <>
        <p style={{ marginBottom: 8, fontFamily: "monospace", fontSize: 12 }}>
          selected: [{dates.map((d) => d.toISOString()).join(", ")}]
        </p>
        <Calendar
          mode="multiple"
          value={dates}
          onChange={setDates}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarDaysTrack />
        </Calendar>
      </>
    );
  },
};
MultipleMode.storyName = "Multiple mode (save/remove button)";
