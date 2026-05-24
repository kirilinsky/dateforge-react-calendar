import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import { CalendarToolbar } from "@/modules/toolbar";
import type { ApplyValue } from "@/modules/toolbar/apply";
import { CalendarToolbarApply } from "@/modules/toolbar/apply";
import { CalendarToolbarClear } from "@/modules/toolbar/clear";
import { CalendarToolbarClock } from "@/modules/toolbar/clock";
import { CalendarToolbarDayLabel } from "@/modules/toolbar/day-label";
import { CalendarToolbarGroup } from "@/modules/toolbar/group";
import { CalendarToolbarHome } from "@/modules/toolbar/home";
import { CalendarToolbarLabel } from "@/modules/toolbar/label";
import { CalendarToolbarMonthLabel } from "@/modules/toolbar/month-label";
import { CalendarToolbarMonthTrigger } from "@/modules/toolbar/month-trigger";
import { CalendarToolbarNext } from "@/modules/toolbar/next";
import { CalendarToolbarPrev } from "@/modules/toolbar/prev";
import { CalendarToolbarThemeToggle } from "@/modules/toolbar/theme-toggle";
import { CalendarToolbarTime } from "@/modules/toolbar/time";
import { CalendarToolbarYearLabel } from "@/modules/toolbar/year-label";
import { CalendarToolbarYearTrigger } from "@/modules/toolbar/year-trigger";
import * as themes from "../../../themes/index";
import { FIXED_DATE } from "../_constants";
import {
  resolveStoryAppearance,
  resolveStoryGradient,
  resolveStoryLocale,
  resolveStoryTheme,
  resolveStoryThemeMode,
} from "../_helpers/resolve-globals";

type RangeValue = { from: Date | null; to: Date | null };
type Args = { locale?: string };

const meta: Meta<Args> = {
  title: "Modules/Toolbar",
  argTypes: { locale: { control: "text" } },
  args: { locale: undefined },
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        locale={args.locale ?? resolveStoryLocale(ctx.globals.locale)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
      >
        <CalendarToolbar>
          <CalendarToolbarGroup grow>
            <CalendarToolbarPrev unit="month" />
            <CalendarToolbarMonthTrigger />
            <CalendarToolbarYearTrigger />
            <CalendarToolbarNext unit="month" />
          </CalendarToolbarGroup>
        </CalendarToolbar>
        <CalendarDays />
      </Calendar>
    );
  },
};

export default meta;
type Story = StoryObj<Args>;

// ─── Default ────────────────────────────────────────────────────────────────

export const Default: Story = {};
Default.storyName = "Default — Prev / MonthTrigger / YearTrigger / Next";

// ─── Navigation ─────────────────────────────────────────────────────────────

export const NavYear: Story = {
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        locale={args.locale ?? resolveStoryLocale(ctx.globals.locale)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
      >
        <CalendarToolbar>
          <CalendarToolbarGroup grow>
            <CalendarToolbarPrev unit="year" />
            <CalendarToolbarYearTrigger />
            <CalendarToolbarNext unit="year" />
          </CalendarToolbarGroup>
        </CalendarToolbar>
        <CalendarDays />
      </Calendar>
    );
  },
};
NavYear.storyName = "Nav — year unit";

export const NavDay: Story = {
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        locale={args.locale ?? resolveStoryLocale(ctx.globals.locale)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
      >
        <CalendarToolbar>
          <CalendarToolbarGroup grow>
            <CalendarToolbarPrev unit="day" />
            <CalendarToolbarMonthLabel />
            <CalendarToolbarDayLabel format="numeric" />
            <CalendarToolbarYearLabel />
            <CalendarToolbarNext unit="day" />
          </CalendarToolbarGroup>
        </CalendarToolbar>
        <CalendarDays />
      </Calendar>
    );
  },
};
NavDay.storyName = "Nav — day unit";

// ─── Popup Triggers ──────────────────────────────────────────────────────────

export const TriggerMonth: Story = {
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        locale={args.locale ?? resolveStoryLocale(ctx.globals.locale)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
      >
        <CalendarToolbar>
          <CalendarToolbarGroup grow>
            <CalendarToolbarPrev unit="month" />
            <CalendarToolbarMonthTrigger />
            <CalendarToolbarNext unit="month" />
          </CalendarToolbarGroup>
        </CalendarToolbar>
        <CalendarDays />
      </Calendar>
    );
  },
};
TriggerMonth.storyName = "Trigger — month picker";

