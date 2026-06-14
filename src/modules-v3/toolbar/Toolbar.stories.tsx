import type { Meta, StoryObj } from "@storybook/react-vite";
import { addMonths, calendarDate } from "@/core-v3/calendar-date";
import { MIDNIGHT } from "@/core-v3/calendar-time";
import { compileDateRules } from "@/core-v3/date-rule-engine";
import type { CalendarConfig } from "@/core-v3/state";
import { today } from "@/core-v3/timezone-boundary";
import { CalendarDays } from "@/modules-v3/days/CalendarDays";
import { CalendarMonthsWheel } from "@/modules-v3/months-wheel/CalendarMonthsWheel";
import { CalendarTimeWheel } from "@/modules-v3/time/CalendarTimeWheel";
import { CalendarYearsWheel } from "@/modules-v3/years-wheel/CalendarYearsWheel";
import { Calendar as CalendarRoot } from "@/react-v3/calendar";
import { storyThemeProps, type V3StoryThemeProps } from "../_lab/story-globals";
import {
  CalendarToolbar,
  CalendarToolbarApply,
  CalendarToolbarClear,
  CalendarToolbarClock,
  CalendarToolbarDayLabel,
  CalendarToolbarGroup,
  CalendarToolbarHome,
  CalendarToolbarLabel,
  CalendarToolbarMonthLabel,
  CalendarToolbarMonthTrigger,
  CalendarToolbarNext,
  CalendarToolbarPrev,
  CalendarToolbarThemeToggle,
  CalendarToolbarTime,
  CalendarToolbarYearLabel,
  CalendarToolbarYearTrigger,
} from "./CalendarToolbar";

/**
 * v3 toolbar — the composable replacement for v2's monolithic `<CalendarNav>`.
 * There is NO `<CalendarNav>` in v3: navigation is a bag of primitives you
 * arrange yourself. The toolbar is NOT just a header: it can sit above or below
 * the grid, step days as well as months/years, carry apply/clear actions, a
 * live clock — any combination, any placement. These stories show a
 * batteries-included "nav" recipe (just a composition, per plan §10 — recipes
 * are docs, not runtime exports) plus the layouts the same primitives unlock.
 */
function buildConfig(over?: Partial<CalendarConfig>): CalendarConfig {
  return {
    unit: "day",
    mode: "single",
    firstDayOfWeek: 1,
    locale: "en-US",
    readOnly: false,
    withTime: false,
    defaultTime: MIDNIGHT,
    excludedEndpointPolicy: "snap-inward",
    disabled: compileDateRules(),
    exclude: compileDateRules(),
    ...over,
  };
}

function Frame({
  children,
  theme,
  scheme,
  config,
  days = true,
  width = 340,
}: {
  children: React.ReactNode;
  config?: CalendarConfig;
  days?: boolean;
  /** Fixed widget width — keeps every story looking like a real picker. */
  width?: number;
} & V3StoryThemeProps) {
  const resolved = config ?? buildConfig();
  return (
    <div style={{ width }}>
      <CalendarRoot
        config={resolved}
        initialView={today(resolved.timeZone)}
        theme={theme}
        scheme={scheme}
      >
        {children}
        {days && <CalendarDays />}
      </CalendarRoot>
    </div>
  );
}

