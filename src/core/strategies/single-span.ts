import type { CalendarDate } from "../calendar-date";
import { noChange, type ReduceResult } from "../effects";
import type { PresetResult } from "../preset-engine";
import { resolveDefaultTime } from "../state";
import type { SelectionContext, SelectionStrategy } from "../strategy";
import {
  commitSpan,
  rangesEqual,
  rejected,
  spanClear,
  spanSetBoundDate,
  spanSetTime,
  unitSnap,
  validateDay,
  validateSpanLength,
} from "./shared";

/**
 * Single span in one click — `unit:"week"`/`"month"` with `mode:"single"`.
 * Clicking any day commits the whole unit span (the week or month); clicking
 * inside the selected span clears it when `deselectOnReclick` is on.
 */

function timesFor(ctx: SelectionContext) {
  if (!ctx.config.withTime) return undefined;
  const t = resolveDefaultTime(ctx.config);
  return { from: t, to: t };
}

function selectDay(ctx: SelectionContext, date: CalendarDate): ReduceResult {
  const sel = ctx.state.selection;
  if (sel.shape !== "span") return noChange(ctx.state);

  const rejection = validateDay(date, ctx.config);
  if (rejection) return rejected(ctx.state, rejection);

  const range = unitSnap(date, ctx.config);
  const current = sel.ranges[0];

  if (
    current &&
    rangesEqual(current, range) &&
    ctx.config.deselectOnReclick !== false
  ) {
    return commitSpan(ctx.state, [], undefined, ctx.config);
  }

  return commitSpan(ctx.state, [range], timesFor(ctx), ctx.config);
}

function applyPreset(
  ctx: SelectionContext,
  preset: PresetResult,
): ReduceResult {
  if (preset.kind === "date") return selectDay(ctx, preset.date);
  if (preset.kind === "range") {
    // Same invariants as a manual pick (the preset-engine contract).
    const startRejection = validateDay(preset.range.start, ctx.config);
    if (startRejection) return rejected(ctx.state, startRejection);
    const endRejection = validateDay(preset.range.end, ctx.config);
    if (endRejection) return rejected(ctx.state, endRejection);
    const lengthRejection = validateSpanLength(preset.range, ctx.config);
    if (lengthRejection) return rejected(ctx.state, lengthRejection);
    return commitSpan(ctx.state, [preset.range], timesFor(ctx), ctx.config);
  }
  return noChange(ctx.state);
}

export const singleSpanStrategy: SelectionStrategy = {
  selectDay,
  setBoundDate: (ctx, date, bound) =>
    spanSetBoundDate(ctx.state, ctx.config, date, bound),
  setTime: (ctx, time, bound) =>
    spanSetTime(ctx.state, ctx.config, time, bound),
  clear: (ctx) => spanClear(ctx.state, ctx.config),
  applyPreset,
};
