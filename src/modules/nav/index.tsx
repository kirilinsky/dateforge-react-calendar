import React, { useMemo } from "react";
import styles from "./nav.module.css";
import shared from "@/global/global.module.css";
import { Clear, Down, Home, ThemeToggle } from "@/Icons";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import { useSelectionValue, useSelectionActions } from "@/context/selection-context";
import { useUI } from "@/context/ui-context";
import {
  addDate,
  checkYearNavigation,
  getTimeString,
  isYearFixed,
} from "@/utils/date-utils";
import { useGridSlot } from "@/hooks/use-grid-slot";

export interface CalendarNavProps {
  showTime?: boolean;
  showMonthPicker?: boolean;
  compactMonths?: boolean;
  showYearPicker?: boolean;
  compactYears?: boolean;
  showSelectedMonthLabel?: boolean;
  showSelectedYearLabel?: boolean;
  showHome?: boolean;
  showClear?: boolean;
  showThemeToggle?: boolean;
  label?: string;
  col?: number | string;
}

export const CalendarNav: React.FC<CalendarNavProps> = ({
  showTime = false,
  showMonthPicker = false,
  compactMonths = false,
  showYearPicker = false,
  compactYears = false,
  showSelectedMonthLabel = false,
  showSelectedYearLabel = false,
  showHome = false,
  showClear = false,
  showThemeToggle = false,
  label,
  col,
}) => {
  const { minDate, maxDate, locale, hour12, disabled } = useConfig();
  const { viewDate: date, navigateTo } = useNavigation();
  const { selectedDates } = useSelectionValue();
  const { onChangeDate } = useSelectionActions();
  const { setShowTimePopup, setShowMonthPopup, setShowYearPopup, toggleTheme } =
    useUI();

  const today = new Date();
  const isCurrentMonth =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth();

  const cur = date.getFullYear();
  const curTime = getTimeString(date, hour12);

  const yearFixed = useMemo(
    () => isYearFixed(cur, minDate, maxDate),
    [cur, minDate, maxDate],
  );
  const monthFixed = useMemo(
    () => isYearFixed(cur, minDate, maxDate, date.getMonth()),
    [minDate, maxDate, date],
  );

  const { canGoPrev, canGoNext, canGoPrevMonth, canGoNextMonth } = useMemo(
    () => checkYearNavigation(cur, minDate, maxDate, date, disabled),
    [cur, date, minDate, maxDate, disabled],
  );

  const monthNameLong = new Intl.DateTimeFormat(locale, {
    month: "long",
  }).format(date);
  const monthNameShort = new Intl.DateTimeFormat(locale, {
    month: "short",
  }).format(date);

  const ch = (v: number) =>
    navigateTo(addDate(date, v, "year", minDate, maxDate));
  const cm = (v: number) =>
    navigateTo(addDate(date, v, "month", minDate, maxDate));

  const visible =
    !!label ||
    showTime ||
    compactMonths ||
    showMonthPicker ||
    showYearPicker ||
    compactYears ||
    showSelectedMonthLabel ||
    showSelectedYearLabel ||
    showHome ||
    showClear ||
    showThemeToggle;

  if (!visible) return null;

  return (
    <div
      className={styles.headerContainer}
      data-area="header"
      style={useGridSlot(col)}
    >
      {showTime && (
        <button
          className={`${styles.timeButton} ${shared.interactive}`}
          onClick={() => setShowTimePopup(true)}
        >
          {curTime}
        </button>
      )}

      {compactMonths && (
        <button
          disabled={monthFixed}
          className={`${styles.monthButton} ${shared.interactive}`}
          onClick={() => setShowMonthPopup(true)}
        >
          <Down /> <span className={styles.monthNameLong}>{monthNameLong}</span>
          <span className={styles.monthNameShort}>{monthNameShort}</span>
        </button>
      )}

      {label && <span className={styles.label}>{label}</span>}

      {showMonthPicker && (
        <div className={styles.yearsSelector}>
          {canGoPrevMonth && (
            <button
              className={`${styles.arrow} ${shared.interactive} ${shared.hoverable}`}
              onClick={() => cm(-1)}
            >
              ‹
            </button>
          )}
          <button
            onClick={() => !monthFixed && setShowMonthPopup(true)}
            className={`${styles.currentYear} ${shared.interactive} ${shared.hoverable} ${monthFixed ? styles.staticButton : ""}`}
          >
            <span className={styles.monthNameLong}>{monthNameLong}</span>
            <span className={styles.monthNameShort}>{monthNameShort}</span>
          </button>
          {canGoNextMonth && (
            <button
              className={`${styles.arrow} ${shared.interactive} ${shared.hoverable}`}
              onClick={() => cm(1)}
            >
              ›
            </button>
          )}
        </div>
      )}

      {showYearPicker && (
        <div className={styles.yearsSelector}>
          {canGoPrev && (
            <button
              className={`${styles.arrow} ${shared.interactive} ${shared.hoverable}`}
              onClick={() => ch(-1)}
            >
              ‹
            </button>
          )}
          <button
            onClick={() => !yearFixed && setShowYearPopup(true)}
            className={`${styles.currentYear} ${shared.interactive} ${shared.hoverable} ${yearFixed ? styles.staticButton : ""}`}
          >
            {cur}
          </button>
          {canGoNext && (
            <button
              className={`${styles.arrow} ${shared.interactive} ${shared.hoverable}`}
              onClick={() => ch(1)}
            >
              ›
            </button>
          )}
        </div>
      )}

      {compactYears && (
        <button
          className={`${styles.monthButton} ${shared.interactive}`}
          onClick={() => setShowYearPopup(true)}
        >
          {cur} <Down />
        </button>
      )}

      {showSelectedMonthLabel && (
        <span className={styles.label}>
          <span className={styles.monthNameLong}>{monthNameLong}</span>
          <span className={styles.monthNameShort}>{monthNameShort}</span>
        </span>
      )}

      {showSelectedYearLabel && <span className={styles.label}>{cur}</span>}

      <div className={styles.flexWrapper}>
        {showThemeToggle && (
          <button
            className={`${styles.homeButton} ${shared.interactive} ${shared.hoverable}`}
            onClick={toggleTheme}
          >
            <ThemeToggle />
          </button>
        )}
        {showHome && (
          <button
            className={`${styles.homeButton} ${shared.interactive} ${shared.hoverable} ${isCurrentMonth ? styles.homeButtonDisabled : ""}`}
            disabled={isCurrentMonth}
            onClick={() =>
              navigateTo(
                new Date(
                  today.getFullYear(),
                  today.getMonth(),
                  1,
                  date.getHours(),
                  date.getMinutes(),
                  date.getSeconds(),
                  date.getMilliseconds(),
                ),
              )
            }
          >
            <Home />
          </button>
        )}
        {showClear && (
          <button
            className={`${styles.homeButton} ${shared.interactive} ${shared.hoverable} ${selectedDates.length === 0 ? styles.homeButtonDisabled : ""}`}
            disabled={selectedDates.length === 0}
            onClick={() => onChangeDate(null)}
          >
            <Clear />
          </button>
        )}
      </div>
    </div>
  );
};
