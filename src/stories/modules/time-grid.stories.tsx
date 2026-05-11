import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarTimeGrid } from "@/modules/time";
import { FIXED_DATE } from "../_constants";
import {
  resolveStoryAppearance,
  resolveStoryLocale,
  resolveStoryTheme,
} from "../_helpers/resolve-globals";

type TimeGridArgs = {
  seconds?: boolean;
  hour12?: boolean;
  hourStep?: number;
  minuteStep?: number;
  secondStep?: number;
};

const meta: Meta<TimeGridArgs> = {
  title: "Modules/TimeGrid",
  argTypes: {
    seconds: { control: "boolean" },
    hour12: { control: "boolean" },
    hourStep: { control: { type: "number", min: 1, max: 12 } },
    minuteStep: { control: { type: "number", min: 1, max: 30 } },
    secondStep: { control: { type: "number", min: 1, max: 30 } },
  },
  args: {
    seconds: false,
    hour12: false,
    hourStep: 1,
    minuteStep: 1,
    secondStep: 1,
  },
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        hour12={args.hour12} gradient
        timeStep={{
          hour: args.hourStep,
          minute: args.minuteStep,
          second: args.secondStep,
        }}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <CalendarTimeGrid seconds={args.seconds} />
      </Calendar>
    );
  },
};

export default meta;

type Story = StoryObj<TimeGridArgs>;

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
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
          locale={resolveStoryLocale(ctx.globals.locale)}
        >
          <CalendarTimeGrid
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
