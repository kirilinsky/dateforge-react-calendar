import { describe, expect, it } from "vitest";
import { calendarDate, dateKey } from "@/core-v3/calendar-date";
import {
  type CalendarRange,
  mergeRanges,
  orderRange,
  rangeContains,
  rangeIndexOf,
  rangeLengthDays,
  rangesContain,
  rangesOverlap,
  weekRange,
  weekStart,
} from "@/core-v3/calendar-range";

const D = (y: number, m: number, d: number) => calendarDate(y, m, d);
const R = (a: CalendarRange["start"], b: CalendarRange["end"]) =>
  orderRange(a, b);
const keys = (ranges: CalendarRange[]) =>
  ranges.map((r) => [dateKey(r.start), dateKey(r.end)]);

describe("orderRange", () => {
  it("normalizes reverse selection", () => {
    const r = orderRange(D(2026, 6, 20), D(2026, 6, 10));
    expect(dateKey(r.start)).toBe(20260610);
    expect(dateKey(r.end)).toBe(20260620);
  });
});

describe("rangeContains", () => {
  const r = R(D(2026, 6, 10), D(2026, 6, 20));
  it("includes endpoints and interior", () => {
    expect(rangeContains(r, D(2026, 6, 10))).toBe(true);
    expect(rangeContains(r, D(2026, 6, 15))).toBe(true);
    expect(rangeContains(r, D(2026, 6, 20))).toBe(true);
  });
  it("excludes outside days, including cross-month", () => {
    expect(rangeContains(r, D(2026, 6, 9))).toBe(false);
    expect(rangeContains(r, D(2026, 6, 21))).toBe(false);
    expect(rangeContains(r, D(2026, 5, 31))).toBe(false);
    expect(rangeContains(r, D(2026, 7, 1))).toBe(false);
  });
});

describe("rangeLengthDays", () => {
  it("is inclusive", () => {
    expect(rangeLengthDays(R(D(2026, 6, 5), D(2026, 6, 5)))).toBe(1);
    expect(rangeLengthDays(R(D(2026, 6, 1), D(2026, 6, 30)))).toBe(30);
    expect(rangeLengthDays(R(D(2026, 1, 31), D(2026, 2, 1)))).toBe(2);
  });
});

describe("rangesOverlap", () => {
  it("detects overlap and separation", () => {
    expect(
      rangesOverlap(
        R(D(2026, 6, 1), D(2026, 6, 10)),
        R(D(2026, 6, 5), D(2026, 6, 15)),
      ),
    ).toBe(true);
    expect(
      rangesOverlap(
        R(D(2026, 6, 1), D(2026, 6, 5)),
        R(D(2026, 6, 10), D(2026, 6, 15)),
      ),
    ).toBe(false);
  });
});

describe("mergeRanges", () => {
  it("sorts and merges overlapping spans", () => {
    const merged = mergeRanges([
      R(D(2026, 6, 10), D(2026, 6, 15)),
      R(D(2026, 6, 1), D(2026, 6, 12)),
    ]);
    expect(keys(merged)).toEqual([[20260601, 20260615]]);
  });

  it("merges calendar-adjacent spans across a month boundary", () => {
    const merged = mergeRanges([
      R(D(2026, 1, 20), D(2026, 1, 31)),
      R(D(2026, 2, 1), D(2026, 2, 5)),
    ]);
    expect(keys(merged)).toEqual([[20260120, 20260205]]);
  });

  it("keeps a one-day gap separate", () => {
    const merged = mergeRanges([
      R(D(2026, 6, 1), D(2026, 6, 5)),
      R(D(2026, 6, 7), D(2026, 6, 10)),
    ]);
    expect(keys(merged)).toEqual([
      [20260601, 20260605],
      [20260607, 20260610],
    ]);
  });

  it("returns a copy for 0/1 inputs", () => {
    expect(mergeRanges([])).toEqual([]);
    const one = [R(D(2026, 6, 1), D(2026, 6, 5))];
    expect(mergeRanges(one)).not.toBe(one);
  });
});

describe("weekStart / weekRange", () => {
  // 2026-06-05 is a Friday.
  it("derives the week from firstDayOfWeek (Sunday default)", () => {
    const r = weekRange(D(2026, 6, 5));
    expect([dateKey(r.start), dateKey(r.end)]).toEqual([20260531, 20260606]);
    expect(rangeLengthDays(r)).toBe(7);
  });

  it("shifts the boundary for a Monday start", () => {
    const r = weekRange(D(2026, 6, 5), 1);
    expect([dateKey(r.start), dateKey(r.end)]).toEqual([20260601, 20260607]);
  });

  it("is stable for any day inside the same week", () => {
    const a = weekStart(D(2026, 6, 1), 1);
    const b = weekStart(D(2026, 6, 7), 1);
    expect(dateKey(a)).toBe(dateKey(b));
  });

  it("weekend exclusion via segmented merge yields a business-day span", () => {
    const week = weekRange(D(2026, 6, 5), 1); // Mon Jun 1 .. Sun Jun 7
    const business: CalendarRange[] = [];
    for (let k = 0; k < 7; k++) {
      const day = orderRange(week.start, week.end).start;
      const d = D(day.year, day.month, day.day + k);
      if (d.day <= 5) business.push(orderRange(d, d)); // Jun 1-5 are Mon-Fri
    }
    const merged = mergeRanges(business);
    expect(merged).toHaveLength(1);
    expect([dateKey(merged[0].start), dateKey(merged[0].end)]).toEqual([
      20260601, 20260605,
    ]);
  });
});

describe("rangeIndexOf / rangesContain", () => {
  const sorted = mergeRanges([
    R(D(2026, 6, 1), D(2026, 6, 5)),
    R(D(2026, 6, 10), D(2026, 6, 12)),
    R(D(2026, 6, 20), D(2026, 6, 25)),
  ]);

  it("finds the containing span by binary search", () => {
    expect(rangeIndexOf(sorted, D(2026, 6, 3))).toBe(0);
    expect(rangeIndexOf(sorted, D(2026, 6, 11))).toBe(1);
    expect(rangeIndexOf(sorted, D(2026, 6, 22))).toBe(2);
  });

  it("returns -1 for gaps and outside", () => {
    expect(rangeIndexOf(sorted, D(2026, 6, 7))).toBe(-1);
    expect(rangeIndexOf(sorted, D(2026, 6, 26))).toBe(-1);
    expect(rangesContain(sorted, D(2026, 6, 7))).toBe(false);
    expect(rangesContain(sorted, D(2026, 6, 20))).toBe(true);
  });
});
