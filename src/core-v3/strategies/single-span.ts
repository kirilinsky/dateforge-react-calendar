import type { CalendarDate } from "../calendar-date";
import { noChange, type ReduceResult } from "../effects";
import type { PresetResult } from "../preset-engine";
import type { SelectionContext, SelectionStrategy } from "../strategy";
import {
  commitSpan,
  rangesEqual,
  rejected,
  spanClear,
  spanSetTime,
  unitSnap,
  validateDay,
} from "./shared";

/**
 * Single span in one click — `unit:"week"`/`"month"` with `mode:"single"`.
 * Clicking any day commits the whole unit span (the week or month); clicking
 * inside the selected span clears it when `deselectOnReclick` is on.
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

  const range = unitSnap(date, ctx.config);
  const current = sel.ranges[0];

  if (
    current &&
    rangesEqual(current, range) &&
    ctx.config.deselectOnReclick !== false
  ) {
    return commitSpan(ctx.state, []);
  }

  return commitSpan(ctx.state, [range], timesFor(ctx));
}

function applyPreset(
  ctx: SelectionContext,
  preset: PresetResult,
): ReduceResult {
  if (preset.kind === "date") return selectDay(ctx, preset.date);
  if (preset.kind === "range")
    return commitSpan(ctx.state, [preset.range], timesFor(ctx));
  return noChange(ctx.state);
}

export const singleSpanStrategy: SelectionStrategy = {
  selectDay,
  setTime: (ctx, time, bound) =>
    spanSetTime(ctx.state, ctx.config, time, bound),
  clear: (ctx) => spanClear(ctx.state),
  applyPreset,
};
