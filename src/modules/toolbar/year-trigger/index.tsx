import type React from "react";
import "@/styles/layers.css";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import {
  useSelectionActions,
  useSelectionValue,
} from "@/context/selection-context";
import { useUI } from "@/context/ui-context";
import shared from "@/global/global.module.css";
import { Down } from "@/Icons";
import {
  DEFAULT_CHANGE_YEAR_LABEL,
  DEFAULT_CONFIRM_LABEL,
  DEFAULT_SELECT_YEAR_LABEL,
  DEFAULT_YEAR_TRACK_LABEL,
  formatActionLabel,
  resolveActionLabel,
} from "@/utils/action-labels";
import { clampBoundDate } from "@/utils/clamp-bound-date";
import { isYearFixed } from "@/utils/date-core";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { YearPopup } from "../_internal/month-year-track";
import { useToolbarContext } from "../toolbar-context";
import styles from "./year-trigger.module.css";

export interface CalendarToolbarYearTriggerProps {
  compact?: boolean;
  col?: number | string;
  changeYearLabel?: string;
  confirmLabel?: string;
  selectYearLabel?: string;
  yearTrackLabel?: string;
}

export const CalendarToolbarYearTrigger: React.FC<
  CalendarToolbarYearTriggerProps
> = ({
  compact = false,
  col,
  changeYearLabel,
  confirmLabel,
  selectYearLabel,
  yearTrackLabel,
}) => {
  const tb = useToolbarContext();
  const { minDate, maxDate, readOnly, actionLabels } = useConfig();
  const { navigateTo } = useNavigation();
  const { rangeStart, rangeEnd } = useSelectionValue();
  const { onRangeBoundSet } = useSelectionActions();
  const { setPopupAnchorEl } = useUI();

  if (!tb) return null;

  const {
    date,
    isBound,
    bound,
    setLocalView,
    yearPopupOpen,
    setYearPopupOpen,
  } = tb;

  const cur = date.getFullYear();
  const yearFixed = isYearFixed(cur, minDate, maxDate);

  const resolvedChangeLabel = resolveActionLabel(
    changeYearLabel,
    actionLabels.changeYearLabel,
    DEFAULT_CHANGE_YEAR_LABEL,
  );
  const resolvedConfirmLabel = resolveActionLabel(
    confirmLabel,
    actionLabels.confirmLabel,
    DEFAULT_CONFIRM_LABEL,
  );
  const resolvedSelectLabel = resolveActionLabel(
    selectYearLabel,
    actionLabels.selectYearLabel,
    DEFAULT_SELECT_YEAR_LABEL,
  );
  const resolvedTrackLabel = resolveActionLabel(
    yearTrackLabel,
    actionLabels.yearTrackLabel,
    DEFAULT_YEAR_TRACK_LABEL,
  );

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    setPopupAnchorEl(e.currentTarget);
    setYearPopupOpen(true);
  };

  const handleConfirm = (newDate: Date) => {
    if (isBound) {
      const clamped = clampBoundDate(newDate, bound!, rangeStart, rangeEnd);
      setLocalView(clamped);
      if (!readOnly) onRangeBoundSet(bound!, clamped);
    } else {
      navigateTo(newDate);
    }
    setYearPopupOpen(false);
  };

  return (
    <>
      <button
        type="button"
        disabled={yearFixed || readOnly}
        onClick={yearFixed || readOnly ? undefined : handleOpen}
        aria-label={formatActionLabel(resolvedChangeLabel, "year", cur)}
        aria-haspopup={yearFixed ? undefined : "dialog"}
        aria-expanded={yearFixed ? undefined : yearPopupOpen}
        className={`${compact ? styles.compactButton : styles.labelButton} ${shared.interactive} ${shared.hovered} ${yearFixed ? styles.staticButton : ""}`}
        style={getGridSlotStyle(col)}
      >
        {compact && <Down />}
        <span>{cur}</span>
      </button>

      {yearPopupOpen && (
        <YearPopup
          date={date}
          minDate={minDate}
          maxDate={maxDate}
          confirmLabel={resolvedConfirmLabel}
          label={resolvedSelectLabel}
          yearTrackLabel={resolvedTrackLabel}
          onConfirm={handleConfirm}
          onClose={() => setYearPopupOpen(false)}
        />
      )}
    </>
  );
};
