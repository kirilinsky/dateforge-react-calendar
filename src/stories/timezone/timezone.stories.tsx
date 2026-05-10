import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { validateTimeZone } from "@/core/dev-warn";
import { CalendarDays } from "@/modules/days";
import { CalendarNav } from "@/modules/nav";
import { FIXED_DATE } from "../_constants";
import { debugStyle } from "../_helpers/debug";
import {
  resolveStoryAppearance,
  resolveStoryLocale,
  resolveStoryTheme,
} from "../_helpers/resolve-globals";

// Probe shows the timeZone that Calendar resolves: explicit IANA (validated),
// fixed offset, or auto-detect via Intl. Lives outside Calendar — replicates
// the same resolution logic deterministically.
const TzProbe: React.FC<{ value: Date | null; timeZone?: string }> = ({
  value,
  timeZone,
}) => {
  const [resolved, setResolved] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (timeZone === undefined) {
      setResolved(Intl.DateTimeFormat().resolvedOptions().timeZone);
      return;
    }
    if (validateTimeZone(timeZone)) {
      setResolved(timeZone);
      return;
    }
    setResolved(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, [timeZone]);
  return (
    <>
      <p style={debugStyle}>resolved timeZone: {resolved ?? "(unresolved)"}</p>
      <p style={debugStyle}>value: {value ? value.toISOString() : "null"}</p>
    </>
  );
};

const meta: Meta = {
  title: "Timezone/Examples",
};

export default meta;

type Story = StoryObj;

export const AutoDetect: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <>
        <TzProbe value={date} />
        <Calendar
          value={date}
          onChange={setDate}
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
          locale={resolveStoryLocale(ctx.globals.locale)}
        >
          <CalendarNav showMonthPicker compactYears />
          <CalendarDays />
        </Calendar>
      </>
    );
  },
};
AutoDetect.storyName = "Default (auto-detect)";

export const ExplicitParis: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <>
        <TzProbe value={date} timeZone="Europe/Paris" />
        <Calendar
          value={date}
          onChange={setDate}
          timeZone="Europe/Paris"
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
          locale={resolveStoryLocale(ctx.globals.locale)}
        >
          <CalendarNav showMonthPicker compactYears />
          <CalendarDays />
        </Calendar>
      </>
    );
  },
};
ExplicitParis.storyName = "Explicit IANA (Europe/Paris)";

export const ExplicitNewYork: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <>
        <TzProbe value={date} timeZone="America/New_York" />
        <Calendar
          value={date}
          onChange={setDate}
          timeZone="America/New_York"
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
          locale={resolveStoryLocale(ctx.globals.locale)}
        >
          <CalendarNav showMonthPicker compactYears />
          <CalendarDays />
        </Calendar>
      </>
    );
  },
};
ExplicitNewYork.storyName = "Explicit IANA (America/New_York)";

export const FixedOffset: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <>
        <TzProbe value={date} timeZone="UTC+2" />
        <Calendar
          value={date}
          onChange={setDate}
          timeZone="UTC+2"
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
          locale={resolveStoryLocale(ctx.globals.locale)}
        >
          <CalendarNav showMonthPicker compactYears />
          <CalendarDays />
        </Calendar>
      </>
    );
  },
};
FixedOffset.storyName = "Fixed offset (UTC+2)";

export const OffByOneFix: Story = {
  render: (_args, ctx) => {
    // Storage in UTC midnight. Viewer in negative offset would normally see the
    // previous day. Setting timeZone to the storage zone keeps the day stable.
    const utcMidnight = new Date(Date.UTC(2016, 1, 5, 0, 0, 0));
    const [date, setDate] = useState<Date | null>(utcMidnight);
    return (
      <>
        <p style={{ ...debugStyle, marginBottom: 8, opacity: 0.6 }}>
          Stored: {utcMidnight.toISOString()} (UTC midnight). Viewer in
          America/Los_Angeles would render this as Feb 4 — setting
          timeZone="UTC" pins it to Feb 5.
        </p>
        <TzProbe value={date} timeZone="UTC" />
        <Calendar
          value={date}
          onChange={setDate}
          timeZone="UTC"
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
          locale={resolveStoryLocale(ctx.globals.locale)}
        >
          <CalendarNav showMonthPicker compactYears />
          <CalendarDays />
        </Calendar>
      </>
    );
  },
};
OffByOneFix.storyName = "Off-by-one fix (storage UTC, viewer negative offset)";

export const InvalidTimezone: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    return (
      <>
        <p style={{ ...debugStyle, marginBottom: 8, opacity: 0.6 }}>
          timeZone="Europe/Wrongville" → falls back to auto-detect (dev warn
          fires)
        </p>
        <TzProbe value={date} timeZone="Europe/Wrongville" />
        <Calendar
          value={date}
          onChange={setDate}
          timeZone="Europe/Wrongville"
          theme={resolveStoryTheme(ctx.globals.theme)}
          appearance={resolveStoryAppearance(ctx.globals.appearance)}
          locale={resolveStoryLocale(ctx.globals.locale)}
        >
          <CalendarNav showMonthPicker compactYears />
          <CalendarDays />
        </Calendar>
      </>
    );
  },
};
InvalidTimezone.storyName = "Invalid timezone (falls back to auto)";
