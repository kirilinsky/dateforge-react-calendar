import type React from "react";
import { useMemo } from "react";
import "@/styles/layers.css";
import { useConfig } from "@/context/config-context";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { getDateTimeFormat } from "@/utils/intl-cache";
import { getMonthNames } from "@/utils/month-utils";
import { useToolbarContext } from "../toolbar-context";
import styles from "./month-label.module.css";

const longestBy = (arr: string[]) =>
  arr.reduce((a, b) => (b.length > a.length ? b : a), "");

export interface CalendarToolbarMonthLabelProps {
  col?: number | string;
  /** Use localized short month name. */
  short?: boolean;
}

export const CalendarToolbarMonthLabel: React.FC<
  CalendarToolbarMonthLabelProps
> = ({ col, short = false }) => {
  const tb = useToolbarContext();
  const { locale } = useConfig();
  const sizer = useMemo(
    () => longestBy(getMonthNames(locale, short)),
    [locale, short],
  );

  if (!tb) return null;

  const month = getDateTimeFormat(locale, {
    month: short ? "short" : "long",
  }).format(tb.date);

  return (
    <span className={styles.label} style={getGridSlotStyle(col)}>
      <span className={styles.slot}>
        <span className={styles.sizer} aria-hidden>
          {sizer}
        </span>
        <span>{month}</span>
      </span>
    </span>
  );
};
