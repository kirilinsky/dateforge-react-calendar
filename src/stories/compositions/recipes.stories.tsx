import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import { CalendarDaysTrack } from "@/modules/days-track";
import { CalendarManualInput } from "@/modules/manual-input";
import { CalendarMonthsGrid } from "@/modules/months-grid";
import { CalendarMonthsTrack } from "@/modules/months-track";
import { CalendarNav } from "@/modules/nav";
import { CalendarPresets } from "@/modules/presets";
import { basicPresets } from "@/modules/presets/presets-pack";
import { CalendarSelectedDates } from "@/modules/selected-dates";
import { CalendarTimeGrid } from "@/modules/time";
import { CalendarYearsGrid } from "@/modules/years-grid";
import { CalendarYearsTrack } from "@/modules/years-track";
import { createDisabled } from "@/utils/create-disabled";
import { FIXED_DATE } from "../_constants";
import { debugStyle, fmtRange } from "../_helpers/debug";
import {
  resolveStoryAppearance,
  resolveStoryLocale,
  resolveStoryTheme,
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
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarNav showTime showMonthPicker compactYears />
        <CalendarDays />
      </Calendar>
    );
  },
};
BasicDatePicker.storyName = "Single / Basic";

export const DaysPresetsAndTimeInLine: Story = {
  parameters: { storyWidth: 500 },
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        mode="single"
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        locale={resolveStoryLocale(ctx.globals.locale)}
        cols={4}
      >
        <CalendarNav
          label="Selection feedback"
          showMonthPicker
          compactYears
          clear
        />
        <CalendarPresets presets={basicPresets} col={2} />
        <CalendarDays col={2} />

        <CalendarSelectedDates />
      </Calendar>
    );
  },
};
DaysPresetsAndTimeInLine.storyName = "Single / Presets sidebar";

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
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarNav
          label="Selection feedback"
          showMonthPicker
          compactYears
          home
          clear
        />
        <CalendarDays />
        <CalendarSelectedDates />
      </Calendar>
    );
  },
};
FeedbackAndClear.storyName = "Single / Feedback + home + clear";

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
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarNav label="Range" showMonthPicker yearLabel clear />
        <CalendarDays boldWeekends />
        <CalendarSelectedDates />
      </Calendar>
    );
  },
};
RangePicker.storyName = "Range / Basic";

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
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarNav
          label="Range + presets"
          showMonthPicker
          compactYears
          clear
        />
        <CalendarPresets presets={basicPresets} />
        <CalendarDays />
        <CalendarSelectedDates />
      </Calendar>
    );
  },
};
RangeWithShortcuts.storyName = "Range / With presets";

export const MultiMonthRange: Story = {
  parameters: { storyWidth: 900 },
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
        locale={resolveStoryLocale(ctx.globals.locale)}
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
MultiMonthRange.storyName = "Range / Two months";

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
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarNav label="Select 3" showMonthPicker />
        <CalendarDays />
        <CalendarSelectedDates />
      </Calendar>
    );
  },
};
MultipleDatePicker.storyName = "Multiple / Max 3 dates";

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
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarNav label="Date + time" showTime clear />
        <CalendarDays />
        <CalendarTimeGrid />
      </Calendar>
    );
  },
};
DateAndTimePicker.storyName = "Single / Date + time";

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
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarNav label="Select time" themeToggle />
        <CalendarTimeGrid seconds />
      </Calendar>
    );
  },
};
TimeOnlyPicker.storyName = "Standalone / Time only";

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
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarManualInput />
        <CalendarNav label="Type or pick" />
        <CalendarDays />
      </Calendar>
    );
  },
};
ManualInputAndGrid.storyName = "Single / Manual input";

export const ReadOnlyDisplay: Story = {
  render: (_args, ctx) => {
    return (
      <Calendar
        readOnly
        defaultViewDate={new Date(1990, 4, 1)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarNav label="Read-only display" />
        <CalendarDays />
      </Calendar>
    );
  },
};
ReadOnlyDisplay.storyName = "Display / Read-only";

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
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarYearsTrack />
        <CalendarMonthsTrack />
        <CalendarDaysTrack />
      </Calendar>
    );
  },
};
TrackDrivenPicker.storyName = "Navigation / Tracks only";

export const DaysAndMonthsGrid: Story = {
  parameters: { storyWidth: 760 },
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        mode="single"
        value={date}
        onChange={setDate}
        cols={3}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarNav label="Month grid" showMonthPicker compactYears />
        <CalendarMonthsGrid col={1} />
        <CalendarDays col={2} />
      </Calendar>
    );
  },
};
DaysAndMonthsGrid.storyName = "Navigation / Month grid + days";

export const DaysAndYearsGrid: Story = {
  parameters: { storyWidth: 760 },
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        mode="single"
        value={date}
        onChange={setDate}
        cols={3}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarNav label="Year grid" showMonthPicker compactYears />
        <CalendarYearsGrid col={1} yearsPerPage={16} />
        <CalendarDays col={2} />
      </Calendar>
    );
  },
};
DaysAndYearsGrid.storyName = "Navigation / Year grid + days";

export const DaysAndMonthsTrack: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        mode="single"
        value={date}
        gradient
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarMonthsTrack showYearLabel />
        <CalendarDays />
      </Calendar>
    );
  },
};
DaysAndMonthsTrack.storyName = "Navigation / Months track + days";

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
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarNav label="Gradient cells" showMonthPicker compactYears />
        <CalendarDays />
        <CalendarSelectedDates />
      </Calendar>
    );
  },
};
WithGradient.storyName = "Display / Gradient cells";

export const FlightTracks: Story = {
  render: (_args, ctx) => {
    const [flightRange, setFlightRange] = useState<RangeValue>({
      from: null,
      to: null,
    });
    const noPast = useMemo(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return createDisabled({ before: today });
    }, []);
    return (
      <>
        <p style={debugStyle}>{fmtRange(flightRange)}</p>
        <Calendar
          mode="range"
          value={flightRange}
          onChange={setFlightRange}
          disabled={noPast}
          width="100%"
          cols={2}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
          locale={resolveStoryLocale(ctx.globals.locale)}
        >
          <CalendarNav col={1} label="Departure" bound="from" monthLabel />
          <CalendarNav col={1} label="Return" bound="to" monthLabel />
          <CalendarYearsTrack col={1} bound="from" />
          <CalendarYearsTrack col={1} bound="to" />
          <CalendarMonthsTrack col={1} bound="from" />
          <CalendarMonthsTrack col={1} bound="to" />
          <CalendarDaysTrack col={1} bound="from" />
          <CalendarDaysTrack col={1} bound="to" />
          <CalendarSelectedDates animated />
        </Calendar>
      </>
    );
  },
};
FlightTracks.storyName = "Range / Flight tracks";
FlightTracks.parameters = {
  storyWidth: 720,
  chromatic: { delay: 1000, pauseAnimationAtEnd: true },
};
