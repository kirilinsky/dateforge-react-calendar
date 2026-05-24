import fc from "fast-check";
import type { CalendarMode } from "@/types/calendar";

const IANA_ZONES = [
  "UTC",
  "America/New_York",
  "Europe/London",
  "Asia/Tokyo",
  "Australia/Sydney",
  "America/Los_Angeles",
  "Europe/Berlin",
  "Pacific/Auckland",
] as const;

const INVALID_ZONES = ["", "Garbage/Zone", "UTC+99", "notazone"] as const;

export const fcMode = fc.constantFrom<CalendarMode>(
  "single",
  "multiple",
  "range",
);

export const fcLocale = fc.constantFrom("en", "fr", "de", "ja", "es");

export const fcCols = fc.integer({ min: 1, max: 4 });

export const fcDate = fc.date({
  min: new Date(2020, 0, 1),
  max: new Date(2030, 11, 31),
  noInvalidDate: true,
});

/** Valid IANA zones + undefined — safe for "never throws" tests. */
export const fcValidTimeZone = fc.option(fc.constantFrom(...IANA_ZONES), {
  nil: undefined,
});

/** Mix of valid IANA, invalid strings, and undefined — for resilience tests. */
export const fcTimeZone = fc.option(
  fc.oneof(fc.constantFrom(...IANA_ZONES), fc.constantFrom(...INVALID_ZONES)),
  { nil: undefined },
);

export const fcMinMax = fc.option(
  fc.tuple(fcDate, fcDate).map(([a, b]) => ({
    min: a <= b ? a : b,
    max: a <= b ? b : a,
  })),
  { nil: undefined },
);

export const fcReadOnly = fc.boolean();

export const fcDisabledSpec = fc.option(
  fc.record({
    weekends: fc.option(fc.boolean(), { nil: undefined }),
    weekdays: fc.option(
      fc.array(fc.integer({ min: 0, max: 6 }), { maxLength: 7 }),
      { nil: undefined },
    ),
    before: fc.option(fcDate, { nil: undefined }),
    after: fc.option(fcDate, { nil: undefined }),
    dates: fc.option(fc.array(fcDate, { maxLength: 5 }), { nil: undefined }),
  }),
  { nil: undefined },
);

export const fcRangeValue = fc.option(
  fc.record({
    from: fc.option(fcDate, { nil: null }),
    to: fc.option(fcDate, { nil: null }),
  }),
  { nil: undefined },
);

export const fcMultipleValue = fc.option(fc.array(fcDate, { maxLength: 5 }), {
  nil: undefined,
});

export const fcActionCount = fc.integer({ min: 1, max: 5 });
