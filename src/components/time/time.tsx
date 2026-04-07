import React from "react";
import styles from "./time.module.css";
import shared from "@/global/global.module.css";
import { useCalendarContext } from "../provider/provider";
import { useThrottle } from "@/hooks/use-throttle";
import { TimeTrack } from "../time-track/time-track";

export const TimeComponent: React.FC = () => {
  const { onChangeTime, date, hour12, gestures } = useCalendarContext();
  const throttled = useThrottle(onChangeTime, 70);

  return (
    <div style={{ gridArea: "TT" }} className={`${styles.timeContainer} ${shared.flexCenter}`}>
      <TimeTrack date={date} hour12={hour12} gestures={gestures} onChange={throttled} />
    </div>
  );
};