const meta: Meta = {
  title: "v3/Toolbar",
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj;

/**
 * Batteries-included nav recipe: prev / month+year triggers / next, with a Today
 * jump. Copy this composition straight into product code — it is the v3 stand-in
 * for `<CalendarNav>`. Home disables itself while today's month is shown; arrow
 * keys move focus between the buttons (toolbar pattern).
 */
export const ReadyNav: Story = {
  render: (_, ctx) => (
    <Frame {...storyThemeProps(ctx.globals)}>
      <CalendarToolbar>
        <CalendarToolbarGroup>
          <CalendarToolbarPrev />
          <CalendarToolbarHome />
        </CalendarToolbarGroup>
        <CalendarToolbarGroup>
          <CalendarToolbarMonthTrigger />
          <CalendarToolbarYearTrigger />
        </CalendarToolbarGroup>
        <CalendarToolbarNext />
      </CalendarToolbar>
    </Frame>
  ),
};

/**
 * A minimal "label + arrows" header. The label is a live heading (`aria-level`);
 * the month part of the default label never shifts layout when stepping.
 */
export const MinimalLabel: Story = {
  render: (_, ctx) => (
    <Frame {...storyThemeProps(ctx.globals)}>
      <CalendarToolbar>
        <CalendarToolbarPrev />
        <CalendarToolbarLabel />
        <CalendarToolbarNext />
      </CalendarToolbar>
    </Frame>
  ),
};

/**
 * Year-stepping header with a Clear action — `unit="year"` arrows around the
 * year trigger. Clear stays disabled until something is selected.
 */
export const YearStepAndClear: Story = {
  render: (_, ctx) => (
    <Frame {...storyThemeProps(ctx.globals)}>
      <CalendarToolbar>
        <CalendarToolbarGroup>
          <CalendarToolbarPrev unit="year" />
          <CalendarToolbarYearTrigger />
          <CalendarToolbarNext unit="year" />
        </CalendarToolbarGroup>
        <CalendarToolbarClear />
      </CalendarToolbar>
    </Frame>
  ),
};

/**
 * The toolbar is not a header: a DAY stepper that edits the VALUE. With
 * `target="selection"` the arrows step the selected date itself (a date spinner)
 * and `source="selection"` reads it back; the grid follows the stepped day. The
 * arrows sit at the edges (`space-between`) with the full date centered. Seeded
 * with a selection here — with nothing picked the label shows "—" and the arrows
 * disable until a day is chosen (in the grid).
 */
export const DayStepper: Story = {
  render: (_, ctx) => (
    <div style={{ width: 340 }}>
      <CalendarRoot
        {...storyThemeProps(ctx.globals)}
        config={buildConfig()}
        initialView={calendarDate(2026, 6, 15)}
        defaultSelection={{
          shape: "point",
          dates: [{ date: calendarDate(2026, 6, 15), time: MIDNIGHT }],
        }}
      >
        <CalendarToolbar justify="space-between">
          <CalendarToolbarPrev unit="day" target="selection" />
          <CalendarToolbarDayLabel format="long" source="selection" />
          <CalendarToolbarNext unit="day" target="selection" />
        </CalendarToolbar>
        <CalendarDays />
      </CalendarRoot>
    </div>
  ),
};

/**
 * Footer toolbar under the grid: live clock + apply/clear actions. Apply hands
 * the current public value (same shape as root `onChange`) to the host; both
 * actions stay disabled until something is selected.
 */
export const FooterClockAndApply: Story = {
  render: (_, ctx) => (
    <Frame
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ mode: "range" })}
      days={false}
    >
      <CalendarToolbar>
        <CalendarToolbarPrev />
        <CalendarToolbarLabel />
        <CalendarToolbarNext />
      </CalendarToolbar>
      <CalendarDays />
      <CalendarToolbar label="Selection actions">
        <CalendarToolbarClock />
        <CalendarToolbarGroup>
          <CalendarToolbarClear />
          <CalendarToolbarApply
            onApply={(value) => console.log("apply", value)}
          />
        </CalendarToolbarGroup>
      </CalendarToolbar>
    </Frame>
  ),
};

/**
 * Two-month layout: each grid gets its own toolbar via `offset`. The trailing
 * toolbar labels/triggers display (and pick within) the NEXT month; both pairs
 * stay in lockstep because stepping moves the shared root view.
 */
export const TwoMonthsOffset: Story = {
  render: (_, ctx) => (
    <Frame
      {...storyThemeProps(ctx.globals)}
      config={buildConfig({ mode: "range" })}
      days={false}
      width={620}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <CalendarToolbar>
            <CalendarToolbarPrev />
            <CalendarToolbarLabel />
          </CalendarToolbar>
          <CalendarDays />
        </div>
        <div>
          <CalendarToolbar offset={1} label="Next month navigation">
            <CalendarToolbarLabel />
            <CalendarToolbarNext />
          </CalendarToolbar>
          <CalendarDays offset={1} />
        </div>
      </div>
    </Frame>
  ),
};

/**
 * `min`/`max` gating: a ±1 month window. Prev/next disable at the edges, the
 * pickers disable out-of-window months/years, and since min and max share a
 * year the year trigger is fully static.
 */
export const MinMaxGated: Story = {
  render: (_, ctx) => {
    const now = today(undefined);
    const config = buildConfig({
      min: addMonths(now, -1),
      max: addMonths(now, 1),
    });
    return (
      <Frame {...storyThemeProps(ctx.globals)} config={config}>
        <CalendarToolbar>
          <CalendarToolbarGroup>
            <CalendarToolbarPrev />
            <CalendarToolbarHome />
          </CalendarToolbarGroup>
          <CalendarToolbarGroup>
            <CalendarToolbarMonthTrigger />
            <CalendarToolbarYearTrigger />
          </CalendarToolbarGroup>
          <CalendarToolbarNext />
        </CalendarToolbar>
      </Frame>
    );
  },
};

/**
 * Two dense-header recipes stacked: compact triggers (chevron + short month)
 * with nav arrows, and a read-only split month/year label pair. Both reserve
 * the longest month's width, so stepping never shifts the layout.
 */
