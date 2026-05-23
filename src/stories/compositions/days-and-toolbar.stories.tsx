import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarSelectedDates } from "@/modules";
import { CalendarDays } from "@/modules/days";
import { FIXED_DATE } from "../_constants";
import {
  resolveStoryAppearance,
  resolveStoryGradient,
  resolveStoryLocale,
  resolveStoryTheme,
  resolveStoryThemeMode,
} from "../_helpers/resolve-globals";
import { StoryToolbar } from "../_helpers/story-toolbar";

const meta: Meta = {
  title: "Compositions/Days + Toolbar + Selected",
};

export default meta;

export const Default: StoryObj = {
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
        <StoryToolbar showTime showMonthPicker compactYears />
        <CalendarDays />
        <CalendarSelectedDates showTime />
      </Calendar>
    );
  },
};
