import { describe, expect, it } from "vitest";
import { calendarDate, dateKey } from "@/core-v3/calendar-date";
import { MIDNIGHT } from "@/core-v3/calendar-time";
import { compileDateRules } from "@/core-v3/date-rule-engine";
import { reduce } from "@/core-v3/reducer";
import { type CalendarConfig, createInitialState } from "@/core-v3/state";

const D = (y: number, m: number, d: number) => calendarDate(y, m, d);

function config(over: Partial<CalendarConfig> = {}): CalendarConfig {
  return {
    unit: "day",
    mode: "multiple",
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

function days(state: ReturnType<typeof start>) {
  return state.selection.shape === "point"
    ? state.selection.dates.map((d) => dateKey(d.date))
    : [];
}

describe("add / toggle", () => {
  it("adds days kept sorted by day", () => {
    const cfg = config();
    let s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 9) },
      cfg,
    ).state;
    s = reduce(s, { type: "selectDay", date: D(2026, 6, 3) }, cfg).state;
    s = reduce(s, { type: "selectDay", date: D(2026, 6, 5) }, cfg).state;
    expect(days(s)).toEqual([20260603, 20260605, 20260609]);
  });

  it("clicking a selected day removes it", () => {
    const cfg = config();
    let s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    s = reduce(s, { type: "selectDay", date: D(2026, 6, 9) }, cfg).state;
    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 5) }, cfg);
    expect(days(r.state)).toEqual([20260609]);
    expect(r.effects[0].type).toBe("notify");
  });
});

describe("maxDates", () => {
  it("rejects adding past the cap but still allows removal", () => {
    const cfg = config({ maxDates: 2 });
    let s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 1) },
      cfg,
    ).state;
    s = reduce(s, { type: "selectDay", date: D(2026, 6, 2) }, cfg).state;
    const blocked = reduce(s, { type: "selectDay", date: D(2026, 6, 3) }, cfg);
    expect(blocked.state).toBe(s);
    expect(
      (blocked.effects[0] as { result: { reason: string } }).result.reason,
    ).toBe("max-dates-reached");
    // removing one still works at the cap
    const removed = reduce(s, { type: "selectDay", date: D(2026, 6, 1) }, cfg);
    expect(days(removed.state)).toEqual([20260602]);
  });
});

describe("invariants", () => {
  it("rejects a disabled day on add", () => {
    const cfg = config({
      disabled: compileDateRules({ dates: [D(2026, 6, 5)] }),
    });
    const s = start(cfg);
    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 5) }, cfg);
    expect(r.state).toBe(s);
    expect((r.effects[0] as { result: { reason: string } }).result.reason).toBe(
      "disabled",
    );
  });

  it("can still remove a day that became disabled after selection", () => {
    const open = config();
    const s = reduce(
      start(open),
      { type: "selectDay", date: D(2026, 6, 5) },
      open,
    ).state;
    const locked = config({
      disabled: compileDateRules({ dates: [D(2026, 6, 5)] }),
    });
    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 5) }, locked);
    expect(days(r.state)).toEqual([]);
  });
});

describe("removeDate / clear", () => {
  it("removeDate drops a present day and no-ops otherwise", () => {
    const cfg = config();
    const s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    expect(
      days(reduce(s, { type: "removeDate", date: D(2026, 6, 5) }, cfg).state),
    ).toEqual([]);
    expect(
      reduce(s, { type: "removeDate", date: D(2026, 6, 9) }, cfg).state,
    ).toBe(s);
  });

  it("clear empties the set", () => {
    const cfg = config();
    let s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    s = reduce(s, { type: "selectDay", date: D(2026, 6, 9) }, cfg).state;
    expect(days(reduce(s, { type: "clear" }, cfg).state)).toEqual([]);
  });
});

describe("applyPreset", () => {
  it("a dates preset sets a validated, capped, deduped set", () => {
    const cfg = config({
      maxDates: 2,
      disabled: compileDateRules({ dates: [D(2026, 6, 2)] }),
    });
    const r = reduce(
      start(cfg),
      {
        type: "applyPreset",
        result: {
          kind: "dates",
          dates: [D(2026, 6, 3), D(2026, 6, 2), D(2026, 6, 3), D(2026, 6, 1)],
        },
      },
      cfg,
    );
    // 6/2 disabled -> dropped, dup 6/3 -> once, cap 2 -> [6/1, 6/3]
    expect(days(r.state)).toEqual([20260601, 20260603]);
  });

  it("a single-date preset adds one day", () => {
    const cfg = config();
    const r = reduce(
      start(cfg),
      { type: "applyPreset", result: { kind: "date", date: D(2026, 6, 5) } },
      cfg,
    );
    expect(days(r.state)).toEqual([20260605]);
  });
});
