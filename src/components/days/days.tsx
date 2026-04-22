import React, { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./days.module.css";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import { useSelection } from "@/context/selection-context";
import { useUI } from "@/context/ui-context";
import {
  getFirstDayOffset,
  getNextMonthFromSwipe,
  getCalendarData,
  isSameDay,
} from "@/utils/date-utils";
import shared from "@/global/global.module.css";
import WeekDays from "../week-days/week-days";
import { StartOfWeek } from "@/types/calendar";

export const CalendarDays: React.FC<{
  offset?: number;
  hideOtherMonths?: boolean;
  col?: number | string;
  dataArea?: string;
  startOfWeek?: StartOfWeek;
  highlightWeekends?: boolean;
  showWeekNumber?: boolean;
  hideWeekdays?: boolean;
  highlightToday?: boolean;
  allowSwipeNavigation?: boolean;
  hideLimited?: boolean;
  preventUnselect?: boolean;
}> = ({
  offset = 0,
  hideOtherMonths = false,
  col,
  dataArea,
  startOfWeek = 1,
  highlightWeekends = true,
  showWeekNumber = false,
  hideWeekdays = false,
  highlightToday = true,
  allowSwipeNavigation = false,
  hideLimited = false,
  preventUnselect = false,
}) => {
  const { daysTrackActive } = useUI();
  const {
    minDate, maxDate, disabled,
    range, rangeMinDays, rangeMaxDays,
    locale,
  } = useConfig();

  const { viewDate: rawDate, navigateTo } = useNavigation();
  const date = offset
    ? new Date(rawDate.getFullYear(), rawDate.getMonth() + offset, 1)
    : rawDate;
  const resolvedArea = dataArea ?? (offset > 0 ? `days-${offset + 1}` : "days");
  const {
    selectedDates, onChangeDate,
    rangeStart, rangeEnd, hoverDate, setHoverDate,
  } = useSelection();

  const today = useMemo(() => new Date(), []);

  const startT = useMemo(
    () =>
      minDate
        ? new Date(
            minDate.getFullYear(),
            minDate.getMonth(),
            minDate.getDate(),
          ).getTime()
        : null,
    [minDate],
  );
  const endT = useMemo(
    () =>
      maxDate
        ? new Date(
            maxDate.getFullYear(),
            maxDate.getMonth(),
            maxDate.getDate(),
            23,
            59,
            59,
            999,
          ).getTime()
        : null,
    [maxDate],
  );

  const [direction, setDirection] = useState<"left" | "right" | "none">("none");
  const [prevDate, setPrevDate] = useState(date);

  const currentMonth = date.getMonth();
  const currentYear = date.getFullYear();
  const firstDayOffset = getFirstDayOffset(date, startOfWeek);
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

  const handleTouchEnd = allowSwipeNavigation
    ? (e: React.TouchEvent) => {
        if (touchStartX === null) return;
        const deltaX = touchStartX - e.changedTouches[0].clientX;
        const nextDate = getNextMonthFromSwipe(deltaX, date, minDate, maxDate, 50, disabled);
        if (nextDate) navigateTo(nextDate);
        setTouchStartX(null);
      }
    : undefined;

  const handleTouchStart = allowSwipeNavigation
    ? (e: React.TouchEvent) => { setTouchStartX(e.changedTouches[0].clientX); }
    : undefined;

  const weeksData = useMemo(() => {
    return getCalendarData(
      currentYear,
      currentMonth,
      firstDayOffset,
      selectedDates,
      minDate,
      maxDate,
      disabled,
      range
        ? { rangeStart, rangeEnd, hoverDate, rangeMinDays, rangeMaxDays }
        : undefined,
    );
  }, [
    currentYear,
    currentMonth,
    firstDayOffset,
    selectedDates,
    minDate,
    maxDate,
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
      if ((preventUnselect || daysTrackActive) && selectedDates.some((d) => isSameDay(d, targetDate))) return;
      const next = new Date(targetDate);
      next.setHours(
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        date.getMilliseconds(),
      );
      if (minDate && next.getTime() < minDate.getTime()) {
        next.setHours(minDate.getHours(), minDate.getMinutes(), 0, 0);
      }
      if (maxDate && next.getTime() > maxDate.getTime()) {
        next.setHours(maxDate.getHours(), maxDate.getMinutes(), 0, 0);
      }
      onChangeDate(next);
    },
    [onChangeDate, date, minDate, maxDate, preventUnselect, daysTrackActive, selectedDates],
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

  const isDayHidden = useCallback(
    (d: { fullDate: Date; isDisabled: boolean; isCurrentMonth: boolean }) => {
      const t = d.fullDate.getTime();
      if (hideLimited && (((startT !== null && t < startT) || (endT !== null && t > endT)) || d.isDisabled))
        return true;
      if (hideOtherMonths && !d.isCurrentMonth) return true;
      return false;
    },
    [hideLimited, hideOtherMonths, startT, endT],
  );

  return (
    <div
      data-area={resolvedArea}
      onTouchEnd={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onMouseLeave={handleMouseLeave}
      style={col !== undefined ? { gridColumn: typeof col === "number" ? `span ${col}` : col } : undefined}
    >
    <div
      aria-label="days"
      key={animationKey}
      className={[
        styles.dayGridContainer,
        direction !== "none" ? styles[direction] : "",
        showWeekNumber ? styles.withWeekNumbers : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <WeekDays
        locale={locale}
        startOfWeek={startOfWeek}
        highlightWeekends={highlightWeekends}
        showWeekNumber={showWeekNumber}
        hideWeekdays={hideWeekdays}
      />
      <div role="row" style={{ display: "contents" }}>
        {weeksData.map((week, wIndex) => {
          const isLastRow = wIndex === weeksData.length - 1;
          if (
            isLastRow &&
            hideLimited &&
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

                  const dayOfWeek = fullDate.getDay();
                  const isWeekend = highlightWeekends && (dayOfWeek === 0 || dayOfWeek === 6);

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleSetDay(fullDate, isDisabled)}
                      onMouseEnter={() => handleMouseEnter(fullDate)}
                      aria-selected={isSelected}
                      data-cell=""
                      data-selected={isSelected || undefined}
                      data-today={isToday || undefined}
                      data-disabled={isDisabled || undefined}
                      data-in-range={isInRange || undefined}
                      data-range-start={isRangeStart || undefined}
                      data-range-end={isRangeEnd || undefined}
                      data-weekend={isWeekend || undefined}
                      data-other-month={isOtherMonth || undefined}
                      className={[
                        styles.dayItem,
                        shared.interactive,
                        shared.hoverable,
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
    </div>
  );
};
