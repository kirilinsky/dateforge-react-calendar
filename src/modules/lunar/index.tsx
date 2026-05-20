import type React from "react";
import "@/styles/layers.css";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import { useSelectionValue } from "@/context/selection-context";
import { useUI } from "@/context/ui-context";
import type { CalendarTheme } from "@/types/themes";
import { isSameDay } from "@/utils/date-core";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { getDateTimeFormat } from "@/utils/intl-cache";
import { resolveThemeScope } from "@/utils/resolve-theme-scope";
import type { LunarPhaseKey as LunarPhaseKeyForIcon } from "./helpers";
import {
  buildLunarWindow,
  getLunarPhaseKey,
  LUNAR_PHASE_ABBR,
  LUNAR_PHASE_LONG,
  type LunarPhaseKey,
} from "./helpers";
import styles from "./lunar.module.css";

// All 8 illuminated paths share the same SVG frame. Stacking them lets us
// crossfade between phases via CSS opacity (driven by the cell's
// `data-phase` attribute) without remounting any element — keeps the
// transition smooth and free of opacity flicker.
const PHASE_PATHS: Record<LunarPhaseKeyForIcon, string | null> = {
  new: null,
  "waxing-crescent": "M12 3 A9 9 0 0 1 12 21 A4.5 9 0 0 0 12 3 Z",
  "first-quarter": "M12 3 A9 9 0 0 1 12 21 Z",
  "waxing-gibbous": "M12 3 A9 9 0 0 1 12 21 A4.5 9 0 0 1 12 3 Z",
  full: "M12 3 A9 9 0 0 1 12 21 A9 9 0 0 1 12 3 Z",
  "waning-gibbous": "M12 3 A9 9 0 0 0 12 21 A4.5 9 0 0 0 12 3 Z",
  "last-quarter": "M12 3 A9 9 0 0 0 12 21 Z",
  "waning-crescent": "M12 3 A9 9 0 0 0 12 21 A4.5 9 0 0 1 12 3 Z",
};

const MoonStack: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeOpacity="0.35"
      strokeWidth="1.4"
    />
    {(Object.keys(PHASE_PATHS) as LunarPhaseKeyForIcon[]).map((key) => {
      const d = PHASE_PATHS[key];
      if (!d) return null;
      return (
        <path key={key} d={d} fill="currentColor" data-phase-layer={key} />
      );
    })}
  </svg>
);

export interface CalendarLunarProps {
  /**
   * CSS grid `grid-column` value.
   */
  col?: number | string;
  theme?: CalendarTheme;
  /**
   * aria-label for the strip wrapper. Defaults to localized "Lunar phases"
   * (English fallback — Intl has no lunar vocabulary; pass an explicit
   * string for full localization).
   */
  lunarLabel?: string;
  /**
   * Short visible phase labels. Default: NASA-style abbreviations
   * (`NEW`, `WAX CRES`, `FIRST QTR`, `WAX GIB`, `FULL`, `WAN GIB`,
   * `LAST QTR`, `WAN CRES`). Pass a partial map to localize per-phase.
   * Use `false` (or pass empty strings) to hide labels.
   */
  phaseLabels?: false | Partial<Record<LunarPhaseKey, string>>;
  /**
   * Long phase names used in `aria-label` per cell. Override per locale.
   * Defaults to English long names.
   */
  phaseAriaLabels?: Partial<Record<LunarPhaseKey, string>>;
}

// The strip always renders 21 cells (anchor at index 10). CSS container
// queries reveal a symmetric subset that fits the available width — see
// `lunar.module.css`. Fixed DOM count keeps the layout stable and avoids
// ResizeObserver.
const LUNAR_WINDOW_DAYS = 21;

export const CalendarLunar: React.FC<CalendarLunarProps> = ({
  col,
  theme,
  lunarLabel = "Lunar phases",
  phaseLabels,
  phaseAriaLabels,
}) => {
  const { locale, timeZone } = useConfig();
  const { viewDate } = useNavigation();
  const { selectedDates, rangeStart, rangeEnd } = useSelectionValue();
  const { activeTheme } = useUI();
  const themeScope = resolveThemeScope(theme, activeTheme);

  const anchor = selectedDates[0] ?? rangeEnd ?? rangeStart ?? viewDate;
  const window = buildLunarWindow(anchor, LUNAR_WINDOW_DAYS);

  const dayFmt = getDateTimeFormat(locale, {
    day: "numeric",
    ...(timeZone && { timeZone }),
  });
  const fullFmt = getDateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(timeZone && { timeZone }),
  });

  const resolveLabel = (key: LunarPhaseKey): string | null => {
    if (phaseLabels === false) return null;
    const override = phaseLabels?.[key];
    if (override === "") return null;
    return override ?? LUNAR_PHASE_ABBR[key];
  };
  const resolveAria = (key: LunarPhaseKey): string =>
    phaseAriaLabels?.[key] ?? LUNAR_PHASE_LONG[key];

  return (
    <div
      data-area="lunar"
      className={styles.container}
      data-theme={themeScope.dataTheme}
      style={{ ...getGridSlotStyle(col), ...themeScope.style }}
    >
      <div className={styles.strip} role="group" aria-label={lunarLabel}>
        {window.map((d, idx) => {
          const phase = getLunarPhaseKey(d);
          const isAnchor = isSameDay(d, anchor);
          const dayNum = dayFmt.format(d);
          const phaseLabel = resolveLabel(phase);
          const ariaPhase = resolveAria(phase);
          const ariaDate = fullFmt.format(d);
          return (
            // Cell keyed by position so the inner icon can remount per phase
            // change (key={phase}) — that drives a CSS scale+fade animation
            // without disturbing the day-number text or container layout.
            <div
              key={idx}
              role="group"
              aria-label={`${ariaDate}, ${ariaPhase}`}
              aria-current={isAnchor ? "date" : undefined}
              data-anchor={isAnchor || undefined}
              data-phase={phase}
              className={`${styles.cell} ${isAnchor ? styles.anchor : ""}`}
            >
              <span className={styles.day} aria-hidden>
                {dayNum}
              </span>
              <span className={styles.icon} aria-hidden>
                <MoonStack />
              </span>
              {phaseLabel && (
                <span className={styles.label} aria-hidden>
                  {phaseLabel}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
