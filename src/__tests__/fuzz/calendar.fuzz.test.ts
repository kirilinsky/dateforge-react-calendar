import { cleanup, fireEvent, render } from "@testing-library/react";
import fc from "fast-check";
import { axe, toHaveNoViolations } from "jest-axe";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { useNavigation } from "@/context/navigation-context";
import { useSelectionValue } from "@/context/selection-context";
import { CalendarDays } from "@/modules/days";
import { createDisabled } from "@/utils/create-disabled";
import {
  fcActionCount,
  fcCols,
  fcDate,
  fcDisabledSpec,
  fcLocale,
  fcMinMax,
  fcMode,
  fcMultipleValue,
  fcRangeValue,
  fcReadOnly,
  fcTimeZone,
  fcValidTimeZone,
} from "./arbitraries";

expect.extend(toHaveNoViolations);

const numRuns = Number(process.env.FUZZ_RUNS ?? 200);
const TIMEOUT = { timeout: 60_000 };

// ─── Probe ────────────────────────────────────────────────────────────────────

type Captured = {
  viewDate?: Date;
  rangeStart?: Date | null;
  rangeEnd?: Date | null;
};

let probe: Captured = {};

function Probe() {
  const { viewDate } = useNavigation();
  const { rangeStart, rangeEnd } = useSelectionValue();
  probe.viewDate = viewDate;
  probe.rangeStart = rangeStart;
  probe.rangeEnd = rangeEnd;
  return null;
}

afterEach(() => {
  cleanup();
  probe = {};
});

// ─── Render invariant — single mode ──────────────────────────────────────────

describe("Calendar render — single mode — never throws", () => {
  it(
    "arbitrary value + locale + min/max + readOnly + disabled + cols",
    TIMEOUT,
    () => {
      fc.assert(
        fc.property(
          fcDate,
          fcLocale,
          fcMinMax,
          fcReadOnly,
          fcDisabledSpec,
          fcCols,
          (value, locale, minMax, readOnly, disabledSpec, cols) => {
            const disabled = disabledSpec
              ? createDisabled(disabledSpec)
              : undefined;
            const { unmount } = render(
              React.createElement(
                Calendar,
                {
                  value,
                  onChange: () => {},
                  locale,
                  cols,
                  minDate: minMax?.min,
                  maxDate: minMax?.max,
                  readOnly,
                  disabled,
                },
                React.createElement(Probe, null),
                React.createElement(CalendarDays, null),
              ),
            );
            unmount();
          },
        ),
        { numRuns },
      );
    },
  );
});

// ─── Render invariant — range mode ───────────────────────────────────────────

describe("Calendar render — range mode — never throws", () => {
  it("arbitrary range value + min/max", TIMEOUT, () => {
    fc.assert(
      fc.property(fcRangeValue, fcMinMax, (rangeValue, minMax) => {
        const value = rangeValue ?? { from: null, to: null };
        const { unmount } = render(
          React.createElement(
            Calendar,
            {
              value: value as never,
              onChange: () => {},
              locale: "en",
              mode: "range",
              minDate: minMax?.min,
              maxDate: minMax?.max,
            },
            React.createElement(Probe, null),
            React.createElement(CalendarDays, null),
          ),
        );
        unmount();
      }),
      { numRuns },
    );
  });
});

// ─── Render invariant — multiple mode ────────────────────────────────────────

describe("Calendar render — multiple mode — never throws", () => {
  it("arbitrary dates array + timeZone", TIMEOUT, () => {
    fc.assert(
      fc.property(fcMultipleValue, fcValidTimeZone, (multiValue, timeZone) => {
        const value = multiValue ?? [];
        const { unmount } = render(
          React.createElement(
            Calendar,
            {
              value: value as never,
              onChange: () => {},
              locale: "en",
              mode: "multiple",
              timeZone: timeZone as string | undefined,
            },
            React.createElement(Probe, null),
            React.createElement(CalendarDays, null),
          ),
        );
        unmount();
      }),
      { numRuns },
    );
  });
});

// ─── Range invariant: rangeStart ≤ rangeEnd ──────────────────────────────────

describe("Calendar range invariant", () => {
  it("rangeStart ≤ rangeEnd after render when both non-null", TIMEOUT, () => {
    fc.assert(
      fc.property(
        fc.record({
          from: fcDate,
          to: fcDate,
        }),
        ({ from, to }) => {
          const sorted = from <= to ? { from, to } : { from: to, to: from };
          probe = {};
          const { unmount } = render(
            React.createElement(
              Calendar,
              {
                value: sorted as never,
                onChange: () => {},
                locale: "en",
                mode: "range",
              },
              React.createElement(Probe, null),
              React.createElement(CalendarDays, null),
            ),
          );
          const { rangeStart, rangeEnd } = probe;
          unmount();
          if (rangeStart != null && rangeEnd != null) {
            expect(rangeStart.getTime()).toBeLessThanOrEqual(
              rangeEnd.getTime(),
            );
          }
        },
      ),
      { numRuns },
    );
  });
});

// ─── Min/max invariant: viewDate within [min, max] ───────────────────────────

