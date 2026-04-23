import React from "react";
import styles from "./time.module.css";
import shared from "@/global/global.module.css";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import { useSelectionActions } from "@/context/selection-context";
import { useThrottle } from "@/hooks/use-throttle";
import { useGridSlot } from "@/hooks/use-grid-slot";
import { TimeTrack } from "@/components/time-track/time-track";

export interface CalendarTimeGridProps {
  col?: number | string;
  showSeconds?: boolean;
}

export const CalendarTimeGrid: React.FC<CalendarTimeGridProps> = ({ col, showSeconds = false }) => {
  const { hour12, locale } = useConfig();
  const { viewDate: date } = useNavigation();
  const { onChangeTime } = useSelectionActions();
  const throttled = useThrottle(onChangeTime, 50);

  return (
    <div
      data-area="time"
      className={`${styles.timeContainer} ${shared.flexCenter}`}
      style={useGridSlot(col)}
    >
      <TimeTrack date={date} hour12={hour12} locale={locale} showSeconds={showSeconds} onChange={throttled} />
    </div>
  );
};
