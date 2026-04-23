import React from "react";
import { CalendarTheme } from "./themes";
import { CalendarAppearance } from "./appearances";

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

export type CalendarValue<M extends CalendarMode> =
  M extends "range" ? DateRange :
  M extends "multiple" ? Date[] :
  Date | null;

export interface CalendarProps<M extends CalendarMode = "single"> {
  children?: React.ReactNode;
  cols?: number;
  value?: CalendarValue<M>;
  mode?: M;
  max?: number;
  minDate?: Date;
  maxDate?: Date;
  onChange?: (value: CalendarValue<M>) => void;
  rangeMinDays?: number;
  rangeMaxDays?: number;
  locale?: string;
  timeZone?: string;
  theme?: CalendarTheme;
  width?: string | number;
  hour12?: boolean;
  appearance?: CalendarAppearance;
  gradient?: boolean;
  disabled?: DisabledConfig;
}
