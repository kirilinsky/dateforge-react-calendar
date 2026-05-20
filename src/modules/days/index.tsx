import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "@/styles/layers.css";
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
import type { CalendarTheme } from "@/types/themes";
import {
  getCalendarData,
  getFirstDayOffset,
  getNextMonthFromSwipe,
  isSameDay,
  type WeekdayFormat,
} from "@/utils/date-utils";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { getDateTimeFormat } from "@/utils/intl-cache";
import { resolveThemeScope } from "@/utils/resolve-theme-scope";
import { getTodayInTimezone } from "@/utils/tz-utils";
import { buildCellLabel, DayCell, type RenderDay } from "./day-cell";

export type { DayState, RenderDay } from "./day-cell";

import styles from "./days.module.css";
import {
  composeSelectionDate,
  computeEffectiveHoverDate,
  computeSwipeDirection,
  getEndOfDayT,
  getStartOfDayT,
  getWeekAriaLabel,
  isDayHiddenByBounds,
  passesRangeLimits,
  resolveWeekLabel,
} from "./helpers";
import WeekDays from "./week-days";

export interface CalendarDaysProps {
  offset?: number;
  currentMonthOnly?: boolean;
  col?: number | string;
  theme?: CalendarTheme;
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
  weekLabel?: string;
  /**
   * When a day is clicked, also move the calendar's viewDate to that day's
   * month. Defaults to `true` for the primary grid (`offset === 0`) and
   * `false` for any offset grid — so clicking on a side month in a
   * multi-month layout no longer steals the primary view.
   */
  syncViewOnSelect?: boolean;
  /**
   * Custom renderer for the day cell inner content. Receives the cell `Date`
   * and a `DayState` flag bag. Return any `ReactNode` to replace the default
   * day-number label. The button shell, data attributes, keyboard handlers,
   * and a11y stay owned by the library.
   */
  renderDay?: RenderDay;
}

export const CalendarDays: React.FC<CalendarDaysProps> = ({
  offset = 0,
  currentMonthOnly = false,
  col,
  theme,
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
  weekLabel,
  syncViewOnSelect,
  renderDay,
}) => {
  const effectiveSyncView = syncViewOnSelect ?? offset === 0;
  const { activeTheme, daysTrackActive } = useUI();
  const themeScope = resolveThemeScope(theme, activeTheme);
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
    actionLabels,
  } = useConfig();
  const resolvedWeekLabel = resolveWeekLabel(weekLabel, actionLabels.weekLabel);

  const { viewDate: rawDate, navigateTo } = useNavigation();

  const date = useMemo(
    () =>
      offset
        ? new Date(rawDate.getFullYear(), rawDate.getMonth() + offset, 1)
        : rawDate,
    [offset, rawDate],
  );
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
    () => (minDate ? getStartOfDayT(minDate) : null),
    [minDate],
  );
  const endT = useMemo(
    () => (maxDate ? getEndOfDayT(maxDate) : null),
    [maxDate],
  );

  const [direction, setDirection] = useState<"left" | "right" | "none">("none");
  const [prevDate, setPrevDate] = useState(date);

  const currentMonth = date.getMonth();
  const currentYear = date.getFullYear();
  const firstDayOffset = getFirstDayOffset(date, startOfWeek);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    const dir = computeSwipeDirection(date, prevDate);
    if (dir !== "same") {
      setDirection(dir);
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

  const effectiveHoverDate = useMemo(
    () =>
      computeEffectiveHoverDate({
        range,
        rangeStart,
        rangeEnd,
        hoverDate,
        currentYear,
        currentMonth,
        firstDayOffset,
      }),
    [
      range,
      rangeStart,
      rangeEnd,
      hoverDate,
      currentYear,
      currentMonth,
      firstDayOffset,
    ],
  );

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
        ? {
            rangeStart,
            rangeEnd,
            hoverDate: effectiveHoverDate,
            minRangeDays,
            maxRangeDays,
          }
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
    effectiveHoverDate,
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
    effectiveSyncView,
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
    effectiveSyncView,
  };

  const handleSetDay = useCallback((targetDate: Date, isDisabled: boolean) => {
    const r = latestRef.current;
    if (r.readOnly) return;
    if (isDisabled) return;
    const alreadySelected = r.selectedDates.some((d) =>
      isSameDay(d, targetDate),
    );
    if (r.isMultipleMaxReached && !alreadySelected) return;
    if ((r.lockDeselection || r.daysTrackActive) && alreadySelected) return;
    const next = composeSelectionDate({
      targetDate,
      viewDate: r.date,
      timeZone: r.timeZone,
      minDate: r.minDate,
      maxDate: r.maxDate,
    });
    r.onChangeDate(next, r.effectiveSyncView ? undefined : { keepView: true });
  }, []);

  // rAF-coalesce hover updates: mousemove can fire dozens of times per frame;
  // only the latest target matters for preview rendering.
  const hoverRafRef = useRef<number | null>(null);
  const hoverPendingRef = useRef<Date | null>(null);

  useEffect(() => {
    return () => {
      if (
        hoverRafRef.current !== null &&
        typeof cancelAnimationFrame !== "undefined"
      ) {
        cancelAnimationFrame(hoverRafRef.current);
        hoverRafRef.current = null;
      }
    };
  }, []);

  const handleMouseEnter = useCallback((fullDate: Date) => {
    const r = latestRef.current;
    if (!r.isPickingRange || !r.rangeStart) return;
    if (
      !passesRangeLimits(fullDate, r.rangeStart, r.minRangeDays, r.maxRangeDays)
    )
      return;
    hoverPendingRef.current = fullDate;
    if (typeof requestAnimationFrame === "undefined") {
      r.setHoverDate(fullDate);
      return;
    }
    if (hoverRafRef.current !== null) return;
    hoverRafRef.current = requestAnimationFrame(() => {
      hoverRafRef.current = null;
      const pending = hoverPendingRef.current;
      hoverPendingRef.current = null;
      if (pending) latestRef.current.setHoverDate(pending);
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!range) return;
    if (
      hoverRafRef.current !== null &&
      typeof cancelAnimationFrame !== "undefined"
    ) {
      cancelAnimationFrame(hoverRafRef.current);
      hoverRafRef.current = null;
    }
    hoverPendingRef.current = null;
    setHoverDate(null);
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
    (d: { fullDate: Date; isDisabled: boolean; isCurrentMonth: boolean }) =>
      isDayHiddenByBounds({
        fullDate: d.fullDate,
        isDisabled: d.isDisabled,
        isCurrentMonth: d.isCurrentMonth,
        hideOutOfRange,
        currentMonthOnly,
        startT,
        endT,
      }),
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
      data-theme={themeScope.dataTheme}
      className={styles.daysArea}
      onTouchEnd={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onMouseLeave={handleMouseLeave}
      style={{ ...getGridSlotStyle(col), ...themeScope.style }}
    >
      <div
        ref={gridRef}
        role="grid"
        aria-label={gridLabel}
        key={animationKey}
        data-today-dot={todayDot || undefined}
        data-day-content={renderDay ? "custom" : undefined}
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
                "aria-label": getWeekAriaLabel(
                  resolvedWeekLabel,
                  week.weekNumber,
                ),
              };
          return (
            <div key={wIndex} {...rowA11y} className={styles.weekRow}>
              {weekNumbers && (
                <div
                  role="rowheader"
                  aria-label={getWeekAriaLabel(
                    resolvedWeekLabel,
                    week.weekNumber,
                  )}
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
                      renderDay={renderDay}
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
