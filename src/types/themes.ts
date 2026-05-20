import type { ThemeTokens } from "./theme-tokens";

export type { ThemeTokens };

export const CUSTOM_THEME_BRAND = Symbol.for("rcd.theme.custom");

export type CustomTheme = {
  readonly [CUSTOM_THEME_BRAND]: true;
  readonly vars: Record<string, string>;
};

export type ThemeMode = "light" | "dark";

export type ThemeFamily = {
  readonly kind: "family";
  readonly light: CustomTheme;
  readonly dark: CustomTheme;
};

export type BuiltInTheme = "auto" | "light" | "dark";

export type CalendarTheme = BuiltInTheme | CustomTheme | ThemeFamily;
