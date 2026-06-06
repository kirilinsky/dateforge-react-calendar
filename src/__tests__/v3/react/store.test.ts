import { describe, expect, it, vi } from "vitest";
import { calendarDate } from "@/core-v3/calendar-date";
import { MIDNIGHT } from "@/core-v3/calendar-time";
import { compileDateRules } from "@/core-v3/date-rule-engine";
import type { CalendarEffect } from "@/core-v3/effects";
import type { SelectionMode, SelectionUnit } from "@/core-v3/selection-types";
import {
  type CalendarConfig,
  type CalendarState,
  createInitialState,
} from "@/core-v3/state";
import { createCalendarStore } from "@/react-v3/store";

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

function setup(cfg: CalendarConfig) {
  const effects: CalendarEffect[] = [];
  const store = createCalendarStore(
    cfg,
    createInitialState(cfg, { view: D(2026, 6, 1) }),
    (effect) => effects.push(effect),
  );
  return { store, effects };
}

describe("createCalendarStore", () => {
  it("commits a selection and notifies subscribers", () => {
    const cfg = config("day", "single");
    const { store } = setup(cfg);
    const listener = vi.fn();
    store.subscribe(listener);

    store.dispatch({ type: "selectDay", date: D(2026, 6, 5) });

    expect(listener).toHaveBeenCalledTimes(1);
    const sel = store.getState().selection;
    expect(sel.shape === "point" && sel.dates).toHaveLength(1);
  });

  it("keeps a stable state reference and stays quiet on a no-op", () => {
    const cfg = config("day", "range");
    const { store } = setup(cfg);
    const listener = vi.fn();
    store.subscribe(listener);

    const before = store.getState();
    // Hover with no target set is a no-op (same hoverDate === undefined).
    store.dispatch({ type: "hover", date: undefined });

    expect(listener).not.toHaveBeenCalled();
    expect(store.getState()).toBe(before);
  });

  it("emits effects even when state is unchanged (rejected action)", () => {
    const cfg = config("day", "single", { readOnly: true });
    const { store, effects } = setup(cfg);
    const listener = vi.fn();
    store.subscribe(listener);

    const before = store.getState();
    store.dispatch({ type: "selectDay", date: D(2026, 6, 5) });

    expect(store.getState()).toBe(before); // unchanged
    expect(listener).not.toHaveBeenCalled(); // no notify
    expect(effects).toHaveLength(1);
    expect(effects[0].type).toBe("validationRejected");
  });

  it("routes a notify effect on commit", () => {
    const cfg = config("day", "single");
    const { store, effects } = setup(cfg);
    store.dispatch({ type: "selectDay", date: D(2026, 6, 5) });
    expect(effects.some((e) => e.type === "notify")).toBe(true);
  });

  it("stops calling a listener after unsubscribe", () => {
    const cfg = config("day", "single");
    const { store } = setup(cfg);
    const listener = vi.fn();
    const off = store.subscribe(listener);

    store.dispatch({ type: "selectDay", date: D(2026, 6, 5) });
    off();
    store.dispatch({ type: "selectDay", date: D(2026, 6, 9) });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("exposes the static config", () => {
    const cfg = config("week", "range");
    const { store } = setup(cfg);
    expect(store.getConfig()).toBe(cfg);
  });

  it("never mutates state across an unrelated effect-only dispatch", () => {
    const cfg = config("day", "single", { readOnly: true });
    const { store } = setup(cfg);
    const s1: CalendarState = store.getState();
    store.dispatch({ type: "selectDay", date: D(2026, 6, 5) });
    expect(store.getState()).toBe(s1);
  });
});
