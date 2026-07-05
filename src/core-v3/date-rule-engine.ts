import {
  type CalendarDate,
  calendarDate,
  compareDate,
  dateKey,
  isValidDate,
  weekdayOf,
} from "./calendar-date";
import { mergeRanges, orderRange, rangesContain } from "./calendar-range";
import { warnOnce } from "./warnings";

/**
 * Shared rule engine behind both the `disabled` and `exclude` props — they have
 * identical rule shapes and only differ in meaning (disabled = cannot select;
 * exclude = skipped inside a span, splitting it). One compiled engine, queried
 * many times.
 *
 * Performance is a first-class concern: `matches` is the per-cell hot path that
 * runs on every grid render, including low-end phones. It does zero allocation
 * and checks rules cheapest-first (empty short-circuit → all flag → weekday bit
 * mask → exact-date Set → min/max compare → range binary search → predicates
 * last). Reasons are computed lazily and only when a UI asks (tooltip / aria).
 */
/** A day in rule config: a `CalendarDate` struct or a plain JS `Date`. */
export type DateRuleDayInput = CalendarDate | Date;

/** A span in rule config: `{start,end}` (v3) or `{from,to}` (v2 alias). */
export type DateRuleRangeInput =
  | { start: DateRuleDayInput; end: DateRuleDayInput }
  | { from: DateRuleDayInput; to: DateRuleDayInput };

export type DateRuleConfig = {
  /** Match every day. */
  all?: boolean;
  /** Match Saturday and Sunday. */
  weekends?: boolean;
  /** Match these weekdays (0 = Sun .. 6 = Sat). */
  weekdays?: number[];
  /** Match days strictly before this date. Also sets the inferred lower limit. */
  before?: DateRuleDayInput;
  /** Match days strictly after this date. Also sets the inferred upper limit. */
  after?: DateRuleDayInput;
  /** Match these exact days. */
  dates?: DateRuleDayInput[];
  /** Match days inside any of these spans. */
  ranges?: DateRuleRangeInput[];
  /** Arbitrary match — evaluated last, never indexed or cached. */
  predicate?: (date: CalendarDate) => boolean;
};

export type DateRuleReason =
  | "all"
  | "weekday"
  | "date"
  | "before"
  | "after"
  | "range"
  | "predicate";

export type DateRuleEngine = {
  /**
   * Hot path: does this day match the rules? O(1)–O(log R), allocation-free.
   * Pass `weekday` (0=Sun..6=Sat) when a grid cell already has it to avoid
   * recomputing weekday math for weekday/weekend rules.
   */
  matches(date: CalendarDate, weekday?: number): boolean;
  /** True when no rule is configured — callers can skip the engine entirely. */
  isEmpty: boolean;
  /** True when {@link getReason} can return a tag (i.e. not empty). */
  hasReasons: boolean;
  /** Lazy, opt-in: which rule matched, for tooltips / aria / validation. */
  getReason(date: CalendarDate, weekday?: number): DateRuleReason | null;
  /** Bounds implied by `before`/`after`, for view clamping. */
  limits: { min?: CalendarDate; max?: CalendarDate };
};

const EMPTY_ENGINE: DateRuleEngine = {
  matches: () => false,
  isEmpty: true,
  hasReasons: false,
  getReason: () => null,
  limits: {},
};

function normalizeWeekdayMask(config: DateRuleConfig): number {
  let mask = 0;
  if (config.weekends) mask |= (1 << 0) | (1 << 6);
  if (config.weekdays) {
    for (const w of config.weekdays) {
      if (Number.isInteger(w) && w >= 0 && w <= 6) mask |= 1 << w;
    }
  }
  return mask;
}

function weekdayFor(date: CalendarDate, weekday?: number): number {
  return weekday !== undefined &&
    Number.isInteger(weekday) &&
    weekday >= 0 &&
    weekday <= 6
    ? weekday
    : weekdayOf(date);
}

