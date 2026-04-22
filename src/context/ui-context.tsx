import { createContext, useContext } from "react";

export interface CalendarUI {
  dark: boolean;
  toggleTheme: () => void;
  containerWidth: number;
  showTimePopup: boolean;
  setShowTimePopup: (v: boolean) => void;
  showMonthPopup: boolean;
  setShowMonthPopup: (v: boolean) => void;
  showYearPopup: boolean;
  setShowYearPopup: (v: boolean) => void;
  daysTrackActive: boolean;
  setDaysTrackActive: (v: boolean) => void;
}

export const UIContext = createContext<CalendarUI | undefined>(undefined);

export const useUI = (): CalendarUI => {
  const ctx = useContext(UIContext);
  if (process.env.NODE_ENV !== "production" && !ctx) throw new Error("useUI must be used within CalendarProvider");
  return ctx as CalendarUI;
};
