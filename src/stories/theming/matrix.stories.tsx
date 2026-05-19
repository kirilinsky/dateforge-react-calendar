import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect } from "storybook/test";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import { CalendarNav } from "@/modules/nav";
import type { CalendarAppearance } from "@/types/appearances";
import type { CalendarTheme } from "@/types/themes";
import * as appearances from "../../../appearances/index";
import * as themes from "../../../themes/index";
import { FIXED_DATE } from "../_constants";

const lightThemeEntries = [
  ["graphite", themes.graphite],
  ["amethyst", themes.amethyst],
  ["mint", themes.mint],
  ["tide", themes.tide],
  ["comfy", themes.comfy],
  ["neon", themes.neon],
  ["rosa", themes.rosa],
  ["snow", themes.snow],
  ["solar", themes.solar],
  ["latte", themes.latte],
  ["slate", themes.slate],
  ["scarlet", themes.scarlet],
  ["prism", themes.prism],
  ["meadow", themes.meadow],
  ["monsoon", themes.monsoon],
  ["pearl", themes.pearl],
  ["chalk", themes.chalk],
  ["split", themes.split],
  ["riso", themes.riso],
] satisfies readonly (readonly [string, CalendarTheme])[];

const darkThemeEntries = [
  ["industrial", themes.industrial],
  ["midnight", themes.midnight],
  ["sandstone", themes.sandstone],
  ["phosphor", themes.phosphor],
  ["dracula", themes.dracula],
  ["cyber", themes.cyber],
  ["temporal", themes.temporal],
  ["crimson", themes.crimson],
  ["forest", themes.forest],
  ["nebula", themes.nebula],
  ["aurora", themes.aurora],
  ["espresso", themes.espresso],
  ["ember", themes.ember],
  ["flare", themes.flare],
  ["abyss", themes.abyss],
  ["cobalt", themes.cobalt],
  ["fjord", themes.fjord],
  ["velvet", themes.velvet],
  ["eclipse", themes.eclipse],
] satisfies readonly (readonly [string, CalendarTheme])[];

const appearanceEntries = Object.entries(appearances) as [
  string,
  CalendarAppearance,
][];

const meta: Meta = {
  title: "Theming/Matrix",
};

export default meta;

type Story = StoryObj;

const Cell: React.FC<{
  theme: CalendarTheme;
  appearance?: CalendarAppearance;
  label: string;
}> = ({ theme, appearance, label }) => {
  const [date, setDate] = useState<Date | null>(FIXED_DATE);
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 6, width: 305 }}
    >
      <span
        style={{
          fontFamily: "monospace",
          fontSize: 11,
          color: "inherit",
          opacity: 0.7,
        }}
      >
        {label}
      </span>
      <Calendar
        value={date}
        onChange={setDate}
        theme={theme}
        appearance={appearance}
      >
        <CalendarNav showMonthPicker compactYears />
        <CalendarDays />
      </Calendar>
    </div>
  );
};

const renderThemesOverview = (
  themeEntries: readonly (readonly [string, CalendarTheme])[],
) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
    {themeEntries.map(([name, theme]) => (
      <Cell key={name} theme={theme} label={name} />
    ))}
  </div>
);

export const LightThemesOverview: Story = {
  parameters: { storyWidth: "auto" },
  render: () => renderThemesOverview(lightThemeEntries),
};
LightThemesOverview.storyName = "Light themes (default appearance)";

export const DarkThemesOverview: Story = {
  parameters: { storyWidth: "auto" },
  render: () => renderThemesOverview(darkThemeEntries),
};
DarkThemesOverview.storyName = "Dark themes (default appearance)";

export const AppearancesOverview: Story = {
  parameters: { storyWidth: "auto" },
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
      {(["default", ...appearanceEntries.map(([n]) => n)] as const).map(
        (name) => {
          const appearance =
            name === "default"
              ? undefined
              : appearanceEntries.find(([n]) => n === name)?.[1];
          return (
            <Cell
              key={name}
              theme="auto"
              appearance={appearance}
              label={name}
            />
          );
        },
      )}
    </div>
  ),
};
AppearancesOverview.storyName = "All appearances (default theme)";

// Proof that theme + appearance token cascades reach the rendered DOM.
// Without this, `toBeVisible` passes on an unstyled component — we'd have
// no signal if a token regressed (e.g. loft skipping `--cal-nav-font-size`).
export const CssCheck: Story = {
  render: () => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={themes.dracula}
        appearance={appearances.loft}
      >
        <CalendarNav showMonthPicker />
        <CalendarDays />
      </Calendar>
    );
  },
  play: async ({ canvasElement }) => {
    const header = canvasElement.querySelector(
      '[data-area="header"]',
    ) as HTMLElement | null;
    await expect(header).not.toBeNull();
    const style = getComputedStyle(header!);
    // Dracula highlight token must reach descendants of [data-theme].
    // Browser normalizes the hex `#ff5e5e` to its rgb() form on resolve.
    await expect(style.getPropertyValue("--c-h").trim()).toBe(
      "rgb(255, 94, 94)",
    );
    // Loft appearance must override --cal-nav-font-size on .calendarContainer.
    await expect(style.getPropertyValue("--cal-nav-font-size").trim()).toBe(
      "1.1em",
    );
  },
};
CssCheck.storyName = "CssCheck — theme + appearance cascade";
