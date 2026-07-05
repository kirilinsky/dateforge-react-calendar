import { type CalendarDateTime, calendarDateTime } from "./calendar-date-time";
import { type CalendarRange, mergeRanges } from "./calendar-range";
import { MIDNIGHT } from "./calendar-time";
import { applyExclusionAll, combineCuts } from "./segment";
import type { SelectionMode, SelectionUnit } from "./selection-types";
import type { CalendarConfig, SelectionState, SpanSelection } from "./state";
import { selectionShape } from "./state";
import { fromCalendarDateTime, toCalendarDateTime } from "./timezone-boundary";
import { warnOnce } from "./warnings";

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
 * Value type for a given unit × mode. The shape is derived from `(unit, mode)`
 * ALONE — `exclude`/`disabled`/`maxRanges` never change it (the §2d invariant):
 * a consumer can type its `onChange` handler from the props it passes, with no
 * conditional types over optional flags.
 *
 * `value` always carries the LOGICAL spans (the user's anchor→end intent), never
 * the segmented result. Excluded-day segments are derived data and ride along in
 * {@link CalendarChangeDetails.segments}, not in `value`.
 *
 * - `day` single → `Date | null`, multiple → `Date[]` (point cardinalities);
 * - any single-cardinality span (range, or week/month single) → `PublicRange | null`;
 * - any "many" span (multi-range, or week/month multiple) → `PublicRange[]`.
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
        ? PublicRange | null
        : PublicRange[]
  : M extends "single" | "range"
    ? PublicRange | null
    : PublicRange[];

/** The runtime union of every possible emitted value (callers narrow by config). */
export type AnyCalendarValue =
  | Date
  | null
  | Date[]
  | PublicRange
  | PublicRange[];

/** Why a committed change fired — mapped from the action that caused it (§2d). */
export type ChangeReason =
  | "select"
  | "clear"
  | "preset"
  | "time"
  | "remove"
  | "external-sync";

/**
 * The second argument to `onChange` (§2d). `value` carries logical spans;
 * derived/segmented data travels here so the value's static type never shifts.
 *
 * `segments` is present only when `exclude`/`disabled` are configured AND the
 * selection is span-shaped: it is every span's surviving business-day segments,
 * flattened and ordered. Consumers whose real value IS the segment list
 * (booking, business days) read this instead of `value`.
 */
export type CalendarChangeDetails = {
  segments?: PublicRange[];
  reason: ChangeReason;
};

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
 * Emits LOGICAL spans only (§2d): `exclude`/`disabled` never reshape the value.
 * The segmented business-day view is computed separately by {@link toSegments}
 * and delivered through change details. Single-cardinality spans collapse to the
 * lone range (or `null`); "many" cardinalities emit the array of logical spans.
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

  const spans = selection.ranges.map((r) =>
    rangeToPublic(r, selection, timeZone),
  );

  const many = config.mode === "multiple" || config.mode === "multi-range";
  if (many) return spans;

  // Single cardinality: one logical span (or null when empty). The span is NOT
  // split here even under exclusion — segmentation is derived data (toSegments).
  return spans.length ? spans[0] : null;
}

/**
 * Materialize the segmented (business-day) view of a span selection: each drawn
 * span loses its `exclude`d and `disabled` days, becoming the surviving
 * contiguous segments, flattened and ordered across all spans (§2d).
 *
 * Returns `undefined` when segmentation does not apply — point shapes, or when
 * neither `exclude` nor `disabled` is configured — so the common case allocates
 * nothing and `details.segments` stays absent. (A user-drawn day range can't
 * contain a disabled day — rejected at commit — so for `day` units this only
 * differs from `value` when `exclude` is set; for atomic week/month units a
 * `disabled` day inside the unit is dropped here too.)
 */
export function toSegments(
  selection: SelectionState,
  config: CalendarConfig,
): PublicRange[] | undefined {
  if (selection.shape !== "span") return undefined;
  const cut = combineCuts(config.exclude, config.disabled);
  if (cut.isEmpty) return undefined;
  return applyExclusionAll(selection.ranges, cut).map((r) =>
    rangeToPublic(r, selection, config.timeZone),
  );
}

/**
 * Pad a number to a fixed width for lexicographically-sortable date keys.
 */
function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

/**
 * Canonical key for one public `Date`, computed in the CALENDAR zone (§2d):
 * `YYYY-MM-DD`, plus `THH:mm:ss.SSS` only when the composition edits time. This
 * is why identity is robust to host-zone vs calendar-zone differences and to DST
 * shifts — never a raw `getTime()` delta — and why a time-less composition
 * ignores the time-of-day of an incoming `Date`.
 */
