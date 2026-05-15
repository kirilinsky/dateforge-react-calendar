import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import {
  CalendarInfo,
  type CalendarInfoRangeStyle,
  type CalendarInfoVariant,
} from "@/modules/info";
import { FIXED_DATE } from "../_constants";
import {
  resolveStoryAppearance,
  resolveStoryLocale,
  resolveStoryTheme,
} from "../_helpers/resolve-globals";

type CalendarInfoArgs = {
  allowClear?: boolean;
  align?: "left" | "center" | "right";
  animated?: boolean;
  label?: string;
  rangeLabel?: string;
  rangeStyle?: CalendarInfoRangeStyle;
  showDurationInDays?: boolean;
  showHome?: boolean;
  showNights?: boolean;
  showRangeDates?: boolean;
  variant?: CalendarInfoVariant;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatStoryDate = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

const formatStoryUnit = (value: number, unit: string) => {
  if (unit === "night") return `${value} ${value === 1 ? "night" : "nights"}`;
  return undefined;
};

const meta: Meta<CalendarInfoArgs> = {
  title: "Modules/CalendarInfo",
  argTypes: {
    allowClear: { control: "boolean" },
    align: { control: "inline-radio", options: ["left", "center", "right"] },
    animated: { control: "boolean" },
    label: { control: "text" },
    rangeLabel: { control: "text" },
    rangeStyle: { control: "inline-radio", options: ["nights", "duration"] },
    showDurationInDays: { control: "boolean" },
    showHome: { control: "boolean" },
    showNights: { control: "boolean" },
    showRangeDates: { control: "boolean" },
    variant: { control: "inline-radio", options: ["summary", "relative"] },
  },
  args: {
    allowClear: false,
    align: "left",
    animated: true,
    label: undefined,
    rangeLabel: undefined,
    rangeStyle: "nights",
    showDurationInDays: undefined,
    showHome: false,
    showNights: undefined,
    showRangeDates: false,
    variant: "summary",
  },
  render: (args, ctx) => {
    const [range, setRange] = useState<{ from: Date | null; to: Date | null }>({
      from: FIXED_DATE,
      to: addDays(FIXED_DATE, 7),
    });
    return (
      <Calendar
        mode="range"
        value={range}
        onChange={setRange}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarInfo
          allowClear={args.allowClear}
          align={args.align}
          animated={args.animated}
          label={args.label}
          rangeLabel={args.rangeLabel}
          rangeStyle={args.rangeStyle}
          showDurationInDays={args.showDurationInDays}
          showHome={args.showHome}
          showNights={args.showNights}
          showRangeDates={args.showRangeDates}
          unitFormatter={formatStoryUnit}
          variant={args.variant}
        />
        <CalendarDays />
      </Calendar>
    );
  },
};

export default meta;

type Story = StoryObj<CalendarInfoArgs>;

export const RangeNights: Story = {};
RangeNights.storyName = "Range — nights";

export const RangeDuration: Story = {
  args: { rangeStyle: "duration" },
  render: (args, ctx) => {
    const [range, setRange] = useState<{ from: Date | null; to: Date | null }>({
      from: new Date(2016, 1, 5, 10, 0),
      to: new Date(2016, 1, 8, 14, 0),
    });
    return (
      <Calendar
        mode="range"
        value={range}
        onChange={setRange}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarInfo
          allowClear={args.allowClear}
          align={args.align}
          animated={args.animated}
          label={args.label}
          rangeLabel={args.rangeLabel}
          rangeStyle={args.rangeStyle}
          showDurationInDays={args.showDurationInDays}
          showHome={args.showHome}
          showNights={args.showNights}
          showRangeDates={args.showRangeDates}
          unitFormatter={formatStoryUnit}
        />
        <CalendarDays />
      </Calendar>
    );
  },
};
RangeDuration.storyName = "Range — duration";

export const RangeDatesAndNights: Story = {
  args: {
    rangeLabel: "Selected",
    showNights: true,
    showRangeDates: true,
  },
};
RangeDatesAndNights.storyName = "Range — dates and nights";

export const RangeDatesAndDays: Story = {
  args: {
    rangeLabel: "Selected",
    showDurationInDays: true,
    showRangeDates: true,
  },
};
RangeDatesAndDays.storyName = "Range — dates and days";

export const Multiple: Story = {
  render: (args, ctx) => {
    const [dates, setDates] = useState([
      FIXED_DATE,
      addDays(FIXED_DATE, 2),
      addDays(FIXED_DATE, 5),
    ]);
    return (
      <Calendar
        mode="multiple"
        value={dates}
        onChange={setDates}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarInfo
          allowClear={args.allowClear}
          align={args.align}
          animated={args.animated}
          label={args.label}
          showHome={args.showHome}
        />
        <CalendarDays />
      </Calendar>
    );
  },
};
Multiple.storyName = "Multiple";

export const Single: Story = {
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
        <CalendarInfo
          allowClear={args.allowClear}
          align={args.align}
          animated={args.animated}
          label={args.label}
          showHome={args.showHome}
        />
        <CalendarDays />
      </Calendar>
    );
  },
};
Single.storyName = "Single";

export const WithHome: Story = {
  args: { showHome: true },
};
WithHome.storyName = "With home";

export const EmptyWithLabel: Story = {
  args: { label: "Select a date" },
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(null);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarInfo
          allowClear={args.allowClear}
          align={args.align}
          animated={args.animated}
          label={args.label}
          showHome={args.showHome}
        />
        <CalendarDays />
      </Calendar>
    );
  },
};
EmptyWithLabel.storyName = "Empty with label";

export const Relative: Story = {
  args: { variant: "relative" },
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(addDays(FIXED_DATE, 3));
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarInfo
          allowClear={args.allowClear}
          align={args.align}
          animated={args.animated}
          formatter={({ formatRelative, locale, selectedDate }) =>
            selectedDate
              ? `Today: ${formatStoryDate(FIXED_DATE, locale)} · ${formatRelative(selectedDate, FIXED_DATE)}`
              : args.label
          }
          relativeBaseDate={FIXED_DATE}
          showHome={args.showHome}
          variant={args.variant}
        />
        <CalendarDays />
      </Calendar>
    );
  },
};
Relative.storyName = "Relative to selected date";

export const CustomFormatters: Story = {
  render: (args, ctx) => {
    const [range, setRange] = useState<{ from: Date | null; to: Date | null }>({
      from: FIXED_DATE,
      to: addDays(FIXED_DATE, 4),
    });
    return (
      <Calendar
        mode="range"
        value={range}
        onChange={setRange}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarInfo
          allowClear={args.allowClear}
          align={args.align}
          animated={args.animated}
          label={args.label}
          showHome={args.showHome}
          unitFormatter={formatStoryUnit}
          rangeFormatter={({ formatUnit, nights }) =>
            `Trip length: ${formatUnit(nights, "night")}`
          }
        />
        <CalendarDays />
      </Calendar>
    );
  },
};
CustomFormatters.storyName = "Custom formatters";
