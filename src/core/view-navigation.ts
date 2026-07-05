import { addDays, type CalendarDate, compareDate } from "./calendar-date";

/**
 * Pure gating for view navigation against the config `min`/`max` window.
 * Modules (toolbar prev/next, pickers) call these to disable controls instead
 * of letting a click silently bounce — same contract v2 had via
 * `checkYearNavigation`/`isYearFixed`, reduced to four small functions.
 */

export type ViewNavUnit = "day" | "month" | "year";

const monthIndex = (d: CalendarDate): number => d.year * 12 + (d.month - 1);

/** Can the view step one `unit` in `dir` and still show selectable dates? */
export function canStepView(
  view: CalendarDate,
  unit: ViewNavUnit,
  dir: -1 | 1,
  min?: CalendarDate,
  max?: CalendarDate,
): boolean {
  if (unit === "day") {
    const target = addDays(view, dir);
    return dir < 0
      ? !min || compareDate(target, min) >= 0
      : !max || compareDate(target, max) <= 0;
  }
  if (unit === "month") {
    const target = monthIndex(view) + dir;
    return dir < 0
      ? !min || target >= monthIndex(min)
      : !max || target <= monthIndex(max);
  }
  const target = view.year + dir;
  return dir < 0 ? !min || target >= min.year : !max || target <= max.year;
}

/** Does the month (year, month) contain at least one day inside [min, max]? */
export function isMonthInBounds(
  year: number,
  month: number,
  min?: CalendarDate,
  max?: CalendarDate,
): boolean {
  const idx = year * 12 + (month - 1);
  if (min && idx < monthIndex(min)) return false;
  if (max && idx > monthIndex(max)) return false;
  return true;
}

/** Does the year contain at least one day inside [min, max]? */
export function isYearInBounds(
  year: number,
  min?: CalendarDate,
  max?: CalendarDate,
): boolean {
  if (min && year < min.year) return false;
  if (max && year > max.year) return false;
  return true;
}

/** Only one selectable year — a year picker can't change anything. */
export function isYearFixed(min?: CalendarDate, max?: CalendarDate): boolean {
  return !!min && !!max && min.year === max.year;
}

/** Only one selectable month — a month picker can't change anything. */
export function isMonthFixed(min?: CalendarDate, max?: CalendarDate): boolean {
  return isYearFixed(min, max) && !!min && !!max && min.month === max.month;
}
