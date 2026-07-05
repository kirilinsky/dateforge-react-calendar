import { type CalendarDate, datesEqual } from "../calendar-date";
import {
  type CalendarDateTime,
  calendarDateTime,
  withTime,
} from "../calendar-date-time";
import { type CalendarTime, MIDNIGHT } from "../calendar-time";
import { noChange, type ReduceResult } from "../effects";
import type { PresetResult } from "../preset-engine";
import { resolveDefaultTime } from "../state";
import type { SelectionContext, SelectionStrategy } from "../strategy";
import { commitPoint, rejected, validateDay, validateTime } from "./shared";

/**
 * Single-date selection. Exactly one day is held (point shape). Clicking a new
 * valid day commits it; clicking the selected day clears it when
 * `deselectOnReclick` is on (the default). All invariants (disabled, min/max)
 * live here, so visual modules never re-check them.
 */

function timeForNewDay(ctx: SelectionContext, current?: CalendarDateTime) {
  if (!ctx.config.withTime) return MIDNIGHT;
  // Carry the previously chosen time, else the configured default (clamped to
  // the time window).
  return current?.time ?? resolveDefaultTime(ctx.config);
}

function selectDay(ctx: SelectionContext, date: CalendarDate): ReduceResult {
  const sel = ctx.state.selection;
  if (sel.shape !== "point") return noChange(ctx.state);

  const rejection = validateDay(date, ctx.config);
  if (rejection) return rejected(ctx.state, rejection);

  const current = sel.dates[0];

  // Re-click the selected day -> deselect (default on).
  if (
    current &&
    datesEqual(current.date, date) &&
    ctx.config.deselectOnReclick !== false
  ) {
    return commitPoint(ctx.state, []);
  }

  const value = calendarDateTime(date, timeForNewDay(ctx, current));
  return commitPoint(ctx.state, [value]);
}

function setTime(ctx: SelectionContext, time: CalendarTime): ReduceResult {
  const sel = ctx.state.selection;
  if (!ctx.config.withTime || sel.shape !== "point") {
    return noChange(ctx.state);
  }
  const timeInvalid = validateTime(time, ctx.config);
  if (timeInvalid) return rejected(ctx.state, timeInvalid);

  // Time-only flow (v2 parity): editing time with NO selection auto-creates
  // one on the view anchor — a bare `<CalendarTimeWheel/>` works as a time
  // picker. The anchor day still passes the same day invariants as a click.
  if (!sel.dates[0]) {
    const anchor = ctx.state.view.viewDate;
    const rejection = validateDay(anchor, ctx.config);
    if (rejection) return rejected(ctx.state, rejection);
    return commitPoint(ctx.state, [calendarDateTime(anchor, time)]);
  }

  return commitPoint(ctx.state, [withTime(sel.dates[0], time)]);
}

function clear(ctx: SelectionContext): ReduceResult {
  const sel = ctx.state.selection;
  if (sel.shape === "point" && sel.dates.length === 0)
    return noChange(ctx.state);
  return commitPoint(ctx.state, []);
}

function applyPreset(
  ctx: SelectionContext,
  preset: PresetResult,
): ReduceResult {
  // Single only accepts a single-date preset; the engine filters the rest, this
  // is just defensive.
  if (preset.kind !== "date") return noChange(ctx.state);
  return selectDay(ctx, preset.date);
}

export const singleStrategy: SelectionStrategy = {
  selectDay,
  setTime,
  clear,
  applyPreset,
};
