import { describe, expect, it } from "vitest";
import { calendarDate, dateKey } from "@/core-v3/calendar-date";
import { MIDNIGHT } from "@/core-v3/calendar-time";
import { compileDateRules } from "@/core-v3/date-rule-engine";
import { toSegments } from "@/core-v3/public-value";
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
function notifySpans(result: ReturnType<typeof reduce>) {
  const effect = result.effects.find((e) => e.type === "notify");
  return effect?.type === "notify" && effect.selection.shape === "span"
    ? effect.selection.ranges.map((r) => [dateKey(r.start), dateKey(r.end)])
    : [];
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

describe("disabled range crossing", () => {
  it("rejects a day range that steps over a disabled day, keeping the anchor", () => {
    const cfg = config("day", "range", {
      disabled: compileDateRules({ weekends: true }),
    });
    const s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) }, // Fri, valid anchor
      cfg,
    ).state;
    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 9) }, cfg); // crosses Sat/Sun
    expect((r.effects[0] as { result: { reason: string } }).result.reason).toBe(
      "range-crosses-disabled",
    );
    expect(spans(r.state)).toEqual([]);
    expect(anchor(r.state)).toEqual(D(2026, 6, 5)); // anchor kept
  });

  it("allows a day range with no disabled day inside", () => {
    const cfg = config("day", "range", {
      disabled: compileDateRules({ weekends: true }),
    });
    const s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 8) }, // Mon
      cfg,
    ).state;
    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 10) }, cfg); // Mon-Wed, clean
    expect(spans(r.state)).toEqual([[20260608, 20260610]]);
  });

  it("does NOT reject a week unit that contains disabled days (atomic)", () => {
    const cfg = config("week", "single", {
      disabled: compileDateRules({ weekends: true }),
    });
    const r = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 3) }, // Wed -> whole week Jun 1-7
      cfg,
    );
    expect(spans(r.state)).toEqual([[20260601, 20260607]]);
  });

  it("rejects a crossing span in multi-range too", () => {
    const cfg = config("day", "multi-range", {
      disabled: compileDateRules({ weekends: true }),
    });
    const s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 9) }, cfg);
    expect((r.effects[0] as { result: { reason: string } }).result.reason).toBe(
      "range-crosses-disabled",
    );
    expect(spans(r.state)).toEqual([]);
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

describe("range time", () => {
  it("rejects malformed time edits", () => {
    const cfg = config("day", "range", { withTime: true });
    let s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    s = reduce(s, { type: "selectDay", date: D(2026, 6, 9) }, cfg).state;
    const r = reduce(
      s,
      { type: "setTime", time: { ...MIDNIGHT, hour: 24 } },
      cfg,
    );
    expect(r.state).toBe(s);
    expect((r.effects[0] as { result: { reason: string } }).result.reason).toBe(
      "malformed-input",
    );
  });

  it("same-day range rejects from-time after to-time", () => {
    const cfg = config("day", "range", { withTime: true });
    // Same-day range: 2026-06-05 .. 2026-06-05.
    let s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    s = reduce(s, { type: "selectDay", date: D(2026, 6, 5) }, cfg).state;
    // to-time 09:00 first…
    s = reduce(
      s,
      { type: "setTime", time: { ...MIDNIGHT, hour: 9 }, bound: "to" },
      cfg,
    ).state;
    // …then from-time 18:00 — would end before it starts.
    const r = reduce(
      s,
      { type: "setTime", time: { ...MIDNIGHT, hour: 18 }, bound: "from" },
      cfg,
    );
    expect(r.state).toBe(s);
    expect((r.effects[0] as { result: { reason: string } }).result.reason).toBe(
      "time-out-of-order",
    );
  });

  it("cross-day range allows any from/to times", () => {
    const cfg = config("day", "range", { withTime: true });
    let s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    s = reduce(s, { type: "selectDay", date: D(2026, 6, 9) }, cfg).state;
    s = reduce(
      s,
      { type: "setTime", time: { ...MIDNIGHT, hour: 9 }, bound: "to" },
      cfg,
    ).state;
    const r = reduce(
      s,
      { type: "setTime", time: { ...MIDNIGHT, hour: 18 }, bound: "from" },
      cfg,
    );
    expect(r.effects[0].type).toBe("notify");
    expect(
      r.state.selection.shape === "span" && r.state.selection.fromTime?.hour,
    ).toBe(18);
  });
});

