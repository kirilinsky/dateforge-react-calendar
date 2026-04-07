import React, { useMemo } from "react";
import styles from "./months.module.css";
import { useCalendarContext } from "../provider/provider";
import { getMonthListData, setMonth } from "@/utils/date-utils";
import shared from "@/global/global.module.css";

export const MonthsComponent: React.FC = () => {
  const { navigateTo, locale, date, startDate, endDate, shortMonths } =
    useCalendarContext();

  const currentMonth = date.getMonth();
  const currentYear = date.getFullYear();

  const mNames = useMemo(
    () => getMonthListData(locale, currentYear, startDate, endDate, shortMonths ?? true),
    [locale, currentYear, startDate, endDate, shortMonths],
  );

  const handleClick = (i: number) => navigateTo(setMonth(date, i));

  return (
    <div className={styles.monthsContainer} style={{ gridArea: "MM" }}>
      {mNames.map((n, i) => (
        <button
          key={i}
          type="button"
          disabled={n.disabled}
          className={[styles.item, i === currentMonth ? shared.activeItem : ""]
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
