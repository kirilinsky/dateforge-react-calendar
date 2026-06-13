import { useMemo } from "react";
import {
  calendarDate,
  compareDate,
  daysInMonth,
} from "../../core-v3/calendar-date";
import { rangesOverlap } from "../../core-v3/calendar-range";
import type { DateRuleEngine } from "../../core-v3/date-rule-engine";
import { useRovingTileFocus } from "../../hooks/use-roving-tile-focus";
import { useLabels } from "../../react-v3/labels-context";
import { useCalendarActions, useCalendarStore } from "../../react-v3/provider";
import { UITile } from "../../react-v3/ui/tile";
import { useStoreSelector } from "../../react-v3/use-store-selector";
import { getGridSlotStyle } from "../../utils/get-grid-slot-style";
import styles from "./months-grid.module.css";

/**
 * How months outside `min`/`max` — or fully blocked by `disabled` rules — are
 * presented:
 * - `"disable"` (default): greyed out, clicks blocked, still keyboard-reachable.
 * - `"hide"`: removed from layout and the a11y tree.
 * - `"show"`: fully interactive. Clicking only navigates `viewDate`; the core
 *   still guards actual date selection, so this never selects a blocked day.
 */
export type OutOfRangeBehavior = "disable" | "hide" | "show";

export type CalendarMonthsGridProps = {
  short?: boolean;
  /** Out-of-range / fully-disabled month presentation. Default `"disable"`. */
  outOfRangeBehavior?: OutOfRangeBehavior;
  col?: number | string;
  className?: string;
  /** Per-module theme override (`data-theme` on the module container). */
  theme?: string;
  /** Per-module scheme override (`data-scheme` on the module container). */
  scheme?: "light" | "dark" | "auto";
  onMonthSelect?: (year: number, month: number) => void;
};

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

function getMonthNames(locale?: string, short = true): string[] {
  const fmt = new Intl.DateTimeFormat(locale, {
    month: short ? "short" : "long",
  });
  return MONTHS.map((m) => fmt.format(new Date(2024, m - 1, 1)));
}

/** True when every day of the month matches the `disabled` engine. */
function isMonthFullyDisabled(
  year: number,
  month: number,
  engine: DateRuleEngine,
): boolean {
  if (engine.isEmpty) return false;
  const dim = daysInMonth(year, month);
  for (let day = 1; day <= dim; day++) {
    if (!engine.matches(calendarDate(year, month, day))) return false;
  }
  return true;
}

export function CalendarMonthsGrid({
  short = true,
  outOfRangeBehavior = "disable",
  col,
  className,
  theme,
  scheme,
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

  // A month is "blocked" when it falls entirely outside min/max or every day
  // matches the `disabled` rule engine. `outOfRangeBehavior` decides how that
  // surfaces (disable / hide / show).
  const blocked = useMemo((): ReadonlySet<number> => {
    const set = new Set<number>();
    for (const month of MONTHS) {
      const mStart = calendarDate(year, month, 1);
      const mEnd = calendarDate(year, month, daysInMonth(year, month));
      const outOfRange =
        (config.min && compareDate(mEnd, config.min) < 0) ||
        (config.max && compareDate(mStart, config.max) > 0);
      if (outOfRange || isMonthFullyDisabled(year, month, config.disabled)) {
        set.add(month);
      }
    }
    return set;
  }, [year, config.min, config.max, config.disabled]);

  // When hiding blocked months, keep the roving anchor on a visible cell.
  const activeIndex = useMemo(() => {
    if (outOfRangeBehavior === "hide" && blocked.has(viewDate.month)) {
      const firstVisible = MONTHS.findIndex((m) => !blocked.has(m));
      return firstVisible >= 0 ? firstVisible : 0;
    }
    return viewDate.month - 1;
  }, [outOfRangeBehavior, blocked, viewDate.month]);

  const { containerRef, handleKeyDown, getItemProps } = useRovingTileFocus({
    itemCount: 12,
    activeIndex,
  });

  const gridSlot = getGridSlotStyle(col);

  return (
    <div
      data-dateforge-months-grid=""
      data-area="months"
      data-theme={theme}
      data-scheme={scheme}
      className={[styles.container, className].filter(Boolean).join(" ")}
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
          const isBlocked = blocked.has(month);
          const isHidden = isBlocked && outOfRangeBehavior === "hide";
          const disabled =
            config.readOnly || (isBlocked && outOfRangeBehavior === "disable");
          const longName = longNames[month - 1];
          return (
            <UITile
              key={month}
              {...getItemProps(month - 1)}
              className={styles.item}
              aria-label={
                isSelected ? t("monthSelected", { month: longName }) : longName
              }
              aria-current={isCurrent ? "true" : undefined}
              aria-disabled={disabled || undefined}
              aria-hidden={isHidden || undefined}
              style={isHidden ? { visibility: "hidden" } : undefined}
              current={isCurrent}
              selected={isSelected}
              onClick={() => {
                if (disabled) return;
                navigateTo(calendarDate(year, month, 1));
                onMonthSelect?.(year, month);
              }}
            >
              {monthNames[month - 1]}
            </UITile>
          );
        })}
      </div>
    </div>
  );
}
