import type { CalendarAction } from "./actions";
import {
  addMonths,
  addYears,
  type CalendarDate,
  datesEqual,
} from "./calendar-date";
import { noChange, type ReduceResult, result } from "./effects";
import type { CalendarConfig, CalendarState } from "./state";
import { resolveStrategy } from "./strategies";
import { invalid } from "./validation";

/**
 * The one pure transition function: `(state, action, config) -> { state,
 * effects }`. No React, no DOM, no user callbacks, no hidden `notifySeq`.
 *
 * Navigation, hover, and focus are handled directly here; everything that
 * mutates the selection is routed through the active strategy so mode
 * invariants live in one place. Unchanged slices keep their identity (the
 * helpers below return the same state reference on a no-op) so selector-based
 * subscriptions don't fire needlessly.
 */
export function reduce(
  state: CalendarState,
  action: CalendarAction,
  config: CalendarConfig,
): ReduceResult {
  switch (action.type) {
    case "navigateTo":
      return navigate(state, action.date);

    case "navigateBy": {
      const { viewDate } = state.view;
      const next =
        action.step === "month"
          ? addMonths(viewDate, action.amount)
          : addYears(viewDate, action.amount);
      return navigate(state, next);
    }

    case "hover":
      return setHover(state, action.date);

    case "focus":
      return setFocus(state, action.date);

    case "syncExternal":
      // Controlled value changed: swap the selection, no notify (host-driven).
      return noChange({ ...state, selection: action.selection });

    case "selectDay":
    case "setTime":
    case "clear":
    case "applyPreset":
    case "removeDate":
    case "removeRange":
      return mutateSelection(state, action, config);
  }
}

// --- direct handlers (structural sharing: same ref on no-op) ---

function navigate(state: CalendarState, date: CalendarDate): ReduceResult {
  if (datesEqual(state.view.viewDate, date)) return noChange(state);
  const next: CalendarState = { ...state, view: { viewDate: date } };
  return result(next, [{ type: "viewChanged", viewDate: date }]);
}

function sameDate(a?: CalendarDate, b?: CalendarDate): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return datesEqual(a, b);
}

function setHover(state: CalendarState, date?: CalendarDate): ReduceResult {
  // Hottest path (mousemove over cells) — no effects, no allocation on no-op.
  if (sameDate(state.interaction.hoverDate, date)) return noChange(state);
  return noChange({
    ...state,
    interaction: { ...state.interaction, hoverDate: date },
  });
}

function setFocus(state: CalendarState, date?: CalendarDate): ReduceResult {
  if (sameDate(state.interaction.focusDate, date)) return noChange(state);
  return noChange({
    ...state,
    interaction: { ...state.interaction, focusDate: date },
  });
}

// --- selection routing ---

function mutateSelection(
  state: CalendarState,
  action: Extract<
    CalendarAction,
    {
      type:
        | "selectDay"
        | "setTime"
        | "clear"
        | "applyPreset"
        | "removeDate"
        | "removeRange";
    }
  >,
  config: CalendarConfig,
): ReduceResult {
  if (config.readOnly) {
    return result(state, [
      { type: "validationRejected", result: invalid("read-only") },
    ]);
  }

  const strategy = resolveStrategy(config);
  const ctx = { state, config };

  switch (action.type) {
    case "selectDay":
      return strategy.selectDay(ctx, action.date);
    case "setTime":
      return strategy.setTime(ctx, action.time, action.bound);
    case "clear":
      return strategy.clear(ctx);
    case "applyPreset":
      return strategy.applyPreset(ctx, action.result);
    case "removeDate":
      return strategy.removeDate?.(ctx, action.date) ?? noChange(state);
    case "removeRange":
      return strategy.removeRange?.(ctx, action.index) ?? noChange(state);
  }
}
