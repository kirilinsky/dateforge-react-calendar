import { TOKEN_TO_VAR } from "../types/theme-tokens";
import type {
  ThemeFamily,
  ThemeMode,
  ThemeTokens,
  ThemeVariant,
} from "../types/themes";
import { CUSTOM_THEME_BRAND } from "../types/themes";

type ThemeVariantInput = Partial<ThemeTokens>;
type ThemeFamilyInput = Partial<ThemeTokens> & {
  light?: ThemeVariantInput;
  dark?: ThemeVariantInput;
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

const hexToRgb = (hex: string): [number, number, number] | null => {
  const value = hex.replace("#", "");
  const normalized =
    value.length === 3
      ? Array.from(value, (char) => `${char}${char}`).join("")
      : value;
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
  return [0, 2, 4].map((i) =>
    Number.parseInt(normalized.slice(i, i + 2), 16),
  ) as [number, number, number];
};

const channelToLinear = (value: number): number => {
  const normalized = value / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string): number | null => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [red, green, blue] = rgb.map(channelToLinear);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const contrastRatio = (foreground: string, background: string): number => {
  const fg = luminance(foreground);
  const bg = luminance(background);
  if (fg == null || bg == null) return 0;
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
};

const bestTextOn = (background: string, fallback: string): string => {
  const darkContrast = contrastRatio("#111111", background);
  const lightContrast = contrastRatio("#ffffff", background);
  if (darkContrast === 0 && lightContrast === 0) return fallback;
  return darkContrast >= lightContrast ? "#111111" : "#ffffff";
};

const shadowFrom = (highlight: string, fallback: string): string =>
  hexToRgb(highlight) ? `${highlight.slice(0, 7)}28` : fallback;

function deriveSeedTokens(
  base: ThemeTokens,
  commonTokens: Partial<ThemeTokens>,
  theme: ThemeVariantInput | undefined,
): Partial<ThemeTokens> {
  const variantTokens = theme ?? {};
  const highlight = variantTokens.highlight ?? commonTokens.highlight;
  if (!highlight) return {};

  const derived: Partial<ThemeTokens> = {};
  if (commonTokens.activeText == null && variantTokens.activeText == null) {
    derived.activeText = bestTextOn(highlight, base.activeText);
  }
  if (commonTokens.todayDot == null && variantTokens.todayDot == null) {
    derived.todayDot =
      derived.activeText ?? bestTextOn(highlight, base.todayDot);
  }
  if (commonTokens.shadow == null && variantTokens.shadow == null) {
    derived.shadow = shadowFrom(highlight, base.shadow);
  }
  return derived;
}

function toThemeVars(
  tokens: Partial<ThemeTokens> | undefined,
): Record<string, string> {
  const vars: Record<string, string> = {};
  if (!tokens) return vars;
  for (const [key, value] of Object.entries(tokens)) {
    const cssVar = TOKEN_TO_VAR[key as keyof ThemeTokens];
    if (cssVar && value != null) vars[cssVar] = value;
  }
  return vars;
}

function fromVars(vars: Record<string, string>): ThemeVariant {
  return { [CUSTOM_THEME_BRAND]: true as const, vars };
}

function toThemeVariant(
  mode: ThemeMode,
  commonTokens: Partial<ThemeTokens>,
  theme: ThemeVariantInput | undefined,
): ThemeVariant {
  const modeVars = toThemeVars(theme);
  const baseTokens = BASE_THEME_TOKENS[mode];
  return fromVars({
    ...toThemeVars(baseTokens),
    ...toThemeVars(commonTokens),
    ...toThemeVars(deriveSeedTokens(baseTokens, commonTokens, theme)),
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
 *   weekend: "#be123c",
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
