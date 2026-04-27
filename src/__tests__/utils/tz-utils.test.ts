import { describe, expect, it } from "vitest";
import { getTodayInTimezone, toTZMidnight } from "@/utils/tz-utils";

// ─── getTodayInTimezone ───────────────────────────────────────────────────────

describe("getTodayInTimezone", () => {
  it("returns Date with time 00:00:00", () => {
    const today = getTodayInTimezone("UTC");
    expect(today.getHours()).toBe(0);
    expect(today.getMinutes()).toBe(0);
    expect(today.getSeconds()).toBe(0);
    expect(today.getMilliseconds()).toBe(0);
  });

  it("UTC+0 alias works (Etc/GMT)", () => {
    expect(() => getTodayInTimezone("UTC+0")).not.toThrow();
  });

  it("UTC shorthand works", () => {
    const a = getTodayInTimezone("UTC");
    const b = getTodayInTimezone("Etc/GMT");
    expect(a.getFullYear()).toBe(b.getFullYear());
    expect(a.getMonth()).toBe(b.getMonth());
    expect(a.getDate()).toBe(b.getDate());
  });

  it("returns valid calendar date (not NaN)", () => {
    const today = getTodayInTimezone("America/New_York");
    expect(Number.isNaN(today.getTime())).toBe(false);
  });
});

// ─── toTZMidnight ─────────────────────────────────────────────────────────────

describe("toTZMidnight", () => {
  it("returns a valid Date", () => {
    const local = new Date(2024, 5, 15); // Jun 15
    const result = toTZMidnight(local, "UTC");
    expect(Number.isNaN(result.getTime())).toBe(false);
  });

  it("UTC: preserves year/month/day", () => {
    const local = new Date(2024, 5, 15);
    const result = toTZMidnight(local, "UTC");
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(result);
    const get = (type: string) =>
      parseInt(parts.find((p) => p.type === type)!.value, 10);
    expect(get("year")).toBe(2024);
    expect(get("month")).toBe(6);
    expect(get("day")).toBe(15);
  });

  it("UTC alias (UTC+5) does not throw", () => {
    expect(() => toTZMidnight(new Date(2024, 0, 1), "UTC+5")).not.toThrow();
  });
});