export const TriggerYear: Story = {
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        locale={args.locale ?? resolveStoryLocale(ctx.globals.locale)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
      >
        <CalendarToolbar>
          <CalendarToolbarGroup grow>
            <CalendarToolbarPrev unit="year" />
            <CalendarToolbarYearTrigger />
            <CalendarToolbarNext unit="year" />
          </CalendarToolbarGroup>
        </CalendarToolbar>
        <CalendarDays />
      </Calendar>
    );
  },
};
TriggerYear.storyName = "Trigger — year picker";

export const TriggerCompact: Story = {
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        locale={args.locale ?? resolveStoryLocale(ctx.globals.locale)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
      >
        <CalendarToolbar>
          <CalendarToolbarGroup>
            <CalendarToolbarPrev unit="month" />
            <CalendarToolbarMonthTrigger compact />
            <CalendarToolbarYearTrigger compact />
            <CalendarToolbarNext unit="month" />
          </CalendarToolbarGroup>
        </CalendarToolbar>
        <CalendarDays />
      </Calendar>
    );
  },
};
TriggerCompact.storyName = "Trigger — compact month + year";

export const TriggerTime: Story = {
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        locale={args.locale ?? resolveStoryLocale(ctx.globals.locale)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
      >
        <CalendarToolbar>
          <CalendarToolbarGroup grow>
            <CalendarToolbarPrev unit="month" />
            <CalendarToolbarMonthTrigger />
            <CalendarToolbarYearTrigger />
            <CalendarToolbarNext unit="month" />
          </CalendarToolbarGroup>
          <CalendarToolbarTime compact />
        </CalendarToolbar>
        <CalendarDays />
      </Calendar>
    );
  },
};
TriggerTime.storyName = "Trigger — time picker (compact)";

export const TriggerTimeFull: Story = {
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        locale={args.locale ?? resolveStoryLocale(ctx.globals.locale)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
      >
        <CalendarToolbar>
          <CalendarToolbarTime />
        </CalendarToolbar>
        <CalendarDays />
      </Calendar>
    );
  },
};
TriggerTimeFull.storyName = "Trigger — time picker (full)";

// ─── Static Labels & Clock ───────────────────────────────────────────────────

export const StaticLabels: Story = {
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        locale={args.locale ?? resolveStoryLocale(ctx.globals.locale)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
      >
        <CalendarToolbar>
          <CalendarToolbarGroup grow>
            <CalendarToolbarPrev unit="day" />
            <CalendarToolbarMonthLabel />
            <CalendarToolbarDayLabel format="2-digit" />
            <CalendarToolbarYearLabel />
            <CalendarToolbarNext unit="day" />
          </CalendarToolbarGroup>
        </CalendarToolbar>
        <CalendarDays />
      </Calendar>
    );
  },
};
StaticLabels.storyName = "Labels — MonthLabel + DayLabel + YearLabel";

export const LiveClock: Story = {
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        locale={args.locale ?? resolveStoryLocale(ctx.globals.locale)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
      >
        <CalendarToolbar>
          <CalendarToolbarGroup>
            <CalendarToolbarClock seconds />
            <CalendarToolbarMonthLabel />
            <CalendarToolbarYearLabel />
          </CalendarToolbarGroup>
        </CalendarToolbar>
        <CalendarDays />
      </Calendar>
    );
  },
};
LiveClock.storyName = "Labels — Clock (live, seconds)";

export const CustomLabel: Story = {
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        locale={args.locale ?? resolveStoryLocale(ctx.globals.locale)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
      >
        <CalendarToolbar>
          <CalendarToolbarLabel>Choose departure date</CalendarToolbarLabel>
          <CalendarToolbarHome />
        </CalendarToolbar>
        <CalendarDays />
      </Calendar>
    );
  },
};
CustomLabel.storyName = "Labels — custom heading";

// ─── Utility Buttons ─────────────────────────────────────────────────────────

export const UtilityButtons: Story = {
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        locale={args.locale ?? resolveStoryLocale(ctx.globals.locale)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
      >
        <CalendarToolbar>
          <CalendarToolbarGroup grow>
            <CalendarToolbarPrev unit="month" />
            <CalendarToolbarMonthTrigger />
            <CalendarToolbarYearTrigger />
            <CalendarToolbarNext unit="month" />
          </CalendarToolbarGroup>
          <CalendarToolbarGroup>
            <CalendarToolbarHome />
            <CalendarToolbarClear />
            <CalendarToolbarThemeToggle />
          </CalendarToolbarGroup>
        </CalendarToolbar>
        <CalendarDays />
      </Calendar>
    );
  },
};
UtilityButtons.storyName = "Utility — Home + Clear + ThemeToggle";

