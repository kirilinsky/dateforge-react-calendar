import type React from "react";
import "@/styles/layers.css";
import { useConfig } from "@/context/config-context";
import { useSelectionValue } from "@/context/selection-context";
import shared from "@/global/global.module.css";
import { Check } from "@/Icons";
import type { DateRange } from "@/types/calendar";
import { DEFAULT_APPLY_LABEL, resolveActionLabel } from "@/utils/action-labels";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { useToolbarContext } from "../toolbar-context";
import styles from "./apply.module.css";

export type ApplyValue = Date | null | Date[] | DateRange;

export interface CalendarToolbarApplyProps {
  applyLabel?: string;
  children?: React.ReactNode;
  col?: number | string;
  disabled?: boolean;
  onApply?: (value: ApplyValue) => void;
}

export const CalendarToolbarApply: React.FC<CalendarToolbarApplyProps> = ({
  applyLabel,
  children,
  col,
  disabled: disabledProp,
  onApply,
}) => {
  const tb = useToolbarContext();
  const { actionLabels, readOnly, range, multiselect } = useConfig();
  const { selectedDates, rangeStart, rangeEnd } = useSelectionValue();

  if (!tb) return null;

  const hasSelection = !!(rangeStart || rangeEnd || selectedDates.length > 0);
  const isDisabled = disabledProp ?? (!hasSelection || readOnly);
  const resolvedLabel = resolveActionLabel(
    applyLabel,
    actionLabels.applyLabel,
    DEFAULT_APPLY_LABEL,
  );
  const hasContent = children != null;

  const getValue = (): ApplyValue => {
    if (range) return { from: rangeStart, to: rangeEnd };
    if (multiselect) return selectedDates;
    return selectedDates[0] ?? null;
  };

  return (
    <button
      type="button"
      className={`${styles.button} ${hasContent ? styles.withLabel : ""} ${shared.interactive} ${shared.hovered}`}
      disabled={isDisabled}
      aria-label={resolvedLabel}
      style={getGridSlotStyle(col)}
      onClick={() => {
        if (!isDisabled) onApply?.(getValue());
      }}
    >
      {hasContent ? children : <Check />}
    </button>
  );
};