describe("multi-range", () => {
  it("creates several spans with two-click commits", () => {
    const cfg = config("day", "multi-range");
    let s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    let r = reduce(s, { type: "selectDay", date: D(2026, 6, 7) }, cfg);
    expect(spans(r.state)).toEqual([[20260605, 20260607]]);
    expect(anchor(r.state)).toBeUndefined();

    s = reduce(r.state, { type: "selectDay", date: D(2026, 6, 15) }, cfg).state;
    r = reduce(s, { type: "selectDay", date: D(2026, 6, 18) }, cfg);
    expect(spans(r.state)).toEqual([
      [20260605, 20260607],
      [20260615, 20260618],
    ]);
  });

  it("merges adjacent or overlapping spans deterministically", () => {
    const cfg = config("day", "multi-range");
    let s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    s = reduce(s, { type: "selectDay", date: D(2026, 6, 7) }, cfg).state;
    s = reduce(s, { type: "selectDay", date: D(2026, 6, 8) }, cfg).state;
    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 10) }, cfg);
    expect(spans(r.state)).toEqual([[20260605, 20260610]]);
  });

  it("rejects adding past maxRanges and keeps the pending anchor", () => {
    const cfg = config("day", "multi-range", { maxRanges: 1 });
    let s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    s = reduce(s, { type: "selectDay", date: D(2026, 6, 7) }, cfg).state;
    s = reduce(s, { type: "selectDay", date: D(2026, 6, 15) }, cfg).state;
    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 18) }, cfg);
    expect(spans(r.state)).toEqual([[20260605, 20260607]]);
    expect((r.effects[0] as { result: { reason: string } }).result.reason).toBe(
      "max-ranges-reached",
    );
    expect(anchor(r.state)).toEqual(D(2026, 6, 15));
  });

  it("removeRange drops a span by index", () => {
    const cfg = config("day", "multi-range");
    let s = reduce(
      start(cfg),
      {
        type: "applyPreset",
        result: {
          kind: "range",
          range: { start: D(2026, 6, 5), end: D(2026, 6, 7) },
        },
      },
      cfg,
    ).state;
    s = reduce(
      s,
      {
        type: "applyPreset",
        result: {
          kind: "range",
          range: { start: D(2026, 6, 15), end: D(2026, 6, 18) },
        },
      },
      cfg,
    ).state;
    const r = reduce(s, { type: "removeRange", index: 0 }, cfg);
    expect(spans(r.state)).toEqual([[20260615, 20260618]]);
  });

  it("clicking inside a span splits it on the clicked day", () => {
    const cfg = config("day", "multi-range");
    let s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    s = reduce(s, { type: "selectDay", date: D(2026, 6, 10) }, cfg).state;
    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 7) }, cfg);
    expect(spans(r.state)).toEqual([
      [20260605, 20260606],
      [20260608, 20260610],
    ]);
    expect(r.effects[0].type).toBe("notify");
  });

  it("clicking an edge day trims the span", () => {
    const cfg = config("day", "multi-range");
    let s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    s = reduce(s, { type: "selectDay", date: D(2026, 6, 10) }, cfg).state;
    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 5) }, cfg);
    expect(spans(r.state)).toEqual([[20260606, 20260610]]);
  });

  it("clicking a single-day span removes it entirely", () => {
    const cfg = config("day", "multi-range");
    let s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    s = reduce(s, { type: "selectDay", date: D(2026, 6, 5) }, cfg).state;
    expect(spans(s)).toEqual([[20260605, 20260605]]);
    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 5) }, cfg);
    expect(spans(r.state)).toEqual([]);
  });

  it("removes a day that became disabled after the span was committed", () => {
    // Span built with no disabled rule (a crossing span can't be created once
    // a day inside it is disabled).
    const cleanCfg = config("day", "multi-range");
    const s = reduce(
      start(cleanCfg),
      {
        type: "applyPreset",
        result: {
          kind: "range",
          range: { start: D(2026, 6, 5), end: D(2026, 6, 10) },
        },
      },
      cleanCfg,
    ).state;
    // Config now disables Jun 7 (e.g. controlled prop change). Clicking it still
    // removes it — removal runs before disabled/min-max validation.
    const disabledCfg = config("day", "multi-range", {
      disabled: compileDateRules({ dates: [D(2026, 6, 7)] }),
    });
    const r = reduce(
      s,
      { type: "selectDay", date: D(2026, 6, 7) },
      disabledCfg,
    );
    expect(spans(r.state)).toEqual([
      [20260605, 20260606],
      [20260608, 20260610],
    ]);
  });

  it("week multi-range removes a clicked week from a multi-week span", () => {
    const cfg = config("week", "multi-range");
    let s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 1) },
      cfg,
    ).state;
    s = reduce(s, { type: "selectDay", date: D(2026, 6, 21) }, cfg).state;
    expect(spans(s)).toEqual([[20260601, 20260621]]); // 3 weeks
    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 10) }, cfg); // middle week Jun 8-14
    expect(spans(r.state)).toEqual([
      [20260601, 20260607],
      [20260615, 20260621],
    ]);
  });
});

