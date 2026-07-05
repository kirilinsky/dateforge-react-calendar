import type { Meta, StoryObj } from "@storybook/react-vite";
import { MIDNIGHT } from "@/core/calendar-time";
import { compileDateRules } from "@/core/date-rule-engine";
import type { CalendarConfig } from "@/core/state";
import { today } from "@/core/timezone-boundary";
import { Calendar as CalendarRoot } from "@/react/calendar";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClearIcon,
  HomeIcon,
  ThemeToggleIcon,
} from "@/react/icons";
import { UIButton } from "@/react/ui/button";
import { UITile } from "@/react/ui/tile";
import { storyThemeProps, type V3StoryThemeProps } from "./story-globals";

/**
 * THE STYLE GUIDE for v3 interactive primitives (full contract:
 * .notes/ui-styleguide.md). Internal components — modules compose them,
 * consumers never import them. Everything below derives from theme tokens, so
 * flip the toolbar theme/scheme and watch every state stay legible.
 */
function config(): CalendarConfig {
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
}: { children: React.ReactNode } & V3StoryThemeProps) {
  const c = config();
  return (
    <div style={{ width: 420 }}>
      <CalendarRoot
        config={c}
        initialView={today(c.timeZone)}
        theme={theme}
        scheme={scheme}
      >
        {children}
      </CalendarRoot>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 11, opacity: 0.65 }}>{label}</span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {children}
      </div>
    </div>
  );
}

const meta: Meta = {
  title: "UI Kit",
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj;

/** UIButton: outline (toolbar language) and ghost (quiet in-content actions). */
export const Buttons: Story = {
  render: (_, ctx) => (
    <Frame {...storyThemeProps(ctx.globals)}>
      <div style={{ display: "grid", gap: 16 }}>
        <Row label="outline / md (toolbar nav, triggers, pagers)">
          <UIButton aria-label="Previous month">
            <ChevronLeftIcon />
          </UIButton>
          <UIButton aria-label="Next month">
            <ChevronRightIcon />
          </UIButton>
          <UIButton>June</UIButton>
          <UIButton>
            <ChevronDownIcon />
            2026
          </UIButton>
          <UIButton disabled aria-label="Disabled">
            <ChevronRightIcon />
          </UIButton>
        </Row>
        <Row label="outline / sm (wheel resets)">
          <UIButton size="sm">June</UIButton>
          <UIButton size="sm">14:30</UIButton>
          <UIButton size="sm" disabled>
            now
          </UIButton>
        </Row>
        <Row label="ghost / sm (info actions, clear-in-input, list clear)">
          <UIButton variant="ghost" size="sm" aria-label="Home">
            <HomeIcon />
          </UIButton>
          <UIButton variant="ghost" size="sm" aria-label="Clear">
            <ClearIcon size={12} />
          </UIButton>
          <UIButton variant="ghost" size="sm">
            Clear
          </UIButton>
          <UIButton variant="ghost" size="sm" disabled>
            Clear
          </UIButton>
        </Row>
        <Row label="icons (24-grid, 2px round stroke, currentColor)">
          <ChevronLeftIcon size={18} />
          <ChevronRightIcon size={18} />
          <ChevronDownIcon size={18} />
          <HomeIcon size={18} />
          <ClearIcon size={18} />
          <CheckIcon size={18} />
          <ThemeToggleIcon size={18} />
        </Row>
      </div>
    </Frame>
  ),
};

/** UITile: the roving-grid cell (toolbar pickers, month/year grids, presets). */
export const Tiles: Story = {
  render: (_, ctx) => (
    <Frame {...storyThemeProps(ctx.globals)}>
      <div style={{ display: "grid", gap: 16 }}>
        <Row label="resting / hover">
          <UITile>Jan</UITile>
          <UITile>Feb</UITile>
          <UITile>Mar</UITile>
        </Row>
        <Row label="selected (committed pick) / current (today's unit)">
          <UITile selected aria-current="true">
            Jun
          </UITile>
          <UITile current>Jul</UITile>
          <UITile selected current>
            both
          </UITile>
        </Row>
        <Row label="disabled / aria-disabled (roving keeps focusability)">
          <UITile disabled>Dec</UITile>
          <UITile aria-disabled="true">Nov</UITile>
        </Row>
      </div>
    </Frame>
  ),
};
