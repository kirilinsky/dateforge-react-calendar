import type { CalendarDate } from "./calendar-date";
import type { CalendarDateTime } from "./calendar-date-time";
import type { CalendarRange } from "./calendar-range";
import { type CalendarTime, clampTime } from "./calendar-time";
import type { DateRuleEngine } from "./date-rule-engine";
import type { SelectionMode, SelectionUnit } from "./selection-types";
import { EMPTY_VALIDATION_STATE, type ValidationState } from "./validation";

/**
 * Static, compiled calendar config. Built once (engines compiled, locale
 * resolved) and passed to the reducer alongside state — it is NOT stored in
 * state, so controlled updates and serialization stay clean.
 *
 * `disabled` and `exclude` are the SAME engine shape with different meaning:
 * disabled blocks selection entirely; exclude is skipped inside a span and
 * splits it into segments.
 */
/** Default weekend (Sat + Sun) when `CalendarConfig.weekendDays` is unset. */
export const DEFAULT_WEEKEND_DAYS: readonly number[] = [0, 6];

export type CalendarConfig = {
  unit: SelectionUnit;
  mode: SelectionMode;
  timeZone?: string;
  locale?: string;
  /** Resolved week start (0=Sun..6=Sat), from locale or explicit prop. */
  firstDayOfWeek: number;
  /**
   * Which weekdays count as the weekend for highlighting (`data-weekend` +
   * the Days weekend column tint). `0=Sun..6=Sat`. Defaults to `[0, 6]`
   * (Sat/Sun) — override for regions like Fri/Sat (`[5, 6]`) or a single-day
   * weekend. Purely presentational: it does NOT disable those days (use
   * `createDisabled({ weekdays })` for that).
   */
  weekendDays?: readonly number[];
  readOnly: boolean;
  /**
   * Clicking the already-selected day deselects it. Default behavior is `true`
   * (absent === enabled); set `false` to keep the selection on re-click.
   */
  deselectOnReclick?: boolean;
  /** Whether selected values carry a time-of-day. */
  withTime: boolean;
  /**
   * 12-hour clock with an AM/PM period. Root-level so the toolbar time trigger,
   * ManualInput and the TimeWheel can't desync (a 12h display over a 24h
   * picker). Default `false` (24h). Time modules read this unless overridden.
   */
  hour12?: boolean;
  /** Time applied to a freshly picked day when `withTime` (default time). */
  defaultTime: CalendarTime;
  /**
   * Earliest selectable time-of-day when `withTime`. An inclusive wall-clock
   * floor applied to EVERY day's time (it is not a date-time, so it gates the
   * time independent of which day is picked). A `setTime` below it is rejected
   * (`time-before-min`); the time modules also gate their steppers/drums to it.
   */
  minTime?: CalendarTime;
  /** Latest selectable time-of-day when `withTime` (inclusive). See {@link minTime}. */
  maxTime?: CalendarTime;
  /**
   * Localized AM/PM labels for `hour12` surfaces (toolbar time, wheels). Default
   * `{ am: "AM", pm: "PM" }`. Root-level so every time module reads the same.
   */
  ampmLabels?: { am: string; pm: string };
  min?: CalendarDate;
  max?: CalendarDate;
  /** Min/max span length, expressed in `unit`s (range/multi-range). */
  minSpan?: number;
  maxSpan?: number;
  /** Cap on point selections (multiple mode). */
  maxDates?: number;
  /** Cap on logical spans (multi-range mode). */
  maxRanges?: number;
  disabled: DateRuleEngine;
  exclude: DateRuleEngine;
  excludedEndpointPolicy: "snap-inward" | "reject";
};

/**
 * The default time to apply to a freshly picked day, clamped into the
 * `[minTime, maxTime]` window. A `defaultTime` outside the window would commit
 * an out-of-window value (then sit there un-nudgeable, since `setTime` walls at
 * the window) and seed the time modules' display out of range — so every
 * consumer resolves through here. Returns `config.defaultTime` unchanged when
 * it already fits (or no window is set).
 */
export function resolveDefaultTime(config: CalendarConfig): CalendarTime {
  return clampTime(config.defaultTime, config.minTime, config.maxTime);
}

/**
 * Selection storage collapses the unit × mode matrix into two shapes:
 * - **point** — discrete day selections (only `unit:"day"` + single/multiple);
 * - **span** — ranges (week/month units, and range / multi-range modes).
 *
 * The shape is derived from config once; the strategy enforces cardinality
 * (single = at most one) within the shape.
 */
export type PointSelection = {
  shape: "point";
  dates: readonly CalendarDateTime[];
};

export type SpanSelection = {
  shape: "span";
  /** Date-level spans — drive the grid; sorted, non-overlapping when committed. */
  ranges: readonly CalendarRange[];
  /** Pending anchor while drawing the current span. */
  draftAnchor?: CalendarDate;
  /** Time bounds for the active range when `withTime` (range mode). */
  fromTime?: CalendarTime;
  toTime?: CalendarTime;
};

export type SelectionState = PointSelection | SpanSelection;

/** Visual navigation anchor — a `CalendarDate`, never a date-time. */
export type ViewState = {
  viewDate: CalendarDate;
};

/** Ephemeral interaction state — hover preview and roving focus target. */
export type InteractionState = {
  hoverDate?: CalendarDate;
  focusDate?: CalendarDate;
};

export type CalendarState = {
  selection: SelectionState;
  view: ViewState;
  interaction: InteractionState;
  validation: ValidationState;
};

/** Which storage shape a unit × mode combo uses. */
export function selectionShape(
  unit: SelectionUnit,
  mode: SelectionMode,
): SelectionState["shape"] {
  return unit === "day" && (mode === "single" || mode === "multiple")
    ? "point"
    : "span";
}

/** Empty selection for a shape. */
export function emptySelection(shape: SelectionState["shape"]): SelectionState {
  return shape === "point"
    ? { shape: "point", dates: [] }
    : { shape: "span", ranges: [] };
}

export type InitialStateInput = {
  /** Initial view anchor (adapter passes `today(timeZone)` or `defaultViewDate`). */
  view: CalendarDate;
  /** Optional seeded selection (uncontrolled `defaultValue`). */
  selection?: SelectionState;
  /**
   * Optional initial roving-focus target (the Focus Manager resolves this from
   * the root `initialFocus` prop). Seeding it in state — rather than firing a
   * mount effect — keeps first focus StrictMode-safe: the Days module DOM-focuses
   * whatever `focusDate` points at, idempotently.
   */
  focus?: CalendarDate;
};

/** Build the initial reducer state. Pure — the caller supplies the view date. */
export function createInitialState(
  config: CalendarConfig,
  init: InitialStateInput,
): CalendarState {
  return {
    selection:
      init.selection ??
      emptySelection(selectionShape(config.unit, config.mode)),
    view: { viewDate: init.view },
    interaction: init.focus ? { focusDate: init.focus } : {},
    validation: EMPTY_VALIDATION_STATE,
  };
}
