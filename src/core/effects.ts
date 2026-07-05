import type { CalendarDate } from "./calendar-date";
import type { LabelKey, LabelParams } from "./labels";
import type { CalendarState, SelectionState } from "./state";
import type { ValidationResult } from "./validation";
import type { WarningId } from "./warnings";

/**
 * Side effects a transition requests, as plain data. The reducer never performs
 * effects itself (no user callbacks, no DOM, no console) — it returns them and
 * the React adapter interprets them. This makes controlled/uncontrolled
 * behavior, focus, announcements, and validation all inspectable and testable.
 *
 * Effects are reports, not commands to re-dispatch: e.g. `viewChanged` tells the
 * adapter the view moved; the adapter must NOT answer it with another navigate.
 */
export type CalendarEffect =
  /** The committed selection changed — adapter emits `onChange` (converts to public value). */
  | { type: "notify"; selection: SelectionState }
  /** The view anchor moved — adapter may sync controlled view / scroll. */
  | { type: "viewChanged"; viewDate: CalendarDate }
  /** Request focus on a day cell. */
  | { type: "focus"; date: CalendarDate }
  /** Announce via aria-live (adapter resolves the label). */
  | { type: "announce"; messageKey: LabelKey; params?: LabelParams }
  /** A transient action was rejected (disabled click, cap reached, …). */
  | { type: "validationRejected"; result: ValidationResult }
  /** Dev warning to route through the warning registry. */
  | { type: "warn"; id: WarningId; message: string }
  /** Drop the hover preview. */
  | { type: "clearHover" };

export type ReduceResult = {
  state: CalendarState;
  effects: readonly CalendarEffect[];
};

/** Shared empty effect list — reused so hot paths (hover) allocate nothing. */
export const NO_EFFECTS: readonly CalendarEffect[] = Object.freeze([]);

/** Build a result. Defaults to no effects. */
export function result(
  state: CalendarState,
  effects: readonly CalendarEffect[] = NO_EFFECTS,
): ReduceResult {
  return { state, effects };
}

/** Result with the same state and no effects (a no-op transition). */
export function noChange(state: CalendarState): ReduceResult {
  return { state, effects: NO_EFFECTS };
}
