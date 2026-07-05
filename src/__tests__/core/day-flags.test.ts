import { describe, expect, it } from "vitest";
import { calendarDate } from "@/core/calendar-date";
import { MIDNIGHT } from "@/core/calendar-time";
import { compileDateRules } from "@/core/date-rule-engine";
import {
  buildDayLookup,
  buildPreviewSegments,
  DayFlag,
  dayFlags,
} from "@/core/day-flags";
import type { SelectionMode, SelectionUnit } from "@/core/selection-types";
import type {
  CalendarConfig,
  PointSelection,
  SpanSelection,
} from "@/core/state";

const D = (y: number, m: number, d: number) => calendarDate(y, m, d);

function config(
  unit: SelectionUnit,
  mode: SelectionMode,
  over: Partial<CalendarConfig> = {},
): CalendarConfig {
  return {
    unit,
    mode,
    firstDayOfWeek: 1,
    readOnly: false,
    withTime: false,
    defaultTime: MIDNIGHT,
    excludedEndpointPolicy: "snap-inward",
    disabled: compileDateRules(),
    exclude: compileDateRules(),
    ...over,
  };
}

const point = (...dates: ReturnType<typeof D>[]): PointSelection => ({
  shape: "point",
  dates: dates.map((date) => ({ date, time: MIDNIGHT })),
});

const span = (
  ranges: [ReturnType<typeof D>, ReturnType<typeof D>][],
  draftAnchor?: ReturnType<typeof D>,
): SpanSelection => ({
  shape: "span",
  ranges: ranges.map(([start, end]) => ({ start, end })),
  draftAnchor,
});

/** True when every bit in `mask` is set on `flags`. */
const has = (flags: number, mask: number) => (flags & mask) === mask;

describe("buildDayLookup", () => {
  it("collapses point dates into a key set", () => {
    const lookup = buildDayLookup(point(D(2026, 6, 5), D(2026, 6, 9)));
    expect(lookup.shape).toBe("point");
    if (lookup.shape !== "point") throw new Error("expected point");
    expect(lookup.pointKeys.has(20260605)).toBe(true);
    expect(lookup.pointKeys.has(20260609)).toBe(true);
    expect(lookup.pointKeys.has(20260606)).toBe(false);
    expect(lookup.pointKeys.size).toBe(2);
  });

  it("passes span ranges through untouched", () => {
    const sel = span([[D(2026, 6, 5), D(2026, 6, 7)]]);
    const lookup = buildDayLookup(sel);
    expect(lookup.shape).toBe("span");
    if (lookup.shape !== "span") throw new Error("expected span");
    expect(lookup.ranges).toBe(sel.ranges); // no copy
  });
});

describe("dayFlags · point selection", () => {
  it("sets Selected on chosen days only", () => {
    const cfg = config("day", "multiple");
    const lookup = buildDayLookup(point(D(2026, 6, 5), D(2026, 6, 9)));
    expect(has(dayFlags(D(2026, 6, 5), lookup, cfg), DayFlag.Selected)).toBe(
      true,
    );
    expect(has(dayFlags(D(2026, 6, 6), lookup, cfg), DayFlag.Selected)).toBe(
      false,
    );
  });
});

