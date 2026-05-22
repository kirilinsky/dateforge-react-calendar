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
  DEFAULT_MONTH_PICKER_LABEL,
  DEFAULT_RESET_MONTH_LABEL,
  formatActionLabel,
  resolveActionLabel,
} from "@/utils/action-labels";
import { clampBoundDate, computeBoundLimits } from "@/utils/clamp-bound-date";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { getDateTimeFormat } from "@/utils/intl-cache";
import { resolveThemeScope } from "@/utils/resolve-theme-scope";
import styles from "./months-wheel.module.css";

const capitalize = (s: string) =>
  s ? s.charAt(0).toLocaleUpperCase() + s.slice(1) : s;

const getLocalizedMonthLabel = (locale: string): string => {
  try {
    const dn = new Intl.DisplayNames(locale, { type: "dateTimeField" });
    const name = dn.of("month");
    if (name) return capitalize(name);
  } catch {
    // fall through
  }
  return "Month";
};

export interface CalendarMonthsWheelProps {
  /**
   * Range mode only: edit month on one explicit boundary instead of
   * navigating the global viewDate.
   */
  bound?: "from" | "to";
  col?: number | string;
  theme?: CalendarTheme;
  /**
   * aria-label for the months drum. Falls back to a localized noun via
   * `Intl.DisplayNames(locale, { type: "dateTimeField" })`.
   */
  monthsLabel?: string;
  /**
   * aria-label for the wheel group wrapper. Defaults to "Month picker".
   */
  monthPickerLabel?: string;
  /**
   * Show a small localized label above the drum.
   */
  showLabel?: boolean;
  /**
   * Render short localized month names ("Jan", "Фев") in the drum instead of
   * full names ("January", "Февраль"). aria-valuetext keeps the long form for
   * screen readers regardless. Default `false`.
   */
  shortMonths?: boolean;
  /**
   * Render a localized date header above the drum for the bound's current
   * date. Requires `bound` to be set — has no effect without it. If the
   * bound has no date yet, header is hidden. Default `true`.
   */
  showBoundDate?: boolean;
  /**
   * Render a reset button below the drum. Shows the current local month name
   * as its label. Click sets the month on the active date (or bound) to the
   * current month. Default `false`.
   */
  showReset?: boolean;
  /**
   * Override the reset button content. Default: home icon + localized
   * current month name.
   */
  resetLabel?: React.ReactNode;
  /**
   * aria-label for the reset button. Defaults to "Reset to {month}" with
   * `{month}` substituted by the localized current month.
   */
  resetMonthLabel?: string;
  /**
   * Fires when the user changes the drum. Receives a Date built from the
   * current `viewDate` (or bound date) with the new month set.
   */
  onMonthSelect?: (date: Date) => void;
}

export const CalendarMonthsWheel: React.FC<CalendarMonthsWheelProps> = ({
  bound,
  col,
  theme,
  monthsLabel,
  monthPickerLabel,
  showLabel = false,
  shortMonths = false,
  showBoundDate = true,
  showReset = false,
  resetLabel,
  resetMonthLabel,
  onMonthSelect,
}) => {
  const { locale, range, readOnly, actionLabels } = useConfig();
  const localizedLabel = getLocalizedMonthLabel(locale);
  const resolvedMonthsLabel = resolveActionLabel(
    monthsLabel,
    actionLabels.monthsLabel,
    localizedLabel,
  );
  const resolvedPickerLabel = resolveActionLabel(
    monthPickerLabel,
    actionLabels.monthPickerLabel,
    DEFAULT_MONTH_PICKER_LABEL,
  );
  const resolvedResetLabel = resolveActionLabel(
    resetMonthLabel,
    actionLabels.resetMonthLabel,
    DEFAULT_RESET_MONTH_LABEL,
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
  const month = displayDate.getMonth();

  const longFmt = getDateTimeFormat(locale, { month: "long" });
  const shortFmt = getDateTimeFormat(locale, { month: "short" });
  const displayFmt = shortMonths ? shortFmt : longFmt;
  const getValueText = (v: number) => longFmt.format(new Date(2024, v, 1));
  const format = (v: number) => displayFmt.format(new Date(2024, v, 1));

  const headerText =
    showBoundDate && isBound && boundDate
      ? getDateTimeFormat(locale, {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(boundDate)
      : null;

  const canReset = showReset && today && !readOnly && !(isBound && !boundDate);
  const currentMonthName = canReset ? longFmt.format(today) : null;
  const resetContent = canReset
    ? (resetLabel ?? (
        <>
          <Home />
          <span>{currentMonthName}</span>
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
        onMonthSelect?.(clamped);
        return true;
      }
      return false;
    }
    navigateTo(next);
    onMonthSelect?.(next);
    return true;
  };

  // Physical drum bounds derived from bound constraints so the drum hits a wall
  // instead of snapping back after rejection.
  const { monthMin, monthMax } = isBound
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
    : { monthMin: -Infinity, monthMax: Infinity };
  const minMonthValue =
    Number.isFinite(monthMin) && monthMin < 12
      ? Math.max(0, monthMin)
      : undefined;
  const maxMonthValue =
    Number.isFinite(monthMax) && monthMax >= 0
      ? Math.min(11, monthMax)
      : undefined;

  const handleDrumChange = (nextMonth: number): boolean | undefined => {
    const draft = new Date(displayDate);
    draft.setMonth(nextMonth);
    return handleChange(draft);
  };

  const handleReset = () => {
    if (!today) return;
    const draft = new Date(displayDate);
    draft.setMonth(today.getMonth());
    handleChange(draft);
  };

  return (
    <div
      data-area="months-wheel"
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
              value={month}
              max={12}
              step={1}
              circular={!isBound}
              minValue={minMonthValue}
              maxValue={maxMonthValue}
              label={resolvedMonthsLabel}
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
            currentMonthName
              ? formatActionLabel(resolvedResetLabel, "month", currentMonthName)
              : resolvedResetLabel
          }
        >
          {resetContent}
        </button>
      )}
    </div>
  );
};
