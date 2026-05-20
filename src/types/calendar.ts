import type React from "react";
import type { CalendarAppearance } from "./appearances";
import type { CalendarTheme } from "./themes";

export type StartOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type DisabledRule =
  | boolean
  | Date
  | { from: Date; to: Date }
  | { dayOfWeek: number[] }
  | { before?: Date; after?: Date };

export interface DisabledConfig {
  readonly __type: "disabled-config";
  readonly rules: DisabledRule[];
}

export type DateRange = {
  from: Date | null;
  to: Date | null;
};

export type CalendarMode = "single" | "multiple" | "range";

export type CalendarMotion = "none" | "view-transition";

export type CalendarValue<M extends CalendarMode> = M extends "range"
  ? DateRange
  : M extends "multiple"
    ? Date[]
    : Date | null;

export interface CalendarActionLabels {
  applyLabel?: string;
  calendarNavigationLabel?: string;
  changeMonthLabel?: string;
  changeTimeLabel?: string;
  changeYearLabel?: string;
  clearLabel?: string;
  confirmLabel?: string;
  dayTrackLabel?: string;
  homeLabel?: string;
  hoursLabel?: string;
  minutesLabel?: string;
  monthGridLabel?: string;
  monthPickerLabel?: string;
  monthTrackLabel?: string;
  monthsLabel?: string;
  yearsLabel?: string;
  nextMonthLabel?: string;
  nextYearLabel?: string;
  nextYearsLabel?: string;
  previousMonthLabel?: string;
  previousYearLabel?: string;
  previousYearsLabel?: string;
  removeLabel?: string;
  removeRangeEndLabel?: string;
  removeRangeStartLabel?: string;
  removeSelectedDateLabel?: string;
  resetTimeLabel?: string;
  resetMonthLabel?: string;
  resetYearLabel?: string;
  saveSelectedDateLabel?: string;
  secondsLabel?: string;
  selectMonthLabel?: string;
  selectTimeLabel?: string;
  selectYearLabel?: string;
  showMoreSelectedDatesLabel?: string;
  themeSwitchToDarkLabel?: string;
  themeSwitchToLightLabel?: string;
  themeToggleLabel?: string;
  timePeriodLabel?: string;
  timePickerLabel?: string;
  weekLabel?: string;
  yearGridLabel?: string;
  yearPageNavigationLabel?: string;
  yearPickerLabel?: string;
  yearTrackLabel?: string;
}

export interface CalendarProps<M extends CalendarMode = "single"> {
  children?: React.ReactNode;
  cols?: number;
  value?: CalendarValue<M>;
  defaultValue?: CalendarValue<M>;
  defaultViewDate?: Date;
  mode?: M;
  maxDates?: number;
  minDate?: Date;
  maxDate?: Date;
  onChange?: (value: CalendarValue<M>) => void;
  minRangeDays?: number;
  maxRangeDays?: number;
  applyLabel?: string;
  calendarNavigationLabel?: string;
  changeMonthLabel?: string;
  changeTimeLabel?: string;
  changeYearLabel?: string;
  clearLabel?: string;
  confirmLabel?: string;
  dayTrackLabel?: string;
  homeLabel?: string;
  hoursLabel?: string;
  minutesLabel?: string;
  monthGridLabel?: string;
  monthPickerLabel?: string;
  monthTrackLabel?: string;
  monthsLabel?: string;
  yearsLabel?: string;
  nextMonthLabel?: string;
  nextYearLabel?: string;
  nextYearsLabel?: string;
  previousMonthLabel?: string;
  previousYearLabel?: string;
  previousYearsLabel?: string;
  removeLabel?: string;
  removeRangeEndLabel?: string;
  removeRangeStartLabel?: string;
  removeSelectedDateLabel?: string;
  resetTimeLabel?: string;
  resetMonthLabel?: string;
  resetYearLabel?: string;
  saveSelectedDateLabel?: string;
  secondsLabel?: string;
  selectMonthLabel?: string;
  selectTimeLabel?: string;
  selectYearLabel?: string;
  showMoreSelectedDatesLabel?: string;
  themeSwitchToDarkLabel?: string;
  themeSwitchToLightLabel?: string;
  themeToggleLabel?: string;
  timePeriodLabel?: string;
  timePickerLabel?: string;
  weekLabel?: string;
  yearGridLabel?: string;
  yearPageNavigationLabel?: string;
  yearPickerLabel?: string;
  yearTrackLabel?: string;
  locale?: string;
  timeZone?: string;
  readOnly?: boolean;
  /**
   * @example <Calendar /> // default palette, auto mode
   * @example <Calendar dark /> // default palette, dark mode
   * @example import { slate } from "@dateforge/react-calendar/themes"; <Calendar theme={slate} />
   * @example import { abyss } from "@dateforge/react-calendar/themes/abyss"; <Calendar theme={abyss} light />
   */
  theme?: CalendarTheme;
  light?: boolean;
  dark?: boolean;
  width?: string | number;
  hour12?: boolean;
  /**
   * Step (granularity) for time drums. Hours/minutes/seconds. Default 1.
   * Affects both inline TimeWheel and nav time popup.
   * @example timeStep={{ minute: 5 }}
   */
  timeStep?: { hour?: number; minute?: number; second?: number };
  /**
   * @example // default — no import needed, just omit the prop
   * @example import { loft } from "@dateforge/react-calendar/appearances"; <Calendar appearance={loft} />
   * @example import { compact } from "@dateforge/react-calendar/appearances/compact"; <Calendar appearance={compact} />
   */
  appearance?: CalendarAppearance;
  /**
   * Opt-in browser View Transitions for calendar navigation and popups.
   * Defaults to `"none"` so host app page transitions are not affected.
   */
  motion?: CalendarMotion;
  gradient?: boolean;
  disabled?: DisabledConfig;
  /**
   * `data-testid` applied to the calendar root wrapper. Defaults to
   * `"dateforge-calendar"`. Override per-instance for tests that mount
   * multiple calendars.
   */
  "data-testid"?: string;
}
