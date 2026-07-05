import { describe, expect, it } from "vitest";
import { calendarDate, dateKey, weekdayOf } from "@/core/calendar-date";
import { mergeRanges, orderRange, rangeRole } from "@/core/calendar-range";
import { buildMonthGrid } from "@/core/month-grid";

const D = (y: number, m: number, d: number) => calendarDate(y, m, d);

describe("weekdayOf", () => {
  it("knows reference days (0=Sun..6=Sat)", () => {
    expect(weekdayOf(D(1970, 1, 1))).toBe(4); // Thursday
    expect(weekdayOf(D(2026, 6, 5))).toBe(5); // Friday
    expect(weekdayOf(D(2000, 1, 1))).toBe(6); // Saturday
    expect(weekdayOf(D(2026, 6, 7))).toBe(0); // Sunday
  });
});

describe("buildMonthGrid", () => {
  it("emits 6 fixed weeks of 7 by default", () => {
    const g = buildMonthGrid({ year: 2026, month: 6 });
    expect(g.weeks).toHaveLength(6);
    for (const w of g.weeks) expect(w).toHaveLength(7);
  });

  it("starts the week on Sunday by default and Monday when asked", () => {
    const sun = buildMonthGrid({ year: 2026, month: 6 });
    expect(sun.weekdayOrder).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(weekdayOf(sun.weeks[0][0].date)).toBe(0);

    const mon = buildMonthGrid({ year: 2026, month: 6, firstDayOfWeek: 1 });
    expect(mon.weekdayOrder).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(weekdayOf(mon.weeks[0][0].date)).toBe(1);
  });

  it("borrows leading/trailing days from neighbor months", () => {
    // June 2026: 1st is a Monday -> with Sunday start, one lead day (May 31).
    const g = buildMonthGrid({ year: 2026, month: 6 });
    const firstCell = g.weeks[0][0];
    expect(dateKey(firstCell.date)).toBe(20260531);
    expect(firstCell.inMonth).toBe(false);

    const inMonthCount = g.weeks.flat().filter((c) => c.inMonth).length;
    expect(inMonthCount).toBe(30);
  });

  it("cell.weekday matches its column position", () => {
    const g = buildMonthGrid({ year: 2026, month: 2, firstDayOfWeek: 1 });
    for (const week of g.weeks) {
      week.forEach((cell, col) => {
        expect(cell.weekday).toBe(weekdayOf(cell.date));
        expect(cell.weekday).toBe((1 + col) % 7);
      });
    }
  });

  it("can emit a tight (non-fixed) grid", () => {
    const g = buildMonthGrid({ year: 2026, month: 2, fixedWeeks: false });
    // Feb 2026: 28 days, 1st is Sunday -> exactly 4 weeks.
    expect(g.weeks).toHaveLength(4);
  });
});

describe("rangeRole (animation-ready cell role)", () => {
  const ranges = mergeRanges([orderRange(D(2026, 6, 10), D(2026, 6, 14))]);

  it("labels endpoints, interior, and outside", () => {
    expect(rangeRole(ranges, D(2026, 6, 9))).toBeNull();
    expect(rangeRole(ranges, D(2026, 6, 10))).toBe("start");
    expect(rangeRole(ranges, D(2026, 6, 12))).toBe("middle");
    expect(rangeRole(ranges, D(2026, 6, 14))).toBe("end");
    expect(rangeRole(ranges, D(2026, 6, 15))).toBeNull();
  });

  it("labels a one-day range as single", () => {
    const one = mergeRanges([orderRange(D(2026, 6, 5), D(2026, 6, 5))]);
    expect(rangeRole(one, D(2026, 6, 5))).toBe("single");
  });

  it("treats a one-day gap between segments as two separate caps", () => {
    const segs = mergeRanges([
      orderRange(D(2026, 6, 2), D(2026, 6, 6)),
      orderRange(D(2026, 6, 9), D(2026, 6, 13)),
    ]);
    expect(rangeRole(segs, D(2026, 6, 6))).toBe("end");
    expect(rangeRole(segs, D(2026, 6, 7))).toBeNull();
    expect(rangeRole(segs, D(2026, 6, 9))).toBe("start");
  });
});
