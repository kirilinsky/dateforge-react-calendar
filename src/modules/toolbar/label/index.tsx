import type React from "react";
import "@/styles/layers.css";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { useToolbarContext } from "../toolbar-context";
import styles from "./label.module.css";

export interface CalendarToolbarLabelProps {
  children?: React.ReactNode;
  col?: number | string;
  label?: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export const CalendarToolbarLabel: React.FC<CalendarToolbarLabelProps> = ({
  children,
  col,
  label,
  level = 2,
}) => {
  const tb = useToolbarContext();

  if (!tb) return null;

  return (
    <span
      className={styles.label}
      role="heading"
      aria-level={level}
      style={getGridSlotStyle(col)}
    >
      {label ?? children}
    </span>
  );
};
