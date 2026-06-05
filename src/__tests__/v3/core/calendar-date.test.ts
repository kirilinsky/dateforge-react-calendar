import { describe, expect, it } from "vitest";
import {
  type CalendarDate,
  calendarDate,
  compareDate,
  dateKey,
  datesEqual,
  daysInMonth,
  isLeapYear,
  isValidDate,
} from "@/core-v3/calendar-date";

describe("isLeapYear", () => {
  it.each([
    [2000, true],
    [1900, false],
    [2024, true],
    [2023, false],
    [2100, false],
    [2400, true],
  ])("year %i -> %s", (year, expected) => {
    expect(isLeapYear(year)).toBe(expected);
  });
});

describe("daysInMonth", () => {
  it("knows fixed month lengths", () => {
    expect(daysInMonth(2026, 1)).toBe(31);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
  });

  it("is leap-aware for February", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2023, 2)).toBe(28);
    expect(daysInMonth(1900, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
  });
});

describe("isValidDate", () => {
  it("accepts real days", () => {
    expect(isValidDate(calendarDate(2026, 6, 5))).toBe(true);
    expect(isValidDate(calendarDate(2024, 2, 29))).toBe(true);
  });

  it("rejects out-of-range months and days", () => {
    expect(isValidDate(calendarDate(2026, 0, 1))).toBe(false);
    expect(isValidDate(calendarDate(2026, 13, 1))).toBe(false);
    expect(isValidDate(calendarDate(2026, 6, 0))).toBe(false);
    expect(isValidDate(calendarDate(2026, 6, 31))).toBe(false);
    expect(isValidDate(calendarDate(2023, 2, 29))).toBe(false);
  });

  it("rejects non-integers", () => {
    expect(isValidDate(calendarDate(2026.5, 6, 5))).toBe(false);
    expect(isValidDate(calendarDate(2026, 6, 5.1))).toBe(false);
    expect(isValidDate(calendarDate(Number.NaN, 6, 5))).toBe(false);
  });
});

describe("dateKey", () => {
  it("is monotonic with calendar order", () => {
    const a = calendarDate(2026, 6, 5);
    const b = calendarDate(2026, 6, 6);
    const c = calendarDate(2026, 7, 1);
    const d = calendarDate(2027, 1, 1);
    expect(dateKey(a)).toBeLessThan(dateKey(b));
    expect(dateKey(b)).toBeLessThan(dateKey(c));
    expect(dateKey(c)).toBeLessThan(dateKey(d));
  });

  it("is usable as a stable Set/Map key", () => {
    const seen = new Set<number>();
    seen.add(dateKey(calendarDate(2026, 6, 5)));
    expect(seen.has(dateKey(calendarDate(2026, 6, 5)))).toBe(true);
    expect(seen.has(dateKey(calendarDate(2026, 6, 6)))).toBe(false);
  });
});

describe("compareDate", () => {
  it("orders dates", () => {
    const a = calendarDate(2026, 6, 5);
    const b = calendarDate(2026, 6, 6);
    expect(compareDate(a, b)).toBeLessThan(0);
    expect(compareDate(b, a)).toBeGreaterThan(0);
    expect(compareDate(a, a)).toBe(0);
  });

  it("sorts an array into calendar order", () => {
    const dates: CalendarDate[] = [
      calendarDate(2027, 1, 1),
      calendarDate(2026, 6, 5),
      calendarDate(2026, 7, 1),
    ];
    const sorted = [...dates].sort(compareDate).map(dateKey);
    expect(sorted).toEqual([20260605, 20260701, 20270101]);
  });
});

describe("datesEqual", () => {
  it("compares by field, not reference", () => {
    expect(datesEqual(calendarDate(2026, 6, 5), calendarDate(2026, 6, 5))).toBe(
      true,
    );
    expect(datesEqual(calendarDate(2026, 6, 5), calendarDate(2026, 6, 6))).toBe(
      false,
    );
  });
});
