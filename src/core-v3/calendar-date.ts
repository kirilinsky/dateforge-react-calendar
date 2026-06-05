/**
 * CalendarDate — pure proleptic-Gregorian calendar day.
 *
 * No JS `Date`, no timezone, no DOM. A `CalendarDate` is a plain wall-calendar
 * coordinate: "the 5th of June 2026", independent of any clock or zone.
 *
 * Non-Gregorian calendar systems (Hijri, Hebrew, Japanese) are out of scope for
 * v3. If ever needed, they arrive via a separate `CalendarSystem` adapter, not
 * by reinterpreting these fields.
 */
export type CalendarDate = {
  readonly year: number;
  /** 1-12 (January = 1). */
  readonly month: number;
  /** 1-31, clamped to the month length. */
  readonly day: number;
};

/** Construct a CalendarDate. Does not validate; use {@link isValidDate} to check. */
export function calendarDate(
  year: number,
  month: number,
  day: number,
): CalendarDate {
  return { year, month, day };
}

/** Proleptic-Gregorian leap-year test. */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

/** Number of days in a given 1-12 month, leap-aware for February. */
export function daysInMonth(year: number, month: number): number {
  if (month === 2 && isLeapYear(year)) return 29;
  return MONTH_LENGTHS[month - 1];
}

/** True when year/month/day are integers and the day exists in that month. */
export function isValidDate(d: CalendarDate): boolean {
  if (
    !Number.isInteger(d.year) ||
    !Number.isInteger(d.month) ||
    !Number.isInteger(d.day)
  ) {
    return false;
  }
  if (d.month < 1 || d.month > 12) return false;
  return d.day >= 1 && d.day <= daysInMonth(d.year, d.month);
}

/**
 * Monotonic numeric key: `year*10000 + month*100 + day`.
 *
 * Cheap, sortable, and safe as a `Set`/`Map` key — used by selection and
 * disabled indexes to keep per-cell lookups O(1) instead of O(n) scans.
 * Assumes canonical (validated) dates; non-canonical input still produces a
 * number but loses ordering guarantees.
 */
export function dateKey(d: CalendarDate): number {
  return d.year * 10000 + d.month * 100 + d.day;
}

/** Ordering comparator: negative if a < b, 0 if equal, positive if a > b. */
export function compareDate(a: CalendarDate, b: CalendarDate): number {
  return dateKey(a) - dateKey(b);
}

/** Same calendar day. */
export function datesEqual(a: CalendarDate, b: CalendarDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/**
 * Clamp a day to the last valid day of its month.
 *
 * Used by month/year arithmetic so that "Jan 31 + 1 month" lands on Feb 28/29
 * instead of overflowing into March.
 */
export function clampDayToMonth(
  year: number,
  month: number,
  day: number,
): number {
  const max = daysInMonth(year, month);
  if (day < 1) return 1;
  return day > max ? max : day;
}

/**
 * Serial day number (proleptic Gregorian, 1970-01-01 = 0).
 *
 * Pure integer arithmetic — Howard Hinnant's `days_from_civil`. Lets day-level
 * math and day diffs avoid JS `Date` entirely. Valid across all years.
 */
export function dayNumber(d: CalendarDate): number {
  const y = d.year - (d.month <= 2 ? 1 : 0);
  const era = Math.trunc((y >= 0 ? y : y - 399) / 400);
  const yoe = y - era * 400;
  const doy =
    Math.trunc((153 * (d.month + (d.month > 2 ? -3 : 9)) + 2) / 5) +
    (d.day - 1);
  const doe = yoe * 365 + Math.trunc(yoe / 4) - Math.trunc(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

/** Inverse of {@link dayNumber} — Hinnant's `civil_from_days`. */
export function fromDayNumber(n: number): CalendarDate {
  const z = n + 719468;
  const era = Math.trunc((z >= 0 ? z : z - 146096) / 146097);
  const doe = z - era * 146097;
  const yoe = Math.trunc(
    (doe -
      Math.trunc(doe / 1460) +
      Math.trunc(doe / 36524) -
      Math.trunc(doe / 146096)) /
      365,
  );
  const y = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.trunc(yoe / 4) - Math.trunc(yoe / 100));
  const mp = Math.trunc((5 * doy + 2) / 153);
  const day = doy - Math.trunc((153 * mp + 2) / 5) + 1;
  const month = mp < 10 ? mp + 3 : mp - 9;
  return calendarDate(y + (month <= 2 ? 1 : 0), month, day);
}

/** Add (or subtract, for negative `n`) whole calendar days. */
export function addDays(d: CalendarDate, n: number): CalendarDate {
  return n === 0 ? d : fromDayNumber(dayNumber(d) + n);
}

/**
 * Add (or subtract) whole calendar months. Day is clamped to the target
 * month length, so the day never overflows into the next month.
 */
export function addMonths(d: CalendarDate, n: number): CalendarDate {
  if (n === 0) return d;
  const total = d.year * 12 + (d.month - 1) + n;
  const year = Math.floor(total / 12);
  const month = total - year * 12 + 1;
  return calendarDate(year, month, clampDayToMonth(year, month, d.day));
}

/**
 * Add (or subtract) whole calendar years. Feb 29 clamps to Feb 28 in
 * common years.
 */
export function addYears(d: CalendarDate, n: number): CalendarDate {
  if (n === 0) return d;
  const year = d.year + n;
  return calendarDate(year, d.month, clampDayToMonth(year, d.month, d.day));
}

/** Whole-day distance `a - b` (positive when `a` is later). */
export function differenceInDays(a: CalendarDate, b: CalendarDate): number {
  return dayNumber(a) - dayNumber(b);
}
