import { describe, expect, it } from "vitest";
import { calendarDate } from "@/core/calendar-date";
import { MIDNIGHT } from "@/core/calendar-time";
import { compileDateRules } from "@/core/date-rule-engine";
import {
  fromPublicValue,
  type PublicRange,
  toPublicValue,
  toSegments,
  valueKey,
} from "@/core/public-value";
import type { SelectionMode, SelectionUnit } from "@/core/selection-types";
import type {
  CalendarConfig,
  PointSelection,
  SpanSelection,
} from "@/core/state";

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

const point = (
  ...dates: { d: ReturnType<typeof D>; t?: typeof MIDNIGHT }[]
): PointSelection => ({
  shape: "point",
  dates: dates.map(({ d, t }) => ({ date: d, time: t ?? MIDNIGHT })),
});

const span = (
  ranges: [ReturnType<typeof D>, ReturnType<typeof D>][],
  times?: { from?: typeof MIDNIGHT; to?: typeof MIDNIGHT },
): SpanSelection => ({
  shape: "span",
  ranges: ranges.map(([start, end]) => ({ start, end })),
  fromTime: times?.from,
  toTime: times?.to,
});

// All conversions use the system zone (timeZone omitted): a midnight wall clock
// maps to local midnight, so assertions compare against local Date builders.
const localMidnight = (y: number, m: number, d: number) =>
  new Date(y, m - 1, d).getTime();

describe("toPublicValue · point shapes", () => {
  it("single returns the lone Date", () => {
    const cfg = config("day", "single");
    const v = toPublicValue(point({ d: D(2026, 6, 5) }), cfg);
    expect(v).toBeInstanceOf(Date);
    expect((v as Date).getTime()).toBe(localMidnight(2026, 6, 5));
  });

  it("single returns null when empty", () => {
    const cfg = config("day", "single");
    expect(toPublicValue(point(), cfg)).toBeNull();
  });

  it("multiple returns an array preserving order", () => {
    const cfg = config("day", "multiple");
    const v = toPublicValue(
      point({ d: D(2026, 6, 5) }, { d: D(2026, 6, 9) }),
      cfg,
    ) as Date[];
    expect(v).toHaveLength(2);
    expect(v[0].getTime()).toBe(localMidnight(2026, 6, 5));
    expect(v[1].getTime()).toBe(localMidnight(2026, 6, 9));
  });

  it("multiple returns [] when empty", () => {
    const cfg = config("day", "multiple");
    expect(toPublicValue(point(), cfg)).toEqual([]);
  });
});

describe("toPublicValue · span shapes", () => {
  it("range returns a single {start,end} or null", () => {
    const cfg = config("day", "range");
    const v = toPublicValue(
      span([[D(2026, 6, 5), D(2026, 6, 9)]]),
      cfg,
    ) as PublicRange;
    expect(v.start.getTime()).toBe(localMidnight(2026, 6, 5));
    expect(v.end.getTime()).toBe(localMidnight(2026, 6, 9));
    expect(toPublicValue(span([]), cfg)).toBeNull();
  });

  it("week single also yields a range (span shape)", () => {
    const cfg = config("week", "single");
    const v = toPublicValue(
      span([[D(2026, 6, 1), D(2026, 6, 7)]]),
      cfg,
    ) as PublicRange;
    expect(v.start.getTime()).toBe(localMidnight(2026, 6, 1));
    expect(v.end.getTime()).toBe(localMidnight(2026, 6, 7));
  });

  it("multi-range returns an array of ranges", () => {
    const cfg = config("day", "multi-range");
    const v = toPublicValue(
      span([
        [D(2026, 6, 5), D(2026, 6, 7)],
        [D(2026, 6, 15), D(2026, 6, 18)],
      ]),
      cfg,
    ) as PublicRange[];
    expect(v).toHaveLength(2);
    expect(v[0].start.getTime()).toBe(localMidnight(2026, 6, 5));
    expect(v[1].end.getTime()).toBe(localMidnight(2026, 6, 18));
  });

  it("month multiple returns an array of ranges", () => {
    const cfg = config("month", "multiple");
    const v = toPublicValue(
      span([[D(2026, 6, 1), D(2026, 6, 30)]]),
      cfg,
    ) as PublicRange[];
    expect(v).toHaveLength(1);
    expect(v[0].start.getTime()).toBe(localMidnight(2026, 6, 1));
  });
});

