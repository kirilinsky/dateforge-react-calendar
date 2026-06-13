import { useEffect, useMemo, useState } from "react";
import { calendarDate, daysInMonth } from "../../core-v3/calendar-date";
import { rangesOverlap } from "../../core-v3/calendar-range";
import type { DateRuleEngine } from "../../core-v3/date-rule-engine";
import { usePageSlide } from "../../hooks/use-page-slide";
import { useRovingTileFocus } from "../../hooks/use-roving-tile-focus";
import { ChevronLeftIcon, ChevronRightIcon } from "../../react-v3/icons";
import { useLabels } from "../../react-v3/labels-context";
import { useCalendarActions, useCalendarStore } from "../../react-v3/provider";
import { UIButton } from "../../react-v3/ui/button";
import { UITile } from "../../react-v3/ui/tile";
import { useStoreSelector } from "../../react-v3/use-store-selector";
import { getGridSlotStyle } from "../../utils/get-grid-slot-style";
import styles from "./years-grid.module.css";

/**
 * How years outside `min`/`max` — or fully blocked by `disabled` rules — are
 * presented:
 * - `"disable"` (default): greyed out, clicks blocked, still keyboard-reachable.
 * - `"hide"`: removed from layout and the a11y tree.
 * - `"show"`: fully interactive. Clicking only navigates `viewDate`.
 */
export type OutOfRangeBehavior = "disable" | "hide" | "show";

export type CalendarYearsGridProps = {
  yearsPerPage?: number;
  showControls?: boolean;
  /** Out-of-range / fully-disabled year presentation. Default `"disable"`. */
  outOfRangeBehavior?: OutOfRangeBehavior;
  col?: number | string;
  className?: string;
  /** Per-module theme override (`data-theme` on the module container). */
  theme?: string;
  /** Per-module scheme override (`data-scheme` on the module container). */
  scheme?: "light" | "dark" | "auto";
  onYearSelect?: (year: number) => void;
};

// Sane absolute bounds so the pager arrows can't walk to nonsense years when no
// min/max is configured.
const YEAR_VIEW_MIN = 1;
const YEAR_VIEW_MAX = 9999;
const MAX_YEARS_PER_PAGE = 40;

function pageStart(year: number, perPage: number): number {
  return Math.floor(year / perPage) * perPage;
}

/** True when every day of the year matches the `disabled` engine. */
function isYearFullyDisabled(year: number, engine: DateRuleEngine): boolean {
  if (engine.isEmpty) return false;
  for (let month = 1; month <= 12; month++) {
    const dim = daysInMonth(year, month);
    for (let day = 1; day <= dim; day++) {
      if (!engine.matches(calendarDate(year, month, day))) return false;
    }
  }
  return true;
}

