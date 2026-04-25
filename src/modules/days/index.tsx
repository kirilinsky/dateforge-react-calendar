import React, { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./days.module.css";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import {
  useSelectionValue,
  useSelectionActions,
  useSelectionHover,
} from "@/context/selection-context";
import { useUI } from "@/context/ui-context";
import {
  getFirstDayOffset,
  getNextMonthFromSwipe,
  getCalendarData,
  isSameDay,
} from "@/utils/date-utils";
import { getTodayInTimezone, toTZMidnight } from "@/utils/tz-utils";
import shared from "@/global/global.module.css";
import WeekDays from "./week-days";
import { StartOfWeek } from "@/types/calendar";
import { useGridSlot } from "@/hooks/use-grid-slot";

function buildCellLabel(args: {
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
}): string {
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

interface DayCellProps {
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
  onSelect: (date: Date, isDisabled: boolean) => void;
  onMouseEnter: (date: Date) => void;
}

const DayCell = React.memo(function DayCell({
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
  onSelect,
  onMouseEnter,
}: DayCellProps) {
  const fullDate = useMemo(() => new Date(dateTime), [dateTime]);

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
    isTodayDate &&
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
      type="button"
      onClick={() => !isDisabled && onSelect(fullDate, isDisabled)}
      onMouseEnter={() => onMouseEnter(fullDate)}
      aria-label={ariaLabel}
      aria-selected={isSelected}
      aria-current={isTodayDate ? "date" : undefined}
      aria-disabled={isDisabled || undefined}
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
        !range && connectLeft && connectRight && styles.rangeMid,
        !range && connectLeft && !connectRight && styles.rangeEnd,
        !range && !connectLeft && connectRight && styles.rangeStart,
        range && isSelected && shared.activeItem,
        range && rangeEndpointClass,
        range && rangeBridgeClass,
        range && isInRange && styles.rIn,
        previewClass,
        previewBridgeClass,
        isToday && styles.todayItem,
        boldWeekends && styles.boldWeekend,
        isOtherMonth &&
          (isHighlighted ? shared.selectedOtherItem : shared.otherItem),
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {day}
    </button>
  );
});

export interface CalendarDaysProps {
  offset?: number;
  currentMonthOnly?: boolean;
  col?: number | string;
  startOfWeek?: StartOfWeek;
  highlightWeekends?: boolean;
  boldWeekends?: boolean;
  weekNumbers?: boolean;
  hideWeekdays?: boolean;
  highlightToday?: boolean;
  swipe?: boolean;
  hideOutOfRange?: boolean;
  lockSelection?: boolean;
  defaultMonth?: Date;
  fixedRows?: boolean;
}