function dateKey(date: Date, config: CalendarConfig): string {
  const { date: d, time: t } = toCalendarDateTime(date, config.timeZone);
  const day = `${pad(d.year, 4)}-${pad(d.month, 2)}-${pad(d.day, 2)}`;
  if (!config.withTime) return day;
  return `${day}T${pad(t.hour, 2)}:${pad(t.minute, 2)}:${pad(t.second, 2)}.${pad(t.ms, 3)}`;
}

function rangeKey(r: PublicRange, config: CalendarConfig): string {
  return `${dateKey(r.start, config)}..${dateKey(r.end, config)}`;
}

/**
 * Stable identity key for a public value — used by the controlled adapter to
 * tell whether `value` really changed before re-syncing the store (the host
 * often passes a fresh array/object identity each render). Computed in the
 * calendar zone (§2d). Arrays are sorted, so re-emitting an equal value in a
 * different order produces the same key and never triggers a sync loop. Segments
 * never participate — `value` carries only logical spans by construction.
 */
export function valueKey(
  value: AnyCalendarValue,
  config: CalendarConfig,
): string {
  if (value === null) return "";
  if (value instanceof Date) return dateKey(value, config);
  if (Array.isArray(value)) {
    const keys = value.map((item) =>
      item instanceof Date ? dateKey(item, config) : rangeKey(item, config),
    );
    keys.sort();
    return keys.join("|");
  }
  return rangeKey(value, config);
}

/** A real, non-NaN `Date` — the only thing allowed through the boundary. */
function isValidDate(d: unknown): d is Date {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

function isValidRange(r: unknown): r is PublicRange {
  return (
    typeof r === "object" &&
    r !== null &&
    isValidDate((r as PublicRange).start) &&
    isValidDate((r as PublicRange).end)
  );
}

function describeBad(item: unknown): string {
  if (item instanceof Date) return "Invalid Date";
  if (Array.isArray(item)) return "nested array";
  return typeof item;
}

/**
 * Normalize + validate the point-shape input: `Invalid Date` and non-Date
 * entries are dropped with a dev warning, a lone `Date` in multiple mode is
 * wrapped, and an array in single mode collapses to its first valid entry —
 * the v2 "never throws on bad input" contract.
 */
function pointValueToDates(value: AnyCalendarValue, multiple: boolean): Date[] {
  if (value == null) return [];
  const items = Array.isArray(value) ? value : [value];
  const dates: Date[] = [];
  for (const item of items) {
    if (isValidDate(item)) {
      dates.push(item);
      if (!multiple) break; // single: first valid entry wins
    } else {
      warnOnce("invalidValue", describeBad(item));
    }
  }
  if (!multiple && Array.isArray(value) && value.length > 1) {
    warnOnce("invalidValue", "array in single mode; using the first entry");
  }
  return dates;
}

/**
 * Normalize the runtime span shapes (lone range or array) into ranges. Invalid
 * entries (NaN bounds, non-objects) are dropped with a dev warning; a lone
 * valid `Date` degrades to a one-day span (shape-mismatch normalization).
 */
function spanValueToRanges(value: AnyCalendarValue): readonly PublicRange[] {
  if (value === null || value === undefined) return [];
  const items = Array.isArray(value) ? value : [value];
  const ranges: PublicRange[] = [];
  for (const item of items) {
    if (isValidRange(item)) ranges.push(item);
    else if (isValidDate(item)) ranges.push({ start: item, end: item });
    else warnOnce("invalidValue", describeBad(item));
  }
  return ranges;
}

/**
 * Inverse of {@link toPublicValue}: parse a public `Date`-based value into the
 * internal selection for the configured unit × mode. The boundary adapter for
 * controlled mode — `value` in, state out, no callbacks.
 *
 * A clean round-trip now that `value` carries logical spans (§2d): `exclude`/
 * `disabled` no longer leak segmentation into the value, so parsing back yields
 * the same logical spans that were emitted.
 */
export function fromPublicValue(
  value: AnyCalendarValue,
  config: CalendarConfig,
): SelectionState {
  const timeZone = config.timeZone;
  const shape = selectionShape(config.unit, config.mode);

  if (shape === "point") {
    const dates = pointValueToDates(value, config.mode === "multiple");
    return {
      shape: "point",
      dates: dates.map((d) => toCalendarDateTime(d, timeZone)),
    };
  }

  const publicRanges = spanValueToRanges(value);
  const bounds = publicRanges.map((r) => ({
    start: toCalendarDateTime(r.start, timeZone),
    end: toCalendarDateTime(r.end, timeZone),
  }));
  const ranges = mergeRanges(
    bounds.map((b) => ({ start: b.start.date, end: b.end.date })),
  );

  // One pair of time bounds per span selection: first start, last end.
  const withTime = config.withTime && bounds.length > 0;
  return {
    shape: "span",
    ranges,
    fromTime: withTime ? bounds[0].start.time : undefined,
    toTime: withTime ? bounds[bounds.length - 1].end.time : undefined,
  };
}
