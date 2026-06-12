import type { ReactNode } from "react";
import { calendarDate } from "../../core-v3/calendar-date";
import { toCalendarDateTime } from "../../core-v3/timezone-boundary";
import { useToday } from "../../hooks/use-today";
import { useLabels } from "../../react-v3/labels-context";
import { useCalendarActions, useCalendarStore } from "../../react-v3/provider";
import { useStoreSelector } from "../../react-v3/use-store-selector";
import { getGridSlotStyle } from "../../utils/get-grid-slot-style";
import { StepDrum } from "../time/step-drum";
import styles from "./years-wheel.module.css";

const capitalize = (s: string) =>
  s ? s.charAt(0).toLocaleUpperCase() + s.slice(1) : s;

const getLocalizedYearLabel = (locale: string): string => {
  try {
    const dn = new Intl.DisplayNames(locale, { type: "dateTimeField" });
    const name = dn.of("year");
    if (name) return capitalize(name);
  } catch {
    // fall through
  }
  return "Year";
};

// Default finite window when config has no min/max. Wide enough for any
// practical picker; the drum only renders the 7 cells around the value.
const DEFAULT_MIN_YEAR = 1900;
const DEFAULT_MAX_YEAR = 2100;

export type CalendarYearsWheelProps = {
  /** Small localized label above the drum. */
  showLabel?: boolean;
  /**
   * Render a reset button below the drum. Click navigates the view back to
   * the current year (keeping the viewed month). Default `false`.
   */
  showReset?: boolean;
  /** Override the reset button content. Default: the current year. */
  resetLabel?: ReactNode;
  /** aria-label template for the reset button (registry key `resetYear`). */
  resetYearLabel?: string;
  /** aria-label for the years drum. Default: localized "Year" noun. */
  yearsLabel?: string;
  /** aria-label for the group wrapper (registry key `yearPicker`). */
  yearPickerLabel?: string;
  /** Per-module theme override (`data-theme` on the module container). */
  theme?: string;
  /** Per-module scheme override (`data-scheme` on the module container). */
  scheme?: "light" | "dark" | "auto";
  col?: number | string;
  className?: string;
  /** Observational: fires after the drum navigates. */
  onYearSelect?: (year: number) => void;
};

export function CalendarYearsWheel({
  showLabel = false,
  showReset = false,
  resetLabel,
  resetYearLabel,
  yearsLabel,
  yearPickerLabel,
  theme,
  scheme,
  col,
  className,
  onYearSelect,
}: CalendarYearsWheelProps) {
  const store = useCalendarStore();
  const config = store.getConfig();
  const t = useLabels();
  const { navigateTo } = useCalendarActions();
  const today = useToday();

  const viewDate = useStoreSelector(store, (s) => s.view.viewDate);

  const locale = config.locale ?? "en";
  const localizedLabel = getLocalizedYearLabel(locale);
  const drumLabel = yearsLabel ?? localizedLabel;

  const minYear = config.min?.year ?? DEFAULT_MIN_YEAR;
  const maxYear = config.max?.year ?? DEFAULT_MAX_YEAR;
  const span = Math.max(1, maxYear - minYear + 1);

  // Drum works in offsets from minYear; the year window is finite (non-circular).
  const value = Math.max(0, Math.min(span - 1, viewDate.year - minYear));
  const getValueText = (v: number) => String(minYear + v);
  const format = (v: number) => String(minYear + v);

  const handleDrumChange = (nextOffset: number): boolean | undefined => {
    const nextYear = minYear + nextOffset;
    navigateTo(calendarDate(nextYear, viewDate.month, 1));
    onYearSelect?.(nextYear);
    return undefined;
  };

  // "Now" reset: back to the current year, keeping the viewed month. `useToday`
  // gates SSR (null until mount).
  const todayYear =
    today !== null
      ? toCalendarDateTime(today, config.timeZone).date.year
      : null;
  const canReset = showReset && todayYear !== null;
  const handleReset = () => {
    if (todayYear === null) return;
    navigateTo(calendarDate(todayYear, viewDate.month, 1));
    onYearSelect?.(todayYear);
  };

  const gridSlot = getGridSlotStyle(col);

  return (
    <div
      data-dateforge-years-wheel=""
      data-area="years-wheel"
      data-theme={theme}
      data-scheme={scheme}
      className={[styles.container, className].filter(Boolean).join(" ")}
      style={gridSlot}
    >
      <div
        className={styles.root}
        role="group"
        aria-label={t("yearPicker", undefined, yearPickerLabel)}
      >
        <div className={styles.drumCol}>
          {showLabel && (
            <span className={styles.drumLabel} aria-hidden>
              {localizedLabel}
            </span>
          )}
          <StepDrum
            value={value}
            max={span}
            step={1}
            circular={false}
            label={drumLabel}
            getValueText={getValueText}
            format={format}
            onChange={handleDrumChange}
          />
        </div>
      </div>
      {canReset && (
        <button
          type="button"
          className={styles.resetBtn}
          onClick={handleReset}
          aria-label={t(
            "resetYear",
            { year: String(todayYear) },
            resetYearLabel,
          )}
        >
          {resetLabel ?? <span>{todayYear}</span>}
        </button>
      )}
    </div>
  );
}
