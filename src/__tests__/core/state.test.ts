import { describe, expect, it } from "vitest";
import { calendarDate } from "@/core/calendar-date";
import { MIDNIGHT } from "@/core/calendar-time";
import { compileDateRules } from "@/core/date-rule-engine";
import { NO_EFFECTS, noChange, result } from "@/core/effects";
import type { SelectionMode, SelectionUnit } from "@/core/selection-types";
import {
  type CalendarConfig,
  createInitialState,
  emptySelection,
  selectionShape,
} from "@/core/state";

function makeConfig(unit: SelectionUnit, mode: SelectionMode): CalendarConfig {
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
  };
}

describe("selectionShape — unit × mode matrix", () => {
  it("only day+single/multiple is point; everything else is span", () => {
    const cases: [SelectionUnit, SelectionMode, "point" | "span"][] = [
      ["day", "single", "point"],
      ["day", "multiple", "point"],
      ["day", "range", "span"],
      ["day", "multi-range", "span"],
      ["week", "single", "span"],
      ["week", "multiple", "span"],
      ["week", "range", "span"],
      ["month", "single", "span"],
      ["month", "range", "span"],
    ];
    for (const [unit, mode, shape] of cases) {
      expect(selectionShape(unit, mode)).toBe(shape);
    }
  });
});

describe("emptySelection", () => {
  it("makes an empty point or span container", () => {
    expect(emptySelection("point")).toEqual({ shape: "point", dates: [] });
    expect(emptySelection("span")).toEqual({ shape: "span", ranges: [] });
  });
});

describe("createInitialState", () => {
  it("seeds view and an empty selection matching the shape", () => {
    const s = createInitialState(makeConfig("day", "range"), {
      view: calendarDate(2026, 6, 1),
    });
    expect(s.view.viewDate).toEqual(calendarDate(2026, 6, 1));
    expect(s.selection.shape).toBe("span");
    expect(s.interaction).toEqual({});
    expect(s.validation.fields).toEqual({});
  });

  it("accepts a seeded selection (uncontrolled defaultValue)", () => {
    const seeded = emptySelection("point");
    const s = createInitialState(makeConfig("day", "single"), {
      view: calendarDate(2026, 6, 1),
      selection: seeded,
    });
    expect(s.selection).toBe(seeded);
  });
});

describe("ReduceResult helpers", () => {
  const state = createInitialState(makeConfig("day", "single"), {
    view: calendarDate(2026, 6, 1),
  });

  it("noChange returns shared empty effects", () => {
    expect(noChange(state).effects).toBe(NO_EFFECTS);
  });

  it("result defaults to no effects and carries given ones", () => {
    expect(result(state).effects).toBe(NO_EFFECTS);
    const r = result(state, [
      { type: "viewChanged", viewDate: state.view.viewDate },
    ]);
    expect(r.effects).toHaveLength(1);
  });

  it("NO_EFFECTS is frozen", () => {
    expect(Object.isFrozen(NO_EFFECTS)).toBe(true);
  });
});
