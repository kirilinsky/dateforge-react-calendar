import type { ThemeTokens } from "../../themes/themes";
export type { ThemeTokens };

export type CustomTheme = {
  readonly __type: "custom";
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
] as const;

export type BuiltInTheme = "auto" | "light" | "dark";

 export type CalendarTheme =
  | BuiltInTheme
  | (typeof LIGHT_THEMES)[number]
  | (typeof DARK_THEMES)[number]
  | CustomTheme
  | (string & {});
