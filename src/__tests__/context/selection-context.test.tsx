import { act, renderHook } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import {
  useSelection,
  useSelectionActions,
  useSelectionHover,
  useSelectionValue,
} from "@/context/selection-context";
import { CalendarProvider } from "@/core/provider";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

const wrap =
  (
    props: Omit<React.ComponentProps<typeof CalendarProvider>, "children"> = {},
  ) =>
  ({ children }: { children: React.ReactNode }) =>
    React.createElement(CalendarProvider, { ...props, children });

// ─── useSelectionValue — initial state ───────────────────────────────────────

describe("useSelectionValue — initial state", () => {
  it("selectedDates empty by default", () => {
    const { result } = renderHook(() => useSelectionValue(), {
      wrapper: wrap(),
    });
    expect(result.current.selectedDates).toHaveLength(0);
  });

  it("rangeStart/rangeEnd null by default", () => {
    const { result } = renderHook(() => useSelectionValue(), {
      wrapper: wrap(),
    });
    expect(result.current.rangeStart).toBeNull();
    expect(result.current.rangeEnd).toBeNull();
  });

  it("controlled value sets initial selectedDates", () => {
    const date = d(2024, 6, 15);
    const { result } = renderHook(() => useSelectionValue(), {
      wrapper: wrap({ value: date }),
    });
    expect(result.current.selectedDates[0].getTime()).toBe(date.getTime());
  });

  it("controlled range sets rangeStart/rangeEnd", () => {
    const from = d(2024, 6, 1);
    const to = d(2024, 6, 30);
    const { result } = renderHook(() => useSelectionValue(), {
      wrapper: wrap({ mode: "range", value: { from, to } }),
    });
    expect(result.current.rangeStart?.getTime()).toBe(from.getTime());
    expect(result.current.rangeEnd?.getTime()).toBe(to.getTime());
  });
});

// ─── useSelectionActions — onChange fires ─────────────────────────────────────

describe("useSelectionActions — onChange fires on select", () => {
  it("onChangeDate → onChange called with selected Date", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useSelectionActions(), {
      wrapper: wrap({ onChange }),
    });
    act(() => result.current.onChangeDate(d(2024, 6, 15)));
    expect(onChange).toHaveBeenCalledWith(d(2024, 6, 15));
  });

  it("onChangeDate(null) → onChange called with null", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useSelectionActions(), {
      wrapper: wrap({ onChange, value: d(2024, 6, 15) }),
    });
    act(() => result.current.onChangeDate(null));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("readOnly=true → onChange not called", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useSelectionActions(), {
      wrapper: wrap({ onChange, readOnly: true }),
    });
    act(() => result.current.onChangeDate(d(2024, 6, 15)));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("onRangeSet → onChange called with {from, to}", () => {
    const onChange = vi.fn();
    const from = d(2024, 6, 1);
    const to = d(2024, 6, 30);
    const { result } = renderHook(() => useSelectionActions(), {
      wrapper: wrap({ mode: "range", onChange } as Parameters<typeof wrap>[0]),
    });
    act(() => result.current.onRangeSet(from, to));
    expect(onChange).toHaveBeenCalledWith({ from, to });
  });

  it("onRangeSet rejects ranges that violate range constraints", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useSelectionActions(), {
      wrapper: wrap({
        mode: "range",
        minRangeDays: 3,
        onChange,
      } as Parameters<typeof wrap>[0]),
    });
    act(() => result.current.onRangeSet(d(2024, 6, 1), d(2024, 6, 2)));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("onRangeBoundSet rejects ranges containing disabled dates", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useSelectionActions(), {
      wrapper: wrap({
        mode: "range",
        value: { from: d(2024, 6, 1), to: d(2024, 6, 2) },
        disabled: {
          __type: "disabled-config",
          rules: [d(2024, 6, 2)],
        },
        onChange,
      } as Parameters<typeof wrap>[0]),
    });
    act(() => result.current.onRangeBoundSet("to", d(2024, 6, 3)));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("onDatesSet → onChange called with Date[]", () => {
    const onChange = vi.fn();
    const dates = [d(2024, 1, 1), d(2024, 2, 1)];
    const { result } = renderHook(() => useSelectionActions(), {
      wrapper: wrap({ mode: "multiple", onChange } as Parameters<
        typeof wrap
      >[0]),
    });
    act(() => result.current.onDatesSet(dates));
    expect(onChange).toHaveBeenCalledWith(dates);
  });
});

// ─── useSelectionValue — uncontrolled mode ────────────────────────────────────

describe("useSelectionValue — uncontrolled mode", () => {
  it("onChangeDate updates selectedDates internally", () => {
    const date = d(2024, 6, 15);
    const { result } = renderHook(
      () => ({ val: useSelectionValue(), act: useSelectionActions() }),
      { wrapper: wrap() },
    );
    act(() => result.current.act.onChangeDate(date));
    expect(result.current.val.selectedDates[0].getTime()).toBe(date.getTime());
  });

  it("toggle: selecting same date deselects", () => {
    const date = d(2024, 6, 15);
    const { result } = renderHook(
      () => ({ val: useSelectionValue(), act: useSelectionActions() }),
      { wrapper: wrap() },
    );
    act(() => result.current.act.onChangeDate(date));
    act(() => result.current.act.onChangeDate(date));
    expect(result.current.val.selectedDates).toHaveLength(0);
  });
});

// ─── useSelectionHover ────────────────────────────────────────────────────────

describe("useSelectionHover", () => {
  it("hoverDate initially null", () => {
    const { result } = renderHook(() => useSelectionHover(), {
      wrapper: wrap(),
    });
    expect(result.current.hoverDate).toBeNull();
  });

  it("setHoverDate updates hoverDate", () => {
    const date = d(2024, 6, 10);
    const { result } = renderHook(
      () => ({ hover: useSelectionHover(), act: useSelectionActions() }),
      { wrapper: wrap() },
    );
    act(() => result.current.act.setHoverDate(date));
    expect(result.current.hover.hoverDate?.getTime()).toBe(date.getTime());
  });
});

// ─── useSelection — combined ─────────────────────────────────────────────────

describe("useSelection", () => {
  it("combines state + actions + hover", () => {
    const { result } = renderHook(() => useSelection(), { wrapper: wrap() });
    expect(result.current.selectedDates).toBeDefined();
    expect(typeof result.current.onChangeDate).toBe("function");
    expect(result.current.hoverDate).toBeNull();
  });
});
