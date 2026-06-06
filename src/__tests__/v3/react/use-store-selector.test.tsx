import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { calendarDate } from "@/core-v3/calendar-date";
import { MIDNIGHT } from "@/core-v3/calendar-time";
import { compileDateRules } from "@/core-v3/date-rule-engine";
import type { SelectionMode, SelectionUnit } from "@/core-v3/selection-types";
import { type CalendarConfig, createInitialState } from "@/core-v3/state";
import { createCalendarStore } from "@/react-v3/store";
import { useStoreSelector } from "@/react-v3/use-store-selector";

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

function makeStore(cfg = config("day", "single")) {
  return createCalendarStore(
    cfg,
    createInitialState(cfg, { view: D(2026, 6, 1) }),
  );
}

describe("useStoreSelector", () => {
  it("returns the selected slice and updates on change", () => {
    const store = makeStore();
    const { result } = renderHook(() =>
      useStoreSelector(store, (s) =>
        s.selection.shape === "point" ? s.selection.dates.length : 0,
      ),
    );

    expect(result.current).toBe(0);
    act(() => store.dispatch({ type: "selectDay", date: D(2026, 6, 5) }));
    expect(result.current).toBe(1);
  });

  it("does not re-render when the selected slice is unchanged", () => {
    const store = makeStore();
    const render = vi.fn();
    // Select only the view date; selecting a day must not wake this hook.
    renderHook(() => {
      render();
      return useStoreSelector(store, (s) => s.view.viewDate);
    });

    expect(render).toHaveBeenCalledTimes(1);
    act(() => store.dispatch({ type: "selectDay", date: D(2026, 6, 5) }));
    expect(render).toHaveBeenCalledTimes(1); // viewDate slice untouched
  });

  it("re-renders for the slice that did change", () => {
    const store = makeStore();
    const render = vi.fn();
    renderHook(() => {
      render();
      return useStoreSelector(store, (s) => s.view.viewDate);
    });

    expect(render).toHaveBeenCalledTimes(1);
    act(() => store.dispatch({ type: "navigateBy", step: "month", amount: 1 }));
    expect(render).toHaveBeenCalledTimes(2);
  });

  it("supports a custom equality for object slices", () => {
    const store = makeStore();
    const render = vi.fn();
    renderHook(() => {
      render();
      // Selector returns a fresh object each call; deep-ish equality bails out.
      return useStoreSelector(
        store,
        (s) => ({
          count: s.selection.shape === "point" ? s.selection.dates.length : 0,
        }),
        (a, b) => a.count === b.count,
      );
    });

    expect(render).toHaveBeenCalledTimes(1);
    // A hover changes state identity but not the selected count -> no re-render.
    act(() => store.dispatch({ type: "hover", date: D(2026, 6, 9) }));
    expect(render).toHaveBeenCalledTimes(1);
  });
});
