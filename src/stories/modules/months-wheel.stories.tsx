import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarMonthsWheel } from "@/modules/months-wheel";
import { FIXED_DATE } from "../_constants";
import { debugStyle, fmtRange } from "../_helpers/debug";
import {
  resolveStoryAppearance,
  resolveStoryGradient,
  resolveStoryLocale,
  resolveStoryTheme,
  resolveStoryThemeMode,
} from "../_helpers/resolve-globals";

type MonthsWheelArgs = {
  showLabel?: boolean;
  shortMonths?: boolean;
};

const meta: Meta<MonthsWheelArgs> = {
  title: "Modules/MonthsWheel",
  argTypes: {
    showLabel: { control: "boolean" },
    shortMonths: { control: "boolean" },
  },
  args: {
    showLabel: false,
    shortMonths: false,
  },
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarMonthsWheel
          showLabel={args.showLabel}
          shortMonths={args.shortMonths}
        />
      </Calendar>
    );
  },
};

export default meta;

type Story = StoryObj<MonthsWheelArgs>;

export const Default: Story = {};
Default.storyName = "Default";

export const WithLabel: Story = {
  args: { showLabel: true },
};
WithLabel.storyName = "With localized label";

export const ShortMonths: Story = {
  args: { shortMonths: true },
};
ShortMonths.storyName = "Short month names (Jan, Feb, ...)";

export const ShowReset: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarMonthsWheel showReset />
      </Calendar>
    );
  },
};
ShowReset.storyName = "showReset — reset to current month";

export const BoundFromTo: Story = {
  render: (_args, ctx) => {
    const [range, setRange] = useState<{
      from: Date | null;
      to: Date | null;
    }>({
      from: new Date(2024, 2, 15),
      to: new Date(2024, 8, 20),
    });
    return (
      <>
        <p style={debugStyle}>{fmtRange(range)}</p>
        <Calendar
          mode="range"
          cols={2}
          value={range}
          onChange={setRange}
          theme={resolveStoryTheme(ctx.globals.theme)}
          {...resolveStoryThemeMode(ctx.globals.themeMode)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
          gradient={resolveStoryGradient(ctx.globals.gradient)}
          locale={resolveStoryLocale(ctx.globals.locale)}
        >
          <CalendarMonthsWheel bound="from" col={1} />
          <CalendarMonthsWheel bound="to" col={1} />
        </Calendar>
      </>
    );
  },
  parameters: { storyWidth: 520 },
};
BoundFromTo.storyName = "Bound — from + to side by side";
