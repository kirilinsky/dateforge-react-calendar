import React, { useMemo } from "react";
import styles from "./header.module.css";
import shared from "@/global/global.module.css";
import { Clear, Down, Home, ThemeToggle } from "@/Icons";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import { useSelection } from "@/context/selection-context";
import { useUI } from "@/context/ui-context";
import {
  addDate,
  checkYearNavigation,
  getTimeString,
  isYearFixed,
} from "@/utils/date-utils";

export const HeaderComponent: React.FC = () => {
  const {
    compactMonths, compactYears, minDate, maxDate, showYearPicker,
    months, time, locale, hour12, disabled,
    twoMonthsLayout, monthsColumn,
    showHomeButton, showClearButton, showThemeToggle,
  } = useConfig();
  const { viewDate: date, navigateTo } = useNavigation();
  const { selectedDates, onChangeDate } = useSelection();
  const {
    setShowTimePopup, setShowMonthPopup, setShowYearPopup,
    containerWidth, toggleTheme,
  } = useUI();

  const twoMonthsStacked =
    !!twoMonthsLayout &&
    (!!monthsColumn || (containerWidth > 0 && containerWidth < 680));

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

  const monthFormat = containerWidth > 0 && containerWidth < 260 ? "short" : "long";
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
    navigateTo(addDate(date, v, "year", minDate, maxDate));
  const cm = (v: number) =>
    navigateTo(addDate(date, v, "month", minDate, maxDate));
  return (
    <div
      className={[
        styles.headerContainer,
        twoMonthsLayout && styles.twoMonthsHeader,
      ]
        .filter(Boolean)
        .join(" ")}
      data-area="header"
      style={{ gridArea: "HH" }}
    >
      {time && (
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
          <Down /> {currentMonthName}
          {twoMonthsLayout ? ` — ${nextMonthName}` : ""}
        </button>
      )}

      {months && (!twoMonthsLayout || twoMonthsStacked) && (
        <div className={styles.yearsSelector}>
          {canGoPrevMonth && (
            <button className={`${styles.arrow} ${shared.interactive} ${shared.hoverable}`} onClick={() => cm(-1)}>
              ‹
            </button>
          )}
          <button
            onClick={() => !monthFixed && setShowMonthPopup(true)}
            className={`${styles.currentYear} ${shared.interactive} ${shared.hoverable} ${monthFixed ? styles.staticButton : ""}`}
          >
            {currentMonthName}
          </button>
          {canGoNextMonth && (
            <button className={`${styles.arrow} ${shared.interactive} ${shared.hoverable}`} onClick={() => cm(1)}>
              ›
            </button>
          )}
        </div>
      )}

      {months && twoMonthsLayout && !twoMonthsStacked && (
        <div className={`${styles.yearsSelector} ${styles.twoMonthsSelector}`}>
          {canGoPrevMonth && (
            <button className={`${styles.arrow} ${shared.interactive} ${shared.hoverable}`} onClick={() => cm(-1)}>
              ‹
            </button>
          )}
          <button
            onClick={() => !monthFixed && setShowMonthPopup(true)}
            className={`${styles.currentYear} ${shared.interactive} ${shared.hoverable} ${monthFixed ? styles.staticButton : ""}`}
          >
            {currentMonthName} {cur}
          </button>
          <button className={`${styles.currentYear} ${shared.interactive} ${shared.hoverable} ${styles.staticButton}`}>
            {nextMonthName} {nextMonthYear}
          </button>
          {canGoNextMonth && (
            <button className={`${styles.arrow} ${shared.interactive} ${shared.hoverable}`} onClick={() => cm(1)}>
              ›
            </button>
          )}
        </div>
      )}

      {showYearPicker && (
        <div className={styles.yearsSelector}>
          {canGoPrev && (
            <button className={`${styles.arrow} ${shared.interactive} ${shared.hoverable}`} onClick={() => ch(-1)}>
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
            <button className={`${styles.arrow} ${shared.interactive} ${shared.hoverable}`} onClick={() => ch(1)}>
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
      <div className={styles.flexWrapper}>
        {showThemeToggle && (
          <button className={`${styles.homeButton} ${shared.interactive} ${shared.hoverable}`} onClick={toggleTheme}>
            <ThemeToggle />
          </button>
        )}
        {showHomeButton && (
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
        {showClearButton && (
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
