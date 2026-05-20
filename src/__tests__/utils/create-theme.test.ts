import { describe, expect, it } from "vitest";
import { createTheme } from "@/utils/create-theme";

describe("createTheme", () => {
  it("creates a light/dark theme family from nested variant tokens", () => {
    const family = createTheme({
      light: { accent: "#14b8a6" },
      dark: { accent: "#0f766e" },
    });

    expect(family.kind).toBe("family");
    expect(family.light.vars["--c-a"]).toBe("#14b8a6");
    expect(family.dark.vars["--c-a"]).toBe("#0f766e");
  });

  it("maps known tokens to css var keys", () => {
    const family = createTheme({
      light: {
        accent: "#ff6600",
        activeText: "#111111",
        todayDot: "#fefefe",
        backdrop: "#000",
        mutedText: "#667085",
        disabledText: "#7a8190",
      },
      dark: {},
    });

    expect(family.light.vars["--c-a"]).toBe("#ff6600");
    expect(family.light.vars["--c-at"]).toBe("#111111");
    expect(family.light.vars["--c-t-d"]).toBe("#fefefe");
    expect(family.light.vars["--c-b"]).toBe("#000");
    expect(family.light.vars["--c-m"]).toBe("#667085");
    expect(family.light.vars["--c-dt"]).toBe("#7a8190");
  });

  it("ignores undefined, null, and unknown token values", () => {
    const family = createTheme({
      light: {
        accent: undefined,
        backdrop: "#000",
        bogus: "x",
      } as never,
      dark: {
        accent: null,
        backdrop: "#abc",
      } as never,
    });

    expect(family.light.vars["--c-a"]).toBe("#ffffff");
    expect(family.light.vars["--c-b"]).toBe("#000");
    expect(family.light.vars.bogus).toBeUndefined();
    expect(family.dark.vars["--c-a"]).toBe("#1a1a1c");
    expect(family.dark.vars["--c-b"]).toBe("#abc");
  });

  it("merges shared tokens into both variants and lets mode overrides win", () => {
    const family = createTheme({
      highlight: "#14b8a6",
      range: "#0ea5e9",
      weekend: "#be123c",
      light: { backdrop: "#f0fdff" },
      dark: { backdrop: "#061a1d", highlight: "#2dd4bf" },
    });

    expect(family.light.vars["--c-h"]).toBe("#14b8a6");
    expect(family.dark.vars["--c-h"]).toBe("#2dd4bf");
    expect(family.light.vars["--c-r"]).toBe("#0ea5e9");
    expect(family.dark.vars["--c-r"]).toBe("#0ea5e9");
    expect(family.light.vars["--c-we"]).toBe("#be123c");
    expect(family.dark.vars["--c-we"]).toBe("#be123c");
    expect(family.light.vars["--c-b"]).toBe("#f0fdff");
    expect(family.dark.vars["--c-b"]).toBe("#061a1d");
  });

  it("fills missing tokens from base light/dark defaults", () => {
    const family = createTheme({});

    expect(family.light.vars["--c-b"]).toBe("#ffffff");
    expect(family.light.vars["--c-c"]).toBe("#1a1a1c");
    expect(family.dark.vars["--c-b"]).toBe("#1a1a1c");
    expect(family.dark.vars["--c-c"]).toBe("#f0f0f0");
  });

  it("creates both variants from seed-only tokens", () => {
    const family = createTheme({
      highlight: "#14b8a6",
      range: "#0ea5e9",
      weekend: "#be123c",
    });

    expect(family.light.vars["--c-h"]).toBe("#14b8a6");
    expect(family.dark.vars["--c-h"]).toBe("#14b8a6");
    expect(family.light.vars["--c-r"]).toBe("#0ea5e9");
    expect(family.dark.vars["--c-r"]).toBe("#0ea5e9");
    expect(family.light.vars["--c-we"]).toBe("#be123c");
    expect(family.dark.vars["--c-we"]).toBe("#be123c");
  });

  it("derives readable active text, today dot, and shadow from highlight seeds", () => {
    const family = createTheme({
      highlight: "#14b8a6",
    });

    expect(family.light.vars["--c-at"]).toBe("#111111");
    expect(family.dark.vars["--c-at"]).toBe("#111111");
    expect(family.light.vars["--c-t-d"]).toBe("#111111");
    expect(family.dark.vars["--c-t-d"]).toBe("#111111");
    expect(family.light.vars["--c-x"]).toBe("#14b8a628");
    expect(family.dark.vars["--c-x"]).toBe("#14b8a628");
  });

  it("lets explicit active text, today dot, and shadow override seed derivation", () => {
    const family = createTheme({
      highlight: "#14b8a6",
      activeText: "#ffffff",
      todayDot: "#fefefe",
      shadow: "#00000020",
      dark: {
        activeText: "#eeeeee",
      },
    });

    expect(family.light.vars["--c-at"]).toBe("#ffffff");
    expect(family.dark.vars["--c-at"]).toBe("#eeeeee");
    expect(family.light.vars["--c-t-d"]).toBe("#fefefe");
    expect(family.dark.vars["--c-t-d"]).toBe("#fefefe");
    expect(family.light.vars["--c-x"]).toBe("#00000020");
    expect(family.dark.vars["--c-x"]).toBe("#00000020");
  });
});
