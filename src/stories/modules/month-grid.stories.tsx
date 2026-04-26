import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarMonthGrid } from "@/modules/month-grid";
import { FIXED_DATE } from "../_constants";
import {
  resolveStoryTheme,
  resolveStoryAppearance,
} from "../_helpers/resolve-globals";

type MonthGridArgs = {
  short?: boolean;
  disableOutOfRange?: boolean;
  hideOutOfRange?: boolean;
};

const meta: Meta<MonthGridArgs> = {
  title: "Modules/MonthGrid",
  argTypes: {
    short: { control: "boolean" },
    disableOutOfRange: { control: "boolean" },
    hideOutOfRange: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<MonthGridArgs>;

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
        <CalendarMonthGrid />
      </Calendar>
    );
  },
};

export const FullNames: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarMonthGrid short={false} />
      </Calendar>
    );
  },
};
FullNames.storyName = "Full month names";

export const WithDisabledRange: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        minDate={new Date(2016, 1, 1)}
        maxDate={new Date(2016, 8, 30)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarMonthGrid />
      </Calendar>
    );
  },
};
WithDisabledRange.storyName = "Disabled out-of-range months";

export const HideOutOfRange: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        minDate={new Date(2016, 1, 1)}
        maxDate={new Date(2016, 8, 30)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarMonthGrid hideOutOfRange />
      </Calendar>
    );
  },
};
HideOutOfRange.storyName = "Hide out-of-range months";

export const LocaleRU: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        locale="ru"
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarMonthGrid />
      </Calendar>
    );
  },
};
LocaleRU.storyName = "Locale RU";

export const Playground: Story = {
  args: {
    short: true,
    disableOutOfRange: true,
    hideOutOfRange: false,
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
        <CalendarMonthGrid
          short={args.short}
          disableOutOfRange={args.disableOutOfRange}
          hideOutOfRange={args.hideOutOfRange}
        />
      </Calendar>
    );
  },
};
