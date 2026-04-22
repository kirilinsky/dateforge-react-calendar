import React from "react";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import { useSelectionActions } from "@/context/selection-context";
import { useUI } from "@/context/ui-context";
import { TimePopup } from "../time-popup/time-popup";
import { MonthPopup, YearPopup } from "../month-year-track/month-year-track";
import styles from "./layout.module.css";

export const CalendarLayout: React.FC<{
  appearanceKey?: string;
  customAppearanceVars?: React.CSSProperties;
  cols?: number;
  modules?: React.ReactNode;
}> = ({ appearanceKey, customAppearanceVars, cols, modules }) => {
  const { hour12, locale, minDate, maxDate, gradient } = useConfig();
  const { viewDate: date, navigateTo } = useNavigation();
  const { onChangeTime } = useSelectionActions();
  const {
    dark, showTimePopup, setShowTimePopup,
    showMonthPopup, setShowMonthPopup,
    showYearPopup, setShowYearPopup,
  } = useUI();

  const containerStyle: React.CSSProperties = {
    ...customAppearanceVars,
    gridTemplateColumns: `repeat(${cols ?? 1}, 1fr)`,
    gridAutoFlow: "dense",
  };

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
      style={containerStyle}
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
      {modules}
    </div>
  );
};
