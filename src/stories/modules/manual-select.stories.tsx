import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarManualSelect } from "@/modules/manual-select";
import { FIXED_DATE } from "../_constants";
import {
  resolveStoryTheme,
  resolveStoryAppearance,
} from "../_helpers/resolve-globals";

type ManualSelectArgs = {
  allowClear?: boolean;
  align?: "left" | "center" | "right";
};

const meta: Meta<ManualSelectArgs> = {
  title: "Modules/ManualSelect",
  argTypes: {
    allowClear: { control: "boolean" },
    align: { control: "inline-radio", options: ["left", "center", "right"] },
  },
};

export default meta;

type Story = StoryObj<ManualSelectArgs>;

export const SingleEmpty: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(null);
    return (
      <>
        <p style={{ marginBottom: 8, fontFamily: "monospace", fontSize: 12 }}>
          value: {date?.toISOString() ?? "null"}
        </p>
        <Calendar
          value={date}
          onChange={setDate}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarManualSelect />
        </Calendar>
      </>
    );
  },
};
SingleEmpty.storyName = "Single — empty";

export const SinglePrefilled: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <>
        <p style={{ marginBottom: 8, fontFamily: "monospace", fontSize: 12 }}>
          value: {date?.toISOString() ?? "null"}
        </p>
        <Calendar
          value={date}
          onChange={setDate}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarManualSelect />
        </Calendar>
      </>
    );
  },
};
SinglePrefilled.storyName = "Single — pre-filled";

export const SingleEnterEscape: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(null);
    const [calls, setCalls] = useState(0);
    return (
      <>
        <p style={{ marginBottom: 4, fontFamily: "monospace", fontSize: 12 }}>
          value: {date?.toISOString() ?? "null"}
        </p>
        <p style={{ marginBottom: 8, fontFamily: "monospace", fontSize: 12 }}>
          onChange calls: {calls}
        </p>
        <Calendar
          value={date}
          onChange={(v) => { setDate(v as Date | null); setCalls((c) => c + 1); }}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarManualSelect />
        </Calendar>
      </>
    );
  },
};
SingleEnterEscape.storyName = "Single — Enter commits, Escape clears";

export const SingleInvalidDate: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(null);
    const [calls, setCalls] = useState(0);
    return (
      <>
        <p style={{ marginBottom: 4, fontFamily: "monospace", fontSize: 12 }}>
          value: {date?.toISOString() ?? "null"}
        </p>
        <p style={{ marginBottom: 4, fontFamily: "monospace", fontSize: 12 }}>
          onChange calls: {calls}
        </p>
        <p style={{ marginBottom: 8, fontSize: 11, color: "#888" }}>
          Try typing "32.13.2024" then Enter — no commit, red wrapper
        </p>
        <Calendar
          value={date}
          onChange={(v) => { setDate(v as Date | null); setCalls((c) => c + 1); }}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarManualSelect />
        </Calendar>
      </>
    );
  },
};
SingleInvalidDate.storyName = "Single — typing invalid date (no commit)";

export const SingleOutsideMinMax: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(null);
    const [calls, setCalls] = useState(0);
    return (
      <>
        <p style={{ marginBottom: 4, fontFamily: "monospace", fontSize: 12 }}>
          value: {date?.toISOString() ?? "null"}
        </p>
        <p style={{ marginBottom: 4, fontFamily: "monospace", fontSize: 12 }}>
          onChange calls: {calls}
        </p>
        <p style={{ marginBottom: 8, fontSize: 11, color: "#888" }}>
          Allowed: 03.02.2016 – 20.02.2016. Type outside range → red, no commit.
        </p>
        <Calendar
          value={date}
          onChange={(v) => { setDate(v as Date | null); setCalls((c) => c + 1); }}
          minDate={new Date(2016, 1, 3)}
          maxDate={new Date(2016, 1, 20)}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarManualSelect />
        </Calendar>
      </>
    );
  },
};
SingleOutsideMinMax.storyName = "Single — outside minDate/maxDate (invalid, no commit)";

