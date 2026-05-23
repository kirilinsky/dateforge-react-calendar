import type React from "react";
import "@/styles/layers.css";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { useToolbarContext } from "../toolbar-context";
import styles from "./year-label.module.css";

export interface CalendarToolbarYearLabelProps {
  col?: number | string;
}

export const CalendarToolbarYearLabel: React.FC<
  CalendarToolbarYearLabelProps
> = ({ col }) => {
  const tb = useToolbarContext();

  if (!tb) return null;

  return (
    <span className={styles.label} style={getGridSlotStyle(col)}>
      {tb.date.getFullYear()}
    </span>
  );
};
