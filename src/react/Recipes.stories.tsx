import type { Meta, StoryObj } from "@storybook/react-vite";
import { buildConfig, D } from "../__tests__/fixtures/builders";
import { compileDateRules } from "../core/date-rule-engine";
import { commonPresets, definePreset } from "../core/preset-engine";
import { storyLocale, storyThemeProps } from "../modules/_lab/story-globals";
import { CalendarDays } from "../modules/days/CalendarDays";
import { CalendarInfo } from "../modules/info/CalendarInfo";
import { CalendarManualInput } from "../modules/manual-input/CalendarManualInput";
import { CalendarPresets } from "../modules/presets/CalendarPresets";
import { CalendarSelectedDates } from "../modules/selected-dates/CalendarSelectedDates";
import { CalendarTimeWheel } from "../modules/time/CalendarTimeWheel";
import {
  CalendarToolbar,
  CalendarToolbarClear,
  CalendarToolbarGroup,
  CalendarToolbarHome,
  CalendarToolbarMonthLabel,
  CalendarToolbarMonthTrigger,
  CalendarToolbarNext,
  CalendarToolbarPrev,
  CalendarToolbarYearLabel,
  CalendarToolbarYearTrigger,
} from "../modules/toolbar/CalendarToolbar";
import { Calendar } from "./calendar";
import { useCalendarActions, useCalendarStore } from "./provider";
import { UIButton } from "./ui/button";
import { useStoreSelector } from "./use-store-selector";

/**
 * Composition recipes — ready-to-copy builds of the module system, from a
 * custom third-party module to full booking / time-picker / dashboard
 * layouts. Each story is a self-contained arrangement of the public surface.
 */
const meta: Meta = {
  title: "Recipes",
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj;

/**
 * A custom footer module: shows how many days are picked and jumps the view to
 * the earliest one. Reads via a selector (re-renders only when the count or
 * first date changes), writes via `navigateTo`.
 */
function SelectionSummary() {
  const store = useCalendarStore();
  const { navigateTo, clear } = useCalendarActions();
  const first = useStoreSelector(store, (s) =>
    s.selection.shape === "point" ? s.selection.dates[0]?.date : undefined,
  );
  const count = useStoreSelector(store, (s) =>
    s.selection.shape === "point" ? s.selection.dates.length : 0,
  );
  if (count === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        justifyContent: "space-between",
      }}
    >
      <span style={{ fontSize: 13 }}>
        {count} day{count > 1 ? "s" : ""} picked
      </span>
      <span style={{ display: "flex", gap: 4 }}>
        <UIButton size="sm" onClick={() => first && navigateTo(first)}>
          Jump to first
        </UIButton>
        <UIButton variant="ghost" size="sm" onClick={() => clear()}>
          Reset
        </UIButton>
      </span>
    </div>
  );
}

