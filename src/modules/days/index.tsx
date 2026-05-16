import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import {
  useSelectionActions,
  useSelectionHover,
  useSelectionValue,
} from "@/context/selection-context";
import { useUI } from "@/context/ui-context";
import { useCalendarKeyboard } from "@/hooks/use-calendar-keyboard";
import { useClientValue } from "@/hooks/use-client-value";
import type { StartOfWeek } from "@/types/calendar";
import {
  getCalendarData,
  getFirstDayOffset,
  getNextMonthFromSwipe,
  isSameDay,
  type WeekdayFormat,
} from "@/utils/date-utils";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { getDateTimeFormat } from "@/utils/intl-cache";
import { getTodayInTimezone, toTZMidnight } from "@/utils/tz-utils";
import { getDayCellClassName } from "./day-cell-class-name";
import styles from "./days.module.css";
import WeekDays from "./week-days";

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
  tabIndex: number;
  readOnly: boolean;
  isMaxReachedTarget: boolean;
  onSelect: (date: Date, isDisabled: boolean) => void;
  onMouseEnter: (date: Date) => void;
  onKeyDown: (e: React.KeyboardEvent, date: Date) => void;
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
  tabIndex,
  readOnly,
  isMaxReachedTarget,
  onSelect,
  onMouseEnter,
  onKeyDown,
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
        data-in-range={isInRange || undefined}
        data-range-start={isRangeStart || undefined}
        data-range-end={isRangeEnd || undefined}
        data-weekend={isWeekend || undefined}
        data-other-month={isOtherMonth || undefined}
        data-max-reached={isMaxReachedTarget || undefined}
        className={className}
      >
        <span className={styles.dayLabel}>{day}</span>
      </button>
    </div>
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
  weekdayFormat?: WeekdayFormat;
  highlightToday?: boolean;
  swipe?: boolean;
  hideOutOfRange?: boolean;
  lockDeselection?: boolean;
  fixedRows?: boolean;
  blockNavigation?: boolean;
  todayDot?: boolean;
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
  weekdayFormat = "short",
  highlightToday = true,
  swipe = true,
  hideOutOfRange = false,
  lockDeselection = false,
  fixedRows = true,
  blockNavigation = false,
  todayDot = true,
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
    readOnly,
    multiselect,
  } = useConfig();

  const { viewDate: rawDate, navigateTo } = useNavigation();

  const date = offset
    ? new Date(rawDate.getFullYear(), rawDate.getMonth() + offset, 1)
    : rawDate;
  const resolvedArea = offset > 0 ? `days-${offset + 1}` : "days";
  const { selectedDates, rangeStart, rangeEnd } = useSelectionValue();
  const { onChangeDate, setHoverDate } = useSelectionActions();
  const { hoverDate } = useSelectionHover();

  const maxDates =
    typeof multiselect === "number" ? multiselect : Number.POSITIVE_INFINITY;
  const isMultipleMaxReached =
    multiselect !== undefined &&
    multiselect !== false &&
    !range &&
    selectedDates.length >= maxDates;

  // Defer today computation to post-mount so the server-rendered HTML doesn't
  // depend on the server's clock or system timezone (would cause hydration
  // mismatch on day boundaries / cross-timezone deploys).
  const todayClient = useClientValue<Date | null>(
    () => (timeZone ? getTodayInTimezone(timeZone) : new Date()),
    null,
  );
  // NaN-Date never matches isSameDay (since NaN !== NaN), so until todayClient
  // resolves no day cell is wrongly highlighted as "today".
  const today = useMemo(() => todayClient ?? new Date(NaN), [todayClient]);

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

  const isPickingRange = range && rangeStart && !rangeEnd;

  // Ref-pattern: keep handlers stable so React.memo on DayCell isn't bypassed
  // every time selectedDates / rangeStart change. We read latest values from
  // the ref at call time instead of declaring them as useCallback deps.
  const latestRef = useRef({
    readOnly,
    selectedDates,
    isMultipleMaxReached,
    lockDeselection,
    daysTrackActive,
    timeZone,
    date,
    minDate,
    maxDate,
    onChangeDate,
    isPickingRange,
    rangeStart,
    minRangeDays,
    maxRangeDays,
    setHoverDate,
  });
  latestRef.current = {
    readOnly,
    selectedDates,
    isMultipleMaxReached,
    lockDeselection,
    daysTrackActive,
    timeZone,
    date,
    minDate,
    maxDate,
    onChangeDate,
    isPickingRange,
    rangeStart,
    minRangeDays,
    maxRangeDays,
    setHoverDate,
  };

  const handleSetDay = useCallback((targetDate: Date, isDisabled: boolean) => {
    const r = latestRef.current;
    if (r.readOnly) return;
    const alreadySelected = r.selectedDates.some((d) =>
      isSameDay(d, targetDate),
    );
    if (isDisabled) return;
    if (r.isMultipleMaxReached && !alreadySelected) return;
    if ((r.lockDeselection || r.daysTrackActive) && alreadySelected) return;
    const next = r.timeZone
      ? new Date(
          toTZMidnight(targetDate, r.timeZone).getTime() +
            r.date.getHours() * 3600000 +
            r.date.getMinutes() * 60000 +
            r.date.getSeconds() * 1000 +
            r.date.getMilliseconds(),
        )
      : new Date(targetDate);
    if (!r.timeZone)
      next.setHours(
        r.date.getHours(),
        r.date.getMinutes(),
        r.date.getSeconds(),
        r.date.getMilliseconds(),
      );
    if (r.minDate && next.getTime() < r.minDate.getTime()) {
      next.setHours(r.minDate.getHours(), r.minDate.getMinutes(), 0, 0);
    }
    if (r.maxDate && next.getTime() > r.maxDate.getTime()) {
      next.setHours(r.maxDate.getHours(), r.maxDate.getMinutes(), 0, 0);
    }
    r.onChangeDate(next);
  }, []);

  const handleMouseEnter = useCallback((fullDate: Date) => {
    const r = latestRef.current;
    if (!r.isPickingRange || !r.rangeStart) return;
    const diffDays =
      Math.round(
        Math.abs(fullDate.getTime() - r.rangeStart.getTime()) / 86400000,
      ) + 1;
    if (r.minRangeDays !== undefined && diffDays < r.minRangeDays) return;
    if (r.maxRangeDays !== undefined && diffDays > r.maxRangeDays) return;
    r.setHoverDate(fullDate);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (range) setHoverDate(null);
  }, [range, setHoverDate]);

  const animationKey = `${currentMonth}-${currentYear}`;

  const gridLabel = useMemo(
    () =>
      getDateTimeFormat(locale, {
        month: "long",
        year: "numeric",
      }).format(date),
    [locale, date],
  );

  const cellFmt = getDateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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

  const initialFocusDate = useMemo(() => {
    const inMonth = selectedDates.find(
      (d) => d.getMonth() === currentMonth && d.getFullYear() === currentYear,
    );
    if (inMonth) return inMonth;
    if (
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    )
      return today;
    return new Date(currentYear, currentMonth, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKeyboardSelect = useCallback(
    (d: Date) => handleSetDay(d, false),
    [handleSetDay],
  );

  const { gridRef, focusedDate, handleKeyDown } = useCalendarKeyboard({
    viewDate: date,
    initialFocusDate,
    syncDate: selectedDates[0] ?? null,
    startOfWeek,
    blockNavigation,
    navigateTo,
    onSelect: onKeyboardSelect,
  });

  return (
    <div
      data-area={resolvedArea}
      className={styles.daysArea}
      onTouchEnd={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onMouseLeave={handleMouseLeave}
      style={getGridSlotStyle(col)}
    >
      <div
        ref={gridRef}
        role="grid"
        aria-label={gridLabel}
        key={animationKey}
        data-today-dot={todayDot || undefined}
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
          weekdayFormat={weekdayFormat}
        />
        {weeksData.map((week, wIndex) => {
          const isLastRow = wIndex === weeksData.length - 1;
          const allHidden = week.days.every((d) =>
            isDayHidden({
              fullDate: d.fullDate,
              isDisabled: d.isDisabled,
              isCurrentMonth: d.isCurrentMonth,
            }),
          );
          const allOutOfMonth = week.days.every((d) => !d.isCurrentMonth);
          if (allHidden && !fixedRows) return null;
          if (!fixedRows && isLastRow && allOutOfMonth) return null;

          const isVisuallyEmpty = allHidden || (!fixedRows && allOutOfMonth);

          const rowA11y = isVisuallyEmpty
            ? { role: "presentation" as const }
            : {
                role: "row" as const,
                "aria-label": `Week ${week.weekNumber}`,
              };
          return (
            <div key={wIndex} {...rowA11y} className={styles.weekRow}>
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
                ({
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
                }) => {
                  const dateTime = fullDate.getTime();
                  if (isDayHidden({ fullDate, isDisabled, isCurrentMonth }))
                    return (
                      <div
                        key={dateTime}
                        role="presentation"
                        className={styles.dayItemEmpty}
                      />
                    );

                  const dayOfWeek = fullDate.getDay();
                  const isTodayDate = isSameDay(fullDate, today);
                  return (
                    <DayCell
                      key={dateTime}
                      day={day}
                      dateTime={dateTime}
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
                      isTodayDate={isTodayDate}
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
                        isTodayDate,
                        highlightToday,
                        isRangeStart,
                        isRangeEnd,
                        isInRange,
                        range,
                      })}
                      tabIndex={isSameDay(fullDate, focusedDate) ? 0 : -1}
                      readOnly={readOnly}
                      isMaxReachedTarget={
                        isMultipleMaxReached &&
                        !isSelected &&
                        !isDisabled &&
                        isCurrentMonth
                      }
                      onSelect={handleSetDay}
                      onMouseEnter={handleMouseEnter}
                      onKeyDown={handleKeyDown}
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
