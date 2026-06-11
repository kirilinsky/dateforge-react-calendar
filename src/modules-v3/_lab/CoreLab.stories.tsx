import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState } from "react";
import { MIDNIGHT } from "@/core-v3/calendar-time";
import { compileDateRules } from "@/core-v3/date-rule-engine";
import type {
  AnyCalendarValue,
  CalendarChangeDetails,
  PublicRange,
} from "@/core-v3/public-value";
import type { SelectionMode, SelectionUnit } from "@/core-v3/selection-types";
import type { CalendarConfig } from "@/core-v3/state";
import { today } from "@/core-v3/timezone-boundary";
import type { ValidationReason } from "@/core-v3/validation";
import { CalendarDays } from "@/modules-v3/days/CalendarDays";
import {
  CalendarToolbar,
  CalendarToolbarGroup,
  CalendarToolbarHome,
  CalendarToolbarLabel,
  CalendarToolbarNext,
  CalendarToolbarPrev,
} from "@/modules-v3/toolbar/CalendarToolbar";
import { Calendar as CalendarRoot } from "@/react-v3/calendar";

/**
 * v3 Core Lab — one universal harness running the real modules.
 *
 * `CalendarProvider` + `CalendarDays` on the v3 core: pick any `unit × mode`,
 * draw selections, and watch the public value (`onChange`) and rejected actions
 * update live. Cells are styled purely through the `data-*` attributes the Days
 * module emits — the same escape hatch consumers get. Dev-only.
 */

const UNITS: SelectionUnit[] = ["day", "week", "month"];
const MODES: SelectionMode[] = ["single", "multiple", "range", "multi-range"];
const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const THEMES = ["noir", "meadow", "crimson", "ocean"];
const SCHEMES = ["auto", "light", "dark"] as const;

type Options = {
  unit: SelectionUnit;
  mode: SelectionMode;
  firstDayOfWeek: number;
  disableWeekends: boolean;
  excludeWeekends: boolean;
  withTime: boolean;
  theme: string;
  scheme: (typeof SCHEMES)[number];
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
  maxWidth: 460,
};
const row: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  flexWrap: "wrap",
};
const labelCol = { color: "#666", width: 96 } as React.CSSProperties;

function Toolbar() {
  return (
    <CalendarToolbar>
      <CalendarToolbarGroup>
        <CalendarToolbarPrev />
        <CalendarToolbarHome />
      </CalendarToolbarGroup>
      <CalendarToolbarLabel />
      <CalendarToolbarNext />
    </CalendarToolbar>
  );
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function describeSegments(segs: PublicRange[]): string {
  if (segs.length === 0) return "[] (fully cut)";
  return segs.map((s) => `${fmtDate(s.start)} → ${fmtDate(s.end)}`).join(", ");
}

function describeValue(v: AnyCalendarValue): string {
  if (v === null) return "null";
  if (v instanceof Date) return fmtDate(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    return v
      .map((x) =>
        x instanceof Date
          ? fmtDate(x)
          : `${fmtDate(x.start)} → ${fmtDate(x.end)}`,
      )
      .join(", ");
  }
  return `${fmtDate(v.start)} → ${fmtDate(v.end)}`;
}

function Playground() {
  const [opts, setOpts] = useState<Options>({
    unit: "day",
    mode: "range",
    firstDayOfWeek: 1,
    disableWeekends: false,
    excludeWeekends: false,
    withTime: false,
    theme: "noir",
    scheme: "auto",
  });
  const [value, setValue] = useState<AnyCalendarValue>(null);
  const [details, setDetails] = useState<CalendarChangeDetails | null>(null);
  const [rejections, setRejections] = useState<ValidationReason[]>([]);

  const config = useMemo(() => buildConfig(opts), [opts]);
  // Only config-affecting options remount the provider; theme/scheme are purely
  // visual and must not reset the selection.
  const configKey = JSON.stringify({
    unit: opts.unit,
    mode: opts.mode,
    firstDayOfWeek: opts.firstDayOfWeek,
    disableWeekends: opts.disableWeekends,
    excludeWeekends: opts.excludeWeekends,
    withTime: opts.withTime,
  });

  const set = <K extends keyof Options>(key: K, v: Options[K]) => {
    setOpts((p) => ({ ...p, [key]: v }));
    // Theme/scheme don't change config — keep the current value visible.
    if (key !== "theme" && key !== "scheme") {
      setValue(null);
      setDetails(null);
      setRejections([]);
    }
  };

  return (
    <div style={{ ...card, width: "100%", maxWidth: 960 }}>
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
      </div>

      <div style={row}>
        <label style={row}>
          <span style={labelCol}>theme</span>
          <select
            value={opts.theme}
            onChange={(e) => set("theme", e.target.value)}
          >
            {THEMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label style={row}>
          <span style={labelCol}>scheme</span>
          <select
            value={opts.scheme}
            onChange={(e) => set("scheme", e.target.value as Options["scheme"])}
          >
            {SCHEMES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <CalendarRoot
        key={configKey}
        config={config}
        initialView={today(config.timeZone)}
        theme={opts.theme}
        scheme={opts.scheme}
        onChange={(v, d) => {
          setValue(v);
          setDetails(d);
        }}
        onValidationReject={(r) => {
          if (!r.ok) setRejections((prev) => [r.reason, ...prev].slice(0, 6));
        }}
      >
        <Toolbar />
        <CalendarDays />
      </CalendarRoot>

      <div style={{ display: "grid", gap: 4 }}>
        <span style={{ color: "#666" }}>
          public value (logical spans) · reason: {details?.reason ?? "—"}
        </span>
        <code
          style={{ background: "#f1f1f5", padding: "6px 8px", borderRadius: 6 }}
        >
          {describeValue(value)}
        </code>
      </div>

      {details?.segments && (
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ color: "#666" }}>
            details.segments (business-day cut):
          </span>
          <code
            style={{
              background: "#eef6ee",
              padding: "6px 8px",
              borderRadius: 6,
            }}
          >
            {describeSegments(details.segments)}
          </code>
        </div>
      )}

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

/** The one universal harness — real modules, every unit × mode, live value. */
export const Calendar: Story = {};
