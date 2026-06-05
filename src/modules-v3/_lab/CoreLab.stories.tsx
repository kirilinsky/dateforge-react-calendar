import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  addDays,
  addMonths,
  addYears,
  type CalendarDate,
  calendarDate,
  dateKey,
  daysInMonth,
  isLeapYear,
  isValidDate,
  weekdayOf,
} from "@/core-v3/calendar-date";
import {
  type CalendarDateTime,
  calendarDateTime,
} from "@/core-v3/calendar-date-time";
import {
  type CalendarRange,
  mergeRanges,
  orderRange,
  rangeIndexOf,
  rangeLengthDays,
  rangeRole,
  weekRange,
} from "@/core-v3/calendar-range";
import {
  calendarTime,
  isValidTime,
  msOfDay,
  normalizeTime,
} from "@/core-v3/calendar-time";
import { compileDateRules } from "@/core-v3/date-rule-engine";
import { buildMonthGrid } from "@/core-v3/month-grid";
import {
  commonPresets,
  compilePresets,
  type PresetResult,
  type PresetStatus,
} from "@/core-v3/preset-engine";
import type { SelectionMode } from "@/core-v3/selection-types";
import {
  fromCalendarDateTime,
  toCalendarDateTime,
  today,
} from "@/core-v3/timezone-boundary";

/**
 * v3 Core Lab — a living visual harness for the v3 rebuild.
 *
 * It renders the *current* state of the pure core as DOM so every micro-step is
 * visible. It grows block by block: today it shows CalendarDate facts and a raw
 * month strip; later phases add the week grid, then the real interactive
 * modules. This is a dev-only harness, not a shipped component.
 */

const card: React.CSSProperties = {
  border: "1px solid #d0d0d8",
  borderRadius: 10,
  padding: 16,
  font: "13px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace",
  display: "grid",
  gap: 12,
  maxWidth: 520,
};

const row: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
};

const tag = (ok: boolean): React.CSSProperties => ({
  padding: "1px 8px",
  borderRadius: 6,
  background: ok ? "#e6f6ea" : "#fbe7e7",
  color: ok ? "#137333" : "#b3261e",
  fontWeight: 600,
});

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label style={row}>
      <span style={{ width: 56, color: "#666" }}>{label}</span>
      <input
        type="number"
        value={Number.isNaN(value) ? "" : value}
        onChange={(e) => onChange(e.target.valueAsNumber)}
        style={{ width: 90, padding: "4px 6px" }}
      />
    </label>
  );
}

