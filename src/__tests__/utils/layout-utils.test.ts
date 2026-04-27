import { describe, expect, it } from "vitest";
import { alignToJustify } from "@/utils/layout-utils";

describe("alignToJustify", () => {
  it("left → flex-start", () =>
    expect(alignToJustify["left"]).toBe("flex-start"));
  it("center → center", () => expect(alignToJustify["center"]).toBe("center"));
  it("right → flex-end", () =>
    expect(alignToJustify["right"]).toBe("flex-end"));
  it("covers all 3 keys", () =>
    expect(Object.keys(alignToJustify)).toHaveLength(3));
});
