import { describe, expect, it } from "vitest";
import {
  createLabelResolver,
  interpolate,
  LABEL_DEFAULTS,
  resolveLabel,
} from "@/core-v3/labels";

describe("interpolate", () => {
  it("replaces a single placeholder", () => {
    expect(interpolate("Current day, {day}", { day: 5 })).toBe(
      "Current day, 5",
    );
  });

  it("replaces multiple distinct placeholders", () => {
    expect(
      interpolate("Select year, showing {from} to {to}", {
        from: 2020,
        to: 2035,
      }),
    ).toBe("Select year, showing 2020 to 2035");
  });

  it("replaces every occurrence of the same placeholder", () => {
    expect(interpolate("{x} and {x}", { x: "a" })).toBe("a and a");
  });

  it("leaves unknown placeholders intact and never throws", () => {
    expect(interpolate("Hi {name}", {})).toBe("Hi {name}");
    expect(interpolate("Hi {name}")).toBe("Hi {name}");
  });
});

describe("resolveLabel — priority module → root → default", () => {
  it("falls back to the English default", () => {
    expect(resolveLabel("apply")).toBe("Apply");
    expect(resolveLabel("clear", {})).toBe(LABEL_DEFAULTS.clear);
  });

  it("root override beats default", () => {
    expect(resolveLabel("apply", { root: { apply: "OK" } })).toBe("OK");
  });

  it("module override beats root and default", () => {
    expect(
      resolveLabel("apply", {
        module: { apply: "Done" },
        root: { apply: "OK" },
      }),
    ).toBe("Done");
  });

  it("interpolates after resolving the winning template", () => {
    expect(
      resolveLabel(
        "changeMonth",
        { root: { changeMonth: "Month: {month}" } },
        { month: "June" },
      ),
    ).toBe("Month: June");
  });
});

describe("createLabelResolver", () => {
  it("binds root once and still honors per-module overrides", () => {
    const t = createLabelResolver({ apply: "Save" });
    expect(t("apply")).toBe("Save");
    expect(t("apply", undefined, { apply: "Submit" })).toBe("Submit");
    expect(t("currentYear", { year: 2026 })).toBe("Current year, 2026");
  });

  it("works with no root overrides", () => {
    const t = createLabelResolver();
    expect(t("home")).toBe(LABEL_DEFAULTS.home);
  });
});

describe("registry coverage", () => {
  it("every default is a non-empty string", () => {
    for (const value of Object.values(LABEL_DEFAULTS)) {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    }
  });
});
