import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarYearsGrid } from "@/modules/years-grid";
import { MAX_CALENDAR_YEAR, MIN_CALENDAR_YEAR } from "@/utils/year-range";
import { FIXED_DATE } from "../_constants";
import {
  resolveStoryAppearance,
  resolveStoryGradient,
  resolveStoryLocale,
  resolveStoryTheme,
} from "../_helpers/resolve-globals";

type YearsGridArgs = {
  yearsPerPage?: number;
  startYear?: number;
  showControls?: boolean;
  disableOutOfRange?: boolean;
  hideOutOfRange?: boolean;
};

const meta: Meta<YearsGridArgs> = {
  title: "Modules/YearsGrid",
  argTypes: {
    yearsPerPage: { control: { type: "number", min: 1, max: 40 } },
    startYear: {
      control: {
        type: "number",
        min: MIN_CALENDAR_YEAR,
        max: MAX_CALENDAR_YEAR,
      },
    },
    showControls: { control: "boolean" },
    disableOutOfRange: { control: "boolean" },
    hideOutOfRange: { control: "boolean" },
  },
  args: {
    yearsPerPage: 10,
    showControls: true,
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
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarYearsGrid
          yearsPerPage={args.yearsPerPage}
          startYear={args.startYear}
          showControls={args.showControls}
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

export const CustomStartYear: Story = {
  args: { yearsPerPage: 12, startYear: 2014 },
};
CustomStartYear.storyName = "Custom start year";

export const WithoutControls: Story = {
  args: { showControls: false, yearsPerPage: 12, startYear: 2014 },
};
WithoutControls.storyName = "Without pagination controls";

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
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarYearsGrid
          yearsPerPage={args.yearsPerPage}
          startYear={args.startYear}
          showControls={args.showControls}
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
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarYearsGrid
          yearsPerPage={args.yearsPerPage}
          startYear={args.startYear}
          showControls={args.showControls}
          disableOutOfRange={args.disableOutOfRange}
          hideOutOfRange={args.hideOutOfRange}
        />
      </Calendar>
    );
  },
};
HideOutOfRange.storyName = "Hide out-of-range years";

export const StandaloneYearPicker: Story = {
  render: (args, ctx) => {
    const [picked, setPicked] = useState<Date | null>(null);
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <div data-testid="picked-year" style={{ fontSize: 14 }}>
          Picked: <strong>{picked ? picked.getFullYear() : "—"}</strong>
        </div>
        <Calendar
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
          gradient={resolveStoryGradient(ctx.globals.gradient)}
          locale={resolveStoryLocale(ctx.globals.locale)}
        >
          <CalendarYearsGrid
            yearsPerPage={args.yearsPerPage}
            startYear={args.startYear}
            showControls={args.showControls}
            disableOutOfRange={args.disableOutOfRange}
            hideOutOfRange={args.hideOutOfRange}
            onYearSelect={setPicked}
          />
        </Calendar>
      </div>
    );
  },
};
StandaloneYearPicker.storyName = "Standalone year picker (onYearSelect)";
