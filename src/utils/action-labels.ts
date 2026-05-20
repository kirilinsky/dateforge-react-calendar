export const DEFAULT_APPLY_LABEL = "Apply";
export const DEFAULT_CALENDAR_NAVIGATION_LABEL = "Calendar navigation";
export const DEFAULT_CHANGE_MONTH_LABEL = "Change month, currently {month}";
export const DEFAULT_CHANGE_TIME_LABEL = "Change time, currently {time}";
export const DEFAULT_CHANGE_YEAR_LABEL = "Change year, currently {year}";
export const DEFAULT_CLEAR_LABEL = "Clear";
export const DEFAULT_CONFIRM_LABEL = "Confirm";
export const DEFAULT_DAY_TRACK_LABEL = "Day";
export const DEFAULT_HOME_LABEL = "Go to current month";
export const DEFAULT_HOURS_LABEL = "Hours";
export const DEFAULT_MINUTES_LABEL = "Minutes";
export const DEFAULT_MONTH_GRID_LABEL = "Select month, {year}";
export const DEFAULT_MONTH_PICKER_LABEL = "Month picker";
export const DEFAULT_MONTH_TRACK_LABEL = "Month";
export const DEFAULT_NEXT_MONTH_LABEL = "Next month";
export const DEFAULT_NEXT_YEAR_LABEL = "Next year";
export const DEFAULT_NEXT_YEARS_LABEL = "Next years";
export const DEFAULT_PREVIOUS_MONTH_LABEL = "Previous month";
export const DEFAULT_PREVIOUS_YEAR_LABEL = "Previous year";
export const DEFAULT_PREVIOUS_YEARS_LABEL = "Previous years";
export const DEFAULT_REMOVE_LABEL = "Remove";
export const DEFAULT_REMOVE_RANGE_END_LABEL = "Remove range end";
export const DEFAULT_REMOVE_RANGE_START_LABEL = "Remove range start";
export const DEFAULT_REMOVE_SELECTED_DATE_LABEL = "Remove selected date";
export const DEFAULT_RESET_TIME_LABEL = "Reset to {time}";
export const DEFAULT_RESET_MONTH_LABEL = "Reset to {month}";
export const DEFAULT_RESET_YEAR_LABEL = "Reset to {year}";
export const DEFAULT_SAVE_SELECTED_DATE_LABEL = "Save selected date";
export const DEFAULT_SECONDS_LABEL = "Seconds";
export const DEFAULT_SELECT_MONTH_LABEL = "Select month";
export const DEFAULT_SELECT_TIME_LABEL = "Select time";
export const DEFAULT_SELECT_YEAR_LABEL = "Select year";
export const DEFAULT_SHOW_MORE_SELECTED_DATES_LABEL =
  "Show {count} more selected dates";
export const DEFAULT_THEME_SWITCH_TO_DARK_LABEL = "Switch to dark mode";
export const DEFAULT_THEME_SWITCH_TO_LIGHT_LABEL = "Switch to light mode";
export const DEFAULT_THEME_TOGGLE_LABEL = "Toggle theme";
export const DEFAULT_TIME_PERIOD_LABEL = "Time period, currently {period}";
export const DEFAULT_TIME_PICKER_LABEL = "Time picker";
export const DEFAULT_WEEK_LABEL = "Week";
export const DEFAULT_YEAR_GRID_LABEL = "Select year, showing {from} to {to}";
export const DEFAULT_YEAR_PAGE_NAVIGATION_LABEL = "Year page navigation";
export const DEFAULT_YEAR_PICKER_LABEL = "Year picker";
export const DEFAULT_YEAR_TRACK_LABEL = "Year";

export const resolveActionLabel = (
  moduleLabel: string | undefined,
  globalLabel: string | undefined,
  fallback: string,
): string => moduleLabel ?? globalLabel ?? fallback;

export const formatActionLabel = (
  template: string,
  key: string,
  value: string | number,
): string => template.replaceAll(`{${key}}`, String(value));