export const Group: Story = {
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        locale={args.locale ?? resolveStoryLocale(ctx.globals.locale)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
      >
        <CalendarToolbar>
          <CalendarToolbarGroup grow>
            <CalendarToolbarPrev unit="month" />
            <CalendarToolbarMonthTrigger />
            <CalendarToolbarYearTrigger />
            <CalendarToolbarNext unit="month" />
          </CalendarToolbarGroup>
          <CalendarToolbarGroup>
            <CalendarToolbarHome />
            <CalendarToolbarClear />
            <CalendarToolbarThemeToggle />
          </CalendarToolbarGroup>
        </CalendarToolbar>
        <CalendarDays />
      </Calendar>
    );
  },
};
Group.storyName = "Group — nav left, actions right";

// ─── Layouts ─────────────────────────────────────────────────────────────────

export const GridLayout: Story = {
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        locale={args.locale ?? resolveStoryLocale(ctx.globals.locale)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
      >
        <CalendarToolbar cols={5}>
          <CalendarToolbarPrev unit="month" />
          <CalendarToolbarMonthTrigger col={2} />
          <CalendarToolbarYearTrigger />
          <CalendarToolbarNext unit="month" />
        </CalendarToolbar>
        <CalendarDays />
      </Calendar>
    );
  },
};
GridLayout.storyName = "Layout — cols=5 grid";

export const ToolbarBelow: Story = {
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        locale={args.locale ?? resolveStoryLocale(ctx.globals.locale)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
      >
        <CalendarDays />
        <CalendarToolbar>
          <CalendarToolbarGroup grow>
            <CalendarToolbarPrev unit="month" />
            <CalendarToolbarMonthTrigger />
            <CalendarToolbarYearTrigger />
            <CalendarToolbarNext unit="month" />
          </CalendarToolbarGroup>
          <CalendarToolbarHome />
        </CalendarToolbar>
      </Calendar>
    );
  },
};
ToolbarBelow.storyName = "Layout — toolbar below days";

export const DualToolbar: Story = {
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        locale={args.locale ?? resolveStoryLocale(ctx.globals.locale)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
      >
        <CalendarToolbar>
          <CalendarToolbarPrev />
          <CalendarToolbarGroup>
            <CalendarToolbarMonthTrigger />
            <CalendarToolbarYearTrigger />
          </CalendarToolbarGroup>
          <CalendarToolbarNext />
        </CalendarToolbar>
        <CalendarDays />
        <CalendarToolbar>
          <CalendarToolbarHome />
          <CalendarToolbarGroup>
            <CalendarToolbarClear />
            <CalendarToolbarApply onApply={() => {}} />
          </CalendarToolbarGroup>
        </CalendarToolbar>
      </Calendar>
    );
  },
};
DualToolbar.storyName = "Layout — toolbar above + below days";

export const TwoPanel: Story = {
  parameters: { storyWidth: "auto" },
  render: (args, ctx) => {
    const [range, setRange] = useState<RangeValue>({
      from: FIXED_DATE,
      to: new Date(2016, 1, 20),
    });
    const [_last, _setLast] = useState<ApplyValue | undefined>(undefined);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <Calendar
          mode="range"
          value={range}
          onChange={setRange}
          cols={2}
          locale={args.locale ?? resolveStoryLocale(ctx.globals.locale)}
          theme={resolveStoryTheme(ctx.globals.theme)}
          {...resolveStoryThemeMode(ctx.globals.themeMode)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
          gradient={resolveStoryGradient(ctx.globals.gradient)}
        >
          <CalendarToolbar col={2}>
            <CalendarToolbarPrev />
            <CalendarToolbarGroup grow>
              <CalendarToolbarMonthLabel />
              <CalendarToolbarYearLabel />
            </CalendarToolbarGroup>
            <CalendarToolbarGroup grow>
              <CalendarToolbarMonthLabel offset={1} />
              <CalendarToolbarYearLabel offset={1} />
            </CalendarToolbarGroup>
            <CalendarToolbarNext />
          </CalendarToolbar>

          <CalendarDays col={1} />
          <CalendarDays offset={1} col={1} />

          <CalendarToolbar col={2}>
            <CalendarToolbarHome />
          </CalendarToolbar>
        </Calendar>
      </div>
    );
  },
};
TwoPanel.storyName = "Layout — two-panel range (offset)";

