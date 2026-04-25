import type { ThemeTokens } from "../../themes/themes";
export type { ThemeTokens };

export const CUSTOM_THEME_BRAND = Symbol.for("rcd.theme.custom");

export type CustomTheme = {
  readonly [CUSTOM_THEME_BRAND]: true;
  readonly vars: Record<string, string>;
};

export type BuiltInTheme = "auto" | "light" | "dark";

export type CalendarTheme = BuiltInTheme | CustomTheme;
