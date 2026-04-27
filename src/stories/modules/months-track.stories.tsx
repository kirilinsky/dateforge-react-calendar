import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarMonthsTrack } from "@/modules/months-track";
import { FIXED_DATE } from "../_constants";
import { debugStyle, fmtRange } from "../_helpers/debug";
import {
  resolveStoryAppearance,
  resolveStoryTheme,
} from "../_helpers/resolve-globals";

type MonthsTrackArgs = {
  short?: boolean;
};

const meta: Meta<MonthsTrackArgs> = {
  title: "Modules/MonthsTrack",
  argTypes: {
    short: { control: "boolean" },
  },
  args: { short: true },
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

export default meta;

type Story = StoryObj<MonthsTrackArgs>;

export const Default: Story = {};

export const FullNames: Story = {
  args: { short: false },
};
FullNames.storyName = "Full month names";

export const RangeBounds: Story = {
  parameters: {
    chromatic: { delay: 1000, pauseAnimationAtEnd: true },
  },
  render: (args, ctx) => {
    const [range, setRange] = useState<{ from: Date | null; to: Date | null }>({
      from: FIXED_DATE,
      to: new Date(2016, 4, 15),
    });
    return (
      <>
        <p style={debugStyle}>{fmtRange(range)}</p>
        <Calendar
          mode="range"
          value={range}
          onChange={setRange}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarMonthsTrack bound="from" short={args.short} />
          <CalendarMonthsTrack bound="to" short={args.short} />
        </Calendar>
      </>
    );
  },
};
RangeBounds.storyName = "Range — from + to tracks";
