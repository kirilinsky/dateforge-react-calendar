import "../styles-v3/layers.css";
import "../styles-v3/themes.css";
import { useMemo } from "react";
import { CalendarProvider, type CalendarProviderProps } from "./provider";
import { ThemeScopeProvider } from "./theme-scope";
import { UIProvider } from "./ui-context";

/**
 * The v3 root: the visual shell plus the store provider. It renders the single
 * grid container every module places itself into (`@container cal-root`), tags
 * it with `data-theme` / `data-readonly` / `data-testid`, and wraps the children
 * in a `CalendarProvider`. The provider sits OUTSIDE the DOM node so the store
 * is available to the shell's descendants.
 *
 * Styling is data-attribute + token driven (see styles-v3/layers.css): the shell
 * carries neutral `--c-*` defaults that a theme overrides in the `cal-themes`
 * layer.
 */
export type CalendarProps = CalendarProviderProps & {
  /** Theme family name (e.g. `"noir"`). Rendered as `data-theme`. */
  theme?: string;
  /** Light/dark choice. `"auto"` (default) follows the OS via `color-scheme`. */
  scheme?: "light" | "dark" | "auto";
  /** Extra class on the root shell (user escape hatch). */
  className?: string;
  /** Test handle on the root. Default `"dateforge-calendar"`. */
  "data-testid"?: string;
};

export function Calendar({
  theme = "noir",
  scheme = "auto",
  className,
  "data-testid": testId = "dateforge-calendar",
  children,
  ...providerProps
}: CalendarProps) {
  const readOnly = providerProps.config.readOnly;
  const themeScope = useMemo(() => ({ theme, scheme }), [theme, scheme]);
  return (
    <CalendarProvider {...providerProps}>
      <ThemeScopeProvider value={themeScope}>
        <UIProvider>
          <div
            data-dateforge-root=""
            data-theme={theme}
            data-scheme={scheme}
            data-readonly={readOnly ? "" : undefined}
            data-testid={testId}
            className={className}
          >
            {children}
          </div>
        </UIProvider>
      </ThemeScopeProvider>
    </CalendarProvider>
  );
}
