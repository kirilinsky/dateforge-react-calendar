import type React from "react";
import "@/styles/layers.css";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import {
  useSelectionActions,
  useSelectionValue,
} from "@/context/selection-context";
import shared from "@/global/global.module.css";
import { useClientValue } from "@/hooks/use-client-value";
import { Home } from "@/Icons";
import { DEFAULT_HOME_LABEL, resolveActionLabel } from "@/utils/action-labels";
import { clampBoundDate } from "@/utils/clamp-bound-date";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { useToolbarContext } from "../toolbar-context";
import styles from "./home.module.css";

export interface CalendarToolbarHomeProps {
  col?: number | string;
  homeLabel?: string;
}

export const CalendarToolbarHome: React.FC<CalendarToolbarHomeProps> = ({
  col,
  homeLabel,
}) => {
  const tb = useToolbarContext();
  const { actionLabels, range, readOnly } = useConfig();
  const { navigateTo } = useNavigation();
  const { rangeStart, rangeEnd } = useSelectionValue();
  const { onRangeBoundSet } = useSelectionActions();
  const today = useClientValue<Date | null>(() => new Date(), null);

  if (!tb) return null;

  const resolvedHomeLabel = resolveActionLabel(
    homeLabel,
    actionLabels.homeLabel,
    DEFAULT_HOME_LABEL,
  );
  const isCurrentMonth =
    !!today &&
    tb.date.getFullYear() === today.getFullYear() &&
    tb.date.getMonth() === today.getMonth();

  const handleClick = () => {
    if (!today || isCurrentMonth || readOnly) return;
    const next = new Date(tb.date);
    next.setFullYear(today.getFullYear());
    next.setMonth(today.getMonth(), 1);
    if (tb.isBound && range && tb.bound) {
      const clamped = clampBoundDate(next, tb.bound, rangeStart, rangeEnd);
      tb.setLocalView(clamped);
      onRangeBoundSet(tb.bound, clamped);
    } else {
      navigateTo(next);
    }
  };

  return (
    <button
      type="button"
      className={`${styles.button} ${shared.interactive} ${shared.hovered} ${isCurrentMonth ? styles.disabled : ""}`}
      disabled={!today || isCurrentMonth || readOnly}
      aria-label={resolvedHomeLabel}
      style={getGridSlotStyle(col)}
      onClick={handleClick}
    >
      <Home />
    </button>
  );
};
