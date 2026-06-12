import type { ReactNode } from "react";
import { memo, useEffect, useMemo, useRef } from "react";
import type { CalendarDate } from "../../core-v3/calendar-date";
import {
  addMonths,
  calendarDate,
  dateKey,
  datesEqual,
} from "../../core-v3/calendar-date";
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
import { useLabels } from "../../react-v3/labels-context";
import { useCalendarActions, useCalendarStore } from "../../react-v3/provider";
import { useStoreSelector } from "../../react-v3/use-store-selector";
import { getGridSlotStyle } from "../../utils/get-grid-slot-style";
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

/** Unpacked cell state handed to `renderDay` — stable names, no bitmask. */
export type DayRenderState = {
  selected: boolean;
  inRange: boolean;
  rangeStart: boolean;
  rangeEnd: boolean;
  preview: boolean;
  today: boolean;
  outside: boolean;
  weekend: boolean;
  disabled: boolean;
  excluded: boolean;
};

export type RenderDay = (
  date: CalendarDate,
  state: DayRenderState,
) => ReactNode;

export type CalendarDaysProps = {
  /**
   * Months ahead of the root view this grid shows (multi-month layouts:
   * `<CalendarDays />` + `<CalendarDays offset={1} />`). Default 0.
   */
  offset?: number;
  /**
   * Move the root view to the clicked day's month when it isn't the shown
   * month. Default: `true` for the primary grid (`offset === 0`), `false` for
   * offset grids — a side month must not steal the primary view.
   */
  syncViewOnSelect?: boolean;
  /** Render the leading/trailing days of neighbour months. Default true. */
  showOutsideDays?: boolean;
  /** Always render 6 weeks — stable height across months. Default true. */
  fixedWeeks?: boolean;
  /** ISO week-number column. Default false. */
  weekNumbers?: boolean;
  /** aria-label for the week-number column header (registry key `week`). */
  weekLabel?: string;
  /** Hide the weekday header row. Default false. */
  hideWeekdays?: boolean;
  /** Weekday header style. Default "short" ("Mon"); narrow = "M". */
  weekdayFormat?: "short" | "narrow" | "long";
  /** Weekend surface tint (derived from the `weekend` ink). Default true. */
  highlightWeekends?: boolean;
  /** Bold + weekend-ink weekday numbers (v2 look). Default false. */
  boldWeekends?: boolean;
  /**
   * Dot under today's number (`--c-todayDot`). Default true — except when
   * `renderDay` is set: custom content owns the cell's inner layout, so the
   * dot is off unless explicitly re-enabled.
   */
  todayDot?: boolean;
  /** Subtle inset outline on today (50% accent). Default true. */
  highlightToday?: boolean;
  /**
   * Custom day-cell content. The button shell, data attributes, keyboard and
   * aria stay owned by the library. Pass a stable reference (module-level fn
   * or useCallback) — an inline closure re-renders all 42 cells every pass.
   */
  renderDay?: RenderDay;
  /** Per-module theme override (`data-theme` on the module container). */
  theme?: string;
  /** Per-module scheme override (`data-scheme` on the module container). */
  scheme?: "light" | "dark" | "auto";
  col?: number | string;
  className?: string;
};

export function dayRenderState(flags: number): DayRenderState {
  return {
    selected: (flags & DayFlag.Selected) !== 0,
    inRange: (flags & DayFlag.InRange) !== 0,
    rangeStart: (flags & DayFlag.RangeStart) !== 0,
    rangeEnd: (flags & DayFlag.RangeEnd) !== 0,
    preview: (flags & DayFlag.Preview) !== 0,
    today: (flags & DayFlag.Today) !== 0,
    outside: (flags & DayFlag.OutOfMonth) !== 0,
    weekend: (flags & DayFlag.Weekend) !== 0,
    disabled: (flags & DayFlag.Disabled) !== 0,
    excluded: (flags & DayFlag.Excluded) !== 0,
  };
}

