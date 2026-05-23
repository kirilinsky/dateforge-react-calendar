import type React from "react";
import "@/styles/layers.css";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import {
  useSelectionActions,
  useSelectionValue,
} from "@/context/selection-context";
import shared from "@/global/global.module.css";
import { ChevronRight } from "@/Icons";
import {
  DEFAULT_NEXT_MONTH_LABEL,
  DEFAULT_NEXT_YEAR_LABEL,
  resolveActionLabel,
} from "@/utils/action-labels";
import { clampBoundDate } from "@/utils/clamp-bound-date";
import { addDate, checkYearNavigation } from "@/utils/date-core";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { useToolbarContext } from "../toolbar-context";
import styles from "./next.module.css";

export type NavUnit = "day" | "month" | "year";

export interface CalendarToolbarNextProps {
  unit?: NavUnit;
  col?: number | string;
  nextMonthLabel?: string;
  nextYearLabel?: string;
  nextDayLabel?: string;
}

export const CalendarToolbarNext: React.FC<CalendarToolbarNextProps> = ({
  unit = "month",
  col,
  nextMonthLabel,
  nextYearLabel,
  nextDayLabel,
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
    const { canGoNext } = checkYearNavigation(
      date.getFullYear(),
      minDate,
      maxDate,
    );
    canGo = canGoNext;
    ariaLabel = resolveActionLabel(
      nextYearLabel,
      actionLabels.nextYearLabel,
      DEFAULT_NEXT_YEAR_LABEL,
    );
  } else if (unit === "month") {
    const { canGoNextMonth } = checkYearNavigation(
      date.getFullYear(),
      minDate,
      maxDate,
      date,
      disabled,
    );
    canGo = canGoNextMonth;
    ariaLabel = resolveActionLabel(
      nextMonthLabel,
      actionLabels.nextMonthLabel,
      DEFAULT_NEXT_MONTH_LABEL,
    );
  } else {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    canGo = !maxDate || next <= maxDate;
    ariaLabel = nextDayLabel ?? "Next day";
  }

  const handleClick = () => {
    if (!canGo || readOnly) return;
    if (unit === "day") {
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      if (maxDate && next > maxDate) return;
      navigate(next);
    } else {
      navigate(addDate(date, 1, unit, minDate, maxDate));
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
      <ChevronRight />
    </button>
  );
};
