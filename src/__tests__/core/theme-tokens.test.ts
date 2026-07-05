import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createTheme,
  isThemeFamily,
  THEME_BRAND,
  TOKEN_TO_VAR,
  themeFamilyToVars,
} from "@/styles/theme-tokens";

describe("createTheme (v3)", () => {
  it("returns a branded family with light and dark variants", () => {
    const family = createTheme({ accent: "#14b8a6" });
    expect(family.kind).toBe("family");
    expect(family.light[THEME_BRAND]).toBe(true);
    expect(family.dark[THEME_BRAND]).toBe(true);
    expect(isThemeFamily(family)).toBe(true);
  });

  it("maps token keys to long CSS var names", () => {
    const family = createTheme({ accent: "#14b8a6", weekend: "#be123c" });
    expect(family.light.vars["--c-accent"]).toBe("#14b8a6");
    expect(family.light.vars["--c-weekend"]).toBe("#be123c");
    // Full 16-var contract present (base seeds fill the rest).
    for (const cssVar of Object.values(TOKEN_TO_VAR)) {
      expect(family.light.vars[cssVar]).toBeTruthy();
      expect(family.dark.vars[cssVar]).toBeTruthy();
    }
  });

  it("derives a legible activeText from a light accent (WCAG)", () => {
    const family = createTheme({ accent: "#f5f5dc" });
    expect(family.light.vars["--c-activeText"]).toBe("#111111");
  });

  it("derives a legible activeText from a dark accent (WCAG)", () => {
    const family = createTheme({ accent: "#0a1525" });
    expect(family.light.vars["--c-activeText"]).toBe("#ffffff");
  });

  it("derives shadow and focusRing from the accent", () => {
    const family = createTheme({ accent: "#14b8a6" });
    expect(family.light.vars["--c-shadow"]).toBe("#14b8a628");
    expect(family.light.vars["--c-focusRing"]).toBe("#14b8a6");
  });

  it("explicit tokens win over derived ones", () => {
    const family = createTheme({
      accent: "#14b8a6",
      activeText: "#123456",
      shadow: "#00000010",
    });
    expect(family.light.vars["--c-activeText"]).toBe("#123456");
    expect(family.light.vars["--c-shadow"]).toBe("#00000010");
  });

  it("light/dark overrides apply per side on top of common tokens", () => {
    const family = createTheme({
      accent: "#14b8a6",
      light: { backdrop: "#f0fdff" },
      dark: { backdrop: "#061a1d", text: "#e6fffb" },
    });
    expect(family.light.vars["--c-backdrop"]).toBe("#f0fdff");
    expect(family.dark.vars["--c-backdrop"]).toBe("#061a1d");
    expect(family.dark.vars["--c-text"]).toBe("#e6fffb");
    // Common accent shared by both sides.
    expect(family.dark.vars["--c-accent"]).toBe("#14b8a6");
  });

  it("rejects non-family objects via the guard", () => {
    expect(isThemeFamily({ kind: "family", light: {}, dark: {} })).toBe(false);
    expect(isThemeFamily("noir")).toBe(false);
    expect(isThemeFamily(null)).toBe(false);
  });
});

describe("themeFamilyToVars", () => {
  it("merges sides into light-dark() and collapses equal values", () => {
    const family = createTheme({
      accent: "#14b8a6",
      light: { backdrop: "#ffffff" },
      dark: { backdrop: "#111111" },
    });
    const vars = themeFamilyToVars(family);
    expect(vars["--c-accent"]).toBe("#14b8a6");
    expect(vars["--c-backdrop"]).toBe("light-dark(#ffffff, #111111)");
  });
});

describe("generated themes.css", () => {
  const css = readFileSync("./src/styles/themes.css", "utf8");

  it("ships all 28 v2 families", () => {
    const FAMILIES = [
      "noir",
      "espresso",
      "meadow",
      "fjord",
      "velvet",
      "crimson",
      "solar",
      "nebula",
      "neon",
      "prism",
      "slate",
      "pearl",
      "sandstone",
      "bauhaus",
      "monsoon",
      "industrial",
      "snow",
      "eclipse",
      "chalk",
      "temporal",
      "riso",
      "cyber",
      "split",
      "aurora",
      "graphite",
      "dracula",
      "mint",
      "abyss",
    ];
    for (const name of FAMILIES) {
      expect(css, `missing family ${name}`).toContain(`[data-theme="${name}"]`);
    }
    expect(css.match(/\[data-theme="/g)).toHaveLength(FAMILIES.length);
  });

  it("every family block carries the required token contract", () => {
    // todayDot is intentionally omitted from generated themes — CSS defaults to
    // var(--c-accent). Themes may still set it via createTheme for custom colors.
    const OPTIONAL_VARS = new Set(["--c-todayDot"]);
    const required = Object.values(TOKEN_TO_VAR).filter(
      (v) => !OPTIONAL_VARS.has(v),
    );
    const blocks = css.split("[data-theme=").slice(1);
    for (const block of blocks) {
      const body = block.slice(0, block.indexOf("}"));
      for (const cssVar of required) {
        expect(body, `missing ${cssVar} in ${block.slice(0, 12)}`).toContain(
          `${cssVar}:`,
        );
      }
    }
  });

  it("stays inside the cal-themes layer with no !important", () => {
    expect(css).toContain("@layer cal-themes");
    expect(css).not.toContain("!important");
  });
});