/**
 * Coerce a rule-config day (JS `Date` or `CalendarDate`) to a valid
 * `CalendarDate`, or `undefined` (with a dev warning) when malformed — the
 * boundary that lets `createDisabled` speak plain `Date` like v2.
 */
function coerceRuleDay(
  d: DateRuleDayInput | undefined,
  field: string,
): CalendarDate | undefined {
  if (d == null) return undefined;
  if (d instanceof Date) {
    if (Number.isNaN(d.getTime())) {
      warnOnce("malformedDateRule", `${field}: Invalid Date`);
      return undefined;
    }
    return calendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }
  if (!isValidDate(d)) {
    warnOnce("malformedDateRule", `${field}: not a valid calendar date`);
    return undefined;
  }
  return d;
}

/** Read a range input's bounds, accepting both `{start,end}` and `{from,to}`. */
function ruleRangeBounds(
  r: DateRuleRangeInput,
): [DateRuleDayInput | undefined, DateRuleDayInput | undefined] {
  if ("start" in r) return [r.start, r.end];
  return [r.from, r.to];
}

/**
 * Compile a rule config once into a queryable engine. Malformed entries are
 * skipped defensively with a dev warning (never throws). Both `disabled` and
 * `exclude` call this; day inputs accept plain JS `Date` (v2 parity).
 */
export function compileDateRules(config?: DateRuleConfig): DateRuleEngine {
  if (!config) return EMPTY_ENGINE;

  const all = config.all === true;
  const weekdayMask = normalizeWeekdayMask(config);

  const exactKeys = new Set<number>();
  if (config.dates) {
    for (const d of config.dates) {
      const day = coerceRuleDay(d, "dates");
      if (day) exactKeys.add(dateKey(day));
    }
  }

  const before = coerceRuleDay(config.before, "before");
  const after = coerceRuleDay(config.after, "after");

  const rangeBounds: { start: CalendarDate; end: CalendarDate }[] = [];
  if (config.ranges) {
    for (const r of config.ranges) {
      const [rawStart, rawEnd] = ruleRangeBounds(r);
      const start = coerceRuleDay(rawStart, "ranges.start");
      const end = coerceRuleDay(rawEnd, "ranges.end");
      if (start && end) rangeBounds.push(orderRange(start, end));
      else warnOnce("malformedDateRule", "ranges: missing/invalid bound");
    }
  }
  const ranges = mergeRanges(rangeBounds);

  const predicate = config.predicate;

  const isEmpty =
    !all &&
    weekdayMask === 0 &&
    exactKeys.size === 0 &&
    !before &&
    !after &&
    ranges.length === 0 &&
    !predicate;

  if (isEmpty) return EMPTY_ENGINE;

  const matches = (date: CalendarDate, weekday?: number): boolean => {
    if (all) return true;
    if (
      weekdayMask !== 0 &&
      (weekdayMask & (1 << weekdayFor(date, weekday))) !== 0
    )
      return true;
    if (exactKeys.size !== 0 && exactKeys.has(dateKey(date))) return true;
    if (before && compareDate(date, before) < 0) return true;
    if (after && compareDate(date, after) > 0) return true;
    if (ranges.length !== 0 && rangesContain(ranges, date)) return true;
    if (predicate?.(date)) return true;
    return false;
  };

  const getReason = (
    date: CalendarDate,
    weekday?: number,
  ): DateRuleReason | null => {
    if (all) return "all";
    if (
      weekdayMask !== 0 &&
      (weekdayMask & (1 << weekdayFor(date, weekday))) !== 0
    )
      return "weekday";
    if (exactKeys.size !== 0 && exactKeys.has(dateKey(date))) return "date";
    if (before && compareDate(date, before) < 0) return "before";
    if (after && compareDate(date, after) > 0) return "after";
    if (ranges.length !== 0 && rangesContain(ranges, date)) return "range";
    if (predicate?.(date)) return "predicate";
    return null;
  };

  return {
    matches,
    isEmpty: false,
    hasReasons: true,
    getReason,
    limits: { min: before, max: after },
  };
}
