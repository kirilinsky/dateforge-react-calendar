import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarNav } from "@/modules/nav";
import { FIXED_DATE } from "../_constants";
import {
  resolveStoryTheme,
  resolveStoryAppearance,
} from "../_helpers/resolve-globals";

type NavArgs = {
  label?: string;
  showMonthPicker?: boolean;
  compactMonths?: boolean;
  showYearPicker?: boolean;
  compactYears?: boolean;
  animateTime?: boolean;
  monthLabel?: boolean;
  yearLabel?: boolean;
  showTime?: boolean;
  showNowTime?: boolean;
  seconds?: boolean;
  home?: boolean;
  clear?: boolean;
  themeToggle?: boolean;
};

const meta: Meta<NavArgs> = {
  title: "Modules/Nav",
  argTypes: {
    label: { control: "text" },
    showMonthPicker: { control: "boolean" },
    compactMonths: { control: "boolean" },
    showYearPicker: { control: "boolean" },
    compactYears: { control: "boolean" },
    animateTime: { control: "boolean" },
    monthLabel: { control: "boolean" },
    yearLabel: { control: "boolean" },
    showTime: { control: "boolean" },
    showNowTime: { control: "boolean" },
    seconds: { control: "boolean" },
    home: { control: "boolean" },
    clear: { control: "boolean" },
    themeToggle: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<NavArgs>;

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
        <CalendarNav showMonthPicker showYearPicker />
      </Calendar>
    );
  },
};

export const WithMonthPicker: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarNav showMonthPicker />
      </Calendar>
    );
  },
};
WithMonthPicker.storyName = "With month picker";

export const WithYearPicker: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarNav showYearPicker />
      </Calendar>
    );
  },
};
WithYearPicker.storyName = "With year picker";

export const CompactMonths: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarNav compactMonths />
      </Calendar>
    );
  },
};
CompactMonths.storyName = "Compact months";

export const CompactYears: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarNav compactYears />
      </Calendar>
    );
  },
};
CompactYears.storyName = "Compact years";

export const AmbiguousMonthCombo: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        {/* Both props active — dev warn fires (expected) */}
        <CalendarNav showMonthPicker compactMonths />
      </Calendar>
    );
  },
};
AmbiguousMonthCombo.storyName = "Ambiguous month combo (dev warn fires)";

export const WithClearAndHome: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarNav showMonthPicker showYearPicker home clear />
      </Calendar>
    );
  },
};
WithClearAndHome.storyName = "With clear and home";

export const WithThemeToggle: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarNav showMonthPicker showYearPicker themeToggle />
      </Calendar>
    );
  },
};
WithThemeToggle.storyName = "With theme toggle";

export const ShowNowTime: Story = {
  parameters: { chromatic: { disable: true } },
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarNav showMonthPicker showNowTime />
      </Calendar>
    );
  },
};
ShowNowTime.storyName = "Show now time (live clock)";

export const ShowTimePicker: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarNav showMonthPicker showTime />
      </Calendar>
    );
  },
};
ShowTimePicker.storyName = "Show time picker popup";

export const Playground: Story = {
  args: {
    showMonthPicker: true,
    showYearPicker: true,
    animateTime: true,
    monthLabel: false,
    yearLabel: false,
    showTime: false,
    showNowTime: false,
    seconds: false,
    home: false,
    clear: false,
    themeToggle: false,
  },
  parameters: { chromatic: { disable: true } },
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarNav
          label={args.label}
          showMonthPicker={args.showMonthPicker}
          compactMonths={args.compactMonths}
          showYearPicker={args.showYearPicker}
          compactYears={args.compactYears}
          animateTime={args.animateTime}
          monthLabel={args.monthLabel}
          yearLabel={args.yearLabel}
          showTime={args.showTime}
          showNowTime={args.showNowTime}
          seconds={args.seconds}
          home={args.home}
          clear={args.clear}
          themeToggle={args.themeToggle}
        />
      </Calendar>
    );
  },
};
