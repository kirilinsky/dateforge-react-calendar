import { describe, expect, it } from "vitest";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";

// pure function — no renderHook needed
describe("getGridSlotStyle", () => {
  it("undefined → undefined", () =>
    expect(getGridSlotStyle(undefined)).toBeUndefined());
  it("number → span N", () =>
    expect(getGridSlotStyle(2)).toEqual({ gridColumn: "span 2" }));
  it("number 1", () =>
    expect(getGridSlotStyle(1)).toEqual({ gridColumn: "span 1" }));
  it("string passthrough", () =>
    expect(getGridSlotStyle("1 / 3")).toEqual({ gridColumn: "1 / 3" }));
  it("string 'auto'", () =>
    expect(getGridSlotStyle("auto")).toEqual({ gridColumn: "auto" }));
});
