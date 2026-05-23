import type React from "react";
import "@/styles/layers.css";
import { useConfig } from "@/context/config-context";
import {
  useSelectionActions,
  useSelectionValue,
} from "@/context/selection-context";
import shared from "@/global/global.module.css";
import { Clear } from "@/Icons";
import { DEFAULT_CLEAR_LABEL, resolveActionLabel } from "@/utils/action-labels";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { useToolbarContext } from "../toolbar-context";
import styles from "./clear.module.css";

export interface CalendarToolbarClearProps {
  clearLabel?: string;
  col?: number | string;
}

export const CalendarToolbarClear: React.FC<CalendarToolbarClearProps> = ({
  clearLabel,
  col,
}) => {
  const tb = useToolbarContext();
  const { actionLabels, readOnly } = useConfig();
  const { selectedDates } = useSelectionValue();
  const { onChangeDate, onRangeBoundSet } = useSelectionActions();

  if (!tb) return null;

  const disabled = tb.isBound
    ? !tb.boundDate || readOnly
    : selectedDates.length === 0 || readOnly;
  const resolvedClearLabel = resolveActionLabel(
    clearLabel,
    actionLabels.clearLabel,
    DEFAULT_CLEAR_LABEL,
  );

  return (
    <button
      type="button"
      className={`${styles.button} ${shared.interactive} ${shared.hovered} ${disabled ? styles.disabled : ""}`}
      disabled={disabled}
      aria-label={resolvedClearLabel}
      style={getGridSlotStyle(col)}
      onClick={() =>
        tb.isBound && tb.bound
          ? onRangeBoundSet(tb.bound, null)
          : onChangeDate(null)
      }
    >
      <Clear />
    </button>
  );
};
