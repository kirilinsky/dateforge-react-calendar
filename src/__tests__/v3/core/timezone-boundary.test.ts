import { describe, expect, it } from "vitest";
import { calendarDate } from "@/core-v3/calendar-date";
import { calendarDateTime } from "@/core-v3/calendar-date-time";
import { calendarTime } from "@/core-v3/calendar-time";
import {
  fromCalendarDateTime,
  toCalendarDateTime,
  today,
} from "@/core-v3/timezone-boundary";

const dt = (y: number, mo: number, d: number, h = 0, mi = 0, s = 0, ms = 0) =>
  calendarDateTime(calendarDate(y, mo, d), calendarTime(h, mi, s, ms));

describe("toCalendarDateTime", () => {
  const instant = new Date(Date.UTC(2026, 5, 5, 12, 0, 0, 250)); // 2026-06-05 12:00:00.250Z

  it("reads wall clock in UTC", () => {
    const r = toCalendarDateTime(instant, "UTC");
    expect(r.date).toEqual(calendarDate(2026, 6, 5));
    expect(r.time).toEqual(calendarTime(12, 0, 0, 250));
  });

  it("shifts into New York (EDT, -4h in June)", () => {
    const r = toCalendarDateTime(instant, "America/New_York");
    expect(r.date).toEqual(calendarDate(2026, 6, 5));
    expect(r.time).toEqual(calendarTime(8, 0, 0, 250));
  });

  it("handles a half-hour zone (Kolkata +5:30)", () => {
    const r = toCalendarDateTime(instant, "Asia/Kolkata");
    expect(r.date).toEqual(calendarDate(2026, 6, 5));
    expect(r.time).toEqual(calendarTime(17, 30, 0, 250));
  });
});

describe("fromCalendarDateTime round-trip", () => {
  it("recovers the original instant for normal times", () => {
    const original = new Date(Date.UTC(2026, 5, 5, 12, 0, 0, 250));
    for (const tz of [
      "UTC",
      "America/New_York",
      "Asia/Kolkata",
      "Europe/Berlin",
    ]) {
      const wall = toCalendarDateTime(original, tz);
      const back = fromCalendarDateTime(wall, tz);
      expect(back.ok).toBe(true);
      if (back.ok) expect(back.date.getTime()).toBe(original.getTime());
    }
  });

  it("maps a known wall clock to the right UTC instant", () => {
    // 2026-06-05 08:00 in New York (EDT) is 12:00Z.
    const r = fromCalendarDateTime(dt(2026, 6, 5, 8, 0), "America/New_York");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.date.getTime()).toBe(Date.UTC(2026, 5, 5, 12, 0));
  });
});

describe("DST spring-forward gap (New York 2026-03-08 02:30)", () => {
  const gap = dt(2026, 3, 8, 2, 30);

  it("rejects when policy is reject", () => {
    const r = fromCalendarDateTime(gap, "America/New_York", {
      nonexistent: "reject",
    });
    expect(r.ok).toBe(false);
  });

  it("next-valid shifts forward to 03:30 EDT", () => {
    const r = fromCalendarDateTime(gap, "America/New_York", {
      nonexistent: "next-valid",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.adjusted).toBe(true);
      const wall = toCalendarDateTime(r.date, "America/New_York");
      expect(wall.time).toEqual(calendarTime(3, 30, 0, 0));
    }
  });

  it("previous-valid stays at 01:30 EST", () => {
    const r = fromCalendarDateTime(gap, "America/New_York", {
      nonexistent: "previous-valid",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const wall = toCalendarDateTime(r.date, "America/New_York");
      expect(wall.time).toEqual(calendarTime(1, 30, 0, 0));
    }
  });
});

describe("DST fall-back fold (New York 2026-11-01 01:30)", () => {
  const fold = dt(2026, 11, 1, 1, 30);

  it("earlier and later both read 01:30 but differ by one hour", () => {
    const earlier = fromCalendarDateTime(fold, "America/New_York", {
      ambiguous: "earlier",
    });
    const later = fromCalendarDateTime(fold, "America/New_York", {
      ambiguous: "later",
    });
    expect(earlier.ok && later.ok).toBe(true);
    if (earlier.ok && later.ok) {
      expect(earlier.kind).toBe("ambiguous");
      expect(later.date.getTime() - earlier.date.getTime()).toBe(3_600_000);
      expect(toCalendarDateTime(earlier.date, "America/New_York").time).toEqual(
        calendarTime(1, 30, 0, 0),
      );
      expect(toCalendarDateTime(later.date, "America/New_York").time).toEqual(
        calendarTime(1, 30, 0, 0),
      );
    }
  });
});

describe("today", () => {
  it("agrees with toCalendarDateTime of now", () => {
    const tz = "America/New_York";
    expect(today(tz)).toEqual(toCalendarDateTime(new Date(), tz).date);
  });

  it("falls back to the system zone for invalid time zones", () => {
    const instant = new Date(Date.UTC(2026, 5, 5, 12, 0, 0));
    expect(toCalendarDateTime(instant, "Mars/Phobos")).toEqual(
      toCalendarDateTime(instant),
    );
    expect(() => today("Mars/Phobos")).not.toThrow();
  });
});
