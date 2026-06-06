import { describe, expect, it } from "vitest";
import { calendarDate } from "@/core-v3/calendar-date";
import { orderRange } from "@/core-v3/calendar-range";
import { compileDateRules } from "@/core-v3/date-rule-engine";

const D = (y: number, m: number, d: number) => calendarDate(y, m, d);

describe("compileDateRules — empty", () => {
  it("matches nothing and reports empty", () => {
    const e = compileDateRules();
    expect(e.isEmpty).toBe(true);
    expect(e.hasReasons).toBe(false);
    expect(e.matches(D(2026, 6, 5))).toBe(false);
    expect(e.getReason(D(2026, 6, 5))).toBeNull();
  });

  it("treats an all-false config as empty", () => {
    expect(
      compileDateRules({ weekdays: [], dates: [], ranges: [] }).isEmpty,
    ).toBe(true);
  });
});

describe("all", () => {
  it("matches every day", () => {
    const e = compileDateRules({ all: true });
    expect(e.matches(D(2026, 6, 5))).toBe(true);
    expect(e.getReason(D(2026, 6, 5))).toBe("all");
  });
});

describe("weekends / weekdays mask", () => {
  it("matches Saturday and Sunday for weekends", () => {
    const e = compileDateRules({ weekends: true });
    expect(e.matches(D(2026, 6, 6))).toBe(true); // Sat
    expect(e.matches(D(2026, 6, 7))).toBe(true); // Sun
    expect(e.matches(D(2026, 6, 5))).toBe(false); // Fri
    expect(e.getReason(D(2026, 6, 6))).toBe("weekday");
  });

  it("matches explicit weekdays and ignores junk values", () => {
    const e = compileDateRules({ weekdays: [1, 3, 99, -2, 2.5] });
    expect(e.matches(D(2026, 6, 1))).toBe(true); // Mon
    expect(e.matches(D(2026, 6, 3))).toBe(true); // Wed
    expect(e.matches(D(2026, 6, 2))).toBe(false); // Tue
  });

  it("accepts a precomputed weekday hint for grid cells", () => {
    const e = compileDateRules({ weekends: true });
    expect(e.matches(D(2026, 6, 6), 6)).toBe(true); // Sat
    expect(e.matches(D(2026, 6, 5), 5)).toBe(false); // Fri
    expect(e.getReason(D(2026, 6, 6), 6)).toBe("weekday");
  });
});

describe("dates (exact Set)", () => {
  it("matches listed days only, skipping invalid", () => {
    const e = compileDateRules({
      dates: [D(2026, 6, 5), D(2026, 2, 30)],
    });
    expect(e.matches(D(2026, 6, 5))).toBe(true);
    expect(e.matches(D(2026, 6, 6))).toBe(false);
    expect(e.getReason(D(2026, 6, 5))).toBe("date");
  });
});

describe("before / after + limits", () => {
  it("matches outside the bounds and exposes limits", () => {
    const e = compileDateRules({
      before: D(2026, 6, 10),
      after: D(2026, 6, 20),
    });
    expect(e.matches(D(2026, 6, 9))).toBe(true);
    expect(e.matches(D(2026, 6, 10))).toBe(false); // boundary allowed
    expect(e.matches(D(2026, 6, 21))).toBe(true);
    expect(e.matches(D(2026, 6, 20))).toBe(false);
    expect(e.limits).toEqual({ min: D(2026, 6, 10), max: D(2026, 6, 20) });
    expect(e.getReason(D(2026, 6, 9))).toBe("before");
    expect(e.getReason(D(2026, 6, 21))).toBe("after");
  });
});

describe("ranges", () => {
  it("matches inside any span via merged binary search", () => {
    const e = compileDateRules({
      ranges: [orderRange(D(2026, 6, 10), D(2026, 6, 14))],
    });
    expect(e.matches(D(2026, 6, 12))).toBe(true);
    expect(e.matches(D(2026, 6, 15))).toBe(false);
    expect(e.getReason(D(2026, 6, 12))).toBe("range");
  });
});

describe("predicate (evaluated last)", () => {
  it("matches via custom function", () => {
    const e = compileDateRules({ predicate: (d) => d.day === 13 });
    expect(e.matches(D(2026, 6, 13))).toBe(true);
    expect(e.matches(D(2026, 6, 14))).toBe(false);
    expect(e.getReason(D(2026, 6, 13))).toBe("predicate");
  });

  it("cheaper rules win the reason before the predicate runs", () => {
    let predicateCalls = 0;
    const e = compileDateRules({
      weekends: true,
      predicate: () => {
        predicateCalls++;
        return true;
      },
    });
    expect(e.getReason(D(2026, 6, 6))).toBe("weekday"); // Sat, no predicate needed
    expect(predicateCalls).toBe(0);
  });
});

describe("combined rules", () => {
  it("ORs all sources together", () => {
    const e = compileDateRules({
      weekends: true,
      dates: [D(2026, 6, 1)],
      ranges: [orderRange(D(2026, 6, 20), D(2026, 6, 22))],
    });
    expect(e.matches(D(2026, 6, 1))).toBe(true); // date
    expect(e.matches(D(2026, 6, 6))).toBe(true); // weekend
    expect(e.matches(D(2026, 6, 21))).toBe(true); // range
    expect(e.matches(D(2026, 6, 3))).toBe(false); // none
  });
});
