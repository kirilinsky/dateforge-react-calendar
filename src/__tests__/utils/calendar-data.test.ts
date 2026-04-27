import { describe, expect, it } from "vitest";
import {
  getCalendarData,
  getFirstDayOffset,
  getWeekdaysNames,
} from "@/utils/calendar-data";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

// ─── getWeekdaysNames ─────────────────────────────────────────────────────────

describe("getWeekdaysNames", () => {
  it("returns 7 names", () =>
    expect(getWeekdaysNames("en", 1)).toHaveLength(7));
  it("Mon start (1): first name is Mon variant", () => {
    const names = getWeekdaysNames("en", 1);
    expect(names[0].toLowerCase()).toContain("mon");
  });
  it("Sun start (0): first name is Sun variant", () => {
    const names = getWeekdaysNames("en", 0);
    expect(names[0].toLowerCase()).toContain("sun");
  });
  it("cached — same ref on repeated call", () => {
    const a = getWeekdaysNames("en", 1);
    const b = getWeekdaysNames("en", 1);
    expect(a).toBe(b);
  });
});

// ─── getFirstDayOffset ────────────────────────────────────────────────────────

describe("getFirstDayOffset", () => {
  // 2024-01-01 is Monday (1)
  it("Jan 2024, startOfWeek=1 → offset 0 (Mon=Mon)", () => {
    expect(getFirstDayOffset(d(2024, 1, 1), 1)).toBe(0);
  });
  it("Jan 2024, startOfWeek=0 (Sun) → offset 1", () => {
    expect(getFirstDayOffset(d(2024, 1, 1), 0)).toBe(1);
  });
  // 2024-06-01 is Saturday (6)
  it("Jun 2024, startOfWeek=1 → offset 5", () => {
    expect(getFirstDayOffset(d(2024, 6, 1), 1)).toBe(5);
  });
});

// ─── getCalendarData ──────────────────────────────────────────────────────────

describe("getCalendarData", () => {
  const offset = getFirstDayOffset(d(2024, 1, 1), 1); // 0

  it("returns 6 weeks", () => {
    const data = getCalendarData(2024, 0, offset, []);
    expect(data).toHaveLength(6);
  });

  it("each week has 7 days", () => {
    const data = getCalendarData(2024, 0, offset, []);
    data.forEach((week) => {
      expect(week.days).toHaveLength(7);
    });
  });

  it("first day of Jan 2024 grid is 1st (offset=0, startOfWeek=Mon)", () => {
    const data = getCalendarData(2024, 0, offset, []);
    expect(data[0].days[0].fullDate.getDate()).toBe(1);
    expect(data[0].days[0].isCurrentMonth).toBe(true);
  });

  it("isCurrentMonth false for days outside month", () => {
    // Jan 2024 ends on 31st; Feb days should be in week 5 or 6
    const data = getCalendarData(2024, 0, offset, []);
    const lastWeek = data[data.length - 1];
    const outsideDays = lastWeek.days.filter((d) => !d.isCurrentMonth);
    expect(outsideDays.length).toBeGreaterThan(0);
  });

  it("selected date marked isSelected", () => {
    const sel = d(2024, 1, 15);
    const data = getCalendarData(2024, 0, offset, [sel]);
    const found = data.flatMap((w) => w.days).find((d) => d.isSelected);
    expect(found).toBeDefined();
    expect(found!.fullDate.getDate()).toBe(15);
  });

  it("disabled date via endDate marked isDisabled", () => {
    const end = d(2024, 1, 10);
    const data = getCalendarData(2024, 0, offset, [], null, end);
    const day15 = data
      .flatMap((w) => w.days)
      .find((d) => d.fullDate.getDate() === 15 && d.fullDate.getMonth() === 0);
    expect(day15!.isDisabled).toBe(true);
  });

  it("range: start/end marked isRangeStart / isRangeEnd", () => {
    const start = d(2024, 1, 5);
    const end = d(2024, 1, 10);
    const data = getCalendarData(2024, 0, offset, [], null, null, undefined, {
      rangeStart: start,
      rangeEnd: end,
    });
    const allDays = data.flatMap((w) => w.days);
    expect(allDays.find((d) => d.isRangeStart)!.fullDate.getDate()).toBe(5);
    expect(allDays.find((d) => d.isRangeEnd)!.fullDate.getDate()).toBe(10);
  });

  it("range: days between start/end marked isInRange", () => {
    const start = d(2024, 1, 5);
    const end = d(2024, 1, 10);
    const data = getCalendarData(2024, 0, offset, [], null, null, undefined, {
      rangeStart: start,
      rangeEnd: end,
    });
    const inRange = data.flatMap((w) => w.days).filter((d) => d.isInRange);
    expect(inRange.map((d) => d.fullDate.getDate())).toEqual([6, 7, 8, 9]);
  });

  it("weekNumber is 2-char zero-padded string", () => {
    const data = getCalendarData(2024, 0, offset, []);
    data.forEach((week) => {
      expect(week.weekNumber).toMatch(/^\d{2}$/);
    });
  });

  it("minRangeDays disables days too close to rangeStart", () => {
    const start = d(2024, 1, 10);
    const data = getCalendarData(2024, 0, offset, [], null, null, undefined, {
      rangeStart: start,
      minRangeDays: 5,
    });
    const allDays = data.flatMap((w) => w.days);
    // day 11 is only 2 days away → should be rangeLimitDisabled
    const day11 = allDays.find(
      (d) => d.fullDate.getDate() === 11 && d.fullDate.getMonth() === 0,
    );
    expect(day11!.isRangeLimitDisabled).toBe(true);
  });

  it("maxRangeDays disables days too far from rangeStart", () => {
    const start = d(2024, 1, 1);
    const data = getCalendarData(2024, 0, offset, [], null, null, undefined, {
      rangeStart: start,
      maxRangeDays: 3,
    });
    const allDays = data.flatMap((w) => w.days);
    const day10 = allDays.find(
      (d) => d.fullDate.getDate() === 10 && d.fullDate.getMonth() === 0,
    );
    expect(day10!.isRangeLimitDisabled).toBe(true);
  });
});
