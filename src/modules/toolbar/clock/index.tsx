import type React from "react";
import { useEffect, useState } from "react";
import "@/styles/layers.css";
import { useConfig } from "@/context/config-context";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { getTimeString } from "@/utils/time-utils";
import { useToolbarContext } from "../toolbar-context";
import styles from "./clock.module.css";

export interface CalendarToolbarClockProps {
  col?: number | string;
  seconds?: boolean;
}

export const CalendarToolbarClock: React.FC<CalendarToolbarClockProps> = ({
  col,
  seconds = false,
}) => {
  const tb = useToolbarContext();
  const { hour12, locale } = useConfig();
  const [nowTime, setNowTime] = useState("");

  useEffect(() => {
    const tick = () =>
      setNowTime(getTimeString(new Date(), hour12, seconds, locale));
    tick();
    const id = setInterval(tick, seconds ? 1000 : 60_000);
    return () => clearInterval(id);
  }, [hour12, locale, seconds]);

  if (!tb) return null;

  return (
    <span
      className={styles.clock}
      aria-hidden="true"
      style={getGridSlotStyle(col)}
    >
      <span className={styles.dot} />
      {nowTime}
    </span>
  );
};
