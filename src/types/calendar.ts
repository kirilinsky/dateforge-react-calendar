import { CalendarTheme } from "./themes";

export type StartOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type DisabledRule =
  | boolean
  | Date
  | { from: Date; to: Date }
  | { dayOfWeek: number[] }
  | { before?: Date; after?: Date };

export type DateRange = {
  from: Date | null;
  to: Date | null;
};

export type CalendarMode = "single" | "multiple" | "range";

export interface CalendarProps {
  value?: Date | Date[] | DateRange;
  mode?: CalendarMode;
  max?: number;
  startDate?: Date;
  endDate?: Date;
  startMonth?: Date;
  onChange?: (date: Date | null) => void;
  onDatesChange?: (dates: Date[]) => void;
  onRangeChange?: (range: DateRange) => void;
  rangeMinDays?: number;
  rangeMaxDays?: number;
  showSelectedDates?: boolean;
  locale?: string;
  theme?: CalendarTheme;
  width?: string | number;
  startOfWeek?: StartOfWeek;
  time?: boolean;
  hour12?: boolean;
  timeGrid?: boolean;
  presets?: boolean;
  years?: boolean;
  months?: boolean;
  monthsGrid?: boolean;
  compactYears?: boolean;
  compactMonths?: boolean;
  brutalism?: boolean;
  gestures?: boolean;
  gradient?: boolean;
  highlightWeekends?: boolean;
  showWeekNumber?: boolean;
  hideLimited?: boolean;
  hideDisabled?: boolean;
  hideWeekdays?: boolean;
  shortMonths?: boolean;
  disabled?: DisabledRule | DisabledRule[];
  twoMonthsLayout?: boolean;
  monthsColumn?: boolean;
  showHomeButton?: boolean;
  showClearButton?: boolean;
  showThemeToggle?: boolean;
  highlightToday?: boolean;
  allowCleanSelected?: boolean;
  allowNavigateSelected?: boolean;
}

export interface CalendarContextValue extends Omit<
  CalendarProps,
  "onChange" | "onDatesChange" | "onRangeChange" | "mode" | "max"
> {
  range: boolean;
  multiselect: number | boolean | undefined;
  date: Date;
  containerWidth: number;
  locale: string;
  startOfWeek: StartOfWeek;
  time: boolean;
  presets: boolean;
  years: boolean;
  months: boolean;
  monthsGrid: boolean;
  compactMonths: boolean;
  onChangeDate: (date: Date | null) => void;
  onChangeTime: (date: Date) => void;
  navigateTo: (date: Date) => void;
  selectedDate: Date | null;
  selectedDates: Date[];
  rangeStart: Date | null;
  rangeEnd: Date | null;
  hoverDate: Date | null;
  setHoverDate: (d: Date | null) => void;
  dark: boolean;
  toggleTheme: () => void;
  showTimePopup: boolean;
  setShowTimePopup: (v: boolean) => void;
  showMonthPopup: boolean;
  setShowMonthPopup: (v: boolean) => void;
  showYearPopup: boolean;
  setShowYearPopup: (v: boolean) => void;
}
