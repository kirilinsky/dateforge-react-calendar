import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarSelectedDates } from "@/modules";
import { CalendarDays } from "@/modules/days";
import { CalendarNav } from "@/modules/nav";
import { FIXED_DATE } from "../_constants";
import {
  resolveStoryAppearance,
  resolveStoryTheme,
} from "../_helpers/resolve-globals";

const meta: Meta = {
  title: "Compositions/Days + Nav + Selected",
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
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarNav showTime showMonthPicker yearLabel />
        <CalendarDays />
        <CalendarSelectedDates showTime />
      </Calendar>
    );
  },
};
