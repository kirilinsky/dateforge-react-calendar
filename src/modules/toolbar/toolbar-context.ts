import { createContext, useContext } from "react";
import { warnOnce } from "@/core/dev-warn";

export interface ToolbarContextValue {
  bound: "from" | "to" | undefined;
  offset: number;
  date: Date;
  isBound: boolean;
  boundDate: Date | null;
  setLocalView: (date: Date) => void;
  timePopupOpen: boolean;
  monthPopupOpen: boolean;
  yearPopupOpen: boolean;
  setTimePopupOpen: (v: boolean) => void;
  setMonthPopupOpen: (v: boolean) => void;
  setYearPopupOpen: (v: boolean) => void;
}

export const ToolbarContext = createContext<ToolbarContextValue | null>(null);

export const useToolbarContext = (): ToolbarContextValue | null => {
  const ctx = useContext(ToolbarContext);
  if (!ctx) {
    warnOnce(
      "toolbar:no-context",
      "<CalendarToolbarXxx> must be used inside <CalendarToolbar>",
    );
    return null;
  }
  return ctx;
};
