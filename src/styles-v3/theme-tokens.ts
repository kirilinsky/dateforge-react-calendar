/**
 * v3 theme token contract — the single home for color token names and the
 * `createTheme` extension path.
 *
 * Token keys map to long, readable CSS vars (`--c-accent`, not v2's `--c-a`).
 * Three keys were renamed from v2 because the old names lied about their role;
 * everything else carries over 1:1 (migration doc covers the renames):
 *
 *   v2 `highlight` → v3 `accent`     (the brand color / selected-cell fill)
 *   v2 `accent`    → v3 `focusRing`  (focus outline ink; v2 only ever painted
 *                                     it on focus rings and as a deep fallback)
 *   v2 `tone`      → v3 `tone`       (kept — subtle hover/secondary surface)
 */

export type ThemeTokens = {
  /** Brand color: selected cells, active drum items. (v2 `highlight`) */
  accent: string;
  /** Ink on top of `accent` (selected-cell text). */
  activeText: string;
  /** Today marker color. */
  todayDot: string;
  /** Root shell background. */
  backdrop: string;
  /** Subtle surface: hover fills, secondary chips. (v2 `tone`) */
  tone: string;
  /** Main ink. */
  text: string;
  /** Borders and separators. */
  stroke: string;
  /** Shadow color (usually the accent at low alpha). */
  shadow: string;
  /** Disabled surface. */
  disabled: string;
  /** Secondary ink (out-of-focus labels). */
  mutedText: string;
  /** Disabled ink. */
  disabledText: string;
  /** Weekend ink — themes ship reds/oranges; surfaces derive tints from it. */
  weekend: string;
  /** Range fill color. */
  range: string;
  /** Validation/error ink. */
  error: string;
  /** Ink for days outside the viewed month. */
  outOfMonth?: string;
  /** Focus outline ink. Derived from `activeText` when omitted. (v2 `accent`) */
  focusRing?: string;
};

export const TOKEN_TO_VAR: Record<keyof ThemeTokens, string> = {
  accent: "--c-accent",
  activeText: "--c-activeText",
  todayDot: "--c-todayDot",
  backdrop: "--c-backdrop",
  tone: "--c-tone",
  text: "--c-text",
  stroke: "--c-stroke",
  shadow: "--c-shadow",
  disabled: "--c-disabled",
  mutedText: "--c-mutedText",
  disabledText: "--c-disabledText",
  weekend: "--c-weekend",
  range: "--c-range",
  error: "--c-error",
  outOfMonth: "--c-outOfMonth",
  focusRing: "--c-focusRing",
};

/** Brand symbol: marks objects produced by `createTheme` (or the generator). */
export const THEME_BRAND = Symbol.for("dateforge.v3.theme");

export type ThemeVariant = {
  [THEME_BRAND]: true;
  vars: Record<string, string>;
};

export type ThemeFamily = {
  kind: "family";
  light: ThemeVariant;
  dark: ThemeVariant;
};

export type ThemeMode = "light" | "dark";

const isThemeVariant = (value: unknown): value is ThemeVariant =>
  typeof value === "object" && value !== null && THEME_BRAND in value;

export const isThemeFamily = (value: unknown): value is ThemeFamily =>
  typeof value === "object" &&
  value !== null &&
  (value as { kind?: unknown }).kind === "family" &&
  isThemeVariant((value as { light?: unknown }).light) &&
  isThemeVariant((value as { dark?: unknown }).dark);

/**
 * Merge a family's light/dark vars into one `light-dark()` set. The active
 * side follows the root's `color-scheme` (set by the `scheme` prop), so a
 * custom family needs no JS to flip with the OS — same mechanism as the
 * generated built-in themes.
 */
export function themeFamilyToVars(family: ThemeFamily): Record<string, string> {
  const out: Record<string, string> = {};
  const { light, dark } = family;
  for (const key of Object.keys(light.vars)) {
    const l = light.vars[key];
    const d = dark.vars[key] ?? l;
    out[key] = l === d ? l : `light-dark(${l}, ${d})`;
  }
  for (const key of Object.keys(dark.vars)) {
    if (!(key in out))
      out[key] = `light-dark(${dark.vars[key]}, ${dark.vars[key]})`;
  }
  return out;
}

