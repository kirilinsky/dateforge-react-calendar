import {
  addDays,
  type CalendarDate,
  compareDate,
  isValidDate,
} from "../calendar-date";
import {
  type CalendarRange,
  mergeRanges,
  rangesOverlap,
} from "../calendar-range";
import { noChange, type ReduceResult } from "../effects";
import type { PresetResult } from "../preset-engine";
import type { SelectionContext, SelectionStrategy } from "../strategy";
import { invalid } from "../validation";
import {
  commitSpan,
  outerRange,
  rejected,
  setDraftAnchor,
  spanClear,
  spanSetTime,
  unitSnap,
  validateDay,
  validateRangeCrossing,
  validateSpanLength,
} from "./shared";

/**
 * Span collection strategy.
 *
 * - `mode:"multi-range"`: two-click creation of multiple logical spans.
 * - `unit:"week"|"month" + mode:"multiple"`: one-click toggle of snapped
 *   unit spans.
 *
 * Committed spans are canonical: sorted and merged when adjacent/overlapping.
 */

function timesFor(ctx: SelectionContext) {
  return ctx.config.withTime
    ? { from: ctx.config.defaultTime, to: ctx.config.defaultTime }
    : undefined;
}

function countRejection(
  ranges: readonly CalendarRange[],
  config: SelectionContext["config"],
) {
  return config.maxRanges !== undefined && ranges.length > config.maxRanges
    ? invalid("max-ranges-reached")
    : null;
}

function addRange(ctx: SelectionContext, range: CalendarRange): ReduceResult {
  const sel = ctx.state.selection;
  if (sel.shape !== "span") return noChange(ctx.state);

  const lengthRejection = validateSpanLength(range, ctx.config);
  if (lengthRejection) return rejected(ctx.state, lengthRejection);

  const crossing = validateRangeCrossing(range, ctx.config);
  if (crossing) return rejected(ctx.state, crossing);

  const next = mergeRanges([...sel.ranges, range]);
  const maxRejection = countRejection(next, ctx.config);
  if (maxRejection) return rejected(ctx.state, maxRejection);

  return commitSpan(ctx.state, next, timesFor(ctx), ctx.config);
}

function subtractRange(
  range: CalendarRange,
  cut: CalendarRange,
): CalendarRange[] {
  if (!rangesOverlap(range, cut)) return [range];

  const out: CalendarRange[] = [];
  const leftEnd = addDays(cut.start, -1);
  if (compareDate(range.start, leftEnd) <= 0) {
    out.push({ start: range.start, end: leftEnd });
  }

  const rightStart = addDays(cut.end, 1);
  if (compareDate(rightStart, range.end) <= 0) {
    out.push({ start: rightStart, end: range.end });
  }

  return out;
}

function removeCut(
  ctx: SelectionContext,
  cut: CalendarRange,
): ReduceResult | null {
  const sel = ctx.state.selection;
  if (sel.shape !== "span") return noChange(ctx.state);

  const index = sel.ranges.findIndex((r) => rangesOverlap(r, cut));
  if (index === -1) return null;

  const next: CalendarRange[] = [];
  for (let i = 0; i < sel.ranges.length; i++) {
    const range = sel.ranges[i];
    if (i === index) next.push(...subtractRange(range, cut));
    else next.push(range);
  }

  return commitSpan(ctx.state, next, timesFor(ctx), ctx.config);
}

function toggleUnit(ctx: SelectionContext, date: CalendarDate): ReduceResult {
  const sel = ctx.state.selection;
  if (sel.shape !== "span") return noChange(ctx.state);

  if (!isValidDate(date)) {
    return rejected(ctx.state, invalid("malformed-input"));
  }

  const range = unitSnap(date, ctx.config);
  const removed = removeCut(ctx, range);
  if (removed) return removed;

  const rejection = validateDay(date, ctx.config);
  if (rejection) return rejected(ctx.state, rejection);

  return addRange(ctx, range);
}

function selectMultiRange(
  ctx: SelectionContext,
  date: CalendarDate,
): ReduceResult {
  const sel = ctx.state.selection;
  if (sel.shape !== "span") return noChange(ctx.state);

  if (!isValidDate(date)) {
    return rejected(ctx.state, invalid("malformed-input"));
  }

  if (!sel.draftAnchor) {
    const removed = removeCut(ctx, unitSnap(date, ctx.config));
    if (removed) return removed;
  }

  const rejection = validateDay(date, ctx.config);
  if (rejection) return rejected(ctx.state, rejection);

  if (!sel.draftAnchor) return setDraftAnchor(ctx.state, date);

  const range = outerRange(
    unitSnap(sel.draftAnchor, ctx.config),
    unitSnap(date, ctx.config),
  );
  return addRange(ctx, range);
}

function selectDay(ctx: SelectionContext, date: CalendarDate): ReduceResult {
  return ctx.config.mode === "multiple"
    ? toggleUnit(ctx, date)
    : selectMultiRange(ctx, date);
}

function removeRange(ctx: SelectionContext, index: number): ReduceResult {
  const sel = ctx.state.selection;
  if (sel.shape !== "span") return noChange(ctx.state);
  if (!Number.isInteger(index) || index < 0 || index >= sel.ranges.length) {
    return noChange(ctx.state);
  }
  return commitSpan(
    ctx.state,
    sel.ranges.filter((_, i) => i !== index),
    timesFor(ctx),
    ctx.config,
  );
}

function applyPreset(
  ctx: SelectionContext,
  preset: PresetResult,
): ReduceResult {
  if (preset.kind === "date") return selectDay(ctx, preset.date);
  if (preset.kind !== "range") return noChange(ctx.state);

  const startRejection = validateDay(preset.range.start, ctx.config);
  if (startRejection) return rejected(ctx.state, startRejection);
  const endRejection = validateDay(preset.range.end, ctx.config);
  if (endRejection) return rejected(ctx.state, endRejection);

  const range =
    compareDate(preset.range.start, preset.range.end) <= 0
      ? preset.range
      : { start: preset.range.end, end: preset.range.start };
  return addRange(ctx, range);
}

export const multiSpanStrategy: SelectionStrategy = {
  selectDay,
  setTime: (ctx, time, bound) =>
    spanSetTime(ctx.state, ctx.config, time, bound),
  clear: (ctx) => spanClear(ctx.state, ctx.config),
  applyPreset,
  removeRange,
};
