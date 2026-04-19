import React, { useMemo } from "react";
import styles from "./months.module.css";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import { getMonthListData, setMonth } from "@/utils/date-utils";
import shared from "@/global/global.module.css";

export const MonthsComponent: React.FC = () => {
  const { locale, minDate, maxDate, shortMonths } = useConfig();
  const { viewDate, navigateTo } = useNavigation();
  const date = viewDate;

  const currentMonth = date.getMonth();
  const currentYear = date.getFullYear();

  const mNames = useMemo(
    () => getMonthListData(locale, currentYear, minDate, maxDate, shortMonths ?? true),
    [locale, currentYear, minDate, maxDate, shortMonths],
  );

  const handleClick = (i: number) => navigateTo(setMonth(date, i));

  return (
    <div className={styles.monthsContainer} data-area="months" style={{ gridArea: "MM" }}>
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
