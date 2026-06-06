import type { CalendarDate } from "./calendar-date";
import type { CalendarTime } from "./calendar-time";
import type { ReduceResult } from "./effects";
import type { PresetResult } from "./preset-engine";
import type { CalendarConfig, CalendarState } from "./state";

/**
 * What a strategy sees: the current state plus the compiled, static config.
 * Strategies are pure — given context + input, return the next state and the
 * effects to run. They never touch React, the DOM, or user callbacks.
 */
export type SelectionContext = {
  state: CalendarState;
  config: CalendarConfig;
};

/**
 * A selection mode's behavior. The reducer routes selection-mutating actions
 * here, so invariants (disabled never commits, start ≤ end, span limits,
 * caps, readOnly) live in ONE place per mode instead of being re-checked in
 * every visual module.
 */
export type SelectionStrategy = {
  selectDay(ctx: SelectionContext, date: CalendarDate): ReduceResult;
  setTime(
    ctx: SelectionContext,
    time: CalendarTime,
    bound?: "from" | "to",
  ): ReduceResult;
  clear(ctx: SelectionContext): ReduceResult;
  applyPreset(ctx: SelectionContext, preset: PresetResult): ReduceResult;
  /** Multiple mode: drop one point. Optional — defaults to no-op. */
  removeDate?(ctx: SelectionContext, date: CalendarDate): ReduceResult;
  /** Multi-range mode: drop one span by index. Optional — defaults to no-op. */
  removeRange?(ctx: SelectionContext, index: number): ReduceResult;
};
