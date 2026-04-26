import {
  ReactNode,
  useReducer,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useCallback,
  useState,
} from "react";
import {
  CalendarMode,
  CalendarProps,
  CalendarValue,
  DateRange,
} from "@/types/calendar";
import {
  calendarReducer,
  buildInitialState,
  toValidDate,
  SelectConfig,
} from "@/core/state";
import { isSameDay } from "@/utils/date-core";
import { validateCalendarValue, validateMinMax } from "@/core/dev-warn";
import { ConfigContext, CalendarConfig } from "@/context/config-context";
import { NavigationContext } from "@/context/navigation-context";
import {
  SelectionStateContext,
  SelectionActionsContext,
  SelectionHoverContext,
} from "@/context/selection-context";
import { UIContext } from "@/context/ui-context";

const isDateRange = (v: unknown): v is import("@/types/calendar").DateRange =>
  v !== null &&
  typeof v === "object" &&
  !Array.isArray(v) &&
  !(v instanceof Date) &&
  "from" in (v as object);

function serializeDate(d: Date | null | undefined): number {
  return d ? d.getTime() : 0;
}

function serializeValue(
  v: DateRange | Date[] | Date | null | undefined,
): string {
  if (v == null) return "null";
  if (v instanceof Date) return String(v.getTime());
  if (Array.isArray(v)) return v.map((d) => d.getTime()).join(",");
  return `${serializeDate(v.from)},${serializeDate(v.to)}`;
}

