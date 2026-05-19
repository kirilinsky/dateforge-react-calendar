import type React from "react";
import { useEffect, useMemo, useState } from "react";
import "@/styles/layers.css";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import { useSelectionValue } from "@/context/selection-context";
import { warnOnce } from "@/core/dev-warn";
import shared from "@/global/global.module.css";
import { useRovingTileFocus } from "@/hooks/use-roving-tile-focus";
import { ChevronLeft, ChevronRight } from "@/Icons";
import type { DisabledConfig } from "@/types/calendar";
import {
  DEFAULT_NEXT_YEARS_LABEL,
  DEFAULT_PREVIOUS_YEARS_LABEL,
  DEFAULT_YEAR_GRID_LABEL,
  DEFAULT_YEAR_PAGE_NAVIGATION_LABEL,
  formatActionLabel,
  resolveActionLabel,
} from "@/utils/action-labels";
import { setYear } from "@/utils/date-utils";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { MAX_CALENDAR_YEAR, MIN_CALENDAR_YEAR } from "@/utils/year-range";
import styles from "./years-grid.module.css";

export interface CalendarYearsGridProps {
  yearsPerPage?: number;
  startYear?: number;
  showControls?: boolean;
  disableOutOfRange?: boolean;
  hideOutOfRange?: boolean;
  col?: number | string;
  nextYearsLabel?: string;
  previousYearsLabel?: string;
  yearGridLabel?: string;
  yearPageNavigationLabel?: string;
  /**
   * Fires after the user clicks a year cell. Receives the navigated viewDate
   * (same month/day, picked year). Use this for a standalone year-picker UX
   * without mounting `CalendarDays`.
   */
  onYearSelect?: (date: Date) => void;
}

const isYearFullyDisabled = (
  year: number,
  disabled?: DisabledConfig,
  minDate?: Date | null,
  maxDate?: Date | null,
): boolean => {
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);

  if (
    minDate &&
    dec31 <
      new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
  )
    return true;
  if (
    maxDate &&
    jan1 >
      new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())
  )
    return true;

  if (!disabled?.rules.length) return false;

  return disabled.rules.some((rule) => {
    if (typeof rule === "boolean") return rule;
    if (rule instanceof Date) return false;
    if ("dayOfWeek" in rule) return false;
    if ("from" in rule) return jan1 >= rule.from && dec31 <= rule.to;
    return (
      (rule.before ? dec31 < rule.before : false) ||
      (rule.after ? jan1 > rule.after : false)
    );
  });
};

