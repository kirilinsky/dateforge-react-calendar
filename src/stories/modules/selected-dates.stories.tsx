import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarSelectedDates } from "@/modules/selected-dates";
import { FIXED_DATE } from "../_constants";
import {
  resolveStoryAppearance,
  resolveStoryGradient,
  resolveStoryLocale,
  resolveStoryTheme,
} from "../_helpers/resolve-globals";

type SelectedDatesArgs = {
  allowClear?: boolean;
  allowClearPerChip?: boolean;
  allowNavigate?: boolean;
  animated?: boolean;
  align?: "left" | "center" | "right";
  maxVisibleChips?: number;
  overflowLabel?: string;
  showTime?: boolean;
};

const meta: Meta<SelectedDatesArgs> = {
  title: "Modules/SelectedDates",
  argTypes: {
    allowClear: { control: "boolean" },
    allowClearPerChip: { control: "boolean" },
    allowNavigate: { control: "boolean" },
    animated: { control: "boolean" },
    align: { control: "inline-radio", options: ["left", "center", "right"] },
    maxVisibleChips: { control: "number" },
    overflowLabel: { control: "text" },
    showTime: { control: "boolean" },
  },
  args: {
    allowClear: false,
    allowClearPerChip: false,
    allowNavigate: true,
    animated: true,
    align: "left",
    overflowLabel: "+{count}",
    showTime: false,
  },
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarSelectedDates
          allowClear={args.allowClear}
          allowClearPerChip={args.allowClearPerChip}
          allowNavigate={args.allowNavigate}
          animated={args.animated}
          align={args.align}
          maxVisibleChips={args.maxVisibleChips}
          overflowLabel={args.overflowLabel}
          showTime={args.showTime}
        />
      </Calendar>
    );
  },
};

export default meta;

type Story = StoryObj<SelectedDatesArgs>;

export const Default: Story = {};

export const NoClear: Story = {
  args: { allowClear: false },
};
NoClear.storyName = "No clear";

export const WithClear: Story = {
  args: { allowClear: true },
};
WithClear.storyName = "With clear";

export const WithPerChipClear: Story = {
  args: { allowClearPerChip: true },
  render: (args, ctx) => {
    const [dates, setDates] = useState([
      FIXED_DATE,
      new Date(2024, 5, 16),
      new Date(2024, 5, 17),
    ]);
    return (
      <Calendar
        mode="multiple"
        value={dates}
        onChange={setDates}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarSelectedDates
          allowClear={args.allowClear}
          allowClearPerChip={args.allowClearPerChip}
          allowNavigate={args.allowNavigate}
          animated={args.animated}
          align={args.align}
          maxVisibleChips={args.maxVisibleChips}
          overflowLabel={args.overflowLabel}
          showTime={args.showTime}
        />
      </Calendar>
    );
  },
};
WithPerChipClear.storyName = "With per-chip clear";

export const NoNavigate: Story = {
  args: { allowNavigate: false },
};
NoNavigate.storyName = "No navigate";

export const WithTime: Story = {
  args: { showTime: true },
};
WithTime.storyName = "With time";

export const Overflow: Story = {
  args: { maxVisibleChips: 1 },
  render: (args, ctx) => {
    const [dates, setDates] = useState([
      FIXED_DATE,
      new Date(2024, 5, 16),
      new Date(2024, 5, 17),
      new Date(2024, 5, 18),
    ]);
    return (
      <Calendar
        mode="multiple"
        value={dates}
        onChange={setDates}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarSelectedDates
          allowClear={args.allowClear}
          allowClearPerChip={args.allowClearPerChip}
          allowNavigate={args.allowNavigate}
          animated={args.animated}
          align={args.align}
          maxVisibleChips={args.maxVisibleChips}
          overflowLabel={args.overflowLabel}
          showTime={args.showTime}
        />
      </Calendar>
    );
  },
};
Overflow.storyName = "Overflow";

export const NarrowContainer: Story = {
  args: {
    allowClear: true,
    allowClearPerChip: true,
    showTime: true,
  },
  render: (args, ctx) => {
    const [dates, setDates] = useState([
      FIXED_DATE,
      new Date(2024, 5, 16, 11, 30),
      new Date(2024, 5, 17, 16, 45),
    ]);
    return (
      <Calendar
        mode="multiple"
        value={dates}
        onChange={setDates}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarSelectedDates
          allowClear={args.allowClear}
          allowClearPerChip={args.allowClearPerChip}
          allowNavigate={args.allowNavigate}
          animated={args.animated}
          align={args.align}
          maxVisibleChips={args.maxVisibleChips}
          overflowLabel={args.overflowLabel}
          showTime={args.showTime}
        />
      </Calendar>
    );
  },
  parameters: {
    storyWidth: 220,
    viewport: { defaultViewport: "narrow" },
  },
};
NarrowContainer.storyName = "Narrow container";

export const AnimatedOff: Story = {
  args: { animated: false },
};
AnimatedOff.storyName = "Animated off";

export const AlignCenter: Story = {
  args: { align: "center" },
};
AlignCenter.storyName = "Aligned center";
