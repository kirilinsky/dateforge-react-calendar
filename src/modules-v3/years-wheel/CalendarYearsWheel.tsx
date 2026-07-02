import type { ReactNode } from "react";
import { boundDateOf } from "../../core-v3/bound";
import { calendarDate, daysInMonth } from "../../core-v3/calendar-date";
import { toCalendarDateTime } from "../../core-v3/timezone-boundary";
import { useToday } from "../../hooks/use-today";
import { useLabels } from "../../react-v3/labels-context";
import { usePickerDraft } from "../../react-v3/picker-draft";
import { useCalendarActions, useCalendarStore } from "../../react-v3/provider";
import { UIButton } from "../../react-v3/ui/button";
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
  /**
   * Span modes: edit a range bound (`"from"`/`"to"`)'s year instead of the view.
   * Commits via `setBoundDate` (core owns ordering/clamping).
   */
  bound?: "from" | "to";
  /**
   * Bound mode: show a localized date header for the edited bound above the
   * drum (v2 parity). Hidden while the range is empty. Default `true`.
   */
  showBoundDate?: boolean;
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
  bound,
  showBoundDate = true,
  theme,
  scheme,
  col,
  className,
  onYearSelect,
}: CalendarYearsWheelProps) {
  const store = useCalendarStore();
  const config = store.getConfig();
  const t = useLabels();
  const { navigateTo, setBoundDate } = useCalendarActions();
  const today = useToday();
  // Staged inside a confirm trigger popup; live against the store otherwise.
  const draft = usePickerDraft();

  const storeView = useStoreSelector(store, (s) => s.view.viewDate);
  const selection = useStoreSelector(store, (s) => s.selection);
  const boundDate = boundDateOf(selection, bound);
  const viewDate = draft ? draft.date : (boundDate ?? storeView);

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
    if (draft) {
      draft.setDate(calendarDate(nextYear, viewDate.month, 1));
    } else if (boundDate) {
      // Edit the bound: keep its month/day (day clamped); core orders.
      const day = Math.min(
        boundDate.day,
        daysInMonth(nextYear, boundDate.month),
      );
      setBoundDate(calendarDate(nextYear, boundDate.month, day), bound!);
      onYearSelect?.(nextYear);
    } else {
      navigateTo(calendarDate(nextYear, viewDate.month, 1));
      onYearSelect?.(nextYear);
    }
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
    const next = calendarDate(todayYear, viewDate.month, 1);
    if (draft) {
      draft.setDate(next);
    } else {
      navigateTo(next);
      onYearSelect?.(todayYear);
    }
  };

  const gridSlot = getGridSlotStyle(col);

  // Bound-date header (v2 parity; same recipe as the TimeWheel).
  const headerText =
    showBoundDate && boundDate
      ? new Intl.DateTimeFormat(locale, {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(new Date(boundDate.year, boundDate.month - 1, boundDate.day))
      : null;

  return (
    <div
      data-dateforge-years-wheel=""
      data-area="years-wheel"
      data-theme={theme}
      data-scheme={scheme}
      className={[styles.container, className].filter(Boolean).join(" ")}
      style={gridSlot}
    >
      {headerText && (
        <div className={styles.boundedDate} data-bound={bound}>
          {headerText}
        </div>
      )}
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
        <UIButton
          size="sm"
          className={styles.resetBtn}
          onClick={handleReset}
          aria-label={t(
            "resetYear",
            { year: String(todayYear) },
            resetYearLabel,
          )}
        >
          {resetLabel ?? <span>{todayYear}</span>}
        </UIButton>
      )}
    </div>
  );
}
