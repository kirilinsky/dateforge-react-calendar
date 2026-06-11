import { createContext, useContext } from "react";

/**
 * The active theme/scheme, shared so portalled UI (popups rendered into
 * document.body, outside the root shell) can re-declare `data-theme` /
 * `data-scheme` on itself and resolve the same `--c-*` tokens. Without this a
 * portalled popup would fall back to the neutral defaults.
 */
export type ThemeScope = {
  theme: string;
  scheme: "light" | "dark" | "auto";
};

const ThemeScopeContext = createContext<ThemeScope>({
  theme: "noir",
  scheme: "auto",
});

export const ThemeScopeProvider = ThemeScopeContext.Provider;

export function useThemeScope(): ThemeScope {
  return useContext(ThemeScopeContext);
}
