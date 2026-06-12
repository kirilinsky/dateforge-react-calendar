import { useMemo, useState } from "react";
import { calendarDate, daysInMonth } from "../../core-v3/calendar-date";
import { rangesOverlap } from "../../core-v3/calendar-range";
import { useRovingTileFocus } from "../../hooks/use-roving-tile-focus";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "../../react-v3/icons";
import { useLabels } from "../../react-v3/labels-context";
import { UIButton } from "../../react-v3/ui/button";
import { UITile } from "../../react-v3/ui/tile";
import { useCalendarActions, useCalendarStore } from "../../react-v3/provider";
import { useStoreSelector } from "../../react-v3/use-store-selector";
import { getGridSlotStyle } from "../../utils/get-grid-slot-style";
import styles from "./years-grid.module.css";

export type CalendarYearsGridProps = {
  yearsPerPage?: number;
  showControls?: boolean;
  col?: number | string;
  className?: string;
  onYearSelect?: (year: number) => void;
};

function pageStart(year: number, perPage: number): number {
  return Math.floor(year / perPage) * perPage;
}

function isYearOutOfRange(
  year: number,
  min?: { year: number; month: number; day: number },
  max?: { year: number; month: number; day: number },
): boolean {
  if (min && year < min.year) return true;
  if (max && year > max.year) return true;
  return false;
}

export function CalendarYearsGrid({
  yearsPerPage = 12,
  showControls = true,
  col,
  className,
  onYearSelect,
}: CalendarYearsGridProps) {
  const store = useCalendarStore();
  const config = store.getConfig();
  const t = useLabels();
  const { navigateTo } = useCalendarActions();

  const viewDate = useStoreSelector(store, (s) => s.view.viewDate);
  const selection = useStoreSelector(store, (s) => s.selection);

  const [pageOffset, setPageOffset] = useState(0);

  const baseYear =
    pageStart(viewDate.year, yearsPerPage) + pageOffset * yearsPerPage;

  const years = useMemo(
    () => Array.from({ length: yearsPerPage }, (_, i) => baseYear + i),
    [baseYear, yearsPerPage],
  );

  const selectedYears = useMemo((): ReadonlySet<number> => {
    const set = new Set<number>();
    if (selection.shape === "point") {
      for (const dt of selection.dates) set.add(dt.date.year);
    } else {
      for (const range of selection.ranges) {
        for (const year of years) {
          const yStart = calendarDate(year, 1, 1);
          const yEnd = calendarDate(year, 12, daysInMonth(year, 12));
          if (rangesOverlap(range, { start: yStart, end: yEnd })) set.add(year);
        }
      }
    }
    return set;
  }, [selection, years]);

  const canGoPrev = !config.min || baseYear > config.min.year;
  const canGoNext =
    !config.max || baseYear + yearsPerPage - 1 < config.max.year;

  const activeIndexInPage = years.indexOf(viewDate.year);
  const { containerRef, handleKeyDown, getItemProps } = useRovingTileFocus({
    itemCount: yearsPerPage,
    activeIndex: activeIndexInPage >= 0 ? activeIndexInPage : 0,
  });

  const rangeLabel = `${baseYear}–${baseYear + yearsPerPage - 1}`;
  const gridSlot = getGridSlotStyle(col);

  return (
    <div
      data-dateforge-years-grid=""
      data-area="years"
      className={[styles.container, className].filter(Boolean).join(" ")}
      style={gridSlot}
    >
      {showControls && (
        <div
          className={styles.nav}
          role="group"
          aria-label={t("yearPageNavigation")}
        >
          <UIButton
            aria-label={t("previousYears")}
            disabled={!canGoPrev}
            onClick={() => setPageOffset((o) => o - 1)}
          >
            <ChevronLeftIcon />
          </UIButton>
          <span className={styles.navLabel}>{rangeLabel}</span>
          <UIButton
            aria-label={t("nextYears")}
            disabled={!canGoNext}
            onClick={() => setPageOffset((o) => o + 1)}
          >
            <ChevronRightIcon />
          </UIButton>
        </div>
      )}
      <div
        ref={containerRef}
        className={styles.grid}
        role="group"
        aria-label={t("yearGrid", {
          from: String(baseYear),
          to: String(baseYear + yearsPerPage - 1),
        })}
        onKeyDown={handleKeyDown}
      >
        {years.map((year, idx) => {
          const isCurrent = year === viewDate.year;
          const isSelected = selectedYears.has(year);
          const disabled =
            config.readOnly || isYearOutOfRange(year, config.min, config.max);
          return (
            <UITile
              key={year}
              {...getItemProps(idx)}
              className={styles.item}
              aria-label={String(year)}
              aria-current={isCurrent ? "true" : undefined}
              aria-disabled={disabled || undefined}
              current={isCurrent}
              selected={isSelected}
              onClick={() => {
                if (disabled) return;
                navigateTo(calendarDate(year, viewDate.month, 1));
                onYearSelect?.(year);
              }}
            >
              {year}
            </UITile>
          );
        })}
      </div>
    </div>
  );
}
