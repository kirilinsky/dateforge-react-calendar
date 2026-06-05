import {
  type CalendarDate,
  compareDate,
  datesEqual,
  isValidDate,
} from "./calendar-date";
import {
  type CalendarTime,
  compareTime,
  isValidTime,
  MIDNIGHT,
  timesEqual,
} from "./calendar-time";

/**
 * CalendarDateTime — a calendar day plus a wall-clock time.
 *
 * This is the shape for selected values, range bounds with time, and pending
 * date-time drafts. The visual `viewDate` is NOT a CalendarDateTime: navigation
 * must never carry or reset a time.
 */
export type CalendarDateTime = {
  readonly date: CalendarDate;
  readonly time: CalendarTime;
};

/** Construct a CalendarDateTime. `time` defaults to midnight. */
export function calendarDateTime(
  date: CalendarDate,
  time: CalendarTime = MIDNIGHT,
): CalendarDateTime {
  return { date, time };
}

/** Valid when both the date and the time are valid. */
export function isValidDateTime(dt: CalendarDateTime): boolean {
  return isValidDate(dt.date) && isValidTime(dt.time);
}

/**
 * Ordering comparator: compares by date first, then by time of day.
 * Negative if a < b, 0 if equal, positive if a > b.
 */
export function compareDateTime(
  a: CalendarDateTime,
  b: CalendarDateTime,
): number {
  const byDate = compareDate(a.date, b.date);
  return byDate !== 0 ? byDate : compareTime(a.time, b.time);
}

/** Same instant on the wall calendar (date and time both equal). */
export function dateTimesEqual(
  a: CalendarDateTime,
  b: CalendarDateTime,
): boolean {
  return datesEqual(a.date, b.date) && timesEqual(a.time, b.time);
}

/**
 * Replace the time, keeping the date. Used when editing time without moving the
 * day, or when combining a freshly selected day with a source time.
 */
export function withTime(
  dt: CalendarDateTime,
  time: CalendarTime,
): CalendarDateTime {
  return { date: dt.date, time };
}

/** Replace the date, keeping the time. */
export function withDate(
  dt: CalendarDateTime,
  date: CalendarDate,
): CalendarDateTime {
  return { date, time: dt.time };
}
