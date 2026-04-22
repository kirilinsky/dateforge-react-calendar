import React, { useMemo } from "react";
import styles from "./months.module.css";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import { getMonthListData, setMonth } from "@/utils/date-utils";
import { useGridSlot } from "@/hooks/use-grid-slot";
import shared from "@/global/global.module.css";

export interface CalendarMonthGridProps {
  shortMonths?: boolean;
  disableLimited?: boolean;
  hideLimited?: boolean;
  col?: number | string;
}

export const CalendarMonthGrid: React.FC<CalendarMonthGridProps> = ({
  shortMonths = true,
  disableLimited = true,
  hideLimited = false,
  col,
}) => {
  const { locale, minDate, maxDate, disabled } = useConfig();
  const { viewDate, navigateTo } = useNavigation();

  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  const mNames = useMemo(
    () => getMonthListData(locale, currentYear, minDate, maxDate, shortMonths, disabled, disableLimited),
    [locale, currentYear, minDate, maxDate, shortMonths, disabled, disableLimited],
  );

  const handleClick = (i: number) => navigateTo(setMonth(viewDate, i));

  return (
    <div className={styles.monthsContainer} data-area="months" style={useGridSlot(col)}>
      {mNames.map((n, i) => (
        <button
          key={i}
          type="button"
          className={[styles.item, shared.interactive, shared.hoverable, i === currentMonth ? shared.activeItem : ""]
            .filter(Boolean)
            .join(" ")}
          disabled={n.disabled || (hideLimited && n.limited)}
          style={hideLimited && n.limited ? { visibility: "hidden" } : undefined}
          onClick={() => handleClick(i)}
        >
          {n.label}
        </button>
      ))}
    </div>
  );
};
