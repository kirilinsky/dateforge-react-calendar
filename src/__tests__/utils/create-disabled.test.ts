import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createDisabled } from "@/utils/create-disabled";
import { __resetWarnOnce } from "@/core/dev-warn";

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

describe("createDisabled — defensive handling", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    __resetWarnOnce();
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("non-object init returns empty config + warn", () => {
    const cfg = createDisabled(null as unknown as Parameters<typeof createDisabled>[0]);
    expect(cfg.rules).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("invalid before drops the rule + warn", () => {
    const cfg = createDisabled({ before: new Date("nope") });
    expect(cfg.rules.find((r) => typeof r === "object" && r !== null && "before" in r)).toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("invalid date in dates array dropped + warn; valid kept", () => {
    const valid = d(2024, 6, 10);
    const cfg = createDisabled({
      dates: [valid, new Date("nope") as Date, "garbage" as unknown as Date],
    });
    expect(cfg.rules).toContain(valid);
    expect(cfg.rules).toHaveLength(1);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("range with from > to is swapped + warn", () => {
    const a = d(2024, 6, 20);
    const b = d(2024, 6, 5);
    const cfg = createDisabled({ ranges: [{ from: a, to: b }] });
    expect(cfg.rules).toContainEqual({ from: b, to: a });
    expect(warnSpy).toHaveBeenCalled();
  });

  it("range with invalid Date dropped + warn", () => {
    const valid = d(2024, 6, 5);
    const cfg = createDisabled({
      ranges: [
        { from: valid, to: new Date("nope") },
        { from: valid, to: d(2024, 6, 20) },
      ],
    });
    expect(cfg.rules).toHaveLength(1);
    expect(cfg.rules).toContainEqual({ from: valid, to: d(2024, 6, 20) });
    expect(warnSpy).toHaveBeenCalled();
  });

  it("weekdays out of 0..6 are dropped + warn", () => {
    const cfg = createDisabled({ weekdays: [1, 9, -3, 4] });
    expect(cfg.rules).toContainEqual({ dayOfWeek: [1, 4] });
    expect(warnSpy).toHaveBeenCalled();
  });

  it("weekdays not an array → rule skipped + warn", () => {
    const cfg = createDisabled({ weekdays: "Monday" as unknown as number[] });
    expect(cfg.rules).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalled();
  });
});
