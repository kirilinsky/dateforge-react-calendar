import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import { CalendarNav } from "@/modules/nav";
import { createDisabled } from "@/utils/create-disabled";
import { FIXED_DATE } from "../_constants";
import {
  resolveStoryTheme,
  resolveStoryAppearance,
} from "../_helpers/resolve-globals";
import { debugStyle, fmtRange } from "../_helpers/debug";

type RangeValue = { from: Date | null; to: Date | null };

const meta: Meta = {
  title: "Modes/Range",
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: (_args, ctx) => {
    const [range, setRange] = useState<RangeValue>({ from: FIXED_DATE, to: new Date(2016, 1, 20) });
    return (
      <>
        <p style={debugStyle}>{fmtRange(range)}</p>
        <Calendar
          mode="range"
          value={range}
          onChange={setRange}
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

export const WithMinRangeDays: Story = {
  render: (_args, ctx) => {
    const [range, setRange] = useState<RangeValue>({ from: null, to: null });
    return (
      <>
        <p style={debugStyle}>{fmtRange(range)}</p>
        <p style={{ ...debugStyle, marginBottom: 8, color: "inherit", opacity: 0.6 }}>
          minRangeDays=3 — range shorter than 3 days not selectable
        </p>
        <Calendar
          mode="range"
          value={range}
          onChange={setRange}
          minRangeDays={3}
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
WithMinRangeDays.storyName = "With minRangeDays";

export const WithMaxRangeDays: Story = {
  render: (_args, ctx) => {
    const [range, setRange] = useState<RangeValue>({ from: null, to: null });
    return (
      <>
        <p style={debugStyle}>{fmtRange(range)}</p>
        <p style={{ ...debugStyle, marginBottom: 8, color: "inherit", opacity: 0.6 }}>
          maxRangeDays=7 — range longer than 7 days not selectable
        </p>
        <Calendar
          mode="range"
          value={range}
          onChange={setRange}
          maxRangeDays={7}
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
WithMaxRangeDays.storyName = "With maxRangeDays";

export const HoverPreview: Story = {
  render: (_args, ctx) => {
    const [range, setRange] = useState<RangeValue>({ from: FIXED_DATE, to: null });
    return (
      <>
        <p style={debugStyle}>{fmtRange(range)}</p>
        <Calendar
          mode="range"
          value={range}
          onChange={setRange}
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
HoverPreview.storyName = "Hover preview";

export const DisabledInsideRange: Story = {
  render: (_args, ctx) => {
    const [range, setRange] = useState<RangeValue>({ from: null, to: null });
    const disabled = useMemo(
      () => createDisabled({ dates: [new Date(2016, 1, 10), new Date(2016, 1, 11), new Date(2016, 1, 12)] }),
      [],
    );
    return (
      <>
        <p style={debugStyle}>{fmtRange(range)}</p>
        <p style={{ ...debugStyle, marginBottom: 8, color: "inherit", opacity: 0.6 }}>
          Feb 10–12 disabled — range spanning them still selectable
        </p>
        <Calendar
          mode="range"
          value={range}
          onChange={setRange}
          disabled={disabled}
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
DisabledInsideRange.storyName = "Disabled inside range";

export const TwoMonths: Story = {
  render: (_args, ctx) => {
    const [range, setRange] = useState<RangeValue>({ from: new Date(2016, 3, 21), to: new Date(2016, 4, 11) });
    return (
      <>
        <p style={debugStyle}>{fmtRange(range)}</p>
        <Calendar
          mode="range"
          value={range}
          onChange={setRange}
          cols={4}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarNav showMonthPicker  col={2} />
          <CalendarNav monthLabel compactYears offset={1} col={2} />
          <CalendarDays offset={0} col={2} />
          <CalendarDays offset={1} col={2} />
        </Calendar>
      </>
    );
  },
};
TwoMonths.storyName = "Two months side by side";
TwoMonths.parameters = { storyWidth: 915 };

export const ReadOnly: Story = {
  render: (_args, ctx) => {
    return (
      <Calendar
        mode="range"
        value={{ from: FIXED_DATE, to: new Date(2016, 1, 20) }}
        onChange={() => {}}
        readOnly
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarNav showMonthPicker compactYears />
        <CalendarDays />
      </Calendar>
    );
  },
};
ReadOnly.storyName = "Read-only";
