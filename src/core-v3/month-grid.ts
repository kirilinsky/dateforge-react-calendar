import {
  addDays,
  type CalendarDate,
  calendarDate,
  daysInMonth,
  weekdayOf,
} from "./calendar-date";

/**
 * One day cell in a month grid. Purely structural: which day it is, whether it
 * belongs to the displayed month, and its weekday. Selection/range/disabled
 * state is layered on later by the adapter from the selection store — the pure
 * grid stays state-free so it can be memoized by `(year, month, options)`.
 */
/** @internal */
export type MonthGridCell = {
  readonly date: CalendarDate;
  /** False for leading/trailing days borrowed from the adjacent months. */
  readonly inMonth: boolean;
  /** 0 = Sunday .. 6 = Saturday. */
  readonly weekday: number;
};

export type MonthGrid = {
  readonly year: number;
  readonly month: number;
  /** Weekday indices in display order, honoring `firstDayOfWeek`. */
  readonly weekdayOrder: readonly number[];
  /** Rows of 7 cells each. */
  readonly weeks: readonly (readonly MonthGridCell[])[];
};

export type MonthGridOptions = {
  year: number;
  month: number;
  /** 0 = Sunday (default) .. 6 = Saturday. */
  firstDayOfWeek?: number;
  /**
   * Always emit 6 rows (42 cells). Keeps the grid a constant height so
   * navigating months never reflows or remounts cells — friendly to CSS
   * transitions. Default `true`.
   */
  fixedWeeks?: boolean;
};

const DAYS_PER_WEEK = 7;
const FIXED_ROWS = 6;

/**
 * Build the day matrix for a month, with leading/trailing days from the
 * neighboring months so every row is a full week. Pure and allocation-bounded
 * (42 cells max). No JS `Date`.
 */
export function buildMonthGrid(options: MonthGridOptions): MonthGrid {
  const { year, month } = options;
  // Any of the 7 weekdays is valid (0=Sun..6=Sat); normalize defensively.
  const firstDayOfWeek = ((((options.firstDayOfWeek ?? 0) % 7) + 7) % 7) | 0;
  const fixedWeeks = options.fixedWeeks ?? true;

  const first = calendarDate(year, month, 1);
  const lead =
    (weekdayOf(first) - firstDayOfWeek + DAYS_PER_WEEK) % DAYS_PER_WEEK;
  const start = addDays(first, -lead);

  const span = lead + daysInMonth(year, month);
  const rows = fixedWeeks ? FIXED_ROWS : Math.ceil(span / DAYS_PER_WEEK);
  const total = rows * DAYS_PER_WEEK;

  const weeks: MonthGridCell[][] = [];
  for (let i = 0; i < total; i++) {
    const date = addDays(start, i);
    const cell: MonthGridCell = {
      date,
      inMonth: date.year === year && date.month === month,
      weekday: (firstDayOfWeek + (i % DAYS_PER_WEEK)) % DAYS_PER_WEEK,
    };
    if (i % DAYS_PER_WEEK === 0) weeks.push([]);
    weeks[weeks.length - 1].push(cell);
  }

  const weekdayOrder = Array.from(
    { length: DAYS_PER_WEEK },
    (_, i) => (firstDayOfWeek + i) % DAYS_PER_WEEK,
  );

  return { year, month, weekdayOrder, weeks };
}
