import {
  addDays,
  type CalendarDate,
  calendarDate,
  compareDate,
  dateKey,
  daysInMonth,
  isValidDate,
} from "../calendar-date";
import type { CalendarDateTime } from "../calendar-date-time";
import {
  type CalendarRange,
  rangeLengthDays,
  weekRange,
} from "../calendar-range";
import {
  type CalendarTime,
  compareTime,
  isValidTime,
  timeWindowSide,
} from "../calendar-time";
import { noChange, type ReduceResult, result } from "../effects";
import { applyExclusion } from "../segment";
import type {
  CalendarConfig,
  CalendarState,
  PointSelection,
  SpanSelection,
} from "../state";
import { invalid, type ValidationResult } from "../validation";

/**
 * Day-level validation shared by every strategy: `disabled` blocks selection,
 * then min/max bounds. Returns the rejection reason, or `null` when the day is
 * selectable. `exclude` is NOT checked here — excluded days still belong to a
 * span; they are dropped at segment/emit time, not at the click.
 */
export function validateDay(
  date: CalendarDate,
  config: CalendarConfig,
): ValidationResult | null {
  if (!isValidDate(date)) return invalid("malformed-input");
  if (config.disabled.matches(date)) return invalid("disabled");
  if (config.min && compareDate(date, config.min) < 0)
    return invalid("before-min");
  if (config.max && compareDate(date, config.max) > 0)
    return invalid("after-max");
  return null;
}

/**
 * Time-of-day validation: a malformed field first, then the inclusive
 * `[minTime, maxTime]` window. Returns the rejection reason, or `null` when the
 * time is selectable. Shared by every `setTime` path so the window is enforced
 * once in the core — modules only gate their affordances on top.
 */
export function validateTime(
  time: CalendarTime,
  config: CalendarConfig,
): ValidationResult | null {
  if (!isValidTime(time)) return invalid("malformed-input");
  const side = timeWindowSide(time, config.minTime, config.maxTime);
  if (side < 0) return invalid("time-before-min");
  if (side > 0) return invalid("time-after-max");
  return null;
}

/** Commit a point selection and emit a notify effect. */
export function commitPoint(
  state: CalendarState,
  dates: CalendarDateTime[],
): ReduceResult {
  const selection: PointSelection = { shape: "point", dates };
  return result({ ...state, selection }, [{ type: "notify", selection }]);
}

/** Transient rejection: state unchanged, one validationRejected effect. */
export function rejected(
  state: CalendarState,
  reason: ValidationResult,
): ReduceResult {
  return result(state, [{ type: "validationRejected", result: reason }]);
}

// --- span helpers (week/month units, range & multi-range) ---

/**
 * Snap a clicked day to the span its unit represents. O(1):
 * day → just that day, week → the whole week, month → the whole month.
 */
export function unitSnap(
  date: CalendarDate,
  config: CalendarConfig,
): CalendarRange {
  switch (config.unit) {
    case "week":
      return weekRange(date, config.firstDayOfWeek);
    case "month":
      return {
        start: calendarDate(date.year, date.month, 1),
        end: calendarDate(
          date.year,
          date.month,
          daysInMonth(date.year, date.month),
        ),
      };
    default:
      return { start: date, end: date };
  }
}

/** Span length measured in the active unit (closed-form, no day iteration). */
export function spanUnitLength(
  range: CalendarRange,
  config: CalendarConfig,
): number {
  switch (config.unit) {
    case "week":
      return rangeLengthDays(range) / 7;
    case "month":
      return (
        range.end.year * 12 +
        range.end.month -
        (range.start.year * 12 + range.start.month) +
        1
      );
    default:
      return rangeLengthDays(range);
  }
}

/** minSpan/maxSpan check, in units. `null` when the length is allowed. */
export function validateSpanLength(
  range: CalendarRange,
  config: CalendarConfig,
): ValidationResult | null {
  const len = spanUnitLength(range, config);
  if (config.minSpan !== undefined && len < config.minSpan)
    return invalid("range-too-short");
  if (config.maxSpan !== undefined && len > config.maxSpan)
    return invalid("range-too-long");
  return null;
}

/**
 * A user-drawn day range may not step over a disabled day: the second endpoint
 * lands past a blocked day, so the span is rejected (keeping the anchor). This
 * applies to `unit:"day"` only — week/month units are atomic, so a disabled day
 * inside a selected week/month is not a "crossing" and must not reject the unit.
 * Returns the rejection reason, or `null` when the span is clear.
 */
export function validateRangeCrossing(
  range: CalendarRange,
  config: CalendarConfig,
): ValidationResult | null {
  if (config.unit !== "day" || config.disabled.isEmpty) return null;
  for (
    let cur = range.start;
    compareDate(cur, range.end) <= 0;
    cur = addDays(cur, 1)
  ) {
    if (config.disabled.matches(cur)) return invalid("range-crosses-disabled");
  }
  return null;
}

/** Same span (by endpoints). */
export function rangesEqual(a: CalendarRange, b: CalendarRange): boolean {
  return (
    dateKey(a.start) === dateKey(b.start) && dateKey(a.end) === dateKey(b.end)
  );
}

export type SpanTimes = { from?: CalendarTime; to?: CalendarTime };

/**
 * Exclusion validity check for a span commit. Rejects when an endpoint is
 * excluded under the `"reject"` policy, or when exclusion would erase a span
 * entirely (`empty-after-exclude`). VALIDATION ONLY — segments computed here are
 * discarded: per §2d the committed/emitted value carries logical spans, and the
 * segmented view is derived later (`toSegments`) into change details.
 */
