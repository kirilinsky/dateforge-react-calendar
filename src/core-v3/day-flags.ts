import {
  type CalendarDate,
  dateKey,
  datesEqual,
  weekdayOf,
} from "./calendar-date";
import { type CalendarRange, rangeIndexOf } from "./calendar-range";
import { applyExclusionAll, combineCuts } from "./segment";
import type { CalendarConfig, SelectionState } from "./state";
import { outerRange, unitSnap } from "./strategies/shared";

/**
 * Per-day cell state as a packed bitmask — the hot product of the calendar.
 *
 * Days are the most-rendered surface (42 cells × N calendars), re-derived on
 * every hover while a range is being drawn. A single `number` keeps the cell's
 * whole visual state in a V8 SMI (no heap alloc, no GC churn), so a cell can
 * memo on `prevFlags === nextFlags` and skip rendering when nothing about it
 * changed. The bits are deliberately opaque here; the UI layer maps them to
 * readable class/`data-*` attributes once, at the boundary.
 *
 * Invariant relied on for zero-alloc edges: committed `ranges` are canonical
 * (sorted, non-overlapping, non-adjacent — see `mergeRanges`), so a day's
 * range role is decided by comparing it to the containing span's own
 * endpoints, never by probing neighbour days.
 */
export const DayFlag = {
  Selected: 1 << 0,
  InRange: 1 << 1,
  RangeStart: 1 << 2,
  RangeEnd: 1 << 3,
  Preview: 1 << 4,
  PreviewStart: 1 << 5,
  PreviewEnd: 1 << 6,
  Disabled: 1 << 7,
  Excluded: 1 << 8,
  Today: 1 << 9,
  OutOfMonth: 1 << 10,
  Weekend: 1 << 11,
} as const;

/**
 * Selection digest prepared once when the selection changes (a click — rare),
 * NOT on hover. Point selections become an O(1) key set; span selections hold
 * the *effective* ranges — after exclusion, so an excluded day inside a drawn
 * span falls out of `InRange` and the range renders as the same business-day
 * segments the public value emits (a hole, not a struck-through fill). Keeps
 * `dayFlags` allocation-free.
 */
export type DayLookup =
  | { readonly shape: "point"; readonly pointKeys: ReadonlySet<number> }
  | { readonly shape: "span"; readonly ranges: readonly CalendarRange[] };

/**
 * Build the per-cell lookup from a selection. Call on selection change only.
 * Pass `config` so span ranges are segmented (exclude + disabled) the same way
 * the emitted value is — keeping the grid and `onChange` in agreement.
 */
export function buildDayLookup(
  sel: SelectionState,
  config?: CalendarConfig,
): DayLookup {
  if (sel.shape === "point") {
    const pointKeys = new Set<number>();
    for (const dt of sel.dates) pointKeys.add(dateKey(dt.date));
    return { shape: "point", pointKeys };
  }
  if (!config) return { shape: "span", ranges: sel.ranges };
  const cut = combineCuts(config.exclude, config.disabled);
  const ranges = cut.isEmpty ? sel.ranges : applyExclusionAll(sel.ranges, cut);
  return { shape: "span", ranges };
}

/**
 * Provisional segments drawn between the pending anchor and the hovered day,
 * snapped to whole units and split by `exclude` — exactly how the span will
 * commit. Computed ONCE per hover by the adapter, then handed to every cell, so
 * the preview shows the same holes as the eventual selection (no flicker from
 * "blue on hover, hole on select"). Empty when there is no active draft (point
 * shapes, no anchor, or no hover target).
 */
export function buildPreviewSegments(
  sel: SelectionState,
  config: CalendarConfig,
  hoverDate: CalendarDate | undefined,
): CalendarRange[] {
  if (sel.shape !== "span" || !sel.draftAnchor || !hoverDate) return [];
  const hull = outerRange(
    unitSnap(sel.draftAnchor, config),
    unitSnap(hoverDate, config),
  );
  return applyExclusionAll(
    [hull],
    combineCuts(config.exclude, config.disabled),
  );
}

/**
 * Pack a day's full cell state into one bitmask. Allocation-free and SMI-safe;
 * call it per visible cell. `preview`/`today` are optional precomputed inputs;
 * `inMonth` is `false` for the leading/trailing days a month grid borrows from
 * neighbouring months (tracks pass the default `true`).
 */
export function dayFlags(
  date: CalendarDate,
  lookup: DayLookup,
  config: CalendarConfig,
  preview?: readonly CalendarRange[],
  today?: CalendarDate,
  inMonth = true,
): number {
  let f = 0;

  if (lookup.shape === "point") {
    if (lookup.pointKeys.has(dateKey(date))) f |= DayFlag.Selected;
  } else {
    const idx = rangeIndexOf(lookup.ranges, date);
    if (idx !== -1) {
      const r = lookup.ranges[idx];
      const isStart = datesEqual(date, r.start);
      const isEnd = datesEqual(date, r.end);
      f |= DayFlag.InRange;
      if (isStart) f |= DayFlag.RangeStart;
      if (isEnd) f |= DayFlag.RangeEnd;
      // A one-day span reads as a plain selected day to the UI.
      if (isStart && isEnd) f |= DayFlag.Selected;
    }
  }

  if (preview && preview.length !== 0) {
    const idx = rangeIndexOf(preview, date);
    if (idx !== -1) {
      const seg = preview[idx];
      f |= DayFlag.Preview;
      if (datesEqual(date, seg.start)) f |= DayFlag.PreviewStart;
      if (datesEqual(date, seg.end)) f |= DayFlag.PreviewEnd;
    }
  }

  // Weekday is computed once and threaded into the rule engines so they don't
  // recompute it (dayOfWeek rules need it; `matches` takes it as a fast path).
  const wd = weekdayOf(date);
  if (config.disabled.matches(date, wd)) f |= DayFlag.Disabled;
  if (!config.exclude.isEmpty && config.exclude.matches(date, wd)) {
    f |= DayFlag.Excluded;
  }
  if (wd === 0 || wd === 6) f |= DayFlag.Weekend;

  if (today && datesEqual(date, today)) f |= DayFlag.Today;
  if (!inMonth) f |= DayFlag.OutOfMonth;

  return f;
}
