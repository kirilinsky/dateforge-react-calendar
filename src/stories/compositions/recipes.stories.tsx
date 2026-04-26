import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import { CalendarNav } from "@/modules/nav";
import { CalendarTimeGrid } from "@/modules/time";
import { CalendarSelectedDates } from "@/modules/selected-dates";
import { CalendarPresets } from "@/modules/presets";
import { CalendarManualSelect } from "@/modules/manual-select";
import { CalendarDaysTrack } from "@/modules/days-track";
import { CalendarMonthsTrack } from "@/modules/months-track";
import { CalendarYearsTrack } from "@/modules/years-track";
import { basicPresets } from "@/modules/presets/presets-pack";
import { FIXED_DATE } from "../_constants";
import {
  resolveStoryTheme,
  resolveStoryAppearance,
} from "../_helpers/resolve-globals";

type RangeValue = { from: Date | null; to: Date | null };

const meta: Meta = {
  title: "Compositions/Recipes",
};

export default meta;

type Story = StoryObj;

export const BasicDatePicker: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(null);
    return (
      <Calendar
        mode="single"
        value={date}
        onChange={setDate}
        defaultViewDate={FIXED_DATE}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarNav label="Pick a date" showMonthPicker compactYears />
        <CalendarDays />
      </Calendar>
    );
  },
};
BasicDatePicker.storyName = "Basic date picker";

export const FeedbackAndClear: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        mode="single"
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarNav label="Selection feedback" showMonthPicker compactYears clear />
        <CalendarDays />
        <CalendarSelectedDates />
      </Calendar>
    );
  },
};
FeedbackAndClear.storyName = "Date picker with feedback and clear";

export const RangePicker: Story = {
  render: (_args, ctx) => {
    const [range, setRange] = useState<RangeValue>({ from: null, to: null });
    return (
      <Calendar
        mode="range"
        value={range}
        onChange={setRange}
        defaultViewDate={FIXED_DATE}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarNav label="Pick range" showMonthPicker compactYears clear />
        <CalendarDays />
        <CalendarSelectedDates />
      </Calendar>
    );
  },
};
RangePicker.storyName = "Date range picker";

export const RangeWithShortcuts: Story = {
  render: (_args, ctx) => {
    const [range, setRange] = useState<RangeValue>({ from: null, to: null });
    return (
      <Calendar
        mode="range"
        value={range}
        onChange={setRange}
        defaultViewDate={FIXED_DATE}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarNav label="Range + presets" showMonthPicker compactYears clear />
        <CalendarPresets presets={basicPresets} />
        <CalendarDays />
        <CalendarSelectedDates />
      </Calendar>
    );
  },
};
RangeWithShortcuts.storyName =
  "Date range picker with shortcuts (basicPresets)";

export const MultiMonthRange: Story = {
  parameters: { storyWidth: 915 },
  render: (_args, ctx) => {
    const [range, setRange] = useState<RangeValue>({ from: null, to: null });
    return (
      <Calendar
        mode="range"
        cols={4}
        value={range}
        onChange={setRange}
        defaultViewDate={FIXED_DATE}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarNav showMonthPicker yearLabel col={2} home />
        <CalendarNav monthLabel yearLabel offset={1} col={2} />
        <CalendarDays offset={0} col={2} />
        <CalendarDays offset={1} col={2} />
        <CalendarSelectedDates col="1 / span 4" />
      </Calendar>
    );
  },
};
MultiMonthRange.storyName = "Multi-month range picker (cols=2)";

export const MultipleDatePicker: Story = {
  render: (_args, ctx) => {
    const [dates, setDates] = useState<Date[]>([]);
    return (
      <Calendar
        mode="multiple"
        maxDates={3}
        value={dates}
        onChange={setDates}
        defaultViewDate={FIXED_DATE}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarNav label="Select 3" showMonthPicker />
        <CalendarDays />
        <CalendarSelectedDates />
      </Calendar>
    );
  },
};
MultipleDatePicker.storyName = "Multiple-date picker (maxDates=3)";

export const DateAndTimePicker: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        mode="single"
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarNav label="Date + time" showTime clear />
        <CalendarDays />
        <CalendarTimeGrid />
      </Calendar>
    );
  },
};
DateAndTimePicker.storyName = "Date + time picker (Days + TimeGrid)";

export const TimeOnlyPicker: Story = {
  parameters: { chromatic: { disable: true } },
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(null);
    return (
      <Calendar
        mode="single"
        value={date}
        onChange={setDate}
        defaultViewDate={FIXED_DATE}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarNav label="Select time" />
        <CalendarTimeGrid seconds />
      </Calendar>
    );
  },
};
TimeOnlyPicker.storyName = "Time-only picker (TimeGrid only, no Days)";

export const ManualInputAndGrid: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        mode="single"
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarManualSelect />
        <CalendarNav label="Type or pick" />
        <CalendarDays />
      </Calendar>
    );
  },
};
ManualInputAndGrid.storyName = "Manual input + grid";

export const ReadOnlyDisplay: Story = {
  render: (_args, ctx) => {
    return (
      <Calendar
        readOnly
        defaultViewDate={new Date(1990, 4, 1)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarNav label="Read-only display" />
        <CalendarDays />
      </Calendar>
    );
  },
};
ReadOnlyDisplay.storyName = "Read-only display (specific month, no selection)";

export const TrackDrivenPicker: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        mode="single"
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarYearsTrack />
        <CalendarMonthsTrack />
        <CalendarDaysTrack />
      </Calendar>
    );
  },
};
TrackDrivenPicker.storyName =
  "Track-driven picker (Years + Months + DaysTrack)";

export const DaysAndMonthsTrack: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        mode="single"
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarMonthsTrack />
        <CalendarDays />
      </Calendar>
    );
  },
};
DaysAndMonthsTrack.storyName = "Days + MonthsTrack (compact month switcher)";

export const WithGradient: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        mode="single"
        value={date}
        onChange={setDate}
        gradient
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarNav label="Gradient cells" showMonthPicker compactYears />
        <CalendarDays />
        <CalendarSelectedDates />
      </Calendar>
    );
  },
};
WithGradient.storyName = "With gradient (gradient prop on selected cells)";
