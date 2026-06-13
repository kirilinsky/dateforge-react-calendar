import type { Meta, StoryObj } from "@storybook/react";
import { buildConfig, D } from "../__tests__/v3/fixtures/builders";
import { storyThemeProps } from "../modules-v3/_lab/story-globals";
import { CalendarDays } from "../modules-v3/days/CalendarDays";
import {
  CalendarToolbar,
  CalendarToolbarLabel,
  CalendarToolbarNext,
  CalendarToolbarPrev,
} from "../modules-v3/toolbar/CalendarToolbar";
import { Calendar } from "../react-v3/calendar";
import { createAppearance } from "./appearance-tokens";
import { APPEARANCES, zenith } from "./appearances";

/**
 * Appearances = the non-color visual axis (shape, spacing, motion). Independent
 * of themes (colors). `default` is the v3 baseline; `"zenith"` ports the v2
 * default look; `createAppearance({...})` builds a custom one.
 */
const meta: Meta = {
  title: "v3/Appearances",
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj;

const tight = createAppearance({
  radius: "0.2em",
  containerRadius: "0.3em",
  containerGap: "0px",
  daysGap: "0px",
  transition: "0.1s",
});

function Panel({
  label,
  appearance,
  globals,
}: {
  label: string;
  appearance?: string | typeof zenith;
  globals: Record<string, unknown>;
}) {
  return (
    <div style={{ display: "grid", gap: 6, width: 300, flexShrink: 0 }}>
      <strong style={{ font: "600 12px system-ui" }}>{label}</strong>
      <Calendar
        {...storyThemeProps(globals)}
        appearance={appearance}
        config={buildConfig({ mode: "single" })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarToolbar>
          <CalendarToolbarPrev />
          <CalendarToolbarLabel />
          <CalendarToolbarNext />
        </CalendarToolbar>
        <CalendarDays />
      </Calendar>
    </div>
  );
}

/** Default (v3 baseline) next to the same calendar under `zenith`. */
export const DefaultVsZenith: Story = {
  render: (_, ctx) => (
    <div style={{ display: "flex", gap: 24, alignItems: "start" }}>
      <Panel label="default (v3)" globals={ctx.globals} />
      <Panel
        label='appearance="zenith"'
        appearance="zenith"
        globals={ctx.globals}
      />
    </div>
  ),
};

/** A `createAppearance` object (inline vars) — sharp + tight, no import of CSS. */
export const CustomAppearance: Story = {
  render: (_, ctx) => (
    <div style={{ display: "flex", gap: 24, alignItems: "start" }}>
      <Panel
        label="zenith (object)"
        appearance={zenith}
        globals={ctx.globals}
      />
      <Panel
        label="createAppearance(tight)"
        appearance={tight}
        globals={ctx.globals}
      />
    </div>
  ),
};

/** Every built-in appearance (ported from v2) at a glance. */
export const AllAppearances: Story = {
  render: (_, ctx) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 300px)",
        gap: 24,
        alignItems: "start",
      }}
    >
      {Object.keys(APPEARANCES).map((name) => (
        <Panel
          key={name}
          label={name}
          appearance={name}
          globals={ctx.globals}
        />
      ))}
    </div>
  ),
};
