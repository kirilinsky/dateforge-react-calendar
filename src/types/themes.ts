export const LIGHT_THEMES = [
  "paper",
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
] as const;
export const DARK_THEMES = [
  "industrial",
  "carbon",
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
] as const;

export type CalendarTheme =
  | (typeof LIGHT_THEMES)[number]
  | (typeof DARK_THEMES)[number];
