import React, { useMemo } from "react";
import styles from "./header.module.css";
import { Clear, Down, Home, ThemeToggle } from "@/Icons";
import { useCalendarContext } from "../provider/provider";
import {
  addDate,
  checkYearNavigation,
  getTimeString,
  isYearFixed,
} from "@/utils/date-utils";
import { getTwoMonthsNarrowThreshold } from "@/helpers/get-grid-layout";

export const HeaderComponent: React.FC = () => {
  const {
    navigateTo,
    compactMonths,
    compactYears,
    startDate,
    endDate,
    years,
    months,
    date,
    time,
    locale,
    hour12,
    setShowTimePopup,
    setShowMonthPopup,
    setShowYearPopup,
    shortMonths,
    disabled,
    twoMonthsLayout,
    monthsColumn,
    monthsGrid,
    timeGrid,
    containerWidth,
    showHomeButton,
    showClearButton,
    showThemeToggle,
    toggleTheme,
    selectedDates,
    onChangeDate,
  } = useCalendarContext();

  const twoMonthsStacked =
    !!twoMonthsLayout &&
    (!!monthsColumn ||
      (containerWidth > 0 &&
        containerWidth <
          getTwoMonthsNarrowThreshold({ monthsGrid, timeGrid })));

  const today = new Date();
  const isCurrentMonth =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth();

  const cur = date.getFullYear();
  const curTime = getTimeString(date, hour12);

  const yearFixed = useMemo(
    () => isYearFixed(cur, startDate, endDate),
    [cur, startDate, endDate],
  );
  const monthFixed = useMemo(
    () => isYearFixed(cur, startDate, endDate, date.getMonth()),
    [startDate, endDate, date],
  );

  const { canGoPrev, canGoNext, canGoPrevMonth, canGoNextMonth } = useMemo(
    () => checkYearNavigation(cur, startDate, endDate, date, disabled),
    [cur, date, startDate, endDate, disabled],
  );

  const monthFormat = shortMonths ? "short" : "long";
  const currentMonthName = new Intl.DateTimeFormat(locale, {
    month: monthFormat,
  }).format(date);

  const nextMonthDate = useMemo(
    () => new Date(date.getFullYear(), date.getMonth() + 1, 1),
    [date],
  );
  const nextMonthName = new Intl.DateTimeFormat(locale, {
    month: monthFormat,
  }).format(nextMonthDate);
  const nextMonthYear = nextMonthDate.getFullYear();

  const ch = (v: number) =>
    navigateTo(addDate(date, v, "year", startDate, endDate));
  const cm = (v: number) =>
    navigateTo(addDate(date, v, "month", startDate, endDate));
  return (
    <div
      className={[
        styles.headerContainer,
        twoMonthsLayout && styles.twoMonthsHeader,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ gridArea: "HH" }}
    >
      {time && (
        <button
          className={styles.timeButton}
          onClick={() => setShowTimePopup(true)}
        >
          {curTime}
        </button>
      )}

      {compactMonths && (
        <button
          disabled={monthFixed}
          className={styles.monthButton}
          onClick={() => setShowMonthPopup(true)}
        >
          <Down /> {currentMonthName}
          {twoMonthsLayout ? ` — ${nextMonthName}` : ""}
        </button>
      )}

      {months && (!twoMonthsLayout || twoMonthsStacked) && (
        <div className={styles.yearsSelector}>
          {canGoPrevMonth && (
            <button className={styles.arrow} onClick={() => cm(-1)}>
              ‹
            </button>
          )}
          <button
            onClick={() => !monthFixed && setShowMonthPopup(true)}
            className={`${styles.currentYear} ${monthFixed ? styles.staticButton : ""}`}
          >
            {currentMonthName}
          </button>
          {canGoNextMonth && (
            <button className={styles.arrow} onClick={() => cm(1)}>
              ›
            </button>
          )}
        </div>
      )}

      {months && twoMonthsLayout && !twoMonthsStacked && (
        <div className={`${styles.yearsSelector} ${styles.twoMonthsSelector}`}>
          {canGoPrevMonth && (
            <button className={styles.arrow} onClick={() => cm(-1)}>
              ‹
            </button>
          )}
          <button
            onClick={() => !monthFixed && setShowMonthPopup(true)}
            className={`${styles.currentYear} ${monthFixed ? styles.staticButton : ""}`}
          >
            {currentMonthName} {cur}
          </button>
          <button className={`${styles.currentYear} ${styles.staticButton}`}>
            {nextMonthName} {nextMonthYear}
          </button>
          {canGoNextMonth && (
            <button className={styles.arrow} onClick={() => cm(1)}>
              ›
            </button>
          )}
        </div>
      )}

      {years && (
        <div className={styles.yearsSelector}>
          {canGoPrev && (
            <button className={styles.arrow} onClick={() => ch(-1)}>
              ‹
            </button>
          )}
          <button
            onClick={() => !yearFixed && setShowYearPopup(true)}
            className={`${styles.currentYear} ${yearFixed ? styles.staticButton : ""}`}
          >
            {cur}
          </button>
          {canGoNext && (
            <button className={styles.arrow} onClick={() => ch(1)}>
              ›
            </button>
          )}
        </div>
      )}

      {compactYears && (
        <button
          className={styles.monthButton}
          onClick={() => setShowYearPopup(true)}
        >
          {cur} <Down />
        </button>
      )}
      <div className={styles.flexWrapper}>
        {showThemeToggle && (
          <button className={styles.homeButton} onClick={toggleTheme}>
            <ThemeToggle />
          </button>
        )}
        {showHomeButton && (
          <button
            className={`${styles.homeButton} ${isCurrentMonth ? styles.homeButtonDisabled : ""}`}
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
        {showClearButton && (
          <button
            className={`${styles.homeButton} ${selectedDates.length === 0 ? styles.homeButtonDisabled : ""}`}
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
