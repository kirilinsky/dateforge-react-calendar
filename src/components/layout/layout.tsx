import React from "react";
import { DaysComponent } from "../days/days";
import { HeaderComponent } from "../header/header";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import { useSelection } from "@/context/selection-context";
import { useUI } from "@/context/ui-context";
import { TimePopup } from "../time-popup/time-popup";
import { MonthPopup, YearPopup } from "../month-year-track/month-year-track";
import styles from "./layout.module.css";

const TWO_MONTHS_NARROW_THRESHOLD = 680;

export const CalendarLayout: React.FC<{
  appearanceKey?: string;
  customAppearanceVars?: React.CSSProperties;
  modules?: React.ReactNode;
}> = ({ appearanceKey, customAppearanceVars, modules }) => {
  const {
    showYearPicker, months, compactMonths, compactYears,
    twoMonthsLayout, monthsColumn,
    hour12, locale, minDate, maxDate, gradient,
  } = useConfig();
  const { viewDate: date, navigateTo } = useNavigation();
  const { onChangeTime } = useSelection();
  const {
    dark, showTimePopup, setShowTimePopup,
    showMonthPopup, setShowMonthPopup,
    showYearPopup, setShowYearPopup,
    containerWidth,
  } = useUI();

  const nextMonthDate = twoMonthsLayout
    ? new Date(date.getFullYear(), date.getMonth() + 1, 1)
    : null;

  const twoMonthsStacked =
    !!twoMonthsLayout &&
    (!!monthsColumn ||
      (containerWidth > 0 && containerWidth < TWO_MONTHS_NARROW_THRESHOLD));

  const nextMonthLabel = nextMonthDate
    ? new Intl.DateTimeFormat(locale, {
        month: "short",
        year: "numeric",
      }).format(nextMonthDate)
    : null;

  return (
    <div
      className={[
        styles.calendarContainer,
        gradient ? styles.gradient : "",
        dark ? styles.dark : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-appearance={appearanceKey}
      data-stacked={twoMonthsStacked || undefined}
      style={customAppearanceVars}
    >
      {showTimePopup && (
        <TimePopup
          date={date}
          hour12={hour12}
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
          minDate={minDate}
          maxDate={maxDate}
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
          minDate={minDate}
          maxDate={maxDate}
          onConfirm={(newDate) => {
            navigateTo(newDate);
            setShowYearPopup(false);
          }}
          onClose={() => setShowYearPopup(false)}
        />
      )}
      {(showYearPicker || compactMonths || compactYears || months) && (
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
          dataArea="days-2"
        />
      )}
      {modules}
    </div>
  );
};
