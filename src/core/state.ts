import { isSameDay } from "@/utils/date-utils";

export interface CalendarState {
  viewDate: Date;
  selectedDates: Date[];
  rangeStart: Date | null;
  rangeEnd: Date | null;
  hoverDate: Date | null;
  openPopup: "time" | "month" | "year" | null;
  notifySeq: number;
}

export interface SelectConfig {
  range: boolean;
  multiselect: number | boolean | undefined;
  minRangeDays?: number;
  maxRangeDays?: number;
}

export type CalendarAction =
  | { type: "NAVIGATE"; date: Date }
  | { type: "SELECT"; date: Date | null; config: SelectConfig }
  | { type: "HOVER"; date: Date | null }
  | { type: "OPEN_POPUP"; popup: "time" | "month" | "year" }
  | { type: "CLOSE_POPUP" }
  | { type: "CHANGE_TIME"; date: Date }
  | { type: "SET_DATES"; dates: Date[] }
  | { type: "SET_RANGE"; from: Date | null; to: Date | null }
  | {
      type: "SYNC_EXTERNAL";
      viewDate: Date;
      selectedDates: Date[];
      rangeStart: Date | null;
      rangeEnd: Date | null;
    };

function selectSingle(
  state: CalendarState,
  date: Date | null,
): CalendarState {
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
    return {
      ...state,
      viewDate: date,
      rangeStart: date,
      rangeEnd: null,
      hoverDate: null,
    };
  }

  if (isSameDay(date, rangeStart)) {
    return { ...state, rangeStart: null, rangeEnd: null, hoverDate: null };
  }

  const [s, e] = date < rangeStart ? [date, rangeStart] : [rangeStart, date];
  const diffDays = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
  if (config.minRangeDays !== undefined && diffDays < config.minRangeDays) {
    return state;
  }
  if (config.maxRangeDays !== undefined && diffDays > config.maxRangeDays) {
    return state;
  }

  return {
    ...state,
    viewDate: s,
    rangeStart: s,
    rangeEnd: e,
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

    case "OPEN_POPUP":
      return { ...state, openPopup: action.popup };

    case "CLOSE_POPUP":
      return { ...state, openPopup: null };

    case "CHANGE_TIME": {
      const { date } = action;
      let nextDates = state.selectedDates;
      if (state.selectedDates.length > 0) {
        const idx = state.selectedDates.findIndex((d) =>
          isSameDay(d, state.viewDate),
        );
        nextDates =
          idx >= 0
            ? state.selectedDates.map((d, i) => (i === idx ? date : d))
            : [date];
      }
      return {
        ...state,
        viewDate: date,
        selectedDates: nextDates,
        notifySeq: state.notifySeq + 1,
      };
    }

    case "SET_DATES":
      return { ...state, selectedDates: action.dates, notifySeq: state.notifySeq + 1 };

    case "SET_RANGE":
      return {
        ...state,
        rangeStart: action.from,
        rangeEnd: action.to,
        viewDate: action.from ?? state.viewDate,
        notifySeq: state.notifySeq + 1,
      };

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

export const toValidDate = (d?: Date | null): Date => {
  if (!d) return new Date();
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

export function buildInitialState(params: {
  externalValue?: Date | Date[] | { from: Date | null; to: Date | null };
  range: boolean;
}): CalendarState {
  const { externalValue, range } = params;

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
      ? toValidDate(rangeObj.from)
      : datesArr?.[0]
        ? toValidDate(datesArr[0])
        : singleDate
          ? toValidDate(singleDate)
          : null;
    const rangeEnd = rangeObj?.to
      ? toValidDate(rangeObj.to)
      : datesArr?.[1]
        ? toValidDate(datesArr[1])
        : null;
    return {
      viewDate: rangeStart ?? new Date(),
      selectedDates: [],
      rangeStart,
      rangeEnd,
      hoverDate: null,
      openPopup: null,
      notifySeq: 0,
    };
  }

  const selectedDates = datesArr
    ? datesArr.map(toValidDate)
    : singleDate
      ? [toValidDate(singleDate)]
      : [];

  const viewDate = selectedDates[0] ?? new Date();

  return {
    viewDate,
    selectedDates,
    rangeStart: null,
    rangeEnd: null,
    hoverDate: null,
    openPopup: null,
    notifySeq: 0,
  };
}