export const CompactAndLabels: Story = {
  render: (_, ctx) => (
    <Frame {...storyThemeProps(ctx.globals)} days={false}>
      <CalendarToolbar>
        <CalendarToolbarGroup>
          <CalendarToolbarMonthTrigger compact />
          <CalendarToolbarYearTrigger compact />
        </CalendarToolbarGroup>
        <CalendarToolbarGroup>
          <CalendarToolbarPrev />
          <CalendarToolbarNext />
        </CalendarToolbarGroup>
      </CalendarToolbar>
      <CalendarDays />
      <CalendarToolbar label="Current view" justify="center">
        <CalendarToolbarGroup>
          <CalendarToolbarMonthLabel short />
          <CalendarToolbarYearLabel />
        </CalendarToolbarGroup>
      </CalendarToolbar>
    </Frame>
  ),
};

/**
 * Theme toggle in the toolbar: flips the root `data-scheme` (light ⇄ dark),
 * resolving `"auto"` against the OS on the first press. `aria-pressed` tracks
 * the resolved dark state. Uncontrolled here — pass `<Calendar scheme
 * onSchemeChange>` to let the host own the choice.
 */
export const WithThemeToggle: Story = {
  render: (_, ctx) => (
    <Frame {...storyThemeProps(ctx.globals)}>
      <CalendarToolbar>
        <CalendarToolbarPrev />
        <CalendarToolbarLabel />
        <CalendarToolbarGroup>
          <CalendarToolbarNext />
          <CalendarToolbarThemeToggle />
        </CalendarToolbarGroup>
      </CalendarToolbar>
    </Frame>
  ),
};

/**
 * Wheel pickers inside the triggers (v2's track-style popups): the `picker`
 * prop swaps the default grid for any content — here the drum-physics wheels.
 * The wheel commits to the view as it settles; the footer row (default on for
 * custom pickers) pairs a "now" reset with a check-icon Confirm — the "done"
 * affordance that closes and refocuses the trigger. `pickerReset={false}` /
 * `pickerConfirm={false}` drop either half. The wheel import is the
 * consumer's, so grid-only apps never bundle the drum.
 */
export const WheelPickerTriggers: Story = {
  render: (_, ctx) => (
    <Frame {...storyThemeProps(ctx.globals)}>
      <CalendarToolbar>
        <CalendarToolbarPrev />
        <CalendarToolbarGroup>
          <CalendarToolbarMonthTrigger picker={<CalendarMonthsWheel />} />
          <CalendarToolbarYearTrigger picker={<CalendarYearsWheel />} />
        </CalendarToolbarGroup>
        <CalendarToolbarNext />
      </CalendarToolbar>
    </Frame>
  ),
};

// Shared frame for the time-trigger stories: a withTime calendar seeded with a
// selection (the trigger is disabled until a day is picked) and a header.
function TimeFrame({
  globals,
  hour12 = false,
  children,
}: {
  globals: Record<string, unknown>;
  hour12?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ width: 340 }}>
      <CalendarRoot
        {...storyThemeProps(globals)}
        config={buildConfig({ withTime: true, hour12 })}
        initialView={calendarDate(2026, 6, 15)}
        defaultSelection={{
          shape: "point",
          dates: [
            {
              date: calendarDate(2026, 6, 15),
              time: { hour: 14, minute: 30, second: 0, ms: 0 },
            },
          ],
        }}
      >
        <CalendarToolbar justify="space-between">
          <CalendarToolbarPrev />
          <CalendarToolbarLabel />
          {children}
        </CalendarToolbar>
        <CalendarDays />
      </CalendarRoot>
    </div>
  );
}

/**
 * Time trigger with the BUILT-IN stepper picker (the default popup body): each
 * unit is a spinbutton (Arrow/Home/End), with an AM/PM toggle here via the root
 * `hour12` config. No drum import — grid-only apps stay light.
 */
export const TimeTriggerSteppers: Story = {
  render: (_, ctx) => (
    <TimeFrame globals={ctx.globals} hour12>
      <CalendarToolbarTime />
    </TimeFrame>
  ),
};

/**
 * Time trigger with the DRUM picker: `compact` (clock icon) opens the
 * `CalendarTimeWheel` (with seconds) via the `picker` prop. The wheel import is
 * the consumer's; the trigger and the drum share `hour12` from root config.
 */
export const TimeTriggerWheel: Story = {
  render: (_, ctx) => (
    <TimeFrame globals={ctx.globals}>
      <CalendarToolbarTime compact picker={<CalendarTimeWheel seconds />} />
    </TimeFrame>
  ),
};
