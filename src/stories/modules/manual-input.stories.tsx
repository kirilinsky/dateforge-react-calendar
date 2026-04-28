import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarManualInput } from "@/modules/manual-input";
import { FIXED_DATE } from "../_constants";
import { debugStyle, fmtDate, fmtRange } from "../_helpers/debug";
import {
  resolveStoryAppearance,
  resolveStoryTheme,
} from "../_helpers/resolve-globals";

type ManualInputArgs = {
  allowClear?: boolean;
  align?: "left" | "center" | "right";
};

const meta: Meta<ManualInputArgs> = {
  title: "Modules/ManualInput",
  argTypes: {
    allowClear: { control: "boolean" },
    align: { control: "inline-radio", options: ["left", "center", "right"] },
  },
};

export default meta;

type Story = StoryObj<ManualInputArgs>;

export const SingleEmpty: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(null);
    return (
      <>
        <p style={debugStyle}>value: {date ? fmtDate(date) : "null"}</p>
        <Calendar
          value={date}
          onChange={setDate}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarManualInput />
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
        <p style={debugStyle}>value: {date ? fmtDate(date) : "null"}</p>
        <Calendar
          value={date}
          onChange={setDate}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarManualInput />
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
        <p style={{ ...debugStyle, marginBottom: 4 }}>
          value: {date ? fmtDate(date) : "null"}
        </p>
        <p style={debugStyle}>onChange calls: {calls}</p>
        <Calendar
          value={date}
          onChange={(v) => {
            setDate(v as Date | null);
            setCalls((c) => c + 1);
          }}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarManualInput />
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
        <p style={{ ...debugStyle, marginBottom: 4 }}>
          value: {date ? fmtDate(date) : "null"}
        </p>
        <p style={{ ...debugStyle, marginBottom: 4 }}>
          onChange calls: {calls}
        </p>
        <p style={{ ...debugStyle, marginBottom: 8, opacity: 0.6 }}>
          Type "32.13.2024" then Enter — no commit, red wrapper
        </p>
        <Calendar
          value={date}
          onChange={(v) => {
            setDate(v as Date | null);
            setCalls((c) => c + 1);
          }}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarManualInput />
        </Calendar>
      </>
    );
  },
};
SingleInvalidDate.storyName = "Single — typing invalid date (no commit)";
SingleInvalidDate.play = async ({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) => {
  const canvas = within(canvasElement);
  const input = canvas.getByRole("textbox") as HTMLInputElement;
  await userEvent.click(input);
  await userEvent.keyboard("32132024");
  await userEvent.keyboard("{Enter}");

  const wrapper = input.parentElement as HTMLElement;
  const borderColor = getComputedStyle(wrapper).borderColor;
  // Default theme error = #dc2626 → rgb(220, 38, 38)
  // Allow either rgb or rgba form, just check the channel values appear.
  expect(borderColor).toMatch(/rgba?\(\s*220,\s*38,\s*38/);
};

export const SingleOutsideMinMax: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(null);
    const [calls, setCalls] = useState(0);
    return (
      <>
        <p style={{ ...debugStyle, marginBottom: 4 }}>
          value: {date ? fmtDate(date) : "null"}
        </p>
        <p style={{ ...debugStyle, marginBottom: 4 }}>
          onChange calls: {calls}
        </p>
        <p style={{ ...debugStyle, marginBottom: 8, opacity: 0.6 }}>
          Allowed: 03.02.2016 – 20.02.2016. Outside → red, no commit.
        </p>
        <Calendar
          value={date}
          onChange={(v) => {
            setDate(v as Date | null);
            setCalls((c) => c + 1);
          }}
          minDate={new Date(2016, 1, 3)}
          maxDate={new Date(2016, 1, 20)}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarManualInput />
        </Calendar>
      </>
    );
  },
};
SingleOutsideMinMax.storyName =
  "Single — outside minDate/maxDate (invalid, no commit)";

export const RangeBothEmpty: Story = {
  render: (_args, ctx) => {
    const [range, setRange] = useState<{ from: Date | null; to: Date | null }>({
      from: null,
      to: null,
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
        >
          <CalendarManualInput />
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
        <p style={debugStyle}>{fmtRange(range)}</p>
        <Calendar
          mode="range"
          value={range}
          onChange={setRange}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarManualInput />
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
        <p style={debugStyle}>{fmtRange(range)}</p>
        <Calendar
          mode="range"
          value={range}
          onChange={setRange}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarManualInput />
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
        <p style={debugStyle}>selected: [{dates.map(fmtDate).join(", ")}]</p>
        <Calendar
          mode="multiple"
          value={dates}
          onChange={setDates}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarManualInput />
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
        <p style={debugStyle}>
          selected ({dates.length}/3): [{dates.map(fmtDate).join(", ")}]
        </p>
        <Calendar
          mode="multiple"
          value={dates}
          onChange={setDates}
          maxDates={3}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarManualInput />
        </Calendar>
      </>
    );
  },
};
MultipleCapped.storyName =
  "Multiple — capped (maxDates=3, add input hidden when full)";

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
        <CalendarManualInput allowClear={false} />
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
        <CalendarManualInput align="center" />
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
        <p style={{ ...debugStyle, marginBottom: 8, opacity: 0.6 }}>
          readOnly — input HTML readOnly, all clears disabled, onChange never
          fires
        </p>
        <Calendar
          value={date}
          onChange={setDate}
          readOnly
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
        >
          <CalendarManualInput />
        </Calendar>
      </>
    );
  },
};
ReadOnly.storyName = "readOnly";

export const Playground: Story = {
  args: { allowClear: true, align: "left" },
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarManualInput allowClear={args.allowClear} align={args.align} />
      </Calendar>
    );
  },
};
