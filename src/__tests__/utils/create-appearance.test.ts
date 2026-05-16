import { describe, expect, it } from "vitest";
import { CUSTOM_APPEARANCE_BRAND } from "@/types/appearances";
import { createAppearance } from "@/utils/create-appearance";

describe("createAppearance", () => {
  it("returns object with brand symbol set to true", () => {
    const a = createAppearance({ radius: "0.25em" });
    expect(a[CUSTOM_APPEARANCE_BRAND]).toBe(true);
  });

  it("maps known tokens to css var keys", () => {
    const a = createAppearance({
      radius: "0.25em",
      border: "3px",
      containerGap: "0px",
      navButtonBg: "transparent",
      dayFontSize: "1.1em",
      dayWeight: "300",
      controlFontSize: "0.95em",
      todayOutlineWidth: "0px",
      selectedDayWeight: "500",
      selectedTextDotSize: "0.2em",
      selectedTextDotOffset: "0.1em",
    });
    expect(a.vars["--cal-radius"]).toBe("0.25em");
    expect(a.vars["--cal-border"]).toBe("3px");
    expect(a.vars["--cal-container-gap"]).toBe("0px");
    expect(a.vars["--cal-nav-button-bg"]).toBe("transparent");
    expect(a.vars["--cal-text-day"]).toBe("1.1em");
    expect(a.vars["--cal-day-weight"]).toBe("300");
    expect(a.vars["--cal-text-lg"]).toBe("0.95em");
    expect(a.vars["--cal-today-outline-width"]).toBe("0px");
    expect(a.vars["--cal-selected-day-weight"]).toBe("500");
    expect(a.vars["--cal-selected-text-dot-size"]).toBe("0.2em");
    expect(a.vars["--cal-selected-text-dot-offset"]).toBe("0.1em");
  });

  it("ignores undefined token values", () => {
    const a = createAppearance({ radius: undefined, border: "1px" });
    expect(a.vars["--cal-radius"]).toBeUndefined();
    expect(a.vars["--cal-border"]).toBe("1px");
  });

  it("ignores null token values", () => {
    const a = createAppearance({
      radius: null as unknown as string,
      border: "2px",
    });
    expect(a.vars["--cal-radius"]).toBeUndefined();
    expect(a.vars["--cal-border"]).toBe("2px");
  });

  it("returns empty vars for empty token object", () => {
    const a = createAppearance({});
    expect(a.vars).toEqual({});
    expect(a[CUSTOM_APPEARANCE_BRAND]).toBe(true);
  });

  it("ignores keys not present in APPEARANCE_TOKEN_TO_VAR", () => {
    const tokens = { radius: "0.5em", bogus: "x" } as unknown as Parameters<
      typeof createAppearance
    >[0];
    const a = createAppearance(tokens);
    expect(a.vars["--cal-radius"]).toBe("0.5em");
    expect(Object.keys(a.vars)).toHaveLength(1);
  });
});
