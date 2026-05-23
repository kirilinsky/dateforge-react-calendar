import type React from "react";
import {
  CalendarToolbar,
  CalendarToolbarClear,
  CalendarToolbarClock,
  CalendarToolbarGroup,
  CalendarToolbarHome,
  CalendarToolbarLabel,
  CalendarToolbarMonthLabel,
  CalendarToolbarMonthTrigger,
  CalendarToolbarNext,
  CalendarToolbarPrev,
  CalendarToolbarThemeToggle,
  CalendarToolbarTime,
  CalendarToolbarYearLabel,
  CalendarToolbarYearTrigger,
} from "@/modules/toolbar";
import type { CalendarTheme } from "@/types/themes";

export interface StoryToolbarProps {
  bound?: "from" | "to";
  clear?: boolean;
  col?: number | string;
  compactMonths?: boolean;
  compactTime?: boolean;
  compactYears?: boolean;
  home?: boolean;
  label?: React.ReactNode;
  monthLabel?: boolean;
  offset?: number;
  seconds?: boolean;
  showMonthPicker?: boolean;
  showNowTime?: boolean;
  showTime?: boolean;
  showYearPicker?: boolean;
  theme?: CalendarTheme;
  themeToggle?: boolean;
  yearLabel?: boolean;
}

export const StoryToolbar: React.FC<StoryToolbarProps> = ({
  bound,
  clear,
  col,
  compactMonths,
  compactTime,
  compactYears,
  home,
  label,
  monthLabel,
  offset,
  seconds,
  showMonthPicker,
  showNowTime,
  showTime,
  showYearPicker,
  theme,
  themeToggle,
  yearLabel,
}) => {
  const hasExplicitDateControls =
    showMonthPicker ||
    compactMonths ||
    showYearPicker ||
    compactYears ||
    monthLabel ||
    yearLabel;
  const hasAnyContent =
    hasExplicitDateControls ||
    label ||
    showTime ||
    compactTime ||
    showNowTime ||
    home ||
    clear ||
    themeToggle;
  const hasActions = home || clear || themeToggle;

  return (
    <CalendarToolbar bound={bound} col={col} offset={offset} theme={theme}>
      {label && <CalendarToolbarLabel>{label}</CalendarToolbarLabel>}

      {!hasAnyContent && (
        <CalendarToolbarGroup>
          <CalendarToolbarPrev />
          <CalendarToolbarMonthLabel />
          <CalendarToolbarYearLabel />
          <CalendarToolbarNext />
        </CalendarToolbarGroup>
      )}

      {showNowTime && <CalendarToolbarClock seconds={seconds} />}
      {showTime && <CalendarToolbarTime seconds={seconds} />}
      {compactTime && <CalendarToolbarTime compact seconds={seconds} />}

      {showMonthPicker && (
        <CalendarToolbarGroup>
          <CalendarToolbarPrev />
          <CalendarToolbarMonthTrigger />
          <CalendarToolbarNext />
        </CalendarToolbarGroup>
      )}

      {showYearPicker && (
        <CalendarToolbarGroup>
          <CalendarToolbarPrev unit="year" />
          <CalendarToolbarYearTrigger />
          <CalendarToolbarNext unit="year" />
        </CalendarToolbarGroup>
      )}

      {(compactMonths || compactYears) && (
        <CalendarToolbarGroup>
          {compactMonths && <CalendarToolbarMonthTrigger compact />}
          {compactYears && <CalendarToolbarYearTrigger compact />}
        </CalendarToolbarGroup>
      )}

      {(monthLabel || yearLabel) && (
        <CalendarToolbarGroup>
          {monthLabel && <CalendarToolbarMonthLabel />}
          {yearLabel && <CalendarToolbarYearLabel />}
        </CalendarToolbarGroup>
      )}

      {hasActions && (
        <CalendarToolbarGroup>
          {themeToggle && <CalendarToolbarThemeToggle />}
          {home && <CalendarToolbarHome />}
          {clear && <CalendarToolbarClear />}
        </CalendarToolbarGroup>
      )}
    </CalendarToolbar>
  );
};
