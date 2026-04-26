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
    startOfWeek: { control: { type: "select" }, options: [0, 1, 2, 3, 4, 5, 6] },
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

export default meta;

type Story = StoryObj<DaysArgs>;

export const Default: Story = {};

export const WeekNumbers: Story = {
  args: { weekNumbers: true },
};
WeekNumbers.storyName = "With week numbers";

export const BoldWeekends: Story = {
  args: { boldWeekends: true },
};
BoldWeekends.storyName = "Bold weekends";

export const HiddenWeekdayHeader: Story = {
  args: { hideWeekdays: true },
};
HiddenWeekdayHeader.storyName = "Hidden weekday header";

export const StartOfWeekSunday: Story = {
  args: { startOfWeek: 0 },
};
StartOfWeekSunday.storyName = "Custom start of week (Sunday)";

export const HideOutOfRange: Story = {
  args: { hideOutOfRange: true, blockNavigation: true },
  render: (args, ctx) => {
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
HideOutOfRange.storyName = "Hide out-of-range";

export const FixedRowsOff: Story = {
  args: { fixedRows: false },
};
FixedRowsOff.storyName = "Fixed rows off";

export const LockedDeselection: Story = {
  args: { lockDeselection: true },
};
LockedDeselection.storyName = "Locked deselection";

export const BlockNavigation: Story = {
  args: { blockNavigation: true },
};
BlockNavigation.storyName = "Block navigation";

export const CurrentMonthOnly: Story = {
  args: { currentMonthOnly: true },
};
CurrentMonthOnly.storyName = "Current month only";

export const MultiMonthOffset: Story = {
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        cols={2}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarDays
          offset={0}
          col={1}
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
        <CalendarDays
          offset={1}
          col={2}
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
MultiMonthOffset.storyName = "Multi-month (offset)";
