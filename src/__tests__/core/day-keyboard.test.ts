import { describe, expect, it } from "vitest";
import { calendarDate } from "@/core/calendar-date";
import { dayKeyboardTarget } from "@/core/day-keyboard";

const D = (y: number, m: number, d: number) => calendarDate(y, m, d);
const MON_START = 1;

describe("dayKeyboardTarget", () => {
  it("arrows step a day or a week", () => {
    const base = D(2026, 6, 10); // Wed
    expect(dayKeyboardTarget("ArrowLeft", base, MON_START)).toEqual({
      kind: "move",
      date: D(2026, 6, 9),
    });
    expect(dayKeyboardTarget("ArrowRight", base, MON_START)).toEqual({
      kind: "move",
      date: D(2026, 6, 11),
    });
    expect(dayKeyboardTarget("ArrowUp", base, MON_START)).toEqual({
      kind: "move",
      date: D(2026, 6, 3),
    });
    expect(dayKeyboardTarget("ArrowDown", base, MON_START)).toEqual({
      kind: "move",
      date: D(2026, 6, 17),
    });
  });

  it("Home/End jump to the week bounds honoring firstDayOfWeek", () => {
    const base = D(2026, 6, 10); // Wed; Mon-start week is Jun 8..14
    expect(dayKeyboardTarget("Home", base, MON_START)).toEqual({
      kind: "move",
      date: D(2026, 6, 8),
    });
    expect(dayKeyboardTarget("End", base, MON_START)).toEqual({
      kind: "move",
      date: D(2026, 6, 14),
    });
    // Sunday-start week is Jun 7..13
    expect(dayKeyboardTarget("Home", base, 0)).toEqual({
      kind: "move",
      date: D(2026, 6, 7),
    });
  });

  it("PageUp/PageDown step a whole month", () => {
    const base = D(2026, 6, 30);
    expect(dayKeyboardTarget("PageDown", base, MON_START)).toEqual({
      kind: "move",
      date: D(2026, 7, 30),
    });
    expect(dayKeyboardTarget("PageUp", base, MON_START)).toEqual({
      kind: "move",
      date: D(2026, 5, 30),
    });
  });

  it("Enter and Space select", () => {
    const base = D(2026, 6, 10);
    expect(dayKeyboardTarget("Enter", base, MON_START)).toEqual({
      kind: "select",
    });
    expect(dayKeyboardTarget(" ", base, MON_START)).toEqual({ kind: "select" });
    expect(dayKeyboardTarget("Spacebar", base, MON_START)).toEqual({
      kind: "select",
    });
  });

  it("returns null for unhandled keys", () => {
    expect(dayKeyboardTarget("Tab", D(2026, 6, 10), MON_START)).toBeNull();
    expect(dayKeyboardTarget("a", D(2026, 6, 10), MON_START)).toBeNull();
  });
});
