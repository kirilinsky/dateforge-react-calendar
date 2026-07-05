import { describe, expect, it } from "vitest";
import { MIDNIGHT } from "@/core/calendar-time";
import { toPublicValue } from "@/core/public-value";
import { buildConfig, D, extDate, point, span } from "./builders";

// Smoke test: the shared builders produce the shapes the core consumes, so
// downstream module tests can trust them. Runs in isolation (Phase A exit gate).
describe("fixtures/builders", () => {
  it("buildConfig defaults to day × single and accepts overrides", () => {
    expect(buildConfig()).toMatchObject({ unit: "day", mode: "single" });
    expect(buildConfig({ mode: "range" }).mode).toBe("range");
  });

  it("point/span build valid selections the core can project", () => {
    const cfg = buildConfig({ mode: "single" });
    const v = toPublicValue(point({ d: D(2026, 6, 5) }), cfg);
    expect((v as Date).getTime()).toBe(extDate(2026, 6, 5).getTime());

    const rangeCfg = buildConfig({ mode: "range" });
    const r = toPublicValue(span([[D(2026, 6, 5), D(2026, 6, 9)]]), rangeCfg);
    expect(r).toMatchObject({ start: expect.any(Date), end: expect.any(Date) });
  });

  it("point carries MIDNIGHT by default", () => {
    expect(point({ d: D(2026, 6, 5) }).dates[0].time).toBe(MIDNIGHT);
  });
});
