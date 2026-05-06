import type { DisabledConfig } from "@/types/calendar";
import {
  checkIsDateDisabled,
  hasDisabledInRange,
  isSameDay,
} from "@/utils/date-utils";

interface CalendarState {
  viewDate: Date;
  selectedDates: Date[];
  rangeStart: Date | null;
  rangeEnd: Date | null;
  hoverDate: Date | null;
  notifySeq: number;
}

export interface SelectConfig {
  range: boolean;
  multiselect: number | boolean | undefined;
  minRangeDays?: number;
  maxRangeDays?: number;
  minDate?: Date | null;
  maxDate?: Date | null;
  disabled?: DisabledConfig;
}

type CalendarAction =
  | { type: "NAVIGATE"; date: Date }
  | { type: "SELECT"; date: Date | null; config: SelectConfig }
  | { type: "HOVER"; date: Date | null }
  | { type: "CHANGE_TIME"; date: Date; config: SelectConfig }
  | { type: "SET_DATES"; dates: Date[] }
  | {
      type: "SET_RANGE";
      from: Date | null;
      to: Date | null;
      config: SelectConfig;
    }
  | {
      type: "SET_RANGE_BOUND";
      bound: "from" | "to";
      date: Date | null;
      config: SelectConfig;
    }
  | {
      type: "SYNC_EXTERNAL";
      viewDate: Date;
      selectedDates: Date[];
      rangeStart: Date | null;
      rangeEnd: Date | null;
    };

interface ResolvedRange {
  from: Date | null;
  to: Date | null;
}

const isValidDate = (d: Date | null): d is Date =>
  d instanceof Date && !Number.isNaN(d.getTime());

const rangeLengthDays = (from: Date, to: Date) =>
  Math.round((to.getTime() - from.getTime()) / 86400000) + 1;

export function validateRange(
  from: Date | null,
  to: Date | null,
  config: Pick<
    SelectConfig,
    "minRangeDays" | "maxRangeDays" | "minDate" | "maxDate" | "disabled"
  >,
): ResolvedRange | null {
  if (!from && !to) return { from: null, to: null };
  if ((from && !isValidDate(from)) || (to && !isValidDate(to))) return null;

  if (from && !to) {
    if (
      checkIsDateDisabled(from, config.minDate, config.maxDate, config.disabled)
    )
      return null;
    return { from, to: null };
  }

  if (!from && to) {
    if (
      checkIsDateDisabled(to, config.minDate, config.maxDate, config.disabled)
    )
      return null;
    return { from: null, to };
  }

  if (!from || !to) return null;
  const [start, end] = from <= to ? [from, to] : [to, from];
  const diffDays = rangeLengthDays(start, end);
  if (config.minRangeDays !== undefined && diffDays < config.minRangeDays) {
    return null;
  }
  if (config.maxRangeDays !== undefined && diffDays > config.maxRangeDays) {
    return null;
  }
  if (
    hasDisabledInRange(
      start,
      end,
      config.minDate,
      config.maxDate,
      config.disabled,
    )
  ) {
    return null;
  }

  return { from: start, to: end };
}

function selectSingle(state: CalendarState, date: Date | null): CalendarState {
  if (!date) {
    return { ...state, selectedDates: [] };
  }
  const prev = state.selectedDates[0];
  if (prev && isSameDay(prev, date)) {
    return { ...state, selectedDates: [] };
  }
  return { ...state, viewDate: date, selectedDates: [date] };
}

function selectMultiple(
  state: CalendarState,
  date: Date,
  maxCount: number,
): CalendarState {
  const alreadyIndex = state.selectedDates.findIndex((s) => isSameDay(s, date));
  let next: Date[];
  if (alreadyIndex >= 0) {
    next = state.selectedDates.filter((_, i) => i !== alreadyIndex);
  } else if (state.selectedDates.length >= maxCount) {
    return state;
  } else {
    next = [...state.selectedDates, date];
  }
  return { ...state, viewDate: date, selectedDates: next };
}

function selectRange(
  state: CalendarState,
  date: Date,
  config: SelectConfig,
): CalendarState {
  const { rangeStart, rangeEnd } = state;

  if (!rangeStart || (rangeStart && rangeEnd)) {
    const range = validateRange(date, null, config);
    if (!range) return state;
    return {
      ...state,
      viewDate: date,
      rangeStart: range.from,
      rangeEnd: range.to,
      hoverDate: null,
    };
  }

  if (isSameDay(date, rangeStart)) {
    return { ...state, rangeStart: null, rangeEnd: null, hoverDate: null };
  }

  const range = validateRange(rangeStart, date, config);
  if (!range?.from || !range.to) return state;

  return {
    ...state,
    viewDate: range.from,
    rangeStart: range.from,
    rangeEnd: range.to,
    hoverDate: null,
  };
}

