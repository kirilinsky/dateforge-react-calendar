import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import { CalendarNav } from "@/modules/nav";
import { FIXED_DATE } from "../_constants";
import { debugStyle, fmtDate } from "../_helpers/debug";
import {
  resolveStoryAppearance,
  resolveStoryLocale,
  resolveStoryTheme,
} from "../_helpers/resolve-globals";

const meta: Meta = {
  title: "Patterns/Controlled",
};

export default meta;

type Story = StoryObj;

export const Controlled: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(null);
    return (
      <>
        <p style={debugStyle}>
          External value: {date ? fmtDate(date) : "null"}
        </p>
        <button
          type="button"
          onClick={() => setDate(FIXED_DATE)}
          style={{ marginBottom: 8, padding: "4px 8px", fontSize: 12 }}
        >
          Reset to {fmtDate(FIXED_DATE)}
        </button>
        <Calendar
          value={date}
          onChange={setDate}
          defaultViewDate={FIXED_DATE}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
          locale={resolveStoryLocale(ctx.globals.locale)}
        >
          <CalendarNav showMonthPicker compactYears />
          <CalendarDays />
        </Calendar>
      </>
    );
  },
};
Controlled.storyName = "Controlled (value + onChange)";
