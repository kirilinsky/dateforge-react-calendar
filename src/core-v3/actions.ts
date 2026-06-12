import type { CalendarDate } from "./calendar-date";
import type { CalendarTime } from "./calendar-time";
import type { PresetResult } from "./preset-engine";
import type { SelectionState } from "./state";

/**
 * Every way state can change. A flat, serializable discriminated union — no
 * hidden mode branches. The reducer routes most of these through the active
 * selection strategy; `navigate*` and the ephemeral `hover`/`focus` are handled
 * directly.
 */
export type CalendarAction =
  /** Pick a day (the meaning depends on unit × mode, decided by the strategy). */
  | { type: "selectDay"; date: CalendarDate }
  /** Edit time of the active selection or a range bound. */
  | { type: "setTime"; time: CalendarTime; bound?: "from" | "to" }
  /** Edit the date of one bound of a span selection (manual input, wheels). */
  | { type: "setBoundDate"; date: CalendarDate; bound: "from" | "to" }
  /** Move the view anchor to an explicit date. */
  | { type: "navigateTo"; date: CalendarDate }
  /** Step the view by whole months/years (prev/next controls). */
  | { type: "navigateBy"; step: "month" | "year"; amount: number }
  /** Hover preview target (range drawing). `undefined` clears it. */
  | { type: "hover"; date?: CalendarDate }
  /** Roving focus target. `undefined` clears it. */
  | { type: "focus"; date?: CalendarDate }
  /** Clear the whole selection. */
  | { type: "clear" }
  /** Apply a resolved preset value through the strategy. */
  | { type: "applyPreset"; result: PresetResult }
  /** Remove one point selection (multiple mode). */
  | { type: "removeDate"; date: CalendarDate }
  /** Remove one logical span by index (multi-range mode). */
  | { type: "removeRange"; index: number }
  /**
   * Replace the selection from a controlled `value` change. Updates state (so
   * subscribers re-render) but emits NO `notify` — the new value came from the
   * host, echoing `onChange` would loop.
   */
  | { type: "syncExternal"; selection: SelectionState };

export type CalendarActionType = CalendarAction["type"];
