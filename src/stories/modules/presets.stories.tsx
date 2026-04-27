import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarPresets } from "@/modules/presets";
import { basicPresets } from "@/modules/presets/presets-pack";
import type { PresetEntry } from "@/types/presets";
import { FIXED_DATE } from "../_constants";
import {
  resolveStoryAppearance,
  resolveStoryTheme,
} from "../_helpers/resolve-globals";

const meta: Meta = {
  title: "Modules/Presets",
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
      >
        <CalendarPresets presets={basicPresets} />
      </Calendar>
    );
  },
};
Default.storyName = "Built-in (basicPresets)";

export const CustomResolvers: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    const customPresets: PresetEntry[] = [
      { label: "Today", value: 0 },
      { label: "In 3 days", value: 3 },
      {
        id: "start-of-month",
        label: "Start of month",
        getValue: ({ now }) => new Date(now.getFullYear(), now.getMonth(), 1),
      },
    ];
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarPresets presets={customPresets} />
      </Calendar>
    );
  },
};
CustomResolvers.storyName = "Custom resolvers";

export const WithRangeMode: Story = {
  render: (_args, ctx) => {
    const [range, setRange] = useState<{ from: Date | null; to: Date | null }>({
      from: null,
      to: null,
    });
    const rangePresets: PresetEntry[] = [
      { label: "Last 7 days", value: -6, range: 6 },
      { label: "Last 30 days", value: -29, range: 29 },
      {
        label: "This month",
        value: new Date(FIXED_DATE.getFullYear(), FIXED_DATE.getMonth(), 1),
        range: FIXED_DATE.getDate() - 1,
      },
    ];
    return (
      <Calendar
        mode="range"
        value={range}
        onChange={setRange}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarPresets presets={rangePresets} />
      </Calendar>
    );
  },
};
WithRangeMode.storyName = "With range mode";

export const ComboBasicAndCustom: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    const combined: PresetEntry[] = [
      ...basicPresets,
      { label: "In 3 days", value: 3 },
      { label: "In a week", value: 7 },
    ];
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarPresets presets={combined} />
      </Calendar>
    );
  },
};
ComboBasicAndCustom.storyName = "Combo: basic + custom";

export const IdCollision: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    // "today" id collides with basicPresets — first wins, custom entry dropped (dev warn)
    const presets: PresetEntry[] = [
      ...basicPresets,
      { id: "today", label: "TODAY OVERRIDE", value: 0 },
    ];
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarPresets presets={presets} />
      </Calendar>
    );
  },
};
IdCollision.storyName = "Id collision (first wins, dev warn)";

export const BadInputThrows: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    const presets: PresetEntry[] = [
      ...basicPresets,
      {
        id: "boom",
        label: "Boom (throws)",
        getValue: () => {
          throw new Error("kaboom");
        },
      },
    ];
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarPresets presets={presets} />
      </Calendar>
    );
  },
};
BadInputThrows.storyName = "Bad input — getValue throws (no crash)";

export const BadInputInvalidDate: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    const presets: PresetEntry[] = [
      ...basicPresets,
      {
        id: "invalid",
        label: "Invalid Date",
        getValue: () => new Date("not a date"),
      },
    ];
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
      >
        <CalendarPresets presets={presets} />
      </Calendar>
    );
  },
};
BadInputInvalidDate.storyName = "Bad input — getValue returns Invalid Date";
