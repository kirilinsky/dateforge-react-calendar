import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import { CalendarDaysTrack } from "@/modules/days-track";
import { CalendarInfo } from "@/modules/info";
import { CalendarLunar } from "@/modules/lunar";
import { CalendarManualInput } from "@/modules/manual-input";
import { CalendarMonthsGrid } from "@/modules/months-grid";
import { CalendarMonthsTrack } from "@/modules/months-track";
import { CalendarMonthsWheel } from "@/modules/months-wheel";
import { CalendarPresets } from "@/modules/presets";
import { basicPresets } from "@/modules/presets/presets-pack";
import { CalendarSelectedDates } from "@/modules/selected-dates";
import { CalendarTimeWheel } from "@/modules/time";
import { CalendarYearsGrid } from "@/modules/years-grid";
import { CalendarYearsTrack } from "@/modules/years-track";
import { createDisabled } from "@/utils/create-disabled";
import { FIXED_DATE } from "../_constants";
import { debugStyle, fmtRange } from "../_helpers/debug";
import {
  resolveStoryAppearance,
  resolveStoryGradient,
  resolveStoryLocale,
  resolveStoryTheme,
  resolveStoryThemeMode,
} from "../_helpers/resolve-globals";
import { StoryToolbar } from "../_helpers/story-toolbar";

type RangeValue = { from: Date | null; to: Date | null };

const meta: Meta = {
  title: "Compositions/Recipes",
};

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────────────────────────────────
// Single — one date
// ─────────────────────────────────────────────────────────────────────────────

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
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <StoryToolbar showTime showMonthPicker compactYears />
        <CalendarDays />
      </Calendar>
    );
  },
};
BasicDatePicker.storyName = "Single / Basic";

export const FeedbackAndClear: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        mode="single"
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <StoryToolbar
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

export const ManualInputAndGrid: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        mode="single"
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarManualInput />
        <StoryToolbar label="Type or pick" />
        <CalendarDays />
      </Calendar>
    );
  },
};
ManualInputAndGrid.storyName = "Single / Manual input";

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
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
        cols={4}
      >
        <StoryToolbar
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

export const DateAndTimePicker: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        mode="single"
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <StoryToolbar label="Date + time" showTime clear />
        <CalendarDays />
        <CalendarTimeWheel />
      </Calendar>
    );
  },
};
DateAndTimePicker.storyName = "Single / Date + time";

export const RelativeDeadline: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(() => {
      const tomorrow = new Date(FIXED_DATE);
      tomorrow.setHours(0, 0, 0, 0);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    });
    return (
      <Calendar
        mode="single"
        value={date}
        onChange={setDate}
        defaultViewDate={date ?? undefined}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <StoryToolbar showMonthPicker compactYears />
        <CalendarInfo
          showRelative
          showSummary={false}
          emptyLabel="Pick a deadline"
          allowClear
        />
        <CalendarDays />
      </Calendar>
    );
  },
};
RelativeDeadline.storyName =
  "Single / Relative deadline (Intl.RelativeTimeFormat)";

export const MonthsWheelPicker: Story = {
  parameters: { storyWidth: 820 },
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        mode="single"
        value={date}
        onChange={setDate}
        cols={3}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <StoryToolbar yearLabel themeToggle clear />
        <CalendarMonthsWheel col={1} showLabel showReset />
        <CalendarDays col={2} />
      </Calendar>
    );
  },
};
MonthsWheelPicker.storyName = "Single / Toolbar + MonthsWheel + Days  ";

export const LunarPhaseStrip: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        mode="single"
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <StoryToolbar showMonthPicker compactYears />
        <CalendarDays />
        <CalendarLunar />
      </Calendar>
    );
  },
};
LunarPhaseStrip.storyName = "Single / Lunar phase strip under grid";

// ─────────────────────────────────────────────────────────────────────────────
// Multiple — N dates
// ─────────────────────────────────────────────────────────────────────────────

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
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <StoryToolbar label="Select 3" showMonthPicker />
        <CalendarDays />
        <CalendarSelectedDates />
      </Calendar>
    );
  },
};
MultipleDatePicker.storyName = "Multiple / Max 3 dates";

// ─────────────────────────────────────────────────────────────────────────────
// Range — from/to pair
// ─────────────────────────────────────────────────────────────────────────────

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
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <StoryToolbar label="Range" showMonthPicker yearLabel clear />
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
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <StoryToolbar
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
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <StoryToolbar showMonthPicker yearLabel col={2} home />
        <StoryToolbar monthLabel yearLabel offset={1} col={2} />
        <CalendarDays offset={0} col={2} />
        <CalendarDays offset={1} col={2} />
        <CalendarSelectedDates col="1 / span 4" />
      </Calendar>
    );
  },
};
MultiMonthRange.storyName = "Range / Two months";

export const TwelveMonthsRange: Story = {
  parameters: {
    storyWidth: 1200,
    chromatic: { disable: true },
  },
  render: (_args, ctx) => {
    const [range, setRange] = useState<RangeValue>({ from: null, to: null });
    const monthGroups: number[][] = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [9, 10, 11],
    ];
    return (
      <Calendar
        mode="range"
        cols={3}
        value={range}
        onChange={setRange}
        defaultViewDate={FIXED_DATE}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        {monthGroups.flatMap((group) => [
          ...group.map((offset) => (
            <StoryToolbar
              key={`toolbar-${offset}`}
              offset={offset}
              monthLabel
              yearLabel
              col={1}
            />
          )),
          ...group.map((offset) => (
            <CalendarDays
              key={`days-${offset}`}
              currentMonthOnly
              fixedRows={false}
              offset={offset}
              col={1}
            />
          )),
        ])}
        <CalendarSelectedDates col="1 / span 3" />
      </Calendar>
    );
  },
};
TwelveMonthsRange.storyName =
  "Range / Twelve months (toolbar toolbar toolbar / days days days)";