// ─── Bounded ─────────────────────────────────────────────────────────────────

export const WithMinMax: Story = {
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        minDate={new Date(2015, 0, 1)}
        maxDate={new Date(2017, 11, 31)}
        locale={args.locale ?? resolveStoryLocale(ctx.globals.locale)}
        theme={resolveStoryTheme(ctx.globals.theme)}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
      >
        <CalendarToolbar>
          <CalendarToolbarGroup grow>
            <CalendarToolbarPrev unit="year" />
            <CalendarToolbarYearTrigger />
            <CalendarToolbarNext unit="year" />
          </CalendarToolbarGroup>
          <CalendarToolbarGroup grow>
            <CalendarToolbarPrev unit="month" />
            <CalendarToolbarMonthTrigger />
            <CalendarToolbarNext unit="month" />
          </CalendarToolbarGroup>
        </CalendarToolbar>
        <CalendarDays />
      </Calendar>
    );
  },
};
WithMinMax.storyName = "Bounded — 2015–2017 (nav disabled at limits)";

// ─── Themed ──────────────────────────────────────────────────────────────────

export const SeparateTheme: Story = {
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <Calendar
        value={date}
        onChange={setDate}
        locale={args.locale ?? resolveStoryLocale(ctx.globals.locale)}
        theme={resolveStoryTheme(ctx.globals.theme) ?? themes.slate}
        {...resolveStoryThemeMode(ctx.globals.themeMode)}
        appearance={resolveStoryAppearance(ctx.globals.appearance)}
        gradient={resolveStoryGradient(ctx.globals.gradient)}
      >
        <CalendarToolbar theme={themes.dracula}>
          <CalendarToolbarGroup grow>
            <CalendarToolbarPrev unit="month" />
            <CalendarToolbarMonthTrigger />
            <CalendarToolbarYearTrigger />
            <CalendarToolbarNext unit="month" />
          </CalendarToolbarGroup>
          <CalendarToolbarGroup>
            <CalendarToolbarTime compact />
            <CalendarToolbarThemeToggle />
          </CalendarToolbarGroup>
        </CalendarToolbar>
        <CalendarDays />
      </Calendar>
    );
  },
};
SeparateTheme.storyName = "Themed — toolbar with own theme (dracula on slate)";

// ─── Kitchen Sink ─────────────────────────────────────────────────────────────

export const KitchenSink: Story = {
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    const [last, setLast] = useState<ApplyValue | undefined>(undefined);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <Calendar
          value={date}
          onChange={setDate}
          locale={args.locale ?? resolveStoryLocale(ctx.globals.locale)}
          theme={resolveStoryTheme(ctx.globals.theme)}
          {...resolveStoryThemeMode(ctx.globals.themeMode)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
          gradient={resolveStoryGradient(ctx.globals.gradient)}
        >
          <CalendarToolbar>
            <CalendarToolbarClock seconds />
            <CalendarToolbarGroup grow>
              <CalendarToolbarPrev unit="year" />
              <CalendarToolbarYearTrigger />
              <CalendarToolbarNext unit="year" />
            </CalendarToolbarGroup>
            <CalendarToolbarGroup grow>
              <CalendarToolbarPrev unit="month" />
              <CalendarToolbarMonthTrigger />
              <CalendarToolbarNext unit="month" />
            </CalendarToolbarGroup>
            <CalendarToolbarGroup grow>
              <CalendarToolbarPrev unit="day" />
              <CalendarToolbarMonthLabel />
              <CalendarToolbarDayLabel format="numeric" />
              <CalendarToolbarYearLabel />
              <CalendarToolbarNext unit="day" />
            </CalendarToolbarGroup>
            <CalendarToolbarGroup>
              <CalendarToolbarMonthTrigger compact />
              <CalendarToolbarYearTrigger compact />
            </CalendarToolbarGroup>
            <CalendarToolbarGroup>
              <CalendarToolbarTime compact />
              <CalendarToolbarHome />
              <CalendarToolbarClear />
              <CalendarToolbarApply onApply={setLast} />
              <CalendarToolbarThemeToggle />
            </CalendarToolbarGroup>
          </CalendarToolbar>
          <CalendarDays />
        </Calendar>
        <pre style={{ margin: 0, fontSize: "0.8rem", opacity: 0.7 }}>
          {last === undefined
            ? "— pick a date then Apply (✓)"
            : formatApplyValue(last)}
        </pre>
      </div>
    );
  },
};
KitchenSink.storyName = "Kitchen sink — all modules (overflow demo)";

