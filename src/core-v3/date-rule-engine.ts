import {
  type CalendarDate,
  compareDate,
  dateKey,
  isValidDate,
  weekdayOf,
} from "./calendar-date";
import {
  type CalendarRange,
  mergeRanges,
  orderRange,
  rangesContain,
} from "./calendar-range";

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
export type DateRuleConfig = {
  /** Match every day. */
  all?: boolean;
  /** Match Saturday and Sunday. */
  weekends?: boolean;
  /** Match these weekdays (0 = Sun .. 6 = Sat). */
  weekdays?: number[];
  /** Match days strictly before this date. Also sets the inferred lower limit. */
  before?: CalendarDate;
  /** Match days strictly after this date. Also sets the inferred upper limit. */
  after?: CalendarDate;
  /** Match these exact days. */
  dates?: CalendarDate[];
  /** Match days inside any of these spans. */
  ranges?: CalendarRange[];
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
  /** Hot path: does this day match the rules? O(1)–O(log R), allocation-free. */
  matches(date: CalendarDate): boolean;
  /** True when no rule is configured — callers can skip the engine entirely. */
  isEmpty: boolean;
  /** True when {@link getReason} can return a tag (i.e. not empty). */
  hasReasons: boolean;
  /** Lazy, opt-in: which rule matched, for tooltips / aria / validation. */
  getReason(date: CalendarDate): DateRuleReason | null;
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

/**
 * Compile a rule config once into a queryable engine. Malformed entries are
 * skipped defensively (never throws); a future warning registry can report
 * them. Both `disabled` and `exclude` call this.
 */
export function compileDateRules(config?: DateRuleConfig): DateRuleEngine {
  if (!config) return EMPTY_ENGINE;

  const all = config.all === true;
  const weekdayMask = normalizeWeekdayMask(config);

  const exactKeys = new Set<number>();
  if (config.dates) {
    for (const d of config.dates) {
      if (isValidDate(d)) exactKeys.add(dateKey(d));
    }
  }

  const before =
    config.before && isValidDate(config.before) ? config.before : undefined;
  const after =
    config.after && isValidDate(config.after) ? config.after : undefined;

  const ranges = config.ranges
    ? mergeRanges(
        config.ranges
          .filter((r) => isValidDate(r.start) && isValidDate(r.end))
          .map((r) => orderRange(r.start, r.end)),
      )
    : [];

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

  const matches = (date: CalendarDate): boolean => {
    if (all) return true;
    if (weekdayMask !== 0 && (weekdayMask & (1 << weekdayOf(date))) !== 0)
      return true;
    if (exactKeys.size !== 0 && exactKeys.has(dateKey(date))) return true;
    if (before && compareDate(date, before) < 0) return true;
    if (after && compareDate(date, after) > 0) return true;
    if (ranges.length !== 0 && rangesContain(ranges, date)) return true;
    if (predicate?.(date)) return true;
    return false;
  };

  const getReason = (date: CalendarDate): DateRuleReason | null => {
    if (all) return "all";
    if (weekdayMask !== 0 && (weekdayMask & (1 << weekdayOf(date))) !== 0)
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