export function CalendarProvider<M extends CalendarMode = "single">({
  children,
  toggleTheme,
  value: externalValue,
  defaultValue,
  mode = "single" as M,
  maxDates,
  onChange,
  minRangeDays,
  maxRangeDays,
  containerWidth = 0,
  locale,
  hour12,
  gradient,
  minDate,
  maxDate,
  disabled,
  timeZone,
  readOnly = false,
}: CalendarProps<M> & {
  children: ReactNode;
  containerWidth?: number;
  toggleTheme?: () => void;
}) {
  const range = mode === "range";
  const multiselect: number | boolean | undefined =
    mode === "multiple" ? (maxDates ?? true) : undefined;

  const selectConfig = useMemo<SelectConfig>(
    () => ({ range, multiselect, minRangeDays, maxRangeDays, minDate, maxDate, disabled }),
    [range, multiselect, minRangeDays, maxRangeDays, minDate, maxDate, disabled],
  );

  const isControlled = externalValue !== undefined;
  const seedValue = isControlled ? externalValue : defaultValue;
  const [state, dispatch] = useReducer(calendarReducer, undefined, () => {
    validateCalendarValue(
      seedValue,
      mode,
      isControlled ? "value" : "defaultValue",
    );
    validateMinMax(minDate, maxDate);
    return buildInitialState({ externalValue: seedValue ?? undefined, range });
  });

  const onChangeRef = useRef<((v: CalendarValue<M>) => void) | undefined>(
    onChange,
  );
  useLayoutEffect(() => {
    onChangeRef.current = onChange;
  });

  const externalKey = serializeValue(
    externalValue as DateRange | Date[] | Date | null | undefined,
  );
  useEffect(() => {
    if (!isControlled) return;
    validateCalendarValue(externalValue, mode, "value");
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
      const nextDates = externalDates.map(toValidDate);
      const keepView = nextDates.some((d) => isSameDay(d, state.viewDate));
      dispatch({
        type: "SYNC_EXTERNAL",
        viewDate: keepView
          ? state.viewDate
          : (nextDates[nextDates.length - 1] ?? state.viewDate),
        selectedDates: nextDates,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalKey]);

  const lastNotifySeqRef = useRef(0);
  useEffect(() => {
    if (state.notifySeq === lastNotifySeqRef.current) return;
    lastNotifySeqRef.current = state.notifySeq;
    const value: DateRange | Date[] | Date | null = range
      ? { from: state.rangeStart, to: state.rangeEnd }
      : multiselect
        ? state.selectedDates
        : (state.selectedDates[0] ?? null);
    onChangeRef.current?.(value as CalendarValue<M>);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.notifySeq]);

  const handleChangeDate = useCallback(
    (d: Date | null) => {
      if (readOnly) return;
      dispatch({ type: "SELECT", date: d, config: selectConfig });
    },
    [selectConfig, readOnly],
  );

  const handleChangeTime = useCallback(
    (d: Date) => {
      if (readOnly) return;
      dispatch({ type: "CHANGE_TIME", date: d, config: selectConfig });
    },
    [readOnly, selectConfig],
  );

  const handleDatesSet = useCallback(
    (dates: Date[]) => {
      if (readOnly) return;
      dispatch({ type: "SET_DATES", dates });
    },
    [readOnly],
  );

  const handleRangeSet = useCallback(
    (from: Date | null, to: Date | null) => {
      if (readOnly) return;
      dispatch({ type: "SET_RANGE", from, to });
    },
    [readOnly],
  );

  const handleRangeBoundSet = useCallback(
    (bound: "from" | "to", date: Date | null) => {
      if (readOnly) return;
      dispatch({ type: "SET_RANGE_BOUND", bound, date });
    },
    [readOnly],
  );

  const navigateTo = useCallback((d: Date) => {
    dispatch({ type: "NAVIGATE", date: d });
  }, []);

  useEffect(() => {
    validateMinMax(minDate, maxDate);
  }, [minDate, maxDate]);

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
  const rangeStartT = state.rangeStart?.getTime() ?? null;
  const rangeEndT = state.rangeEnd?.getTime() ?? null;
  const contextSelectedDates = useMemo(
    () =>
      range
        ? ([state.rangeStart, state.rangeEnd].filter(Boolean) as Date[])
        : state.selectedDates,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [range, rangeStartT, rangeEndT, state.selectedDates],
  );

  const config = useMemo<CalendarConfig>(
    () => ({
      locale: locale ?? "en",
      hour12: hour12 ?? false,
      range,
      multiselect,
      minRangeDays,
      maxRangeDays,
      minDate,
      maxDate,
      disabled,
      gradient: gradient ?? false,
      timeZone,
      readOnly,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      locale,
      hour12,
      range,
      multiselect,
      minRangeDays,
      maxRangeDays,
      minDate,
      maxDate,
      disabled,
      gradient,
      timeZone,
      readOnly,
    ],
  );

  const navigation = useMemo(
    () => ({ viewDate: state.viewDate, navigateTo }),
    [state.viewDate, navigateTo],
  );

  const selectionState = useMemo(
    () => ({
      selectedDate,
      selectedDates: contextSelectedDates,
      rangeStart: state.rangeStart,
      rangeEnd: state.rangeEnd,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDate, contextSelectedDates, state.rangeStart, state.rangeEnd],
  );

  const selectionActions = useMemo(
    () => ({
      setHoverDate,
      onChangeDate: handleChangeDate,
      onDatesSet: handleDatesSet,
      onRangeSet: handleRangeSet,
      onRangeBoundSet: handleRangeBoundSet,
      onChangeTime: handleChangeTime,
    }),
    [
      setHoverDate,
      handleChangeDate,
      handleDatesSet,
      handleRangeSet,
      handleRangeBoundSet,
      handleChangeTime,
    ],
  );

  const selectionHover = useMemo(
    () => ({ hoverDate: state.hoverDate }),
    [state.hoverDate],
  );

  const [daysTrackActive, setDaysTrackActive] = useState(false);
  const [popupAnchorEl, setPopupAnchorEl] = useState<HTMLElement | null>(null);
  const [navShowSeconds, setNavShowSeconds] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const ui = useMemo(
    () => ({
      toggleTheme: toggleTheme ?? (() => {}),
      containerWidth,
      containerRef,
      showTimePopup: state.openPopup === "time",
      setShowTimePopup,
      showMonthPopup: state.openPopup === "month",
      setShowMonthPopup,
      showYearPopup: state.openPopup === "year",
      setShowYearPopup,
      daysTrackActive,
      setDaysTrackActive,
      popupAnchorEl,
      setPopupAnchorEl,
      navShowSeconds,
      setNavShowSeconds,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      toggleTheme,
      containerWidth,
      state.openPopup,
      daysTrackActive,
      popupAnchorEl,
      navShowSeconds,
    ],
  );

  return (
    <ConfigContext.Provider value={config}>
      <NavigationContext.Provider value={navigation}>
        <SelectionStateContext.Provider value={selectionState}>
          <SelectionActionsContext.Provider value={selectionActions}>
            <SelectionHoverContext.Provider value={selectionHover}>
              <UIContext.Provider value={ui}>{children}</UIContext.Provider>
            </SelectionHoverContext.Provider>
          </SelectionActionsContext.Provider>
        </SelectionStateContext.Provider>
      </NavigationContext.Provider>
    </ConfigContext.Provider>
  );
}
