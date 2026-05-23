import type React from "react";
import "@/styles/layers.css";
import type { TimeLabelStyle } from "@/components/time-track/time-track";
import { useConfig } from "@/context/config-context";
import {
  useSelectionActions,
  useSelectionValue,
} from "@/context/selection-context";
import { useUI } from "@/context/ui-context";
import shared from "@/global/global.module.css";
import { Clock } from "@/Icons";
import type { CalendarTheme } from "@/types/themes";
import {
  DEFAULT_CHANGE_TIME_LABEL,
  DEFAULT_CONFIRM_LABEL,
  DEFAULT_HOURS_LABEL,
  DEFAULT_MINUTES_LABEL,
  DEFAULT_SECONDS_LABEL,
  DEFAULT_SELECT_TIME_LABEL,
  DEFAULT_TIME_PERIOD_LABEL,
  DEFAULT_TIME_PICKER_LABEL,
  formatActionLabel,
  resolveActionLabel,
} from "@/utils/action-labels";
import { clampBoundDate } from "@/utils/clamp-bound-date";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { getTimeString } from "@/utils/time-utils";
import { TimePopup } from "../_internal/time-popup";
import { useToolbarContext } from "../toolbar-context";
import styles from "./time.module.css";

export interface CalendarToolbarTimeProps {
  changeTimeLabel?: string;
  compact?: boolean;
  col?: number | string;
  confirmLabel?: string;
  hoursLabel?: string;
  labels?: TimeLabelStyle;
  minutesLabel?: string;
  onTimeSelect?: (date: Date) => void;
  secondsLabel?: string;
  selectTimeLabel?: string;
  seconds?: boolean;
  theme?: CalendarTheme;
  timePeriodLabel?: string;
  timePickerLabel?: string;
}

export const CalendarToolbarTime: React.FC<CalendarToolbarTimeProps> = ({
  changeTimeLabel,
  compact = false,
  col,
  confirmLabel,
  hoursLabel,
  labels,
  minutesLabel,
  onTimeSelect,
  secondsLabel,
  selectTimeLabel,
  seconds = false,
  theme,
  timePeriodLabel,
  timePickerLabel,
}) => {
  const tb = useToolbarContext();
  const { actionLabels, hour12, locale, readOnly } = useConfig();
  const { rangeStart, rangeEnd } = useSelectionValue();
  const { onChangeTime, onRangeBoundSet } = useSelectionActions();
  const { setPopupAnchorEl } = useUI();

  if (!tb) return null;

  const time = getTimeString(tb.date, hour12, seconds, locale);
  const resolvedChangeLabel = resolveActionLabel(
    changeTimeLabel,
    actionLabels.changeTimeLabel,
    DEFAULT_CHANGE_TIME_LABEL,
  );
  const resolvedConfirmLabel = resolveActionLabel(
    confirmLabel,
    actionLabels.confirmLabel,
    DEFAULT_CONFIRM_LABEL,
  );
  const resolvedSelectLabel = resolveActionLabel(
    selectTimeLabel,
    actionLabels.selectTimeLabel,
    DEFAULT_SELECT_TIME_LABEL,
  );
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
  const resolvedPeriodLabel = resolveActionLabel(
    timePeriodLabel,
    actionLabels.timePeriodLabel,
    DEFAULT_TIME_PERIOD_LABEL,
  );
  const resolvedPickerLabel = resolveActionLabel(
    timePickerLabel,
    actionLabels.timePickerLabel,
    DEFAULT_TIME_PICKER_LABEL,
  );

  const handleConfirm = (next: Date) => {
    let committed = false;
    let selected = next;
    if (tb.isBound && tb.bound) {
      const clamped = clampBoundDate(next, tb.bound, rangeStart, rangeEnd);
      selected = clamped;
      tb.setLocalView(clamped);
      if (!readOnly) committed = onRangeBoundSet(tb.bound, clamped);
    } else {
      committed = onChangeTime(next);
    }
    if (committed) onTimeSelect?.(selected);
    tb.setTimePopupOpen(false);
  };

  return (
    <>
      <button
        type="button"
        disabled={readOnly}
        className={`${compact ? styles.iconButton : styles.timeButton} ${shared.interactive} ${shared.hovered}`}
        aria-label={formatActionLabel(resolvedChangeLabel, "time", time)}
        aria-haspopup="dialog"
        aria-expanded={tb.timePopupOpen}
        style={getGridSlotStyle(col)}
        onClick={(e) => {
          setPopupAnchorEl(e.currentTarget);
          tb.setTimePopupOpen(true);
        }}
      >
        {compact ? <Clock /> : time}
      </button>

      {tb.timePopupOpen && (
        <TimePopup
          date={tb.date}
          hour12={hour12}
          showSeconds={seconds}
          labels={labels}
          readOnly={readOnly}
          confirmLabel={resolvedConfirmLabel}
          hoursLabel={resolvedHoursLabel}
          label={resolvedSelectLabel}
          minutesLabel={resolvedMinutesLabel}
          secondsLabel={resolvedSecondsLabel}
          timePeriodLabel={resolvedPeriodLabel}
          timePickerLabel={resolvedPickerLabel}
          theme={theme}
          onConfirm={handleConfirm}
          onClose={() => tb.setTimePopupOpen(false)}
        />
      )}
    </>
  );
};