// ── createTheme ──────────────────────────────────────────────────────────────

type ThemeVariantInput = Partial<ThemeTokens>;
export type ThemeFamilyInput = Partial<ThemeTokens> & {
  light?: ThemeVariantInput;
  dark?: ThemeVariantInput;
};

/** Neutral per-mode seeds; user tokens land on top. (Ported from v2.) */
const BASE_THEME_TOKENS: Record<ThemeMode, ThemeTokens> = {
  light: {
    accent: "#1a1a1c",
    activeText: "#ffffff",
    todayDot: "#ffffff",
    backdrop: "#ffffff",
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
    outOfMonth: "#686869",
    focusRing: "#1a1a1c",
  },
  dark: {
    accent: "#ffffff",
    activeText: "#1a1a1c",
    todayDot: "#1a1a1c",
    backdrop: "#1a1a1c",
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
    outOfMonth: "#9c9c9d",
    focusRing: "#f0f0f0",
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

const shadowFrom = (accent: string, fallback: string): string =>
  hexToRgb(accent) ? `${accent.slice(0, 7)}28` : fallback;

/**
 * WCAG-driven seeds: when the user gives an `accent` but no `activeText` /
 * `todayDot` / `shadow` / `focusRing`, derive legible companions instead of
 * falling back to neutrals that may clash.
 */
function deriveSeedTokens(
  base: ThemeTokens,
  commonTokens: Partial<ThemeTokens>,
  variant: ThemeVariantInput | undefined,
): Partial<ThemeTokens> {
  const variantTokens = variant ?? {};
  const accent = variantTokens.accent ?? commonTokens.accent;
  if (!accent) return {};

  const derived: Partial<ThemeTokens> = {};
  if (commonTokens.activeText == null && variantTokens.activeText == null) {
    derived.activeText = bestTextOn(accent, base.activeText);
  }
  if (commonTokens.todayDot == null && variantTokens.todayDot == null) {
    derived.todayDot = derived.activeText ?? bestTextOn(accent, base.todayDot);
  }
  if (commonTokens.shadow == null && variantTokens.shadow == null) {
    derived.shadow = shadowFrom(accent, base.shadow);
  }
  if (commonTokens.focusRing == null && variantTokens.focusRing == null) {
    derived.focusRing = accent;
  }
  return derived;
}

export function tokensToVars(
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

function toThemeVariant(
  mode: ThemeMode,
  commonTokens: Partial<ThemeTokens>,
  variant: ThemeVariantInput | undefined,
): ThemeVariant {
  const baseTokens = BASE_THEME_TOKENS[mode];
  return {
    [THEME_BRAND]: true,
    vars: {
      ...tokensToVars(baseTokens),
      ...tokensToVars(commonTokens),
      ...tokensToVars(deriveSeedTokens(baseTokens, commonTokens, variant)),
      ...tokensToVars(variant),
    },
  };
}

/**
 * Create one logical theme with light and dark variants. Top-level tokens are
 * shared; `light` / `dark` override per side. Pass the result as the `theme`
 * prop on `<Calendar>`.
 *
 * @example
 * const tealTheme = createTheme({
 *   accent: "#14b8a6",
 *   range: "#0ea5e9",
 *   weekend: "#be123c",
 *   light: { backdrop: "#f0fdff" },
 *   dark: { backdrop: "#061a1d", text: "#e6fffb" },
 * });
 * <Calendar theme={tealTheme} />
 */
export function createTheme(theme: ThemeFamilyInput): ThemeFamily {
  const { light, dark, ...commonTokens } = theme;
  return {
    kind: "family",
    light: toThemeVariant("light", commonTokens, light),
    dark: toThemeVariant("dark", commonTokens, dark),
  };
}