export function CalendarYearsGrid({
  yearsPerPage = 12,
  showControls = true,
  outOfRangeBehavior = "disable",
  col,
  className,
  theme,
  scheme,
  onYearSelect,
}: CalendarYearsGridProps) {
  const store = useCalendarStore();
  const config = store.getConfig();
  const t = useLabels();
  const { navigateTo } = useCalendarActions();

  const viewDate = useStoreSelector(store, (s) => s.view.viewDate);
  const selection = useStoreSelector(store, (s) => s.selection);

  const perPage = Math.min(
    MAX_YEARS_PER_PAGE,
    Math.max(1, Math.floor(yearsPerPage) || 1),
  );

  // Page anchor. `null` = follow the view's natural page; a number pins the page
  // after the user pages with the arrows.
  const [pinnedBase, setPinnedBase] = useState<number | null>(null);
  const viewBase = pageStart(viewDate.year, perPage);
  const baseYear = pinnedBase ?? viewBase;

  // If the view jumps to a year outside the pinned page, release the pin so the
  // grid follows the view again (no post-navigation drift).
  useEffect(() => {
    setPinnedBase((prev) =>
      prev !== null && (viewDate.year < prev || viewDate.year >= prev + perPage)
        ? null
        : prev,
    );
  }, [viewDate.year, perPage]);

  const years = useMemo(
    () => Array.from({ length: perPage }, (_, i) => baseYear + i),
    [baseYear, perPage],
  );

  const selectedYears = useMemo((): ReadonlySet<number> => {
    const set = new Set<number>();
    if (selection.shape === "point") {
      for (const dt of selection.dates) set.add(dt.date.year);
    } else {
      for (const range of selection.ranges) {
        for (const year of years) {
          const yStart = calendarDate(year, 1, 1);
          const yEnd = calendarDate(year, 12, 31);
          if (rangesOverlap(range, { start: yStart, end: yEnd })) set.add(year);
        }
      }
    }
    return set;
  }, [selection, years]);

  // A year is "blocked" when it falls entirely outside min/max or every day
  // matches the `disabled` rule engine.
  const blocked = useMemo((): ReadonlySet<number> => {
    const set = new Set<number>();
    for (const year of years) {
      const outOfRange =
        (config.min && year < config.min.year) ||
        (config.max && year > config.max.year);
      if (outOfRange || isYearFullyDisabled(year, config.disabled)) {
        set.add(year);
      }
    }
    return set;
  }, [years, config.min, config.max, config.disabled]);

  const minYear = config.min ? config.min.year : YEAR_VIEW_MIN;
  const maxYear = config.max ? config.max.year : YEAR_VIEW_MAX;
  const minBase = pageStart(minYear, perPage);
  const maxBase = pageStart(maxYear, perPage);
  const clampBase = (b: number) => Math.max(minBase, Math.min(b, maxBase));
  const canGoPrev = baseYear > minBase;
  const canGoNext = baseYear < maxBase;

  // Keep the roving anchor on the view year when it's on this page, else on the
  // first reachable cell.
  const activeIndex = useMemo(() => {
    const inPage = years.indexOf(viewDate.year);
    const isReachable = (y: number) =>
      !(outOfRangeBehavior === "hide" && blocked.has(y));
    if (inPage >= 0 && isReachable(viewDate.year)) return inPage;
    const firstVisible = years.findIndex(isReachable);
    return firstVisible >= 0 ? firstVisible : 0;
  }, [years, viewDate.year, outOfRangeBehavior, blocked]);

  const { containerRef, handleKeyDown, getItemProps } = useRovingTileFocus({
    itemCount: perPage,
    activeIndex,
  });

  // Page-turn slide: paging animates the tile grid in. Next page (higher base)
  // slides from the right, previous from the left — inferred from the ordinal.
  usePageSlide(containerRef, baseYear);

  const rangeLabel = `${baseYear}–${baseYear + perPage - 1}`;
  const gridSlot = getGridSlotStyle(col);

  return (
    <div
      data-dateforge-years-grid=""
      data-area="years"
      data-theme={theme}
      data-scheme={scheme}
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
            onClick={() =>
              setPinnedBase((prev) => clampBase((prev ?? viewBase) - perPage))
            }
          >
            <ChevronLeftIcon />
          </UIButton>
          <span className={styles.navLabel} aria-live="polite">
            {rangeLabel}
          </span>
          <UIButton
            aria-label={t("nextYears")}
            disabled={!canGoNext}
            onClick={() =>
              setPinnedBase((prev) => clampBase((prev ?? viewBase) + perPage))
            }
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
          to: String(baseYear + perPage - 1),
        })}
        onKeyDown={handleKeyDown}
      >
        {years.map((year, idx) => {
          const isCurrent = year === viewDate.year;
          const isSelected = selectedYears.has(year);
          const isBlocked = blocked.has(year);
          const isHidden = isBlocked && outOfRangeBehavior === "hide";
          const disabled =
            config.readOnly || (isBlocked && outOfRangeBehavior === "disable");
          return (
            <UITile
              key={year}
              {...getItemProps(idx)}
              className={styles.item}
              aria-label={
                isSelected
                  ? t("yearSelected", { year: String(year) })
                  : String(year)
              }
              aria-current={isCurrent ? "true" : undefined}
              aria-disabled={disabled || undefined}
              aria-hidden={isHidden || undefined}
              style={isHidden ? { visibility: "hidden" } : undefined}
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