describe("week/month multiple", () => {
  it("toggles whole weeks in multiple mode", () => {
    const cfg = config("week", "multiple");
    let r = reduce(start(cfg), { type: "selectDay", date: D(2026, 6, 5) }, cfg);
    expect(spans(r.state)).toEqual([[20260601, 20260607]]);
    r = reduce(r.state, { type: "selectDay", date: D(2026, 6, 3) }, cfg);
    expect(spans(r.state)).toEqual([]);
  });

  it("toggles whole months in multiple mode", () => {
    const cfg = config("month", "multiple");
    const r = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 15) },
      cfg,
    );
    expect(spans(r.state)).toEqual([[20260601, 20260630]]);
  });
});

describe("segmented exclusion", () => {
  it("notify carries logical span; toSegments derives segments", () => {
    const cfg = config("day", "range", {
      exclude: compileDateRules({ weekends: true }),
    });
    const s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) }, // Fri
      cfg,
    ).state;
    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 9) }, cfg); // Tue

    // §2d: state holds logical span
    expect(spans(r.state)).toEqual([[20260605, 20260609]]);
    // §2d: notify payload = same logical span (not segmented)
    expect(notifySpans(r)).toEqual([[20260605, 20260609]]);
    // segments derived separately via toSegments
    const segs = toSegments(r.state.selection, cfg);
    const localKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const segKeys = segs?.map((seg) => [
      localKey(seg.start),
      localKey(seg.end),
    ]);
    expect(segKeys).toEqual([
      ["2026-06-05", "2026-06-05"],
      ["2026-06-08", "2026-06-09"],
    ]);
  });

  it("rejects when every day is excluded", () => {
    const cfg = config("day", "range", {
      exclude: compileDateRules({ all: true }),
    });
    const s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) },
      cfg,
    ).state;
    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 6) }, cfg);

    expect(spans(r.state)).toEqual([]);
    expect(anchor(r.state)).toEqual(D(2026, 6, 5));
    expect((r.effects[0] as { result: { reason: string } }).result.reason).toBe(
      "empty-after-exclude",
    );
  });

  it("rejects excluded endpoints when endpoint policy is reject", () => {
    const cfg = config("day", "range", {
      excludedEndpointPolicy: "reject",
      exclude: compileDateRules({ weekends: true }),
    });
    const s = reduce(
      start(cfg),
      { type: "selectDay", date: D(2026, 6, 5) }, // Fri
      cfg,
    ).state;
    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 6) }, cfg); // Sat

    expect(spans(r.state)).toEqual([]);
    expect(anchor(r.state)).toEqual(D(2026, 6, 5));
    expect((r.effects[0] as { result: { reason: string } }).result.reason).toBe(
      "empty-after-exclude",
    );
  });
});

