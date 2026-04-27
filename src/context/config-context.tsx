import { createContext, useContext } from "react";
import type { DisabledConfig } from "@/types/calendar";

export interface CalendarConfig {
  locale: string;
  hour12: boolean;
  range: boolean;
  multiselect: number | boolean | undefined;
  minRangeDays?: number;
  maxRangeDays?: number;
  minDate?: Date;
  maxDate?: Date;
  disabled?: DisabledConfig;
  gradient: boolean;
  timeZone?: string;
  readOnly: boolean;
}

export const ConfigContext = createContext<CalendarConfig | undefined>(
  undefined,
);

export const useConfig = (): CalendarConfig => {
  const ctx = useContext(ConfigContext);
  if (process.env.NODE_ENV !== "production" && !ctx)
    throw new Error("useConfig must be used within CalendarProvider");
  return ctx as CalendarConfig;
};
