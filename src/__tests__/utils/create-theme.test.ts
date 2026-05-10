import { describe, expect, it } from "vitest";
import { CUSTOM_THEME_BRAND } from "@/types/themes";
import { createTheme } from "@/utils/create-theme";

describe("createTheme", () => {
  it("returns object with brand symbol set to true", () => {
    const theme = createTheme({ accent: "#fff" });
    expect(theme[CUSTOM_THEME_BRAND]).toBe(true);
  });

  it("maps known tokens to css var keys", () => {
    const theme = createTheme({
      accent: "#ff6600",
      backdrop: "#000",
      mutedText: "#667085",
      disabledText: "#7a8190",
    });
    expect(theme.vars["--c-a"]).toBe("#ff6600");
    expect(theme.vars["--c-b"]).toBe("#000");
    expect(theme.vars["--c-m"]).toBe("#667085");
    expect(theme.vars["--c-dt"]).toBe("#7a8190");
  });

  it("ignores undefined token values", () => {
    const theme = createTheme({ accent: undefined, backdrop: "#000" });
    expect(theme.vars["--c-a"]).toBeUndefined();
    expect(theme.vars["--c-b"]).toBe("#000");
  });

  it("ignores null token values", () => {
    const theme = createTheme({
      accent: null as unknown as string,
      backdrop: "#abc",
    });
    expect(theme.vars["--c-a"]).toBeUndefined();
    expect(theme.vars["--c-b"]).toBe("#abc");
  });

  it("returns empty vars for empty token object", () => {
    const theme = createTheme({});
    expect(theme.vars).toEqual({});
    expect(theme[CUSTOM_THEME_BRAND]).toBe(true);
  });

  it("ignores keys not present in TOKEN_TO_VAR", () => {
    const tokens = { accent: "#fff", bogus: "x" } as unknown as Parameters<
      typeof createTheme
    >[0];
    const theme = createTheme(tokens);
    expect(theme.vars["--c-a"]).toBe("#fff");
    expect(Object.keys(theme.vars)).toHaveLength(1);
  });
});
