import { type CalendarDateTime, calendarDateTime } from "./calendar-date-time";
import type { CalendarRange } from "./calendar-range";
import { MIDNIGHT } from "./calendar-time";
import { applyExclusionAll, combineCuts } from "./segment";
import type { SelectionMode, SelectionUnit } from "./selection-types";
import type { CalendarConfig, SelectionState, SpanSelection } from "./state";
import { fromCalendarDateTime } from "./timezone-boundary";

/**
 * The public boundary value — what `onChange` emits and `value` accepts.
 *
 * Internally selection is `CalendarDate`/`CalendarDateTime`; the public surface
 * is plain JS `Date`, matching the rest of the React ecosystem (react-day-picker,
 * MUI, react-aria all hand back the host date object). The shape narrows by the
 * configured `unit × mode`, like react-day-picker's `mode`-discriminated
 * `onSelect`: a single point is `Date | null`, a span is `{ start, end }`, and
 * the "many" cardinalities are arrays of those. Empty is `null`, never an empty
 * span.
 */
export type PublicRange = { start: Date; end: Date };

/**
 * A single-cardinality span value. Normally one `{ start, end }`, but `exclude`
 * can split the drawn span into several business-day segments — then the value
 * is the array of segments. Without exclusion it is always the lone range (or
 * `null` when empty), so the common case is unchanged.
 */
export type SpanValue = PublicRange | PublicRange[] | null;

/**
 * Value type for a given unit × mode. `day` + single/multiple are point values;
 * everything else (week/month units, or range/multi-range modes) is span-shaped.
 * The "many" cardinality is `multiple` or `multi-range`.
 */
export type CalendarValue<
  U extends SelectionUnit,
  M extends SelectionMode,
> = U extends "day"
  ? M extends "single"
    ? Date | null
    : M extends "multiple"
      ? Date[]
      : M extends "range"
        ? SpanValue
        : PublicRange[]
  : M extends "single" | "range"
    ? SpanValue
    : PublicRange[];

/** The runtime union of every possible emitted value (callers narrow by config). */
export type AnyCalendarValue =
  | Date
  | null
  | Date[]
  | PublicRange
  | PublicRange[];

/**
 * Resolve a wall-clock calendar date-time to an instant for emission. Uses the
 * default DST policies (next-valid / earlier), which never reject — the `ok`
 * guard is defensive and unreachable on this path.
 */
function emitInstant(dt: CalendarDateTime, timeZone?: string): Date {
  const r = fromCalendarDateTime(dt, timeZone);
  return r.ok ? r.date : new Date(Number.NaN);
}

/**
 * Combine a date-level span with its time bounds into a public range. Without
 * `withTime` the bounds are midnight, so the value is effectively date-only.
 */
function rangeToPublic(
  range: CalendarRange,
  sel: SpanSelection,
  timeZone?: string,
): PublicRange {
  return {
    start: emitInstant(
      calendarDateTime(range.start, sel.fromTime ?? MIDNIGHT),
      timeZone,
    ),
    end: emitInstant(
      calendarDateTime(range.end, sel.toTime ?? MIDNIGHT),
      timeZone,
    ),
  };
}

/**
 * Project the internal selection onto the public `Date`-based value for the
 * configured unit × mode. Pure: the only environment touch is the timezone
 * conversion, which is deterministic for a fixed `config.timeZone`.
 *
 * The return is the runtime union; the adapter narrows it to
 * `CalendarValue<U, M>` since it knows the static config.
 */
export function toPublicValue(
  selection: SelectionState,
  config: CalendarConfig,
): AnyCalendarValue {
  const timeZone = config.timeZone;

  if (selection.shape === "point") {
    if (config.mode === "multiple") {
      return selection.dates.map((dt) => emitInstant(dt, timeZone));
    }
    return selection.dates.length
      ? emitInstant(selection.dates[0], timeZone)
      : null;
  }

  // Materialize the cut here, at emit time: a drawn span loses both excluded
  // and disabled days, becoming its surviving segments. State keeps the logical
  // span; the public value reflects what is actually selected. (A user-drawn day
  // range can't contain a disabled day — rejected at commit — so this only bites
  // for atomic week/month units.)
  const cut = combineCuts(config.exclude, config.disabled);
  const segments = applyExclusionAll(selection.ranges, cut).map((r) =>
    rangeToPublic(r, selection, timeZone),
  );

  const many = config.mode === "multiple" || config.mode === "multi-range";
  if (many) return segments;

  // Single cardinality: one logical span, but exclusion may split it. Collapse
  // to the lone range (or null) so the no-exclude case stays `{ start, end }`.
  if (segments.length === 0) return null;
  return segments.length === 1 ? segments[0] : segments;
}
