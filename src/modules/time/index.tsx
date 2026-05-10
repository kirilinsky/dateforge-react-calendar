import type React from "react";
import { TimeTrack } from "@/components/time-track/time-track";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import { useSelectionActions } from "@/context/selection-context";
import shared from "@/global/global.module.css";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import styles from "./time.module.css";

export interface CalendarTimeGridProps {
  col?: number | string;
  seconds?: boolean;
  /**
   * Fires whenever the user changes any drum (hours / minutes / seconds /
   * AM-PM). Receives a Date built from `viewDate` with the new time set —
   * read `getHours()` / `getMinutes()` / `getSeconds()` for the time-only
   * value. Use for standalone time-picker UX without a selected date.
   */
  onTimeSelect?: (date: Date) => void;
}

export const CalendarTimeGrid: React.FC<CalendarTimeGridProps> = ({
  col,
  seconds = false,
  onTimeSelect,
}) => {
  const { hour12, locale, readOnly, timeStep } = useConfig();
  const { viewDate: date } = useNavigation();
  const { onChangeTime } = useSelectionActions();

  const handleChange = (next: Date) => {
    onChangeTime(next);
    onTimeSelect?.(next);
  };

  return (
    <div
      data-area="time"
      className={`${styles.timeContainer} ${shared.flexCenter}`}
      style={getGridSlotStyle(col)}
    >
      <TimeTrack
        date={date}
        hour12={hour12}
        locale={locale}
        showSeconds={seconds}
        readOnly={readOnly}
        step={timeStep}
        onChange={handleChange}
      />
    </div>
  );
};
