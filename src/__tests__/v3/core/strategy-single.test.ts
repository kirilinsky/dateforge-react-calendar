import { describe, expect, it } from "vitest";
import { calendarDate } from "@/core-v3/calendar-date";
import { calendarDateTime } from "@/core-v3/calendar-date-time";
import { calendarTime, MIDNIGHT } from "@/core-v3/calendar-time";
import { compileDateRules } from "@/core-v3/date-rule-engine";
import { reduce } from "@/core-v3/reducer";
import { type CalendarConfig, createInitialState } from "@/core-v3/state";

const D = (y: number, m: number, d: number) => calendarDate(y, m, d);

function config(over: Partial<CalendarConfig> = {}): CalendarConfig {
  return {
    unit: "day",
    mode: "single",
    firstDayOfWeek: 1,
    readOnly: false,
    withTime: false,
    defaultTime: MIDNIGHT,
    excludedEndpointPolicy: "snap-inward",
    disabled: compileDateRules(),
    exclude: compileDateRules(),
    ...over,
  };
}

const start = (cfg: CalendarConfig) =>
  createInitialState(cfg, { view: D(2026, 6, 1) });

function points(state: ReturnType<typeof start>) {
  return state.selection.shape === "point" ? state.selection.dates : [];
}

describe("selectDay", () => {
  it("commits a day and emits notify", () => {
    const cfg = config();
    const r = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    );
    expect(points(r.state)).toEqual([
      calendarDateTime(D(2026, 6, 5), MIDNIGHT),
    ]);
    expect(r.effects[0].type).toBe("notify");
  });

  it("replaces the previous day", () => {
    const cfg = config();
    let s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    s = reduce(s, { type: "selectDay", date: D(2026, 6, 9) }, cfg).state;
    expect(points(s)).toEqual([calendarDateTime(D(2026, 6, 9), MIDNIGHT)]);
  });
});

describe("re-click toggle", () => {
  it("deselects on re-click by default", () => {
    const cfg = config();
    const s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 5) }, cfg);
    expect(points(r.state)).toEqual([]);
    expect(r.effects[0].type).toBe("notify");
  });

  it("keeps the selection when deselectOnReclick is false", () => {
    const cfg = config({ deselectOnReclick: false });
    const s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 5) }, cfg);
    expect(points(r.state)).toEqual([
      calendarDateTime(D(2026, 6, 5), MIDNIGHT),
    ]);
  });
});

describe("invariants", () => {
  it("a disabled day no-ops with validationRejected", () => {
    const cfg = config({
      disabled: compileDateRules({ dates: [D(2026, 6, 5)] }),
    });
    const s = start(cfg);
    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 5) }, cfg);
    expect(r.state).toBe(s);
    expect(r.effects).toEqual([
      { type: "validationRejected", result: { ok: false, reason: "disabled" } },
    ]);
  });

  it("rejects before min and after max", () => {
    const cfg = config({ min: D(2026, 6, 10), max: D(2026, 6, 20) });
    const before = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 9) },
      cfg,
    );
    const after = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 21) },
      cfg,
    );
    expect(
      (before.effects[0] as { result: { reason: string } }).result.reason,
    ).toBe("before-min");
    expect(
      (after.effects[0] as { result: { reason: string } }).result.reason,
    ).toBe("after-max");
  });
});

describe("time", () => {
  it("applies the default time when withTime", () => {
    const cfg = config({ withTime: true, defaultTime: calendarTime(9, 0) });
    const r = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    );
    expect(points(r.state)[0].time).toEqual(calendarTime(9, 0));
  });

  it("carries the chosen time onto a newly picked day", () => {
    const cfg = config({ withTime: true });
    let s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    s = reduce(s, { type: "setTime", time: calendarTime(14, 30) }, cfg).state;
    s = reduce(s, { type: "selectDay", date: D(2026, 6, 9) }, cfg).state;
    expect(points(s)[0]).toEqual(
      calendarDateTime(D(2026, 6, 9), calendarTime(14, 30)),
    );
  });

  it("setTime is a no-op without a selection", () => {
    const cfg = config({ withTime: true });
    const s = start(cfg);
    const r = reduce(s, { type: "setTime", time: calendarTime(10, 0) }, cfg);
    expect(r.state).toBe(s);
  });

  it("rejects malformed time edits", () => {
    const cfg = config({ withTime: true });
    const s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    const r = reduce(s, { type: "setTime", time: calendarTime(25, 0) }, cfg);
    expect(r.state).toBe(s);
    expect((r.effects[0] as { result: { reason: string } }).result.reason).toBe(
      "malformed-input",
    );
  });
});

describe("clear / preset", () => {
  it("clear empties a selection and notifies, no-ops when already empty", () => {
    const cfg = config();
    const empty = start(cfg);
    expect(reduce(empty, { type: "clear" }, cfg).state).toBe(empty);
    const s = reduce(
      empty,
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    const r = reduce(s, { type: "clear" }, cfg);
    expect(points(r.state)).toEqual([]);
    expect(r.effects[0].type).toBe("notify");
  });

  it("applyPreset accepts a date preset and ignores a range preset", () => {
    const cfg = config();
    const ok = reduce(
      start(cfg),
      { type: "applyPreset", result: { kind: "date", date: D(2026, 6, 5) } },
      cfg,
    );
    expect(points(ok.state)).toHaveLength(1);

    const ignored = reduce(
      start(cfg),
      {
        type: "applyPreset",
        result: {
          kind: "range",
          range: { start: D(2026, 6, 1), end: D(2026, 6, 7) },
        },
      },
      cfg,
    );
    expect(points(ignored.state)).toEqual([]);
  });
});
