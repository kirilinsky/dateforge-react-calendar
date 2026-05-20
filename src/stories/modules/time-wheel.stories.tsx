import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarTimeWheel } from "@/modules/time";
import { FIXED_DATE } from "../_constants";
import { debugStyle } from "../_helpers/debug";
import {
  resolveStoryAppearance,
  resolveStoryGradient,
  resolveStoryLocale,
  resolveStoryTheme,
  resolveStoryThemeMode,
} from "../_helpers/resolve-globals";

type TimeWheelArgs = {
  seconds?: boolean;
  hour12?: boolean;
  hourStep?: number;
  minuteStep?: number;
  secondStep?: number;
  labels?: "short" | "long" | "none";
};

const meta: Meta<TimeWheelArgs> = {
  title: "Modules/TimeWheel",
  argTypes: {
    seconds: { control: "boolean" },
    hour12: { control: "boolean" },
    hourStep: { control: { type: "number", min: 1, max: 12 } },
    minuteStep: { control: { type: "number", min: 1, max: 30 } },
    secondStep: { control: { type: "number", min: 1, max: 30 } },
    labels: {
      control: "inline-radio",
      options: ["none", "short", "long"],
    },
  },
  args: {
    seconds: false,
    hour12: false,
    hourStep: 1,
    minuteStep: 1,
    secondStep: 1,
    labels: "none",
  },
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        hour12={args.hour12}
        timeStep={{
          hour: args.hourStep,
          minute: args.minuteStep,
          second: args.secondStep,
        }}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarTimeWheel
          seconds={args.seconds}
          labels={args.labels === "none" ? undefined : args.labels}
        />
      </Calendar>
    );
  },
};

export default meta;

type Story = StoryObj<TimeWheelArgs>;

export const Default: Story = {};
Default.storyName = "Default (24h)";

export const Hour12: Story = {
  args: { hour12: true },
};
Hour12.storyName = "12-hour format";

export const WithSeconds: Story = {
  args: { seconds: true },
};
WithSeconds.storyName = "With seconds";

export const Step5Min: Story = {
  args: { minuteStep: 5 },
};
Step5Min.storyName = "Minute step = 5";

export const Step15Min: Story = {
  args: { minuteStep: 15 },
};
Step15Min.storyName = "Minute step = 15";

export const Step30Min: Story = {
  args: { minuteStep: 30 },
};
Step30Min.storyName = "Minute step = 30";

export const Step2Hour: Story = {
  args: { hourStep: 2 },
};
Step2Hour.storyName = "Hour step = 2";

export const ShortLabels: Story = {
  args: { labels: "short", seconds: true },
};
ShortLabels.storyName = "Drum labels: HH / MM / SS";

export const LongLabelsLocalized: Story = {
  args: { labels: "long", seconds: true },
};
LongLabelsLocalized.storyName = "Drum labels: localized (Intl.DisplayNames)";

export const StandaloneTimePicker: Story = {
  render: (args, ctx) => {
    const [picked, setPicked] = useState<{
      h: number;
      m: number;
      s: number;
    } | null>(null);
    const pad = (n: number) => String(n).padStart(2, "0");
    const label = picked
      ? args.seconds
        ? `${pad(picked.h)}:${pad(picked.m)}:${pad(picked.s)}`
        : `${pad(picked.h)}:${pad(picked.m)}`
      : "—";
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <div data-testid="picked-time" style={{ fontSize: 14 }}>
          Picked: <strong>{label}</strong>
        </div>
        <Calendar
          hour12={args.hour12}
          timeStep={{
            hour: args.hourStep,
            minute: args.minuteStep,
            second: args.secondStep,
          }}
          theme={resolveStoryTheme(ctx.globals.theme)}
          {...resolveStoryThemeMode(ctx.globals.themeMode)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
          gradient={resolveStoryGradient(ctx.globals.gradient)}
          locale={resolveStoryLocale(ctx.globals.locale)}
        >
          <CalendarTimeWheel
            seconds={args.seconds}
            onTimeSelect={(d) =>
              setPicked({
                h: d.getHours(),
                m: d.getMinutes(),
                s: d.getSeconds(),
              })
            }
          />
        </Calendar>
      </div>
    );
  },
};
StandaloneTimePicker.storyName = "Standalone time picker (onTimeSelect)";
StandaloneTimePicker.parameters = {
  // Drum picker has a settle animation after mount; without a delay the
  // snapshot catches mid-flight frames and diffs randomly.
  chromatic: { delay: 800, pauseAnimationAtEnd: true },
};

export const ShowReset: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(
      new Date(2024, 5, 15, 9, 30, 0),
    );
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
        <CalendarTimeWheel showReset />
      </Calendar>
    );
  },
};
ShowReset.storyName = "showReset — reset to current time";

export const BoundFromTo: Story = {
  render: (_args, ctx) => {
    const [range, setRange] = useState<{
      from: Date | null;
      to: Date | null;
    }>({
      from: new Date(2024, 5, 15, 9, 30, 0),
      to: new Date(2024, 5, 20, 18, 45, 0),
    });
    const fmt = (d: Date | null) =>
      d
        ? d.toLocaleString("en-GB", { dateStyle: "short", timeStyle: "medium" })
        : "null";
    return (
      <>
        <p style={debugStyle}>
          from: <strong>{fmt(range.from)}</strong> | to:{" "}
          <strong>{fmt(range.to)}</strong>
        </p>
        <Calendar
          mode="range"
          cols={2}
          value={range}
          onChange={setRange}
          theme={resolveStoryTheme(ctx.globals.theme)}
          {...resolveStoryThemeMode(ctx.globals.themeMode)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
          gradient={resolveStoryGradient(ctx.globals.gradient)}
          locale={resolveStoryLocale(ctx.globals.locale)}
        >
          <CalendarTimeWheel bound="from" col={1} />
          <CalendarTimeWheel bound="to" col={1} />
        </Calendar>
      </>
    );
  },
  parameters: { storyWidth: 520 },
};
BoundFromTo.storyName = "Bound — from + to side by side";
