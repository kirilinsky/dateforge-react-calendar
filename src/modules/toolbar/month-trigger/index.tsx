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
  DEFAULT_CHANGE_MONTH_LABEL,
  DEFAULT_CONFIRM_LABEL,
  DEFAULT_MONTH_TRACK_LABEL,
  DEFAULT_SELECT_MONTH_LABEL,
  formatActionLabel,
  resolveActionLabel,
} from "@/utils/action-labels";
import { clampBoundDate } from "@/utils/clamp-bound-date";
import { isYearFixed } from "@/utils/date-core";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { getDateTimeFormat } from "@/utils/intl-cache";
import { MonthPopup } from "../_internal/month-year-track";
import { useToolbarContext } from "../toolbar-context";
import styles from "./month-trigger.module.css";

export interface CalendarToolbarMonthTriggerProps {
  compact?: boolean;
  col?: number | string;
  changeMonthLabel?: string;
  confirmLabel?: string;
  selectMonthLabel?: string;
  monthTrackLabel?: string;
  /** Shift displayed month by N months relative to the toolbar view date. */
  offset?: number;
}

export const CalendarToolbarMonthTrigger: React.FC<
  CalendarToolbarMonthTriggerProps
> = ({
  compact = false,
  col,
  changeMonthLabel,
  confirmLabel,
  selectMonthLabel,
  monthTrackLabel,
  offset,
}) => {
  const tb = useToolbarContext();
  const { minDate, maxDate, locale, readOnly, actionLabels } = useConfig();
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
    monthPopupOpen,
    setMonthPopupOpen,
  } = tb;

  const displayDate = offset
    ? new Date(tb.baseDate.getFullYear(), tb.baseDate.getMonth() + offset, 1)
    : date;

  const monthFixed = isYearFixed(
    displayDate.getFullYear(),
    minDate,
    maxDate,
    displayDate.getMonth(),
  );
  const monthLong = getDateTimeFormat(locale, { month: "long" }).format(
    displayDate,
  );
  const monthShort = getDateTimeFormat(locale, { month: "short" }).format(
    displayDate,
  );

  const resolvedChangeLabel = resolveActionLabel(
    changeMonthLabel,
    actionLabels.changeMonthLabel,
    DEFAULT_CHANGE_MONTH_LABEL,
  );
  const resolvedConfirmLabel = resolveActionLabel(
    confirmLabel,
    actionLabels.confirmLabel,
    DEFAULT_CONFIRM_LABEL,
  );
  const resolvedSelectLabel = resolveActionLabel(
    selectMonthLabel,
    actionLabels.selectMonthLabel,
    DEFAULT_SELECT_MONTH_LABEL,
  );
  const resolvedTrackLabel = resolveActionLabel(
    monthTrackLabel,
    actionLabels.monthTrackLabel,
    DEFAULT_MONTH_TRACK_LABEL,
  );

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    setPopupAnchorEl(e.currentTarget);
    setMonthPopupOpen(true);
  };

  const handleConfirm = (newDate: Date) => {
    if (isBound) {
      const clamped = clampBoundDate(newDate, bound!, rangeStart, rangeEnd);
      setLocalView(clamped);
      if (!readOnly) onRangeBoundSet(bound!, clamped);
    } else {
      navigateTo(newDate);
    }
    setMonthPopupOpen(false);
  };

  return (
    <>
      <button
        type="button"
        disabled={monthFixed || readOnly}
        onClick={monthFixed || readOnly ? undefined : handleOpen}
        aria-label={formatActionLabel(resolvedChangeLabel, "month", monthLong)}
        aria-haspopup={monthFixed ? undefined : "dialog"}
        aria-expanded={monthFixed ? undefined : monthPopupOpen}
        className={`${compact ? styles.compactButton : styles.labelButton} ${shared.interactive} ${shared.hovered} ${monthFixed ? styles.staticButton : ""}`}
        style={getGridSlotStyle(col)}
      >
        {compact && <Down />}
        <span className={styles.monthLong}>{monthLong}</span>
        <span className={styles.monthShort}>{monthShort}</span>
      </button>

      {monthPopupOpen && (
        <MonthPopup
          date={displayDate}
          locale={locale}
          minDate={minDate}
          maxDate={maxDate}
          confirmLabel={resolvedConfirmLabel}
          label={resolvedSelectLabel}
          monthTrackLabel={resolvedTrackLabel}
          onConfirm={handleConfirm}
          onClose={() => setMonthPopupOpen(false)}
        />
      )}
    </>
  );
};
