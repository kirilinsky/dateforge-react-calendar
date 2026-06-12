import { useMemo } from "react";
import {
  calendarDate,
  compareDate,
  daysInMonth,
} from "../../core-v3/calendar-date";
import { rangesOverlap } from "../../core-v3/calendar-range";
import { useRovingTileFocus } from "../../hooks/use-roving-tile-focus";
import { useLabels } from "../../react-v3/labels-context";
import { useCalendarActions, useCalendarStore } from "../../react-v3/provider";
import { useStoreSelector } from "../../react-v3/use-store-selector";
import { getGridSlotStyle } from "../../utils/get-grid-slot-style";
import styles from "./months-grid.module.css";

export type CalendarMonthsGridProps = {
  short?: boolean;
  col?: number | string;
  className?: string;
  onMonthSelect?: (year: number, month: number) => void;
};

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

function getMonthNames(locale?: string, short = true): string[] {
  const fmt = new Intl.DateTimeFormat(locale, {
    month: short ? "short" : "long",
  });
  return MONTHS.map((m) => fmt.format(new Date(2024, m - 1, 1)));
}

export function CalendarMonthsGrid({
  short = true,
  col,
  className,
  onMonthSelect,
}: CalendarMonthsGridProps) {
  const store = useCalendarStore();
  const config = store.getConfig();
  const t = useLabels();
  const { navigateTo } = useCalendarActions();

  const viewDate = useStoreSelector(store, (s) => s.view.viewDate);
  const selection = useStoreSelector(store, (s) => s.selection);

  const year = viewDate.year;

  const monthNames = useMemo(
    () => getMonthNames(config.locale, short),
    [config.locale, short],
  );

  const longNames = useMemo(
    () => getMonthNames(config.locale, false),
    [config.locale],
  );

  const selectedMonths = useMemo((): ReadonlySet<number> => {
    const set = new Set<number>();
    if (selection.shape === "point") {
      for (const dt of selection.dates) {
        if (dt.date.year === year) set.add(dt.date.month);
      }
    } else {
      for (const range of selection.ranges) {
        for (const m of MONTHS) {
          const mStart = calendarDate(year, m, 1);
          const mEnd = calendarDate(year, m, daysInMonth(year, m));
          if (rangesOverlap(range, { start: mStart, end: mEnd })) set.add(m);
        }
      }
    }
    return set;
  }, [selection, year]);

  const isOutOfRange = (month: number): boolean => {
    const mStart = calendarDate(year, month, 1);
    const mEnd = calendarDate(year, month, daysInMonth(year, month));
    if (config.min && compareDate(mEnd, config.min) < 0) return true;
    if (config.max && compareDate(mStart, config.max) > 0) return true;
    return false;
  };

  const { containerRef, handleKeyDown, getItemProps } = useRovingTileFocus({
    itemCount: 12,
    activeIndex: viewDate.month - 1,
  });

  const gridSlot = getGridSlotStyle(col);

  return (
    <div
      data-dateforge-months-grid=""
      data-area="months"
      className={[className].filter(Boolean).join(" ")}
      style={gridSlot}
    >
      <div
        ref={containerRef}
        className={styles.grid}
        role="group"
        aria-label={t("monthGrid", { year: String(year) })}
        onKeyDown={handleKeyDown}
      >
        {MONTHS.map((month) => {
          const isCurrent = month === viewDate.month;
          const isSelected = selectedMonths.has(month);
          const disabled = config.readOnly || isOutOfRange(month);
          return (
            <button
              key={month}
              type="button"
              {...getItemProps(month - 1)}
              className={styles.item}
              aria-label={longNames[month - 1]}
              aria-current={isCurrent ? "true" : undefined}
              aria-disabled={disabled || undefined}
              data-current={isCurrent ? "" : undefined}
              data-selected={isSelected ? "" : undefined}
              onClick={() => {
                if (disabled) return;
                navigateTo(calendarDate(year, month, 1));
                onMonthSelect?.(year, month);
              }}
            >
              {monthNames[month - 1]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
