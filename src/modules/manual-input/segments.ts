import { type CalendarDate, calendarDate } from "../../core/calendar-date";

/**
 * Format-segment helpers for the masked input: locate the date segment (DD /
 * MM / YYYY) under the cursor and step its value — the MUI DateField /
 * react-aria keyboard model (ArrowUp/Down increments the focused segment).
 *
 * All math is wall-clock on the mask string; no JS Date, no timezone.
 */

/** @internal */
export type SegmentKind = "day" | "month" | "year";

/** @internal */
export type Segment = {
  kind: SegmentKind;
  /** Char range in the format/mask string: [start, end). */
  start: number;
  end: number;
};

const TOKEN_TO_KIND: Record<string, SegmentKind> = {
  DD: "day",
  MM: "month",
  YYYY: "year",
};

/** @internal */
export function formatSegments(format: string): Segment[] {
  const out: Segment[] = [];
  for (const token of ["DD", "MM", "YYYY"]) {
    const start = format.indexOf(token);
    if (start >= 0) {
      out.push({
        kind: TOKEN_TO_KIND[token],
        start,
        end: start + token.length,
      });
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

/** The segment containing (or immediately left of) the caret. @internal */
export function segmentAt(format: string, pos: number): Segment | null {
  const segments = formatSegments(format);
  for (const seg of segments) {
    if (pos >= seg.start && pos <= seg.end) return seg;
  }
  // Caret on a separator: snap to the nearest segment to the left, else first.
  let best: Segment | null = null;
  for (const seg of segments) {
    if (seg.end <= pos) best = seg;
  }
  return best ?? segments[0] ?? null;
}

const daysInMonth = (year: number, month: number): number =>
  new Date(year, month, 0).getDate();

const pad = (value: number, width: number): string =>
  String(value).padStart(width, "0");

/**
 * Step the segment under `pos` by ±1, wrapping day/month and clamping year.
 * Incomplete segments seed from `seed` (selected date or today) so the first
 * Arrow press lands on a meaningful value instead of NaN.
 * Returns the new mask text plus the segment range to select.
 */
export function stepSegment(
  text: string,
  format: string,
  pos: number,
  dir: 1 | -1,
  seed: CalendarDate,
): { text: string; selStart: number; selEnd: number } | null {
  const seg = segmentAt(format, pos);
  if (!seg) return null;

  const read = (s: Segment): number | null => {
    const raw = text.slice(s.start, s.end);
    return raw.length === s.end - s.start && /^\d+$/.test(raw)
      ? Number(raw)
      : null;
  };

  const segments = formatSegments(format);
  const byKind = (kind: SegmentKind) => segments.find((s) => s.kind === kind);
  const yearSeg = byKind("year");
  const monthSeg = byKind("month");
  const year = (yearSeg && read(yearSeg)) ?? seed.year;
  const month = (monthSeg && read(monthSeg)) ?? seed.month;

  const current =
    read(seg) ??
    (seg.kind === "day"
      ? seed.day
      : seg.kind === "month"
        ? seed.month
        : seed.year);

  let next: number;
  if (seg.kind === "day") {
    const max = daysInMonth(year, month);
    next = ((current - 1 + dir + max) % max) + 1;
  } else if (seg.kind === "month") {
    next = ((current - 1 + dir + 12) % 12) + 1;
  } else {
    next = Math.min(9999, Math.max(1, current + dir));
  }

  // Rebuild the mask: keep other segments' digits (or seed them when the text
  // hasn't reached them yet), copy separators straight from the format.
  let out = "";
  for (let i = 0; i < format.length; i++) {
    const inSeg = segments.find((s) => i >= s.start && i < s.end);
    if (!inSeg) {
      out += format[i];
      continue;
    }
    const width = inSeg.end - inSeg.start;
    const value =
      inSeg.kind === seg.kind
        ? next
        : (read(inSeg) ??
          (inSeg.kind === "day"
            ? seed.day
            : inSeg.kind === "month"
              ? seed.month
              : seed.year));
    out += pad(value, width)[i - inSeg.start];
  }

  return { text: out, selStart: seg.start, selEnd: seg.end };
}

/** Parse a COMPLETE mask straight to a CalendarDate — wall-clock, no JS Date
 *  roundtrip, no timezone shift. Returns null while the mask is partial. */
export function maskToCalendarDate(
  text: string,
  format: string,
): CalendarDate | null {
  const segments = formatSegments(format);
  if (segments.length < 3 || text.length !== format.length) return null;
  const parts: Partial<Record<SegmentKind, number>> = {};
  for (const seg of segments) {
    const raw = text.slice(seg.start, seg.end);
    if (!/^\d+$/.test(raw)) return null;
    parts[seg.kind] = Number(raw);
  }
  const { year, month, day } = parts as Record<SegmentKind, number>;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  return calendarDate(year, month, day);
}
