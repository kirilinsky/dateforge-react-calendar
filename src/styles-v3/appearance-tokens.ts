/*
 * Appearances — the v3 take on v2's appearance system. An APPEARANCE is the set
 * of NON-COLOR visual tokens: shape (radius), spacing, motion, typography,
 * elevation, opacities. Colors are THEMES (theme-tokens.ts) — a separate axis.
 *
 * Contract ported from the v2 `AppearanceTokens` (src/types/appearances.ts):
 * the same token KEYS map to the same `--cal-*` CSS vars, so v2 appearance
 * sources port over verbatim. A small bridge in layers.css (cal-base) aliases
 * the vars the v3 modules actually consume (`--c-day-radius`, `--c-radius`, …)
 * to the corresponding appearance vars, with the current v3 values as the
 * fallback — so an appearance overrides the look while "no appearance" keeps the
 * v3 default untouched.
 */

export type AppearanceTokens = {
  radius: string;
  containerRadius: string;
  border: string;
  containerGap: string;
  spacing: string;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  transition: string;
  easing: string;
  font: string;
  fontSize: string;
  dayFontSize: string;
  dayWeight: string;
  /**
   * Day cell HEIGHT floor (`min-block-size`), e.g. `"3em"` (roomy) or `"2em"`
   * (tight). Safe — height only; width stays grid-driven so columns never
   * drift from the weekday headers (unlike a per-cell `aspect-ratio`).
   */
  dayHeight: string;
  daysGap: string;
  daysPadding: string;
  popupPadding: string;
  chipSize: string;
  /** UIButton padding (the toolbar/action control box). */
  controlPadding: string;
  /** UIButton border width — separate from the container `border`. */
  controlBorder: string;
  /** UIButton / UITile font-weight. */
  controlWeight: string;
  /**
   * Press feedback: the scale a button/tile shrinks to while `:active`
   * (pressed), e.g. `"0.95"` (a tactile squish) or `"1"` (none). Non-color —
   * shape/motion only. The pressed background is theme-driven and always on; an
   * appearance varies how much it squishes. Mirrors v2's `--cal-press-scale`.
   */
  pressScale: string;
  /** UITile padding (months/years/preset cells, popup picker tiles). */
  tilePadding: string;
  opacityDisabled: string;
  opacityMuted: string;
  opacityHover: string;
  letterSpacing: string;
};

/** Token key → CSS custom property. */
export const APPEARANCE_TOKEN_TO_VAR: Record<keyof AppearanceTokens, string> = {
  radius: "--cal-radius",
  containerRadius: "--cal-container-radius",
  border: "--cal-border",
  containerGap: "--cal-container-gap",
  spacing: "--cal-spacing",
  shadowSm: "--cal-shadow-sm",
  shadowMd: "--cal-shadow-md",
  shadowLg: "--cal-shadow-lg",
  transition: "--cal-transition",
  easing: "--cal-paint-easing",
  font: "--cal-font",
  fontSize: "--cal-font-size",
  dayFontSize: "--cal-text-day",
  dayWeight: "--cal-day-weight",
  dayHeight: "--cal-day-height",
  daysGap: "--cal-days-gap",
  daysPadding: "--cal-days-padding",
  popupPadding: "--cal-popup-padding",
  chipSize: "--cal-size-chip",
  controlPadding: "--cal-control-padding",
  controlBorder: "--cal-control-border",
  controlWeight: "--cal-control-weight",
  pressScale: "--cal-press-scale",
  tilePadding: "--cal-tile-padding",
  opacityDisabled: "--cal-opacity-disabled",
  opacityMuted: "--cal-opacity-muted",
  opacityHover: "--cal-opacity-hover",
  letterSpacing: "--cal-letter-spacing",
};

export const CUSTOM_APPEARANCE_BRAND = Symbol.for(
  "dateforge.appearance.custom",
);

/** A custom appearance built by {@link createAppearance}: inline `--cal-*` vars. */
export type CustomAppearance = {
  readonly [CUSTOM_APPEARANCE_BRAND]: true;
  readonly vars: Readonly<Record<string, string>>;
};

/** Built-in name (`data-appearance`) OR a `createAppearance` token object. */
export type CalendarAppearance = CustomAppearance | (string & {});

export function isCustomAppearance(value: unknown): value is CustomAppearance {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { [CUSTOM_APPEARANCE_BRAND]?: unknown })[
      CUSTOM_APPEARANCE_BRAND
    ] === true
  );
}

/**
 * Build a custom appearance from a partial token set. Pass the result as the
 * `appearance` prop; unknown keys are ignored, so it never throws.
 *
 * @example
 * const tight = createAppearance({ radius: "0.25em", spacing: "0.4em" });
 * <Calendar appearance={tight} />
 */
export function createAppearance(
  tokens: Partial<AppearanceTokens>,
): CustomAppearance {
  const vars: Record<string, string> = {};
  for (const key in tokens) {
    const cssVar = APPEARANCE_TOKEN_TO_VAR[key as keyof AppearanceTokens];
    const value = tokens[key as keyof AppearanceTokens];
    if (cssVar && value != null) vars[cssVar] = value;
  }
  return { [CUSTOM_APPEARANCE_BRAND]: true, vars };
}

export type ResolvedAppearance = {
  /** `data-appearance` attribute value (built-in name). */
  dataAppearance?: string;
  /** Inline `--cal-*` vars (custom appearance only). */
  style?: Record<string, string>;
};

/**
 * One resolver for every appearance surface (root shell, portalled popups).
 * A name rides on `data-appearance` and resolves via the cal-appearances CSS;
 * a `createAppearance` object is applied as inline vars.
 */
export function resolveAppearance(
  appearance?: CalendarAppearance,
): ResolvedAppearance {
  if (appearance == null) return {};
  if (typeof appearance === "string") return { dataAppearance: appearance };
  if (isCustomAppearance(appearance)) return { style: { ...appearance.vars } };
  return {};
}
