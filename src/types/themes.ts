import type { ThemeTokens } from "../../themes/themes";
export type { ThemeTokens };

export const CUSTOM_THEME_BRAND = Symbol.for("rcd.theme.custom");

export type CustomTheme = {
  readonly [CUSTOM_THEME_BRAND]: true;
  readonly base: "light" | "dark";
  readonly vars: Record<string, string>;
};

export const LIGHT_THEMES = [
  "mint",
  "comfy",
  "neon",
  "rosa",
  "snow",
  "solar",
  "graphite",
  "amethyst",
  "latte",
  "slate",
  "scarlet",
  "prism",
  "meadow",
  "monsoon",
  "pearl",
  "chalk",
  "split",
  "riso",
] as const;

export const DARK_THEMES = [
  "industrial",
  "midnight",
  "sandstone",
  "phosphor",
  "dracula",
  "cyber",
  "temporal",
  "crimson",
  "forest",
  "nebula",
  "aurora",
  "espresso",
  "ember",
  "flare",
  "void",
] as const;

export type BuiltInTheme = "auto" | "light" | "dark";

 export type CalendarTheme =
  | BuiltInTheme
  | (typeof LIGHT_THEMES)[number]
  | (typeof DARK_THEMES)[number]
  | CustomTheme
  | (string & {});
