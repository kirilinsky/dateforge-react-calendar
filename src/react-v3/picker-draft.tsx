import { createContext, useContext } from "react";
import type { CalendarDate } from "../core-v3/calendar-date";
import type { CalendarTime } from "../core-v3/calendar-time";

/**
 * Staging channel for a picker rendered inside a toolbar trigger popup.
 *
 * Standalone, a wheel/grid picker commits straight to the store as it settles
 * (the view follows every spin). Inside a trigger popup that has a Confirm
 * button, that is jarring — the calendar lurches around while you are still
 * choosing. When this context is present the picker reads/writes the staged
 * `date` instead of the store; the trigger applies it to the real view only on
 * Confirm (and discards it on dismiss). Absent context = the live behavior.
 */
export type PickerDraft = {
  /** The staged view date the picker should display and mutate. */
  date: CalendarDate;
  /** Stage a new date (does NOT touch the store until the trigger confirms). */
  setDate: (date: CalendarDate) => void;
};

const PickerDraftContext = createContext<PickerDraft | null>(null);

export const PickerDraftProvider = PickerDraftContext.Provider;

/** Non-null only inside a confirm-staged trigger popup. */
export function usePickerDraft(): PickerDraft | null {
  return useContext(PickerDraftContext);
}

/**
 * Same idea for TIME: a TimeWheel inside a confirm-staged time popup writes the
 * staged time here instead of committing to the selection via `setTime`. The
 * trigger applies it on Confirm and discards it on dismiss.
 */
export type TimePickerDraft = {
  time: CalendarTime;
  setTime: (time: CalendarTime) => void;
};

const TimePickerDraftContext = createContext<TimePickerDraft | null>(null);

export const TimePickerDraftProvider = TimePickerDraftContext.Provider;

/** Non-null only inside a confirm-staged time trigger popup. */
export function useTimePickerDraft(): TimePickerDraft | null {
  return useContext(TimePickerDraftContext);
}