// §2d: `value` always carries the LOGICAL span; `exclude`/`disabled` never
// reshape it. The segmented business-day view comes from `toSegments`.
describe("toPublicValue · value is always the logical span (§2d)", () => {
  it("range without exclude stays a single {start,end}", () => {
    const cfg = config("day", "range");
    const v = toPublicValue(span([[D(2026, 6, 5), D(2026, 6, 9)]]), cfg);
    expect(Array.isArray(v)).toBe(false);
    expect((v as PublicRange).start.getTime()).toBe(localMidnight(2026, 6, 5));
  });

  it("range WITH exclude still emits the whole logical span as value", () => {
    const cfg = config("day", "range", {
      exclude: compileDateRules({ weekends: true }),
    });
    // Jun 5 Fri .. Jun 9 Tue; weekend inside, but value is the full span.
    const v = toPublicValue(span([[D(2026, 6, 5), D(2026, 6, 9)]]), cfg);
    expect(Array.isArray(v)).toBe(false);
    const r = v as PublicRange;
    expect(r.start.getTime()).toBe(localMidnight(2026, 6, 5));
    expect(r.end.getTime()).toBe(localMidnight(2026, 6, 9));
  });

  it("week unit with disabled days still emits the whole week as value", () => {
    const cfg = config("week", "single", {
      disabled: compileDateRules({ weekends: true }),
    });
    const v = toPublicValue(span([[D(2026, 6, 1), D(2026, 6, 7)]]), cfg);
    expect(Array.isArray(v)).toBe(false);
    const r = v as PublicRange;
    expect(r.start.getTime()).toBe(localMidnight(2026, 6, 1));
    expect(r.end.getTime()).toBe(localMidnight(2026, 6, 7));
  });

  it("multi-range emits the logical spans, not the segments", () => {
    const cfg = config("day", "multi-range", {
      exclude: compileDateRules({ weekends: true }),
    });
    const v = toPublicValue(
      span([
        [D(2026, 6, 5), D(2026, 6, 9)],
        [D(2026, 6, 15), D(2026, 6, 15)],
      ]),
      cfg,
    ) as PublicRange[];
    expect(v).toHaveLength(2);
    expect(v[0].start.getTime()).toBe(localMidnight(2026, 6, 5));
    expect(v[0].end.getTime()).toBe(localMidnight(2026, 6, 9));
  });
});

describe("toSegments · derived business-day view (§2d)", () => {
  it("returns undefined when neither exclude nor disabled is set", () => {
    const cfg = config("day", "range");
    expect(
      toSegments(span([[D(2026, 6, 5), D(2026, 6, 9)]]), cfg),
    ).toBeUndefined();
  });

  it("returns undefined for point shapes", () => {
    const cfg = config("day", "single");
    expect(toSegments(point({ d: D(2026, 6, 5) }), cfg)).toBeUndefined();
  });

  it("splits a span into business-day segments", () => {
    const cfg = config("day", "range", {
      exclude: compileDateRules({ weekends: true }),
    });
    // Jun 5 Fri .. Jun 9 Tue; Jun 6-7 weekend -> [5..5], [8..9]
    const segs = toSegments(span([[D(2026, 6, 5), D(2026, 6, 9)]]), cfg);
    expect(segs).toHaveLength(2);
    if (!segs) throw new Error("segments");
    expect(segs[0].start.getTime()).toBe(localMidnight(2026, 6, 5));
    expect(segs[0].end.getTime()).toBe(localMidnight(2026, 6, 5));
    expect(segs[1].start.getTime()).toBe(localMidnight(2026, 6, 8));
    expect(segs[1].end.getTime()).toBe(localMidnight(2026, 6, 9));
  });

  it("yields a single segment when nothing inside is cut", () => {
    const cfg = config("day", "range", {
      exclude: compileDateRules({ weekends: true }),
    });
    const segs = toSegments(span([[D(2026, 6, 8), D(2026, 6, 10)]]), cfg);
    expect(segs).toHaveLength(1);
  });

  it("yields an empty array when the whole span is cut", () => {
    const cfg = config("day", "range", {
      exclude: compileDateRules({ weekends: true }),
    });
    // Jun 6-7 both weekend -> nothing survives
    expect(toSegments(span([[D(2026, 6, 6), D(2026, 6, 7)]]), cfg)).toEqual([]);
  });

  it("cuts disabled days from a week unit (Mon..Fri segment)", () => {
    const cfg = config("week", "single", {
      disabled: compileDateRules({ weekends: true }),
    });
    const segs = toSegments(span([[D(2026, 6, 1), D(2026, 6, 7)]]), cfg);
    expect(segs).toHaveLength(1);
    if (!segs) throw new Error("segments");
    expect(segs[0].start.getTime()).toBe(localMidnight(2026, 6, 1));
    expect(segs[0].end.getTime()).toBe(localMidnight(2026, 6, 5));
  });

  it("flattens segments across all spans (multi-range)", () => {
    const cfg = config("day", "multi-range", {
      exclude: compileDateRules({ weekends: true }),
    });
    const segs = toSegments(
      span([
        [D(2026, 6, 5), D(2026, 6, 9)], // -> [5], [8,9]
        [D(2026, 6, 15), D(2026, 6, 15)], // Mon -> [15]
      ]),
      cfg,
    );
    expect(segs).toHaveLength(3);
    if (!segs) throw new Error("segments");
    expect(segs[2].start.getTime()).toBe(localMidnight(2026, 6, 15));
  });
});

