import { Fragment, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import { CalendarNav } from "@/modules/nav";
import * as themes from "../../../themes/index";
import * as appearances from "../../../appearances/index";
import type { CalendarTheme } from "@/types/themes";
import type { CalendarAppearance } from "@/types/appearances";
import { FIXED_DATE } from "../_constants";

const themeEntries = Object.entries(themes) as [string, CalendarTheme][];
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

export const ThemesOverview: Story = {
  parameters: { storyWidth: "auto" },
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
      {themeEntries.map(([name, theme]) => (
        <Cell key={name} theme={theme} label={name} />
      ))}
    </div>
  ),
};
ThemesOverview.storyName = "All themes (default appearance)";

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
