import React, {
  ReactNode,
  useReducer,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { CalendarMode, CalendarProps, DateRange } from "@/types/calendar";
import {
  calendarReducer,
  buildInitialState,
  toValidDate,
  SelectConfig,
} from "@/core/state";
import { ConfigContext, CalendarConfig } from "@/context/config-context";
import { NavigationContext } from "@/context/navigation-context";
import { SelectionContext } from "@/context/selection-context";
import { UIContext } from "@/context/ui-context";

const isDateRange = (v: unknown): v is import("@/types/calendar").DateRange =>
  v !== null &&
  typeof v === "object" &&
  !Array.isArray(v) &&
  !(v instanceof Date) &&
  "from" in (v as object);

export const CalendarProvider: React.FC<
  CalendarProps<CalendarMode> & {
    children: ReactNode;
    containerWidth?: number;
    toggleTheme?: () => void;
    isDark?: boolean;
  }
> = ({
  children,
  toggleTheme,
  isDark,
  value: externalValue,
  mode = "single",
  max,
  onChange,
  startMonth,
  rangeMinDays,
  rangeMaxDays,
  containerWidth = 0,
  locale = "en",
  hour12 = false,
  gradient = false,
  minDate,
  maxDate,
  disabled,
}) => {
  const range = mode === "range";
  const multiselect: number | boolean | undefined =
    mode === "multiple" ? (max ?? true) : undefined;

  const selectConfig: SelectConfig = {
    range,
    multiselect,
    rangeMinDays,
    rangeMaxDays,
  };

  const [state, dispatch] = useReducer(calendarReducer, undefined, () =>
    buildInitialState({ externalValue: externalValue ?? undefined, startMonth, range }),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onChangeRef = useRef<((v: any) => void) | undefined>(onChange as any);
  onChangeRef.current = onChange as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  useEffect(() => {
    if (startMonth) {
      dispatch({ type: "NAVIGATE", date: toValidDate(startMonth) });
    }
  }, [startMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const externalRangeObj = isDateRange(externalValue)
      ? externalValue
      : undefined;
    const externalDates = Array.isArray(externalValue)
      ? externalValue
      : undefined;
    const externalSingle =
      externalValue instanceof Date
        ? externalValue
        : !externalRangeObj
          ? externalDates?.[0]
          : undefined;

    if (range) {
      const from = externalRangeObj?.from
        ? toValidDate(externalRangeObj.from)
        : externalDates?.[0]
          ? toValidDate(externalDates[0])
          : externalSingle
            ? toValidDate(externalSingle)
            : null;
      const to = externalRangeObj?.to
        ? toValidDate(externalRangeObj.to)
        : externalDates?.[1]
          ? toValidDate(externalDates[1])
          : null;
      dispatch({
        type: "SYNC_EXTERNAL",
        viewDate: from ?? state.viewDate,
        selectedDates: [],
        rangeStart: from,
        rangeEnd: to,
      });
    } else if (externalDates) {
      dispatch({
        type: "SYNC_EXTERNAL",
        viewDate: externalDates[0]
          ? toValidDate(externalDates[0])
          : state.viewDate,
        selectedDates: externalDates.map(toValidDate),
        rangeStart: null,
        rangeEnd: null,
      });
    } else {
      const parsed = externalSingle ? toValidDate(externalSingle) : null;
      dispatch({
        type: "SYNC_EXTERNAL",
        viewDate: parsed ?? state.viewDate,
        selectedDates: parsed ? [parsed] : [],
        rangeStart: null,
        rangeEnd: null,
      });
    }
  }, [externalValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const stateRef = useRef(state);
  stateRef.current = state;

  const handleChangeDate = useCallback(
    (d: Date | null) => {
      const action = { type: "SELECT" as const, date: d, config: selectConfig };
      const next = calendarReducer(stateRef.current, action);
      dispatch(action);

      if (range) {
        const rangeVal: DateRange = { from: next.rangeStart, to: next.rangeEnd };
        onChangeRef.current?.(rangeVal);
        return;
      }
      if (multiselect) {
        if (next.selectedDates !== stateRef.current.selectedDates) {
          onChangeRef.current?.(next.selectedDates);
        }
        return;
      }
      onChangeRef.current?.(next.selectedDates[0] ?? null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [range, multiselect, selectConfig],
  );

  const handleChangeTime = useCallback((d: Date) => {
    dispatch({ type: "CHANGE_TIME", date: d });
    onChangeRef.current?.(d);
  }, []);

  const handleDatesSet = useCallback((dates: Date[]) => {
    dispatch({ type: "SET_DATES", dates });
    onChangeRef.current?.(dates);
  }, []);

  const handleRangeSet = useCallback((from: Date | null, to: Date | null) => {
    dispatch({ type: "SET_RANGE", from, to });
    const rangeVal: DateRange = { from, to };
    onChangeRef.current?.(rangeVal);
  }, []);

  const navigateTo = useCallback((d: Date) => {
    dispatch({ type: "NAVIGATE", date: d });
  }, []);

  const setHoverDate = useCallback((d: Date | null) => {
    dispatch({ type: "HOVER", date: d });
  }, []);

  const setShowTimePopup = useCallback((v: boolean) => {
    dispatch(
      v ? { type: "OPEN_POPUP", popup: "time" } : { type: "CLOSE_POPUP" },
    );
  }, []);

  const setShowMonthPopup = useCallback((v: boolean) => {
    dispatch(
      v ? { type: "OPEN_POPUP", popup: "month" } : { type: "CLOSE_POPUP" },
    );
  }, []);

  const setShowYearPopup = useCallback((v: boolean) => {
    dispatch(
      v ? { type: "OPEN_POPUP", popup: "year" } : { type: "CLOSE_POPUP" },
    );
  }, []);

  const selectedDate = range
    ? state.rangeStart
    : (state.selectedDates[0] ?? null);
  const contextSelectedDates = range
    ? ([state.rangeStart, state.rangeEnd].filter(Boolean) as Date[])
    : state.selectedDates;

  const config = useMemo<CalendarConfig>(
    () => ({
      locale,
      hour12,
      range,
      multiselect,
      rangeMinDays,
      rangeMaxDays,
      minDate,
      maxDate,
      disabled,
      gradient,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      locale,
      hour12,
      range,
      multiselect,
      rangeMinDays,
      rangeMaxDays,
      minDate,
      maxDate,
      disabled,
      gradient,
    ],
  );

  const navigation = useMemo(
    () => ({ viewDate: state.viewDate, navigateTo }),
    [state.viewDate, navigateTo],
  );

  const selection = useMemo(
    () => ({
      selectedDate,
      selectedDates: contextSelectedDates,
      rangeStart: state.rangeStart,
      rangeEnd: state.rangeEnd,
      hoverDate: state.hoverDate,
      setHoverDate,
      onChangeDate: handleChangeDate,
      onDatesSet: handleDatesSet,
      onRangeSet: handleRangeSet,
      onChangeTime: handleChangeTime,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      selectedDate,
      contextSelectedDates,
      state.rangeStart,
      state.rangeEnd,
      state.hoverDate,
      handleChangeDate,
      handleDatesSet,
      handleRangeSet,
      handleChangeTime,
    ],
  );

  const ui = useMemo(
    () => ({
      dark: isDark ?? false,
      toggleTheme: toggleTheme ?? (() => {}),
      containerWidth,
      showTimePopup: state.openPopup === "time",
      setShowTimePopup,
      showMonthPopup: state.openPopup === "month",
      setShowMonthPopup,
      showYearPopup: state.openPopup === "year",
      setShowYearPopup,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDark, toggleTheme, containerWidth, state.openPopup],
  );

  return (
    <ConfigContext.Provider value={config}>
      <NavigationContext.Provider value={navigation}>
        <SelectionContext.Provider value={selection}>
          <UIContext.Provider value={ui}>{children}</UIContext.Provider>
        </SelectionContext.Provider>
      </NavigationContext.Provider>
    </ConfigContext.Provider>
  );
};
