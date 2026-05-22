import type React from "react";
import "@/styles/layers.css";
import {
  type BoundTimeLimit,
  type TimeLabelStyle,
  TimeTrack,
} from "@/components/time-track/time-track";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import {
  useSelectionActions,
  useSelectionValue,
} from "@/context/selection-context";
import { useUI } from "@/context/ui-context";
import { useToday } from "@/hooks/use-today";
import { Clock } from "@/Icons";
import type { CalendarTheme } from "@/types/themes";
import {
  DEFAULT_HOURS_LABEL,
  DEFAULT_MINUTES_LABEL,
  DEFAULT_RESET_TIME_LABEL,
  DEFAULT_SECONDS_LABEL,
  DEFAULT_TIME_PERIOD_LABEL,
  DEFAULT_TIME_PICKER_LABEL,
  formatActionLabel,
  resolveActionLabel,
} from "@/utils/action-labels";
import { clampBoundDate } from "@/utils/clamp-bound-date";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { getDateTimeFormat } from "@/utils/intl-cache";
import { resolveThemeScope } from "@/utils/resolve-theme-scope";
import styles from "./time.module.css";

export interface CalendarTimeWheelProps {
  /**
   * Range mode only: edit time on one explicit boundary instead of relying on
   * the current viewDate to match rangeStart/rangeEnd.
   */
  bound?: "from" | "to";
  col?: number | string;
  theme?: CalendarTheme;
  hoursLabel?: string;
  minutesLabel?: string;
  resetTimeLabel?: string;
  secondsLabel?: string;
  seconds?: boolean;
  /**
   * Render a localized date header above the TimeTrack for the bound's
   * current date. Requires `bound` to be set — has no effect without it.
   * If the bound has no date yet, header is hidden. Default `true`.
   */
  showBoundDate?: boolean;
  /**
   * Render a "now" reset button below the TimeTrack. Shows the current
   * local time (via `Intl.DateTimeFormat`) as label. Click resets time
   * fields on the active date (or bound) to the current hour/minute
   * (and second, if `seconds` is enabled). Default `false`.
   */
  showReset?: boolean;
  /**
   * Override the reset button content. Default: clock icon + localized
   * "now" word via `Intl.RelativeTimeFormat`.
   */
  resetLabel?: React.ReactNode;
  timePeriodLabel?: string;
  timePickerLabel?: string;
  /**
   * Show a small label above each drum.
   * - `"short"` renders `HH` / `MM` / `SS` (clock convention, not localized).
   * - `"long"` renders the localized field name via
   *   `Intl.DisplayNames(locale, { type: "dateTimeField" })` —
   *   e.g. `hour` / `minute` / `second` in EN, `час` / `минута` / `секунда` in RU.
   * Omit the prop to hide labels.
   */
  labels?: TimeLabelStyle;
  /**
   * Fires whenever the user changes any drum (hours / minutes / seconds /
   * AM-PM). Receives a Date built from `viewDate` with the new time set —
   * read `getHours()` / `getMinutes()` / `getSeconds()` for the time-only
   * value. Use for standalone time-picker UX without a selected date.
   */
  onTimeSelect?: (date: Date) => void;
}

