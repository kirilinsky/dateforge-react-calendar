import { useRef, useSyncExternalStore } from "react";
import type { CalendarState } from "../core/state";
import type { CalendarStore } from "./store";

/**
 * Subscribe to a narrow slice of the store and re-render only when that slice
 * changes. This is the lever behind the calendar's per-cell performance: a day
 * cell selects its own `dayFlags` (a number), so `Object.is` bails out and the
 * cell skips rendering unless its own bitmask moved — hover over one cell wakes
 * two or three neighbours, not all 42 × N.
 *
 * Zero-dep equivalent of `useSyncExternalStoreWithSelector`: the snapshot is
 * stabilized through a ref so an equal selection returns the previous reference
 * (no tearing, no render loop when a selector builds a fresh object).
 */
export function useStoreSelector<T>(
  store: CalendarStore,
  selector: (state: CalendarState) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  const last = useRef<{ value: T } | null>(null);

  const getSnapshot = (): T => {
    const next = selector(store.getState());
    const prev = last.current;
    if (prev && isEqual(prev.value, next)) return prev.value;
    last.current = { value: next };
    return next;
  };

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}
