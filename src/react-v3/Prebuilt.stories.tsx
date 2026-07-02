import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { storyLocale, storyThemeProps } from "../modules-v3/_lab/story-globals";
import {
  DatePicker,
  MonthPicker,
  MultiMonthCalendar,
  SimpleCalendar,
} from "./prebuilt";

/**
 * Prebuilt calendars — `@dateforge/react-calendar/prebuilt`. One import, zero
 * composition: for consumers who don't want to assemble modules. Each is a
 * plain-`Date` wrapper over the same primitives; the modular subpaths stay
 * pay-for-what-you-import.
 */
const meta: Meta = {
  title: "v3/Prebuilt",
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj;

const localeOf = (globals: Record<string, unknown>) =>
  storyLocale(globals)?.locale;

/** `<SimpleCalendar onChange={setDate} />` — the whole integration. */
export const Simple: Story = {
  render: (_, ctx) => {
    const [date, setDate] = useState<Date | null>(null);
    return (
      <div style={{ width: 320, display: "grid", gap: 8 }}>
        <SimpleCalendar
          {...storyThemeProps(ctx.globals)}
          locale={localeOf(ctx.globals)}
          onChange={setDate}
        />
        <pre style={{ fontSize: 12 }}>{date ? date.toDateString() : "—"}</pre>
      </div>
    );
  },
};

/** Manual input + Today jump + grid. */
export const Picker: Story = {
  render: (_, ctx) => (
    <div style={{ width: 320 }}>
      <DatePicker
        {...storyThemeProps(ctx.globals)}
        locale={localeOf(ctx.globals)}
        disabled={{ weekends: true }}
      />
    </div>
  ),
};

/** Year-stepping month picker; reports the first day of the picked month. */
export const Months: Story = {
  render: (_, ctx) => {
    const [month, setMonth] = useState<Date | null>(null);
    return (
      <div style={{ width: 320, display: "grid", gap: 8 }}>
        <MonthPicker
          {...storyThemeProps(ctx.globals)}
          locale={localeOf(ctx.globals)}
          onChange={setMonth}
        />
        <pre style={{ fontSize: 12 }}>{month ? month.toDateString() : "—"}</pre>
      </div>
    );
  },
};

/** Six consecutive months, 3 per row — one shared range across the board. */
export const SixMonths: Story = {
  parameters: { storyWidth: 900 },
  render: (_, ctx) => (
    <div style={{ width: 860 }}>
      <MultiMonthCalendar
        {...storyThemeProps(ctx.globals)}
        locale={localeOf(ctx.globals)}
        months={6}
        cols={3}
        mode="range"
        startMonth={new Date(2026, 4, 1)}
      />
    </div>
  ),
};

/** A full year, read-only (an availability/overview board). */
export const YearBoard: Story = {
  parameters: { storyWidth: 1100 },
  render: (_, ctx) => (
    <div style={{ width: 1060 }}>
      <MultiMonthCalendar
        {...storyThemeProps(ctx.globals)}
        locale={localeOf(ctx.globals)}
        months={12}
        cols={4}
        mode="multiple"
        readOnly
        navigation={false}
        startMonth={new Date(2026, 0, 1)}
      />
    </div>
  ),
};
