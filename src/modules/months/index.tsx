import React, { useMemo } from "react";
import styles from "./months.module.css";
import { useConfig, useNavigation } from "react-calendar-datetime";
import { getMonthListData, setMonth } from "@/utils/date-utils";
import shared from "@/global/global.module.css";

interface CalendarMonthGridProps {
  shortMonths?: boolean;
  col?: number | string;
}

export const CalendarMonthGrid: React.FC<CalendarMonthGridProps> = ({
  shortMonths = true,
  col,
}) => {
  const { locale, minDate, maxDate } = useConfig();
  const { viewDate, navigateTo } = useNavigation();

  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  const mNames = useMemo(
    () => getMonthListData(locale, currentYear, minDate, maxDate, shortMonths),
    [locale, currentYear, minDate, maxDate, shortMonths],
  );

  const handleClick = (i: number) => navigateTo(setMonth(viewDate, i));

  return (
    <div className={styles.monthsContainer} data-area="months" style={col !== undefined ? { gridColumn: typeof col === "number" ? `span ${col}` : col } : undefined}>
      {mNames.map((n, i) => (
        <button
          key={i}
          type="button"
          disabled={n.disabled}
          className={[styles.item, shared.interactive, shared.hoverable, i === currentMonth ? shared.activeItem : ""]
            .filter(Boolean)
            .join(" ")}
          onClick={() => handleClick(i)}
        >
          {n.label}
        </button>
      ))}
    </div>
  );
};