export const CalendarYearsGrid: React.FC<CalendarYearsGridProps> = ({
  yearsPerPage = 10,
  startYear,
  showControls = true,
  disableOutOfRange = true,
  hideOutOfRange = false,
  col,
  nextYearsLabel,
  previousYearsLabel,
  yearGridLabel,
  yearPageNavigationLabel,
  onYearSelect,
}) => {
  const pageSize = Math.min(40, Math.max(1, yearsPerPage));
  if (
    !Number.isFinite(yearsPerPage) ||
    yearsPerPage !== Math.floor(yearsPerPage) ||
    yearsPerPage < 1 ||
    yearsPerPage > 40
  ) {
    warnOnce(
      "years-grid:clamped",
      `<CalendarYearsGrid yearsPerPage={${yearsPerPage}} /> is out of the supported 1..40 integer range. Clamped to ${pageSize}.`,
    );
  }
  const { minDate, maxDate, disabled, actionLabels } = useConfig();
  const resolvedYearGridLabel = resolveActionLabel(
    yearGridLabel,
    actionLabels.yearGridLabel,
    DEFAULT_YEAR_GRID_LABEL,
  );
  const resolvedYearPageNavigationLabel = resolveActionLabel(
    yearPageNavigationLabel,
    actionLabels.yearPageNavigationLabel,
    DEFAULT_YEAR_PAGE_NAVIGATION_LABEL,
  );
  const resolvedPreviousYearsLabel = resolveActionLabel(
    previousYearsLabel,
    actionLabels.previousYearsLabel,
    DEFAULT_PREVIOUS_YEARS_LABEL,
  );
  const resolvedNextYearsLabel = resolveActionLabel(
    nextYearsLabel,
    actionLabels.nextYearsLabel,
    DEFAULT_NEXT_YEARS_LABEL,
  );
  const { viewDate, navigateTo } = useNavigation();
  const { selectedDates, rangeStart, rangeEnd } = useSelectionValue();

  const minAllowedYear = minDate ? minDate.getFullYear() : MIN_CALENDAR_YEAR;
  const maxAllowedYear = maxDate ? maxDate.getFullYear() : MAX_CALENDAR_YEAR;
  const currentYear = viewDate.getFullYear();
  const selectedYears = useMemo(() => {
    const years = new Set<number>();
    for (const date of [...selectedDates, rangeStart, rangeEnd]) {
      if (date) years.add(date.getFullYear());
    }
    return years;
  }, [selectedDates, rangeStart, rangeEnd]);
  const hasCustomStartYear = startYear !== undefined;
  const startYearIsInteger =
    startYear === undefined ||
    (Number.isFinite(startYear) && startYear === Math.floor(startYear));
  const fallbackStartYear = hasCustomStartYear
    ? MIN_CALENDAR_YEAR
    : minAllowedYear;
  const firstListYear = hasCustomStartYear
    ? startYearIsInteger
      ? Math.min(MAX_CALENDAR_YEAR, Math.max(MIN_CALENDAR_YEAR, startYear))
      : fallbackStartYear
    : fallbackStartYear;

  if (
    hasCustomStartYear &&
    (!startYearIsInteger ||
      startYear < MIN_CALENDAR_YEAR ||
      startYear > MAX_CALENDAR_YEAR)
  ) {
    warnOnce(
      "years-grid:start-year-clamped",
      `<CalendarYearsGrid startYear={${startYear}} /> is out of the supported ${MIN_CALENDAR_YEAR}..${MAX_CALENDAR_YEAR} integer range. Using ${firstListYear}.`,
    );
  }

  const initialPage = hasCustomStartYear
    ? 0
    : Math.floor((currentYear - firstListYear) / pageSize);
  const [page, setPage] = useState(initialPage);
  const [direction, setDirection] = useState<"left" | "right" | "none">("none");

  useEffect(() => {
    if (hasCustomStartYear) return;
    const targetPage = Math.floor((currentYear - firstListYear) / pageSize);
    setPage((prevPage) => {
      if (targetPage === prevPage) return prevPage;
      setDirection(targetPage > prevPage ? "right" : "left");
      return targetPage;
    });
  }, [currentYear, firstListYear, hasCustomStartYear, pageSize]);

  const listEndYear = Math.max(firstListYear, maxAllowedYear);
  const totalPages = Math.max(
    1,
    Math.ceil((listEndYear - firstListYear + 1) / pageSize),
  );

  const navigate = (delta: number) => {
    const nextPage = Math.min(totalPages - 1, Math.max(0, page + delta));
    if (nextPage === page) return;
    setDirection(delta > 0 ? "right" : "left");
    setPage(nextPage);
  };

  const years = useMemo(() => {
    const start = firstListYear + page * pageSize;
    return Array.from({ length: pageSize }, (_, i) => {
      const year = start + i;
      const outOfRange = year < minAllowedYear || year > maxAllowedYear;
      const fullyDisabled =
        !outOfRange && isYearFullyDisabled(year, disabled, minDate, maxDate);
      const limited = outOfRange || fullyDisabled;
      return { year, limited, disabled: disableOutOfRange && limited };
    }).filter(
      ({ year }) => year >= MIN_CALENDAR_YEAR && year <= MAX_CALENDAR_YEAR,
    );
  }, [
    firstListYear,
    minAllowedYear,
    maxAllowedYear,
    page,
    pageSize,
    disabled,
    minDate,
    maxDate,
    disableOutOfRange,
  ]);

  const handleClick = (year: number) => {
    const next = setYear(viewDate, year);
    navigateTo(next);
    onYearSelect?.(next);
  };

  const pageStartYear = years[0]?.year ?? firstListYear + page * pageSize;
  const pageEndYear =
    years.at(-1)?.year ??
    Math.min(MAX_CALENDAR_YEAR, pageStartYear + pageSize - 1);
  const currentIndex = years.findIndex(({ year }) => year === currentYear);
  const activeIndex =
    currentIndex >= 0 && !(hideOutOfRange && years[currentIndex]?.limited)
      ? currentIndex
      : Math.max(
          0,
          years.findIndex(({ limited }) => !limited),
        );
  const { containerRef, handleKeyDown, getItemProps } = useRovingTileFocus({
    itemCount: years.length,
    activeIndex,
  });

  return (
    <div
      data-area="years-grid"
      className={styles.root}
      role="group"
      aria-label={formatActionLabel(
        formatActionLabel(resolvedYearGridLabel, "from", pageStartYear),
        "to",
        pageEndYear,
      )}
      style={getGridSlotStyle(col)}
    >
      {showControls && (
        <div
          className={styles.nav}
          role="group"
          aria-label={resolvedYearPageNavigationLabel}
        >
          <button
            type="button"
            className={[shared.interactive, shared.hovered].join(" ")}
            disabled={page <= 0}
            aria-label={resolvedPreviousYearsLabel}
            onClick={() => navigate(-1)}
          >
            <ChevronLeft />
          </button>
          <span className={styles.range} aria-live="polite">
            {pageStartYear}–{pageEndYear}
          </span>
          <button
            type="button"
            className={[shared.interactive, shared.hovered].join(" ")}
            disabled={page >= totalPages - 1}
            aria-label={resolvedNextYearsLabel}
            onClick={() => navigate(1)}
          >
            <ChevronRight />
          </button>
        </div>
      )}
      <div
        ref={containerRef}
        key={page}
        className={[styles.grid, direction !== "none" ? styles[direction] : ""]
          .filter(Boolean)
          .join(" ")}
        data-count={years.length}
        onKeyDown={handleKeyDown}
        onAnimationEnd={() => setDirection("none")}
      >
        {years.map(({ year, disabled, limited }, index) => {
          const isHidden = hideOutOfRange && limited;
          const isDisabled = disabled || isHidden;
          const isCurrent = year === currentYear;
          const isSelected = selectedYears.has(year);
          return (
            <button
              key={year}
              type="button"
              {...getItemProps(index)}
              aria-label={[
                year,
                isSelected ? "selected" : "",
                isDisabled && !isHidden ? "limited" : "",
              ]
                .filter(Boolean)
                .join(", ")}
              aria-current={isCurrent ? "true" : undefined}
              aria-disabled={isDisabled || undefined}
              aria-hidden={isHidden || undefined}
              className={[
                styles.item,
                shared.adaptiveTile,
                shared.interactive,
                shared.hovered,
                isSelected ? shared.selectedItem : "",
                isCurrent ? shared.activeItem : "",
              ]
                .filter(Boolean)
                .join(" ")}
              data-selected={isSelected || undefined}
              style={isHidden ? { visibility: "hidden" } : undefined}
              onClick={() => !isDisabled && handleClick(year)}
            >
              {year}
            </button>
          );
        })}
      </div>
    </div>
  );
};
