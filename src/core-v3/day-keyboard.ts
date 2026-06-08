import { addDays, addMonths, type CalendarDate } from "./calendar-date";
import { weekStart } from "./calendar-range";

/**
 * Pure keyboard mapping for grid navigation — given the focused day and the
 * pressed key, what should happen. Kept in core so the rules (arrows step a
 * day/week, Page steps a month, Home/End jump within the week, Enter/Space
 * commit) are testable without React, and the module only wires DOM focus.
 *
 * Returns `null` for keys the grid doesn't handle, so the caller leaves the
 * event alone.
 */
export type DayKeyResult =
  | { kind: "move"; date: CalendarDate }
  | { kind: "select" };

export function dayKeyboardTarget(
  key: string,
  base: CalendarDate,
  firstDayOfWeek: number,
): DayKeyResult | null {
  switch (key) {
    case "ArrowLeft":
      return { kind: "move", date: addDays(base, -1) };
    case "ArrowRight":
      return { kind: "move", date: addDays(base, 1) };
    case "ArrowUp":
      return { kind: "move", date: addDays(base, -7) };
    case "ArrowDown":
      return { kind: "move", date: addDays(base, 7) };
    case "Home":
      return { kind: "move", date: weekStart(base, firstDayOfWeek) };
    case "End":
      return {
        kind: "move",
        date: addDays(weekStart(base, firstDayOfWeek), 6),
      };
    case "PageUp":
      return { kind: "move", date: addMonths(base, -1) };
    case "PageDown":
      return { kind: "move", date: addMonths(base, 1) };
    case "Enter":
    case " ":
    case "Spacebar": // legacy key name
      return { kind: "select" };
    default:
      return null;
  }
}
