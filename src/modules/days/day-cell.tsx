import React, { type ReactNode, useMemo } from "react";
import { getDayCellClassName } from "./day-cell-class-name";
import styles from "./days.module.css";

export interface DayState {
  isSelected: boolean;
  isToday: boolean;
  isDisabled: boolean;
  isWeekend: boolean;
  isInRange: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isOtherMonth: boolean;
}

export type RenderDay = (date: Date, state: DayState) => ReactNode;

interface BuildCellLabelArgs {
  fullDate: Date;
  cellFmt: Intl.DateTimeFormat;
  isDisabled: boolean;
  isSelected: boolean;
  isTodayDate: boolean;
  highlightToday: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
  range: boolean;
}

export function buildCellLabel(args: BuildCellLabelArgs): string {
  const parts = [args.cellFmt.format(args.fullDate)];
  if (args.highlightToday && args.isTodayDate) parts.push("today");
  if (args.range) {
    if (args.isRangeStart) parts.push("range start");
    else if (args.isRangeEnd) parts.push("range end");
    else if (args.isInRange) parts.push("in range");
  } else if (args.isSelected) {
    parts.push("selected");
  }
  if (args.isDisabled) parts.push("disabled");
  return parts.join(", ");
}

export interface DayCellProps {
  day: number;
  dateTime: number;
  isDisabled: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  connectLeft: boolean;
  connectRight: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
  rangeBridgeLeft: boolean;
  rangeBridgeRight: boolean;
  isPreviewStart: boolean;
  isPreviewEnd: boolean;
  isPreviewMid: boolean;
  previewBridgeLeft: boolean;
  previewBridgeRight: boolean;
  isTodayDate: boolean;
  highlightToday: boolean;
  isWeekend: boolean;
  boldWeekends: boolean;
  range: boolean;
  ariaLabel: string;
  tabIndex: number;
  readOnly: boolean;
  isMaxReachedTarget: boolean;
  onSelect: (date: Date, isDisabled: boolean) => void;
  onMouseEnter: (date: Date) => void;
  onKeyDown: (e: React.KeyboardEvent, date: Date) => void;
  renderDay?: RenderDay;
}

export const DayCell = React.memo(function DayCell({
  day,
  dateTime,
  isDisabled,
  isSelected,
  isCurrentMonth,
  connectLeft,
  connectRight,
  isRangeStart,
  isRangeEnd,
  isInRange,
  rangeBridgeLeft,
  rangeBridgeRight,
  isPreviewStart,
  isPreviewEnd,
  isPreviewMid,
  previewBridgeLeft,
  previewBridgeRight,
  isTodayDate,
  highlightToday,
  isWeekend,
  boldWeekends,
  range,
  ariaLabel,
  tabIndex,
  readOnly,
  isMaxReachedTarget,
  onSelect,
  onMouseEnter,
  onKeyDown,
  renderDay,
}: DayCellProps) {
  const fullDate = useMemo(() => new Date(dateTime), [dateTime]);

  const isToday = !!highlightToday && isTodayDate;

  const isOtherMonth = !isCurrentMonth;
  const isHighlighted =
    isSelected ||
    isRangeStart ||
    isRangeEnd ||
    isInRange ||
    isPreviewStart ||
    isPreviewEnd ||
    isPreviewMid;

  const className = getDayCellClassName({
    range,
    isSelected,
    isDisabled,
    connectLeft,
    connectRight,
    isRangeStart,
    isRangeEnd,
    isInRange,
    rangeBridgeLeft,
    rangeBridgeRight,
    isPreviewStart,
    isPreviewEnd,
    isPreviewMid,
    previewBridgeLeft,
    previewBridgeRight,
    isToday,
    boldWeekends,
    isOtherMonth,
    isHighlighted,
    isMaxReachedTarget,
  });

  return (
    <div
      role="gridcell"
      aria-selected={isSelected}
      aria-disabled={isDisabled || readOnly || undefined}
    >
      <button
        type="button"
        tabIndex={tabIndex}
        onClick={() => {
          if (readOnly) return;
          onSelect(fullDate, isDisabled);
        }}
        onMouseEnter={() => onMouseEnter(fullDate)}
        onKeyDown={(e) => onKeyDown(e, fullDate)}
        aria-label={ariaLabel}
        aria-disabled={isDisabled || undefined}
        aria-current={isTodayDate ? "date" : undefined}
        data-cell=""
        data-selected={isSelected || undefined}
        data-today={isToday || undefined}
        data-disabled={isDisabled || undefined}
        data-range-mode={range || undefined}
        data-connect-left={connectLeft || undefined}
        data-connect-right={connectRight || undefined}
        data-in-range={isInRange || undefined}
        data-range-start={isRangeStart || undefined}
        data-range-end={isRangeEnd || undefined}
        data-range-bridge-left={rangeBridgeLeft || undefined}
        data-range-bridge-right={rangeBridgeRight || undefined}
        data-preview-start={isPreviewStart || undefined}
        data-preview-end={isPreviewEnd || undefined}
        data-preview-mid={isPreviewMid || undefined}
        data-preview-bridge-left={previewBridgeLeft || undefined}
        data-preview-bridge-right={previewBridgeRight || undefined}
        data-weekend={isWeekend || undefined}
        data-bold-weekend={boldWeekends || undefined}
        data-other-month={isOtherMonth || undefined}
        data-max-reached={isMaxReachedTarget || undefined}
        className={className}
      >
        {renderDay ? (
          renderDay(fullDate, {
            isSelected,
            isToday,
            isDisabled,
            isWeekend,
            isInRange,
            isRangeStart,
            isRangeEnd,
            isOtherMonth,
          })
        ) : (
          <span className={styles.dayLabel}>{day}</span>
        )}
      </button>
    </div>
  );
});
