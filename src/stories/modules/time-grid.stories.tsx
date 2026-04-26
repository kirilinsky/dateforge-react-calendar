import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarTimeGrid } from "@/modules/time";
import { FIXED_DATE } from "../_constants";
import {
  resolveStoryTheme,
  resolveStoryAppearance,
} from "../_helpers/resolve-globals";

type TimeGridArgs = {
  seconds?: boolean;
};

const meta: Meta<TimeGridArgs> = {
  title: "Modules/TimeGrid",
  argTypes: {
    seconds: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<TimeGridArgs>;

export const Default: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarTimeGrid />
      </Calendar>
    );
  },
};
Default.storyName = "Default (24h)";

export const Hour12: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        hour12
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarTimeGrid />
      </Calendar>
    );
  },
};
Hour12.storyName = "12-hour format";

export const WithSeconds: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarTimeGrid seconds />
      </Calendar>
    );
  },
};
WithSeconds.storyName = "With seconds";

export const Playground: Story = {
  args: {
    seconds: false,
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
        <CalendarTimeGrid seconds={args.seconds} />
      </Calendar>
    );
  },
};
