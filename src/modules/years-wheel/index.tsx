import type React from "react";
import "@/styles/layers.css";
import { StepDrum } from "@/components/step-drum/step-drum";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import {
  useSelectionActions,
  useSelectionValue,
} from "@/context/selection-context";
import { useUI } from "@/context/ui-context";
import { useToday } from "@/hooks/use-today";
import { Home } from "@/Icons";
import type { CalendarTheme } from "@/types/themes";
import {
  DEFAULT_RESET_YEAR_LABEL,
  DEFAULT_YEAR_PICKER_LABEL,
  formatActionLabel,
  resolveActionLabel,
} from "@/utils/action-labels";
import { clampBoundDate, computeBoundLimits } from "@/utils/clamp-bound-date";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { getDateTimeFormat } from "@/utils/intl-cache";
import { resolveThemeScope } from "@/utils/resolve-theme-scope";
import { MAX_CALENDAR_YEAR, MIN_CALENDAR_YEAR } from "@/utils/year-range";
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

export interface CalendarYearsWheelProps {
  /**
   * Range mode only: edit year on one explicit boundary instead of
   * navigating the global viewDate.
   */
  bound?: "from" | "to";
  col?: number | string;
  theme?: CalendarTheme;
  /**
   * aria-label for the years drum. Falls back to a localized noun via
   * `Intl.DisplayNames(locale, { type: "dateTimeField" })`.
   */
  yearsLabel?: string;
  /**
   * aria-label for the wheel group wrapper. Defaults to "Year picker".
   */
  yearPickerLabel?: string;
  /**
   * Show a small localized label above the drum.
   */
  showLabel?: boolean;
  /**
   * Render a localized date header above the drum for the bound's current
   * date. Requires `bound` to be set. Default `true`.
   */
  showBoundDate?: boolean;
  /**
   * Render a reset button below the drum. Shows the current year as its
   * label. Click sets the year on the active date (or bound) to the
   * current year. Default `false`.
   */
  showReset?: boolean;
  /**
   * Override the reset button content. Default: home icon + current year.
   */
  resetLabel?: React.ReactNode;
  /**
   * aria-label for the reset button. Defaults to "Reset to {year}" with
   * `{year}` substituted by the current year.
   */
  resetYearLabel?: string;
  /**
   * Fires when the user changes the drum. Receives a Date built from the
   * current `viewDate` (or bound date) with the new year set.
   */
  onYearSelect?: (date: Date) => void;
}

export const CalendarYearsWheel: React.FC<CalendarYearsWheelProps> = ({
  bound,
  col,
  theme,
  yearsLabel,
  yearPickerLabel,
  showLabel = false,
  showBoundDate = true,
  showReset = false,
  resetLabel,
  resetYearLabel,
  onYearSelect,
}) => {
  const { locale, range, readOnly, minDate, maxDate, actionLabels } =
    useConfig();
  const localizedLabel = getLocalizedYearLabel(locale);
  const resolvedYearsLabel = resolveActionLabel(
    yearsLabel,
    actionLabels.yearsLabel,
    localizedLabel,
  );
  const resolvedPickerLabel = resolveActionLabel(
    yearPickerLabel,
    actionLabels.yearPickerLabel,
    DEFAULT_YEAR_PICKER_LABEL,
  );
  const resolvedResetLabel = resolveActionLabel(
    resetYearLabel,
    actionLabels.resetYearLabel,
    DEFAULT_RESET_YEAR_LABEL,
  );
  const { viewDate: date, navigateTo } = useNavigation();
  const { activeTheme } = useUI();
  const themeScope = resolveThemeScope(theme, activeTheme);
  const { rangeStart, rangeEnd } = useSelectionValue();
  const { onRangeBoundSet } = useSelectionActions();
  const today = useToday();
  const isBound = !!(range && bound);
  const boundDate = isBound ? (bound === "from" ? rangeStart : rangeEnd) : null;
  const displayDate = boundDate ?? date;

  const minYear = minDate?.getFullYear() ?? MIN_CALENDAR_YEAR;
  const maxYear = maxDate?.getFullYear() ?? MAX_CALENDAR_YEAR;
  const span = Math.max(1, maxYear - minYear + 1);
  const year = displayDate.getFullYear();
  const value = Math.max(0, Math.min(span - 1, year - minYear));

  const getValueText = (v: number) => String(minYear + v);
  const format = (v: number) => String(minYear + v);

  const headerText =
    showBoundDate && isBound && boundDate
      ? getDateTimeFormat(locale, {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(boundDate)
      : null;

  const canReset = showReset && today && !readOnly && !(isBound && !boundDate);
  const currentYearStr = canReset ? String(today.getFullYear()) : null;
  const resetContent = canReset
    ? (resetLabel ?? (
        <>
          <Home />
          <span>{currentYearStr}</span>
        </>
      ))
    : null;

  const handleChange = (next: Date) => {
    if (readOnly) return false;
    if (isBound) {
      if (!boundDate) return false;
      const clamped = clampBoundDate(next, bound!, rangeStart, rangeEnd);
      if (clamped.getTime() !== next.getTime()) return false;
      if (onRangeBoundSet(bound!, clamped)) {
        onYearSelect?.(clamped);
        return true;
      }
      return false;
    }
    navigateTo(next);
    onYearSelect?.(next);
    return true;
  };

  const { yearMin, yearMax } = isBound
    ? computeBoundLimits({
        bound: bound!,
        rangeStart,
        rangeEnd,
        refYear: displayDate.getFullYear(),
        refMonth: displayDate.getMonth(),
        refDay: displayDate.getDate(),
        daysInRefMonth: new Date(
          displayDate.getFullYear(),
          displayDate.getMonth() + 1,
          0,
        ).getDate(),
      })
    : { yearMin: -Infinity, yearMax: Infinity };
  // Convert year → offset (StepDrum value = year - minYear)
  const minYearValue = Number.isFinite(yearMin)
    ? Math.max(0, yearMin - minYear)
    : undefined;
  const maxYearValue = Number.isFinite(yearMax)
    ? Math.min(span - 1, yearMax - minYear)
    : undefined;

  const handleDrumChange = (nextOffset: number): boolean | undefined => {
    const draft = new Date(displayDate);
    draft.setFullYear(minYear + nextOffset);
    return handleChange(draft);
  };

  const handleReset = () => {
    if (!today) return;
    const draft = new Date(displayDate);
    draft.setFullYear(today.getFullYear());
    handleChange(draft);
  };

  return (
    <div
      data-area="years-wheel"
      className={styles.container}
      data-theme={themeScope.dataTheme}
      style={{ ...getGridSlotStyle(col), ...themeScope.style }}
    >
      {headerText && (
        <div className={styles.boundedDate} data-bound={bound}>
          {headerText}
        </div>
      )}
      <div
        className={styles.root}
        role="group"
        aria-label={resolvedPickerLabel}
      >
        <div className={styles.drums} data-show-label={showLabel || undefined}>
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
              circular={!isBound}
              minValue={minYearValue}
              maxValue={maxYearValue}
              label={resolvedYearsLabel}
              getAriaValue={(v) => minYear + v}
              getValueText={getValueText}
              format={format}
              readOnly={readOnly || (isBound && !boundDate)}
              onChange={handleDrumChange}
            />
          </div>
        </div>
      </div>
      {resetContent && (
        <button
          type="button"
          className={styles.resetBtn}
          onClick={handleReset}
          aria-label={
            currentYearStr
              ? formatActionLabel(resolvedResetLabel, "year", currentYearStr)
              : resolvedResetLabel
          }
        >
          {resetContent}
        </button>
      )}
    </div>
  );
};
