import type { CalendarAction } from "../core-v3/actions";
import type { CalendarEffect } from "../core-v3/effects";
import { reduce } from "../core-v3/reducer";
import type { CalendarConfig, CalendarState } from "../core-v3/state";

/**
 * Framework-agnostic selection store — the bridge between the pure reducer and
 * `useSyncExternalStore`. It owns the current state, fans out change
 * notifications, and routes the reducer's effects to a sink (the React adapter
 * turns those into `onChange`, focus, aria-live, etc.).
 *
 * Two deliberate rules:
 * - **State identity is the change signal.** `reduce` returns the *same* state
 *   reference on a no-op (hover over the same cell, rejected click), so we only
 *   notify subscribers when the reference actually changes. Selector hooks built
 *   on top can then bail out cheaply.
 * - **Effects always flow, even on a no-op.** A rejected action keeps state
 *   identical but still emits `validationRejected`; subscribers stay quiet while
 *   the sink still sees the effect.
 */
export type EffectSink = (effect: CalendarEffect, state: CalendarState) => void;
export type StoreListener = () => void;

export type CalendarStore = {
  /** Current state. Stable reference until a real change — safe as a snapshot. */
  getState(): CalendarState;
  /** The static compiled config this store reduces against. */
  getConfig(): CalendarConfig;
  /** Subscribe to state changes. Returns an unsubscribe function. */
  subscribe(listener: StoreListener): () => void;
  /** Run an action through the reducer, notify on change, drain effects. */
  dispatch(action: CalendarAction): void;
};

export function createCalendarStore(
  config: CalendarConfig,
  initial: CalendarState,
  onEffect?: EffectSink,
): CalendarStore {
  let state = initial;
  const listeners = new Set<StoreListener>();

  return {
    getState: () => state,
    getConfig: () => config,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispatch(action) {
      const { state: next, effects } = reduce(state, action, config);
      if (next !== state) {
        state = next;
        for (const listener of listeners) listener();
      }
      if (onEffect) {
        for (const effect of effects) onEffect(effect, state);
      }
    },
  };
}
