import {
  addDays,
  type CalendarDate,
  compareDate,
  dateKey,
  dayNumber,
  differenceInDays,
  weekdayOf,
} from "./calendar-date";

/**
 * CalendarRange — an inclusive, ordered span of calendar days.
 *
 * Date-level by design: range membership and grid rendering work on whole days.
 * Time-aware range bounds (when time is enabled) are tracked separately as
 * CalendarDateTime on the selection; this span drives the day grid.
 *
 * Invariant: `compareDate(start, end) <= 0`. Build via {@link orderRange} to
 * guarantee it (handles reverse drag).
 */
export type CalendarRange = {
  readonly start: CalendarDate;
  readonly end: CalendarDate;
};

/** Order two endpoints into a valid range (handles reverse selection). */
export function orderRange(a: CalendarDate, b: CalendarDate): CalendarRange {
  return compareDate(a, b) <= 0 ? { start: a, end: b } : { start: b, end: a };
}

/**
 * O(1) membership test — the hot primitive behind range rendering and preview.
 *
 * Uses `dateKey`, which is monotonic with calendar order, so the interval
 * comparison is exact without materializing any day in the span.
 */
export function rangeContains(r: CalendarRange, d: CalendarDate): boolean {
  const k = dateKey(d);
  return k >= dateKey(r.start) && k <= dateKey(r.end);
}

/** Inclusive length in whole calendar days (a single-day range is 1). */
export function rangeLengthDays(r: CalendarRange): number {
  return differenceInDays(r.end, r.start) + 1;
}

/** True when the two spans share at least one day. */
export function rangesOverlap(a: CalendarRange, b: CalendarRange): boolean {
  return (
    dateKey(a.start) <= dateKey(b.end) && dateKey(b.start) <= dateKey(a.end)
  );
}

/**
 * Normalize a set of spans into a canonical, sorted, non-overlapping list, so
 * a multi-range selection always emits a deterministic value.
 *
 * Overlapping OR calendar-adjacent spans merge. Adjacency is tested with
 * `dayNumber` (not `dateKey`, which is not contiguous across month
 * boundaries): `Jan 31` and `Feb 1` are adjacent and merge.
 */
export function mergeRanges(ranges: readonly CalendarRange[]): CalendarRange[] {
  if (ranges.length <= 1) return ranges.slice();
  const sorted = [...ranges].sort((a, b) => compareDate(a.start, b.start));
  const out: CalendarRange[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const r = sorted[i];
    const last = out[out.length - 1];
    if (dayNumber(r.start) <= dayNumber(last.end) + 1) {
      if (compareDate(r.end, last.end) > 0) {
        out[out.length - 1] = { start: last.start, end: r.end };
      }
    } else {
      out.push(r);
    }
  }
  return out;
}

/**
 * Binary search for the range containing `d` in a sorted, non-overlapping list
 * (the canonical form produced by {@link mergeRanges}). Returns the index or
 * -1. O(log R) — multi-range membership without scanning every span.
 */
export function rangeIndexOf(
  ranges: readonly CalendarRange[],
  d: CalendarDate,
): number {
  const k = dateKey(d);
  let lo = 0;
  let hi = ranges.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const r = ranges[mid];
    if (k < dateKey(r.start)) hi = mid - 1;
    else if (k > dateKey(r.end)) lo = mid + 1;
    else return mid;
  }
  return -1;
}

/** Membership across a sorted multi-range set. O(log R). */
export function rangesContain(
  ranges: readonly CalendarRange[],
  d: CalendarDate,
): boolean {
  return rangeIndexOf(ranges, d) !== -1;
}

/**
 * Position of a day within a range set — the animation-ready cell role.
 *
 * `null` when the day is outside every span. Otherwise the role is decided by
 * its immediate calendar neighbours, so it works identically for a single
 * contiguous range, a multi-range set, and the segments produced by segmented
 * exclusion (each segment is just a range). Drives cap rounding and fill edges
 * in CSS without any per-span geometry in the UI.
 */
export type RangeRole = "start" | "middle" | "end" | "single";

export function rangeRole(
  ranges: readonly CalendarRange[],
  d: CalendarDate,
): RangeRole | null {
  if (!rangesContain(ranges, d)) return null;
  const prevIn = rangesContain(ranges, addDays(d, -1));
  const nextIn = rangesContain(ranges, addDays(d, 1));
  if (!prevIn && !nextIn) return "single";
  if (!prevIn) return "start";
  if (!nextIn) return "end";
  return "middle";
}

/**
 * First day of the week containing `d`, honoring `firstDayOfWeek`
 * (0 = Sunday .. 6 = Saturday). Pure foundation for `mode: "week"`.
 */
export function weekStart(d: CalendarDate, firstDayOfWeek = 0): CalendarDate {
  // Any of the 7 weekdays is valid (0=Sun..6=Sat); normalize so a stray
  // out-of-range integer can never break the offset math.
  const fdow = (((firstDayOfWeek % 7) + 7) % 7) | 0;
  const offset = (weekdayOf(d) - fdow + 7) % 7;
  return addDays(d, -offset);
}

/**
 * The 7-day range of the week containing `d`. Week mode selects this span;
 * weekend exclusion and multi-week then reuse the segmented-exclusion and
 * multiRange machinery without any week-specific logic.
 */
export function weekRange(d: CalendarDate, firstDayOfWeek = 0): CalendarRange {
  const start = weekStart(d, firstDayOfWeek);
  return { start, end: addDays(start, 6) };
}
