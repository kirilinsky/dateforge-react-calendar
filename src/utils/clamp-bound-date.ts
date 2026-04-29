// Per-track field limits for range bounds: when picking `to`, the composite
// date must stay >= `from` (and symmetric for `from` <= `to`). The allowed
// range for one field depends on the other fields currently in refDate, so
// limits are recomputed each render.
//
// Returns -Infinity / +Infinity sentinels when the field has no constraint
// from the bound side. Combine with absolute minDate/maxDate via max/min.

interface BoundLimitsInput {
  bound: "from" | "to" | undefined;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  refYear: number;
  refMonth: number;
  refDay: number;
  daysInRefMonth: number;
}

interface BoundLimits {
  yearMin: number;
  yearMax: number;
  monthMin: number;
  monthMax: number;
  dayMin: number;
  dayMax: number;
}

const NONE: BoundLimits = {
  yearMin: -Infinity,
  yearMax: Infinity,
  monthMin: -Infinity,
  monthMax: Infinity,
  dayMin: -Infinity,
  dayMax: Infinity,
};

export function computeBoundLimits({
  bound,
  rangeStart,
  rangeEnd,
  refYear,
  refMonth,
  refDay,
  daysInRefMonth,
}: BoundLimitsInput): BoundLimits {
  const out: BoundLimits = { ...NONE };

  if (bound === "to" && rangeStart) {
    const fy = rangeStart.getFullYear();
    const fm = rangeStart.getMonth();
    const fd = rangeStart.getDate();

    out.yearMin =
      refMonth > fm || (refMonth === fm && refDay >= fd) ? fy : fy + 1;

    if (refYear > fy) out.monthMin = 0;
    else if (refYear < fy) out.monthMin = 12;
    else out.monthMin = refDay >= fd ? fm : fm + 1;

    if (refYear > fy || (refYear === fy && refMonth > fm)) out.dayMin = 0;
    else if (refYear < fy || (refYear === fy && refMonth < fm))
      out.dayMin = daysInRefMonth;
    else out.dayMin = fd - 1;
  }

  if (bound === "from" && rangeEnd) {
    const ty = rangeEnd.getFullYear();
    const tm = rangeEnd.getMonth();
    const td = rangeEnd.getDate();

    out.yearMax =
      refMonth < tm || (refMonth === tm && refDay <= td) ? ty : ty - 1;

    if (refYear < ty) out.monthMax = 11;
    else if (refYear > ty) out.monthMax = -1;
    else out.monthMax = refDay <= td ? tm : tm - 1;

    if (refYear < ty || (refYear === ty && refMonth < tm))
      out.dayMax = daysInRefMonth - 1;
    else if (refYear > ty || (refYear === ty && refMonth > tm)) out.dayMax = -1;
    else out.dayMax = td - 1;
  }

  return out;
}

export function clampBoundDate(
  next: Date,
  bound: "from" | "to",
  rangeStart: Date | null,
  rangeEnd: Date | null,
): Date {
  if (bound === "to" && rangeStart && next.getTime() < rangeStart.getTime()) {
    return new Date(rangeStart);
  }
  if (bound === "from" && rangeEnd && next.getTime() > rangeEnd.getTime()) {
    return new Date(rangeEnd);
  }
  return next;
}