describe("setBoundDate (span bound date edit)", () => {
  const drawn = (cfg: CalendarConfig) => {
    let s = start(cfg);
    s = reduce(s, { type: "selectDay", date: D(2026, 6, 10) }, cfg).state;
    s = reduce(s, { type: "selectDay", date: D(2026, 6, 15) }, cfg).state;
    return s;
  };

  it("moves the from-bound keeping the end", () => {
    const cfg = config("day", "range");
    const r = reduce(
      drawn(cfg),
      { type: "setBoundDate", date: D(2026, 6, 8), bound: "from" },
      cfg,
    );
    expect(spans(r.state)).toEqual([
      [dateKey(D(2026, 6, 8)), dateKey(D(2026, 6, 15))],
    ]);
  });

  it("moves the to-bound keeping the start", () => {
    const cfg = config("day", "range");
    const r = reduce(
      drawn(cfg),
      { type: "setBoundDate", date: D(2026, 6, 20), bound: "to" },
      cfg,
    );
    expect(spans(r.state)).toEqual([
      [dateKey(D(2026, 6, 10)), dateKey(D(2026, 6, 20))],
    ]);
  });

  it("rejects an inverted result instead of swapping", () => {
    const cfg = config("day", "range");
    const r = reduce(
      drawn(cfg),
      { type: "setBoundDate", date: D(2026, 6, 20), bound: "from" },
      cfg,
    );
    expect(spans(r.state)).toEqual([
      [dateKey(D(2026, 6, 10)), dateKey(D(2026, 6, 15))],
    ]);
    expect((r.effects[0] as { result: { reason: string } }).result.reason).toBe(
      "range-out-of-order",
    );
  });

  it("rejects a disabled bound date", () => {
    const cfg = config("day", "range", {
      disabled: compileDateRules({ dates: [D(2026, 6, 8)] }),
    });
    const r = reduce(
      drawn(cfg),
      { type: "setBoundDate", date: D(2026, 6, 8), bound: "from" },
      cfg,
    );
    expect((r.effects[0] as { result: { reason: string } }).result.reason).toBe(
      "disabled",
    );
  });

  it("no-ops without a committed range", () => {
    const cfg = config("day", "range");
    const s0 = start(cfg);
    const r = reduce(
      s0,
      { type: "setBoundDate", date: D(2026, 6, 8), bound: "from" },
      cfg,
    );
    expect(r.state).toBe(s0);
  });
});

describe("range start-over (single-range click on complete range)", () => {
  it("click with a complete range clears it and arms the new anchor", () => {
    const cfg = config("day", "range");
    let s = start(cfg);
    s = reduce(s, { type: "selectDay", date: D(2026, 6, 10) }, cfg).state;
    s = reduce(s, { type: "selectDay", date: D(2026, 6, 15) }, cfg).state;

    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 20) }, cfg);
    expect(spans(r.state)).toEqual([]);
    expect(anchor(r.state)).toEqual(D(2026, 6, 20));
    // Old range cleared with a notify so controlled hosts see null.
    expect(notifySpans(r)).toEqual([]);
  });

  it("the following click commits the fresh range", () => {
    const cfg = config("day", "range");
    let s = start(cfg);
    s = reduce(s, { type: "selectDay", date: D(2026, 6, 10) }, cfg).state;
    s = reduce(s, { type: "selectDay", date: D(2026, 6, 15) }, cfg).state;
    s = reduce(s, { type: "selectDay", date: D(2026, 6, 20) }, cfg).state;
    const r = reduce(s, { type: "selectDay", date: D(2026, 6, 22) }, cfg);
    expect(spans(r.state)).toEqual([
      [dateKey(D(2026, 6, 20)), dateKey(D(2026, 6, 22))],
    ]);
  });
});
