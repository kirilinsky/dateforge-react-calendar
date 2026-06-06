import { describe, expect, it } from "vitest";
import { calendarDate } from "@/core-v3/calendar-date";
import { MIDNIGHT } from "@/core-v3/calendar-time";
import { compileDateRules } from "@/core-v3/date-rule-engine";
import { type PublicRange, toPublicValue } from "@/core-v3/public-value";
import type { SelectionMode, SelectionUnit } from "@/core-v3/selection-types";
import type {
  CalendarConfig,
  PointSelection,
  SpanSelection,
} from "@/core-v3/state";

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

describe("toPublicValue · exclude segmentation", () => {
  it("range without exclude stays a single {start,end}", () => {
    const cfg = config("day", "range");
    const v = toPublicValue(span([[D(2026, 6, 5), D(2026, 6, 9)]]), cfg);
    expect(Array.isArray(v)).toBe(false);
    expect((v as PublicRange).start.getTime()).toBe(localMidnight(2026, 6, 5));
  });

  it("range with exclude splits into business-day segments (array)", () => {
    const cfg = config("day", "range", {
      exclude: compileDateRules({ weekends: true }),
    });
    // Jun 5 Fri .. Jun 9 Tue; Jun 6-7 are weekend -> [5..5], [8..9]
    const v = toPublicValue(span([[D(2026, 6, 5), D(2026, 6, 9)]]), cfg);
    expect(Array.isArray(v)).toBe(true);
    const segs = v as PublicRange[];
    expect(segs).toHaveLength(2);
    expect(segs[0].start.getTime()).toBe(localMidnight(2026, 6, 5));
    expect(segs[0].end.getTime()).toBe(localMidnight(2026, 6, 5));
    expect(segs[1].start.getTime()).toBe(localMidnight(2026, 6, 8));
    expect(segs[1].end.getTime()).toBe(localMidnight(2026, 6, 9));
  });

  it("range collapses back to a single range when exclude leaves one segment", () => {
    const cfg = config("day", "range", {
      exclude: compileDateRules({ weekends: true }),
    });
    // Mon..Wed, no weekend inside -> still one range, not an array
    const v = toPublicValue(span([[D(2026, 6, 8), D(2026, 6, 10)]]), cfg);
    expect(Array.isArray(v)).toBe(false);
    expect((v as PublicRange).start.getTime()).toBe(localMidnight(2026, 6, 8));
  });

  it("range fully excluded yields null", () => {
    const cfg = config("day", "range", {
      exclude: compileDateRules({ weekends: true }),
    });
    // Jun 6-7 are both weekend -> nothing survives
    const v = toPublicValue(span([[D(2026, 6, 6), D(2026, 6, 7)]]), cfg);
    expect(v).toBeNull();
  });

  it("week unit with disabled days cuts them from the value", () => {
    const cfg = config("week", "single", {
      disabled: compileDateRules({ weekends: true }),
    });
    // Week Jun 1-7; Sat/Sun disabled -> value is the Mon..Fri business segment.
    const v = toPublicValue(span([[D(2026, 6, 1), D(2026, 6, 7)]]), cfg);
    expect(Array.isArray(v)).toBe(false);
    const r = v as PublicRange;
    expect(r.start.getTime()).toBe(localMidnight(2026, 6, 1));
    expect(r.end.getTime()).toBe(localMidnight(2026, 6, 5));
  });

  it("multi-range flattens segments across all spans", () => {
    const cfg = config("day", "multi-range", {
      exclude: compileDateRules({ weekends: true }),
    });
    const v = toPublicValue(
      span([
        [D(2026, 6, 5), D(2026, 6, 9)], // -> [5], [8,9]
        [D(2026, 6, 15), D(2026, 6, 15)], // Mon -> [15]
      ]),
      cfg,
    ) as PublicRange[];
    expect(v).toHaveLength(3);
    expect(v[2].start.getTime()).toBe(localMidnight(2026, 6, 15));
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
