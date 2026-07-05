import { describe, expect, it } from "vitest";
import { calendarDate } from "@/core/calendar-date";
import {
  calendarDateTime,
  compareDateTime,
  dateTimesEqual,
  isValidDateTime,
  withDate,
  withTime,
} from "@/core/calendar-date-time";
import { calendarTime, MIDNIGHT } from "@/core/calendar-time";

const D = (y: number, m: number, d: number) => calendarDate(y, m, d);
const T = (h: number, min = 0) => calendarTime(h, min);

describe("calendarDateTime", () => {
  it("defaults to midnight", () => {
    const dt = calendarDateTime(D(2026, 6, 5));
    expect(dt.time).toEqual(MIDNIGHT);
  });
});

describe("isValidDateTime", () => {
  it("requires both parts valid", () => {
    expect(isValidDateTime(calendarDateTime(D(2026, 6, 5), T(14, 30)))).toBe(
      true,
    );
    expect(isValidDateTime(calendarDateTime(D(2026, 13, 5), T(14)))).toBe(
      false,
    );
    expect(isValidDateTime(calendarDateTime(D(2026, 6, 5), T(24)))).toBe(false);
  });
});

describe("compareDateTime", () => {
  it("orders by date first, then by time", () => {
    const a = calendarDateTime(D(2026, 6, 5), T(23, 59));
    const b = calendarDateTime(D(2026, 6, 6), T(0, 0));
    expect(compareDateTime(a, b)).toBeLessThan(0); // later time, earlier day still earlier
  });

  it("breaks date ties by time", () => {
    const a = calendarDateTime(D(2026, 6, 5), T(9));
    const b = calendarDateTime(D(2026, 6, 5), T(10));
    expect(compareDateTime(a, b)).toBeLessThan(0);
    expect(compareDateTime(b, a)).toBeGreaterThan(0);
    expect(compareDateTime(a, a)).toBe(0);
  });
});

describe("dateTimesEqual", () => {
  it("compares both parts", () => {
    expect(
      dateTimesEqual(
        calendarDateTime(D(2026, 6, 5), T(9)),
        calendarDateTime(D(2026, 6, 5), T(9)),
      ),
    ).toBe(true);
    expect(
      dateTimesEqual(
        calendarDateTime(D(2026, 6, 5), T(9)),
        calendarDateTime(D(2026, 6, 5), T(10)),
      ),
    ).toBe(false);
  });
});

describe("withTime / withDate", () => {
  it("replaces one part, keeps the other", () => {
    const dt = calendarDateTime(D(2026, 6, 5), T(9, 30));
    expect(withTime(dt, T(18)).date).toBe(dt.date);
    expect(withTime(dt, T(18)).time).toEqual(T(18));
    expect(withDate(dt, D(2027, 1, 1)).time).toBe(dt.time);
    expect(withDate(dt, D(2027, 1, 1)).date).toEqual(D(2027, 1, 1));
  });
});
