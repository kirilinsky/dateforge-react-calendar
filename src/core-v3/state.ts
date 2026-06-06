import type { CalendarDate } from "./calendar-date";
import type { CalendarDateTime } from "./calendar-date-time";
import type { CalendarRange } from "./calendar-range";
import type { CalendarTime } from "./calendar-time";
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
export type CalendarConfig = {
  unit: SelectionUnit;
  mode: SelectionMode;
  timeZone?: string;
  locale?: string;
  /** Resolved week start (0=Sun..6=Sat), from locale or explicit prop. */
  firstDayOfWeek: number;
  readOnly: boolean;
  /**
   * Clicking the already-selected day deselects it. Default behavior is `true`
   * (absent === enabled); set `false` to keep the selection on re-click.
   */
  deselectOnReclick?: boolean;
  /** Whether selected values carry a time-of-day. */
  withTime: boolean;
  /** Time applied to a freshly picked day when `withTime` (default time). */
  defaultTime: CalendarTime;
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
    interaction: {},
    validation: EMPTY_VALIDATION_STATE,
  };
}
