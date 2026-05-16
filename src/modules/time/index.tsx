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
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import styles from "./time.module.css";

export interface CalendarTimeGridProps {
  /**
   * Range mode only: edit time on one explicit boundary instead of relying on
   * the current viewDate to match rangeStart/rangeEnd.
   */
  bound?: "from" | "to";
  col?: number | string;
  seconds?: boolean;
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
  seconds = false,
  labels,
  onTimeSelect,
}) => {
  const { hour12, locale, range, readOnly, timeStep } = useConfig();
  const { viewDate: date } = useNavigation();
  const { rangeStart, rangeEnd } = useSelectionValue();
  const { onChangeTime, onRangeBoundSet } = useSelectionActions();
  const isBound = !!(range && bound);
  const boundDate = isBound ? (bound === "from" ? rangeStart : rangeEnd) : null;
  const displayDate = boundDate ?? date;

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

  return (
    <div
      data-area="time"
      className={styles.timeContainer}
      style={getGridSlotStyle(col)}
    >
      <TimeTrack
        date={displayDate}
        hour12={hour12}
        locale={locale}
        showSeconds={seconds}
        readOnly={readOnly || (isBound && !boundDate)}
        step={timeStep}
        labels={labels}
        onChange={handleChange}
      />
    </div>
  );
};
