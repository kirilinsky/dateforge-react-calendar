import { createContext, useContext } from "react";
import {
  isThemeFamily,
  type ThemeFamily,
  themeFamilyToVars,
} from "../styles-v3/theme-tokens";

/**
 * The active theme/scheme, shared so portalled UI (popups rendered into
 * document.body, outside the root shell) can re-declare `data-theme` /
 * `data-scheme` on itself and resolve the same `--c-*` tokens. Without this a
 * portalled popup would fall back to the neutral defaults.
 */
export type ThemeScope = {
  /** Built-in family name, or a `createTheme` token object. */
  theme: string | ThemeFamily;
  scheme: "light" | "dark" | "auto";
};

export type ResolvedThemeScope = {
  /** `data-theme` attribute value (built-in name; absent for token objects). */
  dataTheme?: string;
  /** Inline `--c-*` vars (token objects only; values use light-dark()). */
  style?: Record<string, string>;
};

/**
 * One resolver for every themed surface (root shell, portalled popups).
 * A name rides on `data-theme` and resolves via the generated cal-themes CSS;
 * a `createTheme` family is applied as inline light-dark() vars, so it follows
 * the same `color-scheme` mechanism with zero JS mode tracking.
 */
export function resolveThemeScope(
  theme: string | ThemeFamily,
): ResolvedThemeScope {
  if (typeof theme === "string") return { dataTheme: theme };
  if (isThemeFamily(theme)) return { style: themeFamilyToVars(theme) };
  return {};
}

const ThemeScopeContext = createContext<ThemeScope>({
  theme: "noir",
  scheme: "auto",
});

export const ThemeScopeProvider = ThemeScopeContext.Provider;

export function useThemeScope(): ThemeScope {
  return useContext(ThemeScopeContext);
}
