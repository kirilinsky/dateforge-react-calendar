import { describe, expect, it } from "vitest";
import { calendarDate } from "@/core/calendar-date";
import {
  canStepView,
  isMonthFixed,
  isMonthInBounds,
  isYearFixed,
  isYearInBounds,
} from "@/core/view-navigation";

const D = (y: number, m: number, d: number) => calendarDate(y, m, d);

describe("canStepView", () => {
  const view = D(2026, 6, 15);

  it("is unbounded without min/max", () => {
    for (const unit of ["day", "month", "year"] as const) {
      expect(canStepView(view, unit, -1)).toBe(true);
      expect(canStepView(view, unit, 1)).toBe(true);
    }
  });

  it("gates month steps at the window edges", () => {
    const min = D(2026, 6, 1);
    const max = D(2026, 7, 31);
    expect(canStepView(view, "month", -1, min, max)).toBe(false);
    expect(canStepView(view, "month", 1, min, max)).toBe(true);
    expect(canStepView(D(2026, 7, 1), "month", 1, min, max)).toBe(false);
  });

  it("gates day steps against exact min/max days", () => {
    const min = D(2026, 6, 15);
    const max = D(2026, 6, 16);
    expect(canStepView(view, "day", -1, min, max)).toBe(false);
    expect(canStepView(view, "day", 1, min, max)).toBe(true);
    expect(canStepView(D(2026, 6, 16), "day", 1, min, max)).toBe(false);
  });

  it("gates year steps by year only", () => {
    const min = D(2025, 12, 1);
    const max = D(2027, 1, 31);
    expect(canStepView(view, "year", -1, min, max)).toBe(true);
    expect(canStepView(view, "year", 1, min, max)).toBe(true);
    expect(canStepView(D(2025, 1, 1), "year", -1, min, max)).toBe(false);
    expect(canStepView(D(2027, 1, 1), "year", 1, min, max)).toBe(false);
  });
});

describe("picker bounds", () => {
  const min = D(2026, 5, 10);
  const max = D(2027, 2, 20);

  it("isMonthInBounds includes partially covered months", () => {
    expect(isMonthInBounds(2026, 4, min, max)).toBe(false);
    expect(isMonthInBounds(2026, 5, min, max)).toBe(true); // partial (from the 10th)
    expect(isMonthInBounds(2027, 2, min, max)).toBe(true); // partial (to the 20th)
    expect(isMonthInBounds(2027, 3, min, max)).toBe(false);
  });

  it("isYearInBounds includes partially covered years", () => {
    expect(isYearInBounds(2025, min, max)).toBe(false);
    expect(isYearInBounds(2026, min, max)).toBe(true);
    expect(isYearInBounds(2027, min, max)).toBe(true);
    expect(isYearInBounds(2028, min, max)).toBe(false);
  });

  it("fixed detection requires both bounds in one year/month", () => {
    expect(isYearFixed(D(2026, 1, 1), D(2026, 12, 31))).toBe(true);
    expect(isYearFixed(D(2026, 1, 1), D(2027, 1, 1))).toBe(false);
    expect(isYearFixed(undefined, D(2026, 12, 31))).toBe(false);
    expect(isMonthFixed(D(2026, 6, 1), D(2026, 6, 30))).toBe(true);
    expect(isMonthFixed(D(2026, 6, 1), D(2026, 7, 1))).toBe(false);
  });
});
