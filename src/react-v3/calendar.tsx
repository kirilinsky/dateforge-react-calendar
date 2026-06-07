import "../styles-v3/layers.css";
import { CalendarProvider, type CalendarProviderProps } from "./provider";

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
  /** Theme name, or `"auto"` to follow the OS. Rendered as `data-theme`. */
  theme?: string;
  /** Extra class on the root shell (user escape hatch). */
  className?: string;
  /** Test handle on the root. Default `"dateforge-calendar"`. */
  "data-testid"?: string;
};

export function Calendar({
  theme = "auto",
  className,
  "data-testid": testId = "dateforge-calendar",
  children,
  ...providerProps
}: CalendarProps) {
  const readOnly = providerProps.config.readOnly;
  return (
    <CalendarProvider {...providerProps}>
      <div
        data-dateforge-root=""
        data-theme={theme}
        data-readonly={readOnly ? "" : undefined}
        data-testid={testId}
        className={className}
      >
        {children}
      </div>
    </CalendarProvider>
  );
}