type DayCellProps = {
  date: CalendarDate;
  flags: number;
  /** Full localized date for the accessible name — the visible "15" alone
      means nothing to a screen reader out of month context. */
  label: string;
  /** Roving tabindex: only the focus target is 0, the rest are -1. */
  focusable: boolean;
  renderDay?: RenderDay;
  onSelect: (date: CalendarDate) => void;
  onHover: (date: CalendarDate) => void;
};

const DayCell = memo(function DayCell({
  date,
  flags,
  label,
  focusable,
  renderDay,
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
      aria-label={label}
      {...dayDataAttrs(flags)}
      aria-disabled={disabled || undefined}
      aria-selected={
        (flags & (DayFlag.Selected | DayFlag.InRange)) !== 0 || undefined
      }
      aria-current={(flags & DayFlag.Today) !== 0 ? "date" : undefined}
      onClick={() => onSelect(date)}
      onMouseEnter={() => onHover(date)}
    >
      {renderDay ? renderDay(date, dayRenderState(flags)) : date.day}
    </button>
  );
});

const REF_SUNDAY_UTC = Date.UTC(2023, 0, 1); // 2023-01-01 is a Sunday.
const DAY_MS = 86_400_000;

function useWeekdayLabels(
  order: readonly number[],
  format: "short" | "narrow" | "long",
  locale?: string,
): { visible: string[]; long: string[] } {
  return useMemo(() => {
    const make = (weekday: "short" | "narrow" | "long") => {
      const fmt = new Intl.DateTimeFormat(locale, {
        weekday,
        timeZone: "UTC",
      });
      return order.map((w) =>
        fmt.format(new Date(REF_SUNDAY_UTC + w * DAY_MS)),
      );
    };
    const long = make("long");
    return { visible: format === "long" ? long : make(format), long };
  }, [order, format, locale]);
}

