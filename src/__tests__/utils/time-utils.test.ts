import { describe, expect, it } from "vitest";
import { getDrumValue, getTimeString, padTime } from "@/utils/time-utils";

// ─── padTime ──────────────────────────────────────────────────────────────────

describe("padTime", () => {
  it("single digit padded", () => expect(padTime(5)).toBe("05"));
  it("double digit unchanged", () => expect(padTime(15)).toBe("15"));
  it("zero padded", () => expect(padTime(0)).toBe("00"));
  it("boundary 9 padded", () => expect(padTime(9)).toBe("09"));
  it("boundary 10 unchanged", () => expect(padTime(10)).toBe("10"));
});

// ─── getDrumValue ─────────────────────────────────────────────────────────────

describe("getDrumValue", () => {
  it("normal forward step", () => expect(getDrumValue(10, 3, 24)).toBe(13));
  it("wraps forward past max (hours)", () =>
    expect(getDrumValue(23, 1, 24)).toBe(0));
  it("wraps forward multiple (minutes)", () =>
    expect(getDrumValue(58, 5, 60)).toBe(3));
  it("backward step", () => expect(getDrumValue(5, -2, 24)).toBe(3));
  it("wraps backward to end (hours)", () =>
    expect(getDrumValue(0, -1, 24)).toBe(23));
  it("wraps backward (minutes)", () =>
    expect(getDrumValue(2, -5, 60)).toBe(57));
  it("zero offset → same value", () =>
    expect(getDrumValue(15, 0, 60)).toBe(15));
  it("exact max → wraps to 0", () => expect(getDrumValue(0, 24, 24)).toBe(0));
});

// ─── getTimeString ────────────────────────────────────────────────────────────

describe("getTimeString", () => {
  const d = new Date(2024, 0, 1, 14, 5, 30);

  it("24h no seconds", () => {
    const s = getTimeString(d, false, false, "en");
    expect(s).toContain("14");
    expect(s).toContain("05");
    expect(s).not.toContain("30");
  });

  it("12h no seconds shows PM", () => {
    const s = getTimeString(d, true, false, "en");
    expect(s).toContain("PM");
    expect(s).toContain("2");
  });

  it("24h with seconds", () => {
    const s = getTimeString(d, false, true, "en");
    expect(s).toContain("30");
  });

  it("accepts locale param without throwing", () => {
    const result = getTimeString(d, false, false, "de");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("defaults locale to en when omitted", () => {
    expect(getTimeString(d, false, false)).toBe(
      getTimeString(d, false, false, "en"),
    );
  });
});
