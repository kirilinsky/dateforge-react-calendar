import { createContext, useContext } from "react";
import { DisabledRule } from "@/types/calendar";

export interface CalendarConfig {
  locale: string;
  hour12: boolean;
  range: boolean;
  multiselect: number | boolean | undefined;
  rangeMinDays?: number;
  rangeMaxDays?: number;
  minDate?: Date;
  maxDate?: Date;
  disabled?: DisabledRule | DisabledRule[];
  gradient: boolean;
  twoMonthsLayout: boolean;
  monthsColumn: boolean;
}

export const ConfigContext = createContext<CalendarConfig | undefined>(undefined);

export const useConfig = (): CalendarConfig => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be used within CalendarProvider");
  return ctx;
};