export function calendarReducer(
  state: CalendarState,
  action: CalendarAction,
): CalendarState {
  switch (action.type) {
    case "NAVIGATE":
      return { ...state, viewDate: action.date };

    case "SELECT": {
      const { date, config } = action;
      let next: CalendarState;
      if (config.range) {
        next = !date
          ? { ...state, rangeStart: null, rangeEnd: null, hoverDate: null }
          : selectRange(state, date, config);
      } else if (config.multiselect && date) {
        const maxCount =
          config.multiselect === true ? Infinity : Number(config.multiselect);
        next = selectMultiple(state, date, maxCount);
      } else {
        next = selectSingle(state, date);
      }
      if (next === state) return state;
      return { ...next, notifySeq: state.notifySeq + 1 };
    }

    case "HOVER":
      return { ...state, hoverDate: action.date };

    case "CHANGE_TIME": {
      const { date, config } = action;
      // viewDate always reflects the current working time. Whether selection
      // is committed depends on mode and whether viewDate's day matches an
      // existing selected date / range boundary. Time-only picker for single
      // mode auto-creates the selection from viewDate's day + new time.
      const baseUpdate: CalendarState = { ...state, viewDate: date };

      if (config.range) {
        if (state.rangeStart && isSameDay(state.rangeStart, state.viewDate)) {
          return {
            ...baseUpdate,
            rangeStart: date,
            notifySeq: state.notifySeq + 1,
          };
        }
        if (state.rangeEnd && isSameDay(state.rangeEnd, state.viewDate)) {
          return {
            ...baseUpdate,
            rangeEnd: date,
            notifySeq: state.notifySeq + 1,
          };
        }
        return baseUpdate;
      }

      if (config.multiselect) {
        if (state.selectedDates.length === 0) return baseUpdate;
        const idx = state.selectedDates.findIndex((d) =>
          isSameDay(d, state.viewDate),
        );
        if (idx < 0) return baseUpdate;
        const nextDates = state.selectedDates.map((d, i) =>
          i === idx ? date : d,
        );
        return {
          ...baseUpdate,
          selectedDates: nextDates,
          notifySeq: state.notifySeq + 1,
        };
      }

      // single
      const single = state.selectedDates[0];
      if (!single) {
        return {
          ...baseUpdate,
          selectedDates: [date],
          notifySeq: state.notifySeq + 1,
        };
      }
      if (isSameDay(single, state.viewDate)) {
        return {
          ...baseUpdate,
          selectedDates: [date],
          notifySeq: state.notifySeq + 1,
        };
      }
      return baseUpdate;
    }

    case "SET_DATES":
      return {
        ...state,
        selectedDates: action.dates,
        notifySeq: state.notifySeq + 1,
      };

    case "SET_RANGE": {
      const range = validateRange(action.from, action.to, action.config);
      if (!range) return state;
      return {
        ...state,
        rangeStart: range.from,
        rangeEnd: range.to,
        viewDate: range.from ?? range.to ?? state.viewDate,
        notifySeq: state.notifySeq + 1,
      };
    }

    case "SET_RANGE_BOUND": {
      const { bound, date } = action;
      let nextStart = state.rangeStart;
      let nextEnd = state.rangeEnd;
      if (bound === "from") {
        if (date && nextEnd && date.getTime() > nextEnd.getTime()) {
          nextStart = nextEnd;
        } else {
          nextStart = date;
        }
      } else {
        if (date && nextStart && date.getTime() < nextStart.getTime()) {
          nextEnd = nextStart;
        } else {
          nextEnd = date;
        }
      }
      const range = validateRange(nextStart, nextEnd, action.config);
      if (!range) return state;
      return {
        ...state,
        rangeStart: range.from,
        rangeEnd: range.to,
        viewDate: date ?? state.viewDate,
        notifySeq: state.notifySeq + 1,
      };
    }

    case "SYNC_EXTERNAL":
      return {
        ...state,
        viewDate: action.viewDate,
        selectedDates: action.selectedDates,
        rangeStart: action.rangeStart,
        rangeEnd: action.rangeEnd,
      };

    default:
      return state;
  }
}

// Selection-context fallback: invalid or nullish input is dropped (returns null)
// rather than silently replaced with today. Lets app errors surface instead of
// being masked as a "today" selection.
export const toValidDateOrNull = (d?: Date | null): Date | null => {
  if (!d) return null;
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export function buildInitialState(params: {
  externalValue?: Date | Date[] | { from: Date | null; to: Date | null };
  defaultViewDate?: Date;
  range: boolean;
}): CalendarState {
  const { externalValue, defaultViewDate, range } = params;
  const viewFallback = defaultViewDate ?? new Date();

  const isRangeObj =
    externalValue !== null &&
    typeof externalValue === "object" &&
    !Array.isArray(externalValue) &&
    !(externalValue instanceof Date) &&
    "from" in externalValue;

  const rangeObj = isRangeObj
    ? (externalValue as { from: Date | null; to: Date | null })
    : undefined;
  const datesArr = Array.isArray(externalValue) ? externalValue : undefined;
  const singleDate =
    externalValue instanceof Date
      ? externalValue
      : !rangeObj
        ? datesArr?.[0]
        : undefined;

  if (range) {
    const rangeStart = rangeObj?.from
      ? toValidDateOrNull(rangeObj.from)
      : datesArr?.[0]
        ? toValidDateOrNull(datesArr[0])
        : singleDate
          ? toValidDateOrNull(singleDate)
          : null;
    const rangeEnd = rangeObj?.to
      ? toValidDateOrNull(rangeObj.to)
      : datesArr?.[1]
        ? toValidDateOrNull(datesArr[1])
        : null;
    return {
      viewDate: rangeStart ?? viewFallback,
      selectedDates: [],
      rangeStart,
      rangeEnd,
      hoverDate: null,
      notifySeq: 0,
    };
  }

  const selectedDates = datesArr
    ? (datesArr.map(toValidDateOrNull).filter(Boolean) as Date[])
    : singleDate
      ? ((): Date[] => {
          const v = toValidDateOrNull(singleDate);
          return v ? [v] : [];
        })()
      : [];

  const viewDate = selectedDates[0] ?? viewFallback;

  return {
    viewDate,
    selectedDates,
    rangeStart: null,
    rangeEnd: null,
    hoverDate: null,
    notifySeq: 0,
  };
}
