import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState, useSyncExternalStore } from "react";
import { dateKey } from "@/core-v3/calendar-date";
import { MIDNIGHT } from "@/core-v3/calendar-time";
import { compileDateRules } from "@/core-v3/date-rule-engine";
import {
  buildDayLookup,
  buildPreviewSegments,
  DayFlag,
  dayFlags,
} from "@/core-v3/day-flags";
import { buildMonthGrid } from "@/core-v3/month-grid";
import { toPublicValue } from "@/core-v3/public-value";
import type { SelectionMode, SelectionUnit } from "@/core-v3/selection-types";
import { type CalendarConfig, createInitialState } from "@/core-v3/state";
import { today } from "@/core-v3/timezone-boundary";
import type { ValidationReason } from "@/core-v3/validation";
import { createCalendarStore } from "@/react-v3/store";

/**
 * v3 Core Lab — one universal harness for the whole core + adapter.
 *
 * A real interactive calendar wired to the framework-agnostic store: pick any
 * `unit × mode`, draw selections, and watch the public value (what `onChange`
 * would emit) and rejected actions update live. Day cells are styled straight
 * from the packed `dayFlags` bitmask — the same hot path the shipped Days
 * module will use. Dev-only; not a published component.
 */

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

const UNITS: SelectionUnit[] = ["day", "week", "month"];
const MODES: SelectionMode[] = ["single", "multiple", "range", "multi-range"];

const ACCENT = "#1a73e8";
const PREVIEW = "#bcd4f7";

type Options = {
  unit: SelectionUnit;
  mode: SelectionMode;
  firstDayOfWeek: number;
  disableWeekends: boolean;
  excludeWeekends: boolean;
  withTime: boolean;
};

function buildConfig(o: Options): CalendarConfig {
  return {
    unit: o.unit,
    mode: o.mode,
    firstDayOfWeek: o.firstDayOfWeek,
    readOnly: false,
    withTime: o.withTime,
    defaultTime: MIDNIGHT,
    excludedEndpointPolicy: "snap-inward",
    disabled: o.disableWeekends
      ? compileDateRules({ weekends: true })
      : compileDateRules(),
    exclude: o.excludeWeekends
      ? compileDateRules({ weekends: true })
      : compileDateRules(),
  };
}

const card: React.CSSProperties = {
  border: "1px solid #d0d0d8",
  borderRadius: 12,
  padding: 16,
  font: "13px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace",
  display: "grid",
  gap: 14,
  maxWidth: 420,
};
const row: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  flexWrap: "wrap",
};
const labelCol = { color: "#666", width: 96 } as React.CSSProperties;

