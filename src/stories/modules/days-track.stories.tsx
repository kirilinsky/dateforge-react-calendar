import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDaysTrack } from "@/modules/days-track";
import { FIXED_DATE } from "../_constants";
import { debugStyle, fmtDate, fmtRange } from "../_helpers/debug";
import {
  resolveStoryAppearance,
  resolveStoryTheme,
} from "../_helpers/resolve-globals";

type DaysTrackArgs = {
  showMonthLabel?: boolean;
};

const meta: Meta<DaysTrackArgs> = {
  title: "Modules/DaysTrack",
  argTypes: {
    showMonthLabel: { control: "boolean" },
  },
  args: { showMonthLabel: false },
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarDaysTrack showMonthLabel={args.showMonthLabel} />
      </Calendar>
    );
  },
};

export default meta;

type Story = StoryObj<DaysTrackArgs>;

export const Default: Story = {
  parameters: {
    chromatic: { delay: 1000, pauseAnimationAtEnd: true },
  },
};
Default.storyName = "Horizontal interactive";

export const WithMonthLabel: Story = {
  args: { showMonthLabel: true },
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
        <p style={debugStyle}>{fmtRange(range)}</p>
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
        <p style={debugStyle}>selected: [{dates.map(fmtDate).join(", ")}]</p>
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
