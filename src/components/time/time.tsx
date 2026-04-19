import React from "react";
import styles from "./time.module.css";
import shared from "@/global/global.module.css";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import { useSelection } from "@/context/selection-context";
import { useThrottle } from "@/hooks/use-throttle";
import { TimeTrack } from "../time-track/time-track";

export const TimeComponent: React.FC = () => {
  const { hour12 } = useConfig();
  const { viewDate: date } = useNavigation();
  const { onChangeTime } = useSelection();
  const throttled = useThrottle(onChangeTime, 50);

  return (
    <div
      data-area="time"
      style={{ gridArea: "TT" }}
      className={`${styles.timeContainer} ${shared.flexCenter}`}
    >
      <TimeTrack date={date} hour12={hour12} onChange={throttled} />
    </div>
  );
};
