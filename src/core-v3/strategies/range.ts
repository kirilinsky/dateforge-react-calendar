import type { CalendarDate } from "../calendar-date";
import { noChange, type ReduceResult } from "../effects";
import type { PresetResult } from "../preset-engine";
import type { SelectionContext, SelectionStrategy } from "../strategy";
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
 * Two-click range. First valid click sets the anchor (pending, no notify);
 * second click commits the span between the two unit-snapped endpoints. For
 * `unit:"day"` the endpoints are the days themselves; for week/month they snap
 * to whole-unit boundaries. Reverse selection (anchor after end) is handled by
 * the outer hull. `minSpan`/`maxSpan` (in units) gate the commit.
 */

function timesFor(ctx: SelectionContext) {
  return ctx.config.withTime
    ? { from: ctx.config.defaultTime, to: ctx.config.defaultTime }
    : undefined;
}

function selectDay(ctx: SelectionContext, date: CalendarDate): ReduceResult {
  const sel = ctx.state.selection;
  if (sel.shape !== "span") return noChange(ctx.state);

  const rejection = validateDay(date, ctx.config);
  if (rejection) return rejected(ctx.state, rejection);

  // First click — arm the anchor, commit nothing yet.
  if (!sel.draftAnchor) return setDraftAnchor(ctx.state, date);

  // Second click — outer hull of both unit spans.
  const range = outerRange(
    unitSnap(sel.draftAnchor, ctx.config),
    unitSnap(date, ctx.config),
  );

  const lengthRejection = validateSpanLength(range, ctx.config);
  if (lengthRejection) return rejected(ctx.state, lengthRejection); // keep anchor

  const crossing = validateRangeCrossing(range, ctx.config);
  if (crossing) return rejected(ctx.state, crossing); // keep anchor

  return commitSpan(ctx.state, [range], timesFor(ctx), ctx.config);
}

function applyPreset(
  ctx: SelectionContext,
  preset: PresetResult,
): ReduceResult {
  if (preset.kind !== "range") return noChange(ctx.state);
  const lengthRejection = validateSpanLength(preset.range, ctx.config);
  if (lengthRejection) return rejected(ctx.state, lengthRejection);
  const crossing = validateRangeCrossing(preset.range, ctx.config);
  if (crossing) return rejected(ctx.state, crossing);
  return commitSpan(ctx.state, [preset.range], timesFor(ctx), ctx.config);
}

export const rangeStrategy: SelectionStrategy = {
  selectDay,
  setTime: (ctx, time, bound) =>
    spanSetTime(ctx.state, ctx.config, time, bound),
  clear: (ctx) => spanClear(ctx.state, ctx.config),
  applyPreset,
};
