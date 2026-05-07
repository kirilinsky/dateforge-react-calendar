import fc from "fast-check";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetWarnOnce } from "@/core/dev-warn";
import type { DisabledRule } from "@/types/calendar";
import { createDisabled } from "@/utils/create-disabled";

beforeEach(() => {
  __resetWarnOnce();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

const anyValue = fc.anything({
  withBigInt: false,
  withMap: false,
  withSet: false,
  withTypedArray: false,
  withDate: true,
});

describe("createDisabled — property-based / fuzz", () => {
  it("never throws on arbitrary object init", () => {
    fc.assert(
      fc.property(fc.object(), (init) => {
        expect(() => createDisabled(init as never)).not.toThrow();
      }),
      { numRuns: 500 },
    );
  });

  it("returns an empty config for non-object init (null/array/primitive)", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.array(fc.anything()),
          fc.string(),
          fc.integer(),
          fc.boolean(),
        ),
        (init) => {
          const out = createDisabled(init as never);
          expect(out.__type).toBe("disabled-config");
          expect(out.rules).toEqual([]);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("output is always a well-formed DisabledConfig", () => {
    fc.assert(
      fc.property(fc.object(), (init) => {
        const out = createDisabled(init as never);
        expect(out.__type).toBe("disabled-config");
        expect(Array.isArray(out.rules)).toBe(true);
      }),
      { numRuns: 300 },
    );
  });

  it("weekdays rule contains only integers 0..6", () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (weekdays) => {
        const out = createDisabled({ weekdays });
        const dowRule = out.rules.find(
          (r): r is Extract<DisabledRule, { dayOfWeek: number[] }> =>
            typeof r === "object" && r !== null && "dayOfWeek" in r,
        );
        if (!dowRule) return;
        for (const n of dowRule.dayOfWeek) {
          expect(Number.isInteger(n)).toBe(true);
          expect(n).toBeGreaterThanOrEqual(0);
          expect(n).toBeLessThanOrEqual(6);
        }
      }),
      { numRuns: 300 },
    );
  });

  it("dates rule contains only valid Date instances", () => {
    fc.assert(
      fc.property(fc.array(anyValue), (dates) => {
        const out = createDisabled({ dates: dates as Date[] });
        for (const r of out.rules) {
          if (r instanceof Date) expect(Number.isNaN(r.getTime())).toBe(false);
        }
      }),
      { numRuns: 300 },
    );
  });

  it("ranges are normalized: from <= to", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            from: fc.date({ noInvalidDate: true }),
            to: fc.date({ noInvalidDate: true }),
          }),
        ),
        (ranges) => {
          const out = createDisabled({ ranges });
          for (const r of out.rules) {
            if (
              typeof r === "object" &&
              r !== null &&
              "from" in r &&
              "to" in r
            ) {
              expect(r.from.getTime()).toBeLessThanOrEqual(r.to.getTime());
            }
          }
        },
      ),
      { numRuns: 300 },
    );
  });

  it("invalid dates in `dates`/`ranges`/`before`/`after` are dropped (no Invalid Date in output)", () => {
    fc.assert(
      fc.property(
        fc.record({
          before: fc.option(anyValue, { nil: undefined }),
          after: fc.option(anyValue, { nil: undefined }),
          dates: fc.option(fc.array(anyValue), { nil: undefined }),
          ranges: fc.option(
            fc.array(fc.record({ from: anyValue, to: anyValue })),
            { nil: undefined },
          ),
        }),
        (init) => {
          const out = createDisabled(init as never);
          for (const r of out.rules) {
            if (r instanceof Date) {
              expect(Number.isNaN(r.getTime())).toBe(false);
            } else if (typeof r === "object" && r !== null) {
              if ("from" in r && r.from instanceof Date)
                expect(Number.isNaN(r.from.getTime())).toBe(false);
              if ("to" in r && r.to instanceof Date)
                expect(Number.isNaN(r.to.getTime())).toBe(false);
              if ("before" in r && r.before instanceof Date)
                expect(Number.isNaN(r.before.getTime())).toBe(false);
              if ("after" in r && r.after instanceof Date)
                expect(Number.isNaN(r.after.getTime())).toBe(false);
            }
          }
        },
      ),
      { numRuns: 300 },
    );
  });

  it("idempotence: calling twice with the same init produces equivalent rules count", () => {
    fc.assert(
      fc.property(
        fc.record({
          all: fc.option(fc.boolean(), { nil: undefined }),
          weekends: fc.option(fc.boolean(), { nil: undefined }),
          weekdays: fc.option(fc.array(fc.integer({ min: 0, max: 6 })), {
            nil: undefined,
          }),
          before: fc.option(fc.date({ noInvalidDate: true }), {
            nil: undefined,
          }),
          after: fc.option(fc.date({ noInvalidDate: true }), {
            nil: undefined,
          }),
        }),
        (init) => {
          const a = createDisabled(init);
          const b = createDisabled(init);
          expect(a.rules.length).toBe(b.rules.length);
        },
      ),
      { numRuns: 200 },
    );
  });
});
