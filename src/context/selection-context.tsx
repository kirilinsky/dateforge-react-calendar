import { createContext, useContext } from "react";

export interface SelectionState {
  selectedDate: Date | null;
  selectedDates: Date[];
  rangeStart: Date | null;
  rangeEnd: Date | null;
}

export interface SelectionActions {
  setHoverDate: (date: Date | null) => void;
  onChangeDate: (date: Date | null, options?: { keepView?: boolean }) => void;
  onDatesSet: (dates: Date[]) => void;
  onRangeSet: (from: Date | null, to: Date | null) => void;
  onRangeBoundSet: (bound: "from" | "to", date: Date | null) => boolean;
  onChangeTime: (date: Date) => boolean;
}

export interface SelectionHover {
  hoverDate: Date | null;
}

export type CalendarSelection = SelectionState &
  SelectionActions &
  SelectionHover;

export const SelectionStateContext = createContext<SelectionState | undefined>(
  undefined,
);
export const SelectionActionsContext = createContext<
  SelectionActions | undefined
>(undefined);
export const SelectionHoverContext = createContext<SelectionHover | undefined>(
  undefined,
);

const DEV_MSG = "must be used within CalendarProvider";

export const useSelectionValue = (): SelectionState => {
  const ctx = useContext(SelectionStateContext);
  if (process.env.NODE_ENV !== "production" && !ctx)
    throw new Error(`useSelectionValue ${DEV_MSG}`);
  return ctx as SelectionState;
};

export const useSelectionActions = (): SelectionActions => {
  const ctx = useContext(SelectionActionsContext);
  if (process.env.NODE_ENV !== "production" && !ctx)
    throw new Error(`useSelectionActions ${DEV_MSG}`);
  return ctx as SelectionActions;
};

export const useSelectionHover = (): SelectionHover => {
  const ctx = useContext(SelectionHoverContext);
  if (process.env.NODE_ENV !== "production" && !ctx)
    throw new Error(`useSelectionHover ${DEV_MSG}`);
  return ctx as SelectionHover;
};

export const useSelection = (): CalendarSelection => ({
  ...useSelectionValue(),
  ...useSelectionActions(),
  ...useSelectionHover(),
});
