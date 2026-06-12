import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { buildConfig, D } from "../../__tests__/v3/fixtures/builders";
import {
  commonPresets,
  presetLast7Days,
  presetThisMonth,
  presetThisWeek,
  presetToday,
} from "../../core-v3/preset-engine";
import { Calendar } from "../../react-v3/calendar";
import { CalendarDays } from "../days/CalendarDays";
import { CalendarPresets } from "./CalendarPresets";

const meta: Meta = {
  title: "v3/Presets",
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj;

export const SingleMode: Story = {
  render: () => {
    const [value, setValue] = useState<unknown>(null);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Calendar
          config={buildConfig({ mode: "single" })}
          initialView={D(2026, 6, 1)}
          onChange={(v) => setValue(v)}
        >
          <CalendarDays />
          <CalendarPresets
            presets={[presetToday, presetThisWeek, presetThisMonth]}
          />
        </Calendar>
        <pre style={{ fontSize: 12 }}>{JSON.stringify(value, null, 2)}</pre>
      </div>
    );
  },
};

export const RangeMode: Story = {
  render: () => {
    const [value, setValue] = useState<unknown>(null);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Calendar
          config={buildConfig({ mode: "range" })}
          initialView={D(2026, 6, 1)}
          onChange={(v) => setValue(v)}
        >
          <CalendarDays />
          <CalendarPresets
            presets={[presetThisWeek, presetThisMonth, presetLast7Days]}
          />
        </Calendar>
        <pre style={{ fontSize: 12 }}>{JSON.stringify(value, null, 2)}</pre>
      </div>
    );
  },
};

export const AllCommonPresets: Story = {
  name: "Common presets (single)",
  render: () => (
    <Calendar
      config={buildConfig({ mode: "single" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarDays />
      <CalendarPresets presets={commonPresets} />
    </Calendar>
  ),
};

export const MixedCompatibility: Story = {
  name: "Mixed mode: incompatible presets disabled",
  render: () => (
    <Calendar
      config={buildConfig({ mode: "single" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarDays />
      <CalendarPresets
        presets={[presetToday, presetThisWeek, presetLast7Days]}
      />
    </Calendar>
  ),
};

export const ReadOnly: Story = {
  render: () => (
    <Calendar
      config={buildConfig({ mode: "single", readOnly: true })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarDays />
      <CalendarPresets presets={[presetToday, presetThisWeek]} />
    </Calendar>
  ),
};
