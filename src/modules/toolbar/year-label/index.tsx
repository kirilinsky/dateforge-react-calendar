import type React from "react";
import "@/styles/layers.css";
import { useConfig } from "@/context/config-context";
import shared from "@/global/global.module.css";
import {
  DEFAULT_CURRENT_YEAR_LABEL,
  formatActionLabel,
  resolveActionLabel,
} from "@/utils/action-labels";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { useToolbarContext } from "../toolbar-context";
import styles from "./year-label.module.css";

export interface CalendarToolbarYearLabelProps {
  col?: number | string;
  currentYearLabel?: string;
  /** Shift displayed year by N months relative to the toolbar view date. */
  offset?: number;
}

export const CalendarToolbarYearLabel: React.FC<
  CalendarToolbarYearLabelProps
> = ({ col, currentYearLabel, offset }) => {
  const tb = useToolbarContext();
  const { actionLabels } = useConfig();

  if (!tb) return null;

  const displayDate = offset
    ? new Date(tb.baseDate.getFullYear(), tb.baseDate.getMonth() + offset, 1)
    : tb.date;
  const year = displayDate.getFullYear();

  const ariaLabel = formatActionLabel(
    resolveActionLabel(
      currentYearLabel,
      actionLabels.currentYearLabel,
      DEFAULT_CURRENT_YEAR_LABEL,
    ),
    "year",
    year,
  );

  return (
    <span className={styles.label} style={getGridSlotStyle(col)}>
      <span className={shared.srOnly}>{ariaLabel}</span>
      <span aria-hidden>{year}</span>
    </span>
  );
};
