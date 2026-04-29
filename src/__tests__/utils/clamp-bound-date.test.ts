import { describe, expect, it } from "vitest";
import {
  clampBoundDate,
  computeBoundLimits,
} from "@/utils/clamp-bound-date";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

const daysIn = (y: number, m: number) => new Date(y, m, 0).getDate();

describe("clampBoundDate", () => {
  it("returns next unchanged when no bound active", () => {
    const next = d(2024, 5, 10);
    expect(clampBoundDate(next, "to", null, null)).toBe(next);
    expect(clampBoundDate(next, "from", null, null)).toBe(next);
  });

  it("clamps `to` up to rangeStart when next is earlier", () => {
    const start = d(2024, 6, 15);
    const next = d(2024, 5, 1);
    const result = clampBoundDate(next, "to", start, null);
    expect(result.getTime()).toBe(start.getTime());
    expect(result).not.toBe(start);
  });

  it("leaves `to` alone when next >= rangeStart", () => {
    const start = d(2024, 6, 15);
    const next = d(2024, 6, 16);
    expect(clampBoundDate(next, "to", start, null)).toBe(next);
  });

  it("clamps `from` down to rangeEnd when next is later", () => {
    const end = d(2024, 6, 15);
    const next = d(2024, 8, 1);
    const result = clampBoundDate(next, "from", null, end);
    expect(result.getTime()).toBe(end.getTime());
  });

  it("leaves `from` alone when next <= rangeEnd", () => {
    const end = d(2024, 6, 15);
    const next = d(2024, 6, 14);
    expect(clampBoundDate(next, "from", null, end)).toBe(next);
  });
});

describe("computeBoundLimits — undefined bound or no opposite", () => {
  it("returns infinities when bound undefined", () => {
    const lim = computeBoundLimits({
      bound: undefined,
      rangeStart: null,
      rangeEnd: null,
      refYear: 2024,
      refMonth: 5,
      refDay: 10,
      daysInRefMonth: 30,
    });
    expect(lim.yearMin).toBe(-Infinity);
    expect(lim.yearMax).toBe(Infinity);
    expect(lim.monthMin).toBe(-Infinity);
    expect(lim.monthMax).toBe(Infinity);
    expect(lim.dayMin).toBe(-Infinity);
    expect(lim.dayMax).toBe(Infinity);
  });

  it("`to` with no rangeStart → no constraint", () => {
    const lim = computeBoundLimits({
      bound: "to",
      rangeStart: null,
      rangeEnd: null,
      refYear: 2024,
      refMonth: 5,
      refDay: 10,
      daysInRefMonth: 30,
    });
    expect(lim.yearMin).toBe(-Infinity);
  });

  it("`from` with no rangeEnd → no constraint", () => {
    const lim = computeBoundLimits({
      bound: "from",
      rangeStart: null,
      rangeEnd: null,
      refYear: 2024,
      refMonth: 5,
      refDay: 10,
      daysInRefMonth: 30,
    });
    expect(lim.yearMax).toBe(Infinity);
  });
});

describe("computeBoundLimits — `to` bound vs rangeStart", () => {
  // rangeStart = 2024-06-15
  const rangeStart = d(2024, 6, 15);

  it("year min equals fy when (refMonth,refDay) >= (fm,fd)", () => {
    const lim = computeBoundLimits({
      bound: "to",
      rangeStart,
      rangeEnd: null,
      refYear: 2024,
      refMonth: 7, // July (after June)
      refDay: 1,
      daysInRefMonth: 31,
    });
    expect(lim.yearMin).toBe(2024);
  });

  it("year min equals fy when same month and day == fd", () => {
    const lim = computeBoundLimits({
      bound: "to",
      rangeStart,
      rangeEnd: null,
      refYear: 2024,
      refMonth: 5, // June (0-indexed)
      refDay: 15,
      daysInRefMonth: 30,
    });
    expect(lim.yearMin).toBe(2024);
  });

  it("year min becomes fy+1 when (refMonth,refDay) < (fm,fd)", () => {
    const lim = computeBoundLimits({
      bound: "to",
      rangeStart,
      rangeEnd: null,
      refYear: 2024,
      refMonth: 4, // May
      refDay: 20,
      daysInRefMonth: 31,
    });
    expect(lim.yearMin).toBe(2025);
  });

  it("year min becomes fy+1 when same month but day < fd", () => {
    const lim = computeBoundLimits({
      bound: "to",
      rangeStart,
      rangeEnd: null,
      refYear: 2024,
      refMonth: 5, // June
      refDay: 10,
      daysInRefMonth: 30,
    });
    expect(lim.yearMin).toBe(2025);
  });

  it("month min = 0 when refYear > fy", () => {
    const lim = computeBoundLimits({
      bound: "to",
      rangeStart,
      rangeEnd: null,
      refYear: 2025,
      refMonth: 1,
      refDay: 1,
      daysInRefMonth: 31,
    });
    expect(lim.monthMin).toBe(0);
  });

  it("month min = 12 (impossible) when refYear < fy", () => {
    const lim = computeBoundLimits({
      bound: "to",
      rangeStart,
      rangeEnd: null,
      refYear: 2023,
      refMonth: 11,
      refDay: 31,
      daysInRefMonth: 31,
    });
    expect(lim.monthMin).toBe(12);
  });

  it("month min = fm when refYear == fy and refDay >= fd", () => {
    const lim = computeBoundLimits({
      bound: "to",
      rangeStart,
      rangeEnd: null,
      refYear: 2024,
      refMonth: 5,
      refDay: 20,
      daysInRefMonth: 30,
    });
    expect(lim.monthMin).toBe(5);
  });

  it("month min = fm+1 when refYear == fy and refDay < fd", () => {
    const lim = computeBoundLimits({
      bound: "to",
      rangeStart,
      rangeEnd: null,
      refYear: 2024,
      refMonth: 5,
      refDay: 10,
      daysInRefMonth: 30,
    });
    expect(lim.monthMin).toBe(6);
  });

  it("day min = 0 when (refYear, refMonth) > (fy, fm)", () => {
    const lim = computeBoundLimits({
      bound: "to",
      rangeStart,
      rangeEnd: null,
      refYear: 2024,
      refMonth: 6, // July
      refDay: 1,
      daysInRefMonth: 31,
    });
    expect(lim.dayMin).toBe(0);
  });

  it("day min = daysInRefMonth (impossible) when (refYear,refMonth) < (fy,fm)", () => {
    const lim = computeBoundLimits({
      bound: "to",
      rangeStart,
      rangeEnd: null,
      refYear: 2024,
      refMonth: 4, // May
      refDay: 1,
      daysInRefMonth: 31,
    });
    expect(lim.dayMin).toBe(31);
  });

  it("day min = fd-1 when same year and month", () => {
    const lim = computeBoundLimits({
      bound: "to",
      rangeStart,
      rangeEnd: null,
      refYear: 2024,
      refMonth: 5,
      refDay: 1,
      daysInRefMonth: 30,
    });
    expect(lim.dayMin).toBe(14);
  });
});

