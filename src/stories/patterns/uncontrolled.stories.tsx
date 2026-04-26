import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import { CalendarNav } from "@/modules/nav";
import { FIXED_DATE } from "../_constants";
import {
  resolveStoryTheme,
  resolveStoryAppearance,
} from "../_helpers/resolve-globals";
import { debugStyle, fmtDate } from "../_helpers/debug";

const meta: Meta = {
  title: "Patterns/Uncontrolled",
};

export default meta;

type Story = StoryObj;

export const Uncontrolled: Story = {
  render: (_args, ctx) => {
    const [last, setLast] = useState<Date | null>(null);
    const [resetTick, setResetTick] = useState(0);
    return (
      <>
        <p style={debugStyle}>Last onChange: {last ? fmtDate(last) : "—"}</p>
        <p style={{ ...debugStyle, marginBottom: 8, opacity: 0.6 }}>
          Reset clicks: {resetTick} — calendar must NOT change
          (defaultValue read once on mount).
        </p>
        <button
          type="button"
          onClick={() => setResetTick((t) => t + 1)}
          style={{ marginBottom: 8, padding: "4px 8px", fontSize: 12 }}
        >
          Bump defaultValue (no effect)
        </button>
        <Calendar
          defaultValue={FIXED_DATE}
          onChange={setLast}
          defaultViewDate={FIXED_DATE}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarNav showMonthPicker compactYears />
          <CalendarDays />
        </Calendar>
      </>
    );
  },
};
Uncontrolled.storyName = "Uncontrolled (defaultValue + onChange)";
