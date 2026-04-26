import { describe, it, expect } from "vitest";
import { padTime, getDrumValue } from "@/utils/time-utils";

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
  it("wraps forward past max (hours)", () => expect(getDrumValue(23, 1, 24)).toBe(0));
  it("wraps forward multiple (minutes)", () => expect(getDrumValue(58, 5, 60)).toBe(3));
  it("backward step", () => expect(getDrumValue(5, -2, 24)).toBe(3));
  it("wraps backward to end (hours)", () => expect(getDrumValue(0, -1, 24)).toBe(23));
  it("wraps backward (minutes)", () => expect(getDrumValue(2, -5, 60)).toBe(57));
  it("zero offset → same value", () => expect(getDrumValue(15, 0, 60)).toBe(15));
  it("exact max → wraps to 0", () => expect(getDrumValue(0, 24, 24)).toBe(0));
});
