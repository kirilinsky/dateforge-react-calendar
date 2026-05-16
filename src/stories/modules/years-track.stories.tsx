import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarYearsTrack } from "@/modules/years-track";
import { FIXED_DATE } from "../_constants";
import { debugStyle, fmtRange } from "../_helpers/debug";
import {
  resolveStoryAppearance,
  resolveStoryGradient,
  resolveStoryLocale,
  resolveStoryTheme,
} from "../_helpers/resolve-globals";

const meta: Meta = {
  title: "Modules/YearsTrack",
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: (_args, ctx) => {
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
        <CalendarYearsTrack />
      </Calendar>
    );
  },
};

export const RangeBounds: Story = {
  render: (_args, ctx) => {
    const [range, setRange] = useState<{ from: Date | null; to: Date | null }>({
      from: FIXED_DATE,
      to: new Date(2018, 1, 5),
    });
    return (
      <>
        <p style={debugStyle}>{fmtRange(range)}</p>
        <Calendar
          mode="range"
          value={range}
          onChange={setRange}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
          gradient={resolveStoryGradient(ctx.globals.gradient)}
          locale={resolveStoryLocale(ctx.globals.locale)}
        >
          <CalendarYearsTrack bound="from" />
          <CalendarYearsTrack bound="to" />
        </Calendar>
      </>
    );
  },
};
RangeBounds.storyName = "Range — from + to tracks";

export const StandaloneYearPicker: Story = {
  render: (_args, ctx) => {
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
          <CalendarYearsTrack onYearSelect={setPicked} />
        </Calendar>
      </div>
    );
  },
};
StandaloneYearPicker.storyName = "Standalone year picker (onYearSelect)";
