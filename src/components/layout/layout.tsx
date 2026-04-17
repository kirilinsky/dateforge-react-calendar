import { DaysComponent } from "../days/days";
import { HeaderComponent } from "../header/header";
import { MonthsComponent } from "../months/months";
import { PresetsComponent } from "../presets/presets";
import { SelectedDatesComponent } from "../selected-dates/selected-dates";
import { useCalendarContext } from "../provider/provider";
import { TimeComponent } from "../time/time";
import { TimePopup } from "../time-popup/time-popup";
import { MonthPopup, YearPopup } from "../month-year-track/month-year-track";
import { getTwoMonthsNarrowThreshold } from "@/helpers/get-grid-layout";
import styles from "./layout.module.css";

export const CalendarLayout: React.FC<{
  containerStyle: React.CSSProperties;
  brutalism: boolean;
}> = ({ containerStyle, brutalism }) => {
  const {
    presets,
    years,
    months,
    compactMonths,
    compactYears,
    monthsGrid,
    timeGrid,
    time,
    gradient,
    dark,
    showTimePopup,
    setShowTimePopup,
    showMonthPopup,
    setShowMonthPopup,
    showYearPopup,
    setShowYearPopup,
    date,
    onChangeTime,
    navigateTo,
    hour12,
    gestures,
    locale,
    shortMonths,
    startDate,
    endDate,
    selectedDates,
    showSelectedDates,
    twoMonthsLayout,
    monthsColumn,
    containerWidth,
  } = useCalendarContext();

  const nextMonthDate = twoMonthsLayout
    ? new Date(date.getFullYear(), date.getMonth() + 1, 1)
    : null;

  const twoMonthsStacked =
    !!twoMonthsLayout &&
    (!!monthsColumn ||
      (containerWidth > 0 &&
        containerWidth <
          getTwoMonthsNarrowThreshold({ monthsGrid, timeGrid })));

  const nextMonthLabel = nextMonthDate
    ? new Intl.DateTimeFormat(locale, {
        month: shortMonths ? "short" : "long",
        year: "numeric",
      }).format(nextMonthDate)
    : null;

  const hasSelectedDates = !!showSelectedDates && selectedDates.length > 0;

  return (
    <div
      className={[
        styles.calendarContainer,
        gradient ? styles.gradient : "",
        dark ? styles.dark : "",
        brutalism ? styles.brutalism : "",
        twoMonthsLayout && !twoMonthsStacked ? styles.twoMonthsWide : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={containerStyle}
    >
      {showTimePopup && (
        <TimePopup
          date={date}
          hour12={hour12}
          gestures={gestures}
          onConfirm={(newDate) => {
            onChangeTime(newDate);
            setShowTimePopup(false);
          }}
          onClose={() => setShowTimePopup(false)}
        />
      )}
      {showMonthPopup && (
        <MonthPopup
          date={date}
          locale={locale}
          startDate={startDate}
          endDate={endDate}
          shortMonths={shortMonths}
          gestures={gestures}
          onConfirm={(newDate) => {
            navigateTo(newDate);
            setShowMonthPopup(false);
          }}
          onClose={() => setShowMonthPopup(false)}
        />
      )}
      {showYearPopup && (
        <YearPopup
          date={date}
          startDate={startDate}
          endDate={endDate}
          gestures={gestures}
          onConfirm={(newDate) => {
            navigateTo(newDate);
            setShowYearPopup(false);
          }}
          onClose={() => setShowYearPopup(false)}
        />
      )}
      {presets && <PresetsComponent />}
      {(years || compactMonths || compactYears || time || months) && (
        <HeaderComponent />
      )}
      <DaysComponent hideOtherMonths={!!twoMonthsLayout} />
      {twoMonthsStacked && nextMonthLabel && (
        <div style={{ gridArea: "LB" }} className={styles.secondMonthLabel}>
          {nextMonthLabel}
        </div>
      )}
      {nextMonthDate && (
        <DaysComponent
          dateOverride={nextMonthDate}
          gridArea="D2"
          hideOtherMonths
        />
      )}
      {monthsGrid && <MonthsComponent />}
      {timeGrid && <TimeComponent />}
      {hasSelectedDates && <SelectedDatesComponent />}
    </div>
  );
};
