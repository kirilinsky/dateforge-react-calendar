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
  yearGridLabel?: string;
  yearPageNavigationLabel?: string;
  yearPickerLabel?: string;
  yearTrackLabel?: string;
  locale?: string;
  timeZone?: string;
  readOnly?: boolean;
  /**
   * @example theme="midnight"
   * @example import { midnight } from "@dateforge/react-calendar/themes"; <Calendar theme={midnight} />
   * @example import { abyss } from "@dateforge/react-calendar/themes/abyss"; <Calendar theme={abyss} />
   */
  theme?: CalendarTheme;
  width?: string | number;
  hour12?: boolean;
  /**
   * Step (granularity) for time drums. Hours/minutes/seconds. Default 1.
   * Affects both inline TimeGrid and nav time popup.
   * @example timeStep={{ minute: 5 }}
   */
  timeStep?: { hour?: number; minute?: number; second?: number };
  /**
   * @example // default — no import needed, just omit the prop
   * @example import { loft } from "@dateforge/react-calendar/appearances"; <Calendar appearance={loft} />
   * @example import { compact } from "@dateforge/react-calendar/appearances/compact"; <Calendar appearance={compact} />
   */
  appearance?: CalendarAppearance;
  gradient?: boolean;
  disabled?: DisabledConfig;
}
