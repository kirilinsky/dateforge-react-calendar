import type React from "react";
import {
  CalendarToolbar,
  CalendarToolbarApply,
  CalendarToolbarClear,
  CalendarToolbarClock,
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
import type { ApplyValue } from "@/modules/toolbar/apply";
import type { CalendarTheme } from "@/types/themes";

export interface TestToolbarProps {
  apply?: boolean;
  applyLabel?: string;
  onApply?: (value: ApplyValue) => void;
  bound?: "from" | "to";
  calendarNavigationLabel?: string;
  changeMonthLabel?: string;
  changeTimeLabel?: string;
  changeYearLabel?: string;
  clear?: boolean;
  clearLabel?: string;
  col?: number | string;
  compactMonths?: boolean;
  compactTime?: boolean;
  compactYears?: boolean;
  confirmLabel?: string;
  home?: boolean;
  homeLabel?: string;
  label?: React.ReactNode;
  monthLabel?: boolean;
  offset?: number;
  seconds?: boolean;
  selectMonthLabel?: string;
  selectTimeLabel?: string;
  selectYearLabel?: string;
  showMonthPicker?: boolean;
  showNowTime?: boolean;
  showTime?: boolean;
  showYearPicker?: boolean;
  theme?: CalendarTheme;
  themeToggle?: boolean;
  yearLabel?: boolean;
}

export const TestToolbar: React.FC<TestToolbarProps> = ({
  apply,
  applyLabel,
  onApply,
  bound,
  calendarNavigationLabel,
  changeMonthLabel,
  changeTimeLabel,
  changeYearLabel,
  clear,
  clearLabel,
  col,
  compactMonths,
  compactTime,
  compactYears,
  confirmLabel,
  home,
  homeLabel,
  label,
  monthLabel,
  offset,
  seconds,
  selectMonthLabel,
  selectTimeLabel,
  selectYearLabel,
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
    apply ||
    themeToggle;

  return (
    <CalendarToolbar
      bound={bound}
      calendarNavigationLabel={calendarNavigationLabel}
      col={col}
      offset={offset}
      theme={theme}
    >
      {label && <CalendarToolbarLabel>{label}</CalendarToolbarLabel>}

      {!hasAnyContent && (
        <>
          <CalendarToolbarPrev />
          <CalendarToolbarMonthLabel />
          <CalendarToolbarYearLabel />
          <CalendarToolbarNext />
        </>
      )}

      {showNowTime && <CalendarToolbarClock seconds={seconds} />}
      {showTime && (
        <CalendarToolbarTime
          changeTimeLabel={changeTimeLabel}
          confirmLabel={confirmLabel}
          seconds={seconds}
          selectTimeLabel={selectTimeLabel}
        />
      )}
      {compactTime && (
        <CalendarToolbarTime
          changeTimeLabel={changeTimeLabel}
          compact
          confirmLabel={confirmLabel}
          seconds={seconds}
          selectTimeLabel={selectTimeLabel}
        />
      )}

      {showMonthPicker && (
        <>
          <CalendarToolbarPrev />
          <CalendarToolbarMonthTrigger
            changeMonthLabel={changeMonthLabel}
            confirmLabel={confirmLabel}
            selectMonthLabel={selectMonthLabel}
          />
          <CalendarToolbarNext />
        </>
      )}
      {compactMonths && (
        <CalendarToolbarMonthTrigger
          changeMonthLabel={changeMonthLabel}
          compact
          confirmLabel={confirmLabel}
          selectMonthLabel={selectMonthLabel}
        />
      )}
      {monthLabel && <CalendarToolbarMonthLabel />}

      {showYearPicker && (
        <>
          <CalendarToolbarPrev unit="year" />
          <CalendarToolbarYearTrigger
            changeYearLabel={changeYearLabel}
            confirmLabel={confirmLabel}
            selectYearLabel={selectYearLabel}
          />
          <CalendarToolbarNext unit="year" />
        </>
      )}
      {compactYears && (
        <CalendarToolbarYearTrigger
          changeYearLabel={changeYearLabel}
          compact
          confirmLabel={confirmLabel}
          selectYearLabel={selectYearLabel}
        />
      )}
      {yearLabel && <CalendarToolbarYearLabel />}

      {themeToggle && <CalendarToolbarThemeToggle />}
      {home && <CalendarToolbarHome homeLabel={homeLabel} />}
      {clear && <CalendarToolbarClear clearLabel={clearLabel} />}
      {apply && (
        <CalendarToolbarApply applyLabel={applyLabel} onApply={onApply} />
      )}
    </CalendarToolbar>
  );
};