/** Per-cell visual style derived entirely from the packed bitmask. */
function cellStyle(f: number): React.CSSProperties {
  const inRange = (f & DayFlag.InRange) !== 0;
  const selected = (f & DayFlag.Selected) !== 0;
  const preview = (f & DayFlag.Preview) !== 0;
  const disabled = (f & DayFlag.Disabled) !== 0;
  const excluded = (f & DayFlag.Excluded) !== 0;
  const today = (f & DayFlag.Today) !== 0;
  const weekend = (f & DayFlag.Weekend) !== 0;
  const outOfMonth = (f & DayFlag.OutOfMonth) !== 0;

  // Edge-aware corner rounding for ranges and previews.
  const edgeRadius = (start: boolean, end: boolean) =>
    start && end ? "8px" : start ? "8px 0 0 8px" : end ? "0 8px 8px 0" : "0";

  let background = "transparent";
  let radius = "8px";
  if (inRange) {
    background = ACCENT;
    radius = edgeRadius(
      (f & DayFlag.RangeStart) !== 0,
      (f & DayFlag.RangeEnd) !== 0,
    );
  } else if (preview) {
    background = PREVIEW;
    radius = edgeRadius(
      (f & DayFlag.PreviewStart) !== 0,
      (f & DayFlag.PreviewEnd) !== 0,
    );
  } else if (selected) {
    background = ACCENT;
  }

  const onAccent = inRange || (selected && !preview);
  return {
    appearance: "none",
    border: today ? "2px solid #b06000" : "2px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    padding: "8px 0",
    background:
      background === "transparent" && weekend ? "#f6f6fa" : background,
    borderRadius: radius,
    color: disabled
      ? "#ccc"
      : onAccent
        ? "#fff"
        : excluded
          ? "#b06000"
          : outOfMonth
            ? "#bbb"
            : "#222",
    textDecoration: excluded ? "line-through" : "none",
    fontWeight: onAccent ? 600 : 400,
    opacity: disabled ? 0.6 : 1,
    transition: "background 120ms ease, border-radius 120ms ease",
  };
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function describeValue(v: unknown): string {
  if (v === null) return "null";
  if (v instanceof Date) return fmtDate(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    return v
      .map((x) =>
        x instanceof Date
          ? fmtDate(x)
          : `${fmtDate((x as { start: Date }).start)} → ${fmtDate((x as { end: Date }).end)}`,
      )
      .join(", ");
  }
  const r = v as { start: Date; end: Date };
  return `${fmtDate(r.start)} → ${fmtDate(r.end)}`;
}

function Playground() {
  const [opts, setOpts] = useState<Options>({
    unit: "day",
    mode: "range",
    firstDayOfWeek: 1,
    disableWeekends: false,
    excludeWeekends: false,
    withTime: false,
  });
  const [rejections, setRejections] = useState<ValidationReason[]>([]);

  const config = useMemo(() => buildConfig(opts), [opts]);

  // A fresh store whenever the config changes (mode/unit/options switch).
  const store = useMemo(
    () =>
      createCalendarStore(
        config,
        createInitialState(config, { view: today(config.timeZone) }),
        (effect) => {
          if (effect.type === "validationRejected" && !effect.result.ok) {
            const { reason } = effect.result;
            setRejections((prev) => [reason, ...prev].slice(0, 6));
          }
        },
      ),
    [config],
  );

  const state = useSyncExternalStore(store.subscribe, store.getState);

  const view = state.view.viewDate;
  const grid = useMemo(
    () =>
      buildMonthGrid({
        year: view.year,
        month: view.month,
        firstDayOfWeek: config.firstDayOfWeek,
      }),
    [view.year, view.month, config.firstDayOfWeek],
  );

  // Selection digest: rebuilt only when the selection changes (rare). Pass
  // exclude so the grid dribbles into the same segments the value emits.
  const lookup = useMemo(
    () => buildDayLookup(state.selection, config),
    [state.selection, config],
  );
  // Preview segments: rebuilt on hover, once per move (handed to every cell),
  // split by exclude so the preview shows the same holes as the committed span.
  const preview = useMemo(
    () =>
      buildPreviewSegments(
        state.selection,
        config,
        state.interaction.hoverDate,
      ),
    [state.selection, config, state.interaction.hoverDate],
  );
  const todayDate = useMemo(() => today(config.timeZone), [config.timeZone]);

  const value = toPublicValue(state.selection, config);

  const set = <K extends keyof Options>(key: K, v: Options[K]) => {
    setOpts((p) => ({ ...p, [key]: v }));
    setRejections([]);
  };

  return (
    <div style={{ ...card, maxWidth: 460 }}>
      <strong>
        Calendar · {opts.unit} × {opts.mode}
      </strong>

      <div style={row}>
        <label style={row}>
          <span style={labelCol}>unit</span>
          <select
            value={opts.unit}
            onChange={(e) => set("unit", e.target.value as SelectionUnit)}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
        <label style={row}>
          <span style={labelCol}>mode</span>
          <select
            value={opts.mode}
            onChange={(e) => set("mode", e.target.value as SelectionMode)}
          >
            {MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={row}>
        <label style={row}>
          <span style={labelCol}>week starts</span>
          <select
            value={opts.firstDayOfWeek}
            onChange={(e) => set("firstDayOfWeek", Number(e.target.value))}
          >
            {WEEKDAY_NAMES.map((name, i) => (
              <option key={name} value={i}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={row}>
        <label style={row}>
          <input
            type="checkbox"
            checked={opts.disableWeekends}
            onChange={(e) => set("disableWeekends", e.target.checked)}
          />
          <span>disable weekends</span>
        </label>
        <label style={row}>
          <input
            type="checkbox"
            checked={opts.excludeWeekends}
            onChange={(e) => set("excludeWeekends", e.target.checked)}
          />
          <span>exclude weekends</span>
        </label>
        <label style={row}>
          <input
            type="checkbox"
            checked={opts.withTime}
            onChange={(e) => set("withTime", e.target.checked)}
          />
          <span>with time</span>
        </label>
      </div>

      <div style={{ ...row, justifyContent: "space-between" }}>
        <button
          type="button"
          onClick={() =>
            store.dispatch({ type: "navigateBy", step: "month", amount: -1 })
          }
          style={{ padding: "4px 12px" }}
        >
          ‹
        </button>
        <span>
          {MONTH_NAMES[view.month - 1]} {view.year}
        </span>
        <button
          type="button"
          onClick={() =>
            store.dispatch({ type: "navigateBy", step: "month", amount: 1 })
          }
          style={{ padding: "4px 12px" }}
        >
          ›
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "2px 0",
        }}
        onMouseLeave={() => store.dispatch({ type: "hover", date: undefined })}
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
          const f = dayFlags(
            cell.date,
            lookup,
            config,
            preview,
            todayDate,
            cell.inMonth,
          );
          return (
            <button
              type="button"
              key={dateKey(cell.date)}
              onClick={() =>
                store.dispatch({ type: "selectDay", date: cell.date })
              }
              onMouseEnter={() =>
                store.dispatch({ type: "hover", date: cell.date })
              }
              style={cellStyle(f)}
            >
              {cell.date.day}
            </button>
          );
        })}
      </div>

      <div style={{ ...row, justifyContent: "space-between" }}>
        <button type="button" onClick={() => store.dispatch({ type: "clear" })}>
          clear
        </button>
      </div>

      <div style={{ display: "grid", gap: 4 }}>
        <span style={{ color: "#666" }}>public value (onChange):</span>
        <code
          style={{ background: "#f1f1f5", padding: "6px 8px", borderRadius: 6 }}
        >
          {describeValue(value)}
        </code>
      </div>

      {rejections.length > 0 && (
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ color: "#666" }}>rejected:</span>
          <div style={row}>
            {rejections.map((r, i) => (
              <span
                key={`${r}-${i}`}
                style={{
                  padding: "1px 8px",
                  borderRadius: 6,
                  background: "#fbe7e7",
                  color: "#b3261e",
                }}
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const meta: Meta<typeof Playground> = {
  title: "v3/Core Lab",
  component: Playground,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof Playground>;

/** The one universal harness — every unit × mode, live public value + rejections. */
export const Calendar: Story = {};
