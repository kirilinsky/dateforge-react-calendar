import "../styles/tokens.css";
import "../styles/layers.css";
import "../styles/themes.css";
import "../styles/appearances.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LabelOverrides } from "../core/labels";
import { today } from "../core/timezone-boundary";
import { warnOnce } from "../core/warnings";
import {
  type CalendarAppearance,
  resolveAppearance,
} from "../styles/appearance-tokens";
import type { ThemeFamily } from "../styles/theme-tokens";
import { CalendarAnnouncer } from "./announcer";
import { resolveInitialFocus, useFirstFocus } from "./focus-manager";
import { LabelsProvider } from "./labels-context";
import { CalendarProvider, type CalendarProviderProps } from "./provider";
import { resolveThemeScope, ThemeScopeProvider } from "./theme-scope";
import { type SchemeMode, UIProvider } from "./ui-context";

/**
 * The v3 root: the visual shell plus the store provider. It renders the single
 * grid container every module places itself into (`@container cal-root`), tags
 * it with `data-theme` / `data-readonly` / `data-testid`, and wraps the children
 * in a `CalendarProvider`. The provider sits OUTSIDE the DOM node so the store
 * is available to the shell's descendants.
 *
 * Styling is data-attribute + token driven (see styles/layers.css): the shell
 * carries neutral `--c-*` defaults that a theme overrides in the `cal-themes`
 * layer.
 */
export type CalendarProps = CalendarProviderProps & {
  /**
   * Theme: built-in family name (e.g. `"noir"`, rendered as `data-theme`) or
   * a `createTheme` token object (applied as inline light-dark() CSS vars).
   */
  theme?: string | ThemeFamily;
  /**
   * Appearance — the non-color visual axis (shape, spacing, motion). A built-in
   * name (e.g. `"zenith"`, rendered as `data-appearance`) or a
   * `createAppearance` token object (inline `--cal-*` vars). Omit for the v3
   * default look. Independent of `theme` (colors).
   */
  appearance?: CalendarAppearance;
  /**
   * Root grid columns. A number → that many equal `minmax(0, 1fr)` tracks; a
   * string → a raw `grid-template-columns` value. Modules place themselves with
   * their `col` prop (`col={2}` spans 2, `col="1 / 3"` raw). Omit for the
   * default single column (modules stack). Parent declares `cols`, children get
   * `col` — same mental model as CSS Grid.
   */
  cols?: number | string;
  /**
   * Decorative gradient mode (v2 parity): soft accent glows in the shell's
   * corners and a gradient fill on selected cells. Pure CSS, token-driven —
   * follows the active theme and scheme. Default `false`.
   */
  gradient?: boolean;
  /** Light/dark choice. `"auto"` (default) follows the OS via `color-scheme`. */
  scheme?: SchemeMode;
  /**
   * Controlled scheme. Provide together with `scheme` to own the light/dark
   * choice: the toolbar theme toggle calls this with the next resolved scheme
   * instead of flipping internal state. Omit for uncontrolled (the toggle owns
   * the flip, seeded from `scheme`).
   */
  onSchemeChange?: (scheme: "light" | "dark") => void;
  /** Extra class on the root shell (user escape hatch). */
  className?: string;
  /** `id` on the root shell (label targets, anchors). */
  id?: string;
  /** Inline style on the root shell — merged over theme/appearance vars. */
  style?: React.CSSProperties;
  /** Test handle on the root. Default `"dateforge-calendar"`. */
  "data-testid"?: string;
  /** Root-level aria label overrides (module → root → English default). */
  labels?: LabelOverrides;
};

