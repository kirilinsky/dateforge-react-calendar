import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarMonthsGrid } from "@/modules/months-grid";
import { FIXED_DATE } from "../_constants";
import {
  resolveStoryAppearance,
  resolveStoryTheme,
} from "../_helpers/resolve-globals";

type MonthsGridArgs = {
  short?: boolean;
  disableOutOfRange?: boolean;
  hideOutOfRange?: boolean;
  locale?: string;
};

const meta: Meta<MonthsGridArgs> = {
  title: "Modules/MonthsGrid",
  argTypes: {
    short: { control: "boolean" },
    disableOutOfRange: { control: "boolean" },
    hideOutOfRange: { control: "boolean" },
    locale: { control: "text" },
  },
  args: {
    short: true,
    disableOutOfRange: true,
    hideOutOfRange: false,
    locale: undefined,
  },
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        locale={args.locale}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarMonthsGrid
          short={args.short}
          disableOutOfRange={args.disableOutOfRange}
          hideOutOfRange={args.hideOutOfRange}
        />
      </Calendar>
    );
  },
};

export default meta;

type Story = StoryObj<MonthsGridArgs>;

export const Default: Story = {};

export const FullNames: Story = {
  args: { short: false },
};
FullNames.storyName = "Full month names";

export const WithDisabledRange: Story = {
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        minDate={new Date(2016, 1, 1)}
        maxDate={new Date(2016, 8, 30)}
        locale={args.locale}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarMonthsGrid
          short={args.short}
          disableOutOfRange={args.disableOutOfRange}
          hideOutOfRange={args.hideOutOfRange}
        />
      </Calendar>
    );
  },
};
WithDisabledRange.storyName = "Disabled out-of-range months";

export const HideOutOfRange: Story = {
  args: { hideOutOfRange: true },
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        minDate={new Date(2016, 1, 1)}
        maxDate={new Date(2016, 8, 30)}
        locale={args.locale}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarMonthsGrid
          short={args.short}
          disableOutOfRange={args.disableOutOfRange}
          hideOutOfRange={args.hideOutOfRange}
        />
      </Calendar>
    );
  },
};
HideOutOfRange.storyName = "Hide out-of-range months";

export const LocaleRU: Story = {
  args: { locale: "ru" },
};
LocaleRU.storyName = "Locale RU";
