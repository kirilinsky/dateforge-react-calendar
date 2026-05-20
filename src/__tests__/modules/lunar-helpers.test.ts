import { describe, expect, it } from "vitest";
import {
  buildLunarWindow,
  getLunarFraction,
  getLunarIllumination,
  getLunarPhaseIndex,
  getLunarPhaseKey,
  LUNAR_PHASE_ABBR,
  LUNAR_PHASE_KEYS,
  LUNAR_PHASE_LONG,
} from "@/modules/lunar/helpers";

describe("getLunarFraction", () => {
  it("returns a fraction in [0, 1)", () => {
    for (let i = 0; i < 200; i++) {
      const d = new Date(2024, 0, 1 + i);
      const f = getLunarFraction(d);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
    }
  });

  it("near new moon → fraction near 0 or 1", () => {
    // 2024-01-11 was a new moon (UTC).
    const newMoon = new Date(Date.UTC(2024, 0, 11, 11, 57));
    const f = getLunarFraction(newMoon);
    expect(Math.min(f, 1 - f)).toBeLessThan(0.05);
  });

  it("near full moon → fraction near 0.5", () => {
    // 2024-01-25 was a full moon (UTC).
    const fullMoon = new Date(Date.UTC(2024, 0, 25, 17, 54));
    const f = getLunarFraction(fullMoon);
    expect(Math.abs(f - 0.5)).toBeLessThan(0.05);
  });
});

describe("getLunarPhaseIndex / getLunarPhaseKey", () => {
  it("returns indexes within 0..7", () => {
    for (let i = 0; i < 365; i++) {
      const d = new Date(2024, 0, 1 + i);
      const idx = getLunarPhaseIndex(d);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(8);
    }
  });

  it("new moon maps to phase key 'new'", () => {
    const d = new Date(Date.UTC(2024, 0, 11, 12, 0));
    expect(getLunarPhaseKey(d)).toBe("new");
  });

  it("full moon maps to phase key 'full'", () => {
    const d = new Date(Date.UTC(2024, 0, 25, 18, 0));
    expect(getLunarPhaseKey(d)).toBe("full");
  });

  it("phase keys list has 8 unique entries", () => {
    expect(LUNAR_PHASE_KEYS).toHaveLength(8);
    expect(new Set(LUNAR_PHASE_KEYS).size).toBe(8);
  });

  it("every phase key has abbreviation + long name", () => {
    for (const key of LUNAR_PHASE_KEYS) {
      expect(LUNAR_PHASE_ABBR[key]).toMatch(/\S/);
      expect(LUNAR_PHASE_LONG[key]).toMatch(/\S/);
    }
  });
});

describe("getLunarIllumination", () => {
  it("new moon → ~0", () => {
    const d = new Date(Date.UTC(2024, 0, 11, 12, 0));
    expect(getLunarIllumination(d)).toBeLessThan(0.05);
  });

  it("full moon → ~1", () => {
    const d = new Date(Date.UTC(2024, 0, 25, 18, 0));
    expect(getLunarIllumination(d)).toBeGreaterThan(0.95);
  });

  it("first quarter → ~0.5", () => {
    // First quarter falls about a week after new moon.
    const d = new Date(Date.UTC(2024, 0, 18, 4, 0));
    expect(Math.abs(getLunarIllumination(d) - 0.5)).toBeLessThan(0.1);
  });
});

describe("buildLunarWindow", () => {
  const anchor = new Date(2024, 5, 15);

  it("returns exactly `days` entries", () => {
    expect(buildLunarWindow(anchor, 7)).toHaveLength(7);
    expect(buildLunarWindow(anchor, 1)).toHaveLength(1);
    expect(buildLunarWindow(anchor, 14)).toHaveLength(14);
  });

  it("centers anchor on odd counts", () => {
    const win = buildLunarWindow(anchor, 7);
    expect(win[3].getDate()).toBe(15);
    expect(win[0].getDate()).toBe(12);
    expect(win[6].getDate()).toBe(18);
  });

  it("leans anchor one-left on even counts", () => {
    const win = buildLunarWindow(anchor, 6);
    expect(win[2].getDate()).toBe(15);
    expect(win[0].getDate()).toBe(13);
    expect(win[5].getDate()).toBe(18);
  });

  it("clamps days to at least 1", () => {
    expect(buildLunarWindow(anchor, 0)).toHaveLength(1);
    expect(buildLunarWindow(anchor, -3)).toHaveLength(1);
  });

  it("crosses month boundaries correctly", () => {
    const lastDayOfMonth = new Date(2024, 5, 30);
    const win = buildLunarWindow(lastDayOfMonth, 5);
    expect(win[0].getMonth()).toBe(5);
    expect(win[4].getMonth()).toBe(6);
    expect(win[4].getDate()).toBe(2);
  });
});
