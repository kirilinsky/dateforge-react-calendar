import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarMonthsTrack } from "@/modules/months-track";
import { FIXED_DATE } from "../_constants";
import { debugStyle, fmtRange } from "../_helpers/debug";
import {
  resolveStoryAppearance,
  resolveStoryLocale,
  resolveStoryTheme,
} from "../_helpers/resolve-globals";

type MonthsTrackArgs = {
  short?: boolean;
  showYearLabel?: boolean;
};

const meta: Meta<MonthsTrackArgs> = {
  title: "Modules/MonthsTrack",
  argTypes: {
    short: { control: "boolean" },
    showYearLabel: { control: "boolean" },
  },
  args: { short: true, showYearLabel: false },
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarMonthsTrack
          short={args.short}
          showYearLabel={args.showYearLabel}
        />
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

export const WithYearLabel: Story = {
  args: { showYearLabel: true },
};
WithYearLabel.storyName = "Year label under active month";

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
          locale={resolveStoryLocale(ctx.globals.locale)}
        >
          <CalendarMonthsTrack bound="from" short={args.short} />
          <CalendarMonthsTrack bound="to" short={args.short} />
        </Calendar>
      </>
    );
  },
};
RangeBounds.storyName = "Range — from + to tracks";

export const StandaloneMonthPicker: Story = {
  render: (args, ctx) => {
    const [picked, setPicked] = useState<Date | null>(null);
    const label = picked
      ? new Intl.DateTimeFormat(undefined, {
          month: "long",
          year: "numeric",
        }).format(picked)
      : "—";
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <div data-testid="picked-month" style={{ fontSize: 14 }}>
          Picked: <strong>{label}</strong>
        </div>
        <Calendar
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
          locale={resolveStoryLocale(ctx.globals.locale)}
        >
          <CalendarMonthsTrack
            short={args.short}
            showYearLabel={args.showYearLabel}
            onMonthSelect={setPicked}
          />
        </Calendar>
      </div>
    );
  },
};
StandaloneMonthPicker.storyName = "Standalone month picker (onMonthSelect)";
