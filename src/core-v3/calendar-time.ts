/**
 * CalendarTime — pure wall-clock time of day.
 *
 * No JS `Date`, no timezone. Just "14:30:00.000" as a coordinate within a day.
 * Timezone/DST meaning is applied only at the conversion boundary, never here.
 */
export type CalendarTime = {
  /** 0-23 */
  readonly hour: number;
  /** 0-59 */
  readonly minute: number;
  /** 0-59 */
  readonly second: number;
  /** 0-999 */
  readonly ms: number;
};

/** Midnight, the canonical start-of-day time. */
export const MIDNIGHT: CalendarTime = { hour: 0, minute: 0, second: 0, ms: 0 };

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
/** Milliseconds in a 24-hour civil day (ignores DST; that lives at the boundary). */
export const MS_PER_DAY = 24 * MS_PER_HOUR;

/** Construct a CalendarTime. `second`/`ms` default to 0. Does not validate. */
export function calendarTime(
  hour: number,
  minute: number,
  second = 0,
  ms = 0,
): CalendarTime {
  return { hour, minute, second, ms };
}

/** True when every field is an integer inside its range. */
export function isValidTime(t: CalendarTime): boolean {
  if (
    !Number.isInteger(t.hour) ||
    !Number.isInteger(t.minute) ||
    !Number.isInteger(t.second) ||
    !Number.isInteger(t.ms)
  ) {
    return false;
  }
  return (
    t.hour >= 0 &&
    t.hour <= 23 &&
    t.minute >= 0 &&
    t.minute <= 59 &&
    t.second >= 0 &&
    t.second <= 59 &&
    t.ms >= 0 &&
    t.ms <= 999
  );
}

/**
 * Milliseconds since midnight. Cheap, sortable comparison/index key.
 * Assumes a canonical time; out-of-range fields still produce a number but
 * lose ordering guarantees (use {@link normalizeTime} first).
 */
export function msOfDay(t: CalendarTime): number {
  return (
    t.hour * MS_PER_HOUR +
    t.minute * MS_PER_MINUTE +
    t.second * MS_PER_SECOND +
    t.ms
  );
}

/** Ordering comparator: negative if a < b, 0 if equal, positive if a > b. */
export function compareTime(a: CalendarTime, b: CalendarTime): number {
  return msOfDay(a) - msOfDay(b);
}

/** Same time of day. */
export function timesEqual(a: CalendarTime, b: CalendarTime): boolean {
  return (
    a.hour === b.hour &&
    a.minute === b.minute &&
    a.second === b.second &&
    a.ms === b.ms
  );
}

/**
 * Where a time sits relative to an inclusive `[min, max]` wall-clock window:
 * `-1` below `min`, `1` above `max`, `0` inside (or no bound on that side).
 * Either bound may be omitted.
 */
export function timeWindowSide(
  t: CalendarTime,
  min?: CalendarTime,
  max?: CalendarTime,
): -1 | 0 | 1 {
  if (min && compareTime(t, min) < 0) return -1;
  if (max && compareTime(t, max) > 0) return 1;
  return 0;
}

/** True when `t` is within the inclusive `[min, max]` window (open sides ok). */
export function timeInWindow(
  t: CalendarTime,
  min?: CalendarTime,
  max?: CalendarTime,
): boolean {
  return timeWindowSide(t, min, max) === 0;
}

/** Clamp `t` into the inclusive `[min, max]` window. Returns `t` when inside. */
export function clampTime(
  t: CalendarTime,
  min?: CalendarTime,
  max?: CalendarTime,
): CalendarTime {
  const side = timeWindowSide(t, min, max);
  if (side < 0 && min) return min;
  if (side > 0 && max) return max;
  return t;
}

/** The later of two optional times (the tighter LOWER bound). `undefined` = open. */
export function laterTime(
  a?: CalendarTime,
  b?: CalendarTime,
): CalendarTime | undefined {
  if (!a) return b;
  if (!b) return a;
  return compareTime(a, b) >= 0 ? a : b;
}

/** The earlier of two optional times (the tighter UPPER bound). `undefined` = open. */
export function earlierTime(
  a?: CalendarTime,
  b?: CalendarTime,
): CalendarTime | undefined {
  if (!a) return b;
  if (!b) return a;
  return compareTime(a, b) <= 0 ? a : b;
}

/**
 * Normalize a possibly-overflowing time into a canonical time plus a whole-day
 * carry. "25:00" becomes `{ time: 01:00, dayOffset: 1 }`; "-0:30" becomes
 * `{ time: 23:30, dayOffset: -1 }`.
 *
 * This is the foundation for time stepping that rolls across midnight: the
 * date-time layer applies `dayOffset` to its `CalendarDate`. Inputs are assumed
 * integer fields; only their magnitude may be out of range.
 */
export function normalizeTime(t: CalendarTime): {
  time: CalendarTime;
  dayOffset: number;
} {
  const total = msOfDay(t);
  const dayOffset = Math.floor(total / MS_PER_DAY);
  let rem = total - dayOffset * MS_PER_DAY;

  const hour = Math.floor(rem / MS_PER_HOUR);
  rem -= hour * MS_PER_HOUR;
  const minute = Math.floor(rem / MS_PER_MINUTE);
  rem -= minute * MS_PER_MINUTE;
  const second = Math.floor(rem / MS_PER_SECOND);
  const ms = rem - second * MS_PER_SECOND;

  return { time: { hour, minute, second, ms }, dayOffset };
}
