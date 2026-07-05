import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { buildConfig, D } from "../../__tests__/fixtures/builders";
import {
  commonPresets,
  presetLast7Days,
  presetThisMonth,
  presetThisWeek,
  presetToday,
} from "../../core/preset-engine";
import { Calendar } from "../../react/calendar";
import { storyLocale, storyThemeProps } from "../_lab/story-globals";
import { CalendarDays } from "../days/CalendarDays";
import { CalendarPresets } from "./CalendarPresets";

const meta: Meta = {
  title: "Presets",
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj;

export const SingleMode: Story = {
  render: (_, ctx) => {
    const [value, setValue] = useState<unknown>(null);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Calendar
          {...storyThemeProps(ctx.globals)}
          config={buildConfig({ ...storyLocale(ctx.globals), mode: "single" })}
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
  render: (_, ctx) => {
    const [value, setValue] = useState<unknown>(null);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Calendar
          {...storyThemeProps(ctx.globals)}
          config={buildConfig({ ...storyLocale(ctx.globals), mode: "range" })}
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
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ ...storyLocale(ctx.globals), mode: "single" })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarDays />
      <CalendarPresets presets={commonPresets} />
    </Calendar>
  ),
};

export const MixedCompatibility: Story = {
  name: "Mixed mode: incompatible presets disabled",
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ ...storyLocale(ctx.globals), mode: "single" })}
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
  render: (_, ctx) => (
    <Calendar
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({
        ...storyLocale(ctx.globals),
        mode: "single",
        readOnly: true,
      })}
      initialView={D(2026, 6, 1)}
    >
      <CalendarDays />
      <CalendarPresets presets={[presetToday, presetThisWeek]} />
    </Calendar>
  ),
};

/**
 * Declarative authoring (v2 `SimplePresetDef` parity): pass `{ label, value }`
 * shorthands — `value` is a day offset or a fixed Date, `range` makes a span,
 * `getValue` is the full function form — and mix them with the built-in packs
 * (`relativePresets`, `commonPresets`). No resolver boilerplate needed.
 */
export const Declarative: Story = {
  render: (_, ctx) => {
    const [value, setValue] = useState<unknown>(null);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Calendar
          {...storyThemeProps(ctx.globals)}
          config={buildConfig({ ...storyLocale(ctx.globals), mode: "range" })}
          initialView={D(2026, 6, 1)}
          onChange={(v) => setValue(v)}
        >
          <CalendarDays />
          <CalendarPresets
            presets={[
              { label: "Today", value: 0 },
              { label: "In 3 days", value: 3 },
              { label: "Last 7 days", value: -6, range: 6 },
              { label: "New Year", value: new Date(2026, 0, 1) },
              {
                label: "Start of month",
                getValue: ({ now }) =>
                  new Date(now.getFullYear(), now.getMonth(), 1),
              },
            ]}
          />
        </Calendar>
        <pre style={{ fontSize: 12 }}>{JSON.stringify(value, null, 2)}</pre>
      </div>
    );
  },
};