describe("dayFlags · span ranges and edges", () => {
  it("marks start, middle, end without probing neighbour days", () => {
    const cfg = config("day", "range");
    const lookup = buildDayLookup(span([[D(2026, 6, 5), D(2026, 6, 7)]]));

    const startF = dayFlags(D(2026, 6, 5), lookup, cfg);
    expect(has(startF, DayFlag.InRange | DayFlag.RangeStart)).toBe(true);
    expect(has(startF, DayFlag.RangeEnd)).toBe(false);

    const midF = dayFlags(D(2026, 6, 6), lookup, cfg);
    expect(has(midF, DayFlag.InRange)).toBe(true);
    expect(has(midF, DayFlag.RangeStart | DayFlag.RangeEnd)).toBe(false);

    const endF = dayFlags(D(2026, 6, 7), lookup, cfg);
    expect(has(endF, DayFlag.InRange | DayFlag.RangeEnd)).toBe(true);
    expect(has(endF, DayFlag.RangeStart)).toBe(false);
  });

  it("a one-day span reads as both edges and Selected", () => {
    const cfg = config("day", "multi-range");
    const lookup = buildDayLookup(span([[D(2026, 6, 5), D(2026, 6, 5)]]));
    const f = dayFlags(D(2026, 6, 5), lookup, cfg);
    expect(
      has(
        f,
        DayFlag.InRange |
          DayFlag.RangeStart |
          DayFlag.RangeEnd |
          DayFlag.Selected,
      ),
    ).toBe(true);
  });

  it("keeps edges correct across multiple non-adjacent spans", () => {
    const cfg = config("day", "multi-range");
    const lookup = buildDayLookup(
      span([
        [D(2026, 6, 5), D(2026, 6, 7)],
        [D(2026, 6, 15), D(2026, 6, 18)],
      ]),
    );
    expect(has(dayFlags(D(2026, 6, 7), lookup, cfg), DayFlag.RangeEnd)).toBe(
      true,
    );
    expect(has(dayFlags(D(2026, 6, 15), lookup, cfg), DayFlag.RangeStart)).toBe(
      true,
    );
    expect(has(dayFlags(D(2026, 6, 10), lookup, cfg), DayFlag.InRange)).toBe(
      false,
    );
  });
});

describe("dayFlags · preview overlapping a committed range", () => {
  it("sets Preview bits independently of InRange (multi-range draft)", () => {
    const cfg = config("day", "multi-range");
    const sel = span([[D(2026, 6, 5), D(2026, 6, 7)]], D(2026, 6, 6));
    const lookup = buildDayLookup(sel);
    const preview = buildPreviewSegments(sel, cfg, D(2026, 6, 9));
    expect(preview).toEqual([{ start: D(2026, 6, 6), end: D(2026, 6, 9) }]);

    // Jun 6 is inside both the committed range AND the preview.
    const f = dayFlags(D(2026, 6, 6), lookup, cfg, preview);
    expect(has(f, DayFlag.InRange)).toBe(true);
    expect(has(f, DayFlag.Preview | DayFlag.PreviewStart)).toBe(true);

    const endF = dayFlags(D(2026, 6, 9), lookup, cfg, preview);
    expect(has(endF, DayFlag.Preview | DayFlag.PreviewEnd)).toBe(true);
    expect(has(endF, DayFlag.InRange)).toBe(false);
  });

  it("snaps the preview to whole weeks for week units", () => {
    const cfg = config("week", "range");
    const sel = span([], D(2026, 6, 5)); // Fri, week Jun 1-7 (Mon start)
    const preview = buildPreviewSegments(sel, cfg, D(2026, 6, 18)); // week Jun 15-21
    expect(preview).toEqual([{ start: D(2026, 6, 1), end: D(2026, 6, 21) }]);
  });

  it("splits the preview into segments when exclude is active", () => {
    const cfg = config("day", "range", {
      exclude: compileDateRules({ weekends: true }),
    });
    const sel = span([], D(2026, 6, 5)); // Fri anchor
    const preview = buildPreviewSegments(sel, cfg, D(2026, 6, 9)); // hover Tue
    // Sat/Sun (6,7) drop out -> [5..5], [8..9]
    expect(preview).toEqual([
      { start: D(2026, 6, 5), end: D(2026, 6, 5) },
      { start: D(2026, 6, 8), end: D(2026, 6, 9) },
    ]);

    const lookup = buildDayLookup(sel, cfg);
    // The excluded Saturday gets NO preview bit (hole, like the committed span).
    const sat = dayFlags(D(2026, 6, 6), lookup, cfg, preview);
    expect(has(sat, DayFlag.Preview)).toBe(false);
    expect(has(sat, DayFlag.Excluded)).toBe(true);
    // Segment edges land on survivors.
    expect(
      has(dayFlags(D(2026, 6, 5), lookup, cfg, preview), DayFlag.PreviewEnd),
    ).toBe(true);
    expect(
      has(dayFlags(D(2026, 6, 8), lookup, cfg, preview), DayFlag.PreviewStart),
    ).toBe(true);
  });

  it("returns no preview segments without an anchor or hover", () => {
    const cfg = config("day", "range");
    expect(
      buildPreviewSegments(span([], undefined), cfg, D(2026, 6, 5)),
    ).toEqual([]);
    expect(
      buildPreviewSegments(span([], D(2026, 6, 5)), cfg, undefined),
    ).toEqual([]);
    expect(
      buildPreviewSegments(point(D(2026, 6, 5)), cfg, D(2026, 6, 9)),
    ).toEqual([]);
  });
});

