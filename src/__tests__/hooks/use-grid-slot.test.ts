import { describe, expect, it } from "vitest";
import { useGridSlot } from "@/hooks/use-grid-slot";

// pure function — no renderHook needed
describe("useGridSlot", () => {
  it("undefined → undefined", () =>
    expect(useGridSlot(undefined)).toBeUndefined());
  it("number → span N", () =>
    expect(useGridSlot(2)).toEqual({ gridColumn: "span 2" }));
  it("number 1", () =>
    expect(useGridSlot(1)).toEqual({ gridColumn: "span 1" }));
  it("string passthrough", () =>
    expect(useGridSlot("1 / 3")).toEqual({ gridColumn: "1 / 3" }));
  it("string 'auto'", () =>
    expect(useGridSlot("auto")).toEqual({ gridColumn: "auto" }));
});
