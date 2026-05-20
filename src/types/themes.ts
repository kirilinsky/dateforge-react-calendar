import type { ThemeTokens } from "./theme-tokens";

export type { ThemeTokens };

export const CUSTOM_THEME_BRAND = Symbol.for("rcd.theme.custom");

export type ThemeVariant = {
  readonly [CUSTOM_THEME_BRAND]: true;
  readonly vars: Record<string, string>;
};

export type ThemeMode = "light" | "dark";

export type ThemeFamily = {
  readonly kind: "family";
  readonly light: ThemeVariant;
  readonly dark: ThemeVariant;
};

export type BuiltInTheme = "auto" | "light" | "dark";

export type CalendarTheme = BuiltInTheme | ThemeFamily;
