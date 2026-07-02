import { type CalendarDate, calendarDate } from "../core-v3/calendar-date";
import { type CalendarTime, MIDNIGHT } from "../core-v3/calendar-time";
import {
  compileDateRules,
  type DateRuleConfig,
  type DateRuleEngine,
} from "../core-v3/date-rule-engine";
import type { SelectionMode, SelectionUnit } from "../core-v3/selection-types";
import type { CalendarConfig } from "../core-v3/state";

/**
 * User-friendly options for {@link createCalendarConfig} — the ergonomic layer
 * over the compiled `CalendarConfig` the `Calendar` root consumes. Dates are JS
 * `Date` (the public boundary), rule sets are plain {@link DateRuleConfig}
 * objects (or precompiled engines), and everything defaults sensibly.
 */
export type CalendarConfigOptions = {
  /** Selection mode. Default `"single"`. */
  mode?: SelectionMode;
  /** Selection unit. Default `"day"`. */
  unit?: SelectionUnit;
  /** BCP-47 locale for month/weekday names and digits. */
  locale?: string;
  /**
   * Week start (0 = Sunday .. 6 = Saturday). Omit to derive from `locale`
   * (`Intl.Locale.getWeekInfo`), falling back to Monday.
   */
  firstDayOfWeek?: number;
  /** Earliest / latest selectable day (inclusive). */
  min?: Date;
  max?: Date;
  /** Days that cannot be selected (rules or a `createDisabled` engine). */
  disabled?: DateRuleConfig | DateRuleEngine;
  /** Days excluded from emitted spans (business-day cuts). */
  exclude?: DateRuleConfig | DateRuleEngine;
  /** What to do when a span endpoint is excluded. Default `"snap-inward"`. */
  excludedEndpointPolicy?: "snap-inward" | "reject";
  readOnly?: boolean;
  /** Clicking the selected day deselects it. Default `true`. */
  deselectOnReclick?: boolean;
  /** Selected values carry a time of day. */
  withTime?: boolean;
  /** 12-hour clock with AM/PM. */
  hour12?: boolean;
  /** Localized AM/PM labels for `hour12` surfaces. */
  ampmLabels?: { am: string; pm: string };
  /** Time applied to a freshly picked day (when `withTime`). */
  defaultTime?: Partial<CalendarTime>;
  /** Inclusive selectable time-of-day window (when `withTime`). */
  minTime?: Partial<CalendarTime>;
  maxTime?: Partial<CalendarTime>;
  /** Weekend columns for highlighting (0 = Sunday .. 6). Default Sat/Sun. */
  weekendDays?: readonly number[];
  /** Min/max span length in `unit`s (range modes). */
  minSpan?: number;
  maxSpan?: number;
  /** Cap on point selections (multiple mode). */
  maxDates?: number;
  /** Cap on spans (multi-range mode). */
  maxRanges?: number;
  /** IANA time zone for "today" resolution. */
  timeZone?: string;
};

const toCalDate = (d: Date): CalendarDate =>
  calendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());

const toTime = (
  t: Partial<CalendarTime> | undefined,
): CalendarTime | undefined => (t ? { ...MIDNIGHT, ...t } : undefined);

const isEngine = (
  rules: DateRuleConfig | DateRuleEngine,
): rules is DateRuleEngine =>
  typeof (rules as DateRuleEngine).matches === "function";

const toEngine = (
  rules: DateRuleConfig | DateRuleEngine | undefined,
): DateRuleEngine =>
  rules === undefined
    ? compileDateRules()
    : isEngine(rules)
      ? rules
      : compileDateRules(rules);

/** Week start derived from the locale (1=Mon..7=Sun → 0=Sun..6=Sat). */
function localeFirstDay(locale: string | undefined): number {
  try {
    const loc = new Intl.Locale(locale ?? "en-US") as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number };
    };
    const info = loc.getWeekInfo?.();
    if (info) return info.firstDay % 7;
  } catch {
    // fall through
  }
  return 1; // Monday — the most common default
}

/**
 * Build a compiled {@link CalendarConfig} from friendly options. This is THE
 * way to hand a config to `<Calendar>`:
 *
 * ```tsx
 * const config = createCalendarConfig({ mode: "range", locale: "de-DE",
 *   min: new Date(2026, 0, 1), disabled: { weekends: true } });
 * <Calendar config={config}>…</Calendar>
 * ```
 */
export function createCalendarConfig(
  options: CalendarConfigOptions = {},
): CalendarConfig {
  const {
    mode = "single",
    unit = "day",
    locale,
    firstDayOfWeek,
    min,
    max,
    disabled,
    exclude,
    excludedEndpointPolicy = "snap-inward",
    readOnly = false,
    deselectOnReclick,
    withTime = false,
    hour12,
    ampmLabels,
    defaultTime,
    minTime,
    maxTime,
    weekendDays,
    minSpan,
    maxSpan,
    maxDates,
    maxRanges,
    timeZone,
  } = options;
  return {
    mode,
    unit,
    locale,
    firstDayOfWeek: firstDayOfWeek ?? localeFirstDay(locale),
    min: min ? toCalDate(min) : undefined,
    max: max ? toCalDate(max) : undefined,
    disabled: toEngine(disabled),
    exclude: toEngine(exclude),
    excludedEndpointPolicy,
    readOnly,
    deselectOnReclick,
    withTime,
    hour12,
    ampmLabels,
    defaultTime: toTime(defaultTime) ?? MIDNIGHT,
    minTime: toTime(minTime),
    maxTime: toTime(maxTime),
    weekendDays,
    minSpan,
    maxSpan,
    maxDates,
    maxRanges,
    timeZone,
  };
}
