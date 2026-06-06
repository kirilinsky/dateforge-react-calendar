import { type CalendarDate, calendarDate } from "./calendar-date";
import { type CalendarDateTime, calendarDateTime } from "./calendar-date-time";
import { calendarTime } from "./calendar-time";

/**
 * The one boundary where JS `Date` is allowed.
 *
 * Everything inside the core works on pure calendar structs. This module is the
 * only place that converts between a `Date` instant and wall-clock calendar
 * date/time, and the only place that knows about timezones and DST. All
 * timezone questions ("what is today here?", "turn this instant into a wall
 * clock", "turn this wall clock into an instant") go through here so no module
 * hand-rolls timezone math.
 *
 * Zero runtime deps: `Intl.DateTimeFormat` does the heavy lifting. Forward
 * (instant -> wall clock) is direct; reverse (wall clock -> instant) searches
 * for the matching instant and resolves DST gaps/folds with an explicit policy.
 */

const HOUR_MS = 3_600_000;

/** Nonexistent local time (spring-forward gap) resolution. */
export type NonexistentTimePolicy = "next-valid" | "previous-valid" | "reject";
/** Ambiguous local time (fall-back fold) resolution. */
export type AmbiguousTimePolicy = "earlier" | "later";

export type ConversionOptions = {
  nonexistent?: NonexistentTimePolicy; // default "next-valid"
  ambiguous?: AmbiguousTimePolicy; // default "earlier"
};

export type ConversionResult =
  | {
      ok: true;
      /** The resolved instant. */
      date: Date;
      /** "exact" for a normal time, "ambiguous" when a fold was resolved. */
      kind: "exact" | "ambiguous";
      /** True when the wall clock was coerced (gap shift or fold pick). */
      adjusted: boolean;
    }
  | { ok: false; reason: "nonexistent" };

// --- formatter cache (perf): constructing Intl formatters is expensive ---

const partsCache = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone?: string): Intl.DateTimeFormat {
  const key = timeZone ?? "";
  let f = partsCache.get(key);
  if (!f) {
    try {
      f = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch (error) {
      if (timeZone !== undefined && error instanceof RangeError) {
        return partsFormatter(undefined);
      }
      throw error;
    }
    partsCache.set(key, f);
  }
  return f;
}

type WallParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function wallPartsAt(
  timeZone: string | undefined,
  instantMs: number,
): WallParts {
  const parts = partsFormatter(timeZone).formatToParts(new Date(instantMs));
  const get = (type: string) => {
    const p = parts.find((x) => x.type === type);
    return p ? Number.parseInt(p.value, 10) : 0;
  };
  // hour12:false can render midnight as "24" in some engines.
  const hour = get("hour") % 24;
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour,
    minute: get("minute"),
    second: get("second"),
  };
}

/**
 * Timezone offset in ms (`localWallAsUTC - instant`) at a given instant.
 * `instant` is expected to be at second resolution (ms = 0). Negative west of
 * UTC, positive east.
 */
function offsetAt(timeZone: string | undefined, instant: number): number {
  const p = wallPartsAt(timeZone, instant);
  const asUTC = Date.UTC(
    p.year,
    p.month - 1,
    p.day,
    p.hour,
    p.minute,
    p.second,
  );
  return asUTC - instant;
}

/**
 * All instants whose wall clock in `timeZone` equals `wallUTC` (the wall time
 * encoded as a UTC timestamp). 0 = nonexistent (gap), 1 = normal, 2 =
 * ambiguous (fold). Probes both sides of any sub-day transition.
 */
function instantsForWall(
  timeZone: string | undefined,
  wallUTC: number,
): number[] {
  const o1 = offsetAt(timeZone, wallUTC);
  const t1 = wallUTC - o1;
  // Candidate offsets in effect on either side of the target instant.
  const offsets = new Set([
    o1,
    offsetAt(timeZone, t1),
    offsetAt(timeZone, t1 - 2 * HOUR_MS),
    offsetAt(timeZone, t1 + 2 * HOUR_MS),
  ]);
  const valid = new Set<number>();
  for (const off of offsets) {
    const cand = wallUTC - off;
    // cand round-trips iff the real offset at cand is exactly `off`.
    if (offsetAt(timeZone, cand) === off) valid.add(cand);
  }
  return [...valid].sort((a, b) => a - b);
}

/** Current calendar date in the given zone (system zone when omitted). */
export function today(timeZone?: string): CalendarDate {
  const p = wallPartsAt(timeZone, Date.now());
  return calendarDate(p.year, p.month, p.day);
}

/** Instant -> wall-clock calendar date/time in the given zone. */
export function toCalendarDateTime(
  date: Date,
  timeZone?: string,
): CalendarDateTime {
  const instant = date.getTime();
  const p = wallPartsAt(timeZone, instant);
  const ms = ((instant % 1000) + 1000) % 1000;
  return calendarDateTime(
    calendarDate(p.year, p.month, p.day),
    calendarTime(p.hour, p.minute, p.second, ms),
  );
}

/**
 * Wall-clock calendar date/time -> instant in the given zone, resolving DST
 * gaps and folds per policy. Never crashes and never emits an invalid instant.
 */
export function fromCalendarDateTime(
  dt: CalendarDateTime,
  timeZone?: string,
  options: ConversionOptions = {},
): ConversionResult {
  const { date, time } = dt;
  const nonexistent = options.nonexistent ?? "next-valid";
  const ambiguous = options.ambiguous ?? "earlier";

  // Wall clock encoded as a UTC timestamp, ms stripped (offsets are minutes).
  const wallUTC = Date.UTC(
    date.year,
    date.month - 1,
    date.day,
    time.hour,
    time.minute,
    time.second,
    0,
  );
  const instants = instantsForWall(timeZone, wallUTC);

  if (instants.length === 1) {
    return {
      ok: true,
      date: new Date(instants[0] + time.ms),
      kind: "exact",
      adjusted: false,
    };
  }

  if (instants.length >= 2) {
    const pick =
      ambiguous === "later" ? instants[instants.length - 1] : instants[0];
    return {
      ok: true,
      date: new Date(pick + time.ms),
      kind: "ambiguous",
      adjusted: true,
    };
  }

  // Gap: the wall time does not exist.
  if (nonexistent === "reject") return { ok: false, reason: "nonexistent" };

  const o1 = offsetAt(timeZone, wallUTC);
  const o2 = offsetAt(timeZone, wallUTC - o1);
  // next-valid jumps forward over the gap; previous-valid stays before it.
  const off =
    nonexistent === "next-valid" ? Math.min(o1, o2) : Math.max(o1, o2);
  return {
    ok: true,
    date: new Date(wallUTC - off + time.ms),
    kind: "exact",
    adjusted: true,
  };
}
