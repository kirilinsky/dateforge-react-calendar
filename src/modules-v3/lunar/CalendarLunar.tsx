import { useMemo } from "react";
import { fromCalendarDateTime } from "../../core-v3/timezone-boundary";
import { useCalendarStore } from "../../react-v3/provider";
import { useStoreSelector } from "../../react-v3/use-store-selector";
import { getGridSlotStyle } from "../../utils/get-grid-slot-style";
import {
  buildLunarWindow,
  getLunarPhaseKey,
  LUNAR_PHASE_ABBR,
  LUNAR_PHASE_LONG,
  type LunarPhaseKey,
} from "./helpers";
import styles from "./lunar.module.css";

export type CalendarLunarProps = {
  lunarLabel?: string;
  phaseLabels?: false | Partial<Record<LunarPhaseKey, string>>;
  phaseAriaLabels?: Partial<Record<LunarPhaseKey, string>>;
  col?: number | string;
  className?: string;
};

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
  lunarLabel = "Lunar phases",
  phaseLabels,
  phaseAriaLabels,
  col,
  className,
}: CalendarLunarProps) {
  const store = useCalendarStore();
  const config = store.getConfig();

  const selection = useStoreSelector(store, (s) => s.selection);
  const viewDate = useStoreSelector(store, (s) => s.view.viewDate);

  const anchorDate = useMemo((): Date => {
    if (selection.shape === "point" && selection.dates.length > 0) {
      const r = fromCalendarDateTime(selection.dates[0], config.timeZone);
      if (r.ok) return r.date;
    }
    if (selection.shape === "span" && selection.ranges.length > 0) {
      const range = selection.ranges[0];
      const bound = range.end ?? range.start;
      const MIDNIGHT = { hour: 0, minute: 0, second: 0, ms: 0 };
      const r = fromCalendarDateTime(
        { date: bound, time: MIDNIGHT },
        config.timeZone,
      );
      if (r.ok) return r.date;
    }
    // Fallback: first of view month
    const MIDNIGHT = { hour: 0, minute: 0, second: 0, ms: 0 };
    const r = fromCalendarDateTime(
      {
        date: { year: viewDate.year, month: viewDate.month, day: 1 },
        time: MIDNIGHT,
      },
      config.timeZone,
    );
    return r.ok ? r.date : new Date();
  }, [selection, viewDate, config.timeZone]);

  const window = useMemo(
    () => buildLunarWindow(anchorDate, LUNAR_WINDOW),
    [anchorDate],
  );

  const dayFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(config.locale, {
        day: "numeric",
        ...(config.timeZone && { timeZone: config.timeZone }),
      }),
    [config.locale, config.timeZone],
  );

  const fullFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(config.locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        ...(config.timeZone && { timeZone: config.timeZone }),
      }),
    [config.locale, config.timeZone],
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
      className={[className].filter(Boolean).join(" ")}
      style={gridSlot}
    >
      <div className={styles.strip} role="list" aria-label={lunarLabel}>
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
              aria-current={isAnchor ? "date" : undefined}
              data-anchor={isAnchor || undefined}
              data-phase={phase}
              className={styles.cell}
            >
              <span className="sr-only">
                {fullFmt.format(d)}, {resolveAriaLabel(phase)}
              </span>
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
