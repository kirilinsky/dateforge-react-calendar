import { bench, describe } from "vitest";
import { calendarDate } from "@/core/calendar-date";
import { compileDateRules } from "@/core/date-rule-engine";
import { buildDayLookup, dayFlags } from "@/core/day-flags";
import { buildMonthGrid } from "@/core/month-grid";
import { reduce } from "@/core/reducer";
import { createInitialState } from "@/core/state";
import { buildConfig, D } from "../fixtures/builders";

/**
 * CodSpeed benchmarks over the v3 hot paths: the reducer commit cycle, the
 * per-cell `dayFlags` bitmask (42 cells × every hover), and month-grid
 * generation. Regression gates, not absolute numbers.
 */

const config = buildConfig({ mode: "single" });
const rangeConfig = buildConfig({
  mode: "range",
  disabled: compileDateRules({ weekends: true }),
});

describe("core", () => {
  bench("reduce: 60 selectDay commits (single)", () => {
    let state = createInitialState(config, { view: D(2026, 6, 1) });
    for (let i = 0; i < 60; i++) {
      state = reduce(
        state,
        {
          type: "selectDay",
          date: calendarDate(2026, (i % 12) + 1, (i % 27) + 1),
        },
        config,
      ).state;
    }
  });

  bench("reduce: range draw with hover previews", () => {
    let state = createInitialState(rangeConfig, { view: D(2026, 6, 1) });
    state = reduce(
      state,
      { type: "selectDay", date: D(2026, 6, 3) },
      rangeConfig,
    ).state;
    for (let day = 4; day <= 28; day++) {
      state = reduce(
        state,
        { type: "hover", date: D(2026, 6, day) },
        rangeConfig,
      ).state;
    }
    reduce(state, { type: "selectDay", date: D(2026, 6, 28) }, rangeConfig);
  });

  bench("dayFlags: full 42-cell grid pass", () => {
    const state = createInitialState(rangeConfig, { view: D(2026, 6, 1) });
    const lookup = buildDayLookup(state.selection, rangeConfig);
    const grid = buildMonthGrid({
      year: 2026,
      month: 6,
      firstDayOfWeek: rangeConfig.firstDayOfWeek,
    });
    for (const week of grid.weeks) {
      for (const cell of week) {
        dayFlags(cell.date, lookup, rangeConfig, undefined, D(2026, 6, 15));
      }
    }
  });

  bench("buildMonthGrid: 12 months", () => {
    for (let m = 1; m <= 12; m++) {
      buildMonthGrid({ year: 2026, month: m, firstDayOfWeek: 1 });
    }
  });
});
