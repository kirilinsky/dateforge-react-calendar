import type React from "react";
import { useMemo } from "react";
import "@/styles/layers.css";
import { useConfig } from "@/context/config-context";
import shared from "@/global/global.module.css";
import {
  DEFAULT_CURRENT_MONTH_LABEL,
  formatActionLabel,
  resolveActionLabel,
} from "@/utils/action-labels";
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
  currentMonthLabel?: string;
  /** Shift displayed month by N months relative to the toolbar view date. */
  offset?: number;
}

export const CalendarToolbarMonthLabel: React.FC<
  CalendarToolbarMonthLabelProps
> = ({ col, short = false, currentMonthLabel, offset }) => {
  const tb = useToolbarContext();
  const { locale, actionLabels } = useConfig();
  const sizer = useMemo(
    () => longestBy(getMonthNames(locale, short)),
    [locale, short],
  );

  if (!tb) return null;

  const displayDate = offset
    ? new Date(tb.baseDate.getFullYear(), tb.baseDate.getMonth() + offset, 1)
    : tb.date;

  const month = getDateTimeFormat(locale, {
    month: short ? "short" : "long",
  }).format(displayDate);

  const monthLong = short
    ? getDateTimeFormat(locale, { month: "long" }).format(displayDate)
    : month;

  const ariaLabel = formatActionLabel(
    resolveActionLabel(
      currentMonthLabel,
      actionLabels.currentMonthLabel,
      DEFAULT_CURRENT_MONTH_LABEL,
    ),
    "month",
    monthLong,
  );

  return (
    <span className={styles.label} style={getGridSlotStyle(col)}>
      <span className={shared.srOnly}>{ariaLabel}</span>
      <span className={styles.slot} aria-hidden>
        <span className={styles.sizer}>{sizer}</span>
        <span>{month}</span>
      </span>
    </span>
  );
};
