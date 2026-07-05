import { describe, expect, it } from "vitest";
import type { CalendarAction } from "@/core-v3/actions";
import {
  calendarDate,
  compareDate,
  isValidDate,
} from "@/core-v3/calendar-date";
import { calendarTime } from "@/core-v3/calendar-time";
import { compileDateRules } from "@/core-v3/date-rule-engine";
import { reduce } from "@/core-v3/reducer";
import type { CalendarState } from "@/core-v3/state";
import { createInitialState } from "@/core-v3/state";
import { buildConfig, D } from "../v3/fixtures/builders";

/**
 * Property fuzz over the v3 reducer: hammer random action sequences through
 * every unit×mode strategy and assert the structural invariants that every
 * commit must preserve. Seeded LCG → failures reproduce from the logged seed.
 * Runs: FUZZ_RUNS (default 200 sequences × 60 actions).
 */

const RUNS = Number(process.env.FUZZ_RUNS ?? 200);

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const MODES = ["single", "multiple", "range", "multi-range"] as const;
const UNITS = ["day", "week", "month"] as const;

function randomAction(rnd: () => number): CalendarAction {
  const date = calendarDate(
    2024 + Math.floor(rnd() * 4),
    1 + Math.floor(rnd() * 12),
    1 + Math.floor(rnd() * 28),
  );
  const roll = rnd();
  if (roll < 0.45) return { type: "selectDay", date };
  if (roll < 0.55) return { type: "hover", date };
  if (roll < 0.62) return { type: "navigateTo", date };
  if (roll < 0.7) {
    return {
      type: "setTime",
      time: calendarTime(Math.floor(rnd() * 24), Math.floor(rnd() * 60), 0, 0),
      bound: rnd() < 0.5 ? "from" : "to",
    };
  }
  if (roll < 0.78)
    return { type: "setBoundDate", date, bound: rnd() < 0.5 ? "from" : "to" };
  if (roll < 0.85) return { type: "removeDate", date };
  if (roll < 0.92) return { type: "removeRange", index: Math.floor(rnd() * 3) };
  return { type: "clear" };
}

function assertInvariants(state: CalendarState, seed: number, step: number) {
  const ctx = `seed=${seed} step=${step}`;
  const sel = state.selection;
  expect(isValidDate(state.view.viewDate), `viewDate valid (${ctx})`).toBe(
    true,
  );
  if (sel.shape === "point") {
    for (const dt of sel.dates) {
      expect(isValidDate(dt.date), `point date valid (${ctx})`).toBe(true);
    }
  } else {
    for (let i = 0; i < sel.ranges.length; i++) {
      const r = sel.ranges[i];
      expect(isValidDate(r.start), `range start valid (${ctx})`).toBe(true);
      expect(isValidDate(r.end), `range end valid (${ctx})`).toBe(true);
      expect(compareDate(r.start, r.end) <= 0, `start ≤ end (${ctx})`).toBe(
        true,
      );
      if (i > 0) {
        // Canonical: sorted, non-overlapping, non-adjacent (mergeRanges).
        expect(
          compareDate(sel.ranges[i - 1].end, r.start) < 0,
          `ranges ordered/disjoint (${ctx})`,
        ).toBe(true);
      }
    }
  }
}

describe("v3 reducer fuzz", () => {
  for (const mode of MODES) {
    for (const unit of UNITS) {
      if (unit !== "day" && mode === "multiple") continue; // not a v3 combo
      it(`${unit} × ${mode}: random sequences keep invariants`, () => {
        const config = buildConfig({
          mode,
          unit,
          maxDates: 5,
          maxRanges: 3,
          disabled: compileDateRules({ weekdays: [3] }),
          // spread-safe: only override `exclude` when we actually set one
          ...(mode === "range"
            ? { exclude: compileDateRules({ weekends: true }) }
            : undefined),
        });
        const runs = Math.max(
          10,
          Math.floor(RUNS / (MODES.length * UNITS.length)),
        );
        for (let run = 0; run < runs; run++) {
          const seed = run * 7919 + 17;
          const rnd = lcg(seed);
          let state = createInitialState(config, { view: D(2026, 6, 1) });
          for (let step = 0; step < 60; step++) {
            const action = randomAction(rnd);
            const result = reduce(state, action, config); // must never throw
            state = result.state;
            assertInvariants(state, seed, step);
          }
        }
      });
    }
  }
});