function spanExclusionRejection(
  ranges: readonly CalendarRange[],
  config?: CalendarConfig,
): ValidationResult | null {
  if (!config || config.exclude.isEmpty || ranges.length === 0) return null;
  for (const range of ranges) {
    if (
      config.excludedEndpointPolicy === "reject" &&
      (config.exclude.matches(range.start) || config.exclude.matches(range.end))
    ) {
      return invalid("empty-after-exclude");
    }
    if (applyExclusion(range, config.exclude).length === 0) {
      return invalid("empty-after-exclude");
    }
  }
  return null;
}

/**
 * Commit a span selection (clears any draft anchor) and emit notify. The notify
 * payload is the LOGICAL selection (§2d) — never pre-segmented; the adapter
 * derives the public value and `details.segments` from committed state.
 */
export function commitSpan(
  state: CalendarState,
  ranges: CalendarRange[],
  times?: SpanTimes,
  config?: CalendarConfig,
): ReduceResult {
  const exclusionRejection = spanExclusionRejection(ranges, config);
  if (exclusionRejection) return rejected(state, exclusionRejection);

  const selection: SpanSelection = {
    shape: "span",
    ranges,
    fromTime: times?.from,
    toTime: times?.to,
  };
  return result({ ...state, selection }, [{ type: "notify", selection }]);
}

/** Set/clear the pending range anchor. Pending = no notify (range incomplete). */
export function setDraftAnchor(
  state: CalendarState,
  anchor?: CalendarDate,
): ReduceResult {
  const sel = state.selection;
  if (sel.shape !== "span") return noChange(state);
  return noChange({ ...state, selection: { ...sel, draftAnchor: anchor } });
}

/** Outer hull of two spans: earliest start, latest end. O(1). */
export function outerRange(a: CalendarRange, b: CalendarRange): CalendarRange {
  return {
    start: compareDate(a.start, b.start) <= 0 ? a.start : b.start,
    end: compareDate(a.end, b.end) >= 0 ? a.end : b.end,
  };
}

/** Time edit for a span selection (range bounds). Shared by span strategies. */
export function spanSetTime(
  state: CalendarState,
  config: CalendarConfig,
  time: CalendarTime,
  bound?: "from" | "to",
): ReduceResult {
  const sel = state.selection;
  if (!config.withTime || sel.shape !== "span" || sel.ranges.length === 0) {
    return noChange(state);
  }
  const timeInvalid = validateTime(time, config);
  if (timeInvalid) return rejected(state, timeInvalid);
  const from = bound === "to" ? sel.fromTime : time;
  const to = bound === "from" ? sel.toTime : time;
  // Same-day span: the from-time may not pass the to-time, otherwise the
  // selection would end before it starts. Cross-day spans order by date alone.
  const first = sel.ranges[0].start;
  const last = sel.ranges[sel.ranges.length - 1].end;
  if (
    from &&
    to &&
    compareDate(first, last) === 0 &&
    compareTime(from, to) > 0
  ) {
    return rejected(state, invalid("time-out-of-order"));
  }
  return commitSpan(state, [...sel.ranges], { from, to }, config);
}

/**
 * Date edit for one bound of a span selection (manual input "from"/"to"
 * fields, bound month/year wheels). Mirrors `spanSetTime`: validates the day,
 * keeps the other bound, rejects inverted ranges instead of silently swapping
 * — a typing user must see the input flagged, not watch their bounds flip.
 */
export function spanSetBoundDate(
  state: CalendarState,
  config: CalendarConfig,
  date: CalendarDate,
  bound: "from" | "to",
): ReduceResult {
  const sel = state.selection;
  if (sel.shape !== "span" || sel.ranges.length === 0) return noChange(state);

  const dayInvalid = validateDay(date, config);
  if (dayInvalid) return rejected(state, dayInvalid);

  const current = sel.ranges[0];
  const next: CalendarRange =
    bound === "from"
      ? { start: date, end: current.end }
      : { start: current.start, end: date };
  if (compareDate(next.start, next.end) > 0) {
    return rejected(state, invalid("range-out-of-order"));
  }
  if (rangesEqual(current, next)) return noChange(state);

  const lengthInvalid = validateSpanLength(next, config);
  if (lengthInvalid) return rejected(state, lengthInvalid);
  const crossingInvalid = validateRangeCrossing(next, config);
  if (crossingInvalid) return rejected(state, crossingInvalid);

  // Same-day result: existing from/to times must stay ordered.
  const { fromTime, toTime } = sel;
  if (
    fromTime &&
    toTime &&
    compareDate(next.start, next.end) === 0 &&
    compareTime(fromTime, toTime) > 0
  ) {
    return rejected(state, invalid("time-out-of-order"));
  }

  return commitSpan(state, [next], { from: fromTime, to: toTime }, config);
}

/** Clear a span selection. Drops a lone draft anchor without a notify. */
export function spanClear(
  state: CalendarState,
  config?: CalendarConfig,
): ReduceResult {
  const sel = state.selection;
  if (sel.shape !== "span") return noChange(state);
  if (sel.ranges.length > 0) return commitSpan(state, [], undefined, config);
  if (sel.draftAnchor) return setDraftAnchor(state, undefined);
  return noChange(state);
}
