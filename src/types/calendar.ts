import { CalendarTheme } from "./themes";

export type StartOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type DisabledRule =
  | boolean
  | Date
  | Date[]
  | { from: Date; to: Date }
  | { dayOfWeek: number[] }
  | { before?: Date; after?: Date };

export interface CalendarProps {
  date?: Date | Date[];
  startDate?: Date;
  endDate?: Date;
  startMonth?: Date;
  onChangeDate?: (date: Date | Date[] | null) => void;
  multiselect?: number | boolean;
  range?: boolean;
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
  disabled?: DisabledRule;
  twoMonthsLayout?: boolean;
  monthsColumn?: boolean;
  rangeMinDays?: number;
  rangeMaxDays?: number;
}

export interface CalendarContextValue extends CalendarProps {
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
  onChangeDate: (date: Date | Date[] | null) => void;
  onChangeTime: (date: Date) => void;
  navigateTo: (date: Date) => void;
  selectedDate: Date | null;
  selectedDates: Date[];
  rangeStart: Date | null;
  rangeEnd: Date | null;
  hoverDate: Date | null;
  setHoverDate: (d: Date | null) => void;
  dark: boolean;
  showTimePopup: boolean;
  setShowTimePopup: (v: boolean) => void;
  showMonthPopup: boolean;
  setShowMonthPopup: (v: boolean) => void;
  showYearPopup: boolean;
  setShowYearPopup: (v: boolean) => void;
}
