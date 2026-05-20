import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarYearsWheel } from "@/modules/years-wheel";
import { FIXED_DATE } from "../_constants";
import { debugStyle, fmtRange } from "../_helpers/debug";
import {
  resolveStoryAppearance,
  resolveStoryGradient,
  resolveStoryLocale,
  resolveStoryTheme,
  resolveStoryThemeMode,
} from "../_helpers/resolve-globals";

type YearsWheelArgs = {
  showLabel?: boolean;
};

const meta: Meta<YearsWheelArgs> = {
  title: "Modules/YearsWheel",
  argTypes: {
    showLabel: { control: "boolean" },
  },
  args: {
    showLabel: false,
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
        <CalendarYearsWheel showLabel={args.showLabel} />
      </Calendar>
    );
  },
};

export default meta;

type Story = StoryObj<YearsWheelArgs>;

export const Default: Story = {};
Default.storyName = "Default";

export const WithLabel: Story = {
  args: { showLabel: true },
};
WithLabel.storyName = "With localized label";

export const ShowReset: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(new Date(2020, 5, 1));
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
        <CalendarYearsWheel showReset />
      </Calendar>
    );
  },
};
ShowReset.storyName = "showReset — reset to current year";

export const BoundFromTo: Story = {
  render: (_args, ctx) => {
    const [range, setRange] = useState<{
      from: Date | null;
      to: Date | null;
    }>({
      from: new Date(2022, 5, 15),
      to: new Date(2025, 8, 20),
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
          <CalendarYearsWheel bound="from" col={1} />
          <CalendarYearsWheel bound="to" col={1} />
        </Calendar>
      </>
    );
  },
  parameters: { storyWidth: 520 },
};
BoundFromTo.storyName = "Bound — from + to side by side";

export const Constrained: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(new Date(2020, 5, 1));
    return (
      <Calendar
        value={date}
        onChange={setDate}
        minDate={new Date(2018, 0, 1)}
        maxDate={new Date(2026, 11, 31)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarYearsWheel showLabel />
      </Calendar>
    );
  },
};
Constrained.storyName = "Constrained by minDate/maxDate (2018-2026)";
