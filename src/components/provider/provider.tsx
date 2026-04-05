import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  ReactNode,
  useState,
  useEffect,
  useRef,
} from "react";
import { CalendarContextValue, CalendarProps } from "@/types/calendar";
import { DARK_THEMES } from "@/types/themes";

const CalendarContext = createContext<CalendarContextValue | undefined>(
  undefined,
);

export const useCalendarContext = () => {
  const context = useContext(CalendarContext);
  if (!context)
    throw new Error("useCalendarContext must be used within Provider");
  return context;
};

const toValidDate = (d?: Date) => {
  const parsed = d ? new Date(d) : new Date();
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const CalendarProvider: React.FC<
  CalendarProps & { children: ReactNode; containerWidth?: number }
> = ({
  children,
  theme,
  date: externalDate,
  onChangeDate,
  multiselect,
  range,
  startMonth,
  rangeMinDays,
  rangeMaxDays,
  containerWidth = 0,
  ...props
}) => {
  const externalDates = Array.isArray(externalDate) ? externalDate : undefined;
  const externalSingle = Array.isArray(externalDate)
    ? externalDate[0]
    : externalDate;

  const [internalDate, setInternalDate] = useState<Date>(() => {
    if (externalSingle) return toValidDate(externalSingle);
    if (startMonth) return toValidDate(startMonth);
    return new Date();
  });
  const [selectedDates, setSelectedDates] = useState<Date[]>(() => {
    if (range) return [];
    if (externalDates) return externalDates.map(toValidDate);
    if (externalSingle) return [toValidDate(externalSingle)];
    return [];
  });

  const [rangeStart, setRangeStart] = useState<Date | null>(() => {
    if (!range) return null;
    if (externalDates?.[0]) return toValidDate(externalDates[0]);
    if (externalSingle) return toValidDate(externalSingle);
    return null;
  });
  const [rangeEnd, setRangeEnd] = useState<Date | null>(() => {
    if (!range) return null;
    if (externalDates?.[1]) return toValidDate(externalDates[1]);
    return null;
  });
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const selectedDatesRef = useRef(selectedDates);
  selectedDatesRef.current = selectedDates;
  const rangeStartRef = useRef(rangeStart);
  rangeStartRef.current = rangeStart;
  const rangeEndRef = useRef(rangeEnd);
  rangeEndRef.current = rangeEnd;

  useEffect(() => {
    if (startMonth) setInternalDate(toValidDate(startMonth));
  }, [startMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  const [showTimePopup, setShowTimePopup] = useState(false);
  const [showMonthPopup, setShowMonthPopup] = useState(false);
  const [showYearPopup, setShowYearPopup] = useState(false);

  useEffect(() => {
    if (range) {
      if (externalDates?.length) {
        setRangeStart(toValidDate(externalDates[0]));
        setRangeEnd(externalDates[1] ? toValidDate(externalDates[1]) : null);
        if (externalDates[0]) setInternalDate(toValidDate(externalDates[0]));
      } else if (externalSingle) {
        setRangeStart(toValidDate(externalSingle));
        setRangeEnd(null);
        setInternalDate(toValidDate(externalSingle));
      }
    } else if (externalDates) {
      setSelectedDates(externalDates.map(toValidDate));
    } else {
      const parsed = toValidDate(externalSingle);
      setInternalDate(parsed);
      setSelectedDates(externalSingle ? [parsed] : []);
    }
  }, [externalDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDark = useMemo(() => {
    if (!theme) {
      return typeof window !== "undefined"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
        : false;
    }
    return (DARK_THEMES as readonly string[]).includes(theme);
  }, [theme]);

  const handleChangeDate = useCallback(
    (d: Date | null) => {
      if (range) {
        if (!d) {
          setRangeStart(null);
          setRangeEnd(null);
          setHoverDate(null);
          onChangeDate?.(null);
          return;
        }
        const prevStart = rangeStartRef.current;
        const prevEnd = rangeEndRef.current;

        if (!prevStart || (prevStart && prevEnd)) {
          setRangeStart(d);
          setRangeEnd(null);
          setInternalDate(d);
          setHoverDate(null);
          onChangeDate?.(null);
          return;
        }

        if (isSameDay(d, prevStart)) {
          setRangeStart(null);
          setRangeEnd(null);
          setHoverDate(null);
          onChangeDate?.(null);
          return;
        }

        const [s, e] = d < prevStart ? [d, prevStart] : [prevStart, d];
        const diffDays = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
        if (rangeMinDays !== undefined && diffDays < rangeMinDays) return;
        if (rangeMaxDays !== undefined && diffDays > rangeMaxDays) return;
        setRangeStart(s);
        setRangeEnd(e);
        setInternalDate(s);
        setHoverDate(null);
        onChangeDate?.([s, e]);
        return;
      }

      if (multiselect && d) {
        const maxCount = multiselect === true ? Infinity : Number(multiselect);
        const prev = selectedDatesRef.current;
        const alreadyIndex = prev.findIndex((s) => isSameDay(s, d));

        let next: Date[];
        if (alreadyIndex >= 0) {
          next = prev.filter((_, i) => i !== alreadyIndex);
        } else if (prev.length >= maxCount) {
          return;
        } else {
          next = [...prev, d];
        }

        setSelectedDates(next);
        setInternalDate(d);
        onChangeDate?.(next);
      } else {
        if (d) {
          const prev = selectedDatesRef.current[0];
          if (prev && isSameDay(prev, d)) {
            setSelectedDates([]);
            onChangeDate?.(null);
            return;
          }
          setInternalDate(d);
          setSelectedDates([d]);
        } else {
          setSelectedDates([]);
        }
        onChangeDate?.(d);
      }
    },
    [multiselect, range, onChangeDate],
  );

  const handleChangeTime = useCallback(
    (d: Date) => {
      setInternalDate(d);
      setSelectedDates((prev) => (prev.length > 0 ? [d] : prev));
      onChangeDate?.(d);
    },
    [onChangeDate],
  );

  const navigateTo = useCallback((d: Date) => {
    setInternalDate(d);
  }, []);

  const selectedDate = range ? rangeStart : (selectedDates[0] ?? null);

  const contextSelectedDates = range
    ? ([rangeStart, rangeEnd].filter(Boolean) as Date[])
    : selectedDates;

  const contextValue = useMemo<CalendarContextValue>(
    () =>
      ({
        ...props,
        multiselect,
        range,
        dark: isDark,
        date: internalDate,
        selectedDate,
        selectedDates: contextSelectedDates,
        rangeStart,
        rangeEnd,
        hoverDate,
        setHoverDate,
        navigateTo,
        showTimePopup,
        setShowTimePopup,
        showMonthPopup,
        setShowMonthPopup,
        showYearPopup,
        setShowYearPopup,
        onChangeDate: handleChangeDate,
        onChangeTime: handleChangeTime,
        containerWidth,
      }) as CalendarContextValue,
    [
      props,
      multiselect,
      range,
      isDark,
      internalDate,
      selectedDate,
      contextSelectedDates,
      rangeStart,
      rangeEnd,
      hoverDate,
      handleChangeDate,
      handleChangeTime,
      navigateTo,
      showTimePopup,
      showMonthPopup,
      showYearPopup,
      containerWidth,
    ],
  );

  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
};
