import "../styles-v3/tokens.css";
import "../styles-v3/layers.css";
import "../styles-v3/themes.css";
import { useMemo, useRef } from "react";
import type { LabelOverrides } from "../core-v3/labels";
import { today } from "../core-v3/timezone-boundary";
import type { ThemeFamily } from "../styles-v3/theme-tokens";
import { resolveInitialFocus, useFirstFocus } from "./focus-manager";
import { LabelsProvider } from "./labels-context";
import { CalendarProvider, type CalendarProviderProps } from "./provider";
import { resolveThemeScope, ThemeScopeProvider } from "./theme-scope";
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
  /**
   * Theme: built-in family name (e.g. `"noir"`, rendered as `data-theme`) or
   * a `createTheme` token object (applied as inline light-dark() CSS vars).
   */
  theme?: string | ThemeFamily;
  /** Light/dark choice. `"auto"` (default) follows the OS via `color-scheme`. */
  scheme?: "light" | "dark" | "auto";
  /** Extra class on the root shell (user escape hatch). */
  className?: string;
  /** Test handle on the root. Default `"dateforge-calendar"`. */
  "data-testid"?: string;
  /** Root-level aria label overrides (module → root → English default). */
  labels?: LabelOverrides;
};

export function Calendar({
  theme = "noir",
  scheme = "auto",
  className,
  "data-testid": testId = "dateforge-calendar",
  labels,
  children,
  ...providerProps
}: CalendarProps) {
  const { config, initialView, initialFocus } = providerProps;
  const readOnly = config.readOnly;
  const themeScope = useMemo(() => ({ theme, scheme }), [theme, scheme]);
  const { dataTheme, style: themeStyle } = useMemo(
    () => resolveThemeScope(theme),
    [theme],
  );

  // First focus (Focus Manager): resolve once, perform from the root after the
  // grid has mounted. The root div is the query scope for the target day cell.
  const rootRef = useRef<HTMLDivElement>(null);
  const focusTarget = resolveInitialFocus(
    initialFocus,
    initialView ?? today(config.timeZone),
  );
  useFirstFocus(rootRef, focusTarget);

  return (
    <CalendarProvider {...providerProps}>
      <ThemeScopeProvider value={themeScope}>
        <LabelsProvider labels={labels}>
          <UIProvider>
            <div
              ref={rootRef}
              data-dateforge-root=""
              data-theme={dataTheme}
              data-scheme={scheme}
              data-readonly={readOnly ? "" : undefined}
              data-testid={testId}
              className={className}
              style={themeStyle}
            >
              {children}
            </div>
          </UIProvider>
        </LabelsProvider>
      </ThemeScopeProvider>
    </CalendarProvider>
  );
}
