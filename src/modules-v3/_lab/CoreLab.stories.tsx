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
} from "@/core-v3/calendar-date";

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

const meta: Meta<typeof CalendarDateBlock> = {
  title: "v3/Core Lab",
  component: CalendarDateBlock,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof CalendarDateBlock>;

/** Phase B · step 1 — CalendarDate primitives. */
export const CalendarDatePrimitives: Story = {};
