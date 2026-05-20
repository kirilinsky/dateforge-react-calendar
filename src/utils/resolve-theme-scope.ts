import type React from "react";
import type {
  BuiltInTheme,
  CalendarTheme,
  ThemeFamily,
  ThemeMode,
  ThemeVariant,
} from "@/types/themes";
import { CUSTOM_THEME_BRAND } from "@/types/themes";

export const isThemeVariant = (theme: unknown): theme is ThemeVariant =>
  typeof theme === "object" &&
  theme !== null &&
  CUSTOM_THEME_BRAND in (theme as object);

export const isThemeFamily = (theme: unknown): theme is ThemeFamily =>
  typeof theme === "object" &&
  theme !== null &&
  (theme as { kind?: unknown }).kind === "family" &&
  isThemeVariant((theme as { light?: unknown }).light) &&
  isThemeVariant((theme as { dark?: unknown }).dark);

const isBuiltInTheme = (theme: unknown): theme is BuiltInTheme =>
  theme === "auto" || theme === "light" || theme === "dark";

const activeMode = (theme: BuiltInTheme): ThemeMode =>
  theme === "dark" ? "dark" : "light";

export type ResolvedThemeScope = {
  dataTheme?: BuiltInTheme;
  style?: React.CSSProperties;
};

export function resolveThemeScope(
  theme: CalendarTheme | undefined,
  activeTheme: BuiltInTheme,
): ResolvedThemeScope {
  if (theme == null) return {};
  if (isBuiltInTheme(theme)) return { dataTheme: theme };
  if (isThemeFamily(theme)) {
    const mode = activeMode(activeTheme);
    return {
      dataTheme: mode,
      style: theme[mode].vars as React.CSSProperties,
    };
  }
  return {};
}