// ─── Apply ────────────────────────────────────────────────────────────────────

const formatApplyValue = (v: ApplyValue): string => {
  if (v === null) return "null";
  if (v instanceof Date) return v.toLocaleString();
  if (Array.isArray(v)) return v.map((d) => d.toLocaleString()).join(", ");
  return `from: ${v.from?.toLocaleString() ?? "null"}  |  to: ${v.to?.toLocaleString() ?? "null"}`;
};

export const ApplySingle: Story = {
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(null);
    const [last, setLast] = useState<ApplyValue | undefined>(undefined);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <Calendar
          value={date}
          onChange={setDate}
          locale={args.locale ?? resolveStoryLocale(ctx.globals.locale)}
          theme={resolveStoryTheme(ctx.globals.theme)}
          {...resolveStoryThemeMode(ctx.globals.themeMode)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
          gradient={resolveStoryGradient(ctx.globals.gradient)}
        >
          <CalendarToolbar>
            <CalendarToolbarGroup grow>
              <CalendarToolbarPrev unit="month" />
              <CalendarToolbarMonthTrigger />
              <CalendarToolbarYearTrigger />
              <CalendarToolbarNext unit="month" />
            </CalendarToolbarGroup>
            <CalendarToolbarApply onApply={setLast} />
          </CalendarToolbar>
          <CalendarDays />
        </Calendar>
        <pre style={{ margin: 0, fontSize: "0.8rem", opacity: 0.7 }}>
          {last === undefined
            ? "— pick a date then Apply"
            : formatApplyValue(last)}
        </pre>
      </div>
    );
  },
};
ApplySingle.storyName = "Apply — single mode (check icon)";

export const ApplyRange: Story = {
  render: (args, ctx) => {
    const [range, setRange] = useState<RangeValue>({ from: null, to: null });
    const [last, setLast] = useState<ApplyValue | undefined>(undefined);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <Calendar
          value={range}
          onChange={setRange}
          mode="range"
          locale={args.locale ?? resolveStoryLocale(ctx.globals.locale)}
          theme={resolveStoryTheme(ctx.globals.theme)}
          {...resolveStoryThemeMode(ctx.globals.themeMode)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
          gradient={resolveStoryGradient(ctx.globals.gradient)}
        >
          <CalendarToolbar>
            <CalendarToolbarGroup grow>
              <CalendarToolbarPrev unit="month" />
              <CalendarToolbarMonthTrigger />
              <CalendarToolbarYearTrigger />
              <CalendarToolbarNext unit="month" />
            </CalendarToolbarGroup>
            <CalendarToolbarClear />
            <CalendarToolbarApply onApply={setLast} />
          </CalendarToolbar>
          <CalendarDays />
        </Calendar>
        <pre style={{ margin: 0, fontSize: "0.8rem", opacity: 0.7 }}>
          {last === undefined
            ? "— pick a range then Apply"
            : formatApplyValue(last)}
        </pre>
      </div>
    );
  },
};
ApplyRange.storyName = "Apply — range mode";

export const ApplyCustomLabel: Story = {
  render: (args, ctx) => {
    const [date, setDate] = useState<Date | null>(null);
    const [last, setLast] = useState<ApplyValue | undefined>(undefined);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <Calendar
          value={date}
          onChange={setDate}
          locale={args.locale ?? resolveStoryLocale(ctx.globals.locale)}
          theme={resolveStoryTheme(ctx.globals.theme)}
          {...resolveStoryThemeMode(ctx.globals.themeMode)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
          gradient={resolveStoryGradient(ctx.globals.gradient)}
        >
          <CalendarToolbar>
            <CalendarToolbarGroup grow>
              <CalendarToolbarPrev unit="month" />
              <CalendarToolbarMonthTrigger />
              <CalendarToolbarYearTrigger />
              <CalendarToolbarNext unit="month" />
            </CalendarToolbarGroup>
            <CalendarToolbarApply onApply={setLast}>
              Confirm
            </CalendarToolbarApply>
          </CalendarToolbar>
          <CalendarDays />
        </Calendar>
        <pre style={{ margin: 0, fontSize: "0.8rem", opacity: 0.7 }}>
          {last === undefined
            ? "— pick a date then Confirm"
            : formatApplyValue(last)}
        </pre>
      </div>
    );
  },
};
ApplyCustomLabel.storyName = "Apply — custom label (text button)";
