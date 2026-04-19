import { createContext, useContext } from "react";

export interface CalendarSelection {
  selectedDate: Date | null;
  selectedDates: Date[];
  rangeStart: Date | null;
  rangeEnd: Date | null;
  hoverDate: Date | null;
  setHoverDate: (date: Date | null) => void;
  onChangeDate: (date: Date | null) => void;
  onDatesSet: (dates: Date[]) => void;
  onRangeSet: (from: Date | null, to: Date | null) => void;
  onChangeTime: (date: Date) => void;
}

export const SelectionContext = createContext<CalendarSelection | undefined>(undefined);

export const useSelection = (): CalendarSelection => {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useSelection must be used within CalendarProvider");
  return ctx;
};
