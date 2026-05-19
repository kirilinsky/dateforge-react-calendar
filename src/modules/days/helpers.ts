import { DEFAULT_WEEK_LABEL, resolveActionLabel } from "@/utils/action-labels";
import { toTZMidnight } from "@/utils/tz-utils";

const DAY_MS = 86400000;

export function resolveWeekLabel(
  moduleLabel: string | undefined,
  globalLabel: string | undefined,
): string {
  return resolveActionLabel(moduleLabel, globalLabel, DEFAULT_WEEK_LABEL);
}

export function getWeekAriaLabel(label: string, weekNumber: string): string {
  return `${label} ${weekNumber}`;
}

export function getStartOfDayT(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function getEndOfDayT(d: Date): number {
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    23,
    59,
    59,
    999,
  ).getTime();
}

/**
 * Months whose visible 6x7 grid can't intersect [min(rangeStart,hover), max]
 * return `null`. Callers feed that null into `getCalendarData` so the month's
 * `weeksData` useMemo stays referentially stable across hover ticks.
 */
export function computeEffectiveHoverDate(args: {
  range: boolean;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  hoverDate: Date | null;
  currentYear: number;
  currentMonth: number;
  firstDayOffset: number;
}): Date | null {
  const {
    range,
    rangeStart,
    rangeEnd,
    hoverDate,
    currentYear,
    currentMonth,
    firstDayOffset,
  } = args;
  if (!range || !rangeStart || rangeEnd || !hoverDate) return null;
  const gridStartT = new Date(
    currentYear,
    currentMonth,
    1 - firstDayOffset,
  ).getTime();
  const gridEndT = new Date(
    currentYear,
    currentMonth,
    1 - firstDayOffset + 41,
    23,
    59,
    59,
    999,
  ).getTime();
  const lo = Math.min(getStartOfDayT(rangeStart), getStartOfDayT(hoverDate));
  const hi = Math.max(getStartOfDayT(rangeStart), getStartOfDayT(hoverDate));
  if (gridEndT < lo || gridStartT > hi) return null;
  return hoverDate;
}

export function passesRangeLimits(
  target: Date,
  rangeStart: Date,
  minRangeDays: number | undefined,
  maxRangeDays: number | undefined,
): boolean {
  const diffDays =
    Math.round(Math.abs(target.getTime() - rangeStart.getTime()) / DAY_MS) + 1;
  if (minRangeDays !== undefined && diffDays < minRangeDays) return false;
  if (maxRangeDays !== undefined && diffDays > maxRangeDays) return false;
  return true;
}

/**
 * Compose the next selection Date for a day click: preserve view-date's H/M/S,
 * apply timezone if set, then clamp to [minDate, maxDate] purely on the day
 * component so the user's chosen time component is not lost.
 */
export function composeSelectionDate(args: {
  targetDate: Date;
  viewDate: Date;
  timeZone: string | undefined;
  minDate: Date | null | undefined;
  maxDate: Date | null | undefined;
}): Date {
  const { targetDate, viewDate, timeZone, minDate, maxDate } = args;
  const next = timeZone
    ? new Date(
        toTZMidnight(targetDate, timeZone).getTime() +
          viewDate.getHours() * 3600000 +
          viewDate.getMinutes() * 60000 +
          viewDate.getSeconds() * 1000 +
          viewDate.getMilliseconds(),
      )
    : new Date(targetDate);
  if (!timeZone)
    next.setHours(
      viewDate.getHours(),
      viewDate.getMinutes(),
      viewDate.getSeconds(),
      viewDate.getMilliseconds(),
    );
  if (minDate && next.getTime() < minDate.getTime()) {
    next.setFullYear(
      minDate.getFullYear(),
      minDate.getMonth(),
      minDate.getDate(),
    );
  }
  if (maxDate && next.getTime() > maxDate.getTime()) {
    next.setFullYear(
      maxDate.getFullYear(),
      maxDate.getMonth(),
      maxDate.getDate(),
    );
  }
  return next;
}

export function computeSwipeDirection(
  date: Date,
  prevDate: Date,
): "left" | "right" | "same" {
  const isSameMonth =
    date.getMonth() === prevDate.getMonth() &&
    date.getFullYear() === prevDate.getFullYear();
  if (isSameMonth) return "same";
  return date.getTime() > prevDate.getTime() ? "right" : "left";
}

export function isDayHiddenByBounds(args: {
  fullDate: Date;
  isDisabled: boolean;
  isCurrentMonth: boolean;
  hideOutOfRange: boolean;
  currentMonthOnly: boolean;
  startT: number | null;
  endT: number | null;
}): boolean {
  const {
    fullDate,
    isDisabled,
    isCurrentMonth,
    hideOutOfRange,
    currentMonthOnly,
    startT,
    endT,
  } = args;
  const t = fullDate.getTime();
  if (
    hideOutOfRange &&
    ((startT !== null && t < startT) ||
      (endT !== null && t > endT) ||
      isDisabled)
  )
    return true;
  if (currentMonthOnly && !isCurrentMonth) return true;
  return false;
}
