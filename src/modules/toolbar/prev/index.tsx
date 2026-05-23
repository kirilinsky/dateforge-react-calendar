import type React from "react";
import "@/styles/layers.css";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import {
  useSelectionActions,
  useSelectionValue,
} from "@/context/selection-context";
import shared from "@/global/global.module.css";
import { ChevronLeft } from "@/Icons";
import {
  DEFAULT_PREVIOUS_MONTH_LABEL,
  DEFAULT_PREVIOUS_YEAR_LABEL,
  resolveActionLabel,
} from "@/utils/action-labels";
import { clampBoundDate } from "@/utils/clamp-bound-date";
import { addDate, checkYearNavigation } from "@/utils/date-core";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { useToolbarContext } from "../toolbar-context";
import styles from "./prev.module.css";

export type NavUnit = "day" | "month" | "year";

export interface CalendarToolbarPrevProps {
  unit?: NavUnit;
  col?: number | string;
  previousMonthLabel?: string;
  previousYearLabel?: string;
  previousDayLabel?: string;
}

export const CalendarToolbarPrev: React.FC<CalendarToolbarPrevProps> = ({
  unit = "month",
  col,
  previousMonthLabel,
  previousYearLabel,
  previousDayLabel,
}) => {
  const tb = useToolbarContext();
  const { minDate, maxDate, readOnly, disabled, actionLabels } = useConfig();
  const { navigateTo } = useNavigation();
  const { rangeStart, rangeEnd } = useSelectionValue();
  const { onRangeBoundSet } = useSelectionActions();

  if (!tb) return null;

  const { date, isBound, bound, setLocalView } = tb;

  const navigate = (next: Date) => {
    if (isBound) {
      const clamped = clampBoundDate(next, bound!, rangeStart, rangeEnd);
      setLocalView(clamped);
      if (!readOnly) onRangeBoundSet(bound!, clamped);
    } else {
      navigateTo(next);
    }
  };

  let canGo = true;
  let ariaLabel: string;

  if (unit === "year") {
    const { canGoPrev } = checkYearNavigation(
      date.getFullYear(),
      minDate,
      maxDate,
    );
    canGo = canGoPrev;
    ariaLabel = resolveActionLabel(
      previousYearLabel,
      actionLabels.previousYearLabel,
      DEFAULT_PREVIOUS_YEAR_LABEL,
    );
  } else if (unit === "month") {
    const { canGoPrevMonth } = checkYearNavigation(
      date.getFullYear(),
      minDate,
      maxDate,
      date,
      disabled,
    );
    canGo = canGoPrevMonth;
    ariaLabel = resolveActionLabel(
      previousMonthLabel,
      actionLabels.previousMonthLabel,
      DEFAULT_PREVIOUS_MONTH_LABEL,
    );
  } else {
    const prev = new Date(date);
    prev.setDate(prev.getDate() - 1);
    canGo = !minDate || prev >= minDate;
    ariaLabel = previousDayLabel ?? "Previous day";
  }

  const handleClick = () => {
    if (!canGo || readOnly) return;
    if (unit === "day") {
      const next = new Date(date);
      next.setDate(next.getDate() - 1);
      if (minDate && next < minDate) return;
      navigate(next);
    } else {
      navigate(addDate(date, -1, unit, minDate, maxDate));
    }
  };

  return (
    <button
      type="button"
      disabled={!canGo || readOnly}
      aria-label={ariaLabel}
      className={`${styles.arrow} ${shared.interactive} ${shared.hovered}`}
      style={getGridSlotStyle(col)}
      onClick={handleClick}
    >
      <ChevronLeft />
    </button>
  );
};
