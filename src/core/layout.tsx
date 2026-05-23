import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import { useSelectionValue } from "@/context/selection-context";
import { useUI } from "@/context/ui-context";
import { getDateTimeFormat } from "@/utils/intl-cache";
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

  const monthFmt = getDateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  });
  const dateFmt = getDateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
  customAppearanceVars?: React.CSSProperties;
  cols?: number;
  modules?: React.ReactNode;
}> = ({ customAppearanceVars, cols, modules }) => {
  const { gradient } = useConfig();
  const { containerRef } = useUI();

  const containerStyle: React.CSSProperties = {
    ...customAppearanceVars,
    gridTemplateColumns: `repeat(${cols ?? 1}, 1fr)`,
    gridAutoFlow: "dense",
  };

  return (
    <div
      ref={containerRef}
      className={[styles.calendarContainer, gradient ? styles.gradient : ""]
        .filter(Boolean)
        .join(" ")}
      style={containerStyle}
    >
      <CalendarAnnouncer />
      {modules ?? (
        <div className={styles.emptyState}>
          <span className={styles.emptyStateTitle}>No modules</span>
          <span className={styles.emptyStateHint}>
            Add modules like <code>&lt;CalendarDays /&gt;</code> or{" "}
            <code>&lt;CalendarToolbar /&gt;</code> as children of{" "}
            <code>&lt;Calendar /&gt;</code>
          </span>
        </div>
      )}
    </div>
  );
};