/** ISO 8601 week number — pure wall-clock math via a UTC scratch date. */
function isoWeek(d: CalendarDate): number {
  const dt = new Date(Date.UTC(d.year, d.month - 1, d.day));
  const day = (dt.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  dt.setUTCDate(dt.getUTCDate() - day + 3); // the week's Thursday
  const jan4 = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7;
  const week1Thu = jan4.getTime() + (3 - jan4Day) * DAY_MS;
  return 1 + Math.round((dt.getTime() - week1Thu) / (7 * DAY_MS));
}

export function CalendarDays({
  offset = 0,
  syncViewOnSelect,
  showOutsideDays = true,
  fixedWeeks = true,
  weekNumbers = false,
  weekLabel,
  hideWeekdays = false,
  weekdayFormat = "short",
  highlightWeekends = true,
  boldWeekends = false,
  todayDot,
  highlightToday = false,
  renderDay,
  theme,
  scheme,
  col,
  className,
}: CalendarDaysProps) {
  const store = useCalendarStore();
  const config = store.getConfig();
  const t = useLabels();
  const { selectDay, hover, focus, navigateTo } = useCalendarActions();
  const gridRef = useRef<HTMLDivElement>(null);

  // Narrow subscriptions: navigation, commit, and hover each wake only the work
  // that depends on them.
  const viewDate = useStoreSelector(store, (s) => s.view.viewDate);
  const selection = useStoreSelector(store, (s) => s.selection);
  const hoverDate = useStoreSelector(store, (s) => s.interaction.hoverDate);
  const focusDate = useStoreSelector(store, (s) => s.interaction.focusDate);

  // The month THIS grid shows (offset grids trail/lead the root view).
  const shownDate = useMemo(
    () => (offset === 0 ? viewDate : addMonths(viewDate, offset)),
    [viewDate, offset],
  );
  const effectiveSync = syncViewOnSelect ?? offset === 0;

  const grid = useMemo(
    () =>
      buildMonthGrid({
        year: shownDate.year,
        month: shownDate.month,
        firstDayOfWeek: config.firstDayOfWeek,
        fixedWeeks,
      }),
    [shownDate.year, shownDate.month, config.firstDayOfWeek, fixedWeeks],
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

  const weekdayLabels = useWeekdayLabels(
    grid.weekdayOrder,
    weekdayFormat,
    config.locale,
  );

  // Wall-clock formatters (no timeZone — cells are calendar fields already).
  const cellLabelFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(config.locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [config.locale],
  );
  const gridLabelFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(config.locale, {
        month: "long",
        year: "numeric",
      }),
    [config.locale],
  );
  const cellLabel = (d: CalendarDate) =>
    cellLabelFmt.format(new Date(d.year, d.month - 1, d.day));

  const onSelectCell = useMemo(() => {
    if (!effectiveSync) return selectDay;
    return (d: CalendarDate) => {
      selectDay(d);
      // Clicking an outside day pulls its month into view (v2 behavior).
      if (d.month !== shownDate.month || d.year !== shownDate.year) {
        navigateTo(calendarDate(d.year, d.month, 1));
      }
    };
  }, [effectiveSync, selectDay, navigateTo, shownDate.month, shownDate.year]);

  // The roving-tabindex target: the explicit focus, else today-in-view, else the
  // first of the displayed month — so Tab always lands somewhere sensible.
  const effectiveFocus = useMemo<CalendarDate>(() => {
    if (focusDate) return focusDate;
    if (
      todayDate.year === shownDate.year &&
      todayDate.month === shownDate.month
    ) {
      return todayDate;
    }
    return calendarDate(shownDate.year, shownDate.month, 1);
  }, [focusDate, todayDate, shownDate.year, shownDate.month]);

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
      onSelectCell(effectiveFocus);
      return;
    }
    focus(result.date);
    // Stepping out of the visible month brings that month into view.
    if (
      result.date.month !== shownDate.month ||
      result.date.year !== shownDate.year
    ) {
      navigateTo(addMonths(result.date, -offset));
    }
  };

  return (
    <div
      ref={gridRef}
      role="grid"
      aria-label={gridLabelFmt.format(
        new Date(shownDate.year, shownDate.month - 1, 1),
      )}
      data-dateforge-days=""
      data-theme={theme}
      data-scheme={scheme}
      data-week-numbers={weekNumbers ? "" : undefined}
      data-weekend-tint={highlightWeekends ? "" : undefined}
      data-bold-weekends={boldWeekends ? "" : undefined}
      data-today-dot={(todayDot ?? !renderDay) ? "" : undefined}
      data-today-outline={highlightToday ? "" : undefined}
      className={[styles.grid, className].filter(Boolean).join(" ")}
      style={getGridSlotStyle(col)}
      onKeyDown={onKeyDown}
      onMouseLeave={() => hover(undefined)}
    >
      {!hideWeekdays && (
        <div role="row" data-weekdays="" className={styles.row}>
          {weekNumbers && (
            <span
              role="columnheader"
              data-weekday=""
              className={styles.weekday}
            >
              <span className={styles.srOnly}>
                {t("week", undefined, weekLabel)}
              </span>
            </span>
          )}
          {grid.weekdayOrder.map((w, i) => (
            <span
              key={w}
              role="columnheader"
              data-weekday=""
              className={styles.weekday}
              aria-label={weekdayLabels.long[i]}
            >
              {weekdayLabels.visible[i]}
            </span>
          ))}
        </div>
      )}
      {grid.weeks.map((week) => (
        <div role="row" key={dateKey(week[0].date)} className={styles.row}>
          {weekNumbers && (
            <span
              role="rowheader"
              className={styles.weekNumber}
              aria-label={`${t("week", undefined, weekLabel)} ${isoWeek(week[0].date)}`}
            >
              {isoWeek(week[0].date)}
            </span>
          )}
          {week.map((cell) =>
            !cell.inMonth && !showOutsideDays ? (
              <span
                key={dateKey(cell.date)}
                role="gridcell"
                aria-hidden="true"
                className={styles.cellEmpty}
              />
            ) : (
              <DayCell
                key={dateKey(cell.date)}
                date={cell.date}
                label={cellLabel(cell.date)}
                flags={dayFlags(
                  cell.date,
                  lookup,
                  config,
                  preview,
                  todayDate,
                  cell.inMonth,
                )}
                focusable={datesEqual(cell.date, effectiveFocus)}
                renderDay={renderDay}
                onSelect={onSelectCell}
                onHover={hover}
              />
            ),
          )}
        </div>
      ))}
    </div>
  );
}