describe("dayFlags · disabled / excluded / weekend / today / out-of-month", () => {
  it("flags a disabled day", () => {
    const cfg = config("day", "single", {
      disabled: compileDateRules({ dates: [D(2026, 6, 5)] }),
    });
    const lookup = buildDayLookup(point());
    expect(has(dayFlags(D(2026, 6, 5), lookup, cfg), DayFlag.Disabled)).toBe(
      true,
    );
  });

  it("an excluded day drops out of the range (hole, not fill)", () => {
    const cfg = config("day", "range", {
      exclude: compileDateRules({ weekends: true }),
    });
    // Lookup is segmented by exclude, matching the emitted value.
    const lookup = buildDayLookup(span([[D(2026, 6, 5), D(2026, 6, 9)]]), cfg);
    // Jun 6 (Sat) is excluded -> NOT InRange, but still flagged Excluded.
    const sat = dayFlags(D(2026, 6, 6), lookup, cfg);
    expect(has(sat, DayFlag.Excluded)).toBe(true);
    expect(has(sat, DayFlag.InRange)).toBe(false);

    // The survivors form segments: Jun 5 becomes a segment end, Jun 8 a start.
    expect(has(dayFlags(D(2026, 6, 5), lookup, cfg), DayFlag.RangeEnd)).toBe(
      true,
    );
    expect(has(dayFlags(D(2026, 6, 8), lookup, cfg), DayFlag.RangeStart)).toBe(
      true,
    );
  });

  it("a disabled day inside a week unit drops out of the range (cut like exclude)", () => {
    const cfg = config("week", "single", {
      disabled: compileDateRules({ weekends: true }),
    });
    // Whole week Jun 1-7; Sat/Sun (6,7) are disabled -> segment is Mon..Fri.
    const lookup = buildDayLookup(span([[D(2026, 6, 1), D(2026, 6, 7)]]), cfg);
    const sat = dayFlags(D(2026, 6, 6), lookup, cfg);
    expect(has(sat, DayFlag.InRange)).toBe(false);
    expect(has(sat, DayFlag.Disabled)).toBe(true);
    // Business days stay in range; Fri becomes the segment end.
    expect(has(dayFlags(D(2026, 6, 5), lookup, cfg), DayFlag.RangeEnd)).toBe(
      true,
    );
    expect(has(dayFlags(D(2026, 6, 1), lookup, cfg), DayFlag.RangeStart)).toBe(
      true,
    );
  });

  it("flags weekends by weekday, today by identity, out-of-month by argument", () => {
    const cfg = config("day", "single");
    const lookup = buildDayLookup(point());
    expect(has(dayFlags(D(2026, 6, 6), lookup, cfg), DayFlag.Weekend)).toBe(
      true,
    ); // Sat
    expect(has(dayFlags(D(2026, 6, 8), lookup, cfg), DayFlag.Weekend)).toBe(
      false,
    ); // Mon
    expect(
      has(
        dayFlags(D(2026, 6, 8), lookup, cfg, undefined, D(2026, 6, 8)),
        DayFlag.Today,
      ),
    ).toBe(true);
    expect(
      has(
        dayFlags(D(2026, 6, 8), lookup, cfg, undefined, undefined, false),
        DayFlag.OutOfMonth,
      ),
    ).toBe(true);
  });
});
