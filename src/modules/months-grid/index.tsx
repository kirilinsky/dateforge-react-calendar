import type React from "react";
import { useMemo } from "react";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import shared from "@/global/global.module.css";
import { useRovingTileFocus } from "@/hooks/use-roving-tile-focus";
import { getMonthListData, setMonth } from "@/utils/date-utils";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { getDateTimeFormat } from "@/utils/intl-cache";
import styles from "./months-grid.module.css";

export interface CalendarMonthsGridProps {
  short?: boolean;
  disableOutOfRange?: boolean;
  hideOutOfRange?: boolean;
  col?: number | string;
  /**
   * Fires after the user clicks a month cell. Receives the navigated viewDate
   * (first day of the picked month, same year). Use this to drive a standalone
   * month-picker UX without mounting `CalendarDays`.
   */
  onMonthSelect?: (date: Date) => void;
}

export const CalendarMonthsGrid: React.FC<CalendarMonthsGridProps> = ({
  short = true,
  disableOutOfRange = true,
  hideOutOfRange = false,
  col,
  onMonthSelect,
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

  const longFmt = getDateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  });
  const gridLabel = useMemo(
    () => getDateTimeFormat(locale, { year: "numeric" }).format(viewDate),
    [locale, viewDate],
  );
  const activeIndex =
    hideOutOfRange && mNames[currentMonth]?.limited
      ? Math.max(
          0,
          mNames.findIndex((month) => !month.limited),
        )
      : currentMonth;
  const { containerRef, handleKeyDown, getItemProps } = useRovingTileFocus({
    itemCount: mNames.length,
    activeIndex,
  });

  const handleClick = (i: number) => {
    const next = setMonth(viewDate, i);
    navigateTo(next);
    onMonthSelect?.(next);
  };

  return (
    <div
      ref={containerRef}
      className={styles.monthsContainer}
      data-area="months"
      role="group"
      aria-label={`Select month, ${gridLabel}`}
      onKeyDown={handleKeyDown}
      style={getGridSlotStyle(col)}
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
            key={`${currentYear}-${n.label}`}
            type="button"
            {...getItemProps(i)}
            className={[
              styles.item,
              shared.adaptiveTile,
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