describe("toPublicValue · time bounds", () => {
  it("applies fromTime/toTime to the range endpoints", () => {
    const cfg = config("day", "range", { withTime: true });
    const v = toPublicValue(
      span([[D(2026, 6, 5), D(2026, 6, 9)]], {
        from: { hour: 9, minute: 30, second: 0, ms: 0 },
        to: { hour: 17, minute: 0, second: 0, ms: 0 },
      }),
      cfg,
    ) as PublicRange;
    expect(v.start.getTime()).toBe(new Date(2026, 5, 5, 9, 30).getTime());
    expect(v.end.getTime()).toBe(new Date(2026, 5, 9, 17, 0).getTime());
  });
});

describe("fromPublicValue", () => {
  const jsDate = (y: number, m: number, d: number, h = 0, min = 0) =>
    new Date(y, m - 1, d, h, min);

  it("parses a single Date into a point selection", () => {
    const cfg = config("day", "single");
    const sel = fromPublicValue(jsDate(2026, 6, 5), cfg);
    expect(sel.shape).toBe("point");
    if (sel.shape !== "point") throw new Error("point");
    expect(sel.dates).toHaveLength(1);
    expect(sel.dates[0].date).toEqual(D(2026, 6, 5));
  });

  it("parses null/[] into empty selections", () => {
    expect(fromPublicValue(null, config("day", "single"))).toEqual({
      shape: "point",
      dates: [],
    });
    expect(fromPublicValue([], config("day", "multiple"))).toEqual({
      shape: "point",
      dates: [],
    });
    expect(fromPublicValue(null, config("day", "range"))).toMatchObject({
      shape: "span",
      ranges: [],
    });
  });

  it("parses a lone range and an array of ranges", () => {
    const single = fromPublicValue(
      { start: jsDate(2026, 6, 5), end: jsDate(2026, 6, 9) },
      config("day", "range"),
    );
    expect(single).toMatchObject({
      shape: "span",
      ranges: [{ start: D(2026, 6, 5), end: D(2026, 6, 9) }],
    });

    const multi = fromPublicValue(
      [
        { start: jsDate(2026, 6, 5), end: jsDate(2026, 6, 7) },
        { start: jsDate(2026, 6, 15), end: jsDate(2026, 6, 18) },
      ],
      config("day", "multi-range"),
    );
    if (multi.shape !== "span") throw new Error("span");
    expect(multi.ranges).toHaveLength(2);
  });

  it("recovers time bounds when withTime", () => {
    const sel = fromPublicValue(
      { start: jsDate(2026, 6, 5, 9, 30), end: jsDate(2026, 6, 9, 17, 0) },
      config("day", "range", { withTime: true }),
    );
    if (sel.shape !== "span") throw new Error("span");
    expect(sel.fromTime).toMatchObject({ hour: 9, minute: 30 });
    expect(sel.toTime).toMatchObject({ hour: 17, minute: 0 });
  });

  it("round-trips a point/multiple selection without exclusion", () => {
    const cfg = config("day", "multiple");
    const original = point({ d: D(2026, 6, 5) }, { d: D(2026, 6, 9) });
    const back = fromPublicValue(toPublicValue(original, cfg), cfg);
    expect(back).toEqual(original);
  });

  it("round-trips a range selection without exclusion", () => {
    const cfg = config("day", "range");
    const original = span([[D(2026, 6, 5), D(2026, 6, 9)]]);
    const back = fromPublicValue(toPublicValue(original, cfg), cfg);
    if (back.shape !== "span") throw new Error("span");
    expect(back.ranges).toEqual([{ start: D(2026, 6, 5), end: D(2026, 6, 9) }]);
  });
});

