import { type CalendarDate, calendarDate } from "@/core-v3/calendar-date";
import { type CalendarTime, MIDNIGHT } from "@/core-v3/calendar-time";
import { compileDateRules } from "@/core-v3/date-rule-engine";
import type { SelectionMode, SelectionUnit } from "@/core-v3/selection-types";
import type {
  CalendarConfig,
  PointSelection,
  SpanSelection,
} from "@/core-v3/state";

/**
 * Shared v3 test fixtures (Phase A). Data-focused builders for the public
 * surface — external value shapes, configs, and internal selections — so module
 * tests (Days, ManualInput, Presets, …) describe the CONTRACT with one vocabulary
 * instead of re-declaring `config`/`point`/`span` helpers per file.
 *
 * These are NOT a snapshot of legacy internals: they encode the v3 contract.
 * Where v3 deliberately diverges from v1/v2, see the "Intentional v3 breaks"
 * section in `.notes/plans/v3.md`.
 */

/** Build a `CalendarDate` (year, 1-12 month, day). */
export const D = (y: number, m: number, d: number): CalendarDate =>
  calendarDate(y, m, d);

/**
 * A compiled `CalendarConfig` with sane defaults; override any field. Defaults
 * to `day × single`, Monday week start, no time, no disabled/exclude rules.
 */
export function buildConfig(
  over: Partial<CalendarConfig> = {},
): CalendarConfig {
  return {
    unit: "day" as SelectionUnit,
    mode: "single" as SelectionMode,
    firstDayOfWeek: 1,
    locale: "en-US",
    readOnly: false,
    withTime: false,
    defaultTime: MIDNIGHT,
    excludedEndpointPolicy: "snap-inward",
    disabled: compileDateRules(),
    exclude: compileDateRules(),
    ...over,
  };
}

/** A point selection (single/multiple) from dates with optional times. */
export const point = (
  ...dates: { d: CalendarDate; t?: CalendarTime }[]
): PointSelection => ({
  shape: "point",
  dates: dates.map(({ d, t }) => ({ date: d, time: t ?? MIDNIGHT })),
});

/** A span selection (range/multi-range/week/month) from [start, end] pairs. */
export const span = (
  ranges: [CalendarDate, CalendarDate][],
  times?: { from?: CalendarTime; to?: CalendarTime },
): SpanSelection => ({
  shape: "span",
  ranges: ranges.map(([start, end]) => ({ start, end })),
  fromTime: times?.from,
  toTime: times?.to,
});

/**
 * External public value builders — what `onChange` emits and `value` accepts.
 * `Date`-based, matching the public boundary. Local-midnight by default.
 */
export const extDate = (
  y: number,
  m: number,
  d: number,
  h = 0,
  min = 0,
): Date => new Date(y, m - 1, d, h, min);

/** @internal */
export const extRange = (
  start: [number, number, number],
  end: [number, number, number],
): { start: Date; end: Date } => ({
  start: extDate(...start),
  end: extDate(...end),
});
