import { describe, expect, it } from "vitest";
import {
  calendarTime,
  clampTime,
  compareTime,
  earlierTime,
  isValidTime,
  laterTime,
  MIDNIGHT,
  msOfDay,
  normalizeTime,
  timeInWindow,
  timesEqual,
  timeWindowSide,
} from "@/core/calendar-time";

describe("isValidTime", () => {
  it("accepts in-range times", () => {
    expect(isValidTime(MIDNIGHT)).toBe(true);
    expect(isValidTime(calendarTime(23, 59, 59, 999))).toBe(true);
    expect(isValidTime(calendarTime(14, 30))).toBe(true);
  });

  it("rejects out-of-range and non-integer fields", () => {
    expect(isValidTime(calendarTime(24, 0))).toBe(false);
    expect(isValidTime(calendarTime(0, 60))).toBe(false);
    expect(isValidTime(calendarTime(0, 0, 60))).toBe(false);
    expect(isValidTime(calendarTime(0, 0, 0, 1000))).toBe(false);
    expect(isValidTime(calendarTime(-1, 0))).toBe(false);
    expect(isValidTime(calendarTime(1.5, 0))).toBe(false);
  });
});

describe("msOfDay / compareTime", () => {
  it("maps midnight to 0 and end-of-day to nearly a full day", () => {
    expect(msOfDay(MIDNIGHT)).toBe(0);
    expect(msOfDay(calendarTime(23, 59, 59, 999))).toBe(86_399_999);
    expect(msOfDay(calendarTime(1, 0, 0, 0))).toBe(3_600_000);
  });

  it("orders times", () => {
    const a = calendarTime(9, 0);
    const b = calendarTime(9, 0, 0, 1);
    expect(compareTime(a, b)).toBeLessThan(0);
    expect(compareTime(b, a)).toBeGreaterThan(0);
    expect(compareTime(a, a)).toBe(0);
  });
});

describe("timesEqual", () => {
  it("compares by field", () => {
    expect(timesEqual(calendarTime(9, 0), calendarTime(9, 0, 0, 0))).toBe(true);
    expect(timesEqual(calendarTime(9, 0), calendarTime(9, 0, 0, 1))).toBe(
      false,
    );
  });
});

describe("normalizeTime", () => {
  it("is identity (zero carry) for canonical times", () => {
    const r = normalizeTime(calendarTime(14, 30, 15, 250));
    expect(r.dayOffset).toBe(0);
    expect(timesEqual(r.time, calendarTime(14, 30, 15, 250))).toBe(true);
  });

  it("carries overflow forward into whole days", () => {
    const r = normalizeTime(calendarTime(25, 0));
    expect(r.dayOffset).toBe(1);
    expect(timesEqual(r.time, calendarTime(1, 0))).toBe(true);
  });

  it("carries underflow backward into negative days", () => {
    const r = normalizeTime(calendarTime(0, -30));
    expect(r.dayOffset).toBe(-1);
    expect(timesEqual(r.time, calendarTime(23, 30))).toBe(true);
  });

  it("cascades field overflow (90 min -> +1h30m)", () => {
    const r = normalizeTime(calendarTime(10, 90));
    expect(r.dayOffset).toBe(0);
    expect(timesEqual(r.time, calendarTime(11, 30))).toBe(true);
  });

  it("always yields a valid normalized time", () => {
    for (const t of [
      calendarTime(48, 120, 200, 5000),
      calendarTime(-5, -5, -5, -5),
      calendarTime(23, 59, 59, 1000),
    ]) {
      expect(isValidTime(normalizeTime(t).time)).toBe(true);
    }
  });
});

describe("time window helpers", () => {
  const min = calendarTime(9, 0);
  const max = calendarTime(17, 0);

  it("timeWindowSide / timeInWindow respect inclusive bounds", () => {
    expect(timeWindowSide(calendarTime(8, 59), min, max)).toBe(-1);
    expect(timeWindowSide(calendarTime(17, 1), min, max)).toBe(1);
    expect(timeWindowSide(min, min, max)).toBe(0); // inclusive low
    expect(timeWindowSide(max, min, max)).toBe(0); // inclusive high
    expect(timeInWindow(calendarTime(12, 0), min, max)).toBe(true);
    expect(timeInWindow(calendarTime(7, 0), min, max)).toBe(false);
    // Open-ended sides.
    expect(timeInWindow(calendarTime(2, 0), undefined, max)).toBe(true);
    expect(timeInWindow(calendarTime(23, 0), min, undefined)).toBe(true);
  });

  it("clampTime pins to the nearer bound, returns the input when inside", () => {
    expect(clampTime(calendarTime(6, 0), min, max)).toEqual(min);
    expect(clampTime(calendarTime(20, 0), min, max)).toEqual(max);
    const inside = calendarTime(10, 30);
    expect(clampTime(inside, min, max)).toBe(inside);
  });

  it("laterTime / earlierTime fold optional bounds (undefined = open)", () => {
    expect(laterTime(min, max)).toBe(max); // tighter LOWER bound = later
    expect(laterTime(min, undefined)).toBe(min);
    expect(laterTime(undefined, max)).toBe(max);
    expect(earlierTime(min, max)).toBe(min); // tighter UPPER bound = earlier
    expect(earlierTime(undefined, max)).toBe(max);
    expect(laterTime(undefined, undefined)).toBeUndefined();
  });
});
