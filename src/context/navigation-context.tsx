import { createContext, useContext } from "react";

export interface CalendarNavigation {
  viewDate: Date;
  navigateTo: (date: Date) => void;
}

export const NavigationContext = createContext<CalendarNavigation | undefined>(
  undefined,
);

export const useNavigation = (): CalendarNavigation => {
  const ctx = useContext(NavigationContext);
  if (process.env.NODE_ENV !== "production" && !ctx)
    throw new Error("useNavigation must be used within CalendarProvider");
  return ctx as CalendarNavigation;
};
