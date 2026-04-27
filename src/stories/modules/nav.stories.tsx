import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarNav } from "@/modules/nav";
import { FIXED_DATE } from "../_constants";
import {
  resolveStoryAppearance,
  resolveStoryTheme,
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
  args: {
    showMonthPicker: false,
    compactMonths: false,
    showYearPicker: false,
    compactYears: false,
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

export default meta;

type Story = StoryObj<NavArgs>;

export const Default: Story = {
  args: { showMonthPicker: true, showYearPicker: true },
};

export const WithMonthPicker: Story = {
  args: { showMonthPicker: true },
};
WithMonthPicker.storyName = "With month picker";

export const WithYearPicker: Story = {
  args: { showYearPicker: true },
};
WithYearPicker.storyName = "With year picker";

export const CompactMonths: Story = {
  args: { compactMonths: true },
};
CompactMonths.storyName = "Compact months";

export const CompactYears: Story = {
  args: { compactYears: true },
};
CompactYears.storyName = "Compact years";

export const AmbiguousMonthCombo: Story = {
  args: { showMonthPicker: true, compactMonths: true },
};
AmbiguousMonthCombo.storyName = "Ambiguous month combo (dev warn fires)";

export const WithClearAndHome: Story = {
  args: {
    showMonthPicker: true,
    showYearPicker: true,
    home: true,
    clear: true,
  },
};
WithClearAndHome.storyName = "With clear and home";

export const WithThemeToggle: Story = {
  args: { showMonthPicker: true, compactYears: true, themeToggle: true },
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme="auto"
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
WithThemeToggle.storyName = "With theme toggle";

export const ShowNowTime: Story = {
  args: { showMonthPicker: true, showNowTime: true },
  parameters: { chromatic: { disable: true } },
};
ShowNowTime.storyName = "Show now time (live clock)";

export const ShowTimePicker: Story = {
  args: { showMonthPicker: true, showTime: true },
};
ShowTimePicker.storyName = "Show time picker popup";

export const WithLabel: Story = {
  args: { label: "This is label" },
};
WithLabel.storyName = "With label";
