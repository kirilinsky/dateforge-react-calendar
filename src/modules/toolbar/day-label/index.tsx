import type React from "react";
import "@/styles/layers.css";
import { useConfig } from "@/context/config-context";
import shared from "@/global/global.module.css";
import {
  DEFAULT_CURRENT_DAY_LABEL,
  formatActionLabel,
  resolveActionLabel,
} from "@/utils/action-labels";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { getDateTimeFormat } from "@/utils/intl-cache";
import { useToolbarContext } from "../toolbar-context";
import styles from "./day-label.module.css";

export interface CalendarToolbarDayLabelProps {
  col?: number | string;
  format?: "numeric" | "2-digit" | "long";
  currentDayLabel?: string;
}

export const CalendarToolbarDayLabel: React.FC<
  CalendarToolbarDayLabelProps
> = ({ col, format = "numeric", currentDayLabel }) => {
  const tb = useToolbarContext();
  const { locale, actionLabels } = useConfig();

  if (!tb) return null;

  const longLabel = getDateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(tb.date);

  const label =
    format === "long"
      ? longLabel
      : getDateTimeFormat(locale, { day: format }).format(tb.date);

  const ariaLabel = formatActionLabel(
    resolveActionLabel(
      currentDayLabel,
      actionLabels.currentDayLabel,
      DEFAULT_CURRENT_DAY_LABEL,
    ),
    "day",
    longLabel,
  );

  return (
    <span className={styles.label} style={getGridSlotStyle(col)}>
      <span className={shared.srOnly}>{ariaLabel}</span>
      <span aria-hidden>{label}</span>
    </span>
  );
};
