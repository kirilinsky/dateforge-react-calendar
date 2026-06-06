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
import { type CalendarTime, isValidTime } from "../calendar-time";
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

function materializeSpanRanges(
  ranges: readonly CalendarRange[],
  config?: CalendarConfig,
): CalendarRange[] | null {
  if (!config || config.exclude.isEmpty || ranges.length === 0) {
    return ranges.slice();
  }

  const out: CalendarRange[] = [];
  for (const range of ranges) {
    if (
      config.excludedEndpointPolicy === "reject" &&
      (config.exclude.matches(range.start) || config.exclude.matches(range.end))
    ) {
      return null;
    }

    const segments = applyExclusion(range, config.exclude);
    if (segments.length === 0) return null;
    out.push(...segments);
  }
  return out;
}

/** Commit a span selection (clears any draft anchor) and emit notify. */
export function commitSpan(
  state: CalendarState,
  ranges: CalendarRange[],
  times?: SpanTimes,
  config?: CalendarConfig,
): ReduceResult {
  const selection: SpanSelection = {
    shape: "span",
    ranges,
    fromTime: times?.from,
    toTime: times?.to,
  };

  const notifyRanges = materializeSpanRanges(ranges, config);
  if (!notifyRanges) return rejected(state, invalid("empty-after-exclude"));

  const notifySelection: SpanSelection = {
    ...selection,
    ranges: notifyRanges,
  };

  return result({ ...state, selection }, [
    { type: "notify", selection: notifySelection },
  ]);
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
  if (!isValidTime(time)) return rejected(state, invalid("malformed-input"));
  const from = bound === "to" ? sel.fromTime : time;
  const to = bound === "from" ? sel.toTime : time;
  return commitSpan(state, [...sel.ranges], { from, to }, config);
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
