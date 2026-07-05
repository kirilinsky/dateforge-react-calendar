import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  addYears,
  calendarDate,
  clampDayToMonth,
  dateKey,
  datesEqual,
  dayNumber,
  differenceInDays,
  fromDayNumber,
} from "@/core/calendar-date";

describe("clampDayToMonth", () => {
  it("clamps overflow to month length", () => {
    expect(clampDayToMonth(2026, 2, 31)).toBe(28);
    expect(clampDayToMonth(2024, 2, 31)).toBe(29);
    expect(clampDayToMonth(2026, 4, 31)).toBe(30);
  });

  it("leaves valid days untouched and floors below 1", () => {
    expect(clampDayToMonth(2026, 1, 15)).toBe(15);
    expect(clampDayToMonth(2026, 1, 0)).toBe(1);
  });
});

describe("dayNumber / fromDayNumber", () => {
  it("anchors the unix epoch at 0", () => {
    expect(dayNumber(calendarDate(1970, 1, 1))).toBe(0);
  });

  it("round-trips across boundaries, leaps, and negative years", () => {
    const samples = [
      calendarDate(1970, 1, 1),
      calendarDate(2026, 6, 5),
      calendarDate(2024, 2, 29),
      calendarDate(1900, 3, 1),
      calendarDate(1, 1, 1),
      calendarDate(-1, 12, 31),
      calendarDate(0, 2, 29),
    ];
    for (const d of samples) {
      expect(datesEqual(fromDayNumber(dayNumber(d)), d)).toBe(true);
    }
  });

  it("counts consecutive days as consecutive numbers", () => {
    const a = dayNumber(calendarDate(2026, 2, 28));
    const b = dayNumber(calendarDate(2026, 3, 1));
    expect(b - a).toBe(1);
  });
});

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    expect(dateKey(addDays(calendarDate(2026, 1, 31), 1))).toBe(20260201);
    expect(dateKey(addDays(calendarDate(2026, 12, 31), 1))).toBe(20270101);
    expect(dateKey(addDays(calendarDate(2024, 2, 28), 1))).toBe(20240229);
  });

  it("subtracts with negative n and is identity at 0", () => {
    expect(dateKey(addDays(calendarDate(2026, 3, 1), -1))).toBe(20260228);
    const d = calendarDate(2026, 6, 5);
    expect(addDays(d, 0)).toBe(d);
  });
});

describe("addMonths", () => {
  it("clamps day to shorter target month", () => {
    expect(dateKey(addMonths(calendarDate(2026, 1, 31), 1))).toBe(20260228);
    expect(dateKey(addMonths(calendarDate(2024, 1, 31), 1))).toBe(20240229);
  });

  it("wraps the year forward and backward", () => {
    expect(dateKey(addMonths(calendarDate(2026, 11, 15), 3))).toBe(20270215);
    expect(dateKey(addMonths(calendarDate(2026, 2, 15), -3))).toBe(20251115);
  });
});

describe("addYears", () => {
  it("clamps Feb 29 to Feb 28 in common years", () => {
    expect(dateKey(addYears(calendarDate(2024, 2, 29), 1))).toBe(20250228);
    expect(dateKey(addYears(calendarDate(2024, 2, 29), 4))).toBe(20280229);
  });
});

describe("differenceInDays", () => {
  it("is signed distance in whole days", () => {
    expect(
      differenceInDays(calendarDate(2026, 6, 5), calendarDate(2026, 6, 1)),
    ).toBe(4);
    expect(
      differenceInDays(calendarDate(2026, 6, 1), calendarDate(2026, 6, 5)),
    ).toBe(-4);
    expect(
      differenceInDays(calendarDate(2024, 3, 1), calendarDate(2024, 2, 28)),
    ).toBe(2);
  });
});