export const CalendarDays: React.FC<CalendarDaysProps> = ({
  offset = 0,
  currentMonthOnly = false,
  col,
  startOfWeek = 1,
  highlightWeekends = true,
  boldWeekends = false,
  weekNumbers = false,
  hideWeekdays = false,
  highlightToday = true,
  swipe = true,
  hideOutOfRange = false,
  lockSelection = false,
  defaultMonth,
  fixedRows = true,
}) => {
  const { daysTrackActive } = useUI();
  const {
    minDate,
    maxDate,
    disabled,
    range,
    minRangeDays,
    maxRangeDays,
    locale,
    timeZone,
  } = useConfig();

  const { viewDate: rawDate, navigateTo } = useNavigation();

  useEffect(() => {
    if (defaultMonth)
      navigateTo(
        new Date(defaultMonth.getFullYear(), defaultMonth.getMonth(), 1),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultMonth?.getTime()]);
  const date = offset
    ? new Date(rawDate.getFullYear(), rawDate.getMonth() + offset, 1)
    : rawDate;
  const resolvedArea = offset > 0 ? `days-${offset + 1}` : "days";
  const { selectedDates, rangeStart, rangeEnd } = useSelectionValue();
  const { onChangeDate, setHoverDate } = useSelectionActions();
  const { hoverDate } = useSelectionHover();

  const today = useMemo(
    () => (timeZone ? getTodayInTimezone(timeZone) : new Date()),
    [timeZone],
  );

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

  const handleTouchEnd = swipe
    ? (e: React.TouchEvent) => {
        if (touchStartX === null) return;
        const deltaX = touchStartX - e.changedTouches[0].clientX;
        const nextDate = getNextMonthFromSwipe(
          deltaX,
          date,
          minDate,
          maxDate,
          50,
          disabled,
        );
        if (nextDate) navigateTo(nextDate);
        setTouchStartX(null);
      }
    : undefined;

  const handleTouchStart = swipe
    ? (e: React.TouchEvent) => {
        setTouchStartX(e.changedTouches[0].clientX);
      }
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
        ? { rangeStart, rangeEnd, hoverDate, minRangeDays, maxRangeDays }
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
    minRangeDays,
    maxRangeDays,
  ]);

  const handleSetDay = useCallback(
    (targetDate: Date, isDisabled: boolean) => {
      if (isDisabled) return;
      if (
        (lockSelection || daysTrackActive) &&
        selectedDates.some((d) => isSameDay(d, targetDate))
      )
        return;
      const next = timeZone
        ? new Date(
            toTZMidnight(targetDate, timeZone).getTime() +
              date.getHours() * 3600000 +
              date.getMinutes() * 60000 +
              date.getSeconds() * 1000 +
              date.getMilliseconds(),
          )
        : new Date(targetDate);
      if (!timeZone)
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
    [
      onChangeDate,
      date,
      minDate,
      maxDate,
      lockSelection,
      daysTrackActive,
      selectedDates,
    ],
  );

  const isPickingRange = range && rangeStart && !rangeEnd;

  const handleMouseEnter = useCallback(
    (fullDate: Date) => {
      if (!isPickingRange || !rangeStart) return;
      const diffDays =
        Math.round(
          Math.abs(fullDate.getTime() - rangeStart.getTime()) / 86400000,
        ) + 1;
      if (minRangeDays !== undefined && diffDays < minRangeDays) return;
      if (maxRangeDays !== undefined && diffDays > maxRangeDays) return;
      setHoverDate(fullDate);
    },
    [isPickingRange, setHoverDate, rangeStart, minRangeDays, maxRangeDays],
  );

  const handleMouseLeave = useCallback(() => {
    if (range) setHoverDate(null);
  }, [range, setHoverDate]);

  const animationKey = `${currentMonth}-${currentYear}`;

  const gridLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric",
      }).format(date),
    [locale, date],
  );

  const cellFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [locale],
  );

  const isDayHidden = useCallback(
    (d: { fullDate: Date; isDisabled: boolean; isCurrentMonth: boolean }) => {
      const t = d.fullDate.getTime();
      if (
        hideOutOfRange &&
        ((startT !== null && t < startT) ||
          (endT !== null && t > endT) ||
          d.isDisabled)
      )
        return true;
      if (currentMonthOnly && !d.isCurrentMonth) return true;
      return false;
    },
    [hideOutOfRange, currentMonthOnly, startT, endT],
  );

  return (
    <div
      data-area={resolvedArea}
      onTouchEnd={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onMouseLeave={handleMouseLeave}
      style={useGridSlot(col)}
    >
      <div
        role="grid"
        aria-label={gridLabel}
        key={animationKey}
        className={[
          styles.dayGridContainer,
          direction !== "none" ? styles[direction] : "",
          weekNumbers ? styles.withWeekNumbers : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <WeekDays
          locale={locale}
          startOfWeek={startOfWeek}
          highlightWeekends={highlightWeekends}
          weekNumbers={weekNumbers}
          hideWeekdays={hideWeekdays}
        />
        {weeksData.map((week, wIndex) => {
          const isLastRow = wIndex === weeksData.length - 1;
          if (
            isLastRow &&
            hideOutOfRange &&
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
          if (
            !fixedRows &&
            isLastRow &&
            week.days.every((d) => !d.isCurrentMonth)
          ) {
            return null;
          }

          return (
            <div
              key={wIndex}
              role="row"
              aria-label={`Week ${week.weekNumber}`}
              style={{ display: "contents" }}
            >
              {weekNumbers && (
                <div
                  role="rowheader"
                  aria-label={`Week ${week.weekNumber}`}
                  className={styles.weekNumberItem}
                >
                  {week.weekNumber}
                </div>
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
                    return (
                      <span
                        key={i}
                        aria-hidden="true"
                        className={styles.dayItemEmpty}
                      />
                    );

                  const dayOfWeek = fullDate.getDay();
                  return (
                    <DayCell
                      key={i}
                      day={day}
                      dateTime={fullDate.getTime()}
                      isDisabled={isDisabled}
                      isSelected={isSelected}
                      isCurrentMonth={isCurrentMonth}
                      connectLeft={connectLeft}
                      connectRight={connectRight}
                      isRangeStart={isRangeStart}
                      isRangeEnd={isRangeEnd}
                      isInRange={isInRange}
                      rangeBridgeLeft={rangeBridgeLeft}
                      rangeBridgeRight={rangeBridgeRight}
                      isPreviewStart={isPreviewStart}
                      isPreviewEnd={isPreviewEnd}
                      isPreviewMid={isPreviewMid}
                      previewBridgeLeft={previewBridgeLeft}
                      previewBridgeRight={previewBridgeRight}
                      isTodayDate={isSameDay(fullDate, today)}
                      highlightToday={highlightToday}
                      isWeekend={
                        highlightWeekends &&
                        (dayOfWeek === 0 || dayOfWeek === 6)
                      }
                      boldWeekends={
                        boldWeekends && (dayOfWeek === 0 || dayOfWeek === 6)
                      }
                      range={range}
                      ariaLabel={buildCellLabel({
                        fullDate,
                        cellFmt,
                        isDisabled,
                        isSelected,
                        isTodayDate: isSameDay(fullDate, today),
                        highlightToday,
                        isRangeStart,
                        isRangeEnd,
                        isInRange,
                        range,
                      })}
                      onSelect={handleSetDay}
                      onMouseEnter={handleMouseEnter}
                    />
                  );
                },
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
