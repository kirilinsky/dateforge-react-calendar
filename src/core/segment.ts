import { addDays, type CalendarDate, compareDate } from "./calendar-date";
import type { CalendarRange } from "./calendar-range";

/**
 * The minimal shape a span-cutting rule needs: does a day fall out of the span,
 * and is the rule a no-op. `DateRuleEngine` satisfies it structurally, and so
 * does the combined cut below — so `exclude` and `disabled` can be merged into
 * one membership test for segmentation.
 */
export type DayCut = {
  matches(date: CalendarDate, weekday?: number): boolean;
  readonly isEmpty: boolean;
};

const EMPTY_CUT: DayCut = { matches: () => false, isEmpty: true };

/**
 * Merge several cuts into one: a day is cut when ANY rule matches. Used to drop
 * both `exclude`d and `disabled` days from a span's value/render in a single
 * pass (a disabled day must never survive in the selection, same as excluded).
 */
export function combineCuts(...cuts: DayCut[]): DayCut {
  const active = cuts.filter((c) => !c.isEmpty);
  if (active.length === 0) return EMPTY_CUT;
  if (active.length === 1) return active[0];
  return {
    isEmpty: false,
    matches: (date, weekday) => active.some((c) => c.matches(date, weekday)),
  };
}

/**
 * Split a span into contiguous segments, dropping days the `exclude` engine
 * matches. One drawn span with weekend exclusion becomes several business-day
 * segments. This runs at emit time (building the public value), NOT per cell on
 * render — the grid stays O(1) per cell via interval membership. When the
 * engine is empty the span passes through untouched (no allocation churn).
 */
export function applyExclusion(
  span: CalendarRange,
  exclude: DayCut,
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
  exclude: DayCut,
): CalendarRange[] {
  if (exclude.isEmpty) return spans.slice();
  const out: CalendarRange[] = [];
  for (const span of spans) {
    for (const seg of applyExclusion(span, exclude)) out.push(seg);
  }
  return out;
}