function CalendarDateBlock() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(6);
  const [day, setDay] = useState(5);

  const d = calendarDate(year, month, day);
  const valid = isValidDate(d);
  const dim =
    Number.isInteger(year) && month >= 1 && month <= 12
      ? daysInMonth(year, month)
      : Number.NaN;

  const apply = (next: CalendarDate) => {
    setYear(next.year);
    setMonth(next.month);
    setDay(next.day);
  };
  const step = (
    fn: (d: CalendarDate, n: number) => CalendarDate,
    n: number,
  ) => {
    if (valid) apply(fn(d, n));
  };

  return (
    <div style={card}>
      <strong>CalendarDate</strong>

      <Field label="year" value={year} onChange={setYear} />
      <Field label="month" value={month} onChange={setMonth} />
      <Field label="day" value={day} onChange={setDay} />

      <div style={{ ...row, flexWrap: "wrap" }}>
        {(
          [
            ["−1d", addDays, -1],
            ["+1d", addDays, 1],
            ["−1m", addMonths, -1],
            ["+1m", addMonths, 1],
            ["−1y", addYears, -1],
            ["+1y", addYears, 1],
          ] as const
        ).map(([label, fn, n]) => (
          <button
            key={label}
            type="button"
            disabled={!valid}
            onClick={() => step(fn, n)}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid #cdd",
              background: "#fafafe",
              cursor: valid ? "pointer" : "not-allowed",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={row}>
        <span style={tag(valid)}>{valid ? "valid" : "invalid"}</span>
        <span style={tag(isLeapYear(year))}>
          {isLeapYear(year) ? "leap year" : "common year"}
        </span>
      </div>

      <div>
        daysInMonth: <b>{Number.isNaN(dim) ? "—" : dim}</b>
        {"  ·  "}
        dateKey: <b>{valid ? dateKey(d) : "—"}</b>
      </div>

      {/* raw month strip — the first "DOM block" assembled from core output */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
        }}
      >
        {Array.from({ length: Number.isNaN(dim) ? 0 : dim }, (_, i) => {
          const n = i + 1;
          const isSel = valid && n === day;
          return (
            <div
              key={n}
              style={{
                textAlign: "center",
                padding: "6px 0",
                borderRadius: 6,
                background: isSel ? "#1a73e8" : "#f1f1f5",
                color: isSel ? "#fff" : "#333",
              }}
            >
              {n}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function pad(n: number, len = 2) {
  return String(n).padStart(len, "0");
}

function CalendarTimeBlock() {
  const [hour, setHour] = useState(14);
  const [minute, setMinute] = useState(30);
  const [second, setSecond] = useState(0);
  const [ms, setMs] = useState(0);
  const [carry, setCarry] = useState(0);

  const t = calendarTime(hour, minute, second, ms);
  const valid = isValidTime(t);

  const step = (deltaMs: number) => {
    const total = msOfDay(t) + deltaMs;
    const r = normalizeTime(calendarTime(0, 0, 0, total));
    setHour(r.time.hour);
    setMinute(r.time.minute);
    setSecond(r.time.second);
    setMs(r.time.ms);
    setCarry(r.dayOffset);
  };

  return (
    <div style={card}>
      <strong>CalendarTime</strong>

      <Field label="hour" value={hour} onChange={setHour} />
      <Field label="minute" value={minute} onChange={setMinute} />
      <Field label="second" value={second} onChange={setSecond} />
      <Field label="ms" value={ms} onChange={setMs} />

      <div style={{ ...row, flexWrap: "wrap" }}>
        {(
          [
            ["−1h", -3_600_000],
            ["+1h", 3_600_000],
            ["−15m", -900_000],
            ["+15m", 900_000],
            ["−1s", -1000],
            ["+1s", 1000],
          ] as const
        ).map(([label, delta]) => (
          <button
            key={label}
            type="button"
            disabled={!valid}
            onClick={() => step(delta)}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid #cdd",
              background: "#fafafe",
              cursor: valid ? "pointer" : "not-allowed",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={row}>
        <span style={tag(valid)}>{valid ? "valid" : "invalid"}</span>
        {carry !== 0 && (
          <span style={tag(false)}>
            rolled {carry > 0 ? "+" : ""}
            {carry} day
          </span>
        )}
      </div>

      <div style={{ fontSize: 22, letterSpacing: 1 }}>
        {valid
          ? `${pad(hour)}:${pad(minute)}:${pad(second)}.${pad(ms, 3)}`
          : "—"}
      </div>
      <div>
        msOfDay: <b>{valid ? msOfDay(t) : "—"}</b>
      </div>
    </div>
  );
}

// Distinct hues so each merged span reads as its own block in the strip.
const SPAN_HUES = ["#1a73e8", "#137333", "#b3261e", "#8430ce", "#b06000"];

function RangeBlock() {
  const year = 2026;
  const month = 6;
  const dim = daysInMonth(year, month);

  // Two raw spans (by day-of-month) the user can edit; merged into canonical form.
  const [aStart, setAStart] = useState(2);
  const [aEnd, setAEnd] = useState(8);
  const [bStart, setBStart] = useState(6);
  const [bEnd, setBEnd] = useState(14);

  const raw: CalendarRange[] = [
    orderRange(
      calendarDate(year, month, aStart),
      calendarDate(year, month, aEnd),
    ),
    orderRange(
      calendarDate(year, month, bStart),
      calendarDate(year, month, bEnd),
    ),
  ];
  const merged = mergeRanges(raw);

  return (
    <div style={card}>
      <strong>CalendarRange · membership + merge</strong>

      <div style={{ color: "#666" }}>span A (June)</div>
      <Field label="from" value={aStart} onChange={setAStart} />
      <Field label="to" value={aEnd} onChange={setAEnd} />
      <div style={{ color: "#666" }}>span B (June)</div>
      <Field label="from" value={bStart} onChange={setBStart} />
      <Field label="to" value={bEnd} onChange={setBEnd} />

      {/* month strip colored by merged-span membership via O(log R) binary search */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
        }}
      >
        {Array.from({ length: dim }, (_, i) => {
          const d = calendarDate(year, month, i + 1);
          const idx = rangeIndexOf(merged, d);
          const hue = idx === -1 ? null : SPAN_HUES[idx % SPAN_HUES.length];
          return (
            <div
              key={i + 1}
              style={{
                textAlign: "center",
                padding: "6px 0",
                borderRadius: 6,
                background: hue ?? "#f1f1f5",
                color: hue ? "#fff" : "#333",
              }}
            >
              {i + 1}
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gap: 4 }}>
        <span style={{ color: "#666" }}>
          merged into {merged.length} span(s):
        </span>
        {merged.map((r, i) => (
          <div key={dateKey(r.start)} style={row}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: SPAN_HUES[i % SPAN_HUES.length],
              }}
            />
            <span>
              {r.start.day}–{r.end.day} · {rangeLengthDays(r)} days
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const RANGE_HUE = "#1a73e8";
const PREVIEW_HUE = "#bcd4f7";

function radiusFor(role: "start" | "middle" | "end" | "single" | null): string {
  switch (role) {
    case "single":
      return "8px";
    case "start":
      return "8px 0 0 8px";
    case "end":
      return "0 8px 8px 0";
    case "middle":
      return "0";
    default:
      return "8px";
  }
}

function MonthGridBlock() {
  const [view, setView] = useState(calendarDate(2026, 6, 1));
  const [firstDayOfWeek, setFirstDayOfWeek] = useState(1);
  const [start, setStart] = useState<CalendarDate | null>(null);
  const [end, setEnd] = useState<CalendarDate | null>(null);
  const [hover, setHover] = useState<CalendarDate | null>(null);
  const [weekMode, setWeekMode] = useState(false);
  const [excludeWeekends, setExcludeWeekends] = useState(false);

  const grid = buildMonthGrid({
    year: view.year,
    month: view.month,
    firstDayOfWeek,
  });

  // Drop Sat/Sun from a span and merge survivors -> business-day segments.
  // This is the Lab stand-in for the future segmented-exclusion engine.
  const segmentize = (span: CalendarRange): CalendarRange[] => {
    if (!excludeWeekends) return mergeRanges([span]);
    const days: CalendarRange[] = [];
    for (let k = 0; k < rangeLengthDays(span); k++) {
      const d = addDays(span.start, k);
      const wd = weekdayOf(d);
      if (wd !== 0 && wd !== 6) days.push(orderRange(d, d));
    }
    return mergeRanges(days);
  };

  const committed = start && end ? segmentize(orderRange(start, end)) : [];
  const preview =
    start && !end ? segmentize(orderRange(start, hover ?? start)) : [];

  const clickDay = (d: CalendarDate) => {
    if (weekMode) {
      const w = weekRange(d, firstDayOfWeek);
      setStart(w.start);
      setEnd(w.end);
      return;
    }
    if (!start || (start && end)) {
      setStart(d);
      setEnd(null);
    } else {
      setEnd(d);
    }
  };

  return (
    <div style={{ ...card, maxWidth: 360 }}>
      <strong>Month grid · click two days to draw a range</strong>

      <div style={{ ...row, justifyContent: "space-between" }}>
        <button
          type="button"
          onClick={() => setView(addMonths(view, -1))}
          style={{ padding: "4px 12px" }}
        >
          ‹
        </button>
        <span>
          {MONTH_NAMES[view.month - 1]} {view.year}
        </span>
        <button
          type="button"
          onClick={() => setView(addMonths(view, 1))}
          style={{ padding: "4px 12px" }}
        >
          ›
        </button>
      </div>

      <label style={row}>
        <span style={{ color: "#666" }}>week starts</span>
        <select
          value={firstDayOfWeek}
          onChange={(e) => setFirstDayOfWeek(Number(e.target.value))}
        >
          {WEEKDAY_NAMES.map((name, i) => (
            <option key={name} value={i}>
              {name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setStart(null);
            setEnd(null);
          }}
        >
          reset
        </button>
      </label>

      <div style={{ ...row, flexWrap: "wrap" }}>
        <label style={row}>
          <input
            type="checkbox"
            checked={weekMode}
            onChange={(e) => {
              setWeekMode(e.target.checked);
              setStart(null);
              setEnd(null);
            }}
          />
          <span>week mode (click = whole week)</span>
        </label>
        <label style={row}>
          <input
            type="checkbox"
            checked={excludeWeekends}
            onChange={(e) => setExcludeWeekends(e.target.checked)}
          />
          <span>exclude weekends</span>
        </label>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "2px 0",
        }}
      >
        {grid.weekdayOrder.map((w) => (
          <div
            key={w}
            style={{ textAlign: "center", color: "#999", fontSize: 11 }}
          >
            {WEEKDAY_NAMES[w]}
          </div>
        ))}

        {grid.weeks.flat().map((cell) => {
          const cRole = rangeRole(committed, cell.date);
          const pRole = preview.length ? rangeRole(preview, cell.date) : null;
          const bg = cRole ? RANGE_HUE : pRole ? PREVIEW_HUE : "transparent";
          return (
            <button
              type="button"
              key={dateKey(cell.date)}
              onClick={() => clickDay(cell.date)}
              onMouseEnter={() => setHover(cell.date)}
              style={{
                appearance: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px 0",
                background: bg,
                borderRadius: radiusFor(cRole ?? pRole),
                color: cRole ? "#fff" : cell.inMonth ? "#222" : "#bbb",
                fontWeight: cRole ? 600 : 400,
                transition: "background 140ms ease, border-radius 140ms ease",
              }}
            >
              {cell.date.day}
            </button>
          );
        })}
      </div>

      <div style={{ color: "#666" }}>
        {start && end
          ? `range: ${start.day} → ${end.day} (${rangeLengthDays(orderRange(start, end))} days)`
          : start
            ? "pick the second day…"
            : "pick the first day"}
      </div>
    </div>
  );
}

const ZONES = [
  "UTC",
  "America/New_York",
  "Europe/Berlin",
  "Asia/Kolkata",
  "Asia/Tokyo",
];

function fmtWall(dt: CalendarDateTime): string {
  const { date: d, time: t } = dt;
  return `${d.year}-${pad(d.month)}-${pad(d.day)} ${pad(t.hour)}:${pad(t.minute)}`;
}

function resolveWall(
  dt: CalendarDateTime,
  opts: Parameters<typeof fromCalendarDateTime>[2],
) {
  const r = fromCalendarDateTime(dt, "America/New_York", opts);
  if (!r.ok) return "rejected (nonexistent)";
  const wall = toCalendarDateTime(r.date, "America/New_York");
  return `${fmtWall(wall)}${r.adjusted ? " ⟳ adjusted" : ""}`;
}

function TimeZoneBlock() {
  const now = new Date();
  const gap = calendarDateTime(calendarDate(2026, 3, 8), calendarTime(2, 30));
  const fold = calendarDateTime(calendarDate(2026, 11, 1), calendarTime(1, 30));

  return (
    <div style={{ ...card, maxWidth: 460 }}>
      <strong>Timezone boundary · today + now across zones</strong>

      <div style={{ display: "grid", gap: 4 }}>
        {ZONES.map((tz) => {
          const t = toCalendarDateTime(now, tz).time;
          return (
            <div key={tz} style={{ ...row, justifyContent: "space-between" }}>
              <span style={{ color: "#666" }}>{tz}</span>
              <span>{fmtWall({ date: today(tz), time: t })}</span>
            </div>
          );
        })}
      </div>

      <strong style={{ marginTop: 8 }}>
        DST gap — New York, 2026-03-08 02:30 (does not exist)
      </strong>
      <div style={{ display: "grid", gap: 2 }}>
        <div style={row}>
          <span style={{ width: 120, color: "#666" }}>next-valid</span>
          <span>{resolveWall(gap, { nonexistent: "next-valid" })}</span>
        </div>
        <div style={row}>
          <span style={{ width: 120, color: "#666" }}>previous-valid</span>
          <span>{resolveWall(gap, { nonexistent: "previous-valid" })}</span>
        </div>
        <div style={row}>
          <span style={{ width: 120, color: "#666" }}>reject</span>
          <span>{resolveWall(gap, { nonexistent: "reject" })}</span>
        </div>
      </div>

      <strong style={{ marginTop: 8 }}>
        DST fold — New York, 2026-11-01 01:30 (happens twice)
      </strong>
      <div style={{ display: "grid", gap: 2 }}>
        <div style={row}>
          <span style={{ width: 120, color: "#666" }}>earlier</span>
          <span>{resolveWall(fold, { ambiguous: "earlier" })}</span>
        </div>
        <div style={row}>
          <span style={{ width: 120, color: "#666" }}>later</span>
          <span>{resolveWall(fold, { ambiguous: "later" })}</span>
        </div>
      </div>
    </div>
  );
}

const REASON_LABEL: Record<string, string> = {
  all: "all",
  weekday: "weekday",
  date: "exact date",
  before: "before min",
  after: "after max",
  range: "in range",
  predicate: "Friday 13th",
};

function EngineBlock() {
  const year = 2026;
  const month = 6;
  const [weekends, setWeekends] = useState(true);
  const [before, setBefore] = useState(0); // day of June, 0 = none
  const [after, setAfter] = useState(0);
  const [fri13, setFri13] = useState(false);
  const [exact, setExact] = useState<number[]>([]); // day numbers

  const engine = compileDateRules({
    weekends,
    before: before ? calendarDate(year, month, before) : undefined,
    after: after ? calendarDate(year, month, after) : undefined,
    dates: exact.map((d) => calendarDate(year, month, d)),
    predicate: fri13 ? (d) => d.day === 13 && weekdayOf(d) === 5 : undefined,
  });

  const grid = buildMonthGrid({ year, month, firstDayOfWeek: 1 });

  const toggleExact = (day: number) =>
    setExact((prev) =>
      prev.includes(day) ? prev.filter((x) => x !== day) : [...prev, day],
    );

  return (
    <div style={{ ...card, maxWidth: 360 }}>
      <strong>disabled / exclude engine · matched days</strong>

      <div style={{ ...row, flexWrap: "wrap" }}>
        <label style={row}>
          <input
            type="checkbox"
            checked={weekends}
            onChange={(e) => setWeekends(e.target.checked)}
          />
          <span>weekends</span>
        </label>
        <label style={row}>
          <input
            type="checkbox"
            checked={fri13}
            onChange={(e) => setFri13(e.target.checked)}
          />
          <span>Friday 13th (predicate)</span>
        </label>
      </div>
      <Field label="before" value={before} onChange={setBefore} />
      <Field label="after" value={after} onChange={setAfter} />
      <div style={{ color: "#666", fontSize: 11 }}>
        click a day to toggle it as an exact-excluded date
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
        }}
      >
        {grid.weekdayOrder.map((w) => (
          <div
            key={w}
            style={{ textAlign: "center", color: "#999", fontSize: 11 }}
          >
            {WEEKDAY_NAMES[w]}
          </div>
        ))}
        {grid.weeks.flat().map((cell) => {
          const hit = engine.matches(cell.date);
          const reason = hit ? engine.getReason(cell.date) : null;
          return (
            <button
              type="button"
              key={dateKey(cell.date)}
              onClick={() => cell.inMonth && toggleExact(cell.date.day)}
              title={reason ? REASON_LABEL[reason] : undefined}
              style={{
                appearance: "none",
                border: "none",
                cursor: cell.inMonth ? "pointer" : "default",
                padding: "8px 0",
                borderRadius: 6,
                background: hit ? "#fbe7e7" : "transparent",
                color: hit ? "#b3261e" : cell.inMonth ? "#222" : "#bbb",
                textDecoration: hit ? "line-through" : "none",
              }}
            >
              {cell.date.day}
            </button>
          );
        })}
      </div>

      <div style={{ color: "#666" }}>
        isEmpty: <b>{String(engine.isEmpty)}</b>
        {"  ·  "}
        limits: <b>{engine.limits.min?.day ?? "—"}</b>..
        <b>{engine.limits.max?.day ?? "—"}</b>
      </div>
    </div>
  );
}

const STATUS_HUE: Record<PresetStatus, string> = {
  ok: "#137333",
  incompatible: "#999",
  disabled: "#b3261e",
  empty: "#b06000",
};

function describeResult(r: PresetResult | null): string {
  if (!r) return "—";
  if (r.kind === "date") return `${r.date.month}/${r.date.day}`;
  if (r.kind === "dates") return `${r.dates.length} dates`;
  return `${r.range.start.month}/${r.range.start.day} – ${r.range.end.month}/${r.range.end.day}`;
}

const ALL_MODES: SelectionMode[] = [
  "single",
  "multiple",
  "range",
  "multi-range",
];

function PresetBlock() {
  const [mode, setMode] = useState<SelectionMode>("range");
  const [blockToday, setBlockToday] = useState(false);

  const ctx = { today: today(), firstDayOfWeek: 1 };
  const engine = compilePresets(commonPresets);
  const rules = blockToday
    ? compileDateRules({ dates: [ctx.today] })
    : undefined;
  const evaluated = engine.evaluate(ctx, { mode, rules });

  return (
    <div style={{ ...card, maxWidth: 380 }}>
      <strong>Preset engine · status by mode (display filter only)</strong>

      <label style={row}>
        <span style={{ color: "#666" }}>mode</span>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as SelectionMode)}
        >
          {ALL_MODES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <label style={row}>
          <input
            type="checkbox"
            checked={blockToday}
            onChange={(e) => setBlockToday(e.target.checked)}
          />
          <span>disable today</span>
        </label>
      </label>

      <div style={{ display: "grid", gap: 4 }}>
        {evaluated.map(({ preset, result, status }) => (
          <div
            key={preset.id}
            style={{ ...row, justifyContent: "space-between" }}
          >
            <span style={{ opacity: status === "ok" ? 1 : 0.6 }}>
              {preset.label ?? preset.id}
            </span>
            <span style={{ color: "#999", fontSize: 11 }}>
              {describeResult(result)}
            </span>
            <span
              style={{
                ...tag(status === "ok"),
                background: "transparent",
                color: STATUS_HUE[status],
                fontWeight: 600,
              }}
            >
              {status}
            </span>
          </div>
        ))}
      </div>

      <div style={{ color: "#666", fontSize: 11 }}>
        presets resolve to candidate values; mode only filters what is offered —
        it never drives selection behavior.
      </div>
    </div>
  );
}

const meta: Meta<typeof CalendarDateBlock> = {
  title: "v3/Core Lab",
  component: CalendarDateBlock,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof CalendarDateBlock>;

/** Phase B · step 1 — CalendarDate primitives. */
export const CalendarDatePrimitives: Story = {};

/** Phase B · step 3 — CalendarTime primitives. */
export const CalendarTimePrimitives: Story = {
  render: () => <CalendarTimeBlock />,
};

/** Phase B · step 4 — CalendarRange membership + merge (heavy-path primitive). */
export const CalendarRangePrimitives: Story = {
  render: () => <RangeBlock />,
};

/** Phase B · step 5 — month grid + animation-ready range roles. */
export const MonthGridDraft: Story = {
  render: () => <MonthGridBlock />,
};

/** Phase B · step 7 — timezone boundary: today, now across zones, DST gap/fold. */
export const TimeZoneBoundary: Story = {
  render: () => <TimeZoneBlock />,
};

/** Phase C · step 1 — disabled/exclude rule engine over a month. */
export const RuleEngine: Story = {
  render: () => <EngineBlock />,
};

/** Phase C · step 2 — preset engine: mode-aware status + disabled validation. */
export const PresetEngine: Story = {
  render: () => <PresetBlock />,
};
