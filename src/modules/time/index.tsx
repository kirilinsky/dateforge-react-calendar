import React from "react";
import styles from "./time.module.css";
import shared from "@/global/global.module.css";
import { useConfig, useNavigation, useSelection, useThrottle } from "react-calendar-datetime";
import { TimeTrack } from "@/components/time-track/time-track";

export const CalendarTimeGrid: React.FC = () => {
  const { hour12 } = useConfig();
  const { viewDate: date } = useNavigation();
  const { onChangeTime } = useSelection();
  const throttled = useThrottle(onChangeTime, 50);

  return (
    <div
      data-area="time"
      className={`${styles.timeContainer} ${shared.flexCenter}`}
    >
      <TimeTrack date={date} hour12={hour12} onChange={throttled} />
    </div>
  );
};
