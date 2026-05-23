import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import { CalendarLunar } from "@/modules/lunar";
import { FIXED_DATE } from "../_constants";
import {
  resolveStoryAppearance,
  resolveStoryGradient,
  resolveStoryLocale,
  resolveStoryTheme,
  resolveStoryThemeMode,
} from "../_helpers/resolve-globals";
import { StoryToolbar } from "../_helpers/story-toolbar";

type LunarArgs = {
  showLabels?: boolean;
};

const meta: Meta<LunarArgs> = {
  title: "Modules/Lunar",
  argTypes: {
    showLabels: { control: "boolean" },
  },
  args: {
    showLabels: true,
  },
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
        locale={resolveStoryLocale(ctx.globals.locale)}
      >
        <StoryToolbar />
        <CalendarDays />
        <CalendarLunar phaseLabels={args.showLabels ? undefined : false} />
      </Calendar>
    );
  },
};

export default meta;
type Story = StoryObj<LunarArgs>;

export const Default: Story = {};
Default.storyName = "Default (auto-fits container)";

export const NoLabels: Story = {
  args: { showLabels: false },
};
NoLabels.storyName = "Icons only (phaseLabels=false)";

export const LocalizedLabels: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        locale="ru"
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
      >
        <StoryToolbar />
        <CalendarDays />
        <CalendarLunar
          lunarLabel="Фазы луны"
          phaseLabels={{
            new: "НОВ",
            "waxing-crescent": "РАСТ СЕРП",
            "first-quarter": "I ЧЕТВ",
            "waxing-gibbous": "РАСТ ВЫПУКЛ",
            full: "ПОЛН",
            "waning-gibbous": "УБЫВ ВЫПУКЛ",
            "last-quarter": "III ЧЕТВ",
            "waning-crescent": "УБЫВ СЕРП",
          }}
          phaseAriaLabels={{
            new: "Новолуние",
            "waxing-crescent": "Растущий серп",
            "first-quarter": "Первая четверть",
            "waxing-gibbous": "Растущая луна",
            full: "Полнолуние",
            "waning-gibbous": "Убывающая луна",
            "last-quarter": "Последняя четверть",
            "waning-crescent": "Убывающий серп",
          }}
        />
      </Calendar>
    );
  },
};
LocalizedLabels.storyName = "Localized phase labels (Russian)";
