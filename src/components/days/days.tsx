import React, { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./days.module.css";
import { useCalendarContext } from "../provider/provider";
import {
  getFirstDayOffset,
  getNextMonthFromSwipe,
  getCalendarData,
  isSameDay,
} from "@/utils/date-utils";
import shared from "@/global/global.module.css";
import WeekDays from "../week-days/week-days";

export const DaysComponent: React.FC<{
  dateOverride?: Date;
  gridArea?: string;
  hideOtherMonths?: boolean;
}> = ({ dateOverride, gridArea = "DD", hideOtherMonths = false }) => {
  const {
    startDate,
    endDate,
    date,
    selectedDates,
    onChangeDate,
    gestures,
    disabled,
    navigateTo,
    hideLimited,
    hideDisabled,
    startOfWeek,
    showWeekNumber,
    range,
    rangeStart,
    rangeEnd,
    hoverDate,
    setHoverDate,
    rangeMinDays,
    rangeMaxDays,
    twoMonthsLayout,
    highlightToday,
  } = useCalendarContext();

  const today = useMemo(() => new Date(), []);

  const startT = startDate
    ? new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
      ).getTime()
    : null;
  const endT = endDate
    ? new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
        23,
        59,
        59,
        999,
      ).getTime()
    : null;

  const [direction, setDirection] = useState<"left" | "right" | "none">("none");
  const [prevDate, setPrevDate] = useState(date);

  const effectiveDate = dateOverride ?? date;
  const currentMonth = effectiveDate.getMonth();
  const currentYear = effectiveDate.getFullYear();
  const offset = getFirstDayOffset(effectiveDate, startOfWeek);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    const isSameMonth =
      date.getMonth() === prevDate.getMonth() &&
      date.getFullYear() === prevDate.getFullYear();
    if (!isSameMonth) {
      const isForward = date.getTime() > prevDate.getTime();
      setDirection(isForward ? "right" : "left");
      setPrevDate(date);
    }
  }, [date, prevDate]);

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!gestures || touchStartX === null) return;
    const deltaX = touchStartX - e.changedTouches[0].clientX;
    const nextDate = getNextMonthFromSwipe(
      deltaX,
      date,
      startDate,
      endDate,
      50,
      disabled,
    );
    if (nextDate) navigateTo(nextDate);
    setTouchStartX(null);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!gestures) return;
    setTouchStartX(e.changedTouches[0].clientX);
  };

  const weeksData = useMemo(() => {
    return getCalendarData(
      currentYear,
      currentMonth,
      offset,
      selectedDates,
      startDate,
      endDate,
      disabled,
      range
        ? { rangeStart, rangeEnd, hoverDate, rangeMinDays, rangeMaxDays }
        : undefined,
    );
  }, [
    currentYear,
    currentMonth,
    offset,
    selectedDates,
    startDate,
    endDate,
    disabled,
    range,
    rangeStart,
    rangeEnd,
    hoverDate,
    rangeMinDays,
    rangeMaxDays,
  ]);

  const handleSetDay = useCallback(
    (targetDate: Date, isDisabled: boolean) => {
      if (isDisabled) return;
      const next = new Date(targetDate);
      next.setHours(
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        date.getMilliseconds(),
      );
      if (startDate && next.getTime() < startDate.getTime()) {
        next.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);
      }
      if (endDate && next.getTime() > endDate.getTime()) {
        next.setHours(endDate.getHours(), endDate.getMinutes(), 0, 0);
      }
      onChangeDate(next);
      if (dateOverride) navigateTo(date);
    },
    [onChangeDate, navigateTo, date, startDate, endDate, dateOverride],
  );

  const isPickingRange = range && rangeStart && !rangeEnd;

  const handleMouseEnter = useCallback(
    (fullDate: Date) => {
      if (!isPickingRange || !rangeStart) return;
      const diffDays =
        Math.round(
          Math.abs(fullDate.getTime() - rangeStart.getTime()) / 86400000,
        ) + 1;
      if (rangeMinDays !== undefined && diffDays < rangeMinDays) return;
      if (rangeMaxDays !== undefined && diffDays > rangeMaxDays) return;
      setHoverDate(fullDate);
    },
    [isPickingRange, setHoverDate, rangeStart, rangeMinDays, rangeMaxDays],
  );

  const handleMouseLeave = useCallback(() => {
    if (range) setHoverDate(null);
  }, [range, setHoverDate]);

  const animationKey = `${currentMonth}-${currentYear}`;

  const isDayHidden = (d: {
    fullDate: Date;
    isDisabled: boolean;
    isCurrentMonth: boolean;
  }) => {
    const t = d.fullDate.getTime();
    if (
      hideLimited &&
      ((startT !== null && t < startT) || (endT !== null && t > endT))
    )
      return true;
    if (hideDisabled && d.isDisabled) return true;
    if (hideOtherMonths && !d.isCurrentMonth) return true;
    return false;
  };

  return (
    <div
      aria-label="days"
      key={animationKey}
      style={{ gridArea }}
      onTouchEnd={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onMouseLeave={handleMouseLeave}
      className={[
        styles.dayGridContainer,
        direction !== "none" ? styles[direction] : "",
        showWeekNumber ? styles.withWeekNumbers : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <WeekDays />
      <div role="row" style={{ display: "contents", gridArea: "DD" }}>
        {weeksData.map((week, wIndex) => {
          const isLastRow = wIndex === weeksData.length - 1;
          if (
            isLastRow &&
            (hideLimited || hideDisabled || twoMonthsLayout) &&
            week.days.every((d) =>
              isDayHidden({
                fullDate: d.fullDate,
                isDisabled: d.isDisabled,
                isCurrentMonth: d.isCurrentMonth,
              }),
            )
          ) {
            return null;
          }

          return (
            <React.Fragment key={wIndex}>
              {showWeekNumber && (
                <div className={styles.weekNumberItem}>{week.weekNumber}</div>
              )}
              {week.days.map(
                (
                  {
                    day,
                    fullDate,
                    isCurrentMonth,
                    isDisabled,
                    isSelected,
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
                  },
                  i,
                ) => {
                  if (isDayHidden({ fullDate, isDisabled, isCurrentMonth }))
                    return <span key={i} className={styles.dayItemEmpty} />;

                  const rangeEndpointClass =
                    isRangeStart && rangeBridgeRight
                      ? styles.rStart
                      : isRangeEnd && rangeBridgeLeft
                        ? styles.rEnd
                        : null;
                  const rangeBridgeClass =
                    isRangeStart && rangeBridgeRight
                      ? styles.rBridgeRight
                      : isRangeEnd && rangeBridgeLeft
                        ? styles.rBridgeLeft
                        : isInRange && rangeBridgeLeft && rangeBridgeRight
                          ? styles.rBridgeBoth
                          : isInRange && rangeBridgeLeft
                            ? styles.rBridgeLeft
                            : isInRange && rangeBridgeRight
                              ? styles.rBridgeRight
                              : null;

                  const previewClass =
                    isPreviewStart && isSelected
                      ? styles.rStart
                      : isPreviewEnd && isSelected
                        ? styles.rEnd
                        : isPreviewStart
                          ? styles.rPreviewStart
                          : isPreviewEnd
                            ? styles.rPreviewEnd
                            : isPreviewMid
                              ? styles.rPreview
                              : null;
                  const previewBridgeClass =
                    previewBridgeLeft && previewBridgeRight
                      ? styles.rPreviewBridgeBoth
                      : previewBridgeRight
                        ? styles.rPreviewBridgeRight
                        : previewBridgeLeft
                          ? styles.rPreviewBridgeLeft
                          : null;

                  const isToday =
                    !!highlightToday &&
                    isSameDay(fullDate, today) &&
                    !isRangeStart &&
                    !isRangeEnd &&
                    !isInRange &&
                    !isPreviewStart &&
                    !isPreviewEnd &&
                    !isPreviewMid;
                  const isOtherMonth = !isCurrentMonth;
                  const isHighlighted =
                    isSelected ||
                    isRangeStart ||
                    isRangeEnd ||
                    isInRange ||
                    isPreviewStart ||
                    isPreviewEnd ||
                    isPreviewMid;

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleSetDay(fullDate, isDisabled)}
                      onMouseEnter={() => handleMouseEnter(fullDate)}
                      aria-selected={isSelected}
                      className={[
                        styles.dayItem,
                        !range && isSelected && shared.activeItem,
                        !range &&
                          connectLeft &&
                          connectRight &&
                          styles.rangeMid,
                        !range &&
                          connectLeft &&
                          !connectRight &&
                          styles.rangeEnd,
                        !range &&
                          !connectLeft &&
                          connectRight &&
                          styles.rangeStart,
                        range && isSelected && shared.activeItem,
                        range && rangeEndpointClass,
                        range && rangeBridgeClass,
                        range && isInRange && styles.rIn,
                        previewClass,
                        previewBridgeClass,
                        isToday && styles.todayItem,
                        isOtherMonth &&
                          (isHighlighted
                            ? shared.selectedOtherItem
                            : shared.otherItem),
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {day}
                    </button>
                  );
                },
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
