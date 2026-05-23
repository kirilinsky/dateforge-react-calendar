import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  type CalendarConfig,
  type CalendarMotionNames,
  ConfigContext,
} from "@/context/config-context";
import { NavigationContext } from "@/context/navigation-context";
import {
  SelectionActionsContext,
  SelectionHoverContext,
  SelectionStateContext,
} from "@/context/selection-context";
import { UIContext } from "@/context/ui-context";
import {
  validateCalendarValue,
  validateDateProp,
  validateMinMax,
  validateTimeZone,
} from "@/core/dev-warn";
import {
  buildInitialState,
  calendarReducer,
  type SelectConfig,
  toValidDateOrNull,
} from "@/core/state";
import type {
  CalendarActionLabels,
  CalendarMode,
  CalendarMotion,
  CalendarProps,
  CalendarValue,
  DateRange,
} from "@/types/calendar";
import { isSameDay } from "@/utils/date-core";
import { runViewTransition } from "@/utils/view-transition";

const isDateRange = (v: unknown): v is import("@/types/calendar").DateRange =>
  v !== null &&
  typeof v === "object" &&
  !Array.isArray(v) &&
  !(v instanceof Date) &&
  "from" in (v as object);

const DEFAULT_MOTION_NAMES: CalendarMotionNames = {
  days: "cal-days",
  popup: "cal-popup",
};

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
  activeTheme = "auto",
  value: externalValue,
  defaultValue,
  defaultViewDate,
  mode = "single" as M,
  maxDates,
  onChange,
  minRangeDays,
  maxRangeDays,
  locale,
  hour12,
  gradient,
  minDate,
  maxDate,
  disabled,
  timeZone,
  readOnly = false,
  timeStep,
  actionLabels = {},
  motion = "none",
  motionNames = DEFAULT_MOTION_NAMES,
}: CalendarProps<M> & {
  children: ReactNode;
  toggleTheme?: () => void;
  activeTheme?: "light" | "dark" | "auto";
  actionLabels?: CalendarActionLabels;
  motion?: CalendarMotion;
  motionNames?: CalendarMotionNames;
}) {
  const range = mode === "range";
  const multiselect: number | boolean | undefined =
    mode === "multiple" ? (maxDates ?? true) : undefined;

  // Resolved timeZone — the value actually fed to ConfigContext.
  // - undefined / "auto" prop  → detected from Intl after mount (SSR-safe;
  //   first render uses no TZ to avoid hydration mismatch).
  // - explicit IANA / "UTC±N" → validated, used as-is. Invalid value falls
  //   back to detected TZ and emits a dev warning.
  const isAutoTZ = timeZone == null || timeZone === "auto";
  const [resolvedTimeZone, setResolvedTimeZone] = useState<string | undefined>(
    isAutoTZ ? undefined : validateTimeZone(timeZone) ? timeZone : undefined,
  );
  useEffect(() => {
    if (!isAutoTZ && validateTimeZone(timeZone)) {
      setResolvedTimeZone(timeZone);
      return;
    }
    if (typeof Intl !== "undefined") {
      try {
        setResolvedTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
      } catch {
        setResolvedTimeZone(undefined);
      }
    }
  }, [timeZone, isAutoTZ]);

  const selectConfig = useMemo<SelectConfig>(
    () => ({
      range,
      multiselect,
      minRangeDays,
      maxRangeDays,
      minDate,
      maxDate,
      disabled,
    }),
    [
      range,
      multiselect,
      minRangeDays,
      maxRangeDays,
      minDate,
      maxDate,
      disabled,
    ],
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
    return buildInitialState({
      externalValue: seedValue ?? undefined,
      defaultViewDate: validateDateProp(defaultViewDate, "defaultViewDate"),
      range,
    });
  });

  const onChangeRef = useRef<((v: CalendarValue<M>) => void) | undefined>(
    onChange,
  );
  useLayoutEffect(() => {
    onChangeRef.current = onChange;
  });

  const stateRef = useRef(state);
  stateRef.current = state;
  const isControlledRef = useRef(isControlled);
  isControlledRef.current = isControlled;

  const deriveValue = useCallback(
    (s: typeof state): DateRange | Date[] | Date | null => {
      if (range) return { from: s.rangeStart, to: s.rangeEnd };
      if (multiselect) return s.selectedDates;
      return s.selectedDates[0] ?? null;
    },
    [range, multiselect],
  );

  const commitSelection = useCallback(
    (action: Parameters<typeof calendarReducer>[1]): boolean => {
      const prev = stateRef.current;
      const next = calendarReducer(prev, action);
      if (next === prev) return false;

      if (!isControlledRef.current) {
        dispatch(action);
        return true;
      }

      if (next.notifySeq !== prev.notifySeq) {
        const nextValue = deriveValue(next);
        onChangeRef.current?.(nextValue as CalendarValue<M>);
      }
      if (next.viewDate !== prev.viewDate) {
        dispatch({ type: "NAVIGATE", date: next.viewDate });
      }
      if (next.hoverDate !== prev.hoverDate) {
        dispatch({ type: "HOVER", date: next.hoverDate });
      }
      return true;
    },
    [deriveValue],
  );

  const pendingKeepViewRef = useRef(false);

  const externalKey = serializeValue(
    externalValue as DateRange | Date[] | Date | null | undefined,
  );
  useEffect(() => {
    if (!isControlled) return;
    validateCalendarValue(externalValue, mode, "value");
    // Read latest viewDate via ref — effect deps are [externalKey] only,
    // so a direct `state.viewDate` read would capture a stale value when
    // the user has navigated since the last `value` change.
    const currentViewDate = stateRef.current.viewDate;
    // Consume one-shot keepView flag set by handleChangeDate. When the user
    // clicked a day in an offset grid with keepView, we must not let the
    // external value round-trip snap viewDate to the new selection.
    const consumeKeepView = pendingKeepViewRef.current;
    pendingKeepViewRef.current = false;
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
        ? toValidDateOrNull(externalRangeObj.from)
        : externalDates?.[0]
          ? toValidDateOrNull(externalDates[0])
          : externalSingle
            ? toValidDateOrNull(externalSingle)
            : null;
      const to = externalRangeObj?.to
        ? toValidDateOrNull(externalRangeObj.to)
        : externalDates?.[1]
          ? toValidDateOrNull(externalDates[1])
          : null;
      dispatch({
        type: "SYNC_EXTERNAL",
        viewDate: consumeKeepView ? currentViewDate : (from ?? currentViewDate),
        selectedDates: [],
        rangeStart: from,
        rangeEnd: to,
      });
    } else if (externalDates) {
      const nextDates = externalDates
        .map(toValidDateOrNull)
        .filter((d): d is Date => d !== null);
      const keepView =
        consumeKeepView || nextDates.some((d) => isSameDay(d, currentViewDate));
      dispatch({
        type: "SYNC_EXTERNAL",
        viewDate: keepView
          ? currentViewDate
          : (nextDates[nextDates.length - 1] ?? currentViewDate),
        selectedDates: nextDates,
        rangeStart: null,
        rangeEnd: null,
      });
    } else {
      const parsed = externalSingle ? toValidDateOrNull(externalSingle) : null;
      dispatch({
        type: "SYNC_EXTERNAL",
        viewDate: consumeKeepView
          ? currentViewDate
          : (parsed ?? currentViewDate),
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
    (d: Date | null, options?: { keepView?: boolean }) => {
      if (readOnly) return;
      const didCommit = commitSelection({
        type: "SELECT",
        date: d,
        config: selectConfig,
        keepView: options?.keepView,
      });
      if (options?.keepView && didCommit && isControlledRef.current) {
        pendingKeepViewRef.current = true;
      }
    },
    [selectConfig, readOnly, commitSelection],
  );

  const handleChangeTime = useCallback(
    (d: Date) => {
      if (readOnly) return false;
      return commitSelection({
        type: "CHANGE_TIME",
        date: d,
        config: selectConfig,
      });
    },
    [readOnly, selectConfig, commitSelection],
  );

  const handleDatesSet = useCallback(
    (dates: Date[]) => {
      if (readOnly) return;
      commitSelection({ type: "SET_DATES", dates });
    },
    [readOnly, commitSelection],
  );

  const handleRangeSet = useCallback(
    (from: Date | null, to: Date | null) => {
      if (readOnly) return;
      commitSelection({ type: "SET_RANGE", from, to, config: selectConfig });
    },
    [readOnly, selectConfig, commitSelection],
  );

  const handleRangeBoundSet = useCallback(
    (bound: "from" | "to", date: Date | null) => {
      if (readOnly) return false;
      return commitSelection({
        type: "SET_RANGE_BOUND",
        bound,
        date,
        config: selectConfig,
      });
    },
    [readOnly, selectConfig, commitSelection],
  );

  const transitionEnabled = motion === "view-transition";

  const navigateTo = useCallback(
    (d: Date) => {
      runViewTransition(transitionEnabled, () => {
        dispatch({ type: "NAVIGATE", date: d });
      });
    },
    [transitionEnabled],
  );

  useEffect(() => {
    validateMinMax(minDate, maxDate);
  }, [minDate, maxDate]);

  const setHoverDate = useCallback((d: Date | null) => {
    dispatch({ type: "HOVER", date: d });
  }, []);

  // Popup open state is pure UI — kept outside the reducer to keep that store
  // focused on selection / view data. Only one popup can be open at a time.
  const [openPopup, setOpenPopup] = useState<"time" | "month" | "year" | null>(
    null,
  );

  const setOpenPopupWithTransition = useCallback(
    (next: "time" | "month" | "year" | null) => {
      runViewTransition(transitionEnabled, () => {
        setOpenPopup(next);
      });
    },
    [transitionEnabled],
  );

  const setShowTimePopup = useCallback(
    (v: boolean) => {
      setOpenPopupWithTransition(v ? "time" : null);
    },
    [setOpenPopupWithTransition],
  );

  const setShowMonthPopup = useCallback(
    (v: boolean) => {
      setOpenPopupWithTransition(v ? "month" : null);
    },
    [setOpenPopupWithTransition],
  );

  const setShowYearPopup = useCallback(
    (v: boolean) => {
      setOpenPopupWithTransition(v ? "year" : null);
    },
    [setOpenPopupWithTransition],
  );

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
      timeZone: resolvedTimeZone,
      readOnly,
      timeStep,
      actionLabels,
      motion,
      motionNames,
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
      resolvedTimeZone,
      readOnly,
      timeStep?.hour,
      timeStep?.minute,
      timeStep?.second,
      actionLabels,
      motion,
      motionNames,
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
  const containerRef = useRef<HTMLDivElement>(null);

  const ui = useMemo(
    () => ({
      toggleTheme: toggleTheme ?? (() => {}),
      activeTheme,
      containerRef,
      showTimePopup: openPopup === "time",
      setShowTimePopup,
      showMonthPopup: openPopup === "month",
      setShowMonthPopup,
      showYearPopup: openPopup === "year",
      setShowYearPopup,
      daysTrackActive,
      setDaysTrackActive,
      popupAnchorEl,
      setPopupAnchorEl,
    }),
    [
      toggleTheme,
      activeTheme,
      openPopup,
      daysTrackActive,
      popupAnchorEl,
      setShowTimePopup,
      setShowMonthPopup,
      setShowYearPopup,
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
