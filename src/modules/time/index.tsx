import type React from "react";
import {
  type TimeLabelStyle,
  TimeTrack,
} from "@/components/time-track/time-track";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import {
  useSelectionActions,
  useSelectionValue,
} from "@/context/selection-context";
import { useToday } from "@/hooks/use-today";
import { Clock } from "@/Icons";
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
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { getDateTimeFormat } from "@/utils/intl-cache";
import styles from "./time.module.css";

export interface CalendarTimeGridProps {
  /**
   * Range mode only: edit time on one explicit boundary instead of relying on
   * the current viewDate to match rangeStart/rangeEnd.
   */
  bound?: "from" | "to";
  col?: number | string;
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

export const CalendarTimeGrid: React.FC<CalendarTimeGridProps> = ({
  bound,
  col,
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

  const handleChange = (next: Date) => {
    if (isBound) {
      if (!boundDate) return;
      if (onRangeBoundSet(bound!, next)) {
        onTimeSelect?.(next);
      }
      return;
    }

    if (onChangeTime(next)) {
      onTimeSelect?.(next);
    }
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
      style={getGridSlotStyle(col)}
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
        labels={labels}
        hoursLabel={resolvedHoursLabel}
        minutesLabel={resolvedMinutesLabel}
        secondsLabel={resolvedSecondsLabel}
        timePeriodLabel={resolvedTimePeriodLabel}
        timePickerLabel={resolvedTimePickerLabel}
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
