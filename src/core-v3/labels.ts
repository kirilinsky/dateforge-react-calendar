/**
 * Label registry — the single home for user-facing strings (mostly aria).
 *
 * Ported from the v2 `action-labels` set and adapted to a typed registry:
 * keys instead of loose constants, multi-placeholder interpolation, and one
 * resolver with the priority `module override → root override → English
 * default`. Modules never hard-code aria strings; they resolve through here so
 * every label is overridable and a11y works out of the box.
 */

export const LABEL_DEFAULTS = {
  apply: "Apply",
  calendarNavigation: "Calendar navigation",
  changeMonth: "Change month, currently {month}",
  currentDay: "Current day, {day}",
  currentMonth: "Current month, {month}",
  currentYear: "Current year, {year}",
  changeTime: "Change time, currently {time}",
  changeYear: "Change year, currently {year}",
  clear: "Clear",
  confirm: "Confirm",
  dayTrack: "Day",
  home: "Go to current month",
  hours: "Hours",
  infoRanges: "{count} ranges",
  lunar: "Lunar phases",
  manualInput: "Date",
  minutes: "Minutes",
  monthGrid: "Select month, {year}",
  monthPicker: "Month picker",
  monthSelected: "{month}, selected",
  monthTrack: "Month",
  nextDay: "Next day",
  nextMonth: "Next month",
  nextYear: "Next year",
  nextYears: "Next years",
  previousDay: "Previous day",
  previousMonth: "Previous month",
  previousYear: "Previous year",
  previousYears: "Previous years",
  rangeFrom: "Start date",
  rangeTo: "End date",
  remove: "Remove",
  removeRangeEnd: "Remove range end",
  removeRangeStart: "Remove range start",
  removeSelectedDate: "Remove selected date",
  resetTime: "Reset to {time}",
  resetMonth: "Reset to {month}",
  resetYear: "Reset to {year}",
  saveSelectedDate: "Save selected date",
  seconds: "Seconds",
  selectMonth: "Select month",
  selectTime: "Select time",
  selectYear: "Select year",
  showMoreSelectedDates: "Show {count} more selected dates",
  themeSwitchToDark: "Switch to dark mode",
  themeSwitchToLight: "Switch to light mode",
  themeToggle: "Toggle theme",
  timePeriod: "Time period, currently {period}",
  timePicker: "Time picker",
  week: "Week",
  yearGrid: "Select year, showing {from} to {to}",
  yearPageNavigation: "Year page navigation",
  yearPicker: "Year picker",
  yearTrack: "Year",
} as const;

export type LabelKey = keyof typeof LABEL_DEFAULTS;

/** User overrides at either the module or the root level. */
export type LabelOverrides = Partial<Record<LabelKey, string>>;

/** Named values for `{placeholder}` slots. */
export type LabelParams = Record<string, string | number>;

/**
 * Replace every `{key}` slot from `params`. Unknown placeholders are left
 * intact (never throws, never emits `undefined`).
 */
export function interpolate(template: string, params?: LabelParams): string {
  if (!params) return template;
  let out = template;
  for (const key in params) {
    out = out.replaceAll(`{${key}}`, String(params[key]));
  }
  return out;
}

export type LabelSources = {
  module?: LabelOverrides;
  root?: LabelOverrides;
};

/**
 * Resolve a label: `module → root → English default`, then interpolate
 * placeholders. Pure and allocation-light.
 */
export function resolveLabel(
  key: LabelKey,
  sources?: LabelSources,
  params?: LabelParams,
): string {
  const template =
    sources?.module?.[key] ?? sources?.root?.[key] ?? LABEL_DEFAULTS[key];
  return interpolate(template, params);
}

/**
 * Bind a set of root overrides once (e.g. at `<Calendar>`), returning a
 * resolver that modules call with their own optional overrides. Keeps the
 * module → root → fallback chain without threading both objects everywhere.
 */
export function createLabelResolver(root?: LabelOverrides) {
  return (
    key: LabelKey,
    params?: LabelParams,
    module?: LabelOverrides,
  ): string => resolveLabel(key, { module, root }, params);
}
