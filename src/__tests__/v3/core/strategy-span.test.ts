import { describe, expect, it } from "vitest";
import { calendarDate, dateKey } from "@/core-v3/calendar-date";
import { MIDNIGHT } from "@/core-v3/calendar-time";
import { compileDateRules } from "@/core-v3/date-rule-engine";
import { reduce } from "@/core-v3/reducer";
import type { SelectionMode, SelectionUnit } from "@/core-v3/selection-types";
import { type CalendarConfig, createInitialState } from "@/core-v3/state";

const D = (y: number, m: number, d: number) => calendarDate(y, m, d);

function config(
  unit: SelectionUnit,
  mode: SelectionMode,
  over: Partial<CalendarConfig> = {},
): CalendarConfig {
  return {
    unit,
    mode,
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

function spans(state: ReturnType<typeof start>) {
  return state.selection.shape === "span"
    ? state.selection.ranges.map((r) => [dateKey(r.start), dateKey(r.end)])
    : [];
}
function anchor(state: ReturnType<typeof start>) {
  return state.selection.shape === "span"
    ? state.selection.draftAnchor
    : undefined;
}

describe("single span (week / month · single)", () => {
  it("commits the whole week in one click", () => {
    const cfg = config("week", "single"); // 2026-06-05 is Friday
    const r = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    );
    expect(spans(r.state)).toEqual([[20260601, 20260607]]); // Mon-start week
    expect(r.effects[0].type).toBe("notify");
  });

  it("toggles the week off when clicking inside it again", () => {
    const cfg = config("week", "single");
    const s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 3) }, cfg); // same week
    expect(spans(r.state)).toEqual([]);
  });

  it("switches to a different week", () => {
    const cfg = config("week", "single");
    const s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 18) }, cfg);
    expect(spans(r.state)).toEqual([[20260615, 20260621]]);
  });

  it("month single commits the whole month", () => {
    const cfg = config("month", "single");
    const r = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 15) },
      cfg,
    );
    expect(spans(r.state)).toEqual([[20260601, 20260630]]);
  });
});

describe("range (day · range)", () => {
  it("first click arms the anchor with no notify", () => {
    const cfg = config("day", "range");
    const r = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    );
    expect(spans(r.state)).toEqual([]);
    expect(anchor(r.state)).toEqual(D(2026, 6, 5));
    expect(r.effects).toHaveLength(0);
  });

  it("second click commits the span and clears the anchor", () => {
    const cfg = config("day", "range");
    const s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 9) }, cfg);
    expect(spans(r.state)).toEqual([[20260605, 20260609]]);
    expect(anchor(r.state)).toBeUndefined();
    expect(r.effects[0].type).toBe("notify");
  });

  it("handles reverse selection", () => {
    const cfg = config("day", "range");
    const s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 9) },
      cfg,
    ).state;
    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 5) }, cfg);
    expect(spans(r.state)).toEqual([[20260605, 20260609]]);
  });
});

describe("range span limits (minSpan / maxSpan in units)", () => {
  it("rejects too-short and keeps the anchor", () => {
    const cfg = config("day", "range", { minSpan: 3 });
    const s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 6) }, cfg); // length 2
    expect((r.effects[0] as { result: { reason: string } }).result.reason).toBe(
      "range-too-short",
    );
    expect(anchor(r.state)).toEqual(D(2026, 6, 5));
  });

  it("rejects too-long", () => {
    const cfg = config("day", "range", { maxSpan: 3 });
    const s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 10) }, cfg); // length 6
    expect((r.effects[0] as { result: { reason: string } }).result.reason).toBe(
      "range-too-long",
    );
  });
});

describe("range (week · range) snaps endpoints to whole weeks", () => {
  it("covers both weeks fully", () => {
    const cfg = config("week", "range");
    const s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 18) }, cfg);
    // week of Jun 5 = Jun 1-7; week of Jun 18 = Jun 15-21 -> outer Jun 1-21
    expect(spans(r.state)).toEqual([[20260601, 20260621]]);
  });
});

describe("disabled endpoints", () => {
  it("rejects a disabled day before arming or committing", () => {
    const cfg = config("day", "range", {
      disabled: compileDateRules({ dates: [D(2026, 6, 5)] }),
    });
    const r = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    );
    expect((r.effects[0] as { result: { reason: string } }).result.reason).toBe(
      "disabled",
    );
    expect(anchor(r.state)).toBeUndefined();
  });
});

describe("clear", () => {
  it("drops a lone anchor without notifying", () => {
    const cfg = config("day", "range");
    const s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    const r = reduce(s, { type: "clear" }, cfg);
    expect(anchor(r.state)).toBeUndefined();
    expect(r.effects).toHaveLength(0);
  });

  it("empties a committed range with a notify", () => {
    const cfg = config("day", "range");
    let s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    s = reduce(s, { type: "selectDay", date: D(2026, 6, 9) }, cfg).state;
    const r = reduce(s, { type: "clear" }, cfg);
    expect(spans(r.state)).toEqual([]);
    expect(r.effects[0].type).toBe("notify");
  });
});
