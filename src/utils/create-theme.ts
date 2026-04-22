import { TOKEN_TO_VAR } from "../../themes/themes";
import { CUSTOM_THEME_BRAND } from "../types/themes";
import type { ThemeTokens, CustomTheme } from "../types/themes";

/**
 * create custom theme from prop tokens
 * use result as prop `theme` for Calendar
 *
 * @example
 * const myTheme = createTheme({ highlight: "#ff6600", accent: "#fff" }, "light");
 * <Calendar theme={myTheme} />
 */
export function createTheme(
  tokens: Partial<ThemeTokens>,
  base: "light" | "dark" = "light",
): CustomTheme {
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(tokens)) {
    const cssVar = TOKEN_TO_VAR[key as keyof ThemeTokens];
    if (cssVar && value != null) vars[cssVar] = value;
  }
  return { [CUSTOM_THEME_BRAND]: true as const, base, vars };
}
