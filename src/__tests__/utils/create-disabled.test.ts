import { describe, it, expect } from "vitest";
import { createDisabled } from "@/utils/create-disabled";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe("createDisabled", () => {
  it("returns correct __type", () => {
    expect(createDisabled({}).  __type).toBe("disabled-config");
  });

  it("empty init → empty rules", () => {
    expect(createDisabled({}).rules).toHaveLength(0);
  });

  it("all:true → boolean true rule", () => {
    const { rules } = createDisabled({ all: true });
    expect(rules).toContain(true);
  });

  it("weekends → dayOfWeek [0,6]", () => {
    const { rules } = createDisabled({ weekends: true });
    expect(rules).toContainEqual({ dayOfWeek: [0, 6] });
  });

  it("weekdays → dayOfWeek rule", () => {
    const { rules } = createDisabled({ weekdays: [1, 2] });
    expect(rules).toContainEqual({ dayOfWeek: [1, 2] });
  });

  it("before → before rule", () => {
    const date = d(2024, 6, 1);
    const { rules } = createDisabled({ before: date });
    expect(rules).toContainEqual({ before: date });
  });

  it("after → after rule", () => {
    const date = d(2024, 6, 1);
    const { rules } = createDisabled({ after: date });
    expect(rules).toContainEqual({ after: date });
  });

  it("dates → individual Date rules", () => {
    const a = d(2024, 1, 10);
    const b = d(2024, 1, 20);
    const { rules } = createDisabled({ dates: [a, b] });
    expect(rules).toContain(a);
    expect(rules).toContain(b);
  });

  it("ranges → from/to rules", () => {
    const from = d(2024, 3, 1);
    const to = d(2024, 3, 31);
    const { rules } = createDisabled({ ranges: [{ from, to }] });
    expect(rules).toContainEqual({ from, to });
  });

  it("multiple options combine into multiple rules", () => {
    const { rules } = createDisabled({
      weekends: true,
      before: d(2024, 1, 1),
      dates: [d(2024, 6, 15)],
    });
    expect(rules.length).toBe(3);
  });

  it("empty dates array → no extra rules", () => {
    expect(createDisabled({ dates: [] }).rules).toHaveLength(0);
  });

  it("empty ranges array → no extra rules", () => {
    expect(createDisabled({ ranges: [] }).rules).toHaveLength(0);
  });
});
