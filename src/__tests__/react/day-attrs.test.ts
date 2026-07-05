import { describe, expect, it } from "vitest";
import { DayFlag } from "@/core/day-flags";
import { dayDataAttrs } from "@/react/day-attrs";

describe("dayDataAttrs", () => {
  it("emits empty-string attrs for present flags, undefined for absent", () => {
    const attrs = dayDataAttrs(DayFlag.Selected | DayFlag.Today);
    expect(attrs["data-selected"]).toBe("");
    expect(attrs["data-today"]).toBe("");
    expect(attrs["data-in-range"]).toBeUndefined();
    expect(attrs["data-disabled"]).toBeUndefined();
  });

  it("maps range edges independently", () => {
    const attrs = dayDataAttrs(DayFlag.InRange | DayFlag.RangeStart);
    expect(attrs["data-in-range"]).toBe("");
    expect(attrs["data-range-start"]).toBe("");
    expect(attrs["data-range-end"]).toBeUndefined();
  });

  it("emits nothing for zero flags", () => {
    const attrs = dayDataAttrs(0);
    for (const v of Object.values(attrs)) expect(v).toBeUndefined();
  });
});
