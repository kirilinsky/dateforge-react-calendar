import { describe, expect, it } from "vitest";
import { calendarDate } from "@/core/calendar-date";
import { calendarDateTime } from "@/core/calendar-date-time";
import { calendarTime, MIDNIGHT } from "@/core/calendar-time";
import { compileDateRules } from "@/core/date-rule-engine";
import { reduce } from "@/core/reducer";
import { type CalendarConfig, createInitialState } from "@/core/state";

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

  it("rejects malformed dates before committing", () => {
    const cfg = config();
    const s = start(cfg);
    const r = reduce(s, { type: "selectDay", date: D(2026, 13, 1) }, cfg);
    expect(r.state).toBe(s);
    expect((r.effects[0] as { result: { reason: string } }).result.reason).toBe(
      "malformed-input",
    );
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

  it("clamps an out-of-window default time onto a newly picked day", () => {
    // defaultTime 06:00 is below the 09:00 floor → the picked day commits 09:00,
    // not an un-nudgeable out-of-window value.
    const below = config({
      withTime: true,
      defaultTime: calendarTime(6, 0),
      minTime: calendarTime(9, 0),
      maxTime: calendarTime(17, 0),
    });
    expect(
      points(
        reduce(start(below), { type: "selectDay", date: D(2026, 6, 5) }, below)
          .state,
      )[0].time,
    ).toEqual(calendarTime(9, 0));

    // 20:00 default above the 17:00 ceiling → clamps down to 17:00.
    const above = config({
      withTime: true,
      defaultTime: calendarTime(20, 0),
      minTime: calendarTime(9, 0),
      maxTime: calendarTime(17, 0),
    });
    expect(
      points(
        reduce(start(above), { type: "selectDay", date: D(2026, 6, 5) }, above)
          .state,
      )[0].time,
    ).toEqual(calendarTime(17, 0));
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

  it("setTime without a selection auto-creates one on the view anchor (time-only flow)", () => {
    const cfg = config({ withTime: true });
    const s = start(cfg);
    const r = reduce(s, { type: "setTime", time: calendarTime(10, 0) }, cfg);
    expect(r.state.selection).toEqual({
      shape: "point",
      dates: [{ date: r.state.view.viewDate, time: calendarTime(10, 0) }],
    });
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

  it("rejects a time outside the [minTime, maxTime] window", () => {
    const cfg = config({
      withTime: true,
      minTime: calendarTime(9, 0),
      maxTime: calendarTime(17, 0),
    });
    const s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    const reason = (r: ReturnType<typeof reduce>) =>
      (r.effects[0] as { result: { reason: string } }).result.reason;

    const tooEarly = reduce(
      s,
      { type: "setTime", time: calendarTime(8, 30) },
      cfg,
    );
    expect(tooEarly.state).toBe(s);
    expect(reason(tooEarly)).toBe("time-before-min");

    const tooLate = reduce(
      s,
      { type: "setTime", time: calendarTime(17, 1) },
      cfg,
    );
    expect(tooLate.state).toBe(s);
    expect(reason(tooLate)).toBe("time-after-max");

    // Inclusive bounds + an interior time commit.
    expect(
      reduce(s, { type: "setTime", time: calendarTime(9, 0) }, cfg).state,
    ).not.toBe(s);
    expect(
      reduce(s, { type: "setTime", time: calendarTime(17, 0) }, cfg).state,
    ).not.toBe(s);
    const ok = reduce(s, { type: "setTime", time: calendarTime(12, 0) }, cfg);
    expect(points(ok.state)[0].time).toEqual(calendarTime(12, 0));
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
