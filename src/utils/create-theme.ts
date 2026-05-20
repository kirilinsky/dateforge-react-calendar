import { TOKEN_TO_VAR } from "../types/theme-tokens";
import type {
  CustomTheme,
  ThemeFamily,
  ThemeMode,
  ThemeTokens,
} from "../types/themes";
import { CUSTOM_THEME_BRAND } from "../types/themes";

type ThemeVariantInput = Partial<ThemeTokens> | CustomTheme;
type ThemeFamilyInput = Partial<ThemeTokens> & {
  light: ThemeVariantInput;
  dark: ThemeVariantInput;
};

const BASE_THEME_TOKENS: Record<ThemeMode, ThemeTokens> = {
  light: {
    accent: "#ffffff",
    activeText: "#ffffff",
    todayDot: "#ffffff",
    backdrop: "#ffffff",
    highlight: "#1a1a1c",
    tone: "#f4f4f4",
    text: "#1a1a1c",
    stroke: "#e8e8e8",
    shadow: "#1a1a1c14",
    disabled: "#a0a0a2",
    mutedText: "#6e6e6f",
    disabledText: "#686869",
    weekend: "#c62828",
    range: "#4a90d9",
    error: "#dc2626",
  },
  dark: {
    accent: "#1a1a1c",
    activeText: "#1a1a1c",
    todayDot: "#1a1a1c",
    backdrop: "#1a1a1c",
    highlight: "#ffffff",
    tone: "#2d2d2d",
    text: "#f0f0f0",
    stroke: "#333333",
    shadow: "#ffffff16",
    disabled: "#555558",
    mutedText: "#969697",
    disabledText: "#9c9c9d",
    weekend: "#ff6b6b",
    range: "#4a90d9",
    error: "#ef4444",
  },
};

const isCustomTheme = (theme: ThemeVariantInput): theme is CustomTheme =>
  typeof theme === "object" && theme !== null && CUSTOM_THEME_BRAND in theme;

function toThemeVars(tokens: Partial<ThemeTokens>): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(tokens)) {
    const cssVar = TOKEN_TO_VAR[key as keyof ThemeTokens];
    if (cssVar && value != null) vars[cssVar] = value;
  }
  return vars;
}

function fromVars(vars: Record<string, string>): CustomTheme {
  return { [CUSTOM_THEME_BRAND]: true as const, vars };
}

function toThemeVariant(
  mode: ThemeMode,
  commonTokens: Partial<ThemeTokens>,
  theme: ThemeVariantInput,
): CustomTheme {
  const modeVars = isCustomTheme(theme) ? theme.vars : toThemeVars(theme);
  return fromVars({
    ...toThemeVars(BASE_THEME_TOKENS[mode]),
    ...toThemeVars(commonTokens),
    ...modeVars,
  });
}

/**
 * create one logical theme with light and dark variants.
 * use result as prop `theme` for Calendar
 *
 * @example
 * const myTheme = createTheme({
 *   highlight: "#14b8a6",
 *   range: "#0ea5e9",
 *   light: { backdrop: "#f0fdff" },
 *   dark: { backdrop: "#061a1d", text: "#e6fffb" },
 * });
 * <Calendar theme={myTheme} />
 */
export function createTheme(theme: ThemeFamilyInput): ThemeFamily {
  const { light, dark, ...commonTokens } = theme;
  return {
    kind: "family",
    light: toThemeVariant("light", commonTokens, light),
    dark: toThemeVariant("dark", commonTokens, dark),
  };
}
