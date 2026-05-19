import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import {
  CalendarInfo,
  type CalendarInfoProps,
  type CalendarInfoRangeStyle,
} from "@/modules/info";
import { FIXED_DATE } from "../_constants";
import {
  resolveStoryAppearance,
  resolveStoryGradient,
  resolveStoryLocale,
  resolveStoryTheme,
} from "../_helpers/resolve-globals";

type CalendarInfoArgs = {
  allowClear?: boolean;
  align?: "left" | "center" | "right";
  animated?: boolean;
  col?: string;
  emptyLabel?: string;
  prefix?: string;
  rangeStyle?: CalendarInfoRangeStyle;
  showHome?: boolean;
  showRelative?: boolean;
  showSummary?: boolean;
  timeZone?: string;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getCalendarProps = (
  args: CalendarInfoArgs,
  ctx: Parameters<NonNullable<Meta<CalendarInfoArgs>["render"]>>[1],
) => ({
  appearance: resolveStoryAppearance(ctx.globals.appearance),
  gradient: resolveStoryGradient(ctx.globals.gradient),
  locale: resolveStoryLocale(ctx.globals.locale),
  theme: resolveStoryTheme(ctx.globals.theme),
  timeZone: args.timeZone || undefined,
});

const getInfoProps = (args: CalendarInfoArgs): CalendarInfoProps => ({
  allowClear: args.allowClear,
  align: args.align,
  animated: args.animated,
  col: args.col || undefined,
  emptyLabel: args.emptyLabel || undefined,
  prefix: args.prefix || undefined,
  rangeStyle: args.rangeStyle,
  showHome: args.showHome,
  showRelative: args.showRelative,
  showSummary: args.showSummary,
});

const rangeControls = ["rangeStyle"];

const relativeControls = ["showRelative", "showSummary"];

const meta: Meta<CalendarInfoArgs> = {
  title: "Modules/Info",
  argTypes: {
    allowClear: { control: "boolean" },
    align: { control: "inline-radio", options: ["left", "center", "right"] },
    animated: { control: "boolean" },
    col: { control: "text" },
    emptyLabel: { control: "text" },
    prefix: { control: "text" },
    rangeStyle: {
      control: "inline-radio",
      options: ["days", "duration"],
    },
    showHome: { control: "boolean" },
    showRelative: { control: "boolean" },
    showSummary: { control: "boolean" },
    timeZone: { control: "text" },
  },
  args: {
    allowClear: false,
    align: "left",
    animated: true,
    col: undefined,
    emptyLabel: undefined,
    prefix: undefined,
    rangeStyle: "days",
    showHome: false,
    showRelative: false,
    showSummary: true,
    timeZone: undefined,
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
        {...getCalendarProps(args, ctx)}
      >
        <CalendarInfo {...getInfoProps(args)} />
        <CalendarDays />
      </Calendar>
    );
  },
};

export default meta;

type Story = StoryObj<CalendarInfoArgs>;

export const RangeDays: Story = {};
RangeDays.storyName = "Range — days";

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
        {...getCalendarProps(args, ctx)}
      >
        <CalendarInfo {...getInfoProps(args)} />
        <CalendarDays />
      </Calendar>
    );
  },
};
RangeDuration.storyName = "Range — duration";

export const RangeWithPrefix: Story = {
  args: { prefix: "Trip:" },
};
RangeWithPrefix.storyName = "Range — with prefix";

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
        {...getCalendarProps(args, ctx)}
      >
        <CalendarInfo {...getInfoProps(args)} />
        <CalendarDays />
      </Calendar>
    );
  },
  parameters: { controls: { exclude: rangeControls } },
};
Multiple.storyName = "Multiple";

export const WithHome: Story = {
  args: { showHome: true },
};
WithHome.storyName = "With home";

export const NarrowContainer: Story = {
  args: {
    allowClear: true,
    prefix: "Trip:",
    showHome: true,
  },
  parameters: {
    storyWidth: 220,
    viewport: { defaultViewport: "narrow" },
  },
};
NarrowContainer.storyName = "Narrow container";

export const EmptyWithLabel: Story = {
  args: { emptyLabel: "Select a date" },
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(null);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        defaultViewDate={FIXED_DATE}
        {...getCalendarProps(args, ctx)}
      >
        <CalendarInfo {...getInfoProps(args)} />
        <CalendarDays />
      </Calendar>
    );
  },
  parameters: {
    controls: { exclude: [...rangeControls, ...relativeControls] },
  },
};
EmptyWithLabel.storyName = "Empty with label";

export const Relative: Story = {
  args: { showRelative: true, showSummary: false },
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(() => addDays(FIXED_DATE, 3));
    return (
      <Calendar
        value={date}
        onChange={setDate}
        {...getCalendarProps(args, ctx)}
      >
        <CalendarInfo
          {...getInfoProps(args)}
          showRelative
          showSummary={false}
        />
        <CalendarDays />
      </Calendar>
    );
  },
  parameters: {
    controls: { exclude: [...rangeControls, ...relativeControls] },
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
        {...getCalendarProps(args, ctx)}
      >
        <CalendarInfo
          {...getInfoProps(args)}
          formatter={(value) => {
            if (!value || value instanceof Date || Array.isArray(value)) {
              return null;
            }
            if (!value.from || !value.to) return null;
            const days = Math.round(
              Math.abs(value.to.getTime() - value.from.getTime()) / 86_400_000,
            );
            return `Trip is ${days} ${days === 1 ? "night" : "nights"} long`;
          }}
        />
        <CalendarDays />
      </Calendar>
    );
  },
  parameters: {
    controls: { exclude: [...rangeControls, ...relativeControls] },
  },
};
CustomFormatters.storyName = "Custom formatter";
