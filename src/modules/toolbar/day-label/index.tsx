import type React from "react";
import "@/styles/layers.css";
import { useConfig } from "@/context/config-context";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { getDateTimeFormat } from "@/utils/intl-cache";
import { useToolbarContext } from "../toolbar-context";
import styles from "./day-label.module.css";

export interface CalendarToolbarDayLabelProps {
  col?: number | string;
  format?: "numeric" | "2-digit" | "long";
}

export const CalendarToolbarDayLabel: React.FC<
  CalendarToolbarDayLabelProps
> = ({ col, format = "numeric" }) => {
  const tb = useToolbarContext();
  const { locale } = useConfig();

  if (!tb) return null;

  const label =
    format === "long"
      ? getDateTimeFormat(locale, {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(tb.date)
      : getDateTimeFormat(locale, { day: format }).format(tb.date);

  return (
    <span className={styles.label} style={getGridSlotStyle(col)}>
      {label}
    </span>
  );
};
