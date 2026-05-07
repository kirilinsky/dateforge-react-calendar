import type React from "react";
import { TimeTrack } from "@/components/time-track/time-track";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import { useSelectionActions } from "@/context/selection-context";
import shared from "@/global/global.module.css";
import { useGridSlot } from "@/hooks/use-grid-slot";
import styles from "./time.module.css";

export interface CalendarTimeGridProps {
  col?: number | string;
  seconds?: boolean;
}

export const CalendarTimeGrid: React.FC<CalendarTimeGridProps> = ({
  col,
  seconds = false,
}) => {
  const { hour12, locale, readOnly, timeStep } = useConfig();
  const { viewDate: date } = useNavigation();
  const { onChangeTime } = useSelectionActions();

  return (
    <div
      data-area="time"
      className={`${styles.timeContainer} ${shared.flexCenter}`}
      style={useGridSlot(col)}
    >
      <TimeTrack
        date={date}
        hour12={hour12}
        locale={locale}
        showSeconds={seconds}
        readOnly={readOnly}
        step={timeStep}
        onChange={onChangeTime}
      />
    </div>
  );
};