describe("valueKey · controlled identity (§2d)", () => {
  it("ignores time-of-day for a time-less composition", () => {
    const cfg = config("day", "single"); // withTime: false
    // Same calendar day, different wall-clock time -> same key.
    const a = valueKey(new Date(2026, 5, 5, 9, 30), cfg);
    const b = valueKey(new Date(2026, 5, 5, 23, 0), cfg);
    expect(a).toBe(b);
    expect(a).toBe("2026-06-05");
  });

  it("includes time when the composition edits time", () => {
    const cfg = config("day", "single", { withTime: true });
    const a = valueKey(new Date(2026, 5, 5, 9, 30), cfg);
    const b = valueKey(new Date(2026, 5, 5, 23, 0), cfg);
    expect(a).not.toBe(b);
    expect(a).toBe("2026-06-05T09:30:00.000");
  });

  it("is stable across a DST spring-forward transition (US, time-less)", () => {
    // America/New_York springs forward 2026-03-08 02:00 -> 03:00.
    const cfg = config("day", "range", { timeZone: "America/New_York" });
    // A range spanning the DST day; identity must be by calendar day, not by
    // raw getTime() (the two instants are NOT 24h apart across the gap).
    const original = span([[D(2026, 3, 7), D(2026, 3, 9)]]);
    const v = toPublicValue(original, cfg);
    expect(valueKey(v, cfg)).toBe("2026-03-07..2026-03-09");
    // Re-emitting the same selection yields the identical key (no sync loop).
    expect(valueKey(toPublicValue(fromPublicValue(v, cfg), cfg), cfg)).toBe(
      valueKey(v, cfg),
    );
  });

  it("keys by the calendar zone, not the host zone", () => {
    // A UTC instant that is still 2026-06-05 in a far-east zone but already
    // 2026-06-04 in a far-west one — the key must follow config.timeZone.
    const instant = new Date(Date.UTC(2026, 5, 5, 2, 0)); // 02:00Z Jun 5
    const tokyo = valueKey(
      instant,
      config("day", "single", { timeZone: "Asia/Tokyo" }),
    );
    const la = valueKey(
      instant,
      config("day", "single", { timeZone: "America/Los_Angeles" }),
    );
    expect(tokyo).toBe("2026-06-05"); // 11:00 Jun 5 in Tokyo
    expect(la).toBe("2026-06-04"); // 19:00 Jun 4 in LA
  });

  it("re-emitting an equal value produces the same key (no loop)", () => {
    const cfg = config("day", "multiple");
    const v1 = toPublicValue(
      point({ d: D(2026, 6, 5) }, { d: D(2026, 6, 9) }),
      cfg,
    );
    const v2 = toPublicValue(fromPublicValue(v1, cfg), cfg);
    expect(valueKey(v2, cfg)).toBe(valueKey(v1, cfg));
  });

  it("normalizes array order: [b, a] keys equal [a, b]", () => {
    const cfg = config("day", "multiple");
    const ab = valueKey([new Date(2026, 5, 5), new Date(2026, 5, 9)], cfg);
    const ba = valueKey([new Date(2026, 5, 9), new Date(2026, 5, 5)], cfg);
    expect(ba).toBe(ab);
  });

  it("empty/null keys are stable", () => {
    const cfg = config("day", "single");
    expect(valueKey(null, cfg)).toBe("");
    expect(valueKey([], config("day", "multiple"))).toBe("");
  });
});
