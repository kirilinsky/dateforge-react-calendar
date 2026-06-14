import type { CalendarDate } from "./calendar-date";
import type { SelectionState } from "./state";

/**
 * The date of a span bound (`"from"`/`"to"`) — the first range's start/end.
 * `undefined` when there is no bound to edit yet (point shape, no `bound` prop,
 * or an empty span). Modules read this to DISPLAY a bound, then commit edits via
 * the `setBoundDate`/`setTime(…, bound)` actions — the core strategy owns all
 * the ordering/clamping (modules never re-implement it).
 */
export function boundDateOf(
  selection: SelectionState,
  bound: "from" | "to" | undefined,
): CalendarDate | undefined {
  if (!bound || selection.shape !== "span" || selection.ranges.length === 0) {
    return undefined;
  }
  const range = selection.ranges[0];
  return bound === "to" ? range.end : range.start;
}
