import type React from "react";
import { useMemo } from "react";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import shared from "@/global/global.module.css";
import { useGridSlot } from "@/hooks/use-grid-slot";
import { getMonthListData, setMonth } from "@/utils/date-utils";
import styles from "./months-grid.module.css";

export interface CalendarMonthsGridProps {
  short?: boolean;
  disableOutOfRange?: boolean;
  hideOutOfRange?: boolean;
  col?: number | string;
}

export const CalendarMonthsGrid: React.FC<CalendarMonthsGridProps> = ({
  short = true,
  disableOutOfRange = true,
  hideOutOfRange = false,
  col,
}) => {
  const { locale, minDate, maxDate, disabled } = useConfig();
  const { viewDate, navigateTo } = useNavigation();

  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  const mNames = useMemo(
    () =>
      getMonthListData(
        locale,
        currentYear,
        minDate,
        maxDate,
        short,
        disabled,
        disableOutOfRange,
      ),
    [locale, currentYear, minDate, maxDate, short, disabled, disableOutOfRange],
  );

  const longFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
    [locale],
  );
  const gridLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { year: "numeric" }).format(viewDate),
    [locale, viewDate],
  );

  const handleClick = (i: number) => navigateTo(setMonth(viewDate, i));

  return (
    <div
      className={styles.monthsContainer}
      data-area="months"
      role="group"
      aria-label={`Select month, ${gridLabel}`}
      style={useGridSlot(col)}
    >
      {mNames.map((n, i) => {
        const isCurrent = i === currentMonth;
        const isHidden = hideOutOfRange && n.limited;
        const isDisabled = n.disabled || isHidden;
        const fullLabel =
          longFmt.format(new Date(currentYear, i, 1)) +
          (isDisabled && !isHidden ? ", limited" : "");
        return (
          <button
            key={i}
            type="button"
            className={[
              styles.item,
              shared.interactive,
              shared.hovered,
              isCurrent ? shared.activeItem : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={fullLabel}
            aria-current={isCurrent ? "true" : undefined}
            aria-disabled={isDisabled || undefined}
            aria-hidden={isHidden || undefined}
            style={isHidden ? { visibility: "hidden" } : undefined}
            onClick={() => !isDisabled && handleClick(i)}
          >
            {n.label}
          </button>
        );
      })}
    </div>
  );
};