describe("Calendar min/max invariant", () => {
  it(
    "viewDate is within [min, max] when value is within range",
    TIMEOUT,
    () => {
      // Generate value within [min, max] via chain so the Calendar has no reason
      // to navigate outside the allowed window.
      const fcProps = fc.tuple(fcDate, fcDate).chain(([a, b]) => {
        const min = a <= b ? a : b;
        const max = a <= b ? b : a;
        return fc
          .date({ min, max, noInvalidDate: true })
          .map((value) => ({ min, max, value }));
      });

      fc.assert(
        fc.property(fcProps, ({ min, max, value }) => {
          probe = {};
          const { unmount } = render(
            React.createElement(
              Calendar,
              {
                value,
                onChange: () => {},
                locale: "en",
                minDate: min,
                maxDate: max,
              },
              React.createElement(Probe, null),
              React.createElement(CalendarDays, null),
            ),
          );
          const { viewDate } = probe;
          unmount();
          if (!viewDate) return;
          const toMonthTs = (d: Date) =>
            new Date(d.getFullYear(), d.getMonth(), 1).getTime();
          expect(toMonthTs(viewDate)).toBeGreaterThanOrEqual(toMonthTs(min));
          expect(toMonthTs(viewDate)).toBeLessThanOrEqual(toMonthTs(max));
        }),
        { numRuns },
      );
    },
  );
});

// ─── onChange bounded: no infinite trigger on initial render ─────────────────

describe("Calendar onChange call count", () => {
  it(
    "onChange is not called during initial render (no infinite loop)",
    TIMEOUT,
    () => {
      fc.assert(
        fc.property(fcDate, fcReadOnly, (value, readOnly) => {
          let callCount = 0;
          const { unmount } = render(
            React.createElement(
              Calendar,
              {
                value,
                onChange: () => {
                  callCount++;
                },
                locale: "en",
                readOnly,
              },
              React.createElement(CalendarDays, null),
            ),
          );
          unmount();
          expect(callCount).toBe(0);
        }),
        { numRuns },
      );
    },
  );
});

// ─── Action chain: click random day buttons, invariants hold ─────────────────

describe("Calendar action chain", () => {
  it(
    "random day clicks do not crash or violate range invariant",
    TIMEOUT,
    () => {
      fc.assert(
        fc.property(
          fc.record({
            from: fcDate,
            to: fcDate,
          }),
          fcActionCount.chain((n) =>
            fc.array(fc.integer({ min: 0, max: 99 }), {
              minLength: 1,
              maxLength: n,
            }),
          ),
          ({ from, to }, clickIndices) => {
            const sorted = from <= to ? { from, to } : { from: to, to: from };
            probe = {};
            const { container, unmount } = render(
              React.createElement(
                Calendar,
                {
                  value: sorted as never,
                  onChange: () => {},
                  locale: "en",
                  mode: "range",
                },
                React.createElement(Probe, null),
                React.createElement(CalendarDays, null),
              ),
            );

            const buttons = Array.from(
              container.querySelectorAll<HTMLButtonElement>(
                "button:not([disabled])",
              ),
            );
            for (const idx of clickIndices) {
              const btn = buttons[idx % buttons.length];
              if (btn) fireEvent.click(btn);
            }

            const { rangeStart, rangeEnd } = probe;
            unmount();

            if (rangeStart != null && rangeEnd != null) {
              expect(rangeStart.getTime()).toBeLessThanOrEqual(
                rangeEnd.getTime(),
              );
            }
          },
        ),
        { numRuns },
      );
    },
  );
});

// ─── Render invariant — arbitrary mode ───────────────────────────────────────

describe("Calendar render — arbitrary mode — never throws", () => {
  it("any mode + locale renders without crash", TIMEOUT, () => {
    fc.assert(
      fc.property(fcMode, fcDate, fcLocale, (mode, value, locale) => {
        const { unmount } = render(
          React.createElement(
            Calendar,
            {
              value: value as never,
              onChange: () => {},
              locale,
              mode,
            },
            React.createElement(CalendarDays, null),
          ),
        );
        unmount();
      }),
      { numRuns },
    );
  });
});

// ─── Resilience — invalid timezone never throws ───────────────────────────────

describe("Calendar timezone resilience — never throws", () => {
  it("valid or invalid timeZone does not crash", TIMEOUT, () => {
    fc.assert(
      fc.property(fcDate, fcTimeZone, (value, timeZone) => {
        const { unmount } = render(
          React.createElement(
            Calendar,
            {
              value,
              onChange: () => {},
              locale: "en",
              timeZone: timeZone as string | undefined,
            },
            React.createElement(CalendarDays, null),
          ),
        );
        unmount();
      }),
      { numRuns },
    );
  });
});

// ─── Axe: a11y pass on final DOM ─────────────────────────────────────────────

describe("Calendar axe", () => {
  it(
    "passes axe for arbitrary single-mode props (reduced runs for speed)",
    TIMEOUT,
    async () => {
      const axeRuns = Math.min(numRuns, 30);
      await fc.assert(
        fc.asyncProperty(fcDate, fcMinMax, async (value, minMax) => {
          const { container, unmount } = render(
            React.createElement(
              Calendar,
              {
                value,
                onChange: () => {},
                locale: "en",
                minDate: minMax?.min,
                maxDate: minMax?.max,
              },
              React.createElement(CalendarDays, null),
            ),
          );
          const results = await axe(container);
          unmount();
          expect(results).toHaveNoViolations();
        }),
        { numRuns: axeRuns },
      );
    },
  );
});
