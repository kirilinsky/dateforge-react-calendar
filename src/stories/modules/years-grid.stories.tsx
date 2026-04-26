import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarYearsGrid } from "@/modules/years-grid";
import { FIXED_DATE } from "../_constants";
import {
  resolveStoryTheme,
  resolveStoryAppearance,
} from "../_helpers/resolve-globals";

type YearsGridArgs = {
  yearsPerPage?: number;
  disableOutOfRange?: boolean;
  hideOutOfRange?: boolean;
};

const meta: Meta<YearsGridArgs> = {
  title: "Modules/YearsGrid",
  argTypes: {
    yearsPerPage: { control: { type: "number", min: 1, max: 40 } },
    disableOutOfRange: { control: "boolean" },
    hideOutOfRange: { control: "boolean" },
  },
  args: {
    yearsPerPage: 10,
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
        <CalendarYearsGrid
          yearsPerPage={args.yearsPerPage}
          disableOutOfRange={args.disableOutOfRange}
          hideOutOfRange={args.hideOutOfRange}
        />
      </Calendar>
    );
  },
};

export default meta;

type Story = StoryObj<YearsGridArgs>;

export const Default: Story = {};

export const DecadePagination: Story = {
  args: { yearsPerPage: 10 },
};
DecadePagination.storyName = "Decade pagination (yearsPerPage=10)";

export const WithDisabledRange: Story = {
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        minDate={new Date(2014, 0, 1)}
        maxDate={new Date(2020, 11, 31)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarYearsGrid
          yearsPerPage={args.yearsPerPage}
          disableOutOfRange={args.disableOutOfRange}
          hideOutOfRange={args.hideOutOfRange}
        />
      </Calendar>
    );
  },
};
WithDisabledRange.storyName = "Disabled out-of-range years";

export const HideOutOfRange: Story = {
  args: { hideOutOfRange: true },
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        minDate={new Date(2014, 0, 1)}
        maxDate={new Date(2020, 11, 31)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarYearsGrid
          yearsPerPage={args.yearsPerPage}
          disableOutOfRange={args.disableOutOfRange}
          hideOutOfRange={args.hideOutOfRange}
        />
      </Calendar>
    );
  },
};
HideOutOfRange.storyName = "Hide out-of-range years";