export const RangeBothEmpty: Story = {
  render: (_args, ctx) => {
    const [range, setRange] = useState<{ from: Date | null; to: Date | null }>({
      from: null,
      to: null,
    });
    return (
      <>
        <p style={{ marginBottom: 8, fontFamily: "monospace", fontSize: 12 }}>
          value: {JSON.stringify({ from: range.from?.toISOString() ?? null, to: range.to?.toISOString() ?? null })}
        </p>
        <Calendar
          mode="range"
          value={range}
          onChange={setRange}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarManualSelect />
        </Calendar>
      </>
    );
  },
};
RangeBothEmpty.storyName = "Range — both empty";

export const RangeOnlyFromFilled: Story = {
  render: (_args, ctx) => {
    const [range, setRange] = useState<{ from: Date | null; to: Date | null }>({
      from: FIXED_DATE,
      to: null,
    });
    return (
      <>
        <p style={{ marginBottom: 8, fontFamily: "monospace", fontSize: 12 }}>
          value: {JSON.stringify({ from: range.from?.toISOString() ?? null, to: range.to?.toISOString() ?? null })}
        </p>
        <Calendar
          mode="range"
          value={range}
          onChange={setRange}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarManualSelect />
        </Calendar>
      </>
    );
  },
};
RangeOnlyFromFilled.storyName = 'Range — only "from" filled';

export const RangeBothFilled: Story = {
  render: (_args, ctx) => {
    const [range, setRange] = useState<{ from: Date | null; to: Date | null }>({
      from: FIXED_DATE,
      to: new Date(2016, 1, 20),
    });
    return (
      <>
        <p style={{ marginBottom: 8, fontFamily: "monospace", fontSize: 12 }}>
          value: {JSON.stringify({ from: range.from?.toISOString() ?? null, to: range.to?.toISOString() ?? null })}
        </p>
        <Calendar
          mode="range"
          value={range}
          onChange={setRange}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarManualSelect />
        </Calendar>
      </>
    );
  },
};
RangeBothFilled.storyName = "Range — both filled";

export const MultipleEmpty: Story = {
  render: (_args, ctx) => {
    const [dates, setDates] = useState<Date[]>([]);
    return (
      <>
        <p style={{ marginBottom: 8, fontFamily: "monospace", fontSize: 12 }}>
          value: [{dates.map((d) => d.toISOString()).join(", ")}]
        </p>
        <Calendar
          mode="multiple"
          value={dates}
          onChange={setDates}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarManualSelect />
        </Calendar>
      </>
    );
  },
};
MultipleEmpty.storyName = "Multiple — empty";

export const MultipleCapped: Story = {
  render: (_args, ctx) => {
    const [dates, setDates] = useState<Date[]>([FIXED_DATE]);
    return (
      <>
        <p style={{ marginBottom: 8, fontFamily: "monospace", fontSize: 12 }}>
          value ({dates.length}/3): [{dates.map((d) => d.toISOString()).join(", ")}]
        </p>
        <Calendar
          mode="multiple"
          value={dates}
          onChange={setDates}
          maxDates={3}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarManualSelect />
        </Calendar>
      </>
    );
  },
};
MultipleCapped.storyName = "Multiple — capped (maxDates=3, add input hidden when full)";

export const NoTopLevelClear: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarManualSelect allowClear={false} />
      </Calendar>
    );
  },
};
NoTopLevelClear.storyName = "No top-level clear (allowClear=false)";

export const AlignCenter: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarManualSelect align="center" />
      </Calendar>
    );
  },
};
AlignCenter.storyName = "Aligned center";

export const ReadOnly: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <>
        <p style={{ marginBottom: 8, fontSize: 11, color: "#888" }}>
          readOnly — input HTML readOnly, all clears disabled, onChange never fires
        </p>
        <Calendar
          value={date}
          onChange={setDate}
          readOnly
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarManualSelect />
        </Calendar>
      </>
    );
  },
};
ReadOnly.storyName = "readOnly";

export const Playground: Story = {
  args: {
    allowClear: true,
    align: "left",
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
        <CalendarManualSelect allowClear={args.allowClear} align={args.align} />
      </Calendar>
    );
  },
};
