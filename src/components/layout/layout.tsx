import React, { useEffect, useMemo, useRef, useState } from "react";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import { useSelectionActions, useSelectionValue } from "@/context/selection-context";
import { useUI } from "@/context/ui-context";
import { TimePopup } from "../time-popup/time-popup";
import { MonthPopup, YearPopup } from "../month-year-track/month-year-track";
import styles from "./layout.module.css";

const SR_ONLY: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
};

const CalendarAnnouncer: React.FC = () => {
  const { locale } = useConfig();
  const { viewDate } = useNavigation();
  const { selectedDates } = useSelectionValue();
  const [announcement, setAnnouncement] = useState("");
  const mountedRef = useRef(false);

  const monthFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
    [locale],
  );
  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    [locale],
  );

  useEffect(() => {
    if (!mountedRef.current) return;
    setAnnouncement(monthFmt.format(viewDate));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewDate.getFullYear(), viewDate.getMonth(), monthFmt]);

  const lastSelectedT = selectedDates[selectedDates.length - 1]?.getTime();
  useEffect(() => {
    if (!mountedRef.current || !lastSelectedT) return;
    setAnnouncement(dateFmt.format(new Date(lastSelectedT)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSelectedT, dateFmt]);

  useEffect(() => {
    mountedRef.current = true;
  }, []);

  return (
    <div role="status" aria-live="polite" aria-atomic="true" style={SR_ONLY}>
      {announcement}
    </div>
  );
};

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
    navShowSeconds,
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
          showSeconds={navShowSeconds}
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
      <CalendarAnnouncer />
      {modules ?? (
        <div className={styles.emptyState}>
          <span className={styles.emptyStateTitle}>No modules</span>
          <span className={styles.emptyStateHint}>
            Add modules like <code>&lt;CalendarDays /&gt;</code> or <code>&lt;CalendarNav /&gt;</code> as children of <code>&lt;Calendar /&gt;</code>
          </span>
        </div>
      )}
    </div>
  );
};
