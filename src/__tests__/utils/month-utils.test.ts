import { describe, it, expect } from "vitest";
import { getMonthNames, getMonthListData } from "@/utils/month-utils";
import type { DisabledConfig } from "@/types/calendar";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);
const disabled = (...rules: DisabledConfig["rules"]): DisabledConfig => ({
  __type: "disabled-config",
  rules,
});

// ─── getMonthNames ────────────────────────────────────────────────────────────

describe("getMonthNames", () => {
  it("returns 12 names", () => expect(getMonthNames("en")).toHaveLength(12));
  it("first name is January variant (en)", () => {
    const names = getMonthNames("en");
    expect(names[0].toLowerCase()).toContain("jan");
  });
  it("short names shorter than long names (en)", () => {
    const long = getMonthNames("en");
    const short = getMonthNames("en", true);
    expect(short[0].length).toBeLessThanOrEqual(long[0].length);
  });
  it("cached — same array ref on second call", () => {
    const a = getMonthNames("en");
    const b = getMonthNames("en");
    expect(a).toBe(b);
  });
  it("ru: 12 names, first contains янв", () => {
    const names = getMonthNames("ru");
    expect(names).toHaveLength(12);
    expect(names[0].toLowerCase()).toContain("янв");
  });
  it("ru short names shorter than long (ru)", () => {
    const long = getMonthNames("ru");
    const short = getMonthNames("ru", true);
    expect(short[0].length).toBeLessThanOrEqual(long[0].length);
  });
  it("de: different locale produces different names than en", () => {
    const en = getMonthNames("en");
    const de = getMonthNames("de");
    expect(de[0]).not.toBe(en[0]);
  });
});

// ─── getMonthListData ─────────────────────────────────────────────────────────

describe("getMonthListData", () => {
  it("returns 12 items", () => {
    expect(getMonthListData("en", 2024)).toHaveLength(12);
  });

  it("no bounds → all enabled", () => {
    const data = getMonthListData("en", 2024);
    expect(data.every((m) => !m.disabled)).toBe(true);
  });

  it("startDate in July → months before July disabled", () => {
    const data = getMonthListData("en", 2024, d(2024, 7, 1));
    expect(data[0].disabled).toBe(true); // Jan
    expect(data[5].disabled).toBe(true); // Jun
    expect(data[6].disabled).toBe(false); // Jul
  });

  it("endDate in June → months after June disabled", () => {
    const data = getMonthListData("en", 2024, null, d(2024, 6, 30));
    expect(data[5].disabled).toBe(false); // Jun
    expect(data[6].disabled).toBe(true); // Jul
  });

  it("from/to rule covering full month → month disabled", () => {
    const data = getMonthListData(
      "en",
      2024,
      null,
      null,
      false,
      disabled({ from: d(2024, 3, 1), to: d(2024, 3, 31) }),
    );
    expect(data[2].disabled).toBe(true); // March
  });

  it("disableLimited=false → limited but not disabled", () => {
    const data = getMonthListData("en", 2024, d(2024, 7, 1), null, false, undefined, false);
    expect(data[0].limited).toBe(true);
    expect(data[0].disabled).toBe(false);
  });

  it("ru: returns 12 items with label strings", () => {
    const data = getMonthListData("ru", 2024);
    expect(data).toHaveLength(12);
    data.forEach((m) => expect(typeof m.label).toBe("string"));
  });

  it("ru: first label contains янв", () => {
    const data = getMonthListData("ru", 2024);
    expect(data[0].label.toLowerCase()).toContain("янв");
  });

  it("de: labels differ from en for same year", () => {
    const en = getMonthListData("en", 2024);
    const de = getMonthListData("de", 2024);
    expect(de[0].label).not.toBe(en[0].label);
  });
});
