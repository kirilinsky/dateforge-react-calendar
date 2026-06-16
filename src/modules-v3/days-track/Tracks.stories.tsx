import type { Meta, StoryObj } from "@storybook/react";
import { buildConfig, D, span } from "../../__tests__/v3/fixtures/builders";
import { CalendarDays } from "../../modules-v3/days/CalendarDays";
import { Calendar } from "../../react-v3/calendar";
import { storyLocale, storyThemeProps } from "../_lab/story-globals";
import { CalendarMonthsTrack } from "../months-track/CalendarMonthsTrack";
import { CalendarYearsTrack } from "../years-track/CalendarYearsTrack";
import { CalendarDaysTrack } from "./CalendarDaysTrack";

/**
 * Tracks — the horizontal physics carousels (ported from v2). Drag, flick,
 * arrow-key, or click an off-centre item to scroll; the centred pill is the
 * value. `role="spinbutton"` with arrow/Page/Home/End keys. Size comes from
 * appearance tokens (`--cal-size-track-item`, `--cal-track-height`).
 */
const meta: Meta = {
  title: "v3/Tracks",
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj;

export const All: Story = {
  render: (_, ctx) => (
    <div style={{ width: 320 }}>
      <Calendar
        {...storyThemeProps(ctx.globals)}
        config={buildConfig({ ...storyLocale(ctx.globals), mode: "single" })}
        initialView={D(2026, 6, 15)}
      >
        <CalendarMonthsTrack showYearLabel />
        <CalendarDaysTrack showMonthLabel />
        <CalendarYearsTrack />
      </Calendar>
    </div>
  ),
};

/** Days track as a standalone day picker: single mode commits the landed day. */
export const DayPicker: Story = {
  render: (_, ctx) => (
    <div style={{ width: 320 }}>
      <Calendar
        {...storyThemeProps(ctx.globals)}
        config={buildConfig({ ...storyLocale(ctx.globals), mode: "single" })}
        initialView={D(2026, 6, 15)}
      >
        <CalendarDaysTrack showMonthLabel />
      </Calendar>
    </div>
  ),
};

/** Long month names + a min/max-clamped window. */
export const LongMonthsClamped: Story = {
  render: (_, ctx) => (
    <div style={{ width: 320 }}>
      <Calendar
        {...storyThemeProps(ctx.globals)}
        config={buildConfig({
          ...storyLocale(ctx.globals),
          mode: "single",
          min: D(2026, 3, 1),
          max: D(2026, 9, 30),
        })}
        initialView={D(2026, 6, 15)}
      >
        <CalendarMonthsTrack short={false} showYearLabel />
      </Calendar>
    </div>
  ),
};

/**
 * Bound mode: a from/to range editor. Each track edits its own range bound via
 * `bound` — scrolling commits through `setBoundDate`, and the CORE owns the
 * ordering/clamping (push 'from' past 'to' and it reorders, no module logic).
 * The grid below reflects the live range. Wheels take the same `bound` prop.
 */
export const BoundRange: Story = {
  render: (_, ctx) => (
    <div style={{ width: 320, display: "grid", gap: 6 }}>
      <Calendar
        {...storyThemeProps(ctx.globals)}
        config={buildConfig({ ...storyLocale(ctx.globals), mode: "range" })}
        initialView={D(2026, 6, 1)}
        defaultSelection={span([[D(2026, 3, 10), D(2026, 6, 20)]])}
      >
        <strong style={{ font: "600 12px system-ui" }}>From</strong>
        <CalendarMonthsTrack bound="from" showYearLabel />
        <strong style={{ font: "600 12px system-ui" }}>To</strong>
        <CalendarMonthsTrack bound="to" showYearLabel />
        <CalendarDays />
      </Calendar>
    </div>
  ),
};