export const CalendarTimeWheel: React.FC<CalendarTimeWheelProps> = ({
  bound,
  col,
  theme,
  hoursLabel,
  minutesLabel,
  resetTimeLabel,
  secondsLabel,
  seconds = false,
  labels,
  onTimeSelect,
  showBoundDate = true,
  showReset = false,
  resetLabel,
  timePeriodLabel,
  timePickerLabel,
}) => {
  const { hour12, locale, range, readOnly, timeStep, timeZone, actionLabels } =
    useConfig();
  const resolvedHoursLabel = resolveActionLabel(
    hoursLabel,
    actionLabels.hoursLabel,
    DEFAULT_HOURS_LABEL,
  );
  const resolvedMinutesLabel = resolveActionLabel(
    minutesLabel,
    actionLabels.minutesLabel,
    DEFAULT_MINUTES_LABEL,
  );
  const resolvedSecondsLabel = resolveActionLabel(
    secondsLabel,
    actionLabels.secondsLabel,
    DEFAULT_SECONDS_LABEL,
  );
  const resolvedResetTimeLabel = resolveActionLabel(
    resetTimeLabel,
    actionLabels.resetTimeLabel,
    DEFAULT_RESET_TIME_LABEL,
  );
  const resolvedTimePeriodLabel = resolveActionLabel(
    timePeriodLabel,
    actionLabels.timePeriodLabel,
    DEFAULT_TIME_PERIOD_LABEL,
  );
  const resolvedTimePickerLabel = resolveActionLabel(
    timePickerLabel,
    actionLabels.timePickerLabel,
    DEFAULT_TIME_PICKER_LABEL,
  );
  const { viewDate: date } = useNavigation();
  const { activeTheme } = useUI();
  const themeScope = resolveThemeScope(theme, activeTheme);
  const { rangeStart, rangeEnd } = useSelectionValue();
  const { onChangeTime, onRangeBoundSet } = useSelectionActions();
  const today = useToday();
  const isBound = !!(range && bound);
  const boundDate = isBound ? (bound === "from" ? rangeStart : rangeEnd) : null;
  const displayDate = boundDate ?? date;
  const headerText =
    showBoundDate && isBound && boundDate
      ? getDateTimeFormat(locale, {
          day: "numeric",
          month: "short",
          year: "numeric",
          ...(timeZone && { timeZone }),
        }).format(boundDate)
      : null;
  const canReset = showReset && today && !readOnly && !(isBound && !boundDate);
  const nowWord = canReset
    ? new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
        0,
        "second",
      )
    : null;
  const resetContent = canReset
    ? (resetLabel ?? (
        <>
          <Clock />
          <span>{nowWord}</span>
        </>
      ))
    : null;

  // Per-drum physical bounds for 24h mode. Cross-drum: minute/second limits
  // only apply when the current hour (or hour+minute) matches the bound.
  const isSameDayAs = (ref: Date | null) =>
    ref !== null &&
    boundDate !== null &&
    boundDate.getFullYear() === ref.getFullYear() &&
    boundDate.getMonth() === ref.getMonth() &&
    boundDate.getDate() === ref.getDate();

  const boundMin: BoundTimeLimit | undefined =
    isBound && bound === "to" && rangeStart && isSameDayAs(rangeStart)
      ? {
          hours: rangeStart.getHours(),
          minutes: rangeStart.getMinutes(),
          seconds: rangeStart.getSeconds(),
        }
      : undefined;

  const boundMax: BoundTimeLimit | undefined =
    isBound && bound === "from" && rangeEnd && isSameDayAs(rangeEnd)
      ? {
          hours: rangeEnd.getHours(),
          minutes: rangeEnd.getMinutes(),
          seconds: rangeEnd.getSeconds(),
        }
      : undefined;

  const handleChange = (next: Date): boolean | undefined => {
    if (isBound) {
      if (!boundDate) return false;
      const clamped = clampBoundDate(next, bound!, rangeStart, rangeEnd);
      if (clamped.getTime() !== next.getTime()) return false;
      if (onRangeBoundSet(bound!, clamped)) {
        onTimeSelect?.(clamped);
        return true;
      }
      return false;
    }

    if (onChangeTime(next)) {
      onTimeSelect?.(next);
      return true;
    }
    return false;
  };

  const handleReset = () => {
    const now = new Date();
    const next = new Date(displayDate);
    next.setHours(
      now.getHours(),
      now.getMinutes(),
      seconds ? now.getSeconds() : 0,
      0,
    );
    handleChange(next);
  };

  return (
    <div
      data-area="time"
      className={styles.timeContainer}
      data-theme={themeScope.dataTheme}
      style={{ ...getGridSlotStyle(col), ...themeScope.style }}
    >
      {headerText && (
        <div className={styles.boundedDate} data-bound={bound}>
          {headerText}
        </div>
      )}
      <TimeTrack
        date={displayDate}
        hour12={hour12}
        locale={locale}
        showSeconds={seconds}
        readOnly={readOnly || (isBound && !boundDate)}
        step={timeStep}
        circular={!isBound}
        labels={labels}
        hoursLabel={resolvedHoursLabel}
        minutesLabel={resolvedMinutesLabel}
        secondsLabel={resolvedSecondsLabel}
        timePeriodLabel={resolvedTimePeriodLabel}
        timePickerLabel={resolvedTimePickerLabel}
        boundMin={boundMin}
        boundMax={boundMax}
        onChange={handleChange}
      />
      {resetContent && (
        <button
          type="button"
          className={styles.resetBtn}
          onClick={handleReset}
          aria-label={
            nowWord
              ? formatActionLabel(resolvedResetTimeLabel, "time", nowWord)
              : resolvedResetTimeLabel
          }
        >
          {resetContent}
        </button>
      )}
    </div>
  );
};