export function Calendar({
  theme = "noir",
  appearance,
  cols,
  gradient = false,
  scheme = "auto",
  onSchemeChange,
  className,
  id,
  style,
  "data-testid": testId = "dateforge-calendar",
  labels,
  children,
  ...providerProps
}: CalendarProps) {
  const { config, initialView, initialFocus } = providerProps;
  const readOnly = config.readOnly;

  // Runtime light/dark. Controlled when `onSchemeChange` is given (the host owns
  // `scheme`); otherwise uncontrolled, seeded from the prop and flipped here.
  // `"auto"` keeps the CSS-native first paint — only an explicit toggle pins a
  // concrete value, so dark systems never flash light.
  const controlled = onSchemeChange !== undefined;
  const [internalScheme, setInternalScheme] = useState<SchemeMode>(scheme);
  const activeScheme = controlled ? scheme : internalScheme;
  // Uncontrolled `scheme` is a SEED: a later prop change is silently ignored,
  // which reads as a bug from the host's side — say so once in dev. In an
  // effect, not render: concurrent React may replay/discard renders.
  const seedScheme = useRef(scheme);
  useEffect(() => {
    if (!controlled && seedScheme.current !== scheme) {
      seedScheme.current = scheme;
      warnOnce("schemeChangeIgnored");
    }
  }, [controlled, scheme]);
  const toggleScheme = useCallback(() => {
    const resolved =
      activeScheme === "auto"
        ? typeof window !== "undefined" &&
          window.matchMedia?.("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : activeScheme;
    const next = resolved === "dark" ? "light" : "dark";
    if (onSchemeChange) onSchemeChange(next);
    else setInternalScheme(next);
  }, [activeScheme, onSchemeChange]);

  // The dynamic scheme + appearance ride on ThemeScope too, so portalled popups
  // re-declaring `data-scheme`/`data-appearance` follow the root instead of
  // pinning the mount-time value.
  const themeScope = useMemo(
    () => ({ theme, scheme: activeScheme, appearance }),
    [theme, activeScheme, appearance],
  );
  const { dataTheme, style: themeStyle } = useMemo(
    () => resolveThemeScope(theme),
    [theme],
  );
  const { dataAppearance, style: appearanceStyle } = useMemo(
    () => resolveAppearance(appearance),
    [appearance],
  );
  // `cols`: a number → a SMART grid: up to N equal tracks on wide containers,
  // collapsing N → … → 1 when a track would drop below the per-column floor
  // (`--cal-cols-min`, default 14em ≈ a comfortable month) — side-by-side
  // months stack into a column on phones instead of squeezing. `auto-fit` +
  // a min of max(floor, fair-share) keeps EXACTLY N columns whenever they
  // genuinely fit (the fair share stops an N+1th track from sneaking in).
  // Set `--cal-cols-min: 0px` on the root to opt back into fixed N tracks.
  // A string stays a raw `grid-template-columns`. Omitted → single implicit
  // column (modules stack). Mirrors the toolbar's own `cols`.
  const colCount =
    typeof cols === "number" ? Math.max(1, Math.floor(cols)) : undefined;
  const gridTemplateColumns =
    cols === undefined
      ? undefined
      : colCount !== undefined
        ? `repeat(auto-fit, minmax(min(100%, max(var(--cal-cols-min, 14em), calc((100% - ${
            colCount - 1
          } * var(--c-gap, 8px)) / ${colCount}))), 1fr))`
        : cols;
  const rootStyle = useMemo(
    () => ({
      ...themeStyle,
      ...appearanceStyle,
      ...(gridTemplateColumns ? { gridTemplateColumns } : undefined),
      // Smart numeric cols only: a child spanning more tracks than currently
      // fit would otherwise manufacture auto-sized implicit tracks and blow
      // the grid past the container on the very phones the collapse serves.
      // Zero-width implicit tracks neutralize stray spans (col="full" is the
      // recommended full-row form).
      ...(colCount !== undefined ? { gridAutoColumns: "0px" } : undefined),
      ...style,
    }),
    [themeStyle, appearanceStyle, gridTemplateColumns, style],
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
          <UIProvider scheme={activeScheme} toggleScheme={toggleScheme}>
            <div
              ref={rootRef}
              id={id}
              data-dateforge-root=""
              data-theme={dataTheme}
              data-appearance={dataAppearance}
              data-scheme={activeScheme}
              data-gradient={gradient ? "" : undefined}
              data-readonly={readOnly ? "" : undefined}
              data-testid={testId}
              className={className}
              style={rootStyle}
            >
              {children}
              <CalendarAnnouncer />
            </div>
          </UIProvider>
        </LabelsProvider>
      </ThemeScopeProvider>
    </CalendarProvider>
  );
}
