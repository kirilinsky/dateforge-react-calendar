import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import { FIXED_DATE } from "../_constants";
import {
  resolveStoryTheme,
  resolveStoryAppearance,
} from "../_helpers/resolve-globals";

type DaysArgs = {
  startOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  currentMonthOnly?: boolean;
  highlightWeekends?: boolean;
  boldWeekends?: boolean;
  highlightToday?: boolean;
  fixedRows?: boolean;
  weekNumbers?: boolean;
  hideWeekdays?: boolean;
  hideOutOfRange?: boolean;
  lockDeselection?: boolean;
  blockNavigation?: boolean;
  swipe?: boolean;
};

const meta: Meta<DaysArgs> = {
  title: "Modules/Days",
  argTypes: {
    startOfWeek: {
      control: { type: "select" },
      options: [0, 1, 2, 3, 4, 5, 6],
    },
    currentMonthOnly: { control: "boolean" },
    highlightWeekends: { control: "boolean" },
    boldWeekends: { control: "boolean" },
    highlightToday: { control: "boolean" },
    fixedRows: { control: "boolean" },
    weekNumbers: { control: "boolean" },
    hideWeekdays: { control: "boolean" },
    hideOutOfRange: { control: "boolean" },
    lockDeselection: { control: "boolean" },
    blockNavigation: { control: "boolean" },
    swipe: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<DaysArgs>;

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
        <CalendarDays />
      </Calendar>
    );
  },
};

export const WeekNumbers: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarDays weekNumbers />
      </Calendar>
    );
  },
};
WeekNumbers.storyName = "With week numbers";

export const BoldWeekends: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarDays boldWeekends />
      </Calendar>
    );
  },
};
BoldWeekends.storyName = "Bold weekends";

export const HiddenWeekdayHeader: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarDays hideWeekdays />
      </Calendar>
    );
  },
};
HiddenWeekdayHeader.storyName = "Hidden weekday header";

export const StartOfWeekSunday: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarDays startOfWeek={0} />
      </Calendar>
    );
  },
};
StartOfWeekSunday.storyName = "Custom start of week (Sunday)";

export const HideOutOfRange: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        minDate={new Date(2016, 1, 3)}
        maxDate={new Date(2016, 1, 20)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarDays hideOutOfRange blockNavigation />
      </Calendar>
    );
  },
};
HideOutOfRange.storyName = "Hide out-of-range";

export const FixedRowsOff: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarDays fixedRows={false} />
      </Calendar>
    );
  },
};
FixedRowsOff.storyName = "Fixed rows off";

export const LockedDeselection: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarDays lockDeselection />
      </Calendar>
    );
  },
};
LockedDeselection.storyName = "Locked deselection";

export const BlockNavigation: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarDays blockNavigation />
      </Calendar>
    );
  },
};
BlockNavigation.storyName = "Block navigation";

export const CurrentMonthOnly: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarDays currentMonthOnly />
      </Calendar>
    );
  },
};
CurrentMonthOnly.storyName = "Current month only";

export const MultiMonthOffset: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        cols={2}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarDays offset={0} col={1} />
        <CalendarDays offset={1} col={2} />
      </Calendar>
    );
  },
};
MultiMonthOffset.storyName = "Multi-month (offset)";

export const Playground: Story = {
  args: {
    startOfWeek: 1,
    currentMonthOnly: false,
    highlightWeekends: true,
    boldWeekends: false,
    highlightToday: true,
    fixedRows: true,
    weekNumbers: false,
    hideWeekdays: false,
    hideOutOfRange: false,
    lockDeselection: false,
    blockNavigation: false,
    swipe: true,
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
        <CalendarDays
          startOfWeek={args.startOfWeek}
          currentMonthOnly={args.currentMonthOnly}
          highlightWeekends={args.highlightWeekends}
          boldWeekends={args.boldWeekends}
          highlightToday={args.highlightToday}
          fixedRows={args.fixedRows}
          weekNumbers={args.weekNumbers}
          hideWeekdays={args.hideWeekdays}
          hideOutOfRange={args.hideOutOfRange}
          lockDeselection={args.lockDeselection}
          blockNavigation={args.blockNavigation}
          swipe={args.swipe}
        />
      </Calendar>
    );
  },
};
