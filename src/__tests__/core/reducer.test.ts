import { describe, expect, it } from "vitest";
import { calendarDate, datesEqual } from "@/core/calendar-date";
import { MIDNIGHT } from "@/core/calendar-time";
import { compileDateRules } from "@/core/date-rule-engine";
import { reduce } from "@/core/reducer";
import type { SelectionMode, SelectionUnit } from "@/core/selection-types";
import { type CalendarConfig, createInitialState } from "@/core/state";

function config(
  unit: SelectionUnit = "day",
  mode: SelectionMode = "single",
  readOnly = false,
): CalendarConfig {
  return {
    unit,
    mode,
    firstDayOfWeek: 1,
    readOnly,
    withTime: false,
    defaultTime: MIDNIGHT,
    excludedEndpointPolicy: "snap-inward",
    disabled: compileDateRules(),
    exclude: compileDateRules(),
  };
}

const base = () =>
  createInitialState(config(), { view: calendarDate(2026, 6, 1) });

describe("navigation", () => {
  it("navigateTo moves the view and emits viewChanged", () => {
    const r = reduce(
      base(),
      { type: "navigateTo", date: calendarDate(2026, 7, 1) },
      config(),
    );
    expect(r.state.view.viewDate).toEqual(calendarDate(2026, 7, 1));
    expect(r.effects).toEqual([
      { type: "viewChanged", viewDate: calendarDate(2026, 7, 1) },
    ]);
  });

  it("navigateTo to the same date is a no-op (same ref, no effects)", () => {
    const s = base();
    const r = reduce(
      s,
      { type: "navigateTo", date: calendarDate(2026, 6, 1) },
      config(),
    );
    expect(r.state).toBe(s);
    expect(r.effects).toHaveLength(0);
  });

  it("navigateBy steps months and years", () => {
    const month = reduce(
      base(),
      { type: "navigateBy", step: "month", amount: 2 },
      config(),
    );
    expect(month.state.view.viewDate).toEqual(calendarDate(2026, 8, 1));
    const year = reduce(
      base(),
      { type: "navigateBy", step: "year", amount: -1 },
      config(),
    );
    expect(year.state.view.viewDate).toEqual(calendarDate(2025, 6, 1));
  });
});

describe("hover / focus (hot path)", () => {
  it("hover updates interaction with no effects", () => {
    const r = reduce(
      base(),
      { type: "hover", date: calendarDate(2026, 6, 5) },
      config(),
    );
    expect(r.state.interaction.hoverDate).toEqual(calendarDate(2026, 6, 5));
    expect(r.effects).toHaveLength(0);
  });

  it("hovering the same date returns the same state ref", () => {
    const s = reduce(
      base(),
      { type: "hover", date: calendarDate(2026, 6, 5) },
      config(),
    ).state;
    const r = reduce(
      s,
      { type: "hover", date: calendarDate(2026, 6, 5) },
      config(),
    );
    expect(r.state).toBe(s);
  });

  it("clearing hover with undefined works", () => {
    const s = reduce(
      base(),
      { type: "hover", date: calendarDate(2026, 6, 5) },
      config(),
    ).state;
    const r = reduce(s, { type: "hover" }, config());
    expect(r.state.interaction.hoverDate).toBeUndefined();
  });

  it("focus updates interaction without touching the view", () => {
    const r = reduce(
      base(),
      { type: "focus", date: calendarDate(2026, 6, 9) },
      config(),
    );
    expect(r.state.interaction.focusDate).toEqual(calendarDate(2026, 6, 9));
    expect(datesEqual(r.state.view.viewDate, calendarDate(2026, 6, 1))).toBe(
      true,
    );
  });
});

describe("structural sharing", () => {
  it("navigation does not clone the selection slice", () => {
    const s = base();
    const r = reduce(
      s,
      { type: "navigateTo", date: calendarDate(2026, 7, 1) },
      config(),
    );
    expect(r.state.selection).toBe(s.selection);
    expect(r.state.validation).toBe(s.validation);
  });

  it("hover does not clone the view slice", () => {
    const s = base();
    const r = reduce(
      s,
      { type: "hover", date: calendarDate(2026, 6, 5) },
      config(),
    );
    expect(r.state.view).toBe(s.view);
  });
});

describe("readOnly", () => {
  it("selection mutations no-op with a validationRejected effect", () => {
    const ro = config("day", "single", true);
    const s = createInitialState(ro, { view: calendarDate(2026, 6, 1) });
    const r = reduce(
      s,
      { type: "selectDay", date: calendarDate(2026, 6, 5) },
      ro,
    );
    expect(r.state).toBe(s);
    expect(r.effects).toEqual([
      {
        type: "validationRejected",
        result: { ok: false, reason: "read-only" },
      },
    ]);
  });

  it("navigation still works in readOnly", () => {
    const ro = config("day", "single", true);
    const s = createInitialState(ro, { view: calendarDate(2026, 6, 1) });
    const r = reduce(
      s,
      { type: "navigateTo", date: calendarDate(2026, 7, 1) },
      ro,
    );
    expect(r.state.view.viewDate).toEqual(calendarDate(2026, 7, 1));
  });
});

describe("selection routing", () => {
  it("selectDay routes to the active strategy (single commits)", () => {
    const r = reduce(
      base(),
      { type: "selectDay", date: calendarDate(2026, 6, 5) },
      config(),
    );
    expect(r.state.selection.shape).toBe("point");
    expect(r.effects[0]?.type).toBe("notify");
  });

  it("multi-range routes to the span collection strategy", () => {
    const cfg = config("day", "multi-range");
    const s = createInitialState(cfg, { view: calendarDate(2026, 6, 1) });
    const r = reduce(
      s,
      { type: "selectDay", date: calendarDate(2026, 6, 5) },
      cfg,
    );
    expect(r.state.selection.shape).toBe("span");
    expect(
      r.state.selection.shape === "span" && r.state.selection.draftAnchor,
    ).toEqual(calendarDate(2026, 6, 5));
    expect(r.effects).toHaveLength(0);
  });

  it("syncExternal swaps the selection without emitting notify", () => {
    const next = {
      shape: "point" as const,
      dates: [{ date: calendarDate(2026, 6, 9), time: MIDNIGHT }],
    };
    const r = reduce(
      base(),
      { type: "syncExternal", selection: next },
      config(),
    );
    expect(r.state.selection).toBe(next);
    expect(r.effects).toHaveLength(0); // host-driven: no echo
  });
});
