import type { Meta, StoryObj } from "@storybook/react-vite";
import { MIDNIGHT } from "@/core-v3/calendar-time";
import { compileDateRules } from "@/core-v3/date-rule-engine";
import type { CalendarConfig } from "@/core-v3/state";
import { today } from "@/core-v3/timezone-boundary";
import { CalendarDays } from "@/modules-v3/days/CalendarDays";
import { Calendar as CalendarRoot } from "@/react-v3/calendar";
import { storyThemeProps, type V3StoryThemeProps } from "../_lab/story-globals";
import {
  CalendarToolbar,
  CalendarToolbarClear,
  CalendarToolbarGroup,
  CalendarToolbarHome,
  CalendarToolbarLabel,
  CalendarToolbarMonthTrigger,
  CalendarToolbarNext,
  CalendarToolbarPrev,
  CalendarToolbarYearTrigger,
} from "./CalendarToolbar";

/**
 * v3 toolbar — the composable replacement for v2's monolithic `<CalendarNav>`.
 * There is NO `<CalendarNav>` in v3: navigation is a bag of primitives you
 * arrange yourself. These stories show a batteries-included "nav" recipe (just a
 * composition, per plan §10 — recipes are docs, not runtime exports) plus custom
 * layouts that the same primitives unlock.
 */
function buildConfig(): CalendarConfig {
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
  };
}

function Frame({
  children,
  theme,
  scheme,
}: {
  children: React.ReactNode;
} & V3StoryThemeProps) {
  const config = buildConfig();
  return (
    <CalendarRoot
      config={config}
      initialView={today(config.timeZone)}
      theme={theme}
      scheme={scheme}
    >
      {children}
      <CalendarDays />
    </CalendarRoot>
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
 * for `<CalendarNav>`.
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
 * A minimal "label + arrows" header — the same primitives, a plainer arrangement
 * with no popups.
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
 * Year-stepping header with a Clear action — shows `step="year"` and that any
 * primitive can sit anywhere in the toolbar.
 */
export const YearStepAndClear: Story = {
  render: (_, ctx) => (
    <Frame {...storyThemeProps(ctx.globals)}>
      <CalendarToolbar>
        <CalendarToolbarGroup>
          <CalendarToolbarPrev step="year" label="Previous year" />
          <CalendarToolbarYearTrigger />
          <CalendarToolbarNext step="year" label="Next year" />
        </CalendarToolbarGroup>
        <CalendarToolbarClear />
      </CalendarToolbar>
    </Frame>
  ),
};