export const HotelBooking: Story = {
  render: (_args, ctx) => {
    const [range, setRange] = useState<RangeValue>({
      from: FIXED_DATE,
      to: new Date(
        FIXED_DATE.getFullYear(),
        FIXED_DATE.getMonth(),
        FIXED_DATE.getDate() + 5,
      ),
    });
    return (
      <Calendar
        mode="range"
        value={range}
        onChange={setRange}
        defaultViewDate={FIXED_DATE}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <StoryToolbar showMonthPicker compactYears />
        <CalendarInfo
          prefix="Stay:"
          rangeStyle="days"
          allowClear
          showHome
          formatter={(value) => {
            if (!value || value instanceof Date || Array.isArray(value)) {
              return null;
            }
            if (!value.from || !value.to) return null;
            const nights = Math.round(
              Math.abs(value.to.getTime() - value.from.getTime()) / 86_400_000,
            );
            return `${nights} ${nights === 1 ? "night" : "nights"}`;
          }}
        />
        <CalendarDays />
        <CalendarSelectedDates />
      </Calendar>
    );
  },
};
HotelBooking.storyName = "Range / Hotel booking (Info + SelectedDates)";

export const TripDuration: Story = {
  render: (_args, ctx) => {
    const [range, setRange] = useState<RangeValue>({ from: null, to: null });
    return (
      <Calendar
        mode="range"
        value={range}
        onChange={setRange}
        defaultViewDate={FIXED_DATE}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <StoryToolbar showMonthPicker compactYears clear />
        <CalendarPresets presets={basicPresets} />
        <CalendarInfo
          prefix="Duration:"
          rangeStyle="duration"
          emptyLabel="Pick a range"
          showHome
        />
        <CalendarDays />
      </Calendar>
    );
  },
};
TripDuration.storyName = "Range / Trip duration (rangeStyle=duration)";

export const RangeDurationWithTimeWheel: Story = {
  parameters: { storyWidth: 900 },
  render: (_args, ctx) => {
    const [range, setRange] = useState<RangeValue>(() => {
      const from = new Date(FIXED_DATE);
      from.setHours(10, 0, 0, 0);

      const to = new Date(FIXED_DATE);
      to.setDate(to.getDate() + 3);
      to.setHours(14, 30, 0, 0);

      return { from, to };
    });

    return (
      <Calendar
        mode="range"
        value={range}
        onChange={setRange}
        defaultViewDate={range.from ?? FIXED_DATE}
        cols={4}
        timeStep={{ minute: 5 }}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <StoryToolbar label="Range duration" showMonthPicker compactYears />
        <CalendarInfo
          prefix="Elapsed:"
          rangeStyle="duration"
          emptyLabel="Pick a range"
          allowClear
          showHome
        />
        <CalendarDays col={2} />
        <CalendarTimeWheel bound="from" col={1} showReset />
        <CalendarTimeWheel bound="to" col={1} showReset />
        <CalendarSelectedDates showTime />
      </Calendar>
    );
  },
};
RangeDurationWithTimeWheel.storyName = "Range / Duration + time grid";

export const FlightTracks: Story = {
  render: (_args, ctx) => {
    const [flightRange, setFlightRange] = useState<RangeValue>({
      from: null,
      to: null,
    });
    const noPast = useMemo(() => {
      const today = new Date(FIXED_DATE);
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
          {...resolveStoryThemeMode(ctx.globals.themeMode)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
          gradient={resolveStoryGradient(ctx.globals.gradient)}
          locale={resolveStoryLocale(ctx.globals.locale)}
        >
          <StoryToolbar col={1} label="Departure" bound="from" monthLabel />
          <StoryToolbar col={1} label="Return" bound="to" monthLabel />
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

// ─────────────────────────────────────────────────────────────────────────────
// Navigation — alternative pickers (grids / tracks)
// ─────────────────────────────────────────────────────────────────────────────

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
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <StoryToolbar label="Month grid" showMonthPicker compactYears />
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
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <StoryToolbar label="Year grid" showMonthPicker compactYears />
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
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient) ?? true}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarMonthsTrack showYearLabel />
        <CalendarDays />
      </Calendar>
    );
  },
};
DaysAndMonthsTrack.storyName = "Navigation / Months track + days";

export const TrackDrivenPicker: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        mode="single"
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
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

// ─────────────────────────────────────────────────────────────────────────────
// Display — read-only / gradient
// ─────────────────────────────────────────────────────────────────────────────

export const ReadOnlyDisplay: Story = {
  render: (_args, ctx) => {
    return (
      <Calendar
        readOnly
        defaultViewDate={new Date(1990, 4, 1)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <StoryToolbar label="Read-only display" />
        <CalendarDays />
      </Calendar>
    );
  },
};
ReadOnlyDisplay.storyName = "Display / Read-only";

export const WithGradient: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        mode="single"
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient) ?? true}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <StoryToolbar label="Gradient cells" showMonthPicker compactYears />
        <CalendarDays />
        <CalendarSelectedDates />
      </Calendar>
    );
  },
};
WithGradient.storyName = "Display / Gradient cells";

// ─────────────────────────────────────────────────────────────────────────────
// Standalone — non-calendar pickers
// ─────────────────────────────────────────────────────────────────────────────

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
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <StoryToolbar label="Select time" themeToggle />
        <CalendarTimeWheel seconds />
      </Calendar>
    );
  },
};
TimeOnlyPicker.storyName = "Standalone / Time only";
