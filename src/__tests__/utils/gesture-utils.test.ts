import { describe, expect, it } from "vitest";
import { getNextMonthFromSwipe } from "@/utils/gesture-utils";

const D = (y: number, m: number, d = 15) => new Date(y, m, d);

describe("getNextMonthFromSwipe", () => {
  it("returns null when deltaX below threshold", () => {
    expect(getNextMonthFromSwipe(10, D(2024, 5))).toBeNull();
    expect(getNextMonthFromSwipe(-49, D(2024, 5))).toBeNull();
  });

  it("uses custom threshold when provided", () => {
    const below = getNextMonthFromSwipe(
      50,
      D(2024, 5),
      undefined,
      undefined,
      100,
    );
    expect(below).toBeNull();
    const above = getNextMonthFromSwipe(
      101,
      D(2024, 5),
      undefined,
      undefined,
      100,
    );
    expect(above).not.toBeNull();
    expect(above?.getMonth()).toBe(6);
  });

  it("positive deltaX → next month", () => {
    const r = getNextMonthFromSwipe(60, D(2024, 5));
    expect(r?.getFullYear()).toBe(2024);
    expect(r?.getMonth()).toBe(6);
  });

  it("negative deltaX → previous month", () => {
    const r = getNextMonthFromSwipe(-60, D(2024, 5));
    expect(r?.getFullYear()).toBe(2024);
    expect(r?.getMonth()).toBe(4);
  });

  it("rolls forward across year boundary", () => {
    const r = getNextMonthFromSwipe(60, D(2024, 11));
    expect(r?.getFullYear()).toBe(2025);
    expect(r?.getMonth()).toBe(0);
  });

  it("rolls back across year boundary", () => {
    const r = getNextMonthFromSwipe(-60, D(2024, 0));
    expect(r?.getFullYear()).toBe(2023);
    expect(r?.getMonth()).toBe(11);
  });

  it("clamps day for shorter target month (Jan 31 → Feb 28/29)", () => {
    const r = getNextMonthFromSwipe(60, D(2024, 0, 31));
    expect(r?.getMonth()).toBe(1);
    expect(r?.getDate()).toBeLessThanOrEqual(29);
  });

  it("returns null when next month before startDate", () => {
    expect(getNextMonthFromSwipe(-60, D(2024, 5), D(2024, 5))).toBeNull();
  });

  it("returns null when next month after endDate", () => {
    expect(
      getNextMonthFromSwipe(60, D(2024, 5), undefined, D(2024, 5)),
    ).toBeNull();
  });

  it("respects disabled.rules `before` bound", () => {
    const r = getNextMonthFromSwipe(-60, D(2024, 5), undefined, undefined, 50, {
      rules: [{ before: D(2024, 5, 1) }],
    });
    expect(r).toBeNull();
  });

  it("respects disabled.rules `after` bound", () => {
    const r = getNextMonthFromSwipe(60, D(2024, 5), undefined, undefined, 50, {
      rules: [{ after: D(2024, 5, 28) }],
    });
    expect(r).toBeNull();
  });

  it("allows navigation within bounds", () => {
    const r = getNextMonthFromSwipe(60, D(2024, 0), D(2023, 6), D(2025, 6));
    expect(r?.getFullYear()).toBe(2024);
    expect(r?.getMonth()).toBe(1);
  });
});
