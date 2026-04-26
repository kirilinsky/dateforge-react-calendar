import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarMonthsTrack } from "@/modules/months-track";
import { FIXED_DATE } from "../_constants";
import {
  resolveStoryTheme,
  resolveStoryAppearance,
} from "../_helpers/resolve-globals";

type MonthsTrackArgs = {
  short?: boolean;
};

const meta: Meta<MonthsTrackArgs> = {
  title: "Modules/MonthsTrack",
  argTypes: {
    short: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<MonthsTrackArgs>;

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
        <CalendarMonthsTrack />
      </Calendar>
    );
  },
};

export const FullNames: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarMonthsTrack short={false} />
      </Calendar>
    );
  },
};
FullNames.storyName = "Full month names";

export const RangeBounds: Story = {
  render: (_args, ctx) => {
    const [range, setRange] = useState<{ from: Date | null; to: Date | null }>({
      from: FIXED_DATE,
      to: new Date(2016, 4, 15),
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
          <CalendarMonthsTrack bound="from" />
          <CalendarMonthsTrack bound="to" />
        </Calendar>
      </>
    );
  },
};
RangeBounds.storyName = "Range — from + to tracks";

export const Playground: Story = {
  args: {
    short: true,
  },
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarMonthsTrack short={args.short} />
      </Calendar>
    );
  },
};
