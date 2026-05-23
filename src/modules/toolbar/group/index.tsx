import type React from "react";
import "@/styles/layers.css";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { useToolbarContext } from "../toolbar-context";
import styles from "./group.module.css";

export interface CalendarToolbarGroupProps {
  children?: React.ReactNode;
  col?: number | string;
}

export const CalendarToolbarGroup: React.FC<CalendarToolbarGroupProps> = ({
  children,
  col,
}) => {
  const tb = useToolbarContext();

  if (!tb) return null;

  return (
    <div className={styles.group} style={getGridSlotStyle(col)}>
      {children}
    </div>
  );
};
