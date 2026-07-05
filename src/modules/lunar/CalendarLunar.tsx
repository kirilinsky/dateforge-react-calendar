import { useMemo } from "react";
import { useLabels } from "../../react/labels-context";
import { useCalendarStore } from "../../react/provider";
import { useStoreSelector } from "../../react/use-store-selector";
import { getGridSlotStyle } from "../../utils/get-grid-slot-style";
import {
  buildLunarWindow,
  getLunarPhaseKey,
  LUNAR_PHASE_ABBR,
  LUNAR_PHASE_LONG,
  type LunarPhaseKey,
} from "./helpers";
import styles from "./lunar.module.css";

// Public lunar math (v2 exported these types/helpers): rides the lunar bundle.
export {
  buildLunarWindow,
  getLunarFraction,
  getLunarIllumination,
  getLunarPhaseIndex,
  getLunarPhaseKey,
  LUNAR_PHASE_ABBR,
  LUNAR_PHASE_KEYS,
  LUNAR_PHASE_LONG,
  type LunarPhaseIndex,
  type LunarPhaseKey,
} from "./helpers";

export type CalendarLunarProps = {
  /** aria-label for the strip wrapper (registry key `lunar`). */
  lunarLabel?: string;
  /**
   * Short visible phase labels. Default: NASA-style abbreviations. Pass a
   * partial map to localize per-phase; `false` (or empty strings) hides them.
   */
  phaseLabels?: false | Partial<Record<LunarPhaseKey, string>>;
  /** Long phase names for per-cell aria. Override per locale. */
  phaseAriaLabels?: Partial<Record<LunarPhaseKey, string>>;
  /** Per-module theme override (`data-theme` on the module container). */
  theme?: string;
  /** Per-module scheme override (`data-scheme` on the module container). */
  scheme?: "light" | "dark" | "auto";
  col?: number | string;
  className?: string;
};

// The strip always renders 21 cells (anchor at index 10). CSS container
// queries reveal a symmetric subset that fits the available width — fixed DOM
// count keeps the layout stable without ResizeObserver.
const LUNAR_WINDOW = 21;

const PHASE_PATHS: Record<string, string | null> = {
  new: null,
  "waxing-crescent": "M12 3 A9 9 0 0 1 12 21 A4.5 9 0 0 0 12 3 Z",
  "first-quarter": "M12 3 A9 9 0 0 1 12 21 Z",
  "waxing-gibbous": "M12 3 A9 9 0 0 1 12 21 A4.5 9 0 0 1 12 3 Z",
  full: "M12 3 A9 9 0 0 1 12 21 A9 9 0 0 1 12 3 Z",
  "waning-gibbous": "M12 3 A9 9 0 0 0 12 21 A4.5 9 0 0 0 12 3 Z",
  "last-quarter": "M12 3 A9 9 0 0 0 12 21 Z",
  "waning-crescent": "M12 3 A9 9 0 0 0 12 21 A4.5 9 0 0 1 12 3 Z",
};

function MoonStack() {
  return (
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
      {Object.entries(PHASE_PATHS).map(([key, d]) =>
        d ? (
          <path key={key} d={d} fill="currentColor" data-phase-layer={key} />
        ) : null,
      )}
    </svg>
  );
}

export function CalendarLunar({
  lunarLabel,
  phaseLabels,
  phaseAriaLabels,
  theme,
  scheme,
  col,
  className,
}: CalendarLunarProps) {
  const store = useCalendarStore();
  const config = store.getConfig();
  const t = useLabels();

  const selection = useStoreSelector(store, (s) => s.selection);
  const viewDate = useStoreSelector(store, (s) => s.view.viewDate);

  // Anchor priority mirrors v2: first selected date → range end (last bound
  // placed) → range start → the viewed day. Everything stays in the wall-clock
  // domain: cells are local-midnight Dates built straight from CalendarDate
  // fields, so no timezone conversion can shift a day label.
  const anchorDate = useMemo((): Date => {
    if (selection.shape === "point" && selection.dates.length > 0) {
      const d = selection.dates[0].date;
      return new Date(d.year, d.month - 1, d.day);
    }
    if (selection.shape === "span" && selection.ranges.length > 0) {
      const last = selection.ranges[selection.ranges.length - 1];
      const d = last.end ?? last.start;
      return new Date(d.year, d.month - 1, d.day);
    }
    return new Date(viewDate.year, viewDate.month - 1, viewDate.day);
  }, [selection, viewDate]);

  const window = useMemo(
    () => buildLunarWindow(anchorDate, LUNAR_WINDOW),
    [anchorDate],
  );

  // Window dates are already wall-clock — format without a timeZone option
  // (passing one would re-shift them and desync day numbers from the cells).
  const dayFmt = useMemo(
    () => new Intl.DateTimeFormat(config.locale, { day: "numeric" }),
    [config.locale],
  );

  const fullFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(config.locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [config.locale],
  );

  const resolvePhaseLabel = (key: LunarPhaseKey): string | null => {
    if (phaseLabels === false) return null;
    const override = phaseLabels?.[key];
    if (override === "") return null;
    return override ?? LUNAR_PHASE_ABBR[key];
  };

  const resolveAriaLabel = (key: LunarPhaseKey) =>
    phaseAriaLabels?.[key] ?? LUNAR_PHASE_LONG[key];

  const gridSlot = getGridSlotStyle(col);

  return (
    <div
      data-dateforge-lunar=""
      data-area="lunar"
      data-theme={theme}
      data-scheme={scheme}
      className={[styles.container, className].filter(Boolean).join(" ")}
      style={gridSlot}
    >
      <div
        className={styles.strip}
        role="list"
        aria-label={t("lunar", undefined, lunarLabel)}
      >
        {window.map((d, idx) => {
          const phase = getLunarPhaseKey(d);
          const isAnchor =
            d.getFullYear() === anchorDate.getFullYear() &&
            d.getMonth() === anchorDate.getMonth() &&
            d.getDate() === anchorDate.getDate();
          const phaseLabel = resolvePhaseLabel(phase);
          return (
            <div
              key={idx}
              role="listitem"
              aria-label={`${fullFmt.format(d)}, ${resolveAriaLabel(phase)}`}
              aria-current={isAnchor ? "date" : undefined}
              data-anchor={isAnchor || undefined}
              data-phase={phase}
              className={styles.cell}
            >
              <span className={styles.day} aria-hidden>
                {dayFmt.format(d)}
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
}