describe("computeBoundLimits — `from` bound vs rangeEnd", () => {
  // rangeEnd = 2024-06-15
  const rangeEnd = d(2024, 6, 15);

  it("year max = ty when (refMonth,refDay) <= (tm,td)", () => {
    const lim = computeBoundLimits({
      bound: "from",
      rangeStart: null,
      rangeEnd,
      refYear: 2024,
      refMonth: 4,
      refDay: 1,
      daysInRefMonth: 31,
    });
    expect(lim.yearMax).toBe(2024);
  });

  it("year max = ty-1 when (refMonth,refDay) > (tm,td)", () => {
    const lim = computeBoundLimits({
      bound: "from",
      rangeStart: null,
      rangeEnd,
      refYear: 2024,
      refMonth: 7,
      refDay: 1,
      daysInRefMonth: 31,
    });
    expect(lim.yearMax).toBe(2023);
  });

  it("month max = 11 when refYear < ty", () => {
    const lim = computeBoundLimits({
      bound: "from",
      rangeStart: null,
      rangeEnd,
      refYear: 2023,
      refMonth: 0,
      refDay: 1,
      daysInRefMonth: 31,
    });
    expect(lim.monthMax).toBe(11);
  });

  it("month max = -1 (impossible) when refYear > ty", () => {
    const lim = computeBoundLimits({
      bound: "from",
      rangeStart: null,
      rangeEnd,
      refYear: 2025,
      refMonth: 0,
      refDay: 1,
      daysInRefMonth: 31,
    });
    expect(lim.monthMax).toBe(-1);
  });

  it("month max = tm when same year and refDay <= td", () => {
    const lim = computeBoundLimits({
      bound: "from",
      rangeStart: null,
      rangeEnd,
      refYear: 2024,
      refMonth: 5,
      refDay: 10,
      daysInRefMonth: 30,
    });
    expect(lim.monthMax).toBe(5);
  });

  it("month max = tm-1 when same year and refDay > td", () => {
    const lim = computeBoundLimits({
      bound: "from",
      rangeStart: null,
      rangeEnd,
      refYear: 2024,
      refMonth: 5,
      refDay: 20,
      daysInRefMonth: 30,
    });
    expect(lim.monthMax).toBe(4);
  });

  it("day max = daysInRefMonth-1 when (refYear,refMonth) < (ty,tm)", () => {
    const lim = computeBoundLimits({
      bound: "from",
      rangeStart: null,
      rangeEnd,
      refYear: 2024,
      refMonth: 4,
      refDay: 1,
      daysInRefMonth: 31,
    });
    expect(lim.dayMax).toBe(30);
  });

  it("day max = -1 (impossible) when (refYear,refMonth) > (ty,tm)", () => {
    const lim = computeBoundLimits({
      bound: "from",
      rangeStart: null,
      rangeEnd,
      refYear: 2024,
      refMonth: 7,
      refDay: 1,
      daysInRefMonth: 31,
    });
    expect(lim.dayMax).toBe(-1);
  });

  it("day max = td-1 when same year and month", () => {
    const lim = computeBoundLimits({
      bound: "from",
      rangeStart: null,
      rangeEnd,
      refYear: 2024,
      refMonth: 5,
      refDay: 1,
      daysInRefMonth: 30,
    });
    expect(lim.dayMax).toBe(14);
  });
});

describe("computeBoundLimits — leap year edge", () => {
  it("Feb 29 rangeStart, refDate Feb 28 same year → year must advance", () => {
    const lim = computeBoundLimits({
      bound: "to",
      rangeStart: d(2024, 2, 29),
      rangeEnd: null,
      refYear: 2024,
      refMonth: 1, // Feb
      refDay: 28,
      daysInRefMonth: daysIn(2024, 2),
    });
    expect(lim.dayMin).toBe(28); // Feb has 29 days, day index 28 = day 29
    expect(lim.yearMin).toBe(2025); // (Feb,28) < (Feb,29) → year+1
  });
});
