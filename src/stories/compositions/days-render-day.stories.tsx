import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays, type DayState } from "@/modules/days";
import { FIXED_DATE } from "../_constants";
import {
  resolveStoryAppearance,
  resolveStoryGradient,
  resolveStoryLocale,
  resolveStoryTheme,
  resolveStoryThemeMode,
} from "../_helpers/resolve-globals";
import { StoryToolbar } from "../_helpers/story-toolbar";

const meta: Meta = {
  title: "Compositions/Days renderDay",
};
export default meta;
type Story = StoryObj;

// Deterministic per-day pseudo-random in [0, 1) — same date always yields the
// same value so stories are stable across reloads / Chromatic snapshots.
const seededRandom = (d: Date): number => {
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const dayContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 2,
  width: "100%",
  height: "100%",
  fontSize: 11,
  lineHeight: 1.1,
};

const dayNumberStyle = (state: DayState): React.CSSProperties => ({
  fontWeight: state.isToday || state.isSelected ? 700 : 500,
  fontSize: 13,
});

// Out-of-month cells: render only the day number. The Calendar's built-in
// `.otherItem` class handles muted text color via the `--c-oom` token, which
// is contrast-tested. Skipping decorations here also avoids axe color-contrast
// failures for low-contrast accent text on dimmed cells.
const renderOtherMonth = (date: Date, state: DayState) => (
  <span style={dayContainerStyle}>
    <span style={dayNumberStyle(state)}>{date.getDate()}</span>
  </span>
);

// ── Weather ──────────────────────────────────────────────────────────────────

const WEATHER_ICONS = ["☀️", "⛅", "☁️", "🌧", "⛈", "❄️"] as const;
const weatherFor = (date: Date) =>
  WEATHER_ICONS[Math.floor(seededRandom(date) * WEATHER_ICONS.length)];

export const Weather: Story = {
  render: (_args, ctx) => {
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
        <CalendarDays
          renderDay={(d, state) => {
            if (state.isOtherMonth) return renderOtherMonth(d, state);
            return (
              <span style={dayContainerStyle}>
                <span style={dayNumberStyle(state)}>{d.getDate()}</span>
                <span aria-hidden style={{ fontSize: 13 }}>
                  {weatherFor(d)}
                </span>
              </span>
            );
          }}
        />
      </Calendar>
    );
  },
};
Weather.storyName = "Weather — emoji icon per day";

// ── Heatmap ──────────────────────────────────────────────────────────────────

const heatColor = (intensity: number, isDark: boolean): string => {
  const alpha = Math.min(0.85, 0.08 + intensity * 0.7);
  return isDark
    ? `rgba(110, 200, 140, ${alpha})`
    : `rgba(34, 139, 60, ${alpha})`;
};

export const Heatmap: Story = {
  render: (_args, ctx) => {
    const [date, setDate] = useState<Date | null>(FIXED_DATE);
    const isDark = ctx.globals.themeMode === "dark";
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
        <CalendarDays
          renderDay={(d, state) => {
            if (state.isOtherMonth) return renderOtherMonth(d, state);
            const intensity = seededRandom(d);
            return (
              <>
                {/* Absolute fill overrides the library's .activeItem background
                    so the heatmap color wins on all appearances/border-radii. */}
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: heatColor(intensity, isDark),
                    borderRadius: "inherit",
                  }}
                />
                <span style={{ ...dayContainerStyle, position: "relative" }}>
                  <span style={dayNumberStyle(state)}>{d.getDate()}</span>
                </span>
              </>
            );
          }}
        />
      </Calendar>
    );
  },
};
Heatmap.storyName = "Heatmap — activity intensity";

// ── Ticket prices ────────────────────────────────────────────────────────────

const priceFor = (date: Date): number => {
  const base = 79;
  const noise = seededRandom(date);
  const dow = date.getDay();
  const isWeekend = dow === 0 || dow === 6;
  return Math.round(base + noise * 220 + (isWeekend ? 60 : 0));
};

export const TicketPrices: Story = {
  render: (_args, ctx) => {
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
        <CalendarDays
          renderDay={(d, state) => {
            if (state.isOtherMonth) return renderOtherMonth(d, state);
            const price = priceFor(d);
            const isCheap = price < 140;
            return (
              <span style={dayContainerStyle}>
                <span style={dayNumberStyle(state)}>{d.getDate()}</span>
                <span
                  aria-hidden
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: isCheap ? "#15803d" : "#b91c1c",
                  }}
                >
                  ${price}
                </span>
              </span>
            );
          }}
        />
      </Calendar>
    );
  },
};
TicketPrices.storyName = "Ticket prices — green cheap, red expensive";

// ── Event dots ───────────────────────────────────────────────────────────────

const EVENT_DAYS = new Set([3, 7, 14, 18, 22, 27]);
const eventCount = (date: Date): number => {
  if (!EVENT_DAYS.has(date.getDate())) return 0;
  return 1 + Math.floor(seededRandom(date) * 3);
};

export const EventDots: Story = {
  render: (_args, ctx) => {
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
        <CalendarDays
          renderDay={(d, state) => {
            if (state.isOtherMonth) return renderOtherMonth(d, state);
            const count = eventCount(d);
            return (
              <span style={dayContainerStyle}>
                <span style={dayNumberStyle(state)}>{d.getDate()}</span>
                <span
                  aria-hidden
                  style={{
                    display: "flex",
                    gap: 2,
                    height: 4,
                  }}
                >
                  {Array.from(
                    { length: count },
                    (_, i) => `${d.getDate()}-${i}`,
                  ).map((key) => (
                    <span
                      key={key}
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: "currentColor",
                        opacity: 0.7,
                      }}
                    />
                  ))}
                </span>
              </span>
            );
          }}
        />
      </Calendar>
    );
  },
};
EventDots.storyName = "Event dots — 1-3 dots on specific days";
