import { createContext, useContext } from "react";
import { DisabledRule, StartOfWeek } from "@/types/calendar";

export interface CalendarConfig {
  locale: string;
  startOfWeek: StartOfWeek;
  hour12: boolean;
  range: boolean;
  multiselect: number | boolean | undefined;
  rangeMinDays?: number;
  rangeMaxDays?: number;
  minDate?: Date;
  maxDate?: Date;
  disabled?: DisabledRule | DisabledRule[];
  time: boolean;
  months: boolean;
  compactMonths: boolean;
  compactYears: boolean;
  showYearPicker: boolean;
  gradient: boolean;
  highlightWeekends: boolean;
  highlightToday: boolean;
  showWeekNumber: boolean;
  hideWeekdays: boolean;
  hideLimited: boolean;
  hideDisabled: boolean;
  twoMonthsLayout: boolean;
  monthsColumn: boolean;
  showHomeButton: boolean;
  showClearButton: boolean;
  showThemeToggle: boolean;
}

export const ConfigContext = createContext<CalendarConfig | undefined>(undefined);

export const useConfig = (): CalendarConfig => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be used within CalendarProvider");
  return ctx;
};
