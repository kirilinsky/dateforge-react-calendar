import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import {
  CalendarInfo,
  type CalendarInfoProps,
  type CalendarInfoRangeStyle,
  type CalendarInfoRelativeTarget,
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
  hour12?: boolean;
  label?: string;
  prefix?: string;
  rangeStyle?: CalendarInfoRangeStyle;
  relativeTarget?: CalendarInfoRelativeTarget;
  showHome?: boolean;
  timeZone?: string;
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

const getCalendarProps = (
  args: CalendarInfoArgs,
  ctx: Parameters<NonNullable<Meta<CalendarInfoArgs>["render"]>>[1],
) => ({
  appearance: resolveStoryAppearance(ctx.globals.appearance),
  hour12: args.hour12,
  locale: resolveStoryLocale(ctx.globals.locale),
  theme: resolveStoryTheme(ctx.globals.theme),
  timeZone: args.timeZone || undefined,
});

const getInfoProps = (args: CalendarInfoArgs): CalendarInfoProps => ({
  allowClear: args.allowClear,
  align: args.align,
  animated: args.animated,
  label: args.label,
  prefix: args.prefix,
  rangeStyle: args.rangeStyle,
  relativeTarget: args.relativeTarget,
  showHome: args.showHome,
  variant: args.variant,
});

const rangeControls = ["prefix", "rangeStyle"];

const relativeControls = ["relativeTarget", "variant"];

const meta: Meta<CalendarInfoArgs> = {
  title: "Modules/Info",
  argTypes: {
    allowClear: { control: "boolean" },
    align: { control: "inline-radio", options: ["left", "center", "right"] },
    animated: { control: "boolean" },
    hour12: { control: "boolean" },
    label: { control: "text" },
    prefix: { control: "text" },
    rangeStyle: {
      control: "inline-radio",
      options: ["days", "duration"],
    },
    relativeTarget: {
      control: "inline-radio",
      options: ["selected", "range-start", "range-end"],
    },
    showHome: { control: "boolean" },
    timeZone: { control: "text" },
    variant: { control: "inline-radio", options: ["summary", "relative"] },
  },
  args: {
    allowClear: false,
    align: "left",
    animated: true,
    hour12: false,
    label: undefined,
    prefix: undefined,
    rangeStyle: "days",
    relativeTarget: "selected",
    showHome: false,
    timeZone: undefined,
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
        <CalendarInfo
          {...getInfoProps(args)}
          selectionCountFormatter={(count) => `${count} dates selected`}
        />
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

export const EmptyWithLabel: Story = {
  args: { label: "Select a date" },
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(null);
    return (
      <Calendar
        value={date}
        onChange={setDate}
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
  args: { variant: "relative" },
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(addDays(FIXED_DATE, 3));
    return (
      <Calendar
        value={date}
        onChange={setDate}
        {...getCalendarProps(args, ctx)}
      >
        <CalendarInfo
          {...getInfoProps(args)}
          formatter={({ formatRelative, locale, selectedDate }) =>
            selectedDate
              ? `Today: ${formatStoryDate(FIXED_DATE, locale)} · ${formatRelative(selectedDate, FIXED_DATE)}`
              : args.label
          }
          relativeBaseDate={FIXED_DATE}
        />
        <CalendarDays />
      </Calendar>
    );
  },
  parameters: { controls: { exclude: rangeControls } },
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
          unitFormatter={(value, unit) => {
            if (unit === "day")
              return `${value} ${value === 1 ? "night" : "nights"}`;
            return undefined;
          }}
          rangeFormatter={({ formatUnit, durationDays }) =>
            `Trip length: ${formatUnit(durationDays, "day")}`
          }
        />
        <CalendarDays />
      </Calendar>
    );
  },
  parameters: {
    controls: {
      exclude: ["prefix", "rangeStyle", "relativeTarget", "variant"],
    },
  },
};
CustomFormatters.storyName = "Custom formatters";
