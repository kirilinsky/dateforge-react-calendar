import { type CalendarDate, compareDate, dateKey } from "../calendar-date";
import { type CalendarDateTime, calendarDateTime } from "../calendar-date-time";
import { MIDNIGHT } from "../calendar-time";
import { noChange, type ReduceResult } from "../effects";
import type { PresetResult } from "../preset-engine";
import type { SelectionContext, SelectionStrategy } from "../strategy";
import { invalid } from "../validation";
import { commitPoint, rejected, validateDay } from "./shared";

/**
 * Multiple discrete dates (point shape, many). Clicking a free valid day adds
 * it; clicking a selected day removes it (toggle). `maxDates` caps the set —
 * adding past the cap is rejected, not silently dropped. Stored sorted by day
 * and de-duplicated, so the emitted value is deterministic.
 */

function sortedByDay(dates: CalendarDateTime[]): CalendarDateTime[] {
  return [...dates].sort((a, b) => compareDate(a.date, b.date));
}

function indexOfDay(
  dates: readonly CalendarDateTime[],
  date: CalendarDate,
): number {
  const k = dateKey(date);
  return dates.findIndex((d) => dateKey(d.date) === k);
}

function timeForNewDay(ctx: SelectionContext) {
  return ctx.config.withTime ? ctx.config.defaultTime : MIDNIGHT;
}

function selectDay(ctx: SelectionContext, date: CalendarDate): ReduceResult {
  const sel = ctx.state.selection;
  if (sel.shape !== "point") return noChange(ctx.state);

  const existing = indexOfDay(sel.dates, date);
  if (existing !== -1) {
    // Toggle off — removal is always allowed, even for disabled/out-of-range
    // days that became invalid after selection.
    const next = sel.dates.filter((_, i) => i !== existing);
    return commitPoint(ctx.state, next);
  }

  const rejection = validateDay(date, ctx.config);
  if (rejection) return rejected(ctx.state, rejection);

  const { maxDates } = ctx.config;
  if (maxDates !== undefined && sel.dates.length >= maxDates) {
    return rejected(ctx.state, invalid("max-dates-reached"));
  }

  const value = calendarDateTime(date, timeForNewDay(ctx));
  return commitPoint(ctx.state, sortedByDay([...sel.dates, value]));
}

function removeDate(ctx: SelectionContext, date: CalendarDate): ReduceResult {
  const sel = ctx.state.selection;
  if (sel.shape !== "point") return noChange(ctx.state);
  const idx = indexOfDay(sel.dates, date);
  if (idx === -1) return noChange(ctx.state);
  return commitPoint(
    ctx.state,
    sel.dates.filter((_, i) => i !== idx),
  );
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
  if (preset.kind === "date") return selectDay(ctx, preset.date);
  if (preset.kind !== "dates") return noChange(ctx.state);

  // Replace with the valid, capped, sorted set of preset days.
  const { maxDates, withTime, defaultTime } = ctx.config;
  const time = withTime ? defaultTime : MIDNIGHT;
  const seen = new Set<number>();
  const picked: CalendarDateTime[] = [];
  for (const d of preset.dates) {
    if (validateDay(d, ctx.config)) continue;
    const k = dateKey(d);
    if (seen.has(k)) continue;
    if (maxDates !== undefined && picked.length >= maxDates) break;
    seen.add(k);
    picked.push(calendarDateTime(d, time));
  }
  return commitPoint(ctx.state, sortedByDay(picked));
}

function setTime(ctx: SelectionContext): ReduceResult {
  // Multiple has no single active target for a time edit; per-date time editing
  // is a module concern, not a blanket strategy action.
  return noChange(ctx.state);
}

export const multipleStrategy: SelectionStrategy = {
  selectDay,
  setTime,
  clear,
  applyPreset,
  removeDate,
};
