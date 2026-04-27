import { describe, expect, it } from "vitest";
import {
  applyMask,
  dateToMask,
  maskToDate,
  validatePartialMask,
} from "@/utils/date-mask";

// ─── dateToMask ───────────────────────────────────────────────────────────────

describe("dateToMask", () => {
  it("null → empty string", () => expect(dateToMask(null)).toBe(""));
  it("valid date → DD.MM.YYYY", () =>
    expect(dateToMask(new Date(2024, 0, 15))).toBe("15.01.2024"));
  it("single-digit day padded", () =>
    expect(dateToMask(new Date(2024, 5, 5))).toBe("05.06.2024"));
  it("single-digit month padded", () =>
    expect(dateToMask(new Date(2024, 0, 1))).toBe("01.01.2024"));
  it("last day of year", () =>
    expect(dateToMask(new Date(2024, 11, 31))).toBe("31.12.2024"));
});

// ─── maskToDate ───────────────────────────────────────────────────────────────

describe("maskToDate", () => {
  it("valid '01.01.2024' → Date", () => {
    const result = maskToDate("01.01.2024");
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(2024);
    expect(result!.getMonth()).toBe(0);
    expect(result!.getDate()).toBe(1);
  });
  it("invalid month >12 → null", () =>
    expect(maskToDate("01.13.2024")).toBeNull());
  it("invalid day >31 → null", () =>
    expect(maskToDate("32.01.2024")).toBeNull());
  it("year <1000 → null", () => expect(maskToDate("01.01.0999")).toBeNull());
  it("incomplete 7 digits → null", () =>
    expect(maskToDate("01.01.202")).toBeNull());
  it("empty string → null", () => expect(maskToDate("")).toBeNull());
  it("strips non-digits before parsing", () => {
    const result = maskToDate("15/06/2024");
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(15);
  });
  it("month=0 invalid → null", () =>
    expect(maskToDate("01.00.2024")).toBeNull());
  it("day=0 invalid → null", () => expect(maskToDate("00.01.2024")).toBeNull());
});

// ─── applyMask ────────────────────────────────────────────────────────────────

describe("applyMask", () => {
  it("1-2 digits → no dots", () => expect(applyMask("1")).toBe("1"));
  it("2 digits → no dot yet", () => expect(applyMask("15")).toBe("15"));
  it("3-4 digits → dot after 2", () => expect(applyMask("150")).toBe("15.0"));
  it("4 digits → DD.MM", () => expect(applyMask("1506")).toBe("15.06"));
  it("5-8 digits → two dots", () =>
    expect(applyMask("15062024")).toBe("15.06.2024"));
  it("strips non-digits", () =>
    expect(applyMask("15/06/2024")).toBe("15.06.2024"));
  it("truncates past 8 digits", () =>
    expect(applyMask("150620241234")).toBe("15.06.2024"));
  it("empty → empty", () => expect(applyMask("")).toBe(""));
  it("already masked input → idempotent", () =>
    expect(applyMask("15.06.2024")).toBe("15.06.2024"));
});

// ─── maskToDate calendrical validation ────────────────────────────────────────

describe("maskToDate — calendrical validation", () => {
  it("Feb 31 → null (no rollover)", () =>
    expect(maskToDate("31.02.2024")).toBeNull());
  it("Apr 31 → null (April has 30 days)", () =>
    expect(maskToDate("31.04.2024")).toBeNull());
  it("Feb 29 in leap year → valid", () => {
    const result = maskToDate("29.02.2024");
    expect(result).not.toBeNull();
    expect(result!.getMonth()).toBe(1);
    expect(result!.getDate()).toBe(29);
  });
  it("Feb 29 in non-leap year → null", () =>
    expect(maskToDate("29.02.2023")).toBeNull());
});

// ─── validatePartialMask ──────────────────────────────────────────────────────

describe("validatePartialMask", () => {
  it("empty → ok", () => expect(validatePartialMask("")).toBe(false));
  it("partial single digit → ok", () =>
    expect(validatePartialMask("3")).toBe(false));
  it("day 32 → invalid", () => expect(validatePartialMask("32")).toBe(true));
  it("day 00 → invalid", () => expect(validatePartialMask("00")).toBe(true));
  it("day 31 → ok (partial, month not yet)", () =>
    expect(validatePartialMask("31")).toBe(false));
  it("month 13 → invalid", () =>
    expect(validatePartialMask("01.13")).toBe(true));
  it("month 00 → invalid", () =>
    expect(validatePartialMask("01.00")).toBe(true));
  it("Feb 30 partial → invalid even before year", () =>
    expect(validatePartialMask("30.02")).toBe(true));
  it("Apr 31 partial → invalid even before year", () =>
    expect(validatePartialMask("31.04")).toBe(true));
  it("valid partial mid-typing → ok", () =>
    expect(validatePartialMask("15.06.20")).toBe(false));
  it("full valid date → ok", () =>
    expect(validatePartialMask("15.06.2024")).toBe(false));
  it("full impossible date → invalid", () =>
    expect(validatePartialMask("31.02.2024")).toBe(true));
});
