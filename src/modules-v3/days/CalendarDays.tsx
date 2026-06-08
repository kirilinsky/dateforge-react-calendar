import { memo, useEffect, useMemo, useRef } from "react";
import type { CalendarDate } from "../../core-v3/calendar-date";
import { calendarDate, dateKey, datesEqual } from "../../core-v3/calendar-date";
import {
  buildDayLookup,
  buildPreviewSegments,
  DayFlag,
  dayFlags,
} from "../../core-v3/day-flags";
import { dayKeyboardTarget } from "../../core-v3/day-keyboard";
import { buildMonthGrid } from "../../core-v3/month-grid";
import { today } from "../../core-v3/timezone-boundary";
import { dayDataAttrs } from "../../react-v3/day-attrs";
import { useCalendarActions, useCalendarStore } from "../../react-v3/provider";
import { useStoreSelector } from "../../react-v3/use-store-selector";
import styles from "./days.module.css";

/**
 * The month-grid Days module — the first real UI surface on the v3 core.
 *
 * It reads its whole view model from the store: the structural grid (memoized by
 * month), the segmented selection lookup, and the hover preview. Each cell is
 * handed its packed `dayFlags` number and memoized on it, so a hover that moves
 * the preview re-renders only the two or three cells whose bitmask actually
 * changed — the per-cell performance contract the core was built for.
 */

type DayCellProps = {
  date: CalendarDate;
  flags: number;
  /** Roving tabindex: only the focus target is 0, the rest are -1. */
  focusable: boolean;
  onSelect: (date: CalendarDate) => void;
  onHover: (date: CalendarDate) => void;
};

const DayCell = memo(function DayCell({
  date,
  flags,
  focusable,
  onSelect,
  onHover,
}: DayCellProps) {
  const disabled = (flags & DayFlag.Disabled) !== 0;
  return (
    <button
      type="button"
      role="gridcell"
      tabIndex={focusable ? 0 : -1}
      data-date={dateKey(date)}
      className={styles.cell}
      {...dayDataAttrs(flags)}
      aria-disabled={disabled || undefined}
      aria-selected={
        (flags & (DayFlag.Selected | DayFlag.InRange)) !== 0 || undefined
      }
      aria-current={(flags & DayFlag.Today) !== 0 ? "date" : undefined}
      onClick={() => onSelect(date)}
      onMouseEnter={() => onHover(date)}
    >
      {date.day}
    </button>
  );
});

const REF_SUNDAY_UTC = Date.UTC(2023, 0, 1); // 2023-01-01 is a Sunday.
const DAY_MS = 86_400_000;

function useWeekdayLabels(order: readonly number[], locale?: string): string[] {
  return useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, {
      weekday: "short",
      timeZone: "UTC",
    });
    return order.map((w) => fmt.format(new Date(REF_SUNDAY_UTC + w * DAY_MS)));
  }, [order, locale]);
}

export function CalendarDays() {
  const store = useCalendarStore();
  const config = store.getConfig();
  const { selectDay, hover, focus, navigateTo } = useCalendarActions();
  const gridRef = useRef<HTMLDivElement>(null);

  // Narrow subscriptions: navigation, commit, and hover each wake only the work
  // that depends on them.
  const viewDate = useStoreSelector(store, (s) => s.view.viewDate);
  const selection = useStoreSelector(store, (s) => s.selection);
  const hoverDate = useStoreSelector(store, (s) => s.interaction.hoverDate);
  const focusDate = useStoreSelector(store, (s) => s.interaction.focusDate);

  const grid = useMemo(
    () =>
      buildMonthGrid({
        year: viewDate.year,
        month: viewDate.month,
        firstDayOfWeek: config.firstDayOfWeek,
      }),
    [viewDate.year, viewDate.month, config.firstDayOfWeek],
  );

  // Heavy-but-rare: rebuilt on commit. Cheap-and-hot dayFlags reads it per cell.
  const lookup = useMemo(
    () => buildDayLookup(selection, config),
    [selection, config],
  );
  // Rebuilt once per hover move, handed to every cell as ready segments.
  const preview = useMemo(
    () => buildPreviewSegments(selection, config, hoverDate),
    [selection, config, hoverDate],
  );
  const todayDate = useMemo(() => today(config.timeZone), [config.timeZone]);

  const weekdayLabels = useWeekdayLabels(grid.weekdayOrder, config.locale);

  // The roving-tabindex target: the explicit focus, else today-in-view, else the
  // first of the displayed month — so Tab always lands somewhere sensible.
  const effectiveFocus = useMemo<CalendarDate>(() => {
    if (focusDate) return focusDate;
    if (
      todayDate.year === viewDate.year &&
      todayDate.month === viewDate.month
    ) {
      return todayDate;
    }
    return calendarDate(viewDate.year, viewDate.month, 1);
  }, [focusDate, todayDate, viewDate.year, viewDate.month]);

  // Move DOM focus to follow the focused day, but only when focus already lives
  // inside the grid (a keyboard move) — never steal it on mount or commit.
  useEffect(() => {
    if (!focusDate) return;
    const root = gridRef.current;
    if (!root?.contains(document.activeElement)) return;
    root
      .querySelector<HTMLButtonElement>(`[data-date="${dateKey(focusDate)}"]`)
      ?.focus();
  }, [focusDate]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const result = dayKeyboardTarget(
      e.key,
      effectiveFocus,
      config.firstDayOfWeek,
    );
    if (!result) return;
    e.preventDefault();
    if (result.kind === "select") {
      selectDay(effectiveFocus);
      return;
    }
    focus(result.date);
    // Stepping out of the visible month brings that month into view.
    if (
      result.date.month !== viewDate.month ||
      result.date.year !== viewDate.year
    ) {
      navigateTo(result.date);
    }
  };

  return (
    <div
      ref={gridRef}
      role="grid"
      data-dateforge-days=""
      className={styles.grid}
      onKeyDown={onKeyDown}
      onMouseLeave={() => hover(undefined)}
    >
      <div role="row" data-weekdays="" className={styles.row}>
        {grid.weekdayOrder.map((w, i) => (
          <span
            key={w}
            role="columnheader"
            data-weekday=""
            className={styles.weekday}
          >
            {weekdayLabels[i]}
          </span>
        ))}
      </div>
      {grid.weeks.map((week) => (
        <div role="row" key={dateKey(week[0].date)} className={styles.row}>
          {week.map((cell) => (
            <DayCell
              key={dateKey(cell.date)}
              date={cell.date}
              flags={dayFlags(
                cell.date,
                lookup,
                config,
                preview,
                todayDate,
                cell.inMonth,
              )}
              focusable={datesEqual(cell.date, effectiveFocus)}
              onSelect={selectDay}
              onHover={hover}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
