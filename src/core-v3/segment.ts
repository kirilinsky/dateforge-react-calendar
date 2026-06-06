import { addDays, type CalendarDate, compareDate } from "./calendar-date";
import type { CalendarRange } from "./calendar-range";
import type { DateRuleEngine } from "./date-rule-engine";

/**
 * Split a span into contiguous segments, dropping days the `exclude` engine
 * matches. One drawn span with weekend exclusion becomes several business-day
 * segments. This runs at emit time (building the public value), NOT per cell on
 * render — the grid stays O(1) per cell via interval membership. When the
 * engine is empty the span passes through untouched (no allocation churn).
 */
export function applyExclusion(
  span: CalendarRange,
  exclude: DateRuleEngine,
): CalendarRange[] {
  if (exclude.isEmpty) return [span];

  const out: CalendarRange[] = [];
  let segStart: CalendarDate | null = null;
  let prev: CalendarDate | null = null;

  for (
    let cur = span.start;
    compareDate(cur, span.end) <= 0;
    cur = addDays(cur, 1)
  ) {
    if (exclude.matches(cur)) {
      if (segStart && prev) {
        out.push({ start: segStart, end: prev });
        segStart = null;
      }
    } else {
      if (!segStart) segStart = cur;
      prev = cur;
    }
  }
  if (segStart && prev) out.push({ start: segStart, end: prev });
  return out;
}

/** Apply exclusion across many spans, flattening to all segments in order. */
export function applyExclusionAll(
  spans: readonly CalendarRange[],
  exclude: DateRuleEngine,
): CalendarRange[] {
  if (exclude.isEmpty) return spans.slice();
  const out: CalendarRange[] = [];
  for (const span of spans) {
    for (const seg of applyExclusion(span, exclude)) out.push(seg);
  }
  return out;
}
