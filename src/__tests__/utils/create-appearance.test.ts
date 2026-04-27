import { describe, expect, it } from "vitest";
import { createAppearance } from "@/utils/create-appearance";
import { CUSTOM_APPEARANCE_BRAND } from "@/types/appearances";

describe("createAppearance", () => {
  it("returns object with brand symbol set to true", () => {
    const a = createAppearance({ radius: "0.25em" });
    expect(a[CUSTOM_APPEARANCE_BRAND]).toBe(true);
  });

  it("maps known tokens to css var keys", () => {
    const a = createAppearance({ radius: "0.25em", border: "3px" });
    expect(a.vars["--cal-radius"]).toBe("0.25em");
    expect(a.vars["--cal-border"]).toBe("3px");
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
    const a = createAppearance({
      radius: "0.5em",
      // biome-ignore lint/suspicious/noExplicitAny: testing unknown key path
      bogus: "x",
    } as any);
    expect(a.vars["--cal-radius"]).toBe("0.5em");
    expect(Object.keys(a.vars)).toHaveLength(1);
  });
});
