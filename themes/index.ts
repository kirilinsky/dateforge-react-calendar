import { THEMES_DATA, TOKEN_TO_VAR, type ThemeTokens } from "./themes";
import { LIGHT_THEMES } from "../src/types/themes";
import type { CustomTheme } from "../src/types/themes";

const LIGHT_SET: ReadonlySet<string> = new Set(LIGHT_THEMES);

function buildTheme(name: string): CustomTheme {
  const tokens = THEMES_DATA[name];
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(tokens)) {
    const cssVar = TOKEN_TO_VAR[key as keyof ThemeTokens];
    if (cssVar) vars[cssVar] = value;
  }
  return { __type: "custom", base: LIGHT_SET.has(name) ? "light" : "dark", vars };
}

export const industrial = buildTheme("industrial");
export const graphite   = buildTheme("graphite");
export const crimson    = buildTheme("crimson");
export const amethyst   = buildTheme("amethyst");
export const cyber      = buildTheme("cyber");
export const espresso   = buildTheme("espresso");
export const ember      = buildTheme("ember");
export const phosphor   = buildTheme("phosphor");
export const midnight   = buildTheme("midnight");
export const sandstone  = buildTheme("sandstone");
export const mint       = buildTheme("mint");
export const rosa       = buildTheme("rosa");
export const snow       = buildTheme("snow");
export const solar      = buildTheme("solar");
export const dracula    = buildTheme("dracula");
export const comfy      = buildTheme("comfy");
export const neon       = buildTheme("neon");
export const temporal   = buildTheme("temporal");
export const latte      = buildTheme("latte");
export const prism      = buildTheme("prism");
export const meadow     = buildTheme("meadow");
export const forest     = buildTheme("forest");
export const nebula     = buildTheme("nebula");
export const aurora     = buildTheme("aurora");
export const slate      = buildTheme("slate");
export const scarlet    = buildTheme("scarlet");