export const CustomModule: Story = {
  render: (_, ctx) => (
    <div style={{ width: 320 }}>
      <Calendar
        {...storyThemeProps(ctx.globals)}
        config={buildConfig({ ...storyLocale(ctx.globals), mode: "multiple" })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarDays />
        <SelectionSummary />
      </Calendar>
    </div>
  ),
};

/**
 * Booking range: two months side by side (smart `cols` stacks them on
 * mobile), weekends excluded from the emitted spans, quick presets and the
 * committed range summarized below.
 */
export const BookingRange: Story = {
  render: (_, ctx) => (
    <div style={{ width: 640, maxWidth: "95vw" }}>
      <Calendar
        {...storyThemeProps(ctx.globals)}
        config={buildConfig({
          ...storyLocale(ctx.globals),
          mode: "range",
          exclude: compileDateRules({ weekends: true }),
        })}
        initialView={D(2026, 6, 1)}
        cols={2}
      >
        <div
          style={{
            display: "grid",
            gap: "var(--c-gap, 8px)",
            alignContent: "start",
          }}
        >
          <CalendarToolbar justify="center">
            <CalendarToolbarPrev />
            <CalendarToolbarGroup>
              <CalendarToolbarMonthLabel />
              <CalendarToolbarYearLabel />
            </CalendarToolbarGroup>
          </CalendarToolbar>
          <CalendarDays />
        </div>
        <div
          style={{
            display: "grid",
            gap: "var(--c-gap, 8px)",
            alignContent: "start",
          }}
        >
          <CalendarToolbar justify="center">
            <CalendarToolbarGroup>
              <CalendarToolbarMonthLabel offset={1} />
              <CalendarToolbarYearLabel offset={1} />
            </CalendarToolbarGroup>
            <CalendarToolbarNext />
          </CalendarToolbar>
          <CalendarDays offset={1} />
        </div>
        <CalendarPresets
          col="full"
          presets={[
            definePreset({ label: "Next 7 days", value: 0, range: 6 }),
            definePreset({ label: "Next 30 days", value: 0, range: 29 }),
            ...commonPresets,
          ]}
        />
        <CalendarInfo col="full" showRelative allowClear />
      </Calendar>
    </div>
  ),
};

/**
 * Date & time appointment picker: single day + time wheel, gated to a
 * business-hours window — the wheel walls stop at 09:00/18:00 and the core
 * rejects anything outside regardless of the surface.
 */
export const DateTimeAppointment: Story = {
  render: (_, ctx) => (
    <div style={{ width: 320 }}>
      <Calendar
        {...storyThemeProps(ctx.globals)}
        config={buildConfig({
          ...storyLocale(ctx.globals),
          mode: "single",
          withTime: true,
          defaultTime: { hour: 9, minute: 0, second: 0, ms: 0 },
          minTime: { hour: 9, minute: 0, second: 0, ms: 0 },
          maxTime: { hour: 18, minute: 0, second: 0, ms: 0 },
        })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarToolbar cols="auto minmax(0, 1fr) auto">
          <CalendarToolbarPrev />
          <CalendarToolbarGroup>
            <CalendarToolbarMonthTrigger />
            <CalendarToolbarYearTrigger />
          </CalendarToolbarGroup>
          <CalendarToolbarNext />
        </CalendarToolbar>
        <CalendarDays />
        <CalendarTimeWheel />
        <CalendarInfo showRelative />
      </Calendar>
    </div>
  ),
};

/**
 * Keyboard-first form field: typed input commits, the grid is the fallback,
 * Home jumps back to today. The smart toolbar wraps on narrow containers
 * instead of overflowing.
 */
export const FormField: Story = {
  render: (_, ctx) => (
    <div style={{ width: 300 }}>
      <Calendar
        {...storyThemeProps(ctx.globals)}
        config={buildConfig({ ...storyLocale(ctx.globals), mode: "single" })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarManualInput allowClear />
        <CalendarToolbar>
          <CalendarToolbarGroup>
            <CalendarToolbarPrev />
            <CalendarToolbarHome />
          </CalendarToolbarGroup>
          <CalendarToolbarGroup>
            <CalendarToolbarMonthTrigger short />
            <CalendarToolbarYearTrigger />
          </CalendarToolbarGroup>
          <CalendarToolbarGroup push="end">
            <CalendarToolbarNext />
          </CalendarToolbarGroup>
        </CalendarToolbar>
        <CalendarDays />
      </Calendar>
    </div>
  ),
};

/**
 * Multi-select with a management surface: capped picks (`maxDates`), chips with
 * per-chip removal, an add-box manual input that disables at the cap, and a
 * Clear in the footer toolbar.
 */
export const MultiSelectManager: Story = {
  render: (_, ctx) => (
    <div style={{ width: 340 }}>
      <Calendar
        {...storyThemeProps(ctx.globals)}
        config={buildConfig({
          ...storyLocale(ctx.globals),
          mode: "multiple",
          maxDates: 5,
        })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarManualInput />
        <CalendarDays />
        <CalendarSelectedDates allowClearPerChip maxVisibleChips={4} />
        <CalendarToolbar>
          <CalendarToolbarGroup push="end">
            <CalendarToolbarClear />
          </CalendarToolbarGroup>
        </CalendarToolbar>
      </Calendar>
    </div>
  ),
};

/**
 * Sidebar dashboard: presets rail on the left, calendar on the right —
 * a raw `cols` template splits the root; on narrow screens the smart grid
 * is bypassed deliberately (fixed rail) to show the string escape hatch.
 */
export const PresetSidebar: Story = {
  render: (_, ctx) => (
    <div style={{ width: 560, maxWidth: "95vw" }}>
      <Calendar
        {...storyThemeProps(ctx.globals)}
        config={buildConfig({ ...storyLocale(ctx.globals), mode: "range" })}
        initialView={D(2026, 6, 1)}
        cols="minmax(9em, auto) minmax(0, 1fr)"
      >
        <CalendarPresets col="1" presets={commonPresets} />
        <div
          style={{
            display: "grid",
            gap: "var(--c-gap, 8px)",
            alignContent: "start",
          }}
        >
          <CalendarToolbar cols="auto minmax(0, 1fr) auto">
            <CalendarToolbarPrev />
            <CalendarToolbarGroup>
              <CalendarToolbarMonthLabel />
              <CalendarToolbarYearLabel />
            </CalendarToolbarGroup>
            <CalendarToolbarNext />
          </CalendarToolbar>
          <CalendarDays />
          <CalendarInfo showRelative />
        </div>
      </Calendar>
    </div>
  ),
};
