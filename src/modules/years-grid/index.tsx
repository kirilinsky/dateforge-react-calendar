import React, { useMemo, useState, useEffect } from "react";
import styles from "./years-grid.module.css";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import { DisabledConfig } from "@/types/calendar";
import { useGridSlot } from "@/hooks/use-grid-slot";
import shared from "@/global/global.module.css";
import { warnOnce } from "@/core/dev-warn";

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

export interface CalendarYearsGridProps {
  yearsPerPage?: number;
  disableOutOfRange?: boolean;
  hideOutOfRange?: boolean;
  col?: number | string;
}

const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
  </svg>
);

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
  </svg>
);

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
  disableOutOfRange = true,
  hideOutOfRange = false,
  col,
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
  const { minDate, maxDate, disabled } = useConfig();
  const { viewDate, navigateTo } = useNavigation();

  const loYear = minDate ? minDate.getFullYear() : MIN_YEAR;
  const hiYear = maxDate ? maxDate.getFullYear() : MAX_YEAR;
  const currentYear = viewDate.getFullYear();

  const initialPage = Math.floor((currentYear - loYear) / pageSize);
  const [page, setPage] = useState(initialPage);
  const [direction, setDirection] = useState<"left" | "right" | "none">("none");

  useEffect(() => {
    const targetPage = Math.floor((currentYear - loYear) / pageSize);
    if (targetPage !== page) {
      setDirection(targetPage > page ? "right" : "left");
      setPage(targetPage);
    }
  }, [currentYear, loYear, pageSize]);

  const navigate = (delta: number) => {
    setDirection(delta > 0 ? "right" : "left");
    setPage((p) => p + delta);
  };

  const totalPages = Math.ceil((hiYear - loYear + 1) / pageSize);

  const years = useMemo(() => {
    const start = loYear + page * pageSize;
    return Array.from({ length: pageSize }, (_, i) => {
      const year = start + i;
      const outOfRange = year < loYear || year > hiYear;
      const fullyDisabled =
        !outOfRange && isYearFullyDisabled(year, disabled, minDate, maxDate);
      const limited = outOfRange || fullyDisabled;
      return { year, limited, disabled: disableOutOfRange && limited };
    }).filter(({ year }) => year >= MIN_YEAR && year <= MAX_YEAR);
  }, [
    loYear,
    hiYear,
    page,
    pageSize,
    disabled,
    minDate,
    maxDate,
    disableOutOfRange,
  ]);

  const handleClick = (year: number) => {
    const next = new Date(viewDate);
    next.setFullYear(year);
    navigateTo(next);
  };

  const startYear = loYear + page * pageSize;
  const endYear = Math.min(hiYear, startYear + pageSize - 1);

  return (
    <div
      data-area="years-grid"
      role="group"
      aria-label={`Select year, showing ${startYear} to ${endYear}`}
      style={useGridSlot(col)}
    >
      <div className={styles.nav} role="group" aria-label="Year page navigation">
        <button
          type="button"
          className={[shared.interactive, shared.hoverable].join(" ")}
          disabled={page <= 0}
          aria-label="Previous years"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft />
        </button>
        <span className={styles.range} aria-live="polite">
          {startYear}–{endYear}
        </span>
        <button
          type="button"
          className={[shared.interactive, shared.hoverable].join(" ")}
          disabled={page >= totalPages - 1}
          aria-label="Next years"
          onClick={() => navigate(1)}
        >
          <ChevronRight />
        </button>
      </div>
      <div
        key={page}
        className={[styles.grid, direction !== "none" ? styles[direction] : ""]
          .filter(Boolean)
          .join(" ")}
        onAnimationEnd={() => setDirection("none")}
      >
        {years.map(({ year, disabled, limited }) => {
          const isHidden = hideOutOfRange && limited;
          const isDisabled = disabled || isHidden;
          const isCurrent = year === currentYear;
          return (
            <button
              key={year}
              type="button"
              aria-label={`${year}${isDisabled && !isHidden ? ", limited" : ""}`}
              aria-current={isCurrent ? "true" : undefined}
              aria-disabled={isDisabled || undefined}
              aria-hidden={isHidden || undefined}
              className={[
                styles.item,
                shared.interactive,
                shared.hoverable,
                isCurrent ? shared.activeItem : "",
              ]
                .filter(Boolean)
                .join(" ")}
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
